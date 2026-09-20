import { expect, it } from 'vitest';

import { validarEdicionHabito } from './gestionDetalleHabito';

it('exige al menos un día cuando la frecuencia es por días', () => {
  expect(validarEdicionHabito({ titulo: 'Meditar', descripcion: '', iconoLucide: 'meditar', tipoMeta: 'duracion', unidad: 'min', meta: 10, frecuencia: 'dias_semana', diasSemana: [], vecesPorSemana: null, recordatorioActivo: false, horaRecordatorio: null, mostrarNombreNotificacion: false })).toBe('Selecciona al menos un día.');
});
