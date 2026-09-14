import { Bell, BellOff, ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { MasterAnimation, MasterGlass, MasterIconBg, Rebote, Texto } from '../../../diseno';
import { HorizonTipRecordatorios } from './HorizonTipRecordatorios';
import { buscarIconoHabito } from '../iconosHabitos';
import type { PlanHabitoResumen } from '../tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

// Lista pura (sin header ni pantalla propia), igual patrón que
// ListaProgresionHabitos: la usa tanto RecordatoriosHabitosPantalla (ruta
// standalone, deep-link) como HabitosPantalla (incrustada).
export function ListaRecordatoriosHabitos({ isError, isLoading, onReintentar, onSeleccionar, planes }: {
  isError: boolean;
  isLoading: boolean;
  onReintentar: () => void;
  onSeleccionar: (id: string) => void;
  planes: PlanHabitoResumen[];
}) {
  if (isLoading) return <Texto style={s.estado}>Cargando recordatorios…</Texto>;
  if (isError) return <Pressable onPress={onReintentar}><Texto style={s.error}>No pudimos cargar tus recordatorios. Toca para reintentar.</Texto></Pressable>;
  if (planes.length === 0) return <><HorizonTipRecordatorios /><Texto style={s.estado}>Crea un hábito para configurar su recordatorio.</Texto></>;

  return (
    <MasterAnimation duracion={280}>
      {planes.map((plan) => {
        const icono = buscarIconoHabito(plan.iconoLucide);
        return (
          <Rebote accessibilityLabel={plan.titulo} estilo={s.fila} key={plan.id} onPress={() => onSeleccionar(plan.id)}>
            <MasterGlass style={s.filaGlass}>
              <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={plan.color} size={22} />}</MasterIconBg>
              <Texto numberOfLines={1} style={s.filaTitulo}>{plan.titulo}</Texto>
              {plan.recordatorioActivo && plan.horaRecordatorio ? (
                <View style={[s.horaPill, { backgroundColor: `${plan.color}18` }]}><Bell color={plan.color} size={13} /><Texto style={[s.horaPillTexto, { color: plan.color }]}>{plan.horaRecordatorio.slice(0, 5)}</Texto></View>
              ) : (
                <View style={s.sinRecordatorio}><BellOff color={C.tenue} size={13} /><Texto style={s.sinRecordatorioTexto}>Sin recordatorio</Texto></View>
              )}
              <ChevronRight color={C.tenue} size={18} />
            </MasterGlass>
          </Rebote>
        );
      })}
      <HorizonTipRecordatorios />
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
