import { useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReanimatedView, { Easing as EasingR, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Check, ChevronLeft, ChevronRight, Crown, Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { addDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

import { Boton, MasterChip, MasterColorProvider, MasterGlass, MasterIcon, MasterIconBg, RecuadroGlass, Rebote, Texto, crearTonoMaster, useTonoMaster } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import {
  aceptarPropuestaPlan, agregarSeccionManual, crearPlanManual, editarPlan, ErrorAccesoAby, generarPlanInicial, guardarDetalleSeccionManual,
} from '../planes.servicio';
import type { Disponibilidad, MomentoBloque, PropuestaDia, PropuestaPlanInicial, ValorDisponibilidad } from '../planes.tipos';

// Wizard de creación de Planes — mismo tipo de pantalla que CrearHabitoWizard/
// CrearTareaWizard (Modal full-screen, pasos con puntos de progreso, mismo
// Boton variante="sendero"), con tema aurelia fijo (ver TareasPantalla.tsx:
// Planes usa aurelia completo, no solo un acento suelto).
//
// Dos caminos desde "eleccion" que nunca se mezclan en los mismos pasos:
//   manual → identidad → revision (crea el plan ya mismo; secciones/días se
//   arman después desde DetallePlanPantalla).
//   ia → objetivoCortoIa → contextoIa → plazoIa → ramasIa (dispara la
//   generación, no un simple "Continuar") → revision (muestra la propuesta;
//   "Crear este plan" recién ahí escribe algo real — misma garantía que ya
//   tiene el flujo de estudio de Aby). Pasos separados y cortos en vez de un
//   solo cuadro de texto gigante — en la práctica casi nadie escribe un buen
//   objetivo detallado si se lo pide todo junto.
const PAQUETE_PLANES = 'aurelia';
const COLOR_PAQUETE_PLANES = '#FFD000';
// Naranja fijo para los íconos de "A mano"/"Con Aby" — mismo tono que ya usa
// la categoría "Tareas" del hub de Hoy — a propósito distinto del acento
// aurelia (amarillo) de todo lo demás del wizard, para que esas dos tarjetas
// destaquen por contraste en vez de perderse contra el fondo dorado.
const COLOR_NARANJA = '#F59E0B';

type ModoCreacion = 'ia' | 'manual';
type ClavePaso = 'contextoIa' | 'dificultadIa' | 'disponibilidadIa' | 'eleccion' | 'identidad' | 'objetivoCortoIa' | 'plazoIa' | 'prioridadIa' | 'ramasIa' | 'revision' | 'seccionManual' | 'teaserIa';

const CANTIDAD_RAMAS_MIN = 2;
const CANTIDAD_RAMAS_MAX = 6;

// Selección visual en vez de texto libre para dos señales universales que
// calibran el plan — "nivel/experiencia" es ambigua (¿experiencia en qué?),
// pero "ritmo diario" es objetivo y se aplica a cualquier objetivo. Ninguna
// de las dos pisa el paso de disponibilidad (que sigue siendo por momento
// del día, para armar los bloques) — esto es solo una señal extra para Aby.
type DificultadPlan = 'dificil' | 'facil' | 'intenso' | 'moderado';
type PrioridadPlan = 'aprender' | 'calidad' | 'presupuesto' | 'rapido';
const OPCIONES_DIFICULTAD: { icono: string; valor: DificultadPlan }[] = [
  { icono: 'hoja', valor: 'facil' },
  { icono: 'progreso', valor: 'moderado' },
  { icono: 'energia', valor: 'dificil' },
  { icono: 'montana', valor: 'intenso' },
];
const OPCIONES_PRIORIDAD: { icono: string; valor: PrioridadPlan }[] = [
  { icono: 'rayo', valor: 'rapido' },
  { icono: 'trofeo', valor: 'calidad' },
  { icono: 'tarjeta', valor: 'presupuesto' },
  { icono: 'idea', valor: 'aprender' },
];

// Mismo ejemplo embebido en el prompt de generar-plan-inicial (primeros 2
// días) — se muestra tal cual a quien no tiene Horizon todavía, para que vea
// de verdad cómo arma Aby un plan antes de pedirle que compre nada.
const EJEMPLO_DIAS_TEASER: PropuestaDia[] = [
  {
    bloques: [
      { items: [{ tipo: 'simple', titulo: 'Escribir en una frase que hace la app' }, { tipo: 'simple', titulo: 'Listar las 3 funciones mas importantes' }, { tipo: 'simple', titulo: 'Elegir el nombre de la app' }], mensajeContexto: 'Antes de escribir codigo, tene claro el problema que resuelve.', momento: 'manana' },
      { items: [{ tipo: 'simple', titulo: 'Elegir el framework (ej. React Native)' }, { tipo: 'simple', titulo: 'Instalar el editor de codigo' }], mensajeContexto: 'No hace falta saber todo, solo elegir con que vas a empezar.', momento: 'tarde' },
    ],
  },
  {
    bloques: [
      { items: [{ tipo: 'simple', titulo: 'Instalar Node.js' }, { tipo: 'simple', titulo: 'Instalar el framework elegido' }, { tipo: 'simple', titulo: 'Correr el proyecto de ejemplo' }], mensajeContexto: 'Dejar todo instalado antes de escribir la primera linea real.', momento: 'manana' },
      { items: [{ tipo: 'simple', titulo: 'Crear el repositorio en GitHub' }, { tipo: 'simple', titulo: 'Hacer el primer commit' }], mensajeContexto: 'Un repo desde el dia 1 evita perder trabajo despues.', momento: 'tarde' },
    ],
  },
];

const MOMENTOS_DISPONIBILIDAD: MomentoBloque[] = ['manana', 'tarde', 'noche'];
// Ventana horaria orientativa de cada momento — divide el día despierto en 3
// franjas iguales de 6h. Solo da contexto visual (nunca se envía a Gemini ni
// se guarda) y pone un techo real a "bastante": no tiene sentido pedir más
// minutos de los que la franja tiene.
const VENTANA_MOMENTO: Record<MomentoBloque, { fin: number; inicio: number }> = {
  manana: { fin: 12, inicio: 6 },
  noche: { fin: 24, inicio: 18 },
  tarde: { fin: 18, inicio: 12 },
};
function formatearHora12(hora: number): string {
  const normalizada = hora % 24;
  if (normalizada === 0) return '12am';
  if (normalizada === 12) return '12pm';
  return normalizada > 12 ? `${normalizada - 12}pm` : `${normalizada}am`;
}
function etiquetaVentana(momento: MomentoBloque): string {
  const { fin, inicio } = VENTANA_MOMENTO[momento];
  return `${formatearHora12(inicio)}-${formatearHora12(fin)}`;
}
function minutosMaximosMomento(momento: MomentoBloque): number {
  const { fin, inicio } = VENTANA_MOMENTO[momento];
  return (fin - inicio) * 60;
}
// "Bastante" no es una franja fija — se pide la cantidad exacta de tiempo
// (siempre > 1h, hasta lo que entra en la ventana de ese momento).
const MINUTOS_CUSTOM_MIN = 61;
const MINUTOS_CUSTOM_PASO = 15;
const MINUTOS_CUSTOM_PASO_GRANDE = 60;
const MINUTOS_CUSTOM_DEFAULT = 90;
function formatearDuracion(minutos: number, t: (clave: string, opciones?: Record<string, unknown>) => string): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const partes: string[] = [];
  if (horas > 0) partes.push(t('planes.crear.horasCount', { count: horas }));
  if (resto > 0) partes.push(t('planes.crear.minutosCount', { count: resto }));
  return partes.join(' ');
}

function PuntoProgreso({ activo, color }: { activo: boolean; color: string }) {
  return <View style={{ backgroundColor: activo ? color : '#DDD6E9', borderRadius: 4, flex: 1, height: 5 }} />;
}

function EncabezadoPaso({ icono, subtitulo, titulo }: { icono: string; subtitulo: string; titulo: string }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 11 }}>
      <MasterIcon alTema name={icono} size={52} />
      <View style={{ flex: 1, paddingTop: 1 }}>
        <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 28, lineHeight: 34 }}>{titulo}</Texto>
        <Texto style={{ color: '#7B7494', fontSize: 13, lineHeight: 19 }}>{subtitulo}</Texto>
      </View>
    </View>
  );
}

