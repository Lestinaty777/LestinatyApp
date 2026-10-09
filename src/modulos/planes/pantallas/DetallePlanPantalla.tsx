import { useEffect, useState } from 'react';
import { ChevronLeft, Check, Crown, Plus, Sparkles, X } from 'lucide-react-native';
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
// Reusado tal cual de Tareas — ya es presentacional (sin hooks propios de
// Tareas), "cronometro" ahí ya es un contador con unidad fija en minutos
// (ver WidgetProgresoTarea.tsx), así que cubre los dos tipos sin cambios.
import { WidgetProgresoTarea } from '../../tareas/componentes/WidgetProgresoTarea';
import {
  aceptarPropuestaPlan, detallarSeccionPlan, ErrorAccesoAby, generarPlanInicial, guardarDetalleSeccionManual, marcarItemPlan,
  obtenerDetalleSeccion, obtenerInstanciaPropia, obtenerParticipantesPlan, obtenerPlanPorId, obtenerRamasPlan, obtenerSeccionesPlan,
} from '../planes.servicio';
import type { Disponibilidad, MomentoBloque, PlanRama, PlanSeccion, PropuestaDia, ValorDisponibilidad } from '../planes.tipos';

// Aurelia real (master_pack_color en arboles_paquetes es #FFD000, igual al
// que ya usa nacarMandala.ts) — Planes usa este paquete COMPLETO (color +
// árbol), a diferencia de Tareas que solo toma el color de "golden" para su
// rotación estética. Esta pantalla es una ruta propia (no anidada bajo
// TareasPantalla), así que necesita su propio TonoDelHabito.
const PAQUETE_PLANES = 'aurelia';
const COLOR_PAQUETE_PLANES = '#FFD000';
const CLAVE_PLANES_LISTA = ['planes', 'lista'] as const;
const MOMENTOS_DISPONIBILIDAD: MomentoBloque[] = ['manana', 'tarde', 'noche'];

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
  const [notaPendienteItemId, setNotaPendienteItemId] = useState<string | null>(null);
  const [ramaReclamarId, setRamaReclamarId] = useState<string | null>(null);

  const consultaPlan = useQuery({ queryFn: () => obtenerPlanPorId(id), queryKey: ['planes', 'plan', id] });
  const consultaSecciones = useQuery({ queryFn: () => obtenerSeccionesPlan(id), queryKey: ['planes', 'secciones', id] });
  const consultaInstancia = useQuery({ queryFn: () => obtenerInstanciaPropia(id), queryKey: ['planes', 'instancia', id] });
  const consultaRamas = useQuery({ queryFn: () => obtenerRamasPlan(id), queryKey: ['planes', 'ramas', id] });

  const plan = consultaPlan.data;
  const secciones = consultaSecciones.data ?? [];
  const instancia = consultaInstancia.data;
  const ramas = consultaRamas.data ?? [];
  const tieneRamas = ramas.length > 0;
  // Las ramas que ya reclamó el usuario actual — puede ser más de una desde
  // la migración 75 (ej. alguien llevando solo varios canales de un plan de
  // marketing). Vacío si todavía no reclamó ninguna, o si el plan no tiene
  // ramas (sin efecto en ese caso).
  const misRamasIds = new Set(instancia ? ramas.filter((rama) => rama.instanciaId === instancia.id).map((rama) => rama.id) : []);
  const ramaReclamar = ramas.find((rama) => rama.id === ramaReclamarId) ?? null;

  // Primera detallada-no-completada, o la última si todas están completas —
  // la que se expande sola al entrar. Solo tiene sentido en el camino sin
  // ramas (el plan entero es "mi camino"); con ramas, cada TarjetaRama
  // calcula esto por su cuenta con SUS propias secciones.
  const seccionVigente = tieneRamas
    ? undefined
    : secciones.find((seccion) => seccion.estado === 'detallada') ?? [...secciones].reverse().find((seccion) => seccion.estado === 'completada');

  // La sección justo antes de la que se va a detallar — su nota (si alguien
  // la dejó al completarla) precarga el contexto que se le pasa a Aby, en
  // vez de pedirle al usuario que la recuerde y la re-escriba. Se busca
  // dentro de la MISMA rama que la sección a detallar (cada rama tiene su
  // propio "orden" independiente, así que no alcanza con el índice global).
  const seccionDetallarRamaId = secciones.find((seccion) => seccion.id === seccionDetallarId)?.ramaId ?? null;
  const seccionesRamaDetallar = secciones.filter((seccion) => seccion.ramaId === seccionDetallarRamaId);
  const indiceSeccionDetallar = seccionesRamaDetallar.findIndex((seccion) => seccion.id === seccionDetallarId);
  const seccionAnteriorId = indiceSeccionDetallar > 0 ? seccionesRamaDetallar[indiceSeccionDetallar - 1].id : null;
  const consultaSeccionAnterior = useQuery({
    enabled: seccionAnteriorId !== null && Boolean(instancia?.id),
    queryFn: () => obtenerDetalleSeccion(seccionAnteriorId as string, instancia!.id),
    queryKey: ['planes', 'seccion-detalle', seccionAnteriorId, instancia?.id],
  });
  let notaSeccionAnterior: string | null = null;
  for (const dia of consultaSeccionAnterior.data?.dias ?? []) {
    for (const bloque of dia.bloques) {
      const item = bloque.items.find((item) => item.nota);
      if (item?.nota) { notaSeccionAnterior = item.nota; break; }
    }
    if (notaSeccionAnterior) break;
  }

  function invalidarTodo() {
    cliente.invalidateQueries({ queryKey: ['planes', 'secciones', id] });
    cliente.invalidateQueries({ queryKey: ['planes', 'plan', id] });
    cliente.invalidateQueries({ queryKey: ['planes', 'ramas', id] });
    cliente.invalidateQueries({ queryKey: ['planes', 'participantes', id] });
    cliente.invalidateQueries({ queryKey: CLAVE_PLANES_LISTA });
  }

  if (consultaPlan.isError) {
    return (
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l91]} style={[s.raiz, { paddingTop: insets.top + 32 }]}>
        <Pressable onPress={() => consultaPlan.refetch()} style={s.vacio}>
          <Texto style={s.vacioTexto}>{t('planes.pantalla.errorCargar')}</Texto>
          <Texto style={[s.vacioTexto, { color: acento, fontFamily: 'Montserrat-Bold', marginTop: 6 }]}>{t('planes.pantalla.reintentar')}</Texto>
        </Pressable>
      </LinearGradient>
    );
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
          {tieneRamas ? (
            ramas.map((rama) => (
              <TarjetaRama
                esMia={misRamasIds.has(rama.id)}
                instanciaId={instancia?.id ?? null}
                key={rama.id}
                onInvalidar={invalidarTodo}
                onPedirDetalle={(seccionId) => setSeccionDetallarId(seccionId)}
                onReclamar={() => setRamaReclamarId(rama.id)}
                onSeccionCompletada={(bloqueItemId) => setNotaPendienteItemId(bloqueItemId)}
                onToggleExpandida={(seccionId) => setSeccionExpandidaId((actual) => (actual === seccionId ? null : seccionId))}
                puedoReclamar={rama.instanciaId === null && Boolean(instancia)}
                rama={rama}
                secciones={secciones.filter((seccion) => seccion.ramaId === rama.id)}
                seccionExpandidaId={seccionExpandidaId}
              />
            ))
          ) : (
            secciones.map((seccion, indice) => (
              <TarjetaSeccion
                esUltima={indice === secciones.length - 1}
                instanciaId={instancia?.id ?? null}
                key={seccion.id}
                onInvalidar={invalidarTodo}
                onPedirDetalle={() => setSeccionDetallarId(seccion.id)}
                onSeccionCompletada={(bloqueItemId) => setNotaPendienteItemId(bloqueItemId)}
                onToggleExpandida={() => setSeccionExpandidaId((actual) => (actual === seccion.id ? null : seccion.id))}
                seccion={seccion}
                seccionNumero={indice + 1}
                soloExpandible={seccion.id === (seccionVigente?.id ?? seccionExpandidaId)}
              />
            ))
          )}
          {secciones.length === 0 && !consultaSecciones.isLoading && !tieneRamas && (
            <View style={s.vacio}><Texto style={s.vacioTexto}>{t('planes.detalle.sinSecciones')}</Texto></View>
          )}
        </View>

        {instancia && <SeccionParticipantes esCreador={instancia.esCreador} planId={id} />}
      </ScrollView>

      {instancia && (
        <ModalDetallarSeccion
          notaInicial={notaSeccionAnterior}
          onCerrar={() => setSeccionDetallarId(null)}
          onListo={() => { setSeccionDetallarId(null); invalidarTodo(); }}
          seccionId={seccionDetallarId}
        />
      )}
      {instancia && (
        <ModalNotaSeccion
          bloqueItemId={notaPendienteItemId}
          instanciaId={instancia.id}
          onListo={() => { setNotaPendienteItemId(null); invalidarTodo(); }}
        />
      )}
      <ModalReclamarRama
        disponibilidadInicial={ramas.find((rama) => misRamasIds.has(rama.id))?.disponibilidad ?? null}
        onCerrar={() => setRamaReclamarId(null)}
        onListo={() => { setRamaReclamarId(null); invalidarTodo(); }}
        rama={ramaReclamar}
      />
    </LinearGradient>
  );
}

