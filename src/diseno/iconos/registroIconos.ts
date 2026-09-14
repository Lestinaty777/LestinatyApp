import type { ImageSourcePropType } from 'react-native';

export type IconoRegistrado = { id: string; etiqueta: string; fuente: ImageSourcePropType };

// Archivos disponibles en assets/icons/ui. Metro necesita cada require()
// estático (no se puede armar la ruta con una variable), así que esta lista
// se actualiza a mano cuando agregas/renombras un ícono — si un archivo no
// existe, tsc/Metro lo marcan de inmediato como el error que acabas de ver.
const FUENTES: Record<string, ImageSourcePropType> = {
  aguacate: require('../../../assets/icons/ui/aguacate.png'),
  almohada: require('../../../assets/icons/ui/almohada.png'),
  arbol: require('../../../assets/icons/ui/arbol.png'),
  audifonos: require('../../../assets/icons/ui/audifonos.png'),
  bandera: require('../../../assets/icons/hoy/hoy.png'),
  bateria: require('../../../assets/icons/ui/bateria.png'),
  bicicleta: require('../../../assets/icons/ui/bicicleta.png'),
  botella: require('../../../assets/icons/ui/botella.png'),
  brocoli: require('../../../assets/icons/ui/brocoli.png'),
  cafe: require('../../../assets/icons/ui/cafe.png'),
  calendario: require('../../../assets/icons/ui/calendario.png'),
  cama: require('../../../assets/icons/ui/cama.png'),
  camara: require('../../../assets/icons/ui/camara.png'),
  caminar: require('../../../assets/icons/ui/caminar.png'),
  cerebro: require('../../../assets/icons/ui/cerebro.png'),
  colores: require('../../../assets/icons/ui/colores.png'),
  comida: require('../../../assets/icons/ui/comida.png'),
  computadora: require('../../../assets/icons/ui/computadora.png'),
  corazon: require('../../../assets/icons/ui/corazon.png'),
  correr: require('../../../assets/icons/ui/correr.png'),
  dientes: require('../../../assets/icons/ui/dientes.png'),
  dormir: require('../../../assets/icons/ui/dormir.png'),
  energia: require('../../../assets/icons/ui/energia.png'),
  engranaje: require('../../../assets/icons/ui/engranaje.png'),
  equipo: require('../../../assets/icons/ui/equipo.png'),
  estadistica: require('../../../assets/icons/ui/estadistica.png'),
  estudiar: require('../../../assets/icons/ui/estudiar.png'),
  feliz: require('../../../assets/icons/ui/feliz.png'),
  flor: require('../../../assets/icons/ui/flor.png'),
  frasco: require('../../../assets/icons/ui/frasco.png'),
  'hacer-ejercicio': require('../../../assets/icons/ui/hacer-ejercicio.png'),
  hoja: require('../../../assets/icons/ui/hoja.png'),
  hoja2: require('../../../assets/icons/ui/hoja2.png'),
  hoja3: require('../../../assets/icons/ui/hoja3.png'),
  idea: require('../../../assets/icons/ui/idea.png'),
  lavadora: require('../../../assets/icons/ui/lavadora.png'),
  maceta: require('../../../assets/icons/ui/maceta.png'),
  manos: require('../../../assets/icons/ui/manos.png'),
  manzana: require('../../../assets/icons/ui/manzana.png'),
  mascota: require('../../../assets/icons/ui/mascota.png'),
  meditar: require('../../../assets/icons/ui/meditar.png'),
  metas: require('../../../assets/icons/ui/metas.png'),
  montana: require('../../../assets/icons/ui/montana.png'),
  montana2: require('../../../assets/icons/ui/montana2.png'),
  musica: require('../../../assets/icons/ui/musica.png'),
  nivel1: require('../../../assets/icons/insignias/nivel1.png'),
  nivel2: require('../../../assets/icons/insignias/nivel2.png'),
  nivel3: require('../../../assets/icons/insignias/nivel3.png'),
  nivel4: require('../../../assets/icons/insignias/nivel4.png'),
  nivel5: require('../../../assets/icons/insignias/nivel5.png'),
  nivel6: require('../../../assets/icons/insignias/nivel6.png'),
  nivel7: require('../../../assets/icons/insignias/nivel7.png'),
  ojo: require('../../../assets/icons/ui/ojo.png'),
  pastillas: require('../../../assets/icons/ui/pastillas.png'),
  pescado: require('../../../assets/icons/ui/pescado.png'),
  pin: require('../../../assets/icons/ui/pin.png'),
  planta: require('../../../assets/icons/ui/planta.png'),
  plato: require('../../../assets/icons/ui/plato.png'),
  progreso: require('../../../assets/icons/ui/progreso.png'),
  racha: require('../../../assets/icons/hoy/racha.png'),
  rayo: require('../../../assets/icons/ui/rayo.png'),
  reciclar: require('../../../assets/icons/ui/reciclar.png'),
  reloj: require('../../../assets/icons/ui/reloj.png'),
  'rollo-camara': require('../../../assets/icons/ui/rollo-camara.png'),
  sol: require('../../../assets/icons/ui/sol.png'),
  tapete: require('../../../assets/icons/ui/tapete.png'),
  tareas: require('../../../assets/icons/ui/tareas.png'),
  'tomar-agua': require('../../../assets/icons/ui/tomar-agua.png'),
  trofeo: require('../../../assets/icons/ui/trofeo.png'),
  zanahoria: require('../../../assets/icons/ui/zanahoria.png'),
};

function etiquetaDesdeId(id: string): string {
  const texto = id.replace(/[-_]/g, ' ').replace(/\d+$/, '').trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Registro global — cualquier módulo puede usarlo, no solo hábitos.
export const registroIconos: IconoRegistrado[] = Object.entries(FUENTES).map(([id, fuente]) => ({
  id,
  etiqueta: etiquetaDesdeId(id),
  fuente,
}));

export const buscarIcono = (id?: string | null) => registroIconos.find((icono) => icono.id === id);
