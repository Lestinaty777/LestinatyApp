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
  escala: number;
  lado: LadoMapa;
  x: number;
  y: number;
  volteado?: boolean;
};

/** Id de los 5 assets universales de pasto/roca — mismos para cualquier bioma, no vienen de registroBiomas. */
export type AmbienteId = 'pasto' | 'pasto1' | 'pasto2' | 'roca' | 'roca1';
export type AmbienteProcedural = { assetId: AmbienteId; escala: number; opacidad: number; volteado: boolean; x: number; y: number };

export type MapaProcedural = {
  ambiente: AmbienteProcedural[];
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
const SEPARACION_NODOS = 112;
const LIMPIEZA_NODO = 68;
// Ambiente universal (pasto/roca): 3 niveles de opacidad fijos para dar
// sensación de profundidad/textura en vez de un solo tono plano repetido.
// Las 5 variantes (incluyendo pasto1/pasto2) participan por igual.
const AMBIENTE_IDS: AmbienteId[] = ['pasto', 'pasto1', 'pasto2', 'roca', 'roca1'];
const AMBIENTE_OPACIDADES = [0.3, 0.6, 1];
// Tramo final (después del último nodo, la "cola" del mapa): se reduce el
// pasto un 30% ahí para que no se sienta tan cargado justo donde termina el
// sendero — las rocas no se tocan.
const REDUCCION_PASTO_TRAMO_FINAL = 0.3;
// "Mucho pasto y rocas" — más denso que el ajuste anterior (que buscaba pocas
// piezas grandes tipo acento); ahora se quiere cobertura real de terreno.
const AMBIENTE_DENSIDAD = 1 / 900;

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

export function crearTemaMapa(categoriaId: CategoriaMapaId, acento: string, id: string, paqueteId?: string, nivel?: number, progresoPastoTemprano?: number): TemaMapaProcedural {
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
    const y = 54 + indice * SEPARACION_NODOS;
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

  function colocar({ assetId, capa, escala, lado, x, y }: Omit<DecoracionProcedural, 'volteado'>) {
    if (decoraciones.length >= tema.presupuestoDecoracion) return false;
    const tamano = TAMANO_BASE_ASSET * escala;
    const caja = crearCaja(x, y, tamano);
    const centroDecoracion = { x: x + tamano / 2, y: y + tamano / 2 };
    const invadeNodo = nodos.some((nodo) => Math.hypot(centroDecoracion.x - nodo.x, centroDecoracion.y - nodo.y) <= LIMPIEZA_NODO);
    if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion)) return false;

    decoraciones.push({ assetId, capa, escala, lado, x, y, volteado: aleatorio() > 0.5 });
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
  const arbolesPrincipales = assetsPorRol('arbol-principal');
  const arbolesSecundarios = assetsPorRol('arbol-secundario');
  const arbolesTerciarios = assetsPorRol('arbol-terciario');
  const arbolesPorProfundidad = [arbolesPrincipales, arbolesSecundarios, arbolesTerciarios];
  const usaProfundidad = arbolesTerciarios.length > 0;

  for (let indice = 0; indice < nodos.length; indice += 1) {
    const nodo = nodos[indice];
    const ladoLampara: LadoMapa = nodo.x < centro ? 'derecha' : 'izquierda';
    const ladoPreferido: LadoMapa = ladoLampara === 'izquierda' ? 'derecha' : 'izquierda';

    let arbol: AssetBioma | undefined;
    let capa: CapaDecoracion;
    if (usaProfundidad) {
      const disponibles = arbolesPorProfundidad.map((lista) => lista.length > 0);
      const profundidad = elegirProfundidad(aleatorio, disponibles);
      const lista = arbolesPorProfundidad[profundidad];
      arbol = lista[Math.floor(aleatorio() * lista.length)];
      capa = profundidad === 0 ? 'frente' : profundidad === 1 ? 'medio' : 'fondo';
    } else {
      const arboles = indice % 3 === 0 ? arbolesPrincipales : arbolesSecundarios;
      arbol = arboles[Math.floor(aleatorio() * arboles.length)];
      capa = indice % 3 === 0 ? 'frente' : 'fondo';
    }
    if (!arbol) continue;
    const arbolElegido = arbol;

    const escala = 0.7 + aleatorio() * 0.24;
    const tamano = TAMANO_BASE_ASSET * escala;
    const factorX = aleatorio() * 0.14;
    const y = nodo.y - tamano * (0.45 + aleatorio() * 0.18);
    colocarConLadoAlterno(ladoPreferido, (lado) => ({
      assetId: arbolElegido.id,
      capa,
      escala,
      lado,
      x: lado === 'izquierda' ? -tamano * (0.38 + factorX) : ancho - tamano * (0.62 - factorX),
      y,
    }));
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
  const altoMapa = 54 + Math.max(0, nodos.length - 1) * SEPARACION_NODOS + 200;
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

  return { ambiente, decoraciones, lamparas, nodos, piedras };
}
