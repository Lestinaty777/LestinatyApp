import { describe, expect, it } from 'vitest';

import { datosARemoto, pasoARemoto } from './rutinas.remoto';
import type { CrearRutinaInput } from './rutinas.tipos';

const base: CrearRutinaInput = { titulo: '  Mañana  ', franja: 'manana', iconoLucide: 'sol', color: '#90010D', frecuencia: 'diaria', pasos: [] };

describe('pasoARemoto', () => {
  it('incluye el id solo en los pasos que lo traen', () => {
    expect(pasoARemoto({ origen: 'habito', habitoId: 'h1' })).toEqual({ tipo_origen: 'habito', habito_id: 'h1', esencial: true });
    expect(pasoARemoto({ id: 'p1', origen: 'habito', habitoId: 'h1', esencial: false })).toEqual({ id: 'p1', tipo_origen: 'habito', habito_id: 'h1', esencial: false });
    expect(pasoARemoto({ id: 'p2', origen: 'tarea', tareaId: 't1' })).toEqual({ id: 'p2', tipo_origen: 'tarea', tarea_id: 't1', esencial: true });
  });

  it('un paso propio simple no lleva objetivo; contador y cronómetro sí', () => {
    expect(pasoARemoto({ origen: 'propio', titulo: 'Respirar', modo: 'simple', objetivoValor: 9 }))
      .toEqual({ tipo_origen: 'propio', titulo: 'Respirar', modo: 'simple', esencial: true, objetivo_valor: null, unidad: null });
    expect(pasoARemoto({ id: 'p3', origen: 'propio', titulo: 'Leer', modo: 'cronometro', objetivoValor: 10, unidad: 'min' }))
      .toEqual({ id: 'p3', tipo_origen: 'propio', titulo: 'Leer', modo: 'cronometro', esencial: true, objetivo_valor: 10, unidad: 'min' });
  });
});

describe('datosARemoto', () => {
  it('recorta el título y aplica los valores por defecto', () => {
    expect(datosARemoto(base)).toEqual({
      titulo: 'Mañana', descripcion: null, franja: 'manana', icono_lucide: 'sol', color: '#90010D', frecuencia: 'diaria', dias_semana: null,
      hora_inicio: null, recordatorio_activo: false, mostrar_nombre_notificacion: true, pasos: [],
    });
  });

  it('solo envía días cuando la frecuencia es por días', () => {
    expect(datosARemoto({ ...base, diasSemana: [1, 3] }).dias_semana).toBeNull();
    expect(datosARemoto({ ...base, frecuencia: 'dias_semana', diasSemana: [1, 3] }).dias_semana).toEqual([1, 3]);
  });
});
