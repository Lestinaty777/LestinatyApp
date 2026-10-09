import { solicitarPermisoYRegistrar } from '../../nucleo/notificaciones/oneSignal';
import { actualizarPreferenciaNotificacion } from '../configuracion/configuracion.servicio';

/**
 * Lo que hace falta para que un recordatorio de rutina llegue de verdad: el
 * permiso nativo con el dispositivo registrado y la preferencia global
 * 'rutina_recordatorio' encendida (nace apagada). Mismo requisito que en
 * hábitos y tareas. Devuelve false si la persona no concedió el permiso.
 */
export async function prepararAvisosDeRutina(): Promise<boolean> {
  try {
    const resultado = await solicitarPermisoYRegistrar();
    if (resultado.estado !== 'concedido') return false;
    await actualizarPreferenciaNotificacion('rutina_recordatorio', true).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}
