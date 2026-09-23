import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIcon, MasterProgressbar, Texto } from '../../../diseno';
import { MasterChanger, colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { CodigoTareaDiaria, TareaDiaria } from '../tareasDiarias.tipos';

// Mismo par de assets y hues que NodoCofreSendero.tsx: cofre.png es el
// cofre CERRADO (bloqueado/disponible) y cofre-cerrado.png es el ABIERTO
// (reclamado) — nombre de archivo engañoso, verificado visualmente ahí.
const ASSET_CERRADO = require('../../../../assets/ilustraciones/senderos/biomas/cofres/cofre.png');
const ASSET_ABIERTO = require('../../../../assets/ilustraciones/senderos/biomas/cofres/cofre-cerrado.png');
const HUE_ORIGEN_CERRADO = 150;
const HUE_ORIGEN_ABIERTO = 155;

const ICONO_POR_TAREA: Record<CodigoTareaDiaria, string> = {
  sendero_1_nodo: 'caminar',
  sendero_2_nodos: 'montana',
  sendero_dia_completo: 'trofeo',
};

export function CofreTareaDiaria({ onAbrir, tarea }: { onAbrir: () => void; tarea: TareaDiaria }) {
  const esc = useEscala();
  const { t } = useTranslation();
  const colorMaster = colorMasterMasCercano(esc.jade.l34);
  const rotacion = useSharedValue(0);

  useEffect(() => {
    if (tarea.estado === 'disponible') {
      rotacion.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 110 }),
          withTiming(4, { duration: 110 }),
          withTiming(-2, { duration: 80 }),
          withTiming(0, { duration: 80 }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
        false,
      );
    } else {
      rotacion.value = 0;
    }
  }, [tarea.estado, rotacion]);

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotacion.value}deg` }] }));

  const bloqueada = tarea.estado === 'bloqueada';
  const reclamada = tarea.estado === 'reclamada';
  const fuente = reclamada ? ASSET_ABIERTO : ASSET_CERRADO;
  const hueOrigen = reclamada ? HUE_ORIGEN_ABIERTO : HUE_ORIGEN_CERRADO;

  return (
    <MasterGlass style={s.fila}>
      <View style={s.contenido}>
        <View style={s.tituloFila}>
          <MasterIcon alTema name={ICONO_POR_TAREA[tarea.codigo]} size={16} />
          <Texto style={[s.titulo, { color: esc.hoja.l19 }]}>{t(`habitos.tareasDiarias.mision.${tarea.codigo}.titulo`)}</Texto>
        </View>
        <Texto style={[s.descripcion, { color: esc.musgo.l49 }]}>{t(`habitos.tareasDiarias.mision.${tarea.codigo}.descripcion`)}</Texto>
        {!reclamada && <MasterProgressbar altura={6} porcentaje={Math.min(100, Math.round((tarea.progreso / Math.max(1, tarea.meta)) * 100))} style={s.barra} />}
      </View>
      <Pressable
        accessibilityLabel={
          bloqueada
            ? t('habitos.tareasDiarias.cofreBloqueado')
            : reclamada
              ? t('habitos.tareasDiarias.cofreReclamado')
              : t('habitos.tareasDiarias.cofreDisponible')
        }
        accessibilityRole="button"
        disabled={bloqueada || reclamada}
        onPress={() => { hapticSeguro('seleccion'); onAbrir(); }}
        style={s.cofreBoton}
      >
        <Animated.View style={estiloAnimado}>
          <MasterChanger
            alto={56}
            ancho={56}
            colorDestino={colorMaster}
            fit="contain"
            fuente={fuente}
            hueOrigen={hueOrigen}
            oscurecido={bloqueada ? 0.6 : undefined}
            soloPixelesVerdes
          />
        </Animated.View>
        {tarea.estado === 'disponible' && (
          <View style={[s.badge, { backgroundColor: esc.jade.l42a }]}>
            <Texto style={s.badgeTexto}>{t('habitos.tareasDiarias.reclamar')}</Texto>
          </View>
        )}
      </Pressable>
    </MasterGlass>
  );
}

const s = StyleSheet.create({
  fila: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 12, padding: 12 },
  contenido: { flex: 1, gap: 6 },
  tituloFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  descripcion: { fontFamily: 'Montserrat-Medium', fontSize: 12 },
  barra: { marginTop: 2 },
  cofreBoton: { alignItems: 'center', height: 64, justifyContent: 'center', width: 64 },
  badge: {
    borderRadius: 8,
    bottom: -4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.5 },
});
