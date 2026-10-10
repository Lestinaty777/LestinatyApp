import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, LayoutList, Plus, Shapes } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstadoVacioModulo, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, Texto } from '../../../diseno';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { registrarEvento } from '../../../servicios/analitica/posthog';
import { nombreArea } from '../../areas/areas.mapper';
import { archivarArea, CLAVE_AREAS, crearArea, ErrorAreaDuplicada, obtenerAreas } from '../../areas/areas.servicio';
import type { AreaVida, CrearAreaInput } from '../../areas/areas.tipos';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { ContenidoMeta, SelectorElementosMeta } from '../componentes/ElementosMeta';
import { FormularioMeta } from '../componentes/FormularioMeta';
import { ListaAreas, type ErrorCrearArea } from '../componentes/ListaAreas';
import { TarjetaMeta, type AccionMeta } from '../componentes/TarjetaMeta';
import { contarMetasPorArea, filtrarMetasPorArea, resumirMetas, SIN_AREA_META, type ElementoDeMeta, type FiltroAreaMeta } from '../metas.logica';
import { progresoPlazoMeta } from '../metas.mapper';
import {
  archivarMeta, asignarMeta, CLAVE_ELEMENTOS_DE_METAS, CLAVE_METAS, crearMeta, editarMeta, marcarMetaLograda, obtenerElementosDeMetas, obtenerMetas,
  pausarMeta, reabrirMeta,
} from '../metas.servicio';
import type { CrearMetaInput, MetaVida } from '../metas.tipos';
import { COLOR_PAQUETE_METAS, PAQUETE_METAS } from '../temaMetas';

