import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterCircularProgressBar, MasterGlass, Rebote, Texto } from '../../../diseno';
import { nombreArea } from '../../areas/areas.mapper';
import type { AreaVida } from '../../areas/areas.tipos';
import { balanceDeAreas } from '../metas.logica';
import { progresoPlazoMeta } from '../metas.mapper';
import type { MetaVida } from '../metas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', apagado: '#E4DDF0' };

// Widget del encabezado de Metas: responde "¿cuánto me falta?". Con alguna
// meta activa con plazo, muestra la que vence antes: un anillo que se llena y
// los días que quedan; al tocarlo se abre esa meta. Sin metas con plazo cambia
// a un balance de áreas: un punto por área, encendido si tiene una meta activa.
export function WidgetCuentaRegresiva({ areas, meta, metas, onAbrir }: {
  areas: readonly AreaVida[];
  /** La meta activa con plazo a la que menos días le quedan; null si ninguna tiene plazo. */
  meta: MetaVida | null;
  metas: readonly MetaVida[];
  onAbrir: (meta: MetaVida) => void;
}) {
  const { t } = useTranslation();
  const plazo = meta ? progresoPlazoMeta(meta) : null;

  if (meta && plazo) {
    const restan = meta.diasRestantes ?? 0;
    return (
      <Rebote accessibilityLabel={t('metas.widget.accesible', { count: restan, titulo: meta.titulo })} onPress={() => onAbrir(meta)}>
        <MasterGlass style={estilos.tarjeta}>
          <Texto style={estilos.etiqueta}>{t('metas.widget.etiqueta')}</Texto>
          <View style={estilos.anilloFila}>
            <MasterCircularProgressBar grosor={8} porcentaje={plazo.porcentaje} tamano={78}>
              <Texto style={estilos.numero}>{restan}</Texto>
              <Texto style={estilos.unidad}>{t('metas.widget.dias', { count: restan })}</Texto>
            </MasterCircularProgressBar>
          </View>
          <View style={estilos.pie}>
            {meta.color ? <View style={[estilos.punto, { backgroundColor: meta.color }]} /> : null}
            <Texto numberOfLines={1} style={estilos.titulo}>{meta.titulo}</Texto>
          </View>
        </MasterGlass>
      </Rebote>
    );
  }

  const balance = balanceDeAreas(areas, metas);
  const conMetas = balance.filter((punto) => punto.activa).length;
  return (
    <MasterGlass style={estilos.tarjeta}>
      <Texto style={estilos.etiqueta}>{t('metas.widget.balance')}</Texto>
      <View style={estilos.balance}>
        {areas.map((area) => {
          const activa = balance.find((punto) => punto.id === area.id)?.activa ?? false;
          return (
            <View
              accessibilityLabel={t(activa ? 'metas.widget.areaConMeta' : 'metas.widget.areaSinMeta', { area: nombreArea(area, t) })}
              accessible
              key={area.id}
              style={[estilos.puntoArea, activa ? { backgroundColor: area.color } : { backgroundColor: C.apagado }]}
            />
          );
        })}
      </View>
      <Texto style={estilos.titulo}>{t('metas.widget.balanceResumen', { activas: conMetas, total: balance.length })}</Texto>
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 18, gap: 8, padding: 10 },
  etiqueta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12 },
  anilloFila: { alignItems: 'center' },
  numero: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 22, lineHeight: 25 },
  unidad: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12 },
  pie: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  punto: { borderRadius: 5, height: 10, width: 10 },
  titulo: { color: C.texto, flexShrink: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 15 },
  balance: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 6 },
  puntoArea: { borderRadius: 9, height: 18, width: 18 },
});
