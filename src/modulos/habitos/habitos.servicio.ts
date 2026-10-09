import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { registrarEvento } from '../../servicios/analitica/posthog';
import { fechaLocalDe, fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { colorSeguroUi } from '../senderos/algoritmo/colorHsl';
import { mapearPanelHabitos } from './habitos.mapper';
import { DIAS_REQUERIDOS_POR_NIVEL } from './iconosHabitos';
import { PAQUETE_HABITO_PREDETERMINADO, resolverPaqueteHabito } from './paqueteHabito';
import { resumirHabitosActivos } from './resumenHabitosActivos';
import { mapearTransicionSendero } from './senderoHabito.mapper';
import { mapearMandalaPendiente } from './mandalaNodo.mapper';
import { programarSincronizacionEtiquetas, reportarRegistroANotificaciones } from './reporteNotificaciones';
import { calcularDetalleHabitoHoy, type HabitoHoyDetalle } from './semanaProgramada';
import type { EdicionHabito } from './gestionDetalleHabito';
import { DetalleHabito, HabitoResumen, MejorRachaHabito, PanelHabitos, PlanHabitoResumen, ProximoNivelHabito, ResultadoRegistroHabito, TipoMetaHabito } from './tipos';
import { ESCALA_ESMERALDA } from '../../diseno/tema/escalaEsmeralda';
import type { FranjaDia } from '../../compartido/utilidades/franjas';

export async function obtenerPanelHabitos(fecha?: string): Promise<PanelHabitos> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_panel_habitos', { p_fecha_referencia: fecha ?? null });
  if (error) throw error;
  return mapearPanelHabitos(data as Parameters<typeof mapearPanelHabitos>[0]);
}

export async function obtenerHabitosActivos(referencia = new Date()): Promise<HabitoResumen[]> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocalDe(referencia);
  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,paquete_id,arboles_paquetes(master_pack_color)').eq('estado', 'activo').order('created_at'),
    supabase.from('habitos_planes').select('habito_id,frecuencia,dias_semana,objetivo_valor,desde_fecha,hasta_fecha').order('desde_fecha', { ascending: false }),
    supabase.from('habitos_registros').select('habito_id,fecha_local,valor').eq('fecha_local', hoy),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  if (errorRegistros) throw errorRegistros;
  return resumirHabitosActivos({
    fecha: hoy,
    items: (items ?? []) as Parameters<typeof resumirHabitosActivos>[0]['items'],
    planes: (planes ?? []) as Parameters<typeof resumirHabitosActivos>[0]['planes'],
    registros: (registros ?? []) as Parameters<typeof resumirHabitosActivos>[0]['registros'],
  });
}

export async function establecerFranjaHabito(habitoId: string, franja: FranjaDia): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('establecer_franja_habito', { p_habito_id: habitoId, p_franja: franja });
  if (error) throw error;
}

export async function actualizarHabitoDesdeDetalle(habitoId: string, edicion: EdicionHabito): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('actualizar_habito_desde_detalle', {
    p_habito_id: habitoId, p_titulo: edicion.titulo.trim(), p_descripcion: edicion.descripcion,
    p_icono_lucide: edicion.iconoLucide, p_tipo_meta: edicion.tipoMeta,
    p_unidad: edicion.tipoMeta === 'check' ? null : edicion.unidad.trim(),
    p_frecuencia: edicion.frecuencia, p_dias_semana: edicion.frecuencia === 'dias_semana' ? edicion.diasSemana : null,
    p_veces_por_semana: edicion.frecuencia === 'veces_semana' ? edicion.vecesPorSemana : null,
    p_objetivo_valor: edicion.meta, p_recordatorio_activo: edicion.recordatorioActivo,
    p_hora_recordatorio: edicion.recordatorioActivo ? edicion.horaRecordatorio : null,
    p_mostrar_nombre_notificacion: edicion.mostrarNombreNotificacion,
    p_desde_fecha: fechaLocalHoy(),
  });
  if (error) throw error;
  await establecerFranjaHabito(habitoId, edicion.franja);
}

export async function archivarHabito(habitoId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('archivar_habito', { p_habito_id: habitoId });
  if (error) throw error;
  programarSincronizacionEtiquetas();
}

type ResultadoRegistroRemoto = { id: string; habito_id: string; fecha_local: string; valor: number; nota: string | null; subio_nivel: boolean; nivel: number; gemas_ganadas: number; transicion_sendero: unknown; mandala_pendiente: unknown };

