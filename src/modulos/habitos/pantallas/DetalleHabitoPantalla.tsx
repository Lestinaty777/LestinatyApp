import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Archive, ArrowLeft, Pencil, Sparkles } from 'lucide-react-native';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HojaDeslizante, MasterButton, MasterGlass, MasterIcon, MasterProgressbar, Texto } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { archivarHabito, obtenerDetalleHabito } from '../habitos.servicio';
import { obtenerAssetsPaqueteHabito } from '../paqueteVisual.assets';
import { TonoDelHabito } from '../componentes/TonoDelHabito';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function DetalleHabitoPantalla({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const detalle = useQuery({ queryKey: ['habitos', 'detalle', id], queryFn: () => obtenerDetalleHabito(id) });
  const cliente = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const invalidarHabitos = () => {
    ['panel', 'activos', 'detalles-hoy', 'cercania-nivel', 'mejor-racha'].forEach((clave) => {
      cliente.invalidateQueries({ queryKey: ['habitos', clave] });
    });
    cliente.invalidateQueries({ queryKey: ['habitos', 'detalle', id] });
  };

  const archivar = useMutation({
    mutationFn: archivarHabito,
    onSuccess: () => {
      invalidarHabitos();
      onCerrar();
    },
  });

  if (!detalle.data) {
    return (
      <HojaDeslizante onCerrar={onCerrar}>
        <View style={s.center}>
          <Texto>{detalle.isLoading ? 'Cargando hábito…' : 'No pudimos abrir este hábito.'}</Texto>
        </View>
      </HojaDeslizante>
    );
  }

  const datos = detalle.data;
  const habito = datos.habito;
  const porcentaje = Math.min(100, Math.round((habito.valorHoy * 100) / habito.meta));
  const assets = obtenerAssetsPaqueteHabito(habito.paqueteId, datos.nivel);

  return (
    <TonoDelHabito colorPaquete={habito.color} paqueteId={habito.paqueteId}>
      <HojaDeslizante alturaMaxima={0.96} onCerrar={onCerrar}>
        <ScrollView
          contentContainerStyle={[s.root, { paddingBottom: insets.bottom + 28 }]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={s.scroll}
        >
          <View pointerEvents="none" style={s.aurora}>
            <AuroraBoreal tema="verde" />
          </View>

          <View style={s.nav}>
            <Pressable onPress={onCerrar}>
              <ArrowLeft color="#1A1335" size={23} />
            </Pressable>
            <Texto style={s.navText}>DETALLE DEL HÁBITO</Texto>
            <Pressable onPress={() => router.push({ pathname: '/senderos', params: { habitoId: id } })}>
              <Sparkles color={habito.color} size={22} />
            </Pressable>
          </View>

          <MasterGlass style={s.hero}>
            <View style={s.heroTexto}>
              <MasterIcon alTema name={habito.iconoLucide} size={34} />
              <Texto style={s.kicker}>NIVEL {datos.nivel}</Texto>
              <Texto style={s.title}>{habito.titulo}</Texto>
              <Texto style={s.sub}>{habito.descripcion || 'Una pequeña acción también hace crecer tu mundo.'}</Texto>
            </View>
            <Image resizeMode="contain" source={assets.arbolPrincipal} style={s.tree} />
          </MasterGlass>

          <MasterGlass style={s.card}>
            <View style={s.row}>
              <View>
                <Texto style={s.kicker}>PROGRESO DE HOY</Texto>
                <Texto style={s.value}>{habito.valorHoy} / {habito.meta} {habito.unidad ?? ''}</Texto>
              </View>
              <Texto style={[s.percent, { color: habito.color }]}>{porcentaje}%</Texto>
            </View>
            <MasterProgressbar colorBase={habito.color} porcentaje={porcentaje} />
          </MasterGlass>

          <MasterGlass style={s.card}>
            <View style={s.programacionTitulo}>
              <MasterIcon alTema name="calendario" size={20} />
              <Texto style={s.value}>Programación</Texto>
            </View>
            <Texto style={s.sub}>{textoProgramacion(datos.programacion)}</Texto>
            {datos.programacion.frecuencia === 'dias_semana' && (
              <View style={s.days}>
                {DIAS.map((dia, indice) => {
                  const activo = datos.programacion.diasSemana.includes(indice + 1);
                  return (
                    <View key={dia} style={[s.day, activo && { backgroundColor: habito.color }]}>
                      <Texto style={{ color: activo ? '#fff' : '#777' }}>{dia}</Texto>
                    </View>
                  );
                })}
              </View>
            )}
          </MasterGlass>

          <View style={s.stats}>
            <Stat icono="racha" etiqueta="Racha" valor={`${datos.rachaActual} días`} />
            <Stat icono="trofeo" etiqueta="Semana" valor={`${datos.semana.completados}/${datos.semana.programados}`} />
          </View>

          <MasterButton
            color={habito.color}
            iconoIzquierda={Pencil}
            onPress={() => Alert.alert('Editar hábito', 'El editor visual se abrirá aquí con la programación actual.')}
            style={s.botonEditar}
          >
            Editar hábito
          </MasterButton>

          <Pressable
            style={s.archive}
            onPress={() => Alert.alert(
              '¿Archivar este hábito?',
              'Dejará de aparecer en Hábitos y Senderos. Tu historial se conservará.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Archivar hábito', style: 'destructive', onPress: () => archivar.mutate(id) },
              ],
            )}
          >
            <Archive color="#A53A4C" size={18} />
            <Texto style={s.archiveText}>Archivar hábito</Texto>
          </Pressable>
        </ScrollView>
      </HojaDeslizante>
    </TonoDelHabito>
  );
}

