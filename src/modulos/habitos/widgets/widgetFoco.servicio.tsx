import React from 'react';
import { Image, Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate } from 'react-native-android-widget';
import {
  limpiarIncrementosPendientesNativos,
  obtenerIncrementosPendientesNativos,
  sincronizarHabitoNativo,
  solicitarFijarWidgetNativo,
  suscribirIncrementoWidget,
} from '../../../../modules/habito-widget';

export { suscribirIncrementoWidget };
import { obtenerDetallesHabitosHoy, registrarProgresoHabito } from '../habitos.servicio';
import { obtenerAssetsPaqueteHabito } from '../paqueteVisual.assets';
import type { HabitoResumen } from '../tipos';
import { HabitoFocoWidget, WidgetSinHabitos } from './HabitoFocoWidget';
import { construirPropsHabitoFoco, elegirHabitoFoco } from './mapearHabitoWidget';
import { guardarHabitoWidgetSeleccionado, obtenerHabitoWidgetSeleccionadoId } from './widgetFocoAlmacen';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

export const NOMBRE_WIDGET_HABITO_FOCO = 'HabitoFoco';

/**
 * Sincroniza los datos del hábito tanto con el módulo nativo Kotlin (MasterGlass ultrarrápido)
 * como con react-native-android-widget (compatibilidad).
 */
export async function sincronizarWidgetFoco(habitos: HabitoResumen[], esPro = true): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const focoId = await obtenerHabitoWidgetSeleccionadoId();
    const habito = elegirHabitoFoco(habitos, focoId);

    // 1. Sincronización instantánea con el módulo nativo Kotlin (MasterGlass)
    if (habito) {
      const detalles = await obtenerDetallesHabitosHoy().catch(() => []);
      const detalle = detalles.find((item) => item.habitoId === habito.id);
      const nivel = detalle?.nivel ?? 1;
      const imagenEtapa = obtenerAssetsPaqueteHabito(habito.paqueteId, nivel).arbolPrincipal;

      await sincronizarHabitoNativo({
        actual: habito.valorHoy,
        color: habito.color || ESCALA_ESMERALDA.hoja.l61a,
        completado: habito.completado,
        diasCompletadosSemana: detalle?.diasCompletadosSemana ?? [],
        diasProgramados: detalle?.diasProgramados ?? [],
        esPro,
        habitoId: habito.id,
        // En release, Metro flatten-ea cada require() de assets a un drawable
        // nativo y resolveAssetSource(...).uri devuelve justo ese nombre de
        // recurso (sin extensión) — así el lado Kotlin no necesita reconstruir
        // rutas de carpetas irregulares por paquete.
        imagenEtapaRecurso: String(Image.resolveAssetSource(imagenEtapa).uri),
        meta: habito.meta > 0 ? habito.meta : 1,
        nivel,
        racha: detalle?.racha ?? 0,
        tipoMeta: habito.tipoMeta,
        titulo: habito.titulo,
        unidad: habito.unidad || (habito.tipoMeta === 'cantidad' ? 'veces' : ''),
      });
    }

    // 2. Procesar cualquier incremento que el usuario haya hecho desde el widget nativo
    await procesarIncrementosPendientesWidget();

    // 3. Respaldo para el handler JS
    await requestWidgetUpdate({
      renderWidget: () => (habito ? <HabitoFocoWidget {...construirPropsHabitoFoco(habito)} /> : <WidgetSinHabitos />),
      widgetName: NOMBRE_WIDGET_HABITO_FOCO,
    });
  } catch {
    // Si no hay ningún widget anclado aún, silencioso
  }
}

/**
 * Procesa incrementos registrados en el widget nativo en segundo plano y los envía a Supabase
 */
export async function procesarIncrementosPendientesWidget(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const pendientes = await obtenerIncrementosPendientesNativos();
    if (!pendientes || pendientes.length === 0) return;

    for (const item of pendientes) {
      try {
        await registrarProgresoHabito({
          fechaLocal: item.fechaLocal,
          habitoId: item.habitoId,
          valor: item.valor,
        });
      } catch {
        // Si falla la red, se intentará en la siguiente sincronización
      }
    }

    await limpiarIncrementosPendientesNativos();
  } catch {
  }
}

export async function elegirHabitoParaWidget(habitoId: string, habitos: HabitoResumen[], esPro = true): Promise<void> {
  await guardarHabitoWidgetSeleccionado(habitoId);
  await sincronizarWidgetFoco(habitos, esPro);
}

/**
 * Solicita al sistema anclar el widget nativo MasterGlass al Launcher
 */
export async function pedirAgregarWidgetFoco(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const fijadoNativo = await solicitarFijarWidgetNativo();
    if (fijadoNativo) return true;
    return await requestPinWidget({ widgetName: NOMBRE_WIDGET_HABITO_FOCO });
  } catch {
    return false;
  }
}
