import type { CategoriaAbyId } from '../datos/categoriasAby';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

export type ArbolBiomaAbyId = 'arce' | 'bosque-calido' | 'bosque-dorado' | 'cerezo-01' | 'cerezo-02' | 'pino-nevado' | 'sauce-ruinas' | 'selva';

type DecoracionBiomaAby = {
  arbolInferior: ArbolBiomaAbyId | null;
  arbolSuperior: ArbolBiomaAbyId | null;
  colorPastel: string;
};

const decoraciones: Record<CategoriaAbyId, DecoracionBiomaAby> = {
  estudio: { arbolInferior: 'sauce-ruinas', arbolSuperior: 'sauce-ruinas', colorPastel: '#F2ECFA' },
  finanzas: { arbolInferior: 'bosque-calido', arbolSuperior: 'bosque-calido', colorPastel: '#FFF1E5' },
  habitos: { arbolInferior: 'arce', arbolSuperior: 'arce', colorPastel: '#FFF0F0' },
  relaciones: { arbolInferior: 'cerezo-01', arbolSuperior: 'cerezo-02', colorPastel: '#FFF0F5' },
  rutinas: { arbolInferior: 'pino-nevado', arbolSuperior: 'pino-nevado', colorPastel: '#ECF5FF' },
  salud: { arbolInferior: 'selva', arbolSuperior: 'selva', colorPastel: ESCALA_ESMERALDA.hoja.l97 },
  tareas: { arbolInferior: 'bosque-dorado', arbolSuperior: 'bosque-dorado', colorPastel: '#FFF8DF' },
};

const neutro: DecoracionBiomaAby = { arbolInferior: null, arbolSuperior: null, colorPastel: '#FBFAF7' };

export function obtenerDecoracionBiomaAby(categoriaId: CategoriaAbyId | null) {
  return categoriaId ? decoraciones[categoriaId] : neutro;
}
