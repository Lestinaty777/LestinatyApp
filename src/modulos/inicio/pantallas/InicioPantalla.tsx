import React from 'react';
import { StyleSheet, View, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, Calendar, Sparkles, Store } from 'lucide-react-native';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import { biomas } from '../../../diseno/tema/biomas';
import { Texto, colores, RecuadroGlass } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

export function InicioPantalla() {
  const { height } = useWindowDimensions();
  const alturaMapa = height * 0.8;

  const BotonAccion = ({ Icono }: { Icono: any }) => (
    <Pressable 
      style={({ pressed }) => [styles.botonAccion, pressed && styles.botonAccionPresionado]}
      onPress={() => hapticSeguro('seleccion')}
    >
      <Icono color={colores.textoSecundario} size={24} strokeWidth={2.5} />
    </Pressable>
  );

  return (
    <View style={styles.raiz}>
      <SafeAreaView edges={['top']} style={styles.contenedorPrincipal}>
        
        {/* Barra de Navegación Superior */}
        <RecuadroGlass blur intensity={40} style={styles.navbarSuperior}>
          <BotonAccion Icono={Book} />
          <BotonAccion Icono={Calendar} />
          <BotonAccion Icono={Sparkles} />
          <BotonAccion Icono={Store} />
                </RecuadroGlass>
        
        {/* Tarjeta de Asignatura / Tema actual */}
        <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
          <Texto style={styles.tituloAsignatura}>Anatomía I</Texto>
          <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
        </View>
        
        {/* Espacio que empuja el mapa hacia abajo para respetar el 80% */}
        <View style={styles.espacioFlexible} />
        
        {/* Contenedor del Mapa (80%) */}
        <View style={styles.capaMapa}>
          <ContenedorMapaSenderos
            altura={alturaMapa}
            categoriaId="rutinas"
            color={biomas.inicio.MasterColor}
            enfocado={true}
            subcategoriaId="manana"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: '#EAEAEA',
    flex: 1,
    position: 'relative',
  },
  contenedorPrincipal: {
    flex: 1,
  },
  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tarjetaAsignatura: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  tituloAsignatura: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  descAsignatura: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  espacioFlexible: {
    flex: 1, // Toma todo el espacio restante hasta empujar la capaMapa
  },
  botonAccion: {
    padding: 8, // Aumenta el area táctil
  },
  botonAccionPresionado: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  capaMapa: {
    height: '80%', // Forzamos el 80% de altura estricto
    overflow: 'hidden',
  }
});