export async function registrarProgresoHabito(input: { habitoId: string; fechaLocal: string; valor: number; nota?: string | null }): Promise<ResultadoRegistroHabito> {
  const { data, error } = await obtenerClienteSupabase().rpc('registrar_progreso_habito', {
    p_habito_id: input.habitoId, p_fecha_local: input.fechaLocal, p_valor: input.valor, p_nota: input.nota ?? null,
  });
  if (error) throw error;
  const remoto = data as ResultadoRegistroRemoto;
  const resultado: ResultadoRegistroHabito = {
    fechaLocal: remoto.fecha_local,
    gemasGanadas: Number(remoto.gemas_ganadas ?? 0),
    habitoId: remoto.habito_id,
    id: remoto.id,
    mandalaPendiente: mapearMandalaPendiente(remoto.mandala_pendiente),
    nivel: Number(remoto.nivel),
    nota: remoto.nota,
    subioNivel: remoto.subio_nivel,
    transicionSendero: mapearTransicionSendero(remoto.transicion_sendero),
    valor: Number(remoto.valor),
  };
  // Todas las vías de registro pasan por aquí (misión, mapa, widgets,
  // cronómetro): un solo punto para reportar outcomes y etiquetas.
  reportarRegistroANotificaciones(resultado);
  // Único punto por el que pasan todas las vías de registro; deshacer (valor 0) no cuenta.
  if (resultado.valor > 0) registrarEvento('habito_completado', { subio_nivel: resultado.subioNivel });
  return resultado;
}

export type CrearHabitoInput = { titulo: string; descripcion?: string; meta: number; unidad: string; tipoMeta?: TipoMetaHabito; iconoLucide?: string; color?: string; frecuencia?: 'diaria' | 'dias_semana' | 'veces_semana'; diasSemana?: number[] | null; vecesPorSemana?: number | null; categoria?: string; dificultad?: 'minimo' | 'estandar' | 'reto'; disparador?: string; recompensa?: string; recordatorioActivo?: boolean; horaRecordatorio?: string | null; mostrarNombreNotificacion?: boolean; nivelInicial?: number; paqueteId?: string; franja?: FranjaDia };

export async function crearHabito(input: CrearHabitoInput): Promise<{ id: string; plan_id: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('crear_habito_premium', {
    p_titulo: input.titulo.trim(), p_descripcion: input.descripcion ?? null, p_icono_lucide: input.iconoLucide ?? 'Sparkles', p_color: input.color ?? ESCALA_ESMERALDA.jade.l70, p_tipo_meta: input.tipoMeta ?? 'cantidad', p_unidad: input.unidad.trim(), p_categoria: input.categoria ?? null, p_dificultad: input.dificultad ?? 'estandar', p_disparador: input.disparador ?? null, p_recompensa: input.recompensa ?? null,
    p_frecuencia: input.frecuencia ?? 'diaria', p_dias_semana: input.diasSemana ?? null, p_veces_por_semana: input.vecesPorSemana ?? null, p_objetivo_valor: input.meta, p_recordatorio_activo: input.recordatorioActivo ?? false, p_hora_recordatorio: input.horaRecordatorio ?? null, p_mostrar_nombre_notificacion: input.mostrarNombreNotificacion ?? false, p_desde_fecha: fechaLocalHoy(), p_nivel_inicial: input.nivelInicial ?? 1, p_paquete_id: resolverPaqueteHabito(input.paqueteId ?? PAQUETE_HABITO_PREDETERMINADO),
  });
  if (error) throw error;
  const res = data as { id: string; plan_id: string };
  if (input.franja && input.franja !== 'cualquier_momento') {
    try {
      await establecerFranjaHabito(res.id, input.franja);
    } catch {
      /* la franja es solo presentación: el hábito ya existe */
    }
  }
  // habitos_activos deja de ser 0: sale del journey de bienvenida al momento.
  programarSincronizacionEtiquetas();
  return res;
}

type FilaPlan = { frecuencia: 'diaria' | 'dias_semana' | 'veces_semana'; dias_semana: number[] | null; veces_por_semana?: number | null; objetivo_valor: number; desde_fecha: string; hasta_fecha: string | null; nivel: number; recordatorio_activo?: boolean; hora_recordatorio?: string | null; mostrar_nombre_notificacion?: boolean; franja?: FranjaDia };
type FilaRegistro = { fecha_local: string; valor: number };

