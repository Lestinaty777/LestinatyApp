// Supabase Edge Function (compartido). Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
//
// Disponibilidad real del usuario por momento del día (mañana/tarde/noche,
// con cuánto tiempo tiene en cada uno) — reemplaza el viejo "bloques por
// día: 1/2/3". Se persiste en planes_items.disponibilidad para que
// detallar-seccion-plan use la MISMA disponibilidad en las secciones
// siguientes, no solo generar-plan-inicial en la primera.
//
// Verificado contra Gemini real antes de este cambio: con "hasta N bloques"
// el modelo a veces omitía un bloque entero; con disponibilidad explícita +
// la instrucción "incluí siempre estos momentos, nunca los omitas" el
// resultado fue 0 momentos faltantes en las pruebas (ver sesión de diseño).
import { z } from 'npm:zod@4';

export const MOMENTOS = ['manana', 'tarde', 'noche'] as const;
const NIVELES = ['poco', 'moderado'] as const;
// Cada momento es una ventana de 6h (ver VENTANA_MOMENTO en CrearPlanWizard.tsx
// del lado del cliente) — el tope coincide con esa ventana para que "bastante"
// nunca pida más minutos de los que el momento tiene.
const MINUTOS_CUSTOM_MIN = 61;
const MINUTOS_CUSTOM_MAX = 360;
const valorDisponibilidadSchema = z.union([z.enum(NIVELES), z.number().int().min(MINUTOS_CUSTOM_MIN).max(MINUTOS_CUSTOM_MAX)]);

export const disponibilidadSchema = z.object({
  manana: valorDisponibilidadSchema.optional(),
  noche: valorDisponibilidadSchema.optional(),
  tarde: valorDisponibilidadSchema.optional(),
}).refine((valor) => Object.keys(valor).length > 0, { message: 'Elegi al menos un momento del dia.' });

const DESCRIPCION_NIVEL: Record<(typeof NIVELES)[number], string> = {
  moderado: 'tenes tiempo moderado ahi (30 min a 1 hora) — 2 items',
  poco: 'tenes poco tiempo ahi (15 a 30 min) — un solo item corto, nada mas',
};

function descripcionMinutosCustom(minutos: number): string {
  const items = minutos <= 90 ? 3 : minutos <= 150 ? 4 : minutos <= 240 ? 5 : 6;
  return `tenes bastante tiempo ahi (${minutos} min, elegido por el usuario) — ${items} items, podes ser bien ambicioso`;
}

// Fragmento de prompt reusado por generar-plan-inicial (primera sección) y
// detallar-seccion-plan (secciones siguientes).
export function instruccionDisponibilidad(disponibilidad: Record<string, number | string>): string {
  const momentos = Object.keys(disponibilidad);
  const lineas = momentos.map((momento) => {
    const valor = disponibilidad[momento];
    const descripcion = typeof valor === 'number' ? descripcionMinutosCustom(valor) : DESCRIPCION_NIVEL[valor as (typeof NIVELES)[number]];
    return `- ${momento}: ${descripcion}.`;
  }).join('\n');
  return [
    'DISPONIBILIDAD DE TIEMPO del usuario, por momento del dia — esto es informacion real que te dio el usuario, respetala siempre:',
    lineas,
    `TODOS los dias tienen que incluir EXACTAMENTE estos momentos, siempre los mismos: ${momentos.join(', ')}. Nunca omitas uno de estos momentos en ningun dia, y nunca agregues un momento que no este en esta lista.`,
  ].join('\n');
}
