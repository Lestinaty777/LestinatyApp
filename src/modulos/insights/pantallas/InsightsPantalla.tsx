import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, Calendar, Flame, Heart, Link2, TrendingUp, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { obtenerPanelHabitos } from '../../habitos/habitos.servicio';
import type { CategoriaHabitosId, ConexionHabito, EstadoPanelHabitos, HabitoResumen, ImpactoHabito, PatronHabito, RiesgoHabito } from '../../habitos/tipos';

const TARJETAS_MOCK: { Icono: (props: { color: string; size: number }) => ReactNode; detalle: string; titulo: string; valor: string }[] = [
  { Icono: Flame, detalle: 'con Meditar', titulo: 'Racha más larga', valor: '12 días' },
  { Icono: Award, detalle: '92% de cumplimiento', titulo: 'Hábito más consistente', valor: 'Meditar' },
  { Icono: Calendar, detalle: '4/4 hábitos completados', titulo: 'Mejor día de la semana', valor: 'Jueves' },
  { Icono: TrendingUp, detalle: '+0.6 este mes', titulo: 'Nivel promedio', valor: 'Nivel 3.4' },
];

const DIAS_SEMANA_ETIQUETA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ETIQUETAS_SECCION: Record<Exclude<CategoriaHabitosId, 'hoy'>, string> = { conexiones: 'Conexiones', impacto: 'Impacto', patrones: 'Patrones', riesgo: 'Riesgo' };
const SUBTITULOS_SECCION: Record<Exclude<CategoriaHabitosId, 'hoy'>, string> = {
  conexiones: 'Hábitos que se refuerzan entre sí.',
  impacto: 'Efectos medibles en tu rutina.',
  patrones: 'Descubre cuándo tus hábitos funcionan mejor.',
  riesgo: 'Identifica qué necesita atención.',
};
const ICONOS_SECCION = { conexiones: Link2, impacto: Heart, patrones: BarChart3, riesgo: TriangleAlert } as const;
const COLOR_NIVEL_RIESGO: Record<RiesgoHabito['nivel'], string> = { alto: '#DC2626', bajo: '#25884C', medio: '#D97706' };
const ETIQUETA_NIVEL_RIESGO: Record<RiesgoHabito['nivel'], string> = { alto: 'Riesgo alto', bajo: 'Estable', medio: 'Riesgo medio' };

// Íconos chicos en fila: a propósito NO usan MasterIconBg (que trae su propio
// BlurView) — con varias filas en una lista, varios blur simultáneos sí se
// notan en el rendimiento. MasterIconBg se reserva para encabezados y las
// tarjetas grandes, donde hay pocos a la vez.
function IconoHabitoChico({ color, iconoLucide }: { color: string; iconoLucide: string }) {
  const icono = buscarIconoHabito(iconoLucide);
  return (
    <View style={[s.iconoChico, { backgroundColor: `${color}22` }]}>
      {icono ? <Image resizeMode="contain" source={icono.fuente} style={s.iconoChicoImagen} /> : <TrendingUp color={color} size={16} />}
    </View>
  );
}

function EncabezadoSeccion({ categoria }: { categoria: Exclude<CategoriaHabitosId, 'hoy'> }) {
  const Icono = ICONOS_SECCION[categoria];
  return (
    <View style={s.seccionHeader}>
      <MasterIconBg size={40}><Icono color="#145C37" size={19} /></MasterIconBg>
      <View style={{ flex: 1 }}>
        <Texto style={s.seccionTitulo}>{ETIQUETAS_SECCION[categoria]}</Texto>
        <Texto style={s.seccionSubtitulo}>{SUBTITULOS_SECCION[categoria]}</Texto>
      </View>
    </View>
  );
}

function EstadoSeccion({ estado }: { estado: EstadoPanelHabitos }) {
  const texto = estado === 'sin_habitos' ? 'Crea hábitos para desbloquear este análisis.'
    : estado === 'sin_historial' ? 'Registra unos días más para ver algo aquí.'
    : 'Aún estamos observando tus patrones — vuelve en unos días.';
  return <Texto style={s.estadoTexto}>{texto}</Texto>;
}

