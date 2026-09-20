import { describe, expect, it } from 'vitest';

import { recursosI18n } from './recursos';

describe('recursosI18n', () => {
  it('declara las secciones bilingües del alcance de hábitos, senderos y onboarding', () => {
    const secciones = ['habitos', 'senderos', 'tienda', 'insights', 'perfil', 'arranque', 'onboarding', 'horizon'];

    expect(Object.keys(recursosI18n.es.translation)).toEqual(expect.arrayContaining(secciones));
    expect(Object.keys(recursosI18n.en.translation)).toEqual(expect.arrayContaining(secciones));
  });

  it('mantiene el copy del wizard de hábitos en ambos idiomas', () => {
    expect(recursosI18n.es.translation.habitos.crearWizard?.actions.createHabit).toBe('Crear mi hábito');
    expect(recursosI18n.en.translation.habitos.crearWizard?.actions.createHabit).toBe('Create my habit');
  });
});