function TarjetaEleccion({ activa, descripcion, icono, onPress, titulo }: { activa: boolean; descripcion: string; icono: string; onPress: () => void; titulo: string }) {
  const { acento } = useTonoMaster();
  return (
    <Rebote estilo={{ width: '100%' }} onPress={onPress}>
      <MasterGlass style={[{ alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 12, padding: 14, position: 'relative' }, activa && { backgroundColor: conAlfa(acento, 0.12), borderColor: acento }]}>
        <MasterIconBg colorBordeFin={COLOR_NARANJA} colorBordeInicio={COLOR_NARANJA} size={56} tinte={conAlfa(COLOR_NARANJA, 0.55)}>
          <MasterIcon color={4} name={icono} size={40} />
        </MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 }}>{titulo}</Texto>
          <Texto style={{ color: '#7B7494', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{descripcion}</Texto>
        </View>
        {activa && <View style={{ alignItems: 'center', backgroundColor: acento, borderRadius: 11, height: 22, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 22 }}><Check color="#fff" size={12} /></View>}
      </MasterGlass>
    </Rebote>
  );
}

function FilaMomentoDisponibilidad({ momento, onCambiar, valor }: { momento: MomentoBloque; onCambiar: (valor: ValorDisponibilidad | undefined) => void; valor: ValorDisponibilidad | undefined }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  const activo = valor !== undefined;
  const esCustom = typeof valor === 'number';
  const maximoMomento = minutosMaximosMomento(momento);

  function ajustarMinutos(delta: number) {
    const base = esCustom ? valor : Math.min(MINUTOS_CUSTOM_DEFAULT, maximoMomento);
    onCambiar(Math.min(maximoMomento, Math.max(MINUTOS_CUSTOM_MIN, base + delta)));
  }

  return (
    <MasterGlass style={[{ borderRadius: 16, padding: 12 }, activo && { backgroundColor: conAlfa(acento, 0.1), borderColor: acento }]}>
      <Rebote onPress={() => onCambiar(activo ? undefined : 'moderado')}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
          <View style={{ alignItems: 'center', backgroundColor: activo ? acento : conAlfa(acento, 0.12), borderRadius: 11, height: 22, justifyContent: 'center', width: 22 }}>
            {activo && <Check color="#fff" size={13} />}
          </View>
          <Texto style={{ color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 15 }}>{t(`planes.detalle.momento.${momento}`)}</Texto>
          <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 11 }}>{etiquetaVentana(momento)}</Texto>
        </View>
      </Rebote>
      {activo && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <MasterChip activo={valor === 'poco'} onPress={() => onCambiar('poco')} texto={t('planes.crear.nivel.poco')} />
            <MasterChip activo={valor === 'moderado'} onPress={() => onCambiar('moderado')} texto={t('planes.crear.nivel.moderado')} />
            <MasterChip activo={esCustom} onPress={() => onCambiar(esCustom ? valor : Math.min(MINUTOS_CUSTOM_DEFAULT, maximoMomento))} texto={esCustom ? formatearDuracion(valor, t) : t('planes.crear.nivel.bastante')} />
          </View>
          {!esCustom && <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 8 }}>{t('planes.crear.rangoAyuda')}</Texto>}
        </>
      )}
      {activo && esCustom && (
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          <Rebote onPress={() => ajustarMinutos(-MINUTOS_CUSTOM_PASO_GRANDE)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 36 }}>
            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>−1h</Texto>
          </Rebote>
          <Rebote onPress={() => ajustarMinutos(-MINUTOS_CUSTOM_PASO)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }}>
            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 16 }}>−</Texto>
          </Rebote>
          <Texto numberOfLines={1} style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13, minWidth: 92, textAlign: 'center' }}>{formatearDuracion(valor, t)}</Texto>
          <Rebote onPress={() => ajustarMinutos(MINUTOS_CUSTOM_PASO)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }}>
            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 16 }}>+</Texto>
          </Rebote>
          <Rebote onPress={() => ajustarMinutos(MINUTOS_CUSTOM_PASO_GRANDE)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 36 }}>
            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>+1h</Texto>
          </Rebote>
        </View>
      )}
    </MasterGlass>
  );
}

