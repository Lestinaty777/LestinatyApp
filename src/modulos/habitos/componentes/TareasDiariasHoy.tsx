import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterIcon, MasterProgressbar, Skeleton, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import { ModalAperturaCofre } from '../../senderos/componentes/mapa/ModalAperturaCofre';
import type { InfoCofre } from '../../senderos/datos/mapaEjercicio.mock';
import { TarjetaReferidosGemas } from '../../tienda/componentes/TarjetaReferidosGemas';
import { CofreTareaDiaria } from './CofreTareaDiaria';
import { useTareasDiarias } from '../hooks/useTareasDiarias';
import { useAssetsPaqueteTema } from '../usePaqueteTema';
import type { TareaDiaria } from '../tareasDiarias.tipos';

// El cofre se abre reutilizando ModalAperturaCofre (Senderos) tal cual —
// mismo modal, mismas fases/animación/fallback de video — con un InfoCofre
// sintético: las tareas diarias no tienen nivel/ciclo/nodo real, sólo
// necesitan el mínimo que el modal usa para mostrarse y pagar.
function cofreSinteticoDe(tarea: TareaDiaria): InfoCofre {
  return { tipo: 'final', estadoCofre: 'disponible', gemasMin: tarea.gemas, gemasMax: tarea.gemas, nodoDia: 1, ciclo: 1 };
}

export function TareasDiariasHoy() {
  const esc = useEscala();
  const tema = useAssetsPaqueteTema();
  const { t } = useTranslation();
  const { consulta, reclamar } = useTareasDiarias();
  const [tareaAbriendo, setTareaAbriendo] = useState<TareaDiaria | null>(null);

  if (consulta.isLoading) {
    return <View style={{ gap: 12 }}>{[0, 1, 2].map((indice) => <Skeleton alto={80} key={indice} radio={18} />)}</View>;
  }

  const resumen = consulta.data;
  const tareas = resumen?.tareas ?? [];
  const completadas = tareas.filter((tarea) => tarea.estado === 'reclamada').length;

  return (
    <View style={{ gap: 12 }}>
      {resumen && resumen.nodosProgramados === 0 ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
          <MasterIcon alTema name="bandera" size={72} />
          <Texto style={{ color: esc.hoja.l22, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, textAlign: 'center' }}>
            {t('habitos.tareasDiarias.vacioTitulo')}
          </Texto>
          <Texto style={{ color: esc.musgo.l49, fontSize: 13, textAlign: 'center' }}>{t('habitos.tareasDiarias.vacioTexto')}</Texto>
        </View>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <Texto style={{ color: esc.hoja.l22, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }}>
              {t('habitos.tareasDiarias.progreso', { completadas, total: tareas.length })}
            </Texto>
            <MasterProgressbar altura={8} porcentaje={tareas.length ? Math.round((completadas * 100) / tareas.length) : 0} />
          </View>
          {tareas.map((tarea) => (
            <CofreTareaDiaria key={tarea.codigo} onAbrir={() => setTareaAbriendo(tarea)} tarea={tarea} />
          ))}
        </>
      )}
      <TarjetaReferidosGemas />
      <ModalAperturaCofre
        cofre={tareaAbriendo ? cofreSinteticoDe(tareaAbriendo) : null}
        color={esc.jade.l34}
        onCerrar={() => setTareaAbriendo(null)}
        onReclamar={async () => {
          if (!tareaAbriendo) return { gemas: 0 };
          const resultado = await reclamar.mutateAsync(tareaAbriendo.codigo);
          return { gemas: resultado.gemas };
        }}
        paqueteId={tema.paqueteId}
        visible={tareaAbriendo !== null}
      />
    </View>
  );
}