function SeccionPatrones({ datos, estado }: { datos: PatronHabito[]; estado: EstadoPanelHabitos }) {
  return (
    <MasterGlass style={s.seccion}>
      <EncabezadoSeccion categoria="patrones" />
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.barras}>
          {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
            const patron = datos.find((item) => item.diaSemana === indice + 1);
            const porcentaje = patron?.porcentaje ?? 0;
            return (
              <View key={etiqueta} style={s.barraColumna}>
                <Texto style={s.barraPorcentaje}>{porcentaje}%</Texto>
                <View style={s.barraFondo}>
                  <View style={[s.barraLlena, { height: `${Math.max(4, porcentaje)}%` }]} />
                </View>
                <Texto style={s.barraTexto}>{etiqueta}</Texto>
              </View>
            );
          })}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionRiesgo({ datos, estado }: { datos: RiesgoHabito[]; estado: EstadoPanelHabitos }) {
  return (
    <MasterGlass style={s.seccion}>
      <EncabezadoSeccion categoria="riesgo" />
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.lista}>
          {datos.map((riesgo) => (
            <View key={riesgo.habitoId} style={s.fila}>
              <IconoHabitoChico color={riesgo.color} iconoLucide={riesgo.iconoLucide} />
              <View style={{ flex: 1 }}>
                <Texto numberOfLines={1} style={s.filaTitulo}>{riesgo.titulo}</Texto>
                <Texto style={s.filaDetalle}>Reciente {riesgo.reciente}% · Base {riesgo.base}%</Texto>
              </View>
              <View style={[s.insignia, { backgroundColor: `${COLOR_NIVEL_RIESGO[riesgo.nivel]}1F` }]}>
                <Texto style={[s.insigniaTexto, { color: COLOR_NIVEL_RIESGO[riesgo.nivel] }]}>{ETIQUETA_NIVEL_RIESGO[riesgo.nivel]}</Texto>
              </View>
            </View>
          ))}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionConexiones({ datos, estado, habitosPorId }: { datos: ConexionHabito[]; estado: EstadoPanelHabitos; habitosPorId: Map<string, HabitoResumen> }) {
  return (
    <MasterGlass style={s.seccion}>
      <EncabezadoSeccion categoria="conexiones" />
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.lista}>
          {datos.map((conexion) => {
            const origen = habitosPorId.get(conexion.origenHabitoId);
            const destino = habitosPorId.get(conexion.destinoHabitoId);
            if (!origen || !destino) return null;
            return (
              <View key={`${conexion.origenHabitoId}-${conexion.destinoHabitoId}`} style={s.fila}>
                <IconoHabitoChico color={origen.color} iconoLucide={origen.iconoLucide} />
                <IconoHabitoChico color={destino.color} iconoLucide={destino.iconoLucide} />
                <View style={{ flex: 1 }}>
                  <Texto numberOfLines={1} style={s.filaTitulo}>{origen.titulo} + {destino.titulo}</Texto>
                  <Texto style={s.filaDetalle}>Coinciden {conexion.fuerza}% de las veces</Texto>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </MasterGlass>
  );
}

function SeccionImpacto({ datos, estado, habitosPorId }: { datos: ImpactoHabito[]; estado: EstadoPanelHabitos; habitosPorId: Map<string, HabitoResumen> }) {
  return (
    <MasterGlass style={s.seccion}>
      <EncabezadoSeccion categoria="impacto" />
      {estado !== 'listo' || datos.length === 0 ? <EstadoSeccion estado={estado} /> : (
        <View style={s.lista}>
          {datos.map((impacto) => {
            const origen = habitosPorId.get(impacto.origenHabitoId);
            const destino = habitosPorId.get(impacto.destinoHabitoId);
            if (!origen || !destino) return null;
            const sube = impacto.impacto >= 0;
            return (
              <View key={`${impacto.origenHabitoId}-${impacto.destinoHabitoId}`} style={s.fila}>
                <IconoHabitoChico color={origen.color} iconoLucide={origen.iconoLucide} />
                <View style={{ flex: 1 }}>
                  <Texto numberOfLines={1} style={s.filaTitulo}>Con {origen.titulo} → {destino.titulo}</Texto>
                  <Texto style={s.filaDetalle}>{impacto.conOrigen}% vs {impacto.sinOrigen}% sin hacerlo</Texto>
                </View>
                <View style={[s.insignia, { backgroundColor: sube ? 'rgba(37,136,76,.12)' : 'rgba(220,38,38,.12)' }]}>
                  <Texto style={[s.insigniaTexto, { color: sube ? '#25884C' : '#DC2626' }]}>{sube ? '+' : ''}{impacto.impacto}%</Texto>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </MasterGlass>
  );
}

// Todo mock por ahora — cuando conectemos datos reales, esto se alimenta de
// analitica.ts (patrones/racha/riesgo) que ya existe en el módulo de hábitos.
export function InsightsPantalla() {
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const panel = consulta.data;
  const habitosPorId = new Map((panel?.hoy.datos ?? []).map((habito) => [habito.id, habito]));

  return (
    <SafeAreaView edges={['top']} style={s.raiz}>
      <ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
        <View style={s.encabezado}>
          <MasterIconBg size={56}><TrendingUp color="#145C37" size={26} /></MasterIconBg>
          <View style={s.encabezadoTexto}>
            <Texto style={s.titulo}>Insights</Texto>
            <Texto style={s.subtitulo}>Tu progreso en un vistazo.</Texto>
          </View>
        </View>

        <View style={s.cuadricula}>
          {TARJETAS_MOCK.map(({ Icono, detalle, titulo, valor }) => (
            <MasterGlass key={titulo} style={s.tarjeta}>
              <MasterIconBg size={44}><Icono color="#145C37" size={20} /></MasterIconBg>
              <Texto numberOfLines={1} style={s.tarjetaTitulo}>{titulo}</Texto>
              <Texto numberOfLines={1} style={s.tarjetaValor}>{valor}</Texto>
              <Texto numberOfLines={1} style={s.tarjetaDetalle}>{detalle}</Texto>
            </MasterGlass>
          ))}
        </View>

        {consulta.isLoading && <Texto style={s.estadoTexto}>Cargando tu análisis…</Texto>}
        {consulta.isError && <Texto style={s.estadoTexto}>No pudimos cargar tu análisis.</Texto>}
        {panel && (
          <>
            <SeccionPatrones datos={panel.patrones.datos} estado={panel.patrones.estado} />
            <SeccionRiesgo datos={panel.riesgo.datos} estado={panel.riesgo.estado} />
            <SeccionConexiones datos={panel.conexiones.datos} estado={panel.conexiones.estado} habitosPorId={habitosPorId} />
            <SeccionImpacto datos={panel.impacto.datos} estado={panel.impacto.estado} habitosPorId={habitosPorId} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { backgroundColor: '#EAF8EB', flex: 1 },
  contenido: { gap: 18, padding: 20 },
  encabezado: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  encabezadoTexto: { flex: 1 },
  titulo: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 24 },
  subtitulo: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 13, marginTop: 2 },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarjeta: { borderRadius: 20, gap: 6, padding: 16, width: '47%' },
  tarjetaTitulo: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 11, marginTop: 4 },
  tarjetaValor: { color: '#12331F', fontFamily: 'MontserratAlternates-Bold', fontSize: 18 },
  tarjetaDetalle: { color: '#7C9A85', fontFamily: 'Montserrat-Medium', fontSize: 11 },
  estadoTexto: { color: '#7C9A85', fontFamily: 'Montserrat-Medium', fontSize: 13, paddingVertical: 8, textAlign: 'center' },
  seccion: { borderRadius: 20, gap: 14, padding: 18 },
  seccionHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  seccionTitulo: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 16 },
  seccionSubtitulo: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
  barras: { flexDirection: 'row', gap: 6, height: 120, justifyContent: 'space-between' },
  barraColumna: { alignItems: 'center', flex: 1, gap: 6, justifyContent: 'flex-end' },
  barraPorcentaje: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 9 },
  barraFondo: { backgroundColor: 'rgba(20,92,55,.12)', borderRadius: 8, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', width: '55%' },
  barraLlena: { backgroundColor: '#25884C', borderRadius: 8, width: '100%' },
  barraTexto: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 11 },
  lista: { gap: 12 },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  iconoChico: { alignItems: 'center', borderRadius: 12, height: 34, justifyContent: 'center', overflow: 'hidden', width: 34 },
  iconoChicoImagen: { height: 22, width: 22 },
  filaTitulo: { color: '#12331F', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  filaDetalle: { color: '#7C9A85', fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
  insignia: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  insigniaTexto: { fontFamily: 'Montserrat-Bold', fontSize: 11 },
});
