import { Bell, BellOff, ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterAnimation, MasterGlass, MasterIconBg, Rebote, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { PlanTareaResumen } from '../tareas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494' };
const COLOR_DEFECTO = '#1A1335';

// Espejo de ListaRecordatoriosHabitos.tsx, sin HorizonTipRecordatorios (ese
// tip promueve Horizon/widgets, exclusivos de Hábitos — Tareas no lo ofrece).
export function ListaRecordatoriosTareas({ isError, isLoading, onReintentar, onSeleccionar, planes }: {
  isError: boolean;
  isLoading: boolean;
  onReintentar: () => void;
  onSeleccionar: (id: string) => void;
  planes: PlanTareaResumen[];
}) {
  const { t } = useTranslation();
  if (isLoading) return <Texto style={s.estado}>{t('tareas.pantallaCompleta.remindersLoading')}</Texto>;
  if (isError) return <Pressable onPress={onReintentar}><Texto style={s.error}>{t('tareas.pantallaCompleta.remindersError')}</Texto></Pressable>;
  if (planes.length === 0) return <Texto style={s.estado}>{t('tareas.pantallaCompleta.noRemindersDescription')}</Texto>;

  return (
    <MasterAnimation duracion={280}>
      {planes.map((plan) => {
        const icono = buscarIconoHabito(plan.iconoLucide);
        const color = plan.color ?? COLOR_DEFECTO;
        return (
          <Rebote accessibilityLabel={plan.titulo} estilo={s.fila} key={plan.id} onPress={() => onSeleccionar(plan.id)}>
            <MasterGlass style={s.filaGlass}>
              <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={color} size={22} />}</MasterIconBg>
              <Texto numberOfLines={1} style={s.filaTitulo}>{plan.titulo}</Texto>
              {plan.recordatorioActivo && plan.horaRecordatorio ? (
                <View style={[s.horaPill, { backgroundColor: `${color}18` }]}><Bell color={color} size={13} /><Texto style={[s.horaPillTexto, { color }]}>{plan.horaRecordatorio.slice(0, 5)}</Texto></View>
              ) : (
                <View style={s.sinRecordatorio}><BellOff color={C.tenue} size={13} /><Texto style={s.sinRecordatorioTexto}>{t('tareas.pantallaCompleta.noReminder')}</Texto></View>
              )}
              <ChevronRight color={C.tenue} size={18} />
            </MasterGlass>
          </Rebote>
        );
      })}
    </MasterAnimation>
  );
}

const s = StyleSheet.create({
  estado: { color: C.tenue, paddingVertical: 18, textAlign: 'center' },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  fila: { marginBottom: 10 },
  filaGlass: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 },
  filaTitulo: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  horaPill: { alignItems: 'center', borderRadius: 99, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 5 },
  horaPillTexto: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  sinRecordatorio: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  sinRecordatorioTexto: { color: C.tenue, fontSize: 11 },
});
