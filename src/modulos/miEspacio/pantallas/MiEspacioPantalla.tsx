import { SquaresFour } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecuadroGlass, Texto } from '../../../diseno';

const DOMINIOS = [
  { etiqueta: 'Mente', color: '#8B5CF6' },
  { etiqueta: 'Cuerpo', color: '#EF4444' },
  { etiqueta: 'Salud', color: '#22C55E' },
];

// Cuarto lente sobre la app: agrupa hábitos, rutinas y tareas por dominio de
// vida (Mente/Cuerpo/Salud...) en vez de por mecánica. Todavía sin contenido
// real — solo el punto de entrada, para no perder el hilo de la idea.
export function MiEspacioPantalla() {
  return (
    <SafeAreaView edges={['top']} style={s.raiz}>
      <View style={s.contenido}>
        <View style={s.iconoContenedor}><SquaresFour color="#7C3AED" size={40} weight="bold" /></View>
        <Texto style={s.titulo}>Mi espacio</Texto>
        <Texto style={s.texto}>Aquí vas a poder ver tus hábitos, rutinas y tareas agrupados por lo que de verdad te importa — no por cómo los organizamos por dentro.</Texto>
        <View style={s.dominiosFila}>
          {DOMINIOS.map((dominio) => (
            <RecuadroGlass key={dominio.etiqueta} style={[s.dominioPill, { borderColor: `${dominio.color}40` }]}>
              <View style={[s.dominioPunto, { backgroundColor: dominio.color }]} />
              <Texto style={s.dominioTexto}>{dominio.etiqueta}</Texto>
            </RecuadroGlass>
          ))}
        </View>
        <Texto style={s.proximamente}>Próximamente</Texto>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { backgroundColor: '#F3EEFA', flex: 1 },
  contenido: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  iconoContenedor: { alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 24, height: 76, justifyContent: 'center', marginBottom: 18, width: 76 },
  titulo: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 24, marginBottom: 10 },
  texto: { color: '#7B7494', fontSize: 13, lineHeight: 19, marginBottom: 22, textAlign: 'center' },
  dominiosFila: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dominioPill: { alignItems: 'center', borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  dominioPunto: { borderRadius: 5, height: 10, width: 10 },
  dominioTexto: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  proximamente: { color: '#7C3AED', fontFamily: 'Montserrat-Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
});
