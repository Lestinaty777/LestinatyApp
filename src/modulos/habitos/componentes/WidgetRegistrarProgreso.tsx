import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Minus, Pause, Play, Plus, X } from 'lucide-react-native';
import ReanimatedView, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Texto } from '../../../diseno';
import type { TipoMetaHabito } from '../tipos';

type WidgetRegistrarProgresoProps = {
  guardando: boolean;
  meta: number;
  onCerrar: () => void;
  onGuardar: (valor: number) => void;
  tipoMeta: TipoMetaHabito;
  titulo: string;
  unidad: string | null;
  valorInicial: number;
};

function BotonRebote({ children, deshabilitado, estilo, onPress }: { children: React.ReactNode; deshabilitado?: boolean; estilo?: object; onPress: () => void }) {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return <Pressable
    disabled={deshabilitado}
    onPress={onPress}
    onPressIn={() => { escala.value = withTiming(0.88, { duration: 90 }); }}
    onPressOut={() => { escala.value = withSpring(1, { damping: 8, stiffness: 260 }); }}
    style={estilo}
  >
    <ReanimatedView.View style={estiloAnimado}>{children}</ReanimatedView.View>
  </Pressable>;
}

// Reemplaza, dentro del mismo recuadro superior de la pestaña Senderos (mismo
// tamaño y color del hábito), el icono/título/descripción por un control
// compacto de registro — sin abrir una hoja ni pantalla aparte.
export function WidgetRegistrarProgreso({ guardando, meta, onCerrar, onGuardar, tipoMeta, titulo, unidad, valorInicial }: WidgetRegistrarProgresoProps) {
  return (
    <View style={s.fila}>
      <View style={s.textos}>
        <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>
        <Texto numberOfLines={1} style={s.sub}>
          {tipoMeta === 'check' ? (valorInicial > 0 ? 'Ya lo marcaste hoy' : 'Toca para marcarlo hecho') : tipoMeta === 'cantidad' ? `Suma de ${unidad || 'unidad'} en ${unidad || 'unidad'}` : 'Corre el cronómetro y guarda'}
        </Texto>
      </View>
      {tipoMeta === 'check' && <ControlCheck guardando={guardando} onGuardar={onGuardar} valorInicial={valorInicial} />}
      {tipoMeta === 'cantidad' && <ControlContador guardando={guardando} meta={meta} onGuardar={onGuardar} valorInicial={valorInicial} />}
      {tipoMeta === 'duracion' && <ControlCronometro guardando={guardando} onGuardar={onGuardar} valorInicial={valorInicial} />}
      <Pressable accessibilityLabel="Cerrar registro" hitSlop={10} onPress={onCerrar} style={s.cerrar}><X color="#FFFFFF" size={16} /></Pressable>
    </View>
  );
}

function ControlCheck({ guardando, onGuardar, valorInicial }: { guardando: boolean; onGuardar: (valor: number) => void; valorInicial: number }) {
  const hecho = valorInicial > 0;
  return (
    <BotonRebote deshabilitado={guardando} estilo={[s.botonRedondo, hecho && s.botonRedondoHecho]} onPress={() => onGuardar(1)}>
      <Check color={hecho ? 'rgba(255,255,255,.75)' : '#FFFFFF'} size={22} strokeWidth={3} />
    </BotonRebote>
  );
}

function ControlContador({ guardando, meta, onGuardar, valorInicial }: { guardando: boolean; meta: number; onGuardar: (valor: number) => void; valorInicial: number }) {
  const [valor, setValor] = useState(valorInicial);
  const cambiar = (delta: number) => { const siguiente = Math.max(0, valor + delta); setValor(siguiente); onGuardar(siguiente); };
  return (
    <View style={s.filaControl}>
      <BotonRebote deshabilitado={guardando || valor <= 0} estilo={s.botonPequeno} onPress={() => cambiar(-1)}><Minus color="#FFFFFF" size={16} /></BotonRebote>
      <Texto style={s.valorControl}>{valor}/{meta}</Texto>
      <BotonRebote deshabilitado={guardando} estilo={[s.botonPequeno, s.botonPequenoLleno]} onPress={() => cambiar(1)}><Plus color="#FFFFFF" size={16} /></BotonRebote>
    </View>
  );
}

function ControlCronometro({ guardando, onGuardar, valorInicial }: { guardando: boolean; onGuardar: (valor: number) => void; valorInicial: number }) {
  const [segundos, setSegundos] = useState(valorInicial * 60);
  const [corriendo, setCorriendo] = useState(false);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!corriendo) return;
    intervalo.current = setInterval(() => setSegundos((actual) => actual + 1), 1000);
    return () => { if (intervalo.current) clearInterval(intervalo.current); };
  }, [corriendo]);

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;

  return (
    <View style={s.filaControl}>
      <Texto style={s.valorControl}>{String(minutos).padStart(2, '0')}:{String(restoSegundos).padStart(2, '0')}</Texto>
      <BotonRebote estilo={s.botonPequeno} onPress={() => setCorriendo((valorActual) => !valorActual)}>
        {corriendo ? <Pause color="#FFFFFF" fill="#FFFFFF" size={14} /> : <Play color="#FFFFFF" fill="#FFFFFF" size={14} />}
      </BotonRebote>
      <BotonRebote deshabilitado={guardando || segundos === 0} estilo={[s.botonPequeno, s.botonPequenoLleno]} onPress={() => { setCorriendo(false); onGuardar(Math.max(1, Math.round(segundos / 60))); }}>
        <Check color="#FFFFFF" size={16} strokeWidth={3} />
      </BotonRebote>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  textos: { flex: 1 },
  titulo: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  sub: { color: 'rgba(255,255,255,.78)', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 2 },
  cerrar: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,.18)', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  botonRedondo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.28)', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  botonRedondoHecho: { backgroundColor: 'rgba(255,255,255,.14)' },
  filaControl: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  botonPequeno: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.24)', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  botonPequenoLleno: { backgroundColor: 'rgba(255,255,255,.4)' },
  valorControl: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 14, minWidth: 44, textAlign: 'center' },
});
