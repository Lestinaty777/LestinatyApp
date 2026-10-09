import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { FranjaConcreta } from '../../../compartido/utilidades/franjas';
import { MasterGlass, MasterIcon, MasterIconBg, MasterProgressbar, Texto, useTonoMaster } from '../../../diseno';
import { usePerfilBasico } from '../../configuracion/usePerfilBasico';
import { MINIMO_REGISTROS_FRANJA, porcentajesFranjas, resumirFranjas } from '../insightsFranjas';
import { CLAVE_INSIGHTS_FRANJAS, obtenerMarcasCompletado } from '../insightsFranjas.servicio';
import { SeccionProgresoDatos } from './SeccionProgresoDatos';

const FRANJAS: readonly FranjaConcreta[] = ['manana', 'tarde', 'noche'];

// Insight "¿en qué franja cumples más?". Autónoma (trae su propia consulta)
// para no engordar InsightsPantalla. Si la lectura falla, no se muestra: es
// un dato extra, no debe romper la pantalla.
export function SeccionFranjaFuerte() {
  const { t } = useTranslation();
  const tono = useTonoMaster();
  const { limitesFranja } = usePerfilBasico();
  const consulta = useQuery({ queryKey: CLAVE_INSIGHTS_FRANJAS, queryFn: () => obtenerMarcasCompletado() });
  if (consulta.isError) return null;

  const resumen = resumirFranjas(consulta.data ?? [], limitesFranja);
  const porcentajes = porcentajesFranjas(resumen);
  const subtitulo = resumen.estado !== 'listo'
    ? t('insights.franjas.sinDestacar')
    : resumen.mejor
      ? t('insights.franjas.mejor', { franja: t(`franjas.${resumen.mejor}`).toLowerCase() })
      : t('insights.franjas.parejo');

  return (
    <MasterGlass style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <MasterIconBg size={32}><MasterIcon alTema name="reloj" size={16} /></MasterIconBg>
        <Texto style={[estilos.titulo, { color: tono.paleta.titulo }]}>{t('insights.franjas.titulo')}</Texto>
      </View>
      <Texto style={[estilos.subtitulo, { color: tono.paleta.suave }]}>{consulta.isLoading ? t('insights.franjas.cargando') : subtitulo}</Texto>
      {consulta.isLoading ? null : resumen.estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('insights.franjas.faltanDatos')} progreso={{ actual: resumen.total, requerido: MINIMO_REGISTROS_FRANJA }} />
      ) : (
        <View style={estilos.filas}>
          {FRANJAS.map((franja) => (
            <View accessibilityLabel={`${t(`franjas.${franja}`)}: ${porcentajes[franja]}%`} accessible key={franja} style={estilos.fila}>
              <Texto style={[estilos.nombre, { color: tono.paleta.titulo }, franja === resumen.mejor && estilos.nombreMejor]}>{t(`franjas.${franja}`)}</Texto>
              <View style={{ flex: 1 }}><MasterProgressbar altura={7} porcentaje={porcentajes[franja]} /></View>
              <Texto style={[estilos.porcentaje, { color: tono.paleta.suave }]}>{porcentajes[franja]}%</Texto>
            </View>
          ))}
        </View>
      )}
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 20, padding: 14 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  titulo: { flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  subtitulo: { fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 16, marginTop: 6 },
  filas: { gap: 8, marginTop: 12 },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  nombre: { fontFamily: 'Montserrat-Medium', fontSize: 12, width: 58 },
  nombreMejor: { fontFamily: 'Montserrat-Bold' },
  porcentaje: { fontFamily: 'Montserrat-Bold', fontSize: 11, minWidth: 30, textAlign: 'right' },
});
