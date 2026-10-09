import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Boton, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { nombreArea } from '../../areas/areas.mapper';
import type { AreaVida } from '../../areas/areas.tipos';
import { borradorAInput, borradorDesdeMeta, BORRADOR_META_VACIO, validarBorradorMeta, type BorradorMeta, type ErrorBorradorMeta } from '../metas.logica';
import type { CrearMetaInput, MetaVida } from '../metas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', campo: '#FFFFFF', borde: '#E4DDF0', error: '#DC2626' };

// Crear o editar una meta en una sola página: qué quieres lograr, de qué área
// es (obligatoria) y, si aplica, en cuántos días.
export function FormularioMeta({ areaInicial, areas, color, guardando, metaInicial, onCerrar, onGuardar, visible }: {
  /** Área preseleccionada al crear (la del filtro activo, si hay una). */
  areaInicial: string | null;
  areas: readonly AreaVida[];
  color: string;
  guardando: boolean;
  /** Si viene, se edita esa meta. */
  metaInicial: MetaVida | null;
  onCerrar: () => void;
  /** Debe lanzar si no se pudo guardar: el formulario muestra el error y no se cierra. */
  onGuardar: (input: CrearMetaInput) => Promise<void>;
  visible: boolean;
}) {
  const { t } = useTranslation();
  const [borrador, setBorrador] = useState<BorradorMeta>(BORRADOR_META_VACIO);
  const [error, setError] = useState<ErrorBorradorMeta | 'guardar' | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setBorrador(metaInicial ? borradorDesdeMeta(metaInicial) : { ...BORRADOR_META_VACIO, areaId: areaInicial });
  }, [visible, metaInicial, areaInicial]);

  const cambiar = (cambios: Partial<BorradorMeta>) => { setError(null); setBorrador((actual) => ({ ...actual, ...cambios })); };

  async function guardar() {
    const invalido = validarBorradorMeta(borrador);
    if (invalido) { hapticSeguro('impacto'); setError(invalido); return; }
    try {
      await onGuardar(borradorAInput(borrador));
      hapticSeguro('confirmacion');
      onCerrar();
    } catch {
      setError('guardar');
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onCerrar} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaProvider>
        <SafeAreaView style={estilos.raiz}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={estilos.cabecera}>
              <Pressable accessibilityLabel={t('metas.formulario.cerrar')} accessibilityRole="button" hitSlop={10} onPress={onCerrar} style={estilos.cerrar}><X color={C.texto} size={22} /></Pressable>
              <Texto accessibilityRole="header" style={estilos.titulo}>{t(metaInicial ? 'metas.formulario.tituloEditar' : 'metas.formulario.tituloCrear')}</Texto>
            </View>

            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                accessibilityLabel={t('metas.formulario.nombre')}
                maxFontSizeMultiplier={1.3}
                maxLength={120}
                onChangeText={(titulo) => cambiar({ titulo })}
                placeholder={t('metas.formulario.nombre')}
                placeholderTextColor={C.tenue}
                style={[estilos.campo, error === 'titulo' && estilos.campoError]}
                value={borrador.titulo}
              />

              <Texto style={estilos.etiqueta}>{t('metas.formulario.area')}</Texto>
              <View accessibilityRole="radiogroup" style={estilos.areas}>
                {areas.map((area) => {
                  const activa = borrador.areaId === area.id;
                  const nombre = nombreArea(area, t);
                  return (
                    <Pressable
                      accessibilityLabel={nombre}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: activa }}
                      key={area.id}
                      onPress={() => { hapticSeguro('seleccion'); cambiar({ areaId: area.id }); }}
                      style={[estilos.area, activa ? { backgroundColor: color, borderColor: color } : null]}
                    >
                      <View style={[estilos.punto, { backgroundColor: area.color }]} />
                      <Texto numberOfLines={1} style={[estilos.areaTexto, activa && { color: '#FFFFFF' }]}>{nombre}</Texto>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                accessibilityLabel={t('metas.formulario.descripcion')}
                maxFontSizeMultiplier={1.3}
                maxLength={600}
                multiline
                onChangeText={(descripcion) => cambiar({ descripcion })}
                placeholder={t('metas.formulario.descripcion')}
                placeholderTextColor={C.tenue}
                style={[estilos.campo, estilos.campoLargo]}
                value={borrador.descripcion}
              />

              <View style={estilos.interruptor}>
                <Texto style={[estilos.etiqueta, { flex: 1 }]}>{t('metas.formulario.conPlazo')}</Texto>
                <Switch accessibilityLabel={t('metas.formulario.conPlazo')} onValueChange={(conPlazo) => cambiar({ conPlazo })} thumbColor="#FFFFFF" trackColor={{ false: '#D8D3CD', true: color }} value={borrador.conPlazo} />
              </View>
              {borrador.conPlazo ? (
                <View style={estilos.diasFila}>
                  <TextInput
                    accessibilityLabel={t('metas.formulario.dias')}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    maxFontSizeMultiplier={1.3}
                    maxLength={4}
                    onChangeText={(duracionDias) => cambiar({ duracionDias: duracionDias.replace(/[^0-9]/g, '') })}
                    style={[estilos.campo, estilos.campoDias, error === 'duracion' && estilos.campoError]}
                    value={borrador.duracionDias}
                  />
                  <Texto style={estilos.etiqueta}>{t('metas.formulario.dias')}</Texto>
                </View>
              ) : null}

              {error ? <Texto accessibilityLiveRegion="polite" style={estilos.error}>{t(`metas.formulario.error.${error}`)}</Texto> : null}
            </ScrollView>

            <View style={estilos.pie}>
              <Boton color={color} disabled={guardando} onPress={() => void guardar()} variante="sendero">
                {metaInicial
                  ? (guardando ? t('metas.formulario.guardando') : t('metas.formulario.guardar'))
                  : (guardando ? t('metas.formulario.creando') : t('metas.formulario.crear'))}
              </Boton>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { backgroundColor: '#F6F3FB', flex: 1 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  cerrar: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  titulo: { color: C.texto, flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 22 },
  contenido: { gap: 14, padding: 20, paddingBottom: 30 },
  campo: { backgroundColor: C.campo, borderColor: C.borde, borderRadius: 14, borderWidth: 1.5, color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 15, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10 },
  campoLargo: { minHeight: 88, textAlignVertical: 'top' },
  campoDias: { minWidth: 86, textAlign: 'center' },
  campoError: { borderColor: C.error },
  etiqueta: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  areas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  area: { alignItems: 'center', backgroundColor: C.campo, borderColor: C.borde, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 11, paddingVertical: 6 },
  punto: { borderRadius: 5, height: 10, width: 10 },
  areaTexto: { color: C.texto, flexShrink: 1, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  interruptor: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  diasFila: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  error: { color: C.error, fontFamily: 'Montserrat-Medium', fontSize: 13 },
  pie: { paddingBottom: 12, paddingHorizontal: 20, paddingTop: 8 },
});
