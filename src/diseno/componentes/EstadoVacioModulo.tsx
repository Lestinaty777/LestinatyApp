import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { MasterIcon } from '../iconos/MasterIcon';
import { MasterIconBg } from '../ui/MasterIconBg';
import { MasterButton, type MasterButtonProps } from './MasterButton';
import { Texto } from './Texto';

const C = { texto: '#1A1335', tenue: '#7B7494' };

export type PistaEstadoVacio = {
  /** Nombre del registro de íconos propios (assets/icons/ui), no de lucide. */
  icono: string;
  texto: string;
};

export type AccionEstadoVacio = {
  /** Ícono del botón (lucide): todo MasterButton lleva uno. */
  Icono: NonNullable<MasterButtonProps['iconoIzquierda']>;
  onPress: () => void;
  texto: string;
};

// Estado vacío con el estilo de la app, para cualquier módulo: el arte del
// paquete centrado en su marco, título, una frase, hasta tres ideas con íconos
// propios y una o dos salidas (la principal en el color del módulo, la
// secundaria en blanco). Sin textos propios: todo llega por props.
export function EstadoVacioModulo({ accion, accionSecundaria, color, ilustracion, pistas = [], texto, titulo }: {
  accion?: AccionEstadoVacio;
  accionSecundaria?: AccionEstadoVacio;
  /** Acento del módulo. */
  color: string;
  /** Arte del paquete (semilla, arbusto…). */
  ilustracion?: ImageSourcePropType;
  pistas?: readonly PistaEstadoVacio[];
  texto: string;
  titulo?: string;
}) {
  return (
    <View style={estilos.raiz}>
      {ilustracion ? (
        // MasterIconBg se alinea a la izquierda por defecto (alignSelf: 'flex-start'): aquí va centrado.
        // Imagen normal, no `fuente`: ya es el arte del paquete y no debe rotarse otra vez con el tema.
        <MasterIconBg size={104} style={estilos.centrado}><Image resizeMode="contain" source={ilustracion} style={estilos.arte} /></MasterIconBg>
      ) : null}
      {titulo ? <Texto accessibilityRole="header" style={estilos.titulo}>{titulo}</Texto> : null}
      <Texto style={estilos.texto}>{texto}</Texto>
      {pistas.length > 0 ? (
        <View style={estilos.pistas}>
          {pistas.map((pista) => (
            <View key={pista.texto} style={estilos.pista}>
              <MasterIconBg size={38}><MasterIcon alTema name={pista.icono} size={22} /></MasterIconBg>
              <Texto style={estilos.pistaTexto}>{pista.texto}</Texto>
            </View>
          ))}
        </View>
      ) : null}
      {accion ? <View style={estilos.boton}><MasterButton color={color} iconoIzquierda={accion.Icono} onPress={accion.onPress}>{accion.texto}</MasterButton></View> : null}
      {accionSecundaria ? (
        <MasterButton color="#FFFFFF" colorSombra="#E4DDF0" colorTexto={color} iconoIzquierda={accionSecundaria.Icono} onPress={accionSecundaria.onPress}>{accionSecundaria.texto}</MasterButton>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 8, paddingBottom: 6, paddingTop: 4 },
  arte: { height: 84, width: 84 },
  centrado: { alignSelf: 'center' },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 19, marginTop: 4, textAlign: 'center' },
  texto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingHorizontal: 8, textAlign: 'center' },
  pistas: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
  pista: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  pistaTexto: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 17 },
  boton: { marginTop: 8 },
});
