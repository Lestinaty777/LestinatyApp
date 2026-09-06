import { router } from 'expo-router';
import { Bell, CheckCircle2, ChevronRight, Download, FileText, KeyRound, LogOut, PencilLine, RefreshCw, Settings2, ShieldCheck, Trash2, UserRound } from 'lucide-react-native';
import { ComponentType, ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton, CampoTexto, RecuadroGlass, Texto, colores, espaciado } from '../../../diseno';
import { cerrarSesion, recuperarAcceso } from '../../acceso/acceso.servicio';
import { actualizarPerfil, actualizarPermisosDatos, actualizarPreferenciaNotificacion, cargarConfiguracion, crearSolicitudPrivacidad } from '../../configuracion/configuracion.servicio';
import { etiquetaSolicitudActiva, formatearFechaConfiguracion, nombreDocumentoLegal } from '../../configuracion/configuracion.presentacion';
import { ConfiguracionUsuario, PermisosDatos, TipoSolicitudPrivacidad } from '../../configuracion/configuracion.tipos';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

type LlavePermiso = keyof PermisosDatos;
type Icono = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

const permisosVisuales: Array<{ descripcion: string; llave: LlavePermiso; titulo: string }> = [
  { descripcion: 'Aby usa tu avance y dificultades para proponerte ayuda más útil.', llave: 'permiteContextoAby', titulo: 'Contexto de aprendizaje' },
  { descripcion: 'Permite transformar tus apuntes y fuentes en material de estudio.', llave: 'permiteProcesarFuentes', titulo: 'Procesar apuntes y fuentes' },
  { descripcion: 'Métricas agregadas para mejorar Lestinaty. Nunca vendemos tus datos.', llave: 'permiteAnaliticaProducto', titulo: 'Analítica de producto' },
];

function tituloAviso(codigo: string) {
  const titulos: Record<string, string> = {
    hoy_cofre_disponible: 'Cofre disponible',
    hoy_evaluacion_disponible: 'Evaluación disponible',
    hoy_racha_recuperable: 'Racha recuperable',
    hoy_repaso_pendiente: 'Repasos pendientes',
    hoy_resumen_diario: 'Resumen diario',
    hoy_sesion_inicio: 'Al comenzar una sesión',
    hoy_sesion_proxima: 'Antes de una sesión',
  };
  return titulos[codigo] ?? codigo.replaceAll('_', ' ');
}

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'No pudimos guardar este cambio. Intenta de nuevo.';
}

