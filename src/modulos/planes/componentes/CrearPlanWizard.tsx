import { useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReanimatedView, { Easing as EasingR, FadeIn } from 'react-native-reanimated';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Boton, MasterColorProvider, MasterGlass, MasterIcon, MasterIconBg, RecuadroGlass, Rebote, Texto, crearTonoMaster, useTonoMaster } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { aceptarPropuestaPlan, crearPlanManual, generarPlanInicial } from '../planes.servicio';
import type { PropuestaPlanInicial } from '../planes.tipos';

// Wizard de creación de Planes — mismo tipo de pantalla que CrearHabitoWizard/
// CrearTareaWizard (Modal full-screen, pasos con puntos de progreso, mismo
// Boton variante="sendero"), con tema aurelia fijo (ver TareasPantalla.tsx:
// Planes usa aurelia completo, no solo un acento suelto).
//
// Dos caminos desde "eleccion" que nunca se mezclan en los mismos pasos:
//   manual → identidad → revision (crea el plan ya mismo; secciones/días se
//   arman después desde DetallePlanPantalla).
//   ia → objetivoIa (dispara la generación, no un simple "Continuar") →
//   revision (muestra la propuesta; "Crear este plan" recién ahí escribe algo
//   real — misma garantía que ya tiene el flujo de estudio de Aby).
const PAQUETE_PLANES = 'aurelia';
const COLOR_PAQUETE_PLANES = '#FFD000';
// Naranja fijo para los íconos de "A mano"/"Con Aby" — mismo tono que ya usa
// la categoría "Tareas" del hub de Hoy — a propósito distinto del acento
// aurelia (amarillo) de todo lo demás del wizard, para que esas dos tarjetas
// destaquen por contraste en vez de perderse contra el fondo dorado.
const COLOR_NARANJA = '#F59E0B';

type ModoCreacion = 'ia' | 'manual';
type ClavePaso = 'eleccion' | 'identidad' | 'objetivoIa' | 'revision';

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

export function CrearPlanWizard({ onCerrar, onCreado, visible }: { onCerrar: () => void; onCreado: (planId: string) => void; visible: boolean }) {
  const { t } = useTranslation();
  const cliente = useQueryClient();
  const tono = useMemo(() => crearTonoMaster(PAQUETE_PLANES, COLOR_PAQUETE_PLANES), []);
  const acento = tono.acento;

  const [paso, setPaso] = useState(0);
  const [modo, setModo] = useState<ModoCreacion | null>(null);
  const [tituloManual, setTituloManual] = useState('');
  const [descripcionManual, setDescripcionManual] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [bloquesPorDia, setBloquesPorDia] = useState<1 | 2 | 3>(2);
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
    setObjetivo('');
    setBloquesPorDia(2);
    setPropuestaId(null);
    setPropuesta(null);
  }, [visible]);

  const pasosVisibles = useMemo((): ClavePaso[] => {
    if (modo === 'manual') return ['eleccion', 'identidad', 'revision'];
    if (modo === 'ia') return ['eleccion', 'objetivoIa', 'revision'];
    return ['eleccion'];
  }, [modo]);
  useEffect(() => {
    if (paso > pasosVisibles.length - 1) setPaso(pasosVisibles.length - 1);
  }, [pasosVisibles, paso]);
  const claveActual = pasosVisibles[paso] ?? 'eleccion';
  const esUltimoPaso = paso === pasosVisibles.length - 1;

  const crearManual = useMutation({
    mutationFn: () => crearPlanManual({ descripcion: descripcionManual, titulo: tituloManual }),
    onSuccess: (plan) => { hapticSeguro('confirmacion'); cliente.invalidateQueries({ queryKey: ['planes', 'lista'] }); onCreado(plan.id); },
  });
  const generar = useMutation({
    mutationFn: () => generarPlanInicial(objetivo.trim(), bloquesPorDia),
    onSuccess: (resultado) => { setPropuestaId(resultado.propuestaId); setPropuesta(resultado.propuesta); setPaso((actual) => actual + 1); },
  });
  const aceptar = useMutation({
    mutationFn: () => aceptarPropuestaPlan(propuestaId as string),
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
      case 'objetivoIa': return objetivo.trim().length > 0;
      default: return true;
    }
  })();
  const creando = crearManual.isPending || aceptar.isPending;

  function manejarContinuar() {
    if (claveActual === 'objetivoIa') { generar.mutate(); return; }
    if (esUltimoPaso) {
      if (modo === 'manual') crearManual.mutate();
      else aceptar.mutate();
      return;
    }
    hapticSeguro('seleccion');
    setPaso((actual) => actual + 1);
  }

  const etiquetaBoton = claveActual === 'objetivoIa'
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
                    </>
                  )}

                  {claveActual === 'objetivoIa' && (
                    <>
                      <EncabezadoPaso icono="estadistica" subtitulo={t('planes.crear.objetivoSubtitulo')} titulo={t('planes.crear.ia')} />
                      <TextInput
                        autoFocus
                        multiline
                        onChangeText={setObjetivo}
                        placeholder={t('planes.crear.objetivoPlaceholder')}
                        placeholderTextColor="#9A93A8"
                        style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 16, borderWidth: 1, color: '#1A1335', fontSize: 15, minHeight: 90, padding: 15 }}
                        value={objetivo}
                      />
                      <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('planes.crear.bloquesPorDia')}</Texto>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {([1, 2, 3] as const).map((cantidad) => (
                          <Rebote key={cantidad} estilo={{ flex: 1 }} onPress={() => setBloquesPorDia(cantidad)}>
                            <View style={{ alignItems: 'center', backgroundColor: bloquesPorDia === cantidad ? acento : '#F0EFFE', borderRadius: 14, paddingVertical: 12 }}>
                              <Texto style={{ color: bloquesPorDia === cantidad ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15 }}>{cantidad}</Texto>
                            </View>
                          </Rebote>
                        ))}
                      </View>
                      {generar.isError && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{t('planes.crear.errorGenerar')}</Texto>}
                    </>
                  )}

                  {claveActual === 'revision' && modo === 'manual' && (
                    <>
                      <EncabezadoPaso icono="trofeo" subtitulo={t('planes.crear.revisionManualSubtitulo')} titulo={t('planes.crear.revisionTitulo')} />
                      <MasterGlass style={{ borderRadius: 18, padding: 16 }}>
                        <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 17 }}>{tituloManual.trim()}</Texto>
                        {descripcionManual.trim().length > 0 && <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 4 }}>{descripcionManual.trim()}</Texto>}
                      </MasterGlass>
                      <Texto style={{ color: '#7B7494', fontSize: 12 }}>{t('planes.crear.revisionManualNota')}</Texto>
                    </>
                  )}

                  {claveActual === 'revision' && modo === 'ia' && propuesta && (
                    <>
                      <EncabezadoPaso icono="trofeo" subtitulo={t('planes.detalle.revisionTitulo')} titulo={propuesta.tituloPlan} />
                      <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13 }}>{propuesta.descripcionPlan}</Texto>
                      <View style={{ gap: 8, marginTop: 4 }}>
                        {propuesta.secciones.map((seccion, indice) => (
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
                    iconoIzquierda={esUltimoPaso || claveActual === 'objetivoIa' ? Check : ChevronRight}
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
