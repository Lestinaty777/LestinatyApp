import { useState } from 'react';
import { Image, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';

import { MasterButton, MasterGlass, MasterIcon, MasterIconBg, MasterKicker, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerInfoReferidos } from '../gemas.servicio';

export const CLAVE_INFO_REFERIDOS = ['tienda', 'infoReferidos'];

export function TarjetaReferidosGemas() {
  const { data: info } = useQuery({
    queryKey: CLAVE_INFO_REFERIDOS,
    queryFn: obtenerInfoReferidos,
    staleTime: 1000 * 60 * 5,
  });

  const [copiado, setCopiado] = useState(false);
  const codigo = info?.codigo ?? '';

  async function copiarCodigo() {
    if (!codigo) return;
    hapticSeguro('confirmacion');
    await Clipboard.setStringAsync(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2400);
  }

  async function compartirInvitacion() {
    if (!codigo) return;
    hapticSeguro('seleccion');
    const mensaje = `¡Únete a mí en Lestinaty para transformar nuestros hábitos juntos! 🌲✨\n\nUsa mi código al registrarte: ${codigo}\n\n¡Al subir tu primer hábito a Nivel 2 ambos recibiremos 100 gemas gratis! 💎`;
    try {
      await Share.share({ message: mensaje });
    } catch {
      // Si el usuario cancela la hoja de compartir no hacemos nada
    }
  }

  return (
    <MasterGlass colorBase="#FEF08A" style={tr.tarjeta}>
      {/* Encabezado con kicker e icono */}
      <View style={tr.filaSuperior}>
        <View style={{ flex: 1, gap: 4 }}>
          <MasterKicker
            icono={<MasterIcon name="trofeo" color={3} size={12} />}
            texto="Gemas Gratis"
          />
          <Texto style={tr.titulo}>Invita amigos</Texto>
          <Texto style={tr.subtitulo}>Gana 100 gemas por cada amigo que alcance el Nivel 2 en su primer hábito.</Texto>
        </View>
        <Image
          source={require('../../../../assets/icons/hoy/gemas.png')}
          style={tr.gemaDecorativa}
        />
      </View>

      {/* Recuadro con el código del usuario */}
      <View style={tr.cajaCodigo}>
        <View style={{ flex: 1 }}>
          <Texto style={tr.etiquetaCodigo}>TU CÓDIGO DE INVITACIÓN</Texto>
          <Texto style={tr.textoCodigo}>{codigo || '--------'}</Texto>
        </View>
        <View style={{ width: 110 }}>
          <MasterButton
            color={copiado ? '#16A34A' : '#6A29C2'}
            onPress={copiarCodigo}
            iconoSize={16}
          >
            {copiado ? '¡Copiado! ✓' : 'Copiar'}
          </MasterButton>
        </View>
      </View>

      {/* Botón grande para compartir directo */}
      <View style={{ marginTop: 12 }}>
        <MasterButton
          color="#21A844"
          onPress={compartirInvitacion}
          iconoIzquierda={({ size }) => (
            <MasterIcon name="equipo" color={2} size={size} />
          )}
          iconoSize={18}
        >
          Compartir invitación
        </MasterButton>
      </View>

      {/* Resumen de actividad de referidos */}
      <View style={tr.filaMetricas}>
        <View style={tr.columnaMetrica}>
          <Texto style={tr.numeroMetrica}>{info?.totalAmigos ?? 0}</Texto>
          <Texto style={tr.labelMetrica}>Amigos unidos</Texto>
        </View>
        <View style={tr.separadorMetrica} />
        <View style={tr.columnaMetrica}>
          <Texto style={tr.numeroMetrica}>{info?.amigosCompletados ?? 0}</Texto>
          <Texto style={tr.labelMetrica}>En Nivel 2+</Texto>
        </View>
        <View style={tr.separadorMetrica} />
        <View style={tr.columnaMetrica}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Image
              source={require('../../../../assets/icons/hoy/gemas.png')}
              style={{ width: 16, height: 16, resizeMode: 'contain' }}
            />
            <Texto style={[tr.numeroMetrica, { color: '#6D28D9' }]}>
              {info?.gemasGanadas ?? 0}
            </Texto>
          </View>
          <Texto style={tr.labelMetrica}>Gemas ganadas</Texto>
        </View>
      </View>
    </MasterGlass>
  );
}

const tr = StyleSheet.create({
  tarjeta: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    color: '#1A3320',
    marginTop: 4,
  },
  subtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#5B8C65',
    lineHeight: 16,
  },
  gemaDecorativa: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    marginTop: 4,
  },
  cajaCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    gap: 8,
  },
  etiquetaCodigo: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    color: '#854D0E',
    letterSpacing: 0.8,
  },
  textoCodigo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    color: '#1A3320',
    letterSpacing: 2,
    marginTop: 2,
  },
  filaMetricas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  columnaMetrica: {
    alignItems: 'center',
    flex: 1,
  },
  separadorMetrica: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  numeroMetrica: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: '#1A3320',
  },
  labelMetrica: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    color: '#5B8C65',
    marginTop: 2,
  },
});
