import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  contarPendientesPorFiltro, filtrarPorFranja, franjaActual, type FiltroFranja,
} from '../../../compartido/utilidades/franjas';
import { MasterButton, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, SelectorFranja, Texto } from '../../../diseno';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { obtenerHabitosActivos } from '../../habitos/habitos.servicio';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { obtenerTareas } from '../../tareas/tareas.servicio';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../../tienda/useSaldoGemas';
import { CrearRutinaWizard } from '../componentes/CrearRutinaWizard';
import { prepararAvisosDeRutina } from '../recordatorioRutina';
import { ListaMisRutinas } from '../componentes/ListaMisRutinas';
import { ListaRecordatoriosRutinas } from '../componentes/ListaRecordatoriosRutinas';
import { ListaRutinasHoy } from '../componentes/ListaRutinasHoy';
import { ModalCompraPlantilla, type ErrorCompraPlantilla } from '../componentes/ModalCompraPlantilla';
import { PlantillasRutinasLista } from '../componentes/PlantillasRutinasLista';
import { estaPendienteHoy, resumirDiaRutinas, siguientePaso } from '../estadoRutina';
import { esErrorGemasInsuficientes, type PlantillaRutina } from '../plantillasRutinas';
import { CLAVE_PLANTILLAS_RUTINAS, comprarPlantillaRutina, obtenerPlantillasRutinas } from '../plantillasRutinas.servicio';
import {
  actualizarRecordatorioRutina, actualizarRutina, archivarRutina, completarPasoPropioRutina, CLAVE_RUTINAS, crearRutina, obtenerRutinasHoy,
} from '../rutinas.servicio';
import type { CrearRutinaInput, PasoRutina, Rutina } from '../rutinas.tipos';
import { COLOR_PAQUETE_RUTINAS, PAQUETE_RUTINAS } from '../temaRutinas';

