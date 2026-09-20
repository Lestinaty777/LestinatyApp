import type { ImageSourcePropType } from 'react-native';

export type IconoRegistrado = {
  id: string;
  etiqueta: string;
  fuente: ImageSourcePropType;
  /** Hue dominante del PNG (0-360), medido sobre el archivo: MasterIcon decide con él si el tema lo afecta sin decodificar nada. */
  hue: number;
};

type Entrada = { fuente: ImageSourcePropType; hue: number };
const icono = (fuente: ImageSourcePropType, hue: number): Entrada => ({ fuente, hue });

// Archivos disponibles en assets/icons. Metro necesita cada require()
// estático (no se puede armar la ruta con una variable), así que esta lista
// se actualiza a mano cuando agregas/renombras un ícono — si un archivo no
// existe, tsc/Metro lo marcan de inmediato. El `hue` es el matiz dominante
// medido del PNG (mismo algoritmo que MasterChanger); un test verifica que
// TODO PNG de assets/icons esté registrado, en uno de los dos registros.

// Íconos "de contenido": son los que puede elegir un hábito (selector del
// wizard) y los que se pueden pedir por nombre corto.
const ICONOS: Record<string, Entrada> = {
  aguacate: icono(require('../../../assets/icons/ui/aguacate.png'), 113),
  almohada: icono(require('../../../assets/icons/ui/almohada.png'), 123),
  arbol: icono(require('../../../assets/icons/ui/arbol.png'), 122),
  audifonos: icono(require('../../../assets/icons/ui/audifonos.png'), 138),
  bandera: icono(require('../../../assets/icons/hoy/hoy.png'), 359),
  basura: icono(require('../../../assets/icons/Config/basura.png'), 148),
  bateria: icono(require('../../../assets/icons/ui/bateria.png'), 141),
  bicicleta: icono(require('../../../assets/icons/ui/bicicleta.png'), 143),
  botella: icono(require('../../../assets/icons/ui/botella.png'), 143),
  brocoli: icono(require('../../../assets/icons/ui/brocoli.png'), 139),
  cafe: icono(require('../../../assets/icons/ui/cafe.png'), 114),
  calendario: icono(require('../../../assets/icons/ui/calendario.png'), 141),
  cama: icono(require('../../../assets/icons/ui/cama.png'), 145),
  camara: icono(require('../../../assets/icons/ui/camara.png'), 142),
  caminar: icono(require('../../../assets/icons/ui/caminar.png'), 152),
  candado: icono(require('../../../assets/icons/Config/candado.png'), 150),
  cerebro: icono(require('../../../assets/icons/ui/cerebro.png'), 114),
  colores: icono(require('../../../assets/icons/ui/colores.png'), 129),
  comida: icono(require('../../../assets/icons/ui/comida.png'), 122),
  computadora: icono(require('../../../assets/icons/ui/computadora.png'), 121),
  corazon: icono(require('../../../assets/icons/ui/corazon.png'), 118),
  correr: icono(require('../../../assets/icons/ui/correr.png'), 132),
  descargar: icono(require('../../../assets/icons/Config/descargar.png'), 148),
  dientes: icono(require('../../../assets/icons/ui/dientes.png'), 120),
  dormir: icono(require('../../../assets/icons/ui/dormir.png'), 130),
  energia: icono(require('../../../assets/icons/ui/energia.png'), 146),
  engranaje: icono(require('../../../assets/icons/ui/engranaje.png'), 134),
  equipo: icono(require('../../../assets/icons/ui/equipo.png'), 142),
  estadistica: icono(require('../../../assets/icons/ui/estadistica.png'), 142),
  estudiar: icono(require('../../../assets/icons/ui/estudiar.png'), 135),
  feliz: icono(require('../../../assets/icons/ui/feliz.png'), 118),
  flor: icono(require('../../../assets/icons/ui/flor.png'), 113),
  frasco: icono(require('../../../assets/icons/ui/frasco.png'), 138),
  'hacer-ejercicio': icono(require('../../../assets/icons/ui/hacer-ejercicio.png'), 141),
  hoja: icono(require('../../../assets/icons/ui/hoja.png'), 143),
  hoja2: icono(require('../../../assets/icons/ui/hoja2.png'), 136),
  hoja3: icono(require('../../../assets/icons/ui/hoja3.png'), 132),
  idea: icono(require('../../../assets/icons/ui/idea.png'), 99),
  lavadora: icono(require('../../../assets/icons/ui/lavadora.png'), 116),
  maceta: icono(require('../../../assets/icons/ui/maceta.png'), 146),
  manos: icono(require('../../../assets/icons/ui/manos.png'), 133),
  manzana: icono(require('../../../assets/icons/ui/manzana.png'), 110),
  mascota: icono(require('../../../assets/icons/ui/mascota.png'), 121),
  meditar: icono(require('../../../assets/icons/ui/meditar.png'), 113),
  metas: icono(require('../../../assets/icons/ui/metas.png'), 144),
  montana: icono(require('../../../assets/icons/ui/montana.png'), 129),
  montana2: icono(require('../../../assets/icons/ui/montana2.png'), 148),
  musica: icono(require('../../../assets/icons/ui/musica.png'), 133),
  nivel1: icono(require('../../../assets/icons/insignias/nivel1.png'), 266),
  nivel2: icono(require('../../../assets/icons/insignias/nivel2.png'), 263),
  nivel3: icono(require('../../../assets/icons/insignias/nivel3.png'), 262),
  nivel4: icono(require('../../../assets/icons/insignias/nivel4.png'), 258),
  nivel5: icono(require('../../../assets/icons/insignias/nivel5.png'), 258),
  nivel6: icono(require('../../../assets/icons/insignias/nivel6.png'), 261),
  nivel7: icono(require('../../../assets/icons/insignias/nivel7.png'), 262),
  ojo: icono(require('../../../assets/icons/ui/ojo.png'), 141),
  pastillas: icono(require('../../../assets/icons/ui/pastillas.png'), 134),
  pescado: icono(require('../../../assets/icons/ui/pescado.png'), 118),
  pin: icono(require('../../../assets/icons/ui/pin.png'), 149),
  planta: icono(require('../../../assets/icons/ui/planta.png'), 123),
  plato: icono(require('../../../assets/icons/ui/plato.png'), 127),
  preguntas: icono(require('../../../assets/icons/Config/preguntas.png'), 150),
  progreso: icono(require('../../../assets/icons/ui/progreso.png'), 129),
  racha: icono(require('../../../assets/icons/hoy/racha.png'), 26),
  rayo: icono(require('../../../assets/icons/ui/rayo.png'), 106),
  reciclar: icono(require('../../../assets/icons/ui/reciclar.png'), 131),
  reloj: icono(require('../../../assets/icons/ui/reloj.png'), 144),
  'rollo-camara': icono(require('../../../assets/icons/ui/rollo-camara.png'), 117),
  salida: icono(require('../../../assets/icons/Config/salida.png'), 150),
  sol: icono(require('../../../assets/icons/ui/sol.png'), 101),
  tapete: icono(require('../../../assets/icons/ui/tapete.png'), 146),
  tarjeta: icono(require('../../../assets/icons/Config/tarjeta.png'), 151),
  tareas: icono(require('../../../assets/icons/ui/tareas.png'), 117),
  terminos: icono(require('../../../assets/icons/Config/terminos.png'), 151),
  'tomar-agua': icono(require('../../../assets/icons/ui/tomar-agua.png'), 155),
  trofeo: icono(require('../../../assets/icons/ui/trofeo.png'), 105),
  zanahoria: icono(require('../../../assets/icons/ui/zanahoria.png'), 123),
};

