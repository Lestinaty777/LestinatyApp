const cantidadPetalos = 7;
const gradosPorPetalo = 360 / cantidadPetalos;

export const trazosMandalaAby = Array.from({ length: cantidadPetalos }, (_, indice) => indice * gradosPorPetalo);

function variacion(ciclo: number, desplazamiento: number) {
  const valor = Math.sin((ciclo + 1) * 12.9898 + desplazamiento * 78.233) * 43758.5453;
  return valor - Math.floor(valor);
}

export function crearTrazoMandalaAby(ciclo: number) {
  const ancho = 23 + variacion(ciclo, 1) * 13;
  const altura = 48 + variacion(ciclo, 2) * 15;
  const cintura = 5 + variacion(ciclo, 3) * 12;
  const punta = 80 - altura;
  const controlPunta = punta + 11 + variacion(ciclo, 4) * 9;

  switch (ciclo % 4) {
    case 0:
      return `M 80 80 C ${80 + ancho} ${80 - cintura} ${80 + ancho} ${controlPunta} 80 ${punta} C ${80 - ancho} ${controlPunta} ${80 - ancho} ${80 - cintura} 80 80`;
    case 1:
      return `M 80 80 A ${ancho} ${altura * 0.7} 0 0 1 80 ${punta} A ${ancho} ${altura * 0.7} 0 0 1 80 80`;
    case 2:
      return `M 80 80 Q ${80 + ancho * 1.45} ${80 - altura * 0.32} ${80 + ancho * 0.48} ${punta + altura * 0.12} Q 80 ${punta - 5} ${80 - ancho * 0.48} ${punta + altura * 0.12} Q ${80 - ancho * 1.45} ${80 - altura * 0.32} 80 80`;
    default:
      return `M 80 80 C ${80 + ancho * 0.55} ${80 - altura * 0.12} ${80 + ancho * 1.3} ${80 - altura * 0.55} 80 ${punta} C ${80 - ancho * 1.3} ${80 - altura * 0.55} ${80 - ancho * 0.55} ${80 - altura * 0.12} 80 80`;
  }
}
