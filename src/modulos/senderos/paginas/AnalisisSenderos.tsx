import type { LucideIcon } from 'lucide-react-native';
import { AlertTriangle, CalendarDays, Flame, GraduationCap, Handshake, Leaf, ListChecks, PiggyBank, Repeat2, Sparkles, TrendingUp } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Reanimated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';

import { RecuadroGlass, Texto, colores } from '../../../diseno';
import { RutinasAnalisis } from './analisis/rutinas/RutinasAnalisis';
import { SaludAnalisis } from './analisis/salud/SaludAnalisis';
import { saludMockData } from './analisis/salud/datosMock';
import { rutinasMockData } from './analisis/rutinas/datosMock';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

type CategoriaId = 'rutinas' | 'salud' | 'habitos' | 'tareas' | 'finanzas' | 'relaciones' | 'estudio';

type SenderoItem = {
  id: string;
  etiqueta: string;
  progreso: number;
  titulo: string;
  meta?: string;
};

type Categoria = {
  acento: string;
  alerta: string;
  categoria: string;
  Icono: LucideIcon;
  id: CategoriaId;
  mejorMomento: string;
  principal: { etiqueta: string; valor: string };
  secundario: { etiqueta: string; valor: string };
  senderos: SenderoItem[];
  serie: number[];
  tendencia: string;
};

const NOMBRES_CATEGORIAS: Record<CategoriaId, string> = {
  rutinas: 'senderos.analisis.categorias.rutinas',
  salud: 'senderos.analisis.categorias.salud',
  habitos: 'senderos.analisis.categorias.habitos',
  tareas: 'senderos.analisis.categorias.tareas',
  finanzas: 'senderos.analisis.categorias.finanzas',
  relaciones: 'senderos.analisis.categorias.relaciones',
  estudio: 'senderos.analisis.categorias.estudio',
};

