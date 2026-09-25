import { describe, expect, it } from 'vitest';

import { etiquetasDePerfil, etiquetasDeRegistro, resultadosDeRegistro } from './senalesNotificacion';
import type { ResultadoRegistroHabito } from './tipos';

const base: ResultadoRegistroHabito = {
  fechaLocal: '2026-09-25', gemasGanadas: 0, habitoId: 'h1', id: 'r1', mandalaPendiente: null,
  nivel: 2, nota: null, subioNivel: false, transicionSendero: null, valor: 3,
};

const nombres = (resultado: ResultadoRegistroHabito) => resultadosDeRegistro(resultado).map((r) => r.nombre);

describe('señales de notificación', () => {
  it('un progreso parcial sólo cuenta como progreso', () => {
    expect(nombres(base)).toEqual(['progreso_registrado']);
  });

  it('abrir la mandala del día cuenta como día completado', () => {
    const mandala = { ciclo: 1, color: null, estado: 'pendiente' as const, nivel: 2, nodoDia: 3, paqueteId: null, registroId: 'r1', semilla: 'x' };
    expect(nombres({ ...base, mandalaPendiente: mandala })).toEqual(['progreso_registrado', 'dia_completado']);
  });

  it('subir de nivel se reporta, y las gemas con su cantidad', () => {
    const resultados = resultadosDeRegistro({ ...base, gemasGanadas: 12, subioNivel: true });
    expect(resultados).toContainEqual({ nombre: 'nivel_subido' });
    expect(resultados).toContainEqual({ nombre: 'gemas_ganadas', valor: 12 });
  });

  it('el último registro va en segundos unix y el nivel nunca baja', () => {
    const etiquetas = etiquetasDeRegistro(base, new Date('2026-09-25T12:00:00Z'), 5);
    expect(etiquetas.ultimo_registro).toBe(String(Date.UTC(2026, 8, 25, 12) / 1000));
    expect(etiquetas.nivel_max).toBe('5');
  });

  it('las etiquetas de perfil son texto, como pide OneSignal', () => {
    expect(etiquetasDePerfil({ habitosActivos: 3, nivelMax: 2, rachaMax: 9 })).toEqual({ habitos_activos: '3', nivel_max: '2', racha_max: '9' });
  });
});