export function ConfiguracionPrivacidadPantalla() {
  const insets = useSafeAreaInsets();
  const [configuracion, setConfiguracion] = useState<ConfiguracionUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutaciones, setMutaciones] = useState<Record<string, boolean>>({});
  const entrada = useRef(new Animated.Value(0)).current;

  const cargar = async () => {
    try {
      setCargando(true);
      setError(null);
      setConfiguracion(await cargarConfiguracion());
      entrada.setValue(0);
      Animated.timing(entrada, { duration: 360, toValue: 1, useNativeDriver: true }).start();
    } catch (causa) {
      setError(mensajeError(causa));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void cargar(); }, []);

  const ocupado = (llave: string) => Boolean(mutaciones[llave]);
  const marcarOcupado = (llave: string, valor: boolean) => setMutaciones((actual) => ({ ...actual, [llave]: valor }));

  const guardarPerfil = async () => {
    if (!configuracion || ocupado('perfil')) return;
    marcarOcupado('perfil', true);
    hapticSeguro('accion');
    try {
      const perfil = await actualizarPerfil(configuracion.perfil);
      setConfiguracion((actual) => actual ? { ...actual, perfil } : actual);
      hapticSeguro('confirmacion');
    } catch (causa) {
      Alert.alert('No se guardó tu perfil', mensajeError(causa));
    } finally {
      marcarOcupado('perfil', false);
    }
  };

  const alternarPermiso = async (llave: LlavePermiso, valor: boolean) => {
    if (!configuracion || ocupado(llave)) return;
    const anterior = configuracion.permisos;
    const siguiente = { ...anterior, [llave]: valor };
    setConfiguracion({ ...configuracion, permisos: siguiente });
    marcarOcupado(llave, true);
    hapticSeguro('toggle');
    try {
      const permisos = await actualizarPermisosDatos(siguiente);
      setConfiguracion((actual) => actual ? { ...actual, permisos } : actual);
    } catch (causa) {
      setConfiguracion((actual) => actual ? { ...actual, permisos: anterior } : actual);
      Alert.alert('No se guardó el permiso', mensajeError(causa));
    } finally {
      marcarOcupado(llave, false);
    }
  };

  const alternarAviso = async (codigo: string, habilitada: boolean) => {
    if (!configuracion || ocupado(codigo)) return;
    const anteriores = configuracion.preferenciasNotificacion;
    setConfiguracion({ ...configuracion, preferenciasNotificacion: anteriores.map((aviso) => aviso.codigo === codigo ? { ...aviso, habilitada } : aviso) });
    marcarOcupado(codigo, true);
    hapticSeguro('toggle');
    try {
      await actualizarPreferenciaNotificacion(codigo, habilitada);
    } catch (causa) {
      setConfiguracion((actual) => actual ? { ...actual, preferenciasNotificacion: anteriores } : actual);
      Alert.alert('No se actualizó el aviso', mensajeError(causa));
    } finally {
      marcarOcupado(codigo, false);
    }
  };

  const solicitar = async (tipo: TipoSolicitudPrivacidad) => {
    if (!configuracion || ocupado(tipo)) return;
    marcarOcupado(tipo, true);
    try {
      const solicitud = await crearSolicitudPrivacidad(tipo);
      setConfiguracion((actual) => actual ? { ...actual, solicitudes: [...actual.solicitudes.filter((item) => item.tipo !== tipo), solicitud] } : actual);
      hapticSeguro('confirmacion');
    } catch (causa) {
      Alert.alert('No se creó la solicitud', mensajeError(causa));
    } finally {
      marcarOcupado(tipo, false);
    }
  };

  const confirmarSolicitud = (tipo: TipoSolicitudPrivacidad) => {
    if (configuracion?.solicitudes.some((solicitud) => solicitud.tipo === tipo)) return;
    const eliminacion = tipo === 'eliminacion';
    Alert.alert(
      eliminacion ? '¿Eliminar tu cuenta?' : tipo === 'exportacion' ? '¿Solicitar tus datos?' : '¿Solicitar corrección?',
      eliminacion ? 'Crearemos una solicitud para eliminar tu cuenta y datos. Podrás consultar su estado aquí.' : 'Crearemos una solicitud y te avisaremos cuando esté lista.',
      [{ style: 'cancel', text: 'Cancelar' }, { onPress: () => void solicitar(tipo), style: eliminacion ? 'destructive' : 'default', text: 'Continuar' }],
    );
  };

  const cambiarContrasena = async () => {
    if (!configuracion || ocupado('contrasena')) return;
    marcarOcupado('contrasena', true);
    try {
      await recuperarAcceso(configuracion.email);
      hapticSeguro('confirmacion');
      Alert.alert('Revisa tu correo', 'Te enviamos un enlace seguro para actualizar tu contraseña.');
    } catch (causa) {
      Alert.alert('No se envió el enlace', mensajeError(causa));
    } finally {
      marcarOcupado('contrasena', false);
    }
  };

  const cerrar = () => Alert.alert('Cerrar sesión', 'Tendrás que iniciar sesión para volver a tus senderos.', [
    { style: 'cancel', text: 'Cancelar' },
    { style: 'destructive', text: 'Cerrar sesión', onPress: () => void (async () => {
      try {
        marcarOcupado('sesion', true);
        await cerrarSesion();
        router.replace('/(publico)/iniciar-sesion');
      } catch (causa) {
        Alert.alert('No se cerró la sesión', mensajeError(causa));
      } finally {
        marcarOcupado('sesion', false);
      }
    })() },
  ]);

  if (cargando) return <EstadoCentrado cargando />;
  if (error || !configuracion) return <EstadoCentrado error={error} onPress={() => void cargar()} />;

  const aceptadas = new Set(configuracion.aceptaciones.map((aceptacion) => aceptacion.id));
  const estiloEntrada = { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.raiz}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 44 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={estiloEntrada}>
          <View style={styles.hero}>
            <View style={styles.iconoHero}><Settings2 color={colores.primarioTexto} size={23} /></View>
            <Texto style={styles.sobreTitulo}>ESPACIO PERSONAL</Texto>
            <Texto style={styles.titulo}>Configuración</Texto>
            <Texto style={styles.descripcion}>Decide cómo aprende Aby contigo, cuándo avisarte y cómo gestionar tus datos.</Texto>
          </View>

          <Seccion etiqueta="CUENTA">
            <RecuadroGlass blur intensity={36} style={styles.tarjeta}>
              <Fila icono={<UserRound color={colores.primarioTexto} size={19} />} subtitulo={configuracion.email} titulo="Tu cuenta" />
              <Divisor />
              <View style={styles.bloquePerfil}>
                <CampoTexto label="Nombre visible" onChangeText={(nombreVisible) => setConfiguracion((actual) => actual ? { ...actual, perfil: { ...actual.perfil, nombreVisible } } : actual)} placeholder="¿Cómo te llamamos?" value={configuracion.perfil.nombreVisible} />
                <CampoTexto autoCapitalize="none" label="Idioma" onChangeText={(idioma) => setConfiguracion((actual) => actual ? { ...actual, perfil: { ...actual.perfil, idioma } } : actual)} placeholder="es" value={configuracion.perfil.idioma} />
                <CampoTexto autoCapitalize="none" label="Zona horaria" onChangeText={(zonaHoraria) => setConfiguracion((actual) => actual ? { ...actual, perfil: { ...actual.perfil, zonaHoraria } } : actual)} placeholder="America/Mexico_City" value={configuracion.perfil.zonaHoraria} />
                <Boton disabled={ocupado('perfil')} iconoIzquierda={PencilLine} onPress={() => void guardarPerfil()} variante="secundario">{ocupado('perfil') ? 'Guardando...' : 'Guardar perfil'}</Boton>
              </View>
              <Divisor />
              <FilaPresionable icono={<KeyRound color={colores.textoSecundario} size={19} />} onPress={() => void cambiarContrasena()} titulo="Cambiar contraseña" />
              <Divisor />
              <FilaPresionable peligro icono={<LogOut color={colores.error} size={19} />} onPress={cerrar} titulo={ocupado('sesion') ? 'Cerrando sesión...' : 'Cerrar sesión'} />
            </RecuadroGlass>
          </Seccion>

          <Seccion ayuda="Puedes cambiar estos permisos cuando quieras. La revocación aplica al uso futuro de tus datos." etiqueta="ABY Y TUS DATOS">
            <RecuadroGlass blur intensity={36} style={styles.tarjeta}>
              {permisosVisuales.map((permiso, indice) => <View key={permiso.llave}>{indice > 0 ? <Divisor /> : null}<FilaToggle descripcion={permiso.descripcion} disabled={ocupado(permiso.llave)} onValueChange={(valor) => void alternarPermiso(permiso.llave, valor)} titulo={permiso.titulo} valor={configuracion.permisos[permiso.llave]} /></View>)}
            </RecuadroGlass>
          </Seccion>

          <Seccion ayuda="Los permisos del sistema se gestionan desde tu dispositivo." etiqueta="AVISOS">
            <RecuadroGlass blur intensity={36} style={styles.tarjeta}>
              <FilaPresionable icono={<Settings2 color={colores.textoSecundario} size={19} />} onPress={() => void Linking.openSettings()} titulo="Ajustes del dispositivo" />
              <Divisor />
              {configuracion.preferenciasNotificacion.map((aviso, indice) => <View key={aviso.codigo}>{indice > 0 ? <Divisor /> : null}<FilaToggle descripcion={aviso.descripcion} disabled={ocupado(aviso.codigo)} onValueChange={(valor) => void alternarAviso(aviso.codigo, valor)} titulo={tituloAviso(aviso.codigo)} valor={aviso.habilitada} /></View>)}
              {configuracion.preferenciasNotificacion.length === 0 ? <Fila icono={<Bell color={colores.textoSecundario} size={19} />} subtitulo="Aparecerán cuando programes tus primeros repasos." titulo="Aún no hay avisos disponibles" /> : null}
            </RecuadroGlass>
          </Seccion>

          <Seccion etiqueta="TUS DATOS">
            <RecuadroGlass blur intensity={36} style={styles.tarjeta}>
              <AccionDatos icono={Download} onPress={() => confirmarSolicitud('exportacion')} solicitud={configuracion.solicitudes.find((item) => item.tipo === 'exportacion')} titulo="Descargar mis datos" />
              <Divisor />
              <AccionDatos icono={PencilLine} onPress={() => confirmarSolicitud('correccion')} solicitud={configuracion.solicitudes.find((item) => item.tipo === 'correccion')} titulo="Corregir mis datos" />
              <Divisor />
              <AccionDatos peligro icono={Trash2} onPress={() => confirmarSolicitud('eliminacion')} solicitud={configuracion.solicitudes.find((item) => item.tipo === 'eliminacion')} titulo="Eliminar mi cuenta" />
            </RecuadroGlass>
          </Seccion>

          <Seccion etiqueta="LEGAL">
            <RecuadroGlass blur intensity={36} style={styles.tarjeta}>
              {configuracion.documentos.map((documento, indice) => {
                const aceptacion = configuracion.aceptaciones.find((item) => item.id === documento.id);
                return <View key={documento.id}>{indice > 0 ? <Divisor /> : null}<Pressable onPress={() => void Linking.openURL(documento.urlPublica)} style={({ pressed }) => [styles.fila, pressed && styles.presionado]}><FileText color={colores.textoSecundario} size={19} /><View style={styles.textosFila}><Texto style={styles.tituloFila}>{nombreDocumentoLegal(documento.codigo)}</Texto><Texto style={styles.subtituloFila}>Versión {documento.version}{aceptacion ? ` · Aceptado ${formatearFechaConfiguracion(aceptacion.aceptadoAt)}` : ''}</Texto></View>{aceptadas.has(documento.id) ? <CheckCircle2 color={colores.exito} size={19} /> : <ChevronRight color={colores.textoSecundario} size={19} />}</Pressable></View>;
              })}
              {configuracion.documentos.length === 0 ? <Fila icono={<FileText color={colores.textoSecundario} size={19} />} subtitulo="Aquí aparecerán las versiones vigentes." titulo="Documentos en preparación" /> : null}
            </RecuadroGlass>
          </Seccion>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EstadoCentrado({ cargando = false, error, onPress }: { cargando?: boolean; error?: string | null; onPress?: () => void }) {
  return <View style={[styles.raiz, styles.centrado]}>{cargando ? <ActivityIndicator color={colores.primario} size="large" /> : <ShieldCheck color={colores.error} size={40} />}<Texto style={styles.tituloEstado}>{cargando ? 'Preparando tu configuración' : 'No pudimos abrir configuración'}</Texto>{error ? <Texto style={styles.errorEstado}>{error}</Texto> : null}{onPress ? <Boton iconoIzquierda={RefreshCw} onPress={onPress} variante="secundario">Reintentar</Boton> : null}</View>;
}

