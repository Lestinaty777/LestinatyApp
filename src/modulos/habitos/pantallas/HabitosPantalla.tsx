import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Sparkles } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Boton, MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { crearHabito, obtenerDetallesHabitosHoy, obtenerHabitoMasCercaDeNivel, obtenerHabitoMejorRacha, obtenerPanelHabitos, obtenerResumenPlanesHabitos, registrarProgresoHabito, type HabitoHoyDetalle } from '../habitos.servicio';
import { CrearHabitoWizard } from '../componentes/CrearHabitoWizard';
import { ListaProgresionHabitos } from '../componentes/ListaProgresionHabitos';
import { ListaRecordatoriosHabitos } from '../componentes/ListaRecordatoriosHabitos';
import { TarjetaSenderoHabito } from '../componentes/TarjetaSenderoHabito';
import { buscarIconoHabito, obtenerAssetsSelvaPorTono } from '../iconosHabitos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../../tienda/useSaldoGemas';
import { HabitoResumen } from '../tipos';

const DIAS_SEMANA_COMPLETA = [1, 2, 3, 4, 5, 6, 7];

type VistaPanel = 'hoy' | 'progresion' | 'recordatorios';
const TITULOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'Hoy', progresion: 'Mis Hábitos', recordatorios: 'Recordatorios' };
const ICONOS_VISTA_PANEL: Record<VistaPanel, string> = { hoy: 'sol', progresion: 'progreso', recordatorios: 'reloj' };
const HISTORIAL_VACIO: boolean[] = Array(28).fill(false);

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', verde: '#22C55E', morado: '#7C3AED', barra: '#E7E1F1', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const ACCESOS = [
  { id: 'progresion', etiqueta: 'Mis Habitos', descripcion: 'Tu avance y progreso', nombreIcono: 'progreso' },
  { id: 'creacion', etiqueta: 'Creación', descripcion: 'Arma un nuevo habito', nombreIcono: 'idea' },
  { id: 'recordatorios', etiqueta: 'Recordatorios', descripcion: 'Que no se te olvide', nombreIcono: 'reloj' },
  { id: 'insights', etiqueta: 'Insights', descripcion: 'Patrones y riesgo', nombreIcono: 'estadistica' },
] as const;

