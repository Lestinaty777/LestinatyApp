export function calcularEncuadreSuperiorIzquierdo(anchoContenedor: number, altoContenedor: number, anchoMedio = 720, altoMedio = 1280) {
  const escala = Math.max(anchoContenedor / anchoMedio, altoContenedor / altoMedio);
  return {
    height: altoMedio * escala,
    left: 0,
    top: 0,
    width: anchoMedio * escala,
  };
}
