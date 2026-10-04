import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Check, Minus, Pause, Play } from 'lucide-react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { MasterIconBg, MasterRingBar, Rebote, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

// Mismo dorado que CrearTareaWizard/TareasPantalla (COLOR_TEMA_WIZARD /
// COLOR_PAQUETE_TAREAS) — acá de nuevo porque ninguno de los dos lo exporta,
// mismo criterio que ya usan esos archivos entre sí.
const COLOR_GOLDEN_TAREAS = '#FFAE00';

type WidgetProgresoTareaProps = {
  color?: string | null;
  guardando: boolean;
  meta: number;
  onGuardar: (valor: number) => void;
  tipo: 'contador' | 'cronometro';
  titulo: string;
  unidad: string | null;
  valorInicial: number;
};

/**
 * Reemplazo de WidgetRegistrarProgreso para el detalle de contador/cronómetro
 * de Tareas: siempre dorado (nunca el '#1A1335' oscuro de fallback), botones
 * MasterIconBg + iconos de lucide (igual que el resto de la app), el lado
 * izquierdo es un MasterRingBar (el anillo de la pantalla de espera del
 * wizard de Hábitos, formalizado como componente reusable) para contador, y
 * el reloj clásico del widget de cronómetro del SDUI (WidgetCronometro.tsx)
 * para cronómetro. Sin botón de cerrar: la fila se colapsa tocándola de
 * nuevo (ver TimelineTareasHoy.tsx), acá sería redundante.
 */
export function WidgetProgresoTarea({ color, guardando, meta, onGuardar, tipo, titulo, unidad, valorInicial }: WidgetProgresoTareaProps) {
  const s = useEstilosS();
  const acento = color ?? COLOR_GOLDEN_TAREAS;

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)} style={s.raiz}>
      {tipo === 'contador' ? (
        <ContadorTarea acento={acento} guardando={guardando} meta={meta} onGuardar={onGuardar} titulo={titulo} unidad={unidad} valorInicial={valorInicial} />
      ) : (
        <CronometroTarea acento={acento} guardando={guardando} meta={meta} onGuardar={onGuardar} titulo={titulo} valorInicial={valorInicial} />
      )}
    </Animated.View>
  );
}

function ContadorTarea({ acento, guardando, meta, onGuardar, titulo, unidad, valorInicial }: {
  acento: string; guardando: boolean; meta: number; onGuardar: (valor: number) => void; titulo: string; unidad: string | null; valorInicial: number;
}) {
  const s = useEstilosS();
  const { t } = useTranslation();
  const [valor, setValor] = useState(valorInicial);
  // Si el valor real cambia por fuera (ej. el acceso rápido del círculo del
  // timeline completa la meta mientras este widget está abierto), el estado
  // local tiene que seguirlo — si no, el próximo +/- parte de un número
  // viejo y puede verse como si "se hubiera descompletado".
  useEffect(() => { setValor(valorInicial); }, [valorInicial]);
  const porcentaje = Math.min(100, Math.round((valor / Math.max(1, meta)) * 100));

  const cambiar = (delta: number) => {
    const siguiente = Math.max(0, valor + delta);
    setValor(siguiente);
    hapticSeguro('seleccion');
    onGuardar(siguiente);
  };

  return (
    <View style={s.fila}>
      <MasterRingBar color={acento} grosor={9} porcentaje={porcentaje} tamano={60}>
        <Texto style={[s.anilloValor, { color: acento }]}>{valor}</Texto>
      </MasterRingBar>
      <View style={s.textos}>
        <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>
        <Texto numberOfLines={1} style={s.sub}>{t('habitos.crearWizard.progressWidget.goalQuantity', { meta, unit: unidad || t('habitos.crearWizard.progressWidget.defaultUnit') })}</Texto>
      </View>
      <View style={s.controles}>
        <Rebote accessibilityLabel={t('habitos.crearWizard.progressWidget.subtract')} disabled={guardando || valor <= 0} onPress={() => cambiar(-1)} estilo={{ opacity: valor <= 0 ? 0.4 : 1 }}>
          <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} size={32} tinte={acento}><Minus color={acento} size={14} strokeWidth={2.5} /></MasterIconBg>
        </Rebote>
        <Rebote accessibilityLabel={t('habitos.crearWizard.progressWidget.add')} disabled={guardando} onPress={() => cambiar(1)}>
          <MasterIconBg colorBordeInicio={acento} colorBordeFin={acento} size={32} tinte={acento}>
            {guardando ? <ActivityIndicator color={acento} size="small" /> : <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 16 }}>+</Texto>}
          </MasterIconBg>
        </Rebote>
      </View>
    </View>
  );
}

