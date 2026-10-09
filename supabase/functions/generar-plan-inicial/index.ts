// Supabase Edge Function. Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
//
// Fase 11.2 — primera llamada del flujo de creación de un Plan con IA:
// genera el título/descripción del plan, el título+resumen de TODAS sus
// secciones (para que el "mapa" completo se vea desde el día 1), y el
// detalle completo (días/bloques/ítems) de SOLO la primera sección — el
// resto se detalla una por una con detallar-seccion-plan, a medida que el
// usuario llega a ellas (ver decisión de producto en el plan: generación
// progresiva, no todo de una).
//
// Mismo esqueleto que generar-sendero-aby (lock anti-concurrencia, propuesta
// guardada en una tabla "pendiente de aceptar", Gemini 2.5 Flash) más dos
// chequeos nuevos que ese flujo no tenía: Horizon activo y tope mensual de
// generaciones (ver _shared/accesoAbyPlanes.ts).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

import { registrarUsoAby, verificarAccesoAby } from '../_shared/accesoAbyPlanes.ts';
import { disponibilidadSchema, instruccionDisponibilidad, MOMENTOS } from '../_shared/disponibilidadPlan.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const TIPOS_ITEM = ['simple', 'contador', 'cronometro'] as const;
const itemSchema = z.object({
  metaValor: z.number().positive().max(1000).optional(),
  tipo: z.enum(TIPOS_ITEM).default('simple'),
  titulo: z.string().trim().min(1).max(160),
  unidad: z.string().trim().max(30).optional(),
}).superRefine((item, contexto) => {
  if (item.tipo !== 'simple' && item.metaValor === undefined) {
    contexto.addIssue({ code: 'custom', message: 'Los items de tipo contador/cronometro necesitan metaValor.' });
  }
});
const bloqueSchema = z.object({
  items: z.array(itemSchema).min(1).max(6),
  mensajeContexto: z.string().trim().min(1).max(400),
  momento: z.enum(MOMENTOS),
});
const diaSchema = z.object({
  bloques: z.array(bloqueSchema).min(1).max(3),
  titulo: z.string().trim().max(120).optional(),
}).superRefine((dia, contexto) => {
  if (new Set(dia.bloques.map((bloque) => bloque.momento)).size !== dia.bloques.length) {
    contexto.addIssue({ code: 'custom', message: 'Los bloques de un dia no pueden repetir momento.' });
  }
});
const seccionResumenSchema = z.object({
  resumen: z.string().trim().min(1).max(300),
  titulo: z.string().trim().min(1).max(120),
});
const ramaResumenSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  resumen: z.string().trim().min(1).max(300),
});
// Dos formas posibles, nunca mezcladas: "ramas" (recien se pide dividir el
// plan, todavia no se detalla nada — ver nota de Ramas abajo) o la forma de
// siempre (secciones + primera seccion detallada). superRefine obliga a que
// la respuesta tenga EXACTAMENTE una de las dos.
const planInicialSchema = z.object({
  descripcionPlan: z.string().trim().min(1).max(500),
  primeraSeccionDias: z.array(diaSchema).min(1).max(14).optional(),
  ramas: z.array(ramaResumenSchema).min(2).max(6).optional(),
  secciones: z.array(seccionResumenSchema).min(2).max(8).optional(),
  tituloPlan: z.string().trim().min(1).max(120),
}).superRefine((plan, contexto) => {
  const tieneRamas = plan.ramas !== undefined;
  const tieneSecciones = plan.secciones !== undefined && plan.primeraSeccionDias !== undefined;
  if (tieneRamas === tieneSecciones) {
    contexto.addIssue({ code: 'custom', message: 'La respuesta tiene que traer "ramas" O "secciones"+"primeraSeccionDias", nunca ambos ni ninguno.' });
  }
});

