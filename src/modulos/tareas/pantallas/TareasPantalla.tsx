import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, Texto } from '../../../diseno';
import { conAlfa, crearTonoMaster } from '../../../diseno/tema/masterColor';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { CrearTareaWizard } from '../componentes/CrearTareaWizard';
import { ListaMisTareas } from '../componentes/ListaMisTareas';
import { ListaRecordatoriosTareas } from '../componentes/ListaRecordatoriosTareas';
import { SeccionPatronesTareas } from '../componentes/SeccionPatronesTareas';
import { SeccionRiesgoTareas } from '../componentes/SeccionRiesgoTareas';
import { TimelineTareasHoy } from '../componentes/TimelineTareasHoy';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import {
  completarTareaDia, crearTareaPremium, obtenerPanelTareas, obtenerResumenRecordatoriosTareas,
  obtenerTareaMejorRacha, obtenerTareas, obtenerTareasHoy, registrarProgresoTarea,
} from '../tareas.servicio';
import type { ResultadoCompletarTarea, ResultadoRegistroTarea, Tarea, TareaHoyDetalle } from '../tareas.tipos';

// Fase 8: mismo criterio de ruteo que MapaSenderosPantalla.tsx — checklist y
// una_vez siguen con completar_tarea_dia (toggle); simple/contador/cronometro
// recurrentes usan el sendero de días (registrar_progreso_tarea, sin undo).
const TIPOS_CON_SENDERO_DIAS = ['simple', 'contador', 'cronometro'] as const;
function usaSenderoDeDias(tarea: { frecuencia: string; tipo: string }): boolean {
  return tarea.frecuencia === 'dias_semana' && (TIPOS_CON_SENDERO_DIAS as readonly string[]).includes(tarea.tipo);
}

// Tema dorado fijo (a diferencia de Hábitos, que sigue el tema activo del
// usuario) — TonoDelHabito es el mismo mecanismo que ya usa cada tarjeta de
// hábito para conservar el color de SU paquete.
const PAQUETE_TAREAS = 'golden';
// No es el master_pack_color real de "golden" en la base (ese es #FCB103) —
// este es solo el color que alimenta la rotación de la paleta reactiva de
// ESTA pantalla (fondo, panel, textos secundarios, todo lo que usa esc.*),
// elegido por estética. No toca la fila real de arboles_paquetes ni el
// árbol/arbusto (son PNG fijos, no se tiñen con el tono).
const COLOR_PAQUETE_TAREAS = '#FFAE00';

type VistaPanel = 'hoy' | 'progresion' | 'recordatorios' | 'insights';
const ICONOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'sol', insights: 'estadistica', progresion: 'progreso', recordatorios: 'reloj' };

