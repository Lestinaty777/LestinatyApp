import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { nombreArea } from '../../areas/areas.mapper';
import { CLAVE_METAS, obtenerMetas } from '../metas.servicio';

// Elegir a qué meta pertenece lo que se está creando (opcional). Si la
// persona aún no tiene metas activas —o la lectura falla— no se muestra nada:
// el asistente queda igual que antes en vez de enseñar un bloque vacío.
export function SelectorMeta({ color, onCambiar, valor }: {
  /** Acento del módulo, para la opción elegida. */
  color: string;
  onCambiar: (metaId: string | null) => void;
  valor: string | null;
}) {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: CLAVE_METAS, queryFn: obtenerMetas });
  const metas = (data ?? []).filter((meta) => meta.estado === 'activa');
  if (metas.length === 0) return null;

  const opcion = (clave: string | null, etiqueta: string, colorArea: string | null, accesible: string) => {
    const activa = clave === valor;
    return (
      <Pressable
        accessibilityLabel={accesible}
        accessibilityRole="radio"
        accessibilityState={{ selected: activa }}
        hitSlop={4}
        key={clave ?? 'sin-meta'}
        onPress={() => { if (!activa) { hapticSeguro('seleccion'); onCambiar(clave); } }}
        style={[estilos.opcion, activa ? { backgroundColor: color, borderColor: color } : estilos.opcionInactiva]}
      >
        {colorArea ? <View style={[estilos.punto, { backgroundColor: colorArea }]} /> : null}
        <Texto numberOfLines={1} style={[estilos.texto, activa && estilos.textoActivo]}>{etiqueta}</Texto>
      </Pressable>
    );
  };

  return (
    <View style={estilos.raiz}>
      <Texto style={estilos.titulo}>{t('metas.elegir')}</Texto>
      <View accessibilityRole="radiogroup" style={estilos.opciones}>
        {opcion(null, t('metas.sinMeta'), null, t('metas.sinMeta'))}
        {metas.map((meta) => opcion(
          meta.id,
          meta.titulo,
          meta.area?.color ?? meta.color,
          meta.area ? `${meta.titulo}, ${nombreArea(meta.area, t)}` : meta.titulo,
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 8 },
  titulo: { color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  opcion: { alignItems: 'center', borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 6, maxWidth: '100%', minHeight: 32, paddingHorizontal: 11, paddingVertical: 5 },
  opcionInactiva: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.85)' },
  punto: { borderRadius: 5, height: 10, width: 10 },
  texto: { color: '#4B4660', flexShrink: 1, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  textoActivo: { color: '#FFFFFF' },
});
