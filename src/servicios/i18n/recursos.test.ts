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

  it('declara las claves de arranque y onboarding en ambos idiomas de forma simétrica', () => {
    expect(recursosI18n.es.translation.arranque.bienvenida.titulo).toBe('Bienvenido a');
    expect(recursosI18n.en.translation.arranque.bienvenida.titulo).toBe('Welcome to');

    expect(recursosI18n.es.translation.onboarding.intro.slide1.title).toBe('Cultiva tu vida');
    expect(recursosI18n.en.translation.onboarding.intro.slide1.title).toBe('Cultivate your life');

    expect(recursosI18n.es.translation.onboarding.regaloBienvenida.title).toBe('Elegí tu árbol');
    expect(recursosI18n.en.translation.onboarding.regaloBienvenida.title).toBe('Choose your tree');

    expect(recursosI18n.es.translation.onboarding.formularioAcceso.submitCreate).toBe('Crear cuenta');
    expect(recursosI18n.en.translation.onboarding.formularioAcceso.submitCreate).toBe('Create account');
  });

  it('garantiza paridad completa de claves para arranque y onboarding', () => {
    function getKeys(obj: any, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return getKeys(val, newKey);
        }
        return [newKey];
      });
    }

    const arranqueEs = getKeys(recursosI18n.es.translation.arranque);
    const arranqueEn = getKeys(recursosI18n.en.translation.arranque);
    expect(arranqueEs.sort()).toEqual(arranqueEn.sort());

    const onboardingEs = getKeys(recursosI18n.es.translation.onboarding);
    const onboardingEn = getKeys(recursosI18n.en.translation.onboarding);
    expect(onboardingEs.sort()).toEqual(onboardingEn.sort());
  });

  it('garantiza paridad completa de claves para Task 6 (horizon, tienda.gemas y subpantallas de habitos)', () => {
    function getKeys(obj: any, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return getKeys(val, newKey);
        }
        return [newKey];
      });
    }

    expect(getKeys(recursosI18n.es.translation.horizon).sort()).toEqual(getKeys(recursosI18n.en.translation.horizon).sort());
    expect(getKeys(recursosI18n.es.translation.tienda.gemas).sort()).toEqual(getKeys(recursosI18n.en.translation.tienda.gemas).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.detalle).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.detalle).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.progresion).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.progresion).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.recordatorios).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.recordatorios).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.widgets).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.widgets).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.categorias).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.categorias).sort());
    expect(getKeys(recursosI18n.es.translation.habitos.categoriaPantalla).sort()).toEqual(getKeys(recursosI18n.en.translation.habitos.categoriaPantalla).sort());
  });

  it('garantiza paridad completa de claves para Task 7 (subpantallas de senderos)', () => {
    function getKeys(obj: any, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return getKeys(val, newKey);
        }
        return [newKey];
      });
    }

    expect(getKeys(recursosI18n.es.translation.senderos.detalle).sort()).toEqual(getKeys(recursosI18n.en.translation.senderos.detalle).sort());
    expect(getKeys(recursosI18n.es.translation.senderos.mision).sort()).toEqual(getKeys(recursosI18n.en.translation.senderos.mision).sort());
    expect(getKeys(recursosI18n.es.translation.senderos.analisis).sort()).toEqual(getKeys(recursosI18n.en.translation.senderos.analisis).sort());
    expect(getKeys(recursosI18n.es.translation.senderos.vistaPrevia).sort()).toEqual(getKeys(recursosI18n.en.translation.senderos.vistaPrevia).sort());
  });

  it('declara las nueve claves de senderos.levels (progresión infinita) en ambos idiomas', () => {
    const claves = [
      'locked', 'completed', 'masteryCycle', 'daysProgress', 'completePrevious',
      'availableNextScheduledDay', 'finalChest', 'gemsReward', 'videoFallback',
    ] as const;

    for (const clave of claves) {
      expect(recursosI18n.es.translation.senderos.levels[clave]).toBeTruthy();
      expect(recursosI18n.en.translation.senderos.levels[clave]).toBeTruthy();
    }
    expect(Object.keys(recursosI18n.es.translation.senderos.levels).sort()).toEqual(Object.keys(recursosI18n.en.translation.senderos.levels).sort());
  });

  it('declara el selector de idioma del perfil en ambos idiomas', () => {
    expect(recursosI18n.es.translation.perfil.settings.languageGroup).toBe('IDIOMA');
    expect(recursosI18n.es.translation.perfil.settings.languageSpanish).toBe('Español');
    expect(recursosI18n.en.translation.perfil.settings.languageGroup).toBe('LANGUAGE');
    expect(recursosI18n.en.translation.perfil.settings.languageEnglish).toBe('English');
  });

  it('declara las vistas de la sección Hoy en ambos idiomas', () => {
    expect(recursosI18n.es.translation.habitos.pantalla.todayViewTimeline).toBe('Vista de sendero');
    expect(recursosI18n.en.translation.habitos.pantalla.todayViewCards).toBe('Card view');
  });
});
