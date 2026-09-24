import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Extrapolation, interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { MasterButton, MasterGlass, Texto, useTintarHex } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { useMisionHabito } from './useMisionHabito';
import { FlujoCelebracionMandala } from './FlujoCelebracionMandala';
import { EncabezadoMision } from './EncabezadoMision';
import { ACTOS_SELLO } from './selloCoreografia';
import { SelloCargaInteractiva, useSelloMantener } from './SelloCargaInteractiva';

// Check de un día: mantener presionado 7 segundos el sello (ver
// selloCoreografia.ts para los actos). Al sellar se registra el día, pero la
// salida al mapa espera a que el punto de luz termine de subir — la
// celebración no corta el clímax.
export function ExperienciaNodoCheck() {
  const params = useLocalSearchParams<{ habitoId: string }>();
  const router = useRouter();
  const esm = useTintarHex();
  const mision = useMisionHabito(params.habitoId ?? '');
  const [manteniendo, setManteniendo] = useState(false);
  const [climaxTerminado, setClimaxTerminado] = useState(false);

  const colorPaquete = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');
  const semilla = mision.habito?.titulo ?? 'mandala';

  const selloMantener = useSelloMantener({
    onClimaxTerminado: () => setClimaxTerminado(true),
    onCompleto: () => {
      setManteniendo(false);
      if (mision.registrar.isPending || mision.registrar.isSuccess) return;
      mision.enviarRegistro(1);
    },
    semilla,
  });

  // Si el registro falla, el sello vuelve a empezar en vez de quedar vacío.
  const fallo = mision.registrar.isError;
  useEffect(() => {
    if (!fallo) return;
    hapticSeguro('accion');
    setClimaxTerminado(false);
    selloMantener.reiniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallo]);

  function iniciarPresion() {
    if (mision.registrar.isPending || mision.registrar.isSuccess) return;
    setManteniendo(true);
    selloMantener.iniciar();
  }

  function soltarPresion() {
    setManteniendo(false);
    selloMantener.soltar();
  }

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <ContenidoCheck
        ascenso={selloMantener.ascenso}
        cargando={mision.consulta.isLoading}
        color={colorPaquete}
        manteniendo={manteniendo}
        onCompletar={() => { if (!mision.registrar.isPending && !mision.registrar.isSuccess) selloMantener.completarAhora(); }}
        onIniciarPresion={iniciarPresion}
        onSoltarPresion={soltarPresion}
        onTerminado={() => router.back()}
        paqueteId={mision.habito?.paqueteId ?? ''}
        progreso={selloMantener.progreso}
        registrado={mision.registrar.isSuccess}
        registrando={mision.registrar.isPending}
        resultado={climaxTerminado ? mision.registrar.data : undefined}
        sello={selloMantener.sello}
        semilla={semilla}
        titulo={mision.habito?.titulo}
      />
    </TonoDelHabito>
  );
}

// Componente aparte a propósito: useEscala() debe leerse DENTRO del
// TonoDelHabito que lo envuelve arriba, no antes — de lo contrario tomaría
// el tema global en vez del tono del paquete del hábito.
function ContenidoCheck({ ascenso, cargando, color, manteniendo, onCompletar, onIniciarPresion, onSoltarPresion, onTerminado, paqueteId, progreso, registrado, registrando, resultado, sello, semilla, titulo }: {
  ascenso: SharedValue<number>;
  cargando: boolean;
  color: string;
  manteniendo: boolean;
  onCompletar: () => void;
  onIniciarPresion: () => void;
  onSoltarPresion: () => void;
  onTerminado: () => void;
  paqueteId: string;
  progreso: SharedValue<number>;
  registrado: boolean;
  registrando: boolean;
  resultado: ResultadoRegistroHabito | undefined;
  sello: SharedValue<number>;
  semilla: string;
  titulo: string | undefined;
}) {
  const insets = useSafeAreaInsets();
  const esc = useEscala();
  const { t } = useTranslation();

  // El mundo se apaga mientras se carga el sello: la geometría pastel brilla
  // sobre la penumbra. Al soltar, la luz vuelve junto con el progreso.
  const estiloPenumbra = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, ACTOS_SELLO.encendido[1], ACTOS_SELLO.convergencia[1]], [0, 0.62, 0.9], Extrapolation.CLAMP),
  }));
  const estiloPie = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, progreso.value * 4) }));

  if (cargando) {
    return <View style={styles.centroCarga}><ActivityIndicator color={color} /></View>;
  }

  const sellando = manteniendo || registrando || registrado;

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97, paddingBottom: insets.bottom + 32 }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.penumbra, estiloPenumbra]} />
      <EncabezadoMision color={color} titulo={titulo} />
      <View style={styles.centro}>
        <Pressable
          accessibilityHint={t('habitos.mandala.check.mantenerAccesibilidad')}
          accessibilityLabel={titulo ?? ''}
          onPressIn={onIniciarPresion}
          onPressOut={onSoltarPresion}
        >
          <SelloCargaInteractiva ascenso={ascenso} colorBase={color} paqueteId={paqueteId} progreso={progreso} sello={sello} semilla={semilla} tamano={300}>
            <MasterGlass style={styles.puntoGlass}><View style={styles.puntoBlanco} /></MasterGlass>
          </SelloCargaInteractiva>
        </Pressable>
        <Texto style={[styles.instruccion, { color: sellando ? 'rgba(255, 255, 255, 0.78)' : esc.musgo.l42 }]}>
          {sellando ? t('habitos.mandala.check.manteniendo') : t('habitos.mandala.check.instruccion')}
        </Texto>
      </View>
      <Animated.View pointerEvents={sellando ? 'none' : 'auto'} style={[styles.pie, estiloPie]}>
        <MasterButton color={color} disabled={registrando || registrado} onPress={onCompletar} style={styles.boton}>
          {t('habitos.mandala.check.botonAlternativo')}
        </MasterButton>
      </Animated.View>
      <FlujoCelebracionMandala color={color} onTerminado={onTerminado} paqueteId={paqueteId} resultado={resultado} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  penumbra: { backgroundColor: 'rgba(7, 16, 12, 1)' },
  centroCarga: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  puntoGlass: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  puntoBlanco: { backgroundColor: '#FFFFFF', borderRadius: 8, height: 16, width: 16 },
  instruccion: { fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 24, textAlign: 'center' },
  pie: { width: '100%' },
  boton: { marginBottom: 12, width: '100%' },
});