const etiquetasDias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fechaLocal = fechaLocalDe;
const planParaFecha = (planes: FilaPlan[], fecha: string) => planes.find((plan) => plan.desde_fecha <= fecha && (!plan.hasta_fecha || plan.hasta_fecha > fecha));
const programado = (plan: FilaPlan | undefined, fecha: string) => !plan ? false : plan.frecuencia !== 'dias_semana' || Boolean(plan.dias_semana?.includes(((new Date(`${fecha}T12:00:00`).getDay() + 6) % 7) + 1));
const completo = (tipo: TipoMetaHabito, valor: number, meta: number) => tipo === 'check' ? valor > 0 : valor >= meta;

export async function obtenerDetalleHabito(id: string, referencia = new Date()): Promise<DetalleHabito> {
  const supabase = obtenerClienteSupabase();
  const [{ data: item, error: errorItem }, { data: planes, error: errorPlanes }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,descripcion,icono_lucide,color,tipo_meta,unidad,paquete_id').eq('id', id).eq('estado', 'activo').single(),
    supabase.from('habitos_planes').select('frecuencia,dias_semana,veces_por_semana,objetivo_valor,desde_fecha,hasta_fecha,nivel,recordatorio_activo,hora_recordatorio,mostrar_nombre_notificacion,franja').eq('habito_id', id).order('desde_fecha', { ascending: false }),
    supabase.from('habitos_registros').select('fecha_local,valor').eq('habito_id', id).order('fecha_local', { ascending: true }),
  ]);
  if (errorItem || !item) throw errorItem ?? new Error('Hábito no encontrado.');
  if (errorPlanes) throw errorPlanes;
  if (errorRegistros) throw errorRegistros;
  const todosPlanes = (planes ?? []) as FilaPlan[];
  const todosRegistros = (registros ?? []) as FilaRegistro[];
  const porFecha = new Map(todosRegistros.map((registro) => [registro.fecha_local, Number(registro.valor)]));
  const hoy = fechaLocal(referencia);
  const planHoy = planParaFecha(todosPlanes, hoy);
  if (!planHoy) throw new Error('Este hábito no tiene un plan activo.');
  const tipo = item.tipo_meta as TipoMetaHabito;
  const dias = Array.from({ length: 7 }, (_, indice) => { const fecha = new Date(referencia); fecha.setDate(fecha.getDate() - (6 - indice)); return fecha; });
  const progresoSemana = dias.map((fecha) => { const local = fechaLocal(fecha); const plan = planParaFecha(todosPlanes, local); const meta = Number(plan?.objetivo_valor ?? planHoy.objetivo_valor); const valor = porFecha.get(local) ?? 0; return { fecha: local, etiqueta: etiquetasDias[fecha.getDay()], meta, progreso: programado(plan, local) ? Math.min(100, Math.round(valor * 100 / meta)) : 0, valor }; });
  const programados = progresoSemana.filter((dia) => programado(planParaFecha(todosPlanes, dia.fecha), dia.fecha));
  const completados = programados.filter((dia) => completo(tipo, dia.valor, dia.meta)).length;
  let rachaActual = 0;
  for (let indice = 0; indice < 365; indice += 1) { const fecha = new Date(referencia); fecha.setDate(fecha.getDate() - indice); const local = fechaLocal(fecha); const plan = planParaFecha(todosPlanes, local); if (!programado(plan, local)) continue; const meta = Number(plan?.objetivo_valor ?? planHoy.objetivo_valor); if (!completo(tipo, porFecha.get(local) ?? 0, meta)) break; rachaActual += 1; }
  const porDia = new Map<number, { suma: number; cantidad: number }>();
  todosRegistros.forEach((registro) => { const dia = new Date(`${registro.fecha_local}T12:00:00`).getDay(); const actual = porDia.get(dia) ?? { suma: 0, cantidad: 0 }; actual.suma += Number(registro.valor); actual.cantidad += 1; porDia.set(dia, actual); });
  const mejor = [...porDia.entries()].sort((a, b) => b[1].suma / b[1].cantidad - a[1].suma / a[1].cantidad)[0];
  return { habito: { id: item.id, titulo: item.titulo, descripcion: item.descripcion, iconoLucide: item.icono_lucide, color: item.color, tipoMeta: tipo, unidad: item.unidad, meta: Number(planHoy.objetivo_valor), valorHoy: porFecha.get(hoy) ?? 0, completado: completo(tipo, porFecha.get(hoy) ?? 0, Number(planHoy.objetivo_valor)), paqueteId: resolverPaqueteHabito(item.paquete_id) }, nivel: Number(planHoy.nivel ?? 1), semana: { completados, programados: programados.length, porcentaje: programados.length ? Math.round(completados * 100 / programados.length) : 0 }, rachaActual, totalAcumulado: todosRegistros.reduce((total, registro) => total + Number(registro.valor), 0), mejorDia: mejor ? nombresDias[mejor[0]] : null, progresoSemana, programacion: { frecuencia: planHoy.frecuencia, diasSemana: planHoy.dias_semana ?? [], vecesPorSemana: planHoy.veces_por_semana ?? null, recordatorioActivo: Boolean(planHoy.recordatorio_activo), horaRecordatorio: planHoy.hora_recordatorio ?? null, mostrarNombreNotificacion: Boolean(planHoy.mostrar_nombre_notificacion), franja: planHoy.franja ?? 'cualquier_momento' } };
}