const PLAZO_PRESETS_DIAS = [7, 14, 30, 60, 90];
const PLAZO_DIAS_MIN = 1;
const PLAZO_DIAS_MAX = 365;
const PLAZO_DIAS_DEFAULT = 30;

// Reemplaza al viejo selector de fecha de calendario — pedir "en cuantos
// dias" es mas natural para el usuario, y ademas se le pasa a Aby como
// referencia real de ritmo (la fecha de calendario se deriva despues, solo
// para guardarla y para el tracking de "¿vas atrasado?" que ya existia).
function SelectorPlazoDias({ dias, onCambiar }: { dias: number | null; onCambiar: (dias: number | null) => void }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  const activo = dias !== null;

  function ajustar(delta: number) {
    onCambiar(Math.min(PLAZO_DIAS_MAX, Math.max(PLAZO_DIAS_MIN, (dias ?? PLAZO_DIAS_DEFAULT) + delta)));
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Rebote onPress={() => onCambiar(activo ? null : PLAZO_DIAS_DEFAULT)} estilo={{ alignItems: 'center', backgroundColor: activo ? conAlfa(acento, 0.14) : '#F0EFFE', borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
          <MasterIcon name="reloj" size={14} />
          <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{activo ? t('planes.crear.plazoDiasCount', { count: dias }) : t('planes.crear.plazoAgregar')}</Texto>
        </Rebote>
        {activo && (
          <Rebote onPress={() => onCambiar(null)} estilo={{ alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }}>
            <X color="#9A93A8" size={16} />
          </Rebote>
        )}
      </View>
      {activo && (
        <ReanimatedView.View entering={FadeIn.duration(200)} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PLAZO_PRESETS_DIAS.map((preset) => (
              <MasterChip activo={dias === preset} key={preset} onPress={() => onCambiar(preset)} texto={t('planes.crear.plazoDiasCount', { count: preset })} />
            ))}
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
            <Rebote onPress={() => ajustar(-1)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }}>
              <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 16 }}>−</Texto>
            </Rebote>
            <Texto numberOfLines={1} style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 13, minWidth: 80, textAlign: 'center' }}>{t('planes.crear.plazoDiasCount', { count: dias })}</Texto>
            <Rebote onPress={() => ajustar(1)} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }}>
              <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 16 }}>+</Texto>
            </Rebote>
          </View>
        </ReanimatedView.View>
      )}
    </View>
  );
}

function ListaItemsManual({ items, onCambiar }: { items: string[]; onCambiar: (items: string[]) => void }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, indice) => (
        <View key={indice} style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          <TextInput
            onChangeText={(texto) => onCambiar(items.map((valor, i) => (i === indice ? texto : valor)))}
            placeholder={t('tareas.pantallaCompleta.quickAdd.itemPlaceholder', { count: indice + 1 })}
            placeholderTextColor="#9A93A8"
            style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 12, borderWidth: 1, color: '#1A1335', flex: 1, fontSize: 14, padding: 12 }}
            value={item}
          />
          {items.length > 1 && (
            <Rebote onPress={() => onCambiar(items.filter((_, i) => i !== indice))} estilo={{ alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }}>
              <X color="#9A93A8" size={16} />
            </Rebote>
          )}
        </View>
      ))}
      <Rebote onPress={() => onCambiar([...items, ''])} estilo={{ paddingVertical: 4 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          <Plus color={acento} size={16} />
          <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('tareas.pantallaCompleta.quickAdd.addItem')}</Texto>
        </View>
      </Rebote>
    </View>
  );
}