function Seccion({ ayuda, children, etiqueta }: { ayuda?: string; children: ReactNode; etiqueta: string }) {
  return <View style={styles.seccion}><Texto style={styles.etiqueta}>{etiqueta}</Texto>{children}{ayuda ? <Texto style={styles.ayuda}>{ayuda}</Texto> : null}</View>;
}

function Divisor() { return <View style={styles.divisor} />; }

function Fila({ icono, subtitulo, titulo }: { icono: ReactNode; subtitulo: string; titulo: string }) {
  return <View style={styles.fila}>{icono}<View style={styles.textosFila}><Texto style={styles.tituloFila}>{titulo}</Texto><Texto style={styles.subtituloFila}>{subtitulo}</Texto></View></View>;
}

function FilaPresionable({ icono, onPress, peligro = false, titulo }: { icono: ReactNode; onPress: () => void; peligro?: boolean; titulo: string }) {
  return <Pressable onPress={() => { hapticSeguro('accion'); onPress(); }} style={({ pressed }) => [styles.fila, pressed && styles.presionado]}>{icono}<Texto style={[styles.tituloFila, peligro && styles.peligro]}>{titulo}</Texto><ChevronRight color={peligro ? colores.error : colores.textoSecundario} size={19} /></Pressable>;
}

function FilaToggle({ descripcion, disabled, onValueChange, titulo, valor }: { descripcion: string; disabled: boolean; onValueChange: (valor: boolean) => void; titulo: string; valor: boolean }) {
  return <View style={styles.filaToggle}><View style={styles.textosFila}><Texto style={styles.tituloFila}>{titulo}</Texto><Texto style={styles.subtituloFila}>{descripcion}</Texto></View><Switch disabled={disabled} onValueChange={onValueChange} trackColor={{ false: '#D8D8D2', true: colores.primario }} value={valor} /></View>;
}

