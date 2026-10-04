import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Texto } from '../componentes/Texto';
import { MasterChip } from './MasterChip';

type Periodo = 'AM' | 'PM';

/** "08:00" (24h, lo único que guarda el backend) -> { hora12, minuto, periodo } para mostrar. */
function hora24aPartes(hora24: string): { hora12: string; minuto: string; periodo: Periodo } {
  const coincidencia = /^(\d{1,2}):(\d{2})$/.exec(hora24);
  if (!coincidencia) return { hora12: '8', minuto: '00', periodo: 'AM' };
  const horas = Number(coincidencia[1]);
  const periodo: Periodo = horas >= 12 ? 'PM' : 'AM';
  const hora12 = horas % 12 === 0 ? 12 : horas % 12;
  return { hora12: String(hora12), minuto: coincidencia[2], periodo };
}

function partesAHora24(hora12: string, minuto: string, periodo: Periodo): string {
  let horas = Number(hora12) % 12;
  if (periodo === 'PM') horas += 12;
  return `${String(horas).padStart(2, '0')}:${minuto.padStart(2, '0')}`;
}

/** "08:00" -> "8:00 AM" — para etiquetar botones de hora preestablecida en 12h. */
export function formatoHora12(hora24: string): string {
  const { hora12, minuto, periodo } = hora24aPartes(hora24);
  return `${hora12}:${minuto} ${periodo}`;
}

type SelectorHora12Props = {
  hora: string;
  onCambiar: (hora24: string) => void;
};

/** Entrada de hora en formato 12h + AM/PM — guarda y expone siempre 24h ("HH:MM") hacia afuera. */
export function SelectorHora12({ hora, onCambiar }: SelectorHora12Props) {
  const partesIniciales = useMemo(() => hora24aPartes(hora), [hora]);
  const [hora12, setHora12] = useState(partesIniciales.hora12);
  const [minuto, setMinuto] = useState(partesIniciales.minuto);
  const [periodo, setPeriodo] = useState<Periodo>(partesIniciales.periodo);

  function actualizar(siguienteHora12: string, siguienteMinuto: string, siguientePeriodo: Periodo) {
    setHora12(siguienteHora12);
    setMinuto(siguienteMinuto);
    setPeriodo(siguientePeriodo);
    const horaValida = /^([1-9]|1[0-2])$/.test(siguienteHora12);
    const minutoValido = /^[0-5]\d$/.test(siguienteMinuto);
    if (horaValida && minutoValido) onCambiar(partesAHora24(siguienteHora12, siguienteMinuto, siguientePeriodo));
  }

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
      <TextInput
        keyboardAppearance="light"
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={(valor) => actualizar(valor.replace(/\D/g, ''), minuto, periodo)}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 12, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 22, paddingHorizontal: 14, paddingVertical: 10, textAlign: 'center', width: 54 }}
        value={hora12}
      />
      <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 22 }}>:</Texto>
      <TextInput
        keyboardAppearance="light"
        keyboardType="number-pad"
        maxLength={2}
        onChangeText={(valor) => actualizar(hora12, valor.replace(/\D/g, ''), periodo)}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 12, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 22, paddingHorizontal: 14, paddingVertical: 10, textAlign: 'center', width: 54 }}
        value={minuto}
      />
      <View style={{ flexDirection: 'row', gap: 6, marginLeft: 4 }}>
        {(['AM', 'PM'] as const).map((opcion) => (
          <MasterChip activo={periodo === opcion} key={opcion} onPress={() => actualizar(hora12, minuto, opcion)} texto={opcion} />
        ))}
      </View>
    </View>
  );
}
