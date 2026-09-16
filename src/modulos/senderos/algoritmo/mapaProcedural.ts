import { obtenerAssetsBioma, registroBiomas, type AssetBioma } from './registroBiomas';

export type CategoriaMapaId = 'estudio' | 'finanzas' | 'habitos' | 'relaciones' | 'rutinas' | 'salud' | 'tareas';
export type LadoMapa = 'izquierda' | 'derecha';
export type CapaDecoracion = 'fondo' | 'medio' | 'frente';

export type TemaMapaProcedural = {
  acento: string;
  biomaId: string;
  categoriaId: CategoriaMapaId;
  densidadDecoracion: number;
  id: string;
  /** Paquete de árbol asignado al hábito (fijo de por vida) — solo aplica a la categoría 'habitos'. */
  paqueteId?: string;
  presupuestoDecoracion: number;
  /** 0-1: qué tan "crecido" está el pasto en los niveles 1-3 (crece día a día) — 1 = densidad plena. Ver AMBIENTE_DENSIDAD. */
  progresoPastoTemprano?: number;
  /** Nivel real 1-7 del hábito — solo se usa para la categoría 'habitos', define qué etapas de crecimiento se mezclan. */
  nivel?: number;
  /** true si el paquete asignado ya tiene arte real (etapas/semilla) — habilita el scatter de semillas/brotes de nivel 1. Ver tienePaqueteAssetsReales en registroBiomas.ts. */
  tieneAssetsPaquete?: boolean;
};

export type NodoProcedural = { id: string; x: number; y: number };
export type LamparaProcedural = { lado: LadoMapa; tamano: number; x: number; y: number };
/** roca/roca1 al azar por instancia, para variedad visual junto a cada lámpara. */
export type PiedraAssetId = 'roca' | 'roca1';
export type PiedrasProcedurales = {
  assetId: PiedraAssetId;
  desplazamientoX: number;
  desplazamientoY: number;
  espejoHorizontal: -1 | 1;
  lamparaIndice: number;
  tamano: number;
  x: number;
  y: number;
};
export type DecoracionProcedural = {
  assetId: string;
  capa: CapaDecoracion;
  /** Etapa del paquete 1-7, cuando la decoración es un árbol de hábito. */
  etapa?: number;
  escala: number;
  lado: LadoMapa;
  x: number;
  y: number;
  volteado?: boolean;
};

/** Id de los 5 assets universales de pasto/roca — mismos para cualquier bioma, no vienen de registroBiomas. */
export type AmbienteId = 'pasto' | 'pasto1' | 'pasto2' | 'roca' | 'roca1';
export type AmbienteProcedural = { assetId: AmbienteId; escala: number; opacidad: number; volteado: boolean; x: number; y: number };

/** Semilla/brote del paquete — posición solamente, el asset (semilla.png o etapa1.png) lo resuelve el caller vía registroBiomas.ts. */
export type SemillaAmbiental = { escala: number; volteado: boolean; x: number; y: number };

export type MapaProcedural = {
  ambiente: AmbienteProcedural[];
  /** Semillas del paquete esparcidas como pasto por todo el mapa — solo con tieneAssetsPaquete, desvanece con el nivel (ver FACTOR_SEMILLA). */
  semillas: SemillaAmbiental[];
  /** Brotes (etapa 1, más chicos) agrupados cerca de los costados y de cada nodo — mismo desvanecido que semillas. */
  brotes: SemillaAmbiental[];
  decoraciones: DecoracionProcedural[];
  lamparas: LamparaProcedural[];
  nodos: NodoProcedural[];
  piedras: PiedrasProcedurales[];
};

type CajaColision = { x: number; y: number; w: number; h: number };
type RolDecoracion = 'arbol-principal' | 'arbol-secundario' | 'arbol-terciario' | 'arbusto' | 'flor';

