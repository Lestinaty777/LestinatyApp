import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MasterButton, MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Rebote, SelectorFranja, Texto } from '../../../diseno';
import { useFiltroFranja } from '../../../compartido/utilidades/useFiltroFranja';
import { VacioDeFranja } from '../../hoy/componentes/VacioDeFranja';
import { registrarEvento } from '../../../servicios/analitica/posthog';
import { useEtiquetasRutina } from '../../rutinas/useEtiquetasRutina';
import { conAlfa, crearTonoMaster } from '../../../diseno/tema/masterColor';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { TonoDelHabito } from '../../habitos/componentes/TonoDelHabito';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';
import { CrearTareaWizard } from '../componentes/CrearTareaWizard';
import { ListaMisTareas } from '../componentes/ListaMisTareas';
import { ListaRecordatoriosTareas } from '../componentes/ListaRecordatoriosTareas';
import { TimelineTareasHoy } from '../componentes/TimelineTareasHoy';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { CrearPlanWizard } from '../../planes/componentes/CrearPlanWizard';
import { SeccionCompartidos } from '../../planes/componentes/SeccionCompartidos';
import { TimelinePlanesHoy } from '../../planes/componentes/TimelinePlanesHoy';
import { obtenerPlanes } from '../../planes/planes.servicio';
import {
  completarTareaDia, crearSubitemsTarea, crearTarea, crearTareaPremium, obtenerResumenRecordatoriosTareas,
  obtenerTareas, obtenerTareasHoy, registrarProgresoTarea, registrarProgresoTareaUnica,
} from '../tareas.servicio';
import type { ResultadoCompletarTarea, ResultadoProgresoTareaUnica, ResultadoRegistroTarea, Tarea, TareaHoyDetalle } from '../tareas.tipos';

// Fase 8: mismo criterio de ruteo que MapaSenderosPantalla.tsx — checklist
// sigue con completar_tarea_dia (toggle) sin importar la frecuencia;
// simple/contador/cronometro recurrentes usan el sendero de días
// (registrar_progreso_tarea, con niveles/figuras/gemas); contador/cronómetro
// "una vez" usan registrar_progreso_tarea_unica (Fase 8.6: mismo número real,
// sin el motor de rachas — no aplica a algo que pasa una sola vez); 'simple'
// "una vez" sigue con completar_tarea_dia (no tiene detalle que mostrar).
const TIPOS_CON_SENDERO_DIAS = ['simple', 'contador', 'cronometro'] as const;
const TIPOS_CON_PROGRESO_UNA_VEZ = ['contador', 'cronometro'] as const;
function usaSenderoDeDias(tarea: { frecuencia: string; tipo: string }): boolean {
  return tarea.frecuencia === 'dias_semana' && (TIPOS_CON_SENDERO_DIAS as readonly string[]).includes(tarea.tipo);
}
function usaProgresoUnaVez(tarea: { frecuencia: string; tipo: string }): boolean {
  return tarea.frecuencia === 'una_vez' && (TIPOS_CON_PROGRESO_UNA_VEZ as readonly string[]).includes(tarea.tipo);
}

// Tema dorado fijo (a diferencia de Hábitos, que sigue el tema activo del
// usuario) — TonoDelHabito es el mismo mecanismo que ya usa cada tarjeta de
// hábito para conservar el color de SU paquete.
const PAQUETE_TAREAS = 'golden';
// No es el master_pack_color real de "golden" en la base (ese es #FCB103) —
// este es solo el color que alimenta la rotación de la paleta reactiva de
// ESTA pantalla (fondo, panel, textos secundarios, todo lo que usa esc.*),
// elegido por estética. No toca la fila real de arboles_paquetes ni el
// árbol/arbusto (son PNG fijos, no se tiñen con el tono).
const COLOR_PAQUETE_TAREAS = '#FFAE00';

// Planes usa el paquete "aurelia" COMPLETO (color real + árbol propio) — a
// diferencia de Tareas, que solo toma prestado el color de "golden" para su
// rotación estética. #FFD000 es el master_pack_color real de aurelia en
// arboles_paquetes (mismo valor que ya usa nacarMandala.ts).
const PAQUETE_PLANES = 'aurelia';
const COLOR_PAQUETE_PLANES = '#FFD000';

type VistaPanel = 'compartidos' | 'hoy' | 'progresion' | 'recordatorios';
const ICONOS_VISTA_PANEL: Record<VistaPanel, string> = { compartidos: 'equipo', hoy: 'sol', progresion: 'progreso', recordatorios: 'reloj' };

