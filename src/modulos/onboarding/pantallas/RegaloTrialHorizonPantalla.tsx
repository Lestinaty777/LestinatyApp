import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, X } from 'lucide-react-native';

import { MasterGlass, MasterKicker, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { otorgarSemillaTrialHorizon } from '../../tienda/gemas.servicio';
import { CLAVE_REGALO_TRIAL_HORIZON } from '../onboarding.servicio';
import { SelectorArbolRegalo } from '../componentes/SelectorArbolRegalo';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

const C = { texto: '#1A1335', tenue: ESCALA_ESMERALDA.musgo.l51 };

// No bloqueante a propósito (a diferencia de RegaloBienvenidaPantalla): esta
// cuenta ya usa la app con normalidad, forzar una pantalla completa se
// sentiría como un secuestro de la navegación. Se puede cerrar con la X y
// vuelve a aparecer en la próxima sesión mientras siga pendiente.
export function RegaloTrialHorizonPantalla({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  const { t } = useTranslation();
  const esc = useEscala();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const mutacionReclamar = useMutation({
    mutationFn: otorgarSemillaTrialHorizon,
    onError: (error: Error) => {
      Alert.alert(t('onboarding.regaloTrial.alerts.claimErrorTitle'), error.message || t('onboarding.regaloTrial.alerts.claimErrorDefault'));
    },
    onSuccess: () => {
      hapticSeguro('confirmacion');
      queryClient.setQueryData(CLAVE_REGALO_TRIAL_HORIZON, false);
    },
  });

  return (
    <Modal animationType="slide" onRequestClose={onCerrar} presentationStyle="pageSheet" visible={visible}>
      <LinearGradient colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <AuroraBoreal tema="verde" />

          <Pressable accessibilityLabel={t('onboarding.regaloTrial.closeAccessibility')} hitSlop={12} onPress={onCerrar} style={s.cerrar}>
            <X color={C.tenue} size={20} />
          </Pressable>

          <View style={s.kickerFila}>
            <MasterKicker icono={<Crown color="#FEF08A" size={12} />} texto={t('onboarding.regaloTrial.kicker')} />
          </View>

          <Texto style={s.titulo}>{t('onboarding.regaloTrial.title')}</Texto>
          <Texto style={s.subtitulo}>
            {t('onboarding.regaloTrial.subtitle')}
          </Texto>

          <MasterGlass colorBase="#FEF08A" style={s.aviso}>
            <View style={s.avisoFila}>
              <Crown color="#854D0E" size={16} />
              <Texto style={s.avisoTexto}>
                {t('onboarding.regaloTrial.bannerNotice')}
              </Texto>
            </View>
          </MasterGlass>
        </View>

        <SelectorArbolRegalo
          confirmando={mutacionReclamar.isPending}
          onConfirmar={(paqueteId) => mutacionReclamar.mutate(paqueteId)}
          paddingBottomPie={insets.bottom + 18}
          textoBotonIdle={t('onboarding.regaloTrial.buttonIdle')}
        />
      </LinearGradient>
    </Modal>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  header: { gap: 6, overflow: 'hidden', paddingHorizontal: 20, position: 'relative' },
  cerrar: { alignSelf: 'flex-end', padding: 4 },
  kickerFila: { alignItems: 'center', marginBottom: 4, marginTop: -8 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 29, textAlign: 'center' },
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
});
