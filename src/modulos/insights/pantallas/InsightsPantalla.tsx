import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ArrowDown, TrendingUp } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';

import { MasterGlass, MasterIconBg, MasterIcon, Texto, entradaEncadenada, MasterAnimation, Rebote, MasterProgressbar } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerPanelHabitos } from '../../habitos/habitos.servicio';
import type { EstadoPanelHabitos, HabitoResumen, ImpactoHabito, PatronHabito, RiesgoHabito } from '../../habitos/tipos';

const C = { texto: '#1A1335', tenue: '#648170', verde: '#25884C', rojo: '#DC2626', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const TARJETAS_MOCK = [
  { id: 'constancia', nombreIcono: 'hoja', colorIcono: 2, detalle: '+12%', titulo: 'Constancia', valor: '78%' },
  { id: 'racha', nombreIcono: 'energia', colorIcono: 4, detalle: '+3', titulo: 'Racha', valor: '12' },
  { id: 'xp', nombreIcono: 'trofeo', colorIcono: 3, detalle: '+18%', titulo: 'XP ganada', valor: '320' },
  { id: 'activos', nombreIcono: 'estadistica', colorIcono: 2, detalle: '+1', titulo: 'Activos', valor: '4/5' },
];

const DIAS_SEMANA_ETIQUETA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function IconoHabitoChico({ id, color, size = 18 }: { id?: string | null; color: string; size?: number }) { 
  const icono = buscarIconoHabito(id); 
  return icono ? <Image source={icono.fuente} style={{ height: size, resizeMode: 'contain', width: size }} /> : <View style={{ height: size, width: size, borderRadius: size/2, backgroundColor: color }} />; 
}

function EstadoSeccion({ estado }: { estado: EstadoPanelHabitos }) {
  return <View style={s.estadoContenedor}><Texto style={s.estadoTexto}>Reuniendo datos...</Texto></View>;
}

function SeccionPatrones({ datos, estado }: { datos: PatronHabito[]; estado: EstadoPanelHabitos }) {
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon color={2} name="calendario" size={16} /></MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto style={s.seccionTituloCompacto}>Tu semana</Texto>
          <Texto style={s.seccionSubtituloCompacto}>4/7 días</Texto>
        </View>
      </View>
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.barras}>
          {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
            const patron = datos.find((item) => item.diaSemana === indice + 1);
            const porcentaje = Math.max(10, patron?.porcentaje ?? 0);
            return (
              <View key={indice} style={s.barraColumna}>
                <View style={s.barraFondo}>
                  <View style={[s.barraLlena, { height: `${porcentaje}%` }]} />
                </View>
                <Texto style={s.barraTexto}>{etiqueta}</Texto>
              </View>
            );
          })}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionImpacto({ datos, estado, habitosPorId }: { datos: ImpactoHabito[]; estado: EstadoPanelHabitos; habitosPorId: Map<string, HabitoResumen> }) {
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon color={2} name="hoja" size={16} /></MasterIconBg>
        <Texto style={s.seccionTituloCompacto}>Impulsan tu día</Texto>
      </View>
      <Texto style={s.seccionSubtituloCompacto}>Cuando completas estos, logras más.</Texto>
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.listaCompacta}>
          {datos.slice(0, 3).map((impacto, i) => {
            const origen = habitosPorId.get(impacto.origenHabitoId);
            if (!origen) return null;
            const factor = ((100 + impacto.impacto) / 100).toFixed(1);
            return (
              <View key={`${impacto.origenHabitoId}-${i}`} style={s.filaImpacto}>
                <IconoHabitoChico color={origen.color} id={origen.iconoLucide} />
                <View style={{ flex: 1 }}>
                  <Texto numberOfLines={1} style={s.filaProgresoTitulo}>{origen.titulo}</Texto>
                  <MasterProgressbar altura={6} porcentaje={Math.min(100, (Number(factor) / 3) * 100)} style={{ marginTop: 4 }} />
                </View>
                <Texto style={s.filaProgresoFactor}>{factor}x</Texto>
              </View>
            );
          })}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionRiesgo({ datos, estado }: { datos: RiesgoHabito[]; estado: EstadoPanelHabitos }) {
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon color={5} name="estadistica" size={16} /></MasterIconBg>
        <Texto style={s.seccionTituloCompacto}>Atención</Texto>
      </View>
      <Texto style={s.seccionSubtituloCompacto}>Bajaron su actividad esta semana.</Texto>
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.listaCompacta}>
          {datos.slice(0, 3).map((riesgo, i) => (
            <View key={`${riesgo.habitoId}-${i}`} style={s.filaSimple}>
              <IconoHabitoChico color={riesgo.color} id={riesgo.iconoLucide} />
              <Texto numberOfLines={1} style={s.filaSimpleTitulo}>{riesgo.titulo}</Texto>
              <ArrowDown color={C.rojo} size={14} strokeWidth={3} />
            </View>
          ))}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionDiaFuerte() {
  return (
    <MasterGlass style={s.seccionColumna}>
       <View style={s.seccionHeaderCompacto}>
         <MasterIconBg size={32}><MasterIcon color={2} name="trofeo" size={16} /></MasterIconBg>
         <Texto style={s.seccionTituloCompacto}>Día más fuerte</Texto>
       </View>
       <Texto style={s.seccionSubtituloCompacto}>Tus mejores días son los Martes.</Texto>
       <View style={[s.barras, { height: 60, marginTop: 12 }]}>
          {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
            const porcentaje = indice === 1 ? 100 : [40, 50, 80, 30, 20, 60][indice] || 20;
            return (
              <View key={indice} style={s.barraColumna}>
                <View style={[s.barraFondo, { backgroundColor: indice === 1 ? 'rgba(37,136,76,.15)' : 'rgba(37,136,76,.06)' }]}>
                  <View style={[s.barraLlena, { height: `${porcentaje}%`, backgroundColor: indice === 1 ? C.verde : '#8CC89F' }]} />
                </View>
                <Texto style={[s.barraTexto, indice === 1 && { color: C.verde, fontFamily: 'Montserrat-Bold' }]}>{etiqueta}</Texto>
              </View>
            );
          })}
        </View>
    </MasterGlass>
  );
}

