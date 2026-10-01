import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import { MasterIconBg, RecuadroGlass, Texto, useTonoMaster } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';

// Espejo simplificado de TarjetaSenderoHabito.tsx para el wizard de tareas:
// sin anillo de progreso ni grilla de 7 días (no aplican todavía en el
// momento de creación) — título, ícono, meta y frecuencia en una tarjeta con
// el árbol de fondo cuando la tarea va a tener sendero de días.
export type TarjetaSenderoTareaProps = {
  arbol?: ImageSourcePropType;
  descripcionMeta: string;
  descripcionFrecuencia: string;
  icono: { fuente: ImageSourcePropType; hue?: number };
  titulo: string;
};

export function TarjetaSenderoTarea({ arbol, descripcionFrecuencia, descripcionMeta, icono, titulo }: TarjetaSenderoTareaProps) {
  const tp = useEstilosTp();
  const tono = useTonoMaster();
  const c = tono.tarjeta;

  return (
    <View style={tp.contenedor}>
      <RecuadroGlass blur degradado={tono.degradadoTarjeta} style={tp.raiz}>
        {arbol && <Image source={arbol} style={tp.arbol} />}
        <MasterIconBg fuente={icono.fuente} hue={icono.hue} style={tp.iconoMarco} />
        <View style={tp.texto}>
          <Texto style={[tp.titulo, { color: c.tinta }]}>{titulo || 'Mi tarea'}</Texto>
          <Texto style={[tp.meta, { color: c.tintaMedia }]}>{descripcionMeta}</Texto>
          <Texto style={[tp.frecuencia, { color: c.tintaSuave }]}>{descripcionFrecuencia}</Texto>
        </View>
      </RecuadroGlass>
    </View>
  );
}

const crearEstilosTp = (esc: EscalaMaster) => StyleSheet.create({
  contenedor: { marginTop: 12, position: 'relative' },
  raiz: { borderRadius: 28, minHeight: 170, overflow: 'hidden', padding: 20, position: 'relative', zIndex: 1 },
  arbol: { height: 160, opacity: .92, position: 'absolute', resizeMode: 'contain', right: -30, top: -5, width: 140, zIndex: 1 },
  iconoMarco: { marginTop: 3, zIndex: 2 },
  texto: { marginTop: 14, maxWidth: '62%', zIndex: 2 },
  titulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 29 },
  meta: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 6 },
  frecuencia: { color: esc.jade.l43, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 3 },
});

const estilosPorEscalaTp = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosTp>>();

function useEstilosTp() {
  const esc = useEscala();
  let valor = estilosPorEscalaTp.get(esc);
  if (!valor) {
    valor = crearEstilosTp(esc);
    estilosPorEscalaTp.set(esc, valor);
  }
  return valor;
}