function VistaPreviaDias({ dias }: { dias: readonly PropuestaDia[] }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      {dias.map((dia, indiceDia) => (
        <MasterGlass key={indiceDia} style={{ borderRadius: 14, padding: 12 }}>
          <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }}>{dia.titulo ?? t('planes.detalle.diaNumero', { numero: indiceDia + 1 })}</Texto>
          {dia.bloques.map((bloque, indiceBloque) => (
            <View key={indiceBloque} style={{ marginTop: 8 }}>
              <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 10, textTransform: 'uppercase' }}>{t(`planes.detalle.momento.${bloque.momento}`)}</Texto>
              {bloque.items.map((item, indiceItem) => (
                <Texto key={indiceItem} style={{ color: '#554E68', fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 2 }}>
                  • {item.titulo}{item.tipo !== 'simple' && item.metaValor ? ` (${item.metaValor}${item.unidad ? ` ${item.unidad}` : ''})` : ''}
                </Texto>
              ))}
            </View>
          ))}
        </MasterGlass>
      ))}
    </View>
  );
}

const PASOS_GENERANDO = ['generandoPaso1', 'generandoPaso2', 'generandoPaso3', 'generandoPaso4'] as const;

// Reemplaza el contenido del paso mientras Gemini responde (puede tardar
// hasta 20s, ver el abortador en generar-plan-inicial/index.ts) — un ícono
// pulsando + mensajes que rotan, para que la espera se sienta viva en vez de
// un botón congelado. Sin Lottie (no es dependencia del proyecto): todo con
// Reanimated, mismo motor que ya usa el resto de este wizard.
function AnimacionGenerandoPlan() {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const escala = useSharedValue(1);
  const [pasoIndice, setPasoIndice] = useState(0);

  useEffect(() => {
    escala.value = withRepeat(withTiming(1.08, { duration: 900, easing: EasingR.inOut(EasingR.quad) }), -1, true);
  }, [escala]);

  useEffect(() => {
    const intervalo = setInterval(() => setPasoIndice((indice) => (indice + 1) % PASOS_GENERANDO.length), 2800);
    return () => clearInterval(intervalo);
  }, []);

  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <View style={{ alignItems: 'center', gap: 18, paddingVertical: 48 }}>
      <ReanimatedView.View style={estiloEscala}>
        <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} size={84} tinte={conAlfa(acento, 0.4)}>
          <MasterIcon alTema name="cerebro" size={48} />
        </MasterIconBg>
      </ReanimatedView.View>
      <ReanimatedView.View entering={FadeIn.duration(260)} key={pasoIndice}>
        <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 14, textAlign: 'center' }}>{t(`planes.crear.${PASOS_GENERANDO[pasoIndice]}`)}</Texto>
      </ReanimatedView.View>
    </View>
  );
}