// Ramas — Fase 12.2: dividir un plan en partes paralelas (ej. "Distribucion"/
// "Creacion" de un plan de marketing, o los canales de una estrategia que
// una sola persona lleva sola: "YouTube"/"SEO"/"Reddit"). Una persona puede
// reclamar mas de una rama del mismo plan (ver migracion 75) — lo unico que
// nunca puede pasar es que DOS personas reclamen la MISMA rama. La clave: el
// detalle real (dias/bloques/items) de una rama se genera recien cuando
// alguien la RECLAMA, nunca antes — hasta ese momento no se sabe quien es
// esa persona ni cuanto tiempo tiene. Por eso esta funcion tiene dos modos
// nuevos, ademas del de siempre:
//   cantidadRamas: crea el plan con N ramas SIN detalle (solo nombre+resumen
//   de cada una) — no pide disponibilidad, todavia no aplica a nadie.
//   ramaId: detalla UNA rama ya existente de un plan ya existente — pide la
//   disponibilidad de quien la esta reclamando, igual que el modo normal
//   pide la del creador.
const solicitudSchema = z.object({
  cantidadRamas: z.number().int().min(2).max(6).optional(),
  // Detalle adicional opcional (nivel, que ya tenes, en que enfocarte) — se
  // suma al objetivo en el prompt, nunca se guarda en columna propia.
  contexto: z.string().trim().max(2000).optional(),
  disponibilidad: disponibilidadSchema.optional(),
  objetivo: z.string().trim().min(1).max(500).optional(),
  // En cuantos dias quiere lograrlo, a partir de hoy — reemplaza a pedir una
  // fecha de calendario (mas natural para el usuario, y mas util para Aby:
  // le da una referencia real de cuanto repartir el trabajo). El cliente es
  // quien deriva despues la fecha real (hoy + plazoDias) para guardarla.
  plazoDias: z.number().int().min(1).max(365).optional(),
  plataforma: z.enum(['android', 'ios', 'web']).optional(),
  ramaId: z.string().uuid().optional(),
}).superRefine((solicitud, contexto) => {
  if (solicitud.ramaId && solicitud.cantidadRamas) {
    contexto.addIssue({ code: 'custom', message: 'No se puede pedir ramaId y cantidadRamas a la vez.' });
  }
  if (!solicitud.ramaId && !solicitud.objetivo) {
    contexto.addIssue({ code: 'custom', message: 'Falta el objetivo.' });
  }
  if (!solicitud.cantidadRamas && !solicitud.disponibilidad) {
    contexto.addIssue({ code: 'custom', message: 'Falta la disponibilidad.' });
  }
});

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
}

