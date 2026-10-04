import { Lock } from 'lucide-react-native';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, Texto } from '../../../diseno';
import type { PlantillaRutina } from '../plantillasRutinas';

const C = { texto: '#1A1335', tenue: '#7B7494', error: '#DC2626', precio: '#6D28D9' };

export type ErrorCompraPlantilla = 'gemas' | 'otro' | null;

/** Vista previa de una plantilla bloqueada con la opción de desbloquearla con gemas. */
export function ModalCompraPlantilla({ color, comprando, error, onCancelar, onComprar, onIrAGemas, plantilla, saldo }: {
  color: string;
  comprando: boolean;
  error: ErrorCompraPlantilla;
  onCancelar: () => void;
  onComprar: (plantilla: PlantillaRutina) => void;
  onIrAGemas: () => void;
  /** null = cerrado. */
  plantilla: PlantillaRutina | null;
  /** undefined mientras carga: no se afirma que falten gemas; lo decide el servidor al comprar. */
  saldo: number | undefined;
}) {
  const { t } = useTranslation();
  const faltan = plantilla && saldo !== undefined ? plantilla.precioGemas > saldo : false;
  return (
    <Modal animationType="fade" onRequestClose={onCancelar} transparent visible={plantilla !== null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.fondo}>
        <Pressable accessibilityLabel={t('rutinas.plantillas.cancelar')} onPress={onCancelar} style={StyleSheet.absoluteFill} />
        {plantilla ? (
          <MasterGlass style={estilos.tarjeta}>
            <View style={estilos.encabezado}>
              <Lock color={C.tenue} size={18} />
              <Texto accessibilityRole="header" style={estilos.titulo}>{plantilla.titulo}</Texto>
            </View>
            <Texto style={estilos.texto}>{plantilla.descripcion}</Texto>
            <Texto style={estilos.meta}>
              {t('rutinas.tarjeta.pasos', { count: plantilla.numPasos })}
              {plantilla.duracionMin > 0 ? ` · ${t('rutinas.plantillas.minutos', { count: plantilla.duracionMin })}` : ''}
              {` · ${t('rutinas.plantillas.autor', { autor: plantilla.autor })}`}
            </Texto>
            <Texto style={estilos.meta}>{t('rutinas.plantillas.vistaPrevia')}</Texto>

            <View style={estilos.saldoFila}>
              <Texto style={estilos.meta}>{t('rutinas.plantillas.tuSaldo')}</Texto>
              <View style={estilos.gemas}><Image source={require('../../../../assets/icons/hoy/gemas.png')} style={estilos.gema} /><Texto style={estilos.precio}>{saldo ?? '—'}</Texto></View>
            </View>
            {faltan || error === 'gemas' ? <Texto style={estilos.error}>{t('rutinas.plantillas.gemasInsuficientes')}</Texto> : null}
            {error === 'otro' ? <Texto style={estilos.error}>{t('rutinas.plantillas.errorCompra')}</Texto> : null}

            {faltan || error === 'gemas' ? (
              <MasterButton color={color} onPress={onIrAGemas}>{t('rutinas.plantillas.conseguirGemas')}</MasterButton>
            ) : (
              <MasterButton color={color} disabled={comprando} onPress={() => onComprar(plantilla)}>
                {comprando ? t('rutinas.plantillas.comprando') : t('rutinas.plantillas.desbloquearPor', { count: plantilla.precioGemas })}
              </MasterButton>
            )}
            <Pressable accessibilityRole="button" onPress={onCancelar} style={estilos.cancelar}><Texto style={estilos.cancelarTexto}>{t('rutinas.plantillas.cancelar')}</Texto></Pressable>
          </MasterGlass>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  tarjeta: { borderRadius: 22, gap: 10, padding: 18, width: '100%' },
  encabezado: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  titulo: { color: C.texto, flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 18 },
  texto: { color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 20 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  saldoFila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  gemas: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  gema: { height: 20, resizeMode: 'contain', width: 20 },
  precio: { color: C.precio, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  error: { color: C.error, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  cancelar: { alignItems: 'center', minHeight: 40, justifyContent: 'center' },
  cancelarTexto: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 13 },
});
