import { useRouter } from 'expo-router';
import { Bell, BookOpen, Calendar, Check, ChevronLeft, Clock3, Flame, Moon, Plus, Sparkles, Sun, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton, RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { useSaldoGemas } from '../../tienda/useSaldoGemas';

const C = { texto: '#1A1335', tenue: '#7B7494', rojo: '#EF4444', morado: '#7C3AED', barra: '#F3DEDD', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

type Momento = 'manana' | 'estudio' | 'noche';
type RutinaMock = { id: string; titulo: string; pasos: number; minutos: number; racha: number; completada: boolean; momento: Momento; Icono: typeof Sun; color: string };

const MOMENTOS: { id: Momento; etiqueta: string; Icono: typeof Sun }[] = [
  { id: 'manana', etiqueta: 'Mañana', Icono: Sun },
  { id: 'estudio', etiqueta: 'Estudio', Icono: BookOpen },
  { id: 'noche', etiqueta: 'Noche', Icono: Moon },
];

const ACCESOS = [
  { id: 'programacion', etiqueta: 'Programación', descripcion: 'Cuándo realizarlas', Icono: Calendar },
  { id: 'creacion', etiqueta: 'Creación', descripcion: 'Arma una nueva', Icono: Sparkles },
  { id: 'recordatorios', etiqueta: 'Recordatorios', descripcion: 'Que no se te olvide', Icono: Bell },
  { id: 'insights', etiqueta: 'Insights', descripcion: 'Tu consistencia', Icono: TrendingUp },
] as const;

const RUTINAS_INICIALES: RutinaMock[] = [
  { id: 'manana', titulo: 'Rutina de la mañana', pasos: 5, minutos: 35, racha: 12, completada: true, momento: 'manana', Icono: Sun, color: '#F97316' },
  { id: 'estudio', titulo: 'Rutina de estudio', pasos: 4, minutos: 50, racha: 8, completada: true, momento: 'estudio', Icono: BookOpen, color: '#EC4899' },
  { id: 'noche', titulo: 'Rutina nocturna', pasos: 4, minutos: 25, racha: 4, completada: false, momento: 'noche', Icono: Moon, color: '#8B5CF6' },
];

// Mismo layout superior que HabitosPantalla/HoyPantalla: aurora, header con
// volver+saludo+gemas, hero con racha + progreso del día + ilustración.
// Datos de "hoy" son de muestra: el backend de rutinas todavía no existe
// (generaliza el core de hábitos cuando se construya).
export function RutinasPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: saldoGemas } = useSaldoGemas();
  const [rutinas, setRutinas] = useState(RUTINAS_INICIALES);
  const [filtro, setFiltro] = useState<Momento | 'todas'>('todas');

  const completadas = rutinas.filter((rutina) => rutina.completada).length;
  const porcentaje = rutinas.length ? Math.round(completadas * 100 / rutinas.length) : 0;
  const visibles = filtro === 'todas' ? rutinas : rutinas.filter((rutina) => rutina.momento === filtro);
  const siguiente = rutinas.find((rutina) => !rutina.completada);

  function alternar(id: string) {
    hapticSeguro('accion');
    setRutinas((actual) => actual.map((rutina) => (rutina.id === id ? { ...rutina, completada: !rutina.completada } : rutina)));
  }

  function alternarFiltro(momento: Momento) {
    hapticSeguro('seleccion');
    setFiltro((actual) => (actual === momento ? 'todas' : momento));
  }

  function nuevaRutina() {
    hapticSeguro('seleccion');
    Alert.alert('Muy pronto', 'Crear rutinas propias llega junto con su sendero de niveles.');
  }

  function abrirAcceso(id: (typeof ACCESOS)[number]['id']) {
    hapticSeguro('seleccion');
    if (id === 'programacion') {
      const etiquetas: Record<Momento, string> = { manana: 'Mañana', estudio: 'Estudio', noche: 'Noche' };
      const horario = rutinas.map((rutina) => `${rutina.titulo} — ${etiquetas[rutina.momento]} · ${rutina.minutos} min`).join('\n');
      Alert.alert('Programación', horario);
      return;
    }
    if (id === 'creacion') {
      nuevaRutina();
      return;
    }
    if (id === 'recordatorios') {
      Alert.alert('Muy pronto', 'Vas a poder elegir a qué hora te avisamos de cada rutina.');
      return;
    }
    Alert.alert('Muy pronto', 'Insights va a juntar tu progreso, tus rachas y tus logros en un solo lugar.');
  }

  return (
    <View style={s.raiz}>
      <ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={[s.superiorInicio, { paddingTop: insets.top + 32 }]}>
          <AuroraBoreal tema="rojo" />
          <View style={s.headerInicio}>
            <View style={s.headerTitulo}>
              <RecuadroGlass style={s.volverGlass}><Pressable accessibilityLabel="Volver a Inicio" hitSlop={12} onPress={() => router.replace('/hoy')} style={s.chevronInicio}><ChevronLeft color={C.texto} size={25} strokeWidth={2.7} /></Pressable></RecuadroGlass>
              <View style={s.headerIzq}>
                <View style={s.nombreFila}><Image source={require('../../../../assets/icons/hoy/rutinas.png')} style={s.saludoIcono} /><Texto style={s.headerNombre}>Rutinas</Texto></View>
                <Texto style={s.headerFrase}>Hazlo en orden. Hazlo sencillo.</Texto>
              </View>
            </View>
            <View style={s.headerDer}>
              <RecuadroGlass style={s.statPill}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={s.gemaIcono} /><Texto style={s.statTexto}>{saldoGemas ?? 0}</Texto></RecuadroGlass>
              <RecuadroGlass style={s.notificacion}><Image source={require('../../../../assets/icons/hoy/notificaciones.png')} style={s.notificacionIcono} /></RecuadroGlass>
            </View>
          </View>

          <View style={s.heroInicio}>
            <View style={s.heroColIzq}>
              <RecuadroGlass style={s.diaCard}>
                <Texto style={s.diaLabel}>Tu día</Texto>
                <View style={s.bloquesFila}>
                  {MOMENTOS.map((momento) => {
                    const rutinasMomento = rutinas.filter((rutina) => rutina.momento === momento.id);
                    const listo = rutinasMomento.length > 0 && rutinasMomento.every((rutina) => rutina.completada);
                    const activo = filtro === momento.id;
                    const colorIcono = listo ? '#FFFFFF' : activo ? C.rojo : '#B7B0C9';
                    return (
                      <Pressable key={momento.id} onPress={() => alternarFiltro(momento.id)} style={s.bloque}>
                        <View style={[s.bloqueIcono, listo && s.bloqueIconoListo, activo && s.bloqueIconoActivo]}>
                          <momento.Icono color={colorIcono} size={16} />
                        </View>
                        <Texto style={[s.bloqueTexto, activo && { color: C.rojo }]}>{momento.etiqueta}</Texto>
                      </Pressable>
                    );
                  })}
                </View>
              </RecuadroGlass>
              <RecuadroGlass style={s.nivelCard}>
                <Image source={require('../../../../assets/icons/hoy/insignia.png')} style={s.insignia} />
                <View style={s.nivelInfo}><View style={s.nivelTexto}><Texto style={s.nivelLabel}>Rutinas hoy</Texto><Texto style={s.nivelXP}>{completadas}/{rutinas.length}</Texto></View><Progreso porcentaje={porcentaje} color={C.rojo} /></View>
              </RecuadroGlass>
            </View>
            <View style={s.heroColDer}>
              <View style={s.ilustracionContenedor}><Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png')} style={s.ilustracion} /></View>
            </View>
          </View>

          <View style={s.accesosFila}>
            {ACCESOS.map((acceso) => (
              <Pressable key={acceso.id} onPress={() => abrirAcceso(acceso.id)} style={s.accesoTarjeta}>
                <RecuadroGlass style={s.accesoGlass}>
                  <View style={s.accesoIcono}><acceso.Icono color={C.rojo} size={16} strokeWidth={2.2} /></View>
                  <Texto numberOfLines={1} style={s.accesoEtiqueta}>{acceso.etiqueta}</Texto>
                  <Texto numberOfLines={2} style={s.accesoDescripcion}>{acceso.descripcion}</Texto>
                </RecuadroGlass>
              </Pressable>
            ))}
          </View>

        </View>

        <RecuadroGlass style={s.panel}>
          <View style={s.tituloFila}><Texto style={s.tituloPanel}>Hoy</Texto><Texto style={s.contador}>{completadas}/{rutinas.length} completadas</Texto></View>
          {visibles.map((rutina) => (
            <Pressable key={rutina.id} onPress={() => alternar(rutina.id)} style={s.fila}>
              <View style={[s.checkCirculo, rutina.completada && { backgroundColor: C.rojo, borderColor: C.rojo }]}>{rutina.completada && <Check color="#FFFFFF" size={14} strokeWidth={3} />}</View>
              <View style={[s.icono, { backgroundColor: `${rutina.color}18` }]}><rutina.Icono color={rutina.color} size={20} /></View>
              <View style={{ flex: 1 }}><Texto style={s.filaTitulo}>{rutina.titulo}</Texto><Texto style={s.filaMeta}>{rutina.pasos} pasos · {rutina.minutos} min</Texto></View>
              <View style={s.rachaPill}><Flame color="#F97316" size={13} fill="#F97316" /><Texto style={s.rachaPillTexto}>{rutina.racha}</Texto></View>
            </Pressable>
          ))}
          <Boton color={C.rojo} iconoIzquierda={Plus} onPress={nuevaRutina} style={s.nuevo} variante="sendero">Nueva rutina</Boton>
        </RecuadroGlass>

        {siguiente && (
          <RecuadroGlass style={s.nudge}>
            <View style={[s.icono, { backgroundColor: `${siguiente.color}18` }]}><siguiente.Icono color={siguiente.color} size={22} /></View>
            <View style={{ flex: 1 }}><Texto style={s.nudgeLabel}>Siguiente rutina</Texto><Texto style={s.nudgeTitulo}>{siguiente.titulo}</Texto></View>
          </RecuadroGlass>
        )}
      </ScrollView>
    </View>
  );
}