// Vista por defecto: metas en curso. Las cuatro pestañas (accesos) cambian el
// panel; "creacion" no es una vista, abre el formulario. Volver a tocar la
// pestaña activa regresa a "en curso", igual que en Hábitos, Tareas y Rutinas.
type VistaPanel = 'activas' | 'mis' | 'logradas' | 'areas';
const ICONOS_VISTA: Record<VistaPanel, string> = { activas: 'sol', mis: 'progreso', logradas: 'trofeo', areas: 'metas' };
const ACCESOS = [
  { id: 'mis', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' },
  { id: 'logradas', nombreIcono: 'trofeo' }, { id: 'areas', nombreIcono: 'metas' },
] as const;

export function MetasPantalla() {
  return (
    <TonoDelHabito colorPaquete={COLOR_PAQUETE_METAS} paqueteId={PAQUETE_METAS}>
      <MetasPantallaContenido />
    </TonoDelHabito>
  );
}

function MetasPantallaContenido() {
  const esc = useEscala();
  const s = useEstilos();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const { acento } = useTonoMaster();
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('activas');
  const [filtroArea, setFiltroArea] = useState<FiltroAreaMeta>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [metaEditando, setMetaEditando] = useState<MetaVida | null>(null);
  const [metaConContenido, setMetaConContenido] = useState<MetaVida | null>(null);
  const [metaEnCursoId, setMetaEnCursoId] = useState<string | null>(null);
  const [elementoEnCursoId, setElementoEnCursoId] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState(false);
  const [errorArea, setErrorArea] = useState<ErrorCrearArea>(null);

  const consulta = useQuery({ queryKey: CLAVE_METAS, queryFn: obtenerMetas });
  const consultaAreas = useQuery({ queryKey: CLAVE_AREAS, queryFn: obtenerAreas });
  const consultaElementos = useQuery({ queryKey: CLAVE_ELEMENTOS_DE_METAS, queryFn: obtenerElementosDeMetas });

  // La pestaña queda montada: al volver (p. ej. tras crear un hábito con meta en otra pantalla)
  // los conteos y el contenido se vuelven a pedir.
  const { refetch: recargarMetas } = consulta;
  const { refetch: recargarElementos } = consultaElementos;
  useFocusEffect(useCallback(() => { void recargarMetas(); void recargarElementos(); }, [recargarMetas, recargarElementos]));

  const metas = consulta.data ?? [];
  const areas = consultaAreas.data ?? [];
  const resumen = useMemo(() => resumirMetas(metas), [metas]);
  const conteosPorArea = useMemo(() => contarMetasPorArea(metas), [metas]);
  const filtradas = useMemo(() => filtrarMetasPorArea(metas, filtroArea), [metas, filtroArea]);
  const visibles = useMemo(() => {
    if (vistaPanel === 'logradas') return filtradas.filter((meta) => meta.estado === 'lograda');
    if (vistaPanel === 'mis') return filtradas.filter((meta) => meta.estado === 'activa' || meta.estado === 'pausada');
    return filtradas.filter((meta) => meta.estado === 'activa');
  }, [filtradas, vistaPanel]);
  const assets = useMemo(() => obtenerAssetsPaquete(PAQUETE_METAS), []);
  const plazoProxima = resumen.proximaAVencer ? progresoPlazoMeta(resumen.proximaAVencer) : null;

  const refrescar = () => Promise.all([
    cliente.invalidateQueries({ queryKey: CLAVE_METAS }),
    cliente.invalidateQueries({ queryKey: CLAVE_ELEMENTOS_DE_METAS }),
  ]);

  const guardarMeta = useMutation({
    mutationFn: async (input: CrearMetaInput) => {
      if (metaEditando) await editarMeta(metaEditando.id, input);
      else await crearMeta(input);
    },
    onSuccess: (_vacio, input) => {
      if (!metaEditando) registrarEvento('meta_creada', { con_plazo: input.duracionDias != null });
      return refrescar();
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ accion, meta }: { accion: 'lograr' | 'pausar' | 'reanudar' | 'reabrir' | 'archivar'; meta: MetaVida }) => {
      setMetaEnCursoId(meta.id);
      if (accion === 'lograr') return marcarMetaLograda(meta.id);
      if (accion === 'pausar') return pausarMeta(meta.id);
      if (accion === 'archivar') return archivarMeta(meta.id);
      return reabrirMeta(meta.id); // reanudar y reabrir: ambas la dejan activa
    },
    onMutate: () => setErrorAccion(false),
    onSuccess: (_vacio, { accion }) => {
      hapticSeguro(accion === 'lograr' ? 'confirmacion' : 'seleccion');
      if (accion === 'lograr') registrarEvento('meta_lograda');
      return refrescar();
    },
    onError: () => { hapticSeguro('impacto'); setErrorAccion(true); },
    onSettled: () => setMetaEnCursoId(null),
  });

  // Tocar una fila del selector: si ya está en esta meta se quita; si no, se trae aquí.
  const alternarElemento = useMutation({
    mutationFn: ({ elemento, meta }: { elemento: ElementoDeMeta; meta: MetaVida }) => {
      setElementoEnCursoId(elemento.id);
      return asignarMeta(elemento.tipo, elemento.id, elemento.metaId === meta.id ? null : meta.id);
    },
    onMutate: () => setErrorAccion(false),
    onSuccess: () => Promise.all([
      refrescar(),
      // Hoy y las pantallas de cada tipo leen meta_id para el filtro por área.
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] }),
      cliente.invalidateQueries({ queryKey: ['tareas'] }),
      cliente.invalidateQueries({ queryKey: ['rutinas', 'metas'] }),
    ]),
    onError: () => { hapticSeguro('impacto'); setErrorAccion(true); },
    onSettled: () => setElementoEnCursoId(null),
  });

  const nuevaArea = useMutation({
    mutationFn: (input: CrearAreaInput) => crearArea(input),
    onMutate: () => setErrorArea(null),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_AREAS }),
    onError: (error) => { hapticSeguro('impacto'); setErrorArea(error instanceof ErrorAreaDuplicada ? 'duplicada' : 'otro'); },
  });
  const quitarArea = useMutation({
    mutationFn: (area: AreaVida) => archivarArea(area.id),
    onSuccess: (_vacio, area) => {
      if (filtroArea === area.id) setFiltroArea(null);
      return Promise.all([cliente.invalidateQueries({ queryKey: CLAVE_AREAS }), refrescar()]);
    },
  });

  function abrirCreacion() {
    setMetaEditando(null);
    setFormularioAbierto(true);
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'creacion') { abrirCreacion(); return; }
    setVistaPanel((actual) => (actual === id ? 'activas' : id));
  }

  function alAccion(accion: AccionMeta, meta: MetaVida) {
    if (accion === 'editar') { setMetaEditando(meta); setFormularioAbierto(true); return; }
    if (accion === 'contenido') { setMetaConContenido(meta); return; }
    if (accion === 'archivar') {
      Alert.alert(t('metas.acciones.archivarTitulo', { titulo: meta.titulo }), t('metas.acciones.archivarMensaje'), [
        { style: 'cancel', text: t('metas.acciones.cancelar') },
        { onPress: () => cambiarEstado.mutate({ accion, meta }), style: 'destructive', text: t('metas.acciones.archivar') },
      ]);
      return;
    }
    cambiarEstado.mutate({ accion, meta });
  }

  // Chips de área: "Todas", cada área (del sistema y propias) y "Sin área" si alguna meta no tiene.
  const chips: { clave: FiltroAreaMeta; color: string | null; etiqueta: string }[] = [
    { clave: null, color: null, etiqueta: t('areas.todas') },
    ...areas.map((area) => ({ clave: area.id as FiltroAreaMeta, color: area.color, etiqueta: nombreArea(area, t) })),
    ...(conteosPorArea.has(null) ? [{ clave: SIN_AREA_META as FiltroAreaMeta, color: null, etiqueta: t('areas.sinArea') }] : []),
  ];

  const tituloVista = t(`metas.pantalla.vista.${vistaPanel}`);

  function vacio() {
    if (metas.length === 0) {
      // Todavía no creó ninguna meta: qué es una meta y las dos formas de empezar.
      return (
        <EstadoVacioModulo
          accion={{ Icono: Plus, onPress: abrirCreacion, texto: t('metas.pantalla.vacio.crear') }}
          accionSecundaria={{ Icono: Shapes, onPress: () => setVistaPanel('areas'), texto: t('metas.pantalla.vacio.verAreas') }}
          color={acento}
          ilustracion={assets?.semilla}
          pistas={[
            { icono: 'metas', texto: t('metas.pantalla.vacio.pistaResultado') },
            { icono: 'progreso', texto: t('metas.pantalla.vacio.pistaContenido') },
            { icono: 'calendario', texto: t('metas.pantalla.vacio.pistaPlazo') },
          ]}
          texto={t('metas.pantalla.vacioDescripcion')}
          titulo={t('metas.pantalla.vacio.titulo')}
        />
      );
    }
    // Tiene metas, pero ninguna en esta vista o en esta área.
    return (
      <EstadoVacioModulo
        accion={filtroArea !== null
          ? { Icono: LayoutList, onPress: () => setFiltroArea(null), texto: t('metas.pantalla.verTodas') }
          : { Icono: Plus, onPress: abrirCreacion, texto: t('metas.pantalla.vacio.crear') }}
        color={acento}
        ilustracion={assets?.arbusto}
        texto={t(vistaPanel === 'logradas' ? 'metas.pantalla.vacioLogradas' : filtroArea !== null ? 'metas.pantalla.vacioArea' : 'metas.pantalla.vacioVista')}
      />
    );
  }

  return (
    <>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="azul" />
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <Pressable accessibilityLabel={t('metas.pantalla.volverAlInicio')} accessibilityRole="button" onPress={() => router.navigate('/(principal)/hoy')} style={s.botonVolver}>
                  <ChevronLeft color={acento} size={24} />
                </Pressable>
                <View style={s.headerIzq}>
                  <View style={s.nombreFila}>
                    <Image source={require('../../../../assets/icons/hoy/metas.png')} style={s.saludoIcono} />
                    <Texto style={s.headerNombre}>{t('metas.pantalla.titulo')}</Texto>
                  </View>
                  <Texto style={s.headerFrase}>{t('metas.pantalla.frase')}</Texto>
                </View>
              </View>
              <View style={s.headerDer}>
                <Rebote accessibilityLabel={t('metas.pantalla.comprarGemas')} estilo={s.statPill} onPress={() => router.navigate('/(principal)/tienda')}>
                  <View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View>
                </Rebote>
                <Rebote accessibilityLabel={t('metas.pantalla.notificaciones')} onPress={() => Linking.openSettings()}>
                  <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
                </Rebote>
              </View>
            </View>

            <View style={s.heroInicio}>
              <View style={s.heroColIzq}>
                <MasterGlass style={s.nivelCard}>
                  <MasterIcon alTema name="trofeo" size={26} />
                  <View style={s.nivelInfo}>
                    <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('metas.pantalla.logradas')}</Texto><Texto style={s.nivelXP}>{resumen.logradas}/{resumen.activas + resumen.pausadas + resumen.logradas}</Texto></View>
                    <MasterProgressbar altura={10} porcentaje={resumen.porcentajeLogradas} style={s.barraMaster} />
                  </View>
                </MasterGlass>
                {resumen.proximaAVencer && plazoProxima ? (
                  <MasterGlass style={s.siguienteCard}>
                    <Texto style={s.siguienteSub}>{t('metas.pantalla.proxima')}</Texto>
                    <Texto numberOfLines={1} style={s.siguienteTitulo}>{resumen.proximaAVencer.titulo}</Texto>
                    <Texto numberOfLines={1} style={s.siguienteSub}>{t('metas.plazo', { dia: plazoProxima.dia, total: plazoProxima.total })}</Texto>
                  </MasterGlass>
                ) : null}
              </View>
              {assets ? <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image resizeMode="cover" source={assets.etapas[6]} style={s.ilustracion} /></View></View> : null}
            </View>

            {/* Áreas: un filtro que aplica a las tres vistas de metas. Arriba de las pestañas. */}
            <ScrollView contentContainerStyle={s.areasContenido} horizontal showsHorizontalScrollIndicator={false} style={s.areasFila}>
              {chips.map((chip) => {
                const activo = chip.clave === filtroArea;
                return (
                  <Pressable
                    accessibilityLabel={t('areas.filtrar', { area: chip.etiqueta })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    key={String(chip.clave)}
                    onPress={() => { hapticSeguro('seleccion'); setFiltroArea(chip.clave); if (vistaPanel === 'areas') setVistaPanel('activas'); }}
                    style={[s.chipArea, activo && { backgroundColor: acento, borderColor: acento }]}
                  >
                    {chip.color ? <View style={[s.chipAreaPunto, { backgroundColor: chip.color }, activo && s.chipAreaPuntoActivo]} /> : null}
                    <Texto style={[s.chipAreaTexto, activo && { color: '#FFFFFF' }]}>{chip.etiqueta}</Texto>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={s.accesosFila}>
              {ACCESOS.map((acceso) => (
                <View key={acceso.id} style={s.accesoTarjeta}>
                  <Rebote accessibilityLabel={t(`metas.pantalla.access.${acceso.id}.label`)} onPress={() => abrirAcceso(acceso.id)}>
                    <MasterGlass style={s.accesoGlass}>
                      <MasterIcon alTema name={acceso.nombreIcono} size={32} />
                      <View style={s.accesoTexto}>
                        <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.accesoEtiqueta}>{t(`metas.pantalla.access.${acceso.id}.label`)}</Texto>
                        <Texto numberOfLines={2} style={s.accesoDescripcion}>{t(`metas.pantalla.access.${acceso.id}.description`)}</Texto>
                      </View>
                    </MasterGlass>
                  </Rebote>
                </View>
              ))}
            </View>
          </View>

          <MasterGlass style={s.panel}>
            {vistaPanel === 'activas' ? (
              <View style={s.encabezadoHoy}>
                <View style={s.encabezadoHoyFila}>
                  {assets ? <MasterIconBg size={70}><Image resizeMode="contain" source={assets.arbusto} style={{ height: 58, width: 58 }} /></MasterIconBg> : null}
                  <View style={{ flex: 1 }}>
                    <Texto style={s.encabezadoHoyTitulo}>{tituloVista}</Texto>
                    <Texto style={s.encabezadoHoyCompletadas}>{t('metas.pantalla.activas', { count: resumen.activas })}</Texto>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.tituloFila}>
                <View style={s.tituloConIcono}>
                  <MasterIcon alTema name={ICONOS_VISTA[vistaPanel]} size={22} />
                  <Texto style={s.titulo}>{tituloVista}</Texto>
                </View>
              </View>
            )}

            {errorAccion ? <Texto accessibilityLiveRegion="polite" style={s.errorAccion}>{t('metas.acciones.error')}</Texto> : null}

            {vistaPanel === 'areas' ? (
              consultaAreas.isLoading ? <Texto style={s.vacioTexto}>{t('metas.pantalla.cargando')}</Texto> : consultaAreas.isError ? (
                <Pressable accessibilityRole="button" onPress={() => consultaAreas.refetch()}><Texto style={s.error}>{t('metas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <ListaAreas
                  areas={areas}
                  color={acento}
                  conteos={conteosPorArea}
                  creando={nuevaArea.isPending}
                  error={errorArea}
                  onArchivar={(area) => quitarArea.mutate(area)}
                  onCrear={async (input) => { try { await nuevaArea.mutateAsync(input); return true; } catch { return false; } }}
                />
              )
            ) : consulta.isLoading ? <Texto style={s.vacioTexto}>{t('metas.pantalla.cargando')}</Texto> : consulta.isError ? (
              <Pressable accessibilityRole="button" onPress={() => consulta.refetch()}><Texto style={s.error}>{t('metas.pantalla.errorCargar')}</Texto></Pressable>
            ) : visibles.length === 0 ? vacio() : (
              visibles.map((meta) => (
                <TarjetaMeta
                  color={acento}
                  contenido={<ContenidoMeta cargando={consultaElementos.isLoading} elementos={consultaElementos.data} error={consultaElementos.isError} metaId={meta.id} />}
                  key={meta.id}
                  meta={meta}
                  ocupada={metaEnCursoId === meta.id}
                  onAccion={alAccion}
                />
              ))
            )}
          </MasterGlass>
        </ScrollView>
      </LinearGradient>

      <FormularioMeta
        areaInicial={filtroArea !== null && filtroArea !== SIN_AREA_META ? filtroArea : null}
        areas={areas}
        color={acento}
        guardando={guardarMeta.isPending}
        metaInicial={metaEditando}
        onCerrar={() => setFormularioAbierto(false)}
        onGuardar={async (input) => { await guardarMeta.mutateAsync(input); }}
        visible={formularioAbierto}
      />
      <SelectorElementosMeta
        color={acento}
        elementoEnCursoId={elementoEnCursoId}
        elementos={consultaElementos.data}
        error={consultaElementos.isError}
        meta={metaConContenido}
        onAlternar={(elemento, meta) => alternarElemento.mutate({ elemento, meta })}
        onCerrar={() => setMetaConContenido(null)}
      />
    </>
  );
}

const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

// Mismo esqueleto visual que Hábitos, Tareas y Rutinas; se copia el subconjunto
// que Metas usa (igual que hizo Rutinas) para no tocar esas pantallas.
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
  areasFila: { flexGrow: 0, marginBottom: 12 }, areasContenido: { gap: 6, paddingHorizontal: 20 },
  chipArea: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 12, paddingVertical: 6 },
  chipAreaPunto: { borderRadius: 5, height: 10, width: 10 }, chipAreaPuntoActivo: { borderColor: '#FFFFFF', borderWidth: 1.5, height: 12, width: 12 },
  chipAreaTexto: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 }, accesoTarjeta: { flex: 1 },
  accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 },
  accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' },
  accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' },
  accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 },
  tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  errorAccion: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 12, marginBottom: 8 },
  vacio: { alignItems: 'center', gap: 8, paddingVertical: 14 },
  vacioTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
  vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 4, textAlign: 'center' },
  encabezadoHoy: { marginBottom: 14 }, encabezadoHoyFila: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  encabezadoHoyTitulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 34 },
  encabezadoHoyCompletadas: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 2 },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();
function useEstilos() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) { valor = crearEstilos(esc); estilosPorEscala.set(esc, valor); }
  return valor;
}