type VistaPanel = 'hoy' | 'progresion' | 'recordatorios' | 'plantillas';
const ICONOS_VISTA: Record<VistaPanel, string> = { hoy: 'sol', progresion: 'progreso', recordatorios: 'reloj', plantillas: 'metas' };
const ACCESOS = [
  { id: 'progresion', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' },
  { id: 'recordatorios', nombreIcono: 'reloj' }, { id: 'plantillas', nombreIcono: 'metas' },
] as const;
const FILTROS = ['manana', 'tarde', 'noche', 'todo'] as const;

export function RutinasPantalla() {
  return (
    <TonoDelHabito colorPaquete={COLOR_PAQUETE_RUTINAS} paqueteId={PAQUETE_RUTINAS}>
      <RutinasPantallaContenido />
    </TonoDelHabito>
  );
}

function RutinasPantallaContenido() {
  const esc = useEscala();
  const s = useEstilos();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const { acento } = useTonoMaster();
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  // Arranca en la franja de "ahora" y no se guarda: el botón existe para
  // mostrar lo que toca en este momento. Tampoco cambia solo si la persona
  // eligió otra a mano.
  const [filtro, setFiltro] = useState<FiltroFranja>(() => franjaActual());
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState<PlantillaRutina | null>(null);
  const [rutinaEditando, setRutinaEditando] = useState<Rutina | null>(null);
  const [pasoEnCursoId, setPasoEnCursoId] = useState<string | null>(null);
  const [recordatorioEnCursoId, setRecordatorioEnCursoId] = useState<string | null>(null);
  const [plantillaPorComprar, setPlantillaPorComprar] = useState<PlantillaRutina | null>(null);
  const [errorCompra, setErrorCompra] = useState<ErrorCompraPlantilla>(null);

  const consulta = useQuery({ queryKey: CLAVE_RUTINAS, queryFn: obtenerRutinasHoy });
  // Solo hacen falta al armar una rutina (para elegir hábitos y tareas como pasos).
  const consultaHabitos = useQuery({ enabled: crearAbierto, queryKey: ['habitos', 'activos'], queryFn: () => obtenerHabitosActivos() });
  const consultaTareas = useQuery({ enabled: crearAbierto, queryKey: ['tareas', 'lista'], queryFn: () => obtenerTareas() });
  const consultaPlantillas = useQuery({ enabled: vistaPanel === 'plantillas', queryKey: CLAVE_PLANTILLAS_RUTINAS, queryFn: obtenerPlantillasRutinas });
  const tareasElegibles = useMemo(
    () => (consultaTareas.data ?? []).filter((tarea) => tarea.estado === 'pendiente' || (tarea.estado === 'hecha' && tarea.frecuencia === 'dias_semana')),
    [consultaTareas.data],
  );

  const rutinas = consulta.data ?? [];
  const rutinasHoy = useMemo(() => rutinas.filter((rutina) => rutina.estado === 'activa' && rutina.tocaHoy), [rutinas]);
  const rutinasActivas = useMemo(() => rutinas.filter((rutina) => rutina.estado !== 'archivada'), [rutinas]);
  const conteos = useMemo(() => contarPendientesPorFiltro(rutinasHoy, estaPendienteHoy), [rutinasHoy]);
  const visibles = useMemo(() => filtrarPorFranja(rutinasHoy, filtro), [rutinasHoy, filtro]);
  const dia = useMemo(() => resumirDiaRutinas(rutinas), [rutinas]);
  const proxima = useMemo(() => rutinasHoy.find(estaPendienteHoy) ?? null, [rutinasHoy]);
  const pasoProximo = proxima ? siguientePaso(proxima.pasos) : null;

  const assets = useMemo(() => obtenerAssetsPaquete(PAQUETE_RUTINAS), []);
  const refrescar = () => cliente.invalidateQueries({ queryKey: CLAVE_RUTINAS });

  // Si la rutina lleva recordatorio, se piden el permiso y la preferencia sin frenar el guardado.
  const avisarSiHaceFalta = (input: CrearRutinaInput) => { if (input.recordatorioActivo) void prepararAvisosDeRutina(); };
  const crear = useMutation({ mutationFn: (input: CrearRutinaInput) => crearRutina(input), onSuccess: (_id, input) => { avisarSiHaceFalta(input); return refrescar(); } });
  const editar = useMutation({
    mutationFn: ({ input, rutinaId }: { input: CrearRutinaInput; rutinaId: string }) => actualizarRutina(rutinaId, input),
    onSuccess: (_vacio, { input }) => { avisarSiHaceFalta(input); return refrescar(); },
  });
  const alternarPaso = useMutation({
    mutationFn: ({ paso }: { paso: PasoRutina }) => {
      setPasoEnCursoId(paso.id);
      return completarPasoPropioRutina(paso.id, paso.completo ? 0 : paso.objetivoValor ?? 1);
    },
    onSuccess: () => { hapticSeguro('confirmacion'); return refrescar(); },
    onError: (error) => { console.error('[rutinas] no se pudo marcar el paso', error); hapticSeguro('impacto'); },
    onSettled: () => setPasoEnCursoId(null),
  });
  const cambiarRecordatorio = useMutation({
    mutationFn: async ({ cambios, rutina }: { cambios: { activo: boolean; hora: string | null }; rutina: Rutina }) => {
      setRecordatorioEnCursoId(rutina.id);
      // Sin permiso de notificaciones el aviso nunca llegaría: no se deja encendido.
      if (cambios.activo && !(await prepararAvisosDeRutina())) throw new Error('Rutinas: sin permiso de notificaciones.');
      return actualizarRecordatorioRutina(rutina.id, cambios);
    },
    onSuccess: refrescar,
    onSettled: () => setRecordatorioEnCursoId(null),
  });
  const comprar = useMutation({
    mutationFn: (plantilla: PlantillaRutina) => comprarPlantillaRutina(plantilla.id),
    onMutate: () => setErrorCompra(null),
    onSuccess: async (resultado) => {
      hapticSeguro('confirmacion');
      await Promise.all([
        cliente.invalidateQueries({ queryKey: CLAVE_PLANTILLAS_RUTINAS }),
        cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS }),
      ]);
      // Recién comprada: ya trae sus pasos, así que abre el asistente de una vez.
      const comprada = cliente.getQueryData<PlantillaRutina[]>(CLAVE_PLANTILLAS_RUTINAS)?.find((p) => p.id === resultado.plantillaId);
      setPlantillaPorComprar(null);
      if (comprada?.desbloqueada) abrirCreacion(comprada);
    },
    onError: (error) => { hapticSeguro('impacto'); setErrorCompra(esErrorGemasInsuficientes(error) ? 'gemas' : 'otro'); },
  });
  const archivar = useMutation({ mutationFn: (rutina: Rutina) => archivarRutina(rutina.id), onSuccess: refrescar });

  function abrirCreacion(desde: PlantillaRutina | null = null) {
    setRutinaEditando(null);
    setPlantilla(desde);
    setCrearAbierto(true);
  }

  function abrirEdicion(rutina: Rutina) {
    hapticSeguro('seleccion');
    setPlantilla(null);
    setRutinaEditando(rutina);
    setCrearAbierto(true);
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'creacion') { abrirCreacion(); return; }
    setVistaPanel((actual) => (actual === id ? 'hoy' : id));
  }

  const etiquetasFiltro = Object.fromEntries(FILTROS.map((f) => [f, t(`rutinas.franjas.${f}`)])) as Record<FiltroFranja, string>;

  const estadoCarga = consulta.isLoading
    ? <Texto style={s.vacioTexto}>{t('rutinas.pantalla.cargando')}</Texto>
    : consulta.isError
      ? <Pressable accessibilityRole="button" onPress={() => consulta.refetch()}><Texto style={s.error}>{t('rutinas.pantalla.errorCargar')}</Texto></Pressable>
      : null;

  function vacioHoy() {
    if (rutinas.length === 0) {
      return (
        <View style={s.vacio}>
          <Texto style={s.vacioTitulo}>{t('rutinas.pantalla.vacioTitulo')}</Texto>
          <Texto style={s.vacioTexto}>{t('rutinas.pantalla.vacioDescripcion')}</Texto>
          <MasterButton color={acento} onPress={() => abrirCreacion()}>{t('rutinas.pantalla.access.creacion.label')}</MasterButton>
        </View>
      );
    }
    if (rutinasHoy.length === 0) {
      return (
        <View style={s.vacio}>
          <Texto style={s.vacioTitulo}>{t('rutinas.pantalla.nadaHoyTitulo')}</Texto>
          <Texto style={s.vacioTexto}>{t('rutinas.pantalla.nadaHoyDescripcion')}</Texto>
        </View>
      );
    }
    return (
      <View style={s.vacio}>
        <Texto style={s.vacioTitulo}>{t('rutinas.pantalla.vacioFranjaTitulo')}</Texto>
        <Texto style={s.vacioTexto}>{t('rutinas.pantalla.vacioFranjaDescripcion')}</Texto>
        <MasterButton color={acento} onPress={() => setFiltro('todo')}>{t('rutinas.pantalla.verTodo')}</MasterButton>
      </View>
    );
  }

  return (
    <>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="rojo" />
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <Pressable accessibilityLabel={t('rutinas.pantalla.volverAlInicio')} accessibilityRole="button" onPress={() => router.navigate('/(principal)/hoy')} style={s.botonVolver}>
                  <ChevronLeft color={acento} size={24} />
                </Pressable>
                <View style={s.headerIzq}>
                  <View style={s.nombreFila}>
                    <Image source={require('../../../../assets/icons/hoy/rutinas.png')} style={s.saludoIcono} />
                    <Texto style={s.headerNombre}>{t('rutinas.pantalla.titulo')}</Texto>
                  </View>
                  <Texto style={s.headerFrase}>{t('rutinas.pantalla.frase')}</Texto>
                </View>
              </View>
              <View style={s.headerDer}>
                <Rebote accessibilityLabel={t('rutinas.pantalla.comprarGemas')} estilo={s.statPill} onPress={() => router.navigate('/(principal)/tienda')}>
                  <View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View>
                </Rebote>
                <Rebote accessibilityLabel={t('rutinas.pantalla.notificaciones')} onPress={() => Linking.openSettings()}>
                  <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
                </Rebote>
              </View>
            </View>

            <View style={s.heroInicio}>
              <View style={s.heroColIzq}>
                <MasterGlass style={s.nivelCard}>
                  <MasterIcon alTema name="trofeo" size={26} />
                  <View style={s.nivelInfo}>
                    <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('rutinas.pantalla.rutinasHoy')}</Texto><Texto style={s.nivelXP}>{dia.completadasHoy}/{dia.totalHoy}</Texto></View>
                    <MasterProgressbar altura={10} porcentaje={dia.porcentaje} style={s.barraMaster} />
                  </View>
                </MasterGlass>
                {proxima ? (
                  <MasterGlass style={s.siguienteCard}>
                    <Texto numberOfLines={1} style={s.siguienteTitulo}>{proxima.titulo}</Texto>
                    {pasoProximo ? <Texto numberOfLines={2} style={s.siguienteSub}>{t('rutinas.tarjeta.siguiente', { titulo: pasoProximo.titulo })}</Texto> : null}
                  </MasterGlass>
                ) : null}
              </View>
              {assets ? <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image resizeMode="cover" source={assets.etapas[6]} style={s.ilustracion} /></View></View> : null}
            </View>

            <View style={s.accesosFila}>
              {ACCESOS.map((acceso) => (
                <View key={acceso.id} style={s.accesoTarjeta}>
                  <Rebote accessibilityLabel={t(`rutinas.pantalla.access.${acceso.id}.label`)} onPress={() => abrirAcceso(acceso.id)}>
                    <MasterGlass style={s.accesoGlass}>
                      <MasterIcon alTema name={acceso.nombreIcono} size={32} />
                      <View style={s.accesoTexto}>
                        <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.accesoEtiqueta}>{t(`rutinas.pantalla.access.${acceso.id}.label`)}</Texto>
                        <Texto numberOfLines={2} style={s.accesoDescripcion}>{t(`rutinas.pantalla.access.${acceso.id}.description`)}</Texto>
                      </View>
                    </MasterGlass>
                  </Rebote>
                </View>
              ))}
            </View>
          </View>

          <MasterGlass style={s.panel}>
            {vistaPanel === 'hoy' ? (
              <View style={s.encabezadoHoy}>
                <View style={s.encabezadoHoyFila}>
                  {assets ? <MasterIconBg size={70}><Image resizeMode="contain" source={assets.arbusto} style={{ height: 58, width: 58 }} /></MasterIconBg> : null}
                  <View style={{ flex: 1 }}>
                    <Texto style={s.encabezadoHoyTitulo}>{t('rutinas.pantalla.vistaHoy')}</Texto>
                    <Texto style={s.encabezadoHoyCompletadas}>{t('rutinas.pantalla.completadasHoy', { completed: dia.completadasHoy, total: dia.totalHoy })}</Texto>
                    <View style={s.encabezadoHoyProgresoFila}>
                      <MasterProgressbar altura={10} porcentaje={dia.porcentaje} style={s.encabezadoHoyBarra} />
                      <Texto style={[s.encabezadoHoyPorcentaje, { color: acento }]}>{dia.porcentaje}%</Texto>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.tituloFila}>
                <View style={s.tituloConIcono}>
                  <MasterIcon alTema name={ICONOS_VISTA[vistaPanel]} size={22} />
                  <Texto style={s.titulo}>{t(vistaPanel === 'progresion' ? 'rutinas.pantalla.vistaProgresion' : vistaPanel === 'recordatorios' ? 'rutinas.pantalla.vistaRecordatorios' : 'rutinas.pantalla.vistaPlantillas')}</Texto>
                </View>
              </View>
            )}

            {vistaPanel === 'plantillas' ? (
              <PlantillasRutinasLista
                color={acento}
                error={consultaPlantillas.isError}
                onElegir={(elegida) => abrirCreacion(elegida)}
                onPrevisualizar={(bloqueada) => { setErrorCompra(null); setPlantillaPorComprar(bloqueada); }}
                onReintentar={() => consultaPlantillas.refetch()}
                plantillas={consultaPlantillas.data}
              />
            ) : estadoCarga ?? (
              <>
                {vistaPanel === 'hoy' && (
                  <>
                    <View style={s.selectorFranja}>
                      <SelectorFranja
                        color={acento}
                        conteos={conteos}
                        etiquetaAccesible={(f, pendientes) => t('rutinas.franjas.pendientes', { count: pendientes, franja: etiquetasFiltro[f] })}
                        etiquetas={etiquetasFiltro}
                        onCambiar={setFiltro}
                        valor={filtro}
                      />
                    </View>
                    {visibles.length === 0 ? vacioHoy() : (
                      <ListaRutinasHoy
                        color={acento}
                        filtro={filtro}
                        onAlternarPaso={(_rutina, paso) => { if (paso.origen === 'propio' && paso.aplica) alternarPaso.mutate({ paso }); }}
                        onEmpezar={(r) => router.push({ pathname: '/rutinas/[id]', params: { id: r.id } })}
                        pasoEnCursoId={pasoEnCursoId}
                        rutinas={visibles}
                      />
                    )}
                  </>
                )}
                {vistaPanel === 'progresion' && <ListaMisRutinas onArchivar={(rutina) => archivar.mutate(rutina)} onEditar={abrirEdicion} rutinas={rutinasActivas} />}
                {vistaPanel === 'recordatorios' && (
                  <ListaRecordatoriosRutinas
                    color={acento}
                    error={cambiarRecordatorio.isError}
                    guardandoId={recordatorioEnCursoId}
                    onCambiar={(rutina, cambios) => cambiarRecordatorio.mutate({ cambios, rutina })}
                    rutinas={rutinasActivas}
                  />
                )}
              </>
            )}
          </MasterGlass>
        </ScrollView>
      </LinearGradient>
      <ModalCompraPlantilla
        color={acento}
        comprando={comprar.isPending}
        error={errorCompra}
        onCancelar={() => setPlantillaPorComprar(null)}
        onComprar={(plantilla) => comprar.mutate(plantilla)}
        onIrAGemas={() => { setPlantillaPorComprar(null); router.navigate('/(principal)/tienda'); }}
        plantilla={plantillaPorComprar}
        saldo={saldoGemas}
      />
      <CrearRutinaWizard
        color={acento}
        guardando={crear.isPending || editar.isPending}
        habitos={consultaHabitos.data ?? []}
        onCerrar={() => setCrearAbierto(false)}
        onCrear={async (input) => {
          if (rutinaEditando) await editar.mutateAsync({ input, rutinaId: rutinaEditando.id });
          else await crear.mutateAsync(input);
        }}
        plantilla={plantilla}
        rutinaInicial={rutinaEditando}
        tareas={tareasElegibles}
        visible={crearAbierto}
      />
    </>
  );
}

