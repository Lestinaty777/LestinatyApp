import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, ArrowDown, Sparkles } from 'lucide-react-native';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';

import { ImagenTema, MasterGlass, MasterIconBg, MasterIcon, Texto, entradaEncadenada, MasterAnimation, Rebote, MasterProgressbar, Skeleton } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerHabitoMejorRacha, obtenerPanelHabitos, obtenerResumenPlanesHabitos } from '../../habitos/habitos.servicio';
import type { ConexionHabito, EstadoPanelHabitos, PatronHabito, ProgresoSeccionPanel, RiesgoHabito } from '../../habitos/tipos';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { GaleriaWidgetsModal } from '../componentes/GaleriaWidgetsModal';
import { SeccionProgresoDatos } from '../componentes/SeccionProgresoDatos';
import { elegirReflexionAby } from '../reflexionAby';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';
import { useTranslation } from 'react-i18next';

// `tenue` es el gris neutro de texto secundario de la app (antes un gris verdoso: las descripciones no deben ser verdes).
const C = { texto: '#1A1335', tenue: '#7B7494', verde: ESCALA_ESMERALDA.jade.l50, rojo: '#DC2626', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const DIAS_SEMANA_ETIQUETA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CLAVES_DIA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

function IconoHabitoChico({ id, color, size = 18 }: { id?: string | null; color: string; size?: number }) { 
  const icono = buscarIconoHabito(id); 
  return icono ? <MasterIcon name={icono.id} size={size} /> : <View style={{ height: size, width: size, borderRadius: size/2, backgroundColor: color }} />; 
}

function EsqueletoPatrones() {
  const { t } = useTranslation();
  const esc = useEscala();
  const s = useEstilosS();
  const etiquetasDia = (t('insights.strongestDay.dayLabels', { returnObjects: true }) as string[]) || DIAS_SEMANA_ETIQUETA;
  return (
    <View style={s.barras}>
      {etiquetasDia.map((etiqueta, indice) => (
        <View key={indice} style={s.barraColumna}>
          <View style={[s.barraFondo, { justifyContent: 'flex-end', backgroundColor: conAlfa(esc.jade.l50, 0.06) }]}>
            <Skeleton alto={[28, 56, 38, 72, 44, 62, 34][indice]} ancho="100%" radio={4} />
          </View>
          <Texto style={s.barraTexto}>{etiqueta}</Texto>
        </View>
      ))}
    </View>
  );
}

function EsqueletoConexiones() {
  const s = useEstilosS();
  return (
    <View style={s.listaCompacta}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.filaImpacto}>
          <Skeleton alto={20} ancho={20} radio={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton alto={11} ancho={(['65%', '80%', '50%'] as const)[i]} radio={4} />
            <Skeleton alto={6} ancho="100%" radio={3} />
          </View>
          <Skeleton alto={12} ancho={22} radio={4} />
        </View>
      ))}
    </View>
  );
}

function EsqueletoRiesgo() {
  const s = useEstilosS();
  return (
    <View style={s.listaCompacta}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.filaSimple}>
          <Skeleton alto={20} ancho={20} radio={10} />
          <Skeleton alto={12} ancho={(['70%', '55%', '75%'] as const)[i]} radio={4} style={{ flex: 1 }} />
          <Skeleton alto={14} ancho={14} radio={4} />
        </View>
      ))}
    </View>
  );
}

function EsqueletoColumnasInsights() {
  const s = useEstilosS();
  return (
    <View style={s.columnas}>
      <View style={s.columna}>
        <MasterGlass style={s.seccionColumna}>
          <View style={s.seccionHeaderCompacto}>
            <Skeleton alto={32} ancho={32} radio={8} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton alto={13} ancho="60%" radio={4} />
              <Skeleton alto={10} ancho="40%" radio={3} />
            </View>
          </View>
          <EsqueletoPatrones />
        </MasterGlass>
        <MasterGlass style={s.seccionColumna}>
          <View style={s.seccionHeaderCompacto}>
            <Skeleton alto={32} ancho={32} radio={8} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton alto={13} ancho="70%" radio={4} />
              <Skeleton alto={10} ancho="50%" radio={3} />
            </View>
          </View>
          <EsqueletoConexiones />
        </MasterGlass>
      </View>
      <View style={s.columna}>
        <MasterGlass style={s.seccionColumna}>
          <View style={s.seccionHeaderCompacto}>
            <Skeleton alto={32} ancho={32} radio={8} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton alto={13} ancho="65%" radio={4} />
              <Skeleton alto={10} ancho="45%" radio={3} />
            </View>
          </View>
          <EsqueletoPatrones />
        </MasterGlass>
        <MasterGlass style={s.seccionColumna}>
          <View style={s.seccionHeaderCompacto}>
            <Skeleton alto={32} ancho={32} radio={8} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton alto={13} ancho="55%" radio={4} />
              <Skeleton alto={10} ancho="35%" radio={3} />
            </View>
          </View>
          <EsqueletoRiesgo />
        </MasterGlass>
      </View>
    </View>
  );
}

