import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Check, EllipsisVertical, Play, Sparkles } from 'lucide-react-native';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { Boton, entradaEncadenada, MasterAnimation, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, Skeleton, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { crearHabito, obtenerDetallesHabitosHoy, obtenerHabitoMasCercaDeNivel, obtenerHabitoMejorRacha, obtenerPanelHabitos, obtenerResumenPlanesHabitos, registrarProgresoHabito, type HabitoHoyDetalle } from '../habitos.servicio';
import { haVistoPistaSwipeSendero, marcarPistaSwipeSenderoVista } from '../pistaSwipeSendero';
import { CrearHabitoWizard } from '../componentes/CrearHabitoWizard';
import { DetalleHabitoPantalla } from './DetalleHabitoPantalla';
import { ListaRecordatoriosHabitos } from '../componentes/ListaRecordatoriosHabitos';
import { TarjetaSenderoHabito } from '../componentes/TarjetaSenderoHabito';
import { buscarIconoHabito, obtenerAssetsSelvaPorTono } from '../iconosHabitos';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { rutaParaHorizon } from '../../../nucleo/compras/horizonAcceso';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import { HabitoResumen, MejorRachaHabito } from '../tipos';
import { sincronizarWidgetFoco } from '../widgets/widgetFoco.servicio';

const DIAS_SEMANA_COMPLETA = [1, 2, 3, 4, 5, 6, 7];
const ESCALA_TARJETA_HOY = 0.6;
const ANCHO_TARJETA_HABITO = 310;
// 390 coincide con el minHeight decorativo de TarjetaSenderoHabito, pero su
// contenido real (icono + título + anillo + métricas + semana + CTA) mide
// ~440px — con 390 el carrusel recortaba el botón "Comenzar" por completo.
const ALTO_TARJETA_HABITO = 490;
const MARGEN_SUPERIOR_TARJETA_HABITO = 12;

type VistaPanel = 'hoy' | 'progresion' | 'recordatorios';
const TITULOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'Hoy', progresion: 'Mis Hábitos', recordatorios: 'Recordatorios' };
const ICONOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'sol', progresion: 'progreso', recordatorios: 'reloj' };
const HISTORIAL_VACIO: boolean[] = Array(28).fill(false);
const TONOS_RACHA = ['#78BB80', '#6CB476', '#61AC6C', '#56A462', '#4B9C58', '#41944E', '#378C45'];

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', verde: '#22C55E', morado: '#7C3AED', barra: '#E7E1F1', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const ACCESOS = [
  { id: 'progresion', etiqueta: 'Mis Habitos', descripcion: 'Tu avance y progreso', nombreIcono: 'progreso' },
  { id: 'creacion', etiqueta: 'Creación', descripcion: 'Arma un nuevo habito', nombreIcono: 'idea' },
  { id: 'recordatorios', etiqueta: 'Recordatorios', descripcion: 'Que no se te olvide', nombreIcono: 'reloj' },
  { id: 'insights', etiqueta: 'Insights', descripcion: 'Patrones y riesgo', nombreIcono: 'estadistica' },
] as const;