function Progreso({ porcentaje, color }: { porcentaje: number; color: string }) { return <View style={s.barraFondo}><View style={[s.barra, { width: `${porcentaje}%`, backgroundColor: color }]} /></View>; }

const s = StyleSheet.create({
  raiz: { backgroundColor: '#EAEAEA', flex: 1 },
  contenido: { gap: 16, paddingBottom: 0 },
  superiorInicio: { gap: 0 },
  volverGlass: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, marginRight: 5 },
  chevronInicio: { alignItems: 'center', height: 34, justifyContent: 'center', width: 34 },
  headerInicio: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 20 },
  headerTitulo: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  headerIzq: { flex: 1 },
  nombreFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  headerNombre: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 22, lineHeight: 26 },
  saludoIcono: { height: 28, resizeMode: 'contain', width: 28 },
  headerFrase: { color: '#5A5A5A', fontFamily: 'MontserratAlternates-Medium', fontSize: 8, lineHeight: 12, marginTop: 4 },
  headerDer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: -16 },
  statPill: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  gemaIcono: { height: 22, resizeMode: 'contain', width: 22 },
  statTexto: { color: '#6D28D9', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  notificacion: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 22, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10 },
  notificacionIcono: { height: 30, resizeMode: 'contain', width: 30 },
  heroInicio: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 20 },
  heroColIzq: { gap: 12, width: '45%' },
  heroColDer: { position: 'absolute', right: 20, top: 0, width: '50%', zIndex: -1 },
  ilustracionContenedor: { alignItems: 'center', aspectRatio: 1, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 20, justifyContent: 'center', overflow: 'hidden', transform: [{ translateX: 15 }], width: '135%' },
  ilustracion: { height: '78%', width: '78%' },
  diaCard: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 20, borderWidth: 1, padding: 10 },
  diaLabel: { color: C.tenue, fontFamily: 'MontserratAlternates-Medium', fontSize: 10, marginBottom: 8 },
  bloquesFila: { flexDirection: 'row', justifyContent: 'space-between' },
  bloque: { alignItems: 'center', gap: 5 },
  bloqueIcono: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D8D3CD', borderRadius: 16, borderWidth: 1.5, height: 32, justifyContent: 'center', width: 32 },
  bloqueIconoListo: { backgroundColor: C.rojo, borderColor: C.rojo },
  bloqueIconoActivo: { borderColor: C.rojo, borderWidth: 2 },
  bloqueTexto: { color: C.tenue, fontFamily: 'MontserratAlternates-Medium', fontSize: 9 },
  nivelCard: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 16, borderWidth: 1, flexDirection: 'row', padding: 10 },
  insignia: { height: 28, marginRight: 10, resizeMode: 'contain', width: 28 },
  nivelInfo: { flex: 1 },
  nivelTexto: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nivelLabel: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 11 },
  nivelXP: { color: C.tenue, fontFamily: 'MontserratAlternates-Medium', fontSize: 9 },
  barraFondo: { backgroundColor: C.barra, borderRadius: 9, height: 6, marginTop: 7, overflow: 'hidden' },
  barra: { borderRadius: 9, height: '100%' },
  accesosFila: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 20 },
  accesoTarjeta: { flex: 1 },
  accesoGlass: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 90, padding: 8 },
  accesoIcono: { alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 9, height: 28, justifyContent: 'center', marginBottom: 7, width: 28 },
  accesoEtiqueta: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  accesoDescripcion: { color: C.tenue, fontSize: 8, lineHeight: 10, marginTop: 1, textAlign: 'center' },
  panel: { backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 22, borderWidth: 1, marginHorizontal: 20, marginTop: 16, padding: 15 },
  tituloFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tituloPanel: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 22 },
  contador: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  fila: { alignItems: 'center', borderBottomColor: 'rgba(239,68,68,.1)', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, paddingVertical: 11 },
  checkCirculo: { alignItems: 'center', borderColor: '#D8D3CD', borderRadius: 13, borderWidth: 2, height: 26, justifyContent: 'center', width: 26 },
  icono: { alignItems: 'center', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  filaTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  filaMeta: { color: C.tenue, fontSize: 11, marginTop: 1 },
  rachaPill: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  rachaPillTexto: { color: '#F97316', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  nuevo: { marginTop: 6 },
  nudge: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16, padding: 14 },
  nudgeLabel: { color: C.tenue, fontSize: 10 },
  nudgeTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15, marginTop: 1 },
});
