import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MasterAnimation, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, Texto } from '../../../diseno';
import { conAlfa, crearTonoMaster } from '../../../diseno/tema/masterColor';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { TarjetaSenderoHabito } from '../../habitos/componentes/TarjetaSenderoHabito';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { iconosHabitos } from '../../habitos/iconosHabitos';
import { obtenerAssetsPaqueteHabito } from '../../habitos/paqueteVisual.assets';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { CrearTareaHoja } from '../componentes/CrearTareaHoja';
import { asignarSemillaTarea, crearTarea } from '../tareas.servicio';

// Duplicado visual de HabitosPantalla.tsx, con el mismo esqueleto (encabezado,
// hero, accesos, panel con pestañas, tarjeta de "casi terminas") pero teñido
// de dorado en vez del verde de Hábitos — y, a propósito, SIN conectar nada
// real todavía: los números son fijos y ningún botón llama a Supabase. El
// pase de función real (crear/completar tareas de verdad) llega después,
// cuando se defina el diseño de "tipo de tarea" (kanban/checklist/simple/
// eisenhower). Hasta entonces esto es solo la referencia visual.
const PAQUETE_TAREAS = 'golden';
// No es el master_pack_color real de "golden" en la base (ese es #FCB103) —
// este es solo el color que alimenta la rotación de la paleta reactiva de
// ESTA pantalla (fondo, panel, textos secundarios, todo lo que usa esc.*),
// elegido por estética. No toca la fila real de arboles_paquetes ni el
// árbol/arbusto (son PNG fijos, no se tiñen con el tono).
const COLOR_PAQUETE_TAREAS = '#FFAE00';
// Ya no hace falta un dorado de respaldo para títulos/íconos (había uno acá,
// DORADO_OSCURO): el motor de la paleta (masterColor.ts) ahora corrige esto
// en la raíz, para cualquier paquete de la app — ver el piso de claridad y
// croma en la franja amarilla dentro de `rotarHex`. esc.jade.l34/esc.hoja.l19
// ya salen dorado saturado, no café.

type VistaPanel = 'hoy' | 'progresion' | 'recordatorios';
const ICONOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'sol', progresion: 'progreso', recordatorios: 'reloj' };

