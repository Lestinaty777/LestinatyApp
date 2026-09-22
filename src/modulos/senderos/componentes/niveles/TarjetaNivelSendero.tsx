import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MasterGlass, MasterIcon, MasterProgressbar } from '../../../../diseno';
import { obtenerAssetsPaqueteHabito } from '../../../habitos/paqueteVisual.assets';
import type { SeccionSenderoHabito } from '../../../habitos/senderoHabito.tipos';
import { esSeccionSeleccionable } from './carruselNiveles.modelo';

type Props = {
  seccion: SeccionSenderoHabito;
  paqueteId: string;
  colorPaquete: string;
  seleccionado: boolean;
  onSeleccionar: (nivel: number) => void;
};

export function anchoTarjetaNivel(anchoVentana: number): number {
  return Math.min(anchoVentana * 0.78, 300);
}

export function TarjetaNivelSendero({ seccion, paqueteId, colorPaquete, seleccionado, onSeleccionar }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const ancho = anchoTarjetaNivel(width);
  const seleccionable = esSeccionSeleccionable(seccion);
  const assets = obtenerAssetsPaqueteHabito(paqueteId, seccion.nivel);

  const esMaestria = seccion.nivel === 7;
  const titulo = seccion.estado === 'bloqueado'
    ? `Nivel ${seccion.nivel} · ${t('senderos.levels.locked')}`
    : seccion.estado === 'completado'
      ? `Nivel ${seccion.nivel} · ${t('senderos.levels.completed')}`
      : esMaestria
        ? t('senderos.levels.masteryCycle', { cycle: seccion.ciclo })
        : `Nivel ${seccion.nivel}`;

  const subtitulo = seccion.estado === 'bloqueado'
    ? t('senderos.levels.completePrevious')
    : t('senderos.levels.daysProgress', {
      completed: seccion.estado === 'completado' ? seccion.diasRequeridos : seccion.diasCompletados,
      required: seccion.diasRequeridos,
    });

  const porcentaje = seccion.estado === 'completado' ? 100 : (seccion.diasCompletados / seccion.diasRequeridos) * 100;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !seleccionable, selected: seleccionado }}
      disabled={!seleccionable}
      onPress={() => onSeleccionar(seccion.nivel)}
      style={{ width: ancho }}
    >
      <MasterGlass
        blur
        colorBase={colorPaquete}
        style={[
          s.tarjeta,
          seleccionado && { borderColor: colorPaquete, borderWidth: 2 },
          !seleccionable && s.tarjetaBloqueada,
        ]}
      >
        <Image source={assets.base} style={[s.etapa, !seleccionable && s.etapaBloqueada]} />
        <View style={s.contenido}>
          <View style={s.encabezado}>
            <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
            {seccion.estado === 'bloqueado' && <MasterIcon name="candado" size={16} />}
            {seccion.estado !== 'bloqueado' && <MasterIcon alTema name={`nivel${seccion.nivel}`} size={18} />}
          </View>
          <Text style={s.subtitulo}>{subtitulo}</Text>
          <MasterProgressbar altura={8} colorBase={colorPaquete} porcentaje={porcentaje} />
        </View>
      </MasterGlass>
    </Pressable>
  );
}

const s = StyleSheet.create({
  contenido: { flex: 1, gap: 6, justifyContent: 'center' },
  encabezado: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  etapa: { borderRadius: 8, height: 92, width: 76 },
  etapaBloqueada: { opacity: 0.45 },
  subtitulo: { color: '#6B6B6B', fontSize: 13 },
  tarjeta: { borderRadius: 12, flexDirection: 'row', gap: 12, minHeight: 116, padding: 12 },
  tarjetaBloqueada: { opacity: 0.85 },
  titulo: { color: '#1A1A1A', flexShrink: 1, fontSize: 15, fontWeight: '700' },
});