// Mezcla de etapas de árbol: profundidad 0 = etapa actual, 1 = una atrás, 2 =
// dos atrás — 70/20/10 de las veces que se coloca un árbol. Si una
// profundidad no está disponible (nivel muy bajo, o el paquete todavía usa el
// puente viejo de un solo asset por rol) se renormaliza entre las que sí.
const PESO_POR_PROFUNDIDAD = [0.7, 0.2, 0.1];

function elegirProfundidad(aleatorio: () => number, disponibles: readonly boolean[]): number {
  const pesos = PESO_POR_PROFUNDIDAD.map((peso, indice) => (disponibles[indice] ? peso : 0));
  const total = pesos.reduce((suma, peso) => suma + peso, 0);
  if (total <= 0) return 0;
  let umbral = aleatorio() * total;
  for (let indice = 0; indice < pesos.length; indice += 1) {
    umbral -= pesos[indice];
    if (umbral <= 0) return indice;
  }
  return pesos.length - 1;
}

const TAMANO_BASE_ASSET = 172;
// Las etapas de paquete no se escalan al azar: cada una comunica una fase
// concreta de crecimiento y debe conservar esa lectura en cualquier mapa.
const TAMANO_ETAPA_POR_NIVEL: Record<number, number> = { 1: 80, 2: 90, 3: 100, 4: 110, 5: 120, 6: 130, 7: 140 };
const SEPARACION_NODOS = 112;
const LIMPIEZA_NODO = 68;
// Aire breve antes del primer nodo. Un margen grande hacía que, al rematar el
// mapa al cambiar de nivel, la escena pareciera quedar alejada.
const DESPLAZAMIENTO_SUPERIOR = 222;
// Ambiente universal (pasto/roca): 3 niveles de opacidad fijos para dar
// sensación de profundidad/textura en vez de un solo tono plano repetido.
// Las 5 variantes (incluyendo pasto1/pasto2) participan por igual.
const AMBIENTE_IDS: AmbienteId[] = ['pasto', 'pasto1', 'pasto2', 'roca', 'roca1'];
const AMBIENTE_OPACIDADES = [0.3, 0.6, 1];
// Tramo final (después del último nodo, la "cola" del mapa): se reduce el
// pasto un 30% ahí para que no se sienta tan cargado justo donde termina el
// sendero — las rocas no se tocan.
const REDUCCION_PASTO_TRAMO_FINAL = 0.3;
// Cobertura de terreno presente, pero 20% más ligera para que los árboles,
// lámparas y nodos respiren mejor.
const AMBIENTE_DENSIDAD = 1 / 1125;
// Semillas/brotes del paquete: MUCHAS en nivel 1 (recién plantado), se van
// perdiendo a medida que el árbol crece — nivel 4 en adelante ya no hay
// ninguna (todo lo que era semilla ya se hizo árbol). Curva lineal simple,
// se ajusta a ojo si hace falta.
function factorSemillaPorNivel(nivel: number): number {
  return Math.max(0, Math.min(1, (4 - nivel) / 3));
}
// Semillas: pocas y pegadas a los costados del mapa (no un scatter amplio
// como el pasto — resultaba demasiado cargado).
const SEMILLA_CANTIDAD_BASE = 8;
// Brotes (etapa 1): la etapa 1 NUNCA se dibuja como árbol protagonista de
// nodo (ver el "continue" en el loop de árboles) — en su lugar se ve como un
// puñado de brotes de tamaño similar a un nodo (60-80px), repartidos por todo
// el mapa pero siempre pegados a los bordes izquierdo/derecho, con espacio
// entre uno y otro para que no se vean amontonados.
// Etapa 1 tiene lectura de semilla/brote, no de árbol alto. Nueve por lado
// deja los bordes vivos desde el inicio sin invadir el sendero central.
const BROTES_POR_LADO = 9;
const ARBOLES_ETAPA_POR_NODO = 2;
const PROBABILIDAD_ARBOL_INTERMEDIO = 0.32;
const RECORTE_LATERAL_ARBOL_INTERMEDIO = 0.12;
// Etapa 1: 80px, la misma regla fija que el árbol de etapa 1.
const BROTE_ESCALA_MIN = 80 / TAMANO_BASE_ASSET;
const BROTE_ESCALA_MAX = 80 / TAMANO_BASE_ASSET;
const BROTE_SEPARACION_MINIMA = 90;