export function HabitosPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const consultaCercania = useQuery({ queryKey: ['habitos', 'cercania-nivel'], queryFn: () => obtenerHabitoMasCercaDeNivel() });
  const consultaMejorRacha = useQuery({ queryKey: ['habitos', 'mejor-racha'], queryFn: () => obtenerHabitoMejorRacha() });
  const consultaDetallesHoy = useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy(), enabled: vistaPanel === 'hoy' });
  const consultaPlanes = useQuery({ queryKey: ['habitos', 'planes-resumen'], queryFn: () => obtenerResumenPlanesHabitos(), enabled: vistaPanel === 'progresion' || vistaPanel === 'recordatorios' });
  const crear = useMutation({ mutationFn: crearHabito });
  const registrar = useMutation({
    mutationFn: registrarProgresoHabito,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      hapticSeguro(resultado.subioNivel ? 'confirmacion' : 'accion');
    },
  });
  const habitos = consulta.data?.hoy.datos ?? [];
  const detallesPorHabito = new Map((consultaDetallesHoy.data ?? []).map((detalle) => [detalle.habitoId, detalle]));
  const completados = habitos.filter((habito) => habito.completado).length;
  const porcentaje = habitos.length ? Math.round(completados * 100 / habitos.length) : 0;

  function alternarVista(vista: VistaPanel) {
    setVistaPanel((actual) => (actual === vista ? 'hoy' : vista));
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'creacion') { setCrearAbierto(true); return; }
    if (id === 'progresion') { alternarVista('progresion'); return; }
    if (id === 'recordatorios') { alternarVista('recordatorios'); return; }
    router.push('/habitos/categoria/patrones');
  }

  return <View style={s.raiz}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
    <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
      <AuroraBoreal tema="verde" />
      <View style={s.headerInicio}><View style={s.headerTitulo}><RecuadroGlass style={s.volverGlass}><Pressable accessibilityLabel="Volver a Inicio" hitSlop={12} onPress={() => router.replace('/hoy')} style={s.chevronInicio}><ChevronLeft color={C.texto} size={25} strokeWidth={2.7} /></Pressable></RecuadroGlass><View style={s.headerIzq}><View style={s.nombreFila}><Image source={require('../../../../assets/icons/hoy/habitos.png')} style={s.saludoIcono} /><Texto style={s.headerNombre}>Hábitos</Texto></View><Texto style={s.headerFrase}>Pequeñas acciones, grandes cambios.</Texto></View></View><View style={s.headerDer}><RecuadroGlass style={s.statPill}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></RecuadroGlass><RecuadroGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></RecuadroGlass></View></View>
      <View style={s.heroInicio}>
        <View style={s.heroColIzq}>
          <RecuadroGlass style={s.rachaCard}>
            <View style={s.rachaTop}>
              {consultaMejorRacha.data ? <View style={s.rachaIconoFondo}><IconoHabitoVisual color={C.verde} id={consultaMejorRacha.data.iconoLucide} size={22} /></View> : <MasterIcon color={2} name="rayo" size={22} />}
              <View style={{ flex: 1 }}><Texto numberOfLines={1} style={s.rachaTitulo}>{consultaMejorRacha.data ? consultaMejorRacha.data.titulo : 'Sin racha activa'}</Texto><Texto style={s.rachaLabel}>Mejor racha</Texto></View>
              {consultaMejorRacha.data && <Texto style={s.rachaDias}>{consultaMejorRacha.data.racha}d</Texto>}
            </View>
            <HistorialRacha historial={consultaMejorRacha.data?.historial28 ?? HISTORIAL_VACIO} />
          </RecuadroGlass>
          <RecuadroGlass style={s.nivelCard}><MasterIcon color={2} name="trofeo" size={26} /><View style={s.nivelInfo}><View style={s.nivelTexto}><Texto style={s.nivelLabel}>Hábitos hoy</Texto><Texto style={s.nivelXP}>{completados}/{habitos.length}</Texto></View><Progreso porcentaje={porcentaje} color={C.morado} /></View></RecuadroGlass>
        </View>
        <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image source={require('../../../../assets/ilustraciones/hoy/fondos/habitos.png')} style={s.ilustracionHabitos} resizeMode="cover" /></View></View>
      </View>

      <View style={s.accesosFila}>
        {ACCESOS.map((acceso) => {
          const activo = (acceso.id === 'progresion' || acceso.id === 'recordatorios') && vistaPanel === acceso.id;
          return (
            <Pressable key={acceso.id} onPress={() => abrirAcceso(acceso.id)} style={s.accesoTarjeta}>
              <RecuadroGlass style={[s.accesoGlass, activo && s.accesoGlassActivo]}>
                <MasterIcon color={2} name={acceso.nombreIcono} size={32} />
                <View style={s.accesoTexto}>
                  <Texto numberOfLines={1} style={s.accesoEtiqueta}>{acceso.etiqueta}</Texto>
                  <Texto numberOfLines={2} style={s.accesoDescripcion}>{acceso.descripcion}</Texto>
                </View>
              </RecuadroGlass>
            </Pressable>
          );
        })}
      </View>

      {consultaCercania.data && (() => {
        const habito = consultaCercania.data;
        const proximidad = Math.min(habito.porcentajeVentana1, habito.porcentajeVentana2);
        return (
          <Pressable onPress={() => router.push(`/habitos/${habito.id}`)} style={s.cercaniaTarjeta}>
            <RecuadroGlass style={s.cercaniaGlass}>
              <View style={s.cercaniaIcono}><IconoHabitoVisual color={C.verde} id={habito.iconoLucide} size={22} /></View>
              <View style={{ flex: 1 }}>
                <Texto style={s.cercaniaLabel}>A punto de subir de nivel</Texto>
                <Texto style={s.cercaniaTitulo}>{habito.titulo} · Nivel {habito.nivel} → {habito.nivel + 1}</Texto>
                <Progreso porcentaje={proximidad} color={C.verde} />
              </View>
              <Texto style={s.cercaniaPorcentaje}>{proximidad}%</Texto>
            </RecuadroGlass>
          </Pressable>
        );
      })()}
    </View>
    <RecuadroGlass style={s.panel}><View style={s.tituloFila}><View style={s.tituloConIcono}><MasterIcon color={2} name={ICONOS_VISTA_PANEL[vistaPanel]} size={22} /><Texto style={s.titulo}>{TITULOS_VISTA_PANEL[vistaPanel]}</Texto></View>{vistaPanel === 'hoy' && <Texto style={s.contador}>{completados}/{habitos.length} completados</Texto>}</View>
      {vistaPanel === 'hoy' && <>
        {consulta.isLoading && <Texto style={s.estado}>Cargando datos reales…</Texto>}
        {consulta.isError && <Pressable onPress={() => consulta.refetch()}><Texto style={s.error}>No pudimos cargar los datos. Toca para reintentar.</Texto>{__DEV__ && <Texto style={s.errorDetalle}>{consulta.error instanceof Error ? consulta.error.message : String(consulta.error)}</Texto>}</Pressable>}
        {!consulta.isLoading && !consulta.isError && <CuadriculaHabitos detallesPorHabito={detallesPorHabito} habitos={habitos} onCrear={() => setCrearAbierto(true)} onDetalle={(id) => router.push(`/habitos/${id}`)} onRegistrar={(habito) => registrar.mutate({ habitoId: habito.id, fechaLocal: new Date().toISOString().slice(0, 10), valor: habito.tipoMeta === 'check' ? (habito.completado ? 0 : 1) : Math.min(habito.meta, habito.valorHoy + 1) })} registrandoId={registrar.isPending ? registrar.variables?.habitoId ?? null : null} />}
      </>}
      {vistaPanel === 'progresion' && (
        <ListaProgresionHabitos
          isError={consultaPlanes.isError}
          isLoading={consultaPlanes.isLoading}
          onReintentar={() => consultaPlanes.refetch()}
          onSeleccionar={(id) => router.push(`/habitos/${id}`)}
          planes={consultaPlanes.data ?? []}
        />
      )}
      {vistaPanel === 'recordatorios' && (
        <ListaRecordatoriosHabitos
          isError={consultaPlanes.isError}
          isLoading={consultaPlanes.isLoading}
          onReintentar={() => consultaPlanes.refetch()}
          onSeleccionar={(id) => router.push(`/habitos/${id}`)}
          planes={consultaPlanes.data ?? []}
        />
      )}
    </RecuadroGlass>
    <CrearHabitoWizard guardando={crear.isPending} onCerrar={() => setCrearAbierto(false)} onCrear={async (input) => { await crear.mutateAsync(input); await cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] }); }} visible={crearAbierto} />
  </ScrollView></View>;
}

