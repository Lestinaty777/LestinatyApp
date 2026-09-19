export type PaqueteVisualHabito = {
  id: string;
  nombre: string;
};

function paquete(id: string, nombre: string): PaqueteVisualHabito {
  return { id, nombre };
}

const PAQUETES_VISUALES: Record<string, PaqueteVisualHabito> = {
  abyss: paquete('abyss', 'Abyss'), amber: paquete('amber', 'Amber'), aurelia: paquete('aurelia', 'Aurelia'),
  celesthia: paquete('celesthia', 'Celesthia'), crimsonmoon: paquete('crimsonmoon', 'CrimsonMoon'), diamante: paquete('diamante', 'Diamante'),
  eclipse: paquete('eclipse', 'Eclipse'), esmeralda: paquete('esmeralda', 'Esmeralda'), golden: paquete('golden', 'Golden'),
  ignate: paquete('ignate', 'Ignate'), lightmoon: paquete('lightmoon', 'LightMoon'), mathist: paquete('mathist', 'Mathist'),
  moon: paquete('moon', 'Moon'), nevalhi: paquete('nevalhi', 'Nevalhi'), sakura: paquete('sakura', 'Sakura'),
  valvery: paquete('valvery', 'Valvery'), vida: paquete('vida', 'Vida'),
};

export function obtenerPaqueteVisualHabito(paqueteId?: string | null): PaqueteVisualHabito {
  return PAQUETES_VISUALES[paqueteId?.toLowerCase() ?? ''] ?? PAQUETES_VISUALES.esmeralda;
}
