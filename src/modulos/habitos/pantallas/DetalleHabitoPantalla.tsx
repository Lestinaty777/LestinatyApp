import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Archive, ArrowLeft, Pencil, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HojaDeslizante, MasterButton, MasterGlass, MasterIcon, MasterProgressbar, Texto } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { EditarHabitoFormulario } from '../componentes/EditarHabitoFormulario';
import { normalizarEdicionHabito } from '../gestionDetalleHabito';
import { archivarHabito, obtenerDetalleHabito } from '../habitos.servicio';
import { obtenerAssetsPaqueteHabito } from '../paqueteVisual.assets';
import { TonoDelHabito } from '../componentes/TonoDelHabito';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function DetalleHabitoPantalla({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const { t } = useTranslation();
  const detalle = useQuery({ queryKey: ['habitos', 'detalle', id], queryFn: () => obtenerDetalleHabito(id) });
  const cliente = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editando, setEditando] = useState(false);

  const invalidarHabitos = () => {
    ['panel', 'activos', 'detalles-hoy', 'mejor-racha'].forEach((clave) => {
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
          <Texto>{detalle.isLoading ? t('habitos.detalle.cargando') : t('habitos.detalle.errorCarga')}</Texto>
        </View>
      </HojaDeslizante>
    );
  }

  const datos = detalle.data;
  const habito = datos.habito;
  const porcentaje = Math.min(100, Math.round((habito.valorHoy * 100) / habito.meta));
  const assets = obtenerAssetsPaqueteHabito(habito.paqueteId, datos.nivel);
  const dias = (t('habitos.detalle.dias', { returnObjects: true }) as string[]) || DIAS;

  return (
    <TonoDelHabito colorPaquete={habito.color} paqueteId={habito.paqueteId}>
      <HojaDeslizante alturaFija={editando} alturaMaxima={0.96} onCerrar={onCerrar}>
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
            <Pressable accessibilityLabel={t('habitos.detalle.volver')} onPress={onCerrar}>
              <ArrowLeft color="#1A1335" size={23} />
            </Pressable>
            <Texto style={s.navText}>{t('habitos.detalle.navTitulo')}</Texto>
            {/* navigate, no push: esta pantalla puede abrirse desde fuera del Tabs (la ruta raíz
                /habitos/[id], o inline desde /habitos) — con push(), '/senderos' se apilaba en el
                Stack raíz en vez de enfocar la pestaña Senderos ya montada, así que la barra de
                navegación se quedaba marcando la pestaña de origen (p. ej. "Inicio") aunque la
                pantalla visible ya fuera Senderos. navigate() sí reutiliza y enfoca la pestaña
                existente, dejando la barra sincronizada con lo que se ve en pantalla. */}
            <Pressable accessibilityLabel={t('habitos.detalle.verSendero')} onPress={() => router.navigate({ pathname: '/senderos', params: { habitoId: id } })}>
              <Sparkles color={habito.color} size={22} />
            </Pressable>
          </View>

          {editando ? (
            <EditarHabitoFormulario
              colorHabito={habito.color}
              edicionInicial={normalizarEdicionHabito(datos)}
              habitoId={id}
              onCancelar={() => setEditando(false)}
              onGuardado={() => { setEditando(false); invalidarHabitos(); }}
            />
          ) : (
            <>
              <MasterGlass style={s.hero}>
                <View style={s.heroTexto}>
                  <MasterIcon alTema name={habito.iconoLucide} size={34} />
                  <Texto style={s.kicker}>{t('habitos.detalle.nivel', { nivel: datos.nivel })}</Texto>
                  <Texto style={s.title}>{habito.titulo}</Texto>
                  <Texto style={s.sub}>{habito.descripcion || t('habitos.detalle.descripcionPorDefecto')}</Texto>
                </View>
                <Image resizeMode="contain" source={assets.arbolPrincipal} style={s.tree} />
              </MasterGlass>

              <MasterGlass style={s.card}>
                <View style={s.row}>
                  <View>
                    <Texto style={s.kicker}>{t('habitos.detalle.progresoHoy')}</Texto>
                    <Texto style={s.value}>{habito.valorHoy} / {habito.meta} {habito.unidad ?? ''}</Texto>
                  </View>
                  <Texto style={[s.percent, { color: habito.color }]}>{porcentaje}%</Texto>
                </View>
                <MasterProgressbar colorBase={habito.color} porcentaje={porcentaje} />
              </MasterGlass>

              <MasterGlass style={s.card}>
                <View style={s.programacionTitulo}>
                  <MasterIcon alTema name="calendario" size={20} />
                  <Texto style={s.value}>{t('habitos.detalle.programacion')}</Texto>
                </View>
                <Texto style={s.sub}>{textoProgramacion(datos.programacion, t)}</Texto>
                {datos.programacion.frecuencia === 'dias_semana' && (
                  <View style={s.days}>
                    {dias.map((dia, indice) => {
                      const activo = datos.programacion.diasSemana.includes(indice + 1);
                      return (
                        <View key={indice} style={[s.day, activo && { backgroundColor: habito.color }]}>
                          <Texto style={{ color: activo ? '#fff' : '#777' }}>{dia}</Texto>
                        </View>
                      );
                    })}
                  </View>
                )}
              </MasterGlass>

              <View style={s.stats}>
                <Stat icono="racha" etiqueta={t('habitos.detalle.racha')} valor={t('habitos.detalle.rachaValor', { dias: datos.rachaActual })} />
                <Stat icono="trofeo" etiqueta={t('habitos.detalle.semana')} valor={`${datos.semana.completados}/${datos.semana.programados}`} />
              </View>

              <MasterButton
                color={habito.color}
                iconoIzquierda={Pencil}
                onPress={() => setEditando(true)}
                style={s.botonEditar}
              >
                {t('habitos.detalle.botonEditar')}
              </MasterButton>

              <Pressable
                accessibilityLabel={t('habitos.detalle.botonArchivar')}
                style={s.archive}
                onPress={() => Alert.alert(
                  t('habitos.detalle.alertaArchivarTitulo'),
                  t('habitos.detalle.alertaArchivarMensaje'),
                  [
                    { text: t('habitos.detalle.cancelar'), style: 'cancel' },
                    { text: t('habitos.detalle.botonArchivar'), style: 'destructive', onPress: () => archivar.mutate(id) },
                  ],
                )}
              >
                <Archive color="#A53A4C" size={18} />
                <Texto style={s.archiveText}>{t('habitos.detalle.botonArchivar')}</Texto>
              </Pressable>
            </>
          )}
        </ScrollView>
      </HojaDeslizante>
    </TonoDelHabito>
  );
}

function textoProgramacion(programacion: { frecuencia: string; vecesPorSemana: number | null }, t: (key: string, opts?: any) => string) {
  if (programacion.frecuencia === 'diaria') return t('habitos.detalle.frecuenciaDiaria');
  if (programacion.frecuencia === 'veces_semana') return t('habitos.detalle.frecuenciaVecesSemana', { veces: programacion.vecesPorSemana ?? 0 });
  return t('habitos.detalle.frecuenciaDiasSeleccionados');
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
  navText: { color: '#746D86', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  hero: { borderRadius: 24, flexDirection: 'row', minHeight: 170, overflow: 'hidden', padding: 18 },
  heroTexto: { flex: 1 },
  kicker: { color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 12, marginTop: 7 },
  title: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 25, lineHeight: 30 },
  sub: { color: '#716B83', fontSize: 12, lineHeight: 17, marginTop: 6 },
  tree: { height: 175, width: 150 },
  card: { borderRadius: 22, padding: 16 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  programacionTitulo: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  value: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  percent: { fontFamily: 'Montserrat-Bold', fontSize: 25, lineHeight: 30 },
  days: { flexDirection: 'row', gap: 7, marginTop: 13 },
  day: { alignItems: 'center', backgroundColor: '#F0ECF5', borderRadius: 11, height: 31, justifyContent: 'center', width: 31 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { alignItems: 'center', borderRadius: 20, flex: 1, padding: 13 },
  botonEditar: { width: '100%' },
  archive: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14 },
  archiveText: { color: '#A53A4C', fontFamily: 'Montserrat-Bold' },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 300 },
});
