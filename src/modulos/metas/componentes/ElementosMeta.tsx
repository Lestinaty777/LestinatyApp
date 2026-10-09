import { Check, Plus, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Boton, MasterGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { agruparElementosPorTipo, elementosDeLaMeta, type ElementoDeMeta } from '../metas.logica';
import type { MetaVida } from '../metas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', borde: '#E4DDF0', error: '#DC2626' };

/** Lo que contiene una meta, agrupado por tipo. Se muestra dentro de la tarjeta abierta. */
export function ContenidoMeta({ cargando, elementos, error, metaId }: {
  cargando: boolean;
  elementos: readonly ElementoDeMeta[] | undefined;
  error: boolean;
  metaId: string;
}) {
  const { t } = useTranslation();
  if (cargando) return <Texto style={estilos.ayuda}>{t('metas.elementos.cargando')}</Texto>;
  if (error) return <Texto style={[estilos.ayuda, { color: C.error }]}>{t('metas.elementos.error')}</Texto>;
  const grupos = agruparElementosPorTipo(elementosDeLaMeta(elementos ?? [], metaId));
  if (grupos.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {grupos.map((grupo) => (
        <View key={grupo.tipo}>
          <Texto style={estilos.grupo}>{t(`metas.elementos.tipo.${grupo.tipo}`)}</Texto>
          {grupo.elementos.map((elemento) => <Texto key={elemento.id} numberOfLines={1} style={estilos.elemento}>· {elemento.titulo}</Texto>)}
        </View>
      ))}
    </View>
  );
}

// Elegir qué hábitos, tareas, rutinas y planes pertenecen a una meta. Tocar una
// fila la añade o la quita; lo que ya está en OTRA meta se puede traer aquí
// (un elemento solo puede estar en una meta), y se avisa con una etiqueta.
export function SelectorElementosMeta({ color, elementoEnCursoId, elementos, error, meta, onAlternar, onCerrar }: {
  color: string;
  /** Id del elemento que se está guardando ahora mismo (se desactiva). */
  elementoEnCursoId: string | null;
  elementos: readonly ElementoDeMeta[] | undefined;
  error: boolean;
  /** null = cerrado. */
  meta: MetaVida | null;
  onAlternar: (elemento: ElementoDeMeta, meta: MetaVida) => void;
  onCerrar: () => void;
}) {
  const { t } = useTranslation();
  const grupos = agruparElementosPorTipo(elementos ?? []);
  return (
    <Modal animationType="slide" onRequestClose={onCerrar} presentationStyle="fullScreen" visible={meta !== null}>
      <SafeAreaProvider>
        <SafeAreaView style={estilos.raiz}>
          <View style={estilos.cabecera}>
            <Pressable accessibilityLabel={t('metas.elementos.listo')} accessibilityRole="button" hitSlop={10} onPress={onCerrar} style={estilos.cerrar}><X color={C.texto} size={22} /></Pressable>
            <View style={{ flex: 1 }}>
              <Texto style={estilos.ayuda}>{t('metas.elementos.titulo')}</Texto>
              <Texto accessibilityRole="header" numberOfLines={1} style={estilos.titulo}>{meta?.titulo ?? ''}</Texto>
            </View>
          </View>
          <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
            {error ? <Texto style={[estilos.ayuda, { color: C.error }]}>{t('metas.elementos.error')}</Texto> : null}
            {!error && elementos === undefined ? <Texto style={estilos.ayuda}>{t('metas.elementos.cargando')}</Texto> : null}
            {elementos !== undefined && grupos.length === 0 ? <Texto style={estilos.ayuda}>{t('metas.elementos.vacio')}</Texto> : null}
            {meta ? grupos.map((grupo) => (
              <View key={grupo.tipo} style={{ gap: 6 }}>
                <Texto style={estilos.grupo}>{t(`metas.elementos.tipo.${grupo.tipo}`)}</Texto>
                {grupo.elementos.map((elemento) => {
                  const dentro = elemento.metaId === meta.id;
                  const enOtra = elemento.metaId !== null && !dentro;
                  const ocupado = elementoEnCursoId === elemento.id;
                  return (
                    <Pressable
                      accessibilityLabel={t(dentro ? 'metas.elementos.quitar' : 'metas.elementos.agregar', { titulo: elemento.titulo })}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: dentro, disabled: ocupado }}
                      disabled={ocupado}
                      key={`${elemento.tipo}-${elemento.id}`}
                      onPress={() => { hapticSeguro('seleccion'); onAlternar(elemento, meta); }}
                    >
                      <MasterGlass style={[estilos.fila, ocupado && { opacity: 0.5 }]}>
                        <View style={[estilos.casilla, dentro ? { backgroundColor: color, borderColor: color } : null]}>
                          {dentro ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : <Plus color={C.tenue} size={14} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Texto numberOfLines={1} style={estilos.filaTitulo}>{elemento.titulo}</Texto>
                          {enOtra ? <Texto style={estilos.ayuda}>{t('metas.elementos.enOtraMeta')}</Texto> : null}
                        </View>
                      </MasterGlass>
                    </Pressable>
                  );
                })}
              </View>
            )) : null}
          </ScrollView>
          <View style={estilos.pie}><Boton color={color} onPress={onCerrar} variante="sendero">{t('metas.elementos.listo')}</Boton></View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { backgroundColor: '#F6F3FB', flex: 1 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  cerrar: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 20 },
  contenido: { gap: 16, padding: 20, paddingBottom: 30 },
  grupo: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 11, letterSpacing: 0.4, marginBottom: 2, textTransform: 'uppercase' },
  elemento: { color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 19 },
  ayuda: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  fila: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 11, padding: 12 },
  casilla: { alignItems: 'center', borderColor: C.borde, borderRadius: 13, borderWidth: 2, height: 26, justifyContent: 'center', width: 26 },
  filaTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  pie: { paddingBottom: 12, paddingHorizontal: 20, paddingTop: 8 },
});