function WidgetReflexion() {
  return (
    <View style={{ marginTop: 22, alignSelf: 'flex-start', maxWidth: 170 }}>
      <MasterGlass style={{ borderRadius: 18, padding: 14, alignItems: 'center', gap: 8 }}>
        <Image source={require('../../../../assets/icons/ui/cerebro.png')} style={{ width: 34, height: 34, resizeMode: 'contain', opacity: 0.9 }} />
        <Texto style={{ fontFamily: 'Montserrat-Medium', fontSize: 9, color: C.tenue, textAlign: 'center', lineHeight: 14, paddingHorizontal: 2 }}>
          "A veces te observo castigarte por los días perdidos. Tal vez ignoras que la gracia no está en mantener rachas perfectas, sino en la humildad de recoger los eslabones rotos."
          <Texto style={{ fontFamily: 'Montserrat-Bold', fontSize: 8 }}>{'\n\n'}— Aby</Texto>
        </Texto>
      </MasterGlass>
    </View>
  );
}

export function InsightsPantalla() {
  const insets = useSafeAreaInsets();
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const panel = consulta.data;
  const habitosPorId = new Map((panel?.hoy.datos ?? []).map((habito) => [habito.id, habito]));

  return (
    <LinearGradient colors={['#F7FDF7', '#E8F7E9', '#CDEFCF']} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
          <AuroraBoreal tema="verde" />
          
          <View style={s.headerInicio}>
            <View style={s.heroColDer}>
              <View style={s.ilustracionContenedor}>
                <Image source={require('../../../../assets/ilustraciones/hoy/fondos/habitos.png')} style={s.ilustracionHabitos} resizeMode="cover" />
              </View>
            </View>

            <View style={s.headerTitulo}>
              <Animated.View entering={entradaEncadenada(0)} style={s.headerIzq}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Image source={require('../../../../assets/icons/navegacion/inisghts.png')} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
                  <Texto style={s.headerTituloPrincipal}>Tus Insights</Texto>
                </View>
                <Texto style={s.headerSubtitulo}>Analiza tu progreso y descubre patrones.</Texto>
                
                <WidgetReflexion />
              </Animated.View>
            </View>
            <View style={s.headerDer}>
              <Animated.View entering={entradaEncadenada(1)}>
                <MasterGlass style={s.notificacion}>
                  <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} />
                </MasterGlass>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={s.contenidoInterior}>
          <View style={s.statsFila}>
            {TARJETAS_MOCK.map((tarjeta, indice) => (
              <Animated.View entering={entradaEncadenada(3 + indice)} key={tarjeta.id} style={s.statCardWrapper}>
                <MasterGlass style={s.statCardMini}>
                  <MasterIcon color={tarjeta.colorIcono as any} name={tarjeta.nombreIcono} size={32} />
                  <Texto numberOfLines={1} style={s.statCardValor}>{tarjeta.valor}</Texto>
                  <Texto style={s.statCardTitulo}>{tarjeta.titulo}</Texto>
                  <View style={s.statCardBadge}>
                    <TrendingUp color={C.verde} size={10} strokeWidth={3} />
                    <Texto style={s.statCardBadgeTexto}>{tarjeta.detalle}</Texto>
                  </View>
                </MasterGlass>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={entradaEncadenada(7)}>
            <Rebote>
              <MasterGlass style={s.bannerSuperior}>
                <View style={s.bannerIconoContenedor}>
                  <Image source={require('../../../../assets/icons/ui/hoja2.png')} style={s.bannerIcono} />
                </View>
                <View style={s.bannerTextoContenedor}>
                  <Texto style={s.bannerTitulo}>Vas muy bien</Texto>
                  <Texto style={s.bannerSubtitulo}>Tu constancia aumentó 14% esta semana.</Texto>
                </View>
                <MasterGlass style={s.bannerChevron}><ChevronRight color={C.verde} size={16} /></MasterGlass>
              </MasterGlass>
            </Rebote>
          </Animated.View>

          <MasterAnimation duracion={340}>
            {panel && (
              <View style={s.columnas}>
                <View style={s.columna}>
                  <SeccionPatrones datos={panel.patrones.datos} estado={panel.patrones.estado} />
                  <SeccionImpacto datos={panel.impacto.datos} estado={panel.impacto.estado} habitosPorId={habitosPorId} />
                </View>
                <View style={s.columna}>
                  <SeccionDiaFuerte />
                  <SeccionRiesgo datos={panel.riesgo.datos} estado={panel.riesgo.estado} />
                </View>
              </View>
            )}
          </MasterAnimation>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingBottom: 0 },
  superiorInicio: { gap: 0, marginBottom: 12 },
  
  // Header Insights
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
  headerTitulo: { flexDirection: 'row', flex: 1 },
  headerIzq: { flex: 1, maxWidth: '60%' },
  headerTituloPrincipal: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 32 },
  headerSubtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 6, maxWidth: 170 },
  headerDer: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 4 },
  notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 },
  notificacionIcono: { height: 26, resizeMode: 'contain', width: 26 },
  
  // Ilustracion
  heroColDer: { position: 'absolute', right: -10, top: 45, width: '50%', zIndex: -1 },
  ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' },
  ilustracionHabitos: { height: '100%', width: '100%' },

  contenidoInterior: { gap: 16, paddingHorizontal: 16, marginTop: -20 },
  
  // Banner
  bannerSuperior: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 12, padding: 12 },
  bannerIconoContenedor: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  bannerIcono: { height: 32, resizeMode: 'contain', width: 32, transform: [{ rotate: '-15deg' }] },
  bannerTextoContenedor: { flex: 1 },
  bannerTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  bannerSubtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, marginTop: 2 },
  bannerChevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  
  // 4 mini cards
  statsFila: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  statCardWrapper: { width: '23.5%' },
  statCardMini: { alignItems: 'center', borderRadius: 16, paddingHorizontal: 2, paddingVertical: 10, gap: 2 },
  statCardValor: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 17, marginTop: 4 },
  statCardTitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, textAlign: 'center', lineHeight: 11, minHeight: 22 },
  statCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  statCardBadgeTexto: { color: C.verde, fontFamily: 'Montserrat-Bold', fontSize: 9 },
  
  // Columns
  columnas: { flexDirection: 'row', gap: 12 },
  columna: { flex: 1, gap: 12 },
  
  // Compact Section Layout
  seccionColumna: { borderRadius: 20, padding: 14 },
  seccionHeaderCompacto: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 4 },
  seccionTituloCompacto: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, flex: 1 },
  seccionSubtituloCompacto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, lineHeight: 12 },
  
  // Mini Bars (Tu Semana / Día Fuerte)
  barras: { flexDirection: 'row', gap: 4, height: 90, justifyContent: 'space-between', marginTop: 12 },
  barraColumna: { alignItems: 'center', flex: 1, gap: 4, justifyContent: 'flex-end' },
  barraFondo: { backgroundColor: 'rgba(37,136,76,.1)', borderRadius: 6, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', width: '85%' },
  barraLlena: { backgroundColor: C.verde, borderRadius: 6, width: '100%' },
  barraTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 8 },
  
  // Compact Lists
  listaCompacta: { gap: 10, marginTop: 12 },
  filaImpacto: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filaProgresoTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 10 },
  filaProgresoFactor: { color: C.verde, fontFamily: 'MontserratAlternates-Bold', fontSize: 10, width: 24, textAlign: 'right' },
  filaSimple: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  filaSimpleTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 10, flex: 1 },
  
  // States
  estadoContenedor: { paddingVertical: 12 },
  estadoTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, textAlign: 'center' },
});
