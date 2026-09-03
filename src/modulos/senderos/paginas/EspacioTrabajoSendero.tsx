import { ArrowLeft, Check, CheckCircle2, ChevronDown, Circle, ClipboardCheck, Clock3, Play, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RecuadroGlass, Texto, colores } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerPlanTrabajoSendero, type HerramientaNodo, type TareaNodo } from '../dominio/planTrabajoSendero';

type SenderoAbierto = { descripcion: string; id: string; titulo: string };

function IconoHerramienta({ herramienta, color }: { herramienta: HerramientaNodo; color: string }) {
  if (herramienta === 'cronometro') return <Clock3 color={color} size={17} strokeWidth={2.6} />;
  if (herramienta === 'registro') return <ClipboardCheck color={color} size={17} strokeWidth={2.6} />;
  return <CheckCircle2 color={color} size={17} strokeWidth={2.6} />;
}

function etiquetaHerramienta(herramienta: HerramientaNodo) {
  if (herramienta === 'cronometro') return 'TIEMPO GUIADO';
  if (herramienta === 'registro') return 'REGISTRO BREVE';
  return 'PASO ASISTIDO';
}

export function EspacioTrabajoSendero({ sendero, color, onCerrar }: { sendero: SenderoAbierto; color: string; onCerrar: () => void }) {
  const plan = useMemo(() => obtenerPlanTrabajoSendero(sendero.id), [sendero.id]);
  const [indiceNodo, setIndiceNodo] = useState(0);
  const [tareasHechas, setTareasHechas] = useState<string[]>([]);
  const [tareaAbierta, setTareaAbierta] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const nodo = plan.nodos[indiceNodo];
  const tareas = nodo.tareas.filter(Boolean) as TareaNodo[];
  const completado = tareas.every((tarea) => tareasHechas.includes(tarea.id));
  const esUltimoNodo = indiceNodo === plan.nodos.length - 1;
  const etiquetaTipo = plan.tipo === 'ciclico'
    ? `CICLO ${plan.ciclo?.diaActual ?? 1}/${plan.ciclo?.totalDias ?? 1}`
    : `HITO ${indiceNodo + 1}/${plan.nodos.length}`;

  function alternarTarea(tarea: TareaNodo) {
    hapticSeguro('seleccion');
    setTareasHechas((actual) => actual.includes(tarea.id) ? actual.filter((id) => id !== tarea.id) : [...actual, tarea.id]);
    setTareaAbierta(tarea.id);
  }

  function completarNodo() {
    if (!completado) return;
    hapticSeguro('accion');
    if (esUltimoNodo) {
      setFinalizado(true);
      return;
    }
    setIndiceNodo((actual) => actual + 1);
    setTareasHechas([]);
    setTareaAbierta(null);
  }

  return (
    <RecuadroGlass blur intensity={68} style={s.root}>
      <View style={s.head}>
        <Pressable accessibilityLabel="Cerrar espacio de trabajo" onPress={onCerrar} style={s.back}><ArrowLeft color={colores.texto} size={18} /></Pressable>
        <View style={s.headText}><Texto style={s.eyebrow}>ESPACIO DE ACCION</Texto><Texto numberOfLines={1} style={s.title}>{sendero.titulo}</Texto></View>
        <View style={[s.tipo, { backgroundColor: `${color}18` }]}><Texto style={[s.tipoTexto, { color }]}>{etiquetaTipo}</Texto></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nodosRail}>
        {plan.nodos.map((item, indice) => {
          const activo = indice === indiceNodo;
          const hecho = indice < indiceNodo;
          return <View key={item.id} style={s.nodoRail}><View style={[s.nodoPunto, { backgroundColor: activo || hecho ? color : 'rgba(111,104,96,0.18)' }]}>{hecho ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : <Circle color={activo ? '#FFFFFF' : '#9D9993'} fill={activo ? '#FFFFFF' : 'transparent'} size={10} />}</View><Texto numberOfLines={1} style={[s.nodoRailTexto, activo && { color }]}>{item.titulo}</Texto></View>;
        })}
      </ScrollView>

      <View style={[s.contexto, { borderColor: `${color}26` }]}>
        <View style={[s.contextoMarca, { backgroundColor: color }]} />
        <Texto style={s.eyebrow}>{etiquetaTipo}</Texto>
        <Texto style={s.nodoTitulo}>{nodo.titulo}</Texto>
        <Texto style={s.descripcion}>{nodo.descripcion}</Texto>
      </View>

      <View style={s.listaCabecera}><Texto style={s.listaTitulo}>Tu avance ahora</Texto><Texto style={[s.contador, { color }]}>{tareasHechas.length}/{tareas.length}</Texto></View>
      <View style={s.listaTareas}>
        {tareas.map((tarea, indice) => {
          const hecha = tareasHechas.includes(tarea.id);
          const abierta = tareaAbierta === tarea.id;
          return (
            <View key={tarea.id} style={[s.tarea, hecha && { borderColor: `${color}55` }]}>
              <Pressable onPress={() => alternarTarea(tarea)} style={s.tareaPrincipal}>
                <View style={[s.tareaIcono, { backgroundColor: hecha ? color : `${color}16` }]}>{hecha ? <Check color="#FFFFFF" size={17} strokeWidth={3} /> : <IconoHerramienta color={color} herramienta={tarea.herramienta} />}</View>
                <View style={s.tareaTexto}><Texto style={[s.tareaEtiqueta, { color }]}>{etiquetaHerramienta(tarea.herramienta)}</Texto><Texto style={[s.tareaTitulo, hecha && s.tareaTituloHecha]}>{tarea.titulo}</Texto></View>
                <ChevronDown color={colores.textoSecundario} size={17} style={{ transform: [{ rotate: abierta ? '180deg' : '0deg' }] }} />
              </Pressable>
              {abierta ? <View style={s.ayuda}><Texto style={s.ayudaTitulo}>CÓMO AVANZAR</Texto><Texto style={s.ayudaTexto}>{tarea.ayuda}</Texto><View style={[s.evidencia, { backgroundColor: `${color}10` }]}><Sparkles color={color} size={13} /><Texto style={s.evidenciaTexto}>{tarea.evidencia}</Texto></View></View> : null}
              {indice < tareas.length - 1 ? <View style={s.divisor} /> : null}
            </View>
          );
        })}
      </View>

      <Pressable disabled={!completado || finalizado} onPress={completarNodo} style={[s.boton, { backgroundColor: completado ? color : '#C8C3BC' }]}>
        {completado ? <Play color="#FFFFFF" fill="#FFFFFF" size={16} /> : <CheckCircle2 color="#FFFFFF" size={16} />}
        <Texto style={s.botonTexto}>{finalizado ? plan.tipo === 'ciclico' ? 'Ciclo completado' : 'Hito completado' : esUltimoNodo ? plan.tipo === 'ciclico' ? 'Cerrar ciclo' : 'Cerrar hito' : completado ? 'Continuar al siguiente nodo' : 'Completa los pasos para continuar'}</Texto>
      </Pressable>
    </RecuadroGlass>
  );
}