export function HabitosPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const horizon = useHorizon();
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [detalleHabitoId, setDetalleHabitoId] = useState<string | null>(null);
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  const [registrandoId, setRegistrandoId] = useState<string | null>(null);
  const [mostrarPistaSwipe, setMostrarPistaSwipe] = useState(false);
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const consultaCercania = useQuery({ queryKey: ['habitos', 'cercania-nivel'], queryFn: () => obtenerHabitoMasCercaDeNivel() });
  const consultaMejorRacha = useQuery({ queryKey: ['habitos', 'mejor-racha'], queryFn: () => obtenerHabitoMejorRacha() });
  const consultaPlanes = useQuery({ queryKey: ['habitos', 'planes-resumen'], queryFn: () => obtenerResumenPlanesHabitos(), enabled: vistaPanel === 'recordatorios' });
  const consultaDetallesHoy = useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy(), enabled: vistaPanel === 'progresion' });
  const crear = useMutation({ mutationFn: crearHabito });
  const registrar = useMutation({ mutationFn: registrarProgresoHabito });
  const habitos = consulta.data?.hoy.datos ?? [];
  const completados = habitos.filter((habito) => habito.completado).length;
  const porcentaje = habitos.length ? Math.round(completados * 100 / habitos.length) : 0;
  const detallesPorHabito = new Map((consultaDetallesHoy.data ?? []).map((detalle) => [detalle.habitoId, detalle]));

  useEffect(() => {
    let activo = true;
    haVistoPistaSwipeSendero().then((visto) => { if (activo && !visto) setMostrarPistaSwipe(true); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (consulta.data?.hoy.datos && horizon.data === 'activo') {
      sincronizarWidgetFoco(consulta.data.hoy.datos);
    }
  }, [consulta.data?.hoy.datos, horizon.data]);

  function marcarSwipeDescubierto() {
    setMostrarPistaSwipe(false);
    marcarPistaSwipeSenderoVista();
  }

  function alternarVista(vista: VistaPanel) {
    setVistaPanel((actual) => (actual === vista ? 'hoy' : vista));
  }

  async function registrarHabito(habito: HabitoResumen) {
    setRegistrandoId(habito.id);
    hapticSeguro('confirmacion');
    try {
      await registrar.mutateAsync({ fechaLocal: new Date().toISOString().slice(0, 10), habitoId: habito.id, valor: habito.meta });
      await Promise.all([
        cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] }),
      ]);
    } finally {
      setRegistrandoId(null);
    }
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'creacion') { setCrearAbierto(true); return; }
    if (id === 'progresion') { alternarVista('progresion'); return; }
    if (id === 'recordatorios') { alternarVista('recordatorios'); return; }
    router.push('/habitos/categoria/patrones');
  }

  function abrirHorizon() {
    if (horizon.isLoading) return;
    hapticSeguro('seleccion');
    router.push(rutaParaHorizon(horizon.data ?? 'noDisponible'));
  }

  return <LinearGradient colors={['#F7FDF7', '#E8F7E9', '#CDEFCF']} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
    <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
      <AuroraBoreal tema="verde" />
      <View style={s.headerInicio}>
        <View style={s.headerTitulo}>
          <Animated.View entering={entradaEncadenada(0)} style={s.headerIzq}>
            <Texto style={s.headerSaludo}>Hola,</Texto>
            <View style={s.nombreFila}>
              <Texto style={s.headerNombre}>Alejandro</Texto>
              <Image source={require('../../../../assets/icons/hoy/saludo.png')} style={s.saludoIcono} />
            </View>
          </Animated.View>
        </View>
        <View style={s.headerDer}>
          <Animated.View entering={entradaEncadenada(1)}><Rebote accessibilityLabel="Comprar gemas" onPress={() => router.push('/tienda/gemas')} estilo={s.statPill}><View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View></Rebote></Animated.View>
          <Animated.View entering={entradaEncadenada(2)}>
            <Rebote accessibilityLabel="Notificaciones" onPress={() => Linking.openSettings()}>
              <MasterGlass style={s.notificacion}>
                <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} />
              </MasterGlass>
            </Rebote>
          </Animated.View>
        </View>
      </View>
      <View style={s.heroInicio}>
        <View style={s.heroColIzq}>
          <Animated.View entering={entradaEncadenada(3)}>
            <RachaCard datos={consultaMejorRacha.data} isLoading={consultaMejorRacha.isLoading} onPress={(id) => setDetalleHabitoId(id)} />
          </Animated.View>
          <Animated.View entering={entradaEncadenada(4)}>
            <MasterGlass style={s.nivelCard}>
              {consulta.isLoading ? <><Skeleton alto={26} ancho={26} radio={8} /><View style={{ flex: 1, gap: 6 }}><Skeleton alto={11} ancho="60%" /><Skeleton alto={6} radio={3} /></View></> : <>
                <MasterIcon color={2} name="trofeo" size={26} />
                <View style={s.nivelInfo}><View style={s.nivelTexto}><Texto style={s.nivelLabel}>Hábitos hoy</Texto><Texto style={s.nivelXP}>{completados}/{habitos.length}</Texto></View><Progreso porcentaje={porcentaje} /></View>
              </>}
            </MasterGlass>
          </Animated.View>
        </View>
        <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image source={require('../../../../assets/ilustraciones/hoy/fondos/habitos.png')} style={s.ilustracionHabitos} resizeMode="cover" /></View></View>
      </View>

      <View style={s.accesosFila}>
        {ACCESOS.map((acceso, indice) => {
          return (
            <Animated.View entering={entradaEncadenada(5 + indice)} key={acceso.id} style={s.accesoTarjeta}>
              <Rebote accessibilityLabel={acceso.etiqueta} onPress={() => abrirAcceso(acceso.id)}>
                <MasterGlass style={s.accesoGlass}>
                  <MasterIcon color={2} name={acceso.nombreIcono} size={32} />
                  <View style={s.accesoTexto}>
                    <Texto numberOfLines={1} style={s.accesoEtiqueta}>{acceso.etiqueta}</Texto>
                    <Texto numberOfLines={2} style={s.accesoDescripcion}>{acceso.descripcion}</Texto>
                  </View>
                </MasterGlass>
              </Rebote>
            </Animated.View>
          );
        })}
      </View>
      {consultaCercania.data && (() => {
        const habito = consultaCercania.data;
        const proximidad = habito.porcentaje;
        return (
          <Animated.View entering={entradaEncadenada(9)}>
            <Rebote accessibilityLabel={`${habito.titulo}, a punto de subir de nivel`} estilo={s.cercaniaTarjeta} onPress={() => setDetalleHabitoId(habito.id)}>
              <MasterGlass style={s.cercaniaGlass}>
                <View style={s.cercaniaIcono}><IconoHabitoVisual color={C.verde} id={habito.iconoLucide} size={22} /></View>
                <View style={{ flex: 1 }}>
                  <Texto style={s.cercaniaLabel}>A punto de subir de nivel</Texto>
                  <Texto style={s.cercaniaTitulo}>{habito.titulo} · Nivel {habito.nivel} → {habito.nivel + 1}</Texto>
                  <Progreso porcentaje={proximidad} />
                </View>
                <Texto style={s.cercaniaPorcentaje}>{proximidad}%</Texto>
              </MasterGlass>
            </Rebote>
          </Animated.View>
        );
      })()}
    </View>
    <Animated.View entering={entradaEncadenada(10)}>
      <MasterGlass style={s.panel}>
        {/* key cambia al alternar vista/hábito premium, así cada bloque hace fade
            en vez de reemplazarse de golpe (crossfade barato vía remount). */}
        <Animated.View entering={FadeIn.duration(420)} exiting={FadeOut.duration(260)} key={vistaPanel}>
        {vistaPanel === 'hoy' ? (
          <EncabezadoHoy completados={completados} porcentaje={porcentaje} total={habitos.length} />
        ) : (
          <View style={s.tituloFila}><View style={s.tituloConIcono}><MasterIcon color={2} name={ICONOS_VISTA_PANEL[vistaPanel]} size={22} /><Texto style={s.titulo}>{TITULOS_VISTA_PANEL[vistaPanel]}</Texto></View></View>
        )}
        {vistaPanel === 'hoy' && <>
          {consulta.isLoading && <EsqueletoTimelineHoy />}
          {consulta.isError && <Pressable onPress={() => consulta.refetch()}><Texto style={s.error}>No pudimos cargar los datos. Toca para reintentar.</Texto>{__DEV__ && <Texto style={s.errorDetalle}>{consulta.error instanceof Error ? consulta.error.message : String(consulta.error)}</Texto>}</Pressable>}
          {!consulta.isLoading && !consulta.isError && <TimelineHabitosHoy habitos={habitos} mostrarPistaSwipe={mostrarPistaSwipe} onDetalle={(id) => setDetalleHabitoId(id)} onSendero={(habito) => router.push({ pathname: '/senderos', params: { habitoId: habito.id } })} onSwipeDescubierto={marcarSwipeDescubierto} />}
        </>}
        {vistaPanel === 'progresion' && (
          consultaDetallesHoy.isLoading ? <CarruselEsqueleto /> : (
            <CuadriculaHabitos
              detallesPorHabito={detallesPorHabito}
              habitos={habitos}
              onDetalle={(id) => setDetalleHabitoId(id)}
              onRegistrar={(habito) => registrarHabito(habito)}
              registrandoId={registrandoId}
            />
          )
        )}
        {vistaPanel === 'recordatorios' && (
          <ListaRecordatoriosHabitos
            isError={consultaPlanes.isError}
            isLoading={consultaPlanes.isLoading}
            onReintentar={() => consultaPlanes.refetch()}
            onSeleccionar={(id) => setDetalleHabitoId(id)}
            planes={consultaPlanes.data ?? []}
          />
        )}
        </Animated.View>
      </MasterGlass>
    </Animated.View>
    <Animated.View entering={entradaEncadenada(11)} style={s.horizonAcceso}>
      <Pressable accessibilityLabel="Explorar widgets de pantalla de inicio" disabled={horizon.isLoading} onPress={abrirHorizon} style={({ pressed }) => [pressed && s.horizonAccesoPresionado, horizon.isLoading && s.horizonAccesoDeshabilitado]}>
        <MasterGlass style={s.horizonGlass}>
          <View style={s.horizonIcono}><MasterIcon color={2} name="montana" size={27} /></View>
          <View style={s.horizonTexto}><Texto style={s.horizonTitulo}>Widgets de Inicio</Texto><Texto style={s.horizonDescripcion}>{horizon.isLoading ? 'Comprobando suscripción…' : 'Lleva tus hábitos a tu pantalla de inicio'}</Texto></View>
          <ChevronRight color="#3B9858" size={21} />
        </MasterGlass>
      </Pressable>
    </Animated.View>
    <CrearHabitoWizard guardando={crear.isPending} onCerrar={() => setCrearAbierto(false)} onCrear={async (input) => {
      const resultado = await crear.mutateAsync(input);
      await Promise.all([
        cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] }),
        cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] }),
      ]);
      return resultado;
    }} visible={crearAbierto} />
  </ScrollView>
  {/* Fuera del ScrollView a propósito: HojaDeslizante se posiciona absoluto
      contra su padre — dentro del ScrollView quedaría atado al alto del
      contenido desplazable en vez de cubrir la pantalla real. */}
  {detalleHabitoId && <DetalleHabitoPantalla id={detalleHabitoId} onCerrar={() => setDetalleHabitoId(null)} />}
  </LinearGradient>;
}

