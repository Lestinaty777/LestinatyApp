import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  ChevronRight,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import {
  Boton,
  CampoTexto,
  entradaEncadenada,
  MasterButton,
  MasterChip,
  MasterGlass,
  MasterIcon,
  MasterIconBg,
  MasterProgressbar,
  Rebote,
  Skeleton,
  Texto,
} from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import { restaurarHorizon } from '../../../nucleo/compras/horizon';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import {
  actualizarPerfil,
  actualizarPermisosDatos,
  actualizarPreferenciaNotificacion,
  cargarConfiguracion,
  crearSolicitudPrivacidad,
} from '../../configuracion/configuracion.servicio';
import {
  ConfiguracionUsuario,
  PermisosDatos,
  TipoSolicitudPrivacidad,
} from '../../configuracion/configuracion.tipos';
import { etiquetaSolicitudActiva, formatearFechaConfiguracion } from '../../configuracion/configuracion.presentacion';
import { cerrarSesion, recuperarAcceso } from '../../acceso/acceso.servicio';
import { obtenerHabitoMejorRacha, obtenerPanelHabitos, obtenerResumenPlanesHabitos } from '../../habitos/habitos.servicio';

type TabPerfil = 'resumen' | 'logros' | 'ajustes';
type LlavePermiso = keyof PermisosDatos;

const PROPS_TEXTO_UNA_LINEA = {
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.65,
  ellipsizeMode: 'clip' as const,
};

const INSIGNIAS_BOTANICAS = [
  {
    nivel: 1,
    titulo: 'Semilla Despierta',
    descripcion: 'El primer paso de tu sendero consciente.',
    dias: 1,
    img: require('../../../../assets/icons/insignias/nivel1.png'),
  },
  {
    nivel: 2,
    titulo: 'Brote de Voluntad',
    descripcion: 'Tus raíces comienzan a afianzarse en la tierra.',
    dias: 3,
    img: require('../../../../assets/icons/insignias/nivel2.png'),
  },
  {
    nivel: 3,
    titulo: 'Tallo Firme',
    descripcion: 'Una semana completa de constancia inquebrantable.',
    dias: 7,
    img: require('../../../../assets/icons/insignias/nivel3.png'),
  },
  {
    nivel: 4,
    titulo: 'Rama Florecida',
    descripcion: 'Tus hábitos florecen y dan sus primeros frutos.',
    dias: 12,
    img: require('../../../../assets/icons/insignias/nivel4.png'),
  },
  {
    nivel: 5,
    titulo: 'Árbol Maduro',
    descripcion: 'Fuerza, sombra y equilibrio ante cualquier tormenta.',
    dias: 18,
    img: require('../../../../assets/icons/insignias/nivel5.png'),
  },
  {
    nivel: 6,
    titulo: 'Bosque Sagrado',
    descripcion: 'Tus senderos inspiran la armonía de la naturaleza.',
    dias: 25,
    img: require('../../../../assets/icons/insignias/nivel6.png'),
  },
  {
    nivel: 7,
    titulo: 'Espíritu Ancestral',
    descripcion: 'Maestría total y comunión con el ecosistema de vida.',
    dias: 33,
    img: require('../../../../assets/icons/insignias/nivel7.png'),
  },
];

// catalogo_notificaciones guarda códigos técnicos (snake_case) pensados para
// el backend, no para mostrar — sin este mapa se veían crudos como "habito
// recordatorio" en Ajustes.
const ETIQUETAS_AVISO: Record<string, string> = {
  habito_recordatorio: 'Recordatorios de hábitos',
  hoy_sesion_proxima: 'Sesión próxima a comenzar',
  hoy_sesion_inicio: 'Inicio de sesión programada',
  hoy_repaso_pendiente: 'Repaso pendiente',
  hoy_evaluacion_disponible: 'Evaluación disponible',
  hoy_cofre_disponible: 'Recompensa disponible',
  hoy_resumen_diario: 'Resumen diario',
  hoy_racha_recuperable: 'Sugerencia para recuperar tu racha',
};

function etiquetarAviso(codigo: string): string {
  return ETIQUETAS_AVISO[codigo] ?? codigo.replaceAll('_', ' ');
}

// Solo permisos que ya tienen una función real detrás. Los de Aby IA
// (contexto, procesamiento de fuentes) se agregan cuando exista esa IA.
const PERMISOS_CONFIG: Array<{ llave: LlavePermiso; titulo: string; descripcion: string }> = [
  {
    llave: 'permiteAnaliticaProducto',
    titulo: 'Métricas de Producto',
    descripcion: 'Telemetría agregada y anónima para optimizar Lestinaty. Nunca vendemos tus datos.',
  },
];

// ── Esqueletos de Carga para Perfil ──────────────────────────────────────────
function EsqueletoHeroCard() {
  return (
    <MasterGlass style={s.heroCard}>
      <View style={s.heroFilaPrincipal}>
        <View style={s.avatarContenedor}>
          <Skeleton alto={72} ancho={72} radio={36} />
        </View>
        <View style={[s.heroInfo, { gap: 8 }]}>
          <Skeleton alto={20} ancho={140} radio={6} />
          <Skeleton alto={12} ancho={190} radio={4} />
          <Skeleton alto={12} ancho={120} radio={4} style={{ marginTop: 2 }} />
        </View>
      </View>

      <View style={s.metricasFila}>
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={s.metricaDivisor} />}
            <View style={s.metricaItem}>
              <Skeleton alto={20} ancho={20} radio={6} />
              <Skeleton alto={14} ancho={32} radio={4} style={{ marginTop: 2 }} />
              <Skeleton alto={10} ancho={36} radio={3} />
            </View>
          </React.Fragment>
        ))}
      </View>
    </MasterGlass>
  );
}

