function variacion(ciclo: number, desplazamiento: number) {
  const valor = Math.sin((ciclo + 1) * 19.341 + desplazamiento * 53.127) * 16789.231;
  return valor - Math.floor(valor);
}

export function crearPulsoFinalMandalaAby(ciclo: number) {
  const direccion = variacion(ciclo, 1) > 0.5 ? 1 : -1;

  return {
    duracionEntrada: 380 + Math.round(variacion(ciclo, 2) * 180),
    duracionExpansion: 760 + Math.round(variacion(ciclo, 3) * 380),
    duracionSalida: 520 + Math.round(variacion(ciclo, 4) * 220),
    duracionTrazo: 840 + Math.round(variacion(ciclo, 5) * 420),
    escalaFinal: 0.66 + variacion(ciclo, 6) * 0.14,
    escalaMaxima: 1.07 + variacion(ciclo, 7) * 0.11,
    esperaFinal: 420 + Math.round(variacion(ciclo, 8) * 380),
    retrasoTrazo: 185 + Math.round(variacion(ciclo, 9) * 110),
    rotacionFinal: direccion * (6 + Math.round(variacion(ciclo, 10) * 9)),
  };
}
