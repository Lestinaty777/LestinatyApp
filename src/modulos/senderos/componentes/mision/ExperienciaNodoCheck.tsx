import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterButton, MasterCircularProgressBar, MasterGlass, Texto, useTintarHex } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { useMisionHabito } from './useMisionHabito';
import { FlujoCelebracionMandala } from './FlujoCelebracionMandala';

const DURACION_MANTENER_MS = 7000;
const INTERVALO_MS = 60;

// Spec 1A, reconstruida sobre el sistema Master: el anillo de "mantener" es
// el mismo MasterCircularProgressBar que el resto de la app (se tiñe solo
// del paquete del hábito vía TonoDelHabito), el punto central es un
// MasterGlass real, la alternativa accesible es un MasterButton.
export function ExperienciaNodoCheck() {
  const params = useLocalSearchParams<{ habitoId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const mision = useMisionHabito(params.habitoId ?? '');
  const [porcentaje, setPorcentaje] = useState(0);
  const [manteniendo, setManteniendo] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicioRef = useRef(0);

  const colorPaquete = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');

  function limpiarIntervalo() {
    if (intervaloRef.current) { clearInterval(intervaloRef.current); intervaloRef.current = null; }
  }

  function completar() {
    if (mision.registrar.isPending || mision.registrar.isSuccess) return;
    hapticSeguro('confirmacion');
    mision.enviarRegistro(1);
  }

  function iniciarPresion() {
    if (mision.registrar.isPending || mision.registrar.isSuccess) return;
    hapticSeguro('seleccion');
    setManteniendo(true);
    inicioRef.current = Date.now();
    limpiarIntervalo();
    intervaloRef.current = setInterval(() => {
      const transcurrido = Date.now() - inicioRef.current;
      const nuevo = Math.min(100, (transcurrido / DURACION_MANTENER_MS) * 100);
      setPorcentaje(nuevo);
      if (nuevo >= 100) {
        limpiarIntervalo();
        setManteniendo(false);
        completar();
      }
    }, INTERVALO_MS);
  }

  function soltarPresion() {
    limpiarIntervalo();
    setManteniendo(false);
    setPorcentaje(0);
  }

  useEffect(() => () => limpiarIntervalo(), []);

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <ContenidoCheck
        cargando={mision.consulta.isLoading}
        color={colorPaquete}
        onCompletar={completar}
        onIniciarPresion={iniciarPresion}
        onSoltarPresion={soltarPresion}
        onTerminado={() => router.back()}
        manteniendo={manteniendo}
        porcentaje={porcentaje}
        registrando={mision.registrar.isPending}
        resultado={mision.registrar.data}
        registrado={mision.registrar.isSuccess}
        paqueteId={mision.habito?.paqueteId ?? ''}
        titulo={mision.habito?.titulo}
      />
    </TonoDelHabito>
  );
}

// Componente aparte a propósito: useEscala() debe leerse DENTRO del
// TonoDelHabito que lo envuelve arriba, no antes — de lo contrario tomaría
// el tema global en vez del tono del paquete del hábito.
function ContenidoCheck({ cargando, color, manteniendo, onCompletar, onIniciarPresion, onSoltarPresion, onTerminado, paqueteId, porcentaje, registrado, registrando, resultado, titulo }: {
  cargando: boolean;
  color: string;
  manteniendo: boolean;
  onCompletar: () => void;
  onIniciarPresion: () => void;
  onSoltarPresion: () => void;
  onTerminado: () => void;
  paqueteId: string;
  porcentaje: number;
  registrado: boolean;
  registrando: boolean;
  resultado: ResultadoRegistroHabito | undefined;
  titulo: string | undefined;
}) {
  const insets = useSafeAreaInsets();
  const esc = useEscala();
  const { t } = useTranslation();

  if (cargando) {
    return <View style={styles.centroCarga}><ActivityIndicator color={color} /></View>;
  }

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97, paddingBottom: insets.bottom + 32, paddingTop: insets.top + 40 }]}>
      <Texto style={[styles.titulo, { color: esc.hoja.l22 }]}>{titulo}</Texto>
      <View style={styles.centro}>
        <Pressable
          accessibilityHint={t('habitos.mandala.check.mantenerAccesibilidad')}
          accessibilityLabel={titulo ?? ''}
          onPressIn={onIniciarPresion}
          onPressOut={onSoltarPresion}
        >
          <MasterCircularProgressBar colorBase={color} grosor={16} porcentaje={porcentaje} tamano={240}>
            <MasterGlass style={styles.puntoGlass}><View style={styles.puntoBlanco} /></MasterGlass>
          </MasterCircularProgressBar>
        </Pressable>
        <Texto style={[styles.instruccion, { color: esc.musgo.l42 }]}>{manteniendo ? t('habitos.mandala.check.manteniendo') : t('habitos.mandala.check.instruccion')}</Texto>
      </View>
      <MasterButton color={color} disabled={registrando || registrado} onPress={onCompletar} style={styles.boton}>
        {t('habitos.mandala.check.botonAlternativo')}
      </MasterButton>
      <FlujoCelebracionMandala color={color} onTerminado={onTerminado} paqueteId={paqueteId} resultado={resultado} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  centroCarga: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  puntoGlass: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  puntoBlanco: { backgroundColor: '#FFFFFF', borderRadius: 8, height: 16, width: 16 },
  instruccion: { fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 24, textAlign: 'center' },
  boton: { marginBottom: 12, width: '100%' },
});
