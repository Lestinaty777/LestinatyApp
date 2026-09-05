import os

with open('src/modulos/metas/pantallas/MetasPantalla.tsx', 'w') as f:
    f.write("""import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto, colores } from '../../../diseno';
import { Plus, ChevronRight, Target } from 'lucide-react-native';

// Helper de sombra sólida (Extrusión)
function oscurecer(hexColor: string, factor = 0.7) {
  const hex = hexColor.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Datos de prueba (Copywriting intencional: verbos de acción, no estados muertos)
const METAS = [
  { id: '1', titulo: 'Dominar Japonés N5', accion: 'Plantar 3 semillas esta semana', progreso: 0.6, color: '#FF7E67', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png') },
  { id: '2', titulo: 'Correr 10km sin parar', accion: 'Toca para registrar tu carrera', progreso: 0.3, color: '#4ADE80', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png') },
  { id: '3', titulo: 'Leer 12 libros este año', accion: 'Añadir último libro leído', progreso: 0.8, color: '#60A5FA', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png') },
];

export function MetasPantalla() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.raiz}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 }]}>
        
        {/* Encabezado: Específico y directo */}
        <View style={styles.cabecera}>
          <Texto style={styles.titulo}>Tu Bosque</Texto>
          <Texto style={styles.subtitulo}>Cada meta es una semilla. Riégalas completando tus hábitos.</Texto>
        </View>

        {/* Hero Card: La Meta Principal (Firma visual) */}
        <View style={styles.heroContenedor}>
          <View style={[styles.heroExtrusion, { backgroundColor: oscurecer(METAS[0].color, 0.4) }]} />
          <View style={[styles.heroTarjeta, { backgroundColor: oscurecer(METAS[0].color, 0.8) }]}>
            
            {/* Árbol rompiendo el contenedor (riesgo estético) */}
            <Image source={METAS[0].arbol} style={styles.heroArbol} resizeMode="contain" />
            
            <View style={styles.heroContenido}>
              <Texto style={styles.heroEtiqueta}>FOCO ACTUAL</Texto>
              <Texto style={styles.heroTitulo}>{METAS[0].titulo}</Texto>
              
              {/* Barra de progreso integrada en el diseño */}
              <View style={styles.barraFondo}>
                <View style={[styles.barraRelleno, { width: `${METAS[0].progreso * 100}%`, backgroundColor: METAS[0].color }]} />
              </View>
              
              <Pressable style={[styles.botonCta, { backgroundColor: METAS[0].color }]}>
                <Texto style={styles.textoBotonCta}>{METAS[0].accion}</Texto>
              </Pressable>
            </View>
          </View>
        </View>

        <Texto style={styles.seccionTitulo}>Otras semillas plantadas</Texto>

        {/* Lista secundaria (Estructura limpia, resaltando el árbol) */}
        <View style={styles.listaMetas}>
          {METAS.slice(1).map(meta => (
            <Pressable key={meta.id} style={styles.metaFila}>
              <View style={[styles.iconoContenedor, { backgroundColor: oscurecer(meta.color, 0.9) }]}>
                 <Image source={meta.arbol} style={styles.filaArbol} resizeMode="contain" />
              </View>
              <View style={styles.metaFilaTextos}>
                <Texto style={styles.metaFilaTitulo}>{meta.titulo}</Texto>
                <Texto style={styles.metaFilaAccion}>{meta.accion}</Texto>
              </View>
              <ChevronRight color={colores.textoSecundario} size={20} />
            </Pressable>
          ))}
        </View>

      </ScrollView>

      {/* FAB (Floating Action Button) - Con voz activa */}
      <Pressable style={[styles.fabContenedor, { bottom: insets.bottom + 20 }]}>
        <View style={styles.fabSombra} />
        <View style={styles.fabSuperficie}>
          <Plus color="#FFF" size={24} />
          <Texto style={styles.fabTexto}>Plantar meta</Texto>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20 },
  
  cabecera: { marginBottom: 40 },
  titulo: { fontSize: 36, fontFamily: 'Montserrat-Bold', color: '#111827', marginBottom: 8, letterSpacing: -1 },
  subtitulo: { fontSize: 16, fontFamily: 'Montserrat-Medium', color: '#6B7280', lineHeight: 24, maxWidth: '90%' },
  
  // Hero
  heroContenedor: { position: 'relative', marginBottom: 48, marginTop: 40 },
  heroExtrusion: { position: 'absolute', top: 8, left: 0, right: 0, bottom: -8, borderRadius: 24 },
  heroTarjeta: { borderRadius: 24, padding: 24, minHeight: 220, position: 'relative', overflow: 'visible' },
  
  heroArbol: {
    position: 'absolute',
    top: -60,
    right: -20,
    width: 180,
    height: 180,
    zIndex: 10,
    // Elimina transformaciones duras que arruinen el pixel art
  },
  
  heroContenido: { position: 'relative', zIndex: 20, width: '70%', paddingTop: 20 },
  heroEtiqueta: { fontSize: 12, fontFamily: 'Montserrat-Bold', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8 },
  heroTitulo: { fontSize: 28, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: 20, lineHeight: 34 },
  
  barraFondo: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 4 },
  
  botonCta: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start' },
  textoBotonCta: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 14 },

  seccionTitulo: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#111827', marginBottom: 20 },
  
  // Lista
  listaMetas: { gap: 16 },
  metaFila: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  iconoContenedor: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  filaArbol: { width: 48, height: 48, position: 'absolute', bottom: 4 },
  metaFilaTextos: { flex: 1, marginLeft: 16 },
  metaFilaTitulo: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#111827', marginBottom: 4 },
  metaFilaAccion: { fontSize: 13, fontFamily: 'Montserrat-Medium', color: '#6B7280' },

  // FAB
  fabContenedor: { position: 'absolute', right: 20 },
  fabSombra: { position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: '#000000', borderRadius: 16 },
  fabSuperficie: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, gap: 8 },
  fabTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 16 },
});
""")
