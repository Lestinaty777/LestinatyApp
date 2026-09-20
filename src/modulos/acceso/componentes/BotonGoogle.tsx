import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';

// Botón plano con el logo oficial de Google — deliberadamente NO usa
// BotonAcceso (tema de colores rotativos de PantallaAcceso) ni MasterButton
// (verde de marca Lestinaty): las guías de marca de Google piden un botón
// neutro propio, distinto del resto de la UI. Sin dependencias de tema, así
// se puede usar tanto en las pantallas de acceso/ como en onboarding/.
function LogoGoogle({ size = 18 }: { size?: number }) {
  const esc = useEscala();
  return (
    <Svg height={size} viewBox="0 0 18 18" width={size}>
      <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill={esc.jade.l59a} />
      <Path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </Svg>
  );
}

// `cargando` (spinner, mientras el picker/la sesión de Google está en curso)
// y `deshabilitado` (gris, sin spinner — ej. falta aceptar términos) son
// distintos a propósito: mostrar el spinner cuando en realidad no hay nada
// cargando confundiría al usuario haciéndole pensar que el botón está
// procesando algo.
export function BotonGoogle({ cargando, deshabilitado, onPress, texto = 'Continuar con Google' }: { cargando?: boolean; deshabilitado?: boolean; onPress: () => void; texto?: string }) {
  const bloqueado = cargando || deshabilitado;
  return (
    <Pressable
      accessibilityLabel={texto}
      accessibilityRole="button"
      disabled={bloqueado}
      onPress={onPress}
      style={({ pressed }) => [s.boton, bloqueado && s.botonDeshabilitado, pressed && !bloqueado && s.botonPresionado]}
    >
      {cargando ? <ActivityIndicator color="#3C4043" size="small" /> : <View style={s.contenido}><LogoGoogle /><Texto style={s.texto}>{texto}</Texto></View>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  boton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  botonPresionado: { backgroundColor: '#F8F9FA' },
  botonDeshabilitado: { opacity: 0.6 },
  contenido: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  texto: { color: '#3C4043', fontFamily: 'Montserrat-SemiBold', fontSize: 14 },
});