function EsqueletoMiEspacio() {
  return (
    <View style={s.tabContenido}>
      {/* Tarjeta 1: Widgets */}
      <MasterGlass style={s.tarjetaModulo}>
        <View style={s.moduloHeader}>
          <Skeleton alto={42} ancho={42} radio={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton alto={15} ancho="70%" radio={4} />
            <Skeleton alto={11} ancho="95%" radio={3} />
            <Skeleton alto={11} ancho="60%" radio={3} />
          </View>
        </View>
        <View style={s.widgetBannersFila}>
          <Skeleton alto={26} ancho={75} radio={10} />
          <Skeleton alto={26} ancho={75} radio={10} />
          <Skeleton alto={26} ancho={75} radio={10} />
        </View>
        <Skeleton alto={44} ancho="100%" radio={14} />
      </MasterGlass>

      {/* Tarjeta 2: Pro */}
      <MasterGlass style={s.tarjetaModulo}>
        <View style={s.moduloHeader}>
          <Skeleton alto={42} ancho={42} radio={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton alto={15} ancho="65%" radio={4} />
            <Skeleton alto={11} ancho="90%" radio={3} />
            <Skeleton alto={11} ancho="70%" radio={3} />
          </View>
        </View>
        <Skeleton alto={44} ancho="100%" radio={14} />
      </MasterGlass>

      {/* Tarjeta 3: Gemas */}
      <MasterGlass style={s.tarjetaModulo}>
        <View style={s.moduloHeader}>
          <Skeleton alto={42} ancho={42} radio={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton alto={15} ancho="55%" radio={4} />
            <Skeleton alto={11} ancho="90%" radio={3} />
            <Skeleton alto={11} ancho="80%" radio={3} />
          </View>
        </View>
        <Skeleton alto={44} ancho="100%" radio={14} />
      </MasterGlass>
    </View>
  );
}

function EsqueletoInsignias() {
  return (
    <View style={s.tabContenido}>
      <View style={s.logrosHeader}>
        <Skeleton alto={16} ancho="50%" radio={4} />
        <Skeleton alto={12} ancho="80%" radio={3} style={{ marginTop: 4 }} />
      </View>
      <View style={s.insigniasGrid}>
        {[0, 1, 2, 3, 4].map((i) => (
          <MasterGlass key={i} style={s.insigniaCard}>
            <View style={s.insigniaFilaTop}>
              <Skeleton alto={44} ancho={44} radio={12} />
              <Skeleton alto={20} ancho={46} radio={8} />
            </View>
            <Skeleton alto={14} ancho="60%" radio={4} style={{ marginTop: 6 }} />
            <Skeleton alto={11} ancho="90%" radio={3} style={{ marginTop: 4 }} />
            <Skeleton alto={11} ancho="70%" radio={3} style={{ marginTop: 2 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Skeleton alto={14} ancho={14} radio={4} />
              <Skeleton alto={11} ancho={70} radio={3} />
            </View>
          </MasterGlass>
        ))}
      </View>
    </View>
  );
}

function EsqueletoAjustes() {
  return (
    <View style={s.tabContenido}>
      {/* Grupo 1: Avisos */}
      <View style={s.grupoAjustes}>
        <Skeleton alto={11} ancho={140} radio={3} style={{ marginLeft: 4 }} />
        <MasterGlass style={s.tarjetaAjustes}>
          {[0, 1, 2].map((i) => (
            <View key={i}>
              {i > 0 && <View style={s.divisorAjustes} />}
              <View style={s.filaToggle}>
                <View style={{ flex: 1, gap: 4, paddingRight: 10 }}>
                  <Skeleton alto={13} ancho="50%" radio={4} />
                  <Skeleton alto={11} ancho="85%" radio={3} />
                </View>
                <Skeleton alto={24} ancho={44} radio={12} />
              </View>
            </View>
          ))}
          <View style={s.divisorAjustes} />
          <View style={s.filaEnlace}>
            <Skeleton alto={24} ancho={24} radio={6} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton alto={13} ancho="70%" radio={4} />
              <Skeleton alto={11} ancho="85%" radio={3} />
            </View>
            <Skeleton alto={16} ancho={16} radio={4} />
          </View>
        </MasterGlass>
      </View>

      {/* Grupo 2: Privacidad */}
      <View style={s.grupoAjustes}>
        <Skeleton alto={11} ancho={130} radio={3} style={{ marginLeft: 4 }} />
        <MasterGlass style={s.tarjetaAjustes}>
          {[0, 1].map((i) => (
            <View key={i}>
              {i > 0 && <View style={s.divisorAjustes} />}
              <View style={s.filaToggle}>
                <View style={{ flex: 1, gap: 4, paddingRight: 10 }}>
                  <Skeleton alto={13} ancho="60%" radio={4} />
                  <Skeleton alto={11} ancho="80%" radio={3} />
                </View>
                <Skeleton alto={24} ancho={44} radio={12} />
              </View>
            </View>
          ))}
        </MasterGlass>
      </View>

      {/* Grupo 3: Suscripción */}
      <View style={s.grupoAjustes}>
        <Skeleton alto={11} ancho={150} radio={3} style={{ marginLeft: 4 }} />
        <MasterGlass style={s.tarjetaAjustes}>
          {[0, 1].map((i) => (
            <View key={i}>
              {i > 0 && <View style={s.divisorAjustes} />}
              <View style={s.filaEnlace}>
                <Skeleton alto={24} ancho={24} radio={6} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Skeleton alto={13} ancho="65%" radio={4} />
                  <Skeleton alto={11} ancho="50%" radio={3} />
                </View>
                <Skeleton alto={16} ancho={16} radio={4} />
              </View>
            </View>
          ))}
        </MasterGlass>
      </View>
    </View>
  );
}

export function PerfilPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const clienteQuery = useQueryClient();

  const [tabActiva, setTabActiva] = useState<TabPerfil>('resumen');
  const [cambiandoTab, setCambiandoTab] = useState(false);
  const temporizadorTab = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCambioTab = useCallback((tab: TabPerfil) => {
    if (tab === tabActiva) return;
    hapticSeguro('seleccion');
    if (temporizadorTab.current) clearTimeout(temporizadorTab.current);
    setCambiandoTab(true);
    setTabActiva(tab);
    temporizadorTab.current = setTimeout(() => {
      setCambiandoTab(false);
    }, 320);
  }, [tabActiva]);

  useEffect(() => {
    return () => {
      if (temporizadorTab.current) clearTimeout(temporizadorTab.current);
    };
  }, []);

  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreInput, setNombreInput] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Queries del ecosistema Lestinaty
  const { data: saldoGemas, isLoading: cargandoGemas } = useSaldoGemas();
  const horizon = useHorizon();
  const esPro = horizon.data === 'activo';

  const consultaConfig = useQuery({
    queryKey: ['configuracion', 'usuario'],
    queryFn: () => cargarConfiguracion(),
  });

  const consultaRacha = useQuery({
    queryKey: ['habitos', 'mejor-racha'],
    queryFn: () => obtenerHabitoMejorRacha(),
  });

  const consultaPanel = useQuery({
    queryKey: ['habitos', 'panel'],
    queryFn: () => obtenerPanelHabitos(),
  });

  const consultaPlanes = useQuery({
    queryKey: ['habitos', 'planes-resumen'],
    queryFn: () => obtenerResumenPlanesHabitos(),
  });

  const configuracion = consultaConfig.data;
  const mejorRacha = consultaRacha.data?.racha ?? 0;
  const habitosHoy = consultaPanel.data?.hoy.datos ?? [];
  const habitosCompletados = habitosHoy.filter((h) => h.completado).length;
  const planesHabitos = consultaPlanes.data ?? [];
  const totalArboles = planesHabitos.length;
  const nivelGuardian = totalArboles ? Math.max(...planesHabitos.map((p) => p.nivel)) : 1;
  const cargandoArboles = consultaPlanes.isLoading;

  const nombreUsuario =
    configuracion?.perfil.nombreVisible?.trim() || 'Guardián';

  async function guardarNombre() {
    if (!configuracion || guardandoPerfil) return;
    const nuevoNombre = nombreInput.trim() || nombreUsuario;
    setGuardandoPerfil(true);
    hapticSeguro('accion');
    try {
      await actualizarPerfil({
        ...configuracion.perfil,
        nombreVisible: nuevoNombre,
      });
      await clienteQuery.invalidateQueries({ queryKey: ['configuracion', 'usuario'] });
      setEditandoNombre(false);
      hapticSeguro('confirmacion');
    } catch {
      Alert.alert('Error', 'No pudimos actualizar tu nombre. Inténtalo de nuevo.');
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function alternarPermiso(llave: LlavePermiso, valor: boolean) {
    if (!configuracion) return;
    hapticSeguro('toggle');
    const nuevo = { ...configuracion.permisos, [llave]: valor };
    try {
      await actualizarPermisosDatos(nuevo);
      clienteQuery.setQueryData(['configuracion', 'usuario'], {
        ...configuracion,
        permisos: nuevo,
      });
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el permiso.');
    }
  }

  async function alternarAviso(codigo: string, habilitada: boolean) {
    if (!configuracion) return;
    hapticSeguro('toggle');
    try {
      await actualizarPreferenciaNotificacion(codigo, habilitada);
      clienteQuery.setQueryData(['configuracion', 'usuario'], {
        ...configuracion,
        preferenciasNotificacion: configuracion.preferenciasNotificacion.map((a) =>
          a.codigo === codigo ? { ...a, habilitada } : a,
        ),
      });
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la notificación.');
    }
  }

  async function solicitarAccion(tipo: TipoSolicitudPrivacidad) {
    hapticSeguro('accion');
    try {
      await crearSolicitudPrivacidad(tipo);
      await clienteQuery.invalidateQueries({ queryKey: ['configuracion', 'usuario'] });
      hapticSeguro('confirmacion');
      Alert.alert('Solicitud enviada', 'Procesaremos tu solicitud y te notificaremos por correo.');
    } catch {
      Alert.alert('Error', 'No se pudo crear la solicitud.');
    }
  }

  function confirmarCerrarSesion() {
    hapticSeguro('accion');
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir? Tus hábitos y senderos permanecen seguros en la nube.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await cerrarSesion();
              router.replace('/(publico)/iniciar-sesion');
            } catch {
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ],
    );
  }

  const [restaurandoCompras, setRestaurandoCompras] = useState(false);

  function confirmarEliminarCuenta() {
    hapticSeguro('accion');
    Alert.alert(
      '¿Eliminar tu cuenta de Lestinaty?',
      'Esta acción es definitiva e irreversible. Se eliminarán permanentemente tus hábitos, progresos, gemas, árboles y todos los datos asociados de acuerdo con nuestras políticas de privacidad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar con la eliminación',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmación final',
              '¿Estás totalmente seguro? Esta acción no se puede deshacer y perderás el acceso a tu cuenta de inmediato.',
              [
                { text: 'Volver atrás', style: 'cancel' },
                {
                  text: 'Eliminar definitivamente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      hapticSeguro('accion');
                      await crearSolicitudPrivacidad('eliminacion');
                      await cerrarSesion();
                      router.replace('/(publico)/iniciar-sesion');
                    } catch {
                      try {
                        await cerrarSesion();
                        router.replace('/(publico)/iniciar-sesion');
                      } catch {
                        Alert.alert('Error', 'No se pudo procesar la solicitud. Intenta nuevamente.');
                      }
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  async function manejarRestaurarCompras() {
    hapticSeguro('accion');
    setRestaurandoCompras(true);
    try {
      const estado = await restaurarHorizon();
      await clienteQuery.invalidateQueries({ queryKey: ['horizon'] });
      hapticSeguro('confirmacion');
      if (estado === 'activo') {
        Alert.alert('¡Suscripción restaurada!', 'Tu membresía Pro se encuentra activa.');
      } else {
        Alert.alert('Sin suscripciones activas', 'No encontramos suscripciones activas de Google Play asociadas a tu cuenta.');
      }
    } catch {
      Alert.alert('Error', 'No pudimos verificar las suscripciones con Google Play. Intenta de nuevo más tarde.');
    } finally {
      setRestaurandoCompras(false);
    }
  }

  function abrirGestionarSuscripciones() {
    hapticSeguro('accion');
    Linking.openURL('https://play.google.com/store/account/subscriptions?package=com.lestinaty.app').catch(() => {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    });
  }

  const urlPrivacidad = configuracion?.documentos.find((d) => d.codigo === 'privacidad')?.urlPublica ?? 'https://lestinaty.com/privacidad';
  const urlTerminos = configuracion?.documentos.find((d) => d.codigo === 'terminos')?.urlPublica ?? 'https://lestinaty.com/terminos';

  function abrirUrl(url: string) {
    hapticSeguro('seleccion');
    Linking.openURL(url).catch(() => {
      Alert.alert('Enlace web', `Puedes consultar este apartado en tu navegador:\n${url}`);
    });
  }

  function contactarSoporte() {
    hapticSeguro('accion');
    Linking.openURL('mailto:soporte@lestinaty.com?subject=Soporte%20Lestinaty%20App').catch(() => {
      Alert.alert('Contacto de Soporte', 'Escríbenos directamente a soporte@lestinaty.com');
    });
  }

  function mostrarLicencias() {
    hapticSeguro('seleccion');
    Alert.alert(
      'Licencias y Código Abierto',
      'Lestinaty está construido con tecnologías abiertas:\n\n• React Native & Expo (MIT)\n• Supabase (Apache 2.0)\n• Lucide Icons (ISC)\n• React Native Reanimated (MIT)\n\nTodos los derechos reservados © Lestinaty.',
    );
  }

  return (
    <LinearGradient
      colors={['#F7FDF7', '#E8F7E9', '#D5F2D8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.raiz}
    >
      <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
        {/* Aurora Boreal de Fondo */}
        <View pointerEvents="none" style={s.aurora}>
          <AuroraBoreal tema="verde" />
        </View>

        {/* Cabecera Superior estilo HabitosPantalla / Insights */}
        <View style={s.headerInicio}>
          <View style={s.headerTitulo}>
            <Animated.View entering={entradaEncadenada(0)} style={s.headerIzq}>
              <Texto style={s.headerSaludo}>Espacio personal,</Texto>
              <View style={s.nombreFila}>
                <Image
                  source={require('../../../../assets/icons/navegacion/perfil.png')}
                  style={s.saludoIcono}
                />
                <Texto style={s.headerNombre}>Perfil</Texto>
              </View>
            </Animated.View>
          </View>

          <View style={s.headerDer}>
            <Animated.View entering={entradaEncadenada(1)}>
              <Rebote
                accessibilityLabel="Comprar gemas"
                onPress={() => {
                  hapticSeguro('seleccion');
                  router.push('/tienda/gemas');
                }}
                estilo={s.statPill}
              >
                <View style={s.statPillFila}>
                  <Image
                    source={require('../../../../assets/icons/hoy/gemas.png')}
                    style={s.gemaIcono}
                  />
                  {cargandoGemas || saldoGemas === undefined ? (
                    <Skeleton alto={14} ancho={32} radio={4} />
                  ) : (
                    <Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto>
                  )}
                </View>
              </Rebote>
            </Animated.View>

            <Animated.View entering={entradaEncadenada(2)}>
              <Rebote
                accessibilityLabel="Membresía Pro"
                onPress={() => {
                  hapticSeguro('seleccion');
                  router.push('/horizon');
                }}
                estilo={[s.statPill, esPro && s.statPillPro]}
              >
                <View style={s.statPillFila}>
                  <MasterIcon cargando={horizon.isLoading} name="trofeo" size={20} />
                  <Texto style={[s.proTexto, esPro && s.proTextoActivo]}>PRO</Texto>
                </View>
              </Rebote>
            </Animated.View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContenido, { paddingBottom: insets.bottom + 120 }]}
        >
          {/* Tarjeta Hero del Guardián */}
          {consultaConfig.isLoading ? (
            <Animated.View entering={entradaEncadenada(3)}>
              <EsqueletoHeroCard />
            </Animated.View>
          ) : (
            <Animated.View entering={entradaEncadenada(3)}>
              <MasterGlass style={s.heroCard}>
                <View style={s.heroFilaPrincipal}>
                  {/* Avatar Botánico */}
                  <View style={s.avatarContenedor}>
                    <View style={s.avatarAura}>
                      <Image
                        source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png')}
                        style={s.avatarImagen}
                      />
                    </View>
                    <View style={s.badgeNivelAvatar}>
                      <Texto style={s.textoNivelAvatar}>Nv. {nivelGuardian}</Texto>
                    </View>
                  </View>

                  {/* Datos del Guardián */}
                  <View style={s.heroInfo}>
                    <View style={s.heroNombreFila}>
                      {editandoNombre ? (
                        <View style={s.inputNombreContenedor}>
                          <CampoTexto
                            autoFocus
                            placeholder="Tu nombre"
                            value={nombreInput}
                            onChangeText={setNombreInput}
                          />
                          <Pressable
                            onPress={guardarNombre}
                            style={s.btnConfirmarNombre}
                          >
                            <Check color="#FFFFFF" size={16} strokeWidth={3} />
                          </Pressable>
                        </View>
                      ) : (
                        <>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.nombreUsuario}>{nombreUsuario}</Texto>
                          <Pressable
                            hitSlop={8}
                            onPress={() => {
                              hapticSeguro('seleccion');
                              setNombreInput(nombreUsuario);
                              setEditandoNombre(true);
                            }}
                            style={s.btnEditarNombre}
                          >
                            <Image
                              source={require('../../../../assets/icons/hoy/edit.png')}
                              style={{ width: 16, height: 16, resizeMode: 'contain' }}
                            />
                          </Pressable>
                        </>
                      )}
                    </View>

                    <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.emailUsuario}>
                      {configuracion?.email ?? ''}
                    </Texto>

                    <View style={s.rangoFila}>
                      <View style={s.puntoVerde} />
                      <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.rangoTexto}>
                        {totalArboles > 0
                          ? `${totalArboles} ${totalArboles === 1 ? 'hábito' : 'hábitos'} en cultivo`
                          : 'Aún sin hábitos sembrados'}
                      </Texto>
                    </View>
                  </View>
                </View>

                {/* Barra de 4 Métricas Clave */}
                <View style={s.metricasFila}>
                  <View style={s.metricaItem}>
                    <Image
                      source={require('../../../../assets/icons/hoy/racha.png')}
                      style={s.metricaIcono}
                    />
                    {consultaRacha.isLoading ? (
                      <Skeleton alto={14} ancho={24} radio={4} />
                    ) : (
                      <Texto style={s.metricaValor}>{mejorRacha}d</Texto>
                    )}
                    <Texto style={s.metricaEtiqueta}>Racha</Texto>
                  </View>

                  <View style={s.metricaDivisor} />

                  <View style={s.metricaItem}>
                    <Image
                      source={require('../../../../assets/icons/hoy/gemas.png')}
                      style={s.metricaIcono}
                    />
                    {cargandoGemas || saldoGemas === undefined ? (
                      <Skeleton alto={14} ancho={28} radio={4} />
                    ) : (
                      <Texto style={s.metricaValor}>{saldoGemas ?? 0}</Texto>
                    )}
                    <Texto style={s.metricaEtiqueta}>Gemas</Texto>
                  </View>

                  <View style={s.metricaDivisor} />

                  <View style={s.metricaItem}>
                    <MasterIcon name="arbol" size={24} />
                    {cargandoArboles ? (
                      <Skeleton alto={14} ancho={20} radio={4} />
                    ) : (
                      <Texto style={s.metricaValor}>{totalArboles}</Texto>
                    )}
                    <Texto style={s.metricaEtiqueta}>Hábitos</Texto>
                  </View>

                  <View style={s.metricaDivisor} />

                  <View style={s.metricaItem}>
                    <MasterIcon name="progreso" size={24} />
                    {consultaPanel.isLoading ? (
                      <Skeleton alto={14} ancho={28} radio={4} />
                    ) : (
                      <Texto style={s.metricaValor}>
                        {habitosCompletados}/{habitosHoy.length || 4}
                      </Texto>
                    )}
                    <Texto style={s.metricaEtiqueta}>Hoy</Texto>
                  </View>
                </View>
              </MasterGlass>
            </Animated.View>
          )}

          {/* Selector de Pestañas Interactivas (MasterChips) */}
          <Animated.View entering={entradaEncadenada(4)} style={s.chipsContenedor}>
            <MasterChip
              activo={tabActiva === 'resumen'}
              icono={<MasterIcon name="hoja2" size={18} />}
              texto="Mi Espacio"
              onPress={() => onCambioTab('resumen')}
            />
            <MasterChip
              activo={tabActiva === 'logros'}
              icono={<MasterIcon name="trofeo" size={18} />}
              texto="Insignias"
              onPress={() => onCambioTab('logros')}
            />
            <MasterChip
              activo={tabActiva === 'ajustes'}
              icono={<MasterIcon name="engranaje" size={18} />}
              texto="Ajustes"
              onPress={() => onCambioTab('ajustes')}
            />
          </Animated.View>

          <Animated.View key={tabActiva} entering={FadeIn.duration(360)} exiting={FadeOut.duration(200)}>
            {/* ── PESTAÑA 1: RESUMEN / MI ESPACIO ── */}
            {tabActiva === 'resumen' && (
              cambiandoTab ? (
                <EsqueletoMiEspacio />
              ) : (
                <View style={s.tabContenido}>
                  {/* Tarjeta de Widgets de Inicio */}
                  <Animated.View entering={entradaEncadenada(0)}>
                    <MasterGlass style={s.tarjetaModulo}>
                      <View style={s.moduloHeader}>
                        <View style={s.moduloIconoAura}>
                          <MasterIcon name="computadora" size={26} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.moduloTitulo}>Widgets de Pantalla de Inicio</Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.moduloSubtitulo}>
                            Lleva tus hábitos y rachas directamente al escritorio de tu Android
                          </Texto>
                        </View>
                      </View>

                      <View style={s.widgetBannersFila}>
                        <View style={s.widgetMiniBadge}>
                          <Texto style={s.widgetMiniBadgeTexto}>2×2 Foco</Texto>
                        </View>
                        <View style={s.widgetMiniBadge}>
                          <Texto style={s.widgetMiniBadgeTexto}>4×1 Barra</Texto>
                        </View>
                        <View style={s.widgetMiniBadge}>
                          <Texto style={s.widgetMiniBadgeTexto}>4×2 Hábitos</Texto>
                        </View>
                      </View>

                      <MasterButton
                        color="#21A844"
                        iconoIzquierda={({ size }) => <MasterIcon name="computadora" size={size} />}
                        onPress={() => {
                          hapticSeguro('seleccion');
                          router.push('/habitos/widgets');
                        }}
                      >
                        Personalizar y Probar Widgets
                      </MasterButton>
                    </MasterGlass>
                  </Animated.View>

                  {/* Banner de Suscripción Lestinaty Pro */}
                  <Animated.View entering={entradaEncadenada(1)}>
                    <MasterGlass style={[s.tarjetaModulo, esPro ? s.tarjetaProActiva : s.tarjetaProOferta]}>
                      <View style={s.moduloHeader}>
                        <View style={[s.moduloIconoAura, { backgroundColor: esPro ? 'rgba(33, 168, 68, 0.15)' : 'rgba(106, 41, 194, 0.15)' }]}>
                          <MasterIcon name="trofeo" size={26} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={[s.moduloTitulo, { color: esPro ? '#143D1F' : '#2D1B4E' }]}>
                            {esPro ? 'Membresía Lestinaty Pro Activa' : 'Desbloquea Lestinaty Pro'}
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.moduloSubtitulo}>
                            {esPro
                              ? 'Disfrutas de widgets interactivos ilimitados, árboles legendarios y analítica profunda.'
                              : 'Accede a widgets en tu celular, sincronización prioritaria y colecciones botánicas exclusivas.'}
                          </Texto>
                        </View>
                      </View>

                      {!esPro && (
                        <MasterButton
                          color="#6A29C2"
                          iconoIzquierda={({ size }) => <MasterIcon name="rayo" size={size} />}
                          onPress={() => {
                            hapticSeguro('seleccion');
                            router.push('/horizon');
                          }}
                        >
                          Conocer Lestinaty Pro
                        </MasterButton>
                      )}
                    </MasterGlass>
                  </Animated.View>

                  {/* Cofre de Gemas y Referidos */}
                  <Animated.View entering={entradaEncadenada(2)}>
                    <MasterGlass style={s.tarjetaModulo}>
                      <View style={s.moduloHeader}>
                        <View style={s.moduloIconoAura}>
                          <Image
                            source={require('../../../../assets/icons/hoy/gemas.png')}
                            style={{ width: 26, height: 26, resizeMode: 'contain' }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.moduloTitulo}>Gemas Gratis por Invitar</Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.moduloSubtitulo}>
                            Comparte tu código de guardián y gana +200 gemas por cada amigo que siembre su primer sendero.
                          </Texto>
                        </View>
                      </View>

                      <MasterButton
                        color="#21A844"
                        onPress={() => {
                          hapticSeguro('seleccion');
                          router.push('/tienda');
                        }}
                      >
                        Ver Recompensas en la Tienda
                      </MasterButton>
                    </MasterGlass>
                  </Animated.View>
                </View>
              )
            )}

            {/* ── PESTAÑA 2: LOGROS & INSIGNIAS BOTÁNICAS ── */}
            {tabActiva === 'logros' && (
              cambiandoTab ? (
                <EsqueletoInsignias />
              ) : (
                <View style={s.tabContenido}>
                  <Animated.View entering={entradaEncadenada(0)} style={s.logrosHeader}>
                    <Texto style={s.logrosTitulo}>Insignias del Guardián</Texto>
                    <Texto style={s.logrosSubtitulo}>
                      Evoluciona tu sendero cumpliendo días acumulados de hábitos conscientes.
                    </Texto>
                  </Animated.View>

                  <View style={s.insigniasGrid}>
                    {INSIGNIAS_BOTANICAS.map((insignia, idx) => {
                      const desbloqueada = mejorRacha >= insignia.dias;
                      return (
                        <Animated.View key={insignia.nivel} entering={entradaEncadenada(1 + idx)}>
                          <MasterGlass
                            style={[s.insigniaCard, !desbloqueada && s.insigniaBloqueada]}
                          >
                            <View style={s.insigniaFilaTop}>
                              <Image
                                source={insignia.img}
                                style={[
                                  s.insigniaImg,
                                  !desbloqueada && { opacity: 0.35 },
                                ]}
                              />
                              <View
                                style={[
                                  s.badgeNivelInsignia,
                                  desbloqueada ? s.badgeNivelDesbloqueada : s.badgeNivelBloqueada,
                                ]}
                              >
                                <Texto
                                  style={[
                                    s.badgeNivelInsigniaTexto,
                                    { color: desbloqueada ? '#15803D' : '#888888' },
                                  ]}
                                >
                                  Nv. {insignia.nivel}
                                </Texto>
                              </View>
                            </View>

                            <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.insigniaTitulo}>{insignia.titulo}</Texto>
                            <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.insigniaDesc}>{insignia.descripcion}</Texto>

                            <View style={s.insigniaMetaFila}>
                              <Image
                                source={require('../../../../assets/icons/hoy/racha.png')}
                                style={{
                                  width: 14,
                                  height: 14,
                                  resizeMode: 'contain',
                                  opacity: desbloqueada ? 1 : 0.45,
                                }}
                              />
                              <Texto
                                style={[
                                  s.insigniaMetaTexto,
                                  { color: desbloqueada ? '#EA580C' : '#888888' },
                                ]}
                              >
                                {desbloqueada
                                  ? '¡Desbloqueada!'
                                  : `${mejorRacha}/${insignia.dias} días`}
                              </Texto>
                            </View>
                          </MasterGlass>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              )
            )}

            {/* ── PESTAÑA 3: AJUSTES, NOTIFICACIONES, GOOGLE PLAY & CUENTA ── */}
            {tabActiva === 'ajustes' && (
              cambiandoTab ? (
                <EsqueletoAjustes />
              ) : (
                <View style={s.tabContenido}>
                  {/* 1. Notificaciones y Avisos */}
                  <Animated.View entering={entradaEncadenada(0)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>AVISOS Y RECORDATORIOS</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      {configuracion?.preferenciasNotificacion.slice(0, 4).map((aviso, idx) => (
                        <View key={aviso.codigo}>
                          {idx > 0 && <View style={s.divisorAjustes} />}
                          <View style={s.filaToggle}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.toggleTitulo}>
                                {etiquetarAviso(aviso.codigo)}
                              </Texto>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.toggleDesc}>
                                {aviso.descripcion}
                              </Texto>
                            </View>
                            <Switch
                              value={aviso.habilitada}
                              onValueChange={(val) => alternarAviso(aviso.codigo, val)}
                              trackColor={{ false: '#D8D8D2', true: '#21A844' }}
                              thumbColor="#FFFFFF"
                            />
                          </View>
                        </View>
                      ))}
                      <View style={s.divisorAjustes} />
                      <Pressable
                        onPress={() => Linking.openSettings()}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="engranaje" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Ajustes del sistema operativo
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Permisos de notificaciones del dispositivo
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>
                    </MasterGlass>
                  </Animated.View>

                  {/* 2. Privacidad y Datos (Google Play Data Safety / GDPR) */}
                  <Animated.View entering={entradaEncadenada(1)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>PRIVACIDAD Y TUS DATOS</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      {PERMISOS_CONFIG.map((p, idx) => (
                        <View key={p.llave}>
                          {idx > 0 && <View style={s.divisorAjustes} />}
                          <View style={s.filaToggle}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.toggleTitulo}>
                                {p.titulo}
                              </Texto>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.toggleDesc}>
                                {p.descripcion}
                              </Texto>
                            </View>
                            <Switch
                              value={Boolean(configuracion?.permisos[p.llave])}
                              onValueChange={(val) => alternarPermiso(p.llave, val)}
                              trackColor={{ false: '#D8D8D2', true: '#21A844' }}
                              thumbColor="#FFFFFF"
                            />
                          </View>
                        </View>
                      ))}
                      <View style={s.divisorAjustes} />
                      {(() => {
                        const solicitudExportacion = configuracion?.solicitudes.find((s2) => s2.tipo === 'exportacion');
                        const estado = etiquetaSolicitudActiva(solicitudExportacion);
                        return (
                          <Pressable
                            disabled={Boolean(solicitudExportacion)}
                            onPress={() => solicitarAccion('exportacion')}
                            style={[s.filaEnlace, solicitudExportacion && s.filaEnlaceDeshabilitada]}
                          >
                            <View style={s.iconoRanura}>
                              <MasterIcon name="descargar" size={32} />
                            </View>
                            <View style={s.filaEnlaceColumna}>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                                Descargar mis datos guardados
                              </Texto>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                                {estado && solicitudExportacion
                                  ? `${estado} · ${formatearFechaConfiguracion(solicitudExportacion.solicitadaAt)}`
                                  : 'Copia portátil de tu historial y progreso'}
                              </Texto>
                            </View>
                            <ChevronRight color="#5B8C65" size={18} />
                          </Pressable>
                        );
                      })()}
                      <View style={s.divisorAjustes} />
                      {(() => {
                        const solicitudCorreccion = configuracion?.solicitudes.find((s2) => s2.tipo === 'correccion');
                        const estado = etiquetaSolicitudActiva(solicitudCorreccion);
                        return (
                          <Pressable
                            disabled={Boolean(solicitudCorreccion)}
                            onPress={() => solicitarAccion('correccion')}
                            style={[s.filaEnlace, solicitudCorreccion && s.filaEnlaceDeshabilitada]}
                          >
                            <View style={s.iconoRanura}>
                              <Image
                                source={require('../../../../assets/icons/hoy/edit.png')}
                                style={{ width: 24, height: 24, resizeMode: 'contain' }}
                              />
                            </View>
                            <View style={s.filaEnlaceColumna}>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                                Corregir mis datos
                              </Texto>
                              <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                                {estado && solicitudCorreccion
                                  ? `${estado} · ${formatearFechaConfiguracion(solicitudCorreccion.solicitadaAt)}`
                                  : 'Pide que revisemos o corrijamos información tuya'}
                              </Texto>
                            </View>
                            <ChevronRight color="#5B8C65" size={18} />
                          </Pressable>
                        );
                      })()}
                    </MasterGlass>
                  </Animated.View>

                  {/* 3. Membresía y Suscripciones Google Play (Requisito Google Play Billing) */}
                  <Animated.View entering={entradaEncadenada(2)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>MEMBRESÍA Y SUSCRIPCIÓN</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      <View style={s.filaEnlace}>
                        <View style={s.iconoRanura}>
                          <MasterIcon name="trofeo" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Estado de la cuenta
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            {esPro ? 'Lestinaty Horizon PRO activo' : 'Plan Estándar gratuito'}
                          </Texto>
                        </View>
                        <View
                          style={[
                            s.badgeSuscripcion,
                            esPro ? s.badgeSuscripcionActiva : s.badgeSuscripcionInactiva,
                          ]}
                        >
                          <Texto
                            style={[
                              s.badgeSuscripcionTexto,
                              { color: esPro ? '#21A844' : '#6A29C2' },
                            ]}
                          >
                            {esPro ? 'PRO' : 'GRATIS'}
                          </Texto>
                        </View>
                      </View>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={abrirGestionarSuscripciones}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="tarjeta" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Gestionar suscripción en Google Play
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Cancelar, renovar o cambiar método de pago
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={manejarRestaurarCompras}
                        disabled={restaurandoCompras}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          {restaurandoCompras ? (
                            <ActivityIndicator color="#3B9858" size="small" />
                          ) : (
                            <MasterIcon name="reciclar" size={32} />
                          )}
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Restaurar compras anteriores
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Recuperar compras registradas en Google Play
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>
                    </MasterGlass>
                  </Animated.View>

                  {/* 4. Soporte y Ayuda (Requisito Google Play) */}
                  <Animated.View entering={entradaEncadenada(3)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>AYUDA Y SOPORTE</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      <Pressable
                        onPress={contactarSoporte}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="equipo" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Contacto y soporte técnico
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            soporte@lestinaty.com
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={() => abrirUrl('https://lestinaty.com/faq')}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="preguntas" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Preguntas frecuentes y tutoriales
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Aprende a sacar el máximo provecho
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>
                    </MasterGlass>
                  </Animated.View>

                  {/* 5. Legal y Transparencia (Requisito Google Play) */}
                  <Animated.View entering={entradaEncadenada(4)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>LEGAL Y TRANSPARENCIA</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      <Pressable
                        onPress={() => abrirUrl(urlPrivacidad)}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="candado" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Política de Privacidad
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Cómo protegemos y tratamos tus datos
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={() => abrirUrl(urlTerminos)}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="terminos" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Términos y Condiciones de Uso
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Condiciones del servicio y compras
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={mostrarLicencias}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="computadora" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Licencias de código abierto
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Avisos legales de librerías utilizadas
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>
                    </MasterGlass>
                  </Animated.View>

                  {/* 6. Seguridad y Gestión de Cuenta (Requisito CRÍTICO Google Play: Eliminación de Cuenta) */}
                  <Animated.View entering={entradaEncadenada(5)} style={s.grupoAjustes}>
                    <Texto style={s.grupoAjustesTitulo}>SEGURIDAD DE CUENTA</Texto>
                    <MasterGlass style={s.tarjetaAjustes}>
                      <Pressable
                        onPress={async () => {
                          hapticSeguro('accion');
                          if (!configuracion?.email) return;
                          await recuperarAcceso(configuracion.email);
                          Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para actualizar tu contraseña.');
                        }}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="candado" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceTexto}>
                            Cambiar contraseña
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Recibir enlace de restablecimiento seguro
                          </Texto>
                        </View>
                        <ChevronRight color="#5B8C65" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      <Pressable
                        onPress={confirmarCerrarSesion}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="salida" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={[s.filaEnlaceTexto, { color: '#DC2626' }]}>
                            Cerrar sesión
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={s.filaEnlaceSubtexto}>
                            Salir de este dispositivo
                          </Texto>
                        </View>
                        <ChevronRight color="#DC2626" size={18} />
                      </Pressable>

                      <View style={s.divisorAjustes} />

                      {/* Botón Obligatorio Google Play: Eliminación In-App de Cuenta y Datos */}
                      <Pressable
                        onPress={confirmarEliminarCuenta}
                        style={s.filaEnlace}
                      >
                        <View style={s.iconoRanura}>
                          <MasterIcon name="basura" size={32} />
                        </View>
                        <View style={s.filaEnlaceColumna}>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={[s.filaEnlaceTexto, { color: '#DC2626' }]}>
                            Eliminar cuenta y datos personales
                          </Texto>
                          <Texto {...PROPS_TEXTO_UNA_LINEA} style={[s.filaEnlaceSubtexto, { color: '#EF4444' }]}>
                            Borrado definitivo e irreversible de tu perfil
                          </Texto>
                        </View>
                        <ChevronRight color="#DC2626" size={18} />
                      </Pressable>
                    </MasterGlass>
                  </Animated.View>

                  {/* 7. Pie con Versión y Metadatos de la App (Recomendación Google Play) */}
                  <Animated.View entering={entradaEncadenada(6)} style={s.pieVersion}>
                    <Texto style={s.pieVersionTexto}>Lestinaty v1.0.0 (Build 1)</Texto>
                    <Texto style={s.pieVersionSubtexto}>
                      ID: com.lestinaty.app · Todos los derechos reservados
                    </Texto>
                    <Texto style={s.pieVersionLema}>🌱 Cultivando constancia cada día</Texto>
                  </Animated.View>
                </View>
              )
            )}
          </Animated.View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  superiorInicio: {
    flex: 1,
    gap: 0,
  },
  aurora: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    opacity: 0.75,
  },
  headerInicio: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitulo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  headerIzq: {
    flex: 1,
  },
  headerSaludo: {
    color: '#4B4B4B',
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 14,
    lineHeight: 17,
    marginBottom: 4,
  },
  nombreFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerNombre: {
    color: '#1A1335',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 26,
    lineHeight: 32,
  },
  saludoIcono: {
    height: 34,
    resizeMode: 'contain',
    width: 34,
  },
  headerDer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
  },
  statPillPro: {
    backgroundColor: 'rgba(234, 250, 237, 0.85)',
    borderColor: 'rgba(33, 168, 68, 0.35)',
  },
  statPillFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  gemaIcono: {
    height: 22,
    resizeMode: 'contain',
    width: 22,
  },
  statTexto: {
    color: '#6D28D9',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  proTexto: {
    color: '#6A29C2',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  proTextoActivo: {
    color: '#21A844',
  },
  scrollContenido: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    gap: 16,
    boxShadow: '0 8px 24px rgba(33, 168, 68, 0.08)',
  },
  heroFilaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContenedor: {
    position: 'relative',
  },
  avatarAura: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(33, 168, 68, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(33, 168, 68, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImagen: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  badgeNivelAvatar: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#21A844',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textoNivelAvatar: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroNombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombreUsuario: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 20,
    color: '#143D1F',
  },
  btnEditarNombre: {
    padding: 4,
  },
  inputNombreContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  btnConfirmarNombre: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21A844',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailUsuario: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#5B8C65',
  },
  rangoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  puntoVerde: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#21A844',
  },
  rangoTexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#245938',
  },
  metricasFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 168, 68, 0.15)',
  },
  metricaItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  metricaIcono: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  metricaValor: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    color: '#143D1F',
  },
  metricaEtiqueta: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    color: '#5B8C65',
  },
  metricaDivisor: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(33, 168, 68, 0.15)',
  },
  chipsContenedor: {
    flexDirection: 'row',
    gap: 8,
  },
  tabContenido: {
    gap: 16,
  },
  tarjetaModulo: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  moduloHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  moduloIconoAura: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(33, 168, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduloTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    color: '#143D1F',
  },
  moduloSubtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11.5,
    color: '#5B8C65',
    lineHeight: 16,
    marginTop: 2,
  },
  widgetBannersFila: {
    flexDirection: 'row',
    gap: 8,
  },
  widgetMiniBadge: {
    backgroundColor: 'rgba(33, 168, 68, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(33, 168, 68, 0.25)',
  },
  widgetMiniBadgeTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10.5,
    color: '#15803D',
  },
  tarjetaProActiva: {
    borderColor: 'rgba(33, 168, 68, 0.35)',
  },
  tarjetaProOferta: {
    borderColor: 'rgba(106, 41, 194, 0.25)',
    backgroundColor: 'rgba(247, 243, 255, 0.8)',
  },
  logrosHeader: {
    gap: 4,
    marginBottom: 4,
  },
  logrosTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    color: '#143D1F',
  },
  logrosSubtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#5B8C65',
  },
  insigniasGrid: {
    gap: 10,
  },
  insigniaCard: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  insigniaBloqueada: {
    opacity: 0.65,
  },
  insigniaFilaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insigniaImg: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  badgeNivelInsignia: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeNivelDesbloqueada: {
    backgroundColor: 'rgba(33, 168, 68, 0.16)',
  },
  badgeNivelBloqueada: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  badgeNivelInsigniaTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  insigniaTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13.5,
    color: '#143D1F',
    marginTop: 2,
  },
  insigniaDesc: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#5B8C65',
    lineHeight: 15,
  },
  insigniaMetaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  insigniaMetaTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  grupoAjustes: {
    gap: 8,
  },
  grupoAjustesTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#5B8C65',
    marginLeft: 4,
  },
  tarjetaAjustes: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleTitulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    color: '#143D1F',
    textTransform: 'capitalize',
  },
  toggleDesc: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#5B8C65',
    marginTop: 2,
  },
  divisorAjustes: {
    height: 1,
    backgroundColor: 'rgba(33, 168, 68, 0.1)',
    marginHorizontal: 16,
  },
  filaEnlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filaEnlaceDeshabilitada: {
    opacity: 0.5,
  },
  iconoRanura: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaEnlaceColumna: {
    flex: 1,
  },
  filaEnlaceTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    color: '#143D1F',
  },
  filaEnlaceSubtexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    color: '#5B8C65',
    marginTop: 2,
  },
  filaEnlacePeligroTexto: {
    color: '#DC2626',
  },
  badgeSuscripcion: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 2,
  },
  badgeSuscripcionActiva: {
    backgroundColor: 'rgba(33, 168, 68, 0.15)',
  },
  badgeSuscripcionInactiva: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
  },
  badgeSuscripcionTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  pieVersion: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  pieVersionTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    color: '#4E6B56',
  },
  pieVersionSubtexto: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 10.5,
    color: '#7E9986',
  },
  pieVersionLema: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#A3B8AA',
    marginTop: 2,
  },
});
