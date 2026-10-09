import { Archive } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Boton, MasterGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { nombreArea } from '../../areas/areas.mapper';
import { COLORES_AREA_PROPIA, MAX_AREAS_PROPIAS, type AreaVida, type CrearAreaInput } from '../../areas/areas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', campo: '#FFFFFF', borde: '#E4DDF0', error: '#DC2626' };
/** Las áreas propias no eligen ícono todavía: llevan uno neutro. */
const ICONO_AREA_PROPIA = 'Circle';

export type ErrorCrearArea = 'duplicada' | 'otro' | null;

// Pestaña "Áreas": las siete del sistema y las propias, con cuántas metas tiene
// cada una, y un formulario corto para crear una propia (nombre y color).
export function ListaAreas({ areas, color, conteos, creando, error, onArchivar, onCrear }: {
  areas: readonly AreaVida[];
  color: string;
  /** Metas no archivadas por id de área. */
  conteos: ReadonlyMap<string | null, number>;
  creando: boolean;
  error: ErrorCrearArea;
  onArchivar: (area: AreaVida) => void;
  /** Devuelve true si se creó (para limpiar el formulario). */
  onCrear: (input: CrearAreaInput) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [colorElegido, setColorElegido] = useState<string>(COLORES_AREA_PROPIA[0]);
  const propias = areas.filter((area) => !area.esDelSistema).length;
  const llena = propias >= MAX_AREAS_PROPIAS;

  function confirmarArchivar(area: AreaVida) {
    Alert.alert(t('areas.lista.archivarTitulo', { nombre: area.nombre }), t('areas.lista.archivarMensaje'), [
      { style: 'cancel', text: t('areas.lista.cancelar') },
      { onPress: () => onArchivar(area), style: 'destructive', text: t('areas.lista.archivar', { nombre: area.nombre }) },
    ]);
  }

  async function crear() {
    if (nombre.trim().length === 0) return;
    const creada = await onCrear({ nombre: nombre.trim(), color: colorElegido, iconoLucide: ICONO_AREA_PROPIA });
    if (creada) { hapticSeguro('confirmacion'); setNombre(''); }
  }

  return (
    <View style={{ gap: 10 }}>
      <Texto style={estilos.ayuda}>{t('areas.lista.descripcion')}</Texto>
      {areas.map((area) => {
        const nombreVisible = nombreArea(area, t);
        return (
          <MasterGlass key={area.id} style={estilos.fila}>
            <View style={[estilos.punto, { backgroundColor: area.color }]} />
            <View style={{ flex: 1 }}>
              <Texto numberOfLines={1} style={estilos.nombre}>{nombreVisible}</Texto>
              <Texto style={estilos.ayuda}>
                {t('areas.lista.metas', { count: conteos.get(area.id) ?? 0 })}{area.esDelSistema ? '' : ` · ${t('areas.lista.propia')}`}
              </Texto>
            </View>
            {area.esDelSistema ? null : (
              <Pressable accessibilityLabel={t('areas.lista.archivar', { nombre: nombreVisible })} accessibilityRole="button" hitSlop={10} onPress={() => confirmarArchivar(area)} style={estilos.archivar}>
                <Archive color={C.tenue} size={18} />
              </Pressable>
            )}
          </MasterGlass>
        );
      })}

      <MasterGlass style={estilos.formulario}>
        <Texto style={estilos.nombre}>{t('areas.lista.nueva')}</Texto>
        {llena ? <Texto style={estilos.ayuda}>{t('areas.lista.limite')}</Texto> : (
          <>
            <TextInput
              accessibilityLabel={t('areas.lista.nombre')}
              maxFontSizeMultiplier={1.3}
              maxLength={40}
              onChangeText={setNombre}
              placeholder={t('areas.lista.nombre')}
              placeholderTextColor={C.tenue}
              style={estilos.campo}
              value={nombre}
            />
            <View accessibilityRole="radiogroup" style={estilos.colores}>
              {COLORES_AREA_PROPIA.map((opcion, indice) => {
                const activo = opcion === colorElegido;
                return (
                  <Pressable
                    accessibilityLabel={t('areas.lista.color', { n: indice + 1 })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: activo }}
                    hitSlop={4}
                    key={opcion}
                    onPress={() => { hapticSeguro('seleccion'); setColorElegido(opcion); }}
                    style={[estilos.colorAro, activo && { borderColor: C.texto }]}
                  >
                    <View style={[estilos.colorRelleno, { backgroundColor: opcion }]} />
                  </Pressable>
                );
              })}
            </View>
            {error ? <Texto accessibilityLiveRegion="polite" style={estilos.error}>{t(error === 'duplicada' ? 'areas.error.duplicada' : 'areas.lista.errorCrear')}</Texto> : null}
            <Boton color={color} disabled={creando || nombre.trim().length === 0} onPress={() => void crear()} variante="sendero">
              {creando ? t('areas.lista.creando') : t('areas.lista.crear')}
            </Boton>
          </>
        )}
      </MasterGlass>
    </View>
  );
}

const estilos = StyleSheet.create({
  ayuda: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  fila: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 11, padding: 12 },
  punto: { borderRadius: 8, height: 16, width: 16 },
  nombre: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  archivar: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  formulario: { borderRadius: 18, gap: 10, marginTop: 6, padding: 13 },
  campo: { backgroundColor: C.campo, borderColor: C.borde, borderRadius: 14, borderWidth: 1.5, color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 15, minHeight: 46, paddingHorizontal: 14, paddingVertical: 9 },
  colores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorAro: { alignItems: 'center', borderColor: 'transparent', borderRadius: 17, borderWidth: 2, height: 34, justifyContent: 'center', width: 34 },
  colorRelleno: { borderRadius: 12, height: 24, width: 24 },
  error: { color: C.error, fontFamily: 'Montserrat-Medium', fontSize: 12 },
});