const ACCESOS = [
  { id: 'progresion', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' }, { id: 'recordatorios', nombreIcono: 'reloj' }, { id: 'insights', nombreIcono: 'estadistica' },
] as const;

// Datos de muestra: alcanza para que el layout se vea con contenido real de
// verdad (no placeholders vacíos), sin que exista todavía ninguna tabla ni
// consulta detrás.
type TareaMock = { completada: boolean; icono: string; id: string; meta: string; titulo: string };
const TAREAS_MUESTRA: TareaMock[] = [
  { completada: true, icono: 'estudiar', id: 'm1', meta: '1 vez', titulo: 'Enviar el reporte semanal' },
  { completada: true, icono: 'calendario', id: 'm2', meta: '1 vez', titulo: 'Agendar la reunión de equipo' },
  { completada: false, icono: 'idea', id: 'm3', meta: '1 vez', titulo: 'Revisar el diseño del onboarding' },
  { completada: false, icono: 'basura', id: 'm4', meta: '1 vez', titulo: 'Ordenar el escritorio' },
  { completada: false, icono: 'corazon', id: 'm5', meta: '1 vez', titulo: 'Llamar a mamá' },
];

// Envoltorio fino: solo pone el tono dorado fijo. useEscala()/useEstilosS()
// hay que llamarlos DESDE ADENTRO del Provider (en TareasPantallaContenido),
// no acá — si se llamaran en este mismo componente leerían el tema global de
// arriba (Esmeralda u otro), no el dorado que este wrapper recién arma más
// abajo. Ver la discusión que quedó en el historial de esta sesión.
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
  const { data: saldoGemas } = useSaldoGemas();
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const cliente = useQueryClient();

  // El resto de la pantalla (Hoy, Mis tareas, Recordatorios) sigue en mock —
  // eso llega con la Fase 4. Esto sí es real: crea la fila en tareas_items
  // (y le asigna la semilla elegida, si la hay) contra Supabase de verdad.
  const crear = useMutation({
    mutationFn: async (input: Parameters<typeof crearTarea>[0] & { semillaId: string | null }) => {
      const { semillaId, ...datos } = input;
      const tarea = await crearTarea(datos);
      if (semillaId) {
        await asignarSemillaTarea(semillaId, tarea.id);
        cliente.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
      }
      return tarea;
    },
    onSuccess: () => { hapticSeguro('confirmacion'); setCrearAbierto(false); },
  });

  // Fijo en dorado sin importar el tema global de la app (a diferencia de
  // Hábitos, que sigue el tema activo del usuario) — TonoDelHabito es el
  // mismo mecanismo que ya usa cada tarjeta de hábito para conservar el color
  // de SU paquete.
  const temaTareas = useMemo(() => {
    const assets = obtenerAssetsPaquete(PAQUETE_TAREAS)!;
    return { arbol: assets.etapas[6], arbusto: assets.arbusto };
  }, []);
  const acentoTareas = useMemo(() => crearTonoMaster(PAQUETE_TAREAS, COLOR_PAQUETE_TAREAS).acento, []);

  const completados = TAREAS_MUESTRA.filter((tarea) => tarea.completada).length;
  const total = TAREAS_MUESTRA.length;
  const porcentaje = total ? Math.round((completados * 100) / total) : 0;

  function sinFuncionTodavia() {
    // Toda interacción "de fondo" (crear, completar, ver detalle) es
    // deliberadamente un no-op por ahora — ver el comentario del archivo.
    hapticSeguro('seleccion');
  }

  function alternarVista(vista: VistaPanel) {
    setVistaPanel((actual) => (actual === vista ? 'hoy' : vista));
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'progresion' || id === 'recordatorios') { alternarVista(id); return; }
    if (id === 'creacion') { setCrearAbierto(true); return; }
    sinFuncionTodavia();
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
                <Animated_ style={s.headerIzq}>
                  <Texto style={s.headerSaludo}>{t('habitos.pantalla.greeting')}</Texto>
                  <View style={s.nombreFila}>
                    <Texto style={s.headerNombre}>Alejandro</Texto>
                    <Image source={require('../../../../assets/icons/hoy/saludo.png')} style={s.saludoIcono} />
                  </View>
                </Animated_>
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
                    <View style={s.rachaIconoFondo}><MasterIcon alTema name="racha" size={22} /></View>
                    <View style={{ flex: 1 }}>
                      <Texto numberOfLines={1} style={s.rachaTitulo}>{t('tareas.pantallaCompleta.streakTitle')}</Texto>
                      <Texto style={s.rachaLabel}>{t('tareas.pantallaCompleta.streakLabel')}</Texto>
                    </View>
                    <Texto style={[s.rachaDias, { color: acentoTareas }]}>3d</Texto>
                  </View>
                </MasterGlass>
                <MasterGlass style={s.nivelCard}>
                  <MasterIcon alTema name="trofeo" size={26} />
                  <View style={s.nivelInfo}>
                    <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('tareas.pantallaCompleta.todayTasks')}</Texto><Texto style={s.nivelXP}>{completados}/{total}</Texto></View>
                    <MasterProgressbar altura={10} porcentaje={porcentaje} style={s.barraMaster} />
                  </View>
                </MasterGlass>
              </View>
              <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image resizeMode="cover" source={temaTareas.arbol} style={s.ilustracionHabitos} /></View></View>
            </View>

            <View style={s.accesosFila}>
              {ACCESOS.map((acceso, indice) => (
                <Animated_ key={acceso.id} style={s.accesoTarjeta}>
                  <Rebote accessibilityLabel={t(`tareas.pantallaCompleta.access.${acceso.id}.label`)} onPress={() => abrirAcceso(acceso.id)}>
                    <MasterGlass style={s.accesoGlass}>
                      <MasterIcon alTema name={acceso.nombreIcono} size={32} />
                      <View style={s.accesoTexto}>
                        <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.accesoEtiqueta}>{t(`tareas.pantallaCompleta.access.${acceso.id}.label`)}</Texto>
                        <Texto numberOfLines={2} style={s.accesoDescripcion}>{t(`tareas.pantallaCompleta.access.${acceso.id}.description`)}</Texto>
                      </View>
                    </MasterGlass>
                  </Rebote>
                </Animated_>
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
                    <Texto style={s.encabezadoHoyCompletadas}>{t('tareas.pantallaCompleta.todayCompleted', { completed: completados, total })}</Texto>
                    <View style={s.encabezadoHoyProgresoFila}>
                      <MasterProgressbar altura={10} porcentaje={porcentaje} style={s.encabezadoHoyBarra} />
                      <Texto style={[s.encabezadoHoyPorcentaje, { color: acentoTareas }]}>{porcentaje}%</Texto>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.tituloFila}><View style={s.tituloConIcono}><MasterIcon alTema name={ICONOS_VISTA_PANEL[vistaPanel]} size={22} /><Texto style={s.titulo}>{vistaPanel === 'progresion' ? t('tareas.pantallaCompleta.viewProgress') : t('tareas.pantallaCompleta.viewReminders')}</Texto></View></View>
            )}

            {vistaPanel === 'hoy' && (
              <View>
                {TAREAS_MUESTRA.map((tarea, indice) => (
                  <FilaTareaMuestra esUltimo={indice === TAREAS_MUESTRA.length - 1} key={tarea.id} onPress={sinFuncionTodavia} tarea={tarea} />
                ))}
              </View>
            )}

            {vistaPanel === 'progresion' && (
              <ScrollView contentContainerStyle={s.carruselHabitosContenido} horizontal showsHorizontalScrollIndicator={false} style={s.carruselHabitos}>
                <MasterAnimation duracion={340}>
                  {[
                    { icono: 'estudiar', nivel: 4, racha: 5, titulo: t('tareas.pantallaCompleta.sampleTaskOne') },
                    { icono: 'calendario', nivel: 2, racha: 1, titulo: t('tareas.pantallaCompleta.sampleTaskTwo') },
                  ].map((tarea) => {
                    const icono = iconosHabitos.find((x) => x.id === tarea.icono) ?? iconosHabitos[0];
                    return (
                      <View key={tarea.titulo} style={s.tarjetaHabito}>
                        <View style={s.tarjetaHabitoContenido}>
                          <TarjetaSenderoHabito
                            assets={obtenerAssetsPaqueteHabito(PAQUETE_TAREAS, tarea.nivel)}
                            ctaTexto={t('tareas.pantallaCompleta.viewDetails')}
                            diasCompletados={[1, 2]}
                            diasProgramados={[1, 2, 3, 4, 5, 6, 7]}
                            escalaArbol={0.7}
                            icono={icono}
                            meta={1}
                            metaEtiqueta={t('tareas.pantallaCompleta.oneTime')}
                            nivel={tarea.nivel}
                            onPressCta={sinFuncionTodavia}
                            racha={tarea.racha}
                            titulo={tarea.titulo}
                            valorHoy={0}
                          />
                        </View>
                      </View>
                    );
                  })}
                </MasterAnimation>
              </ScrollView>
            )}

            {vistaPanel === 'recordatorios' && (
              <View style={s.vacio}>
                <View style={s.iconoVacio}><MasterIcon alTema name="reloj" size={72} /></View>
                <Texto style={s.vacioTitulo}>{t('tareas.pantallaCompleta.noRemindersTitle')}</Texto>
                <Texto style={s.vacioTexto}>{t('tareas.pantallaCompleta.noRemindersDescription')}</Texto>
              </View>
            )}
          </MasterGlass>

          <Rebote estilo={s.cercaniaTarjeta} onPress={sinFuncionTodavia}>
            <MasterGlass style={s.cercaniaGlass}>
              <MasterIconBg size={48}><Sparkles color={acentoTareas} size={20} /></MasterIconBg>
              <View style={{ flex: 1 }}>
                <Texto style={s.cercaniaLabel}>{t('tareas.pantallaCompleta.nearDone')}</Texto>
                <Texto style={s.cercaniaTitulo}>{t('tareas.pantallaCompleta.sampleTaskOne')}</Texto>
                <MasterProgressbar altura={10} porcentaje={80} style={s.barraMaster} />
              </View>
              <Texto style={[s.cercaniaPorcentaje, { color: acentoTareas }]}>80%</Texto>
            </MasterGlass>
          </Rebote>
        </ScrollView>
      </LinearGradient>
      {crearAbierto && (
        <CrearTareaHoja
          guardando={crear.isPending}
          onCerrar={() => setCrearAbierto(false)}
          onCrear={(input) => crear.mutate(input)}
        />
      )}
    </>
  );
}

