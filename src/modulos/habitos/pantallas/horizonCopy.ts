import type { PaqueteCompra } from '../../../plataforma/compras/contrato';

export function textoCtaHorizon(paquete: Pick<PaqueteCompra, 'precioTexto'> | null) {
  return paquete ? `Horizon por ${paquete.precioTexto} al mes` : 'Horizon por $129 MXN al mes';
}