const s = StyleSheet.create({
  root: { borderRadius: 26, gap: 14, padding: 16 }, head: { alignItems: 'center', flexDirection: 'row', gap: 10 }, back: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.7)', borderRadius: 14, height: 36, justifyContent: 'center', width: 36 }, headText: { flex: 1, minWidth: 0 }, eyebrow: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 8, letterSpacing: .75 }, title: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 18 }, tipo: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 }, tipoTexto: { fontFamily: 'MontserratAlternates-Bold', fontSize: 7, letterSpacing: .45 }, nodosRail: { gap: 16, paddingHorizontal: 4 }, nodoRail: { alignItems: 'center', flexDirection: 'row', gap: 6 }, nodoPunto: { alignItems: 'center', borderRadius: 14, height: 22, justifyContent: 'center', width: 22 }, nodoRailTexto: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 9, maxWidth: 108 }, contexto: { backgroundColor: 'rgba(255,255,255,.42)', borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 15 }, contextoMarca: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 4 }, nodoTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 19, marginTop: 3 }, descripcion: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 11, lineHeight: 16, marginTop: 5 }, listaCabecera: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }, listaTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }, contador: { fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, listaTareas: { borderColor: 'rgba(100,86,68,.12)', borderRadius: 18, borderWidth: 1, overflow: 'hidden' }, tarea: { backgroundColor: 'rgba(255,255,255,.3)', borderColor: 'transparent', borderWidth: 1 }, tareaPrincipal: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 66, paddingHorizontal: 12 }, tareaIcono: { alignItems: 'center', borderRadius: 13, height: 33, justifyContent: 'center', width: 33 }, tareaTexto: { flex: 1 }, tareaEtiqueta: { fontFamily: 'MontserratAlternates-Bold', fontSize: 7, letterSpacing: .55 }, tareaTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, marginTop: 2 }, tareaTituloHecha: { color: colores.textoSecundario, textDecorationLine: 'line-through' }, divisor: { backgroundColor: 'rgba(100,86,68,.11)', height: 1, marginHorizontal: 12 }, ayuda: { backgroundColor: 'rgba(255,255,255,.3)', borderTopColor: 'rgba(100,86,68,.1)', borderTopWidth: 1, padding: 12 }, ayudaTitulo: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 7, letterSpacing: .6 }, ayudaTexto: { color: colores.texto, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 10, lineHeight: 15, marginTop: 4 }, evidencia: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', gap: 6, marginTop: 9, padding: 8 }, evidenciaTexto: { color: colores.textoSecundario, flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 9 }, boton: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50, paddingHorizontal: 12 }, botonTexto: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 11, textAlign: 'center' },
});
