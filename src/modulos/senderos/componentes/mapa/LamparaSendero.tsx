import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

type LamparaSenderoProps = {
  retraso?: number;
  tamano?: number;
};

export function LamparaSendero({ retraso = 0, tamano = 26 }: LamparaSenderoProps) {
  const brillo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(Animated.sequence([
      Animated.delay(retraso),
      Animated.timing(brillo, { duration: 1450, toValue: 1, useNativeDriver: true }),
      Animated.timing(brillo, { duration: 1450, toValue: 0, useNativeDriver: true }),
    ]));
    animacion.start();
    return () => animacion.stop();
  }, [brillo, retraso]);

  const opacidadHalo = brillo.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.34] });
  const escalaHalo = brillo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] });

  return (
    <View style={[styles.raiz, { height: tamano * 1.46, width: tamano }]}>
      <Animated.View pointerEvents="none" style={[styles.halo, { opacity: opacidadHalo, transform: [{ scale: escalaHalo }] }]} />
      <Svg height={tamano * 1.46} viewBox="0 0 13 19" width={tamano}>
        <Defs>
          <RadialGradient cx="50%" cy="36%" id="luzLampara" r="72%">
            <Stop offset="0" stopColor="#FFFDE0" />
            <Stop offset="0.42" stopColor="#FEF963" />
            <Stop offset="1" stopColor="#E9C53C" />
          </RadialGradient>
        </Defs>
        <Path d="M0 14.5556L6.59028 19V15.7407L0 11.1975V14.5556Z" fill="#A67F3D" />
        <Path d="M6.59028 15.7407L0 11.1975L6.59028 7L13 11.3457L6.59028 15.7407Z" fill="#8D6E39" />
        <Path d="M13 11.3457L6.59028 15.7407V19L13 14.5556V11.3457Z" fill="#C49D5E" />
        <Path d="M6.62684 13.2536L11.689 10.0783L6.62684 7.17908L1.47266 10.0783L6.62684 13.2536ZM2.57712 10.0783L6.62684 12.4712L10.5845 10.0783L6.62684 7.82334L2.57712 10.0783Z" fill="#606060" fillRule="evenodd" />
        <Path d="M6.62684 13.2536L1.47266 10.0783V11.4128L6.62684 14.5881V13.2536Z" fill="#464646" />
        <Path d="M6.62684 14.5881L11.689 11.4128V10.0783L6.62684 13.2536V14.5881Z" fill="#7E7E7E" />
        <Path d="M6.62699 12.4675V7.42294L5.84465 7.0873V11.3671L3.22154 9.84843V5.52266L2.53125 5.09229V10.0325L6.62699 12.4675Z" fill="#8A683B" />
        <Path d="M6.62699 12.4675L10.6307 10V5.04759L9.98641 5.49015V9.84843L7.31728 11.3671V7.05479L6.62699 7.42294V12.4675Z" fill="#A47D4A" />
        <Path d="M3.22154 5.52266V9.84843L5.84465 11.3671V7.0873L3.22154 5.52266Z" fill="url(#luzLampara)" />
        <Path d="M9.98641 9.84843V5.49015L7.31728 7.05479V11.3671L9.98641 9.84843Z" fill="url(#luzLampara)" />
        <Path d="M1.79492 4.6478L6.62697 7.593V6.1204L1.79492 3.31325V4.6478Z" fill="#464646" />
        <Path d="M6.62697 7.593L11.367 4.6478V3.31325L6.62697 6.1204V7.593Z" fill="#7E7E7E" />
        <Path d="M6.62697 6.1204L11.367 3.31325L6.62697 0.368042L1.79492 3.31325L6.62697 6.1204Z" fill="#464646" />
        <Path d="M6.62697 5.24628V6.07462L11.2749 3.31349L6.67299 0.138184L1.79492 3.31349L6.62697 6.07462V5.24628L3.22153 3.22145L6.62697 0.782448L10.0324 3.22145L6.62697 5.24628Z" fill="#606060" />
        <Path d="M6.62676 4.00364L3.35938 2.07085V3.26734L6.62676 5.20013V4.00364Z" fill="#464646" />
        <Path d="M6.62676 5.20013L9.89414 3.26734V2.07085L6.62676 4.00364V5.20013Z" fill="#6D6B6B" />
        <Path d="M6.62676 4.00364L9.89414 2.07085L6.62676 0L3.35938 2.07085L6.62676 4.00364V2.62308L5.01608 1.65668L6.62676 0.506208L8.19142 1.65668L6.62676 2.62308V4.00364Z" fill="#5A5A5A" />
        <Path d="M6.67282 2.6232V1.97894L5.2002 1.10458V1.70282L6.67282 2.6232Z" fill="#3A3939" />
        <Path d="M8.14544 1.10458L6.67282 1.97894V2.6232L8.14544 1.70282V1.10458Z" fill="#727272" />
        <Path d="M6.67282 1.97894L8.14544 1.10458L6.67282 0.138184L5.2002 1.10458L6.67282 1.97894Z" fill="#6A6868" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    backgroundColor: '#FFF06A',
    borderRadius: 999,
    height: 24,
    position: 'absolute',
    top: 4,
    width: 24,
  },
});
