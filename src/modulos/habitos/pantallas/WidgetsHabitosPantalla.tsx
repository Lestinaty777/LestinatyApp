import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Crown, Smartphone } from 'lucide-react-native';

import { MasterButton, MasterChip, MasterGlass, MasterIcon, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { ChasisTelefonoAndroid } from '../componentes/ChasisTelefonoAndroid';
import { obtenerDetallesHabitosHoy, obtenerDiasCompletadosMes, obtenerHabitosActivos, registrarProgresoHabito } from '../habitos.servicio';
import { obtenerAssetsPaqueteHabito } from '../paqueteVisual.assets';
import { pedirAgregarWidgetCalendario } from '../widgets/widgetCalendario.servicio';
import { elegirHabitoParaWidget, pedirAgregarWidgetFoco } from '../widgets/widgetFoco.servicio';
import { obtenerHabitoWidgetSeleccionadoId } from '../widgets/widgetFocoAlmacen';
import { VistaPreviaWidgetCalendario } from '../widgets/VistaPreviaWidgetCalendario';
import { VistaPreviaWidgetHabito } from '../widgets/VistaPreviaWidgetHabito';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

type TipoWidget = 'habito' | 'calendario';

export function WidgetsHabitosPantalla() {
  const esc = useEscala();
  const s = useEstilosS();
  const router = useRouter();
  const horizon = useHorizon();
  const esPro = horizon.data === 'activo';
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [widgetSeleccionado, setWidgetSeleccionado] = useState<TipoWidget>('habito');
  const [modalAyudaVisible, setModalAyudaVisible] = useState(false);
  const [habitoActivoId, setHabitoActivoId] = useState<string | null>(null);

  // Únicamente hábitos reales del usuario — sin catálogo demo: si no hay
  // ninguno, la pantalla lo dice y ofrece crear uno, no inventa datos.
  // obtenerHabitosActivos() trae TODOS los hábitos activos sin filtrar por
  // el día (a diferencia de obtenerPanelHabitos(), que solo trae los de
  // hoy) — tiene sentido poder anclar al widget un hábito que hoy no toque,
  // para verlo el día que sí le toca.
  const consultaHabitos = useQuery({ queryKey: ['habitos', 'activos'], queryFn: () => obtenerHabitosActivos() });
  const consultaDetalles = useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy() });
  const consultaMes = useQuery({ queryKey: ['habitos', 'dias-completados-mes'], queryFn: () => obtenerDiasCompletadosMes() });

  const habitosReales = consultaHabitos.data ?? [];
  const tieneAlgunHabito = habitosReales.length > 0;
  const idsHabitos = habitosReales.map((h) => h.id).join(',');

  useEffect(() => {
    if (!tieneAlgunHabito) return;
    obtenerHabitoWidgetSeleccionadoId().then((guardadoId) => {
      const valido = guardadoId && habitosReales.some((h) => h.id === guardadoId);
      setHabitoActivoId(valido ? guardadoId! : habitosReales[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tieneAlgunHabito, idsHabitos]);

  const habitoActivo = habitosReales.find((h) => h.id === habitoActivoId) ?? habitosReales[0] ?? null;
  const detalleActivo = consultaDetalles.data?.find((d) => d.habitoId === habitoActivo?.id);
  const imagenEtapaActivo = habitoActivo
    ? obtenerAssetsPaqueteHabito(habitoActivo.paqueteId, detalleActivo?.nivel ?? 1).arbolPrincipal
    : null;

  async function cambiarHabitoFoco(id: string) {
    hapticSeguro('seleccion');
    setHabitoActivoId(id);
    await elegirHabitoParaWidget(id, habitosReales, esPro);
  }

  // Al tocar "+" en la vista previa: registra avance real, tal como haría el widget de verdad.
  async function alTocarVistaPrevia() {
    if (!habitoActivo || habitoActivo.completado) return;
    hapticSeguro('confirmacion');
    const paso = habitoActivo.meta >= 10 ? Math.max(1, Math.round(habitoActivo.meta / 8)) : 1;
    const valor = habitoActivo.tipoMeta === 'check' ? habitoActivo.meta : Math.min(habitoActivo.meta, habitoActivo.valorHoy + paso);
    await registrarProgresoHabito({ fechaLocal: fechaLocalHoy(), habitoId: habitoActivo.id, valor });
    queryClient.invalidateQueries({ queryKey: ['habitos', 'panel'] });
    queryClient.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
  }

  async function agregarWidgetAlInicio() {
    hapticSeguro('seleccion');
    const aceptado = widgetSeleccionado === 'habito' ? await pedirAgregarWidgetFoco() : await pedirAgregarWidgetCalendario();
    if (!aceptado) setModalAyudaVisible(true);
  }

  const anchoChasis = Math.min(width - 32, 330);
  const hoy = new Date();

  return (
    <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.raiz}>
      {/* Aurora de fondo real: cubre TODA la pantalla, detrás de todo — nunca
          metida en una caja chica que la recorte, igual que el slide 5. */}
      <View pointerEvents="none" style={s.fondoAurora}>
        <AuroraBoreal tema="verde" />
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={s.safeArea}>
        <View style={s.header}>
          <Pressable accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()} style={s.botonHeader}>
            <ArrowLeft color={esc.jade.l34a} size={22} strokeWidth={2.4} />
          </Pressable>
          <Pressable accessibilityLabel="Ayuda" hitSlop={12} onPress={() => setModalAyudaVisible(true)} style={s.botonHeader}>
            <MasterIcon color={2} name="preguntas" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <MasterGlass style={s.panel}>
            <View style={s.hero}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')}
                style={s.heroImagen}
              />
            </View>

            <Texto style={s.titulo}>{tieneAlgunHabito ? 'Widgets de hábitos' : 'Todavía no tenés hábitos'}</Texto>
            <Texto style={s.subtitulo}>
              {tieneAlgunHabito
                ? 'Anclá tus hábitos a la pantalla de inicio y registrá tu avance sin abrir la app.'
                : 'Creá tu primer hábito para desbloquear los widgets de tu pantalla de inicio.'}
            </Texto>

            <LinearGradient
              colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.separador}
            />

            {!esPro && (
              <View style={s.badgePro}>
                <MasterIcon color={7} name="candado" size={11} />
                <Texto style={s.badgeProTexto}>Exclusivo Horizon</Texto>
              </View>
            )}

            {!tieneAlgunHabito ? (
              <View style={s.estadoVacio}>
                <View style={s.cajaDetalles}>
                  <View style={s.filaBeneficio}>
                    <View style={s.iconoBeneficioContenedor}>
                      <MasterIcon color={2} name="hoja" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Texto style={s.tituloBeneficio}>Widget de hábito</Texto>
                      <Texto style={s.descBeneficio}>La etapa de tu árbol y tu semana, con un botón para registrar avance al toque.</Texto>
                    </View>
                  </View>

                  <View style={s.divisorInterno} />

                  <View style={s.filaBeneficio}>
                    <View style={s.iconoBeneficioContenedor}>
                      <MasterIcon color={2} name="calendario" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Texto style={s.tituloBeneficio}>Widget de calendario</Texto>
                      <Texto style={s.descBeneficio}>Un vistazo al mes: un punto verde por cada día que cumpliste algo.</Texto>
                    </View>
                  </View>
                </View>

                <MasterButton
                  color={esc.hoja.l61a}
                  onPress={() => {
                    hapticSeguro('seleccion');
                    router.push({ pathname: '/(principal)/hoy', params: { abrirCreacion: '1' } });
                  }}
                  style={s.botonEstadoVacio}
                >
                  Crear mi primer hábito
                </MasterButton>
              </View>
            ) : (
              <>
                <View style={s.chips}>
                  <MasterChip
                    activo={widgetSeleccionado === 'habito'}
                    icono={<MasterIcon color={2} name="hoja" size={15} />}
                    texto="Hábito"
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setWidgetSeleccionado('habito');
                    }}
                  />
                  <MasterChip
                    activo={widgetSeleccionado === 'calendario'}
                    icono={<MasterIcon color={2} name="calendario" size={15} />}
                    texto="Calendario"
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setWidgetSeleccionado('calendario');
                    }}
                  />
                </View>

                {widgetSeleccionado === 'habito' && (
                  <ScrollView
                    contentContainerStyle={s.listaHabitosSelector}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.selectorScroll}
                  >
                    {habitosReales.map((item) => {
                      const seleccionado = item.id === habitoActivo?.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => cambiarHabitoFoco(item.id)}
                          style={[s.cardHabitoOpcion, seleccionado && s.cardHabitoOpcionActiva]}
                        >
                          <View style={[s.iconoHabitoOpcion, { backgroundColor: `${item.color || esc.hoja.l61a}18` }]}>
                            <Texto style={{ color: item.color || esc.hoja.l61a, fontFamily: 'Montserrat-Bold', fontSize: 13 }}>
                              {item.titulo.charAt(0).toUpperCase()}
                            </Texto>
                          </View>
                          <View style={{ maxWidth: 115 }}>
                            <Texto numberOfLines={1} style={[s.tituloHabitoOpcion, seleccionado && s.tituloHabitoOpcionActivo]}>
                              {item.titulo}
                            </Texto>
                            <Texto style={s.subHabitoOpcion}>
                              {item.valorHoy}/{item.meta} {item.unidad || ''}
                            </Texto>
                          </View>
                          {seleccionado && (
                            <View style={s.checkSeleccionado}>
                              <Check color="#FFFFFF" size={10} strokeWidth={3.5} />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <View style={s.bannerInteractividad}>
                  <MasterIcon color={2} name="idea" size={16} />
                  <Texto style={s.bannerInteractividadTexto}>Pruébalo en vivo: interactuá con el widget dentro del teléfono</Texto>
                </View>

                <ChasisTelefonoAndroid ancho={anchoChasis} alto={570}>
                  {widgetSeleccionado === 'habito' && habitoActivo && imagenEtapaActivo && (
                    <View style={s.previewHabitoContenedor}>
                      <VistaPreviaWidgetHabito
                        completado={habitoActivo.completado}
                        diasCompletadosSemana={detalleActivo?.diasCompletadosSemana ?? []}
                        diasProgramados={detalleActivo?.diasProgramados ?? []}
                        imagenEtapa={imagenEtapaActivo}
                        onIncrementar={alTocarVistaPrevia}
                        racha={detalleActivo?.racha ?? 0}
                        titulo={habitoActivo.titulo}
                      />
                    </View>
                  )}

                  {widgetSeleccionado === 'calendario' && (
                    <View style={s.previewCalendarioContenedor}>
                      <VistaPreviaWidgetCalendario
                        anio={hoy.getFullYear()}
                        diasCompletados={consultaMes.data?.diasCompletados ?? []}
                        mes={hoy.getMonth() + 1}
                      />
                    </View>
                  )}
                </ChasisTelefonoAndroid>

                <MasterGlass style={s.infoCard}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <MasterIcon color={2} name="idea" size={18} />
                    <Texto style={s.infoTitulo}>
                      {widgetSeleccionado === 'habito'
                        ? (habitoActivo ? `Widget: ${habitoActivo.titulo}` : 'Widget de hábito')
                        : 'Widget: Calendario mensual'}
                    </Texto>
                  </View>
                  <Texto style={s.infoDescripcion}>
                    {widgetSeleccionado === 'habito'
                      ? 'Muestra la etapa actual de tu árbol, el nombre del hábito y tu semana — tocá "+" para registrar avance sin abrir la app.'
                      : 'Un vistazo al mes: un punto verde marca cada día en el que cumpliste al menos un hábito.'}
                  </Texto>
                </MasterGlass>

                {/* Mención informativa — el cronómetro con notificación es un
                    sistema aparte (no un widget que se ancla), por eso no
                    tiene su propia vista previa acá, solo este aviso. */}
                <MasterGlass style={s.infoCard}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <MasterIcon color={2} name="reloj" size={18} />
                    <Texto style={s.infoTitulo}>¿Sabías que también hay un cronómetro con notificación?</Texto>
                  </View>
                  <Texto style={s.infoDescripcion}>
                    Para hábitos de tipo "duración" (como meditar), iniciá el cronómetro desde Senderos y seguí tu sesión con
                    una notificación en vivo, incluso con la pantalla bloqueada.
                  </Texto>
                </MasterGlass>
              </>
            )}
          </MasterGlass>
        </ScrollView>

        {tieneAlgunHabito && (
          <View style={s.pieCta}>
            {esPro ? (
              <MasterButton
                color={esc.hoja.l61a}
                iconoIzquierda={({ size }) => <Smartphone color="#FFF" size={size} />}
                iconoSize={18}
                onPress={agregarWidgetAlInicio}
              >
                Agregar a mi pantalla de inicio
              </MasterButton>
            ) : (
              <View style={{ gap: 8 }}>
                <MasterButton
                  color="#6A29C2"
                  iconoIzquierda={({ size }) => <Crown color="#FFF" size={size} />}
                  iconoSize={18}
                  onPress={() => {
                    hapticSeguro('seleccion');
                    router.push('/horizon');
                  }}
                >
                  Desbloquear con Lestinaty Pro
                </MasterButton>
                <Texto style={s.pieNota}>Disponible con suscripción Lestinaty Pro · Cancela cuando quieras</Texto>
              </View>
            )}
          </View>
        )}

        <Modal animationType="slide" onRequestClose={() => setModalAyudaVisible(false)} transparent visible={modalAyudaVisible}>
          <View style={s.modalFondo}>
            <MasterGlass style={s.modalCaja}>
              <View style={s.modalCabecera}>
                <Smartphone color={esc.hoja.l61a} size={24} />
                <Texto style={s.modalTitulo}>Añadir widgets en Android</Texto>
              </View>

              <View style={s.modalPasos}>
                <PasoInstruccion numero="1" texto="En la pantalla de inicio de tu celular, mantén presionado cualquier espacio vacío." />
                <PasoInstruccion numero="2" texto="Toca la opción 'Widgets' en el menú flotante inferior." />
                <PasoInstruccion numero="3" texto="Busca 'Lestinaty' en la lista y elegí el widget de Hábito o el de Calendario." />
                <PasoInstruccion numero="4" texto="Mantenlo presionado y colócalo en el lugar perfecto de tu inicio." />
              </View>

              <MasterButton color={esc.hoja.l61a} onPress={() => setModalAyudaVisible(false)}>
                Entendido
              </MasterButton>
            </MasterGlass>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PasoInstruccion({ numero, texto }: { numero: string; texto: string }) {
  const pi = useEstilosPi();
  return (
    <View style={pi.fila}>
      <View style={pi.numero}>
        <Texto style={pi.numeroTexto}>{numero}</Texto>
      </View>
      <Texto style={pi.texto}>{texto}</Texto>
    </View>
  );
}

const crearEstilosPi = (esc: EscalaMaster) => StyleSheet.create({
  fila: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  numero: { alignItems: 'center', backgroundColor: esc.hoja.l61a, borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  numeroTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  texto: { color: esc.hoja.l19, flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 18 },
});

const estilosPorEscalaPi = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosPi>>();

function useEstilosPi() {
  const esc = useEscala();
  let valor = estilosPorEscalaPi.get(esc);
  if (!valor) {
    valor = crearEstilosPi(esc);
    estilosPorEscalaPi.set(esc, valor);
  }
  return valor;
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  botonHeader: { padding: 6 },
  scroll: { paddingBottom: 24, paddingHorizontal: 16 },
  fondoAurora: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  panel: { alignItems: 'center', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 26 },
  hero: { alignItems: 'center', height: 70, justifyContent: 'center', marginBottom: -4, width: 90 },
  heroImagen: { height: 62, width: 62 },
  titulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, textAlign: 'center' },
  subtitulo: { color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 4, textAlign: 'center' },
  separador: { alignSelf: 'center', borderRadius: 1, height: 1.5, marginTop: 14, width: 64 },
  badgePro: {
    alignItems: 'center', backgroundColor: 'rgba(106, 41, 194, 0.12)', borderRadius: 8, flexDirection: 'row',
    gap: 5, marginTop: 12, paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeProTexto: { color: '#6A29C2', fontFamily: 'Montserrat-Bold', fontSize: 10 },
  estadoVacio: { gap: 14, marginTop: 20, width: '100%' },
  cajaDetalles: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)', borderColor: conAlfa(esc.jade.l50, 0.14), borderRadius: 18,
    borderWidth: 1, gap: 10, paddingHorizontal: 14, paddingVertical: 12, width: '100%',
  },
  filaBeneficio: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  iconoBeneficioContenedor: {
    alignItems: 'center', backgroundColor: conAlfa(esc.jade.l50, 0.08), borderColor: conAlfa(esc.jade.l50, 0.18),
    borderRadius: 12, borderWidth: 1, height: 34, justifyContent: 'center', width: 34,
  },
  tituloBeneficio: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 12.5, marginBottom: 1 },
  descBeneficio: { color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 15 },
  divisorInterno: { backgroundColor: conAlfa(esc.jade.l50, 0.09), height: 1, width: '100%' },
  botonEstadoVacio: { width: '100%' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' },
  selectorScroll: { marginTop: 14, width: '100%' },
  listaHabitosSelector: { gap: 8, paddingRight: 8 },
  cardHabitoOpcion: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: conAlfa(esc.hoja.l61a, 0.2),
    borderRadius: 13, borderWidth: 1.5, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  cardHabitoOpcionActiva: { backgroundColor: '#FFFFFF', borderColor: esc.hoja.l61a },
  iconoHabitoOpcion: { alignItems: 'center', borderRadius: 8, height: 28, justifyContent: 'center', width: 28 },
  tituloHabitoOpcion: { color: esc.musgo.l29, fontFamily: 'MontserratAlternates-Bold', fontSize: 11.5 },
  tituloHabitoOpcionActivo: { color: esc.hoja.l22 },
  subHabitoOpcion: { color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 9.5, marginTop: 1 },
  checkSeleccionado: { alignItems: 'center', backgroundColor: esc.hoja.l61a, borderRadius: 8, height: 16, justifyContent: 'center', marginLeft: 2, width: 16 },
  bannerInteractividad: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 14 },
  bannerInteractividadTexto: { color: esc.jade.l47, fontFamily: 'Montserrat-Medium', fontSize: 11 },
  previewHabitoContenedor: { alignItems: 'center', height: 210, justifyContent: 'center', width: 170 },
  previewCalendarioContenedor: { height: 220, width: 220 },
  infoCard: { borderRadius: 14, gap: 6, marginTop: 18, padding: 14, width: '100%' },
  infoTitulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  infoDescripcion: { color: esc.musgo.l54, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  pieCta: { backgroundColor: 'rgba(255,255,255,0.7)', borderTopColor: 'rgba(0,0,0,0.06)', borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  pieNota: { color: '#6B7280', fontFamily: 'Montserrat-Medium', fontSize: 11, textAlign: 'center' },
  modalFondo: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'center', padding: 24 },
  modalCaja: { borderRadius: 20, gap: 18, padding: 20, width: '100%' },
  modalCabecera: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  modalTitulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 17 },
  modalPasos: { gap: 14 },
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
