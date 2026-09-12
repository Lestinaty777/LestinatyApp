import { describe, expect, it } from 'vitest';

import { decidirDespachoHabito } from './despachoHabitos';

describe('decidirDespachoHabito', () => {
  it('oculta el nombre del hábito cuando el plan no autorizó mostrarlo', () => {
    expect(decidirDespachoHabito({ dispositivoConcedido: true, mostrarNombre: false, nombreHabito: 'Meditar', preferenciaActiva: true }))
      .toEqual({ accion: 'enviar', cuerpo: 'Una pequeña acción cuenta hoy.', titulo: 'Es momento de tu hábito' });
  });

  it('redacta un recordatorio amable con el nombre cuando fue autorizado', () => {
    expect(decidirDespachoHabito({ dispositivoConcedido: true, mostrarNombre: true, nombreHabito: 'Meditar', preferenciaActiva: true }))
      .toEqual({ accion: 'enviar', cuerpo: 'Tu hábito Meditar te espera. Una pequeña acción cuenta hoy.', titulo: 'Meditar' });
  });

  it('cancela el recordatorio si la preferencia dejó de estar activa', () => {
    expect(decidirDespachoHabito({ dispositivoConcedido: true, mostrarNombre: true, nombreHabito: 'Meditar', preferenciaActiva: false }))
      .toEqual({ accion: 'cancelar', razon: 'preferencia_inactiva' });
  });

  it('cancela el recordatorio cuando ya no hay dispositivo Android con permiso', () => {
    expect(decidirDespachoHabito({ dispositivoConcedido: false, mostrarNombre: true, nombreHabito: 'Meditar', preferenciaActiva: true }))
      .toEqual({ accion: 'cancelar', razon: 'sin_dispositivo' });
  });
});