export type ProgresoNivelHabito = { diasCompletados: number; diasRequeridos: number | null; fechasCumplidas: string[]; habito: { color: string; colorPaquete?: string; iconoLucide: string; meta: number; paqueteId: string; tipoMeta: TipoMetaHabito; titulo: string; unidad: string | null; valorHoy: number }; nivel: number };

// Días cumplidos ACUMULADOS (no consecutivos, no se resetea) desde que
// empezó el plan vigente — misma cuenta que usa privacidad.registrar_progreso_habito()
// (migración 21) para decidir la subida real. Alimenta el sendero por hábito.
export async function obtenerProgresoNivelHabito(id: string, referencia = new Date()): Promise<ProgresoNivelHabito> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocal(referencia);
  const [{ data: item, error: errorItem }, { data: planes, error: errorPlanes }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,icono_lucide,color,tipo_meta,unidad,paquete_id,arboles_paquetes(master_pack_color)').eq('id', id).eq('estado', 'activo').single(),
    supabase.from('habitos_planes').select('frecuencia,dias_semana,objetivo_valor,desde_fecha,hasta_fecha,nivel').eq('habito_id', id).order('desde_fecha', { ascending: false }),
  ]);
  if (errorItem || !item) throw errorItem ?? new Error('Hábito no encontrado.');
  if (errorPlanes) throw errorPlanes;
  const todosPlanes = (planes ?? []) as FilaPlan[];
  const planVigente = planParaFecha(todosPlanes, hoy);
  if (!planVigente) throw new Error('Este hábito no tiene un plan activo.');
  const tipo = item.tipo_meta as TipoMetaHabito;
  const nivel = Number(planVigente.nivel ?? 1);
  const diasRequeridos = DIAS_REQUERIDOS_POR_NIVEL[nivel + 1] ?? null;

  const { data: registros, error: errorRegistros } = await supabase
    .from('habitos_registros')
    .select('fecha_local,valor')
    .eq('habito_id', id)
    .gte('fecha_local', planVigente.desde_fecha)
    .lte('fecha_local', hoy);
  if (errorRegistros) throw errorRegistros;
  const todosRegistros = (registros ?? []) as FilaRegistro[];

  const fechasCumplidas = todosRegistros
    .filter((registro) => programado(planVigente, registro.fecha_local) && completo(tipo, Number(registro.valor), Number(planVigente.objetivo_valor)))
    .map((registro) => registro.fecha_local)
    .sort();
  const valorHoy = todosRegistros.find((registro) => registro.fecha_local === hoy)?.valor ?? 0;

  // El color efectivo del hábito ya no es libre: viene del MasterPackColor del
  // paquete asignado (clampeado a un rango de luminosidad seguro para que un
  // paquete con un tono muy claro/oscuro no rompa el contraste de la UI). Si
  // por lo que sea el paquete no tiene master_pack_color (no debería pasar,
  // todos los paquetes lo exigen), cae al color guardado en el hábito.
  const paqueteInfo = item.arboles_paquetes as { master_pack_color: string } | { master_pack_color: string }[] | null;
  const masterPackColor = Array.isArray(paqueteInfo) ? paqueteInfo[0]?.master_pack_color : paqueteInfo?.master_pack_color;
  const colorEfectivo = colorSeguroUi(masterPackColor ?? item.color);

  return {
    diasCompletados: fechasCumplidas.length,
    diasRequeridos,
    fechasCumplidas,
    habito: { color: colorEfectivo, colorPaquete: masterPackColor, iconoLucide: item.icono_lucide, meta: Number(planVigente.objetivo_valor), paqueteId: resolverPaqueteHabito(item.paquete_id), tipoMeta: tipo, titulo: item.titulo, unidad: item.unidad, valorHoy: Number(valorHoy) },
    nivel,
  };
}

