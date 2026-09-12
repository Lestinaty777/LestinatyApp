import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { LogLevel, OneSignal, PushSubscriptionChangedState } from 'react-native-onesignal';

import { obtenerClienteSupabase, supabaseEstaConfigurado } from '../../servicios/base-datos/supabase';
import { obtenerRutaNotificacion } from './rutaNotificacion';

const APP_ID = 'b6f79a2f-9c6b-43f0-a824-9a2dcf7f0ecb';

let inicializado = false;
let dialogoMostrado = false;
let usuarioPendiente: string | null = null;

function esSuscripcionReal(id: string | null | undefined): id is string {
  return typeof id === 'string' && id.length > 0 && !id.startsWith('local-');
}

async function registrarDispositivo(id: string) {
  if (!supabaseEstaConfigurado()) return;

  const supabase = obtenerClienteSupabase();
  const { data: sesionActual } = await supabase.auth.getSession();
  let sesion = sesionActual.session;

  if (!sesion || (sesion.expires_at ?? 0) * 1000 <= Date.now() + 60_000) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return;
    sesion = data.session;
  }

  const permiso = await OneSignal.Notifications.getPermissionAsync();
  const { error } = await supabase.rpc('registrar_dispositivo_notificacion', {
    p_onesignal_subscription_id: id,
    p_plataforma: 'android',
    p_permiso_nativo: permiso ? 'concedido' : 'desconocido',
  });

  if (error) throw error;
}

function mostrarDialogoVerificacion(id: string | null | undefined) {
  if (!esSuscripcionReal(id) || dialogoMostrado) return;
  dialogoMostrado = true;

  Alert.alert(
    'Your OneSignal SDK integration is complete!',
    'You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.',
    [{ text: 'Got it', onPress: () => { void solicitarPermisoYRegistrar(); } }],
    { cancelable: false },
  );
}

function alCambiarSuscripcion(evento: PushSubscriptionChangedState) {
  const id = evento.current.id;
  mostrarDialogoVerificacion(id);
  if (esSuscripcionReal(id)) void registrarDispositivo(id).catch(() => undefined);
}

function alAbrirNotificacion(evento: any) {
  const ruta = obtenerRutaNotificacion(evento?.notification?.additionalData);
  if (ruta) router.push(ruta as never);
}

export function inicializarOneSignal() {
  if (Platform.OS !== 'android' || inicializado) return;

  inicializado = true;
  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.Warn);
  OneSignal.initialize(APP_ID);
  if (usuarioPendiente) OneSignal.login(usuarioPendiente);
  OneSignal.User.pushSubscription.addEventListener('change', alCambiarSuscripcion);
  OneSignal.Notifications.addEventListener('click', alAbrirNotificacion);
  void OneSignal.User.pushSubscription.getIdAsync().then((id) => {
    mostrarDialogoVerificacion(id);
    if (esSuscripcionReal(id)) void registrarDispositivo(id).catch(() => undefined);
  });
}

export function identificarUsuarioOneSignal(usuarioId: string) {
  usuarioPendiente = usuarioId;
  if (Platform.OS !== 'android' || !inicializado) return;
  OneSignal.login(usuarioId);
  void sincronizarSuscripcionActual().catch(() => undefined);
}

export function cerrarSesionOneSignal() {
  usuarioPendiente = null;
  if (Platform.OS !== 'android' || !inicializado) return;
  OneSignal.logout();
}

export async function solicitarPermisoYRegistrar() {
  if (Platform.OS !== 'android' || !inicializado) return false;
  const concedido = await OneSignal.Notifications.requestPermission(true);
  // El permiso nativo y el registro remoto son independientes. Una sesión
  // vencida no debe hacer que la interfaz interprete un permiso concedido
  // como un rechazo.
  await sincronizarSuscripcionActual().catch(() => undefined);
  return concedido;
}

async function sincronizarSuscripcionActual() {
  const id = await OneSignal.User.pushSubscription.getIdAsync();
  if (esSuscripcionReal(id)) await registrarDispositivo(id);
}