const hashCadena = (valor: string) => Array.from(valor).reduce((hash, caracter) => ((hash << 5) - hash + caracter.charCodeAt(0)) | 0, 2166136261) >>> 0;

function crearAleatorio(seed: string) {
  let estado = hashCadena(seed) || 1;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

function hayColision(caja: CajaColision, cajas: readonly CajaColision[]) {
  return cajas.some((existente) => caja.x < existente.x + existente.w && caja.x + caja.w > existente.x && caja.y < existente.y + existente.h && caja.y + caja.h > existente.y);
}

function crearCaja(x: number, y: number, tamano: number): CajaColision {
  return { x: x + tamano * 0.18, y: y + tamano * 0.22, w: tamano * 0.64, h: tamano * 0.62 };
}

export function crearTemaMapa(categoriaId: CategoriaMapaId, acento: string, id: string, paqueteId?: string, nivel?: number, progresoPastoTemprano?: number, tieneAssetsPaquete?: boolean): TemaMapaProcedural {
  const regla = registroBiomas[categoriaId];
  return {
    acento,
    biomaId: regla.biomaId,
    categoriaId,
    densidadDecoracion: regla.densidadDecoracion,
    id,
    nivel,
    paqueteId,
    presupuestoDecoracion: regla.presupuestoDecoracion,
    progresoPastoTemprano,
    tieneAssetsPaquete,
  };
}

export function generarMapaProcedural({ ancho, cantidadNodos, tema }: { ancho: number; cantidadNodos: number; tema: TemaMapaProcedural }): MapaProcedural {
  const aleatorio = crearAleatorio(`${tema.biomaId}:${tema.id}`);
  const centro = ancho / 2;
  const nodos: NodoProcedural[] = [];
  const lamparas: LamparaProcedural[] = [];
  const piedras: PiedrasProcedurales[] = [];
  const decoraciones: DecoracionProcedural[] = [];
  const cajasProtegidas: CajaColision[] = [{ x: 0, y: -80, w: ancho, h: 80 }];
  const cajasDecoracion: CajaColision[] = [];
  const assets = obtenerAssetsBioma(tema.categoriaId, tema.paqueteId, tema.nivel)
    .filter((asset): asset is AssetBioma & { rol: RolDecoracion } => asset.rol !== 'base');
  const assetsPorRol = (rol: RolDecoracion) => assets.filter((asset) => asset.rol === rol);

  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = DESPLAZAMIENTO_SUPERIOR + indice * SEPARACION_NODOS;
    nodos.push({ id: `nodo-${indice}`, x, y });
    cajasProtegidas.push({ x: x - 42, y: y - 42, w: 84, h: 84 });

    if (indice === 0) continue;
    const ladoLampara: LadoMapa = x < centro ? 'derecha' : 'izquierda';
    const lamparaX = ladoLampara === 'derecha' ? ancho - 108 : 64;
    const lamparaY = y - 16;
    const tamanoLampara = 23 + Math.round(aleatorio() * 3);
    lamparas.push({ lado: ladoLampara, tamano: tamanoLampara, x: lamparaX, y: lamparaY });
    cajasProtegidas.push({ x: lamparaX - 14, y: lamparaY - 14, w: 58, h: 62 });
  }

  const cantidadPiedras = Math.min(5, Math.max(3, Math.ceil((nodos.length - 1) * 0.65)));
  for (let indice = 0; indice < cantidadPiedras; indice += 1) {
    const indiceNodo = Math.min(nodos.length - 1, Math.max(1, Math.floor((indice + 1) * nodos.length / (cantidadPiedras + 1))));
    const lamparaIndice = Math.max(0, indiceNodo - 1);
    const lamparaAsociada = lamparas[lamparaIndice];
    const tamano = 42 + Math.round(aleatorio() * 12);
    const desplazamientoX = -8 + Math.round(aleatorio() * 16);
    const desplazamientoY = -5 + Math.round(aleatorio() * 10);
    piedras.push({
      assetId: aleatorio() > 0.5 ? 'roca' : 'roca1',
      desplazamientoX,
      desplazamientoY,
      espejoHorizontal: lamparaAsociada.lado === 'izquierda' ? -1 : 1,
      lamparaIndice,
      tamano,
      x: lamparaAsociada.x - tamano * (lamparaAsociada.lado === 'izquierda' ? 0.25 : 0.75) + desplazamientoX,
      y: lamparaAsociada.y + 36 + desplazamientoY,
    });
  }

  // Un paquete real de hábito tiene arte por etapa; su vegetación puede
  // poblar ambos bordes. Los biomas antiguos conservan su presupuesto actual.
  const presupuestoDecoracion = tema.tieneAssetsPaquete
    ? Math.max(tema.presupuestoDecoracion, nodos.length * ARBOLES_ETAPA_POR_NODO + Math.ceil(nodos.length * PROBABILIDAD_ARBOL_INTERMEDIO) + 6)
    : tema.presupuestoDecoracion;

  function colocar({ assetId, capa, escala, etapa, lado, x, y }: Omit<DecoracionProcedural, 'volteado'>) {
    if (decoraciones.length >= presupuestoDecoracion) return false;
    const tamano = TAMANO_BASE_ASSET * escala;
    const caja = crearCaja(x, y, tamano);
    const centroDecoracion = { x: x + tamano / 2, y: y + tamano / 2 };
    const invadeNodo = nodos.some((nodo) => Math.hypot(centroDecoracion.x - nodo.x, centroDecoracion.y - nodo.y) <= LIMPIEZA_NODO);
    if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion)) return false;

    decoraciones.push({ assetId, capa, escala, etapa, lado, x, y, volteado: aleatorio() > 0.5 });
    cajasDecoracion.push(caja);
    return true;
  }

  // Intenta el lado preferido y, si choca con algo ya colocado, prueba el
  // lado contrario antes de rendirse — evita que un solo lado fijo condene
  // una pieza a desaparecer cada vez que otra decoración ya lo ocupa.
  function colocarConLadoAlterno(ladoPreferido: LadoMapa, crear: (lado: LadoMapa) => Omit<DecoracionProcedural, 'volteado'>) {
    if (colocar(crear(ladoPreferido))) return true;
    return colocar(crear(ladoPreferido === 'izquierda' ? 'derecha' : 'izquierda'));
  }

  const arbolesPrincipales = assetsPorRol('arbol-principal');
  const arbolesSecundarios = assetsPorRol('arbol-secundario');
  const arbolesTerciarios = assetsPorRol('arbol-terciario');
  const arbolesPorProfundidad = [arbolesPrincipales, arbolesSecundarios, arbolesTerciarios];
  const usaProfundidad = arbolesTerciarios.length > 0;

  // El árbol irregular se planta primero: flores, arbustos, pasto y los
  // árboles regulares deberán respetar su espacio. Las lámparas permanecen
  // como zonas protegidas y nunca se desplazan.
  if (tema.tieneAssetsPaquete && usaProfundidad) {
    for (let indice = 0; indice < nodos.length - 1; indice += 1) {
      if (aleatorio() > PROBABILIDAD_ARBOL_INTERMEDIO) continue;

      const disponibles = arbolesPorProfundidad.map((lista) => lista.length > 0);
      const profundidad = elegirProfundidad(aleatorio, disponibles);
      const arbolesEtapa = arbolesPorProfundidad[profundidad];
      const arbol = arbolesEtapa[Math.floor(aleatorio() * arbolesEtapa.length)];
      const etapa = Math.max(1, (tema.nivel ?? 1) - profundidad);
      if (!arbol || etapa === 1) continue;

      const tamano = TAMANO_ETAPA_POR_NIVEL[etapa] ?? TAMANO_BASE_ASSET * 0.7;
      const escala = tamano / TAMANO_BASE_ASSET;
      const lado: LadoMapa = aleatorio() > 0.5 ? 'izquierda' : 'derecha';
      const y = (nodos[indice].y + nodos[indice + 1].y) / 2 - tamano * 0.62;
      const capa: CapaDecoracion = profundidad === 0 ? 'frente' : profundidad === 1 ? 'medio' : 'fondo';
      const desbordeLateral = tamano * RECORTE_LATERAL_ARBOL_INTERMEDIO;

      colocar({
        assetId: arbol.id,
        capa,
        escala,
        etapa,
        lado,
        x: lado === 'izquierda' ? -desbordeLateral : ancho - tamano + desbordeLateral,
        y,
      });
    }
  }

  // La primera curva siempre recibe una flor antes de colocar árboles: evita que el follaje la oculte.
  const florInicial = assetsPorRol('flor')[0];
  const ladoFlorInicial: LadoMapa = aleatorio() > 0.5 ? 'izquierda' : 'derecha';
  if (florInicial && nodos.length > 1) {
    const escala = 0.24;
    const tamano = TAMANO_BASE_ASSET * escala;
    colocar({
      assetId: florInicial.id,
      capa: 'frente',
      escala,
      lado: ladoFlorInicial,
      x: ladoFlorInicial === 'izquierda' ? 58 : ancho - tamano - 58,
      y: (nodos[0].y + nodos[1].y) / 2 - tamano * 0.4,
    });
  }

  // Dos arbustos laterales aseguran que el sendero no se sienta vacío aun con un bioma poco denso.
  const arbustosIniciales = assetsPorRol('arbusto');
  for (let indice = 0; indice < Math.min(2, arbustosIniciales.length ? 2 : 0, Math.max(0, nodos.length - 1)); indice += 1) {
    const ladoLampara: LadoMapa = nodos[indice + 1].x < centro ? 'derecha' : 'izquierda';
    const ladoPreferido: LadoMapa = ladoLampara === 'izquierda' ? 'derecha' : 'izquierda';
    const escala = 0.42;
    const tamano = TAMANO_BASE_ASSET * escala;
    const y = (nodos[indice].y + nodos[indice + 1].y) / 2 + 12;
    colocarConLadoAlterno(ladoPreferido, (lado) => ({
      assetId: arbustosIniciales[indice % arbustosIniciales.length].id,
      capa: 'medio',
      escala,
      lado,
      x: lado === 'izquierda' ? 10 : ancho - tamano - 10,
      y,
    }));
  }

  // Cada tramo alterna su masa vegetal: un árbol encuadra la curva y los detalles acercan el camino.
  // El lado preferido es el contrario a la lámpara de ese nodo (más "adentro",
  // mirando hacia el centro del sendero); si ese lado ya está ocupado
  // (arbusto lateral, otro árbol, etc.) se prueba el lado contrario antes de
  // descartar el árbol — antes se elegía un único lado fijo y, al traer los
  // árboles más hacia adentro, cualquier choque los hacía desaparecer del
  // todo en vez de solo cambiar de lado.
  // Mezcla de etapas (solo activa si el paquete ya tiene arte real por etapa —
  // ver registroBiomas.ts): en vez de alternar 2 roles fijos por índice de
  // nodo, cada árbol sortea su profundidad (actual/una atrás/dos atrás) con
  // PESO_POR_PROFUNDIDAD y así resuelve tanto la imagen como la capa (más
  // nuevo = más al frente). Si el paquete usa el puente viejo (un asset por
  // rol, sin arbol-terciario), se mantiene la alternancia de siempre.
  for (let indice = 0; indice < nodos.length; indice += 1) {
    const nodo = nodos[indice];
    const ladoLampara: LadoMapa = nodo.x < centro ? 'derecha' : 'izquierda';
    const ladoPreferido: LadoMapa = ladoLampara === 'izquierda' ? 'derecha' : 'izquierda';

    let arbol: AssetBioma | undefined;
    let capa: CapaDecoracion;
    let esEtapaUno = false;
    let etapaArbol: number | undefined;
    if (usaProfundidad) {
      const disponibles = arbolesPorProfundidad.map((lista) => lista.length > 0);
      const profundidad = elegirProfundidad(aleatorio, disponibles);
      const lista = arbolesPorProfundidad[profundidad];
      arbol = lista[Math.floor(aleatorio() * lista.length)];
      capa = profundidad === 0 ? 'frente' : profundidad === 1 ? 'medio' : 'fondo';
      etapaArbol = Math.max(1, (tema.nivel ?? 1) - profundidad);
      esEtapaUno = etapaArbol === 1;
    } else {
      const arboles = indice % 3 === 0 ? arbolesPrincipales : arbolesSecundarios;
      arbol = arboles[Math.floor(aleatorio() * arboles.length)];
      capa = indice % 3 === 0 ? 'frente' : 'fondo';
    }
    if (!arbol) continue;
    // La etapa 1 (recién plantada) nunca se dibuja como árbol protagonista
    // de nodo — se ve mal a tamaño de árbol grande. En su lugar se resuelve
    // aparte, como un scatter de brotes chicos pegados a los bordes (ver
    // más abajo, bloque de "brotes"). Esto vacía el mapa de nivel 1 de
    // árboles-nodo (ahí SIEMPRE es etapa1) a propósito.
    if (esEtapaUno) continue;
    const arbolElegido = arbol;

    // Los árboles de un paquete real conservan un tamaño fijo por etapa.
    // El puente antiguo de biomas mantiene su ligera variación original.
    const tamanoFijoEtapa = etapaArbol ? TAMANO_ETAPA_POR_NIVEL[etapaArbol] : undefined;
    const escala = tamanoFijoEtapa ? tamanoFijoEtapa / TAMANO_BASE_ASSET : 0.7 + aleatorio() * 0.24;
    const tamano = TAMANO_BASE_ASSET * escala;
    const y = nodo.y - tamano * 0.62;
    const crearArbolLateral = (lado: LadoMapa): Omit<DecoracionProcedural, 'volteado'> => ({
      assetId: arbolElegido.id,
      capa,
      escala,
      etapa: etapaArbol,
      lado,
      // Siempre anclado a un borde: jamás cruza al centro del sendero.
      x: lado === 'izquierda' ? 8 : ancho - tamano - 8,
      y,
    });

    if (tema.tieneAssetsPaquete) {
      // Cada etapa real enmarca el nodo desde ambos costados. Las colisiones
      // siguen siendo la autoridad final, por lo que jamás tapa un nodo,
      // lámpara o árbol ya colocado.
      colocar(crearArbolLateral(ladoPreferido));
      colocar(crearArbolLateral(ladoPreferido === 'izquierda' ? 'derecha' : 'izquierda'));
    } else {
      colocarConLadoAlterno(ladoPreferido, crearArbolLateral);
    }
  }

  for (let indice = 0; indice < Math.max(0, nodos.length - 1); indice += 1) {
    const actual = nodos[indice];
    const siguiente = nodos[indice + 1];
    const ladoPreferido: LadoMapa = actual.x < centro ? 'derecha' : 'izquierda';
    const centroTramoY = (actual.y + siguiente.y) / 2;

    const flores = assetsPorRol('flor');
    const flor = flores[Math.floor(aleatorio() * flores.length)];
    if (flor && (indice === 0 || aleatorio() < tema.densidadDecoracion * 0.62)) {
      const escala = 0.18 + aleatorio() * 0.1;
      const tamano = TAMANO_BASE_ASSET * escala;
      const factorX = aleatorio() * 20;
      const y = centroTramoY - tamano * 0.38;
      colocarConLadoAlterno(ladoPreferido, (lado) => ({
        assetId: flor.id,
        capa: 'frente',
        escala,
        lado,
        x: lado === 'izquierda' ? centro - 96 - factorX : centro + 62 + factorX,
        y,
      }));
    }

    const arbustos = assetsPorRol('arbusto');
    const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
    if (arbusto && (indice < 2 || aleatorio() < Math.min(0.94, tema.densidadDecoracion + 0.16))) {
      const escala = 0.36 + aleatorio() * 0.2;
      const tamano = TAMANO_BASE_ASSET * escala;
      const factorX = aleatorio() * 34;
      const y = centroTramoY - tamano * 0.45;
      colocarConLadoAlterno(ladoPreferido, (lado) => ({
        assetId: arbusto.id,
        capa: 'medio',
        escala,
        lado,
        x: lado === 'izquierda' ? 14 + factorX : ancho - tamano - 14 - factorX,
        y,
      }));
    }
  }

  // Pasto/roca universales: pocas piezas pero grandes, como macizos de
  // diseño (no textura de fondo) — van al final porque ahora sí evitan pisar
  // la vegetación del bioma ya colocada (cajasDecoracion), además de nodos y
  // lámparas; también evitan pisarse entre sí (cajasAmbiente propia).
  const ambiente: AmbienteProcedural[] = [];
  const cajasAmbiente: CajaColision[] = [];
  const altoMapa = DESPLAZAMIENTO_SUPERIOR + Math.max(0, nodos.length - 1) * SEPARACION_NODOS + 200;
  const cantidadAmbiente = Math.round(ancho * altoMapa * AMBIENTE_DENSIDAD);
  const ultimoNodoY = nodos[nodos.length - 1]?.y ?? 0;
  // Pasto crítico en niveles 1-3, pero no de golpe: crece "poquito a poquito"
  // con progresoPastoTemprano (0-1, calculado por el caller a partir de los
  // días completados). Piso de 0.3 para que nunca se sienta pelado desde el
  // primer día. No afecta a las rocas ni a categorías que no son 'habitos'
  // (ahí progresoPastoTemprano queda undefined → factor 1, sin cambios).
  const factorCrecimientoPasto = Math.max(0.3, Math.min(1, tema.progresoPastoTemprano ?? 1));
  for (let indice = 0; indice < cantidadAmbiente; indice += 1) {
    const escala = 0.18 + aleatorio() * 0.16;
    const tamano = TAMANO_BASE_ASSET * escala;
    const x = aleatorio() * (ancho - tamano);
    const y = -50 + aleatorio() * (altoMapa + 50);
    const caja = crearCaja(x, y, tamano);
    const centro = { x: x + tamano / 2, y: y + tamano / 2 };
    const invadeNodo = nodos.some((nodo) => Math.hypot(centro.x - nodo.x, centro.y - nodo.y) <= LIMPIEZA_NODO);
    if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion) || hayColision(caja, cajasAmbiente)) continue;
    const assetId = AMBIENTE_IDS[Math.floor(aleatorio() * AMBIENTE_IDS.length)];
    const enTramoFinal = centro.y > ultimoNodoY;
    if (assetId.startsWith('pasto')) {
      if (enTramoFinal && aleatorio() < REDUCCION_PASTO_TRAMO_FINAL) continue;
      if (aleatorio() > factorCrecimientoPasto) continue;
    }
    const opacidad = AMBIENTE_OPACIDADES[Math.floor(aleatorio() * AMBIENTE_OPACIDADES.length)];
    ambiente.push({ assetId, escala, opacidad, volteado: aleatorio() > 0.5, x, y });
    cajasAmbiente.push(caja);
  }

  // Semillas y brotes del paquete — solo si ya tiene arte real cargado
  // (registroBiomas.ts resuelve qué imagen usar; acá solo se generan
  // posiciones). Se desvanecen igual, con factorSemillaPorNivel.
  const semillas: SemillaAmbiental[] = [];
  const brotes: SemillaAmbiental[] = [];
  if (tema.categoriaId === 'habitos' && tema.tieneAssetsPaquete) {
    const factorSemilla = factorSemillaPorNivel(tema.nivel ?? 1);
    if (factorSemilla > 0) {
      // Semillas: pocas, pegadas a los costados — no un scatter amplio como
      // el pasto (era demasiado), unas 8 a densidad plena repartidas en toda
      // la altura del mapa pero solo cerca del borde izquierdo/derecho.
      const cantidadSemillas = Math.round(SEMILLA_CANTIDAD_BASE * factorSemilla);
      for (let indice = 0; indice < cantidadSemillas; indice += 1) {
        const escala = 0.12 + aleatorio() * 0.1;
        const tamano = TAMANO_BASE_ASSET * escala;
        const ladoSemilla: LadoMapa = aleatorio() > 0.5 ? 'izquierda' : 'derecha';
        const x = ladoSemilla === 'izquierda'
          ? aleatorio() * 50
          : ancho - tamano - aleatorio() * 50;
        const y = -50 + aleatorio() * (altoMapa + 50);
        const caja = crearCaja(x, y, tamano);
        const centro = { x: x + tamano / 2, y: y + tamano / 2 };
        const invadeNodo = nodos.some((nodo) => Math.hypot(centro.x - nodo.x, centro.y - nodo.y) <= LIMPIEZA_NODO);
        if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion) || hayColision(caja, cajasAmbiente)) continue;
        semillas.push({ escala, volteado: aleatorio() > 0.5, x, y });
        cajasAmbiente.push(caja);
      }

      // Brotes (etapa 1): tamaño similar a un nodo (60-80px), repartidos por
      // toda la altura del mapa pero siempre pegados a un borde — no atados a
      // ningún nodo en particular — y con separación mínima entre sí para que
      // no queden amontonados.
      for (const ladoBrote of ['izquierda', 'derecha'] as const) {
        const cantidadBrotes = Math.round(BROTES_POR_LADO * factorSemilla);
        const posicionesY: number[] = [];
        let intentos = 0;
        while (posicionesY.length < cantidadBrotes && intentos < cantidadBrotes * 25) {
          intentos += 1;
          const escala = BROTE_ESCALA_MIN + aleatorio() * (BROTE_ESCALA_MAX - BROTE_ESCALA_MIN);
          const tamano = TAMANO_BASE_ASSET * escala;
          const y = aleatorio() * altoMapa;
          if (posicionesY.some((otraY) => Math.abs(otraY - y) < BROTE_SEPARACION_MINIMA)) continue;
          const x = ladoBrote === 'izquierda' ? aleatorio() * 30 : ancho - tamano - aleatorio() * 30;
          const caja = crearCaja(x, y, tamano);
          const centro = { x: x + tamano / 2, y: y + tamano / 2 };
          const invadeNodo = nodos.some((nodo) => Math.hypot(centro.x - nodo.x, centro.y - nodo.y) <= LIMPIEZA_NODO);
          if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion) || hayColision(caja, cajasAmbiente)) continue;
          brotes.push({ escala, volteado: aleatorio() > 0.5, x, y });
          cajasAmbiente.push(caja);
          posicionesY.push(y);
        }
      }
    }
  }

  return { ambiente, brotes, decoraciones, lamparas, nodos, piedras, semillas };
}
