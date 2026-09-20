import { expect, it } from 'vitest';

import { resumirHabitosActivos } from './resumenHabitosActivos';

it('incluye un hábito de lunes a viernes al abrir Mis hábitos un sábado', () => {
  const habitos = resumirHabitosActivos({
    fecha: '2026-09-20',
    items: [{ id: 'meditar', titulo: 'Meditar', descripcion: null, icono_lucide: 'meditar', color: '#AB51FB', tipo_meta: 'duracion', unidad: 'min', paquete_id: 'mathist' }],
    planes: [{ habito_id: 'meditar', frecuencia: 'dias_semana', dias_semana: [1, 2, 3, 4, 5], objetivo_valor: 10, desde_fecha: '2026-09-20', hasta_fecha: null }],
    registros: [],
  });

  expect(habitos).toEqual([{
    id: 'meditar', titulo: 'Meditar', descripcion: null, iconoLucide: 'meditar', color: '#AB51FB', tipoMeta: 'duracion', unidad: 'min', meta: 10, valorHoy: 0, completado: false, paqueteId: 'mathist',
  }]);
});
