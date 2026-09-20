import { Flame, ListChecks, Repeat2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { HabitosPantalla } from '../../habitos/pantallas/HabitosPantalla';
import { RutinasPantalla } from '../../rutinas/pantallas/RutinasPantalla';

type PestanaSendero = 'habitos' | 'rutinas' | 'tareas';

const PESTANAS: { id: PestanaSendero; Icono: typeof Flame; color: string }[] = [
  { id: 'habitos', Icono: Flame, color: '#22C55E' },
  { id: 'rutinas', Icono: Repeat2, color: '#EF4444' },
  { id: 'tareas', Icono: ListChecks, color: '#EAB308' },
];

// Hub de senderos: un switcher arriba para moverte entre Hábitos, Rutinas y
// Tareas. El mapa voxel (ContenedorMapaSenderos) no vive aquí — es el detalle
// de UN sendero, no el listado. Rutinas y Tareas llegan en próximas rondas.
export function SenderosPantalla() {
  const { t } = useTranslation();
  const [activa, setActiva] = useState<PestanaSendero>('habitos');

  return (
    <View style={s.raiz}>
      <SafeAreaView edges={['top']} style={s.contenedor}>
        <View style={s.switcherContenedor}>
          <RecuadroGlass blur intensity={26} style={s.switcherGlass}>
            <View style={s.switcherFila}>
              {PESTANAS.map((pestana) => {
                const seleccionada = activa === pestana.id;
                return (
                  <Pressable
                    key={pestana.id}
                    onPress={() => { hapticSeguro('seleccion'); setActiva(pestana.id); }}
                    style={[s.pestana, seleccionada && { backgroundColor: `${pestana.color}18` }]}
                  >
                    <pestana.Icono color={seleccionada ? pestana.color : '#9C97AC'} size={17} strokeWidth={2.4} />
                    <Texto style={[s.pestanaTexto, seleccionada && { color: pestana.color }]}>{t(`senderos.pantalla.${pestana.id}`)}</Texto>
                  </Pressable>
                );
              })}
            </View>
          </RecuadroGlass>
        </View>

        {activa === 'habitos' && <HabitosPantalla />}
        {activa === 'rutinas' && <RutinasPantalla />}
        {activa === 'tareas' && <ProximamentePane color="#EAB308" mensaje={t('senderos.pantalla.tasksDescription')} titulo={t('senderos.pantalla.tasksTitle')} />}
      </SafeAreaView>
    </View>
  );
}

function ProximamentePane({ color, mensaje, titulo }: { color: string; mensaje: string; titulo: string }) {
  return (
    <View style={s.proximamente}>
      <RecuadroGlass style={[s.proximamenteTarjeta, { borderColor: `${color}30` }]}>
        <Texto style={[s.proximamenteTitulo, { color }]}>{titulo}</Texto>
        <Texto style={s.proximamenteTexto}>{mensaje}</Texto>
      </RecuadroGlass>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { backgroundColor: '#F3EEFA', flex: 1 },
  contenedor: { flex: 1 },
  switcherContenedor: { marginBottom: 8, marginHorizontal: 20, marginTop: 8 },
  switcherGlass: { borderColor: 'rgba(255,255,255,0.7)', borderRadius: 18, borderWidth: 1 },
  switcherFila: { flexDirection: 'row', gap: 4, padding: 5 },
  pestana: { alignItems: 'center', borderRadius: 13, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  pestanaTexto: { color: '#76736D', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  proximamente: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  proximamenteTarjeta: { borderRadius: 20, borderWidth: 1, padding: 22 },
  proximamenteTitulo: { fontFamily: 'Montserrat-Bold', fontSize: 20, marginBottom: 8 },
  proximamenteTexto: { color: '#7B7494', fontSize: 13, lineHeight: 19 },
});
