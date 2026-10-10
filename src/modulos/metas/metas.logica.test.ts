import { describe, expect, it } from 'vitest';

import {
  agruparElementosPorTipo, balanceDeAreas, borradorAInput, borradorDesdeMeta, BORRADOR_META_VACIO, contarMetasPorArea, elementosDeLaMeta, filtrarMetasPorArea,
  leerDuracionDias, resumirMetas, SIN_AREA_META, validarBorradorMeta, type ElementoDeMeta,
} from './metas.logica';
import type { MetaVida } from './metas.tipos';

const area = (id: string) => ({ id, codigo: id, nombre: id, color: '#EF4444', iconoLucide: 'Dumbbell' });

function meta(sobrescribir: Partial<MetaVida> = {}): MetaVida {
  return {
    id: 'm', titulo: 'Meta', descripcion: null, estado: 'activa', iconoLucide: null, color: null, fechaInicio: '2026-10-01',
    duracionDias: null, diaActual: 1, diasRestantes: null, logradaEn: null, orden: 0, area: area('cuerpo'),
    conteos: { habitos: 0, tareas: 0, rutinas: 0, planes: 0 }, ...sobrescribir,
  };
}

describe('filtro y conteo por área', () => {
  const metas = [meta({ id: 'a' }), meta({ id: 'b', area: area('estudios') }), meta({ id: 'c', area: null })];

  it('null no filtra, un id filtra por área y sin_area deja las que no tienen', () => {
    expect(filtrarMetasPorArea(metas, null).map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(filtrarMetasPorArea(metas, 'estudios').map((m) => m.id)).toEqual(['b']);
    expect(filtrarMetasPorArea(metas, SIN_AREA_META).map((m) => m.id)).toEqual(['c']);
    expect(filtrarMetasPorArea(metas, 'finanzas')).toEqual([]);
  });

  it('cuenta las metas de cada área, con null para las que no tienen', () => {
    const conteo = contarMetasPorArea([...metas, meta({ id: 'd' })]);
    expect(conteo.get('cuerpo')).toBe(2);
    expect(conteo.get('estudios')).toBe(1);
    expect(conteo.get(null)).toBe(1);
  });
});

describe('resumirMetas', () => {
  it('cuenta por estado y calcula el porcentaje de logradas', () => {
    const resumen = resumirMetas([meta(), meta({ estado: 'pausada' }), meta({ estado: 'lograda' }), meta({ estado: 'lograda' })]);
    expect(resumen).toMatchObject({ activas: 1, pausadas: 1, logradas: 2, porcentajeLogradas: 50 });
  });

  it('sin metas el porcentaje es 0 y no hay próxima a vencer', () => {
    expect(resumirMetas([])).toEqual({ activas: 0, pausadas: 0, logradas: 0, porcentajeLogradas: 0, proximaAVencer: null });
  });

  it('la próxima a vencer es la activa con plazo a la que menos días le quedan', () => {
    const resumen = resumirMetas([
      meta({ id: 'sin-plazo' }),
      meta({ id: 'lejos', duracionDias: 60, diasRestantes: 40 }),
      meta({ id: 'cerca', duracionDias: 30, diasRestantes: 3 }),
      meta({ id: 'pausada', estado: 'pausada', duracionDias: 10, diasRestantes: 1 }),
    ]);
    expect(resumen.proximaAVencer?.id).toBe('cerca');
  });
});

describe('borrador de meta', () => {
  const valido = { ...BORRADOR_META_VACIO, titulo: ' Correr 5 km ', areaId: 'a1' };

  it('exige título, área y, si hay plazo, una duración válida', () => {
    expect(validarBorradorMeta(valido)).toBeNull();
    expect(validarBorradorMeta({ ...valido, titulo: '   ' })).toBe('titulo');
    expect(validarBorradorMeta({ ...valido, titulo: 'x'.repeat(121) })).toBe('titulo');
    expect(validarBorradorMeta({ ...valido, areaId: null })).toBe('area');
    expect(validarBorradorMeta({ ...valido, conPlazo: true, duracionDias: '0' })).toBe('duracion');
    expect(validarBorradorMeta({ ...valido, conPlazo: true, duracionDias: '30' })).toBeNull();
    expect(validarBorradorMeta({ ...valido, conPlazo: false, duracionDias: 'abc' })).toBeNull();
  });

  it('lee la duración solo si es un entero de 1 a 3650', () => {
    expect(leerDuracionDias('30')).toBe(30);
    expect(leerDuracionDias(' 3650 ')).toBe(3650);
    for (const malo of ['0', '3651', '12.5', '-3', 'diez', '', '99999']) expect(leerDuracionDias(malo)).toBeNull();
  });

  it('convierte a input: recorta textos y solo lleva días si hay plazo', () => {
    expect(borradorAInput({ ...valido, descripcion: '  ' })).toEqual({ titulo: 'Correr 5 km', descripcion: null, areaId: 'a1', duracionDias: null });
    expect(borradorAInput({ ...valido, descripcion: ' Por salud ', conPlazo: true, duracionDias: '45' }))
      .toEqual({ titulo: 'Correr 5 km', descripcion: 'Por salud', areaId: 'a1', duracionDias: 45 });
  });

  it('se arma desde una meta existente para editarla', () => {
    expect(borradorDesdeMeta(meta({ titulo: 'Leer', descripcion: 'Más', duracionDias: 21 })))
      .toEqual({ titulo: 'Leer', descripcion: 'Más', areaId: 'cuerpo', conPlazo: true, duracionDias: '21' });
    expect(borradorDesdeMeta(meta({ area: null }))).toMatchObject({ areaId: null, conPlazo: false, duracionDias: '30' });
  });
});

describe('elementos de una meta', () => {
  const elementos: ElementoDeMeta[] = [
    { tipo: 'tarea', id: 't1', titulo: 'Comprar tenis', metaId: 'm1' },
    { tipo: 'habito', id: 'h1', titulo: 'Correr', metaId: 'm1' },
    { tipo: 'habito', id: 'h2', titulo: 'Leer', metaId: null },
    { tipo: 'plan', id: 'p1', titulo: 'Plan 8 semanas', metaId: 'm1' },
    { tipo: 'rutina', id: 'r1', titulo: 'Mañana', metaId: 'm2' },
  ];

  it('filtra los de una meta', () => {
    expect(elementosDeLaMeta(elementos, 'm1').map((e) => e.id)).toEqual(['t1', 'h1', 'p1']);
    expect(elementosDeLaMeta(elementos, 'otra')).toEqual([]);
  });

  it('agrupa por tipo en orden hábito, tarea, rutina, plan y omite los vacíos', () => {
    const grupos = agruparElementosPorTipo(elementosDeLaMeta(elementos, 'm1'));
    expect(grupos.map((g) => g.tipo)).toEqual(['habito', 'tarea', 'plan']);
    expect(grupos[0].elementos.map((e) => e.id)).toEqual(['h1']);
  });
});

describe('balanceDeAreas', () => {
  const areas = [{ id: 'cuerpo', color: '#EF4444' }, { id: 'estudios', color: '#8B5CF6' }, { id: 'finanzas', color: '#F97316' }];

  it('enciende solo las áreas con alguna meta activa y conserva el orden', () => {
    const balance = balanceDeAreas(areas, [meta(), meta({ area: area('estudios'), estado: 'pausada' }), meta({ area: area('finanzas'), estado: 'lograda' })]);
    expect(balance).toEqual([
      { id: 'cuerpo', color: '#EF4444', activa: true }, { id: 'estudios', color: '#8B5CF6', activa: false }, { id: 'finanzas', color: '#F97316', activa: false },
    ]);
  });

  it('sin metas ninguna está encendida, y una meta sin área no enciende nada', () => {
    expect(balanceDeAreas(areas, []).every((punto) => !punto.activa)).toBe(true);
    expect(balanceDeAreas(areas, [meta({ area: null })]).every((punto) => !punto.activa)).toBe(true);
  });
});
