import { useEffect, useReducer, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entorno } from '../../../nucleo/configuracion/entorno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { MensajeAby, PreguntaIdAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { obtenerSiguienteRespuestaMock } from '../datos/propuestaAby.mock';
import { type CategoriaAbyId } from '../datos/categoriasAby';
import { categoriaVisualIntencionEstudioAby, colorIntencionEstudioAby, intencionesEstudioAby, subtituloIntencionEstudioAby, type IntencionEstudioAbyId } from '../datos/intencionesEstudioAby';
import { reducirConversacionAby, estadoInicialConversacionAby } from '../estado/abyConversacion.reducer';
import { usarEstadoVisualAby } from '../estado/abyVisual.estado';
import { generarRespuestaAbyRemota, solicitudAby } from '../servicios/aby.servicio';
import { EntradaAby } from '../componentes/EntradaAby';
import { DescubrimientoAby } from '../componentes/DescubrimientoAby';
import { FondoBiomaAby } from '../componentes/FondoBiomaAby';
import { MensajeAby as BurbujaMensaje } from '../componentes/MensajeAby';
import { PreguntaVisualAby } from '../componentes/PreguntaVisualAby';
import { PropuestaSenderoAby } from '../componentes/PropuestaSenderoAby';
import { ResumenSenderoAby } from '../componentes/ResumenSenderoAby';
import { TituloCrearAby } from '../componentes/TituloCrearAby';
import { IntencionesEstudioAby } from '../componentes/IntencionesEstudioAby';
import { Texto } from '../../../diseno';

