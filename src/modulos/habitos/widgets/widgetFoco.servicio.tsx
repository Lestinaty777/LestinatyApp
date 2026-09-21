import React from 'react';
import { Image, Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate } from 'react-native-android-widget';
import {
  limpiarIncrementosPendientesNativos,
  obtenerIncrementosPendientesNativos,
  sincronizarListaHabitosNativo,
  solicitarFijarWidgetNativo,
  suscribirIncrementoWidget,
} from '../../../../modules/habito-widget';

export { suscribirIncrementoWidget };
import { obtenerTonoPaquete } from '../../../diseno';
import { obtenerDetallesHabitosHoy, registrarProgresoHabito } from '../habitos.servicio';
import { buscarIconoHabito } from '../iconosHabitos';
import { resolverPaqueteHabito } from '../paqueteHabito';
import { obtenerAssetsPaqueteHabito } from '../paqueteVisual.assets';
import type { HabitoResumen } from '../tipos';
import { HabitoFocoWidget, WidgetSinHabitos } from './HabitoFocoWidget';
import { construirPropsHabitoFoco, elegirHabitoFoco } from './mapearHabitoWidget';
import { guardarHabitoWidgetSeleccionado, obtenerHabitoWidgetSeleccionadoId } from './widgetFocoAlmacen';

export const NOMBRE_WIDGET_HABITO_FOCO = 'HabitoFoco';

/**
 * Sincroniza los datos del hábito tanto con el módulo nativo Kotlin (MasterGlass ultrarrápido)
 * como con react-native-android-widget (compatibilidad).
 */
export async function sincronizarWidgetFoco(habitos: HabitoResumen[], esPro = true): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const focoId = await obtenerHabitoWidgetSeleccionadoId();
    const habitoFoco = elegirHabitoFoco(habitos, focoId);
    const indiceInicial = habitoFoco ? Math.max(0, habitos.findIndex((h) => h.id === habitoFoco.id)) : 0;

    // Sincronización instantánea con el módulo nativo Kotlin — se manda la
    // lista COMPLETA de hábitos de hoy, no solo el foco: los chevrones del
    // widget navegan localmente entre todos, sin volver a llamar a JS.
    if (habitos.length > 0) {
      const detalles = await obtenerDetallesHabitosHoy().catch(() => []);

      const habitosWidget = habitos.map((habito) => {
        const detalle = detalles.find((item) => item.habitoId === habito.id);
        const nivel = detalle?.nivel ?? 1;
        const imagenEtapa = obtenerAssetsPaqueteHabito(habito.paqueteId, nivel).arbolPrincipal;
        const icono = buscarIconoHabito(habito.iconoLucide);

        // Mismo tono (rotación de tono + escala de saturación en HSL, sin
        // shader) que usa el resto de la UI para "personalizar" con el color
        // del paquete — acá se manda ya calculado, para que Kotlin solo
        // tenga que pintar un degradado con esos 3 colores, sin reimplementar
        // la rotación de matiz del lado nativo.
        const tono = obtenerTonoPaquete(resolverPaqueteHabito(habito.paqueteId), habito.colorPaquete || habito.color);

        return {
          actual: habito.valorHoy,
          color: habito.color,
          completado: habito.completado,
          fondoClaro: tono.degradados.menta.suave,
          fondoMedio: tono.degradados.menta.profunda,
          fondoOscuro: tono.degradados.menta.pie,
          habitoId: habito.id,
          iconoAcento: tono.acento,
          // En release, Metro flatten-ea cada require() de assets a un drawable
          // nativo y resolveAssetSource(...).uri devuelve justo ese nombre de
          // recurso (sin extensión) — así el lado Kotlin no necesita reconstruir
          // rutas de carpetas irregulares por paquete ni de íconos.
          iconoRecurso: icono ? String(Image.resolveAssetSource(icono.fuente).uri) : undefined,
          imagenEtapaRecurso: String(Image.resolveAssetSource(imagenEtapa).uri),
          meta: habito.meta > 0 ? habito.meta : 1,
          tipoMeta: habito.tipoMeta,
          titulo: habito.titulo,
          unidad: habito.unidad || (habito.tipoMeta === 'cantidad' ? 'veces' : ''),
        };
      });

      await sincronizarListaHabitosNativo({ esPro, habitos: habitosWidget, indiceInicial });
    }

    // 2. Procesar cualquier incremento que el usuario haya hecho desde el widget nativo
    await procesarIncrementosPendientesWidget();

    // 3. Respaldo para el handler JS
    await requestWidgetUpdate({
      renderWidget: () => (habitoFoco ? <HabitoFocoWidget {...construirPropsHabitoFoco(habitoFoco)} /> : <WidgetSinHabitos />),
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
