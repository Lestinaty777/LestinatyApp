import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart3, Clock3, Flame, Sparkles, Trophy, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AnilloProgreso, Boton, HojaDeslizante, RecuadroGlass, Texto } from '../../../diseno';
import { MasterChanger } from '../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerDetalleHabito, registrarProgresoHabito } from '../habitos.servicio';
import { ARBUSTO_SELVA_BASE, buscarIconoHabito, factorTono, obtenerAssetsSelvaPorTono } from '../iconosHabitos';
import type { DetalleHabito } from '../tipos';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';

type Celebracion = { gemasGanadas: number; nivel: number };

const BIOMA_TITULO = 'Selva viva';

const C={fondo:'#F3EEFA',texto:'#1A1335',tenue:'#7B7494',glass:'rgba(255,255,255,.72)',borde:'rgba(255,255,255,.85)'};

// Detalle de un hábito, presentado como hoja deslizante sobre HabitosPantalla
// (no reemplaza la pantalla): ícono real del hábito, diorama del bioma elegido
// al crearlo, anillo de progreso animado del día y celebración al subir de nivel.
export function DetalleHabitoPantalla({id}:{id:string}){
 const router=useRouter(),cliente=useQueryClient();
 const insets=useSafeAreaInsets();
 const [celebracion,setCelebracion]=useState<Celebracion|null>(null);
 const consulta=useQuery({queryKey:['habitos','detalle',id],queryFn:()=>obtenerDetalleHabito(id)});
 const mutacion=useMutation({
  mutationFn:registrarProgresoHabito,
  onSuccess:(resultado)=>{
   cliente.invalidateQueries({queryKey:['habitos','panel']});
   cliente.invalidateQueries({queryKey:['habitos','detalle',id]});
   if(resultado.subioNivel){
    hapticSeguro('confirmacion');
    setCelebracion({gemasGanadas:resultado.gemasGanadas,nivel:resultado.nivel});
    if(resultado.gemasGanadas>0) cliente.invalidateQueries({queryKey:CLAVE_SALDO_GEMAS});
   } else { hapticSeguro('accion'); }
  },
 });
 const cerrar=()=>router.back();

 useEffect(()=>{
  if(celebracion===null) return;
  const temporizador=setTimeout(()=>setCelebracion(null),2800);
  return ()=>clearTimeout(temporizador);
 },[celebracion]);

 return <HojaDeslizante onCerrar={cerrar}>
  {consulta.isLoading && <View style={[s.centro,{minHeight:320}]}><Texto>Cargando hábito…</Texto></View>}
  {(consulta.isError||(!consulta.isLoading&&!consulta.data)) && <View style={[s.centro,{minHeight:320}]}><Texto style={s.error}>No pudimos abrir este hábito.</Texto><Boton onPress={()=>consulta.refetch()} style={s.reintentar} variante="sendero">Reintentar</Boton></View>}
  {!consulta.isLoading && consulta.data && (
   <Contenido
    cerrar={cerrar}
    d={consulta.data}
    guardando={mutacion.isPending}
    onRegistrar={(valor)=>mutacion.mutate({habitoId:id,fechaLocal:new Date().toISOString().slice(0,10),valor})}
    onVerSendero={()=>router.push({pathname:'/senderos',params:{habitoId:id}})}
    paddingInferior={insets.bottom+28}
   />
  )}
  {celebracion!==null && <CelebracionNivel color={consulta.data?.habito.color??C.texto} gemasGanadas={celebracion.gemasGanadas} nivel={celebracion.nivel} onCerrar={()=>setCelebracion(null)} />}
 </HojaDeslizante>;
}

function IconoHabitoVisual({id,color,size}:{id?:string|null;color:string;size:number}){
 const icono=buscarIconoHabito(id);
 return icono ? <Image source={icono.fuente} style={{height:size,resizeMode:'contain',width:size}}/> : <Sparkles color={color} size={size}/>;
}

