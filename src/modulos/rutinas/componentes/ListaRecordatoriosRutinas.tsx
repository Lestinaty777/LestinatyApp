import { Bell, BellOff, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Boton, formatoHora12, MasterGlass, MasterIconBg, Rebote, SelectorHora12, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { Rutina } from '../rutinas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494' };
export const HORA_RECORDATORIO_DEFECTO = '08:00';

export function ListaRecordatoriosRutinas({ color, error, guardandoId, onCambiar, rutinas }: {
  color: string;
  error: boolean;
  guardandoId: string | null;
  onCambiar: (rutina: Rutina, cambios: { activo: boolean; hora: string | null }) => void;
  rutinas: readonly Rutina[];
}) {
  const { t } = useTranslation();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [horaEdicion, setHoraEdicion] = useState(HORA_RECORDATORIO_DEFECTO);

  if (rutinas.length === 0) return <Texto style={estilos.vacio}>{t('rutinas.recordatorios.vacio')}</Texto>;

  return (
    <View>
      <Texto style={estilos.aviso}>{t('rutinas.recordatorios.ayuda')}</Texto>
      {error ? <Texto style={estilos.error}>{t('rutinas.recordatorios.errorGuardar')}</Texto> : null}
      {rutinas.map((rutina) => {
        const icono = buscarIconoHabito(rutina.iconoLucide);
        const editando = editandoId === rutina.id;
        const guardando = guardandoId === rutina.id;
        return (
          <MasterGlass key={rutina.id} style={estilos.tarjeta}>
            <View style={estilos.fila}>
              <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={rutina.color} size={22} />}</MasterIconBg>
              <View style={{ flex: 1 }}>
                <Texto numberOfLines={1} style={estilos.titulo}>{rutina.titulo}</Texto>
                {rutina.horaInicio ? (
                  <Rebote accessibilityLabel={formatoHora12(rutina.horaInicio)} onPress={() => { setHoraEdicion(rutina.horaInicio ?? HORA_RECORDATORIO_DEFECTO); setEditandoId(editando ? null : rutina.id); }}>
                    <View style={estilos.horaFila}>
                      {rutina.recordatorioActivo ? <Bell color={color} size={13} /> : <BellOff color={C.tenue} size={13} />}
                      <Texto style={[estilos.hora, { color: rutina.recordatorioActivo ? color : C.tenue }]}>{formatoHora12(rutina.horaInicio)}</Texto>
                    </View>
                  </Rebote>
                ) : (
                  <View style={estilos.horaFila}><BellOff color={C.tenue} size={13} /><Texto style={estilos.meta}>{t('rutinas.recordatorios.sinRecordatorio')}</Texto></View>
                )}
              </View>
              <Switch
                accessibilityLabel={rutina.recordatorioActivo ? t('rutinas.recordatorios.desactivar') : t('rutinas.recordatorios.activar')}
                disabled={guardando}
                onValueChange={(activo) => onCambiar(rutina, { activo, hora: rutina.horaInicio ?? HORA_RECORDATORIO_DEFECTO })}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#D8D3CD', true: color }}
                value={rutina.recordatorioActivo}
              />
            </View>
            {editando ? (
              <View style={estilos.edicion}>
                <SelectorHora12 hora={horaEdicion} onCambiar={setHoraEdicion} />
                <Boton color={color} disabled={guardando} onPress={() => { onCambiar(rutina, { activo: rutina.recordatorioActivo, hora: horaEdicion }); setEditandoId(null); }} variante="sendero">
                  {t('rutinas.recordatorios.guardarHora')}
                </Boton>
              </View>
            ) : null}
          </MasterGlass>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  vacio: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 18, textAlign: 'center' },
  aviso: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 12, marginBottom: 10 },
  tarjeta: { borderRadius: 18, marginBottom: 10, padding: 12 },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  horaFila: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
  hora: { fontFamily: 'Montserrat-Bold', fontSize: 13 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 12 },
  edicion: { gap: 12, marginTop: 12 },
});