function CronometroTarea({ acento, guardando, meta, onGuardar, titulo, valorInicial }: {
  acento: string; guardando: boolean; meta: number; onGuardar: (valor: number) => void; titulo: string; valorInicial: number;
}) {
  const s = useEstilosS();
  const { t } = useTranslation();
  const [segundos, setSegundos] = useState(valorInicial * 60);
  const [corriendo, setCorriendo] = useState(false);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mismo motivo que en ContadorTarea — pero solo si no está corriendo, para
  // no pisarle el conteo en vivo a quien tiene el cronómetro activo.
  useEffect(() => { if (!corriendo) setSegundos(valorInicial * 60); }, [valorInicial, corriendo]);

  useEffect(() => {
    if (!corriendo) return;
    intervalo.current = setInterval(() => setSegundos((actual) => actual + 1), 1000);
    return () => { if (intervalo.current) clearInterval(intervalo.current); };
  }, [corriendo]);

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(restoSegundos).padStart(2, '0')}`;
  const metaSegundos = Math.max(1, meta * 60);
  const progreso = Math.min(1, segundos / metaSegundos);

  const alternar = () => { hapticSeguro('accion'); setCorriendo((actual) => !actual); };
  const guardar = () => { setCorriendo(false); hapticSeguro('confirmacion'); onGuardar(Math.max(1, Math.round(segundos / 60))); };

  // Reloj clásico (corona + botón lateral + aguja + anillo de progreso) — el
  // mismo dibujo del widget de cronómetro del SDUI (WidgetCronometro.tsx),
  // acá con el progreso creciendo HACIA la meta en vez de contando hacia
  // atrás desde una duración fija.
  const cx = 26; const cy = 30; const r = 19;
  const circunferencia = 2 * Math.PI * r;
  const offset = circunferencia - progreso * circunferencia;

  return (
    <View style={s.fila}>
      <View style={s.relojContenedor}>
        <Svg height="56" viewBox="0 0 52 56" width="52">
          <Rect fill="#8C8C8C" height="5" rx="2" width="10" x="21" y="1" />
          <G transform={`rotate(45 ${cx} ${cy})`}><Rect fill="#666666" height="5" rx="1" width="3" x={cx - 1.5} y={cy - r - 5} /></G>
          <Circle cx={cx} cy={cy} fill="rgba(0,0,0,0.02)" r={r + 4} stroke="rgba(0,0,0,0.1)" strokeWidth={1.5} />
          <Circle cx={cx} cy={cy} fill="none" r={r} stroke={`${acento}30`} strokeWidth={5} />
          <Circle cx={cx} cy={cy} fill="none" r={r} stroke={acento} strokeDasharray={circunferencia} strokeDashoffset={offset} strokeLinecap="round" strokeWidth={5} transform={`rotate(-90 ${cx} ${cy})`} />
          {!corriendo && <Path d={`M${cx} ${cy} L${cx} ${cy - 10}`} stroke="#8C8C8C" strokeLinecap="round" strokeWidth={2} />}
          <Circle cx={cx} cy={cy} fill="#AAAAAA" r="2.5" />
        </Svg>
      </View>
      <View style={s.textos}>
        <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>
        <Texto style={[s.tiempoTexto, { color: acento }]}>{tiempoFormateado}</Texto>
      </View>
      <View style={s.controles}>
        <Rebote accessibilityLabel={corriendo ? t('habitos.crearWizard.progressWidget.pauseTimer') : t('habitos.crearWizard.progressWidget.startTimer')} onPress={alternar}>
          <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} size={32} tinte={acento}>
            {corriendo ? <Pause color={acento} fill={acento} size={13} /> : <Play color={acento} fill={acento} size={13} />}
          </MasterIconBg>
        </Rebote>
        <Rebote accessibilityLabel={t('habitos.crearWizard.progressWidget.saveTime')} disabled={guardando || segundos === 0} onPress={guardar} estilo={{ opacity: segundos === 0 ? 0.4 : 1 }}>
          <MasterIconBg colorBordeInicio={acento} colorBordeFin={acento} size={32} tinte={acento}>
            {guardando ? <ActivityIndicator color={acento} size="small" /> : <Check color={acento} size={15} strokeWidth={3} />}
          </MasterIconBg>
        </Rebote>
      </View>
    </View>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, width: '100%' },
  fila: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  relojContenedor: { alignItems: 'center', height: 56, justifyContent: 'center', width: 52 },
  anilloValor: { fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  textos: { flex: 1, gap: 2, minWidth: 0 },
  titulo: { color: esc.hoja.l22, fontFamily: 'MontserratAlternates-Bold', fontSize: 14.5, lineHeight: 18 },
  sub: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 10.5, lineHeight: 13 },
  tiempoTexto: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, fontVariant: ['tabular-nums'] },
  controles: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();
function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) { valor = crearEstilosS(esc); estilosPorEscalaS.set(esc, valor); }
  return valor;
}
