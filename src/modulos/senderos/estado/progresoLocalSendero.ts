export type ProgresoLocalSendero = readonly string[];
export function completarNodoLocalEnMemoria(completados: ProgresoLocalSendero, nodoId: string): ProgresoLocalSendero { return completados.includes(nodoId) ? completados : [...completados, nodoId]; }
export function obtenerNodoActual(nodos: readonly string[], completados: ProgresoLocalSendero): string | null { return nodos.find((nodo) => !completados.includes(nodo)) ?? null; }

const PREFIJO = 'lestinaty/progreso-sendero/v1/';
export async function cargarProgresoLocal(senderoId: string): Promise<ProgresoLocalSendero> { const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage'); const valor = await AsyncStorage.getItem(`${PREFIJO}${senderoId}`); try { const datos = valor ? JSON.parse(valor) : []; return Array.isArray(datos) && datos.every((item) => typeof item === 'string') ? datos : []; } catch { return []; } }
export async function completarNodoLocal(senderoId: string, nodoId: string): Promise<ProgresoLocalSendero> { const siguiente = completarNodoLocalEnMemoria(await cargarProgresoLocal(senderoId), nodoId); const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage'); await AsyncStorage.setItem(`${PREFIJO}${senderoId}`, JSON.stringify(siguiente)); return siguiente; }