const ACCESOS = [
  { id: 'progresion', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' }, { id: 'recordatorios', nombreIcono: 'reloj' }, { id: 'insights', nombreIcono: 'estadistica' },
] as const;

const CLAVE_TAREAS_HOY = ['tareas', 'hoy'] as const;
const CLAVE_TAREAS_LISTA = ['tareas', 'lista'] as const;
const CLAVE_TAREAS_RECORDATORIOS = ['tareas', 'recordatorios'] as const;
const CLAVE_TAREAS_MEJOR_RACHA = ['tareas', 'mejorRacha'] as const;
const CLAVE_TAREAS_PANEL = ['tareas', 'panel'] as const;

// Envoltorio fino: solo pone el tono dorado fijo. useEscala()/useEstilosS()
// hay que llamarlos DESDE ADENTRO del Provider (en TareasPantallaContenido),
// no acá — si se llamaran en este mismo componente leerían el tema global de
// arriba (Esmeralda u otro), no el dorado que este wrapper recién arma más
// abajo.
export function TareasPantalla() {
  return (
    <TonoDelHabito colorPaquete={COLOR_PAQUETE_TAREAS} paqueteId={PAQUETE_TAREAS}>
      <TareasPantallaContenido />
    </TonoDelHabito>
  );
}

function TareasPantallaContenido() {
  const esc = useEscala();
  const s = useEstilosS();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [completandoId, setCompletandoId] = useState<string | null>(null);

  const consultaHoy = useQuery({ queryKey: CLAVE_TAREAS_HOY, queryFn: () => obtenerTareasHoy() });
  const consultaLista = useQuery({ queryKey: CLAVE_TAREAS_LISTA, queryFn: () => obtenerTareas() });
  const consultaRecordatorios = useQuery({ queryKey: CLAVE_TAREAS_RECORDATORIOS, queryFn: () => obtenerResumenRecordatoriosTareas() });
  const consultaMejorRacha = useQuery({ queryKey: CLAVE_TAREAS_MEJOR_RACHA, queryFn: () => obtenerTareaMejorRacha() });
  const consultaPanel = useQuery({ queryKey: CLAVE_TAREAS_PANEL, queryFn: () => obtenerPanelTareas(), enabled: vistaPanel === 'insights' });

  // El wizard (CrearTareaWizard, Fase 8.5) maneja semilla y pasos por su
  // cuenta después de crear — mismo patrón que CrearHabitoWizard con
  // asignarSemillaHabito, en vez de encadenarlo todo en esta mutación como
  // hacía la hoja anterior (CrearTareaHoja, ya no se usa acá). Por eso NO
  // cierra el modal acá: si lo hiciera, se vería antes de que el wizard
  // termine de crear los pasos del checklist o asignar la semilla (el modal
  // no se desmonta al ocultarse, así que esos pasos igual terminan
  // corriendo, pero el usuario ya habría salido sin verlos reflejados) — el
  // propio wizard llama a onCerrar() cuando TODO terminó.
  const crearPremium = useMutation({
    mutationFn: crearTareaPremium,
    onSuccess: () => {
      hapticSeguro('confirmacion');
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_HOY });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_LISTA });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_RECORDATORIOS });
    },
  });

  // Un solo mutation para completar, sea desde "Hoy" (cualquier tarea) o
  // desde "Mis tareas" (solo 'una_vez' — ver ListaMisTareas). checklist y
  // una_vez van por completar_tarea_dia (toggle: un segundo toque deshace el
  // primero); simple/contador/cronometro recurrentes van por el sendero de
  // días (registrar_progreso_tarea, sin undo — mismo RPC que usa el mapa de
  // Senderos para esta misma tarea, así nunca se desincronizan). Si queda una
  // figura pendiente, no se abre ningún ritual acá (esta pantalla no tiene
  // mapa/pedestal) — queda esperando, igual que una mandala de hábito
  // completada desde otra pantalla: se resuelve la próxima vez que se entra
  // a Senderos y se toca el pedestal pendiente.
  const completar = useMutation<ResultadoCompletarTarea | ResultadoRegistroTarea, Error, { id: string; frecuencia: string; tipo: string }>({
    mutationFn: (tarea) => {
      setCompletandoId(tarea.id);
      if (usaSenderoDeDias(tarea)) {
        return registrarProgresoTarea({ fechaLocal: fechaLocalHoy(), nota: null, tareaId: tarea.id, valor: 1 });
      }
      return completarTareaDia(tarea.id);
    },
    onSuccess: (resultado, tarea) => {
      const descompletada = 'completada' in resultado && resultado.completada === false;
      hapticSeguro(descompletada ? 'seleccion' : 'confirmacion');
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_HOY });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_LISTA });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_MEJOR_RACHA });
      cliente.invalidateQueries({ queryKey: ['tareas', 'tarea', tarea.id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'registros-nivel', tarea.id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'figuras', tarea.id] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
    },
    onSettled: () => setCompletandoId(null),
  });

  const temaTareas = useMemo(() => {
    const assets = obtenerAssetsPaquete(PAQUETE_TAREAS)!;
    return { arbol: assets.etapas[6], arbusto: assets.arbusto };
  }, []);
  const acentoTareas = useMemo(() => crearTonoMaster(PAQUETE_TAREAS, COLOR_PAQUETE_TAREAS).acento, []);

  const tareasHoy = consultaHoy.data ?? [];
  const completadosHoy = tareasHoy.filter((tarea) => tarea.completada).length;
  const totalHoy = tareasHoy.length;
  const porcentajeHoy = totalHoy ? Math.round((completadosHoy * 100) / totalHoy) : 0;

  function alternarVista(vista: VistaPanel) {
    setVistaPanel((actual) => (actual === vista ? 'hoy' : vista));
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'progresion' || id === 'recordatorios' || id === 'insights') { alternarVista(id); return; }
    setCrearAbierto(true);
  }

  return (
    <>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="amarillo" />
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <Pressable accessibilityLabel={t('tareas.pantalla.volverAlInicio')} onPress={() => router.navigate('/(principal)/hoy')} style={s.botonVolverHub}>
                  <ChevronLeft color={acentoTareas} size={24} />
                </Pressable>
                <View style={s.headerIzq}>
                  <Texto style={s.headerSaludo}>{t('habitos.pantalla.greeting')}</Texto>
                  <View style={s.nombreFila}>
                    <Texto style={s.headerNombre}>{t('tareas.pantalla.titulo')}</Texto>
                    <Image source={require('../../../../assets/icons/hoy/saludo.png')} style={s.saludoIcono} />
                  </View>
                </View>
              </View>
              <View style={s.headerDer}>
                <Rebote accessibilityLabel={t('habitos.pantalla.buyGems')} onPress={() => router.navigate('/(principal)/tienda')} estilo={s.statPill}>
                  <View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View>
                </Rebote>
                <Rebote accessibilityLabel={t('habitos.pantalla.notifications')} onPress={() => Linking.openSettings()}>
                  <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
                </Rebote>
              </View>
            </View>

            <View style={s.heroInicio}>
              <View style={s.heroColIzq}>
                <MasterGlass style={s.rachaCard}>
                  <View style={s.rachaTop}>
                    {consultaMejorRacha.data ? (
                      <View style={s.rachaIconoFondo}><IconoTareaVisual color={acentoTareas} id={consultaMejorRacha.data.iconoLucide} size={22} /></View>
                    ) : (
                      <View style={s.rachaIconoFondo}><MasterIcon alTema name="rayo" size={22} /></View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Texto numberOfLines={1} style={s.rachaTitulo}>{consultaMejorRacha.data ? consultaMejorRacha.data.titulo : t('tareas.pantallaCompleta.noStreak')}</Texto>
                      <Texto style={s.rachaLabel}>{t('tareas.pantallaCompleta.streakLabel')}</Texto>
                    </View>
                    {consultaMejorRacha.data && <Texto style={[s.rachaDias, { color: acentoTareas }]}>{consultaMejorRacha.data.racha}d</Texto>}
                  </View>
                </MasterGlass>
                <MasterGlass style={s.nivelCard}>
                  <MasterIcon alTema name="trofeo" size={26} />
                  <View style={s.nivelInfo}>
                    <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('tareas.pantallaCompleta.todayTasks')}</Texto><Texto style={s.nivelXP}>{completadosHoy}/{totalHoy}</Texto></View>
                    <MasterProgressbar altura={10} porcentaje={porcentajeHoy} style={s.barraMaster} />
                  </View>
                </MasterGlass>
              </View>
              <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image resizeMode="cover" source={temaTareas.arbol} style={s.ilustracionHabitos} /></View></View>
            </View>

            <View style={s.accesosFila}>
              {ACCESOS.map((acceso) => (
                <View key={acceso.id} style={s.accesoTarjeta}>
                  <Rebote accessibilityLabel={t(`tareas.pantallaCompleta.access.${acceso.id}.label`)} onPress={() => abrirAcceso(acceso.id)}>
                    <MasterGlass style={s.accesoGlass}>
                      <MasterIcon alTema name={acceso.nombreIcono} size={32} />
                      <View style={s.accesoTexto}>
                        <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.accesoEtiqueta}>{t(`tareas.pantallaCompleta.access.${acceso.id}.label`)}</Texto>
                        <Texto numberOfLines={2} style={s.accesoDescripcion}>{t(`tareas.pantallaCompleta.access.${acceso.id}.description`)}</Texto>
                      </View>
                    </MasterGlass>
                  </Rebote>
                </View>
              ))}
            </View>
          </View>

          <MasterGlass style={s.panel}>
            {vistaPanel === 'hoy' ? (
              <View style={s.encabezadoHoy}>
                <View style={s.encabezadoHoyFila}>
                  <MasterIconBg size={70}><Image resizeMode="contain" source={temaTareas.arbusto} style={{ height: 58, width: 58 }} /></MasterIconBg>
                  <View style={{ flex: 1 }}>
                    <Texto style={s.encabezadoHoyTitulo}>{t('tareas.pantallaCompleta.viewToday')}</Texto>
                    <Texto style={s.encabezadoHoyCompletadas}>{t('tareas.pantallaCompleta.todayCompleted', { completed: completadosHoy, total: totalHoy })}</Texto>
                    <View style={s.encabezadoHoyProgresoFila}>
                      <MasterProgressbar altura={10} porcentaje={porcentajeHoy} style={s.encabezadoHoyBarra} />
                      <Texto style={[s.encabezadoHoyPorcentaje, { color: acentoTareas }]}>{porcentajeHoy}%</Texto>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.tituloFila}><View style={s.tituloConIcono}><MasterIcon alTema name={ICONOS_VISTA_PANEL[vistaPanel]} size={22} /><Texto style={s.titulo}>{vistaPanel === 'progresion' ? t('tareas.pantallaCompleta.viewProgress') : vistaPanel === 'insights' ? t('tareas.pantallaCompleta.access.insights.label') : t('tareas.pantallaCompleta.viewReminders')}</Texto></View></View>
            )}

            {vistaPanel === 'hoy' && (
              consultaHoy.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaHoy.isError ? (
                <Pressable onPress={() => consultaHoy.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <TimelineTareasHoy completandoId={completandoId} onCompletar={(tarea: TareaHoyDetalle) => completar.mutate(tarea)} tareas={tareasHoy} />
              )
            )}

            {vistaPanel === 'progresion' && (
              consultaLista.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaLista.isError ? (
                <Pressable onPress={() => consultaLista.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <ListaMisTareas completandoId={completandoId} onCompletarUnaVez={(tarea: Tarea) => completar.mutate(tarea)} tareas={consultaLista.data ?? []} />
              )
            )}

            {vistaPanel === 'recordatorios' && (
              <ListaRecordatoriosTareas
                isError={consultaRecordatorios.isError}
                isLoading={consultaRecordatorios.isLoading}
                onReintentar={() => consultaRecordatorios.refetch()}
                onSeleccionar={() => hapticSeguro('seleccion')}
                planes={consultaRecordatorios.data ?? []}
              />
            )}

            {vistaPanel === 'insights' && (
              consultaPanel.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaPanel.isError ? (
                <Pressable onPress={() => consultaPanel.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : consultaPanel.data ? (
                <View>
                  <SeccionPatronesTareas datos={consultaPanel.data.patrones.datos} estado={consultaPanel.data.patrones.estado} progreso={consultaPanel.data.patrones.progreso} />
                  <SeccionRiesgoTareas datos={consultaPanel.data.riesgo.datos} estado={consultaPanel.data.riesgo.estado} progreso={consultaPanel.data.riesgo.progreso} />
                </View>
              ) : null
            )}
          </MasterGlass>
        </ScrollView>
      </LinearGradient>
      <CrearTareaWizard
        guardando={crearPremium.isPending}
        onCerrar={() => setCrearAbierto(false)}
        onCrear={(input) => crearPremium.mutateAsync(input)}
        visible={crearAbierto}
      />
    </>
  );
}

function IconoTareaVisual({ id, color, size }: { id?: string | null; color: string; size: number }) {
  const icono = buscarIconoHabito(id);
  return icono ? <MasterIcon name={icono.id} size={size} /> : <Sparkles color={color} size={size} />;
}

const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 },
  botonVolverHub: { alignItems: 'center', height: 34, justifyContent: 'center', marginRight: 2, width: 30 },
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }, headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 }, nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 }, headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 }, saludoIcono: { height: 28, resizeMode: 'contain', width: 28 }, headerSaludo: { color: '#4B4B4B', fontFamily: 'MontserratAlternates-Medium', fontSize: 14, lineHeight: 17 }, headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 },
  statPill: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 }, statPillFila: { alignItems: 'center', flexDirection: 'row', gap: 4 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 }, statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 },
  heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' }, heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 }, ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracionHabitos: { height: '100%', width: '100%' },
  rachaCard: { borderRadius: 18, gap: 8, padding: 10 }, rachaTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 }, rachaIconoFondo: { alignItems: 'center', backgroundColor: conAlfa(esc.jade.l70, 0.14), borderRadius: 10, height: 30, justifyContent: 'center', width: 30 }, rachaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14 }, rachaTitulo: { color: '#1A1A1A', fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 16 }, rachaDias: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  nivelCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 }, nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11 }, barraMaster: { marginTop: 2 },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 }, accesoTarjeta: { flex: 1 }, accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 }, accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' }, accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' }, accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 }, tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 }, titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 18, textAlign: 'center' },
  encabezadoHoy: { marginBottom: 14 }, encabezadoHoyFila: { alignItems: 'center', flexDirection: 'row', gap: 12 }, encabezadoHoyTitulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 34 }, encabezadoHoyCompletadas: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 2 }, encabezadoHoyProgresoFila: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 0 }, encabezadoHoyBarra: { flex: 1 }, encabezadoHoyPorcentaje: { fontFamily: 'MontserratAlternates-Bold', fontSize: 13, minWidth: 36, textAlign: 'right' },
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
