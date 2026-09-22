import { resolverPaqueteHabito } from './paqueteHabito';

// Metro exige require() estático por archivo — no se puede armar la ruta con
// un template string. Si falta una entrada acá, tsc/Metro lo marcan de
// inmediato al agregar un paquete nuevo a PAQUETES_HABITO.
const VIDEOS_COFRE: Record<string, number> = {
  abyss: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-abyss.webm'),
  amber: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-amber.webm'),
  aurelia: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-aurelia.webm'),
  celesthia: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-celesthia.webm'),
  crimsonmoon: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-crimsonmoon.webm'),
  diamante: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-diamante.webm'),
  eclipse: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-eclipse.webm'),
  esmeralda: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-esmeralda.webm'),
  golden: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-golden.webm'),
  ignate: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-ignate.webm'),
  lightmoon: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-lightmoon.webm'),
  mathist: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-mathist.webm'),
  moon: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-moon.webm'),
  nevalhi: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-nevalhi.webm'),
  sakura: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-sakura.webm'),
  valvery: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-valvery.webm'),
  vida: require('../../../assets/ilustraciones/senderos/biomas/cofres/abrir-cofre-vida.webm'),
};

export function videoCofreParaPaquete(paqueteId?: string | null): number {
  return VIDEOS_COFRE[resolverPaqueteHabito(paqueteId)];
}