type FilaPlanVentana = { habito_id: string; nivel: number; objetivo_valor: number; frecuencia: 'diaria' | 'dias_semana' | 'veces_semana'; dias_semana: number[] | null; desde_fecha: string; hasta_fecha: string | null };

// Mismo cálculo de días acumulados que usa privacidad.registrar_progreso_habito()
// (migración 21) y obtenerProgresoNivelHabito, pero de solo lectura y sobre
// TODOS los hábitos: cuál está más cerca de subir de nivel, para destacarlo en
// HabitosPantalla. Un hábito en nivel máximo (sin próximo nivel) no compite.
export async function obtenerHabitoMasCercaDeNivel(referencia = new Date()): Promise<ProximoNivelHabito | null> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocal(referencia);

  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,icono_lucide,color,tipo_meta').eq('estado', 'activo'),
    supabase.from('habitos_planes').select('habito_id,nivel,objetivo_valor,frecuencia,dias_semana,desde_fecha,hasta_fecha').order('desde_fecha', { ascending: false }),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  const todosItems = (items ?? []) as { id: string; titulo: string; icono_lucide: string; color: string; tipo_meta: TipoMetaHabito }[];
  const todosPlanes = (planes ?? []) as FilaPlanVentana[];

  const elegibles = todosItems.flatMap((item) => {
    const planesItem = todosPlanes.filter((fila) => fila.habito_id === item.id);
    const plan = planParaFecha(planesItem, hoy);
    const diasRequeridos = plan ? DIAS_REQUERIDOS_POR_NIVEL[plan.nivel + 1] ?? null : null;
    if (!plan || diasRequeridos === null) return [];
    return [{ diasRequeridos, item, plan }];
  });
  if (elegibles.length === 0) return null;

  const desdeMasAntiguo = elegibles.reduce((minimo, { plan }) => (plan.desde_fecha < minimo ? plan.desde_fecha : minimo), hoy);
  const { data: registros, error: errorRegistros } = await supabase
    .from('habitos_registros')
    .select('habito_id,fecha_local,valor')
    .in('habito_id', elegibles.map(({ item }) => item.id))
    .gte('fecha_local', desdeMasAntiguo)
    .lte('fecha_local', hoy);
  if (errorRegistros) throw errorRegistros;
  const todosRegistros = (registros ?? []) as { habito_id: string; fecha_local: string; valor: number }[];

  let mejor: ProximoNivelHabito | null = null;
  let mejorPorcentaje = -1;

  for (const { diasRequeridos, item, plan } of elegibles) {
    const diasCompletados = todosRegistros.filter((registro) =>
      registro.habito_id === item.id
      && registro.fecha_local >= plan.desde_fecha
      && programado(plan, registro.fecha_local)
      && completo(item.tipo_meta, Number(registro.valor), plan.objetivo_valor),
    ).length;
    const porcentaje = Math.min(100, Math.round((diasCompletados * 100) / diasRequeridos));
    if (porcentaje > mejorPorcentaje) {
      mejorPorcentaje = porcentaje;
      mejor = { color: item.color, diasCompletados, diasRequeridos, iconoLucide: item.icono_lucide, id: item.id, nivel: plan.nivel, porcentaje, titulo: item.titulo };
    }
  }
  return mejor;
}

const VENTANA_RACHA_DIAS = 130;

