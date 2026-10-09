import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Check,
  Play,
  Sparkles,
} from 'lucide-react-native';

import { MasterGlass, Rebote, RecuadroGlass, SelectorFranja, Skeleton, Texto, MasterIcon } from '../../../diseno';
import { franjaActual, type FiltroFranja, type FranjaDia } from '../../../compartido/utilidades/franjas';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { registrarEvento } from '../../../servicios/analitica/posthog';
import { AuroraBoreal } from '../componentes/AuroraBoreal';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { useAssetsPaqueteTema } from '../../habitos/usePaqueteTema';
import { INTERCAMBIAR_BANDERA_Y_ARBUSTO } from '../../habitos/pruebaIntercambio';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { usePerfilBasico } from '../../configuracion/usePerfilBasico';
import { construirPlanDelDia, idsDeRutinasDeHoy, SIN_AREA, type ElementoHoy } from '../planDelDia';
import { nombreArea } from '../../areas/areas.mapper';
import type { AreaVidaResumen } from '../../areas/areas.tipos';
import { areaPorMeta } from '../../metas/metas.mapper';
import { habitoAElemento, resumirCategoriasHoy, rutinaAElemento, tareaAElemento } from '../adaptadoresHoy';
import { nivelDesdeXp } from '../nivelUsuario';
import { detectarPrimeraVictoria, tipoDePrimeraVictoria } from '../primeraVictoria';
import { RESUMEN_HOY_VACIO, indiceDiaSemana } from '../resumenHoy.mapper';
import { CLAVE_RESUMEN_HOY, obtenerResumenHoy } from '../resumenHoy.servicio';
import { useDatosHoy } from '../useDatosHoy';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Paleta de colores del mockup (tema lila / morado claro)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const C = {
  // Fondos
  fondo: '#F3EEFA',           // Lila muy pálido
  superficie: '#FFFFFF',
  glass: 'rgba(255,255,255,0.72)',
  glassBorde: 'rgba(255,255,255,0.85)',

  // Textos
  texto: '#1A1335',           // Azul noche oscuro
  textoSecundario: '#7B7494',
  textoTenue: '#A8A1BD',

  // Acentos
  morado: '#7C3AED',          // Morado principal
  moradoSuave: '#EDE5FB',
  moradoMedio: '#B794F6',
  verde: ESCALA_ESMERALDA.jade.l70,
  verdeSuave: ESCALA_ESMERALDA.jade.l95,
  naranja: '#F59E0B',
  amarillo: '#FACC15',
  naranjaSuave: '#FEF3C7',
  rojo: '#EF4444',
  rojoSuave: '#FEE2E2',
  azul: '#3B82F6',
  azulSuave: '#DBEAFE',
  gema: '#818CF8',
  racha: '#F97316',

  // Utilidad
  barraFondo: '#E8E0F3',
  sombra: '#6C3FBF',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];





// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Componentes Internos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Header ──────────────────────────────────────────────────────────────────
function HeaderHoy() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: saldoGemas } = useSaldoGemas();
  const { limitesFranja, nombreVisible } = usePerfilBasico();
  return (
    <View style={s.header}>
      <View style={s.headerIzq}>
        <Texto style={s.headerSaludo}>{t(`hoy.saludo.${franjaActual(new Date(), limitesFranja)}`)}</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {nombreVisible ? <Texto numberOfLines={1} style={s.headerNombre}>{nombreVisible}</Texto> : null}
          <Image
            source={require('../../../../assets/icons/hoy/saludo.png')}
            style={{ width: 28, height: 28, resizeMode: 'contain' }}
          />
        </View>
        <Texto style={s.headerFrase}>{t('hoy.frase')}</Texto>
      </View>

      <View style={s.headerDer}>
        <Pressable accessibilityLabel={t('hoy.comprarGemas')} onPress={() => router.push('/tienda')} style={s.statPill}>
          <Image
            source={require('../../../../assets/icons/hoy/gemas.png')}
            style={{ width: 22, height: 22, resizeMode: 'contain' }}
          />
          <Texto style={[s.statTexto, { color: '#6D28D9' }]}>{saldoGemas ?? 0}</Texto>
        </Pressable>

        {/* Notificaciones */}
        <View style={[s.statPill, { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 22 }]}>
          <Image 
            source={require('../../../../assets/icons/hoy/notificaciones.png')}
            style={{ width: 30, height: 30, resizeMode: 'contain' }}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Hero Section (Racha, Nivel, Ilustración) ────────────────────────────────
function HeroSection() {
  const { t } = useTranslation();
  // Mientras carga o si falla: racha 0, semana vacía y nivel 1. Nunca números inventados.
  const { data: resumen = RESUMEN_HOY_VACIO, refetch } = useQuery({ queryKey: CLAVE_RESUMEN_HOY, queryFn: obtenerResumenHoy });
  // Hoy es una pestaña que queda montada: al volver de completar algo en otra
  // pantalla, la racha y el XP se vuelven a pedir (es una sola llamada barata).
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const nivel = nivelDesdeXp(resumen.xpTotal);
  const indiceHoy = indiceDiaSemana(new Date());
  return (
    <View style={s.heroRow}>
      {/* Columna Izquierda: Racha y Nivel */}
      <View style={s.heroColIzq}>
        <RecuadroGlass style={s.rachaCard}>
          <View accessibilityLabel={t('hoy.racha.accesible', { count: resumen.racha })} accessible style={s.rachaTop}>
            <View style={s.rachaIcono}>
              <Image 
                source={require('../../../../assets/icons/hoy/racha.png')}
                style={{ width: 44, height: 44, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Texto style={s.rachaLabel}>{t('hoy.racha.titulo')}</Texto>
              <Texto style={s.rachaDias}>{t('hoy.racha.dias', { count: resumen.racha })}</Texto>
            </View>
          </View>
          <View style={s.rachaSemana}>
            {DIAS_SEMANA.map((dia, i) => (
              <View key={i} style={s.rachaDiaCol}>
                <Texto style={[s.rachaDiaLetra, i === indiceHoy && s.rachaDiaActivo]}>{dia}</Texto>
                {resumen.diasActivosSemana.includes(i + 1) ? (
                  <View style={s.rachaCheck}>
                    <Check color="#FFFFFF" size={10} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={s.rachaEmpty} />
                )}
              </View>
            ))}
          </View>
        </RecuadroGlass>

        <RecuadroGlass style={s.nivelCard}>
          <View style={s.nivelIcono}>
            <Image 
              source={require('../../../../assets/icons/hoy/insignia.png')}
              style={{ width: 44, height: 44, resizeMode: 'contain' }}
            />
          </View>
          <View style={s.nivelInfo}>
            <View style={s.nivelTextoRow}>
              <Texto style={s.nivelLabel}>{t('hoy.nivel', { nivel: nivel.nivel })}</Texto>
              <Texto style={s.nivelXP}>{t('hoy.xp', { actual: nivel.xpEnNivel, requerido: nivel.xpRequerido })}</Texto>
            </View>
            <View style={s.nivelBarraFondo}>
              <View style={[s.nivelBarraRelleno, { width: `${nivel.porcentaje}%` }]} />
            </View>
          </View>
        </RecuadroGlass>
      </View>

      {/* Columna Derecha: Ilustración cuadrada */}
      <View style={s.heroColDer}>
        <View style={s.ilustracionContenedor}>
          <Image
            source={require('../../../../assets/ilustraciones/hoy/fondos/fondo.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

// ─── Grid de Categorías ──────────────────────────────────────────────────────
// Las cuatro categorías tienen ruta propia dentro del grupo con pestañas
// (app/(principal)/<id>.tsx). Una categoría nueva sin ruta no debe entrar aquí:
// expo-router la marcaría "Unmatched Route".
const CATEGORIAS_CON_PANTALLA = new Set(['tareas', 'rutinas', 'habitos', 'metas']);

function GridCategorias() {
  const router = useRouter();
  const { t } = useTranslation();

  const categorias = useMemo(() => [
    { id: 'tareas', label: t('hoy.categorias.tareas'), subtitulo: t('hoy.categoriasSubtitulos.tareas'), color: C.amarillo, icono: 'hoy/tareas' },
    { id: 'rutinas', label: t('hoy.categorias.rutinas'), subtitulo: t('hoy.categoriasSubtitulos.rutinas'), color: C.rojo, icono: 'hoy/rutinas' },
    { id: 'habitos', label: t('hoy.categorias.habitos'), subtitulo: t('hoy.categoriasSubtitulos.habitos'), color: C.verde, icono: 'hoy/habitos' },
    { id: 'metas', label: t('hoy.categorias.metas'), subtitulo: t('hoy.categoriasSubtitulos.metas'), color: C.azul, icono: 'hoy/metas' },
  ], [t]);

  return (
    <View style={s.categoriasRow}>
      {categorias.map((cat) => (
        <View key={cat.id} style={s.categoriaCard}>
          <Rebote
            accessibilityLabel={cat.label}
            onPress={() => { if (CATEGORIAS_CON_PANTALLA.has(cat.id)) router.navigate(`/${cat.id}` as any); }}
          >
            <MasterGlass colorBase={cat.color} style={s.categoriaGlass}>
              <View style={s.categoriaIcono}><MasterIcon name={cat.icono} size={42} /></View>
              <View style={s.categoriaTexto}>
                <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.categoriaLabel}>{cat.label}</Texto>
                <Texto numberOfLines={2} style={s.categoriaSubtitulo}>{cat.subtitulo}</Texto>
              </View>
            </MasterGlass>
          </Rebote>
        </View>
      ))}
    </View>
  );
}

// ─── Card Sendero Activo ─────────────────────────────────────────────────────
function CardSendero() {
  return (
    <Pressable
      onPress={() => hapticSeguro('seleccion')}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <RecuadroGlass style={s.senderoCard}>
        {/* Usando el asset de estudio.png en lugar del ícono genérico */}
        <View style={s.senderoIcono}>
          <Image 
            source={require('../../../../assets/ilustraciones/Aby/aby.png')} 
            style={{ width: 90, height: 90, resizeMode: 'contain' }} 
          />
        </View>
        <View style={s.senderoInfo}>
          <Texto style={s.senderoEtiqueta}>Continúa tu sendero</Texto>
          <Texto style={s.senderoTitulo}>El camino del artista</Texto>
          <View style={s.senderoProgresoContenedor}>
            <View style={s.senderoBarraFondo}>
              <View style={[s.senderoBarraRelleno, { width: '50%' }]} />
            </View>
            <Texto style={s.senderoProgreso}>6/12 lecciones</Texto>
          </View>
        </View>
        <View style={s.senderoPlay}>
          <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

function IconoElementoVisual({ id, color, size = 16 }: { id?: string | null; color: string; size?: number }) {
  const icono = buscarIconoHabito(id);
  return icono ? <MasterIcon name={icono.id} size={size} /> : <Sparkles color={color} size={size} />;
}

// ─── Primera victoria ────────────────────────────────────────────────────────
// Se muestra una sola vez, cuando el XP de la cuenta pasa de 0 a más de 0
// dentro de esta sesión (ver primeraVictoria.ts).
function AvisoPrimeraVictoria() {
  const { t } = useTranslation();
  const datos = useDatosHoy();
  const { data: resumen } = useQuery({ queryKey: CLAVE_RESUMEN_HOY, queryFn: obtenerResumenHoy });
  const xpAnterior = useRef<number | undefined>(undefined);
  const disparada = useRef(false);
  const [visible, setVisible] = useState(false);
  const xpActual = resumen?.xpTotal;

  useEffect(() => {
    if (detectarPrimeraVictoria(xpAnterior.current, xpActual, disparada.current)) {
      disparada.current = true;
      setVisible(true);
      hapticSeguro('confirmacion');
      const avance = resumirCategoriasHoy({ habitos: datos.habitos ?? [], tareas: datos.tareas ?? [], rutinas: datos.rutinas ?? [] });
      registrarEvento('primera_victoria', { tipo: tipoDePrimeraVictoria(avance) });
    }
    xpAnterior.current = xpActual;
  }, [xpActual, datos.habitos, datos.tareas, datos.rutinas]);

  if (!visible) return null;
  return (
    <View accessibilityLiveRegion="polite" style={s.primeraVictoria}>
      <Sparkles color={C.morado} size={18} />
      <Texto style={s.primeraVictoriaTexto}>{t('hoy.primeraVictoria')}</Texto>
    </View>
  );
}

// ─── Timeline "Hoy" (Columna izquierda) ──────────────────────────────────────
function TimelineHoy() {
  const tema = useAssetsPaqueteTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { limitesFranja } = usePerfilBasico();
  const datos = useDatosHoy();
  const { cargando, error } = datos;

  // Se abre en la franja del momento; no se guarda la última elección.
  const [filtro, setFiltro] = useState<FiltroFranja>(() => franjaActual(new Date(), limitesFranja));
  const [expandidas, setExpandidas] = useState<ReadonlySet<FranjaDia>>(() => new Set());
  // Área elegida: no se guarda entre aperturas. null = todas.
  const [areaElegida, setAreaElegida] = useState<string | typeof SIN_AREA | null>(null);

  // meta → área, y los datos de cada área (salen de las propias metas: no hace falta otra consulta).
  const areasDeMetas = useMemo(() => areaPorMeta(datos.metas ?? []), [datos.metas]);
  const areasPorId = useMemo(() => {
    const mapa = new Map<string, AreaVidaResumen>();
    for (const meta of datos.metas ?? []) if (meta.area) mapa.set(meta.area.id, meta.area);
    return mapa;
  }, [datos.metas]);

  // 2. Mapear elementos y plan del día
  const plan = useMemo(() => {
    const habitosRaw = datos.habitos ?? [];
    const detallesHabitosMap = new Map((datos.detallesHabitos ?? []).map((d) => [d.habitoId, d]));
    const habitosElementos: ElementoHoy[] = habitosRaw.map((h) => habitoAElemento(h, detallesHabitosMap.get(h.id), areasDeMetas));

    const tareasRaw = datos.tareas ?? [];
    const tareasElementos: ElementoHoy[] = tareasRaw.map((tarea) => tareaAElemento(tarea, areasDeMetas));

    const rutinasRaw = datos.rutinas ?? [];
    const rutinasActivasHoy = rutinasRaw.filter((r) => r.tocaHoy && r.estado === 'activa');
    const formatoPasos = (completos: number, total: number) => t('hoy.pasos', { completos, total });
    const rutinasElementos: ElementoHoy[] = rutinasActivasHoy.map((r) => rutinaAElemento(r, formatoPasos, datos.metasDeRutinas?.get(r.id) ?? null, areasDeMetas));

    const idsEnRutinas = idsDeRutinasDeHoy(rutinasRaw);

    return construirPlanDelDia({
      habitos: habitosElementos,
      tareas: tareasElementos,
      rutinas: rutinasElementos,
      idsEnRutinas,
      filtro,
      areaId: areaElegida,
      expandidas,
    });
  }, [datos.habitos, datos.detallesHabitos, datos.tareas, datos.rutinas, datos.metasDeRutinas, areasDeMetas, areaElegida, filtro, expandidas, t]);

  // Chips de área: "Todas", las áreas con algo hoy y "Sin área" si hay elementos sin área.
  // Si nada tiene área todavía, la fila no aporta y no se muestra.
  const chipsArea = useMemo(() => {
    const conArea = plan.areasPresentes.flatMap((id) => (id && areasPorId.has(id) ? [areasPorId.get(id)!] : []));
    if (conArea.length === 0) return [];
    const chips: { clave: string | typeof SIN_AREA | null; color: string | null; etiqueta: string; codigo: string }[] = [
      { clave: null, color: null, etiqueta: t('areas.todas'), codigo: 'todas' },
      ...conArea.map((area) => ({ clave: area.id, color: area.color, etiqueta: nombreArea(area, t), codigo: area.codigo ?? 'propia' })),
    ];
    if (plan.areasPresentes.includes(null)) chips.push({ clave: SIN_AREA, color: null, etiqueta: t('areas.sinArea'), codigo: SIN_AREA });
    return chips;
  }, [plan.areasPresentes, areasPorId, t]);

  const etiquetasFiltro = useMemo<Record<FiltroFranja, string>>(() => ({
    manana: t('franjas.manana'),
    tarde: t('franjas.tarde'),
    noche: t('franjas.noche'),
    todo: t('franjas.todo'),
  }), [t]);

  const etiquetaAccesible = (f: FiltroFranja, n: number) =>
    t('franjas.pendientes', { franja: etiquetasFiltro[f], n });

  const alternarExpandida = (franja: FranjaDia) => {
    setExpandidas((prev) => {
      const nuevo = new Set(prev);
      nuevo.add(franja);
      return nuevo;
    });
  };

  const tocarElemento = (item: ElementoHoy) => {
    hapticSeguro('seleccion');
    if (item.tipo === 'habito') {
      router.push(`/habitos/${item.id}` as any);
    } else if (item.tipo === 'tarea') {
      router.navigate('/tareas');
    } else if (item.tipo === 'rutina') {
      router.push(`/rutinas/${item.id}` as any);
    }
  };

  return (
    <RecuadroGlass style={s.timelineGlass}>
      {/* Header dentro del contenedor glass */}
      <View style={s.timelineHeader}>
        <Image
          source={INTERCAMBIAR_BANDERA_Y_ARBUSTO ? tema.arbusto : require('../../../../assets/icons/hoy/hoy.png')}
          style={{ width: INTERCAMBIAR_BANDERA_Y_ARBUSTO ? 44 : 32, height: INTERCAMBIAR_BANDERA_Y_ARBUSTO ? 44 : 32, resizeMode: 'contain' }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1, paddingBottom: 2 }}>
          <Texto style={s.timelineTitulo}>{t('hoy.titulo')}</Texto>
          <Texto style={s.timelineContador}>{t('hoy.contador', { hechos: plan.completados, total: plan.total })}</Texto>
        </View>
      </View>

      {chipsArea.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }} contentContainerStyle={{ gap: 6 }}>
          {chipsArea.map((chip) => {
            const activo = chip.clave === areaElegida;
            return (
              <Pressable
                accessibilityLabel={t('areas.filtrar', { area: chip.etiqueta })}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                key={String(chip.clave)}
                onPress={() => { hapticSeguro('seleccion'); setAreaElegida(chip.clave); registrarEvento('hoy_filtro_area', { area_codigo: chip.codigo }); }}
                style={[s.chipArea, activo && s.chipAreaActivo]}
              >
                {chip.color ? <View style={[s.chipAreaPunto, { backgroundColor: chip.color }]} /> : null}
                <Texto style={[s.chipAreaTexto, activo && s.chipAreaTextoActivo]}>{chip.etiqueta}</Texto>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Selector de franja */}
      <View style={{ marginBottom: 12 }}>
        <SelectorFranja
          color={C.morado}
          conteos={plan.conteos}
          etiquetaAccesible={etiquetaAccesible}
          etiquetas={etiquetasFiltro}
          onCambiar={(nuevo) => { setFiltro(nuevo); registrarEvento('hoy_filtro_franja', { filtro: nuevo }); }}
          valor={filtro}
        />
      </View>

      {cargando ? (
        <View style={{ gap: 10, paddingVertical: 12 }}>
          <Skeleton alto={44} radio={10} />
          <Skeleton alto={44} radio={10} />
          <Skeleton alto={44} radio={10} />
        </View>
      ) : error ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 16 }}>
          <Texto style={{ color: C.rojo, fontFamily: 'Montserrat-Bold', fontSize: 13 }}>
            {t('hoy.errorCargar')}
          </Texto>
          <Pressable accessibilityRole="button" onPress={datos.reintentar} style={{ backgroundColor: C.moradoSuave, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Texto style={{ color: C.morado, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('hoy.reintentar')}</Texto>
          </Pressable>
        </View>
      ) : plan.total === 0 && areaElegida !== null ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 20 }}>
          <Texto style={{ color: C.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 13 }}>{t('franjas.vacia')}</Texto>
          <Pressable accessibilityRole="button" onPress={() => setAreaElegida(null)} style={{ backgroundColor: C.moradoSuave, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Texto style={{ color: C.morado, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('areas.todas')}</Texto>
          </Pressable>
        </View>
      ) : plan.total === 0 ? (
        // Cuenta sin nada para hoy: en vez de una lista vacía, una invitación a dar el primer paso.
        <View style={s.invitacion}>
          <Texto style={s.invitacionTitulo}>{t('hoy.vacio.titulo')}</Texto>
          <Texto style={s.invitacionTexto}>{t('hoy.vacio.texto')}</Texto>
          <Pressable
            accessibilityRole="button"
            onPress={() => { hapticSeguro('seleccion'); router.navigate({ pathname: '/habitos', params: { abrirCreacion: '1' } } as never); }}
            style={[s.invitacionBoton, { backgroundColor: C.morado }]}
          >
            <Texto style={[s.invitacionBotonTexto, { color: '#FFFFFF' }]}>{t('hoy.vacio.crearHabito')}</Texto>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => { hapticSeguro('seleccion'); router.navigate('/rutinas' as never); }}
            style={[s.invitacionBoton, { backgroundColor: C.moradoSuave }]}
          >
            <Texto style={[s.invitacionBotonTexto, { color: C.morado }]}>{t('hoy.vacio.rutinaLista')}</Texto>
          </Pressable>
        </View>
      ) : plan.secciones.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 20 }}>
          <Texto style={{ color: C.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 13 }}>
            {t('franjas.vacia')}
          </Texto>
          {filtro !== 'todo' && (
            <Pressable onPress={() => setFiltro('todo')} style={{ backgroundColor: C.moradoSuave, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Texto style={{ color: C.morado, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('franjas.verTodo')}</Texto>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={s.timelineScroll}
        >
          <View style={{ position: 'relative', paddingVertical: 4 }}>
            <View style={s.timelineLineaContinua} />

            {plan.secciones.map((seccion) => {
              const nombreFranja =
                seccion.franja === 'manana'
                  ? t('franjas.manana')
                  : seccion.franja === 'tarde'
                    ? t('franjas.tarde')
                    : seccion.franja === 'noche'
                      ? t('franjas.noche')
                      : t('franjas.cualquier_momento');

              return (
                <View key={seccion.franja} style={{ marginBottom: 12 }}>
                  {filtro === 'todo' && (
                    <View style={{ marginBottom: 6, paddingLeft: 30 }}>
                      <Texto style={{ color: C.textoSecundario, fontFamily: 'Montserrat-Bold', fontSize: 11, textTransform: 'uppercase' }}>
                        {nombreFranja}
                      </Texto>
                    </View>
                  )}

                  {seccion.pendientes.map((item) => {
                    const colorElemento = item.color || (item.tipo === 'habito' ? C.verde : item.tipo === 'tarea' ? C.naranja : C.rojo);
                    const etiquetaTipo = t(`hoy.tipo.${item.tipo}`);

                    return (
                      <Pressable accessibilityLabel={`${etiquetaTipo}: ${item.titulo}`} accessibilityRole="button" key={`${item.tipo}-${item.id}`} onPress={() => tocarElemento(item)} style={s.timelineItem}>
                        <View style={s.timelineNodoCol}>
                          <View style={s.timelineNodoVacio} />
                        </View>

                        <View style={s.timelineTareaContenido}>
                          <View style={[s.timelineTareaIcono, { backgroundColor: `${colorElemento}20` }]}>
                            <IconoElementoVisual color={colorElemento} id={item.iconoLucide} size={14} />
                          </View>
                          <View style={s.timelineTareaTextos}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Texto style={s.timelineTareaTitulo} numberOfLines={1}>{item.titulo}</Texto>
                              <View style={{ backgroundColor: `${colorElemento}18`, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                                <Texto style={{ color: colorElemento, fontFamily: 'Montserrat-Bold', fontSize: 9 }}>{etiquetaTipo}</Texto>
                              </View>
                            </View>
                            {item.detalle && (
                              <Texto style={s.timelineTareaSub} numberOfLines={1}>{item.detalle}</Texto>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  {seccion.pendientesOcultos > 0 && (
                    <Pressable
                      onPress={() => alternarExpandida(seccion.franja)}
                      style={{ alignSelf: 'flex-start', marginLeft: 30, marginTop: 4, paddingVertical: 4 }}
                    >
                      <Texto style={{ color: C.morado, fontFamily: 'Montserrat-Bold', fontSize: 11 }}>
                        {t('franjas.verMas', { n: seccion.pendientesOcultos })}
                      </Texto>
                    </Pressable>
                  )}

                  {seccion.completados.length > 0 && (
                    <View style={{ marginLeft: 30, marginTop: 4 }}>
                      <Texto style={{ color: C.textoSecundario, fontFamily: 'MontserratAlternates-Medium', fontSize: 10 }}>
                        {t('franjas.completados', { n: seccion.completados.length })}
                      </Texto>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </RecuadroGlass>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pantalla Principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function HoyPantalla() {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.raiz}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 32, flex: 1 }}>
          <AuroraBoreal />
          <HeaderHoy />
          <HeroSection />
          <AvisoPrimeraVictoria />
          <GridCategorias />
          {/* CardSendero oculta a propósito por ahora — se vuelve a mostrar más adelante. */}

          <View style={s.timelineContenedor}>
            <TimelineHoy />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Estilos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RADIO = 20;
const PH = 20; // padding horizontal global

const s = StyleSheet.create({
  chipArea: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.85)', borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 6, minHeight: 32, paddingHorizontal: 11, paddingVertical: 5 },
  chipAreaActivo: { backgroundColor: '#1A1335', borderColor: '#1A1335' },
  chipAreaPunto: { borderRadius: 5, height: 10, width: 10 },
  chipAreaTexto: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  chipAreaTextoActivo: { color: '#FFFFFF' },
  primeraVictoria: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderColor: '#EDE5FB', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 14, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12 },
  primeraVictoriaTexto: { color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 18 },
  invitacion: { alignItems: 'stretch', gap: 10, paddingVertical: 14 },
  invitacionTitulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  invitacionTexto: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginBottom: 4, textAlign: 'center' },
  invitacionBoton: { alignItems: 'center', borderRadius: 14, minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  invitacionBotonTexto: { fontFamily: 'Montserrat-Bold', fontSize: 14 },
  raiz: {
    flex: 1,
    backgroundColor: C.fondo,
  },

  // ─── Header ─────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: PH,
    marginBottom: 16,
  },
  headerIzq: {
    width: '45%',
  },
  headerSaludo: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 14,
    color: '#4B4B4B', // Gris carbón no tan oscuro
  },
  headerNombre: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22, // Un poco más pequeño
    color: C.texto,
    lineHeight: 26,
  },
  headerFrase: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8, // Mucho más pequeño
    color: '#5A5A5A', // Gris carbón (un pelín más suave para jerarquía)
    marginTop: 4,
    lineHeight: 12,
  },
  headerDer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -16, // Lo subimos manteniendo estático el lado izquierdo
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.glass,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.glassBorde,
  },
  statTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.moradoSuave,
    borderWidth: 2,
    borderColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Hero Section ────────────────────────────
  heroRow: {
    flexDirection: 'row',
    paddingHorizontal: PH,
    gap: 12,
    marginBottom: 16,
  },
  heroColIzq: {
    width: '45%', // Mantiene el 45% original
    gap: 12,
  },
  heroColDer: {
    position: 'absolute',
    right: PH,
    top: 0,
    width: '50%',
    zIndex: -1, // Se asegura de que la imagen quede por debajo de otros elementos interactivos
  },
  rachaCard: {
    width: '100%',
    backgroundColor: C.glass,
    borderRadius: RADIO,
    padding: 10,
    borderWidth: 1,
    borderColor: C.glassBorde,
    justifyContent: 'space-between',
  },
  rachaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rachaIcono: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rachaLabel: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 10,
    color: C.textoSecundario,
  },
  rachaDias: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#1A1A1A', // Gris carbón muy oscuro
    marginTop: -2,
  },
  rachaSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rachaDiaCol: {
    alignItems: 'center',
    gap: 4,
  },
  rachaDiaLetra: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: C.textoSecundario,
  },
  rachaDiaActivo: {
    fontFamily: 'Montserrat-Bold',
    color: C.texto,
  },
  rachaCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.naranja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rachaEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#c8c8c8',
  },

  ilustracionContenedor: {
    width: '135%', // La hace un 35% más grande que su columna
    aspectRatio: 1, 
    borderRadius: RADIO,
    overflow: 'hidden',
    transform: [{ translateX: 15 }], // La empuja hacia la derecha para que se corte con el borde
  },

  // ─── Barra Nivel ───────────────────────────────────
  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glass,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorde,
    width: '100%',
  },
  nivelIcono: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nivelInfo: {
    flex: 1,
  },
  nivelTextoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nivelLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: C.texto,
  },
  nivelXP: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 9,
    color: C.textoSecundario,
  },
  nivelBarraFondo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.barraFondo,
  },
  nivelBarraRelleno: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.morado,
  },

  // ─── Categorías ─────────────────────────────────────
  // Mismas medidas, espacios y tipografías que los accesos de HabitosPantalla
  // (accesosFila, accesoTarjeta, accesoGlass, accesoTexto, accesoEtiqueta,
  // accesoDescripcion). Lo único distinto es el color de cada tarjeta
  // (colorBase) y el tamaño del ícono. Si cambian allá, cambiar aquí igual.
  categoriasRow: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: PH },
  categoriaCard: { flex: 1 },
  categoriaGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 },
  // El ícono mide 42 (un 30 % más que el de Hábitos) pero ocupa el mismo hueco
  // de 32: los 10 px extra sobresalen hacia el relleno de la tarjeta (7 arriba,
  // 3 abajo), así la tarjeta y el texto no se mueven de sitio.
  categoriaIcono: { alignItems: 'center', height: 32, justifyContent: 'center', overflow: 'visible', transform: [{ translateY: -2 }] },
  categoriaTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' },
  categoriaLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' },
  categoriaSubtitulo: { color: C.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },

  // ─── Sendero Card ──────────────────────────────────
  senderoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: PH,
    marginBottom: 24,
    backgroundColor: C.glass,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.glassBorde,
  },
  senderoIcono: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderoInfo: {
    flex: 1,
  },
  senderoEtiqueta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 11,
    color: C.textoSecundario,
  },
  senderoTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: C.texto,
    marginBottom: 0, // Ajustado para controlar el margen desde el contenedor
  },
  senderoProgresoContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4, // Reducido para que esté más cerca del título
  },
  senderoProgreso: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 10,
    color: C.textoSecundario,
  },
  senderoBarraFondo: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.barraFondo,
  },
  senderoBarraRelleno: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9333EA', // Morado saturado
  },
  senderoPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra(0.15),
  },

  // ─── Contenedor de Hoy (100% del ancho) ─────────────
  timelineContenedor: {
    paddingHorizontal: PH,
  },

  // ─── Timeline ──────────────────────────────────────
  timelineGlass: {
    backgroundColor: C.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorde,
    padding: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timelineTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: C.texto,
  },
  timelineContador: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 8,
    color: C.textoSecundario,
  },
  timelineScroll: {
    maxHeight: 320,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 3,
  },
  timelineNodoCol: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  timelineLineaContinua: {
    position: 'absolute',
    top: 24, // Inicia en el centro del primer nodo
    bottom: 24, // Termina en el centro del último nodo
    left: 10, // Mitad del ancho del timelineNodoCol (22 / 2 = 11, pero ajustado visualmente a 10)
    width: 2,
    backgroundColor: C.barraFondo,
    borderRadius: 1,
  },
  timelineNodo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodoVacio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#c8c8c8',
  },
  timelineTareaContenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 5,
  },
  timelineTareaActiva: {
    backgroundColor: C.moradoSuave,
    borderWidth: 1,
    borderColor: C.moradoMedio,
  },
  timelineTareaIcono: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTareaTextos: {
    flex: 1,
  },
  timelineTareaTitulo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: C.texto,
    lineHeight: 11,
  },
  timelineTareaSub: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 7,
    color: C.textoSecundario,
    lineHeight: 9,
  },
  timelinePlayBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.morado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMore: {
    padding: 2,
  },
});

// ─── Utilidad de sombra ──────────────────────────────
function sombra(opacidad: number) {
  return {
    shadowColor: C.sombra,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacidad,
    shadowRadius: 16,
    elevation: 3,
  };
}