export function AgenteAbyPantalla() {
  const [estado, dispatch] = useReducer(reducirConversacionAby, estadoInicialConversacionAby);
  const [mensajes, setMensajes] = useState<MensajeAby[]>([]);
  const [creado, setCreado] = useState(false);
  const [categoriaAby, setCategoriaAby] = useState<CategoriaAbyId | null>(null);
  const [intencionActiva, setIntencionActiva] = useState<IntencionEstudioAbyId | null>(null);
  const [modoDescubrimiento, setModoDescubrimiento] = useState<'categorias' | 'saliendo' | 'descubrir'>('categorias');
  const definirCategoriaVisual = usarEstadoVisualAby((estadoVisual) => estadoVisual.definirCategoria);
  const [respuestaRemota, setRespuestaRemota] = useState<RespuestaAgenteAby | null>(null);
  const lista = useRef<FlatList<MensajeAby>>(null);
  const ultimoIntentoRemoto = useRef<string | null>(null);
  const respuestaMock = obtenerSiguienteRespuestaMock(estado.configuracion);
  const respuesta = respuestaRemota ?? respuestaMock;
  const acentoIntencion = intencionActiva ? colorIntencionEstudioAby(intencionActiva) : '#141414';
  const placeholderIntencion = intencionesEstudioAby.find((item) => item.id === intencionActiva)?.placeholder ?? 'Cuéntale a Lestinaty qué necesitas estudiar...';

  useEffect(() => { lista.current?.scrollToEnd({ animated: true }); }, [mensajes.length, respuesta.tipo]);

  useEffect(() => {
    const clave = JSON.stringify({ configuracion: estado.configuracion, mensajes: mensajes.map((mensaje) => mensaje.id) });
    const listoParaGenerar = estado.configuracion.intencion === 'examen' && Boolean(estado.configuracion.objetivo && estado.configuracion.fechaExamen && estado.configuracion.alcance && estado.configuracion.disponibilidadSemanal && estado.configuracion.nivelInicial);
    if (!entorno.abyRemotoHabilitado || !listoParaGenerar || ultimoIntentoRemoto.current === clave) return;
    ultimoIntentoRemoto.current = clave;
    generarRespuestaAbyRemota(solicitudAby(estado.configuracion, mensajes)).then(setRespuestaRemota).catch(() => setRespuestaRemota(null));
  }, [estado.configuracion, mensajes]);

  function agregarObjetivo(objetivo: string) {
    if (!objetivo.trim()) return;
    setRespuestaRemota(null);
    const pregunta = respuesta.pregunta;
    if (!pregunta || pregunta.tipo !== 'texto') dispatch({ objetivo, tipo: 'definir-objetivo' });
    if (pregunta?.id === 'fecha-examen') {
      const coincidencia = objetivo.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!coincidencia) return;
      const [, dia, mes, ano] = coincidencia;
      dispatch({ fechaExamen: `${ano}-${mes}-${dia}`, tipo: 'definir-fecha-examen' });
    }
    if (pregunta?.id === 'alcance') dispatch({ alcance: objetivo, tipo: 'definir-alcance' });
    if (pregunta?.id === 'fuente') dispatch({ fuente: objetivo, tipo: 'definir-fuente' });
    setMensajes((actuales) => [...actuales, { autor: 'usuario', id: `objetivo-${Date.now()}`, texto: objetivo }]);
  }

  function responderPregunta(valor: string | string[]) {
    if (!respuesta.pregunta) return;
    if (respuesta.pregunta.id === 'disponibilidad-semanal' && typeof valor === 'string') dispatch({ disponibilidadSemanal: valor as '2' | '4' | '6' | '8', tipo: 'definir-disponibilidad' });
    if (respuesta.pregunta.id === 'nivel-inicial' && typeof valor === 'string') dispatch({ nivelInicial: valor as 'inicio' | 'basico' | 'intermedio', tipo: 'definir-nivel' });
    const texto = Array.isArray(valor) ? valor.map((dia) => ['L', 'M', 'X', 'J', 'V', 'S', 'D'][Number(dia) - 1]).join(' - ') : respuesta.pregunta.opciones.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
    setMensajes((actuales) => [...actuales, { autor: 'usuario', id: `respuesta-${Date.now()}`, texto }]);
  }

  function editar(id: PreguntaIdAby) {
    setCreado(false);
    setRespuestaRemota(null);
    dispatch({ preguntaId: id, tipo: 'editar' });
  }

  const seleccionActual = respuesta.pregunta?.id === 'disponibilidad-semanal' ? estado.configuracion.disponibilidadSemanal : respuesta.pregunta?.id === 'nivel-inicial' ? estado.configuracion.nivelInicial : null;
  const sinConversacion = !estado.configuracion.objetivo;

  return <SafeAreaView edges={['left', 'right', 'top']} style={styles.raiz}><FondoBiomaAby auroraNeutra={modoDescubrimiento === 'descubrir'} categoriaActiva={categoriaAby} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.teclado}>{sinConversacion ? modoDescubrimiento === 'descubrir' ? <View style={styles.cuestionarioCentro}><DescubrimientoAby onCompletar={agregarObjetivo} onVolver={() => setModoDescubrimiento('categorias')} /></View> : <View style={styles.promptCentro}><TituloCrearAby acento={intencionActiva ? acentoIntencion : undefined} subtitulo={subtituloIntencionEstudioAby(intencionActiva)} /><View style={styles.creacion}><EntradaAby colorEnviar={acentoIntencion} onEnviar={agregarObjetivo} placeholder={placeholderIntencion} variante="centro" /><IntencionesEstudioAby intencionActiva={intencionActiva} onSeleccionar={(intencion) => { const categoriaVisual = categoriaVisualIntencionEstudioAby(intencion); dispatch({ tipo: 'definir-intencion', valor: intencion }); setIntencionActiva(intencion); setCategoriaAby(categoriaVisual); definirCategoriaVisual(categoriaVisual); }} /><Pressable accessibilityRole="button" onPress={() => { setIntencionActiva(null); setCategoriaAby(null); definirCategoriaVisual(null); setModoDescubrimiento('descubrir'); }} style={styles.sinIdea}><Texto style={styles.sinIdeaTexto}>NO SÉ POR DÓNDE EMPEZAR</Texto></Pressable></View></View> : <View style={styles.turnoCentro}><BurbujaMensaje mensaje={{ autor: 'aby', id: `turno-${respuesta.tipo}`, texto: respuesta.mensaje }} />{respuesta.pregunta ? <PreguntaVisualAby acento={acentoIntencion} categoria={categoriaAby} onSeleccionar={responderPregunta} pregunta={respuesta.pregunta} seleccionado={seleccionActual} /> : null}{respuesta.tipo === 'propuesta' && respuesta.propuesta ? <PropuestaSenderoAby onAjustar={() => editar('fecha-examen')} onCrear={() => { setCreado(true); hapticSeguro('confirmacion'); }} propuesta={respuesta.propuesta} /> : null}<EntradaAby colorEnviar={acentoIntencion} onEnviar={agregarObjetivo} placeholder={respuesta.pregunta?.placeholder ?? 'Ajusta lo que necesitas...'} variante="centro" /></View>}</KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ creacion: { gap: 11 }, cuestionarioCentro: { flex: 1, justifyContent: 'center' }, promptCentro: { flex: 1, gap: 20, justifyContent: 'center' }, raiz: { backgroundColor: '#F9F7F8', flex: 1 }, sinIdea: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 5 }, sinIdeaTexto: { color: '#5C697A', fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.8, textDecorationLine: 'underline' }, teclado: { flex: 1 }, turnoCentro: { alignSelf: 'center', flex: 1, gap: 16, justifyContent: 'center', paddingHorizontal: 24, width: '100%' } });
