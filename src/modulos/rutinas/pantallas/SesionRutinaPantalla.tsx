import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Sparkles } from 'lucide-react-native';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterButton, MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { ControlPaso } from '../componentes/sesion/ControlesPaso';
import { cerrarRutinaDia, CLAVE_RUTINAS, iniciarRutina, obtenerRutinasHoy } from '../rutinas.servicio';
import type { PasoRutina, ResultadoCierreRutina } from '../rutinas.tipos';
import { OPCIONES_MINUTOS_SESION, planearSesion } from '../sesionRutina';
import { CLAVES_TRAS_PASO, completarPasoSesion } from '../sesionRutina.servicio';
import { COLOR_PAQUETE_RUTINAS, PAQUETE_RUTINAS } from '../temaRutinas';

// Sesión guiada: una rutina se recorre un paso a la vez. El servidor es la fuente de
// verdad del avance: la sesión solo recuerda en qué paso va y cuáles saltó. Si se cierra
// la app a mitad, al volver se rearma con lo que falta.
// Spec: docs/superpowers/specs/2026-10-05-sesion-guiada-rutinas-design.md

const C = { texto: '#1A1335', tenue: '#7B7494', error: '#DC2626' };
type Fase = 'preparar' | 'en_curso' | 'fin';

export function SesionRutinaPantalla({ id }: { id: string }) {
  return (
    <TonoDelHabito colorPaquete={COLOR_PAQUETE_RUTINAS} paqueteId={PAQUETE_RUTINAS}>
      <SesionContenido id={id} />
    </TonoDelHabito>
  );
}