function Contenido({cerrar,d,guardando,onRegistrar,onVerSendero,paddingInferior}:{cerrar:()=>void;d:DetalleHabito;guardando:boolean;onRegistrar:(valor:number)=>void;onVerSendero:()=>void;paddingInferior:number}){
 const h=d.habito;
 const p=Math.min(100,Math.round(h.valorHoy*100/h.meta));
 const siguiente=h.tipoMeta==='check'?(h.completado?0:1):Math.min(h.meta,h.valorHoy+1);
 const assetsSelva=obtenerAssetsSelvaPorTono(d.nivel);

 return <ScrollView contentContainerStyle={[s.contenido,{paddingBottom:paddingInferior}]} showsVerticalScrollIndicator={false}>
  <View style={s.header}>
   <View style={s.headerIzq}>
    <View style={[s.iconoHeader,{backgroundColor:`${h.color}20`}]}><IconoHabitoVisual color={h.color} id={h.iconoLucide} size={26}/></View>
    <View style={{flex:1}}>
     <Texto style={s.nombre}>{h.titulo}</Texto>
     <View style={[s.nivelPill,{backgroundColor:`${h.color}18`}]}><Texto style={[s.nivelPillTexto,{color:h.color}]}>Nivel {d.nivel}</Texto></View>
    </View>
   </View>
   <Pressable accessibilityLabel="Cerrar" hitSlop={12} onPress={cerrar} style={s.cerrar}><X color={C.tenue} size={20}/></Pressable>
  </View>
  <Texto style={s.frase}>{h.descripcion??'Una pequeña acción para un gran cambio.'}</Texto>

  <Pressable accessibilityLabel="Ver tu sendero" onPress={onVerSendero} style={[s.diorama,{backgroundColor:`${h.color}14`}]}>
   <Image resizeMode="contain" source={assetsSelva.arbolPrincipal} style={s.diorArbol}/>
   <View style={s.diorArbusto}><MasterChanger alto={70} ancho={80} colorDestino={2} fuente={ARBUSTO_SELVA_BASE} oscurecido={factorTono(d.nivel)}/></View>
   <Texto style={[s.diorEtiqueta,{color:h.color}]}>{BIOMA_TITULO}</Texto>
   <Texto style={[s.diorSendero,{color:h.color}]}>Ver mi sendero →</Texto>
  </Pressable>

  <RecuadroGlass style={s.semana}>
   <Texto style={s.semanaLabel}>Esta semana</Texto>
   <View style={s.semanaFila}><Texto style={s.semanaValor}>{d.semana.completados}/{d.semana.programados||7}</Texto><Texto style={[s.semanaPorcentaje,{color:h.color}]}>{d.semana.porcentaje}%</Texto></View>
   <Barra color={h.color} porcentaje={d.semana.porcentaje}/>
  </RecuadroGlass>

  <RecuadroGlass style={s.principal}>
   <AnilloProgreso color={h.color} porcentaje={p} tamano={112}>
    <Texto style={s.circuloValor}>{h.tipoMeta==='duracion'?`${h.valorHoy}m`:h.valorHoy}</Texto>
    <Texto style={s.circuloUnidad}>{h.unidad??'hecho'}</Texto>
   </AnilloProgreso>
   <View style={s.hoyInfo}>
    <Texto style={s.hoyEtiqueta}>☀️ Hoy</Texto>
    <Texto style={s.hoyMeta}>{h.tipoMeta==='check'?(h.completado?'Completado':'Pendiente'):`${h.valorHoy} de ${h.meta} ${h.unidad??''}`}</Texto>
    <Barra color={h.color} porcentaje={p}/>
    <Boton color={h.color} iconoIzquierda={Sparkles} onPress={()=>onRegistrar(siguiente)} style={s.accion} variante="sendero">{guardando?'Guardando…':h.tipoMeta==='check'?'Marcar como hecho':'Registrar progreso'}</Boton>
   </View>
  </RecuadroGlass>

  <View style={s.metricas}>
   <Metrica Icono={Flame} color="#F97316" etiqueta="Racha actual" valor={`${d.rachaActual} días`}/>
   <Metrica Icono={Clock3} color={h.color} etiqueta="Total" valor={`${d.totalAcumulado} ${h.unidad??''}`}/>
   <Metrica Icono={Trophy} color="#EAB308" etiqueta="Mejor día" valor={d.mejorDia??'—'}/>
  </View>

  <RecuadroGlass style={s.progreso}>
   <View style={s.progresoTitulo}><BarChart3 color={h.color} size={20}/><View><Texto style={s.progresoNombre}>Tu progreso</Texto><Texto style={s.progresoSub}>Últimos 7 días</Texto></View></View>
   <View style={s.grafica}>{d.progresoSemana.map((x,indice)=><BarraDia color={h.color} etiqueta={x.etiqueta} key={x.fecha} progreso={x.progreso} retraso={indice*45}/>)}</View>
  </RecuadroGlass>

  <RecuadroGlass style={s.consejo}>
   <IconoHabitoVisual color={h.color} id={h.iconoLucide} size={24}/>
   <View style={s.consejoTexto}><Texto style={s.consejoTitulo}>Consejo de hoy</Texto><Texto style={s.consejoDesc}>{d.rachaActual?'La constancia se construye con una acción a la vez.':'Empieza pequeño: completar hoy ya cuenta.'}</Texto></View>
  </RecuadroGlass>
 </ScrollView>;
}

