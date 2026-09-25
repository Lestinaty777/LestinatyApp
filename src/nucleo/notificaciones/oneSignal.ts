// Fachada de compatibilidad: el cliente real vive en
// src/plataforma/notificaciones/cliente.native.ts (único archivo que importa
// react-native-onesignal). Reexporta los nombres históricos para no romper
// a los consumidores existentes — Task 9 los consolidará detrás de
// inicializarPlataforma().
export {
  inicializarNotificaciones as inicializarOneSignal,
  identificarUsuarioNotificaciones as identificarUsuarioOneSignal,
  cerrarSesionNotificaciones as cerrarSesionOneSignal,
  solicitarPermisoYRegistrar,
  etiquetarUsuarioNotificaciones,
  notificacionesListas,
  registrarResultadoNotificaciones,
} from '../../plataforma/notificaciones/cliente.native';
