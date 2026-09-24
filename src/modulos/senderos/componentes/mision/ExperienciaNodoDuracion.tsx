import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pause, Play, RotateCcw } from 'lucide-react-native';

import { useTintarHex } from '../../../../diseno';
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
import { calcularHitos } from './hitosMision';
import { PantallaMisionAnillo } from './PantallaMisionAnillo';
import { useMisionHabito } from './useMisionHabito';

function formatearMmSs(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const segundosResto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundosResto).padStart(2, '0')}`;
}

// Spec 1C sobre el shell compartido PantallaMisionAnillo: anillo "arena" con
// el tiempo transcurrido en el centro, hitos a 20/50/80/100% de la meta en
// minutos. El cronómetro nativo (Android) no cambia — sigue siendo la
// misma fuente de verdad de segundos/corriendo.
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

  const color = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');
  const meta = mision.habito?.meta ?? 25;
  const minutosActuales = segundos / 60;
  const porcentaje = Math.min(100, Math.round((minutosActuales / Math.max(1, meta)) * 100));

  function alternarCorrerPausar() {
    hapticSeguro('accion');
    void reproducirSonido(corriendo ? 'clickSuave' : 'exito');
    setCorriendo((c) => {
      const nuevo = !c;
      if (nuevo) {
        if (sesionNativaActivaRef.current) reanudarCronometroNativo();
        else { sesionNativaActivaRef.current = true; iniciarCronometroNativo({ color, habitoId, segundosIniciales: segundos, titulo: mision.habito?.titulo || '' }); }
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

  const hitos = calcularHitos(meta, minutosActuales, (valor) => `${valor}min`);
  const textoPrincipal = corriendo
    ? t('senderos.mision.pausarSesion')
    : segundos > 0
      ? t('senderos.mision.continuarSesion')
      : t('senderos.mision.comenzarSesion');

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <PantallaMisionAnillo
        botonPrincipalDisabled={mision.registrar.isPending}
        botonPrincipalIcono={corriendo ? Pause : Play}
        botonPrincipalTexto={textoPrincipal}
        botonReiniciarDisabled={segundos === 0 || mision.registrar.isPending}
        botonReiniciarIcono={RotateCcw}
        botonReiniciarTexto={t('senderos.mision.reiniciarTiempo')}
        botonTerminarDisabled={mision.registrar.isPending || mision.registrar.isSuccess || segundos < 30}
        botonTerminarTexto={t('senderos.mision.terminar')}
        cargando={mision.consulta.isLoading}
        chipTexto={t('senderos.mision.chipSesionHoy', { minutos: meta })}
        color={color}
        hitos={hitos}
        iconoLucide={mision.habito?.iconoLucide}
        onBotonPrincipal={alternarCorrerPausar}
        onBotonReiniciar={reiniciar}
        onBotonTerminar={terminarYGuardar}
        onTerminado={() => router.back()}
        paqueteId={mision.habito?.paqueteId ?? ''}
        porcentaje={porcentaje}
        resultado={mision.registrar.data}
        titulo={mision.habito?.titulo}
        valorMetaTexto={t('senderos.mision.deValor', { valor: formatearMmSs(meta * 60) })}
        valorPrincipalTexto={formatearMmSs(segundos)}
      />
    </TonoDelHabito>
  );
}
