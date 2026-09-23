import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { MasterCircularProgressBar } from '../../../../diseno';

type RelojCronometroProps = {
  children?: ReactNode;
  /** Sin esto, el anillo toma el tono activo (MasterColor) — normalmente ya viene del TonoDelHabito que envuelve la pantalla. */
  colorBase?: string;
  grosor?: number;
  porcentaje: number;
  tamano?: number;
};

// Mismo cronómetro clásico de WidgetCronometro.tsx (SDUI), a tamaño hero:
// corona + pulsador a 45° + cristal + manecilla estática, cromería siempre
// neutra (un reloj de colores no se ve "real"). La proporción que hace que
// se vea como reloj y no como una dona plana es el bisel: el cristal
// exterior es visiblemente más grande que el anillo de progreso (mismo
// ~85% que el widget original, r=26 vs R=22) — antes casi no había hueco
// entre ambos y se veía chato.
export function RelojCronometro({ children, colorBase, grosor = 18, porcentaje, tamano = 260 }: RelojCronometroProps) {
  const cx = tamano / 2;
  const cy = tamano / 2;
  const radioCristal = tamano / 2 - tamano * 0.015;
  const tamanoAnillo = tamano * 0.85;
  const radioAnillo = (tamanoAnillo - grosor) / 2;
  const largoManecilla = radioAnillo * 0.55;

  return (
    <View style={{ height: tamano, width: tamano }}>
      <Svg height={tamano} style={StyleSheet.absoluteFill} width={tamano}>
        {/* Corona superior */}
        <Rect fill="#9AA0B4" height={tamano * 0.045} rx={tamano * 0.011} width={tamano * 0.09} x={cx - tamano * 0.045} y={0} />
        <Rect fill="#6B7280" height={tamano * 0.03} width={tamano * 0.03} x={cx - tamano * 0.015} y={tamano * 0.04} />
        {/* Pulsador lateral a 45° */}
        <G transform={`rotate(45 ${cx} ${cy})`}>
          <Rect fill="#6B7280" height={tamano * 0.045} rx={tamano * 0.006} width={tamano * 0.03} x={cx - tamano * 0.015} y={tamano * 0.018} />
        </G>
        {/* Cristal exterior — el bisel real entre el borde del reloj y el dial */}
        <Circle cx={cx} cy={cy} fill="rgba(0,0,0,0.015)" r={radioCristal} stroke="rgba(0,0,0,0.09)" strokeWidth={tamano * 0.006} />
        {/* Manecilla estática — flourish mecánico, no marca la hora real */}
        <Path d={`M${cx} ${cy} L${cx} ${cy - largoManecilla}`} stroke="#9AA0B4" strokeLinecap="round" strokeWidth={tamano * 0.01} />
        <Circle cx={cx} cy={cy} fill="#AAAAAA" r={tamano * 0.013} />
      </Svg>
      <View style={styles.anilloContenedor}>
        <MasterCircularProgressBar colorBase={colorBase} grosor={grosor} porcentaje={porcentaje} tamano={tamanoAnillo}>
          {children}
        </MasterCircularProgressBar>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anilloContenedor: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
