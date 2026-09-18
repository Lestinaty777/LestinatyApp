import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Sparkles } from 'lucide-react-native';

import {
  MasterButton,
  MasterGlass,
  MasterIcon,
  MasterKicker,
  Rebote,
  Texto,
  entradaEncadenada,
} from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { obtenerCatalogoArboles, otorgarSemillaBienvenida } from '../../tienda/gemas.servicio';
import { obtenerAssetsPaquete, PAQUETES_ARBOL } from '../../senderos/algoritmo/registroPaquetesArbol';
import { CLAVE_REGALO_BIENVENIDA } from '../onboarding.servicio';

const C = {
  texto: '#1A1335',
  tenue: '#648170',
  verde: '#25884C',
  dorado: '#EAB308',
  glass: 'rgba(255,255,255,0.78)',
  glassBorde: 'rgba(255,255,255,0.85)',
};

export function RegaloBienvenidaPantalla() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [elegido, setElegido] = useState<string | null>(null);

  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const paquetes = (consultaCatalogo.data ?? []).filter((p) => Object.prototype.hasOwnProperty.call(PAQUETES_ARBOL, p.id));

  const mutacionReclamar = useMutation({
    mutationFn: otorgarSemillaBienvenida,
    onError: (error: Error) => {
      Alert.alert('No se pudo reclamar', error.message || 'Intentá de nuevo en un momento.');
    },
    onSuccess: () => {
      hapticSeguro('confirmacion');
      queryClient.setQueryData(CLAVE_REGALO_BIENVENIDA, false);
    },
  });

  function confirmar() {
    if (!elegido) return;
    hapticSeguro('seleccion');
    mutacionReclamar.mutate(elegido);
  }

  const paqueteSeleccionado = paquetes.find((p) => p.id === elegido);

  return (
    <LinearGradient colors={['#F7FDF7', '#E8F7E9', '#D5F2D7']} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <AuroraBoreal tema="verde" />

        <View style={s.kickerFila}>
          <MasterKicker
            icono={<Sparkles color="#FEF08A" size={12} />}
            texto="REGALO EXCLUSIVO DE BIENVENIDA"
          />
        </View>

        <Texto style={s.titulo}>¡Bienvenido a tu nuevo jardín!</Texto>
        <Texto style={s.subtitulo}>
          Para comenzar con energía, te regalamos tu primera especie premium de por vida.
        </Texto>

        <MasterGlass colorBase="#FEF08A" style={s.aviso}>
          <View style={s.avisoFila}>
            <Sparkles color="#854D0E" size={16} />
            <Texto style={s.avisoTexto}>
              El árbol que elijas crecerá y florecerá con cada día de tu sendero.
            </Texto>
          </View>
        </MasterGlass>
      </View>

      <ScrollView contentContainerStyle={[s.grilla, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        {consultaCatalogo.isLoading ? (
          <View style={s.cargandoContenedor}>
            <Texto style={s.cargando}>Cargando especies de árboles…</Texto>
          </View>
        ) : (
          <View style={s.filas}>
            {paquetes.map((paquete) => {
              const seleccionado = elegido === paquete.id;
              const imagen = obtenerAssetsPaquete(paquete.id)?.etapas[6];
              const colorMaster = colorMasterMasCercano(paquete.masterPackColor);

              return (
                <Rebote
                  accessibilityLabel={`Elegir ${paquete.nombre}`}
                  key={paquete.id}
                  onPress={() => {
                    hapticSeguro('seleccion');
                    setElegido(paquete.id);
                  }}
                  estilo={s.tarjetaEnvoltura}
                >
                  <MasterGlass
                    colorBase={paquete.masterPackColor}
                    style={[
                      s.tarjeta,
                      seleccionado && {
                        borderColor: paquete.masterPackColor,
                        borderWidth: 2.2,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      },
                    ]}
                  >
                    {/* Badge de selección */}
                    {seleccionado && (
                      <View style={[s.checkSeleccionado, { backgroundColor: paquete.masterPackColor }]}>
                        <Check color="#FFFFFF" size={13} strokeWidth={3.5} />
                      </View>
                    )}

                    <View style={s.badgeGratis}>
                      <Texto style={s.badgeGratisTexto}>GRATIS</Texto>
                    </View>

                    <View style={[s.auraCirculo, { backgroundColor: `${paquete.masterPackColor}18` }]}>
                      {imagen && <Image resizeMode="contain" source={imagen} style={s.imagenArbol} />}
                    </View>

                    <Texto numberOfLines={1} style={s.nombreArbol}>
                      {paquete.nombre}
                    </Texto>

                    <View style={s.iconoDetalle}>
                      <MasterIcon color={colorMaster} name="hoja3" size={16} />
                    </View>
                  </MasterGlass>
                </Rebote>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Pie de confirmación fijo con MasterButton */}
      <View style={[s.pie, { paddingBottom: insets.bottom + 18 }]}>
        <MasterButton
          color={paqueteSeleccionado?.masterPackColor || '#21A844'}
          disabled={!elegido || mutacionReclamar.isPending}
          onPress={confirmar}
          style={s.botonConfirmar}
        >
          {mutacionReclamar.isPending
            ? 'Plantando tu árbol…'
            : elegido
            ? `PLANTAR ${paqueteSeleccionado?.nombre.toUpperCase()}`
            : 'ELIGE UN ÁRBOL PARA CONTINUAR'}
        </MasterButton>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  header: { gap: 6, overflow: 'hidden', paddingHorizontal: 20, position: 'relative' },
  kickerFila: { alignItems: 'center', marginBottom: 4 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, textAlign: 'center' },
  subtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  aviso: { borderRadius: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10 },
  avisoFila: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  avisoTexto: {
    color: '#713F12',
    flex: 1,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 11,
    lineHeight: 16,
  },
  cargandoContenedor: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  cargando: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  grilla: { paddingHorizontal: 16, paddingTop: 14 },
  filas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tarjetaEnvoltura: { width: '47%' },
  tarjeta: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 4,
    padding: 14,
    position: 'relative',
    width: '100%',
  },
  checkSeleccionado: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    width: 24,
    zIndex: 4,
  },
  badgeGratis: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 136, 76, 0.15)',
    borderColor: 'rgba(37, 136, 76, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeGratisTexto: {
    color: C.verde,
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  auraCirculo: {
    alignItems: 'center',
    borderRadius: 40,
    height: 84,
    justifyContent: 'center',
    marginVertical: 4,
    width: 84,
  },
  imagenArbol: { height: 76, resizeMode: 'contain', width: 76 },
  nombreArbol: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  iconoDetalle: { marginTop: 2 },
  pie: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  botonConfirmar: {
    height: 56,
    width: '100%',
  },
});
