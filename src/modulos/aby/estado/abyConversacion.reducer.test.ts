import { describe, expect, it } from 'vitest';

import { estadoInicialConversacionAby, reducirConversacionAby } from './abyConversacion.reducer';
import { obtenerSiguienteRespuestaMock } from '../datos/propuestaAby.mock';

describe('reducirConversacionAby', () => {
  it('borra las respuestas dependientes al editar la frecuencia', () => {
    const configurado = [
      { objetivo: 'Quiero hacer ejercicio', tipo: 'definir-objetivo' as const },
      { tipo: 'definir-tipo' as const, valor: 'ciclico' as const },
      { diasSemana: [1, 3, 5], tipo: 'definir-dias' as const },
      { duracionMinutos: 25, tipo: 'definir-duracion' as const },
    ].reduce(reducirConversacionAby, estadoInicialConversacionAby);

    const editado = reducirConversacionAby(configurado, { preguntaId: 'frecuencia', tipo: 'editar' });

    expect(editado.configuracion).toEqual({
      diasSemana: [],
      duracionMinutos: null,
      objetivo: 'Quiero hacer ejercicio',
      tipo: 'ciclico',
    });
    expect(editado.pasosCompletados).toBe(2);
  });

  it('mantiene la propuesta temporal hasta que la persona la confirma', () => {
    const configurado = [
      { objetivo: 'Quiero hacer ejercicio', tipo: 'definir-objetivo' as const },
      { tipo: 'definir-tipo' as const, valor: 'ciclico' as const },
      { diasSemana: [1, 3], tipo: 'definir-dias' as const },
      { duracionMinutos: 25, tipo: 'definir-duracion' as const },
    ].reduce(reducirConversacionAby, estadoInicialConversacionAby);
    const turno = obtenerSiguienteRespuestaMock(configurado.configuracion);
    if (turno.tipo !== 'propuesta') throw new Error('La configuracion debe producir una propuesta');

    const conPropuesta = reducirConversacionAby(configurado, { tipo: 'recibir-turno', turno });
    expect(conPropuesta.propuestaTemporal).toEqual(turno.propuesta);
    expect(conPropuesta.propuestaConfirmada).toBeNull();
    expect(reducirConversacionAby(conPropuesta, { tipo: 'confirmar-propuesta' }).propuestaConfirmada).toEqual(turno.propuesta);
  });
});
