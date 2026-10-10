import { Check, ChevronDown, ChevronUp, Pause } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterProgressbar, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { nombreArea } from '../../areas/areas.mapper';
import { progresoPlazoMeta } from '../metas.mapper';
import type { MetaVida } from '../metas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', borde: '#E4DDF0', peligro: '#DC2626' };

export type AccionMeta = 'lograr' | 'pausar' | 'reanudar' | 'reabrir' | 'editar' | 'archivar' | 'contenido';

/** Acciones que tiene sentido ofrecer según el estado de la meta. */
export function accionesDeMeta(estado: MetaVida['estado']): AccionMeta[] {
  if (estado === 'activa') return ['lograr', 'contenido', 'editar', 'pausar', 'archivar'];
  if (estado === 'pausada') return ['reanudar', 'contenido', 'editar', 'archivar'];
  if (estado === 'lograda') return ['reabrir', 'archivar'];
  return [];
}

// Una meta: área (punto de color + nombre), título, plazo si lo tiene y lo que
// contiene. Al tocarla se abre con sus acciones y, si se pasa, su contenido.
export function TarjetaMeta({ color, contenido, destacada = false, meta, ocupada, onAccion }: {
  /** Acento del módulo. */
  color: string;
  /** Lo que se muestra al abrir la tarjeta, bajo las acciones (p. ej. la lista de lo que contiene). */
  contenido?: ReactNode;
  /** true cuando otra parte de la pantalla (el widget de cuenta regresiva) pidió abrir esta meta: se despliega sola. */
  destacada?: boolean;
  meta: MetaVida;
  /** true mientras se guarda un cambio de esta meta: desactiva las acciones. */
  ocupada: boolean;
  onAccion: (accion: AccionMeta, meta: MetaVida) => void;
}) {
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  useEffect(() => { if (destacada) setAbierta(true); }, [destacada]);
  const plazo = progresoPlazoMeta(meta);
  const { conteos } = meta;
  const partes = [
    conteos.habitos > 0 ? t('metas.tarjeta.habitos', { count: conteos.habitos }) : null,
    conteos.tareas > 0 ? t('metas.tarjeta.tareas', { count: conteos.tareas }) : null,
    conteos.rutinas > 0 ? t('metas.tarjeta.rutinas', { count: conteos.rutinas }) : null,
    conteos.planes > 0 ? t('metas.tarjeta.planes', { count: conteos.planes }) : null,
  ].filter(Boolean);
  const colorArea = meta.color ?? C.tenue;

  return (
    <MasterGlass style={estilos.tarjeta}>
      <Pressable
        accessibilityLabel={meta.titulo}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        onPress={() => { hapticSeguro('seleccion'); setAbierta((actual) => !actual); }}
      >
        <View style={estilos.cabecera}>
          <View style={{ flex: 1 }}>
            <View style={estilos.areaFila}>
              <View style={[estilos.punto, { backgroundColor: colorArea }]} />
              <Texto numberOfLines={1} style={estilos.area}>{meta.area ? nombreArea(meta.area, t) : t('areas.sinArea')}</Texto>
              {meta.estado === 'pausada' ? <View style={estilos.estado}><Pause color={C.tenue} size={10} /><Texto style={estilos.estadoTexto}>{t('metas.tarjeta.pausada')}</Texto></View> : null}
              {meta.estado === 'lograda' ? <View style={estilos.estado}><Check color={color} size={11} strokeWidth={3} /><Texto style={[estilos.estadoTexto, { color }]}>{t('metas.tarjeta.lograda')}</Texto></View> : null}
            </View>
            <Texto numberOfLines={2} style={estilos.titulo}>{meta.titulo}</Texto>
          </View>
          {abierta ? <ChevronUp color={C.tenue} size={20} /> : <ChevronDown color={C.tenue} size={20} />}
        </View>

        {plazo ? (
          <View style={estilos.plazo}>
            <View style={estilos.plazoFila}>
              <Texto style={estilos.meta}>{t('metas.plazo', { dia: plazo.dia, total: plazo.total })}</Texto>
              {meta.estado === 'activa' && meta.diasRestantes !== null ? <Texto style={estilos.meta}>{t('metas.tarjeta.restan', { count: meta.diasRestantes })}</Texto> : null}
            </View>
            <MasterProgressbar altura={8} colorBase={color} porcentaje={plazo.porcentaje} />
          </View>
        ) : null}
        <Texto numberOfLines={2} style={estilos.meta}>{partes.length > 0 ? partes.join(' · ') : t('metas.tarjeta.vacia')}</Texto>
      </Pressable>

      {abierta ? (
        <View style={estilos.detalle}>
          {meta.descripcion ? <Texto style={estilos.descripcion}>{meta.descripcion}</Texto> : null}
          <View style={estilos.acciones}>
            {accionesDeMeta(meta.estado).map((accion) => {
              const principal = accion === 'lograr' || accion === 'reanudar' || accion === 'reabrir';
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: ocupada }}
                  disabled={ocupada}
                  key={accion}
                  onPress={() => { hapticSeguro('seleccion'); onAccion(accion, meta); }}
                  style={[estilos.accion, principal ? { backgroundColor: color, borderColor: color } : estilos.accionSecundaria, ocupada && { opacity: 0.5 }]}
                >
                  <Texto style={[estilos.accionTexto, principal ? { color: '#FFFFFF' } : accion === 'archivar' ? { color: C.peligro } : null]}>{t(`metas.acciones.${accion}`)}</Texto>
                </Pressable>
              );
            })}
          </View>
          {contenido}
        </View>
      ) : null}
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 18, gap: 8, marginBottom: 10, padding: 13 },
  cabecera: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  areaFila: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 2 },
  punto: { borderRadius: 5, height: 10, width: 10 },
  area: { color: C.tenue, flexShrink: 1, fontFamily: 'Montserrat-Bold', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' },
  estado: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  estadoTexto: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 10 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, lineHeight: 21 },
  plazo: { gap: 4, marginBottom: 6, marginTop: 8 },
  plazoFila: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 16 },
  detalle: { borderTopColor: C.borde, borderTopWidth: 1, gap: 10, marginTop: 4, paddingTop: 10 },
  descripcion: { color: C.texto, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  accion: { alignItems: 'center', borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', minHeight: 34, paddingHorizontal: 12, paddingVertical: 6 },
  accionSecundaria: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: C.borde },
  accionTexto: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 12 },
});
