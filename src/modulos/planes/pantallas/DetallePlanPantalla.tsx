import { useState } from 'react';
import { ChevronLeft, Check, Plus, Sparkles, X } from 'lucide-react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { MasterButton, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import {
  aceptarPropuestaPlan, detallarSeccionPlan, guardarDetalleSeccionManual, marcarItemPlan,
  obtenerDetalleSeccion, obtenerInstanciaPropia, obtenerPlanPorId, obtenerSeccionesPlan,
} from '../planes.servicio';
import type { PlanSeccion, PropuestaDia } from '../planes.tipos';

// Aurelia real (master_pack_color en arboles_paquetes es #FFD000, igual al
// que ya usa nacarMandala.ts) — Planes usa este paquete COMPLETO (color +
// árbol), a diferencia de Tareas que solo toma el color de "golden" para su
// rotación estética. Esta pantalla es una ruta propia (no anidada bajo
// TareasPantalla), así que necesita su propio TonoDelHabito.
const PAQUETE_PLANES = 'aurelia';
const COLOR_PAQUETE_PLANES = '#FFD000';
const CLAVE_PLANES_LISTA = ['planes', 'lista'] as const;

// Pantalla de detalle de un Plan: lista de secciones + la sección vigente
// (días/bloques/ítems de la que está 'detallada', o las dos formas de
// detallar la próxima 'solo_titulo'). Deliberadamente sin el sendero visual
// completo (ContenedorMapaSenderos/construirNodosPlan) en esta entrega — eso
// queda de pulido aparte; esta versión ya es funcional de punta a punta
// (crear, detallar, marcar progreso) para probar con datos reales.
export function DetallePlanPantalla({ id }: { id: string }) {
  return (
    <TonoDelHabito colorPaquete={COLOR_PAQUETE_PLANES} paqueteId={PAQUETE_PLANES}>
      <DetallePlanPantallaContenido id={id} />
    </TonoDelHabito>
  );
}

function DetallePlanPantallaContenido({ id }: { id: string }) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const s = useEstilosS(esc, acento);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const [seccionDetallarId, setSeccionDetallarId] = useState<string | null>(null);
  const [seccionExpandidaId, setSeccionExpandidaId] = useState<string | null>(null);

  const consultaPlan = useQuery({ queryFn: () => obtenerPlanPorId(id), queryKey: ['planes', 'plan', id] });
  const consultaSecciones = useQuery({ queryFn: () => obtenerSeccionesPlan(id), queryKey: ['planes', 'secciones', id] });
  const consultaInstancia = useQuery({ queryFn: () => obtenerInstanciaPropia(id), queryKey: ['planes', 'instancia', id] });

  const plan = consultaPlan.data;
  const secciones = consultaSecciones.data ?? [];
  const instancia = consultaInstancia.data;

  // Primera sección sin detallar — la única que se puede "pedir" en este
  // momento (generación progresiva: nunca varias a la vez).
  const seccionPendiente = secciones.find((seccion) => seccion.estado === 'solo_titulo');
  // Primera detallada-no-completada, o la última si todas están completas —
  // la que se expande sola al entrar.
  const seccionVigente = secciones.find((seccion) => seccion.estado === 'detallada') ?? [...secciones].reverse().find((seccion) => seccion.estado === 'completada');

  function invalidarTodo() {
    cliente.invalidateQueries({ queryKey: ['planes', 'secciones', id] });
    cliente.invalidateQueries({ queryKey: ['planes', 'plan', id] });
    cliente.invalidateQueries({ queryKey: CLAVE_PLANES_LISTA });
  }

  if (consultaPlan.isLoading || !plan) {
    return (
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} style={[s.raiz, { paddingTop: insets.top + 32 }]}>
        <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 24 }]}>
          <Pressable accessibilityLabel={t('planes.pantalla.volverAlInicio')} onPress={() => router.back()} style={s.botonVolver}>
            <ChevronLeft color={acento} size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Texto numberOfLines={2} style={s.titulo}>{plan.titulo}</Texto>
            {plan.descripcion && <Texto numberOfLines={2} style={s.descripcion}>{plan.descripcion}</Texto>}
          </View>
        </View>

        <View style={s.contenido}>
          {secciones.map((seccion, indice) => (
            <TarjetaSeccion
              esUltima={indice === secciones.length - 1}
              instanciaId={instancia?.id ?? null}
              key={seccion.id}
              onInvalidar={invalidarTodo}
              onPedirDetalle={() => setSeccionDetallarId(seccion.id)}
              onToggleExpandida={() => setSeccionExpandidaId((actual) => (actual === seccion.id ? null : seccion.id))}
              seccion={seccion}
              seccionNumero={indice + 1}
              soloExpandible={seccion.id === (seccionVigente?.id ?? seccionExpandidaId)}
            />
          ))}
          {secciones.length === 0 && !consultaSecciones.isLoading && (
            <View style={s.vacio}><Texto style={s.vacioTexto}>{t('planes.detalle.sinSecciones')}</Texto></View>
          )}
        </View>
      </ScrollView>

      {instancia && (
        <ModalDetallarSeccion
          onCerrar={() => setSeccionDetallarId(null)}
          onListo={() => { setSeccionDetallarId(null); invalidarTodo(); }}
          seccionId={seccionDetallarId}
        />
      )}
    </LinearGradient>
  );
}