function Progreso({ porcentaje, color }: { porcentaje: number; color: string }) { return <View style={s.barraFondo}><View style={[s.barra, { width: `${porcentaje}%`, backgroundColor: color }]} /></View>; }
// Últimos 28 días (7x4), sin etiquetas de día — solo cumplido/no cumplido, como los cuadros de contribuciones de GitHub.
function HistorialRacha({ historial }: { historial: boolean[] }) { return <View style={s.historialGrid}>{Array.from({ length: 4 }).map((_, fila) => <View key={fila} style={s.historialFila}>{historial.slice(fila * 7, fila * 7 + 7).map((cumplido, columna) => <View key={columna} style={[s.historialCuadro, cumplido ? s.historialCuadroLleno : s.historialCuadroVacio]} />)}</View>)}</View>; }
function IconoHabitoVisual({ id, color, size }: { id?: string | null; color: string; size: number }) { const icono = buscarIconoHabito(id); return icono ? <Image source={icono.fuente} style={{ height: size, resizeMode: 'contain', width: size }} /> : <Sparkles color={color} size={size} />; }
function TarjetaHabito({ detalle, habito, onDetalle, onRegistrar, registrando }: { detalle: HabitoHoyDetalle | undefined; habito: HabitoResumen; onDetalle: () => void; onRegistrar: () => void; registrando: boolean }) {
  const icono = buscarIconoHabito(habito.iconoLucide);
  const assets = obtenerAssetsSelvaPorTono(detalle?.nivel ?? 1);
  const metaEtiqueta = `${habito.meta} ${habito.tipoMeta === 'duracion' ? 'min' : habito.unidad || 'veces'}`;
  const ctaTexto = habito.completado ? 'Completado' : habito.tipoMeta === 'check' ? 'Marcar como hecho' : 'Registrar progreso';
  return <Pressable onPress={onDetalle} style={s.tarjetaHabito}>
    <TarjetaSenderoHabito
      assets={assets}
      cargando={registrando}
      ctaTexto={ctaTexto}
      diasCompletados={detalle?.diasCompletadosSemana ?? []}
      diasProgramados={detalle?.diasProgramados ?? DIAS_SEMANA_COMPLETA}
      icono={icono ?? { fuente: require('../../../../assets/icons/ui/idea.png') }}
      meta={habito.meta}
      metaEtiqueta={metaEtiqueta}
      nivel={detalle?.nivel ?? 1}
      onPressCta={onRegistrar}
      racha={detalle?.racha ?? 0}
      titulo={habito.titulo}
      valorHoy={habito.valorHoy}
    />
  </Pressable>;
}
function CuadriculaHabitos({ detallesPorHabito, habitos, onCrear, onDetalle, onRegistrar, registrandoId }: { detallesPorHabito: Map<string, HabitoHoyDetalle>; habitos: HabitoResumen[]; onCrear: () => void; onDetalle: (id: string) => void; onRegistrar: (habito: HabitoResumen) => void; registrandoId: string | null }) { return <>{habitos.length === 0 ? <EstadoVacio texto="Aún no has creado hábitos. Comienza con una pequeña acción." /> : <ScrollView contentContainerStyle={s.carruselHabitosContenido} horizontal showsHorizontalScrollIndicator={false} style={s.carruselHabitos}>{habitos.map((habito) => <TarjetaHabito detalle={detallesPorHabito.get(habito.id)} habito={habito} key={habito.id} onDetalle={() => onDetalle(habito.id)} onRegistrar={() => onRegistrar(habito)} registrando={registrandoId === habito.id} />)}</ScrollView>}<Boton color={C.verde} iconoIzquierda={Plus} onPress={onCrear} style={s.nuevo} variante="sendero">{habitos.length === 0 ? 'Crear mi primer hábito' : 'Nuevo hábito'}</Boton></>; }
function EstadoVacio({ texto }: { texto: string }) { return <View style={s.vacio}><Image source={require('../../../../assets/icons/hoy/habitos.png')} style={[s.iconoVacio, { tintColor: C.verde }]} /><Texto style={s.vacioTitulo}>Aún no hay hábitos</Texto><Texto style={s.vacioTexto}>{texto}</Texto></View>; }