function obtenerCategorias(t: (key: string, options?: any) => string): Categoria[] {
  return [
    {
      acento: '#1463FF',
      alerta: t('senderos.analisis.items.rutinas.alerta', { defaultValue: 'Tu cierre de dia necesita una sesion para recuperar ritmo.' }),
      categoria: t('senderos.analisis.categorias.rutinas', { defaultValue: 'Rutinas' }),
      Icono: Repeat2,
      id: 'rutinas',
      mejorMomento: t('senderos.analisis.items.rutinas.mejorMomento', { defaultValue: 'Viernes' }),
      principal: {
        etiqueta: t('senderos.analisis.items.rutinas.principalEtiqueta', { defaultValue: 'consistencia' }),
        valor: '68%',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.rutinas.secundarioEtiqueta', { defaultValue: 'racha actual' }),
        valor: t('senderos.analisis.items.rutinas.secundarioValor', { defaultValue: '6 dias' }),
      },
      senderos: [
        { id: 'rutinaBrazo', etiqueta: t('senderos.analisis.items.rutinas.senderos.rutinaBrazo.etiqueta', { defaultValue: '4 bloques' }), progreso: 68, titulo: t('senderos.analisis.items.rutinas.senderos.rutinaBrazo.titulo', { defaultValue: 'Rutina de brazo' }), meta: 'diaria' },
        { id: 'cierreDia', etiqueta: t('senderos.analisis.items.rutinas.senderos.cierreDia.etiqueta', { defaultValue: '15 min' }), progreso: 42, titulo: t('senderos.analisis.items.rutinas.senderos.cierreDia.titulo', { defaultValue: 'Cierre del dia' }), meta: 'diaria' },
        { id: 'bloqueEnfoque', etiqueta: t('senderos.analisis.items.rutinas.senderos.bloqueEnfoque.etiqueta', { defaultValue: '2 bloques' }), progreso: 74, titulo: t('senderos.analisis.items.rutinas.senderos.bloqueEnfoque.titulo', { defaultValue: 'Bloque de enfoque' }), meta: 'diaria' },
      ],
      serie: [36, 54, 42, 72, 58, 86, 68],
      tendencia: '+12%',
    },
    {
      acento: ESCALA_ESMERALDA.hoja.l77b,
      alerta: t('senderos.analisis.items.salud.alerta', { defaultValue: 'Caminar mantiene la energia mas estable de tus senderos.' }),
      categoria: t('senderos.analisis.categorias.salud', { defaultValue: 'Salud' }),
      Icono: Leaf,
      id: 'salud',
      mejorMomento: t('senderos.analisis.items.salud.mejorMomento', { defaultValue: 'Jueves' }),
      principal: {
        etiqueta: t('senderos.analisis.items.salud.principalEtiqueta', { defaultValue: 'bienestar' }),
        valor: '81%',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.salud.secundarioEtiqueta', { defaultValue: 'objetivo semanal' }),
        valor: '4/5',
      },
      senderos: [
        { id: 'caminar20', etiqueta: t('senderos.analisis.items.salud.senderos.caminar20.etiqueta', { defaultValue: '20 min' }), progreso: 81, titulo: t('senderos.analisis.items.salud.senderos.caminar20.titulo', { defaultValue: 'Caminar 20 min' }), meta: 'fisico' },
        { id: 'tomarAgua', etiqueta: t('senderos.analisis.items.salud.senderos.tomarAgua.etiqueta', { defaultValue: '3 Litros' }), progreso: 90, titulo: t('senderos.analisis.items.salud.senderos.tomarAgua.titulo', { defaultValue: 'Tomar Agua' }), meta: 'hidratacion' },
        { id: 'mejorSueno', etiqueta: t('senderos.analisis.items.salud.senderos.mejorSueno.etiqueta', { defaultValue: '7 noches' }), progreso: 46, titulo: t('senderos.analisis.items.salud.senderos.mejorSueno.titulo', { defaultValue: 'Mejor sueno' }), meta: 'sueno' },
      ],
      serie: [48, 62, 55, 72, 66, 82, 81],
      tendencia: '+9%',
    },
    {
      acento: '#FF3B30',
      alerta: t('senderos.analisis.items.habitos.alerta', { defaultValue: 'Leer diario esta a una sesion de proteger su racha.' }),
      categoria: t('senderos.analisis.categorias.habitos', { defaultValue: 'Habitos' }),
      Icono: Flame,
      id: 'habitos',
      mejorMomento: t('senderos.analisis.items.habitos.mejorMomento', { defaultValue: 'Noche' }),
      principal: {
        etiqueta: t('senderos.analisis.items.habitos.principalEtiqueta', { defaultValue: 'ritmo mensual' }),
        valor: '72%',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.habitos.secundarioEtiqueta', { defaultValue: 'mejor racha' }),
        valor: t('senderos.analisis.items.habitos.secundarioValor', { defaultValue: '12 dias' }),
      },
      senderos: [
        { id: 'leerDiario', etiqueta: t('senderos.analisis.items.habitos.senderos.leerDiario.etiqueta', { defaultValue: '7 dias' }), progreso: 72, titulo: t('senderos.analisis.items.habitos.senderos.leerDiario.titulo', { defaultValue: 'Leer diario' }) },
        { id: 'serConstante', etiqueta: t('senderos.analisis.items.habitos.senderos.serConstante.etiqueta', { defaultValue: '4 dias' }), progreso: 63, titulo: t('senderos.analisis.items.habitos.senderos.serConstante.titulo', { defaultValue: 'Ser constante' }) },
      ],
      serie: [78, 68, 82, 75, 84, 58, 72],
      tendencia: '-4%',
    },
    {
      acento: '#FFC400',
      alerta: t('senderos.analisis.items.tareas.alerta', { defaultValue: 'Una tarea importante vence esta semana.' }),
      categoria: t('senderos.analisis.categorias.tareas', { defaultValue: 'Tareas' }),
      Icono: ListChecks,
      id: 'tareas',
      mejorMomento: t('senderos.analisis.items.tareas.mejorMomento', { defaultValue: 'Manana' }),
      principal: {
        etiqueta: t('senderos.analisis.items.tareas.principalEtiqueta', { defaultValue: 'resueltas' }),
        valor: '14',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.tareas.secundarioEtiqueta', { defaultValue: 'pendientes' }),
        valor: '3',
      },
      senderos: [
        { id: 'proyectoPersonal', etiqueta: t('senderos.analisis.items.tareas.senderos.proyectoPersonal.etiqueta', { defaultValue: '2 pendientes' }), progreso: 66, titulo: t('senderos.analisis.items.tareas.senderos.proyectoPersonal.titulo', { defaultValue: 'Proyecto personal' }) },
        { id: 'organizarArchivos', etiqueta: t('senderos.analisis.items.tareas.senderos.organizarArchivos.etiqueta', { defaultValue: 'vence viernes' }), progreso: 38, titulo: t('senderos.analisis.items.tareas.senderos.organizarArchivos.titulo', { defaultValue: 'Organizar archivos' }) },
      ],
      serie: [42, 66, 48, 74, 55, 72, 64],
      tendencia: '+6%',
    },
    {
      acento: '#FF8A00',
      alerta: t('senderos.analisis.items.finanzas.alerta', { defaultValue: 'Tu proximo aporte llega el 1 de septiembre.' }),
      categoria: t('senderos.analisis.categorias.finanzas', { defaultValue: 'Finanzas' }),
      Icono: PiggyBank,
      id: 'finanzas',
      mejorMomento: t('senderos.analisis.items.finanzas.mejorMomento', { defaultValue: 'Lunes' }),
      principal: {
        etiqueta: t('senderos.analisis.items.finanzas.principalEtiqueta', { defaultValue: 'meta acumulada' }),
        valor: '57%',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.finanzas.secundarioEtiqueta', { defaultValue: 'ahorro actual' }),
        valor: '$285',
      },
      senderos: [
        { id: 'ahorroMensual', etiqueta: t('senderos.analisis.items.finanzas.senderos.ahorroMensual.etiqueta', { defaultValue: 'aporte mensual' }), progreso: 57, titulo: t('senderos.analisis.items.finanzas.senderos.ahorroMensual.titulo', { defaultValue: 'Ahorro mensual' }) },
        { id: 'gastosConscientes', etiqueta: t('senderos.analisis.items.finanzas.senderos.gastosConscientes.etiqueta', { defaultValue: 'presupuesto' }), progreso: 76, titulo: t('senderos.analisis.items.finanzas.senderos.gastosConscientes.titulo', { defaultValue: 'Gastos conscientes' }) },
      ],
      serie: [24, 31, 36, 48, 45, 54, 57],
      tendencia: '+7%',
    },
    {
      acento: '#FF2D93',
      alerta: t('senderos.analisis.items.relaciones.alerta', { defaultValue: 'Una conversacion esta pendiente esta semana.' }),
      categoria: t('senderos.analisis.categorias.relaciones', { defaultValue: 'Relaciones' }),
      Icono: Handshake,
      id: 'relaciones',
      mejorMomento: t('senderos.analisis.items.relaciones.mejorMomento', { defaultValue: 'Sabado' }),
      principal: {
        etiqueta: t('senderos.analisis.items.relaciones.principalEtiqueta', { defaultValue: 'conexiones' }),
        valor: '5',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.relaciones.secundarioEtiqueta', { defaultValue: 'calidad' }),
        valor: '84%',
      },
      senderos: [
        { id: 'tiempoFamilia', etiqueta: t('senderos.analisis.items.relaciones.senderos.tiempoFamilia.etiqueta', { defaultValue: 'semanal' }), progreso: 84, titulo: t('senderos.analisis.items.relaciones.senderos.tiempoFamilia.titulo', { defaultValue: 'Tiempo en familia' }) },
        { id: 'llamarAmigo', etiqueta: t('senderos.analisis.items.relaciones.senderos.llamarAmigo.etiqueta', { defaultValue: 'quincenal' }), progreso: 52, titulo: t('senderos.analisis.items.relaciones.senderos.llamarAmigo.titulo', { defaultValue: 'Llamar a un amigo' }) },
      ],
      serie: [58, 44, 66, 72, 60, 88, 84],
      tendencia: '+11%',
    },
    {
      acento: '#8E3DFF',
      alerta: t('senderos.analisis.items.estudio.alerta', { defaultValue: 'Dos sesiones mas consolidan tu avance de estudio.' }),
      categoria: t('senderos.analisis.categorias.estudio', { defaultValue: 'Estudio' }),
      Icono: GraduationCap,
      id: 'estudio',
      mejorMomento: t('senderos.analisis.items.estudio.mejorMomento', { defaultValue: 'Martes' }),
      principal: {
        etiqueta: t('senderos.analisis.items.estudio.principalEtiqueta', { defaultValue: 'horas enfocadas' }),
        valor: '6.5h',
      },
      secundario: {
        etiqueta: t('senderos.analisis.items.estudio.secundarioEtiqueta', { defaultValue: 'sesiones' }),
        valor: '9',
      },
      senderos: [
        { id: 'inglesPractico', etiqueta: t('senderos.analisis.items.estudio.senderos.inglesPractico.etiqueta', { defaultValue: 'pomodoro' }), progreso: 71, titulo: t('senderos.analisis.items.estudio.senderos.inglesPractico.titulo', { defaultValue: 'Ingles practico' }) },
        { id: 'aprenderDiseno', etiqueta: t('senderos.analisis.items.estudio.senderos.aprenderDiseno.etiqueta', { defaultValue: 'lectura' }), progreso: 48, titulo: t('senderos.analisis.items.estudio.senderos.aprenderDiseno.titulo', { defaultValue: 'Aprender diseno' }) },
      ],
      serie: [30, 62, 72, 52, 77, 68, 71],
      tendencia: '+15%',
    },
  ];
}

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function AnalisisSenderos({ categoriaActiva, onCategoriaChange }: { categoriaActiva: string, onCategoriaChange?: (id: string) => void }) {
  const { t } = useTranslation();
  const diasLista = (t('senderos.analisis.diasSemana', { returnObjects: true }) as string[]) || diasSemana;
  const categoriaId = (categoriaActiva as CategoriaId) || 'rutinas';
  
  const [itemsCargados, setItemsCargados] = useState(0);
  const [senderoFiltro, setSenderoFiltro] = useState<{ id?: string; titulo: string; meta?: string } | null>(null);
  useEffect(() => {
    let timeout: any;
    if (itemsCargados < 5) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 65);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);

  const categorias = useMemo(() => obtenerCategorias(t), [t]);
  const categoria = categorias.find((item) => item.id === categoriaId) ?? categorias[0];
  const IconoCategoria = categoria.Icono;

  const senderoActivo = useMemo(() => {
    if (!senderoFiltro) return null;
    return categoria.senderos.find((s) => (senderoFiltro.id ? s.id === senderoFiltro.id : s.titulo === senderoFiltro.titulo)) ?? senderoFiltro;
  }, [categoria.senderos, senderoFiltro]);

  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    setSenderoFiltro(null); // Reset filter on category change
    if (onCategoriaChange) onCategoriaChange(id);
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.selectorCategorias}>
        {categorias.map(({ acento, Icono, id }, index) => {
          const activa = id === categoriaId;
          const categoriaNombre = t(NOMBRES_CATEGORIAS[id]);
          return (
            <Reanimated.View key={id} entering={ZoomIn.delay(index * 60).springify()} style={{ flex: 1, minWidth: 0, aspectRatio: 1 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('senderos.analisis.progresoDe', { categoria: categoriaNombre })} onPress={() => seleccionarCategoria(id)} style={({ pressed }) => [styles.botonCategoria, activa && { backgroundColor: acento, borderColor: acento }, pressed && styles.botonCategoriaPresionado, { flex: 1 }]}>
                <Icono color={activa ? '#FFFFFF' : acento} size={16} strokeWidth={2.5} />
                {activa && <View style={styles.indicadorCategoriaActivo} />}
              </Pressable>
            </Reanimated.View>
          );
        })}
      </View>

      {/* FILTRO DE SENDEROS (PÍLDORAS) */}
      <View style={{ marginTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <Reanimated.View entering={ZoomIn.delay(0).springify()}>
            <Pressable 
              accessibilityRole="button"
              accessibilityLabel={t('senderos.analisis.todos')}
              onPress={() => { hapticSeguro('seleccion'); setSenderoFiltro(null); }}
              style={[styles.pildoraFiltro, senderoActivo === null && { backgroundColor: categoria.acento, borderColor: categoria.acento }]}
            >
              <Texto style={[styles.pildoraTexto, senderoActivo === null && { color: '#FFF' }]}>{t('senderos.analisis.todos')}</Texto>
            </Pressable>
          </Reanimated.View>
          
          {categoria.senderos.map((sendero, index) => {
            const activo = senderoActivo?.id ? senderoActivo.id === sendero.id : senderoActivo?.titulo === sendero.titulo;
            return (
              <Reanimated.View key={sendero.id ?? sendero.titulo} entering={ZoomIn.delay((index + 1) * 60).springify()}>
                <Pressable 
                  accessibilityRole="button"
                  accessibilityLabel={sendero.titulo}
                  onPress={() => { hapticSeguro('seleccion'); setSenderoFiltro(sendero); }}
                  style={[styles.pildoraFiltro, activo && { backgroundColor: categoria.acento, borderColor: categoria.acento }]}
                >
                  <Texto style={[styles.pildoraTexto, activo && { color: '#FFF' }]}>{sendero.titulo}</Texto>
                </Pressable>
              </Reanimated.View>
            );
          })}
        </ScrollView>
      </View>

      {categoriaId === 'rutinas' ? (
        <RutinasAnalisis datos={rutinasMockData} acento={categoria.acento} itemsCargados={itemsCargados} senderoFiltro={senderoActivo} />
      ) : categoriaId === 'salud' ? (
        <SaludAnalisis datos={saludMockData} acento={categoria.acento} itemsCargados={itemsCargados} senderoFiltro={senderoActivo} />
      ) : (
        <>
          {itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : (
      <Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.duration(400)}>
      <RecuadroGlass blur intensity={64} style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '32') }]}>
        <View pointerEvents="none" style={[styles.resumenTinte, { backgroundColor: conAlpha(categoria.acento, '0C') }]} />
        <View style={styles.resumenCabecera}>
          <View>
            <Texto style={styles.resumenTitulo}>{t('senderos.analisis.actividad')}</Texto>
            <Texto style={styles.resumenSubtitulo}>{t('senderos.analisis.progresoSemana')}</Texto>
          </View>
          <View style={[styles.iconoResumen, { backgroundColor: conAlpha(categoria.acento, '18') }]}>
            <IconoCategoria color={categoria.acento} size={20} strokeWidth={2.5} />
          </View>
        </View>
        <View style={styles.metricasResumen}>
          <View style={styles.metricaResumen}>
            <Texto style={[styles.valorResumen, { color: categoria.acento }]}>{categoria.principal.valor}</Texto>
            <Texto style={styles.etiquetaResumen}>{categoria.principal.etiqueta}</Texto>
          </View>
          <View style={styles.divisorMetricas} />
          <View style={styles.metricaResumen}>
            <Texto style={styles.valorResumen}>{categoria.secundario.valor}</Texto>
            <Texto style={styles.etiquetaResumen}>{categoria.secundario.etiqueta}</Texto>
          </View>
        </View>
      </RecuadroGlass>
      </Reanimated.View>
      )}

      {itemsCargados < 2 ? <View style={[styles.ritmoGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 140, borderColor: 'rgba(255,255,255,0.1)', marginTop: 12 }]} /> : (
      <Reanimated.View key={'rit-' + categoria.id} entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={54} style={styles.ritmoGlass}>
        <View style={styles.ritmoCabecera}>
          <View style={styles.ritmoTituloGrupo}>
            <TrendingUp color={categoria.acento} size={16} strokeWidth={2.5} />
            <Texto style={styles.ritmoTitulo}>{t('senderos.analisis.ritmoSemanal')}</Texto>
          </View>
          <Texto style={[styles.ritmoTendencia, { color: categoria.acento }]}>{categoria.tendencia}</Texto>
        </View>
        <View style={styles.graficaSemanal}>
          {categoria.serie.map((valor, indice) => (
            <View key={indice} style={styles.columnaSemana}>
              <View style={[styles.barraSemana, { backgroundColor: conAlpha(categoria.acento, indice === categoria.serie.length - 1 ? 'E8' : '45'), height: Math.max(12, valor * 0.68) }]} />
              <Texto style={styles.diaSemana}>{diasLista[indice] ?? diasSemana[indice]}</Texto>
            </View>
          ))}
        </View>
      </RecuadroGlass>
      </Reanimated.View>
      )}

      {itemsCargados < 3 ? <View style={[styles.senalesFila, { height: 102, marginTop: 12 }]}><View style={[styles.senalGlass, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} /><View style={[styles.senalGlass, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} /></View> : (
      <Reanimated.View key={'sen-' + categoria.id} entering={FadeInDown.duration(400)} style={styles.senalesFila}>
        <RecuadroGlass blur intensity={36} style={styles.senalGlass}>
          <Sparkles color={categoria.acento} size={17} strokeWidth={2.5} />
          <Texto style={styles.senalEtiqueta}>{t('senderos.analisis.mejorMomento')}</Texto>
          <Texto style={styles.senalValor}>{categoria.mejorMomento}</Texto>
        </RecuadroGlass>
        <RecuadroGlass blur intensity={36} style={styles.senalGlass}>
          <AlertTriangle color={categoria.acento} size={17} strokeWidth={2.5} />
          <Texto style={styles.senalEtiqueta}>{t('senderos.analisis.senal')}</Texto>
          <Texto numberOfLines={2} style={styles.senalAlerta}>{categoria.alerta}</Texto>
        </RecuadroGlass>
      </Reanimated.View>
      )}

      {itemsCargados < 4 ? <View style={{ height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 21, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, marginTop: 12 }} /> : (
      <Reanimated.View key={'list-' + categoria.id} entering={FadeInDown.duration(400)}>
      <View style={styles.listaCabecera}>
        <Texto style={styles.listaTitulo}>
          {t('senderos.analisis.senderosDe', { categoria: t(NOMBRES_CATEGORIAS[categoria.id]) })}
        </Texto>
        <CalendarDays color={categoria.acento} size={16} strokeWidth={2.4} />
      </View>
      <RecuadroGlass blur intensity={50} style={styles.tableroGlass}>
        {categoria.senderos.map((sendero, indice) => (
          <View key={sendero.id ?? sendero.titulo} style={[styles.filaSendero, indice > 0 && styles.filaSenderoDividida]}>
            <View style={[styles.puntoSendero, { backgroundColor: categoria.acento }]} />
            <View style={styles.filaSenderoTexto}>
              <Texto numberOfLines={1} style={styles.filaSenderoTitulo}>{sendero.titulo}</Texto>
              <Texto style={styles.filaSenderoEtiqueta}>{sendero.etiqueta}</Texto>
            </View>
            <Texto style={[styles.filaSenderoProgreso, { color: categoria.acento }]}>{sendero.progreso}%</Texto>
            <View style={styles.marcadoresSemana}>
              {diasLista.map((_, diaIndice) => <View key={diaIndice} style={[styles.marcadorDia, diaIndice < Math.round(sendero.progreso / 16) && { backgroundColor: categoria.acento }]} />)}
            </View>
          </View>
        ))}
      </RecuadroGlass>
      </Reanimated.View>
      )}
        </>
      )}
    </View>
  );
}

