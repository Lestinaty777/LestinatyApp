import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Check, Minus, Pause, Play, Plus, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { MasterIcon, Rebote, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { TipoMetaHabito } from '../tipos';

type WidgetRegistrarProgresoProps = {
  guardando: boolean;
  meta: number;
  onCerrar: () => void;
  onGuardar: (valor: number) => void;
  tipoMeta: TipoMetaHabito;
  titulo: string;
  unidad: string | null;
  valorInicial: number;
  colorBase?: string;
};

// Reemplaza, dentro del mismo recuadro superior de la pestaña Senderos (mismo
// glass verde o acorde al bioma), la vista de progreso general por un control
// interactivo de registro diario ágil, tactile y elegante.
export function WidgetRegistrarProgreso({
  colorBase = '#21A844',
  guardando,
  meta,
  onCerrar,
  onGuardar,
  tipoMeta,
  titulo,
  unidad,
  valorInicial,
}: WidgetRegistrarProgresoProps) {
  const { t } = useTranslation();
  const hecho = valorInicial > 0;
  const color = colorBase;

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(180)} style={s.raiz}>
      {/* Icono temático del tipo de registro */}
      <View style={[s.iconoAura, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
        <MasterIcon
          name={tipoMeta === 'duracion' ? 'reloj' : tipoMeta === 'cantidad' ? 'progreso' : 'hoja'}
          color={2}
          size={18}
        />
      </View>

      {/* Textos descriptivos */}
      <View style={s.textos}>
        <View style={s.kickerFila}>
          <View style={[s.kickerPill, { backgroundColor: `${color}15` }]}>
            <Texto style={[s.kickerTexto, { color }]}>
              {tipoMeta === 'duracion' ? t('habitos.progressWidget.time') : tipoMeta === 'cantidad' ? t('habitos.progressWidget.count') : t('habitos.progressWidget.register')}
            </Texto>
          </View>
          {hecho && (
            <View style={s.badgeCompletado}>
              <Check color="#21A844" size={9} strokeWidth={3} />
              <Texto style={s.badgeCompletadoTexto}>{t('habitos.progressWidget.readyToday')}</Texto>
            </View>
          )}
        </View>

        <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>

        <Texto numberOfLines={1} style={s.sub}>
          {tipoMeta === 'check'
            ? (hecho ? t('habitos.progressWidget.habitLogged') : t('habitos.progressWidget.tapToMark'))
            : tipoMeta === 'cantidad'
            ? t('habitos.progressWidget.goalQuantity', { meta, unit: unidad || t('habitos.progressWidget.defaultUnit') })
            : t('habitos.progressWidget.goalDuration', { meta })}
        </Texto>
      </View>

      {/* Controles interactivos según tipoMeta */}
      <View style={s.controlesContenedor}>
        {tipoMeta === 'check' && (
          <ControlCheck
            color={color}
            guardando={guardando}
            onGuardar={onGuardar}
            valorInicial={valorInicial}
          />
        )}
        {tipoMeta === 'cantidad' && (
          <ControlContador
            color={color}
            guardando={guardando}
            meta={meta}
            onGuardar={onGuardar}
            valorInicial={valorInicial}
          />
        )}
        {tipoMeta === 'duracion' && (
          <ControlCronometro
            color={color}
            guardando={guardando}
            onGuardar={onGuardar}
            valorInicial={valorInicial}
          />
        )}

        {/* Botón cerrar */}
        <Rebote
          accessibilityLabel={t('habitos.progressWidget.close')}
          hitSlop={8}
          onPress={() => {
            hapticSeguro('seleccion');
            onCerrar();
          }}
          estilo={s.cerrar}
        >
          <X color="#2F523B" size={15} strokeWidth={2.5} />
        </Rebote>
      </View>
    </Animated.View>
  );
}

function ControlCheck({
  color,
  guardando,
  onGuardar,
  valorInicial,
}: {
  color: string;
  guardando: boolean;
  onGuardar: (valor: number) => void;
  valorInicial: number;
}) {
  const { t } = useTranslation();
  const hecho = valorInicial > 0;
  return (
    <Rebote
      accessibilityLabel={hecho ? t('habitos.progressWidget.habitCompleted') : t('habitos.progressWidget.completeHabit')}
      deshabilitado={guardando}
      onPress={() => {
        hapticSeguro('confirmacion');
        onGuardar(hecho ? 0 : 1);
      }}
      estilo={[
        s.botonCheck,
        {
          backgroundColor: hecho ? color : 'rgba(255, 255, 255, 0.85)',
          borderColor: hecho ? color : `${color}55`,
        },
      ]}
    >
      {guardando ? (
        <ActivityIndicator color={hecho ? '#FFFFFF' : color} size="small" />
      ) : (
        <Check color={hecho ? '#FFFFFF' : `${color}88`} size={20} strokeWidth={hecho ? 3.5 : 2.5} />
      )}
    </Rebote>
  );
}

function ControlContador({
  color,
  guardando,
  meta,
  onGuardar,
  valorInicial,
}: {
  color: string;
  guardando: boolean;
  meta: number;
  onGuardar: (valor: number) => void;
  valorInicial: number;
}) {
  const { t } = useTranslation();
  const [valor, setValor] = useState(valorInicial);
  const porcentaje = Math.min(100, Math.round((valor / Math.max(1, meta)) * 100));

  const cambiar = (delta: number) => {
    const siguiente = Math.max(0, valor + delta);
    setValor(siguiente);
    hapticSeguro('seleccion');
    onGuardar(siguiente);
  };

  return (
    <View style={s.contadorFila}>
      <Rebote
        accessibilityLabel={t('habitos.progressWidget.subtract')}
        deshabilitado={guardando || valor <= 0}
        onPress={() => cambiar(-1)}
        estilo={[
          s.botonStepper,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: `${color}35`,
            opacity: valor <= 0 ? 0.45 : 1,
          },
        ]}
      >
        <Minus color={valor <= 0 ? '#888888' : color} size={14} strokeWidth={2.5} />
      </Rebote>

      <View style={s.contadorDisplay}>
        <View style={s.contadorNumeros}>
          <Texto style={[s.contadorValor, { color }]}>{valor}</Texto>
          <Texto style={s.contadorMeta}>/{meta}</Texto>
        </View>
        <View style={s.miniTrack}>
          <View style={[s.miniBarra, { backgroundColor: color, width: `${porcentaje}%` }]} />
        </View>
      </View>

      <Rebote
        accessibilityLabel={t('habitos.progressWidget.add')}
        deshabilitado={guardando}
        onPress={() => cambiar(1)}
        estilo={[s.botonStepper, { backgroundColor: color, borderColor: color }]}
      >
        <Plus color="#FFFFFF" size={14} strokeWidth={3} />
      </Rebote>
    </View>
  );
}

