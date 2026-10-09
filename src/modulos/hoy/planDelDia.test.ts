import { describe, expect, it } from 'vitest';
import {
  construirPlanDelDia,
  idsDeRutinasDeHoy,
  SIN_AREA,
  TOPE_PENDIENTES_POR_FRANJA,
  type ElementoHoy,
} from './planDelDia';
import type { Rutina } from '../rutinas/rutinas.tipos';

describe('planDelDia', () => {
  const crearElemento = (
    tipo: 'habito' | 'tarea' | 'rutina',
    id: string,
    franja: 'manana' | 'tarde' | 'noche' | 'cualquier_momento',
    completado = false,
    areaId: string | null = null,
  ): ElementoHoy => ({
    tipo,
    id,
    titulo: `${tipo}-${id}`,
    iconoLucide: null,
    color: null,
    franja,
    areaId,
    completado,
    detalle: null,
  });

  describe('idsDeRutinasDeHoy', () => {
    it('extrae habitoId y tareaId de pasos de rutinas activas que tocan hoy', () => {
      const rutinas: Rutina[] = [
        {
          id: 'r1',
          titulo: 'Rutina 1',
          descripcion: null,
          franja: 'manana',
          iconoLucide: 'sol',
          color: '#FFAA00',
          estado: 'activa',
          frecuencia: 'diaria',
          diasSemana: null,
          horaInicio: null,
          recordatorioActivo: false,
          mostrarNombreNotificacion: true,
          tocaHoy: true,
          sesionIniciadaEn: null,
          sesionCompletadaEn: null,
          pasos: [
            {
              id: 'p1',
              orden: 1,
              origen: 'habito',
              habitoId: 'h-1',
              tareaId: null,
              tareaTipo: null,
              tareaFrecuencia: null,
              esencial: true,
              titulo: 'Hab 1',
              iconoLucide: null,
              color: null,
              modo: 'simple',
              objetivoValor: null,
              unidad: null,
              aplica: true,
              completo: false,
              valor: null,
            },
            {
              id: 'p2',
              orden: 2,
              origen: 'tarea',
              habitoId: null,
              tareaId: 't-1',
              tareaTipo: 'simple',
              tareaFrecuencia: 'dias_semana',
              esencial: true,
              titulo: 'Tarea 1',
              iconoLucide: null,
              color: null,
              modo: 'simple',
              objetivoValor: null,
              unidad: null,
              aplica: true,
              completo: false,
              valor: null,
            },
            {
              id: 'p3',
              orden: 3,
              origen: 'propio',
              habitoId: null,
              tareaId: null,
              tareaTipo: null,
              tareaFrecuencia: null,
              esencial: true,
              titulo: 'Paso propio',
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
        },
        {
          id: 'r2',
          titulo: 'Rutina inactiva o que no toca hoy',
          descripcion: null,
          franja: 'noche',
          iconoLucide: 'luna',
          color: '#5500AA',
          estado: 'pausada',
          frecuencia: 'diaria',
          diasSemana: null,
          horaInicio: null,
          recordatorioActivo: false,
          mostrarNombreNotificacion: true,
          tocaHoy: true,
          sesionIniciadaEn: null,
          sesionCompletadaEn: null,
          pasos: [
            {
              id: 'p4',
              orden: 1,
              origen: 'habito',
              habitoId: 'h-2',
              tareaId: null,
              tareaTipo: null,
              tareaFrecuencia: null,
              esencial: true,
              titulo: 'Hab 2',
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
        },
        {
          id: 'r3',
          titulo: 'Rutina no toca hoy',
          descripcion: null,
          franja: 'tarde',
          iconoLucide: 'tarde',
          color: '#00AAFF',
          estado: 'activa',
          frecuencia: 'dias_semana',
          diasSemana: [1],
          horaInicio: null,
          recordatorioActivo: false,
          mostrarNombreNotificacion: true,
          tocaHoy: false,
          sesionIniciadaEn: null,
          sesionCompletadaEn: null,
          pasos: [
            {
              id: 'p5',
              orden: 1,
              origen: 'tarea',
              habitoId: null,
              tareaId: 't-2',
              tareaTipo: 'simple',
              tareaFrecuencia: 'dias_semana',
              esencial: true,
              titulo: 'Tarea 2',
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
        },
      ];

      const resultado = idsDeRutinasDeHoy(rutinas);
      expect(resultado.habitos.has('h-1')).toBe(true);
      expect(resultado.habitos.has('h-2')).toBe(false);
      expect(resultado.tareas.has('t-1')).toBe(true);
      expect(resultado.tareas.has('t-2')).toBe(false);
    });
  });

  describe('construirPlanDelDia', () => {
    it('regla 1: un hábito o tarea en idsEnRutinas no aparece ni cuenta', () => {
      const habitos = [crearElemento('habito', 'h-1', 'manana'), crearElemento('habito', 'h-2', 'manana')];
      const tareas = [crearElemento('tarea', 't-1', 'manana'), crearElemento('tarea', 't-2', 'manana')];
      const rutinas = [crearElemento('rutina', 'r-1', 'manana')];
      const idsEnRutinas = {
        habitos: new Set(['h-1']),
        tareas: new Set(['t-1']),
      };

      const plan = construirPlanDelDia({
        habitos,
        tareas,
        rutinas,
        idsEnRutinas,
        filtro: 'todo',
        expandidas: new Set(),
      });

      const todosIds = plan.secciones.flatMap((s) => s.pendientes.map((p) => p.id));
      expect(todosIds).not.toContain('h-1');
      expect(todosIds).not.toContain('t-1');
      expect(todosIds).toContain('h-2');
      expect(todosIds).toContain('t-2');
      expect(todosIds).toContain('r-1');
      expect(plan.total).toBe(3);
      expect(plan.conteos.manana).toBe(3);
    });

    it('regla 2: orden de secciones es manana, tarde, noche, cualquier_momento', () => {
      const plan = construirPlanDelDia({
        habitos: [
          crearElemento('habito', 'h-cm', 'cualquier_momento'),
          crearElemento('habito', 'h-noche', 'noche'),
          crearElemento('habito', 'h-tarde', 'tarde'),
          crearElemento('habito', 'h-manana', 'manana'),
        ],
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'todo',
        expandidas: new Set(),
      });

      expect(plan.secciones.map((s) => s.franja)).toEqual(['manana', 'tarde', 'noche', 'cualquier_momento']);
    });

    it('regla 3: filtro manana/tarde/noche devuelve una sola sección; filtro todo devuelve las cuatro si tienen elementos', () => {
      const habitos = [
        crearElemento('habito', 'h-m', 'manana'),
        crearElemento('habito', 'h-t', 'tarde'),
        crearElemento('habito', 'h-n', 'noche'),
        crearElemento('habito', 'h-cm', 'cualquier_momento'),
      ];

      const planManana = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'manana',
        expandidas: new Set(),
      });
      expect(planManana.secciones.length).toBe(1);
      expect(planManana.secciones[0].franja).toBe('manana');

      const planTodo = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'todo',
        expandidas: new Set(),
      });
      expect(planTodo.secciones.length).toBe(4);
    });

    it('regla 4: elementos cualquier_momento solo aparecen con filtro todo', () => {
      const habitos = [crearElemento('habito', 'h-cm', 'cualquier_momento')];

      const planManana = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'manana',
        expandidas: new Set(),
      });
      expect(planManana.secciones).toHaveLength(0);

      const planTodo = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'todo',
        expandidas: new Set(),
      });
      expect(planTodo.secciones).toHaveLength(1);
      expect(planTodo.secciones[0].franja).toBe('cualquier_momento');
    });

    it('regla 5: conteos calcula pendientes de cada franja y todo sin depender del filtro', () => {
      const habitos = [
        crearElemento('habito', 'h-m', 'manana', false),
        crearElemento('habito', 'h-m-hecho', 'manana', true),
        crearElemento('habito', 'h-t', 'tarde', false),
        crearElemento('habito', 'h-n', 'noche', false),
        crearElemento('habito', 'h-cm', 'cualquier_momento', false),
      ];

      const plan = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'noche', // filtro no debe afectar los conteos
        expandidas: new Set(),
      });

      expect(plan.conteos.manana).toBe(1);
      expect(plan.conteos.tarde).toBe(1);
      expect(plan.conteos.noche).toBe(1);
      expect(plan.conteos.todo).toBe(4);
    });

    it('regla 6: dentro de una sección los pendientes ordenan rutinas, luego hábitos, luego tareas', () => {
      const tareas = [crearElemento('tarea', 't-1', 'manana')];
      const habitos = [crearElemento('habito', 'h-1', 'manana')];
      const rutinas = [crearElemento('rutina', 'r-1', 'manana')];

      const plan = construirPlanDelDia({
        habitos,
        tareas,
        rutinas,
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'manana',
        expandidas: new Set(),
      });

      const tipos = plan.secciones[0].pendientes.map((x) => x.tipo);
      expect(tipos).toEqual(['rutina', 'habito', 'tarea']);
    });

    it('regla 7: respeta tope y expandidas con pendientesOcultos', () => {
      const habitos = Array.from({ length: 7 }, (_, i) => crearElemento('habito', `h-${i}`, 'manana'));

      const planNoExpandido = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'manana',
        expandidas: new Set(),
        tope: TOPE_PENDIENTES_POR_FRANJA, // 5
      });
      expect(planNoExpandido.secciones[0].pendientes).toHaveLength(5);
      expect(planNoExpandido.secciones[0].pendientesOcultos).toBe(2);

      const planExpandido = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'manana',
        expandidas: new Set(['manana']),
        tope: TOPE_PENDIENTES_POR_FRANJA,
      });
      expect(planExpandido.secciones[0].pendientes).toHaveLength(7);
      expect(planExpandido.secciones[0].pendientesOcultos).toBe(0);
    });

    it('regla 8: una sección sin pendientes ni completados no se devuelve', () => {
      const habitos = [crearElemento('habito', 'h-m', 'manana')];

      const plan = construirPlanDelDia({
        habitos,
        tareas: [],
        rutinas: [],
        idsEnRutinas: { habitos: new Set(), tareas: new Set() },
        filtro: 'todo',
        expandidas: new Set(),
      });

      expect(plan.secciones.map((s) => s.franja)).toEqual(['manana']);
    });

    it('regla 9: total y completados cuentan todo el día tras quitar duplicados', () => {
      const habitos = [
        crearElemento('habito', 'h-1', 'manana', true),
        crearElemento('habito', 'h-2', 'tarde', false),
        crearElemento('habito', 'h-dup', 'noche', true),
      ];
      const tareas = [
        crearElemento('tarea', 't-1', 'noche', false),
      ];
      const rutinas = [
        crearElemento('rutina', 'r-1', 'cualquier_momento', true),
      ];
      const idsEnRutinas = {
        habitos: new Set(['h-dup']),
        tareas: new Set<string>(),
      };

      const plan = construirPlanDelDia({
        habitos,
        tareas,
        rutinas,
        idsEnRutinas,
        filtro: 'manana',
        expandidas: new Set(),
      });

      // h-1 (completado), h-2 (pendiente), t-1 (pendiente), r-1 (completado) => total 4, completados 2
      expect(plan.total).toBe(4);
      expect(plan.completados).toBe(2);
    });
  });
  describe('filtro por área', () => {
    const sinRutinas = { habitos: new Set<string>(), tareas: new Set<string>() };
    const entrada = () => ({
      habitos: [crearElemento('habito', 'h1', 'manana', false, 'a-cuerpo'), crearElemento('habito', 'h2', 'tarde', false, null)],
      tareas: [crearElemento('tarea', 't1', 'manana', true, 'a-estudios')],
      rutinas: [crearElemento('rutina', 'r1', 'noche', false, 'a-cuerpo')],
      idsEnRutinas: sinRutinas,
      filtro: 'todo' as const,
      expandidas: new Set<never>(),
    });
    const ids = (plan: ReturnType<typeof construirPlanDelDia>) =>
      plan.secciones.flatMap((seccion) => [...seccion.pendientes, ...seccion.completados]).map((e) => e.id).sort();

    it('sin área (null o ausente) no filtra', () => {
      expect(ids(construirPlanDelDia(entrada()))).toEqual(['h1', 'h2', 'r1', 't1']);
      expect(ids(construirPlanDelDia({ ...entrada(), areaId: null }))).toEqual(['h1', 'h2', 'r1', 't1']);
    });

    it('con un área muestra solo lo de esa área, y los conteos y totales la reflejan', () => {
      const plan = construirPlanDelDia({ ...entrada(), areaId: 'a-cuerpo' });
      expect(ids(plan)).toEqual(['h1', 'r1']);
      expect(plan.conteos).toEqual({ manana: 1, tarde: 0, noche: 1, todo: 2 });
      expect(plan.total).toBe(2);
      expect(plan.completados).toBe(0);
    });

    it("'sin_area' muestra solo lo que no tiene área", () => {
      expect(ids(construirPlanDelDia({ ...entrada(), areaId: SIN_AREA }))).toEqual(['h2']);
    });

    it('areasPresentes lista las áreas del día sin importar el filtro, y sin contar lo que ya vive dentro de una rutina', () => {
      const plan = construirPlanDelDia({ ...entrada(), areaId: 'a-cuerpo' });
      expect([...plan.areasPresentes].sort()).toEqual(['a-cuerpo', 'a-estudios', null].sort());
      const dentroDeRutina = construirPlanDelDia({ ...entrada(), idsEnRutinas: { habitos: new Set<string>(), tareas: new Set(['t1']) } });
      expect(dentroDeRutina.areasPresentes).not.toContain('a-estudios');
    });
  });
});