// Placeholder liviano de Animated.View (sin la animación encadenada real de
// entrada): esta pantalla no está conectada a datos todavía, así que no hay
// nada cuya llegada "encadenar" — se deja la misma estructura visual (View
// normal) para no importar toda la maquinaria de Reanimated sin usarla.
function Animated_({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={style}>{children}</View>;
}

function FilaTareaMuestra({ esUltimo, onPress, tarea }: { esUltimo: boolean; onPress: () => void; tarea: TareaMock }) {
  const esc = useEscala();
  const s = useEstilosS();
  const icono = iconosHabitos.find((x) => x.id === tarea.icono);
  return (
    <View style={s.filaHoyContenedor}>
      <View style={s.nodoColumna}>
        <View style={[s.nodo, tarea.completada ? s.nodoCompletado : s.nodoPendiente]}>
          {tarea.completada ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
        </View>
        {!esUltimo && <View style={s.nodoLinea} />}
      </View>
      <Pressable onPress={onPress} style={s.filaHoyTarjetaContenedor}>
        <MasterGlass style={s.filaHoyTarjeta}>
          <View style={{ flex: 1 }}>
            <Texto numberOfLines={1} style={s.filaHoyTitulo}>{tarea.titulo}</Texto>
            <Texto numberOfLines={1} style={s.filaHoySubtitulo}>{tarea.meta}</Texto>
          </View>
          <MasterGlass style={s.filaHoyChevron}><ChevronRight color={esc.jade.l34} size={16} /></MasterGlass>
        </MasterGlass>
        <View style={s.filaHoyIconoFlotante}><MasterIconBg fuente={icono?.fuente} size={48}>{!icono && <Sparkles color={esc.jade.l34} size={20} />}</MasterIconBg></View>
      </Pressable>
    </View>
  );
}

const C = { texto: '#1A1335', tenue: '#7B7494', barra: '#E7E1F1', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };
const ESCALA_TARJETA_HOY = 0.6;
const ANCHO_TARJETA_HABITO = 310;
const ALTO_TARJETA_HABITO = 490;
const MARGEN_SUPERIOR_TARJETA_HABITO = 12;

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 },
  botonVolverHub: { alignItems: 'center', height: 34, justifyContent: 'center', marginRight: 2, width: 30 },
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }, headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 }, nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 }, headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 }, saludoIcono: { height: 28, resizeMode: 'contain', width: 28 }, headerSaludo: { color: '#4B4B4B', fontFamily: 'MontserratAlternates-Medium', fontSize: 14, lineHeight: 17 }, headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 },
  statPill: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 }, statPillFila: { alignItems: 'center', flexDirection: 'row', gap: 4 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 }, statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 },
  heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' }, heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 }, ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracionHabitos: { height: '100%', width: '100%' },
  rachaCard: { borderRadius: 18, gap: 8, padding: 10 }, rachaTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 }, rachaIconoFondo: { alignItems: 'center', backgroundColor: conAlfa(esc.jade.l70, 0.14), borderRadius: 10, height: 30, justifyContent: 'center', width: 30 }, rachaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14 }, rachaTitulo: { color: '#1A1A1A', fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 16 }, rachaDias: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  nivelCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 }, nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11 }, barraMaster: { marginTop: 2 },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 }, accesoTarjeta: { flex: 1 }, accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 }, accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' }, accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' }, accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },
  cercaniaTarjeta: { marginBottom: 16, marginHorizontal: 20, marginTop: 16 }, cercaniaGlass: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 }, cercaniaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }, cercaniaTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginTop: 2 }, cercaniaPorcentaje: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 }, tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 }, titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  vacio: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 28 }, iconoVacio: { marginBottom: 6 }, vacioTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, textAlign: 'center' }, vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  carruselHabitos: { marginHorizontal: -15 }, carruselHabitosContenido: { gap: 12, paddingHorizontal: 15 },
  tarjetaHabito: { height: (ALTO_TARJETA_HABITO + MARGEN_SUPERIOR_TARJETA_HABITO) * ESCALA_TARJETA_HOY, width: ANCHO_TARJETA_HABITO * ESCALA_TARJETA_HOY },
  tarjetaHabitoContenido: { height: ALTO_TARJETA_HABITO + MARGEN_SUPERIOR_TARJETA_HABITO, left: 0, position: 'absolute', top: 0, transform: [{ scale: ESCALA_TARJETA_HOY }], transformOrigin: 'top left', width: ANCHO_TARJETA_HABITO },
  filaHoyContenedor: { flexDirection: 'row' }, nodoColumna: { alignItems: 'center', marginRight: 10, width: 28 }, nodo: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28, zIndex: 1 }, nodoCompletado: { backgroundColor: esc.jade.l50 }, nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: conAlfa(esc.jade.l34, .25), borderWidth: 2 }, nodoLinea: { backgroundColor: conAlfa(esc.jade.l34, .2), bottom: -8, position: 'absolute', top: 28, width: 2 },
  filaHoyTarjetaContenedor: { flex: 1, marginBottom: 9, position: 'relative' }, filaHoyTarjeta: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 8, paddingLeft: 66, paddingRight: 6, paddingVertical: 6 }, filaHoyIconoFlotante: { left: 6, marginTop: -24, position: 'absolute', top: '50%', zIndex: 2 },
  filaHoyTitulo: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 15 }, filaHoySubtitulo: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12, marginTop: 0 }, filaHoyChevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
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
