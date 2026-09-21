import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, CheckCircle2, Flame, Trophy, Info, Plus } from 'lucide-react-native';

import { MasterGlass, Texto, Rebote, MasterIcon, MasterProgressbar } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useTranslation } from 'react-i18next';

const { width: ANCHO_PANTALLA } = Dimensions.get('window');
const C = {
  texto: '#1A1335',
  tenue: ESCALA_ESMERALDA.musgo.l51,
  verde: ESCALA_ESMERALDA.jade.l50,
  verdeFondo: ESCALA_ESMERALDA.hoja.l95,
  naranja: '#EA580C',
  dorado: '#EAB308',
  glass: 'rgba(255,255,255,0.85)',
  glassBorde: 'rgba(255,255,255,0.95)',
};

type TipoWidget = 'racha_2x2' | 'habitos_4x2' | 'aby_3x2' | 'semana_4x2';

interface Props {
  visible: boolean;
  onCerrar: () => void;
}

export function GaleriaWidgetsModal({ visible, onCerrar }: Props) {
  const { t } = useTranslation();
  const esc = useEscala();
  const s = useEstilosS();
  const insets = useSafeAreaInsets();
  const [widgetActivo, setWidgetActivo] = useState<TipoWidget>('racha_2x2');

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
      onRequestClose={onCerrar}
    >
      <LinearGradient
        colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]}
        style={[s.raiz, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      >
        {/* Cabecera del Modal */}
        <View style={s.header}>
          <View>
            <View style={s.etiquetaPro}>
              <Sparkles color={C.verde} size={13} />
              <Texto style={s.etiquetaProTexto}>{t('insights.gallery.tag')}</Texto>
            </View>
            <Texto style={s.titulo}>{t('insights.gallery.title')}</Texto>
            <Texto style={s.subtitulo}>{t('insights.gallery.subtitle')}</Texto>
          </View>
          <TouchableOpacity accessibilityLabel={t('insights.gallery.closeAccessibility')} onPress={onCerrar} style={s.botonCerrar}>
            <X color={C.texto} size={20} />
          </TouchableOpacity>
        </View>

        {/* Selector de Pestañas de Widgets */}
        <View style={s.pillsContenedor}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsScroll}>
            {[
              { id: 'racha_2x2', etiqueta: t('insights.gallery.tabs.streak') },
              { id: 'habitos_4x2', etiqueta: t('insights.gallery.tabs.habits') },
              { id: 'aby_3x2', etiqueta: t('insights.gallery.tabs.aby') },
              { id: 'semana_4x2', etiqueta: t('insights.gallery.tabs.weekly') },
            ].map((p) => {
              const activo = widgetActivo === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setWidgetActivo(p.id as TipoWidget)}
                  style={[s.pill, activo && s.pillActiva]}
                >
                  <Texto style={[s.pillTexto, activo && s.pillTextoActivo]}>{p.etiqueta}</Texto>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.contenido}>
          {/* Maqueta de Teléfono / Vista Previa */}
          <View style={s.simuladorFondo}>
            <View style={s.barraNotificacionesSimulada}>
              <Texto style={s.relojSimulado}>9:41</Texto>
              <View style={s.iconosSimulados}>
                <View style={s.puntoSimulado} />
                <View style={s.puntoSimulado} />
              </View>
            </View>

            {/* Renderizado de vista previa según el widget activo */}
            <View style={s.areaWidget}>
              {widgetActivo === 'racha_2x2' && <PreviewWidgetRacha2x2 />}
              {widgetActivo === 'habitos_4x2' && <PreviewWidgetHabitos4x2 />}
              {widgetActivo === 'aby_3x2' && <PreviewWidgetAby3x2 />}
              {widgetActivo === 'semana_4x2' && <PreviewWidgetSemana4x2 />}
            </View>

            <Texto style={s.pieSimulador}>{t('insights.gallery.previewFooter')}</Texto>
          </View>

          {/* Guía rápida de instalación */}
          <MasterGlass style={s.guiaCard}>
            <View style={s.guiaHeader}>
              <Info color={C.verde} size={18} />
              <Texto style={s.guiaTitulo}>{t('insights.gallery.guideTitle')}</Texto>
            </View>
            <View style={s.guiaPaso}>
              <View style={s.guiaNumero}><Texto style={s.guiaNumeroTexto}>1</Texto></View>
              <Texto style={s.guiaTexto}>{t('insights.gallery.guideStep1')}</Texto>
            </View>
            <View style={s.guiaPaso}>
              <View style={s.guiaNumero}><Texto style={s.guiaNumeroTexto}>2</Texto></View>
              <Texto style={s.guiaTexto}>
                {t('insights.gallery.guideStep2Prefix')}
                <Texto style={{ fontFamily: 'Montserrat-Bold' }}>{t('insights.gallery.guideStep2Widgets')}</Texto>
                {t('insights.gallery.guideStep2Suffix')}
              </Texto>
            </View>
            <View style={s.guiaPaso}>
              <View style={s.guiaNumero}><Texto style={s.guiaNumeroTexto}>3</Texto></View>
              <Texto style={s.guiaTexto}>{t('insights.gallery.guideStep3')}</Texto>
            </View>
          </MasterGlass>

          {/* Botón de acción */}
          <Rebote estilo={s.botonAccion} onPress={onCerrar}>
            <Plus color="#FFF" size={18} />
            <Texto style={s.botonAccionTexto}>{t('insights.gallery.actionButton')}</Texto>
          </Rebote>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES DE VISTA PREVIA DE LOS WIDGETS
// ─────────────────────────────────────────────────────────────

function PreviewWidgetRacha2x2() {
  const { t } = useTranslation();
  const s = useEstilosS();
  return (
    <View style={s.widget2x2Wrapper}>
      <MasterGlass style={s.widget2x2Glass}>
        <View style={s.wRachaTop}>
          <Image
            source={require('../../../../assets/icons/hoy/racha.png')}
            style={{ width: 34, height: 34, resizeMode: 'contain' }}
          />
          <View style={s.wRachaBadge}>
            <Texto style={s.wRachaDias}>12</Texto>
            <Texto style={s.wRachaLabel}>{t('insights.gallery.previewStreak.days')}</Texto>
          </View>
        </View>

        <View style={s.wRachaMedio}>
          <Texto style={s.wRachaTitulo}>{t('insights.gallery.previewStreak.title')}</Texto>
          <Texto style={s.wRachaSub}>{t('insights.gallery.previewStreak.habitsToday')}</Texto>
        </View>

        <View style={s.wRachaBarra}>
          <MasterProgressbar altura={7} porcentaje={80} />
        </View>
      </MasterGlass>
    </View>
  );
}

function PreviewWidgetHabitos4x2() {
  const { t } = useTranslation();
  const s = useEstilosS();
  const habitos = [
    { id: '1', nombre: t('insights.gallery.previewHabits.habit1'), hecho: true, icono: 'cerebro' },
    { id: '2', nombre: t('insights.gallery.previewHabits.habit2'), hecho: true, icono: 'tomar-agua' },
    { id: '3', nombre: t('insights.gallery.previewHabits.habit3'), hecho: false, icono: 'estudiar' },
  ];

  return (
    <View style={s.widget4x2Wrapper}>
      <MasterGlass style={s.widget4x2Glass}>
        <View style={s.wHabitosHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MasterIcon name="navegacion/insights" size={20} />
            <Texto style={s.wHabitosTitulo}>{t('insights.gallery.previewHabits.title')}</Texto>
          </View>
          <Texto style={s.wHabitosContador}>2/3</Texto>
        </View>

        <View style={s.wHabitosLista}>
          {habitos.map((h) => (
            <View key={h.id} style={s.wHabitoFila}>
              <View style={s.wHabitoCheck}>
                {h.hecho ? (
                  <CheckCircle2 color={C.verde} size={17} strokeWidth={2.5} />
                ) : (
                  <View style={s.wHabitoCheckVacio} />
                )}
              </View>
              <Texto
                numberOfLines={1}
                style={[s.wHabitoNombre, h.hecho && s.wHabitoNombreCompletado]}
              >
                {h.nombre}
              </Texto>
            </View>
          ))}
        </View>
      </MasterGlass>
    </View>
  );
}

function PreviewWidgetAby3x2() {
  const { t } = useTranslation();
  const s = useEstilosS();
  return (
    <View style={s.widget3x2Wrapper}>
      <MasterGlass style={s.widget3x2Glass}>
        <View style={s.wAbyFila}>
          <View style={{ opacity: 0.9 }}><MasterIcon name="cerebro" size={28} /></View>
          <View style={{ flex: 1 }}>
            <Texto style={s.wAbyAutor}>{t('insights.gallery.previewAby.author')}</Texto>
            <Texto style={s.wAbyCita}>{t('insights.gallery.previewAby.quote')}</Texto>
          </View>
        </View>
      </MasterGlass>
    </View>
  );
}

function PreviewWidgetSemana4x2() {
  const { t } = useTranslation();
  const s = useEstilosS();
  const DIAS = t('insights.gallery.previewWeekly.dayLabels', { returnObjects: true }) as string[];
  const PORCENTAJES = [80, 100, 70, 90, 60, 40, 95];

  return (
    <View style={s.widget4x2Wrapper}>
      <MasterGlass style={s.widget4x2Glass}>
        <View style={s.wSemanaHeader}>
          <Texto style={s.wSemanaTitulo}>{t('insights.gallery.previewWeekly.title')}</Texto>
          <Texto style={s.wSemanaValor}>{t('insights.gallery.previewWeekly.average')}</Texto>
        </View>

        <View style={s.wSemanaBarras}>
          {DIAS.map((d, i) => (
            <View key={i} style={s.wSemanaCol}>
              <View style={s.wSemanaBarraFondo}>
                <View style={[s.wSemanaBarraLlena, { height: `${PORCENTAJES[i]}%` }]} />
              </View>
              <Texto style={s.wSemanaDia}>{d}</Texto>
            </View>
          ))}
        </View>
      </MasterGlass>
    </View>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  etiquetaPro: {
    alignItems: 'center',
    backgroundColor: conAlfa(esc.jade.l50, 0.12),
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  etiquetaProTexto: {
    color: C.verde,
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  titulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
  },
  subtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 260,
  },
  botonCerrar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pillsContenedor: {
    marginBottom: 16,
  },
  pillsScroll: {
    gap: 8,
    paddingHorizontal: 20,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActiva: {
    backgroundColor: C.verde,
    borderColor: C.verde,
  },
  pillTexto: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  pillTextoActivo: {
    color: '#FFF',
  },
  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  simuladorFondo: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    paddingTop: 12,
    minHeight: 250,
    justifyContent: 'space-between',
  },
  barraNotificacionesSimulada: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  relojSimulado: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  iconosSimulados: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  puntoSimulado: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  areaWidget: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  pieSimulador: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
  },
  guiaCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  guiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guiaTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  guiaPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guiaNumero: {
    alignItems: 'center',
    backgroundColor: conAlfa(esc.jade.l50, 0.15),
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  guiaNumeroTexto: {
    color: C.verde,
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  guiaTexto: {
    color: C.tenue,
    flex: 1,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  botonAccion: {
    alignItems: 'center',
    backgroundColor: C.verde,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  botonAccionTexto: {
    color: '#FFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },

  // Estilos de Widgets en el simulador
  widget2x2Wrapper: {
    width: 155,
    height: 155,
  },
  widget2x2Glass: {
    borderRadius: 24,
    height: '100%',
    justifyContent: 'space-between',
    padding: 14,
    width: '100%',
  },
  wRachaTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wRachaBadge: {
    alignItems: 'flex-end',
  },
  wRachaDias: {
    color: C.naranja,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 20,
    lineHeight: 22,
  },
  wRachaLabel: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 9,
  },
  wRachaMedio: {
    marginTop: 4,
  },
  wRachaTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  wRachaSub: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    marginTop: 2,
  },
  wRachaBarra: {
    marginTop: 4,
  },

  // 4x2 Hábitos
  widget4x2Wrapper: {
    width: '100%',
    maxWidth: 320,
    height: 140,
  },
  widget4x2Glass: {
    borderRadius: 24,
    height: '100%',
    justifyContent: 'space-between',
    padding: 14,
    width: '100%',
  },
  wHabitosHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wHabitosTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  wHabitosContador: {
    color: C.verde,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  wHabitosLista: {
    gap: 8,
  },
  wHabitoFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wHabitoCheck: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wHabitoCheckVacio: {
    borderColor: conAlfa(esc.jade.l50, 0.4),
    borderRadius: 10,
    borderWidth: 1.5,
    height: 16,
    width: 16,
  },
  wHabitoNombre: {
    color: C.texto,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    flex: 1,
  },
  wHabitoNombreCompletado: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // 3x2 Aby
  widget3x2Wrapper: {
    width: '100%',
    maxWidth: 300,
  },
  widget3x2Glass: {
    borderRadius: 24,
    padding: 14,
    width: '100%',
  },
  wAbyFila: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  wAbyAutor: {
    color: C.verde,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
  },
  wAbyCita: {
    color: C.texto,
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // 4x2 Semana
  wSemanaHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  wSemanaTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  wSemanaValor: {
    color: C.verde,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
  },
  wSemanaBarras: {
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-between',
    gap: 6,
  },
  wSemanaCol: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 4,
  },
  wSemanaBarraFondo: {
    backgroundColor: conAlfa(esc.jade.l50, 0.12),
    borderRadius: 5,
    flex: 1,
    justifyContent: 'flex-end',
    width: '85%',
    overflow: 'hidden',
  },
  wSemanaBarraLlena: {
    backgroundColor: C.verde,
    borderRadius: 5,
    width: '100%',
  },
  wSemanaDia: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 8,
  },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
