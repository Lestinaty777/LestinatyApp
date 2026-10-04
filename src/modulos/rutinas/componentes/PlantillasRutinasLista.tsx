import { ChevronRight, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Rebote, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { PLANTILLAS_RUTINAS, type PlantillaRutina } from '../plantillasRutinas';

const C = { texto: '#1A1335', tenue: '#7B7494' };

export function PlantillasRutinasLista({ color, onElegir }: { color: string; onElegir: (plantilla: PlantillaRutina) => void }) {
  const { t } = useTranslation();
  return (
    <View>
      <Texto style={estilos.descripcion}>{t('rutinas.plantillas.descripcion')}</Texto>
      {PLANTILLAS_RUTINAS.map((plantilla) => {
        const icono = buscarIconoHabito(plantilla.iconoId);
        return (
          <Rebote accessibilityLabel={`${t('rutinas.plantillas.usar')}: ${plantilla.titulo}`} estilo={estilos.fila} key={plantilla.id} onPress={() => onElegir(plantilla)}>
            <MasterGlass style={estilos.tarjeta}>
              <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={color} size={22} />}</MasterIconBg>
              <View style={{ flex: 1 }}>
                <Texto numberOfLines={1} style={estilos.titulo}>{plantilla.titulo}</Texto>
                <Texto numberOfLines={2} style={estilos.meta}>{plantilla.descripcion} · {t('rutinas.tarjeta.pasos', { count: plantilla.pasos.length })}</Texto>
              </View>
              <ChevronRight color={C.tenue} size={18} />
            </MasterGlass>
          </Rebote>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  descripcion: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  fila: { marginBottom: 10 },
  tarjeta: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
});
