import { describe, expect, it, vi } from 'vitest';

vi.mock('../base-datos/supabase', () => ({ obtenerClienteSupabase: () => { throw new Error('no se usa en estos tests'); } }));

import { crearAnalitica, sanearPropiedades, type ContextoAnalitica } from './posthog';

function armar(opciones: { clave?: string; contexto?: ContextoAnalitica | null; enviar?: () => Promise<unknown> } = {}) {
  const enviar = vi.fn(opciones.enviar ?? (async () => ({})));
  const obtenerContexto = vi.fn(async () => (opciones.contexto === undefined ? { usuarioId: 'u1', permitido: true } : opciones.contexto));
  let ahora = new Date('2026-10-09T10:00:00Z');
  const analitica = crearAnalitica({
    clave: opciones.clave ?? 'phc_prueba', host: 'https://us.i.posthog.com/', enviar, obtenerContexto, ahora: () => ahora,
  });
  return { analitica, avanzar: (ms: number) => { ahora = new Date(ahora.getTime() + ms); }, enviar, obtenerContexto };
}

describe('registrarEvento', () => {
  it('sin clave no envía ni consulta el permiso', async () => {
    const { analitica, enviar, obtenerContexto } = armar({ clave: '' });
    expect(await analitica.registrarEvento('habito_creado')).toBe(false);
    expect(enviar).not.toHaveBeenCalled();
    expect(obtenerContexto).not.toHaveBeenCalled();
  });

  it('sin sesión no envía', async () => {
    const { analitica, enviar } = armar({ contexto: null });
    expect(await analitica.registrarEvento('habito_creado')).toBe(false);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('sin el permiso de analítica no envía', async () => {
    const { analitica, enviar } = armar({ contexto: { usuarioId: 'u1', permitido: false } });
    expect(await analitica.registrarEvento('habito_creado')).toBe(false);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('con clave, sesión y permiso envía a /capture/ con el id de la cuenta', async () => {
    const { analitica, enviar } = armar();
    expect(await analitica.registrarEvento('rutina_creada', { num_pasos: 4, franja: 'manana' })).toBe(true);
    const [url, cuerpo] = enviar.mock.calls[0] as unknown as [string, string];
    expect(url).toBe('https://us.i.posthog.com/capture/');
    expect(JSON.parse(cuerpo)).toEqual({
      api_key: 'phc_prueba', event: 'rutina_creada', distinct_id: 'u1',
      properties: { num_pasos: 4, franja: 'manana' }, timestamp: '2026-10-09T10:00:00.000Z',
    });
  });

  it('un fallo de red no lanza', async () => {
    const { analitica } = armar({ enviar: async () => { throw new Error('sin red'); } });
    await expect(analitica.registrarEvento('habito_creado')).resolves.toBe(false);
  });

  it('recuerda el permiso unos minutos y lo vuelve a leer al reiniciar o al caducar', async () => {
    const { analitica, avanzar, obtenerContexto } = armar();
    await analitica.registrarEvento('a');
    await analitica.registrarEvento('b');
    expect(obtenerContexto).toHaveBeenCalledTimes(1);
    analitica.reiniciar();
    await analitica.registrarEvento('c');
    expect(obtenerContexto).toHaveBeenCalledTimes(2);
    avanzar(6 * 60 * 1000);
    await analitica.registrarEvento('d');
    expect(obtenerContexto).toHaveBeenCalledTimes(3);
  });
});

describe('sanearPropiedades', () => {
  it('conserva ids, tipos, números y booleanos', () => {
    expect(sanearPropiedades({ tipo: 'contador', num_pasos: 3, completa: true, area_codigo: null }))
      .toEqual({ tipo: 'contador', num_pasos: 3, completa: true, area_codigo: null });
  });

  it('descarta texto libre de la persona, textos largos, undefined y números no finitos', () => {
    expect(sanearPropiedades({
      titulo: 'Mi hábito secreto', descripcion: 'x', nota: 'y', nombre: 'Ana', habito_titulo: 'z',
      largo: 'x'.repeat(65), nada: undefined, raro: Number.NaN, ok: 1,
    })).toEqual({ ok: 1 });
    expect(sanearPropiedades(undefined)).toEqual({});
  });
});