function ControlCronometro({
  color,
  guardando,
  onGuardar,
  valorInicial,
}: {
  color: string;
  guardando: boolean;
  onGuardar: (valor: number) => void;
  valorInicial: number;
}) {
  const { t } = useTranslation();
  const [segundos, setSegundos] = useState(valorInicial * 60);
  const [corriendo, setCorriendo] = useState(false);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!corriendo) return;
    intervalo.current = setInterval(() => setSegundos((actual) => actual + 1), 1000);
    return () => {
      if (intervalo.current) clearInterval(intervalo.current);
    };
  }, [corriendo]);

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(restoSegundos).padStart(2, '0')}`;

  const alternar = () => {
    hapticSeguro('accion');
    setCorriendo((actual) => !actual);
  };

  const guardar = () => {
    setCorriendo(false);
    hapticSeguro('confirmacion');
    onGuardar(Math.max(1, Math.round(segundos / 60)));
  };

  return (
    <View style={s.cronometroFila}>
      <View style={[s.cajaTiempo, { borderColor: corriendo ? `${color}55` : 'rgba(255,255,255,0.7)' }]}>
        <View style={[s.puntoLuz, { backgroundColor: corriendo ? '#22C55E' : '#94A3B8' }]} />
        <Texto style={[s.tiempoTexto, { color }]}>{tiempoFormateado}</Texto>
      </View>

      <Rebote
        accessibilityLabel={corriendo ? t('habitos.progressWidget.pauseTimer') : t('habitos.progressWidget.startTimer')}
        onPress={alternar}
        estilo={[s.botonStepper, { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: `${color}35` }]}
      >
        {corriendo ? (
          <Pause color={color} fill={color} size={13} />
        ) : (
          <Play color={color} fill={color} size={13} />
        )}
      </Rebote>

      <Rebote
        accessibilityLabel={t('habitos.progressWidget.saveTime')}
        deshabilitado={guardando || segundos === 0}
        onPress={guardar}
        estilo={[
          s.botonStepper,
          {
            backgroundColor: segundos > 0 ? color : 'rgba(0,0,0,0.06)',
            borderColor: segundos > 0 ? color : 'transparent',
            opacity: segundos === 0 ? 0.45 : 1,
          },
        ]}
      >
        {guardando ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Check color={segundos > 0 ? '#FFFFFF' : '#888888'} size={15} strokeWidth={3} />
        )}
      </Rebote>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  iconoAura: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  textos: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  kickerFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  kickerPill: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  kickerTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  badgeCompletado: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 168, 68, 0.14)',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  badgeCompletadoTexto: {
    color: '#15803D',
    fontFamily: 'Montserrat-Bold',
    fontSize: 8.5,
  },
  titulo: {
    color: '#143D1F',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14.5,
    lineHeight: 18,
  },
  sub: {
    color: '#4A7F5D',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10.5,
    lineHeight: 13,
  },
  controlesContenedor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cerrar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  botonCheck: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  contadorFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  botonStepper: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  contadorDisplay: {
    alignItems: 'center',
    gap: 2,
    minWidth: 42,
  },
  contadorNumeros: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 1,
  },
  contadorValor: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  contadorMeta: {
    color: '#5B8C65',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
  },
  miniTrack: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 2,
    height: 3,
    overflow: 'hidden',
    width: 34,
  },
  miniBarra: {
    borderRadius: 2,
    height: '100%',
  },
  cronometroFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cajaTiempo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  puntoLuz: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  tiempoTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12.5,
    letterSpacing: 0.5,
  },
});
