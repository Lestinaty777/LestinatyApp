import { describe, expect, it } from 'vitest';

import { categoriasAby, colorEnvioCategoriaAby, filasCategoriasAby, videoFondoCategoriaAby } from './categoriasAby';

describe('categoriasAby', () => {
  it('expone las siete categorias en una cuadrícula 4 + 3 sin repetir colores', () => {
    expect(categoriasAby).toHaveLength(7);
    expect(new Set(categoriasAby.map((categoria) => categoria.color))).toHaveLength(7);
    expect(categoriasAby.map((categoria) => categoria.id)).toEqual([
      'rutinas', 'salud', 'tareas', 'finanzas', 'habitos', 'relaciones', 'estudio',
    ]);
  });

  it('organiza los accesos visuales en dos filas de cuatro y tres', () => {
    expect(filasCategoriasAby.map((fila) => fila.length)).toEqual([4, 3]);
  });

  it('usa negro neutro hasta que la persona elige una categoria', () => {
    expect(colorEnvioCategoriaAby('salud')).toBe('#4FAE63');
    expect(colorEnvioCategoriaAby(null)).toBe('#141414');
  });

  it('usa el video de salud solo al seleccionar salud', () => {
    expect(videoFondoCategoriaAby('salud')).toBe('salud');
    expect(videoFondoCategoriaAby('tareas')).toBe('tareas');
    expect(videoFondoCategoriaAby('finanzas')).toBe('finanzas');
    expect(videoFondoCategoriaAby('relaciones')).toBe('relaciones');
    expect(videoFondoCategoriaAby('estudio')).toBe('estudio');
    expect(videoFondoCategoriaAby('habitos')).toBe('habitos');
    expect(videoFondoCategoriaAby('rutinas')).toBe('rutinas');
    expect(videoFondoCategoriaAby(null)).toBe('rutinas');
  });
});
