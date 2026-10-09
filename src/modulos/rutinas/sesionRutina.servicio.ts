import { fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { registrarProgresoHabito } from '../habitos/habitos.servicio';
import { completarTareaDia, registrarProgresoTarea, registrarProgresoTareaUnica } from '../tareas/tareas.servicio';
import type { PasoRutina } from './rutinas.tipos';
import { completarPasoPropioRutina } from './rutinas.servicio';
import { resolverCompletadoExterno } from './sesionRutina';

/**
 * Marca un paso como hecho con su meta completa (el atajo de "terminé"). Los pasos
 * propios van por completar_paso_propio_rutina; los de hábito y tarea, por los RPC de
 * su propio módulo, así sus árboles, niveles y gemas avanzan como si se hubieran
 * hecho desde su pantalla. `valor` solo aplica a pasos propios (avance parcial de un contador).
 */
export async function completarPasoSesion(paso: PasoRutina, valor?: number): Promise<void> {
  if (paso.origen === 'propio') {
    await completarPasoPropioRutina(paso.id, valor ?? paso.objetivoValor ?? 1);
    return;
  }
  const accion = resolverCompletadoExterno(paso);
  if (!accion) return;
  const fechaLocal = fechaLocalHoy();
  if (accion.accion === 'habito' && paso.habitoId) {
    await registrarProgresoHabito({ habitoId: paso.habitoId, fechaLocal, valor: accion.valor });
    return;
  }
  if (!paso.tareaId) return;
  if (accion.accion === 'completar_tarea_dia') await completarTareaDia(paso.tareaId, fechaLocal);
  else if (accion.accion === 'registrar_progreso_tarea') await registrarProgresoTarea({ tareaId: paso.tareaId, fechaLocal, valor: accion.valor });
  else if (accion.accion === 'registrar_progreso_tarea_unica') await registrarProgresoTareaUnica(paso.tareaId, accion.valor);
}

/** Qué consultas refrescar tras completar un paso: la rutina y lo que el paso pudo mover en otros módulos. */
export const CLAVES_TRAS_PASO = [
  ['rutinas', 'lista'],
  ['habitos', 'panel'],
  ['habitos', 'detalles-hoy'],
  ['tareas', 'hoy'],
  ['tareas', 'lista'],
  ['tienda', 'saldoGemas'],
  ['hoy', 'resumen'],
] as const;