const s = StyleSheet.create({ raiz: { backgroundColor: '#EAEAEA', flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 }, volverGlass: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, marginRight: 5 }, chevronInicio: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 }, headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }, headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 }, nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 }, headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 }, saludoIcono: { height: 28, resizeMode: 'contain', width: 28 }, headerFrase: { color: '#5A5A5A', fontFamily: 'Montserrat-Medium', fontSize: 8, lineHeight: 12, marginTop: 4 }, headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 }, statPill: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 6 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 }, statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, notificacion: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 22, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 }, heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' }, heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 }, ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracionHabitos: { height: '100%', width: '100%' }, rachaCard: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, gap: 8, padding: 10 }, rachaTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 }, rachaIconoFondo: { alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 10, height: 30, justifyContent: 'center', width: 30 }, rachaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, lineHeight: 10 }, rachaTitulo: { color: '#1A1A1A', fontFamily: 'MontserratAlternates-Bold', fontSize: 11, lineHeight: 12 }, rachaDias: { color: C.verde, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, historialGrid: { gap: 3 }, historialFila: { flexDirection: 'row', gap: 3 }, historialCuadro: { borderRadius: 2, flex: 1, height: 9 }, historialCuadroLleno: { backgroundColor: C.verde }, historialCuadroVacio: { backgroundColor: '#E7E1F1' }, nivelCard: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 }, nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 11 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9 }, barraFondo: { backgroundColor: C.barra, borderRadius: 9, height: 6, marginTop: 7, overflow: 'hidden' }, barra: { borderRadius: 9, height: '100%' },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 },
  accesoTarjeta: { flex: 1 },
  accesoGlass: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 14, borderWidth: 1, justifyContent: 'flex-start', minHeight: 100, padding: 8 },
  accesoGlassActivo: { borderColor: C.verde, borderWidth: 1.5 },
  accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' },
  accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 8, lineHeight: 10, marginTop: 1, textAlign: 'center' },
  cercaniaTarjeta: { marginBottom: 16, marginHorizontal: 20 },
  cercaniaGlass: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 12 },
  cercaniaIcono: { alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  cercaniaLabel: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  cercaniaTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginTop: 2 },
  cercaniaPorcentaje: { color: C.verde, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  panel: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 22, borderWidth: 1, marginHorizontal: 20, padding: 15 }, tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 }, titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 }, contador: { color: C.tenue, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, estado: { color: C.tenue, fontFamily: 'Montserrat-Medium', paddingVertical: 18, textAlign: 'center' }, error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', paddingVertical: 18, textAlign: 'center' }, errorDetalle: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 11, opacity: 0.7, paddingBottom: 10, textAlign: 'center' }, vacio: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 28 }, iconoVacio: { height: 58, marginBottom: 10, resizeMode: 'contain', width: 58 }, vacioTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, textAlign: 'center' }, vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  carruselHabitos: { marginHorizontal: -15 },
  carruselHabitosContenido: { gap: 12, paddingHorizontal: 15 },
  tarjetaHabito: { width: 310 },
  nuevo: { marginTop: 14 } });