// El arco de 4 fases (ver docs/plan de Planes) es deliberadamente generico:
// Planes es para objetivos de ACCION con una meta y un final concreto (crear
// algo, organizar algo, prepararse para algo) — nunca para aprender una
// habilidad (eso ya lo resuelve el sendero de estudio de Aby, otro flujo).
// "Construccion" no es literal "construir un producto": es el trabajo
// central del objetivo, sea investigar, practicar, producir o decidir.
// cantidadRamas: pide SOLO nombre+resumen de cada rama, sin tocar disponibilidad
// (nadie la reclamo todavia). contextoRama: el detalle normal pero enfocado
// en una rama ya nombrada (se le pasa cuando alguien la reclama). contexto:
// detalle libre que el usuario agrego ademas del objetivo corto (nivel, que
// ya tiene, en que enfocarse). plazoDias: en cuantos dias se tiene que
// completar — a todo el plan si es la primera llamada, o a lo que queda del
// plazo original si es el detalle de una rama ya reclamada mas tarde.
function instruccionGemini(input: {
  cantidadRamas?: number;
  contexto?: string;
  contextoRama?: string;
  disponibilidad?: Record<string, number | string>;
  objetivo: string;
  plazoDias?: number;
}) {
  const { cantidadRamas, contexto, contextoRama, disponibilidad, objetivo, plazoDias } = input;
  const objetivoConContexto = contexto ? `${objetivo}\n\nContexto adicional que dio el usuario (nivel, que ya tiene, en que enfocarse): ${contexto}` : objetivo;
  const lineaPlazo = plazoDias
    ? `El plan se tiene que completar en EXACTAMENTE ${plazoDias} dia${plazoDias === 1 ? '' : 's'} a partir de hoy — repartí el trabajo pensando en ese plazo real: ni lo alargues de mas ni lo acelere demasiado.`
    : '';

  if (cantidadRamas) {
    return [
      'Eres Aby, asistente de planificacion de Lestinaty. Planeas objetivos de ACCION con una meta y un final concreto.',
      'Responde exclusivamente un objeto JSON valido, sin Markdown ni texto adicional.',
      `El usuario quiere lograr esto, dividido en partes independientes (puede repartirlas entre varias personas, o llevarlas todas el mismo): "${objetivoConContexto}".`,
      lineaPlazo,
      '',
      `Dividi el objetivo en EXACTAMENTE ${cantidadRamas} partes paralelas (ramas).`,
      'Las ramas tienen que ser GENUINAMENTE PARALELAS: alguien tiene que poder avanzar en cualquiera de ellas sin que otra rama necesite estar terminada antes. Busca dimensiones que separan bien el trabajo — canales distintos, publicos distintos, regiones distintas, o frentes de trabajo con entregables propios.',
      'NO dividas por ETAPAS de un mismo proceso secuencial — eso no son ramas, es un cronograma cortado en pedazos. MAL (para un plan de marketing): "Investigacion" -> "Posicionamiento" -> "Contenido" -> "Metricas" (cada una depende de que la anterior termine, nadie puede avanzar "Metricas" sin que las demas ya existan). BIEN: "Canal: YouTube", "Canal: SEO", "Canal: Redes pagas" (cada una se trabaja en paralelo, sin esperar a las demas).',
      'Si el objetivo es inherentemente secuencial y no existe una division paralela real, elegi la division que minimice las dependencias entre ramas — pero nunca entregues fases de un proceso secuencial disfrazadas de ramas.',
      'Devuelve tituloPlan, descripcionPlan, y "ramas": lista de exactamente esa cantidad de { nombre, resumen } — nombre corto (2-4 palabras), resumen de una linea de que cubre esa rama. NO devuelvas "secciones" ni "primeraSeccionDias" en este caso — eso se genera recien cuando alguien reclama una rama especifica.',
      'Se especifico y realista para el objetivo dado.',
    ].filter(Boolean).join('\n');
  }

  const objetivoCompleto = contextoRama ? `${objetivoConContexto}\n\nTU PARTE ESPECIFICA DE ESTE PLAN (enfocate SOLO en esto, no en el resto): ${contextoRama}` : objetivoConContexto;
  return [
    'Eres Aby, asistente de planificacion de Lestinaty. Planeas objetivos de ACCION con una meta y un final concreto (crear algo, organizar algo, lograr algo puntual) — nunca objetivos de aprender una habilidad como un idioma o un instrumento, eso no es tu trabajo aca.',
    'Responde exclusivamente un objeto JSON valido, sin Markdown ni texto adicional.',
    `El usuario quiere lograr esto: "${objetivoCompleto}".`,
    lineaPlazo,
    '',
    instruccionDisponibilidad(disponibilidad as Record<string, number | string>),
    '',
    'ARCO DEL PLAN: dividi el objetivo completo en secciones siguiendo este orden, sin saltarte el orden ni terminar en una fase que no sea Cierre:',
    '1. Preparacion: lo que hace falta ANTES de poder avanzar de verdad — conseguir recursos o herramientas, investigar lo minimo, sacar obstaculos del camino, definir el alcance.',
    '2. Construccion: el trabajo central del objetivo, hecho de forma incremental. Esta fase ocupa la mayor parte del plan — si es larga, dividila en varias secciones (ej. "Lo esencial", "Lo que falta").',
    '3. Refinamiento: revisar, corregir, pulir detalles. Si el objetivo es corto (unos pocos dias), fusionala con Construccion en vez de forzarla como seccion aparte.',
    '4. Cierre: el entregable final, el hito concreto que marca que se logro el objetivo. Siempre la ultima seccion, nunca se fusiona con otra.',
    'No todos los planes necesitan el mismo numero de secciones por fase — un objetivo de pocos dias puede resolverse en 2-3 secciones en total; uno largo puede necesitar varias dentro de Construccion. Lo que nunca cambia es el ORDEN de las 4 fases.',
    '',
    'Devuelve tituloPlan, descripcionPlan, y "secciones": titulo + resumen de una linea de CADA seccion del plan completo (sin dias ni bloques todavia).',
    'Devuelve tambien "primeraSeccionDias": el detalle completo de la PRIMERA seccion nada mas (siempre la fase de Preparacion), como lista de dias.',
    'Cada dia de "primeraSeccionDias" tiene bloques, cada uno con "momento", "mensajeContexto" (como encarar ese bloque, una o dos frases) e "items" (la cantidad que corresponde segun la disponibilidad de arriba).',
    'Cada item tiene "titulo" (la accion, concreta y verificable — algo de lo que el usuario pueda saber con certeza si lo hizo o no; "Instalar Node.js" sirve, "Investigar sobre desarrollo" no sirve, es demasiado vago) y "tipo".',
    '"tipo" es "simple" (un check) o "contador"/"cronometro" para el resto — AL MENOS 7 de cada 10 items en total tienen que ser "simple", nunca menos.',
    'Un item es "simple" si implica decidir, planificar, elegir, anotar, contactar, buscar, armar una lista o fijar algo — una accion que se hace UNA vez sin cantidad real, aunque esa decision mencione un numero (ej. "Elegir 3 dias para entrenar" sigue siendo "simple", no es "contar hasta 3"). Usa "contador" (una cantidad medible real, ej. "Correr 5 km") o "cronometro" (minutos reales dedicados a una actividad continua, ej. "Practicar 20 min") SOLO para una actividad fisica, repetida o continua que de verdad se mide mientras se hace — nunca para la decision de cuanto hacer de algo.',
    'Cuando el tipo no es "simple", agrega "metaValor" (el numero) y "unidad" (ej. "km", "paginas"; para cronometro siempre "min"), y el "titulo" NO repite el numero (va solo en metaValor/unidad, ej. titulo:"Correr", metaValor:5, unidad:"km").',
    'Nunca inventes una meta enorme o poco realista para metaValor — pensa en lo que alguien haria en UNA sola sesion de ese bloque, no en una meta semanal o mensual.',
    'Ejemplos de items: {"titulo":"Instalar Node.js","tipo":"simple"} — {"titulo":"Correr","tipo":"contador","metaValor":5,"unidad":"km"} — {"titulo":"Repasar el guion","tipo":"cronometro","metaValor":20,"unidad":"min"}.',
    'El ultimo bloque del ultimo dia de la seccion tiene que incluir, ademas de sus items normales, un item "simple" que invite a reflexionar sobre como fue esa seccion (ej. "Anotar que fue lo mas dificil de esta semana") — esa reflexion es el contexto real que se usa despues para detallar la proxima seccion, no la descartes.',
    'No repitas el mismo "momento" dos veces en el mismo dia.',
    'No detalles ninguna seccion aparte de la primera en "primeraSeccionDias" - las demas quedan solo con titulo y resumen en "secciones", se detallan despues.',
    'Se especifico y realista para el objetivo dado. No des consejo legal, medico o financiero como si fueras un profesional — si el objetivo lo roza, mantene las acciones generales y sugeri consultar a alguien calificado.',
    '',
    'EJEMPLO (objetivo: "Crear una app en 30 dias", 2 bloques por dia) — mismo tipo de forma y nivel de detalle que se espera, adapta el contenido real al objetivo que te dieron, no copies este tema:',
    JSON.stringify({
      tituloPlan: 'Crear una app',
      descripcionPlan: 'Pasar de la idea a una app publicada en 30 dias.',
      secciones: [
        { titulo: 'Preparacion', resumen: 'Definir que vas a construir, instalar las herramientas y dejar el entorno listo.' },
        { titulo: 'Construccion: lo esencial', resumen: 'Armar las pantallas y funciones principales, una por una.' },
        { titulo: 'Construccion: lo que falta', resumen: 'Sumar las funciones secundarias y conectar todo entre si.' },
        { titulo: 'Refinamiento', resumen: 'Corregir errores, pulir el diseno y probar la app de punta a punta.' },
        { titulo: 'Cierre', resumen: 'Preparar y publicar la app.' },
      ],
      primeraSeccionDias: [
        {
          bloques: [
            { momento: 'manana', mensajeContexto: 'Antes de escribir codigo, tene claro el problema que resuelve.', items: [{ titulo: 'Escribir en una frase que hace la app', tipo: 'simple' }, { titulo: 'Listar las 3 funciones mas importantes', tipo: 'simple' }, { titulo: 'Elegir el nombre de la app', tipo: 'simple' }] },
            { momento: 'tarde', mensajeContexto: 'No hace falta saber todo, solo elegir con que vas a empezar.', items: [{ titulo: 'Elegir el framework (ej. React Native)', tipo: 'simple' }, { titulo: 'Instalar el editor de codigo', tipo: 'simple' }] },
          ],
        },
        {
          bloques: [
            { momento: 'manana', mensajeContexto: 'Dejar todo instalado antes de escribir la primera linea real.', items: [{ titulo: 'Instalar Node.js', tipo: 'simple' }, { titulo: 'Instalar el framework elegido', tipo: 'simple' }, { titulo: 'Correr el proyecto de ejemplo', tipo: 'simple' }] },
            { momento: 'tarde', mensajeContexto: 'Un repo desde el dia 1 evita perder trabajo despues.', items: [{ titulo: 'Crear el repositorio en GitHub', tipo: 'simple' }, { titulo: 'Hacer el primer commit', tipo: 'simple' }] },
          ],
        },
        {
          bloques: [
            { momento: 'manana', mensajeContexto: 'Un boceto simple alcanza, no hace falta un diseno perfecto.', items: [{ titulo: 'Dibujar en papel o Figma la pantalla principal', tipo: 'simple' }, { titulo: 'Bocetar paletas de colores', tipo: 'contador', metaValor: 3, unidad: 'paletas' }] },
            { momento: 'tarde', mensajeContexto: 'Una estructura clara ahorra tiempo mas adelante.', items: [{ titulo: 'Crear las carpetas base del proyecto', tipo: 'simple' }, { titulo: 'Configurar la navegacion basica', tipo: 'simple' }] },
          ],
        },
        {
          bloques: [
            { momento: 'manana', mensajeContexto: 'El primer componente real de la app.', items: [{ titulo: 'Crear el componente de la pantalla principal', tipo: 'simple' }, { titulo: 'Mostrar el titulo de la app', tipo: 'simple' }] },
            { momento: 'tarde', mensajeContexto: 'Confirma que todo corre antes de pasar a construir.', items: [{ titulo: 'Correr la app en el simulador', tipo: 'simple' }, { titulo: 'Anotar que te costo mas de esta semana', tipo: 'simple' }] },
          ],
        },
      ],
    }),
  ].filter(Boolean).join('\n');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Metodo no permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !geminiKey) return responder(503, { codigo: 'servidor', mensaje: 'Aby no esta disponible todavia.' });

  const authorization = request.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para crear un plan.' });

  const solicitud = solicitudSchema.safeParse(await request.json().catch(() => null));
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'Contanos tu objetivo antes de generar el plan.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);

  // Reclamar una rama: resolver quien es, que le toca, y que todavia este
  // libre ANTES de gastar nada en Gemini — todo esto en texto plano, no un
  // insert, asi que no hace falta el lock anti-concurrencia para esta parte.
  let objetivoEfectivo = solicitud.data.objetivo ?? '';
  let contextoRama: string | undefined;
  // El plazo que de verdad corre: en la primera llamada es el que manda el
  // cliente; al detallar una rama ya reclamada, es lo que QUEDA del plazo
  // original del plan (no un plazo nuevo) — se calcula solo, sin pedirselo
  // de nuevo a quien reclama.
  let plazoDiasEfectivo = solicitud.data.plazoDias;
  if (solicitud.data.ramaId) {
    const ramaFila = await clienteServidor.from('planes_ramas').select('id, nombre, resumen, instancia_id, plan_id').eq('id', solicitud.data.ramaId).maybeSingle();
    if (ramaFila.error || !ramaFila.data) return responder(404, { codigo: 'no_encontrada', mensaje: 'No encontramos esa rama.' });
    if (ramaFila.data.instancia_id !== null) return responder(409, { codigo: 'conflicto', mensaje: 'Esta rama ya fue reclamada por alguien.' });

    // Ya NO se chequea "esta persona ya tiene otra rama de este plan" — desde
    // la migracion 75, una misma persona puede reclamar varias (ver nota de
    // Ramas arriba). Lo unico que de verdad importa es que ESTA rama
    // especifica siga libre, ya chequeado arriba.
    const instanciaFila = await clienteServidor.from('planes_instancias').select('id').eq('plan_id', ramaFila.data.plan_id).eq('usuario_id', user.id).maybeSingle();
    if (instanciaFila.error || !instanciaFila.data) return responder(403, { codigo: 'sin_acceso', mensaje: 'No formas parte de este plan.' });

    const planFila = await clienteServidor.from('planes_items').select('objetivo_original, titulo, fecha_objetivo').eq('id', ramaFila.data.plan_id).maybeSingle();
    if (planFila.error || !planFila.data) return responder(404, { codigo: 'no_encontrada', mensaje: 'No encontramos ese plan.' });

    objetivoEfectivo = planFila.data.objetivo_original ?? planFila.data.titulo;
    contextoRama = `${ramaFila.data.nombre}: ${ramaFila.data.resumen ?? ''}`;
    if (planFila.data.fecha_objetivo) {
      const diasRestantes = Math.ceil((new Date(`${planFila.data.fecha_objetivo}T00:00:00`).getTime() - Date.now()) / 86_400_000);
      if (diasRestantes > 0) plazoDiasEfectivo = diasRestantes;
    }
  }

  const acceso = await verificarAccesoAby(clienteServidor, user.id, solicitud.data.plataforma);
  if (!acceso.ok) return responder(acceso.codigo === 'horizon_inactivo' ? 402 : 429, { codigo: acceso.codigo, mensaje: acceso.mensaje });

  const bloqueo = await clienteServidor.from('aby_generation_locks').insert({ user_id: user.id });
  if (bloqueo.error) return responder(429, { codigo: 'limite', mensaje: 'Aby aun esta preparando algo para vos.' });

  let propuestaId: string | null = null;
  try {
    const borrador = await clienteServidor.from('planes_propuestas').insert({
      disponibilidad: solicitud.data.disponibilidad ?? null,
      modelo: 'gemini-flash-latest',
      objetivo: objetivoEfectivo,
      rama_id: solicitud.data.ramaId ?? null,
      tipo: solicitud.data.ramaId ? 'rama' : 'plan_inicial',
      usuario_id: user.id,
    }).select('id').single();
    if (borrador.error || !borrador.data) throw new Error('propuesta_no_creada');
    propuestaId = borrador.data.id;

    const abortador = new AbortController();
    const timeout = setTimeout(() => abortador.abort(), 20_000);
    let respuestaGemini: Response;
    try {
      respuestaGemini = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: instruccionGemini({
                cantidadRamas: solicitud.data.cantidadRamas,
                contexto: solicitud.data.contexto,
                contextoRama,
                disponibilidad: solicitud.data.disponibilidad,
                objetivo: objetivoEfectivo,
                plazoDias: plazoDiasEfectivo,
              }),
            }],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        method: 'POST',
        signal: abortador.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!respuestaGemini.ok) throw new Error('modelo_no_disponible');

    const jsonGemini = await respuestaGemini.json();
    const texto = jsonGemini.candidates?.[0]?.content?.parts?.[0]?.text;
    const plan = planInicialSchema.safeParse(JSON.parse(texto ?? 'null'));
    if (!plan.success) throw new Error('plan_invalido');

    const propuestaLista = await clienteServidor.from('planes_propuestas').update({ estado: 'lista', propuesta: plan.data }).eq('id', propuestaId).eq('usuario_id', user.id);
    if (propuestaLista.error) throw new Error('propuesta_no_guardada');

    await registrarUsoAby(clienteServidor, user.id);
    return responder(200, { propuesta: plan.data, propuestaId });
  } catch (error) {
    if (propuestaId) {
      const errorCodigo = error instanceof Error && error.message === 'plan_invalido' ? 'validacion' : 'modelo';
      await clienteServidor.from('planes_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('usuario_id', user.id);
    }
    return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo preparar tu plan. Intentalo de nuevo.' });
  } finally {
    await clienteServidor.from('aby_generation_locks').delete().eq('user_id', user.id);
  }
});
