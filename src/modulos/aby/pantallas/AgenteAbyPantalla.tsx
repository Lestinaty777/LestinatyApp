import { useEffect, useReducer, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entorno } from '../../../nucleo/configuracion/entorno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { MensajeAby, PreguntaIdAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { obtenerSiguienteRespuestaMock } from '../datos/propuestaAby.mock';
import { colorEnvioCategoriaAby, type CategoriaAbyId } from '../datos/categoriasAby';
import { reducirConversacionAby, estadoInicialConversacionAby } from '../estado/abyConversacion.reducer';
import { usarEstadoVisualAby } from '../estado/abyVisual.estado';
import { generarRespuestaAbyRemota, solicitudAby } from '../servicios/aby.servicio';
import { EntradaAby } from '../componentes/EntradaAby';
import { CategoriasRapidasAby } from '../componentes/CategoriasRapidasAby';
import { DescubrimientoAby } from '../componentes/DescubrimientoAby';
import { FondoBiomaAby } from '../componentes/FondoBiomaAby';
import { MensajeAby as BurbujaMensaje } from '../componentes/MensajeAby';
import { PreguntaVisualAby } from '../componentes/PreguntaVisualAby';
import { PropuestaSenderoAby } from '../componentes/PropuestaSenderoAby';
import { ResumenSenderoAby } from '../componentes/ResumenSenderoAby';
import { TituloCrearAby } from '../componentes/TituloCrearAby';

export function AgenteAbyPantalla() {
  const [estado, dispatch] = useReducer(reducirConversacionAby, estadoInicialConversacionAby);
  const [mensajes, setMensajes] = useState<MensajeAby[]>([]);
  const [creado, setCreado] = useState(false);
  const [categoriaAby, setCategoriaAby] = useState<CategoriaAbyId | null>(null);
  const [modoDescubrimiento, setModoDescubrimiento] = useState<'categorias' | 'saliendo' | 'descubrir'>('categorias');
  const definirCategoriaVisual = usarEstadoVisualAby((estadoVisual) => estadoVisual.definirCategoria);
  const [respuestaRemota, setRespuestaRemota] = useState<RespuestaAgenteAby | null>(null);
  const lista = useRef<FlatList<MensajeAby>>(null);
  const ultimoIntentoRemoto = useRef<string | null>(null);
  const respuestaMock = obtenerSiguienteRespuestaMock(estado.configuracion);
  const respuesta = respuestaRemota ?? respuestaMock;

  useEffect(() => { lista.current?.scrollToEnd({ animated: true }); }, [mensajes.length, respuesta.tipo]);

  useEffect(() => {
    const clave = JSON.stringify({ configuracion: estado.configuracion, mensajes: mensajes.map((mensaje) => mensaje.id) });
    if (!entorno.abyRemotoHabilitado || !estado.configuracion.objetivo || ultimoIntentoRemoto.current === clave) return;
    ultimoIntentoRemoto.current = clave;
    generarRespuestaAbyRemota(solicitudAby(estado.configuracion, mensajes)).then(setRespuestaRemota).catch(() => setRespuestaRemota(null));
  }, [estado.configuracion, mensajes]);

  function agregarObjetivo(objetivo: string) {
    if (!objetivo.trim()) return;
    setRespuestaRemota(null);
    dispatch({ objetivo, tipo: 'definir-objetivo' });
    setMensajes((actuales) => [...actuales, { autor: 'usuario', id: `objetivo-${Date.now()}`, texto: objetivo }]);
  }

  function responderPregunta(valor: string | string[]) {
    if (!respuesta.pregunta) return;
    if (respuesta.pregunta.id === 'tipo' && typeof valor === 'string') dispatch({ tipo: 'definir-tipo', valor: valor as 'ciclico' | 'finito' });
    if (respuesta.pregunta.id === 'frecuencia' && Array.isArray(valor)) dispatch({ diasSemana: valor.map(Number), tipo: 'definir-dias' });
    if (respuesta.pregunta.id === 'duracion' && typeof valor === 'string') dispatch({ duracionMinutos: Number(valor), tipo: 'definir-duracion' });
    const texto = Array.isArray(valor) ? valor.map((dia) => ['L', 'M', 'X', 'J', 'V', 'S', 'D'][Number(dia) - 1]).join(' - ') : respuesta.pregunta.opciones.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
    setMensajes((actuales) => [...actuales, { autor: 'usuario', id: `respuesta-${Date.now()}`, texto }]);
  }

  function editar(id: PreguntaIdAby) {
    setCreado(false);
    setRespuestaRemota(null);
    dispatch({ preguntaId: id, tipo: 'editar' });
  }

  const seleccionActual = respuesta.pregunta?.id === 'tipo' ? estado.configuracion.tipo : respuesta.pregunta?.id === 'frecuencia' ? estado.configuracion.diasSemana.map(String) : respuesta.pregunta?.id === 'duracion' ? String(estado.configuracion.duracionMinutos ?? '') : null;
  const sinConversacion = !estado.configuracion.objetivo;

  return <SafeAreaView edges={['left', 'right', 'top']} style={styles.raiz}><FondoBiomaAby auroraNeutra={modoDescubrimiento === 'descubrir'} categoriaActiva={categoriaAby} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.teclado}>{sinConversacion ? modoDescubrimiento === 'descubrir' ? <View style={styles.cuestionarioCentro}><DescubrimientoAby onCompletar={agregarObjetivo} onVolver={() => setModoDescubrimiento('categorias')} /></View> : <View style={styles.promptCentro}><TituloCrearAby acento={categoriaAby ? colorEnvioCategoriaAby(categoriaAby) : undefined} /><View style={styles.creacion}><EntradaAby colorEnviar={colorEnvioCategoriaAby(categoriaAby)} onEnviar={agregarObjetivo} placeholder="Escribe lo que quieres crear..." variante="centro" /><CategoriasRapidasAby categoriaActiva={categoriaAby} ocultar={modoDescubrimiento === 'saliendo'} onOcultas={() => setModoDescubrimiento('descubrir')} onSeleccionar={(categoria) => { setCategoriaAby(categoria); definirCategoriaVisual(categoria); }} onSinIdea={() => { setCategoriaAby(null); definirCategoriaVisual(null); setModoDescubrimiento('saliendo'); }} /></View></View> : <View style={styles.turnoCentro}><BurbujaMensaje mensaje={{ autor: 'aby', id: `turno-${respuesta.tipo}`, texto: respuesta.mensaje }} />{respuesta.pregunta ? <PreguntaVisualAby acento={colorEnvioCategoriaAby(categoriaAby)} categoria={categoriaAby} onSeleccionar={responderPregunta} pregunta={respuesta.pregunta} seleccionado={seleccionActual} /> : null}{respuesta.tipo === 'propuesta' && respuesta.propuesta ? <PropuestaSenderoAby onAjustar={() => editar('tipo')} onCrear={() => { setCreado(true); hapticSeguro('confirmacion'); }} propuesta={respuesta.propuesta} /> : null}<EntradaAby colorEnviar={colorEnvioCategoriaAby(categoriaAby)} onEnviar={agregarObjetivo} placeholder="Ajusta lo que necesitas..." variante="centro" /></View>}</KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ creacion: { gap: 11 }, cuestionarioCentro: { flex: 1, justifyContent: 'center' }, promptCentro: { flex: 1, gap: 20, justifyContent: 'center' }, raiz: { backgroundColor: '#F9F7F8', flex: 1 }, teclado: { flex: 1 }, turnoCentro: { alignSelf: 'center', flex: 1, gap: 16, justifyContent: 'center', paddingHorizontal: 24, width: '100%' } });