function Progreso({ porcentaje }: { porcentaje: number }) { return <MasterProgressbar altura={10} porcentaje={porcentaje} style={s.barraMaster} />; }
// Solo es "premium" (Rebote) cuando ya hay una racha real a la que navegar —
// mientras carga o si no existe ninguna, es una tarjeta informativa quieta.
function RachaCard({ datos, isLoading, onPress }: { datos: MejorRachaHabito | null | undefined; isLoading: boolean; onPress: (id: string) => void }) {
  const contenido = isLoading ? <>
    <View style={s.rachaTop}><Skeleton alto={30} ancho={30} radio={10} /><View style={{ flex: 1, gap: 5 }}><Skeleton alto={11} ancho="70%" /><Skeleton alto={9} ancho="45%" /></View></View>
    <Skeleton alto={9} radio={2} />
  </> : <>
    <View style={s.rachaTop}>
      {datos ? <View style={s.rachaIconoFondo}><IconoHabitoVisual color={C.verde} id={datos.iconoLucide} size={22} /></View> : <MasterIcon color={2} name="rayo" size={22} />}
      <View style={{ flex: 1 }}><Texto numberOfLines={1} style={s.rachaTitulo}>{datos ? datos.titulo : 'Sin racha activa'}</Texto><Texto style={s.rachaLabel}>Mejor racha</Texto></View>
      {datos && <Texto style={s.rachaDias}>{datos.racha}d</Texto>}
    </View>
    <HistorialRacha historial={datos?.historial28 ?? HISTORIAL_VACIO} />
  </>;
  if (!datos) return <MasterGlass style={s.rachaCard}>{contenido}</MasterGlass>;
  return <Rebote accessibilityLabel={`Ver ${datos.titulo}`} onPress={() => onPress(datos.id)}><MasterGlass style={s.rachaCard}>{contenido}</MasterGlass></Rebote>;
}
// Últimos 28 días (7x4), sin etiquetas de día — solo cumplido/no cumplido, como los cuadros de contribuciones de GitHub.
function HistorialRacha({ historial }: { historial: boolean[] }) { return <View style={[s.historialGrid, { gap: 4 }]}>{Array.from({ length: 4 }).map((_, fila) => <View key={fila} style={[s.historialFila, { gap: 4 }]}>{historial.slice(fila * 7, fila * 7 + 7).map((cumplido, columna) => <View key={columna} style={[s.historialCuadro, { borderRadius: 4, borderWidth: 1, height: 10 }, cumplido ? [s.historialCuadroLleno, { backgroundColor: TONOS_RACHA[columna], borderColor: 'rgba(255,255,255,0.72)' }] : [s.historialCuadroVacio, { backgroundColor: '#DCEFE0', borderColor: 'rgba(255,255,255,0.82)' }]]} />)}</View>)}</View>; }
function IconoHabitoVisual({ id, color, size }: { id?: string | null; color: string; size: number }) { const icono = buscarIconoHabito(id); return icono ? <Image source={icono.fuente} style={{ height: size, resizeMode: 'contain', width: size }} /> : <Sparkles color={color} size={size} />; }
function TarjetaHabito({ detalle, habito, onDetalle, onRegistrar, registrando }: { detalle: HabitoHoyDetalle | undefined; habito: HabitoResumen; onDetalle: () => void; onRegistrar: () => void; registrando: boolean }) {
  const icono = buscarIconoHabito(habito.iconoLucide);
  const assets = obtenerAssetsSelvaPorTono(detalle?.nivel ?? 1);
  const metaEtiqueta = `${habito.meta} ${habito.tipoMeta === 'duracion' ? 'min' : habito.unidad || 'veces'}`;
  const ctaTexto = habito.completado ? 'Completado — ver sendero' : 'Comenzar';
  return <Pressable onPress={onDetalle} style={s.tarjetaHabito}>
    <View style={s.tarjetaHabitoContenido}>
      <TarjetaSenderoHabito
        assets={assets}
        cargando={registrando}
        ctaTexto={ctaTexto}
      diasCompletados={detalle?.diasCompletadosSemana ?? []}
      diasProgramados={detalle?.diasProgramados ?? DIAS_SEMANA_COMPLETA}
      escalaArbol={0.7}
      icono={icono ?? { fuente: require('../../../../assets/icons/ui/idea.png') }}
        meta={habito.meta}
        metaEtiqueta={metaEtiqueta}
        nivel={detalle?.nivel ?? 1}
        onPressCta={onRegistrar}
        racha={detalle?.racha ?? 0}
        titulo={habito.titulo}
        valorHoy={habito.valorHoy}
      />
    </View>
  </Pressable>;
}
// Carrusel horizontal de "Mis Hábitos": la misma tarjeta rica (árbol, racha,
// nivel) que antes vivía en Hoy — cada una espera a que la anterior termine
// de entrar por completo (MasterAnimation encadena, no traslapa).
function CuadriculaHabitos({ detallesPorHabito, habitos, onDetalle, onRegistrar, registrandoId }: { detallesPorHabito: Map<string, HabitoHoyDetalle>; habitos: HabitoResumen[]; onDetalle: (id: string) => void; onRegistrar: (habito: HabitoResumen) => void; registrandoId: string | null }) {
  if (habitos.length === 0) return <EstadoVacio texto="Aún no has creado hábitos. Comienza con una pequeña acción." />;
  return (
    <ScrollView contentContainerStyle={s.carruselHabitosContenido} horizontal showsHorizontalScrollIndicator={false} style={s.carruselHabitos}>
      <MasterAnimation duracion={340}>
        {habitos.map((habito) => (
          <TarjetaHabito detalle={detallesPorHabito.get(habito.id)} habito={habito} key={habito.id} onDetalle={() => onDetalle(habito.id)} onRegistrar={() => onRegistrar(habito)} registrando={registrandoId === habito.id} />
        ))}
      </MasterAnimation>
    </ScrollView>
  );
}
function EstadoVacio({ texto }: { texto: string }) { return <View style={s.vacio}><Image source={require('../../../../assets/icons/hoy/habitos.png')} style={[s.iconoVacio, { tintColor: C.verde }]} /><Texto style={s.vacioTitulo}>Aún no hay hábitos</Texto><Texto style={s.vacioTexto}>{texto}</Texto></View>; }

