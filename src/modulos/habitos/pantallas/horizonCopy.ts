import type { PurchasesPackage } from 'react-native-purchases';

export function textoCtaHorizon(paquete: Pick<PurchasesPackage, 'product'> | null) {
  return paquete ? `Horizon por ${paquete.product.priceString} al mes` : 'Horizon por $129 MXN al mes';
}