function BarraDia({color,etiqueta,progreso,retraso}:{color:string;etiqueta:string;progreso:number;retraso:number}){
 const altura=useSharedValue(0);
 useEffect(()=>{
  const temporizador=setTimeout(()=>{altura.value=withSpring(Math.max(5,progreso),{damping:14,mass:0.7,stiffness:120});},retraso);
  return ()=>clearTimeout(temporizador);
 },[altura,progreso,retraso]);
 const estilo=useAnimatedStyle(()=>({height:`${altura.value}%`}));
 return <View style={s.barraDia}><View style={s.barraArea}><Animated.View style={[s.barraDiaRelleno,{backgroundColor:color},estilo]}/></View><Texto style={s.dia}>{etiqueta}</Texto></View>;
}

function CelebracionNivel({color,gemasGanadas,nivel,onCerrar}:{color:string;gemasGanadas:number;nivel:number;onCerrar:()=>void}){
 return <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(220)} style={s.celebracionFondo}>
  <Pressable accessibilityLabel="Cerrar celebración" onPress={onCerrar} style={StyleSheet.absoluteFill}/>
  <Animated.View entering={FadeIn.duration(260).springify().damping(15)} style={[s.celebracionTarjeta,{borderColor:`${color}55`}]}>
   <Trophy color={color} size={38}/>
   <Texto style={s.celebracionTitulo}>¡Nivel {nivel}!</Texto>
   <Texto style={s.celebracionTexto}>Tu constancia subió la dificultad. Sigue así.</Texto>
   {gemasGanadas>0 && <View style={s.celebracionGemas}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.celebracionGemaIcono}/><Texto style={s.celebracionGemaTexto}>+{gemasGanadas} gemas</Texto></View>}
  </Animated.View>
 </Animated.View>;
}

function Barra({color,porcentaje}:{color:string;porcentaje:number}){return <View style={s.barraFondo}><View style={[s.barra,{backgroundColor:color,width:`${porcentaje}%`}]}/></View>;}
function Metrica({Icono,color,etiqueta,valor}:{Icono:typeof Flame;color:string;etiqueta:string;valor:string}){return <RecuadroGlass style={s.metrica}><Icono color={color} size={17}/><Texto style={s.metricaEtiqueta}>{etiqueta}</Texto><Texto style={s.metricaValor}>{valor}</Texto></RecuadroGlass>;}