// Encabezado del panel "Hoy": bandera verde (MasterIcon con color=2, el hue
// del PNG no importa porque MasterChanger lo rota) + contador + barra de
// progreso real + tagline. El "⋮" es solo decorativo por ahora (no navega a
// nada), a propósito no es un Pressable para no fingir que hace algo.
function EncabezadoHoy({ completados, porcentaje, total }: { completados: number; porcentaje: number; total: number }) {
  return (
    <View style={s.encabezadoHoy}>
      <View style={s.encabezadoHoyFila}>
        <MasterIconBg size={70}><MasterIcon color={2} name="bandera" size={50} /></MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto style={s.encabezadoHoyTitulo}>Hoy</Texto>
          <Texto style={s.encabezadoHoyCompletadas}>{completados}/{total} completadas</Texto>
          <View style={s.encabezadoHoyProgresoFila}>
            <MasterProgressbar altura={10} porcentaje={porcentaje} style={s.encabezadoHoyBarra} />
            <Texto style={s.encabezadoHoyPorcentaje}>{porcentaje}%</Texto>
          </View>
        </View>
        <View style={s.encabezadoHoyMenu}><EllipsisVertical color="#4A7F5D" size={18} /></View>
      </View>
    </View>
  );
}

// Checklist de "Hoy": una fila por hábito con su ícono real (MasterIconBg, no
// lucide) y un nodo de línea de tiempo — completado/activo/pendiente. El
// chevron manda al sendero del hábito; el resto de la fila abre su detalle.
const UMBRAL_SWIPE_FRACCION = 0.7;
const MARGEN_SWIPE = 90; // ancho aprox. del ícono flotante + el chevron + paddings, restado del ancho de la fila
const FRACCIONES_PARTICULAS_SWIPE = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92];

