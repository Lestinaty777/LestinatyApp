import type { CrearRutinaInput, PasoNuevoRutina } from './rutinas.tipos';

// Forma que esperan crear_rutina (migración 81) y actualizar_rutina (85) en
// p_datos. Funciones puras, separadas del servicio para poder probarlas.

export function pasoARemoto(paso: PasoNuevoRutina) {
  const esencial = paso.esencial ?? true;
  const id = paso.id ? { id: paso.id } : {};
  if (paso.origen === 'habito') return { ...id, tipo_origen: 'habito', habito_id: paso.habitoId, esencial };
  if (paso.origen === 'tarea') return { ...id, tipo_origen: 'tarea', tarea_id: paso.tareaId, esencial };
  return {
    ...id, tipo_origen: 'propio', titulo: paso.titulo, modo: paso.modo, esencial,
    objetivo_valor: paso.modo === 'simple' ? null : paso.objetivoValor ?? null, unidad: paso.unidad ?? null,
  };
}

export function datosARemoto(input: CrearRutinaInput) {
  return {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion ?? null,
    franja: input.franja,
    icono_lucide: input.iconoLucide,
    color: input.color,
    frecuencia: input.frecuencia,
    dias_semana: input.frecuencia === 'dias_semana' ? input.diasSemana ?? null : null,
    hora_inicio: input.horaInicio ?? null,
    recordatorio_activo: input.recordatorioActivo ?? false,
    mostrar_nombre_notificacion: input.mostrarNombreNotificacion ?? true,
    pasos: input.pasos.map(pasoARemoto),
  };
}
