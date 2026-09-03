export type IntencionDescubrimientoAby = {
  icono: 'bienestar' | 'constancia' | 'explorar' | 'orden' | 'pendiente' | 'aprendizaje';
  id: 'bienestar' | 'orden' | 'constancia' | 'aprendizaje' | 'pendiente' | 'explorar';
  titulo: string;
};

export const intencionesDescubrimientoAby: readonly IntencionDescubrimientoAby[] = [
  { icono: 'bienestar', id: 'bienestar', titulo: 'Sentirme mejor' },
  { icono: 'orden', id: 'orden', titulo: 'Tener más orden' },
  { icono: 'constancia', id: 'constancia', titulo: 'Crear constancia' },
  { icono: 'aprendizaje', id: 'aprendizaje', titulo: 'Aprender algo' },
  { icono: 'pendiente', id: 'pendiente', titulo: 'Resolver algo pendiente' },
  { icono: 'explorar', id: 'explorar', titulo: 'Explorar sin presión' },
];

export type FormaAvanceDescubrimientoAby = {
  icono: 'explorar' | 'pasos' | 'plan';
  id: 'pasos-pequenos' | 'plan-estructurado' | 'explorar-primero';
  titulo: string;
};

export const formasAvanceDescubrimientoAby: readonly FormaAvanceDescubrimientoAby[] = [
  { icono: 'pasos', id: 'pasos-pequenos', titulo: 'Pasos pequeños' },
  { icono: 'plan', id: 'plan-estructurado', titulo: 'Plan estructurado' },
  { icono: 'explorar', id: 'explorar-primero', titulo: 'Explorar primero' },
];
