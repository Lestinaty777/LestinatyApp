import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Lock, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { NodoMapaSendero } from '../../senderos/datos/mapaEjercicio.mock';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { diasAcumuladosAntesDeNivel } from '../iconosHabitos';
import { obtenerProgresoNivelHabito, registrarProgresoHabito } from '../habitos.servicio';

// Cada nodo ES un día real hacia el próximo nivel — no una lección falsa ni
// un nivel completo. "Acumulado, no se resetea" (migración 21): un día
// perdido no vuelve a bloquear los nodos ya cumplidos.
// La numeración del título es continua entre niveles (Día 1..3 en nivel 1,
// Día 4..10 en nivel 2, ...) — diaInicial trae el total ya acumulado en
// niveles previos, así el primer nodo del nivel nuevo sigue el conteo.
function construirNodosDias(diasCompletados: number, diasRequeridos: number, nivel: number): NodoMapaSendero[] {
  const diaInicial = diasAcumuladosAntesDeNivel(nivel);
  return Array.from({ length: diasRequeridos }, (_, indice) => {
    const diaEnNivel = indice + 1;
    const diaGlobal = diaInicial + diaEnNivel;
    return {
      estado: diaEnNivel <= diasCompletados ? 'completado' : diaEnNivel === diasCompletados + 1 ? 'activo' : 'bloqueado',
      icono: diaEnNivel <= diasCompletados ? Check : diaEnNivel === diasCompletados + 1 ? Play : Lock,
      id: `dia-${diaGlobal}`,
      subtitulo: `Nivel ${nivel} · día ${diaEnNivel} de ${diasRequeridos}`,
      titulo: `Día ${diaGlobal}`,
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
  const nodos = datos && datos.diasRequeridos !== null ? construirNodosDias(datos.diasCompletados, datos.diasRequeridos, datos.nivel) : [];

  return { celebracion, consulta, esNivelMaximo, nodos, registrando, registrar, setRegistrando };
}