// Íconos de interfaz (barra de navegación, cabeceras de Hoy...). Van aparte
// para NO entrar al selector de íconos de hábito; se piden con prefijo de
// carpeta porque varios nombres chocarían con los de arriba
// (hoy/calendario vs ui/calendario, hoy/tareas vs ui/tareas...).
const ICONOS_INTERFAZ: Record<string, Entrada> = {
  'raiz/habitos': icono(require('../../../assets/icons/habitos.png'), 147),
  'hoy/agenda': icono(require('../../../assets/icons/hoy/agenda.png'), 47),
  'hoy/calendario': icono(require('../../../assets/icons/hoy/calendario.png'), 48),
  'hoy/conexiones': icono(require('../../../assets/icons/hoy/conexiones.png'), 214),
  'hoy/edit': icono(require('../../../assets/icons/hoy/edit.png'), 210),
  'hoy/eisenhower': icono(require('../../../assets/icons/hoy/eisenhower.png'), 43),
  'hoy/estrella': icono(require('../../../assets/icons/hoy/estrella.png'), 48),
  'hoy/estudio': icono(require('../../../assets/icons/hoy/estudio.png'), 266),
  'hoy/gemas': icono(require('../../../assets/icons/hoy/gemas.png'), 274),
  'hoy/habitos': icono(require('../../../assets/icons/hoy/habitos.png'), 113),
  'hoy/impacto': icono(require('../../../assets/icons/hoy/impacto.png'), 338),
  'hoy/insignia': icono(require('../../../assets/icons/hoy/insignia.png'), 264),
  'hoy/lista': icono(require('../../../assets/icons/hoy/lista.png'), 49),
  'hoy/mas': icono(require('../../../assets/icons/hoy/mas.png'), 214),
  'hoy/metas': icono(require('../../../assets/icons/hoy/metas.png'), 216),
  'hoy/notificaciones': icono(require('../../../assets/icons/hoy/notificaciones.png'), 47),
  'hoy/patrones': icono(require('../../../assets/icons/hoy/patrones.png'), 265),
  'hoy/riesgo': icono(require('../../../assets/icons/hoy/riesgo.png'), 355),
  'hoy/rutinas': icono(require('../../../assets/icons/hoy/rutinas.png'), 0),
  'hoy/saludo': icono(require('../../../assets/icons/hoy/saludo.png'), 47),
  'hoy/senderos': icono(require('../../../assets/icons/hoy/senderos.png'), 31),
  'hoy/tareas': icono(require('../../../assets/icons/hoy/tareas.png'), 46),
  'navegacion/explorar': icono(require('../../../assets/icons/navegacion/explorar.png'), 142),
  'navegacion/hoy': icono(require('../../../assets/icons/navegacion/hoy.png'), 148),
  'navegacion/insights': icono(require('../../../assets/icons/navegacion/inisghts.png'), 146),
  'navegacion/perfil': icono(require('../../../assets/icons/navegacion/perfil.png'), 146),
  'navegacion/tienda': icono(require('../../../assets/icons/navegacion/tienda.png'), 141),
};

function etiquetaDesdeId(id: string): string {
  const texto = id.replace(/[-_/]/g, ' ').replace(/\d+$/, '').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const aRegistro = (fuentes: Record<string, Entrada>): IconoRegistrado[] =>
  Object.entries(fuentes).map(([id, { fuente, hue }]) => ({ id, etiqueta: etiquetaDesdeId(id), fuente, hue }));

// Registro global de íconos de contenido — cualquier módulo puede usarlo, no solo hábitos.
export const registroIconos: IconoRegistrado[] = aRegistro(ICONOS);

/** Íconos de interfaz (prefijo de carpeta: `hoy/gemas`, `navegacion/hoy`...). No son elegibles como ícono de hábito. */
export const registroIconosInterfaz: IconoRegistrado[] = aRegistro(ICONOS_INTERFAZ);

const TODOS = new Map<string, IconoRegistrado>([...registroIconos, ...registroIconosInterfaz].map((icono) => [icono.id, icono]));

export const buscarIcono = (id?: string | null) => (id ? TODOS.get(id) : undefined);