function textoProgramacion(programacion: { frecuencia: string; vecesPorSemana: number | null }) {
  if (programacion.frecuencia === 'diaria') return 'Todos los días';
  if (programacion.frecuencia === 'veces_semana') return `${programacion.vecesPorSemana ?? 0} veces por semana`;
  return 'Días seleccionados';
}

function Stat({ icono, etiqueta, valor }: { icono: string; etiqueta: string; valor: string }) {
  return (
    <MasterGlass style={s.stat}>
      <MasterIcon alTema name={icono} size={18} />
      <Texto style={s.kicker}>{etiqueta}</Texto>
      <Texto style={s.value}>{valor}</Texto>
    </MasterGlass>
  );
}

const s = StyleSheet.create({
  root: { gap: 14, padding: 18 },
  scroll: { flex: 1 },
  aurora: { height: 180, left: 0, opacity: 0.38, position: 'absolute', right: 0, top: 0 },
  nav: { flexDirection: 'row', justifyContent: 'space-between' },
  navText: { color: '#746D86', fontFamily: 'Montserrat-Bold', fontSize: 10 },
  hero: { borderRadius: 24, flexDirection: 'row', minHeight: 170, overflow: 'hidden', padding: 18 },
  heroTexto: { flex: 1 },
  kicker: { color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 10, marginTop: 7 },
  title: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 25 },
  sub: { color: '#716B83', fontSize: 12, lineHeight: 17, marginTop: 6 },
  tree: { height: 175, width: 150 },
  card: { borderRadius: 22, padding: 16 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  programacionTitulo: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  value: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  percent: { fontFamily: 'Montserrat-Bold', fontSize: 25 },
  days: { flexDirection: 'row', gap: 7, marginTop: 13 },
  day: { alignItems: 'center', backgroundColor: '#F0ECF5', borderRadius: 11, height: 31, justifyContent: 'center', width: 31 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { alignItems: 'center', borderRadius: 20, flex: 1, padding: 13 },
  botonEditar: { width: '100%' },
  archive: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14 },
  archiveText: { color: '#A53A4C', fontFamily: 'Montserrat-Bold' },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 300 },
});
