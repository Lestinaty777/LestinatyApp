import { describe, expect, it } from 'vitest';
import { completarNodoLocalEnMemoria, obtenerNodoActual } from './progresoLocalSendero';
describe('progreso local', () => { it('desbloquea únicamente el nodo posterior al último completado', () => { const progreso = completarNodoLocalEnMemoria(['nodo-1'], 'nodo-1'); expect(obtenerNodoActual(['nodo-1', 'nodo-2', 'nodo-3'], progreso)).toBe('nodo-2'); }); });
