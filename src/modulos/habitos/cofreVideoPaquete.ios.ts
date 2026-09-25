import { resolverPaqueteHabito } from './paqueteHabito';

// iOS no reproduce WebM (AVPlayer, el motor de expo-video, solo soporta
// MP4/MOV/HEVC/H.264) — con los .webm de cofreVideoPaquete.ts el vídeo nunca
// cargaba y el modal caía siempre al respaldo. Metro elige este archivo solo
// en iPhone. Son los mismos vídeos, convertidos a H.264 en cofres/ios/.
//
// El MP4 no guarda transparencia (el WebM sí), así que cada vídeo ya viene
// "aplanado" sobre un pastel del color de su paquete (85% hacia blanco, el
// mismo tono que el cuerpo de la tarjeta de vidrio). FONDOS_VIDEO_COFRE es ese
// mismo color: el modal lo usa como fondo del VideoView para que los bordes que
// deja contentFit="contain" no se distingan del vídeo.
const VIDEOS_COFRE: Record<string, number> = {
  abyss: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-abyss.mp4'),
  amber: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-amber.mp4'),
  aurelia: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-aurelia.mp4'),
  celesthia: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-celesthia.mp4'),
  crimsonmoon: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-crimsonmoon.mp4'),
  diamante: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-diamante.mp4'),
  eclipse: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-eclipse.mp4'),
  esmeralda: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-esmeralda.mp4'),
  golden: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-golden.mp4'),
  ignate: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-ignate.mp4'),
  lightmoon: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-lightmoon.mp4'),
  mathist: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-mathist.mp4'),
  moon: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-moon.mp4'),
  nevalhi: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-nevalhi.mp4'),
  sakura: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-sakura.mp4'),
  valvery: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-valvery.mp4'),
  vida: require('../../../assets/ilustraciones/senderos/biomas/cofres/ios/abrir-cofre-vida.mp4'),
};

const FONDOS_VIDEO_COFRE: Record<string, string> = {
  abyss: '#dedee0',
  amber: '#fde4d9',
  aurelia: '#fff8d9',
  celesthia: '#d9f3f8',
  crimsonmoon: '#f7dde4',
  diamante: '#ecf3fa',
  eclipse: '#e9e2f1',
  esmeralda: '#d9eee7',
  golden: '#fff3d9',
  ignate: '#f6d9da',
  lightmoon: '#d9e3f8',
  mathist: '#f3e7fe',
  moon: '#e0e7fa',
  nevalhi: '#f6faff',
  sakura: '#ffeaf3',
  valvery: '#d9f1f3',
  vida: '#ebf7df',
};

export function videoCofreParaPaquete(paqueteId?: string | null): number {
  return VIDEOS_COFRE[resolverPaqueteHabito(paqueteId)];
}

export function fondoVideoCofreParaPaquete(paqueteId?: string | null): string | undefined {
  return FONDOS_VIDEO_COFRE[resolverPaqueteHabito(paqueteId)];
}
