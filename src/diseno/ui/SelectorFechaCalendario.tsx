import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { addMonths, endOfMonth, format, getDate, getDay, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

import { fechaLocalDe } from '../../nucleo/dispositivo/fechaLocal';
import { Texto } from '../componentes/Texto';
import { Rebote } from './Rebote';

const ETIQUETAS_DIA_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type SelectorFechaCalendarioProps = {
  color: string;
  fechaMinima?: Date;
  fechaSeleccionada: string | null;
  onSeleccionar: (fecha: string) => void;
};

/** Grilla de días de un mes — lunes primero, mismo criterio que el selector de días de la semana. */
export function SelectorFechaCalendario({ color, fechaMinima = startOfDay(new Date()), fechaSeleccionada, onSeleccionar }: SelectorFechaCalendarioProps) {
  const [mesVisible, setMesVisible] = useState(() => startOfMonth(fechaSeleccionada ? new Date(`${fechaSeleccionada}T00:00:00`) : new Date()));

  const celdas = useMemo(() => {
    const inicio = startOfMonth(mesVisible);
    const fin = endOfMonth(mesVisible);
    const offset = (getDay(inicio) + 6) % 7; // getDay: 0=domingo → offset con lunes primero
    const dias: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let dia = 1; dia <= getDate(fin); dia++) dias.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia));
    return dias;
  }, [mesVisible]);

  const puedeRetroceder = isBefore(startOfMonth(fechaMinima), mesVisible);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Rebote disabled={!puedeRetroceder} onPress={() => setMesVisible((mes) => subMonths(mes, 1))} estilo={{ opacity: puedeRetroceder ? 1 : 0.3, padding: 6 }}>
          <ChevronLeft color="#554E68" size={20} />
        </Rebote>
        <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 14, textTransform: 'capitalize' }}>{format(mesVisible, 'MMMM yyyy', { locale: es })}</Texto>
        <Rebote onPress={() => setMesVisible((mes) => addMonths(mes, 1))} estilo={{ padding: 6 }}>
          <ChevronRight color="#554E68" size={20} />
        </Rebote>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {ETIQUETAS_DIA_SEMANA.map((etiqueta, indice) => (
          <View key={`${etiqueta}-${indice}`} style={{ alignItems: 'center', width: 34 }}>
            <Texto style={{ color: '#9A93A8', fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{etiqueta}</Texto>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {celdas.map((fecha, indice) => {
          if (!fecha) return <View key={`vacio-${indice}`} style={{ height: 38, width: '14.28%' }} />;
          const deshabilitado = isBefore(fecha, fechaMinima) && !isSameDay(fecha, fechaMinima);
          const activo = fechaSeleccionada === fechaLocalDe(fecha);
          const esHoy = isSameDay(fecha, new Date()) && isSameMonth(fecha, mesVisible);
          return (
            <View key={fecha.toISOString()} style={{ alignItems: 'center', height: 38, width: '14.28%' }}>
              <Rebote disabled={deshabilitado} onPress={() => onSeleccionar(fechaLocalDe(fecha))} estilo={{ alignItems: 'center', backgroundColor: activo ? color : 'transparent', borderColor: esHoy && !activo ? color : 'transparent', borderRadius: 13, borderWidth: 1.5, height: 32, justifyContent: 'center', opacity: deshabilitado ? 0.3 : 1, width: 32 }}>
                <Texto style={{ color: activo ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{getDate(fecha)}</Texto>
              </Rebote>
            </View>
          );
        })}
      </View>
    </View>
  );
}
