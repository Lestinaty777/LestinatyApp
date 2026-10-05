import { describe, expect, it } from 'vitest';

import { mapearResultadoCierreRutina, mapearResultadoPasoPropio, mapearRutina, mapearRutinas } from './rutinas.mapper';

const pasoCrudo = {
  id: 'p1', orden: 1, origen: 'habito', habito_id: 'h1', tarea_id: null, titulo: 'Meditar', icono_lucide: 'meditar',
  color: '#029060', modo: 'simple', objetivo_valor: '1', unidad: null, aplica: true, completo: false, valor: null,
};
const rutinaCruda = {
  id: 'r1', titulo: 'Mañana', descripcion: null, franja: 'manana', icono_lucide: 'sol', color: '#90010D', estado: 'activa',
  frecuencia: 'dias_semana', dias_semana: [1, 3, 5], hora_inicio: '07:30', recordatorio_activo: true,
  mostrar_nombre_notificacion: true, toca_hoy: true, sesion_iniciada_en: '2026-10-05T08:00:00Z', sesion_completada_en: null, pasos: [pasoCrudo],
};

describe('mapearRutina', () => {
  it('mapea una rutina válida a camelCase y convierte numéricos', () => {
    const rutina = mapearRutina(rutinaCruda);
    expect(rutina).toMatchObject({
      id: 'r1', franja: 'manana', diasSemana: [1, 3, 5], horaInicio: '07:30', recordatorioActivo: true, tocaHoy: true,
    });
    expect(rutina.pasos[0]).toMatchObject({ habitoId: 'h1', objetivoValor: 1, aplica: true, completo: false, valor: null });
  });

  it('ordena los pasos por orden', () => {
    const rutina = mapearRutina({ ...rutinaCruda, pasos: [{ ...pasoCrudo, id: 'b', orden: 2 }, { ...pasoCrudo, id: 'a', orden: 1 }] });
    expect(rutina.pasos.map((paso) => paso.id)).toEqual(['a', 'b']);
  });

  it('frecuencia diaria: diasSemana queda null y sin hora queda null', () => {
    const rutina = mapearRutina({ ...rutinaCruda, frecuencia: 'diaria', dias_semana: null, hora_inicio: null });
    expect(rutina.diasSemana).toBeNull();
    expect(rutina.horaInicio).toBeNull();
  });

  it('rechaza franja, modo o estructura inválidos', () => {
    expect(() => mapearRutina({ ...rutinaCruda, franja: 'madrugada' })).toThrow(/franja/);
    expect(() => mapearRutina({ ...rutinaCruda, pasos: [{ ...pasoCrudo, modo: 'raro' }] })).toThrow(/modo/);
    expect(() => mapearRutina({ ...rutinaCruda, pasos: 'no' })).toThrow(/pasos/);
    expect(() => mapearRutina(null)).toThrow();
  });
});

describe('sesión y pasos esenciales', () => {
  it('mapea el estado de la sesión de hoy', () => {
    const rutina = mapearRutina(rutinaCruda);
    expect(rutina.sesionIniciadaEn).toBe('2026-10-05T08:00:00Z');
    expect(rutina.sesionCompletadaEn).toBeNull();
  });

  it('esencial es true salvo que el servidor diga false; tarea_tipo y tarea_frecuencia se validan', () => {
    expect(mapearRutina(rutinaCruda).pasos[0].esencial).toBe(true);
    const opcional = mapearRutina({ ...rutinaCruda, pasos: [{ ...pasoCrudo, esencial: false, tarea_tipo: 'contador', tarea_frecuencia: 'dias_semana' }] }).pasos[0];
    expect(opcional).toMatchObject({ esencial: false, tareaTipo: 'contador', tareaFrecuencia: 'dias_semana' });
    const raro = mapearRutina({ ...rutinaCruda, pasos: [{ ...pasoCrudo, tarea_tipo: 'kanban', tarea_frecuencia: 'nunca' }] }).pasos[0];
    expect(raro).toMatchObject({ tareaTipo: null, tareaFrecuencia: null });
  });
});

describe('mapearResultadoCierreRutina', () => {
  it('mapea el cierre de la sesión', () => {
    expect(mapearResultadoCierreRutina({ rutina_id: 'r1', completa: true, requeridos: 2, requeridos_completos: 2, completada_en: '2026-10-05T09:00:00Z' }))
      .toEqual({ rutinaId: 'r1', completa: true, requeridos: 2, requeridosCompletos: 2, completadaEn: '2026-10-05T09:00:00Z' });
    expect(mapearResultadoCierreRutina({ rutina_id: 'r1', completa: false, requeridos: 2, requeridos_completos: 1, completada_en: null }).completadaEn).toBeNull();
    expect(() => mapearResultadoCierreRutina(null)).toThrow();
  });
});

describe('mapearRutinas', () => {
  it('mapea una lista y rechaza lo que no es lista', () => {
    expect(mapearRutinas([rutinaCruda])).toHaveLength(1);
    expect(mapearRutinas([])).toEqual([]);
    expect(() => mapearRutinas({})).toThrow();
  });
});

describe('mapearResultadoPasoPropio', () => {
  it('mapea el resultado del RPC', () => {
    expect(mapearResultadoPasoPropio({ paso_id: 'p1', valor: '10', completo: true })).toEqual({ pasoId: 'p1', valor: 10, completo: true });
  });
});
