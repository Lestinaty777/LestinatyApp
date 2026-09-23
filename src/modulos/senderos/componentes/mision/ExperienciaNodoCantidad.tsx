import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Minus, Plus } from 'lucide-react-native';

import { MasterButton, MasterCircularProgressBar, MasterGlass, Rebote, Texto, useTintarHex } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { reproducirSonido } from '../../../../nucleo/dispositivo/sonido';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { useMisionHabito } from './useMisionHabito';
import { FlujoCelebracionMandala } from './FlujoCelebracionMandala';

// Spec 1B, reconstruida sobre el sistema Master: dial = MasterCircularProgressBar
// (se tiñe del paquete del hábito), tarjeta y botones del stepper = MasterGlass,
// CTA = MasterButton.
export function ExperienciaNodoCantidad() {
  const params = useLocalSearchParams<{ habitoId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const mision = useMisionHabito(params.habitoId ?? '');
  const [conteo, setConteo] = useState(0);

  useEffect(() => {
    if (mision.habito?.valorHoy !== undefined) setConteo(mision.habito.valorHoy);
  }, [mision.habito?.valorHoy]);

  const colorPaquete = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');
  const meta = mision.habito?.meta ?? 1;
  const unidad = mision.habito?.unidad || t('senderos.mision.unidadVeces');
  const porcentaje = Math.min(100, Math.round((conteo / Math.max(1, meta)) * 100));

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <ContenidoCantidad
        cargando={mision.consulta.isLoading}
        color={colorPaquete}
        conteo={conteo}
        meta={meta}
        onRegistrar={() => { hapticSeguro('confirmacion'); void reproducirSonido('exito'); mision.enviarRegistro(conteo); }}
        onRestar={() => { hapticSeguro('seleccion'); void reproducirSonido('clickSuave'); setConteo((prev) => Math.max(0, prev - 1)); }}
        onSumar={() => { hapticSeguro('seleccion'); void reproducirSonido('clickSuave'); setConteo((prev) => prev + 1); }}
        onTerminado={() => router.back()}
        paqueteId={mision.habito?.paqueteId ?? ''}
        porcentaje={porcentaje}
        registrado={mision.registrar.isSuccess}
        registrando={mision.registrar.isPending}
        resultado={mision.registrar.data}
        titulo={mision.habito?.titulo}
        unidad={unidad}
      />
    </TonoDelHabito>
  );
}

// Aparte a propósito: useEscala() debe leerse dentro del TonoDelHabito.
function ContenidoCantidad({ cargando, color, conteo, meta, onRegistrar, onRestar, onSumar, onTerminado, paqueteId, porcentaje, registrado, registrando, resultado, titulo, unidad }: {
  cargando: boolean;
  color: string;
  conteo: number;
  meta: number;
  onRegistrar: () => void;
  onRestar: () => void;
  onSumar: () => void;
  onTerminado: () => void;
  paqueteId: string;
  porcentaje: number;
  registrado: boolean;
  registrando: boolean;
  resultado: ResultadoRegistroHabito | undefined;
  titulo: string | undefined;
  unidad: string;
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
      <MasterGlass style={styles.tarjeta}>
        <Texto style={[styles.meta, { color }]}>{t('senderos.mision.objetivoConteo', { meta, unidad })}</Texto>
        <View style={styles.dialCentro}>
          <MasterCircularProgressBar colorBase={color} grosor={14} porcentaje={porcentaje} tamano={190}>
            <Texto style={[styles.numeroGrande, { color: esc.hoja.l22 }]}>{conteo}</Texto>
            <Texto style={[styles.unidadTexto, { color: esc.musgo.l42 }]}>{unidad}</Texto>
          </MasterCircularProgressBar>
        </View>
        <View style={styles.stepperFila}>
          <Rebote
            accessibilityLabel={t('senderos.mision.restar')}
            estilo={[styles.stepperBtn, (conteo <= 0 || registrando) && styles.stepperBtnApagado]}
            onPress={conteo <= 0 || registrando ? undefined : onRestar}
          >
            <MasterGlass style={styles.stepperBtnGlass}><Minus color={conteo <= 0 ? '#9CA3AF' : color} size={24} strokeWidth={3} /></MasterGlass>
          </Rebote>
          <Texto style={[styles.stepperInfo, { color: esc.musgo.l42 }]}>{t('senderos.mision.ajustaRepeticiones')}</Texto>
          <Rebote
            accessibilityLabel={t('senderos.mision.sumar')}
            estilo={[styles.stepperBtn, registrando && styles.stepperBtnApagado]}
            onPress={registrando ? undefined : onSumar}
          >
            <MasterGlass colorBase={color} style={styles.stepperBtnGlass}><Plus color="#FFFFFF" size={24} strokeWidth={3} /></MasterGlass>
          </Rebote>
        </View>
        <MasterButton color={color} disabled={registrando || registrado || conteo <= 0} onPress={onRegistrar} style={styles.boton}>
          {t('senderos.mision.registrarConteo', { conteo, unidad: unidad.toUpperCase() }).trim()}
        </MasterButton>
      </MasterGlass>
      <FlujoCelebracionMandala color={color} onTerminado={onTerminado} paqueteId={paqueteId} resultado={resultado} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, gap: 20, paddingHorizontal: 20 },
  centroCarga: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  tarjeta: { alignItems: 'center', borderRadius: 26, padding: 20, width: '100%' },
  meta: { fontFamily: 'Montserrat-SemiBold', fontSize: 12 },
  dialCentro: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  numeroGrande: { fontFamily: 'MontserratAlternates-Bold', fontSize: 48, lineHeight: 52 },
  unidadTexto: { fontFamily: 'Montserrat-Medium', fontSize: 13 },
  stepperFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, width: '100%' },
  stepperBtn: { borderRadius: 27 },
  stepperBtnApagado: { opacity: 0.4 },
  stepperBtnGlass: { alignItems: 'center', borderRadius: 27, height: 54, justifyContent: 'center', width: 54 },
  stepperInfo: { flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 11, paddingHorizontal: 12, textAlign: 'center' },
  boton: { marginTop: 14, width: '100%' },
});
