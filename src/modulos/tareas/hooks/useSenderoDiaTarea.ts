import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { calcularProgresoMaestria, DIAS_POR_MAPA } from '../../habitos/senderoNiveles';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { construirNodosDiasTarea } from '../construirNodosDiasTarea';
import { estaProgramadaEnFecha } from '../tareaProgramada';
import {
  obtenerFigurasTarea, obtenerRegistrosTareaDesde, obtenerTareaPorId, registrarProgresoTarea,
} from '../tareas.servicio';
import type { FiguraTareaNodo, FiguraTareaPendiente } from '../tareas.tipos';

/**
 * Datos + mutación del sendero de días de UNA tarea recurrente (Fase 8,
 * tipo simple/contador/cronometro + frecuencia='dias_semana'). Espejo
 * simplificado de useSenderoHabito.ts: a diferencia de Hábitos, acá no hay
 * tabla de planes versionada ni RPC de "resumen" — nivel/objetivo_valor
 * viven directo en la tarea, y "días completados en el nivel vigente" se
 * calcula del lado del cliente (mismo criterio ya aceptado para tareas en
 * la Fase 1). Tampoco hay cofre intermedio ni navegación a niveles
 * históricos: el sendero de una tarea siempre muestra su nivel ACTUAL.
 */
export function useSenderoDiaTarea(id: string | undefined) {
  const cliente = useQueryClient();
  const [celebracion, setCelebracion] = useState<{ gemas: number; nivel: number } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [figuraPendiente, setFiguraPendiente] = useState<FiguraTareaPendiente | null>(null);

  const consulta = useQuery({ enabled: Boolean(id), queryKey: ['tareas', 'tarea', id], queryFn: () => obtenerTareaPorId(id as string) });
  const tarea = consulta.data;

  const consultaRegistros = useQuery({
    enabled: Boolean(id && tarea),
    queryKey: ['tareas', 'registros-nivel', id, tarea?.nivelDesdeFecha],
    queryFn: () => obtenerRegistrosTareaDesde(id as string, tarea!.nivelDesdeFecha),
  });

  const consultaFiguras = useQuery({
    enabled: Boolean(id),
    queryKey: ['tareas', 'figuras', id],
    queryFn: () => obtenerFigurasTarea(id as string),
  });

  // Días (programados, con registro que cumple la meta) desde que empezó el
  // nivel vigente — mismo cálculo que tareas_contar_dias_completados_nivel.
  const { diasCompletadosNivel, fechasCompletadas } = useMemo(() => {
    const fechas = new Set<string>();
    if (!tarea) return { diasCompletadosNivel: 0, fechasCompletadas: fechas };
    for (const registro of consultaRegistros.data ?? []) {
      const cumpleMeta = tarea.tipo === 'simple' ? registro.valor > 0 : registro.valor >= tarea.objetivoValor;
      if (cumpleMeta && estaProgramadaEnFecha(tarea, registro.fechaLocal)) fechas.add(registro.fechaLocal);
    }
    return { diasCompletadosNivel: fechas.size, fechasCompletadas: fechas };
  }, [consultaRegistros.data, tarea]);

  const nivel = tarea?.nivel ?? 1;
  const diasRequeridosNivel = DIAS_POR_MAPA[Math.min(7, Math.max(1, nivel)) as keyof typeof DIAS_POR_MAPA];

  // Nivel 7 es maestría infinita en ciclos de 42 días — mismo cálculo que ya
  // usa Hábitos (calcularProgresoMaestria), reusado tal cual del lado cliente
  // porque acá no hay RPC de resumen que lo haga en el servidor.
  const { ciclo, diasCompletados, diasRequeridos } = useMemo(() => {
    if (nivel < 7) return { ciclo: 1, diasCompletados: diasCompletadosNivel, diasRequeridos: diasRequeridosNivel };
    const progreso = calcularProgresoMaestria(diasCompletadosNivel);
    return { ciclo: progreso.ciclo, diasCompletados: progreso.diasCompletados, diasRequeridos: progreso.diasRequeridos };
  }, [nivel, diasCompletadosNivel, diasRequeridosNivel]);

  const puedeAvanzarHoy = Boolean(tarea && estaProgramadaEnFecha(tarea, fechaLocalHoy()) && !fechasCompletadas.has(fechaLocalHoy()));

  // Figuras ya creadas de este nivel/ciclo, indexadas por día-en-nivel —
  // mismo filtro que mapaMandalasPorDia en useSenderoHabito.
  const mapaFigurasPorDia = useMemo(() => {
    const mapa = new Map<number, FiguraTareaNodo>();
    for (const figura of consultaFiguras.data ?? []) {
      if (figura.nivel === nivel && figura.ciclo === ciclo) mapa.set(figura.nodoDia, figura);
    }
    return mapa;
  }, [consultaFiguras.data, nivel, ciclo]);

  const nodos = tarea
    ? construirNodosDiasTarea(diasCompletados, diasRequeridos, nivel, { ciclo, puedeAvanzarHoy }, mapaFigurasPorDia)
    : [];

  const registrar = useMutation({
    mutationFn: registrarProgresoTarea,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['tareas', 'tarea', id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'registros-nivel', id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'figuras', id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'checklist'] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'subitems-resumen'] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      if (resultado.transicionSendero) { hapticSeguro('confirmacion'); setCelebracion({ gemas: resultado.transicionSendero.gemas, nivel: resultado.transicionSendero.nivelActual }); }
      else hapticSeguro('accion');
      if (resultado.figuraPendiente) setFiguraPendiente(resultado.figuraPendiente);
      setRegistrando(false);
    },
    onError: () => setRegistrando(false),
  });

  useEffect(() => {
    if (celebracion === null) return;
    const temporizador = setTimeout(() => setCelebracion(null), 2800);
    return () => clearTimeout(temporizador);
  }, [celebracion]);

  // Al cambiar de tarea seleccionada, cualquier registro/celebración en curso de otra tarea ya no aplica.
  useEffect(() => { setRegistrando(false); setCelebracion(null); setFiguraPendiente(null); }, [id]);

  return {
    celebracion,
    ciclo,
    consulta,
    consultaFiguras,
    consultaRegistros,
    diasCompletados,
    diasRequeridos,
    esNivelMaximo: nivel === 7,
    figuraPendiente,
    nivel,
    nodos,
    puedeAvanzarHoy,
    registrando,
    registrar,
    setFiguraPendiente,
    setRegistrando,
    tarea,
  };
}
