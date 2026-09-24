export type HitoMision = { alcanzado: boolean; etiqueta: string; valor: number };

// 4 hitos a 20/50/80/100% de la meta, redondeados — con meta=10 da
// exactamente 2/5/8/10 (el ejemplo pedido), tanto para minutos como para
// unidades de cantidad; el último siempre es la meta exacta, sin redondeo.
export function calcularHitos(meta: number, valorActual: number, formatearEtiqueta: (valor: number) => string): HitoMision[] {
  const metaSegura = Math.max(1, meta);
  const brutos = [0.2, 0.5, 0.8, 1].map((fraccion) => Math.max(1, Math.round(metaSegura * fraccion)));
  brutos[brutos.length - 1] = metaSegura;
  const valores = Array.from(new Set(brutos));
  return valores.map((valor) => ({ alcanzado: valorActual >= valor, etiqueta: formatearEtiqueta(valor), valor }));
}