const s=StyleSheet.create({
 centro:{alignItems:'center',justifyContent:'center',padding:24},
 contenido:{gap:12,paddingHorizontal:18,paddingTop:6},
 error:{color:'#DC2626',marginBottom:12,textAlign:'center'},
 reintentar:{maxWidth:180,width:'100%'},
 header:{alignItems:'flex-start',flexDirection:'row',justifyContent:'space-between'},
 headerIzq:{alignItems:'center',flex:1,flexDirection:'row',gap:10},
 iconoHeader:{alignItems:'center',borderRadius:16,height:48,justifyContent:'center',width:48},
 nombre:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:20},
 nivelPill:{alignSelf:'flex-start',borderRadius:99,marginTop:3,paddingHorizontal:8,paddingVertical:2},
 nivelPillTexto:{fontFamily:'Montserrat-Bold',fontSize:10},
 cerrar:{alignItems:'center',backgroundColor:C.glass,borderColor:C.borde,borderRadius:16,borderWidth:1,height:32,justifyContent:'center',width:32},
 frase:{color:C.tenue,fontSize:12,lineHeight:16},
 diorama:{alignItems:'center',borderRadius:22,flexDirection:'row',height:104,justifyContent:'center',overflow:'hidden',position:'relative'},
 diorArbol:{bottom:-6,height:100,left:-6,position:'absolute',width:90},
 diorArbusto:{bottom:-10,height:70,position:'absolute',right:-4,width:80},
 diorEtiqueta:{fontFamily:'Montserrat-Bold',fontSize:11,position:'absolute',right:12,top:10},
 diorSendero:{fontFamily:'Montserrat-Bold',fontSize:10,left:12,position:'absolute',top:10},
 semana:{backgroundColor:C.glass,borderColor:C.borde,borderRadius:16,borderWidth:1,padding:12},
 semanaLabel:{color:C.tenue,fontSize:11},
 semanaFila:{alignItems:'baseline',flexDirection:'row',gap:8},
 semanaValor:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:20},
 semanaPorcentaje:{fontFamily:'Montserrat-Bold',fontSize:12},
 barraFondo:{backgroundColor:'#E7E1F1',borderRadius:8,height:7,marginTop:7,overflow:'hidden'},
 barra:{borderRadius:8,height:'100%'},
 principal:{alignItems:'center',backgroundColor:C.glass,borderColor:C.borde,borderRadius:20,borderWidth:1,flexDirection:'row',gap:14,padding:14},
 circuloValor:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:22},
 circuloUnidad:{color:C.tenue,fontSize:10},
 hoyInfo:{flex:1},
 hoyEtiqueta:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:13},
 hoyMeta:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:14,marginTop:4},
 accion:{marginTop:13},
 metricas:{flexDirection:'row',gap:7},
 metrica:{alignItems:'center',backgroundColor:C.glass,borderColor:C.borde,borderRadius:14,borderWidth:1,flex:1,gap:2,padding:9},
 metricaEtiqueta:{color:C.tenue,fontSize:8,textAlign:'center'},
 metricaValor:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:11,textAlign:'center'},
 progreso:{backgroundColor:C.glass,borderColor:C.borde,borderRadius:18,borderWidth:1,padding:13},
 progresoTitulo:{alignItems:'center',flexDirection:'row',gap:7},
 progresoNombre:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:14},
 progresoSub:{color:C.tenue,fontSize:9},
 grafica:{alignItems:'flex-end',flexDirection:'row',gap:8,height:104,justifyContent:'space-between',marginTop:10},
 barraDia:{alignItems:'center',flex:1,gap:4,height:'100%'},
 barraArea:{height:84,justifyContent:'flex-end',width:'70%'},
 barraDiaRelleno:{borderRadius:5,width:'100%'},
 dia:{color:C.tenue,fontFamily:'Montserrat-Bold',fontSize:9},
 consejo:{alignItems:'center',backgroundColor:C.glass,borderColor:C.borde,borderRadius:17,borderWidth:1,flexDirection:'row',gap:10,padding:12},
 consejoTexto:{flex:1},
 consejoTitulo:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:12},
 consejoDesc:{color:C.tenue,fontSize:11,lineHeight:15,marginTop:2},
 celebracionFondo:{alignItems:'center',backgroundColor:'rgba(15,10,30,0.4)',bottom:0,justifyContent:'center',left:0,position:'absolute',right:0,top:0},
 celebracionTarjeta:{alignItems:'center',backgroundColor:'#FFFFFF',borderRadius:24,borderWidth:2,gap:6,maxWidth:260,paddingHorizontal:26,paddingVertical:24},
 celebracionTitulo:{color:C.texto,fontFamily:'Montserrat-Bold',fontSize:22},
 celebracionTexto:{color:C.tenue,fontSize:12,lineHeight:16,textAlign:'center'},
 celebracionGemas:{alignItems:'center',backgroundColor:'#F3EEFA',borderRadius:99,flexDirection:'row',gap:5,marginTop:12,paddingHorizontal:12,paddingVertical:6},
 celebracionGemaIcono:{height:16,resizeMode:'contain',width:16},
 celebracionGemaTexto:{color:'#6D28D9',fontFamily:'Montserrat-Bold',fontSize:13},
});