// Planes tiene 4 accesos (Tareas sigue con 3 — no tiene "Compartidos"):
// "progresion" se reusa tal cual para "Mis planes" (mismo rol que cumple
// para Tareas: la lista COMPLETA, a diferencia de "hoy" que solo muestra los
// planes activos del día a día).
const ACCESOS_TAREAS = [
  { id: 'progresion', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' }, { id: 'recordatorios', nombreIcono: 'reloj' },
] as const;
const ACCESOS_PLANES = [
  { id: 'progresion', nombreIcono: 'progreso' }, { id: 'creacion', nombreIcono: 'idea' },
  { id: 'recordatorios', nombreIcono: 'reloj' }, { id: 'compartidos', nombreIcono: 'equipo' },
] as const;

const CLAVE_TAREAS_HOY = ['tareas', 'hoy'] as const;
const CLAVE_TAREAS_LISTA = ['tareas', 'lista'] as const;
const CLAVE_TAREAS_RECORDATORIOS = ['tareas', 'recordatorios'] as const;
const CLAVE_PLANES = ['planes', 'lista'] as const;

// El tono completo (no solo un acento suelto) depende de qué módulo está
// activo — por eso modulo vive ACÁ, un nivel por encima del Provider, y no
// adentro de TareasPantallaContenido: TonoDelHabito necesita conocerlo para
// elegir golden o aurelia ANTES de que el resto del árbol lea useEscala()/
// useTonoMaster(). useEscala()/useEstilosS() siguen sin poder llamarse acá
// mismo — leerían el tema de arriba (Esmeralda u otro), no el que este
// wrapper recién arma más abajo.
export function TareasPantalla() {
  const [modulo, setModulo] = useState<'planes' | 'tareas'>('tareas');
  return (
    <TonoDelHabito
      colorPaquete={modulo === 'planes' ? COLOR_PAQUETE_PLANES : COLOR_PAQUETE_TAREAS}
      paqueteId={modulo === 'planes' ? PAQUETE_PLANES : PAQUETE_TAREAS}
    >
      <TareasPantallaContenido modulo={modulo} setModulo={setModulo} />
    </TonoDelHabito>
  );
}

function TareasPantallaContenido({ modulo, setModulo }: { modulo: 'planes' | 'tareas'; setModulo: (modulo: 'planes' | 'tareas') => void }) {
  const esc = useEscala();
  const s = useEstilosS();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const [vistaPanel, setVistaPanel] = useState<VistaPanel>('hoy');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [crearPlanAbierto, setCrearPlanAbierto] = useState(false);
  const [completandoId, setCompletandoId] = useState<string | null>(null);

  const consultaHoy = useQuery({ enabled: modulo === 'tareas', queryKey: CLAVE_TAREAS_HOY, queryFn: () => obtenerTareasHoy() });
  const consultaLista = useQuery({ enabled: modulo === 'tareas', queryKey: CLAVE_TAREAS_LISTA, queryFn: () => obtenerTareas() });
  const consultaRecordatorios = useQuery({ enabled: modulo === 'tareas', queryKey: CLAVE_TAREAS_RECORDATORIOS, queryFn: () => obtenerResumenRecordatoriosTareas() });
  const consultaPlanes = useQuery({ enabled: modulo === 'planes', queryKey: CLAVE_PLANES, queryFn: obtenerPlanes });

  function cambiarModulo(nuevo: 'planes' | 'tareas') {
    if (nuevo === modulo) return;
    hapticSeguro('seleccion');
    setModulo(nuevo);
    setVistaPanel('hoy');
  }

  // El wizard (CrearTareaWizard, Fase 8.5) maneja semilla y pasos por su
  // cuenta después de crear — mismo patrón que CrearHabitoWizard con
  // asignarSemillaHabito, en vez de encadenarlo todo en esta mutación como
  // hacía la hoja anterior (CrearTareaHoja, ya no se usa acá). Por eso NO
  // cierra el modal acá: si lo hiciera, se vería antes de que el wizard
  // termine de crear los pasos del checklist o asignar la semilla (el modal
  // no se desmonta al ocultarse, así que esos pasos igual terminan
  // corriendo, pero el usuario ya habría salido sin verlos reflejados) — el
  // propio wizard llama a onCerrar() cuando TODO terminó.
  const crearPremium = useMutation({
    mutationFn: crearTareaPremium,
    onSuccess: (_creada, input) => {
      hapticSeguro('confirmacion');
      registrarEvento('tarea_creada', { tipo: input.tipo, frecuencia: input.frecuencia ?? 'una_vez', franja: input.franja ?? 'cualquier_momento' });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_HOY });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_LISTA });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_RECORDATORIOS });
    },
  });

  // Alta rápida: para "se me ocurrió algo, anótalo ya" — nada del wizard
  // completo (plantillas/meta/semilla/frecuencia/recordatorio). Tocar
  // "Tarea rápida" o "Checklist" abre un modal chico con el campo de texto —
  // ahí sí hay espacio horizontal para el placeholder, a diferencia de la
  // tarjeta compacta de arriba. 'una_vez' con vencimiento HOY (así aparece de
  // inmediato en esta misma lista) — todo lo demás en su default de
  // crearTarea. Dos tipos nada más: contador y cronómetro necesitan una meta
  // numérica real, eso sí necesita el wizard.
  const [tituloRapido, setTituloRapido] = useState('');
  const [tipoRapido, setTipoRapido] = useState<'simple' | 'checklist' | null>(null);
  // Checklist real: la tarea (tituloRapido) es el nombre del checklist, y
  // itemsRapidos son sus pasos — ya no se manda el mismo título como único
  // subitem. Arranca con 2 campos vacíos, igual que el paso "Meta" del wizard
  // completo (CrearTareaWizard.tsx), mismo patrón de agregar/quitar filas.
  const [itemsRapidos, setItemsRapidos] = useState<string[]>(['', '']);
  const crearRapida = useMutation({
    mutationFn: async (datos: { tipo: 'simple'; titulo: string } | { items: string[]; tipo: 'checklist'; titulo: string }) => {
      const tarea = await crearTarea({ fechaVencimiento: fechaLocalHoy(), tipo: datos.tipo, titulo: datos.titulo });
      if (datos.tipo === 'checklist') await crearSubitemsTarea(tarea.id, datos.items);
      return tarea;
    },
    onSuccess: () => {
      hapticSeguro('confirmacion');
      registrarEvento('tarea_creada', { tipo: tipoRapido ?? 'simple', frecuencia: 'una_vez', franja: 'cualquier_momento' });
      setTituloRapido('');
      setItemsRapidos(['', '']);
      setTipoRapido(null);
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_HOY });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_LISTA });
    },
  });
  function abrirModalRapido(tipo: 'simple' | 'checklist') {
    setTipoRapido(tipo);
    setTituloRapido('');
    setItemsRapidos(['', '']);
  }
  function cerrarModalRapido() {
    setTipoRapido(null);
    setTituloRapido('');
    setItemsRapidos(['', '']);
  }
  function actualizarItemRapido(indice: number, texto: string) {
    setItemsRapidos((actual) => actual.map((item, i) => (i === indice ? texto : item)));
  }
  function quitarItemRapido(indice: number) {
    setItemsRapidos((actual) => (actual.length > 1 ? actual.filter((_, i) => i !== indice) : actual));
  }
  const itemsRapidosValidos = itemsRapidos.map((item) => item.trim()).filter((item) => item.length > 0);
  function confirmarRapida() {
    const titulo = tituloRapido.trim();
    if (!titulo || !tipoRapido) return;
    if (tipoRapido === 'checklist') {
      if (itemsRapidosValidos.length === 0) return;
      crearRapida.mutate({ items: itemsRapidosValidos, tipo: 'checklist', titulo });
      return;
    }
    crearRapida.mutate({ tipo: 'simple', titulo });
  }

  // Un solo mutation para completar, sea desde "Hoy" (cualquier tarea) o
  // desde "Mis tareas" (solo 'una_vez' — ver ListaMisTareas). checklist y
  // una_vez van por completar_tarea_dia (toggle: un segundo toque deshace el
  // primero); simple/contador/cronometro recurrentes van por el sendero de
  // días (registrar_progreso_tarea, sin undo — mismo RPC que usa el mapa de
  // Senderos para esta misma tarea, así nunca se desincronizan). Si queda una
  // figura pendiente, no se abre ningún ritual acá (esta pantalla no tiene
  // mapa/pedestal) — queda esperando, igual que una mandala de hábito
  // completada desde otra pantalla: se resuelve la próxima vez que se entra
  // a Senderos y se toca el pedestal pendiente.
  const completar = useMutation<ResultadoCompletarTarea | ResultadoRegistroTarea | ResultadoProgresoTareaUnica, Error, { id: string; frecuencia: string; tipo: string; objetivoValor?: number; valor?: number }>({
    mutationFn: (tarea) => {
      setCompletandoId(tarea.id);
      // El acceso rápido (círculo del timeline, sin valor explícito) marca la
      // meta completa de un toque — no suma 1: ambos RPC de progreso
      // REEMPLAZAN el valor, así que un contador de meta 8 nunca llegaría a
      // completarse a base de toques de +1 si mandáramos 1 fijo.
      if (usaSenderoDeDias(tarea)) {
        return registrarProgresoTarea({ fechaLocal: fechaLocalHoy(), nota: null, tareaId: tarea.id, valor: tarea.valor ?? tarea.objetivoValor ?? 1 });
      }
      if (usaProgresoUnaVez(tarea)) {
        return registrarProgresoTareaUnica(tarea.id, tarea.valor ?? tarea.objetivoValor ?? 1);
      }
      return completarTareaDia(tarea.id);
    },
    onSuccess: (resultado, tarea) => {
      const descompletada = 'completada' in resultado && resultado.completada === false;
      hapticSeguro(descompletada ? 'seleccion' : 'confirmacion');
      if (!descompletada) registrarEvento('tarea_completada', { tipo: tarea.tipo });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_HOY });
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_LISTA });
      cliente.invalidateQueries({ queryKey: ['tareas', 'tarea', tarea.id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'registros-nivel', tarea.id] });
      cliente.invalidateQueries({ queryKey: ['tareas', 'figuras', tarea.id] });
      cliente.invalidateQueries({ queryKey: ['hoy', 'resumen'] });
      if ('gemasGanadas' in resultado && resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
    },
    onError: (error) => {
      // Antes fallaba en silencio total (sin esto, ni consola ni feedback al
      // tocar el círculo) — con console.error al menos queda rastro de qué
      // RPC rechazó la llamada y por qué, mientras no hay un toast real.
      console.error('[tareas] no se pudo completar', error);
      hapticSeguro('impacto');
    },
    onSettled: () => setCompletandoId(null),
  });

  // Árbol/acento del módulo activo — cambia con la pastilla. acentoActivo
  // sigue el MISMO Provider que ya eligió TareasPantalla (golden o aurelia),
  // así que queda perfectamente sincronizado con esc/useEscala() sin
  // recalcular nada acá. Los "fijos" son solo para la pastilla en sí: tiene
  // que mostrar los dos colores reales a la vez, sin importar cuál está activo.
  const temaActivo = useMemo(() => {
    const assets = obtenerAssetsPaquete(modulo === 'planes' ? PAQUETE_PLANES : PAQUETE_TAREAS)!;
    return { arbol: assets.etapas[6], arbusto: assets.arbusto };
  }, [modulo]);
  const { acento: acentoActivo } = useTonoMaster();
  const acentoTareasFijo = useMemo(() => crearTonoMaster(PAQUETE_TAREAS, COLOR_PAQUETE_TAREAS).acento, []);
  const acentoPlanesFijo = useMemo(() => crearTonoMaster(PAQUETE_PLANES, COLOR_PAQUETE_PLANES).acento, []);

  const tareasHoy = consultaHoy.data ?? [];
  const filtroFranja = useFiltroFranja(tareasHoy, (tarea) => !tarea.completada);
  const etiquetasRutina = useEtiquetasRutina();
  const completadosHoy = tareasHoy.filter((tarea) => tarea.completada).length;
  const totalHoy = tareasHoy.length;
  const porcentajeHoy = totalHoy ? Math.round((completadosHoy * 100) / totalHoy) : 0;

  // "Hoy" en Planes = solo los activos (lo que de verdad pide atención día a
  // día) — mismo rol que cumple obtenerTareasHoy() para Tareas. "Mis planes"
  // (acceso "progresion") es la lista completa, incluidos los ya terminados.
  const planes = consultaPlanes.data ?? [];
  const planesHoy = planes.filter((plan) => plan.estado === 'activo');
  const planesActivos = planesHoy.length;
  const itemsCompletadosPlanes = planesHoy.reduce((suma, plan) => suma + plan.completadas, 0);
  const itemsTotalesPlanes = planesHoy.reduce((suma, plan) => suma + plan.total, 0);
  const porcentajePlanes = itemsTotalesPlanes ? Math.round((itemsCompletadosPlanes * 100) / itemsTotalesPlanes) : 0;

  function alternarVista(vista: VistaPanel) {
    setVistaPanel((actual) => (actual === vista ? 'hoy' : vista));
  }

  function abrirAcceso(id: (typeof ACCESOS_TAREAS)[number]['id'] | (typeof ACCESOS_PLANES)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'creacion') { modulo === 'planes' ? setCrearPlanAbierto(true) : setCrearAbierto(true); return; }
    alternarVista(id);
  }

  return (
    <>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
            <AuroraBoreal tema="amarillo" />
            <View style={s.headerInicio}>
              <View style={s.headerTitulo}>
                <Pressable accessibilityLabel={t('tareas.pantalla.volverAlInicio')} onPress={() => router.navigate('/(principal)/hoy')} style={s.botonVolverHub}>
                  <ChevronLeft color={acentoActivo} size={24} />
                </Pressable>
                <View style={s.headerIzq}>
                  <View style={s.saludoFila}>
                    <Texto style={s.headerSaludo}>{t('habitos.pantalla.greeting')}</Texto>
                    <View style={s.selectorModulo}>
                      <Pressable onPress={() => cambiarModulo('tareas')} style={[s.selectorPildora, modulo === 'tareas' && { backgroundColor: acentoTareasFijo }]}>
                        <Texto style={[s.selectorPildoraTexto, modulo === 'tareas' && s.selectorPildoraTextoActivo]}>{t('tareas.pantalla.titulo')}</Texto>
                      </Pressable>
                      <Pressable onPress={() => cambiarModulo('planes')} style={[s.selectorPildora, modulo === 'planes' && { backgroundColor: acentoPlanesFijo }]}>
                        <Texto style={[s.selectorPildoraTexto, modulo === 'planes' && s.selectorPildoraTextoActivo]}>{t('planes.pantalla.titulo')}</Texto>
                      </Pressable>
                    </View>
                  </View>
                  <View style={s.nombreFila}>
                    <Texto style={s.headerNombre}>{modulo === 'planes' ? t('planes.pantalla.titulo') : t('tareas.pantalla.titulo')}</Texto>
                    <Image source={require('../../../../assets/icons/hoy/saludo.png')} style={s.saludoIcono} />
                  </View>
                </View>
              </View>
              <View style={s.headerDer}>
                <Rebote accessibilityLabel={t('habitos.pantalla.buyGems')} onPress={() => router.navigate('/(principal)/tienda')} estilo={s.statPill}>
                  <View style={s.statPillFila}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></View>
                </Rebote>
                <Rebote accessibilityLabel={t('habitos.pantalla.notifications')} onPress={() => Linking.openSettings()}>
                  <MasterGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></MasterGlass>
                </Rebote>
              </View>
            </View>

            <View style={s.heroInicio}>
              <View style={s.heroColIzq}>
                {modulo === 'tareas' ? (
                  <MasterGlass style={s.rachaCard}>
                    <Rebote onPress={() => abrirModalRapido('simple')}>
                      <MasterGlass style={s.rachaOpcionGlass}>
                        <View style={s.rachaOpcionFila}>
                          <MasterIconBg colorBordeFin={acentoActivo} colorBordeInicio={acentoActivo} size={40} tinte={conAlfa(acentoActivo, 0.55)}>
                            <MasterIcon alTema name="rayo" size={26} />
                          </MasterIconBg>
                          <View style={s.rachaOpcionTextos}>
                            <Texto style={[s.rachaOpcionTexto, s.rachaOpcionTextoChico]}>{t('tareas.pantallaCompleta.quickAdd.simple')}</Texto>
                            <Texto style={s.rachaOpcionSubtexto}>{t('tareas.pantallaCompleta.quickAdd.simpleSubtitle')}</Texto>
                          </View>
                        </View>
                      </MasterGlass>
                    </Rebote>
                    <Rebote onPress={() => abrirModalRapido('checklist')}>
                      <MasterGlass style={s.rachaOpcionGlass}>
                        <View style={s.rachaOpcionFila}>
                          <MasterIconBg colorBordeFin={acentoActivo} colorBordeInicio={acentoActivo} size={40} tinte={conAlfa(acentoActivo, 0.55)}>
                            <MasterIcon alTema name="hoy/lista" size={26} />
                          </MasterIconBg>
                          <View style={s.rachaOpcionTextos}>
                            <Texto style={s.rachaOpcionTexto}>{t('tareas.pantallaCompleta.quickAdd.checklist')}</Texto>
                            <Texto style={s.rachaOpcionSubtexto}>{t('tareas.pantallaCompleta.quickAdd.checklistSubtitle')}</Texto>
                          </View>
                        </View>
                      </MasterGlass>
                    </Rebote>
                  </MasterGlass>
                ) : (
                  <MasterGlass style={s.rachaCard}>
                    <Rebote onPress={() => setCrearPlanAbierto(true)}>
                      <MasterGlass style={s.rachaOpcionGlass}>
                        <View style={s.rachaOpcionFila}>
                          <MasterIconBg colorBordeFin={acentoActivo} colorBordeInicio={acentoActivo} size={40} tinte={conAlfa(acentoActivo, 0.55)}>
                            <MasterIcon alTema name="idea" size={26} />
                          </MasterIconBg>
                          <View style={s.rachaOpcionTextos}>
                            <Texto style={[s.rachaOpcionTexto, s.rachaOpcionTextoChico]}>{t('planes.crear.manual')}</Texto>
                            <Texto style={s.rachaOpcionSubtexto}>{t('planes.crear.manualDescripcion')}</Texto>
                          </View>
                        </View>
                      </MasterGlass>
                    </Rebote>
                    <Rebote onPress={() => setCrearPlanAbierto(true)}>
                      <MasterGlass style={s.rachaOpcionGlass}>
                        <View style={s.rachaOpcionFila}>
                          <MasterIconBg colorBordeFin={acentoActivo} colorBordeInicio={acentoActivo} size={40} tinte={conAlfa(acentoActivo, 0.55)}>
                            <MasterIcon alTema name="estadistica" size={26} />
                          </MasterIconBg>
                          <View style={s.rachaOpcionTextos}>
                            <Texto style={s.rachaOpcionTexto}>{t('planes.crear.ia')}</Texto>
                            <Texto style={s.rachaOpcionSubtexto}>{t('planes.crear.iaDescripcion')}</Texto>
                          </View>
                        </View>
                      </MasterGlass>
                    </Rebote>
                  </MasterGlass>
                )}
                <MasterGlass style={s.nivelCard}>
                  <MasterIcon alTema name="trofeo" size={26} />
                  <View style={s.nivelInfo}>
                    {modulo === 'tareas' ? (
                      <>
                        <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('tareas.pantallaCompleta.todayTasks')}</Texto><Texto style={s.nivelXP}>{completadosHoy}/{totalHoy}</Texto></View>
                        <MasterProgressbar altura={10} porcentaje={porcentajeHoy} style={s.barraMaster} />
                      </>
                    ) : (
                      <>
                        <View style={s.nivelTexto}><Texto style={s.nivelLabel}>{t('planes.pantalla.misPlanes')}</Texto><Texto style={s.nivelXP}>{planesActivos}</Texto></View>
                        <MasterProgressbar altura={10} colorBase={acentoActivo} porcentaje={porcentajePlanes} style={s.barraMaster} />
                      </>
                    )}
                  </View>
                </MasterGlass>
              </View>
              <View style={s.heroColDer}><View style={s.ilustracionContenedor}><Image resizeMode="cover" source={temaActivo.arbol} style={s.ilustracionHabitos} /></View></View>
            </View>

            <View style={s.accesosFila}>
              {(modulo === 'tareas' ? ACCESOS_TAREAS : ACCESOS_PLANES).map((acceso) => {
                const prefijoI18n = modulo === 'tareas' ? 'tareas.pantallaCompleta.access' : 'planes.pantalla.access';
                return (
                  <View key={acceso.id} style={s.accesoTarjeta}>
                    <Rebote accessibilityLabel={t(`${prefijoI18n}.${acceso.id}.label`)} onPress={() => abrirAcceso(acceso.id)}>
                      <MasterGlass style={s.accesoGlass}>
                        <MasterIcon alTema name={acceso.nombreIcono} size={32} />
                        <View style={s.accesoTexto}>
                          <Texto adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.accesoEtiqueta}>{t(`${prefijoI18n}.${acceso.id}.label`)}</Texto>
                          <Texto numberOfLines={2} style={s.accesoDescripcion}>{t(`${prefijoI18n}.${acceso.id}.description`)}</Texto>
                        </View>
                      </MasterGlass>
                    </Rebote>
                  </View>
                );
              })}
            </View>
          </View>

          <MasterGlass style={s.panel}>
            {vistaPanel === 'hoy' ? (
              <View style={s.encabezadoHoy}>
                <View style={s.encabezadoHoyFila}>
                  <MasterIconBg size={70}><Image resizeMode="contain" source={temaActivo.arbusto} style={{ height: 58, width: 58 }} /></MasterIconBg>
                  <View style={{ flex: 1 }}>
                    {modulo === 'tareas' ? (
                      <>
                        <Texto style={s.encabezadoHoyTitulo}>{t('tareas.pantallaCompleta.viewToday')}</Texto>
                        <Texto style={s.encabezadoHoyCompletadas}>{t('tareas.pantallaCompleta.todayCompleted', { completed: completadosHoy, total: totalHoy })}</Texto>
                        <View style={s.encabezadoHoyProgresoFila}>
                          <MasterProgressbar altura={10} porcentaje={porcentajeHoy} style={s.encabezadoHoyBarra} />
                          <Texto style={[s.encabezadoHoyPorcentaje, { color: acentoActivo }]}>{porcentajeHoy}%</Texto>
                        </View>
                      </>
                    ) : (
                      <>
                        <Texto style={s.encabezadoHoyTitulo}>{t('planes.pantalla.misPlanes')}</Texto>
                        <Texto style={s.encabezadoHoyCompletadas}>{t('planes.tarjeta.progreso', { completadas: itemsCompletadosPlanes, total: itemsTotalesPlanes })}</Texto>
                        <View style={s.encabezadoHoyProgresoFila}>
                          <MasterProgressbar altura={10} colorBase={acentoActivo} porcentaje={porcentajePlanes} style={s.encabezadoHoyBarra} />
                          <Texto style={[s.encabezadoHoyPorcentaje, { color: acentoActivo }]}>{porcentajePlanes}%</Texto>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.tituloFila}><View style={s.tituloConIcono}><MasterIcon alTema name={ICONOS_VISTA_PANEL[vistaPanel]} size={22} /><Texto style={s.titulo}>{vistaPanel === 'progresion' ? (modulo === 'planes' ? t('planes.pantalla.access.progresion.label') : t('tareas.pantallaCompleta.viewProgress')) : vistaPanel === 'compartidos' ? t('planes.pantalla.access.compartidos.label') : modulo === 'planes' ? t('planes.pantalla.access.recordatorios.label') : t('tareas.pantallaCompleta.viewReminders')}</Texto></View></View>
            )}

            {modulo === 'tareas' && vistaPanel === 'hoy' && (
              consultaHoy.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaHoy.isError ? (
                <Pressable onPress={() => consultaHoy.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <>
                  {filtroFranja.visible && (
                    <View style={{ marginBottom: 10 }}>
                      <SelectorFranja color={esc.jade.l34} conteos={filtroFranja.conteos} etiquetaAccesible={filtroFranja.etiquetaAccesible} etiquetas={filtroFranja.etiquetas} onCambiar={filtroFranja.setFiltro} valor={filtroFranja.filtro} />
                    </View>
                  )}
                  {filtroFranja.filtro !== 'todo' && filtroFranja.filtrados.length === 0 ? (
                    <VacioDeFranja franja={filtroFranja.filtro} onVerTodo={() => filtroFranja.setFiltro('todo')} />
                  ) : (
                    <TimelineTareasHoy
                      completandoId={completandoId}
                      etiquetasRutina={etiquetasRutina.tareas}
                      onCompletar={(tarea: TareaHoyDetalle) => completar.mutate(tarea)}
                      onRegistrarProgreso={(tarea: TareaHoyDetalle, valor: number) => completar.mutate({ ...tarea, valor })}
                      tareas={filtroFranja.filtrados}
                    />
                  )}
                </>
              )
            )}

            {modulo === 'planes' && vistaPanel === 'hoy' && (
              consultaPlanes.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaPlanes.isError ? (
                <Pressable onPress={() => consultaPlanes.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <TimelinePlanesHoy onAbrirPlan={(plan) => router.push(`/planes/${plan.id}`)} planes={planesHoy} />
              )
            )}

            {modulo === 'planes' && vistaPanel === 'progresion' && (
              consultaPlanes.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaPlanes.isError ? (
                <Pressable onPress={() => consultaPlanes.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <TimelinePlanesHoy onAbrirPlan={(plan) => router.push(`/planes/${plan.id}`)} planes={planes} />
              )
            )}

            {modulo === 'planes' && vistaPanel === 'recordatorios' && (
              <View style={s.encabezadoHoy}><Texto style={s.vacioTexto}>{t('planes.pantalla.recordatoriosProximamente')}</Texto></View>
            )}
            {modulo === 'planes' && vistaPanel === 'compartidos' && (
              consultaPlanes.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaPlanes.isError ? (
                <Pressable onPress={() => consultaPlanes.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <SeccionCompartidos planes={planes} />
              )
            )}

            {modulo === 'tareas' && vistaPanel === 'progresion' && (
              consultaLista.isLoading ? <Texto style={s.vacioTexto}>{t('tareas.pantalla.cargando')}</Texto> : consultaLista.isError ? (
                <Pressable onPress={() => consultaLista.refetch()}><Texto style={s.error}>{t('tareas.pantalla.errorCargar')}</Texto></Pressable>
              ) : (
                <ListaMisTareas completandoId={completandoId} onCompletarUnaVez={(tarea: Tarea) => completar.mutate(tarea)} tareas={consultaLista.data ?? []} />
              )
            )}

            {modulo === 'tareas' && vistaPanel === 'recordatorios' && (
              <ListaRecordatoriosTareas
                isError={consultaRecordatorios.isError}
                isLoading={consultaRecordatorios.isLoading}
                onReintentar={() => consultaRecordatorios.refetch()}
                onSeleccionar={() => hapticSeguro('seleccion')}
                planes={consultaRecordatorios.data ?? []}
              />
            )}
          </MasterGlass>
        </ScrollView>
      </LinearGradient>
      <CrearTareaWizard
        guardando={crearPremium.isPending}
        onCerrar={() => setCrearAbierto(false)}
        onCrear={(input) => crearPremium.mutateAsync(input)}
        visible={crearAbierto}
      />
      <CrearPlanWizard
        onCerrar={() => setCrearPlanAbierto(false)}
        onCreado={(planId) => {
          setCrearPlanAbierto(false);
          cliente.invalidateQueries({ queryKey: CLAVE_PLANES });
          if (planId) router.push(`/planes/${planId}`);
        }}
        visible={crearPlanAbierto}
      />
      <Modal animationType="fade" onRequestClose={cerrarModalRapido} transparent visible={tipoRapido !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalFondo}>
          <Pressable accessibilityLabel={t('tareas.pantalla.cancelar')} onPress={cerrarModalRapido} style={StyleSheet.absoluteFill} />
          <MasterGlass style={s.modalTarjeta}>
            <View style={s.modalEncabezado}>
              <MasterIconBg colorBordeFin={acentoActivo} colorBordeInicio={acentoActivo} size={34} tinte={conAlfa(acentoActivo, 0.55)}>
                <MasterIcon alTema name={tipoRapido === 'checklist' ? 'hoy/lista' : 'rayo'} size={16} />
              </MasterIconBg>
              <Texto style={s.modalTitulo}>{tipoRapido === 'checklist' ? t('tareas.pantallaCompleta.quickAdd.checklist') : t('tareas.pantallaCompleta.quickAdd.simple')}</Texto>
            </View>
            <TextInput
              autoFocus
              maxFontSizeMultiplier={1.3}
              onChangeText={setTituloRapido}
              onSubmitEditing={tipoRapido === 'simple' ? confirmarRapida : undefined}
              placeholder={tipoRapido === 'checklist' ? t('tareas.pantallaCompleta.quickAdd.checklistTitlePlaceholder') : t('tareas.pantallaCompleta.quickAdd.placeholder')}
              placeholderTextColor={C.tenue}
              returnKeyType={tipoRapido === 'simple' ? 'done' : 'next'}
              style={s.modalInput}
              value={tituloRapido}
            />
            {tipoRapido === 'checklist' && (
              <View style={s.modalItems}>
                {itemsRapidos.map((item, indice) => (
                  <View key={indice} style={s.modalItemFila}>
                    <TextInput
                      maxFontSizeMultiplier={1.3}
                      onChangeText={(texto) => actualizarItemRapido(indice, texto)}
                      placeholder={t('tareas.pantallaCompleta.quickAdd.itemPlaceholder', { count: indice + 1 })}
                      placeholderTextColor={C.tenue}
                      returnKeyType="next"
                      style={s.modalItemInput}
                      value={item}
                    />
                    {itemsRapidos.length > 1 && (
                      <Rebote accessibilityLabel={t('tareas.pantalla.cancelar')} estilo={s.modalItemQuitar} onPress={() => quitarItemRapido(indice)}>
                        <X color={C.tenue} size={16} />
                      </Rebote>
                    )}
                  </View>
                ))}
                <Rebote estilo={s.modalAgregarItem} onPress={() => setItemsRapidos((actual) => [...actual, ''])}>
                  <View style={s.modalAgregarItemFila}>
                    <Plus color={acentoActivo} size={16} />
                    <Texto style={[s.modalAgregarItemTexto, { color: acentoActivo }]}>{t('tareas.pantallaCompleta.quickAdd.addItem')}</Texto>
                  </View>
                </Rebote>
              </View>
            )}
            <MasterButton color={acentoActivo} disabled={!tituloRapido.trim() || crearRapida.isPending || (tipoRapido === 'checklist' && itemsRapidosValidos.length === 0)} onPress={confirmarRapida}>
              {crearRapida.isPending ? t('tareas.pantalla.creando') : t('tareas.pantalla.crear')}
            </MasterButton>
          </MasterGlass>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { flex: 1 }, contenido: { gap: 16, paddingBottom: 0 }, superiorInicio: { gap: 0 },
  botonVolverHub: { alignItems: 'center', height: 34, justifyContent: 'center', marginRight: 2, width: 30 },
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 }, headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' }, headerIzq: { flex: 1 }, nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 }, headerNombre: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 26 }, saludoIcono: { height: 28, resizeMode: 'contain', width: 28 }, headerSaludo: { color: '#4B4B4B', fontFamily: 'MontserratAlternates-Medium', fontSize: 14, lineHeight: 17 }, headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 },
  saludoFila: { alignItems: 'center', flexDirection: 'row', gap: 8 }, selectorModulo: { flexDirection: 'row', gap: 4 }, selectorPildora: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 2 }, selectorPildoraTexto: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 10 }, selectorPildoraTextoActivo: { color: '#FFFFFF' },
  statPill: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 }, statPillFila: { alignItems: 'center', flexDirection: 'row', gap: 4 }, gemaIcono: { height: 22, resizeMode: 'contain', width: 22 }, statTexto: { color: '#6D28D9', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, notificacion: { borderRadius: 22, paddingHorizontal: 10, paddingVertical: 10 }, notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 },
  heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 }, heroColIzq: { gap: 10, width: '45%' }, heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 }, ilustracionContenedor: { aspectRatio: 1, borderRadius: 20, overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' }, ilustracionHabitos: { height: '100%', width: '100%' },
  rachaCard: { borderRadius: 18, gap: 6, padding: 8 }, rachaOpcionGlass: { borderRadius: 14, padding: 5 }, rachaOpcionFila: { alignItems: 'center', flexDirection: 'row', gap: 8 }, rachaOpcionTextos: { flex: 1, justifyContent: 'center' }, rachaOpcionTexto: { color: '#1A1A1A', fontFamily: 'MontserratAlternates-Bold', fontSize: 13, lineHeight: 15 }, rachaOpcionTextoChico: { fontSize: 11, lineHeight: 13 }, rachaOpcionSubtexto: { color: '#6B6478', fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12 },
  modalFondo: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  modalTarjeta: { borderRadius: 22, gap: 14, padding: 18, width: '100%' },
  modalEncabezado: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  modalTitulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  modalInput: { backgroundColor: '#FFFFFF', borderColor: '#E4DDF0', borderRadius: 14, borderWidth: 1, color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 15, padding: 13 },
  modalItems: { gap: 8 },
  modalItemFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  modalItemInput: { backgroundColor: '#FFFFFF', borderColor: '#E4DDF0', borderRadius: 12, borderWidth: 1, color: C.texto, flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 14, padding: 11 },
  modalItemQuitar: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  modalAgregarItem: { paddingVertical: 4 },
  modalAgregarItemFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  modalAgregarItemTexto: { fontFamily: 'Montserrat-Bold', fontSize: 12, lineHeight: 14 },
  nivelCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 }, nivelInfo: { flex: 1 }, nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, nivelLabel: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, nivelXP: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11 }, barraMaster: { marginTop: 2 },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 }, accesoTarjeta: { flex: 1 }, accesoGlass: { alignItems: 'center', borderRadius: 14, justifyContent: 'flex-start', minHeight: 100, padding: 8 }, accesoTexto: { alignItems: 'center', marginTop: 5, minHeight: 31, width: '100%' }, accesoEtiqueta: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15, textAlign: 'center' }, accesoDescripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 1, textAlign: 'center' },
  panel: { borderRadius: 22, marginHorizontal: 20, padding: 15 }, tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, tituloConIcono: { alignItems: 'center', flexDirection: 'row', gap: 7 }, titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  vacioTexto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 18, textAlign: 'center' },
  encabezadoHoy: { marginBottom: 14 }, encabezadoHoyFila: { alignItems: 'center', flexDirection: 'row', gap: 12 }, encabezadoHoyTitulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 26, lineHeight: 34 }, encabezadoHoyCompletadas: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 13, marginTop: 2 }, encabezadoHoyProgresoFila: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 0 }, encabezadoHoyBarra: { flex: 1 }, encabezadoHoyPorcentaje: { fontFamily: 'MontserratAlternates-Bold', fontSize: 13, minWidth: 36, textAlign: 'right' },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