// Partícula fija en un punto del camino del swipe: se enciende (fade + scale)
// en cuanto el relleno la alcanza — pura función de translateX, sin animación
// propia que compita con el gesto. El "baile" vertical también depende de
// translateX (no del reloj), así se ve viva mientras arrastras pero no gasta
// nada en reposo — no queda ningún bucle corriendo para siempre.
function ParticulaSwipe({ distanciaMeta, fraccion, indice, translateX }: { distanciaMeta: number; fraccion: number; indice: number; translateX: SharedValue<number> }) {
  const tamano = 4 + (indice % 3) * 2;
  const estilo = useAnimatedStyle(() => {
    const meta = distanciaMeta * fraccion;
    const distancia = translateX.value - meta;
    const opacidad = distancia > 0 ? Math.min(1, distancia / 22) : 0;
    const baile = Math.sin(translateX.value * 0.08 + indice * 1.7) * 5 * opacidad;
    return {
      left: meta,
      opacity: opacidad,
      transform: [{ translateY: baile }, { scale: 0.4 + opacidad * 0.8 }],
    };
  });
  return <Animated.View pointerEvents="none" style={[s.filaHoyParticula, { borderRadius: tamano / 2, height: tamano, width: tamano }, estilo]} />;
}

function FilaHabitoHoy({ esActivo, esUltimo, habito, mostrarPista, onDetalle, onSendero, onSwipeDescubierto }: { esActivo: boolean; esUltimo: boolean; habito: HabitoResumen; mostrarPista: boolean; onDetalle: () => void; onSendero: () => void; onSwipeDescubierto: () => void }) {
  const icono = buscarIconoHabito(habito.iconoLucide);
  const metaEtiqueta = `${habito.meta} ${habito.tipoMeta === 'duracion' ? 'min' : habito.unidad || 'veces'}`;
  const [anchoFila, setAnchoFila] = useState(0);
  const translateX = useSharedValue(0);
  const distanciaMeta = Math.max(60, anchoFila - MARGEN_SWIPE);

  // Pista descubrible: mientras nadie haya tocado "Continuar" en el banner de
  // arriba, el ícono se menea en bucle (no solo un par de veces) para que sea
  // imposible no notarlo — se detiene en cuanto se descubre/confirma.
  useEffect(() => {
    if (!mostrarPista || anchoFila === 0) return;
    const id = setTimeout(() => {
      translateX.value = withRepeat(
        withSequence(
          withTiming(18, { duration: 260, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
          withDelay(700, withTiming(0, { duration: 1 })),
        ),
        -1,
      );
    }, 700);
    return () => { clearTimeout(id); translateX.value = withTiming(0, { duration: 180 }); };
  }, [anchoFila, mostrarPista, translateX]);

  const gestoSwipe = Gesture.Pan()
    .onUpdate((evento) => {
      translateX.value = Math.max(0, Math.min(distanciaMeta, evento.translationX));
    })
    .onEnd(() => {
      if (translateX.value > distanciaMeta * UMBRAL_SWIPE_FRACCION) {
        // Pasado el umbral, el ícono se queda a la derecha — no regresa nunca.
        translateX.value = withTiming(distanciaMeta, { duration: 140 });
        runOnJS(hapticSeguro)('confirmacion');
        runOnJS(onSwipeDescubierto)();
        runOnJS(onSendero)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 220 });
      }
    });

  const estiloIconoAnimado = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  // El relleno ya cubre un poco desde el reposo (BASE_RELLENO ≈ el centro del
  // ícono flotante), así siempre se ve un poquito de verde detrás de él.
  const estiloRelleno = useAnimatedStyle(() => ({ width: Math.max(0, translateX.value + 30) }));
  // El texto se desvanece ANTES de que el relleno sólido llegue a taparlo —
  // así nunca se ve texto oscuro encima de verde oscuro.
  const estiloTexto = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, Math.max(0, (translateX.value - 8) / 55)) }));

  return (
    <View style={s.filaHoyContenedor}>
      <View style={s.nodoColumna}>
        <View style={[s.nodo, habito.completado ? s.nodoCompletado : esActivo ? s.nodoActivo : s.nodoPendiente]}>
          {habito.completado ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : esActivo ? <Play color="#FFFFFF" fill="#FFFFFF" size={10} /> : null}
        </View>
        {!esUltimo && <View style={s.nodoLinea} />}
      </View>
      <Pressable onLayout={(evento) => setAnchoFila(evento.nativeEvent.layout.width)} onPress={onDetalle} style={s.filaHoyTarjetaContenedor}>
        <MasterGlass style={s.filaHoyTarjeta}>
          <Animated.View pointerEvents="none" style={[s.filaHoyRelleno, estiloRelleno]} />
          {FRACCIONES_PARTICULAS_SWIPE.map((fraccion, indice) => (
            <ParticulaSwipe distanciaMeta={distanciaMeta} fraccion={fraccion} indice={indice} key={fraccion} translateX={translateX} />
          ))}
          <Animated.View style={[{ flex: 1 }, estiloTexto]}>
            <Texto numberOfLines={1} style={s.filaHoyTitulo}>{habito.titulo}</Texto>
            <Texto numberOfLines={1} style={s.filaHoySubtitulo}>{metaEtiqueta}</Texto>
          </Animated.View>
          <Rebote accessibilityLabel="Ir al sendero" hitSlop={8} onPress={onSendero}>
            <MasterGlass style={s.filaHoyChevron}><ChevronRight color="#145C37" size={16} /></MasterGlass>
          </Rebote>
        </MasterGlass>
        {/* El ícono flota FUERA del MasterGlass (que recorta su contenido) y es
            un poco más grande que la tarjeta — se asoma arriba y abajo, efecto premium.
            También es arrastrable: deslizarlo hasta el chevron manda al sendero. */}
        <GestureDetector gesture={gestoSwipe}>
          <Animated.View style={[s.filaHoyIconoFlotante, estiloIconoAnimado]}>
            <MasterIconBg fuente={icono?.fuente} size={48}>{!icono && <Sparkles color="#145C37" size={20} />}</MasterIconBg>
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </View>
  );
}
// Banner explicativo — se queda visible (repitiéndose en cada visita a "Hoy")
// hasta que el usuario toca "Entendido", no solo hasta que le atine al gesto
// por accidente. Esa confirmación explícita es lo que de verdad lo descarta.
function PistaSwipeBanner({ onContinuar }: { onContinuar: () => void }) {
  return (
    <MasterGlass style={s.pistaSwipeBanner}>
      <View style={s.pistaSwipeIcono}><ChevronRight color="#145C37" size={18} /></View>
      <View style={{ flex: 1 }}>
        <Texto style={s.pistaSwipeTitulo}>Truco rápido</Texto>
        <Texto style={s.pistaSwipeTexto}>Arrastra el ícono de un hábito hacia el chevron para ir directo a su sendero.</Texto>
      </View>
      <Rebote accessibilityLabel="Entendido" estilo={s.pistaSwipeBoton} onPress={onContinuar}><Texto style={s.pistaSwipeBotonTexto}>Entendido</Texto></Rebote>
    </MasterGlass>
  );
}
function TimelineHabitosHoy({ habitos, mostrarPistaSwipe, onDetalle, onSendero, onSwipeDescubierto }: { habitos: HabitoResumen[]; mostrarPistaSwipe: boolean; onDetalle: (id: string) => void; onSendero: (habito: HabitoResumen) => void; onSwipeDescubierto: () => void }) {
  if (habitos.length === 0) return <EstadoVacio texto="Aún no has creado hábitos. Comienza con una pequeña acción." />;
  const indiceActivo = habitos.findIndex((habito) => !habito.completado);
  return (
    <View>
      <MasterAnimation duracion={340}>
        {mostrarPistaSwipe && <PistaSwipeBanner onContinuar={onSwipeDescubierto} />}
        {habitos.map((habito, indice) => (
          <FilaHabitoHoy esActivo={indice === indiceActivo} esUltimo={indice === habitos.length - 1} habito={habito} key={habito.id} mostrarPista={mostrarPistaSwipe && indice === 0} onDetalle={() => onDetalle(habito.id)} onSendero={() => onSendero(habito)} onSwipeDescubierto={onSwipeDescubierto} />
        ))}
      </MasterAnimation>
    </View>
  );
}
function EsqueletoTimelineHoy() {
  return <View style={{ gap: 14 }}>{[0, 1, 2].map((indice) => (
    <View key={indice} style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
      <Skeleton alto={32} ancho={32} radio={16} />
      <View style={{ flex: 1 }}><Skeleton alto={46} radio={16} /></View>
    </View>
  ))}</View>;
}
// Conserva el mismo lienzo que la card real y le aplica la escala de Hoy, para
// evitar saltos de layout durante la carga.
function CarruselEsqueleto() {
  return <View style={s.carruselHabitos}><View style={s.carruselHabitosContenido}>{[0, 1].map((indice) => (
    <View key={indice} style={s.tarjetaHabito}>
      <View style={[s.tarjetaEsqueleto, s.tarjetaHabitoContenido]}>
        <Skeleton alto={68} ancho={68} radio={18} />
        <Skeleton alto={26} ancho="70%" style={{ marginTop: 14 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Skeleton alto={48} ancho={48} radio={24} /><Skeleton alto={30} ancho={90} radio={10} style={{ marginTop: 9 }} /></View>
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}><Skeleton alto={34} ancho={100} radio={14} /><Skeleton alto={34} ancho={100} radio={14} /></View>
        <Skeleton alto={90} radio={18} style={{ marginTop: 17 }} />
        <Skeleton alto={40} radio={99} style={{ marginTop: 16 }} />
      </View>
    </View>
  ))}</View></View>;
}

const s = StyleSheet.create({ raiz: { flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 }, volverGlass: { borderRadius: 18, marginRight: 5 }, chevronInicio: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 }, headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }, headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 }, nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 }, headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 }, saludoIcono: { height: 28, resizeMode: 'contain', width: 28 }, headerSaludo: { color: '#4B4B4B', fontFamily: 'MontserratAlternates-Medium', fontSize: 14, lineHeight: 17 }, headerFrase: { color: '#5A5A5A', fontFamily: 'Montserrat-Medium', fontSize: 8, lineHeight: 12, marginTop: 4 }, headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 }, statPill: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 }, statPillFila: { alignItems: 'center', flexDirection: 'row', gap: 4 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 }, statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 }, heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' }, heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 }, ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracionHabitos: { height: '100%', width: '100%' }, rachaCard: { borderRadius: 18, gap: 8, padding: 10 }, rachaTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 }, rachaIconoFondo: { alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 10, height: 30, justifyContent: 'center', width: 30 }, rachaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, lineHeight: 10 }, rachaTitulo: { color: '#1A1A1A', fontFamily: 'MontserratAlternates-Bold', fontSize: 11, lineHeight: 12 }, rachaDias: { color: C.verde, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, historialGrid: { gap: 3 }, historialFila: { flexDirection: 'row', gap: 3 }, historialCuadro: { borderRadius: 2, flex: 1, height: 9 }, historialCuadroLleno: { backgroundColor: C.verde }, historialCuadroVacio: { backgroundColor: '#E7E1F1' }, nivelCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 }, nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 11 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9 }, barraFondo: { backgroundColor: C.barra, borderRadius: 9, height: 6, marginTop: 7, overflow: 'hidden' }, barra: { borderRadius: 9, height: '100%' },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 },
  barraMaster: { marginTop: 2 },
  accesoTarjeta: { flex: 1 },
  accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 },
  accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' },
  accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 8, lineHeight: 10, marginTop: 1, textAlign: 'center' },
  horizonAcceso: { marginBottom: 16, marginHorizontal: 20 }, horizonAccesoPresionado: { opacity: 0.82, transform: [{ scale: 0.985 }] }, horizonAccesoDeshabilitado: { opacity: 0.62 }, horizonGlass: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 }, horizonIcono: { alignItems: 'center', backgroundColor: 'rgba(59,152,88,.13)', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 }, horizonTexto: { flex: 1 }, horizonTitulo: { color: '#245938', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, horizonDescripcion: { color: '#648170', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 2 },
  cercaniaTarjeta: { marginBottom: 16, marginHorizontal: 20 },
  cercaniaGlass: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 },
  cercaniaIcono: { alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  cercaniaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  cercaniaTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginTop: 2 },
  cercaniaPorcentaje: { color: C.verde, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 }, tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 }, titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 }, contador: { color: C.tenue, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', paddingVertical: 18, textAlign: 'center' }, errorDetalle: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 11, opacity: 0.7, paddingBottom: 10, textAlign: 'center' }, vacio: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 28 }, iconoVacio: { height: 58, marginBottom: 10, resizeMode: 'contain', width: 58 }, vacioTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, textAlign: 'center' }, vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  carruselHabitos: { marginHorizontal: -15 },
  carruselHabitosContenido: { gap: 12, paddingHorizontal: 15 },
  tarjetaHabito: { height: (ALTO_TARJETA_HABITO + MARGEN_SUPERIOR_TARJETA_HABITO) * ESCALA_TARJETA_HOY, width: ANCHO_TARJETA_HABITO * ESCALA_TARJETA_HOY },
  tarjetaHabitoContenido: { height: ALTO_TARJETA_HABITO + MARGEN_SUPERIOR_TARJETA_HABITO, left: 0, position: 'absolute', top: 0, transform: [{ scale: ESCALA_TARJETA_HOY }], transformOrigin: 'top left', width: ANCHO_TARJETA_HABITO },
  tarjetaEsqueleto: { backgroundColor: 'rgba(255,255,255,.55)', borderRadius: 28, minHeight: ALTO_TARJETA_HABITO, padding: 20 },
  filaHoyContenedor: { flexDirection: 'row' },
  nodoColumna: { alignItems: 'center', marginRight: 10, width: 28 },
  nodo: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28, zIndex: 1 },
  nodoCompletado: { backgroundColor: '#25884C' },
  nodoActivo: { backgroundColor: '#25884C' },
  nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: 'rgba(20,92,55,.25)', borderWidth: 2 },
  nodoLinea: { backgroundColor: 'rgba(20,92,55,.2)', bottom: -8, position: 'absolute', top: 28, width: 2 },
  filaHoyTarjetaContenedor: { flex: 1, marginBottom: 9, position: 'relative' },
  filaHoyTarjeta: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 8, paddingLeft: 66, paddingRight: 6, paddingVertical: 6 },
  filaHoyIconoFlotante: { left: 6, marginTop: -24, position: 'absolute', top: '50%', zIndex: 2 },
  filaHoyRelleno: { backgroundColor: '#0B5C30', bottom: 0, left: 0, position: 'absolute', top: 0 },
  filaHoyParticula: { backgroundColor: '#FFFFFF', borderRadius: 3, height: 6, marginTop: -3, position: 'absolute', top: '50%', width: 6 },
  pistaSwipeBanner: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, marginBottom: 12, padding: 10 },
  pistaSwipeIcono: { alignItems: 'center', backgroundColor: 'rgba(20,92,55,.12)', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  pistaSwipeTitulo: { color: '#145C37', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  pistaSwipeTexto: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1 },
  pistaSwipeBoton: { backgroundColor: '#25884C', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  pistaSwipeBotonTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 11 },
  filaHoyTitulo: { color: '#12331F', fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 15 },
  filaHoySubtitulo: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12, marginTop: 0 },
  filaHoyChevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  encabezadoHoy: { marginBottom: 14 },
  encabezadoHoyFila: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  encabezadoHoyTitulo: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 34 },
  encabezadoHoyCompletadas: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 2 },
  encabezadoHoyMenu: { alignItems: 'center', backgroundColor: 'rgba(20,92,55,.1)', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  encabezadoHoyProgresoFila: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 0 },
  encabezadoHoyBarra: { flex: 1 },
  encabezadoHoyPorcentaje: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 13, minWidth: 36, textAlign: 'right' },
  encabezadoHoyTagline: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 10 },
});
