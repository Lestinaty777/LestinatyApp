import { describe, expect, it } from 'vitest';

import {
  calcularDetalleHabitoHoy,
  calcularSemanaHabito,
  estaProgramadoEnFecha,
  idDiaDeFecha,
  inicioSemana,
  type FilaPlanSemana,
} from './semanaProgramada';

describe('semanaProgramada', () => {
  describe('idDiaDeFecha e inicioSemana', () => {
    it('calcula correctamente el día de la semana (1 = lunes ... 7 = domingo)', () => {
      expect(idDiaDeFecha('2026-09-21')).toBe(1); // Lunes
      expect(idDiaDeFecha('2026-09-23')).toBe(3); // Miércoles
      expect(idDiaDeFecha('2026-09-26')).toBe(6); // Sábado
      expect(idDiaDeFecha('2026-09-20')).toBe(7); // Domingo
    });

    it('calcula el lunes de la semana actual correctamente', () => {
      expect(inicioSemana('2026-09-20')).toBe('2026-09-14'); // Domingo 20 pertenece a la semana que empezó el 14
      expect(inicioSemana('2026-09-21')).toBe('2026-09-21'); // Lunes 21 es el inicio de su semana
      expect(inicioSemana('2026-09-26')).toBe('2026-09-21'); // Sábado 26 pertenece a la semana que empezó el 21
    });
  });

  describe('estaProgramadoEnFecha', () => {
    it('comprueba si una fecha está programada según los días seleccionados', () => {
      const planLV: FilaPlanSemana = {
        frecuencia: 'dias_semana',
        dias_semana: [1, 2, 3, 4, 5],
        objetivo_valor: 1,
        desde_fecha: '2026-09-20',
        hasta_fecha: null,
      };

      expect(estaProgramadoEnFecha(planLV, '2026-09-20')).toBe(false); // Domingo no programado
      expect(estaProgramadoEnFecha(planLV, '2026-09-21')).toBe(true); // Lunes programado
      expect(estaProgramadoEnFecha(planLV, '2026-09-26')).toBe(false); // Sábado no programado
    });
  });

  describe('calcularSemanaHabito', () => {
    it('no muestra 0/0 cuando un hábito L-V se crea en domingo; muestra la primera semana relevante 0/5', () => {
      const fechaDomingo = new Date('2026-09-20T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'dias_semana',
          dias_semana: [1, 2, 3, 4, 5],
          objetivo_valor: 10,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
        },
      ];
      const registros = new Map<string, number>();

      const resultado = calcularSemanaHabito('cantidad', planes, registros, fechaDomingo);

      // Debe mostrar la primera semana relevante (L-V: 5 días programados)
      expect(resultado.diasProgramados).toEqual([1, 2, 3, 4, 5]);
      expect(resultado.diasCompletadosSemana).toEqual([]);
      // Hoy (domingo) no es día programado
      expect(resultado.programadoHoy).toBe(false);
      expect(resultado.esProgramadoHoy).toBe(false);
    });

    it('al completarlo en tres días muestra 3/5', () => {
      const fechaMiercoles = new Date('2026-09-23T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'dias_semana',
          dias_semana: [1, 2, 3, 4, 5],
          objetivo_valor: 10,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
        },
      ];
      const registros = new Map<string, number>([
        ['2026-09-21', 10], // Lunes
        ['2026-09-22', 12], // Martes
        ['2026-09-23', 10], // Miércoles
      ]);

      const resultado = calcularSemanaHabito('cantidad', planes, registros, fechaMiercoles);

      expect(resultado.diasProgramados).toEqual([1, 2, 3, 4, 5]);
      expect(resultado.diasCompletadosSemana).toEqual([1, 2, 3]);
      expect(resultado.programadoHoy).toBe(true);
      expect(resultado.esProgramadoHoy).toBe(true);
    });

    it('evaluado en sábado tras completar 3 días mantiene 3/5 y desactiva programadoHoy', () => {
      const fechaSabado = new Date('2026-09-26T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'dias_semana',
          dias_semana: [1, 2, 3, 4, 5],
          objetivo_valor: 10,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
        },
      ];
      const registros = new Map<string, number>([
        ['2026-09-21', 10],
        ['2026-09-22', 10],
        ['2026-09-23', 10],
      ]);

      const resultado = calcularSemanaHabito('cantidad', planes, registros, fechaSabado);

      expect(resultado.diasProgramados).toEqual([1, 2, 3, 4, 5]);
      expect(resultado.diasCompletadosSemana).toEqual([1, 2, 3]);
      // Sábado no es día programado
      expect(resultado.programadoHoy).toBe(false);
      expect(resultado.esProgramadoHoy).toBe(false);
    });

    it('para un hábito L-X creado un sábado, busca la primera semana relevante (0/3)', () => {
      const fechaSabado = new Date('2026-09-19T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'dias_semana',
          dias_semana: [1, 2, 3],
          objetivo_valor: 1,
          desde_fecha: '2026-09-19',
          hasta_fecha: null,
        },
      ];
      const registros = new Map<string, number>();

      const resultado = calcularSemanaHabito('check', planes, registros, fechaSabado);

      expect(resultado.diasProgramados).toEqual([1, 2, 3]);
      expect(resultado.diasCompletadosSemana).toEqual([]);
      expect(resultado.programadoHoy).toBe(false);
    });

    it('hábito diario creado en domingo incluye domingo y habilita programadoHoy', () => {
      const fechaDomingo = new Date('2026-09-20T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'diaria',
          dias_semana: null,
          objetivo_valor: 1,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
        },
      ];
      const registros = new Map<string, number>([['2026-09-20', 1]]);

      const resultado = calcularSemanaHabito('check', planes, registros, fechaDomingo);

      expect(resultado.diasProgramados).toContain(7);
      expect(resultado.diasCompletadosSemana).toContain(7);
      expect(resultado.programadoHoy).toBe(true);
    });
  });

  describe('calcularDetalleHabitoHoy', () => {
    it('integra nivel, racha y programación semanal', () => {
      const fechaMiercoles = new Date('2026-09-23T12:00:00');
      const planes: FilaPlanSemana[] = [
        {
          frecuencia: 'dias_semana',
          dias_semana: [1, 2, 3, 4, 5],
          objetivo_valor: 1,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
          nivel: 3,
        },
      ];
      const registros = new Map<string, number>([
        ['2026-09-21', 1],
        ['2026-09-22', 1],
        ['2026-09-23', 1],
      ]);

      const detalle = calcularDetalleHabitoHoy({
        habitoId: 'habito-ejemplo',
        tipoMeta: 'check',
        planes,
        registrosPorFecha: registros,
        referencia: fechaMiercoles,
      });

      expect(detalle).toEqual({
        habitoId: 'habito-ejemplo',
        nivel: 3,
        diasProgramados: [1, 2, 3, 4, 5],
        diasCompletadosSemana: [1, 2, 3],
        esProgramadoHoy: true,
        programadoHoy: true,
        racha: 3,
        franja: 'cualquier_momento',
        metaId: null,
      });
    });

    it('resuelve franja tarde con plan y cualquier_momento sin plan', () => {
      const fecha = new Date('2026-09-23T12:00:00');
      const planConFranja: FilaPlanSemana[] = [
        {
          frecuencia: 'diaria',
          dias_semana: null,
          objetivo_valor: 1,
          desde_fecha: '2026-09-20',
          hasta_fecha: null,
          franja: 'tarde',
        },
      ];

      const detalleConFranja = calcularDetalleHabitoHoy({
        habitoId: 'habito-1',
        tipoMeta: 'check',
        planes: planConFranja,
        registrosPorFecha: new Map(),
        referencia: fecha,
      });
      expect(detalleConFranja.franja).toBe('tarde');

      const detalleSinPlan = calcularDetalleHabitoHoy({
        habitoId: 'habito-2',
        tipoMeta: 'check',
        planes: [],
        registrosPorFecha: new Map(),
        referencia: fecha,
      });
      expect(detalleSinPlan.franja).toBe('cualquier_momento');
    });
  });
});
