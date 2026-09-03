import { Image, StyleSheet, View } from 'react-native';

import type { CategoriaAbyId } from '../datos/categoriasAby';

const arboles: Record<CategoriaAbyId, number> = {
  estudio: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'),
  finanzas: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'),
  habitos: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'),
  relaciones: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'),
  rutinas: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'),
  salud: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'),
  tareas: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'),
};

export function ArbolLateralTurnoAby({ categoria }: { categoria: CategoriaAbyId | null }) {
  if (!categoria) return null;
  return <View pointerEvents="none" style={styles.raiz}><Image resizeMode="contain" source={arboles[categoria]} style={styles.imagen} /></View>;
}

const styles = StyleSheet.create({ imagen: { height: 82, width: 82 }, raiz: { bottom: -19, left: -26, opacity: 0.92, position: 'absolute' } });
