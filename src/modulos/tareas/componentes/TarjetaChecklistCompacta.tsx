import { Pressable, StyleSheet, View } from 'react-native';

import { MasterChip, MasterGlass, MasterIcon, MasterIconBg, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';

// Espejo liviano de TarjetaHabitoCompacta (misma silueta: MasterGlass +
// MasterIconBg + título + chip), pero con "X/Y pasos" en vez de racha/nivel
// — una tarea checklist no tiene ninguno de los dos.
export function TarjetaChecklistCompacta({ alto = 92, ancho = 260, color, iconoLucide, onPress, pasosCompletados, titulo, totalPasos }: {
  alto?: number;
  ancho?: number;
  color: string | null;
  iconoLucide: string | null;
  onPress: () => void;
  pasosCompletados: number;
  titulo: string;
  totalPasos: number;
}) {
  const tc = useEstilosTc();
  const icono = buscarIconoHabito(iconoLucide);
  return (
    <Pressable onPress={onPress} style={{ height: alto, width: ancho }}>
      {({ pressed }) => (
        <MasterGlass blur intensity={40} style={[tc.raiz, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
          <View style={tc.filaPrincipal}>
            <MasterIconBg fuente={icono?.fuente} size={64} tinte={color ?? undefined} />
            <View style={tc.columnaTextos}>
              <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
              <View style={tc.chipsFila}>
                <MasterChip icono={<MasterIcon name="hoy/lista" alTema size={14} />} texto={`${pasosCompletados}/${totalPasos}`} />
              </View>
            </View>
          </View>
        </MasterGlass>
      )}
    </Pressable>
  );
}

const crearEstilosTc = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { borderRadius: 16, flex: 1, justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 12 },
  filaPrincipal: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  columnaTextos: { flex: 1, gap: 6 },
  titulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  chipsFila: { flexDirection: 'row', gap: 6 },
});

const estilosPorEscalaTc = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosTc>>();
function useEstilosTc() {
  const esc = useEscala();
  let valor = estilosPorEscalaTc.get(esc);
  if (!valor) { valor = crearEstilosTc(esc); estilosPorEscalaTc.set(esc, valor); }
  return valor;
}