const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

// Mismo esqueleto visual que TareasPantalla/HabitosPantalla; se copia el
// subconjunto que Rutinas usa en vez de exportarlo desde Tareas para no tocar
// esa pantalla.
const crearEstilos = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 },
  botonVolver: { alignItems: 'center', height: 34, justifyContent: 'center', marginRight: 2, width: 30 },
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 },
  headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 },
  nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 },
  saludoIcono: { height: 28, resizeMode: 'contain', width: 28 },
  headerFrase: { color: '#5A5A5A', fontFamily: 'MontserratAlternates-Medium', fontSize: 10, lineHeight: 13, marginTop: 3 },
  headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 },
  statPill: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statPillFila: { alignItems: 'center', flexDirection: 'row', gap: 4 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 },
  statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 },
  heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' },
  heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 },
  ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracion: { height: '100%', width: '100%' },
  nivelCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 },
  nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11 }, barraMaster: { marginTop: 2 },
  siguienteCard: { borderRadius: 16, gap: 2, padding: 10 },
  siguienteTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, siguienteSub: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12 },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 }, accesoTarjeta: { flex: 1 },
  accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 },
  accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' },
  accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' },
  accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 },
  tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  selectorFranja: { marginBottom: 12 },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  vacio: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  vacioTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
  vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 4, textAlign: 'center' },
  encabezadoHoy: { marginBottom: 14 }, encabezadoHoyFila: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  encabezadoHoyTitulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 34 },
  encabezadoHoyCompletadas: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 2 },
  encabezadoHoyProgresoFila: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 0 }, encabezadoHoyBarra: { flex: 1 },
  encabezadoHoyPorcentaje: { fontFamily: 'MontserratAlternates-Bold', fontSize: 13, minWidth: 36, textAlign: 'right' },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();

function useEstilos() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) {
    valor = crearEstilos(esc);
    estilosPorEscala.set(esc, valor);
  }
  return valor;
}
