import { FRANJAS_ORDEN, type FranjaDia } from '../../compartido/utilidades/franjas';
import type {
  EstadoRutina, FrecuenciaRutina, ModoPasoRutina, OrigenPasoRutina, PasoRutina, ResultadoPasoPropio, Rutina,
} from './rutinas.tipos';

// Valida defensivamente lo que devuelve obtener_rutinas_hoy (jsonb): si el
// servidor cambia de forma, mejor fallar aquí con un mensaje claro que pintar
// una pantalla rota. Mismo criterio que senderoHabito.mapper.ts.

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string') throw new Error(`Rutinas: "${campo}" inválido.`);
  return valor;
}

function textoOpcional(valor: unknown): string | null {
  return typeof valor === 'string' && valor.length > 0 ? valor : null;
}

function numeroOpcional(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function elegir<T extends string>(valor: unknown, permitidos: readonly T[], campo: string): T {
  if (typeof valor === 'string' && (permitidos as readonly string[]).includes(valor)) return valor as T;
  throw new Error(`Rutinas: "${campo}" inválido.`);
}

const ORIGENES: readonly OrigenPasoRutina[] = ['habito', 'tarea', 'propio'];
const MODOS: readonly ModoPasoRutina[] = ['simple', 'cronometro', 'contador', 'checklist'];
const FRECUENCIAS: readonly FrecuenciaRutina[] = ['diaria', 'dias_semana'];
const ESTADOS: readonly EstadoRutina[] = ['activa', 'pausada', 'archivada'];

export function mapearPasoRutina(crudo: unknown): PasoRutina {
  if (!esObjeto(crudo)) throw new Error('Rutinas: paso inválido.');
  return {
    id: texto(crudo.id, 'paso.id'),
    orden: Number(crudo.orden),
    origen: elegir(crudo.origen, ORIGENES, 'paso.origen'),
    habitoId: textoOpcional(crudo.habito_id),
    tareaId: textoOpcional(crudo.tarea_id),
    titulo: texto(crudo.titulo, 'paso.titulo'),
    iconoLucide: textoOpcional(crudo.icono_lucide),
    color: textoOpcional(crudo.color),
    modo: elegir(crudo.modo, MODOS, 'paso.modo'),
    objetivoValor: numeroOpcional(crudo.objetivo_valor),
    unidad: textoOpcional(crudo.unidad),
    aplica: crudo.aplica === true,
    completo: crudo.completo === true,
    valor: numeroOpcional(crudo.valor),
  };
}

export function mapearRutina(crudo: unknown): Rutina {
  if (!esObjeto(crudo)) throw new Error('Rutinas: rutina inválida.');
  const pasosCrudos = crudo.pasos;
  if (!Array.isArray(pasosCrudos)) throw new Error('Rutinas: "pasos" inválido.');
  const dias = Array.isArray(crudo.dias_semana) ? crudo.dias_semana.map(Number).filter(Number.isInteger) : null;
  return {
    id: texto(crudo.id, 'id'),
    titulo: texto(crudo.titulo, 'titulo'),
    descripcion: textoOpcional(crudo.descripcion),
    franja: elegir<FranjaDia>(crudo.franja, FRANJAS_ORDEN, 'franja'),
    iconoLucide: texto(crudo.icono_lucide, 'icono_lucide'),
    color: texto(crudo.color, 'color'),
    estado: elegir(crudo.estado, ESTADOS, 'estado'),
    frecuencia: elegir(crudo.frecuencia, FRECUENCIAS, 'frecuencia'),
    diasSemana: dias && dias.length > 0 ? dias : null,
    horaInicio: textoOpcional(crudo.hora_inicio),
    recordatorioActivo: crudo.recordatorio_activo === true,
    mostrarNombreNotificacion: crudo.mostrar_nombre_notificacion !== false,
    tocaHoy: crudo.toca_hoy === true,
    pasos: pasosCrudos.map(mapearPasoRutina).sort((a, b) => a.orden - b.orden),
  };
}

export function mapearRutinas(crudo: unknown): Rutina[] {
  if (!Array.isArray(crudo)) throw new Error('Rutinas: respuesta inválida.');
  return crudo.map(mapearRutina);
}

export function mapearResultadoPasoPropio(crudo: unknown): ResultadoPasoPropio {
  if (!esObjeto(crudo)) throw new Error('Rutinas: resultado inválido.');
  return { pasoId: texto(crudo.paso_id, 'paso_id'), valor: Number(crudo.valor), completo: crudo.completo === true };
}
