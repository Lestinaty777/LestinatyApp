// Fachada de compatibilidad: el cliente real vive en
// src/plataforma/compras/cliente.native.ts (único archivo que importa
// react-native-purchases).
export {
  ENTITLEMENT_HORIZON,
  resolverEstadoHorizon,
  obtenerEstadoHorizon,
  obtenerCatalogoHorizon,
  comprarPaquete as comprarHorizon,
  restaurarCompras as restaurarHorizon,
  type EstadoHorizon,
} from '../../plataforma/compras/cliente.native';
