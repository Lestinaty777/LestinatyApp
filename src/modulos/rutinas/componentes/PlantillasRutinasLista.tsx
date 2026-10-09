import { ChevronRight, Lock, Sparkles } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Rebote, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { PlantillaRutina } from '../plantillasRutinas';

const C = { texto: '#1A1335', tenue: '#7B7494', precio: '#6D28D9' };

export function PlantillasRutinasLista({ color, error, onElegir, onPrevisualizar, onReintentar, plantillas }: {
  color: string;
  error: boolean;
  /** Plantilla ya desbloqueada: abre el asistente con sus pasos. */
  onElegir: (plantilla: PlantillaRutina) => void;
  /** Plantilla bloqueada: muestra el detalle y la opción de comprarla. */
  onPrevisualizar: (plantilla: PlantillaRutina) => void;
  onReintentar: () => void;
  /** undefined mientras carga. */
  plantillas: readonly PlantillaRutina[] | undefined;
}) {
  const { t } = useTranslation();
  if (error) return <Pressable accessibilityRole="button" onPress={onReintentar}><Texto style={estilos.error}>{t('rutinas.plantillas.errorCargar')}</Texto></Pressable>;
  if (!plantillas) return <Texto style={estilos.vacio}>{t('rutinas.pantalla.cargando')}</Texto>;
  if (plantillas.length === 0) return <Texto style={estilos.vacio}>{t('rutinas.plantillas.vacio')}</Texto>;

  return (
    <View>
      <Texto style={estilos.descripcion}>{t('rutinas.plantillas.descripcion')}</Texto>
      {plantillas.map((plantilla) => {
        const icono = buscarIconoHabito(plantilla.iconoId);
        const bloqueada = !plantilla.desbloqueada;
        const detalle = `${t('rutinas.tarjeta.pasos', { count: plantilla.numPasos })}${plantilla.duracionMin > 0 ? ` · ${t('rutinas.plantillas.minutos', { count: plantilla.duracionMin })}` : ''}`;
        return (
          <Rebote
            accessibilityLabel={bloqueada ? `${plantilla.titulo}: ${t('rutinas.plantillas.precioGemas', { count: plantilla.precioGemas })}` : `${t('rutinas.plantillas.usar')}: ${plantilla.titulo}`}
            estilo={estilos.fila}
            key={plantilla.id}
            onPress={() => (bloqueada ? onPrevisualizar(plantilla) : onElegir(plantilla))}
          >
            <MasterGlass style={estilos.tarjeta}>
              <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={color} size={22} />}</MasterIconBg>
              <View style={{ flex: 1 }}>
                <Texto numberOfLines={1} style={estilos.titulo}>{plantilla.titulo}</Texto>
                <Texto numberOfLines={2} style={estilos.meta}>{plantilla.descripcion} · {detalle}</Texto>
              </View>
              {bloqueada ? (
                <View style={estilos.precio}>
                  <Lock color={C.tenue} size={13} />
                  <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={estilos.gema} />
                  <Texto style={estilos.precioTexto}>{plantilla.precioGemas}</Texto>
                </View>
              ) : <ChevronRight color={C.tenue} size={18} />}
            </MasterGlass>
          </Rebote>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  descripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  vacio: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 18, textAlign: 'center' },
  fila: { marginBottom: 10 },
  tarjeta: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
  precio: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  gema: { height: 20, resizeMode: 'contain', width: 20 },
  precioTexto: { color: C.precio, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
});
