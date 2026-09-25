// Escalado de fuente del sistema (Ajustes > Accesibilidad > Texto más
// grande) DESACTIVADO a propósito (2026-09-25): se probaron topes de 1.3 y
// luego 1.18, y en ambos casos el texto seguía cortándose en gran parte de
// la UI — hay contenedores de alto fijo por todos lados (más de 90 archivos
// solo en src/modulos) que no están pensados para ningún reflow. Arreglar
// eso bien requiere auditar esos contenedores uno por uno, algo que no
// entra en el tiempo disponible ahora.
//
// Decisión consciente: la app no declara (ni marca en el formulario de
// accesibilidad de App Store Connect) soporte para "Larger Text" — por eso
// no escalar en absoluto es preferible a un tope intermedio que igual corta
// texto de forma inconsistente. Pendiente de revisar con más tiempo: bajar
// esto a un valor >1 recién cuando se audite el layout de los contenedores
// que envuelven texto.
export const TOPE_ESCALA_TEXTO = 1;

// Para texto en espacios muy compactos (chips, casillas de un dígito,
// contadores, grillas densas).
export const TOPE_ESCALA_TEXTO_COMPACTO = 1;
