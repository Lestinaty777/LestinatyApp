// Tope al escalado de fuente del sistema (Ajustes > Accesibilidad > Texto más
// grande, en iOS y Android). Sin tope, los tamaños de accesibilidad más
// extremos (hasta ~3-4x el tamaño base) rompen la app: hay contenedores de
// alto fijo por todos lados (más de 90 archivos solo en src/modulos), que no
// están pensados para un reflow sin límite.
//
// Con este tope el texto SIGUE creciendo cuando el usuario sube el tamaño en
// Ajustes — no se desactiva el escalado (`allowFontScaling={false}`), que
// sería peor para accesibilidad — pero no pasa del punto en el que el layout
// se rompe. Es el mismo compromiso que usan la mayoría de las apps de
// producción frente a texto ilimitado en layouts de alto fijo.
//
// Bajado de 1.3 a 1.18 (2026-09-25): en pruebas reales en iPhone, 1.3 seguía
// cortando texto en gran parte de la UI — la mayoría de los contenedores de
// esta app tienen mucho menos margen del que asumíamos. Texto completo y
// legible a un tope más chico es preferible a texto más grande pero cortado.
export const TOPE_ESCALA_TEXTO = 1.18;

// Para texto en espacios muy compactos (chips, casillas de un dígito,
// contadores, grillas densas) donde incluso TOPE_ESCALA_TEXTO ya no entra.
export const TOPE_ESCALA_TEXTO_COMPACTO = 1.08;
