import { useEffect, useState } from 'react';

import { ModalAperturaCofre } from '../mapa/ModalAperturaCofre';
import type { InfoCofre } from '../../datos/mapaEjercicio.mock';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { usarRitualMandala } from '../../../habitos/estado/ritualMandala.estado';

type Fase = 'cofre' | null;

// Secuencia compartida por las 3 pantallas dedicadas tras un registro
// exitoso: si hubo transición de cofre (nivel/ciclo), se festeja primero
// (mismo ModalAperturaCofre ya existente, modo automático — las gemas ya
// se acreditaron en registrar_progreso_habito). Después, siempre
// `onTerminado` (volver al mapa); si además hay una mandala pendiente, antes
// se deja el encargo del ritual: el mapa lo toma al recuperar el foco y lo
// abre sobre el pedestal del nodo (CompositorOverlay), sin cambiar de ruta.
export function FlujoCelebracionMandala({ color, paqueteId, resultado, onTerminado }: {
  color: string;
  paqueteId: string;
  resultado: ResultadoRegistroHabito | undefined;
  onTerminado: () => void;
}) {
  const encargarRitual = usarRitualMandala((estado) => estado.encargar);
  const [fase, setFase] = useState<Fase>(null);
  const [cofreSintetico, setCofreSintetico] = useState<InfoCofre | null>(null);

  function dejarRitualYTerminar() {
    if (resultado?.mandalaPendiente) encargarRitual(resultado.mandalaPendiente);
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
    dejarRitualYTerminar();
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
          dejarRitualYTerminar();
        }}
        paqueteId={paqueteId}
        visible
      />
    );
  }

  return null;
}
