import { paginaSenderoActivo } from './activo';
import { paginaSenderosCompartidos } from './compartidos';
import { paginaExplorarSenderos } from './explorar';
import { paginaMisSenderos } from './misSenderos';
import { PaginaSenderos, PaginaSenderosId } from './tipos';

export type { PaginaSenderos, PaginaSenderosId } from './tipos';

export const paginasSenderos: Record<PaginaSenderosId, PaginaSenderos> = {
  activo: paginaSenderoActivo,
  compartidos: paginaSenderosCompartidos,
  explorar: paginaExplorarSenderos,
  'mis-senderos': paginaMisSenderos,
};
