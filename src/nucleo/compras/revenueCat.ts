// Fachada de compatibilidad: el cliente real vive en
// src/plataforma/compras/cliente.native.ts (único archivo que importa
// react-native-purchases). Reexporta los nombres históricos y los nuevos
// nombres del contrato por igual — Task 9 los consolidará detrás de
// inicializarPlataforma().
export {
  comprasInicializadas,
  inicializarCompras,
  iniciarSesionCompras,
  cerrarSesionCompras,
  obtenerCatalogoGemas,
  obtenerCatalogoHorizon,
  comprarPaquete,
  restaurarCompras,
} from '../../plataforma/compras/cliente.native';
