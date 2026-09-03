import {
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  Settings,
  Target,
  Trophy,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FogEffectSkia from '../../../diseno/componentes/NieblaUi';
import { BarraProgresoLiquida } from '../../../diseno/componentes/BarraProgresoLiquida';
import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const Bioma = biomas.inicio;

const visiones = [
  {
    id: 'vision-1',
    titulo: 'Físico Atlético',
    hitoActual: 'Aumentar 1kg de masa muscular pura',
    progreso: 0.75, // 75%
    senderosVinculados: ['Hipertrofia', 'Nutrición Alta', 'Sueño profundo'],
    color: '#FF3B30',
    Icono: Flame,
  },
  {
    id: 'vision-2',
    titulo: 'Independencia Financiera',
    hitoActual: 'Construir fondo de emergencia (3 meses)',
    progreso: 0.45,
    senderosVinculados: ['Ahorro automático', 'Presupuesto'],
    color: '#FFC400',
    Icono: Target,
  },
];

import { useRouter } from 'expo-router';

export function DireccionPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [visionesActivas] = useState(visiones);

  function presionarHito(vision: typeof visiones[0]) {
    hapticSeguro('accion');
    Alert.alert(
      '¡Visión Actualizada!',
      `Has logrado el hito: "${vision.hitoActual}".\n\nPróximamente: Podrás elegir si quieres subir la dificultad de tus senderos ("${vision.senderosVinculados.join('", "')}") o mantenerlos igual.`,
      [{ text: 'Entendido, ¡voy por más!', style: 'default' }]
    );
  }

  return (
    <View style={styles.raiz}>
      {/* Fondo de niebla mística */}
      <View pointerEvents="none" style={styles.fondoNiebla}>
        <FogEffectSkia style={styles.niebla} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContenido, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecera}>
          <Compass color={colores.texto} size={32} strokeWidth={2} />
          <Texto style={styles.tituloSecundario}>Tu Ruta</Texto>
          <Texto style={styles.tituloPrincipal}>Proyectos y Visión</Texto>
          <Texto style={styles.descripcion}>
            El mapa general de tu vida. Conecta tus hábitos diarios con tus misiones más grandes.
          </Texto>
        </View>

        <View style={styles.seccion}>
          <Texto style={styles.etiquetaSeccion}>RUTAS MAESTRAS</Texto>
          <View style={styles.listaVisiones}>
            {visionesActivas.map((vision) => (
              <RecuadroGlass key={vision.id} blur intensity={48} style={[styles.tarjetaVision, { borderColor: `${vision.color}30` }]}>
                {/* Tinte de fondo sutil */}
                <View pointerEvents="none" style={[styles.tinteVision, { backgroundColor: `${vision.color}08` }]} />
                
                <View style={styles.visionCabecera}>
                  <View style={[styles.iconoCaja, { backgroundColor: `${vision.color}15` }]}>
                    <vision.Icono color={vision.color} size={20} strokeWidth={2.5} />
                  </View>
                  <Texto style={styles.visionTitulo}>{vision.titulo}</Texto>
                </View>

                <View style={styles.visionHitoContenedor}>
                  <Crosshair color={colores.textoSecundario} size={14} strokeWidth={2.5} />
                  <Texto style={styles.visionHitoEtiqueta}>HITO ACTUAL</Texto>
                </View>
                <Texto style={styles.visionHitoTexto}>{vision.hitoActual}</Texto>

                <View style={styles.barraProgresoCaja}>
                  <BarraProgresoLiquida color={vision.color} porcentaje={vision.progreso} />
                </View>

                <View style={styles.senderosVinculados}>
                  {vision.senderosVinculados.map((sendero, idx) => (
                    <View key={idx} style={[styles.chipSendero, { backgroundColor: `${vision.color}12`, borderColor: `${vision.color}20` }]}>
                      <Texto style={[styles.chipTexto, { color: vision.color }]}>{sendero}</Texto>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => presionarHito(vision)}
                  style={({ pressed }) => [
                    styles.botonHito,
                    { backgroundColor: vision.color },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                  ]}
                >
                  <Trophy color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Texto style={styles.botonHitoTexto}>¡Logré el Hito!</Texto>
                </Pressable>
              </RecuadroGlass>
            ))}
          </View>
        </View>

        <View style={styles.seccion}>
          <Texto style={styles.etiquetaSeccion}>AJUSTES DEL VIAJERO</Texto>
          <RecuadroGlass blur intensity={30} style={styles.tarjetaAjustes}>
            <Pressable style={styles.filaAjuste} onPress={() => { hapticSeguro('seleccion'); router.push('/configuracion' as any); }}>
              <View style={styles.filaAjusteIzquierda}>
                <Settings color={colores.textoSecundario} size={20} />
                <Texto style={styles.filaAjusteTexto}>Configuración y Perfil</Texto>
              </View>
              <ChevronRight color={colores.textoSecundario} size={20} />
            </Pressable>
          </RecuadroGlass>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: biomas.inicio.Paleta.background,
    flex: 1,
  },
  fondoNiebla: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    zIndex: 0,
  },
  niebla: {
    height: '100%',
    width: '100%',
  },
  scrollContenido: {
    paddingHorizontal: espaciado.lg,
  },
  cabecera: {
    marginBottom: espaciado.xl,
    marginTop: espaciado.md,
  },
  tituloSecundario: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    letterSpacing: 2,
    marginTop: espaciado.md,
    textTransform: 'uppercase',
  },
  tituloPrincipal: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 28,
    marginTop: 4,
  },
  descripcion: {
    color: colores.textoSecundario,
    fontFamily: 'Nunito-Medium',
    fontSize: 15,
    lineHeight: 22,
    marginTop: espaciado.sm,
    maxWidth: '90%',
  },
  seccion: {
    marginBottom: espaciado.xl,
  },
  etiquetaSeccion: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: espaciado.md,
    marginLeft: 4,
  },
  listaVisiones: {
    gap: espaciado.md,
  },
  tarjetaVision: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: espaciado.lg,
  },
  tinteVision: {
    ...StyleSheet.absoluteFillObject,
  },
  visionCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: espaciado.md,
  },
  iconoCaja: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  visionTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
  },
  visionHitoContenedor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  visionHitoEtiqueta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  visionHitoTexto: {
    color: colores.texto,
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    marginBottom: espaciado.md,
  },
  barraProgresoCaja: {
    height: 8,
    marginBottom: espaciado.lg,
    width: '100%',
  },
  senderosVinculados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: espaciado.lg,
  },
  chipSendero: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTexto: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
  },
  botonHito: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  botonHitoTexto: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
  },
  tarjetaAjustes: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filaAjuste: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: espaciado.lg,
  },
  filaAjusteIzquierda: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  filaAjusteTexto: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
  },
});
