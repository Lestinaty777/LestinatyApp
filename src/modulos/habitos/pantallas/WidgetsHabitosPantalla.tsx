import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WidgetPreview } from 'react-native-android-widget';
import {
  ArrowLeft,
  Check,
  Crown,
  HelpCircle,
  Lock,
  Smartphone,
  Sparkles,
  Pin,
} from 'lucide-react-native';

import {
  MasterButton,
  MasterChip,
  MasterGlass,
  MasterIcon,
  Texto,
} from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import { ChasisTelefonoAndroid } from '../componentes/ChasisTelefonoAndroid';
import { obtenerPanelHabitos, registrarProgresoHabito } from '../habitos.servicio';
import { buscarIconoHabito } from '../iconosHabitos';
import type { HabitoResumen } from '../tipos';
import { HabitoFocoWidget } from '../widgets/HabitoFocoWidget';
import { construirPropsHabitoFoco } from '../widgets/mapearHabitoWidget';
import { elegirHabitoParaWidget, pedirAgregarWidgetFoco } from '../widgets/widgetFoco.servicio';
import { obtenerHabitoWidgetSeleccionadoId } from '../widgets/widgetFocoAlmacen';

type TipoWidget = 'foco' | 'barra' | 'lista';

interface HabitoVisualItem {
  id: string;
  titulo: string;
  iconoId: string;
  meta: number;
  valorHoy: number;
  unidad: string;
  completado: boolean;
  color: string;
  racha: number;
}

const HABITOS_PREDETERMINADOS: HabitoVisualItem[] = [
  {
    id: 'demo-agua',
    titulo: 'Tomar 2L Agua',
    iconoId: 'tomar-agua',
    meta: 8,
    valorHoy: 6,
    unidad: 'vasos',
    completado: false,
    color: '#0284C7',
    racha: 7,
  },
  {
    id: 'demo-meditar',
    titulo: 'Meditar 10 min',
    iconoId: 'meditar',
    meta: 10,
    valorHoy: 0,
    unidad: 'min',
    completado: false,
    color: '#8B5CF6',
    racha: 12,
  },
  {
    id: 'demo-lectura',
    titulo: 'Lectura diaria',
    iconoId: 'estudiar',
    meta: 20,
    valorHoy: 15,
    unidad: 'páginas',
    completado: false,
    color: '#F59E0B',
    racha: 5,
  },
  {
    id: 'demo-ejercicio',
    titulo: 'Hacer ejercicio',
    iconoId: 'hacer-ejercicio',
    meta: 30,
    valorHoy: 30,
    unidad: 'min',
    completado: true,
    color: '#10B981',
    racha: 8,
  },
];

