import { ArrowDown, ArrowUp, Check, Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { sugerirFranjaPorHora, type FranjaDia } from '../../../compartido/utilidades/franjas';
import { Boton, formatoHora12, MasterChip, MasterGlass, SelectorHora12, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { HabitoResumen } from '../../habitos/tipos';
import type { Tarea } from '../../tareas/tareas.tipos';
import { leerObjetivo } from '../formatoRutina';
import type { PlantillaRutina } from '../plantillasRutinas';
import { MAX_PASOS_RUTINA, type CrearRutinaInput, type FrecuenciaRutina, type ModoPasoPropio, type PasoNuevoRutina } from '../rutinas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', campo: '#FFFFFF', borde: '#E4DDF0', error: '#DC2626' };
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FRANJAS_ELEGIBLES: readonly FranjaDia[] = ['manana', 'tarde', 'noche', 'cualquier_momento'];
const ICONOS_RUTINA = ['sol', 'estudiar', 'cama', 'hacer-ejercicio', 'meditar', 'calendario', 'cerebro', 'corazon'] as const;
const DIAS = [1, 2, 3, 4, 5, 6, 7] as const;
const MODOS: readonly ModoPasoPropio[] = ['simple', 'cronometro', 'contador'];
const ETAPAS = ['identidad', 'pasos', 'programacion', 'revision'] as const;
type Etapa = (typeof ETAPAS)[number];

type BorradorPaso =
  | { clave: string; origen: 'habito'; habitoId: string; titulo: string }
  | { clave: string; origen: 'tarea'; tareaId: string; titulo: string }
  | { clave: string; origen: 'propio'; titulo: string; modo: ModoPasoPropio; objetivo: string; unidad: string };

function borradorValido(paso: BorradorPaso): boolean {
  if (paso.origen !== 'propio') return true;
  if (paso.titulo.trim().length === 0) return false;
  return paso.modo === 'simple' || leerObjetivo(paso.objetivo) !== null;
}

function aPasoNuevo(paso: BorradorPaso): PasoNuevoRutina {
  if (paso.origen === 'habito') return { origen: 'habito', habitoId: paso.habitoId };
  if (paso.origen === 'tarea') return { origen: 'tarea', tareaId: paso.tareaId };
  return {
    origen: 'propio', titulo: paso.titulo.trim(), modo: paso.modo,
    ...(paso.modo === 'simple' ? {} : { objetivoValor: leerObjetivo(paso.objetivo) ?? 1, unidad: paso.unidad.trim() || (paso.modo === 'cronometro' ? 'min' : undefined) }),
  };
}

export function CrearRutinaWizard({ color, guardando, habitos, onCerrar, onCrear, plantilla, tareas, visible }: {
  color: string;
  guardando: boolean;
  habitos: readonly HabitoResumen[];
  onCerrar: () => void;
  onCrear: (input: CrearRutinaInput) => Promise<void>;
  /** Si viene (y está desbloqueada), el asistente arranca con todo cargado y se puede cambiar. */
  plantilla: PlantillaRutina | null;
  tareas: readonly Tarea[];
  visible: boolean;
}) {
  const { t } = useTranslation();
  const contador = useRef(0);
  const nuevaClave = () => `paso-${contador.current++}`;
  const [etapaIndice, setEtapaIndice] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [franja, setFranja] = useState<FranjaDia>('cualquier_momento');
  const [iconoId, setIconoId] = useState<string>(ICONOS_RUTINA[0]);
  const [pasos, setPasos] = useState<BorradorPaso[]>([]);
  const [agregando, setAgregando] = useState<'habito' | 'tarea' | null>(null);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRutina>('diaria');
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recordatorio, setRecordatorio] = useState(false);
  const [hora, setHora] = useState('08:00');
  const [mostrarNombre, setMostrarNombre] = useState(true);
  const [error, setError] = useState(false);

  // Cada vez que se abre, arranca limpio o desde la plantilla elegida.
  useEffect(() => {
    if (!visible) return;
    setEtapaIndice(0);
    setError(false);
    setAgregando(null);
    setFrecuencia('diaria');
    setDias([1, 2, 3, 4, 5]);
    setRecordatorio(false);
    setHora('08:00');
    setMostrarNombre(true);
    setTitulo(plantilla?.titulo ?? '');
    setFranja(plantilla?.franja ?? 'cualquier_momento');
    setIconoId(plantilla?.iconoId ?? ICONOS_RUTINA[0]);
    setPasos((plantilla?.pasos ?? []).map((paso) => ({
      clave: nuevaClave(), origen: 'propio', titulo: paso.titulo, modo: paso.modo,
      objetivo: paso.objetivoValor ? String(paso.objetivoValor) : '', unidad: paso.unidad ?? '',
    })));
  }, [visible, plantilla]);

  const etapa: Etapa = ETAPAS[etapaIndice];
  const horaValida = HORA_VALIDA.test(hora);
  const sugerida = recordatorio && horaValida ? sugerirFranjaPorHora(hora) : null;
  const idsHabitosUsados = useMemo(() => new Set(pasos.flatMap((paso) => (paso.origen === 'habito' ? [paso.habitoId] : []))), [pasos]);
  const idsTareasUsadas = useMemo(() => new Set(pasos.flatMap((paso) => (paso.origen === 'tarea' ? [paso.tareaId] : []))), [pasos]);
  const llenaDePasos = pasos.length >= MAX_PASOS_RUTINA;

  const puedeContinuar = (() => {
    switch (etapa) {
      case 'identidad': return titulo.trim().length > 0;
      case 'pasos': return pasos.length >= 1 && pasos.every(borradorValido) && agregando === null;
      case 'programacion': return (frecuencia === 'diaria' || dias.length > 0) && (!recordatorio || horaValida);
      default: return true;
    }
  })();

  function agregarPaso(paso: BorradorPaso) {
    hapticSeguro('seleccion');
    setPasos((actual) => (actual.length >= MAX_PASOS_RUTINA ? actual : [...actual, paso]));
    setAgregando(null);
  }
  function moverPaso(indice: number, delta: -1 | 1) {
    setPasos((actual) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= actual.length) return actual;
      const copia = [...actual];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }
  function actualizarPropio(clave: string, cambios: Partial<Extract<BorradorPaso, { origen: 'propio' }>>) {
    setPasos((actual) => actual.map((paso) => (paso.clave === clave && paso.origen === 'propio' ? { ...paso, ...cambios } : paso)));
  }

  async function crear() {
    setError(false);
    try {
      await onCrear({
        titulo: titulo.trim(), franja, iconoLucide: iconoId, color,
        frecuencia, diasSemana: frecuencia === 'dias_semana' ? [...dias].sort((a, b) => a - b) : null,
        horaInicio: recordatorio ? hora : null, recordatorioActivo: recordatorio, mostrarNombreNotificacion: mostrarNombre,
        pasos: pasos.map(aPasoNuevo),
      });
      hapticSeguro('confirmacion');
      onCerrar();
    } catch {
      setError(true);
    }
  }

  const tituloEtapa = t(`rutinas.crear.paso${etapa === 'identidad' ? 'Identidad' : etapa === 'pasos' ? 'Pasos' : etapa === 'programacion' ? 'Programacion' : 'Revision'}`);
  const esUltima = etapaIndice === ETAPAS.length - 1;

  return (
    <Modal animationType="slide" onRequestClose={onCerrar} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaProvider>
        <SafeAreaView style={estilos.raiz}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={estilos.cabecera}>
              <Pressable accessibilityLabel={t('rutinas.crear.cerrar')} accessibilityRole="button" hitSlop={10} onPress={onCerrar} style={estilos.cerrar}><X color={C.texto} size={22} /></Pressable>
              <View style={estilos.puntos}>
                {ETAPAS.map((clave, indice) => <View key={clave} style={[estilos.punto, indice <= etapaIndice && { backgroundColor: color }]} />)}
              </View>
            </View>

            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Texto accessibilityRole="header" style={estilos.titulo}>{tituloEtapa}</Texto>

              {etapa === 'identidad' && (
                <View style={estilos.bloque}>
                  <TextInput maxFontSizeMultiplier={1.3} maxLength={80} onChangeText={setTitulo} placeholder={t('rutinas.crear.nombrePlaceholder')} placeholderTextColor={C.tenue} style={estilos.campo} value={titulo} />
                  <Texto style={estilos.etiqueta}>{t('rutinas.crear.franja')}</Texto>
                  <View style={estilos.chips}>
                    {FRANJAS_ELEGIBLES.map((opcion) => <MasterChip activo={franja === opcion} key={opcion} onPress={() => setFranja(opcion)} texto={t(`rutinas.franjas.${opcion}`)} />)}
                  </View>
                  <View style={estilos.iconos}>
                    {ICONOS_RUTINA.map((id) => {
                      const icono = buscarIconoHabito(id);
                      const activo = iconoId === id;
                      return (
                        <Pressable accessibilityLabel={icono?.etiqueta ?? id} accessibilityRole="button" accessibilityState={{ selected: activo }} key={id} onPress={() => { hapticSeguro('seleccion'); setIconoId(id); }} style={[estilos.icono, activo && { borderColor: color, borderWidth: 2 }]}>
                          {icono ? <Image resizeMode="contain" source={icono.fuente} style={estilos.iconoImagen} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {etapa === 'pasos' && (
                <View style={estilos.bloque}>
                  <Texto style={estilos.ayuda}>{t('rutinas.crear.pasosTitulo')}</Texto>
                  {pasos.length === 0 && agregando === null ? <Texto style={estilos.ayuda}>{t('rutinas.crear.pasosVacio')}</Texto> : null}
                  {pasos.map((paso, indice) => (
                    <MasterGlass key={paso.clave} style={estilos.paso}>
                      <View style={estilos.pasoFila}>
                        <View style={estilos.orden}><Texto style={estilos.ordenTexto}>{indice + 1}</Texto></View>
                        <View style={{ flex: 1 }}>
                          {paso.origen === 'propio' ? (
                            <TextInput maxFontSizeMultiplier={1.3} maxLength={80} onChangeText={(texto) => actualizarPropio(paso.clave, { titulo: texto })} placeholder={t('rutinas.crear.pasoPropioPlaceholder')} placeholderTextColor={C.tenue} style={estilos.campoPaso} value={paso.titulo} />
                          ) : (
                            <Texto numberOfLines={1} style={estilos.pasoTitulo}>{paso.titulo}</Texto>
                          )}
                          <Texto style={estilos.pasoOrigen}>{t(paso.origen === 'habito' ? 'rutinas.crear.agregarHabito' : paso.origen === 'tarea' ? 'rutinas.crear.agregarTarea' : 'rutinas.crear.agregarPropio')}</Texto>
                        </View>
                        <Pressable accessibilityLabel={`${t('rutinas.crear.quitar')}: ${paso.titulo}`} accessibilityRole="button" hitSlop={8} onPress={() => setPasos((actual) => actual.filter((otro) => otro.clave !== paso.clave))} style={estilos.accion}><X color={C.tenue} size={16} /></Pressable>
                      </View>
                      {paso.origen === 'propio' ? (
                        <View style={estilos.modos}>
                          {MODOS.map((modo) => <MasterChip activo={paso.modo === modo} key={modo} onPress={() => actualizarPropio(paso.clave, { modo })} texto={t(modo === 'simple' ? 'rutinas.crear.modoSimple' : modo === 'cronometro' ? 'rutinas.crear.modoCronometro' : 'rutinas.crear.modoContador')} />)}
                        </View>
                      ) : null}
                      {paso.origen === 'propio' && paso.modo !== 'simple' ? (
                        <View style={estilos.objetivoFila}>
                          <TextInput keyboardType="decimal-pad" maxFontSizeMultiplier={1.3} onChangeText={(texto) => actualizarPropio(paso.clave, { objetivo: texto })} placeholder={t(paso.modo === 'cronometro' ? 'rutinas.crear.objetivoMinutos' : 'rutinas.crear.objetivoCantidad')} placeholderTextColor={C.tenue} style={[estilos.campoPaso, { flex: 1 }, leerObjetivo(paso.objetivo) === null && estilos.campoInvalido]} value={paso.objetivo} />
                          {paso.modo === 'contador' ? <TextInput maxFontSizeMultiplier={1.3} maxLength={32} onChangeText={(texto) => actualizarPropio(paso.clave, { unidad: texto })} placeholder={t('rutinas.crear.unidadPlaceholder')} placeholderTextColor={C.tenue} style={[estilos.campoPaso, { flex: 1 }]} value={paso.unidad} /> : null}
                        </View>
                      ) : null}
                      <View style={estilos.mover}>
                        <Pressable accessibilityLabel={`${paso.titulo} ↑`} accessibilityRole="button" disabled={indice === 0} hitSlop={8} onPress={() => moverPaso(indice, -1)} style={[estilos.accion, indice === 0 && { opacity: 0.3 }]}><ArrowUp color={C.tenue} size={16} /></Pressable>
                        <Pressable accessibilityLabel={`${paso.titulo} ↓`} accessibilityRole="button" disabled={indice === pasos.length - 1} hitSlop={8} onPress={() => moverPaso(indice, 1)} style={[estilos.accion, indice === pasos.length - 1 && { opacity: 0.3 }]}><ArrowDown color={C.tenue} size={16} /></Pressable>
                      </View>
                    </MasterGlass>
                  ))}

                  {agregando === 'habito' || agregando === 'tarea' ? (
                    <MasterGlass style={estilos.selector}>
                      <Texto style={estilos.etiqueta}>{t(agregando === 'habito' ? 'rutinas.crear.elegirHabito' : 'rutinas.crear.elegirTarea')}</Texto>
                      {(agregando === 'habito' ? habitos.length === 0 : tareas.length === 0)
                        ? <Texto style={estilos.ayuda}>{t(agregando === 'habito' ? 'rutinas.crear.sinHabitos' : 'rutinas.crear.sinTareas')}</Texto>
                        : null}
                      {agregando === 'habito'
                        ? habitos.map((habito) => {
                          const usado = idsHabitosUsados.has(habito.id);
                          return (
                            <Pressable accessibilityRole="button" accessibilityState={{ disabled: usado }} disabled={usado} key={habito.id} onPress={() => agregarPaso({ clave: nuevaClave(), origen: 'habito', habitoId: habito.id, titulo: habito.titulo })} style={[estilos.opcion, usado && { opacity: 0.4 }]}>
                              <Texto numberOfLines={1} style={estilos.pasoTitulo}>{habito.titulo}</Texto>
                              {usado ? <Check color={C.tenue} size={16} /> : null}
                            </Pressable>
                          );
                        })
                        : tareas.map((tarea) => {
                          const usada = idsTareasUsadas.has(tarea.id);
                          return (
                            <Pressable accessibilityRole="button" accessibilityState={{ disabled: usada }} disabled={usada} key={tarea.id} onPress={() => agregarPaso({ clave: nuevaClave(), origen: 'tarea', tareaId: tarea.id, titulo: tarea.titulo })} style={[estilos.opcion, usada && { opacity: 0.4 }]}>
                              <Texto numberOfLines={1} style={estilos.pasoTitulo}>{tarea.titulo}</Texto>
                              {usada ? <Check color={C.tenue} size={16} /> : null}
                            </Pressable>
                          );
                        })}
                      <Pressable accessibilityRole="button" onPress={() => setAgregando(null)} style={estilos.opcion}><Texto style={estilos.cancelar}>{t('rutinas.misRutinas.cancelar')}</Texto></Pressable>
                    </MasterGlass>
                  ) : (
                    <View style={estilos.chips}>
                      <MasterChip icono={<Plus color={C.texto} size={14} />} onPress={() => { if (!llenaDePasos) agregarPaso({ clave: nuevaClave(), origen: 'propio', titulo: '', modo: 'simple', objetivo: '', unidad: '' }); }} texto={t('rutinas.crear.agregarPropio')} />
                      <MasterChip icono={<Plus color={C.texto} size={14} />} onPress={() => { if (!llenaDePasos) setAgregando('habito'); }} texto={t('rutinas.crear.agregarHabito')} />
                      <MasterChip icono={<Plus color={C.texto} size={14} />} onPress={() => { if (!llenaDePasos) setAgregando('tarea'); }} texto={t('rutinas.crear.agregarTarea')} />
                    </View>
                  )}
                  {llenaDePasos ? <Texto style={estilos.ayuda}>{t('rutinas.crear.maxPasos', { count: MAX_PASOS_RUTINA })}</Texto> : null}
                </View>
              )}

              {etapa === 'programacion' && (
                <View style={estilos.bloque}>
                  <Texto style={estilos.etiqueta}>{t('rutinas.crear.frecuencia')}</Texto>
                  <View style={estilos.chips}>
                    <MasterChip activo={frecuencia === 'diaria'} onPress={() => setFrecuencia('diaria')} texto={t('rutinas.crear.todosLosDias')} />
                    <MasterChip activo={frecuencia === 'dias_semana'} onPress={() => setFrecuencia('dias_semana')} texto={t('rutinas.crear.diasEspecificos')} />
                  </View>
                  {frecuencia === 'dias_semana' ? (
                    <View style={estilos.diasFila}>
                      {DIAS.map((dia) => {
                        const activo = dias.includes(dia);
                        return (
                          <Pressable accessibilityLabel={t(`rutinas.crear.d${dia}`)} accessibilityRole="checkbox" accessibilityState={{ checked: activo }} key={dia} onPress={() => { hapticSeguro('seleccion'); setDias((actual) => (actual.includes(dia) ? actual.filter((otro) => otro !== dia) : [...actual, dia])); }} style={[estilos.dia, activo && { backgroundColor: color, borderColor: color }]}>
                            <Texto style={[estilos.diaTexto, activo && { color: '#FFFFFF' }]}>{t(`rutinas.crear.d${dia}`)}</Texto>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  <View style={estilos.interruptor}>
                    <View style={{ flex: 1 }}>
                      <Texto style={estilos.pasoTitulo}>{t('rutinas.crear.recordatorio')}</Texto>
                      <Texto style={estilos.ayuda}>{t('rutinas.crear.recordatorioDescripcion')}</Texto>
                    </View>
                    <Switch accessibilityLabel={t('rutinas.crear.recordatorio')} onValueChange={setRecordatorio} thumbColor="#FFFFFF" trackColor={{ false: '#D8D3CD', true: color }} value={recordatorio} />
                  </View>
                  {recordatorio ? (
                    <View style={estilos.bloque}>
                      <SelectorHora12 hora={hora} onCambiar={setHora} />
                      {sugerida && sugerida !== franja ? (
                        <View style={estilos.sugerencia}>
                          <Texto style={[estilos.ayuda, { flex: 1 }]}>{t('rutinas.crear.sugerenciaFranja', { franja: t(`rutinas.franjas.${sugerida}`) })}</Texto>
                          <MasterChip onPress={() => setFranja(sugerida)} texto={t('rutinas.crear.usarSugerencia')} />
                        </View>
                      ) : null}
                      <View style={estilos.interruptor}>
                        <Texto style={[estilos.ayuda, { flex: 1 }]}>{t('rutinas.crear.mostrarNombre')}</Texto>
                        <Switch accessibilityLabel={t('rutinas.crear.mostrarNombre')} onValueChange={setMostrarNombre} thumbColor="#FFFFFF" trackColor={{ false: '#D8D3CD', true: color }} value={mostrarNombre} />
                      </View>
                    </View>
                  ) : null}
                </View>
              )}

              {etapa === 'revision' && (
                <View style={estilos.bloque}>
                  <MasterGlass style={estilos.resumen}>
                    <Texto style={estilos.resumenTitulo}>{titulo.trim()}</Texto>
                    <Texto style={estilos.ayuda}>
                      {[
                        t(`rutinas.franjas.${franja}`),
                        frecuencia === 'diaria' ? t('rutinas.crear.todosLosDias') : [...dias].sort((a, b) => a - b).map((dia) => t(`rutinas.crear.d${dia}`)).join(' '),
                        t('rutinas.crear.resumenPasos', { count: pasos.length }),
                        recordatorio ? formatoHora12(hora) : null,
                      ].filter(Boolean).join(' · ')}
                    </Texto>
                    {pasos.map((paso, indice) => <Texto key={paso.clave} numberOfLines={1} style={estilos.resumenPaso}>{indice + 1}. {paso.titulo.trim()}</Texto>)}
                  </MasterGlass>
                  {error ? <Texto style={estilos.error}>{t('rutinas.crear.errorCrear')}</Texto> : null}
                </View>
              )}
            </ScrollView>

            <View style={estilos.pie}>
              {etapaIndice > 0 ? <View style={{ flex: 1 }}><Boton color={color} onPress={() => setEtapaIndice((actual) => actual - 1)} variante="secundario">{t('rutinas.crear.atras')}</Boton></View> : null}
              <View style={{ flex: 2 }}>
                <Boton color={color} disabled={!puedeContinuar || guardando} onPress={() => (esUltima ? void crear() : setEtapaIndice((actual) => actual + 1))} variante="sendero">
                  {esUltima ? (guardando ? t('rutinas.crear.creando') : t('rutinas.crear.crear')) : t('rutinas.crear.siguiente')}
                </Boton>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { backgroundColor: '#F6F3FB', flex: 1 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  cerrar: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  puntos: { flex: 1, flexDirection: 'row', gap: 5 },
  punto: { backgroundColor: '#DDD6E9', borderRadius: 4, flex: 1, height: 5 },
  contenido: { gap: 16, padding: 20, paddingBottom: 40 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 28, lineHeight: 34 },
  bloque: { gap: 12 },
  etiqueta: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  ayuda: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  campo: { backgroundColor: C.campo, borderColor: C.borde, borderRadius: 14, borderWidth: 1, color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 16, padding: 14 },
  campoPaso: { backgroundColor: C.campo, borderColor: C.borde, borderRadius: 12, borderWidth: 1, color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 14, padding: 10 },
  campoInvalido: { borderColor: C.error },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  icono: { alignItems: 'center', backgroundColor: C.campo, borderColor: C.borde, borderRadius: 14, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  iconoImagen: { height: 34, width: 34 },
  paso: { borderRadius: 16, gap: 10, padding: 12 },
  pasoFila: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  orden: { alignItems: 'center', backgroundColor: 'rgba(26,19,53,0.08)', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  ordenTexto: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  pasoTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  pasoOrigen: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 2 },
  accion: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  modos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  objetivoFila: { flexDirection: 'row', gap: 8 },
  mover: { flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  selector: { borderRadius: 16, gap: 4, padding: 12 },
  opcion: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingVertical: 8 },
  cancelar: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  diasFila: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  dia: { alignItems: 'center', backgroundColor: C.campo, borderColor: C.borde, borderRadius: 12, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  diaTexto: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  interruptor: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  sugerencia: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  resumen: { borderRadius: 18, gap: 6, padding: 14 },
  resumenTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 18 },
  resumenPaso: { color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  error: { color: C.error, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  pie: { flexDirection: 'row', gap: 10, paddingBottom: 16, paddingHorizontal: 20, paddingTop: 8 },
});
