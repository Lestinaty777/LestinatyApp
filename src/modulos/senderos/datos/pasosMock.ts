import type { LucideIcon } from 'lucide-react-native';
import { Check, Clock3, ListChecks, Timer } from 'lucide-react-native';

export type PasoSendero = { descripcion: string; icono: LucideIcon; id: string; metadata: string; tipo: 'check' | 'temporizador'; titulo: string };

const rutina: PasoSendero[] = [
  { descripcion: 'Activa el cuerpo con respiracion y movilidad suave.', icono: Clock3, id: 'despertar', metadata: '3 min', tipo: 'temporizador', titulo: 'Despertar el cuerpo' },
  { descripcion: 'Estira cuello, espalda y piernas sin forzar.', icono: Timer, id: 'estirar', metadata: '10 min', tipo: 'temporizador', titulo: 'Estirar 10 min' },
  { descripcion: 'Define la unica accion que hara avanzar tu dia.', icono: ListChecks, id: 'prioridad', metadata: '1 prioridad', tipo: 'check', titulo: 'Elegir prioridad' },
  { descripcion: 'Cierra este inicio del dia y conserva el impulso.', icono: Check, id: 'cerrar', metadata: 'Listo', tipo: 'check', titulo: 'Cerrar rutina' },
];
const generico: PasoSendero[] = [
  { descripcion: 'Prepara el contexto para avanzar sin friccion.', icono: ListChecks, id: 'preparar', metadata: 'Preparacion', tipo: 'check', titulo: 'Preparar el paso' },
  { descripcion: 'Dedica atencion completa a esta accion.', icono: Timer, id: 'foco', metadata: '15 min', tipo: 'temporizador', titulo: 'Avanzar con foco' },
  { descripcion: 'Registra el avance y termina por hoy.', icono: Check, id: 'registrar', metadata: 'Registro', tipo: 'check', titulo: 'Registrar avance' },
];
export const obtenerPasosMock = (id: string) => id === 'rutina-manana' ? rutina : generico;
