import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { ModalAperturaCofre } from '../mapa/ModalAperturaCofre';
import type { InfoCofre } from '../../datos/mapaEjercicio.mock';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';

type Fase = 'cofre' | null;

// Secuencia compartida por las 3 pantallas dedicadas tras un registro
// exitoso: si hubo transición de cofre (nivel/ciclo), se festeja primero
// (mismo ModalAperturaCofre ya existente, modo automático — las gemas ya
// se acreditaron en registrar_progreso_habito); al cerrarse, si además hay
// una mandala pendiente, se navega al compositor. Sin cofre, va directo al
// compositor. Sin ninguno de los dos, `onTerminado` — el caller decide qué
// hacer (normalmente, volver al mapa).
//
// Transiciones de ruta con `replace`, nunca `push`: mision-* → compositor →
// finalización quedan en el mismo nivel del stack, así que un solo
// `router.back()` desde la finalización vuelve directo al mapa, sin
// importar cuántos pasos hubo en el medio.
export function FlujoCelebracionMandala({ color, paqueteId, resultado, onTerminado }: {
  color: string;
  paqueteId: string;
  resultado: ResultadoRegistroHabito | undefined;
  onTerminado: () => void;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>(null);
  const [cofreSintetico, setCofreSintetico] = useState<InfoCofre | null>(null);

  function abrirCompositorOTerminar() {
    if (resultado?.mandalaPendiente) {
      const mandala = resultado.mandalaPendiente;
      router.replace({
        pathname: '/senderos/mandala-compositor',
        params: {
          color: mandala.color ?? color,
          nodoDia: String(mandala.nodoDia),
          paqueteId: mandala.paqueteId ?? paqueteId,
          registroId: mandala.registroId,
        },
      });
      return;
    }
    onTerminado();
  }

  useEffect(() => {
    if (!resultado) return;
    if (resultado.transicionSendero) {
      setCofreSintetico({
        ciclo: resultado.transicionSendero.cicloActual,
        estadoCofre: 'reclamado',
        gemasMax: resultado.transicionSendero.gemas,
        gemasMin: resultado.transicionSendero.gemas,
        nodoDia: 1,
        tipo: 'final',
      });
      setFase('cofre');
      return;
    }
    abrirCompositorOTerminar();
    // Sólo debe reaccionar cuando `resultado` cambia de vacío a un registro nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);

  if (fase === 'cofre' && cofreSintetico) {
    return (
      <ModalAperturaCofre
        cofre={cofreSintetico}
        color={color}
        gemasAcreditadas={cofreSintetico.gemasMin}
        modo="automatico"
        onCerrar={() => setFase(null)}
        onFinalizarAutomatico={() => {
          setFase(null);
          abrirCompositorOTerminar();
        }}
        paqueteId={paqueteId}
        visible
      />
    );
  }

  return null;
}
