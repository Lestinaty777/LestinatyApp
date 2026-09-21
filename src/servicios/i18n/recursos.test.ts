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

  it('declara todas las claves dinámicas de categorías del mapa', () => {
    const claves = ['habits', 'habitsSubtitle', 'routines', 'routinesSubtitle', 'tasks', 'tasksSubtitle'];

    for (const clave of claves) {
      expect(recursosI18n.es.translation.senderos.map.categories[clave as keyof typeof recursosI18n.es.translation.senderos.map.categories]).toBeTruthy();
      expect(recursosI18n.en.translation.senderos.map.categories[clave as keyof typeof recursosI18n.en.translation.senderos.map.categories]).toBeTruthy();
    }
  });

  it('declara las etiquetas explícitas de filtros de Tienda en ambos idiomas', () => {
    const claves = ['all', 'mySeeds', 'nature', 'elementals', 'buy'] as const;

    for (const clave of claves) {
      expect(recursosI18n.es.translation.tienda.screen.filters[clave]).toBeTruthy();
      expect(recursosI18n.en.translation.tienda.screen.filters[clave]).toBeTruthy();
    }
  });
});