function SesionContenido({ id }: { id: string }) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const [fase, setFase] = useState<Fase>('preparar');
  const [minutos, setMinutos] = useState<number | null>(null);
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  const [saltados, setSaltados] = useState<string[]>([]);
  const [cierre, setCierre] = useState<ResultadoCierreRutina | null>(null);
  const [errorPaso, setErrorPaso] = useState(false);
  const [errorCierre, setErrorCierre] = useState(false);
  const inicioMs = useRef<number | null>(null);
  const duracionMin = useRef(0);

  const consulta = useQuery({ queryKey: CLAVE_RUTINAS, queryFn: obtenerRutinasHoy });
  const rutina = consulta.data?.find((r) => r.id === id) ?? null;
  const assets = useMemo(() => obtenerAssetsPaquete(PAQUETE_RUTINAS), []);
  const plan = useMemo(() => (rutina ? planearSesion(rutina.pasos, minutos) : null), [rutina, minutos]);
  const pasoActual: PasoRutina | null = rutina && fase === 'en_curso' ? rutina.pasos.find((p) => p.id === planIds[indice]) ?? null : null;

  const refrescar = () => Promise.all(CLAVES_TRAS_PASO.map((queryKey) => cliente.invalidateQueries({ queryKey })));

  const iniciar = useMutation({ mutationFn: () => iniciarRutina(id) });
  const cerrar = useMutation({
    mutationFn: () => cerrarRutinaDia(id),
    onSuccess: async (resultado) => {
      setCierre(resultado);
      setErrorCierre(false);
      hapticSeguro(resultado.completa ? 'confirmacion' : 'seleccion');
      await refrescar();
    },
    onError: () => setErrorCierre(true),
  });
  const completarPaso = useMutation({
    mutationFn: ({ paso, valor }: { paso: PasoRutina; valor?: number }) => completarPasoSesion(paso, valor),
    onMutate: () => setErrorPaso(false),
    onSuccess: async () => { await refrescar(); avanzar(); },
    onError: (error) => { console.error('[rutinas] no se pudo completar el paso', error); hapticSeguro('impacto'); setErrorPaso(true); },
  });

  function terminar() {
    duracionMin.current = inicioMs.current ? Math.max(1, Math.round((Date.now() - inicioMs.current) / 60000)) : 0;
    setFase('fin');
    cerrar.mutate();
  }

  function avanzar() {
    setErrorPaso(false);
    if (indice + 1 >= planIds.length) terminar();
    else setIndice(indice + 1);
  }

  function empezar() {
    if (!plan || plan.pasos.length === 0) return;
    hapticSeguro('confirmacion');
    iniciar.mutate(); // si falla no frena la sesión: cerrar_rutina_dia también crea el registro
    inicioMs.current = Date.now();
    setPlanIds(plan.pasos.map((p) => p.id));
    setIndice(0);
    setSaltados([]);
    setCierre(null);
    setFase('en_curso');
  }

  function retomarPendientes() {
    if (!rutina) return;
    const pendientes = planearSesion(rutina.pasos, null).pasos;
    if (pendientes.length === 0) return;
    setPlanIds(pendientes.map((p) => p.id));
    setIndice(0);
    setSaltados([]);
    setCierre(null);
    setFase('en_curso');
  }

  function saltar(paso: PasoRutina) {
    hapticSeguro('seleccion');
    setSaltados((actual) => [...actual, paso.id]);
    avanzar();
  }

  function salir() {
    if (router.canGoBack()) router.back();
    else router.replace('/hoy');
  }

  const marco = (hijos: ReactNode) => (
    <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={estilos.raiz}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={estilos.cabecera}>
          <Pressable accessibilityLabel={t('rutinas.sesion.volver')} accessibilityRole="button" hitSlop={10} onPress={salir} style={estilos.volver}><ChevronLeft color={acento} size={26} /></Pressable>
          {rutina ? <Texto numberOfLines={1} style={estilos.cabeceraTitulo}>{rutina.titulo}</Texto> : null}
        </View>
        {hijos}
      </ScrollView>
    </LinearGradient>
  );

  if (consulta.isLoading) return marco(<Texto style={estilos.centro}>{t('rutinas.pantalla.cargando')}</Texto>);
  if (consulta.isError) return marco(<Pressable accessibilityRole="button" onPress={() => consulta.refetch()}><Texto style={[estilos.centro, { color: C.error }]}>{t('rutinas.pantalla.errorCargar')}</Texto></Pressable>);
  if (!rutina || !plan) return marco(<Texto style={estilos.centro}>{t('rutinas.sesion.noEncontrada')}</Texto>);

  // ─── Preparar ──────────────────────────────────────────────────────────
  if (fase === 'preparar') {
    const completa = planearSesion(rutina.pasos, null);
    const opciones: (number | null)[] = [null, ...OPCIONES_MINUTOS_SESION.filter((m) => m < completa.minutosTotal)];
    return marco(
      <View style={estilos.bloque}>
        <Texto accessibilityRole="header" style={estilos.titulo}>{t('rutinas.sesion.preparar.titulo')}</Texto>
        {completa.pasos.length === 0 ? (
          <>
            <Texto style={estilos.centro}>{t('rutinas.sesion.preparar.nadaPendiente')}</Texto>
            <MasterButton color={acento} onPress={salir}>{t('rutinas.sesion.volver')}</MasterButton>
          </>
        ) : (
          <>
            <Texto style={estilos.subtitulo}>{t('rutinas.sesion.preparar.tiempoTitulo')}</Texto>
            <View style={estilos.opciones}>
              {opciones.map((opcion) => {
                const activa = opcion === minutos;
                return (
                  <Pressable accessibilityRole="radio" accessibilityState={{ selected: activa }} key={String(opcion)} onPress={() => { hapticSeguro('seleccion'); setMinutos(opcion); }} style={[estilos.opcion, activa && { backgroundColor: acento, borderColor: acento }]}>
                    <Texto style={[estilos.opcionTexto, activa && { color: '#FFFFFF' }]}>
                      {opcion === null ? t('rutinas.sesion.preparar.opcionCompleta') : t('rutinas.sesion.preparar.opcionMinutos', { count: opcion })}
                    </Texto>
                  </Pressable>
                );
              })}
            </View>
            <Texto style={estilos.subtitulo}>{t('rutinas.sesion.preparar.resumen', { count: plan.pasos.length, minutos: plan.minutosTotal })}</Texto>
            {plan.excede ? <Texto style={estilos.aviso}>{t('rutinas.sesion.preparar.excede')}</Texto> : null}
            <MasterGlass style={estilos.lista}>
              {plan.pasos.map((paso, i) => (
                <View key={paso.id} style={estilos.filaPaso}>
                  <View style={estilos.orden}><Texto style={estilos.ordenTexto}>{i + 1}</Texto></View>
                  <Texto numberOfLines={1} style={estilos.filaTitulo}>{paso.titulo}</Texto>
                  <Texto style={[estilos.etiqueta, paso.esencial && { color: acento }]}>{paso.esencial ? t('rutinas.sesion.preparar.esencial') : t('rutinas.sesion.preparar.opcional')}</Texto>
                </View>
              ))}
            </MasterGlass>
            {plan.omitidos.length > 0 ? <Texto style={estilos.ayuda}>{t('rutinas.sesion.preparar.omitidos', { lista: plan.omitidos.map((p) => p.titulo).join(', ') })}</Texto> : null}
            <MasterButton color={acento} onPress={empezar}>{t('rutinas.sesion.preparar.empezar')}</MasterButton>
          </>
        )}
      </View>,
    );
  }

  // ─── En curso ──────────────────────────────────────────────────────────
  if (fase === 'en_curso') {
    if (!pasoActual) {
      // El paso ya no existe (se archivó, p. ej.): se sigue con lo que quede.
      return marco(<MasterButton color={acento} onPress={avanzar}>{t('rutinas.sesion.curso.siguiente')}</MasterButton>);
    }
    const icono = buscarIconoHabito(pasoActual.iconoLucide ?? rutina.iconoLucide);
    return marco(
      <View style={estilos.bloque}>
        <View style={estilos.puntos} accessibilityLabel={t('rutinas.sesion.curso.paso', { actual: indice + 1, total: planIds.length })}>
          {planIds.map((pid, i) => <View key={pid} style={[estilos.punto, i <= indice && { backgroundColor: acento }]} />)}
        </View>
        <Texto style={estilos.ayuda}>{t('rutinas.sesion.curso.paso', { actual: indice + 1, total: planIds.length })}{pasoActual.esencial ? '' : ` · ${t('rutinas.sesion.preparar.opcional')}`}</Texto>
        <View style={estilos.heroPaso}>
          <MasterIconBg fuente={icono?.fuente} size={88}>{!icono && <Sparkles color={acento} size={40} />}</MasterIconBg>
          <Texto accessibilityRole="header" style={estilos.tituloPaso}>{pasoActual.titulo}</Texto>
        </View>
        <ControlPaso
          color={acento}
          key={pasoActual.id}
          ocupado={completarPaso.isPending}
          onCompletar={(valor) => completarPaso.mutate({ paso: pasoActual, valor })}
          paso={pasoActual}
        />
        {errorPaso ? <Texto style={[estilos.centro, { color: C.error }]}>{t('rutinas.sesion.curso.errorPaso')}</Texto> : null}
        <Pressable accessibilityRole="button" disabled={completarPaso.isPending} onPress={() => saltar(pasoActual)} style={estilos.saltar}>
          <Texto style={estilos.saltarTexto}>{t('rutinas.sesion.curso.saltar')}</Texto>
        </Pressable>
      </View>,
    );
  }

  // ─── Fin ───────────────────────────────────────────────────────────────
  const completa = cierre?.completa ?? false;
  const pendientes = planearSesion(rutina.pasos, null).pasos;
  return marco(
    <View style={[estilos.bloque, { alignItems: 'center' }]}>
      {assets ? <Image resizeMode="contain" source={assets.etapas[6]} style={estilos.arbol} /> : null}
      {cerrar.isPending && !cierre ? (
        <Texto style={estilos.subtitulo}>{t('rutinas.sesion.fin.guardando')}</Texto>
      ) : errorCierre ? (
        <>
          <Texto style={[estilos.centro, { color: C.error }]}>{t('rutinas.sesion.fin.errorCierre')}</Texto>
          <MasterButton color={acento} onPress={() => cerrar.mutate()}>{t('rutinas.sesion.fin.reintentar')}</MasterButton>
        </>
      ) : (
        <>
          <View style={[estilos.sello, { backgroundColor: completa ? acento : '#D8D3CD' }]}><Check color="#FFFFFF" size={30} strokeWidth={3} /></View>
          <Texto accessibilityRole="header" style={estilos.titulo}>{completa ? t('rutinas.sesion.fin.tituloCompleta') : t('rutinas.sesion.fin.tituloParcial')}</Texto>
          <Texto style={estilos.centro}>{completa ? t('rutinas.sesion.fin.textoCompleta') : t('rutinas.sesion.fin.textoParcial')}</Texto>
          {duracionMin.current > 0 ? <Texto style={estilos.ayuda}>{t('rutinas.sesion.fin.tiempo', { minutos: duracionMin.current })}</Texto> : null}
          {!completa && pendientes.length > 0 ? <MasterButton color={acento} onPress={retomarPendientes}>{t('rutinas.sesion.fin.retomar')}</MasterButton> : null}
          <MasterButton color={acento} onPress={salir}>{t('rutinas.sesion.fin.cerrar')}</MasterButton>
        </>
      )}
    </View>,
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { gap: 16, paddingHorizontal: 20 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  volver: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  cabeceraTitulo: { color: C.tenue, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  bloque: { gap: 16 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 28, lineHeight: 34 },
  subtitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  centro: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 20, paddingVertical: 8, textAlign: 'center' },
  ayuda: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  aviso: { color: '#B45309', fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.85)', borderRadius: 18, borderWidth: 1.5, minHeight: 40, justifyContent: 'center', paddingHorizontal: 16 },
  opcionTexto: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  lista: { borderRadius: 18, gap: 10, padding: 14 },
  filaPaso: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  orden: { alignItems: 'center', backgroundColor: 'rgba(26,19,53,0.08)', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  ordenTexto: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  filaTitulo: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  etiqueta: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 11 },
  puntos: { flexDirection: 'row', gap: 5 },
  punto: { backgroundColor: '#DDD6E9', borderRadius: 4, flex: 1, height: 5 },
  heroPaso: { alignItems: 'center', gap: 14, paddingVertical: 18 },
  tituloPaso: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 32, textAlign: 'center' },
  saltar: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  saltarTexto: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  arbol: { height: 180, width: 180 },
  sello: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
});