// Solo MUESTRA progreso — generar/copiar/mandar el código de invitación
// vive en la sección "Compartidos" (SeccionCompartidos.tsx), no acá, para no
// duplicar ese flujo en dos lugares.
function SeccionParticipantes({ esCreador, planId }: { esCreador: boolean; planId: string }) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const s = useEstilosS(esc, acento);
  const { t } = useTranslation();
  const consulta = useQuery({ queryFn: () => obtenerParticipantesPlan(planId), queryKey: ['planes', 'participantes', planId] });
  const participantes = consulta.data ?? [];
  // Desde que una persona puede tener varias ramas, esta lista trae una FILA
  // POR RAMA, no una por persona — "¿hay alguien más?" hay que preguntarlo
  // contando personas distintas, no filas.
  const personasDistintas = new Set(participantes.map((participante) => participante.usuarioId)).size;

  if (personasDistintas <= 1) {
    if (!esCreador) return null;
    return (
      <View style={s.contenido}>
        <Texto style={s.vacioTexto}>{t('planes.detalle.compartirSugerencia')}</Texto>
      </View>
    );
  }

  return (
    <View style={[s.contenido, { gap: 8, marginTop: 10 }]}>
      <Texto style={s.seccionTitulo}>{t('planes.detalle.participantesTitulo')}</Texto>
      {participantes.map((participante) => (
        <MasterGlass key={participante.ramaId ?? participante.instanciaId} style={{ alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 10, padding: 12 }}>
          <View style={{ flex: 1 }}>
            <Texto style={s.diaTitulo}>
              {participante.nombre}{participante.esCreador ? ` · ${t('planes.detalle.creador')}` : ''}{participante.ramaNombre ? ` · ${participante.ramaNombre}` : ''}
            </Texto>
            <MasterProgressbar altura={6} colorBase={acento} porcentaje={participante.total > 0 ? Math.round((participante.completadas / participante.total) * 100) : 0} style={{ marginTop: 6 }} />
          </View>
          <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{participante.completadas}/{participante.total}</Texto>
        </MasterGlass>
      ))}
    </View>
  );
}