function TarjetaSeccion({ esUltima, instanciaId, onInvalidar, onPedirDetalle, onToggleExpandida, seccion, seccionNumero, soloExpandible }: {
  esUltima: boolean;
  instanciaId: string | null;
  onInvalidar: () => void;
  onPedirDetalle: () => void;
  onToggleExpandida: () => void;
  seccion: PlanSeccion;
  seccionNumero: number;
  soloExpandible: boolean;
}) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const s = useEstilosS(esc, acento);
  const { t } = useTranslation();
  const expandida = seccion.estado !== 'solo_titulo' && soloExpandible;

  const consultaDetalle = useQuery({
    enabled: expandida && Boolean(instanciaId),
    queryFn: () => obtenerDetalleSeccion(seccion.id, instanciaId as string),
    queryKey: ['planes', 'seccion-detalle', seccion.id, instanciaId],
  });

  const marcar = useMutation({
    mutationFn: ({ bloqueItemId, hecho }: { bloqueItemId: string; hecho: boolean }) => marcarItemPlan(instanciaId as string, bloqueItemId, hecho),
    onSuccess: () => {
      hapticSeguro('confirmacion');
      consultaDetalle.refetch();
      onInvalidar();
    },
  });

  return (
    <View style={s.filaSeccionContenedor}>
      <View style={s.nodoColumna}>
        <View style={[s.nodoSeccion, seccion.estado === 'completada' ? s.nodoCompletado : seccion.estado === 'detallada' ? s.nodoActivo : s.nodoPendiente]}>
          {seccion.estado === 'completada' ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : <Texto style={[s.nodoTexto, seccion.estado === 'detallada' && { color: '#FFFFFF' }]}>{seccionNumero}</Texto>}
        </View>
        {!esUltima && <View style={s.nodoLinea} />}
      </View>
      <View style={{ flex: 1, marginBottom: 14 }}>
        <Rebote disabled={seccion.estado === 'solo_titulo'} onPress={onToggleExpandida}>
          <MasterGlass style={s.tarjetaSeccion}>
            <Texto numberOfLines={2} style={s.seccionTitulo}>{seccion.titulo}</Texto>
            {seccion.resumen && <Texto numberOfLines={2} style={s.seccionResumen}>{seccion.resumen}</Texto>}
          </MasterGlass>
        </Rebote>

        {seccion.estado === 'solo_titulo' && (
          <MasterButton color={acento} onPress={onPedirDetalle} style={{ marginTop: 8 }}>
            {t('planes.detalle.detallarSeccion')}
          </MasterButton>
        )}

        {expandida && consultaDetalle.data && (
          <View style={{ gap: 10, marginTop: 10 }}>
            {consultaDetalle.data.dias.map((dia, indiceDia) => (
              <MasterGlass key={dia.id} style={s.tarjetaDia}>
                <Texto style={s.diaTitulo}>{dia.titulo ?? t('planes.detalle.diaNumero', { numero: indiceDia + 1 })}</Texto>
                {dia.bloques.map((bloque) => (
                  <View key={bloque.id} style={{ marginTop: 8 }}>
                    <Texto style={s.momentoTexto}>{t(`planes.detalle.momento.${bloque.momento}`)}</Texto>
                    {bloque.mensajeContexto && <Texto style={s.mensajeContexto}>{bloque.mensajeContexto}</Texto>}
                    {bloque.items.map((item) => (
                      <Pressable
                        disabled={marcar.isPending}
                        key={item.id}
                        onPress={() => marcar.mutate({ bloqueItemId: item.id, hecho: !item.hecho })}
                        style={s.filaItem}
                      >
                        <View style={[s.checkboxItem, item.hecho && { backgroundColor: acento }]}>
                          {item.hecho && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                        </View>
                        <Texto style={[s.itemTexto, item.hecho && s.itemTextoHecho]}>{item.titulo}</Texto>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </MasterGlass>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ModalDetallarSeccion({ onCerrar, onListo, seccionId }: { onCerrar: () => void; onListo: () => void; seccionId: string | null }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const [modo, setModo] = useState<'aby' | 'elegir' | 'manual' | null>(null);
  const [contexto, setContexto] = useState('');
  const [propuestaId, setPropuestaId] = useState<string | null>(null);
  const [propuestaDias, setPropuestaDias] = useState<PropuestaDia[] | null>(null);
  const [itemsManual, setItemsManual] = useState<string[]>(['', '']);

  function reiniciar() {
    setModo(null);
    setContexto('');
    setPropuestaId(null);
    setPropuestaDias(null);
    setItemsManual(['', '']);
  }

  const generar = useMutation({
    mutationFn: () => detallarSeccionPlan(seccionId as string, contexto.trim()),
    onSuccess: (resultado) => { setPropuestaId(resultado.propuestaId); setPropuestaDias(resultado.propuesta.dias); },
  });

  const aceptar = useMutation({
    mutationFn: () => aceptarPropuestaPlan(propuestaId as string),
    onSuccess: () => { hapticSeguro('confirmacion'); reiniciar(); onListo(); },
  });

  const guardarManual = useMutation({
    mutationFn: () => guardarDetalleSeccionManual(seccionId as string, [{ bloques: [{ items: itemsManual.filter((item) => item.trim()), mensajeContexto: '', momento: 'manana' }] }]),
    onSuccess: () => { hapticSeguro('confirmacion'); reiniciar(); onListo(); },
  });

  return (
    <Modal animationType="fade" onRequestClose={() => { reiniciar(); onCerrar(); }} transparent visible={seccionId !== null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s2.fondo}>
        <Pressable onPress={() => { reiniciar(); onCerrar(); }} style={StyleSheet.absoluteFill} />
        <MasterGlass style={s2.tarjeta}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {modo === null && (
              <View style={{ gap: 10 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.detallarSeccion')}</Texto>
                <Rebote onPress={() => setModo('aby')}>
                  <MasterGlass style={s2.opcionGlass}>
                    <View style={s2.opcionFila}>
                      <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} size={40} tinte={conAlfa(acento, 0.55)}>
                        <Sparkles color="#FFFFFF" size={20} />
                      </MasterIconBg>
                      <Texto style={s2.opcionTitulo}>{t('planes.crear.ia')}</Texto>
                    </View>
                  </MasterGlass>
                </Rebote>
                <Rebote onPress={() => setModo('manual')}>
                  <MasterGlass style={s2.opcionGlass}>
                    <View style={s2.opcionFila}>
                      <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} size={40} tinte={conAlfa(acento, 0.55)}>
                        <MasterIcon alTema name="idea" size={22} />
                      </MasterIconBg>
                      <Texto style={s2.opcionTitulo}>{t('planes.crear.manual')}</Texto>
                    </View>
                  </MasterGlass>
                </Rebote>
              </View>
            )}

            {modo === 'aby' && !propuestaDias && (
              <View style={{ gap: 12 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.contextoTitulo')}</Texto>
                <Texto style={s2.subtitulo}>{t('planes.detalle.contextoDescripcion')}</Texto>
                <TextInput multiline onChangeText={setContexto} placeholder={t('planes.detalle.contextoPlaceholder')} placeholderTextColor="#9A93A8" style={s2.input} value={contexto} />
                {generar.isError && <Texto style={s2.error}>{t('planes.crear.errorGenerar')}</Texto>}
                <MasterButton color={acento} disabled={!contexto.trim() || generar.isPending} onPress={() => generar.mutate()}>
                  {generar.isPending ? t('planes.crear.generando') : t('planes.crear.generar')}
                </MasterButton>
              </View>
            )}

            {modo === 'aby' && propuestaDias && (
              <View style={{ gap: 10 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.revisionTitulo')}</Texto>
                {propuestaDias.map((dia, indice) => (
                  <View key={indice} style={{ marginBottom: 6 }}>
                    <Texto style={s2.diaPreviewTitulo}>{dia.titulo ?? t('planes.detalle.diaNumero', { numero: indice + 1 })}</Texto>
                    {dia.bloques.flatMap((bloque) => bloque.items).map((item, indiceItem) => (
                      <Texto key={indiceItem} style={s2.itemPreview}>• {item}</Texto>
                    ))}
                  </View>
                ))}
                {aceptar.isError && <Texto style={s2.error}>{t('planes.crear.errorGenerar')}</Texto>}
                <MasterButton color={acento} disabled={aceptar.isPending} onPress={() => aceptar.mutate()}>
                  {aceptar.isPending ? t('tareas.pantalla.creando') : t('planes.crear.confirmar')}
                </MasterButton>
              </View>
            )}

            {modo === 'manual' && (
              <View style={{ gap: 10 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.pasosTitulo')}</Texto>
                {itemsManual.map((item, indice) => (
                  <View key={indice} style={s2.filaItemManual}>
                    <TextInput
                      onChangeText={(texto) => setItemsManual((actual) => actual.map((valor, i) => (i === indice ? texto : valor)))}
                      placeholder={t('tareas.pantallaCompleta.quickAdd.itemPlaceholder', { count: indice + 1 })}
                      placeholderTextColor="#9A93A8"
                      style={s2.inputChico}
                      value={item}
                    />
                    {itemsManual.length > 1 && (
                      <Rebote onPress={() => setItemsManual((actual) => actual.filter((_, i) => i !== indice))} estilo={s2.quitarItem}>
                        <X color="#9A93A8" size={16} />
                      </Rebote>
                    )}
                  </View>
                ))}
                <Rebote onPress={() => setItemsManual((actual) => [...actual, ''])} estilo={{ paddingVertical: 4 }}>
                  <View style={s2.agregarItemFila}>
                    <Plus color={acento} size={16} />
                    <Texto style={[s2.agregarItemTexto, { color: acento }]}>{t('tareas.pantallaCompleta.quickAdd.addItem')}</Texto>
                  </View>
                </Rebote>
                <MasterButton color={acento} disabled={itemsManual.every((item) => !item.trim()) || guardarManual.isPending} onPress={() => guardarManual.mutate()}>
                  {guardarManual.isPending ? t('tareas.pantalla.creando') : t('planes.crear.confirmar')}
                </MasterButton>
              </View>
            )}
          </ScrollView>
        </MasterGlass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s2 = StyleSheet.create({
  fondo: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  tarjeta: { borderRadius: 22, maxHeight: '80%', padding: 18, width: '100%' },
  titulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 17 },
  subtitulo: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E4DDF0', borderRadius: 14, borderWidth: 1, color: '#1A1335', fontFamily: 'Montserrat-Medium', fontSize: 15, minHeight: 70, padding: 13 },
  opcionGlass: { borderRadius: 16, padding: 10 },
  opcionFila: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  opcionTitulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 12 },
  diaPreviewTitulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginBottom: 2 },
  itemPreview: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 12, marginLeft: 4 },
  filaItemManual: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  inputChico: { backgroundColor: '#FFFFFF', borderColor: '#E4DDF0', borderRadius: 12, borderWidth: 1, color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 14, padding: 11 },
  quitarItem: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  agregarItemFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  agregarItemTexto: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
});

const crearEstilosS = (esc: EscalaMaster, acento: string) => StyleSheet.create({
  raiz: { flex: 1 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginBottom: 16, paddingHorizontal: 20 },
  botonVolver: { alignItems: 'center', height: 34, justifyContent: 'center', width: 30 },
  titulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 27 },
  descripcion: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 2 },
  contenido: { paddingHorizontal: 20 },
  vacio: { alignItems: 'center', paddingVertical: 40 },
  vacioTexto: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  filaSeccionContenedor: { flexDirection: 'row' },
  nodoColumna: { alignItems: 'center', marginRight: 10, width: 28 },
  nodoSeccion: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  nodoCompletado: { backgroundColor: acento },
  nodoActivo: { backgroundColor: conAlfa(acento, 0.85) },
  nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: conAlfa(acento, 0.3), borderWidth: 2 },
  nodoTexto: { color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11 },
  nodoLinea: { backgroundColor: conAlfa(acento, 0.2), bottom: -8, position: 'absolute', top: 28, width: 2 },
  tarjetaSeccion: { borderRadius: 16, padding: 12 },
  seccionTitulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  seccionResumen: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 2 },
  tarjetaDia: { borderRadius: 14, padding: 12 },
  diaTitulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 13 },
  momentoTexto: { color: acento, fontFamily: 'Montserrat-Bold', fontSize: 11, marginBottom: 2, textTransform: 'uppercase' },
  mensajeContexto: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 11, marginBottom: 6 },
  filaItem: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 4 },
  checkboxItem: { alignItems: 'center', borderColor: conAlfa(acento, 0.4), borderRadius: 6, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  itemTexto: { color: esc.hoja.l19, flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  itemTextoHecho: { color: esc.musgo.l49, textDecorationLine: 'line-through' },
});

const estilosPorEscala = new WeakMap<EscalaMaster, Map<string, ReturnType<typeof crearEstilosS>>>();
function useEstilosS(esc: EscalaMaster, acento: string) {
  let porAcento = estilosPorEscala.get(esc);
  if (!porAcento) { porAcento = new Map(); estilosPorEscala.set(esc, porAcento); }
  let valor = porAcento.get(acento);
  if (!valor) { valor = crearEstilosS(esc, acento); porAcento.set(acento, valor); }
  return valor;
}
