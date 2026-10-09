import { describe, expect, it } from 'vitest';
import {
  habitoAElemento,
  resumirCategoriasHoy,
  tareaAElemento,
  textoAvance,
  rutinaAElemento,
} from './adaptadoresHoy';
import type { HabitoResumen } from '../habitos/tipos';
import type { HabitoHoyDetalle } from '../habitos/semanaProgramada';
import type { TareaHoyDetalle } from '../tareas/tareas.tipos';
import type { Rutina } from '../rutinas/rutinas.tipos';

describe('adaptadoresHoy', () => {
  describe('habitoAElemento', () => {
    const habitoBase: HabitoResumen = {
      id: 'h-1',
      titulo: 'Tomar agua',
      descripcion: null,
      iconoLucide: 'gota',
      color: '#00AAFF',
      tipoMeta: 'cantidad',
      unidad: 'vasos',
      meta: 8,
      valorHoy: 3,
      completado: false,
    };

    it('adapta hábito no completado con detalle de avance', () => {
      const detalle: HabitoHoyDetalle = {
        habitoId: 'h-1',
        diasCompletadosSemana: [1, 2],
        diasProgramados: [1, 2, 3, 4, 5, 6, 7],
        esProgramadoHoy: true,
        programadoHoy: true,
        nivel: 1,
        racha: 2,
        franja: 'manana',
      };

      const elemento = habitoAElemento(habitoBase, detalle);

      expect(elemento).toEqual({
        tipo: 'habito',
        id: 'h-1',
        titulo: 'Tomar agua',
        iconoLucide: 'gota',
        color: '#00AAFF',
        franja: 'manana',
        completado: false,
        detalle: '3/8 vasos',
      });
    });

    it('usa cualquier_momento si detalle es undefined', () => {
      const elemento = habitoAElemento(habitoBase, undefined);
      expect(elemento.franja).toBe('cualquier_momento');
    });

    it('devuelve detalle null si tipoMeta es check', () => {
      const habitoCheck: HabitoResumen = {
        ...habitoBase,
        tipoMeta: 'check',
        unidad: null,
        meta: 1,
        valorHoy: 1,
        completado: true,
      };

      const elemento = habitoAElemento(habitoCheck, undefined);
      expect(elemento.completado).toBe(true);
      expect(elemento.detalle).toBeNull();
    });

    it('maneja unidad nula o vacía en el texto de avance', () => {
      const habitoSinUnidad: HabitoResumen = {
        ...habitoBase,
        unidad: null,
      };

      const elemento = habitoAElemento(habitoSinUnidad, undefined);
      expect(elemento.detalle).toBe('3/8');
    });
  });

  describe('tareaAElemento', () => {
    it('adapta tarea simple con detalle null', () => {
      const tarea: TareaHoyDetalle = {
        id: 't-simple',
        titulo: 'Comprar pan',
        descripcion: null,
        iconoLucide: 'bolsa',
        color: '#FFAA00',
        tipo: 'simple',
        frecuencia: 'una_vez',
        franja: 'tarde',
        prioridad: null,
        columnaKanban: null,
        completada: false,
        racha: 0,
        objetivoValor: 1,
        unidad: null,
        valorHoy: 0,
      };

      const elemento = tareaAElemento(tarea);

      expect(elemento).toEqual({
        tipo: 'tarea',
        id: 't-simple',
        titulo: 'Comprar pan',
        iconoLucide: 'bolsa',
        color: '#FFAA00',
        franja: 'tarde',
        completado: false,
        detalle: null,
      });
    });

    it('adapta tarea checklist con detalle null', () => {
      const tarea: TareaHoyDetalle = {
        id: 't-check',
        titulo: 'Checklist casa',
        descripcion: null,
        iconoLucide: 'casa',
        color: '#FFAA00',
        tipo: 'checklist',
        frecuencia: 'dias_semana',
        franja: 'noche',
        prioridad: null,
        columnaKanban: null,
        completada: true,
        racha: 2,
        objetivoValor: 1,
        unidad: null,
        valorHoy: 1,
      };

      const elemento = tareaAElemento(tarea);
      expect(elemento.completado).toBe(true);
      expect(elemento.detalle).toBeNull();
    });

    it('adapta tarea contador con avance formateado', () => {
      const tarea: TareaHoyDetalle = {
        id: 't-contador',
        titulo: 'Flexiones',
        descripcion: null,
        iconoLucide: 'musculo',
        color: '#FFAA00',
        tipo: 'contador',
        frecuencia: 'dias_semana',
        franja: 'manana',
        prioridad: null,
        columnaKanban: null,
        completada: false,
        racha: 5,
        objetivoValor: 50,
        unidad: 'reps',
        valorHoy: 25,
      };

      const elemento = tareaAElemento(tarea);
      expect(elemento.detalle).toBe('25/50 reps');
    });

    it('adapta tarea cronómetro con avance formateado', () => {
      const tarea: TareaHoyDetalle = {
        id: 't-crono',
        titulo: 'Meditar',
        descripcion: null,
        iconoLucide: 'reloj',
        color: '#FFAA00',
        tipo: 'cronometro',
        frecuencia: 'dias_semana',
        franja: 'noche',
        prioridad: null,
        columnaKanban: null,
        completada: true,
        racha: 1,
        objetivoValor: 20,
        unidad: 'min',
        valorHoy: 20,
      };

      const elemento = tareaAElemento(tarea);
      expect(elemento.completado).toBe(true);
      expect(elemento.detalle).toBe('20/20 min');
    });
  });

  describe('rutinaAElemento', () => {
    it('adapta rutina usando resumirRutina y texto traducido para detalle', () => {
      const rutina: Rutina = {
        id: 'r-1',
        titulo: 'Mañana energética',
        descripcion: null,
        franja: 'manana',
        iconoLucide: 'sol',
        color: '#FF8800',
        estado: 'activa',
        frecuencia: 'diaria',
        diasSemana: null,
        horaInicio: '07:00',
        recordatorioActivo: true,
        mostrarNombreNotificacion: true,
        tocaHoy: true,
        sesionIniciadaEn: null,
        sesionCompletadaEn: null,
        pasos: [
          {
            id: 'p-1',
            orden: 1,
            origen: 'propio',
            habitoId: null,
            tareaId: null,
            tareaTipo: null,
            tareaFrecuencia: null,
            esencial: true,
            titulo: 'Agua',
            iconoLucide: null,
            color: null,
            modo: 'simple',
            objetivoValor: null,
            unidad: null,
            aplica: true,
            completo: true,
            valor: null,
          },
          {
            id: 'p-2',
            orden: 2,
            origen: 'propio',
            habitoId: null,
            tareaId: null,
            tareaTipo: null,
            tareaFrecuencia: null,
            esencial: true,
            titulo: 'Estiramiento',
            iconoLucide: null,
            color: null,
            modo: 'simple',
            objetivoValor: null,
            unidad: null,
            aplica: true,
            completo: false,
            valor: null,
          },
        ],
      };

      const formatoPasos = (completos: number, total: number) => `${completos} de ${total} pasos`;
      const elemento = rutinaAElemento(rutina, formatoPasos);

      expect(elemento).toEqual({
        tipo: 'rutina',
        id: 'r-1',
        titulo: 'Mañana energética',
        iconoLucide: 'sol',
        color: '#FF8800',
        franja: 'manana',
        completado: false,
        detalle: '1 de 2 pasos',
      });
    });

    it('marca completada si todos los requeridos están completos', () => {
      const rutina: Rutina = {
        id: 'r-2',
        titulo: 'Noche relax',
        descripcion: null,
        franja: 'noche',
        iconoLucide: 'luna',
        color: '#330066',
        estado: 'activa',
        frecuencia: 'diaria',
        diasSemana: null,
        horaInicio: '22:00',
        recordatorioActivo: false,
        mostrarNombreNotificacion: true,
        tocaHoy: true,
        sesionIniciadaEn: '2026-10-09T22:00:00Z',
        sesionCompletadaEn: '2026-10-09T22:15:00Z',
        pasos: [
          {
            id: 'p-1',
            orden: 1,
            origen: 'propio',
            habitoId: null,
            tareaId: null,
            tareaTipo: null,
            tareaFrecuencia: null,
            esencial: true,
            titulo: 'Leer',
            iconoLucide: null,
            color: null,
            modo: 'simple',
            objetivoValor: null,
            unidad: null,
            aplica: true,
            completo: true,
            valor: null,
          },
        ],
      };

      const formatoPasos = (c: number, t: number) => `${c}/${t} pasos`;
      const elemento = rutinaAElemento(rutina, formatoPasos);

      expect(elemento.completado).toBe(true);
      expect(elemento.detalle).toBe('1/1 pasos');
    });
  });
});