// Una "rama" es una parte paralela de un plan dividido — cada una tiene su
// propio arco de secciones, independiente de las demás. Sin reclamar, no
// tiene secciones todavía (eso se genera recién al reclamarla, con la
// disponibilidad real de quien la reclama — ver ModalReclamarRama).
function TarjetaRama({ esMia, instanciaId, onInvalidar, onPedirDetalle, onReclamar, onSeccionCompletada, onToggleExpandida, puedoReclamar, rama, secciones, seccionExpandidaId }: {
  esMia: boolean;
  instanciaId: string | null;
  onInvalidar: () => void;
  onPedirDetalle: (seccionId: string) => void;
  onReclamar: () => void;
  onSeccionCompletada: (bloqueItemId: string) => void;
  onToggleExpandida: (seccionId: string) => void;
  puedoReclamar: boolean;
  rama: PlanRama;
  seccionExpandidaId: string | null;
  secciones: PlanSeccion[];
}) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const s = useEstilosS(esc, acento);
  const { t } = useTranslation();
  const sinReclamar = rama.instanciaId === null;
  // Cada rama calcula su propia "vigente" con SUS propias secciones — una
  // persona con varias ramas tiene un arco independiente en cada una, no un
  // solo punto de avance global.
  const seccionVigente = secciones.find((seccion) => seccion.estado === 'detallada') ?? [...secciones].reverse().find((seccion) => seccion.estado === 'completada');

  return (
    <View style={{ marginBottom: 18 }}>
      <MasterGlass style={[s.tarjetaSeccion, { marginBottom: 10 }]}>
        <Texto numberOfLines={2} style={s.seccionTitulo}>{rama.nombre}</Texto>
        {rama.resumen && <Texto numberOfLines={2} style={s.seccionResumen}>{rama.resumen}</Texto>}
        {sinReclamar && !puedoReclamar && <Texto style={[s.seccionResumen, { color: acento, marginTop: 6 }]}>{t('planes.detalle.ramaSinReclamar')}</Texto>}
        {!sinReclamar && !esMia && <Texto style={[s.seccionResumen, { color: acento, marginTop: 6 }]}>{t('planes.detalle.ramaReclamada')}</Texto>}
        {sinReclamar && puedoReclamar && (
          <MasterButton color={acento} onPress={onReclamar} style={{ marginTop: 10 }}>
            {t('planes.detalle.ramaReclamar')}
          </MasterButton>
        )}
      </MasterGlass>

      {esMia && secciones.map((seccion, indice) => (
        <TarjetaSeccion
          esUltima={indice === secciones.length - 1}
          instanciaId={instanciaId}
          key={seccion.id}
          onInvalidar={onInvalidar}
          onPedirDetalle={() => onPedirDetalle(seccion.id)}
          onSeccionCompletada={onSeccionCompletada}
          onToggleExpandida={() => onToggleExpandida(seccion.id)}
          seccion={seccion}
          seccionNumero={indice + 1}
          soloExpandible={seccion.id === (seccionVigente?.id ?? seccionExpandidaId)}
        />
      ))}
    </View>
  );
}

