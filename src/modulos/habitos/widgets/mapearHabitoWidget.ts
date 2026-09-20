import type { ImageRequireSource } from 'react-native';
import { buscarIconoHabito } from '../iconosHabitos';
import type { HabitoResumen } from '../tipos';
import type { HabitoFocoWidgetProps } from './HabitoFocoWidget';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

// Los widgets siempre muestran un ícono real de assets/icons/ui — nunca un
// avatar con la inicial del título. Se carga con un require() literal (no vía
// registroIconos) para que el respaldo exista pase lo que pase, incluso si el
// id guardado en el hábito quedó viejo o no matchea ningún ícono registrado.
const ICONO_POR_DEFECTO = require('../../../../assets/icons/ui/hoja.png') as ImageRequireSource;

// Único lugar que traduce un HabitoResumen real a las props del widget —
// lo usan tanto el task handler headless (WIDGET_ADDED/UPDATE/CLICK) como la
// sincronización en caliente desde la app (requestWidgetUpdate), para que
// ambos caminos armen exactamente el mismo widget.
export function construirPropsHabitoFoco(habito: HabitoResumen, racha = 0): HabitoFocoWidgetProps {
  const icono = buscarIconoHabito(habito.iconoLucide);
  return {
    actual: habito.valorHoy,
    color: habito.color || ESCALA_ESMERALDA.hoja.l61a,
    completado: habito.completado,
    habitoId: habito.id,
    iconoFuente: icono ? (icono.fuente as unknown as ImageRequireSource) : ICONO_POR_DEFECTO,
    meta: habito.meta > 0 ? habito.meta : 1,
    racha,
    titulo: habito.titulo,
    unidad: habito.unidad || (habito.tipoMeta === 'cantidad' ? 'veces' : ''),
  };
}

/** Elige qué hábito mostrar en el widget: el elegido por el usuario si sigue existiendo, si no el primero pendiente, si no el primero. */
export function elegirHabitoFoco(habitos: HabitoResumen[], focoId: string | null): HabitoResumen | undefined {
  return habitos.find((h) => h.id === focoId) ?? habitos.find((h) => !h.completado) ?? habitos[0];
}