export function CrearPlanWizard({ onCerrar, onCreado, visible }: { onCerrar: () => void; onCreado: (planId: string) => void; visible: boolean }) {
  const { i18n, t } = useTranslation();
  const localeFecha = i18n.language?.startsWith('en') ? enUS : es;
  const cliente = useQueryClient();
  const router = useRouter();
  const horizon = useHorizon();
  // Solo gatea cuando estamos SEGUROS de que no tiene Horizon — mientras la
  // consulta está cargando, se deja avanzar normalmente (el chequeo real del
  // servidor en generarPlanInicial es el que de verdad protege el acceso).
  const horizonBloqueado = horizon.data === 'inactivo' || horizon.data === 'noDisponible';
  const tono = useMemo(() => crearTonoMaster(PAQUETE_PLANES, COLOR_PAQUETE_PLANES), []);
  const acento = tono.acento;

  function irAlPaywall() {
    onCerrar();
    router.push({ params: { volver: '/(principal)/tareas' }, pathname: '/horizon' });
  }

  const [paso, setPaso] = useState(0);
  const [modo, setModo] = useState<ModoCreacion | null>(null);
  const [tituloManual, setTituloManual] = useState('');
  const [descripcionManual, setDescripcionManual] = useState('');
  // En cuantos dias se quiere lograr, no una fecha de calendario — mas
  // natural de pedir, y se le pasa a Aby como referencia real de ritmo. La
  // fecha real (hoy + plazoDias) se deriva recien al guardar, mas abajo.
  const [plazoDias, setPlazoDias] = useState<number | null>(null);
  const [tituloSeccionManual, setTituloSeccionManual] = useState('');
  const [itemsSeccionManual, setItemsSeccionManual] = useState<string[]>(['', '']);
  const [objetivo, setObjetivo] = useState('');
  const [dificultad, setDificultad] = useState<DificultadPlan | null>(null);
  const [prioridad, setPrioridad] = useState<PrioridadPlan | null>(null);
  const [contextoAdicional, setContextoAdicional] = useState('');
  const [cantidadRamas, setCantidadRamas] = useState<number | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>({});
  const [propuestaId, setPropuestaId] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<PropuestaPlanInicial | null>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTecladoVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTecladoVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // El Modal no desmonta sus hijos al ocultarse — mismo motivo que
  // CrearTareaWizard/CrearHabitoWizard: reiniciar todo al cerrar.
  useEffect(() => {
    if (visible) return;
    setPaso(0);
    setModo(null);
    setTituloManual('');
    setDescripcionManual('');
    setPlazoDias(null);
    setTituloSeccionManual('');
    setItemsSeccionManual(['', '']);
    setObjetivo('');
    setDificultad(null);
    setPrioridad(null);
    setContextoAdicional('');
    setCantidadRamas(null);
    setDisponibilidad({});
    setPropuestaId(null);
    setPropuesta(null);
  }, [visible]);

  const pasosVisibles = useMemo((): ClavePaso[] => {
    if (modo === 'manual') return ['eleccion', 'identidad', 'seccionManual', 'revision'];
    if (modo === 'ia') {
      if (horizonBloqueado) return ['eleccion', 'teaserIa'];
      const base: ClavePaso[] = ['eleccion', 'objetivoCortoIa', 'dificultadIa', 'prioridadIa', 'contextoIa', 'plazoIa', 'ramasIa'];
      return cantidadRamas !== null ? [...base, 'revision'] : [...base, 'disponibilidadIa', 'revision'];
    }
    return ['eleccion'];
  }, [cantidadRamas, horizonBloqueado, modo]);
  useEffect(() => {
    if (paso > pasosVisibles.length - 1) setPaso(pasosVisibles.length - 1);
  }, [pasosVisibles, paso]);
  const claveActual = pasosVisibles[paso] ?? 'eleccion';
  const esUltimoPaso = paso === pasosVisibles.length - 1;

  // hoy + plazoDias, como fecha simple (yyyy-MM-dd) — null si no se definio
  // plazo. Se calcula recien al guardar, nunca se le pide al usuario una
  // fecha de calendario directamente.
  const fechaObjetivoCalculada = plazoDias ? format(addDays(new Date(), plazoDias), 'yyyy-MM-dd') : null;

  const crearManual = useMutation({
    mutationFn: async () => {
      const plan = await crearPlanManual({ descripcion: descripcionManual, fechaObjetivo: fechaObjetivoCalculada, titulo: tituloManual });
      const items = itemsSeccionManual.map((item) => item.trim()).filter((item) => item.length > 0);
      if (items.length > 0) {
        const seccion = await agregarSeccionManual(plan.id, 0, tituloSeccionManual.trim() || t('planes.crear.primeraSeccionTituloPorDefecto'));
        await guardarDetalleSeccionManual(seccion.id, [{ bloques: [{ items: items.map((titulo) => ({ tipo: 'simple' as const, titulo })), mensajeContexto: '', momento: 'manana' }] }]);
      }
      return plan;
    },
    onSuccess: (plan) => { hapticSeguro('confirmacion'); cliente.invalidateQueries({ queryKey: ['planes', 'lista'] }); onCreado(plan.id); },
  });
  // La dificultad/prioridad elegidas por botón se traducen a una frase
  // canónica (vía i18n) y se suman al texto libre opcional — todo junto
  // viaja como un solo "contexto", sin tocar el contrato de la Edge
  // Function (sigue siendo un string).
  const contextoCompuesto = [
    dificultad ? t(`planes.crear.dificultad.${dificultad}Contexto`) : null,
    prioridad ? t(`planes.crear.prioridad.${prioridad}Contexto`) : null,
    contextoAdicional.trim() || null,
  ].filter(Boolean).join(' ') || undefined;

  const generar = useMutation({
    mutationFn: () => generarPlanInicial(
      cantidadRamas !== null
        ? { cantidadRamas, contexto: contextoCompuesto, objetivo: objetivo.trim(), plazoDias: plazoDias ?? undefined }
        : { contexto: contextoCompuesto, disponibilidad, objetivo: objetivo.trim(), plazoDias: plazoDias ?? undefined },
    ),
    onSuccess: (resultado) => { setPropuestaId(resultado.propuestaId); setPropuesta(resultado.propuesta); setPaso((actual) => actual + 1); },
  });
  const aceptar = useMutation({
    mutationFn: async () => {
      const resultado = await aceptarPropuestaPlan(propuestaId as string);
      if ('planId' in resultado && fechaObjetivoCalculada) await editarPlan(resultado.planId, { fechaObjetivo: fechaObjetivoCalculada });
      return resultado;
    },
    onSuccess: (resultado) => {
      hapticSeguro('confirmacion');
      cliente.invalidateQueries({ queryKey: ['planes', 'lista'] });
      onCreado('planId' in resultado ? resultado.planId : '');
    },
  });

  const puedeContinuar = (() => {
    switch (claveActual) {
      case 'eleccion': return modo !== null;
      case 'identidad': return tituloManual.trim().length > 0;
      case 'objetivoCortoIa': return objetivo.trim().length > 0;
      case 'dificultadIa': return dificultad !== null;
      case 'prioridadIa': return prioridad !== null;
      case 'disponibilidadIa': return Object.keys(disponibilidad).length > 0;
      case 'ramasIa': return true;
      default: return true;
    }
  })();
  const creando = crearManual.isPending || aceptar.isPending;

  function manejarContinuar() {
    if (claveActual === 'teaserIa') { hapticSeguro('seleccion'); irAlPaywall(); return; }
    if (claveActual === 'ramasIa' && cantidadRamas !== null) { generar.mutate(); return; }
    if (claveActual === 'disponibilidadIa') { generar.mutate(); return; }
    if (esUltimoPaso) {
      if (modo === 'manual') crearManual.mutate();
      else aceptar.mutate();
      return;
    }
    hapticSeguro('seleccion');
    setPaso((actual) => actual + 1);
  }

  const etiquetaBoton = claveActual === 'teaserIa'
    ? t('planes.crear.teaserCta')
    : claveActual === 'disponibilidadIa' || (claveActual === 'ramasIa' && cantidadRamas !== null)
      ? (generar.isPending ? t('planes.crear.generando') : t('planes.crear.generar'))
      : esUltimoPaso
        ? (creando ? t('tareas.pantalla.creando') : (modo === 'manual' ? t('tareas.pantalla.crear') : t('planes.crear.confirmar')))
        : t('planes.crear.continuar');

  return (
    <Modal animationType="slide" onRequestClose={onCerrar} visible={visible}>
      <SafeAreaProvider>
        <MasterColorProvider tono={tono}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#FFFDF2', flex: 1 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 22, paddingTop: 55, zIndex: 1 }}>
                <Pressable onPress={() => { hapticSeguro('seleccion'); paso ? setPaso(paso - 1) : onCerrar(); }}>
                  <ChevronLeft color="#1A1335" size={26} />
                </Pressable>
                <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Bold' }}>{paso + 1} de {pasosVisibles.length}</Texto>
                <Pressable onPress={onCerrar}><Texto style={{ color: acento, fontFamily: 'Montserrat-Bold' }}>{t('planes.crear.cancelar')}</Texto></Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 22, zIndex: 1 }}>
                {pasosVisibles.map((_, i) => <PuntoProgreso activo={i <= paso} color={acento} key={i} />)}
              </View>

              <ScrollView
                contentContainerStyle={{ gap: 14, padding: 24, paddingBottom: tecladoVisible ? 24 : 40, paddingTop: 38 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, zIndex: 1 }}
              >
                <ReanimatedView.View entering={FadeIn.duration(260).easing(EasingR.out(EasingR.cubic))} key={claveActual} style={{ gap: 14 }}>

                  {claveActual === 'eleccion' && (
                    <>
                      <EncabezadoPaso icono="idea" subtitulo={t('planes.crear.eleccionSubtitulo')} titulo={t('planes.crear.titulo')} />
                      <TarjetaEleccion activa={modo === 'manual'} descripcion={t('planes.crear.manualDescripcion')} icono="manos" onPress={() => { hapticSeguro('seleccion'); setModo('manual'); }} titulo={t('planes.crear.manual')} />
                      <TarjetaEleccion activa={modo === 'ia'} descripcion={t('planes.crear.iaDescripcion')} icono="cerebro" onPress={() => { hapticSeguro('seleccion'); setModo('ia'); }} titulo={t('planes.crear.ia')} />
                    </>
                  )}

                  {claveActual === 'identidad' && (
                    <>
                      <EncabezadoPaso icono="idea" subtitulo={t('planes.crear.identidadSubtitulo')} titulo={t('planes.crear.identidadTitulo')} />
                      <TextInput
                        autoFocus
                        onChangeText={setTituloManual}
                        placeholder={t('planes.crear.tituloPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 16, padding: 15 }}
                        value={tituloManual}
                      />
                      <TextInput
                        multiline
                        onChangeText={setDescripcionManual}
                        placeholder={t('planes.crear.descripcionPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 14, minHeight: 70, padding: 15 }}
                        value={descripcionManual}
                      />
                      <SelectorPlazoDias dias={plazoDias} onCambiar={setPlazoDias} />
                    </>
                  )}

                  {claveActual === 'seccionManual' && (
                    <>
                      <EncabezadoPaso icono="idea" subtitulo={t('planes.crear.seccionManualSubtitulo')} titulo={t('planes.crear.seccionManualTitulo')} />
                      <TextInput
                        onChangeText={setTituloSeccionManual}
                        placeholder={t('planes.crear.seccionManualTituloPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 15, padding: 15 }}
                        value={tituloSeccionManual}
                      />
                      <ListaItemsManual items={itemsSeccionManual} onCambiar={setItemsSeccionManual} />
                    </>
                  )}

                  {claveActual === 'objetivoCortoIa' && (
                    <>
                      <EncabezadoPaso icono="estadistica" subtitulo={t('planes.crear.objetivoCortoSubtitulo')} titulo={t('planes.crear.objetivoCortoTitulo')} />
                      <TextInput
                        autoFocus
                        multiline
                        onChangeText={setObjetivo}
                        placeholder={t('planes.crear.objetivoCortoPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 15, minHeight: 70, padding: 15 }}
                        value={objetivo}
                      />
                    </>
                  )}

                  {claveActual === 'dificultadIa' && (
                    <>
                      <EncabezadoPaso icono="energia" subtitulo={t('planes.crear.dificultad.subtitulo')} titulo={t('planes.crear.dificultad.titulo')} />
                      {OPCIONES_DIFICULTAD.map((opcion) => (
                        <TarjetaEleccion
                          activa={dificultad === opcion.valor}
                          descripcion={t(`planes.crear.dificultad.${opcion.valor}Descripcion`)}
                          icono={opcion.icono}
                          key={opcion.valor}
                          onPress={() => { hapticSeguro('seleccion'); setDificultad(opcion.valor); }}
                          titulo={t(`planes.crear.dificultad.${opcion.valor}Titulo`)}
                        />
                      ))}
                    </>
                  )}

                  {claveActual === 'prioridadIa' && (
                    <>
                      <EncabezadoPaso icono="trofeo" subtitulo={t('planes.crear.prioridad.subtitulo')} titulo={t('planes.crear.prioridad.titulo')} />
                      {OPCIONES_PRIORIDAD.map((opcion) => (
                        <TarjetaEleccion
                          activa={prioridad === opcion.valor}
                          descripcion={t(`planes.crear.prioridad.${opcion.valor}Descripcion`)}
                          icono={opcion.icono}
                          key={opcion.valor}
                          onPress={() => { hapticSeguro('seleccion'); setPrioridad(opcion.valor); }}
                          titulo={t(`planes.crear.prioridad.${opcion.valor}Titulo`)}
                        />
                      ))}
                    </>
                  )}

                  {claveActual === 'contextoIa' && (
                    <>
                      <EncabezadoPaso icono="idea" subtitulo={t('planes.crear.contextoIaSubtitulo')} titulo={t('planes.crear.contextoIaTitulo')} />
                      <TextInput
                        autoFocus
                        multiline
                        onChangeText={setContextoAdicional}
                        placeholder={t('planes.crear.contextoIaPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 15, minHeight: 90, padding: 15 }}
                        value={contextoAdicional}
                      />
                      <Texto style={{ color: '#7B7494', fontSize: 12 }}>{t('planes.crear.contextoIaOmitir')}</Texto>
                    </>
                  )}

                  {claveActual === 'plazoIa' && (
                    <>
                      <EncabezadoPaso icono="reloj" subtitulo={t('planes.crear.plazoSubtitulo')} titulo={t('planes.crear.plazoTitulo')} />
                      <SelectorPlazoDias dias={plazoDias} onCambiar={setPlazoDias} />
                    </>
                  )}

                  {claveActual === 'ramasIa' && generar.isPending && <AnimacionGenerandoPlan />}

                  {claveActual === 'ramasIa' && !generar.isPending && (
                    <>
                      <EncabezadoPaso icono="idea" subtitulo={t('planes.crear.ramasSubtitulo')} titulo={t('planes.crear.ramasTitulo')} />
                      <TarjetaEleccion activa={cantidadRamas === null} descripcion={t('planes.crear.ramasSoloDescripcion')} icono="manos" onPress={() => { hapticSeguro('seleccion'); setCantidadRamas(null); }} titulo={t('planes.crear.ramasSolo')} />
                      <TarjetaEleccion activa={cantidadRamas !== null} descripcion={t('planes.crear.ramasRepartirDescripcion')} icono="idea" onPress={() => { hapticSeguro('seleccion'); setCantidadRamas((actual) => actual ?? CANTIDAD_RAMAS_MIN); }} titulo={t('planes.crear.ramasRepartir')} />
                      {cantidadRamas !== null && (
                        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 4 }}>
                          <Rebote onPress={() => setCantidadRamas((actual) => Math.max(CANTIDAD_RAMAS_MIN, (actual ?? CANTIDAD_RAMAS_MIN) - 1))} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 17, height: 34, justifyContent: 'center', width: 34 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 18 }}>−</Texto>
                          </Rebote>
                          <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15, minWidth: 110, textAlign: 'center' }}>{t('planes.crear.ramasCantidad', { count: cantidadRamas })}</Texto>
                          <Rebote onPress={() => setCantidadRamas((actual) => Math.min(CANTIDAD_RAMAS_MAX, (actual ?? CANTIDAD_RAMAS_MIN) + 1))} estilo={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.12), borderRadius: 17, height: 34, justifyContent: 'center', width: 34 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 18 }}>+</Texto>
                          </Rebote>
                        </View>
                      )}
                      {generar.isError && (
                        <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>
                          {generar.error instanceof Error ? generar.error.message : t('planes.crear.errorGenerar')}
                        </Texto>
                      )}
                    </>
                  )}

                  {claveActual === 'teaserIa' && (
                    <>
                      <EncabezadoPaso icono="cerebro" subtitulo={t('planes.crear.teaserSubtitulo')} titulo={t('planes.crear.teaserTitulo')} />
                      <VistaPreviaDias dias={EJEMPLO_DIAS_TEASER} />
                      <Texto style={{ color: '#7B7494', fontSize: 12, textAlign: 'center' }}>{t('planes.crear.teaserNota')}</Texto>
                    </>
                  )}

                  {claveActual === 'disponibilidadIa' && generar.isPending && <AnimacionGenerandoPlan />}

                  {claveActual === 'disponibilidadIa' && !generar.isPending && (
                    <>
                      <EncabezadoPaso icono="reloj" subtitulo={t('planes.crear.disponibilidadSubtitulo')} titulo={t('planes.crear.disponibilidadTitulo')} />
                      {MOMENTOS_DISPONIBILIDAD.map((momento) => (
                        <FilaMomentoDisponibilidad
                          key={momento}
                          momento={momento}
                          onCambiar={(valor) => setDisponibilidad((actual) => {
                            if (valor === undefined) {
                              const copia = { ...actual };
                              delete copia[momento];
                              return copia;
                            }
                            return { ...actual, [momento]: valor };
                          })}
                          valor={disponibilidad[momento]}
                        />
                      ))}
                      {generar.isError && (
                        generar.error instanceof ErrorAccesoAby && generar.error.codigo === 'horizon_inactivo' ? (
                          <View style={{ alignItems: 'center', gap: 10 }}>
                            <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{generar.error.message}</Texto>
                            <Rebote onPress={irAlPaywall}>
                              <View style={{ alignItems: 'center', backgroundColor: acento, borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}>
                                <Crown color="#fff" size={14} />
                                <Texto style={{ color: '#fff', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('planes.crear.verHorizon')}</Texto>
                              </View>
                            </Rebote>
                          </View>
                        ) : (
                          <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>
                            {generar.error instanceof Error ? generar.error.message : t('planes.crear.errorGenerar')}
                          </Texto>
                        )
                      )}
                    </>
                  )}

                  {claveActual === 'revision' && modo === 'manual' && (
                    <>
                      <EncabezadoPaso icono="trofeo" subtitulo={t('planes.crear.revisionManualSubtitulo')} titulo={t('planes.crear.revisionTitulo')} />
                      <MasterGlass style={{ borderRadius: 18, padding: 16 }}>
                        <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 17 }}>{tituloManual.trim()}</Texto>
                        {descripcionManual.trim().length > 0 && <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 4 }}>{descripcionManual.trim()}</Texto>}
                        {plazoDias && <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 12, marginTop: 6 }}>{t('planes.crear.plazoResumen', { dias: plazoDias, fecha: format(new Date(`${fechaObjetivoCalculada}T00:00:00`), "d 'de' MMMM", { locale: localeFecha }) })}</Texto>}
                      </MasterGlass>
                      {itemsSeccionManual.some((item) => item.trim().length > 0) ? (
                        <VistaPreviaDias dias={[{ bloques: [{ items: itemsSeccionManual.map((item) => item.trim()).filter(Boolean).map((titulo) => ({ tipo: 'simple' as const, titulo })), mensajeContexto: '', momento: 'manana' }], titulo: tituloSeccionManual.trim() || t('planes.crear.primeraSeccionTituloPorDefecto') }]} />
                      ) : (
                        <Texto style={{ color: '#7B7494', fontSize: 12 }}>{t('planes.crear.revisionManualNota')}</Texto>
                      )}
                    </>
                  )}

                  {claveActual === 'revision' && modo === 'ia' && propuesta && (
                    <>
                      <EncabezadoPaso icono="trofeo" subtitulo={t('planes.detalle.revisionTitulo')} titulo={propuesta.tituloPlan} />
                      <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13 }}>{propuesta.descripcionPlan}</Texto>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(disponibilidad).map(([momento, valor]) => (
                          <View key={momento} style={{ backgroundColor: conAlfa(acento, 0.12), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>
                              {t(`planes.detalle.momento.${momento}`)} · {typeof valor === 'number' ? formatearDuracion(valor, t) : t(`planes.crear.nivel.${valor}`)}
                            </Texto>
                          </View>
                        ))}
                        {plazoDias && (
                          <View style={{ backgroundColor: conAlfa(acento, 0.12), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{t('planes.crear.plazoDiasCount', { count: plazoDias })}</Texto>
                          </View>
                        )}
                        {dificultad && (
                          <View style={{ backgroundColor: conAlfa(acento, 0.12), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{t(`planes.crear.dificultad.${dificultad}Titulo`)}</Texto>
                          </View>
                        )}
                        {prioridad && (
                          <View style={{ backgroundColor: conAlfa(acento, 0.12), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                            <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{t(`planes.crear.prioridad.${prioridad}Titulo`)}</Texto>
                          </View>
                        )}
                      </View>

                      {propuesta.ramas ? (
                        <>
                          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 4 }}>{t('planes.crear.revisionRamasTitulo')}</Texto>
                          <View style={{ gap: 8 }}>
                            {propuesta.ramas.map((rama, indice) => (
                              <RecuadroGlass blur key={rama.nombre} style={{ alignItems: 'center', borderRadius: 14, borderWidth: 0, flexDirection: 'row', gap: 10, padding: 12 }}>
                                <View style={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.15), borderRadius: 13, height: 26, justifyContent: 'center', width: 26 }}>
                                  <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{indice + 1}</Texto>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }}>{rama.nombre}</Texto>
                                  <Texto numberOfLines={2} style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 11 }}>{rama.resumen}</Texto>
                                </View>
                              </RecuadroGlass>
                            ))}
                          </View>
                          <Texto style={{ color: '#7B7494', fontSize: 12, marginTop: 4 }}>{t('planes.crear.revisionRamasNota')}</Texto>
                        </>
                      ) : (
                        <>
                          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 4 }}>{t('planes.crear.revisionMapaTitulo')}</Texto>
                          <View style={{ gap: 8 }}>
                            {propuesta.secciones?.map((seccion, indice) => (
                              <RecuadroGlass blur key={seccion.titulo} style={{ alignItems: 'center', borderRadius: 14, borderWidth: 0, flexDirection: 'row', gap: 10, padding: 12 }}>
                                <View style={{ alignItems: 'center', backgroundColor: indice === 0 ? acento : conAlfa(acento, 0.15), borderRadius: 13, height: 26, justifyContent: 'center', width: 26 }}>
                                  <Texto style={{ color: indice === 0 ? '#FFFFFF' : acento, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{indice + 1}</Texto>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }}>{seccion.titulo}</Texto>
                                  <Texto numberOfLines={2} style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 11 }}>{seccion.resumen}</Texto>
                                </View>
                              </RecuadroGlass>
                            ))}
                          </View>

                          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 4 }}>{t('planes.crear.revisionPrimeraSeccionTitulo', { titulo: propuesta.secciones?.[0]?.titulo ?? '' })}</Texto>
                          <VistaPreviaDias dias={propuesta.primeraSeccionDias ?? []} />
                        </>
                      )}

                      {aceptar.isError && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{t('planes.crear.errorGenerar')}</Texto>}
                    </>
                  )}

                </ReanimatedView.View>
              </ScrollView>

              <View style={{ backgroundColor: '#FFFDF2', borderTopColor: '#E4DDF0', borderTopWidth: 1, paddingHorizontal: 22, paddingTop: 22, zIndex: 2 }}>
                <SafeAreaView edges={['bottom']}>
                  <Boton
                    color={acento}
                    disabled={!puedeContinuar || creando || generar.isPending}
                    iconoIzquierda={claveActual === 'teaserIa' ? Crown : esUltimoPaso || claveActual === 'disponibilidadIa' || (claveActual === 'ramasIa' && cantidadRamas !== null) ? Check : ChevronRight}
                    onPress={manejarContinuar}
                    variante="sendero"
                  >
                    {etiquetaBoton}
                  </Boton>
                </SafeAreaView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </MasterColorProvider>
      </SafeAreaProvider>
    </Modal>
  );
}
