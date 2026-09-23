import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, RotateCcw } from 'lucide-react-native';

import { MasterButton, MasterGlass, Rebote, Texto, useTintarHex } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { reproducirSonido } from '../../../../nucleo/dispositivo/sonido';
import {
  detenerCronometroNativo,
  iniciarCronometroNativo,
  obtenerEstadoCronometroNativo,
  pausarCronometroNativo,
  reanudarCronometroNativo,
  suscribirEventoCronometro,
} from '../../../../../modules/habito-widget';
import { sincronizarSesionesCronometroPendientes } from '../../../habitos/cronometro.servicio';
import type { ResultadoRegistroHabito } from '../../../habitos/tipos';
import { RelojCronometro } from './RelojCronometro';
import { useMisionHabito } from './useMisionHabito';
import { FlujoCelebracionMandala } from './FlujoCelebracionMandala';

// Spec 1C, reconstruida sobre el sistema Master: el reloj es RelojCronometro
// (versión hero del cronómetro de los widgets SDUI — corona, pulsador,
// cristal — con el anillo real MasterCircularProgressBar por dentro,
// teñido del paquete del hábito). El cronómetro nativo no cambia.
export function ExperienciaNodoDuracion() {
  const params = useLocalSearchParams<{ habitoId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const mision = useMisionHabito(params.habitoId ?? '');
  const habitoId = params.habitoId ?? '';

  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sesionNativaActivaRef = useRef(false);

  useEffect(() => {
    if (mision.habito?.valorHoy !== undefined && !corriendo) setSegundos(mision.habito.valorHoy * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mision.habito?.valorHoy]);

  useEffect(() => {
    if (corriendo) {
      intervaloRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } else if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }
    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [corriendo]);

  useEffect(() => {
    if (!habitoId) return;
    let vigente = true;
    obtenerEstadoCronometroNativo().then((estado) => {
      if (!vigente || estado.habitoId !== habitoId) return;
      sesionNativaActivaRef.current = estado.activo;
      setSegundos(estado.segundos);
      setCorriendo(estado.corriendo);
    });
    return () => { vigente = false; };
  }, [habitoId]);

  useEffect(() => {
    if (!habitoId) return () => {};
    return suscribirEventoCronometro((evento) => {
      if (evento.habitoId !== habitoId) return;
      if (evento.tipo === 'pausado') { setSegundos(evento.segundos); setCorriendo(false); }
      else if (evento.tipo === 'reanudado') setCorriendo(true);
      else if (evento.tipo === 'finalizado') {
        sesionNativaActivaRef.current = false;
        setCorriendo(false);
        setSegundos(0);
        void sincronizarSesionesCronometroPendientes();
      }
    });
  }, [habitoId]);

  const colorPaquete = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');
  const meta = mision.habito?.meta ?? 25;
  const porcentaje = Math.min(100, Math.round(((segundos / 60) / Math.max(1, meta)) * 100));

  function alternarCorrerPausar() {
    hapticSeguro('accion');
    void reproducirSonido(corriendo ? 'clickSuave' : 'exito');
    setCorriendo((c) => {
      const nuevo = !c;
      if (nuevo) {
        if (sesionNativaActivaRef.current) reanudarCronometroNativo();
        else { sesionNativaActivaRef.current = true; iniciarCronometroNativo({ color: colorPaquete, habitoId, segundosIniciales: segundos, titulo: mision.habito?.titulo || '' }); }
      } else {
        pausarCronometroNativo();
      }
      return nuevo;
    });
  }

  function reiniciar() {
    hapticSeguro('seleccion');
    void reproducirSonido('clickSuave');
    setCorriendo(false);
    setSegundos(0);
    sesionNativaActivaRef.current = false;
    detenerCronometroNativo();
  }

  function terminarYGuardar() {
    setCorriendo(false);
    sesionNativaActivaRef.current = false;
    detenerCronometroNativo();
    void reproducirSonido('exito');
    mision.enviarRegistro(Math.max(1, Math.round(segundos / 60)));
  }

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <ContenidoDuracion
        cargando={mision.consulta.isLoading}
        color={colorPaquete}
        corriendo={corriendo}
        meta={meta}
        onAlternar={alternarCorrerPausar}
        onReiniciar={reiniciar}
        onTerminado={() => router.back()}
        onTerminarYGuardar={terminarYGuardar}
        paqueteId={mision.habito?.paqueteId ?? ''}
        porcentaje={porcentaje}
        registrado={mision.registrar.isSuccess}
        registrando={mision.registrar.isPending}
        resultado={mision.registrar.data}
        segundos={segundos}
        titulo={mision.habito?.titulo}
      />
    </TonoDelHabito>
  );
}

// Aparte a propósito: useEscala() debe leerse dentro del TonoDelHabito.
function ContenidoDuracion({ cargando, color, corriendo, meta, onAlternar, onReiniciar, onTerminado, onTerminarYGuardar, paqueteId, porcentaje, registrado, registrando, resultado, segundos, titulo }: {
  cargando: boolean;
  color: string;
  corriendo: boolean;
  meta: number;
  onAlternar: () => void;
  onReiniciar: () => void;
  onTerminado: () => void;
  onTerminarYGuardar: () => void;
  paqueteId: string;
  porcentaje: number;
  registrado: boolean;
  registrando: boolean;
  resultado: ResultadoRegistroHabito | undefined;
  segundos: number;
  titulo: string | undefined;
}) {
  const insets = useSafeAreaInsets();
  const esc = useEscala();
  const { t } = useTranslation();

  const minutos = Math.floor(segundos / 60);
  const segundosResto = segundos % 60;
  const textoTiempo = `${String(minutos).padStart(2, '0')}:${String(segundosResto).padStart(2, '0')}`;

  if (cargando) {
    return <View style={styles.centroCarga}><ActivityIndicator color={color} /></View>;
  }

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97, paddingBottom: insets.bottom + 32, paddingTop: insets.top + 32 }]}>
      <Texto style={[styles.titulo, { color: esc.hoja.l22 }]}>{titulo}</Texto>
      <View style={styles.dialCentro}>
        <RelojCronometro colorBase={color} grosor={18} porcentaje={porcentaje} tamano={280}>
          <Texto style={[styles.numeroGrande, { color: corriendo ? color : esc.hoja.l22 }]}>{textoTiempo}</Texto>
          <Texto style={[styles.metaTexto, { color: esc.musgo.l42 }]}>{t('senderos.mision.cronoMeta', { meta, minutos: Math.round((segundos / 60) * 10) / 10 })}</Texto>
        </RelojCronometro>
      </View>
      <Texto style={[styles.estadoTexto, { color: corriendo ? color : esc.musgo.l42 }]}>{corriendo ? t('senderos.mision.cronoActivo') : t('senderos.mision.cronoPausa')}</Texto>
      <MasterGlass style={styles.tarjeta}>
        <View style={styles.botonera}>
          <Rebote
            accessibilityLabel={t('senderos.mision.reiniciarTiempo')}
            estilo={[styles.secundarioBtn, (segundos === 0 || registrando) && styles.botonApagado]}
            onPress={segundos === 0 || registrando ? undefined : onReiniciar}
          >
            <MasterGlass style={styles.secundarioGlass}><RotateCcw color={esc.musgo.l42} size={18} strokeWidth={2.4} /></MasterGlass>
          </Rebote>
          <Rebote
            accessibilityLabel={corriendo ? t('senderos.mision.pausarSesion') : t('senderos.mision.comenzarSesion')}
            estilo={[styles.principalBtn, registrando && styles.botonApagado]}
            onPress={registrando ? undefined : onAlternar}
          >
            <MasterGlass colorBase={color} style={styles.principalGlass}>
              {corriendo ? <Pause color="#FFFFFF" fill="#FFFFFF" size={26} /> : <Play color="#FFFFFF" fill="#FFFFFF" size={26} />}
            </MasterGlass>
          </Rebote>
        </View>
        <MasterButton color={color} disabled={registrando || registrado || segundos < 30} onPress={onTerminarYGuardar} style={styles.boton}>
          {t('senderos.mision.terminarGuardar', { minutos: Math.max(1, Math.round(segundos / 60)) })}
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
  estadoTexto: { fontFamily: 'Montserrat-SemiBold', fontSize: 11, letterSpacing: 0.8 },
  dialCentro: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  numeroGrande: { fontFamily: 'MontserratAlternates-Bold', fontSize: 40, letterSpacing: 1.5 },
  metaTexto: { fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 4 },
  botonera: { alignItems: 'center', flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 14 },
  secundarioBtn: { borderRadius: 24 },
  botonApagado: { opacity: 0.4 },
  secundarioGlass: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  principalBtn: { borderRadius: 32 },
  principalGlass: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  boton: { marginTop: 14, width: '100%' },
});
