import type { ComponentType } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterButton, MasterChip, MasterGlass, MasterIconBg, MasterSand, Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { buscarIconoHabito } from '../../../habitos/iconosHabitos';
import { obtenerAssetsPaqueteHabito } from '../../../habitos/paqueteVisual.assets';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { EncabezadoMision } from './EncabezadoMision';
import { FlujoCelebracionMandala } from './FlujoCelebracionMandala';
import type { HitoMision } from './hitosMision';
import { TimelineHitosMision } from './TimelineHitosMision';

type IconoBoton = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function oscurecerLigero(hex: string, factor = 0.82) {
  const limpio = hex.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(limpio.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

type PantallaMisionAnilloProps = {
  botonPrincipalDisabled?: boolean;
  botonPrincipalIcono?: IconoBoton;
  botonPrincipalTexto: string;
  botonReiniciarDisabled?: boolean;
  botonReiniciarIcono?: IconoBoton;
  botonReiniciarTexto: string;
  botonTerminarDisabled?: boolean;
  botonTerminarTexto: string;
  cargando: boolean;
  chipTexto: string;
  color: string;
  hitos: HitoMision[];
  iconoLucide: string | undefined;
  onBotonPrincipal: () => void;
  onBotonReiniciar: () => void;
  onBotonTerminar: () => void;
  onTerminado: () => void;
  paqueteId: string;
  porcentaje: number;
  resultado: ResultadoRegistroHabito | undefined;
  titulo: string | undefined;
  valorMetaTexto: string;
  valorPrincipalTexto: string;
};

// Shell compartido por duración y cantidad: icono+título del hábito, chip de
// contexto, anillo "arena" (lo incompleto se ve hundido, lo completo
// saturado — AnilloArenaMision), timeline de mini-hitos y la botonera
// (principal ancho completo + reiniciar/terminar en fila). Cada pantalla
// sólo aporta sus textos/valores y qué hace cada botón — la mecánica de
// cronómetro o stepper vive en el caller, no aquí.
export function PantallaMisionAnillo({
  botonPrincipalDisabled, botonPrincipalIcono: IconoPrincipal, botonPrincipalTexto,
  botonReiniciarDisabled, botonReiniciarIcono: IconoReiniciar, botonReiniciarTexto,
  botonTerminarDisabled, botonTerminarTexto,
  cargando, chipTexto, color, hitos, iconoLucide,
  onBotonPrincipal, onBotonReiniciar, onBotonTerminar, onTerminado,
  paqueteId, porcentaje, resultado, titulo, valorMetaTexto, valorPrincipalTexto,
}: PantallaMisionAnilloProps) {
  const insets = useSafeAreaInsets();
  const esc = useEscala();

  if (cargando) {
    return <View style={styles.centroCarga}><ActivityIndicator color={color} /></View>;
  }

  const icono = buscarIconoHabito(iconoLucide);
  const arbusto = obtenerAssetsPaqueteHabito(paqueteId).arbusto;
  const colorPrincipal = oscurecerLigero(color);

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97, paddingBottom: insets.bottom + 24 }]}>
      <EncabezadoMision color={color} titulo={undefined} />
      <View style={styles.contenido}>
        <MasterIconBg fuente={icono?.fuente} hue={icono?.hue} size={64} style={styles.iconoMarco} />
        <Texto style={[styles.titulo, { color: esc.hoja.l22 }]}>{titulo}</Texto>
        <MasterChip texto={chipTexto} />
        <MasterSand color={color} forma="anillo" grosor={26} porcentaje={porcentaje} tamano={300}>
          <Texto style={styles.valorPrincipal}>{valorPrincipalTexto}</Texto>
          <Texto style={[styles.valorMeta, { color: esc.musgo.l42 }]}>{valorMetaTexto}</Texto>
          <Image resizeMode="contain" source={arbusto} style={styles.arbusto} />
        </MasterSand>
        <MasterGlass style={styles.tarjetaTimeline}>
          <TimelineHitosMision color={color} hitos={hitos} />
        </MasterGlass>
      </View>
      <MasterGlass style={styles.tarjetaBotones}>
        <MasterButton color={colorPrincipal} disabled={botonPrincipalDisabled} iconoIzquierda={IconoPrincipal} onPress={onBotonPrincipal} style={styles.botonPrincipal}>
          {botonPrincipalTexto}
        </MasterButton>
        <View style={styles.filaSecundaria}>
          <View style={styles.mitad}>
            <MasterButton color={color} disabled={botonReiniciarDisabled} iconoIzquierda={IconoReiniciar} onPress={onBotonReiniciar}>
              {botonReiniciarTexto}
            </MasterButton>
          </View>
          <View style={styles.mitad}>
            <MasterButton color={color} disabled={botonTerminarDisabled} onPress={onBotonTerminar}>
              {botonTerminarTexto}
            </MasterButton>
          </View>
        </View>
      </MasterGlass>
      <FlujoCelebracionMandala color={color} onTerminado={onTerminado} paqueteId={paqueteId} resultado={resultado} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, paddingHorizontal: 20 },
  centroCarga: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  contenido: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center', width: '100%' },
  iconoMarco: { alignSelf: 'center' },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 19, textAlign: 'center' },
  valorPrincipal: { color: '#111318', fontFamily: 'MontserratAlternates-Bold', fontSize: 38, lineHeight: 46 },
  valorMeta: { fontFamily: 'Montserrat-Medium', fontSize: 15, lineHeight: 20, marginTop: 2 },
  arbusto: { height: 84, marginTop: 10, width: 84 },
  tarjetaTimeline: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 18, width: '100%' },
  tarjetaBotones: { borderRadius: 24, gap: 12, marginTop: 24, padding: 16, width: '100%' },
  botonPrincipal: { width: '100%' },
  filaSecundaria: { flexDirection: 'row', gap: 12, width: '100%' },
  mitad: { flex: 1 },
});
