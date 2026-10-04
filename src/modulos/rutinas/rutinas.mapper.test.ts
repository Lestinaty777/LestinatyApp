import { describe, expect, it } from 'vitest';

import { mapearResultadoPasoPropio, mapearRutina, mapearRutinas } from './rutinas.mapper';

const pasoCrudo = {
  id: 'p1', orden: 1, origen: 'habito', habito_id: 'h1', tarea_id: null, titulo: 'Meditar', icono_lucide: 'meditar',
  color: '#029060', modo: 'simple', objetivo_valor: '1', unidad: null, aplica: true, completo: false, valor: null,
};
const rutinaCruda = {
  id: 'r1', titulo: 'Mañana', descripcion: null, franja: 'manana', icono_lucide: 'sol', color: '#90010D', estado: 'activa',
  frecuencia: 'dias_semana', dias_semana: [1, 3, 5], hora_inicio: '07:30', recordatorio_activo: true,
  mostrar_nombre_notificacion: true, toca_hoy: true, pasos: [pasoCrudo],
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