// Una racha real solo existe por hábito — no hay una lectura honesta de
// "racha" agregada entre hábitos distintos. Esto recorre cada hábito activo
// con la misma lógica de racha que ya usa obtenerDetalleHabito y destaca el
// que tiene la racha más larga en este momento, para el hero de HabitosPantalla.
export async function obtenerHabitoMejorRacha(referencia = new Date()): Promise<MejorRachaHabito | null> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocal(referencia);
  const desde = fechaLocal(new Date(referencia.getTime() - VENTANA_RACHA_DIAS * 86400000));

  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,icono_lucide,color,tipo_meta').eq('estado', 'activo'),
    supabase.from('habitos_planes').select('habito_id,frecuencia,dias_semana,objetivo_valor,desde_fecha,hasta_fecha,nivel').order('desde_fecha', { ascending: false }),
    supabase.from('habitos_registros').select('habito_id,fecha_local,valor').gte('fecha_local', desde).lte('fecha_local', hoy),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  if (errorRegistros) throw errorRegistros;

  const todosItems = (items ?? []) as { id: string; titulo: string; icono_lucide: string; color: string; tipo_meta: TipoMetaHabito }[];
  const todosPlanes = (planes ?? []) as (FilaPlan & { habito_id: string })[];
  const todosRegistros = (registros ?? []) as { habito_id: string; fecha_local: string; valor: number }[];

  let mejor: MejorRachaHabito | null = null;
  let mejorRacha = 0;

  for (const item of todosItems) {
    const planesItem = todosPlanes.filter((plan) => plan.habito_id === item.id);
    const registrosItem = new Map(todosRegistros.filter((registro) => registro.habito_id === item.id).map((registro) => [registro.fecha_local, Number(registro.valor)]));
    let racha = 0;
    for (let indice = 0; indice < VENTANA_RACHA_DIAS; indice += 1) {
      const fecha = new Date(referencia);
      fecha.setDate(fecha.getDate() - indice);
      const local = fechaLocal(fecha);
      const plan = planParaFecha(planesItem, local);
      if (!programado(plan, local)) continue;
      const meta = Number(plan?.objetivo_valor ?? 0);
      if (!completo(item.tipo_meta, registrosItem.get(local) ?? 0, meta)) break;
      racha += 1;
    }
    if (racha > mejorRacha) {
      mejorRacha = racha;
      const historial28: boolean[] = [];
      for (let indice = 27; indice >= 0; indice -= 1) {
        const fecha = new Date(referencia);
        fecha.setDate(fecha.getDate() - indice);
        const local = fechaLocal(fecha);
        const plan = planParaFecha(planesItem, local);
        const meta = Number(plan?.objetivo_valor ?? 0);
        historial28.push(programado(plan, local) && completo(item.tipo_meta, registrosItem.get(local) ?? 0, meta));
      }
      mejor = { color: item.color, historial28, iconoLucide: item.icono_lucide, id: item.id, racha, titulo: item.titulo };
    }
  }

  return mejor;
}

export type { HabitoHoyDetalle } from './semanaProgramada';

// Nivel, racha real y qué días de ESTA semana calendario (lunes=1..domingo=7)
// ya se cumplieron, por cada hábito activo — alimenta la tarjeta rica de
// HabitosPantalla (TarjetaSenderoHabito) en la sección "Hoy". Reusa la misma
// lógica de racha/programado que obtenerHabitoMejorRacha, ahora por hábito.
export async function obtenerDetallesHabitosHoy(referencia = new Date()): Promise<HabitoHoyDetalle[]> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocal(referencia);
  const desdeRacha = fechaLocal(new Date(referencia.getTime() - VENTANA_RACHA_DIAS * 86400000));

  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('habitos_items').select('id,tipo_meta,meta_id').eq('estado', 'activo'),
    supabase.from('habitos_planes').select('habito_id,nivel,frecuencia,dias_semana,objetivo_valor,desde_fecha,hasta_fecha,franja').order('desde_fecha', { ascending: false }),
    supabase.from('habitos_registros').select('habito_id,fecha_local,valor').gte('fecha_local', desdeRacha).lte('fecha_local', hoy),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  if (errorRegistros) throw errorRegistros;

  const todosItems = (items ?? []) as { id: string; tipo_meta: TipoMetaHabito; meta_id: string | null }[];
  const todosPlanes = (planes ?? []) as (FilaPlan & { habito_id: string })[];
  const todosRegistros = (registros ?? []) as { habito_id: string; fecha_local: string; valor: number }[];

  return todosItems.map((item) => {
    const planesItem = todosPlanes.filter((plan) => plan.habito_id === item.id);
    const registrosItem = new Map(todosRegistros.filter((registro) => registro.habito_id === item.id).map((registro) => [registro.fecha_local, Number(registro.valor)]));
    return calcularDetalleHabitoHoy({
      habitoId: item.id,
      metaId: item.meta_id,
      planes: planesItem,
      referencia,
      registrosPorFecha: registrosItem,
      tipoMeta: item.tipo_meta,
    });
  });
}

