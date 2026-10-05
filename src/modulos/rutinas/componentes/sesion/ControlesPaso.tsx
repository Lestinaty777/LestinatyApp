import { Minus, Pause, Play, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterProgressbar, Rebote, Texto } from '../../../../diseno';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { formatoReloj, segundosRestantes } from '../../sesionRutina';
import type { PasoRutina } from '../../rutinas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494' };

type Props = {
  color: string;
  ocupado: boolean;
  paso: PasoRutina;
  /** Completa el paso; `valor` solo se usa en pasos propios (avance de un contador). */
  onCompletar: (valor?: number) => void;
};

/** Qué control muestra un paso: solo los propios con cronómetro o contador tienen uno real; el resto es un "Hecho". */
export function ControlPaso({ color, ocupado, onCompletar, paso }: Props) {
  if (paso.origen === 'propio' && paso.modo === 'cronometro' && paso.objetivoValor) {
    return <ControlCronometro color={color} minutos={paso.objetivoValor} ocupado={ocupado} onCompletar={() => onCompletar(paso.objetivoValor ?? 1)} />;
  }
  if (paso.origen === 'propio' && paso.modo === 'contador' && paso.objetivoValor) {
    return <ControlContador color={color} inicial={paso.valor ?? 0} meta={paso.objetivoValor} ocupado={ocupado} onCompletar={onCompletar} unidad={paso.unidad} />;
  }
  return <ControlHecho color={color} ocupado={ocupado} onCompletar={() => onCompletar()} paso={paso} />;
}

function ControlHecho({ color, ocupado, onCompletar, paso }: { color: string; ocupado: boolean; onCompletar: () => void; paso: PasoRutina }) {
  const { t } = useTranslation();
  return (
    <View style={estilos.bloque}>
      {paso.origen !== 'propio' ? <Texto style={estilos.ayuda}>{t('rutinas.sesion.curso.externoHint')}</Texto> : null}
      <MasterButton color={color} disabled={ocupado} onPress={onCompletar}>{t('rutinas.sesion.curso.hecho')}</MasterButton>
    </View>
  );
}

function ControlContador({ color, inicial, meta, ocupado, onCompletar, unidad }: {
  color: string; inicial: number; meta: number; ocupado: boolean; onCompletar: (valor?: number) => void; unidad: string | null;
}) {
  const { t } = useTranslation();
  const [cuenta, setCuenta] = useState(Math.min(inicial, meta));
  const llego = cuenta >= meta;
  const cambiar = (delta: number) => { hapticSeguro('seleccion'); setCuenta((actual) => Math.max(0, Math.min(meta, actual + delta))); };
  return (
    <View style={estilos.bloque}>
      <Texto accessibilityLiveRegion="polite" style={estilos.grande}>{t('rutinas.sesion.curso.progreso', { valor: cuenta, meta })}{unidad ? ` ${unidad}` : ''}</Texto>
      <MasterProgressbar altura={12} colorBase={color} porcentaje={Math.round((cuenta * 100) / meta)} />
      <View style={estilos.contadorFila}>
        <Rebote accessibilityLabel={t('rutinas.sesion.curso.menos')} disabled={cuenta === 0} onPress={() => cambiar(-1)} estilo={[estilos.redondo, cuenta === 0 && { opacity: 0.4 }]}><Minus color={C.texto} size={26} /></Rebote>
        <Rebote accessibilityLabel={t('rutinas.sesion.curso.mas')} disabled={llego} onPress={() => cambiar(1)} estilo={[estilos.redondo, { backgroundColor: color }, llego && { opacity: 0.4 }]}><Plus color="#FFFFFF" size={26} /></Rebote>
      </View>
      {/* Con la meta alcanzada se completa; antes de eso, "Siguiente" guarda el avance parcial y sigue (0 = nada que guardar). */}
      <MasterButton color={color} disabled={ocupado} onPress={() => onCompletar(cuenta)}>{llego ? t('rutinas.sesion.curso.listo') : t('rutinas.sesion.curso.siguiente')}</MasterButton>
    </View>
  );
}

function ControlCronometro({ color, minutos, ocupado, onCompletar }: { color: string; minutos: number; ocupado: boolean; onCompletar: () => void }) {
  const { t } = useTranslation();
  const totalSeg = Math.round(minutos * 60);
  const [estado, setEstado] = useState<'quieto' | 'corriendo' | 'pausado'>('quieto');
  const [restante, setRestante] = useState(totalSeg);
  // La hora de fin (no un contador que decrece) es lo que manda: si la app pasa a segundo plano
  // y vuelve, el tiempo restante sale bien de la hora real.
  const finMs = useRef(0);
  const alTerminar = useRef(onCompletar);
  alTerminar.current = onCompletar;

  useEffect(() => {
    if (estado !== 'corriendo') return undefined;
    const reloj = setInterval(() => {
      const faltan = segundosRestantes(finMs.current, Date.now());
      setRestante(faltan);
      if (faltan <= 0) {
        clearInterval(reloj);
        setEstado('quieto');
        hapticSeguro('confirmacion');
        alTerminar.current();
      }
    }, 250);
    return () => clearInterval(reloj);
  }, [estado]);

  function alternar() {
    hapticSeguro('seleccion');
    if (estado === 'corriendo') { setEstado('pausado'); return; }
    finMs.current = Date.now() + restante * 1000;
    setEstado('corriendo');
  }

  return (
    <View style={estilos.bloque}>
      <Texto accessibilityLabel={t('rutinas.sesion.curso.restante', { tiempo: formatoReloj(restante) })} style={estilos.reloj}>{formatoReloj(restante)}</Texto>
      <MasterProgressbar altura={12} colorBase={color} porcentaje={Math.round(((totalSeg - restante) * 100) / totalSeg)} />
      <MasterButton color={color} disabled={ocupado} iconoIzquierda={estado === 'corriendo' ? Pause : Play} onPress={alternar}>
        {estado === 'corriendo' ? t('rutinas.sesion.curso.pausar') : estado === 'pausado' ? t('rutinas.sesion.curso.reanudar') : t('rutinas.sesion.curso.empezarReloj')}
      </MasterButton>
      <Rebote accessibilityLabel={t('rutinas.sesion.curso.listoAntes')} disabled={ocupado} onPress={() => { setEstado('quieto'); onCompletar(); }} estilo={estilos.secundario}>
        <Texto style={estilos.secundarioTexto}>{t('rutinas.sesion.curso.listoAntes')}</Texto>
      </Rebote>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 16 },
  ayuda: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  grande: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 34, textAlign: 'center' },
  reloj: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 64, lineHeight: 72, textAlign: 'center' },
  contadorFila: { flexDirection: 'row', gap: 24, justifyContent: 'center' },
  redondo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 36, height: 72, justifyContent: 'center', width: 72 },
  secundario: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secundarioTexto: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 14 },
});