function AccionDatos({ icono: Icono, onPress, peligro = false, solicitud, titulo }: { icono: Icono; onPress: () => void; peligro?: boolean; solicitud: ConfiguracionUsuario['solicitudes'][number] | undefined; titulo: string }) {
  const estado = etiquetaSolicitudActiva(solicitud);
  const fechaSolicitud = solicitud ? formatearFechaConfiguracion(solicitud.solicitadaAt) : null;
  return <Pressable disabled={Boolean(solicitud)} onPress={() => { hapticSeguro('accion'); onPress(); }} style={({ pressed }) => [styles.fila, solicitud && styles.deshabilitado, pressed && styles.presionado]}><Icono color={peligro ? colores.error : colores.textoSecundario} size={19} /><View style={styles.textosFila}><Texto style={[styles.tituloFila, peligro && styles.peligro]}>{titulo}</Texto><Texto style={estado ? styles.estadoSolicitud : styles.subtituloFila}>{estado && fechaSolicitud ? `${estado} · ${fechaSolicitud}` : 'Solicitar desde la app'}</Texto></View><ChevronRight color={peligro ? colores.error : colores.textoSecundario} size={19} /></Pressable>;
}

const styles = StyleSheet.create({
  ayuda: { color: colores.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 18, marginTop: 9, paddingHorizontal: 5 },
  bloquePerfil: { gap: 14, padding: espaciado.lg },
  centrado: { alignItems: 'center', justifyContent: 'center', padding: espaciado.xl },
  descripcion: { color: colores.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 330 },
  deshabilitado: { opacity: 0.52 },
  divisor: { backgroundColor: 'rgba(40,48,42,0.08)', height: StyleSheet.hairlineWidth, marginHorizontal: espaciado.lg },
  errorEstado: { color: colores.textoSecundario, fontFamily: 'Montserrat-Medium', lineHeight: 20, marginBottom: espaciado.lg, marginTop: 8, textAlign: 'center' },
  estadoSolicitud: { color: colores.primarioTexto, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 11, lineHeight: 16, marginTop: 3 },
  etiqueta: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 10, letterSpacing: 1.6, marginBottom: 10, marginLeft: 5 },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 64, paddingHorizontal: espaciado.lg, paddingVertical: 13 },
  filaToggle: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 78, paddingHorizontal: espaciado.lg, paddingVertical: 14 },
  hero: { marginBottom: 30, paddingTop: 24 },
  iconoHero: { alignItems: 'center', backgroundColor: colores.primarioSuave, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  peligro: { color: colores.error },
  presionado: { opacity: 0.65 },
  raiz: { backgroundColor: colores.fondo, flex: 1 },
  scroll: { paddingHorizontal: espaciado.lg },
  seccion: { marginBottom: 28 },
  sobreTitulo: { color: colores.primarioTexto, fontFamily: 'MontserratAlternates-Bold', fontSize: 10, letterSpacing: 1.6, marginTop: 13 },
  subtituloFila: { color: colores.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginTop: 3 },
  tarjeta: { backgroundColor: 'rgba(255,255,255,0.68)', borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, borderWidth: 1 },
  textosFila: { flex: 1 },
  titulo: { color: colores.texto, fontFamily: 'Montserrat-Bold', fontSize: 31, lineHeight: 38, marginTop: 3 },
  tituloEstado: { color: colores.texto, fontFamily: 'Montserrat-Bold', fontSize: 21, marginTop: 14 },
  tituloFila: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 14, lineHeight: 19 },
});
