import { expect, it } from 'vitest';

import { configuracionInicialAby } from '../estado/abyConversacion.reducer';
import { obtenerSiguienteRespuestaMock } from './propuestaAby.mock';

it('pregunta un examen en el orden definido antes de proponerlo', () => {
  const base = { ...configuracionInicialAby, intencion: 'examen' as const, objetivo: 'Parcial de Anatomía' };
  expect(obtenerSiguienteRespuestaMock(base).pregunta?.id).toBe('fecha-examen');
  expect(obtenerSiguienteRespuestaMock({ ...base, fechaExamen: '2026-10-18' }).pregunta?.id).toBe('alcance');
  expect(obtenerSiguienteRespuestaMock({ ...base, fechaExamen: '2026-10-18', alcance: 'Capítulos 1 al 4' }).pregunta?.id).toBe('fuente');
});