export type ResumenMesHabitos = { anio: number; mes: number; diasCompletados: number[] };

// Vista de calendario mensual (widget de calendario): qué días del mes (1..31)
// tuvieron al menos un hábito completado, combinando TODOS los hábitos activos
// — no hay selección de hábito específico, es un heatmap agregado del mes.
export async function obtenerDiasCompletadosMes(referencia = new Date()): Promise<ResumenMesHabitos> {
  const supabase = obtenerClienteSupabase();
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('habitos_items').select('id,tipo_meta').eq('estado', 'activo'),
    supabase.from('habitos_planes').select('habito_id,frecuencia,dias_semana,objetivo_valor,desde_fecha,hasta_fecha').order('desde_fecha', { ascending: false }),
    supabase.from('habitos_registros').select('habito_id,fecha_local,valor').gte('fecha_local', desde).lte('fecha_local', hasta),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  if (errorRegistros) throw errorRegistros;

  const todosItems = (items ?? []) as { id: string; tipo_meta: TipoMetaHabito }[];
  const todosPlanes = (planes ?? []) as (FilaPlan & { habito_id: string })[];
  const todosRegistros = (registros ?? []) as { habito_id: string; fecha_local: string; valor: number }[];

  const diasCompletados = new Set<number>();
  for (const registro of todosRegistros) {
    const item = todosItems.find((fila) => fila.id === registro.habito_id);
    if (!item) continue;
    const planesItem = todosPlanes.filter((plan) => plan.habito_id === registro.habito_id);
    const plan = planParaFecha(planesItem, registro.fecha_local);
    if (!programado(plan, registro.fecha_local)) continue;
    const meta = Number(plan?.objetivo_valor ?? 0);
    if (completo(item.tipo_meta, Number(registro.valor), meta)) {
      diasCompletados.add(Number(registro.fecha_local.slice(8, 10)));
    }
  }

  return { anio, mes, diasCompletados: [...diasCompletados].sort((a, b) => a - b) };
}

type FilaItemActivo = { id: string; titulo: string; icono_lucide: string; color: string };
type FilaPlanResumen = { habito_id: string; nivel: number; recordatorio_activo: boolean; hora_recordatorio: string | null; desde_fecha: string; hasta_fecha: string | null };

// Alimenta las tarjetas de Progresión y Recordatorios: un solo par de consultas
// (ítems activos + todos sus planes) del que cada pantalla toma lo que necesita.
export async function obtenerResumenPlanesHabitos(referencia = new Date()): Promise<PlanHabitoResumen[]> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocal(referencia);
  const [{ data: items, error: errorItems }, { data: planes, error: errorPlanes }] = await Promise.all([
    supabase.from('habitos_items').select('id,titulo,icono_lucide,color').eq('estado', 'activo').order('created_at'),
    supabase.from('habitos_planes').select('habito_id,nivel,recordatorio_activo,hora_recordatorio,desde_fecha,hasta_fecha').order('desde_fecha', { ascending: false }),
  ]);
  if (errorItems) throw errorItems;
  if (errorPlanes) throw errorPlanes;
  const todosItems = (items ?? []) as FilaItemActivo[];
  const todosPlanes = (planes ?? []) as FilaPlanResumen[];
  return todosItems.map((item) => {
    const vigente = todosPlanes.find((plan) => plan.habito_id === item.id && plan.desde_fecha <= hoy && (!plan.hasta_fecha || plan.hasta_fecha > hoy));
    return {
      color: item.color,
      horaRecordatorio: vigente?.hora_recordatorio ?? null,
      id: item.id,
      iconoLucide: item.icono_lucide,
      nivel: Number(vigente?.nivel ?? 1),
      recordatorioActivo: Boolean(vigente?.recordatorio_activo),
      titulo: item.titulo,
    };
  });
}

// Los cofres de Senderos (y el resumen de las siete secciones) viven ahora en
// senderoHabito.servicio.ts — se reexportan acá para no romper imports
// existentes mientras Task 5 actualiza sus consumidores al contrato con ciclo.
export type { CofreReclamadoItem } from './senderoHabito.servicio';
export { obtenerCofresReclamadosHabito, obtenerResumenSenderoHabito, reclamarCofreSendero } from './senderoHabito.servicio';
