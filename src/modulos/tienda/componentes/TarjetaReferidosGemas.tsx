import { useState } from 'react';
import { Image, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, MasterIconBg, MasterKicker, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerInfoReferidos } from '../gemas.servicio';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';

export const CLAVE_INFO_REFERIDOS = ['tienda', 'infoReferidos'];

export function TarjetaReferidosGemas() {
  const esc = useEscala();
  const tr = useEstilosTr();
  const { t } = useTranslation();
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
    const mensaje = t('tienda.referrals.shareMessage', { code: codigo });
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
            texto={t('tienda.referrals.kicker')}
          />
          <Texto style={tr.titulo}>{t('tienda.referrals.title')}</Texto>
          <Texto style={tr.subtitulo}>{t('tienda.referrals.description')}</Texto>
        </View>
        <Image
          source={require('../../../../assets/icons/hoy/gemas.png')}
          style={tr.gemaDecorativa}
        />
      </View>

      {/* Recuadro con el código del usuario */}
      <View style={tr.cajaCodigo}>
        <View style={{ flex: 1 }}>
          <Texto style={tr.etiquetaCodigo}>{t('tienda.referrals.codeLabel')}</Texto>
          <Texto style={tr.textoCodigo}>{codigo || '--------'}</Texto>
        </View>
        <View style={{ width: 110 }}>
          <MasterButton
            color={copiado ? esc.jade.l59a : '#6A29C2'}
            onPress={copiarCodigo}
            iconoSize={16}
          >
            {copiado ? t('tienda.referrals.copied') : t('tienda.referrals.copy')}
          </MasterButton>
        </View>
      </View>

      {/* Botón grande para compartir directo */}
      <View style={{ marginTop: 12 }}>
        <MasterButton
          color={esc.hoja.l61a}
          onPress={compartirInvitacion}
          iconoIzquierda={({ size }) => (
            <MasterIcon name="equipo" alTema size={size} />
          )}
          iconoSize={18}
        >
          {t('tienda.referrals.share')}
        </MasterButton>
      </View>

      {/* Resumen de actividad de referidos */}
      <View style={tr.filaMetricas}>
        <View style={tr.columnaMetrica}>
          <Texto style={tr.numeroMetrica}>{info?.totalAmigos ?? 0}</Texto>
          <Texto style={tr.labelMetrica}>{t('tienda.referrals.friendsJoined')}</Texto>
        </View>
        <View style={tr.separadorMetrica} />
        <View style={tr.columnaMetrica}>
          <Texto style={tr.numeroMetrica}>{info?.amigosCompletados ?? 0}</Texto>
          <Texto style={tr.labelMetrica}>{t('tienda.referrals.atLevelTwo')}</Texto>
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
          <Texto style={tr.labelMetrica}>{t('tienda.referrals.gemsEarned')}</Texto>
        </View>
      </View>
    </MasterGlass>
  );
}

const crearEstilosTr = (esc: EscalaMaster) => StyleSheet.create({
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
    color: esc.hoja.l19,
    marginTop: 4,
  },
  subtitulo: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: esc.musgo.l54,
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
    color: esc.hoja.l19,
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
    color: esc.hoja.l19,
  },
  labelMetrica: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 10,
    color: esc.musgo.l54,
    marginTop: 2,
  },
});

const estilosPorEscalaTr = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosTr>>();

function useEstilosTr() {
  const esc = useEscala();
  let valor = estilosPorEscalaTr.get(esc);
  if (!valor) {
    valor = crearEstilosTr(esc);
    estilosPorEscalaTr.set(esc, valor);
  }
  return valor;
}
