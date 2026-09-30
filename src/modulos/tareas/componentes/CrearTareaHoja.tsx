import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, Clock3 } from 'lucide-react-native';

import { Boton, HojaDeslizante, Rebote, RecuadroGlass, Texto } from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { TOPE_ESCALA_TEXTO_COMPACTO } from '../../../diseno/fundamentos/accesibilidad';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { actualizarPreferenciaNotificacion } from '../../configuracion/configuracion.servicio';
import { obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../../tienda/gemas.servicio';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import type { CrearTareaInput, FrecuenciaTarea, PrioridadTarea } from '../tareas.tipos';

type CrearTareaHojaProps = {
  guardando: boolean;
  onCerrar: () => void;
  onCrear: (input: CrearTareaInput & { semillaId: string | null }) => void;
};

function fechaISO(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}

const OPCIONES_FECHA: { clave: string; valor: string | null }[] = [
  { clave: 'hoy', valor: fechaISO(0) },
  { clave: 'manana', valor: fechaISO(1) },
  { clave: 'semana', valor: fechaISO(7) },
  { clave: 'sinFecha', valor: null },
];

const OPCIONES_PRIORIDAD: { clave: string; valor: PrioridadTarea | null }[] = [
  { clave: 'urgenteImportante', valor: 'urgente_importante' },
  { clave: 'urgenteNoImportante', valor: 'urgente_no_importante' },
  { clave: 'noUrgenteImportante', valor: 'no_urgente_importante' },
  { clave: 'noUrgenteNoImportante', valor: 'no_urgente_no_importante' },
  { clave: 'sinPrioridad', valor: null },
];

const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7];
const HORA_VALIDA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Espejo liviano del selector de semillas del wizard de hábitos (CrearHabitoWizard):
// una tarjeta de color por paquete con semillas libres, agrupadas por familia
// de color. No se comparte el componente porque ese archivo ya es sensible —
// acá alcanza con la versión simple, sin las animaciones de revelado.
export function CrearTareaHoja({ guardando, onCerrar, onCrear }: CrearTareaHojaProps) {
  const { t } = useTranslation();
  const consultaSemillas = useQuery({ queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  const consultaPaquetes = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const [titulo, setTitulo] = useState('');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaTarea>('una_vez');
  const [fecha, setFecha] = useState<string | null>(OPCIONES_FECHA[0].valor);
  const [diasSemana, setDiasSemana] = useState<number[]>(DIAS_SEMANA);
  const [prioridad, setPrioridad] = useState<PrioridadTarea | null>(null);
  const [semillaSeleccionada, setSemillaSeleccionada] = useState<string | null>(null);
  const [recordatorio, setRecordatorio] = useState(false);
  const [hora, setHora] = useState('08:00');
  const [horaPersonalizada, setHoraPersonalizada] = useState(false);
  const [mostrarNombre, setMostrarNombre] = useState(true);

  // Mismo patrón que el paso 4 de CrearHabitoWizard: pedir el permiso recién
  // al prender el switch, y apagarlo solo si de verdad no se concedió — sin
  // volver a insistir automáticamente después de un "denegado".
  useEffect(() => {
    if (!recordatorio) return;
    void solicitarPermisoYRegistrar().then((resultado) => {
      if (resultado.estado !== 'concedido') { setRecordatorio(false); return; }
      void actualizarPreferenciaNotificacion('tarea_recordatorio', true).catch(() => undefined);
    }).catch(() => setRecordatorio(false));
  }, [recordatorio]);

  const paquetePorId = useMemo(() => new Map((consultaPaquetes.data ?? []).map((paquete) => [paquete.id, paquete])), [consultaPaquetes.data]);
  const semillasPorPaquete = useMemo(() => {
    const agrupadas = new Map<string, string[]>();
    for (const semilla of consultaSemillas.data ?? []) {
      const lista = agrupadas.get(semilla.paqueteId) ?? [];
      lista.push(semilla.id);
      agrupadas.set(semilla.paqueteId, lista);
    }
    return [...agrupadas.entries()]
      .map(([paqueteId, semillaIds]) => ({ paquete: paquetePorId.get(paqueteId), semillaIds }))
      .filter((grupo): grupo is { paquete: NonNullable<typeof grupo.paquete>; semillaIds: string[] } => Boolean(grupo.paquete))
      .sort((a, b) => colorMasterMasCercano(a.paquete.masterPackColor) - colorMasterMasCercano(b.paquete.masterPackColor));
  }, [consultaSemillas.data, paquetePorId]);

  const semillaInfo = semillasPorPaquete.find((grupo) => grupo.semillaIds.includes(semillaSeleccionada ?? ''));
  const horaValida = HORA_VALIDA_REGEX.test(hora);
  const puedeCrear = titulo.trim().length > 0
    && (frecuencia === 'una_vez' || diasSemana.length > 0)
    && (!recordatorio || horaValida)
    && !guardando;

  function alternarDia(dia: number) {
    setDiasSemana((actual) => (actual.includes(dia) ? actual.filter((x) => x !== dia) : [...actual, dia].sort()));
  }

  function confirmar() {
    if (!puedeCrear) return;
    // El color se decide ACÁ, no en asignar_semilla_tarea (que solo toca
    // paquete_id) — mismo criterio que el wizard de hábitos con
    // habitos_items.color antes de llamar a asignar_semilla_habito.
    onCrear({
      color: semillaInfo?.paquete.masterPackColor ?? null,
      diasSemana: frecuencia === 'dias_semana' ? diasSemana : null,
      fechaVencimiento: frecuencia === 'una_vez' ? fecha : null,
      frecuencia,
      horaRecordatorio: recordatorio ? hora : null,
      mostrarNombreNotificacion: mostrarNombre,
      paqueteId: semillaInfo?.paquete.id ?? null,
      prioridad,
      recordatorioActivo: recordatorio,
      semillaId: semillaSeleccionada,
      titulo,
    });
  }

  return (
    <HojaDeslizante alturaFija onCerrar={onCerrar}>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 6 }}>
        <Texto variante="subtitulo">{t('tareas.pantalla.nuevaTarea')}</Texto>
        <TextInput
          autoFocus
          keyboardAppearance="light"
          maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
          onChangeText={setTitulo}
          placeholder={t('tareas.pantalla.tituloPlaceholder')}
          style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14 }}
          value={titulo}
        />

        <View>
          <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13, marginBottom: 8 }}>{t('tareas.pantalla.frecuencia.titulo')}</Texto>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['una_vez', 'dias_semana'] as const).map((opcion) => {
              const activa = frecuencia === opcion;
              return (
                <Rebote key={opcion} onPress={() => { hapticSeguro('seleccion'); setFrecuencia(opcion); }} estilo={{ backgroundColor: activa ? '#1A1335' : '#F5F3F9', borderRadius: 13, flex: 1, paddingVertical: 10 }}>
                  <Texto style={{ color: activa ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{t(`tareas.pantalla.frecuencia.${opcion === 'una_vez' ? 'unaVez' : 'diasSemana'}`)}</Texto>
                </Rebote>
              );
            })}
          </View>
        </View>

        {frecuencia === 'una_vez' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {OPCIONES_FECHA.map((opcion) => {
              const activa = fecha === opcion.valor;
              return (
                <Rebote key={opcion.clave} onPress={() => setFecha(opcion.valor)} estilo={{ backgroundColor: activa ? '#1A1335' : '#F5F3F9', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <Texto style={{ color: activa ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t(`tareas.pantalla.fecha.${opcion.clave}`)}</Texto>
                </Rebote>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('tareas.pantalla.frecuencia.elegirDias')}</Texto>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {DIAS_SEMANA.map((dia) => {
                const activo = diasSemana.includes(dia);
                return (
                  <Rebote key={dia} onPress={() => alternarDia(dia)} estilo={{ alignItems: 'center', backgroundColor: activo ? '#1A1335' : '#F5F3F9', borderRadius: 15, height: 44, justifyContent: 'center', width: 38 }}>
                    <Texto style={{ color: activo ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t(`tareas.pantalla.frecuencia.dias.${dia - 1}`)}</Texto>
                  </Rebote>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Rebote estilo={{ backgroundColor: '#F5F3F9', borderRadius: 12, flex: 1, paddingVertical: 9 }} onPress={() => setDiasSemana(DIAS_SEMANA)}>
                <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 11, textAlign: 'center' }}>{t('tareas.pantalla.frecuencia.todosLosDias')}</Texto>
              </Rebote>
              <Rebote estilo={{ backgroundColor: '#F5F3F9', borderRadius: 12, flex: 1, paddingVertical: 9 }} onPress={() => setDiasSemana([1, 2, 3, 4, 5])}>
                <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 11, textAlign: 'center' }}>{t('tareas.pantalla.frecuencia.diasDeSemana')}</Texto>
              </Rebote>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OPCIONES_PRIORIDAD.map((opcion) => {
            const activa = prioridad === opcion.valor;
            return (
              <Rebote key={opcion.clave} onPress={() => setPrioridad(opcion.valor)} estilo={{ backgroundColor: activa ? '#EEE8FB' : '#F5F3F9', borderColor: activa ? '#7C3AED' : 'transparent', borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Texto style={{ color: activa ? '#5B21B6' : '#7B7494', fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{t(`tareas.pantalla.prioridad.${opcion.clave}`)}</Texto>
              </Rebote>
            );
          })}
        </View>

        {semillasPorPaquete.length > 0 && (
          <View>
            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('tareas.pantalla.semilla.titulo')}</Texto>
            <Texto style={{ color: '#7B7494', fontSize: 12, marginTop: 2, marginBottom: 8 }}>{t('tareas.pantalla.semilla.descripcion')}</Texto>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', gap: 10 }} horizontal showsHorizontalScrollIndicator={false}>
              {semillasPorPaquete.map(({ paquete, semillaIds }) => {
                const activa = semillaIds.includes(semillaSeleccionada ?? '');
                return (
                  <Rebote
                    accessibilityLabel={paquete.nombre}
                    key={paquete.id}
                    onPress={() => setSemillaSeleccionada(activa ? null : semillaIds[0])}
                    estilo={{ alignItems: 'center', backgroundColor: paquete.masterPackColor, borderColor: activa ? '#1A1335' : 'transparent', borderRadius: 999, borderWidth: 3, height: 44, justifyContent: 'center', width: 44 }}
                  >
                    {activa ? <Check color="#FFFFFF" size={18} strokeWidth={3} /> : null}
                  </Rebote>
                );
              })}
            </ScrollView>
          </View>
        )}

        <RecuadroGlass blur style={{ borderRadius: 20, borderWidth: 0, padding: 14 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }}><Bell size={28} /></View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 14 }}>{t('tareas.pantalla.recordatorio.titulo')}</Texto>
              <Texto style={{ color: '#7B7494', fontSize: 11 }}>{recordatorio ? t('tareas.pantalla.recordatorio.activadoDescripcion') : t('tareas.pantalla.recordatorio.desactivadoDescripcion')}</Texto>
            </View>
            <Switch value={recordatorio} onValueChange={(valor) => { hapticSeguro('seleccion'); setRecordatorio(valor); }} />
          </View>
          {recordatorio && (
            <View style={{ gap: 10, marginTop: 14 }}>
              <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('tareas.pantalla.recordatorio.elegirHora')}</Texto>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['08:00', '13:00', '20:00'].map((valor) => (
                  <Rebote key={valor} estilo={{ backgroundColor: !horaPersonalizada && hora === valor ? '#1A1335' : '#FFFFFF', borderRadius: 12, flex: 1, paddingVertical: 9 }} onPress={() => { setHora(valor); setHoraPersonalizada(false); }}>
                    <Texto style={{ color: !horaPersonalizada && hora === valor ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{valor}</Texto>
                  </Rebote>
                ))}
              </View>
              <Rebote estilo={{ alignItems: 'center', backgroundColor: horaPersonalizada ? '#EEE8FB' : '#FFFFFF', borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 10 }} onPress={() => setHoraPersonalizada(true)}>
                <Clock3 color="#5B21B6" size={15} /><Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('tareas.pantalla.recordatorio.otraHora')}</Texto>
              </Rebote>
              {horaPersonalizada && (
                <View>
                  <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 11, marginBottom: 6 }}>{t('tareas.pantalla.recordatorio.horaPersonalizada')}</Texto>
                  <TextInput
                    keyboardAppearance="light"
                    keyboardType="numbers-and-punctuation"
                    maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
                    maxLength={5}
                    onChangeText={setHora}
                    placeholder={t('tareas.pantalla.recordatorio.horaMarcador')}
                    placeholderTextColor="#9A93A8"
                    style={{ backgroundColor: '#FFFFFF', borderRadius: 12, color: horaValida ? '#1A1335' : '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 18, padding: 12 }}
                    value={hora}
                  />
                  <Texto style={{ color: horaValida ? '#7B7494' : '#B64747', fontSize: 11, marginTop: 4 }}>{horaValida ? t('tareas.pantalla.recordatorio.horaValida') : t('tareas.pantalla.recordatorio.horaInvalida')}</Texto>
                </View>
              )}
              <View style={{ alignItems: 'center', flexDirection: 'row', marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('tareas.pantalla.recordatorio.incluirNombre')}</Texto>
                  <Texto style={{ color: '#7B7494', fontSize: 11 }}>{mostrarNombre ? t('tareas.pantalla.recordatorio.conNombre', { title: titulo.trim() || t('tareas.pantalla.tituloPlaceholder') }) : t('tareas.pantalla.recordatorio.sinNombre')}</Texto>
                </View>
                <Switch value={mostrarNombre} onValueChange={setMostrarNombre} />
              </View>
            </View>
          )}
        </RecuadroGlass>

        <Boton color="#1A1335" disabled={!puedeCrear} onPress={confirmar} style={{ marginTop: 4 }}>
          {guardando ? t('tareas.pantalla.creando') : t('tareas.pantalla.crear')}
        </Boton>
      </ScrollView>
    </HojaDeslizante>
  );
}
