import { Pressable, StyleSheet, View } from 'react-native';

import { MasterChip, MasterGlass, MasterIcon, MasterIconBg, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';

// Espejo de TarjetaChecklistCompacta.tsx para el sendero de días (Fase 8):
// "Nivel N" en vez de "X/Y pasos" — una tarea recurrente no tiene pasos, tiene
// nivel + progreso de días dentro de ese nivel.
export function TarjetaSenderoDiaCompacta({ alto = 92, ancho = 260, color, diasCompletados, diasRequeridos, iconoLucide, nivel, onPress, titulo }: {
  alto?: number;
  ancho?: number;
  color: string | null;
  /** Progreso de días dentro del nivel — se omite en la vista de carrusel (requeriría una consulta por tarea); la barra de la tarea seleccionada sí lo muestra. */
  diasCompletados?: number;
  diasRequeridos?: number;
  iconoLucide: string | null;
  nivel: number;
  onPress: () => void;
  titulo: string;
}) {
  const tc = useEstilosTc();
  const icono = buscarIconoHabito(iconoLucide);
  const texto = diasRequeridos !== undefined ? `Nivel ${nivel} · ${diasCompletados ?? 0}/${diasRequeridos}` : `Nivel ${nivel}`;
  return (
    <Pressable onPress={onPress} style={{ height: alto, width: ancho }}>
      {({ pressed }) => (
        <MasterGlass blur intensity={40} style={[tc.raiz, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
          <View style={tc.filaPrincipal}>
            <MasterIconBg fuente={icono?.fuente} size={64} tinte={color ?? undefined} />
            <View style={tc.columnaTextos}>
              <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
              <View style={tc.chipsFila}>
                <MasterChip icono={<MasterIcon name="hoy/senderos" alTema size={14} />} texto={texto} />
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
