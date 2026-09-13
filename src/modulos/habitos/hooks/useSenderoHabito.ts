import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Lock, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { NodoMapaSendero } from '../../senderos/datos/mapaEjercicio.mock';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { obtenerProgresoNivelHabito, registrarProgresoHabito } from '../habitos.servicio';

// Cada nodo ES un día real hacia el próximo nivel — no una lección falsa ni
// un nivel completo. "Acumulado, no se resetea" (migración 21): un día
// perdido no vuelve a bloquear los nodos ya cumplidos.
function construirNodosDias(diasCompletados: number, diasRequeridos: number): NodoMapaSendero[] {
  return Array.from({ length: diasRequeridos }, (_, indice) => {
    const dia = indice + 1;
    return {
      estado: dia <= diasCompletados ? 'completado' : dia === diasCompletados + 1 ? 'activo' : 'bloqueado',
      icono: dia <= diasCompletados ? Check : dia === diasCompletados + 1 ? Play : Lock,
      id: `dia-${dia}`,
      subtitulo: `Día ${dia} de ${diasRequeridos}`,
      titulo: `Día ${dia}`,
    };
  });
}

// Datos + mutación del sendero de UN hábito real, para montarse dentro de
// cualquier pantalla (hoy: la pestaña Senderos) sin acoplarse a su layout.
export function useSenderoHabito(id: string | undefined) {
  const cliente = useQueryClient();
  const [celebracion, setCelebracion] = useState<{ gemas: number; nivel: number } | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const consulta = useQuery({ enabled: Boolean(id), queryKey: ['habitos', 'progreso-nivel', id], queryFn: () => obtenerProgresoNivelHabito(id as string) });

  const registrar = useMutation({
    mutationFn: registrarProgresoHabito,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'progreso-nivel', id] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      if (resultado.subioNivel) { hapticSeguro('confirmacion'); setCelebracion({ gemas: resultado.gemasGanadas, nivel: resultado.nivel }); }
      else hapticSeguro('accion');
      setRegistrando(false);
    },
    onError: () => setRegistrando(false),
  });

  useEffect(() => {
    if (celebracion === null) return;
    const temporizador = setTimeout(() => setCelebracion(null), 2800);
    return () => clearTimeout(temporizador);
  }, [celebracion]);

  // Al cambiar de hábito seleccionado, cualquier registro/celebración en curso de otro hábito ya no aplica.
  useEffect(() => { setRegistrando(false); setCelebracion(null); }, [id]);

  const datos = consulta.data;
  const esNivelMaximo = datos ? datos.diasRequeridos === null : false;
  const nodos = datos && datos.diasRequeridos !== null ? construirNodosDias(datos.diasCompletados, datos.diasRequeridos) : [];

  return { celebracion, consulta, esNivelMaximo, nodos, registrando, registrar, setRegistrando };
}