function SeccionPatrones({ cargando, datos, estado, progreso }: { cargando: boolean; datos: PatronHabito[]; estado: EstadoPanelHabitos; progreso?: ProgresoSeccionPanel }) {
  const { t } = useTranslation();
  const s = useEstilosS();
  const diasConDatos = datos.filter((item) => item.muestras > 0).length;
  const etiquetasDia = (t('insights.strongestDay.dayLabels', { returnObjects: true }) as string[]) || DIAS_SEMANA_ETIQUETA;
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon alTema name="calendario" size={16} /></MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto style={s.seccionTituloCompacto}>{t('insights.patterns.title')}</Texto>
          <Texto style={s.seccionSubtituloCompacto}>
            {estado === 'listo'
              ? t('insights.patterns.recordedDays', { count: diasConDatos })
              : t('insights.patterns.gatheringHistory')}
          </Texto>
        </View>
      </View>
      {cargando ? (
        <EsqueletoPatrones />
      ) : estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('insights.patterns.needMoreDays')} progreso={progreso} />
      ) : (
        <View style={s.barras}>
          {etiquetasDia.map((etiqueta, indice) => {
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

type HabitoBasico = { titulo: string; color: string; iconoLucide: string };

function SeccionConexiones({ cargando, datos, estado, habitosPorId, progreso }: { cargando: boolean; datos: ConexionHabito[]; estado: EstadoPanelHabitos; habitosPorId: Map<string, HabitoBasico>; progreso?: ProgresoSeccionPanel }) {
  const { t } = useTranslation();
  const s = useEstilosS();
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon alTema name="hoja" size={16} /></MasterIconBg>
        <Texto style={s.seccionTituloCompacto}>{t('insights.connections.title')}</Texto>
      </View>
      <Texto style={s.seccionSubtituloCompacto}>{t('insights.connections.subtitle')}</Texto>
      {cargando ? (
        <EsqueletoConexiones />
      ) : estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('insights.connections.needMoreDays')} progreso={progreso} />
      ) : (
        <View style={s.listaCompacta}>
          <MasterAnimation>
            {datos.slice(0, 3).map((conexion, i) => {
              const origen = habitosPorId.get(conexion.origenHabitoId);
              const destino = habitosPorId.get(conexion.destinoHabitoId);
              if (!origen || !destino) return null;
              return (
                <View key={`${conexion.origenHabitoId}-${conexion.destinoHabitoId}-${i}`} style={s.filaImpacto}>
                  <IconoHabitoChico color={origen.color} id={origen.iconoLucide} />
                  <View style={{ flex: 1 }}>
                    <Texto numberOfLines={1} style={s.filaProgresoTitulo}>{origen.titulo} + {destino.titulo}</Texto>
                    <MasterProgressbar altura={6} porcentaje={conexion.fuerza} style={{ marginTop: 4 }} />
                  </View>
                  <Texto style={s.filaProgresoFactor}>{Math.round(conexion.fuerza)}%</Texto>
                </View>
              );
            })}
          </MasterAnimation>
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionRiesgo({ cargando, datos, estado, progreso }: { cargando: boolean; datos: RiesgoHabito[]; estado: EstadoPanelHabitos; progreso?: ProgresoSeccionPanel }) {
  const { t } = useTranslation();
  const s = useEstilosS();
  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon color={5} name="estadistica" size={16} /></MasterIconBg>
        <Texto style={s.seccionTituloCompacto}>{t('insights.risk.title')}</Texto>
      </View>
      <Texto style={s.seccionSubtituloCompacto}>{t('insights.risk.subtitle')}</Texto>
      {cargando ? (
        <EsqueletoRiesgo />
      ) : estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('insights.risk.needMoreHistory')} progreso={progreso} />
      ) : datos.length === 0 ? (
        <View style={s.estadoContenedor}><Texto style={s.estadoTexto}>{t('insights.risk.empty')}</Texto></View>
      ) : (
        <View style={s.listaCompacta}>
          <MasterAnimation>
            {datos.slice(0, 3).map((riesgo, i) => (
              <View key={`${riesgo.habitoId}-${i}`} style={s.filaSimple}>
                <IconoHabitoChico color={riesgo.color} id={riesgo.iconoLucide} />
                <Texto numberOfLines={1} style={s.filaSimpleTitulo}>{riesgo.titulo}</Texto>
                <ArrowDown color={C.rojo} size={14} strokeWidth={3} />
              </View>
            ))}
          </MasterAnimation>
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionDiaFuerte({ cargando, datos, estado, progreso }: { cargando: boolean; datos: PatronHabito[]; estado: EstadoPanelHabitos; progreso?: ProgresoSeccionPanel }) {
  const { t } = useTranslation();
  const esc = useEscala();
  const s = useEstilosS();
  const diasConMuestras = datos.filter((item) => item.muestras > 0);
  const mejorDia = diasConMuestras.reduce<PatronHabito | null>((mejor, item) => (!mejor || item.porcentaje > mejor.porcentaje ? item : mejor), null);
  const indiceMejorDia = mejorDia ? mejorDia.diaSemana - 1 : -1;
  const etiquetasDia = (t('insights.strongestDay.dayLabels', { returnObjects: true }) as string[]) || DIAS_SEMANA_ETIQUETA;

  const nombreDia = indiceMejorDia >= 0 ? t(`insights.strongestDay.days.${CLAVES_DIA[indiceMejorDia]}`) : '';
  const subtitulo = estado === 'listo' && mejorDia && indiceMejorDia >= 0
    ? t('insights.strongestDay.bestDaysAre', { day: nombreDia })
    : t('insights.strongestDay.noHighlightYet');

  return (
    <MasterGlass style={s.seccionColumna}>
       <View style={s.seccionHeaderCompacto}>
         <MasterIconBg size={32}><MasterIcon alTema name="trofeo" size={16} /></MasterIconBg>
         <Texto style={s.seccionTituloCompacto}>{t('insights.strongestDay.title')}</Texto>
       </View>
       <Texto style={s.seccionSubtituloCompacto}>{subtitulo}</Texto>
       {cargando ? (
         <EsqueletoPatrones />
       ) : estado !== 'listo' ? (
         <SeccionProgresoDatos mensaje={t('insights.strongestDay.needMoreDays')} progreso={progreso} />
       ) : (
         <View style={[s.barras, { height: 60, marginTop: 12 }]}>
            {etiquetasDia.map((etiqueta, indice) => {
              const patron = datos.find((item) => item.diaSemana === indice + 1);
              const esMejor = indice === indiceMejorDia;
              const porcentaje = Math.max(10, patron?.porcentaje ?? 0);
              return (
                <View key={indice} style={s.barraColumna}>
                  <View style={[s.barraFondo, { backgroundColor: esMejor ? conAlfa(esc.jade.l50, .15) : conAlfa(esc.jade.l50, .06) }]}>
                    <View style={[s.barraLlena, { height: `${porcentaje}%`, backgroundColor: esMejor ? C.verde : esc.hoja.l76 }]} />
                  </View>
                  <Texto style={[s.barraTexto, esMejor && { color: C.verde, fontFamily: 'Montserrat-Bold' }]}>{etiqueta}</Texto>
                </View>
              );
            })}
          </View>
       )}
    </MasterGlass>
  );
}

function ElementoFlotanteSuave({
  children,
  distancia = 3.5,
  duracion = 2800,
  delay = 0,
  rotacion = '0deg',
  style,
}: {
  children: React.ReactNode;
  distancia?: number;
  duracion?: number;
  delay?: number;
  rotacion?: string;
  style?: any;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
          withTiming(distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );
  }, [delay, distancia, duracion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: rotacion }],
  }));

  return (
    <Animated.View style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}

function WidgetReflexion({ mensaje }: { mensaje: string }) {
  const { t } = useTranslation();
  const s = useEstilosS();
  return (
    <View style={s.widgetReflexionWrap}>
      <MasterGlass style={s.widgetReflexionGlass}>
        <View style={{ opacity: 0.9 }}><MasterIcon name="cerebro" size={32} /></View>
        <Texto style={{ fontFamily: 'Montserrat-Medium', fontSize: 9, color: C.tenue, textAlign: 'center', lineHeight: 13, paddingHorizontal: 2 }}>
          "{mensaje}"
          <Texto style={{ fontFamily: 'Montserrat-Bold', fontSize: 8 }}>{'\n\n'}{t('insights.reflection.author')}</Texto>
        </Texto>
      </MasterGlass>
    </View>
  );
}

export function InsightsPantalla() {
  const { t } = useTranslation();
  const tema = useAssetsPaqueteTema();
  const esc = useEscala();
  const s = useEstilosS();
  const insets = useSafeAreaInsets();
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const consultaMejorRacha = useQuery({ queryKey: ['habitos', 'mejor-racha'], queryFn: () => obtenerHabitoMejorRacha() });
  const consultaGemas = useSaldoGemas();
  // Conexiones puede unir hábitos que no están programados HOY (ej. uno de
  // lunes con uno diario) — `panel.hoy.datos` solo trae los de hoy, así que
  // usar ese mapa acá dejaba filas de conexiones reales invisibles cualquier
  // día que no coincidiera con el horario de alguno de los dos hábitos.
  const consultaHabitosTodos = useQuery({ queryKey: ['habitos', 'planes-resumen'], queryFn: () => obtenerResumenPlanesHabitos() });
  const panel = consulta.data;
  const habitosPorId = new Map((consultaHabitosTodos.data ?? []).map((habito) => [habito.id, habito]));
  const [modalWidgetsVisible, setModalWidgetsVisible] = useState(false);
  const statsListos = !consulta.isLoading && !consultaMejorRacha.isLoading && !consultaGemas.isLoading;

  const diasConMuestras = panel?.patrones.datos.filter((item) => item.muestras > 0) ?? [];
  const constancia = diasConMuestras.length > 0 ? Math.round(diasConMuestras.reduce((suma, item) => suma + item.porcentaje, 0) / diasConMuestras.length) : 0;
  const habitosHoy = panel?.hoy.datos ?? [];
  const completadosHoy = habitosHoy.filter((habito) => habito.completado).length;

  const tarjetasStats = [
    { id: 'constancia', nombreIcono: 'hoja', colorIcono: 2, titulo: t('insights.stats.consistency'), valor: panel?.patrones.estado === 'listo' ? `${constancia}%` : '—' },
    { id: 'racha', nombreIcono: 'racha', titulo: t('insights.stats.streak'), valor: consultaMejorRacha.data ? `${consultaMejorRacha.data.racha}d` : '0d' },
    { id: 'gemas', nombreIcono: 'gema', colorIcono: 4, titulo: t('insights.stats.gems'), valor: `${consultaGemas.data ?? 0}` },
    { id: 'hoy', nombreIcono: 'estadistica', colorIcono: 2, titulo: t('insights.stats.today'), valor: `${completadosHoy}/${habitosHoy.length}` },
  ];

  return (
    <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
          <AuroraBoreal tema="verde" />
          
          <View style={s.headerInicio}>
            <View style={s.headerTitulo}>
              <Animated.View entering={entradaEncadenada(0)} style={s.headerIzq}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MasterIcon name="navegacion/insights" size={34} />
                  <Texto style={s.headerTituloPrincipal}>{t('insights.header.title')}</Texto>
                </View>
                <Texto style={s.headerSubtitulo}>{t('insights.header.subtitle')}</Texto>
              </Animated.View>
            </View>
            <View style={s.headerDer}>
              <Animated.View entering={entradaEncadenada(1)}>
                <Rebote accessibilityLabel={t('insights.header.notificationsAccessibility')} onPress={() => Linking.openSettings()}>
                  <MasterGlass style={s.notificacion}>
                    <Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} />
                  </MasterGlass>
                </Rebote>
              </Animated.View>
            </View>
          </View>

          <Animated.View entering={entradaEncadenada(2)} style={s.heroReflexion}>
            <WidgetReflexion mensaje={panel ? elegirReflexionAby(panel) : t('insights.reflection.defaultMessage')} />
            <View style={s.heroColDer}>
              <ElementoFlotanteSuave delay={0} distancia={3.5} duracion={2600} rotacion="-14deg" style={s.flotanteRocaTop}>
                <ImagenTema fuente={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')} estilo={s.imgFlotante} />
              </ElementoFlotanteSuave>

              <ElementoFlotanteSuave delay={400} distancia={4} duracion={3100} rotacion="12deg" style={s.flotantePastoTop}>
                <ImagenTema fuente={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')} estilo={s.imgFlotante} />
              </ElementoFlotanteSuave>

              <ElementoFlotanteSuave delay={800} distancia={3} duracion={2400} rotacion="22deg" style={s.flotanteRocaMidLeft}>
                <Image
                  source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                  style={s.imgFlotante}
                  resizeMode="contain"
                />
              </ElementoFlotanteSuave>

              <ElementoFlotanteSuave delay={200} distancia={4.5} duracion={2900} rotacion="16deg" style={s.flotantePastoMidRight}>
                <ImagenTema fuente={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto2.png')} estilo={s.imgFlotante} />
              </ElementoFlotanteSuave>

              <Image
                source={tema.arbol}
                style={s.ilustracionHabitos}
                resizeMode="contain"
              />

              <ElementoFlotanteSuave delay={600} distancia={3} duracion={3200} rotacion="-6deg" style={s.flotantePastoCenterBottom}>
                <ImagenTema fuente={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')} estilo={s.imgFlotante} />
              </ElementoFlotanteSuave>

              <ElementoFlotanteSuave delay={1000} distancia={4} duracion={2700} rotacion="-8deg" style={s.flotantePastoBottom}>
                <ImagenTema fuente={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto1.png')} estilo={s.imgFlotante} />
              </ElementoFlotanteSuave>

              <ElementoFlotanteSuave delay={300} distancia={3.5} duracion={3000} rotacion="15deg" style={s.flotanteRocaBottom}>
                <Image
                  source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                  style={s.imgFlotante}
                  resizeMode="contain"
                />
              </ElementoFlotanteSuave>
            </View>
          </Animated.View>
        </View>

        <View style={s.contenidoInterior}>
          <View style={s.statsFila}>
            {!statsListos
              ? [0, 1, 2, 3].map((i) => (
                  <View key={i} style={s.statCardWrapper}>
                    <MasterGlass style={s.statCardMini}>
                      <Skeleton alto={32} ancho={32} radio={8} />
                      <Skeleton alto={18} ancho="55%" radio={4} style={{ marginTop: 8 }} />
                      <Skeleton alto={11} ancho="80%" radio={4} style={{ marginTop: 4 }} />
                      <Skeleton alto={14} ancho="60%" radio={6} style={{ marginTop: 6 }} />
                    </MasterGlass>
                  </View>
                ))
              : tarjetasStats.map((tarjeta, indice) => (
                  <Animated.View entering={entradaEncadenada(3 + indice)} key={tarjeta.id} style={s.statCardWrapper}>
                    <MasterGlass style={s.statCardMini}>
                      {tarjeta.id === 'gemas' ? (
                        <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ height: 32, width: 32, resizeMode: 'contain' }} />
                      ) : (
                        <MasterIcon color={tarjeta.colorIcono as any} name={tarjeta.nombreIcono} size={32} />
                      )}
                      <Texto numberOfLines={1} style={s.statCardValor}>{tarjeta.valor}</Texto>
                      <Texto style={s.statCardTitulo}>{tarjeta.titulo}</Texto>
                    </MasterGlass>
                  </Animated.View>
                ))}
          </View>

          <Animated.View entering={entradaEncadenada(7)}>
            <Rebote onPress={() => setModalWidgetsVisible(true)}>
              <MasterGlass style={s.bannerWidgetsAcceso}>
                <View style={s.bannerWidgetsIconoContenedor}>
                  <Sparkles color={C.verde} size={18} />
                </View>
                <View style={s.bannerTextoContenedor}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Texto style={s.bannerTitulo}>{t('insights.banner.title')}</Texto>
                    <View style={s.badgePro}>
                      <Texto style={s.badgeProTexto}>{t('insights.banner.badge')}</Texto>
                    </View>
                  </View>
                  <Texto style={s.bannerSubtitulo}>{t('insights.banner.subtitle')}</Texto>
                </View>
                <MasterGlass style={s.bannerChevron}><ChevronRight color={C.verde} size={16} /></MasterGlass>
              </MasterGlass>
            </Rebote>
          </Animated.View>

          {panel ? (
            <View style={s.columnas}>
              <View style={s.columna}>
                <Animated.View entering={entradaEncadenada(9)}>
                  <SeccionPatrones cargando={false} datos={panel.patrones.datos} estado={panel.patrones.estado} progreso={panel.patrones.progreso} />
                </Animated.View>
                <Animated.View entering={entradaEncadenada(11)}>
                  <SeccionConexiones cargando={consultaHabitosTodos.isLoading} datos={panel.conexiones.datos} estado={panel.conexiones.estado} habitosPorId={habitosPorId} progreso={panel.conexiones.progreso} />
                </Animated.View>
              </View>
              <View style={s.columna}>
                <Animated.View entering={entradaEncadenada(10)}>
                  <SeccionDiaFuerte cargando={false} datos={panel.patrones.datos} estado={panel.patrones.estado} progreso={panel.patrones.progreso} />
                </Animated.View>
                <Animated.View entering={entradaEncadenada(12)}>
                  <SeccionRiesgo cargando={false} datos={panel.riesgo.datos} estado={panel.riesgo.estado} progreso={panel.riesgo.progreso} />
                </Animated.View>
              </View>
            </View>
          ) : (
            <EsqueletoColumnasInsights />
          )}
        </View>

      </ScrollView>

      <GaleriaWidgetsModal
        onCerrar={() => setModalWidgetsVisible(false)}
        visible={modalWidgetsVisible}
      />
    </LinearGradient>
  );
}

const crearEstilosS = (esc: EscalaMaster): Record<string, any> => StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingBottom: 0 },
  superiorInicio: { gap: 0, marginBottom: 12 },
  
  // Header Insights
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 20 },
  headerTitulo: { flexDirection: 'row', flex: 1 },
  headerIzq: { flex: 1 },
  headerTituloPrincipal: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 32 },
  headerSubtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 4 },
  headerDer: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 4 },
  notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 },
  notificacionIcono: { height: 26, resizeMode: 'contain', width: 26 },
  
  // Hero Reflexion + Ilustracion lado a lado
  heroReflexion: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 16 },
  widgetReflexionWrap: { width: 146 },
  widgetReflexionGlass: { alignItems: 'center', aspectRatio: 3 / 4, borderRadius: 20, gap: 8, justifyContent: 'center', padding: 12, width: '100%' },
  heroColDer: { alignItems: 'flex-end', flex: 1, height: 195, justifyContent: 'center', marginLeft: 6, transform: [{ translateX: 16 }] },
  ilustracionHabitos: { height: '100%', width: '100%' },
  flotanteRocaTop: { height: 32, left: 8, position: 'absolute', top: 6, width: 32, zIndex: 1 },
  flotantePastoTop: { height: 32, position: 'absolute', right: 14, top: -4, width: 38, zIndex: 1 },
  flotanteRocaMidLeft: { height: 26, left: -2, position: 'absolute', top: 72, width: 26, zIndex: 1 },
  flotantePastoMidRight: { height: 32, position: 'absolute', right: -12, top: 70, width: 36, zIndex: 1 },
  flotantePastoCenterBottom: { bottom: -6, height: 30, position: 'absolute', right: 62, width: 36, zIndex: 1 },
  flotantePastoBottom: { bottom: 8, height: 36, left: -8, position: 'absolute', width: 44, zIndex: 1 },
  flotanteRocaBottom: { bottom: 4, height: 34, position: 'absolute', right: 6, width: 34, zIndex: 1 },
  imgFlotante: { height: '100%', width: '100%' },

  contenidoInterior: { gap: 16, marginTop: 0, paddingHorizontal: 16 },
  
  // Banner
  bannerTextoContenedor: { flex: 1 },
  bannerTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  bannerSubtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, marginTop: 2 },
  bannerChevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  bannerWidgetsAcceso: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 12, padding: 12 },
  bannerWidgetsIconoContenedor: { alignItems: 'center', backgroundColor: conAlfa(esc.jade.l50, 0.12), borderRadius: 14, height: 36, justifyContent: 'center', width: 36 },
  badgePro: { backgroundColor: C.verde, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeProTexto: { color: '#FFF', fontFamily: 'Montserrat-Bold', fontSize: 9 },
  
  // 4 mini cards
  statsFila: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  statCardWrapper: { width: '23.5%' },
  statCardMini: { alignItems: 'center', borderRadius: 16, paddingHorizontal: 2, paddingVertical: 10, gap: 2 },
  statCardValor: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 17, marginTop: 4 },
  statCardTitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, textAlign: 'center', lineHeight: 11, minHeight: 22 },

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
  barraFondo: { backgroundColor: conAlfa(esc.jade.l50, .1), borderRadius: 6, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', width: '85%' },
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

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