export default AnalisisSenderos;

const styles = StyleSheet.create({
  raiz: { gap: 12 },
  selectorCategorias: { flexDirection: 'row', gap: 4, width: '100%' },
  botonCategoria: { alignItems: 'center', aspectRatio: 1, backgroundColor: 'rgba(255, 255, 255, 0.56)', borderColor: 'rgba(255, 255, 255, 0.76)', borderRadius: 12, borderWidth: 0.7, flex: 1, justifyContent: 'center', minWidth: 0 },
  botonCategoriaPresionado: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  pildoraFiltro: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },
  pildoraTexto: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  indicadorCategoriaActivo: { backgroundColor: '#FFFFFF', borderRadius: 99, bottom: 5, height: 3, position: 'absolute', width: 12 },
  resumenGlass: { borderRadius: 24, borderWidth: 0.8, overflow: 'hidden', padding: 15 },
  resumenTinte: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  resumenCabecera: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resumenTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 20, lineHeight: 24 },
  resumenSubtitulo: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 10, marginTop: 2 },
  iconoResumen: { alignItems: 'center', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  metricasResumen: { alignItems: 'center', flexDirection: 'row', marginTop: 18 },
  metricaResumen: { flex: 1 },
  valorResumen: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 28 },
  etiquetaResumen: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 9, marginTop: 2 },
  divisorMetricas: { backgroundColor: 'rgba(100, 86, 68, 0.16)', height: 30, marginHorizontal: 12, width: 1 },
  ritmoGlass: { borderColor: 'rgba(255, 255, 255, 0.72)', borderRadius: 22, borderWidth: 0.7, overflow: 'hidden', padding: 14 },
  ritmoCabecera: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  ritmoTituloGrupo: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  ritmoTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13 },
  ritmoTendencia: { fontFamily: 'MontserratAlternates-Bold', fontSize: 11 },
  graficaSemanal: { alignItems: 'flex-end', flexDirection: 'row', gap: 7, height: 96, marginTop: 10 },
  columnaSemana: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barraSemana: { borderRadius: 99, maxHeight: 72, width: '72%' },
  diaSemana: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 8, marginTop: 4 },
  senalesFila: { flexDirection: 'row', gap: 8 },
  senalGlass: { borderColor: 'rgba(255, 255, 255, 0.72)', borderRadius: 19, borderWidth: 0.7, flex: 1, minHeight: 102, padding: 12 },
  senalEtiqueta: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 7, letterSpacing: 0.6, marginTop: 9 },
  senalValor: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15, marginTop: 3 },
  senalAlerta: { color: colores.texto, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 9, lineHeight: 13, marginTop: 3 },
  listaCabecera: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  listaTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  tableroGlass: { borderColor: 'rgba(255, 255, 255, 0.72)', borderRadius: 21, borderWidth: 0.7, overflow: 'hidden', paddingHorizontal: 13 },
  filaSendero: { alignItems: 'center', flexDirection: 'row', minHeight: 65 },
  filaSenderoDividida: { borderColor: 'rgba(100, 86, 68, 0.12)', borderTopWidth: 0.7 },
  puntoSendero: { borderColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 99, borderWidth: 1, height: 9, marginRight: 9, width: 9 },
  filaSenderoTexto: { flex: 1, minWidth: 0 },
  filaSenderoTitulo: { color: colores.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 11 },
  filaSenderoEtiqueta: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-SemiBold', fontSize: 8, marginTop: 2 },
  filaSenderoProgreso: { fontFamily: 'MontserratAlternates-Bold', fontSize: 10, marginHorizontal: 8 },
  marcadoresSemana: { flexDirection: 'row', gap: 3 },
  marcadorDia: { backgroundColor: 'rgba(100, 86, 68, 0.14)', borderRadius: 99, height: 5, width: 5 },
});