describe('resumirCategoriasHoy', () => {
  const paso = (completo: boolean, esencial = true) => ({
    id: `p-${Math.random()}`, orden: 1, origen: 'propio' as const, habitoId: null, tareaId: null, tareaTipo: null, tareaFrecuencia: null,
    esencial, titulo: 'Paso', iconoLucide: null, color: null, modo: 'simple' as const, objetivoValor: null, unidad: null, aplica: true, completo, valor: null,
  });

  it('cuenta hechos y total por tipo; una rutina es hecha con sus esenciales, y solo cuentan las activas que tocan hoy', () => {
    const avance = resumirCategoriasHoy({
      habitos: [{ completado: true }, { completado: false }, { completado: true }],
      tareas: [{ completada: false }],
      rutinas: [
        { estado: 'activa', tocaHoy: true, pasos: [paso(true), paso(false, false)] },
        { estado: 'activa', tocaHoy: true, pasos: [paso(false)] },
        { estado: 'activa', tocaHoy: false, pasos: [paso(true)] },
        { estado: 'pausada', tocaHoy: true, pasos: [paso(true)] },
      ],
    });
    expect(avance).toEqual({ habitos: { hechos: 2, total: 3 }, tareas: { hechos: 0, total: 1 }, rutinas: { hechos: 1, total: 2 } });
  });

  it('textoAvance devuelve "hechos/total" o vacío sin elementos', () => {
    expect(textoAvance({ hechos: 2, total: 3 })).toBe('2/3');
    expect(textoAvance({ hechos: 0, total: 0 })).toBe('');
  });
});