function TarjetaSeccion({ esUltima, instanciaId, onInvalidar, onPedirDetalle, onSeccionCompletada, onToggleExpandida, seccion, seccionNumero, soloExpandible }: {
  esUltima: boolean;
  instanciaId: string | null;
  onInvalidar: () => void;
  onPedirDetalle: () => void;
  onSeccionCompletada: (bloqueItemId: string) => void;
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
  const [itemExpandidoId, setItemExpandidoId] = useState<string | null>(null);

  const consultaDetalle = useQuery({
    enabled: expandida && Boolean(instanciaId),
    queryFn: () => obtenerDetalleSeccion(seccion.id, instanciaId as string),
    queryKey: ['planes', 'seccion-detalle', seccion.id, instanciaId],
  });

  const marcar = useMutation({
    mutationFn: ({ bloqueItemId, hecho }: { bloqueItemId: string; hecho: boolean }) => marcarItemPlan(instanciaId as string, bloqueItemId, hecho),
    onSuccess: (resultado, variables) => {
      hapticSeguro('confirmacion');
      consultaDetalle.refetch();
      onInvalidar();
      if (resultado.seccionCompletada) onSeccionCompletada(variables.bloqueItemId);
    },
  });

  // Mismo mecanismo que registrarProgresoTarea (meta vs. valor) — acá el
  // servidor decide "hecho" comparando el valor contra la meta real del
  // ítem, nunca el cliente.
  const registrarValor = useMutation({
    mutationFn: ({ bloqueItemId, valor }: { bloqueItemId: string; valor: number }) => marcarItemPlan(instanciaId as string, bloqueItemId, undefined, valor),
    onSuccess: (resultado, variables) => {
      consultaDetalle.refetch();
      onInvalidar();
      if (resultado.seccionCompletada) { setItemExpandidoId(null); onSeccionCompletada(variables.bloqueItemId); }
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
                    {bloque.items.map((item) => item.tipo === 'simple' ? (
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
                    ) : (
                      <View key={item.id}>
                        <Pressable onPress={() => setItemExpandidoId((actual) => (actual === item.id ? null : item.id))} style={s.filaItem}>
                          <View style={[s.checkboxItem, item.hecho && { backgroundColor: acento }]}>
                            {item.hecho && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
                          </View>
                          <Texto style={[s.itemTexto, item.hecho && s.itemTextoHecho]}>
                            {item.titulo} ({item.valorActual ?? 0}/{item.metaValor}{item.unidad ? ` ${item.unidad}` : ''})
                          </Texto>
                        </Pressable>
                        {itemExpandidoId === item.id && (
                          <View style={{ marginTop: 6, paddingLeft: 28 }}>
                            <WidgetProgresoTarea
                              color={acento}
                              guardando={registrarValor.isPending}
                              meta={item.metaValor ?? 1}
                              onGuardar={(valor) => registrarValor.mutate({ bloqueItemId: item.id, valor })}
                              tipo={item.tipo}
                              titulo={item.titulo}
                              unidad={item.unidad}
                              valorInicial={item.valorActual ?? 0}
                            />
                          </View>
                        )}
                      </View>
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

// Mismo tratamiento para cualquier error de un paso que llama a Aby — si es
// "no tenés Horizon", un botón directo al paywall en vez de un mensaje
// muerto (mismo patrón que ya usa CrearPlanWizard en su paso de
// disponibilidad); para cualquier otro error, el mensaje real del servidor.
function ErrorAbyInline({ error, onIrAlPaywall }: { error: unknown; onIrAlPaywall: () => void }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  if (error instanceof ErrorAccesoAby && error.codigo === 'horizon_inactivo') {
    return (
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Texto style={s2.error}>{error.message}</Texto>
        <Rebote onPress={onIrAlPaywall}>
          <View style={{ alignItems: 'center', backgroundColor: acento, borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Crown color="#fff" size={14} />
            <Texto style={{ color: '#fff', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('planes.crear.verHorizon')}</Texto>
          </View>
        </Rebote>
      </View>
    );
  }
  return <Texto style={s2.error}>{error instanceof Error ? error.message : t('planes.crear.errorGenerar')}</Texto>;
}

// Reclamar una rama le asigna a quien la reclama su propia instancia (si no
// tenía una en este plan, se crea del lado del servidor) + le arma su primer
// tramo de secciones/días con SU disponibilidad real — nunca la de quien
// armó el plan. Mismo flujo propuesta→revisión→aceptar que ya usa
// ModalDetallarSeccion, pero pidiendo disponibilidad en vez de contexto (el
// objetivo original del plan ya lo sabe el servidor).
function ModalReclamarRama({ disponibilidadInicial, onCerrar, onListo, rama }: { disponibilidadInicial: Disponibilidad | null; onCerrar: () => void; onListo: () => void; rama: PlanRama | null }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const router = useRouter();
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>({});
  const [propuestaId, setPropuestaId] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<{ primeraSeccionDias: readonly PropuestaDia[]; secciones: readonly { resumen: string; titulo: string }[] } | null>(null);

  function irAlPaywall() {
    onCerrar();
    router.push({ params: { volver: '/(principal)/tareas' }, pathname: '/horizon' });
  }

  // Si ya reclamó otra rama de este mismo plan, precarga SU disponibilidad
  // en vez de arrancar en blanco — es la misma persona, lo más probable es
  // que tenga el mismo horario libre; queda editable por si no.
  useEffect(() => {
    if (rama) setDisponibilidad(disponibilidadInicial ?? {});
  }, [rama, disponibilidadInicial]);

  function reiniciar() {
    setDisponibilidad({});
    setPropuestaId(null);
    setPropuesta(null);
  }

  const generar = useMutation({
    mutationFn: () => generarPlanInicial({ disponibilidad, ramaId: rama?.id as string }),
    onSuccess: (resultado) => {
      setPropuestaId(resultado.propuestaId);
      setPropuesta({ primeraSeccionDias: resultado.propuesta.primeraSeccionDias ?? [], secciones: resultado.propuesta.secciones ?? [] });
    },
  });

  const aceptar = useMutation({
    mutationFn: () => aceptarPropuestaPlan(propuestaId as string),
    onSuccess: () => { hapticSeguro('confirmacion'); reiniciar(); onListo(); },
  });

  return (
    <Modal animationType="fade" onRequestClose={() => { reiniciar(); onCerrar(); }} transparent visible={rama !== null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s2.fondo}>
        <Pressable onPress={() => { reiniciar(); onCerrar(); }} style={StyleSheet.absoluteFill} />
        <MasterGlass style={s2.tarjeta}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {!propuesta && (
              <View style={{ gap: 12 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.reclamarTitulo', { nombre: rama?.nombre ?? '' })}</Texto>
                <Texto style={s2.subtitulo}>{t('planes.detalle.reclamarDescripcion')}</Texto>
                {MOMENTOS_DISPONIBILIDAD.map((momento) => (
                  <FilaMomentoSimple
                    key={momento}
                    momento={momento}
                    onCambiar={(valor) => setDisponibilidad((actual) => {
                      if (valor === undefined) {
                        const copia = { ...actual };
                        delete copia[momento];
                        return copia;
                      }
                      return { ...actual, [momento]: valor };
                    })}
                    valor={disponibilidad[momento]}
                  />
                ))}
                {generar.isError && <ErrorAbyInline error={generar.error} onIrAlPaywall={irAlPaywall} />}
                <MasterButton color={acento} disabled={Object.keys(disponibilidad).length === 0 || generar.isPending} onPress={() => generar.mutate()}>
                  {generar.isPending ? t('planes.crear.generando') : t('planes.crear.generar')}
                </MasterButton>
              </View>
            )}

            {propuesta && (
              <View style={{ gap: 10 }}>
                <Texto style={s2.titulo}>{t('planes.detalle.revisionTitulo')}</Texto>
                {propuesta.secciones.map((seccion, indice) => (
                  <Texto key={seccion.titulo} style={s2.diaPreviewTitulo}>{indice + 1}. {seccion.titulo}</Texto>
                ))}
                {propuesta.primeraSeccionDias.map((dia, indice) => (
                  <View key={indice} style={{ marginBottom: 6 }}>
                    <Texto style={s2.diaPreviewTitulo}>{dia.titulo ?? t('planes.detalle.diaNumero', { numero: indice + 1 })}</Texto>
                    {dia.bloques.flatMap((bloque) => bloque.items).map((item, indiceItem) => (
                      <Texto key={indiceItem} style={s2.itemPreview}>
                        • {item.titulo}{item.tipo !== 'simple' && item.metaValor ? ` (${item.metaValor}${item.unidad ? ` ${item.unidad}` : ''})` : ''}
                      </Texto>
                    ))}
                  </View>
                ))}
                {aceptar.isError && <ErrorAbyInline error={aceptar.error} onIrAlPaywall={irAlPaywall} />}
                <MasterButton color={acento} disabled={aceptar.isPending} onPress={() => aceptar.mutate()}>
                  {aceptar.isPending ? t('tareas.pantalla.creando') : t('planes.crear.confirmar')}
                </MasterButton>
              </View>
            )}
          </ScrollView>
        </MasterGlass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FilaMomentoSimple({ momento, onCambiar, valor }: { momento: MomentoBloque; onCambiar: (valor: ValorDisponibilidad | undefined) => void; valor: ValorDisponibilidad | undefined }) {
  const { acento } = useTonoMaster();
  const { t } = useTranslation();
  const activo = valor !== undefined;
  return (
    <Rebote onPress={() => onCambiar(activo ? undefined : 'moderado')}>
      <MasterGlass style={[s2.opcionGlass, activo && { backgroundColor: conAlfa(acento, 0.12) }]}>
        <View style={s2.opcionFila}>
          <Texto style={[s2.opcionTitulo, { flex: 1 }]}>{t(`planes.detalle.momento.${momento}`)}</Texto>
          {activo && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => onCambiar('poco')}>
                <Texto style={{ color: valor === 'poco' ? acento : '#9A93A8', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('planes.crear.nivel.poco')}</Texto>
              </Pressable>
              <Pressable onPress={() => onCambiar('moderado')}>
                <Texto style={{ color: valor === 'moderado' ? acento : '#9A93A8', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('planes.crear.nivel.moderado')}</Texto>
              </Pressable>
            </View>
          )}
        </View>
      </MasterGlass>
    </Rebote>
  );
}

function ModalDetallarSeccion({ notaInicial, onCerrar, onListo, seccionId }: { notaInicial: string | null; onCerrar: () => void; onListo: () => void; seccionId: string | null }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const router = useRouter();
  const [modo, setModo] = useState<'aby' | 'elegir' | 'manual' | null>(null);
  const [contexto, setContexto] = useState('');
  const [propuestaId, setPropuestaId] = useState<string | null>(null);
  const [propuestaDias, setPropuestaDias] = useState<PropuestaDia[] | null>(null);
  const [itemsManual, setItemsManual] = useState<string[]>(['', '']);

  // Precarga el contexto con la nota que se dejó al completar la sección
  // anterior — solo si el usuario todavía no escribió nada, para no pisar lo
  // que ya haya tipeado.
  useEffect(() => {
    if (seccionId && notaInicial && !contexto) setContexto(notaInicial);
  }, [seccionId, notaInicial]);

  function reiniciar() {
    setModo(null);
    setContexto('');
    setPropuestaId(null);
    setPropuestaDias(null);
    setItemsManual(['', '']);
  }

  function irAlPaywall() {
    reiniciar();
    onCerrar();
    router.push({ params: { volver: '/(principal)/tareas' }, pathname: '/horizon' });
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
    mutationFn: () => guardarDetalleSeccionManual(seccionId as string, [{ bloques: [{ items: itemsManual.filter((item) => item.trim()).map((titulo) => ({ tipo: 'simple' as const, titulo })), mensajeContexto: '', momento: 'manana' }] }]),
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
                {notaInicial && <Texto style={s2.notaAyuda}>{t('planes.detalle.contextoPrecargado')}</Texto>}
                <TextInput multiline onChangeText={setContexto} placeholder={t('planes.detalle.contextoPlaceholder')} placeholderTextColor="#9A93A8" style={s2.input} value={contexto} />
                {generar.isError && <ErrorAbyInline error={generar.error} onIrAlPaywall={irAlPaywall} />}
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
                      <Texto key={indiceItem} style={s2.itemPreview}>
                        • {item.titulo}{item.tipo !== 'simple' && item.metaValor ? ` (${item.metaValor}${item.unidad ? ` ${item.unidad}` : ''})` : ''}
                      </Texto>
                    ))}
                  </View>
                ))}
                {aceptar.isError && <ErrorAbyInline error={aceptar.error} onIrAlPaywall={irAlPaywall} />}
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

// Aparece justo al completar una sección (sea armada con Aby o a mano) — la
// nota, si se deja una, se adjunta al ítem que completó la sección y
// precarga el contexto al detallar la siguiente (ver ModalDetallarSeccion).
// Totalmente opcional: "Omitir" marca el ítem sin nota.
function ModalNotaSeccion({ bloqueItemId, instanciaId, onListo }: { bloqueItemId: string | null; instanciaId: string; onListo: () => void }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const [nota, setNota] = useState('');

  function cerrar() {
    setNota('');
    onListo();
  }

  const guardar = useMutation({
    mutationFn: () => marcarItemPlan(instanciaId, bloqueItemId as string, true, undefined, nota.trim() || undefined),
    onSuccess: cerrar,
  });

  return (
    <Modal animationType="fade" onRequestClose={cerrar} transparent visible={bloqueItemId !== null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s2.fondo}>
        <Pressable onPress={cerrar} style={StyleSheet.absoluteFill} />
        <MasterGlass style={s2.tarjeta}>
          <View style={{ gap: 10 }}>
            <Texto style={s2.titulo}>{t('planes.detalle.notaTitulo')}</Texto>
            <Texto style={s2.subtitulo}>{t('planes.detalle.notaDescripcion')}</Texto>
            <TextInput multiline onChangeText={setNota} placeholder={t('planes.detalle.notaPlaceholder')} placeholderTextColor="#9A93A8" style={s2.input} value={nota} />
            <MasterButton color={acento} disabled={guardar.isPending} onPress={() => guardar.mutate()}>
              {guardar.isPending ? t('tareas.pantalla.creando') : (nota.trim() ? t('planes.detalle.notaGuardar') : t('planes.detalle.notaOmitir'))}
            </MasterButton>
          </View>
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
  notaAyuda: { color: '#9A93A8', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: -4 },
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
