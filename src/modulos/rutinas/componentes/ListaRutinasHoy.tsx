import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { agruparPorFranja, FRANJAS_ORDEN, type FiltroFranja } from '../../../compartido/utilidades/franjas';
import { Texto } from '../../../diseno';
import { estaPendienteHoy } from '../estadoRutina';
import type { PasoRutina, Rutina } from '../rutinas.tipos';
import { TarjetaRutinaHoy } from './TarjetaRutinaHoy';

/** Pendientes primero, completadas después; dentro de cada grupo, se conserva el orden de creación. */
export function ordenarPendientesPrimero(rutinas: readonly Rutina[]): Rutina[] {
  return [...rutinas].sort((a, b) => Number(!estaPendienteHoy(a)) - Number(!estaPendienteHoy(b)));
}

export function ListaRutinasHoy({ color, filtro, onAlternarPaso, pasoEnCursoId, rutinas }: {
  color: string;
  filtro: FiltroFranja;
  onAlternarPaso: (rutina: Rutina, paso: PasoRutina) => void;
  pasoEnCursoId: string | null;
  /** Ya filtradas por franja y por "toca hoy". */
  rutinas: readonly Rutina[];
}) {
  const { t } = useTranslation();
  const tarjeta = (rutina: Rutina) => (
    <TarjetaRutinaHoy color={color} key={rutina.id} onAlternarPaso={onAlternarPaso} pasoEnCursoId={pasoEnCursoId} rutina={rutina} />
  );

  if (filtro !== 'todo') return <View>{ordenarPendientesPrimero(rutinas).map(tarjeta)}</View>;

  // "Todo": una sección por franja, en orden; las vacías no se muestran.
  const grupos = agruparPorFranja(rutinas);
  return (
    <View>
      {FRANJAS_ORDEN.filter((franja) => grupos[franja].length > 0).map((franja) => (
        <View key={franja}>
          <Texto accessibilityRole="header" style={estilos.seccion}>{t(`rutinas.franjas.${franja}`)}</Texto>
          {ordenarPendientesPrimero(grupos[franja]).map(tarjeta)}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { color: '#7B7494', fontFamily: 'Montserrat-Bold', fontSize: 12, letterSpacing: 0.4, marginBottom: 6, marginTop: 4, textTransform: 'uppercase' },
});
