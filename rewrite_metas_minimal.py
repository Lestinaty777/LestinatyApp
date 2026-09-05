import os

with open('src/modulos/metas/pantallas/MetasPantalla.tsx', 'w') as f:
    f.write("""import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto } from '../../../diseno';
import { Plus } from 'lucide-react-native';

const METAS = [
  { id: '1', titulo: 'Dominar Japonés N5', accion: 'Plantar 3 semillas esta semana', progreso: 0.6, color: '#FF3366', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png') },
  { id: '2', titulo: 'Correr 10km sin parar', accion: 'Toca para registrar tu carrera', progreso: 0.3, color: '#00E676', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png') },
  { id: '3', titulo: 'Leer 12 libros este año', accion: 'Añadir último libro leído', progreso: 0.8, color: '#2979FF', arbol: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png') },
];

export function MetasPantalla() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.raiz}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 100 }}>
        
        {/* Encabezado Editorial Minimalista */}
        <View style={styles.cabecera}>
          <Texto style={styles.etiquetaSuperior}>01 — OBJETIVOS ACTIVOS</Texto>
          <Texto style={styles.titulo}>Tus Metas</Texto>
          <View style={styles.lineaDivisoria} />
        </View>

        {/* Hero: Diseño "Exhibición de Museo" */}
        <View style={styles.exhibicionContenedor}>
          {/* El lienzo neutro */}
          <View style={styles.lienzo}>
            {/* El árbol es el único protagonista visual */}
            <Image source={METAS[0].arbol} style={styles.heroArbol} resizeMode="contain" />
            <View style={styles.pedestalLinea} />
          </View>
          
          <View style={styles.infoHero}>
            <View style={styles.filaHeroProgreso}>
              <Texto style={styles.numeroHero}>{(METAS[0].progreso * 100).toFixed(0)}%</Texto>
              <View style={styles.barraFondoMinimal}>
                <View style={[styles.barraRellenoMinimal, { width: `${METAS[0].progreso * 100}%`, backgroundColor: METAS[0].color }]} />
              </View>
            </View>
            
            <Texto style={styles.tituloHero}>{METAS[0].titulo}</Texto>
            
            <Pressable style={styles.botonMinimalista}>
              <View style={[styles.puntoAcento, { backgroundColor: METAS[0].color }]} />
              <Texto style={styles.textoBotonMinimalista}>Registrar avance</Texto>
            </Pressable>
          </View>
        </View>

        <View style={styles.lineaGruesa} />

        {/* Lista secundaria: Estilo tabla de datos (Broadsheet) */}
        <View style={styles.tabla}>
          {METAS.slice(1).map((meta, index) => (
            <Pressable key={meta.id} style={[styles.filaTabla, index === 0 && { borderTopWidth: 0 }]}>
              
              <View style={styles.columnaArbol}>
                <Image source={meta.arbol} style={styles.miniaturaArbol} resizeMode="contain" />
              </View>
              
              <View style={styles.columnaInfo}>
                <Texto style={styles.filaTitulo}>{meta.titulo}</Texto>
                <Texto style={styles.filaSubtitulo}>{(meta.progreso * 100).toFixed(0)}% completado</Texto>
              </View>
              
              <View style={styles.columnaAcento}>
                {/* Acento hiper saturado mínimo */}
                <View style={[styles.indicadorEstado, { backgroundColor: meta.color }]} />
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>

      {/* FAB Ultra-Mínimo */}
      <Pressable style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <Plus color="#FFFFFF" size={28} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#FAF9F6' }, // Off-white cálido muy sutil
  
  cabecera: { paddingHorizontal: 24, marginBottom: 40 },
  etiquetaSuperior: { fontSize: 11, fontFamily: 'Montserrat-Bold', color: '#888', letterSpacing: 2, marginBottom: 12 },
  titulo: { fontSize: 48, fontFamily: 'Montserrat-Medium', color: '#111', letterSpacing: -2, marginBottom: 24 },
  lineaDivisoria: { height: 1, backgroundColor: '#E5E5E5', width: '100%' },
  
  // Exhibición (Hero)
  exhibicionContenedor: { paddingHorizontal: 24, marginBottom: 48 },
  lienzo: { 
    height: 280, 
    backgroundColor: '#F0EFEA', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 2
  },
  heroArbol: { width: 220, height: 220, zIndex: 2 },
  pedestalLinea: { 
    position: 'absolute', 
    bottom: 40, 
    width: 140, 
    height: 1, 
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1
  },
  
  infoHero: { paddingHorizontal: 8 },
  filaHeroProgreso: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  numeroHero: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#111', marginRight: 16, width: 32 },
  barraFondoMinimal: { flex: 1, height: 2, backgroundColor: '#E5E5E5' },
  barraRellenoMinimal: { height: '100%' },
  
  tituloHero: { fontSize: 28, fontFamily: 'Montserrat-Bold', color: '#111', lineHeight: 34, marginBottom: 24, letterSpacing: -0.5 },
  
  botonMinimalista: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 8, alignSelf: 'flex-start' },
  puntoAcento: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  textoBotonMinimalista: { fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#111', textTransform: 'uppercase', letterSpacing: 1 },

  lineaGruesa: { height: 4, backgroundColor: '#111', marginHorizontal: 24, marginBottom: 0 },
  
  // Tabla (Lista)
  tabla: { paddingHorizontal: 24 },
  filaTabla: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 24, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E5E5' 
  },
  columnaArbol: { width: 64, height: 64, backgroundColor: '#F0EFEA', justifyContent: 'center', alignItems: 'center', borderRadius: 2, marginRight: 20 },
  miniaturaArbol: { width: 50, height: 50 },
  
  columnaInfo: { flex: 1, justifyContent: 'center' },
  filaTitulo: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#111', marginBottom: 6 },
  filaSubtitulo: { fontSize: 13, fontFamily: 'Montserrat-Medium', color: '#888' },
  
  columnaAcento: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  indicadorEstado: { width: 12, height: 12, borderRadius: 6 },

  // FAB
  fab: { 
    position: 'absolute', 
    right: 24, 
    width: 64, 
    height: 64, 
    backgroundColor: '#111', 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10
  },
});
""")