export function WidgetsHabitosPantalla() {
  const router = useRouter();
  const horizon = useHorizon();
  const esPro = horizon.data === 'activo';
  const { width } = useWindowDimensions();

  const [widgetSeleccionado, setWidgetSeleccionado] = useState<TipoWidget>('foco');
  const [modalAyudaVisible, setModalAyudaVisible] = useState(false);
  const queryClient = useQueryClient();

  // Consulta de hábitos reales del usuario
  const consulta = useQuery({
    queryKey: ['habitos', 'panel'],
    queryFn: () => obtenerPanelHabitos(),
  });

  const habitosReales = consulta.data?.hoy.datos ?? [];
  const tieneHabitosReales = habitosReales.length > 0;

  // Lista visual del selector horizontal — usa el catálogo demo solo cuando
  // el usuario todavía no tiene hábitos propios, así siempre hay algo que
  // mostrar. La vista previa REAL (WidgetPreview) y las acciones (elegir
  // foco, registrar avance) solo se habilitan con hábitos reales, más abajo.
  const listaHabitos: HabitoVisualItem[] = tieneHabitosReales
    ? habitosReales.map((h: HabitoResumen) => ({
        id: h.id,
        titulo: h.titulo,
        iconoId: h.iconoLucide || 'hoja',
        meta: h.meta > 0 ? h.meta : 1,
        valorHoy: h.valorHoy ?? 0,
        unidad: h.unidad || (h.tipoMeta === 'cantidad' ? 'veces' : 'veces'),
        completado: h.completado,
        color: h.color || '#21A844',
        racha: h.completado ? 1 : 0,
      }))
    : HABITOS_PREDETERMINADOS;

  const [habitoActivoId, setHabitoActivoId] = useState<string>(listaHabitos[0]?.id ?? 'demo-agua');

  // Cargar hábito guardado previamente
  useEffect(() => {
    obtenerHabitoWidgetSeleccionadoId().then((guardadoId: string | null) => {
      if (guardadoId && listaHabitos.some((h) => h.id === guardadoId)) {
        setHabitoActivoId(guardadoId);
      }
    });
  }, [listaHabitos]);

  const habitoActivo =
    listaHabitos.find((h) => h.id === habitoActivoId) ?? listaHabitos[0] ?? HABITOS_PREDETERMINADOS[0];
  // El mismo hábito, pero como HabitoResumen real (si existe) — es lo único
  // que puede alimentar el widget real, nunca el catálogo demo.
  const habitoActivoReal = habitosReales.find((h) => h.id === habitoActivo.id);

  async function cambiarHabitoFoco(id: string) {
    hapticSeguro('seleccion');
    setHabitoActivoId(id);
    if (tieneHabitosReales) {
      await elegirHabitoParaWidget(id, habitosReales);
    }
  }

  // Al tocar "+" en la vista previa: registra avance real usando el mismo
  // criterio que el widget en el home screen (widgetTaskHandler.tsx), y
  // refresca la consulta para que la vista previa muestre el dato real
  // actualizado — no hay ninguna simulación local de por medio.
  async function alTocarVistaPrevia(evento: { clickAction: string }) {
    if (evento.clickAction !== 'INCREMENTAR' || !habitoActivoReal || habitoActivoReal.completado) return;
    hapticSeguro('confirmacion');
    const paso = habitoActivoReal.meta >= 10 ? Math.max(1, Math.round(habitoActivoReal.meta / 8)) : 1;
    const valor = habitoActivoReal.tipoMeta === 'check' ? habitoActivoReal.meta : Math.min(habitoActivoReal.meta, habitoActivoReal.valorHoy + paso);
    await registrarProgresoHabito({ fechaLocal: new Date().toISOString().slice(0, 10), habitoId: habitoActivoReal.id, valor });
    queryClient.invalidateQueries({ queryKey: ['habitos', 'panel'] });
  }

  async function agregarWidgetAlInicio() {
    hapticSeguro('seleccion');
    const aceptado = await pedirAgregarWidgetFoco();
    if (!aceptado) setModalAyudaVisible(true);
  }

  const anchoChasis = Math.min(width - 32, 330);

  return (
    <LinearGradient
      colors={['#F7FDF7', '#E8F7E9', '#D5F2D8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.raiz}
    >
      <SafeAreaView edges={['top', 'bottom']} style={s.safeArea}>
        {/* Cabecera */}
        <View style={s.header}>
          <Pressable
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={s.botonVolver}
          >
            <ArrowLeft color="#1E5430" size={24} strokeWidth={2.4} />
          </Pressable>

          <View style={s.headerTexto}>
            <View style={s.sobrelineaFila}>
              <Texto style={s.sobrelinea}>LESTINATY PRO</Texto>
              {esPro ? (
                <View style={s.badgeProActivo}>
                  <Check color="#FFFFFF" size={10} strokeWidth={3} />
                  <Texto style={s.badgeProTexto}>Activo</Texto>
                </View>
              ) : (
                <View style={s.badgeProBloqueado}>
                  <Lock color="#6A29C2" size={10} strokeWidth={2.5} />
                  <Texto style={[s.badgeProTexto, { color: '#6A29C2' }]}>Exclusivo Pro</Texto>
                </View>
              )}
            </View>
            <Texto style={s.titulo}>Widgets de Hábitos</Texto>
          </View>

          <Pressable
            hitSlop={12}
            onPress={() => setModalAyudaVisible(true)}
            style={s.botonAyuda}
          >
            <HelpCircle color="#2B7846" size={22} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.contenidoScroll}
        >
          <Texto style={s.subtitulo}>
            Registra y visualiza tus hábitos directamente en la pantalla de inicio de tu celular.
          </Texto>

          {/* Selector de formato de widget de hábitos */}
          <View style={s.chipsContenedor}>
            <MasterChip
              activo={widgetSeleccionado === 'foco'}
              icono={<MasterIcon name="tomar-agua" color={2} size={16} />}
              texto="2×2 Hábito Foco"
              onPress={() => {
                hapticSeguro('seleccion');
                setWidgetSeleccionado('foco');
              }}
            />
            <MasterChip
              activo={widgetSeleccionado === 'barra'}
              icono={<MasterIcon name="hoja2" color={2} size={16} />}
              texto="4×1 Progreso"
              onPress={() => {
                hapticSeguro('seleccion');
                setWidgetSeleccionado('barra');
              }}
            />
            <MasterChip
              activo={widgetSeleccionado === 'lista'}
              icono={<MasterIcon name="progreso" color={2} size={16} />}
              texto="4×2 Mis Hábitos"
              onPress={() => {
                hapticSeguro('seleccion');
                setWidgetSeleccionado('lista');
              }}
            />
          </View>

          {/* Selector de hábito individual para el widget 2x2 */}
          {widgetSeleccionado === 'foco' && (
            <View style={s.seccionSelectorHabito}>
              <View style={s.selectorHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pin color="#21A844" size={14} />
                  <Texto style={s.selectorTitulo}>Elige qué hábito anclar al widget:</Texto>
                </View>
                <Texto style={s.selectorSubtitulo}>
                  Toca cualquier hábito para ver cómo luce en tu pantalla y configurarlo
                </Texto>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.listaHabitosSelector}
              >
                {listaHabitos.map((item) => {
                  const seleccionado = item.id === habitoActivo.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => cambiarHabitoFoco(item.id)}
                      style={[
                        s.cardHabitoOpcion,
                        seleccionado && s.cardHabitoOpcionActiva,
                      ]}
                    >
                      <View
                        style={[
                          s.iconoHabitoOpcion,
                          { backgroundColor: `${item.color}18` },
                        ]}
                      >
                        {buscarIconoHabito(item.iconoId) ? (
                          <Image
                            source={buscarIconoHabito(item.iconoId)!.fuente}
                            style={{ width: 20, height: 20, resizeMode: 'contain' }}
                          />
                        ) : (
                          <Texto style={{ color: item.color, fontSize: 13, fontWeight: 'bold' }}>
                            {item.titulo.charAt(0).toUpperCase()}
                          </Texto>
                        )}
                      </View>
                      <View style={{ maxWidth: 115 }}>
                        <Texto
                          numberOfLines={1}
                          style={[
                            s.tituloHabitoOpcion,
                            seleccionado && s.tituloHabitoOpcionActivo,
                          ]}
                        >
                          {item.titulo}
                        </Texto>
                        <Texto style={s.subHabitoOpcion}>
                          {item.valorHoy}/{item.meta} {item.unidad}
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
            </View>
          )}

          {/* Indicación de interactividad */}
          <View style={s.bannerInteractividad}>
            <Sparkles color="#21A844" size={14} />
            <Texto style={s.bannerInteractividadTexto}>
              Pruébalo en vivo: interactúa con el widget dentro del teléfono
            </Texto>
          </View>

          {/* Chasis Fotorrealista de Teléfono Android */}
          <ChasisTelefonoAndroid ancho={anchoChasis} alto={590}>
            {widgetSeleccionado === 'foco' && (
              habitoActivoReal ? (
                // WidgetPreview renderiza el MISMO componente que se dibuja en
                // el home screen real (HabitoFocoWidget) — no hay ninguna
                // maqueta aparte que se pueda desincronizar de lo real.
                <WidgetPreview
                  height={175}
                  onClick={alTocarVistaPrevia}
                  renderWidget={() => <HabitoFocoWidget {...construirPropsHabitoFoco(habitoActivoReal)} />}
                  width={175}
                />
              ) : (
                <View style={s.previewVacio}>
                  <Sparkles color="#21A844" size={20} />
                  <Texto style={s.previewVacioTexto}>Crea tu primer hábito para ver el widget en acción</Texto>
                </View>
              )
            )}

            {(widgetSeleccionado === 'barra' || widgetSeleccionado === 'lista') && (
              <View style={s.previewVacio}>
                <Sparkles color="#21A844" size={20} />
                <Texto style={s.previewVacioTexto}>Muy pronto</Texto>
              </View>
            )}
          </ChasisTelefonoAndroid>

          {/* Tarjeta explicativa del widget activo */}
          <MasterGlass style={s.infoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles color="#21A844" size={18} />
              <Texto style={s.infoTitulo}>
                {widgetSeleccionado === 'foco'
                  ? `Widget 2×2: ${habitoActivo.titulo}`
                  : widgetSeleccionado === 'barra'
                  ? 'Widget 4×1: Constancia Diaria (muy pronto)'
                  : 'Widget 4×2: Panel de Hábitos (muy pronto)'}
              </Texto>
            </View>
            <Texto style={s.infoDescripcion}>
              {widgetSeleccionado === 'foco'
                ? `Ancla cualquier hábito individual en tu pantalla de inicio con su racha y su meta de hoy. Al tocar "+" registras avance real al instante, sin abrir la app.`
                : widgetSeleccionado === 'barra'
                ? 'Una barra panorámica que resume tus hábitos completados hoy y el porcentaje de avance. Todavía en construcción.'
                : 'Tu lista de hábitos de hoy con casillas táctiles en tu pantalla de inicio. Todavía en construcción.'}
            </Texto>
          </MasterGlass>
        </ScrollView>

        {/* Barra de acción fija al pie (CTA) */}
        <View style={s.pieCta}>
          {esPro ? (
            <MasterButton
              color="#21A844"
              onPress={agregarWidgetAlInicio}
              iconoIzquierda={({ size }) => <Smartphone color="#FFF" size={size} />}
              iconoSize={18}
            >
              Agregar a mi pantalla de inicio
            </MasterButton>
          ) : (
            <View style={{ gap: 8 }}>
              <MasterButton
                color="#6A29C2"
                onPress={() => {
                  hapticSeguro('seleccion');
                  router.push('/horizon');
                }}
                iconoIzquierda={({ size }) => <Crown color="#FFF" size={size} />}
                iconoSize={18}
              >
                Desbloquear con Lestinaty Pro
              </MasterButton>
              <Texto style={s.pieNota}>
                Disponible con suscripción Lestinaty Pro · Cancela cuando quieras
              </Texto>
            </View>
          )}
        </View>

        {/* Modal de instrucciones para Android */}
        <Modal
          animationType="slide"
          transparent
          visible={modalAyudaVisible}
          onRequestClose={() => setModalAyudaVisible(false)}
        >
          <View style={s.modalFondo}>
            <MasterGlass style={s.modalCaja}>
              <View style={s.modalCabecera}>
                <Smartphone color="#21A844" size={24} />
                <Texto style={s.modalTitulo}>Añadir widgets en Android</Texto>
              </View>

              <View style={s.modalPasos}>
                <PasoInstruccion
                  numero="1"
                  texto="En la pantalla de inicio de tu celular, mantén presionado cualquier espacio vacío."
                />
                <PasoInstruccion
                  numero="2"
                  texto="Toca la opción 'Widgets' en el menú flotante inferior."
                />
                <PasoInstruccion
                  numero="3"
                  texto="Busca 'Lestinaty' en la lista. Si añades el Widget Foco 2×2, podrás elegir cuál de tus hábitos quieres anclar."
                />
                <PasoInstruccion
                  numero="4"
                  texto="Mantenlo presionado y colócalo en el lugar perfecto de tu inicio."
                />
              </View>

              <MasterButton
                color="#21A844"
                onPress={() => setModalAyudaVisible(false)}
              >
                Entendido
              </MasterButton>
            </MasterGlass>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Componente auxiliar: Paso de Instrucción ──────────────────────────────────
function PasoInstruccion({ numero, texto }: { numero: string; texto: string }) {
  return (
    <View style={pi.fila}>
      <View style={pi.numero}>
        <Texto style={pi.numeroTexto}>{numero}</Texto>
      </View>
      <Texto style={pi.texto}>{texto}</Texto>
    </View>
  );
}

const pi = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  numero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#21A844',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  texto: {
    flex: 1,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#1A3320',
    lineHeight: 18,
  },
});

// ── Estilos generales ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  botonVolver: {
    padding: 6,
  },
  botonAyuda: {
    padding: 6,
  },
  headerTexto: {
    flex: 1,
  },
  sobrelineaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sobrelinea: {
    color: '#3B9858',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  badgeProActivo: {
    backgroundColor: '#21A844',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  badgeProBloqueado: {
    backgroundColor: 'rgba(106, 41, 194, 0.12)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  badgeProTexto: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
  },
  titulo: {
    color: '#1A3320',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    lineHeight: 26,
    marginTop: 2,
  },
  subtitulo: {
    color: '#5B8C65',
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  contenidoScroll: {
    paddingBottom: 24,
  },
  chipsContenedor: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
  },
  seccionSelectorHabito: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 168, 68, 0.15)',
  },
  selectorHeader: {
    marginBottom: 10,
    gap: 2,
  },
  selectorTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12.5,
    color: '#1A3320',
  },
  selectorSubtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#5B8C65',
  },
  listaHabitosSelector: {
    gap: 8,
    paddingRight: 8,
  },
  cardHabitoOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(33, 168, 68, 0.2)',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardHabitoOpcionActiva: {
    backgroundColor: '#FFFFFF',
    borderColor: '#21A844',
    boxShadow: '0 2px 8px rgba(33, 168, 68, 0.2)',
  },
  iconoHabitoOpcion: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloHabitoOpcion: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11.5,
    color: '#2B4A34',
  },
  tituloHabitoOpcionActivo: {
    color: '#143D1F',
  },
  subHabitoOpcion: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 9.5,
    color: '#5B8C65',
    marginTop: 1,
  },
  checkSeleccionado: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#21A844',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  bannerInteractividad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bannerInteractividadTexto: {
    color: '#2B7846',
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
  },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    gap: 6,
  },
  previewVacio: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: 175,
    height: 175,
  },
  previewVacioTexto: {
    color: '#5B8C65',
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  infoTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    color: '#1A3320',
  },
  infoDescripcion: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#5B8C65',
    lineHeight: 17,
  },
  pieCta: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  pieNota: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCaja: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    gap: 18,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 17,
    color: '#1A3320',
  },
  modalPasos: {
    gap: 14,
  },
});
