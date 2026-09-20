import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { obtenerPanelHabitos, registrarProgresoHabito } from '../habitos.servicio';
import type { HabitoResumen } from '../tipos';
import { HabitoFocoWidget, WidgetSinHabitos } from './HabitoFocoWidget';
import { construirPropsHabitoFoco, elegirHabitoFoco } from './mapearHabitoWidget';
import { obtenerHabitoWidgetSeleccionadoId } from './widgetFocoAlmacen';

// "Nombre" con el que se referencia cada widget — debe coincidir con el
// `name` configurado en el plugin de Expo (app.json) y con lo que se pasa a
// requestWidgetUpdate/requestPinWidget desde la app.
const nameToWidget = {
  HabitoFoco: HabitoFocoWidget,
} as const;

/** Cuánto avanza el hábito con un solo toque en "+" del widget — mismo criterio simple que ya usaba la simulación de WidgetsHabitosPantalla. */
function siguienteValor(habito: HabitoResumen): number {
  if (habito.tipoMeta === 'check') return habito.meta;
  const paso = habito.meta >= 10 ? Math.max(1, Math.round(habito.meta / 8)) : 1;
  return Math.min(habito.meta, habito.valorHoy + paso);
}

async function renderizarHabitoFoco(renderWidget: WidgetTaskHandlerProps['renderWidget']) {
  try {
    const panel = await obtenerPanelHabitos();
    const habitos = panel.hoy.datos;
    const focoId = await obtenerHabitoWidgetSeleccionadoId();
    const habito = elegirHabitoFoco(habitos, focoId);
    if (!habito) {
      renderWidget(<WidgetSinHabitos />);
      return;
    }
    renderWidget(<HabitoFocoWidget {...construirPropsHabitoFoco(habito)} />);
  } catch {
    // Sesión vencida, sin red, etc. — un widget con un mensaje es mejor que uno roto o congelado.
    renderWidget(<WidgetSinHabitos mensaje="Abre Lestinaty para actualizar" />);
  }
}

// Handler headless: Android lo invoca fuera de cualquier pantalla de la app
// (al agregar el widget, en su actualización periódica, al tocarlo...). Corre
// en el mismo bundle JS de la app, así que la sesión de Supabase persistida en
// AsyncStorage está disponible sin pasos extra.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];
  if (!Widget) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderizarHabitoFoco(props.renderWidget);
      break;

    case 'WIDGET_CLICK':
      if (props.clickAction === 'INCREMENTAR') {
        const { habitoId } = props.clickActionData as { habitoId: string };
        try {
          const panel = await obtenerPanelHabitos();
          const habito = panel.hoy.datos.find((h) => h.id === habitoId);
          if (habito && !habito.completado) {
            await registrarProgresoHabito({ fechaLocal: fechaLocalHoy(), habitoId, valor: siguienteValor(habito) });
          }
        } catch {
          // Si falla el registro (sin red...), igual refrescamos con el último estado conocido.
        }
        await renderizarHabitoFoco(props.renderWidget);
      }
      break;

    case 'WIDGET_DELETED':
    default:
      break;
  }
}
