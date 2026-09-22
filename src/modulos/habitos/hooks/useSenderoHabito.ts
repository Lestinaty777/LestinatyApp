import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import {
  obtenerCofresReclamadosHabito,
  obtenerProgresoNivelHabito,
  obtenerResumenSenderoHabito,
  reclamarCofreSendero,
  registrarProgresoHabito,
} from '../habitos.servicio';
import { esMapaSoloLectura, resolverNivelSeleccionado } from './useSenderoHabito.modelo';

import { construirNodosDias } from '../construirNodosDias';
export { construirNodosDias };

// Datos + mutación del sendero de UN hábito real, para montarse dentro de
// cualquier pantalla (hoy: la pestaña Senderos) sin acoplarse a su layout.
//
// `consulta` sigue siendo la metadata del hábito (título, color, ícono, tipo
// de meta) — obtenerProgresoNivelHabito no cambió en la migración de Task 2.
// El progreso real por nivel/ciclo (nodos, cofres, si se puede avanzar hoy)
// ahora viene de `resumen` (las siete secciones de Senderos, RPC nueva) para
// no arrastrar el bug histórico de reiniciar días al cambiar de meta/frecuencia
// dentro de un mismo nivel.
export function useSenderoHabito(id: string | undefined, nivelSeleccionado?: number) {
  const cliente = useQueryClient();
  const [celebracion, setCelebracion] = useState<{ gemas: number; nivel: number } | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const consulta = useQuery({ enabled: Boolean(id), queryKey: ['habitos', 'progreso-nivel', id], queryFn: () => obtenerProgresoNivelHabito(id as string) });

  const consultaResumen = useQuery({
    enabled: Boolean(id),
    queryKey: ['habitos', 'sendero-resumen', id],
    queryFn: () => obtenerResumenSenderoHabito(id as string),
  });

  const resumen = consultaResumen.data;
  const nivelActual = resumen?.nivelActual ?? 1;
  const nivelesDesbloqueados = useMemo(
    () => resumen?.secciones.filter((seccion) => seccion.estado !== 'bloqueado').map((seccion) => seccion.nivel) ?? [],
    [resumen],
  );
  const nivelVisible = resolverNivelSeleccionado(nivelSeleccionado, nivelActual, nivelesDesbloqueados);
  const seccionVisible = resumen?.secciones.find((seccion) => seccion.nivel === nivelVisible);
  const ciclo = seccionVisible?.ciclo ?? 1;
  const soloLectura = esMapaSoloLectura(nivelVisible, nivelActual);

  const consultaCofres = useQuery({
    enabled: Boolean(id && seccionVisible),
    queryKey: ['habitos', 'cofres', id, nivelVisible, ciclo],
    queryFn: () => obtenerCofresReclamadosHabito(id as string, nivelVisible, ciclo),
  });

  const mapaCofresReclamados = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const c of consultaCofres.data ?? []) {
      mapa.set(c.nodoDia, c.gemas);
    }
    return mapa;
  }, [consultaCofres.data]);

  const registrar = useMutation({
    mutationFn: registrarProgresoHabito,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'progreso-nivel', id] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'sendero-resumen', id] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cofres', id, nivelVisible, ciclo] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      if (resultado.transicionSendero) { hapticSeguro('confirmacion'); setCelebracion({ gemas: resultado.transicionSendero.gemas, nivel: resultado.transicionSendero.nivelActual }); }
      else hapticSeguro('accion');
      setRegistrando(false);
    },
    onError: () => setRegistrando(false),
  });

  const reclamarCofre = useMutation({
    mutationFn: reclamarCofreSendero,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'sendero-resumen', id] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cofres', id, nivelVisible, ciclo] });
      if (resultado.gemas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      hapticSeguro('confirmacion');
    },
  });

  useEffect(() => {
    if (celebracion === null) return;
    const temporizador = setTimeout(() => setCelebracion(null), 2800);
    return () => clearTimeout(temporizador);
  }, [celebracion]);

  // Al cambiar de hábito seleccionado, cualquier registro/celebración en curso de otro hábito ya no aplica.
  useEffect(() => { setRegistrando(false); setCelebracion(null); }, [id]);

  const nodos = seccionVisible
    ? construirNodosDias(seccionVisible.diasCompletados, seccionVisible.diasRequeridos, seccionVisible.nivel, mapaCofresReclamados, {
      ciclo, puedeAvanzarHoy: seccionVisible.puedeAvanzarHoy, soloLectura,
    })
    : [];

  return {
    celebracion,
    ciclo,
    consulta,
    consultaCofres,
    consultaResumen,
    // Ya no hay "nivel máximo" en el sentido de tope: nivel 7 es maestría
    // infinita en ciclos. Se conserva el nombre por compatibilidad con
    // consumidores existentes; ahora solo indica que el nivel visible es 7.
    esNivelMaximo: nivelVisible === 7,
    nivelActual,
    nivelesDesbloqueados,
    nivelVisible,
    nodos,
    reclamarCofre,
    registrando,
    registrar,
    resumen,
    seccionVisible,
    setRegistrando,
    soloLectura,
  };
}
