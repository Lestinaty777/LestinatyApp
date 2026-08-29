import type { LucideIcon } from 'lucide-react-native';
import { usePathname } from 'expo-router';
import {
  ChevronRight,
  Compass,
  Flame,
  GraduationCap,
  Handshake,
  Leaf,
  ListChecks,
  Map,
  Moon,
  PiggyBank,
  Plus,
  Repeat2,
  Search,
  Sparkles,
  Sprout,
  Sun,
  TrendingUp,
  Users,
  Utensils,
  WalletCards,
  Droplets,
  Dumbbell,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BarraProgresoLiquida } from '../../../diseno/componentes/BarraProgresoLiquida';
import FogEffectSkia from '../../../diseno/componentes/NieblaUi';
import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { ContenedorMapaSenderos } from '../componentes/mapa/ContenedorMapaSenderos';
import { usarAccionBarraSenderos } from '../estado/accionBarraSenderos.estado';
import { AnalisisSenderos } from '../paginas/AnalisisSenderos';
import { CompartidosSenderos } from '../paginas/CompartidosSenderos';
import { EspacioTrabajoSendero } from '../paginas/EspacioTrabajoSendero';
import { PaginaSenderosId, paginasSenderos } from '../paginas/paginasSenderos';

const Bioma = biomas.inicio;
const paddingPestanas = 6;
const gapPestanas = 4;
const altoPestanasInternas = 64;
const altoSeparadorCompleto = 102;
const altoSeparadorVisible = 34;
const desplazamientoSeparadorActivo = -44;

const pestanasSenderos = [
  { id: 'mis-senderos', etiqueta: 'Mis senderos', Icono: Map },
  { id: 'analisis', etiqueta: 'Analisis', Icono: TrendingUp },
  { id: 'compartidos', etiqueta: 'Compartidos', Icono: Users },
  { id: 'explorar', etiqueta: 'Explorar', Icono: Compass },
] as const;

type CategoriaSenderoId = 'rutinas' | 'salud' | 'habitos' | 'tareas' | 'finanzas' | 'relaciones' | 'estudio';

type SenderoBase<Categoria extends CategoriaSenderoId> = {
  categoria: Categoria;
  descripcion: string;
  estado: 'nuevo' | 'activo' | 'pausado' | 'completado';
  id: string;
  ilustracion?: ImageSourcePropType;
  metadata: string[];
  titulo: string;
};

type SenderoRutina = SenderoBase<'rutinas'> & {
  analiticas: { consistencia: number; tiempoRealMinutos: number };
  configuracion: { bloques: number; duracionMinutos: number; momento: 'manana' | 'tarde' | 'noche'; ordenFlexible: boolean };
};

type SenderoSalud = SenderoBase<'salud'> & {
  analiticas: { bienestar: number; constancia: number };
  configuracion: { enfoque: 'nutricion' | 'meditacion' | 'movimiento' | 'sueno'; intensidad: 'suave' | 'media' | 'alta'; objetivoSemanal: number };
};

type SenderoHabito = SenderoBase<'habitos'> & {
  analiticas: { rachaActual: number; rachaMaxima: number };
  configuracion: { dificultad: 'facil' | 'media' | 'alta'; disparador: string; frecuencia: 'diario' | 'dias-semana' | 'cada-x-dias' };
};

type SenderoTarea = SenderoBase<'tareas'> & {
  analiticas: { atrasadas: number; completadas: number };
  configuracion: { prioridad: 'baja' | 'media' | 'alta'; subtareas: number; tipo: 'una-vez' | 'repetitiva'; vence?: string };
};

type SenderoFinanza = SenderoBase<'finanzas'> & {
  analiticas: { acumulado: number; porcentajeMeta: number };
  configuracion: { aporteFrecuencia: 'semanal' | 'quincenal' | 'mensual'; metaDinero: number; moneda: string; tipo: 'ahorro' | 'presupuesto' | 'deuda' | 'inversion' };
};

type SenderoRelacion = SenderoBase<'relaciones'> & {
  analiticas: { accionesRealizadas: number; calidadPercibida: number };
  configuracion: { energia: 'calma' | 'presencia' | 'reparacion'; frecuenciaContacto: 'semanal' | 'quincenal' | 'mensual'; vinculo: 'familia' | 'pareja' | 'amistad' | 'yo' };
};

type SenderoEstudio = SenderoBase<'estudio'> & {
  analiticas: { horas: number; sesiones: number };
  configuracion: { duracionSesionMinutos: number; metodo: 'pomodoro' | 'lectura' | 'practica' | 'proyecto'; nivel: 'basico' | 'intermedio' | 'avanzado' };
};

type SenderoMini =
  | SenderoRutina
  | SenderoSalud
  | SenderoHabito
  | SenderoTarea
  | SenderoFinanza
  | SenderoRelacion
  | SenderoEstudio;

type CategoriaCarpeta = {
  acento: string;
  descripcion: string;
  Icono: LucideIcon;
  id: CategoriaSenderoId;
  etiquetaSeparador?: string;
  senderos: SenderoMini[];
  titulo: string;
};

type SubcategoriaCarpeta = {
  acento: string;
  esCrear?: boolean;
  Icono: LucideIcon;
  id: string;
  senderoIds: string[];
  titulo: string;
};

const categoriasCarpeta: CategoriaCarpeta[] = [
  {
    acento: '#1463FF',
    descripcion: 'Sistemas diarios y secuencias repetibles.',
    Icono: Repeat2,
    id: 'rutinas',
    titulo: 'Rutinas',
    senderos: [
      {
        analiticas: { consistencia: 68, tiempoRealMinutos: 18 },
        categoria: 'rutinas',
        configuracion: { bloques: 4, duracionMinutos: 20, momento: 'manana', ordenFlexible: true },
        descripcion: 'Secuencia ligera para abrir el dia con claridad.',
        estado: 'activo',
        id: 'rutina-manana',
        metadata: ['Manana', '20 min', '4 bloques'],
        titulo: 'Rutina de manana',
      },
      {
        analiticas: { consistencia: 42, tiempoRealMinutos: 12 },
        categoria: 'rutinas',
        configuracion: { bloques: 3, duracionMinutos: 15, momento: 'noche', ordenFlexible: false },
        descripcion: 'Cierre simple para ordenar pendientes y descanso.',
        estado: 'nuevo',
        id: 'rutina-noche',
        metadata: ['Noche', '15 min', '3 pasos'],
        titulo: 'Cierre del dia',
      },
      {
        analiticas: { consistencia: 74, tiempoRealMinutos: 45 },
        categoria: 'rutinas',
        configuracion: { bloques: 2, duracionMinutos: 45, momento: 'tarde', ordenFlexible: true },
        descripcion: 'Bloques de trabajo profundo con pausas claras.',
        estado: 'activo',
        id: 'bloque-enfoque',
        metadata: ['Tarde', '45 min', '2 bloques'],
        titulo: 'Bloque de enfoque',
      },
    ],
  },
  {
    acento: '#34D946',
    descripcion: 'Salud, naturaleza, nutricion y calma.',
    Icono: Leaf,
    id: 'salud',
    titulo: 'Salud',
    senderos: [
      {
        analiticas: { bienestar: 54, constancia: 5 },
        categoria: 'salud',
        configuracion: { enfoque: 'nutricion', intensidad: 'suave', objetivoSemanal: 6 },
        descripcion: 'Comidas simples, agua y pequenas decisiones sanas.',
        estado: 'activo',
        id: 'nutricion-simple',
        metadata: ['Nutricion', 'Suave', '6/sem'],
        titulo: 'Nutricion simple',
      },
      {
        analiticas: { bienestar: 31, constancia: 3 },
        categoria: 'salud',
        configuracion: { enfoque: 'meditacion', intensidad: 'suave', objetivoSemanal: 4 },
        descripcion: 'Pausas cortas para bajar ruido mental.',
        estado: 'nuevo',
        id: 'meditacion-diaria',
        metadata: ['Calma', '10 min', '4/sem'],
        titulo: 'Meditacion diaria',
      },
      {
        analiticas: { bienestar: 81, constancia: 4 },
        categoria: 'salud',
        configuracion: { enfoque: 'movimiento', intensidad: 'media', objetivoSemanal: 5 },
        descripcion: 'Movimiento accesible para activar el cuerpo.',
        estado: 'activo',
        id: 'caminar',
        metadata: ['Movimiento', '20 min', 'Media'],
        titulo: 'Caminar 20 min',
      },
      {
        analiticas: { bienestar: 46, constancia: 6 },
        categoria: 'salud',
        configuracion: { enfoque: 'sueno', intensidad: 'suave', objetivoSemanal: 7 },
        descripcion: 'Ritual nocturno para dormir con menos friccion.',
        estado: 'pausado',
        id: 'sueno',
        metadata: ['Sueno', 'Noche', '7/sem'],
        titulo: 'Mejor sueno',
      },
    ],
  },
  {
    acento: '#FF3B30',
    descripcion: 'Disciplina, constancia y acciones pequenas.',
    Icono: Flame,
    id: 'habitos',
    titulo: 'Habitos',
    senderos: [
      {
        analiticas: { rachaActual: 7, rachaMaxima: 12 },
        categoria: 'habitos',
        configuracion: { dificultad: 'media', disparador: 'Despues del desayuno', frecuencia: 'diario' },
        descripcion: 'Un sistema pequeno para volver aunque falles.',
        estado: 'activo',
        id: 'constancia',
        metadata: ['7 dias', 'Diario', 'Media'],
        titulo: 'Ser constante',
      },
      {
        analiticas: { rachaActual: 4, rachaMaxima: 9 },
        categoria: 'habitos',
        configuracion: { dificultad: 'facil', disparador: 'Antes de dormir', frecuencia: 'diario' },
        descripcion: 'Lectura corta sin presion de terminar libros rapido.',
        estado: 'nuevo',
        id: 'leer',
        metadata: ['Lectura', 'Facil', 'Noche'],
        titulo: 'Leer diario',
      },
    ],
  },
  {
    acento: '#FFC400',
    descripcion: 'Pendientes, ejecucion y pasos concretos.',
    Icono: ListChecks,
    id: 'tareas',
    titulo: 'Tareas',
    senderos: [
      {
        analiticas: { atrasadas: 1, completadas: 5 },
        categoria: 'tareas',
        configuracion: { prioridad: 'media', subtareas: 9, tipo: 'una-vez', vence: 'Hoy' },
        descripcion: 'Dividir la casa en pasos visibles y cerrables.',
        estado: 'activo',
        id: 'ordenar-casa',
        metadata: ['9 pasos', 'Media', 'Hoy'],
        titulo: 'Ordenar casa',
      },
      {
        analiticas: { atrasadas: 2, completadas: 1 },
        categoria: 'tareas',
        configuracion: { prioridad: 'alta', subtareas: 8, tipo: 'una-vez', vence: 'Viernes' },
        descripcion: 'Tramites agrupados para cerrar pendientes reales.',
        estado: 'nuevo',
        id: 'tramites',
        metadata: ['8 pasos', 'Alta', 'Viernes'],
        titulo: 'Tramites',
      },
    ],
  },
  {
    acento: '#FF8A00',
    descripcion: 'Finanzas, trabajo, productividad y negocio.',
    Icono: PiggyBank,
    id: 'finanzas',
    etiquetaSeparador: 'Dinero',
    titulo: 'Finanzas',
    senderos: [
      {
        analiticas: { acumulado: 285, porcentajeMeta: 57 },
        categoria: 'finanzas',
        configuracion: { aporteFrecuencia: 'mensual', metaDinero: 500, moneda: 'USD', tipo: 'ahorro' },
        descripcion: 'Meta clara con aportes simples y seguimiento mensual.',
        estado: 'activo',
        id: 'ahorro',
        metadata: ['$500', 'Mensual', 'Ahorro'],
        titulo: 'Ahorro mensual',
      },
      {
        analiticas: { acumulado: 0, porcentajeMeta: 35 },
        categoria: 'finanzas',
        configuracion: { aporteFrecuencia: 'mensual', metaDinero: 1200, moneda: 'USD', tipo: 'presupuesto' },
        descripcion: 'Organiza gastos por categorias sin hacerlo pesado.',
        estado: 'nuevo',
        id: 'presupuesto',
        metadata: ['Gastos', 'Mensual', 'Control'],
        titulo: 'Presupuesto',
      },
      {
        analiticas: { acumulado: 0, porcentajeMeta: 19 },
        categoria: 'finanzas',
        configuracion: { aporteFrecuencia: 'semanal', metaDinero: 1000, moneda: 'USD', tipo: 'inversion' },
        descripcion: 'Validar una idea con pasos medibles y bajo riesgo.',
        estado: 'nuevo',
        id: 'negocio',
        metadata: ['Negocio', 'Semanal', 'Idea'],
        titulo: 'Idea de negocio',
      },
    ],
  },
  {
    acento: '#FF2D93',
    descripcion: 'Relaciones, emociones y amor propio.',
    Icono: Handshake,
    id: 'relaciones',
    etiquetaSeparador: 'Social',
    titulo: 'Relaciones',
    senderos: [
      {
        analiticas: { accionesRealizadas: 3, calidadPercibida: 7 },
        categoria: 'relaciones',
        configuracion: { energia: 'presencia', frecuenciaContacto: 'semanal', vinculo: 'familia' },
        descripcion: 'Pequenas acciones para estar mas presente.',
        estado: 'activo',
        id: 'familia',
        metadata: ['Familia', 'Semanal', 'Presencia'],
        titulo: 'Familia presente',
      },
      {
        analiticas: { accionesRealizadas: 4, calidadPercibida: 8 },
        categoria: 'relaciones',
        configuracion: { energia: 'calma', frecuenciaContacto: 'semanal', vinculo: 'yo' },
        descripcion: 'Cuidarte sin convertirlo en otra exigencia.',
        estado: 'nuevo',
        id: 'amor-propio',
        metadata: ['Yo', 'Calma', 'Semanal'],
        titulo: 'Amor propio',
      },
    ],
  },
  {
    acento: '#8E3DFF',
    descripcion: 'Estudio, creatividad, espiritualidad y proyectos.',
    Icono: GraduationCap,
    id: 'estudio',
    titulo: 'Estudio',
    senderos: [
      {
        analiticas: { horas: 5, sesiones: 6 },
        categoria: 'estudio',
        configuracion: { duracionSesionMinutos: 25, metodo: 'practica', nivel: 'basico' },
        descripcion: 'Practica constante con sesiones cortas.',
        estado: 'activo',
        id: 'ingles',
        metadata: ['Basico', '25 min', 'Practica'],
        titulo: 'Ingles',
      },
      {
        analiticas: { horas: 3, sesiones: 4 },
        categoria: 'estudio',
        configuracion: { duracionSesionMinutos: 20, metodo: 'proyecto', nivel: 'intermedio' },
        descripcion: 'Crear algo pequeno cada dia sin buscar perfeccion.',
        estado: 'nuevo',
        id: 'creatividad',
        metadata: ['Crear', '20 min', 'Proyecto'],
        titulo: 'Crear todos los dias',
      },
      {
        analiticas: { horas: 12, sesiones: 8 },
        categoria: 'estudio',
        configuracion: { duracionSesionMinutos: 45, metodo: 'proyecto', nivel: 'avanzado' },
        descripcion: 'Avance por modulos para un proyecto importante.',
        estado: 'activo',
        id: 'proyecto',
        metadata: ['Avanzado', '45 min', 'Modulo'],
        titulo: 'Proyecto personal',
      },
    ],
  },
];

const subcategoriasPorCategoria: Record<CategoriaSenderoId, SubcategoriaCarpeta[]> = {
  rutinas: [
    { acento: '#1463FF', Icono: Sun, id: 'manana', senderoIds: ['rutina-manana'], titulo: 'Manana' },
    { acento: '#1257E0', Icono: Repeat2, id: 'tarde', senderoIds: ['bloque-enfoque'], titulo: 'Tarde' },
    { acento: '#104BC2', Icono: Moon, id: 'noche', senderoIds: ['rutina-noche'], titulo: 'Noche' },
    { acento: '#0D3F9E', Icono: Dumbbell, id: 'entrenamiento', senderoIds: [], titulo: 'Entreno' },
    { acento: '#0A337B', Icono: Sparkles, id: 'reinicio', senderoIds: [], titulo: 'Reinicio' },
    { acento: '#07295D', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  salud: [
    { acento: '#34D946', Icono: Moon, id: 'sueno', senderoIds: ['sueno'], titulo: 'Sueno' },
    { acento: '#2EBF3E', Icono: Dumbbell, id: 'ejercicio', senderoIds: ['caminar'], titulo: 'Ejercicio' },
    { acento: '#259D33', Icono: Droplets, id: 'hidratacion', senderoIds: [], titulo: 'Agua' },
    { acento: '#1C7D29', Icono: Utensils, id: 'nutricion', senderoIds: ['nutricion-simple'], titulo: 'Comida' },
    { acento: '#145F20', Icono: Sparkles, id: 'mente', senderoIds: ['meditacion-diaria'], titulo: 'Mente' },
    { acento: '#0D4317', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  habitos: [
    { acento: '#FF3B30', Icono: Flame, id: 'constancia', senderoIds: ['constancia'], titulo: 'Racha' },
    { acento: '#E02E25', Icono: Sparkles, id: 'lectura', senderoIds: ['leer'], titulo: 'Lectura' },
    { acento: '#BE241D', Icono: Repeat2, id: 'diario', senderoIds: [], titulo: 'Diario' },
    { acento: '#991B16', Icono: Sun, id: 'manana', senderoIds: [], titulo: 'Manana' },
    { acento: '#72130F', Icono: Moon, id: 'noche', senderoIds: [], titulo: 'Noche' },
    { acento: '#4E0C0A', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  tareas: [
    { acento: '#FFC400', Icono: ListChecks, id: 'hoy', senderoIds: ['ordenar-casa'], titulo: 'Hoy' },
    { acento: '#D9A800', Icono: Sparkles, id: 'importante', senderoIds: ['tramites'], titulo: 'Clave' },
    { acento: '#B88F00', Icono: Repeat2, id: 'repetitivas', senderoIds: [], titulo: 'Ciclos' },
    { acento: '#927100', Icono: Sun, id: 'manana', senderoIds: [], titulo: 'Manana' },
    { acento: '#6D5400', Icono: WalletCards, id: 'proyectos', senderoIds: [], titulo: 'Proyecto' },
    { acento: '#4B3A00', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  finanzas: [
    { acento: '#FF8A00', Icono: PiggyBank, id: 'ahorro', senderoIds: ['ahorro'], titulo: 'Ahorro' },
    { acento: '#E67700', Icono: WalletCards, id: 'presupuesto', senderoIds: ['presupuesto'], titulo: 'Gastos' },
    { acento: '#BF6100', Icono: TrendingUp, id: 'inversion', senderoIds: ['negocio'], titulo: 'Invertir' },
    { acento: '#984C00', Icono: ListChecks, id: 'deudas', senderoIds: [], titulo: 'Deudas' },
    { acento: '#703700', Icono: Sparkles, id: 'ingresos', senderoIds: [], titulo: 'Ingresos' },
    { acento: '#4D2600', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  relaciones: [
    { acento: '#FF2D93', Icono: Handshake, id: 'pareja', senderoIds: [], titulo: 'Pareja' },
    { acento: '#E0267E', Icono: Users, id: 'familia', senderoIds: ['familia'], titulo: 'Familia' },
    { acento: '#BD1B68', Icono: Users, id: 'amistades', senderoIds: [], titulo: 'Amigos' },
    { acento: '#94134F', Icono: Sparkles, id: 'amor-propio', senderoIds: ['amor-propio'], titulo: 'Yo' },
    { acento: '#6B0D39', Icono: Sun, id: 'social', senderoIds: [], titulo: 'Social' },
    { acento: '#480825', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
  estudio: [
    { acento: '#8E3DFF', Icono: GraduationCap, id: 'aprendizaje', senderoIds: ['ingles'], titulo: 'Aprender' },
    { acento: '#7A2EE0', Icono: Sparkles, id: 'creatividad', senderoIds: ['creatividad'], titulo: 'Crear' },
    { acento: '#6123BC', Icono: ListChecks, id: 'proyectos', senderoIds: ['proyecto'], titulo: 'Proyecto' },
    { acento: '#49198F', Icono: Repeat2, id: 'practica', senderoIds: [], titulo: 'Practica' },
    { acento: '#331166', Icono: Moon, id: 'lectura', senderoIds: [], titulo: 'Lectura' },
    { acento: '#210A45', esCrear: true, Icono: Plus, id: 'crear', senderoIds: [], titulo: 'Nueva' },
  ],
};

function hapticSeleccion() {
  hapticSeguro('seleccion');
}

function colorConAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

function colorPastel(color: string, proporcion = 0.13) {
  const hex = color.replace('#', '');
  const canales = [0, 2, 4].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16));
  const suavizado = canales.map((canal) => Math.round(canal * proporcion + 255 * (1 - proporcion)));
  return `#${suavizado.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

function IconoBaseColor({
  color,
  Icono,
  iconoSize = 18,
  size = 44,
}: {
  color: string;
  Icono: LucideIcon;
  iconoSize?: number;
  size?: number;
}) {
  return (
    <View style={[styles.iconoBaseColor, { height: size, width: size }]}>
      <Svg width={size} height={(size * 23) / 24} viewBox="-0.47 -1.16 24 23" fill="none">
        <Path
          d="M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z"
          fill={color}
        />
        <Path
          d="M14.944 3.315L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.618 9.672C18.521 8.984 17.422 8.154 16.334 7.174C15.442 6.371 14.978 5.166 14.944 3.315Z"
          fill="#FFFFFF"
          opacity={0.2}
        />
        <Path
          d="M16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L5.614 16.259C7.386 16.941 9.331 17.284 11.442 17.284C13.903 17.284 16.04 16.823 17.822 15.966L16.334 17.6495Z"
          fill="#2A1D12"
          opacity={0.16}
        />
      </Svg>
      <View pointerEvents="none" style={styles.iconoBaseColorCentro}>
        <Icono color="#FFFFFF" size={iconoSize} strokeWidth={2.6} />
      </View>
    </View>
  );
}

function TarjetaSenderoMini({ categoria, sendero, onAbrir }: { categoria: CategoriaCarpeta; sendero: SenderoMini; onAbrir: (sendero: SenderoMini, color: string) => void }) {
  const IconoCategoria = categoria.Icono;
  const entrada = useRef(new Animated.Value(0)).current;
  const metadataVisible = sendero.metadata.slice(0, 2);

  useEffect(() => {
    Animated.spring(entrada, {
      damping: 16,
      mass: 0.68,
      stiffness: 230,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const desplazamientoEntrada = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY: desplazamientoEntrada }] }}>
      <Pressable
        onPress={() => {
          hapticSeguro('accion');
          onAbrir(sendero, categoria.acento);
        }}
        style={({ pressed }) => [styles.tarjetaSenderoMini, pressed && styles.tarjetaSenderoMiniPresionada]}
      >
        <RecuadroGlass blur intensity={36} style={[styles.tarjetaSenderoMiniGlass, { borderColor: colorConAlpha(categoria.acento, '30') }]}>
          <View pointerEvents="none" style={[styles.tarjetaSenderoTinte, { backgroundColor: colorConAlpha(categoria.acento, '14') }]} />
          <View style={[styles.marcadorSenderoMini, { backgroundColor: categoria.acento }]} />

          <View style={styles.tarjetaSenderoMiniTexto}>
            <View style={styles.tarjetaSenderoMiniSuperior}>
              <IconoBaseColor color={categoria.acento} Icono={IconoCategoria} iconoSize={12} size={30} />
              <Texto style={[styles.senderoEstado, { color: categoria.acento }]}>{sendero.estado}</Texto>
            </View>

            <Texto numberOfLines={2} style={styles.tarjetaSenderoTitulo}>
              {sendero.titulo}
            </Texto>

            <View style={styles.chipsMiniSendero}>
              {metadataVisible.map((item) => (
                <Texto key={item} style={styles.chipMiniSendero}>
                  {item}
                </Texto>
              ))}
            </View>
          </View>

          <View style={[styles.placeholderIlustracionMini, { backgroundColor: colorConAlpha(categoria.acento, '20') }]}>
            <View style={[styles.placeholderIlustracionBrillo, { backgroundColor: colorConAlpha(categoria.acento, '24') }]} />
            <IconoCategoria color={categoria.acento} size={22} strokeWidth={2.3} />
          </View>
        </RecuadroGlass>
      </Pressable>
    </Animated.View>
  );
}

function TarjetaSenderoVertical({ categoria, sendero, onAbrir }: { categoria: CategoriaCarpeta; sendero: SenderoMini; onAbrir: (sendero: SenderoMini, color: string) => void }) {
  const IconoCategoria = categoria.Icono;
  const entrada = useRef(new Animated.Value(0)).current;
  const metadataVisible = sendero.metadata.slice(0, 3);

  useEffect(() => {
    Animated.spring(entrada, {
      damping: 17,
      mass: 0.7,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const desplazamientoEntrada = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY: desplazamientoEntrada }] }}>
      <Pressable
        onPress={() => {
          hapticSeguro('accion');
          onAbrir(sendero, categoria.acento);
        }}
        style={({ pressed }) => [styles.tarjetaSenderoVertical, pressed && styles.tarjetaSenderoMiniPresionada]}
      >
        <RecuadroGlass blur intensity={48} style={[styles.tarjetaSenderoVerticalGlass, { borderColor: colorConAlpha(categoria.acento, '34') }]}>
          <View pointerEvents="none" style={[styles.tarjetaSenderoTinte, { backgroundColor: colorConAlpha(categoria.acento, '10') }]} />
          <View style={[styles.cintaSenderoVertical, { backgroundColor: categoria.acento }]} />

          <View style={styles.tarjetaSenderoVerticalContenido}>
            <View style={styles.tarjetaSenderoVerticalTexto}>
              <View style={styles.tarjetaSenderoVerticalCabecera}>
                <IconoBaseColor color={categoria.acento} Icono={IconoCategoria} iconoSize={14} size={34} />
                <Texto style={[styles.senderoEstado, { color: categoria.acento }]}>{sendero.estado}</Texto>
              </View>

              <Texto numberOfLines={2} style={styles.tarjetaSenderoVerticalTitulo}>
                {sendero.titulo}
              </Texto>
              <Texto numberOfLines={2} style={styles.tarjetaSenderoVerticalDescripcion}>
                {sendero.descripcion}
              </Texto>

              <View style={styles.chipsMiniSendero}>
                {metadataVisible.map((item) => (
                  <Texto key={item} style={styles.chipMiniSendero}>
                    {item}
                  </Texto>
                ))}
              </View>
            </View>

            <View style={[styles.placeholderIlustracionVertical, { backgroundColor: colorConAlpha(categoria.acento, '1F') }]}>
              <View style={[styles.placeholderIlustracionBrillo, { backgroundColor: colorConAlpha(categoria.acento, '22') }]} />
              <IconoCategoria color={categoria.acento} size={32} strokeWidth={2.4} />
            </View>
          </View>
        </RecuadroGlass>
      </Pressable>
    </Animated.View>
  );
}

function FichaArchivador({ categoria, espacioInferior, sendero, onAbrir }: { categoria: CategoriaCarpeta; espacioInferior: number; sendero: SenderoMini; onAbrir: (sendero: SenderoMini, color: string) => void }) {
  const IconoCategoria = categoria.Icono;
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrada, {
      damping: 17,
      mass: 0.65,
      overshootClamping: true,
      stiffness: 230,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const desplazamiento = entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });

  return (
    <Animated.View
      style={[
        styles.fichaArchivadorPosicion,
        { bottom: espacioInferior, opacity: entrada, transform: [{ translateY: desplazamiento }, { scale: escala }], zIndex: 3 },
      ]}
    >
      <Pressable
        onPress={() => {
          hapticSeguro('accion');
          onAbrir(sendero, categoria.acento);
        }}
        style={({ pressed }) => [styles.fichaArchivadorPresionable, pressed && styles.fichaArchivadorPresionada]}
      >
        <RecuadroGlass blur intensity={54} style={[styles.fichaArchivador, { borderColor: colorConAlpha(categoria.acento, '50') }]}>
          <View pointerEvents="none" style={[styles.tarjetaSenderoTinte, { backgroundColor: colorConAlpha(categoria.acento, '18') }]} />
          <View style={[styles.fichaArchivadorLomo, { backgroundColor: categoria.acento }]} />
          <View style={styles.fichaArchivadorContenido}>
            <IconoBaseColor color={categoria.acento} Icono={IconoCategoria} iconoSize={18} size={48} />
            <View style={styles.fichaArchivadorTexto}>
              <View style={styles.fichaArchivadorCabecera}>
                <Texto style={[styles.senderoEstado, { color: categoria.acento }]}>{sendero.estado}</Texto>
              </View>
              <Texto numberOfLines={2} style={styles.fichaArchivadorTitulo}>{sendero.titulo}</Texto>
              <Texto numberOfLines={1} style={styles.fichaArchivadorMeta}>{sendero.metadata.slice(0, 2).join('  ·  ')}</Texto>
            </View>
          </View>
        </RecuadroGlass>
      </Pressable>
    </Animated.View>
  );
}

function LomoArchivador({ categoria, sendero, onPress }: { categoria: CategoriaCarpeta; sendero: SenderoMini; onPress: () => void }) {
  const IconoCategoria = categoria.Icono;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.lomoArchivador, { backgroundColor: colorConAlpha(categoria.acento, '20') }, pressed && styles.lomoArchivadorPresionado]}>
      <IconoCategoria color={categoria.acento} size={14} strokeWidth={2.6} />
      <Texto numberOfLines={1} style={styles.lomoArchivadorTitulo}>{sendero.titulo}</Texto>
      <ChevronRight color={categoria.acento} size={15} strokeWidth={2.8} />
    </Pressable>
  );
}

function ArchivadorSenderos({ categoria, senderos, onAbrir }: { categoria: CategoriaCarpeta; senderos: SenderoMini[]; onAbrir: (sendero: SenderoMini, color: string) => void }) {
  const [ancho, setAncho] = useState(0);
  const [paginaActiva, setPaginaActiva] = useState(0);
  const [frontalPorPagina, setFrontalPorPagina] = useState<Record<number, string>>({});
  const paginas: SenderoMini[][] = [];

  for (let indice = 0; indice < senderos.length; indice += 3) paginas.push(senderos.slice(indice, indice + 3));

  return (
    <View onLayout={(evento) => setAncho(evento.nativeEvent.layout.width)} style={styles.archivadorRaiz}>
      <View style={styles.archivadorCabecera}>
        <Texto style={[styles.archivadorEtiqueta, { color: categoria.acento }]}>ARCHIVADOR</Texto>
        <Texto style={styles.archivadorContador}>
          {paginaActiva * 3 + 1}-{Math.min((paginaActiva + 1) * 3, senderos.length)} de {senderos.length}
        </Texto>
      </View>
      {ancho > 0 ? (
        <ScrollView
          horizontal
          onMomentumScrollEnd={(evento) => setPaginaActiva(Math.round(evento.nativeEvent.contentOffset.x / ancho))}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.archivadorPaginador}
        >
          {paginas.map((pagina, indicePagina) => {
            const frontalId = frontalPorPagina[indicePagina] ?? pagina[0]?.id;
            const ordenados = [...pagina].sort((a, b) => (a.id === frontalId ? -1 : b.id === frontalId ? 1 : 0));
            const [frontal, ...secundarios] = ordenados;

            return (
              <View key={`pagina-${indicePagina}`} style={[styles.archivadorPagina, { width: ancho }]}>
                {frontal ? (
                  <FichaArchivador
                    key={frontal.id}
                    categoria={categoria}
                    espacioInferior={secundarios.length * 30 + (secundarios.length ? 5 : 0)}
                    sendero={frontal}
                    onAbrir={onAbrir}
                  />
                ) : null}
                {secundarios.length > 0 ? (
                  <View style={styles.lomosArchivador}>
                    {secundarios.map((sendero) => (
                      <LomoArchivador
                        key={sendero.id}
                        categoria={categoria}
                        sendero={sendero}
                        onPress={() => {
                          hapticSeguro('seleccion');
                          setFrontalPorPagina((actual) => ({ ...actual, [indicePagina]: sendero.id }));
                        }}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
      <View style={styles.archivadorPuntos}>
        {paginas.map((_, indice) => <View key={indice} style={[styles.archivadorPunto, { backgroundColor: indice === paginaActiva ? categoria.acento : colorConAlpha(categoria.acento, '24') }]} />)}
      </View>
    </View>
  );
}

function FilaCategoriaCarpeta({
  abierta,
  categoria,
  onAbrir,
  onPress,
}: {
  abierta: boolean;
  categoria: CategoriaCarpeta;
  onAbrir: (sendero: SenderoMini, color: string) => void;
  onPress: () => void;
}) {
  const IconoCategoria = categoria.Icono;
  const progreso = useRef(new Animated.Value(abierta ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progreso, {
      damping: 16,
      mass: 0.7,
      stiffness: 240,
      toValue: abierta ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [abierta, progreso]);

  const giroChevron = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const opacidadContenido = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <View style={[styles.filaCategoria, { borderColor: colorConAlpha(categoria.acento, '36') }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.categoriaBoton, pressed && styles.categoriaBotonPresionada]}>
        <IconoBaseColor color={categoria.acento} Icono={IconoCategoria} />

        <View style={styles.categoriaTexto}>
          <Texto style={styles.categoriaTitulo}>{categoria.titulo}</Texto>
          <Texto numberOfLines={1} style={styles.categoriaDescripcion}>
            {categoria.descripcion}
          </Texto>
        </View>

        <View style={[styles.categoriaContador, { backgroundColor: colorConAlpha(categoria.acento, '18') }]}>
          <Texto style={[styles.categoriaContadorTexto, { color: categoria.acento }]}>{categoria.senderos.length}</Texto>
        </View>

        <Animated.View style={{ transform: [{ rotate: giroChevron }] }}>
          <ChevronRight color={categoria.acento} size={19} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      {abierta ? (
        <Animated.View style={[styles.carruselCategoria, { opacity: opacidadContenido }]}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.carruselCategoriaContenido}
            showsHorizontalScrollIndicator={false}
          >
            {categoria.senderos.map((sendero) => (
              <TarjetaSenderoMini key={sendero.id} categoria={categoria} sendero={sendero} onAbrir={onAbrir} />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

function SeparadorColorCarpeta({
  activo,
  item,
  onPress,
  seleccionado = false,
  oculto = false,
  cerrandoPrincipal = false,
  entrada = false,
  elevarAlPresionar = true,
  animacionInterna = true,
  retrasoEntrada = 0,
}: {
  activo: boolean;
  item: Pick<CategoriaCarpeta, 'acento' | 'Icono' | 'titulo' | 'etiquetaSeparador'> | SubcategoriaCarpeta;
  onPress: () => void;
  seleccionado?: boolean;
  oculto?: boolean;
  cerrandoPrincipal?: boolean;
  entrada?: boolean;
  elevarAlPresionar?: boolean;
  animacionInterna?: boolean;
  retrasoEntrada?: number;
}) {
  const IconoCategoria = item.Icono;
  const progreso = useRef(new Animated.Value(activo ? 1 : 0)).current;
  const visibilidad = useRef(new Animated.Value(oculto || entrada ? 0 : 1)).current;
  const presion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = cerrandoPrincipal
      ? Animated.timing(progreso, {
          duration: 360,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        })
      : Animated.spring(progreso, {
          damping: 15,
          mass: 0.72,
          stiffness: 235,
          toValue: activo ? 1 : 0,
          useNativeDriver: true,
        });

    animacion.start();
    return () => animacion.stop();
  }, [activo, cerrandoPrincipal, progreso]);

  useEffect(() => {
    Animated.timing(visibilidad, {
      delay: entrada && !oculto ? retrasoEntrada : 0,
      duration: oculto ? 170 : 180,
      toValue: oculto ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [entrada, oculto, visibilidad]);

  const desplazamiento = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, desplazamientoSeparadorActivo],
  });
  const escala = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const opacidadTexto = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const desplazamientoVisibilidad = visibilidad.interpolate({
    inputRange: [0, 1],
    outputRange: [altoSeparadorCompleto, 0],
  });
  const elevacionPresion = presion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });
  const etiquetaSeparador = 'etiquetaSeparador' in item ? item.etiquetaSeparador ?? item.titulo : item.titulo;
  const textoLargo = etiquetaSeparador.length > 8;

  const contenido = (
    <Pressable
      disabled={oculto}
      onPress={onPress}
      onPressIn={() => elevarAlPresionar && Animated.spring(presion, { damping: 16, stiffness: 340, toValue: 1, useNativeDriver: true }).start()}
      onPressOut={() => elevarAlPresionar && Animated.spring(presion, { damping: 13, stiffness: 250, toValue: 0, useNativeDriver: true }).start()}
      style={styles.separadorCarpetaHitbox}
    >
      <Animated.View
        style={[
          styles.pestanaColorCarpeta,
          {
            backgroundColor: item.acento,
            transform: !animacionInterna
              ? []
              : elevarAlPresionar
              ? [{ translateY: desplazamiento }, { translateY: elevacionPresion }, { scale: escala }]
              : [{ translateY: desplazamiento }, { scale: escala }],
          },
        ]}
      >
        <View pointerEvents="none" style={styles.pestanaColorActivaBrillo} />
        {seleccionado ? <View pointerEvents="none" style={styles.pestanaColorBordeSeleccionado} /> : null}
        <View pointerEvents="none" style={styles.pestanaColorIcono}>
          <IconoCategoria color="#FFFFFF" size={15} strokeWidth={2.6} />
        </View>
        <Animated.Text style={[styles.pestanaColorTexto, textoLargo && styles.pestanaColorTextoLargo, { opacity: seleccionado ? 1 : opacidadTexto }]}>
          {etiquetaSeparador}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );

  if (!animacionInterna) return contenido;

  return (
    <Animated.View style={{ opacity: visibilidad, transform: [{ translateY: desplazamientoVisibilidad }] }}>
      {contenido}
    </Animated.View>
  );
}

function SeparadorSubcategoria({
  categoriaId,
  indice,
  item,
  onPress,
  cerrando = false,
  retrasoEntrada,
  seleccionado,
  total,
}: {
  categoriaId: CategoriaSenderoId;
  indice: number;
  item: SubcategoriaCarpeta;
  onPress: () => void;
  cerrando?: boolean;
  retrasoEntrada: number;
  seleccionado: boolean;
  total: number;
}) {
  const entrada = useRef(new Animated.Value(0)).current;
  const salida = useRef(new Animated.Value(1)).current;
  const [entradaTerminada, setEntradaTerminada] = useState(false);
  const IconoSubcategoria = item.Icono;
  const centro = (total - 1) / 2;
  const distanciaCentro = Math.abs(indice - centro);
  const distanciaMaxima = Math.max(centro, 1);
  const direccionCentro = indice < centro ? 1 : -1;
  const ordenAlternado = indice % 2 === 0 ? Math.floor(indice / 2) : Math.floor((total + indice) / 2);
  const retrasoSalida = categoriaId === 'rutinas' || categoriaId === 'finanzas'
    ? Math.round((distanciaMaxima - distanciaCentro) * 130)
    : categoriaId === 'salud'
    ? Math.round(distanciaCentro * 115)
    : categoriaId === 'habitos' || categoriaId === 'estudio'
    ? indice * 105
    : categoriaId === 'tareas'
    ? Math.round((distanciaMaxima - distanciaCentro) * 120)
    : ordenAlternado * 100;

  useEffect(() => {
    Animated.timing(entrada, {
      delay: retrasoEntrada,
      duration: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setEntradaTerminada(true);
    });
  }, [entrada, retrasoEntrada]);

  useEffect(() => {
    if (!cerrando) return;
    Animated.timing(salida, {
      delay: retrasoSalida,
      duration: 360,
      easing: Easing.inOut(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [categoriaId, cerrando, indice, salida, total]);

  const desplazamiento = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const desplazamientoSalida = salida.interpolate({
    inputRange: [0, 1],
    outputRange: [categoriaId === 'habitos' ? 28 : 18, 0],
  });
  const desplazamientoLateralSalida = salida.interpolate({
    inputRange: [0, 1],
    outputRange: [categoriaId === 'finanzas' ? direccionCentro * 18 : categoriaId === 'tareas' || categoriaId === 'relaciones' ? direccionCentro * 12 : categoriaId === 'estudio' ? -14 : 0, 0],
  });
  const escalaSalida = salida.interpolate({
    inputRange: [0, 1],
    outputRange: [categoriaId === 'salud' ? 0.82 : 0.9, 1],
  });

  const contenido = (
    <Pressable onPress={onPress} style={styles.separadorCarpetaHitbox}>
      <View
        style={[
          styles.pestanaColorCarpeta,
          { backgroundColor: item.acento },
        ]}
      >
        <View pointerEvents="none" style={styles.pestanaColorActivaBrillo} />
        {seleccionado ? <View pointerEvents="none" style={styles.pestanaColorBordeSeleccionado} /> : null}
        <View pointerEvents="none" style={styles.pestanaColorIcono}>
          <IconoSubcategoria color="#FFFFFF" size={15} strokeWidth={2.6} />
        </View>
      </View>
    </Pressable>
  );

  if (cerrando) {
    return (
      <Animated.View style={{ opacity: salida, transform: [{ translateX: desplazamientoLateralSalida }, { translateY: desplazamientoSalida }, { scale: escalaSalida }] }}>
        {contenido}
      </Animated.View>
    );
  }

  if (entradaTerminada) return <View>{contenido}</View>;

  return (
    <Animated.View style={{ opacity: entrada, transform: [{ translateY: desplazamiento }] }}>
      {contenido}
    </Animated.View>
  );
}

function ParticulaEnfoque({ activa, color, izquierda, retraso, subida }: { activa: boolean; color: string; izquierda: `${number}%`; retraso: number; subida: number }) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activa) {
      progreso.setValue(0);
      return;
    }

    const animacion = Animated.sequence([
      Animated.delay(retraso),
      Animated.timing(progreso, { duration: 430, toValue: 1, useNativeDriver: true }),
    ]);
    animacion.start();

    return () => animacion.stop();
  }, [activa, progreso, retraso]);

  return (
    <Animated.View
      style={[
        styles.particulaEnfoque,
        {
          backgroundColor: color,
          left: izquierda,
          opacity: progreso.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.92, 0] }),
          transform: [
            { scale: progreso.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.45, 1, 0.7] }) },
            { translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, subida] }) },
          ],
        },
      ]}
    />
  );
}

function ParticulasEnfoque({ activas, color }: { activas: boolean; color: string }) {
  const particulas: Array<{ izquierda: `${number}%`; retraso: number; subida: number }> = [
    { izquierda: '20%', retraso: 0, subida: -42 },
    { izquierda: '38%', retraso: 35, subida: -62 },
    { izquierda: '56%', retraso: 70, subida: -38 },
    { izquierda: '74%', retraso: 110, subida: -54 },
  ];

  return (
    <View pointerEvents="none" style={styles.particulasEnfoque}>
      {particulas.map((particula) => (
        <ParticulaEnfoque
          activa={activas}
          color={color}
          key={particula.izquierda}
          izquierda={particula.izquierda}
          retraso={particula.retraso}
          subida={particula.subida}
        />
      ))}
    </View>
  );
}

function MapaSubcategoria({ alturaEnfoque, categoria, color, enfocado, onMedirInicio, subcategoriaId }: { alturaEnfoque: number; categoria: CategoriaCarpeta; color: string; enfocado: boolean; onMedirInicio: (posicion: number) => void; subcategoriaId: string }) {
  const referenciaMapa = useRef<View>(null);

  function medirInicioMapa() {
    if (enfocado) return;

    requestAnimationFrame(() => {
      referenciaMapa.current?.measureInWindow((_x, y) => onMedirInicio(Math.round(y)));
    });
  }

  return (
    <View ref={referenciaMapa} onLayout={medirInicioMapa} style={[styles.mapaSubcategoria, { backgroundColor: colorPastel(color, 0.055), height: alturaEnfoque }]}>
      {categoria.id === 'salud' && subcategoriaId === 'ejercicio' ? (
        <ContenedorMapaSenderos altura={alturaEnfoque} color={color} enfocado={enfocado} subcategoriaId={subcategoriaId} />
      ) : (
        <ScrollView
          nestedScrollEnabled
          scrollEnabled={enfocado}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mapaSubcategoriaContenido}
        >
          <ParticulasEnfoque activas={enfocado} color={color} />
        </ScrollView>
      )}
    </View>
  );
}

function CarpetaGiganteSenderos({ alturaMapaEnfoque, alturaObjetivoEnfoque, categoriaAbierta, elevacionEnfoque, layoutEnfoqueActivo, mapaEnfocado, mostrarAccionContextual, onAbrir, onActivarMapaEnfocado, onDesactivarMapaEnfocado, onMedirElevacionEnfoque, onMedirInicioMapa, progresoEnfoque, setCategoriaAbierta }: { alturaMapaEnfoque: number; alturaObjetivoEnfoque: number; categoriaAbierta: string; elevacionEnfoque: number; layoutEnfoqueActivo: boolean; mapaEnfocado: boolean; mostrarAccionContextual: boolean; onAbrir: (sendero: SenderoMini, color: string) => void; onActivarMapaEnfocado: (elevacion: number) => void; onDesactivarMapaEnfocado: () => void; onMedirElevacionEnfoque: (elevacion: number) => void; onMedirInicioMapa: (posicion: number) => void; progresoEnfoque: Animated.Value; setCategoriaAbierta: React.Dispatch<React.SetStateAction<string>> }) {
  const [itemsCargados, setItemsCargados] = useState(0);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState('');
  const [subcategoriasVisibles, setSubcategoriasVisibles] = useState(false);
  const [bajandoCategoria, setBajandoCategoria] = useState(false);
  const [cerrandoSubcategorias, setCerrandoSubcategorias] = useState(false);
  const [ocultandoCategoria, setOcultandoCategoria] = useState(false);
  const [retornandoCuerpo, setRetornandoCuerpo] = useState(false);
  const [raizOculta, setRaizOculta] = useState(false);
  const [animandoEntradaRaiz, setAnimandoEntradaRaiz] = useState(false);
  const cierreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const referenciaSeparadores = useRef<View>(null);
  const definirAccionBarra = usarAccionBarraSenderos((estado) => estado.definirAccion);
  const limpiarAccionBarra = usarAccionBarraSenderos((estado) => estado.limpiarAccion);

  useEffect(() => {
    let timeout: any;
    if (itemsCargados < categoriasCarpeta.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 55); // A bit faster for tabs so it feels snappy
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);

  const entradaCarpeta = useRef(new Animated.Value(0)).current;
  const progresoModo = useRef(new Animated.Value(1)).current;
  const brilloCarpeta = useRef(new Animated.Value(0)).current;
  const retornoCuerpoCarpeta = useRef(new Animated.Value(0)).current;
  const categoriaEnfocada = categoriasCarpeta.find((categoria) => categoria.id === categoriaAbierta) ?? null;
  const IconoCategoriaEnfocada = categoriaEnfocada?.Icono;
  const subcategorias = categoriaEnfocada ? subcategoriasPorCategoria[categoriaEnfocada.id] : [];
  const subcategoriaEnfocada = subcategorias.find((subcategoria) => subcategoria.id === subcategoriaActiva) ?? null;
  const senderosVisibles = subcategoriaEnfocada && !subcategoriaEnfocada.esCrear
    ? categoriaEnfocada?.senderos.filter((sendero) => subcategoriaEnfocada.senderoIds.includes(sendero.id)) ?? []
    : categoriaEnfocada?.senderos ?? [];

  const alternarEnfoque = useCallback(() => {
    if (mapaEnfocado) {
      onDesactivarMapaEnfocado();
      return;
    }

    referenciaSeparadores.current?.measureInWindow((_x, y) => {
      const elevacion = Math.max(0, Math.round(y - alturaObjetivoEnfoque));
      onMedirElevacionEnfoque(elevacion);
      onActivarMapaEnfocado(elevacion);
    });
  }, [alturaObjetivoEnfoque, mapaEnfocado, onActivarMapaEnfocado, onDesactivarMapaEnfocado, onMedirElevacionEnfoque]);

  useEffect(() => {
    const categoriaConAccion = subcategoriaEnfocada && !subcategoriaEnfocada.esCrear
      ? subcategoriaEnfocada
      : categoriaEnfocada;

    if (mostrarAccionContextual && (categoriaConAccion || mapaEnfocado)) {
      definirAccionBarra({ color: categoriaConAccion?.acento ?? Bioma.MasterColor, ejecutar: alternarEnfoque });
      return;
    }

    limpiarAccionBarra();
  }, [alternarEnfoque, categoriaEnfocada, definirAccionBarra, limpiarAccionBarra, mapaEnfocado, mostrarAccionContextual, subcategoriaEnfocada]);

  useEffect(() => () => limpiarAccionBarra(), [limpiarAccionBarra]);

  const medirElevacionEnfoque = useCallback(() => {
    if (mapaEnfocado || layoutEnfoqueActivo) return;

    requestAnimationFrame(() => {
      referenciaSeparadores.current?.measureInWindow((_x, y) => {
        // Situa toda la cabeza de los separadores dentro de la ilustracion.
        const elevacion = Math.max(0, Math.round(y - alturaObjetivoEnfoque));
        onMedirElevacionEnfoque(elevacion);
      });
    });
  }, [alturaObjetivoEnfoque, layoutEnfoqueActivo, mapaEnfocado, onMedirElevacionEnfoque]);

  useEffect(() => {
    medirElevacionEnfoque();
  }, [categoriaAbierta, medirElevacionEnfoque, subcategoriasVisibles]);

  useEffect(() => {
    Animated.spring(entradaCarpeta, {
      damping: 18,
      mass: 0.72,
      stiffness: 210,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entradaCarpeta]);

  useEffect(() => {
    progresoModo.setValue(0);
    Animated.spring(progresoModo, {
      damping: 18,
      mass: 0.7,
      stiffness: 230,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [categoriaAbierta, progresoModo]);

  useLayoutEffect(() => {
    if (!retornandoCuerpo || categoriaAbierta) return;

    retornoCuerpoCarpeta.setValue(1);
    const frame = requestAnimationFrame(() => {
      Animated.timing(retornoCuerpoCarpeta, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setRetornandoCuerpo(false);
        setRaizOculta(false);
        setAnimandoEntradaRaiz(true);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [categoriaAbierta, retornoCuerpoCarpeta, retornandoCuerpo]);

  useEffect(() => {
    if (!categoriaAbierta) {
      setSubcategoriasVisibles(false);
      return;
    }

    const timeout = setTimeout(() => setSubcategoriasVisibles(true), 185);
    return () => clearTimeout(timeout);
  }, [categoriaAbierta]);

  useEffect(() => () => {
    if (cierreTimeout.current) clearTimeout(cierreTimeout.current);
  }, []);

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(brilloCarpeta, {
          duration: 1800,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(brilloCarpeta, {
          duration: 1400,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animacion.start();
    return () => animacion.stop();
  }, [brilloCarpeta]);

  function alternarCategoria(id: string) {
    if (cerrandoSubcategorias) return;
    hapticSeguro('seleccion');
    setCategoriaAbierta((actual) => {
      if (actual === id) {
        setSubcategoriaActiva('');
        cierreTimeout.current = setTimeout(() => {
          setCerrandoSubcategorias(true);
          cierreTimeout.current = setTimeout(() => {
            setOcultandoCategoria(true);
            cierreTimeout.current = setTimeout(() => {
              setRaizOculta(true);
              setRetornandoCuerpo(true);
              setSubcategoriasVisibles(false);
              setCategoriaAbierta('');
              setBajandoCategoria(false);
              setCerrandoSubcategorias(false);
              setOcultandoCategoria(false);
            }, 300);
          }, 780);
        }, 390);
        setBajandoCategoria(true);
        return actual;
      }
      setSubcategoriaActiva('');
      return id;
    });
  }

  function seleccionarSubcategoria(id: string) {
    hapticSeguro('seleccion');
    setSubcategoriaActiva((actual) => actual === id ? actual : id);
  }

  const desplazamientoEntrada = entradaCarpeta.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const desplazamientoModo = progresoModo.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const desplazamientoBrillo = brilloCarpeta.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 8],
  });
  const opacidadBrillo = brilloCarpeta.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.22, 0.48, 0.24],
  });
  const desplazamientoRetornoCuerpo = retornoCuerpoCarpeta.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 38],
  });
  return (
    <Animated.View
      style={[
        styles.carpetaGigante,
        mapaEnfocado && styles.carpetaGiganteEnfocada,
        { opacity: entradaCarpeta, transform: [{ translateY: desplazamientoEntrada }] },
      ]}
    >
      <View ref={referenciaSeparadores} onLayout={medirElevacionEnfoque} style={[styles.pestanasColorCarpeta, categoriaEnfocada && styles.pestanasColorCarpetaActiva]}>
        {categoriasCarpeta.map((item, index) => {
          if (index >= itemsCargados) {
            return (
              <View 
                key={`skel-sep-${item.id}`}
                style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 14, borderTopRightRadius: 14, marginRight: 2 }} 
              />
            );
          }
          return (
            <SeparadorColorCarpeta
              key={item.id}
              activo={categoriaAbierta === item.id && !bajandoCategoria}
              cerrandoPrincipal={categoriaAbierta === item.id && bajandoCategoria}
              entrada={animandoEntradaRaiz}
              item={item}
              oculto={raizOculta || (Boolean(categoriaAbierta) && (categoriaAbierta !== item.id || ocultandoCategoria))}
              onPress={() => alternarCategoria(item.id)}
              retrasoEntrada={index * 55}
            />
          );
        })}
        {categoriaEnfocada && subcategoriasVisibles ? (
          <View pointerEvents="box-none" style={styles.subcategoriasOverlay}>
            {subcategorias.map((subcategoria, index) => {
              const indiceRaiz = categoriasCarpeta.findIndex((categoria) => categoria.id === categoriaEnfocada.id);
              const indiceVisual = index >= indiceRaiz ? index + 1 : index;
              return (
                <View
                  key={`${categoriaEnfocada.id}-${subcategoria.id}`}
                  style={[
                    styles.subcategoriaPosicion,
                    { bottom: subcategoriaActiva === subcategoria.id ? 6 : 0, left: 18 + indiceVisual * 43 },
                  ]}
                >
                  <SeparadorSubcategoria
                    categoriaId={categoriaEnfocada.id}
                    cerrando={cerrandoSubcategorias}
                    indice={index}
                    item={subcategoria}
                    onPress={() => seleccionarSubcategoria(subcategoria.id)}
                    retrasoEntrada={index * 58}
                    seleccionado={subcategoriaActiva === subcategoria.id}
                    total={subcategorias.length}
                  />
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      <Animated.View style={[styles.carpetaGiganteCuerpoCapa, { transform: [{ translateY: desplazamientoRetornoCuerpo }] }]}>
      <RecuadroGlass blur intensity={77} style={styles.carpetaGiganteCuerpo}>
        <View pointerEvents="none" style={styles.carpetaGiganteTinte} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.carpetaGiganteBrillo,
            { opacity: opacidadBrillo, transform: [{ rotate: '-12deg' }, { translateX: desplazamientoBrillo }] },
          ]}
        />
        <View style={styles.carpetaGiganteCabecera}>
          <View style={styles.carpetaGiganteTituloBloque}>
            <Texto style={styles.carpetaGiganteTitulo}>
              {subcategoriaEnfocada ? `${categoriaEnfocada?.titulo} / ${subcategoriaEnfocada.titulo}` : categoriaEnfocada ? categoriaEnfocada.titulo : 'Biblioteca de senderos'}
            </Texto>
            <Texto style={styles.carpetaGiganteSubtitulo}>
              {subcategoriaEnfocada?.esCrear ? 'Prepara una nueva division para tus senderos.' : subcategoriaEnfocada ? `Senderos de ${subcategoriaEnfocada.titulo.toLowerCase()}.` : categoriaEnfocada ? categoriaEnfocada.descripcion : 'Abre una categoria y desliza sus caminos'}
            </Texto>
          </View>
          <View style={styles.carpetaGiganteSello}>
            {categoriaEnfocada && IconoCategoriaEnfocada ? (
              <IconoCategoriaEnfocada color={categoriaEnfocada.acento} size={18} strokeWidth={2.3} />
            ) : (
              <Sparkles color={Bioma.MasterColor} size={18} strokeWidth={2.3} />
            )}
          </View>
        </View>

        {categoriaEnfocada ? (
          <Animated.View style={[styles.modoCategoria, { opacity: progresoModo, transform: [{ translateY: desplazamientoModo }] }]}>
            {subcategoriaEnfocada && !subcategoriaEnfocada.esCrear ? (
              <MapaSubcategoria
                alturaEnfoque={alturaMapaEnfoque}
                categoria={categoriaEnfocada}
                color={subcategoriaEnfocada.acento}
                enfocado={mapaEnfocado}
                onMedirInicio={onMedirInicioMapa}
                subcategoriaId={subcategoriaEnfocada.id}
              />
            ) : !subcategoriaEnfocada ? (
              <>
                <Reanimated.View key={'busq-' + categoriaEnfocada.id} entering={FadeInDown.delay(180).duration(300)} style={styles.barraBusquedaCategoria}>
                  <Search color={categoriaEnfocada.acento} size={15} strokeWidth={2.4} />
                  <Texto style={styles.barraBusquedaTexto}>Buscar en {categoriaEnfocada.titulo.toLowerCase()}</Texto>
                </Reanimated.View>

                <Reanimated.View key={'filt-' + categoriaEnfocada.id} entering={FadeInDown.delay(300).duration(400)} style={styles.filtrosCategoria}>
                  <Texto style={[styles.filtroCategoriaActivo, { backgroundColor: colorConAlpha(categoriaEnfocada.acento, '24'), color: categoriaEnfocada.acento }]}>
                    Todos
                  </Texto>
                  <Texto style={styles.filtroCategoria}>Activos</Texto>
                  <Texto style={styles.filtroCategoria}>Recientes</Texto>
                </Reanimated.View>
              </>
            ) : null}

            {subcategoriaEnfocada?.esCrear ? (
              <View style={styles.estadoNuevaSubcategoria}>
                <Plus color={categoriaEnfocada.acento} size={20} strokeWidth={2.6} />
                <Texto style={styles.estadoNuevaSubcategoriaTitulo}>Nueva subcategoria</Texto>
                <Texto style={styles.estadoNuevaSubcategoriaTexto}>Aqui podras ordenar senderos con tu propio nombre y color.</Texto>
              </View>
            ) : !subcategoriaEnfocada ? (
              <ArchivadorSenderos categoria={categoriaEnfocada} senderos={senderosVisibles} onAbrir={onAbrir} />
            ) : null}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.filasCarpeta, { opacity: progresoModo, transform: [{ translateY: desplazamientoModo }] }]}>
            {categoriasCarpeta.map((categoria, index) => {
              if (index >= itemsCargados) {
                return (
                  <View 
                    key={`skel-fila-${categoria.id}`} 
                    style={{ width: '100%', height: 72, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} 
                  />
                );
              }
              return (
                <FilaCategoriaCarpeta
                  key={categoria.id}
                  abierta={categoriaAbierta === categoria.id}
                  categoria={categoria}
                  onAbrir={onAbrir}
                  onPress={() => alternarCategoria(categoria.id)}
                />
              );
            })}
          </Animated.View>
        )}
      </RecuadroGlass>
      </Animated.View>
    </Animated.View>
  );
}

export function SenderosPantalla() {
  const { height, width } = useWindowDimensions();
  const pantallaSenderosVisible = usePathname().includes('/senderos');
  
  useEffect(() => {
    // Optimization 4: Prefetch large illustrations
    const imagenes = [
      require('../../../../assets/ilustraciones/senderos/rutina.png'),
      require('../../../../assets/ilustraciones/senderos/salud.png'),
      require('../../../../assets/ilustraciones/senderos/habitos.png'),
      require('../../../../assets/ilustraciones/senderos/tareas.png'),
      require('../../../../assets/ilustraciones/senderos/finanzas.png'),
      require('../../../../assets/ilustraciones/senderos/relaciones.png'),
      require('../../../../assets/ilustraciones/senderos/estudio.png'),
    ];
    // In React Native, `require` bundles images, so prefetching URI isn't strictly necessary for local,
    // but forcing early evaluation helps avoid JS thread drops during render.
    imagenes.forEach(img => {
       if (typeof img === 'string') Image.prefetch(img).catch(() => {});
    });
  }, []);
  const insets = useSafeAreaInsets();
  const [pestanaActiva, setPestanaActiva] = useState<PaginaSenderosId>('mis-senderos');
  const [sharedHeroData, setSharedHeroData] = useState<any>(null);
  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');
  const [categoriaAbierta, setCategoriaAbierta] = useState('');
  const [mapaEnfocado, setMapaEnfocado] = useState(false);
  const [layoutEnfoqueActivo, setLayoutEnfoqueActivo] = useState(false);
  const [elevacionEnfoqueMapa, setElevacionEnfoqueMapa] = useState(0);
  const [inicioMapaEnPantalla, setInicioMapaEnPantalla] = useState(0);
  const [senderoAbierto, setSenderoAbierto] = useState<{ sendero: SenderoMini; color: string } | null>(null);
  const progresoPestana = useRef(new Animated.Value(0)).current;
  const progresoEnfoqueMapa = useRef(new Animated.Value(0)).current;
  const ultimoTapPestana = useRef(0);
  const activarMapaEnfocado = useCallback((elevacion: number) => {
    setElevacionEnfoqueMapa(elevacion);
    setLayoutEnfoqueActivo(true);
    setMapaEnfocado(true);
  }, []);
  const cerrarMapaEnfocado = useCallback(() => setMapaEnfocado(false), []);
  const registrarElevacionEnfoque = useCallback((elevacion: number) => {
    setElevacionEnfoqueMapa((actual) => Math.abs(actual - elevacion) < 1 ? actual : elevacion);
  }, []);
  const registrarInicioMapa = useCallback((posicion: number) => {
    setInicioMapaEnPantalla((actual) => Math.abs(actual - posicion) < 1 ? actual : posicion);
  }, []);

  const handleCambiarPestana = (id: PaginaSenderosId) => {
    const ahora = Date.now();
    if (ahora - ultimoTapPestana.current < 350) return; // Bloqueo Anti-Spam
    ultimoTapPestana.current = ahora;
    if (id !== 'mis-senderos') cerrarMapaEnfocado();
    if (id === pestanaActiva) return;
    hapticSeleccion();
    setPestanaActiva(id);
  };
  const altoSuperior = height * 0.4;
  const profundidadEnfoqueSobreIlustracion = altoSuperior * 0.20;
  const altoZonaPestanas = height - altoSuperior + 28;
  const limiteInferiorMapa = height - insets.bottom - 82;
  const inicioMapaEnEnfoque = inicioMapaEnPantalla - elevacionEnfoqueMapa;
  const alturaMapaEnfoque = inicioMapaEnPantalla > 0
    ? Math.max(260, limiteInferiorMapa - inicioMapaEnEnfoque)
    : 420;
  const anchoSubtitulo = width * 0.5;
  const anchoTabs = width - espaciado.lg * 2;
  const anchoIndicador = (anchoTabs - paddingPestanas * 2 - gapPestanas * (pestanasSenderos.length - 1)) / pestanasSenderos.length;
  const indiceActivo = pestanasSenderos.findIndex(({ id }) => id === pestanaActiva);
  const desplazamientoIndicador = progresoPestana.interpolate({
    inputRange: pestanasSenderos.map((_, indice) => indice),
    outputRange: pestanasSenderos.map((_, indice) => indice * (anchoIndicador + gapPestanas)),
  });
  const opacidadPestanasEnfoque = progresoEnfoqueMapa.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const desplazamientoPestanasEnfoque = progresoEnfoqueMapa.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const desplazamientoScrollEnfoque = progresoEnfoqueMapa.interpolate({
    inputRange: [0, 1],
    outputRange: [elevacionEnfoqueMapa, 0],
  });
  const contenidoActivo = paginasSenderos[pestanaActiva];

  let headerImg = require('../../../../assets/ilustraciones/senderos.png');
  let headerTitle = '{headerTitle}';
  let emptyStateTitle = 'Aún no tienes senderos';
  let emptyStateSub = 'Crea tu primer camino y empieza a construir hábitos que te acerquen a tus metas.';
  let EmptyIcon = Sprout;
  let emptyIconColor = Bioma.MasterColor;
  const catActiva = pestanaActiva === 'mis-senderos' ? categoriaAbierta : pestanaActiva === 'analisis' ? analisisCategoria : null;
  const catInfo = categoriasCarpeta.find(c => c.id === catActiva);
  if (catInfo) {
    EmptyIcon = catInfo.Icono;
    emptyIconColor = catInfo.acento;
  }
  
  if (catActiva) {
    let mapCat = catActiva;

    if (mapCat === 'rutinas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/rutina.png');
      headerTitle = 'La disciplina forja el carácter';
      emptyStateTitle = 'No tienes rutinas activas';
      emptyStateSub = 'Configura tu mañana ideal y asegura tus victorias diarias.';
    } else if (mapCat === 'salud') {
      headerImg = require('../../../../assets/ilustraciones/senderos/salud.png');
      headerTitle = 'Tu cuerpo es tu templo';
      emptyStateTitle = 'Sin metas de salud';
      emptyStateSub = 'Programa tus sesiones de entrenamiento y nutrición.';
    } else if (mapCat === 'habitos') {
      headerImg = require('../../../../assets/ilustraciones/senderos/habitos.png');
      headerTitle = 'Pequeñas acciones, grandes resultados';
      emptyStateTitle = 'Sin hábitos rastreados';
      emptyStateSub = 'Elige un hábito pequeño y empieza tu primera racha hoy.';
    } else if (mapCat === 'tareas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/tareas.png');
      headerTitle = 'El orden es tu mejor aliado';
      emptyStateTitle = 'El tablero está limpio';
      emptyStateSub = 'No hay tareas pendientes. Agrega un proyecto para empezar.';
    } else if (mapCat === 'finanzas') {
      headerImg = require('../../../../assets/ilustraciones/senderos/finanzas.png');
      headerTitle = 'Construye tu imperio, paso a paso';
      emptyStateTitle = 'Sin presupuestos o metas';
      emptyStateSub = 'Traza una meta de ahorro y controla tu patrimonio.';
    } else if (mapCat === 'relaciones') {
      headerImg = require('../../../../assets/ilustraciones/senderos/relaciones.png');
      headerTitle = 'Conecta, nutre y crece';
      emptyStateTitle = 'Red de contactos vacía';
      emptyStateSub = 'Programa recordatorios para cultivar tus relaciones importantes.';
    } else if (mapCat === 'estudio') {
      headerImg = require('../../../../assets/ilustraciones/senderos/estudio.png');
      headerTitle = 'El conocimiento es libertad';
      emptyStateTitle = 'Sin currículum de aprendizaje';
      emptyStateSub = 'Crea un sendero de estudio para esa habilidad que quieres dominar.';
    }
  }


  useEffect(() => {
    Animated.spring(progresoPestana, {
      damping: 19,
      mass: 0.75,
      stiffness: 260,
      toValue: indiceActivo,
      useNativeDriver: true,
    }).start();
  }, [indiceActivo, progresoPestana]);

  useEffect(() => {
    const animacion = Animated.spring(progresoEnfoqueMapa, {
      damping: 20,
      mass: 0.7,
      overshootClamping: true,
      stiffness: 220,
      toValue: mapaEnfocado ? 1 : 0,
      useNativeDriver: true,
    });

    animacion.start(({ finished }) => {
      if (finished && !mapaEnfocado) {
        progresoEnfoqueMapa.setValue(0);
      }
    });

    return () => animacion.stop();
  }, [mapaEnfocado, progresoEnfoqueMapa]);

  return (
    <SafeAreaView style={styles.raiz} edges={['left', 'right', 'top', 'bottom']}>
      <View style={[styles.superior, { height: altoSuperior }]}>
        <Reanimated.View key={headerImg} entering={FadeIn.duration(1200)} style={StyleSheet.absoluteFill}>
          <Image source={headerImg} resizeMode="cover" style={styles.ilustracion} />
        </Reanimated.View>

        <View pointerEvents="none" style={styles.veloIlustracion} />

        <View style={styles.encabezadoTexto}>
          <View style={styles.tituloFila}>
            <Texto style={styles.titulo}>Senderos</Texto>
            <Sprout color={Bioma.MasterColor} size={21} strokeWidth={2.4} />
          </View>
          <Reanimated.View key={'tit-' + headerTitle} entering={FadeInDown.delay(100).duration(500)}>
            <Texto style={[styles.subtitulo, { maxWidth: anchoSubtitulo }]}>
              {headerTitle}
            </Texto>
          </Reanimated.View>
        </View>

        <Reanimated.View key={'emp-' + headerTitle + (sharedHeroData?.id || '')} entering={FadeInDown.delay(800).duration(700)} style={styles.estadoVacioPosicion}>
          <RecuadroGlass style={styles.estadoVacio}>
            {pestanaActiva === 'compartidos' && sharedHeroData ? (
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {React.createElement(categoriasCarpeta.find(c => c.id === sharedHeroData.categoriaId)?.Icono || Compass, { color: sharedHeroData.acento, size: 14, strokeWidth: 3 })}
                  <Texto style={[styles.estadoTitulo, { color: sharedHeroData.acento, flex: 1, marginTop: 0 }]} numberOfLines={1}>{sharedHeroData.titulo}</Texto>
                </View>
                <Texto style={styles.estadoSubtitulo} numberOfLines={2}>{sharedHeroData.descripcion}</Texto>
                <View style={{ marginTop: 4 }}>
                  <BarraProgresoLiquida porcentaje={sharedHeroData.progresoPorcentaje} color={sharedHeroData.acento} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {sharedHeroData.miembros.map((m: any, i: number) => (
                      <View key={m.id} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: m.colorAvatar, justifyContent: 'center', alignItems: 'center', marginLeft: i > 0 ? -6 : 0, borderWidth: 1, borderColor: '#FFF' }}>
                        <Texto style={{ fontSize: 6, fontFamily: 'MontserratAlternates-Bold', color: '#FFF' }}>{m.iniciales}</Texto>
                      </View>
                    ))}
                  </View>
                  <Texto style={{ fontSize: 8, fontFamily: 'MontserratAlternates-Bold', color: '#777' }}>{sharedHeroData.progresoPorcentaje}% Completado</Texto>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.iconoPlanta}>
                  <EmptyIcon color={emptyIconColor} size={20} strokeWidth={2.4} />
                </View>
                <Texto style={styles.estadoTitulo}>{emptyStateTitle}</Texto>
                <Texto style={styles.estadoSubtitulo}>
                  {emptyStateSub}
                </Texto>
              </>
            )}
          </RecuadroGlass>
        </Reanimated.View>
      </View>

      <View style={[styles.contenedorPestanas, { height: altoZonaPestanas }]}>
        <View pointerEvents="none" style={styles.nieblaInferior}>
          <FogEffectSkia style={styles.niebla} />
        </View>

        <Animated.View
          pointerEvents={mapaEnfocado ? 'none' : 'auto'}
          style={{ opacity: opacidadPestanasEnfoque, transform: [{ translateY: desplazamientoPestanasEnfoque }] }}
        >
        <RecuadroGlass style={styles.pestanasCorte}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicadorPestana,
              {
                transform: [{ translateX: desplazamientoIndicador }],
                width: anchoIndicador,
              },
            ]}
          />

          {pestanasSenderos.map(({ id, etiqueta, Icono }) => {
            const activa = pestanaActiva === id;

            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                onPress={() => handleCambiarPestana(id)}
                style={({ pressed }) => [styles.pestana, pressed && styles.pestanaPresionada]}
              >
                <Icono color={activa ? Bioma.MasterColor : colores.textoSecundario} size={18} strokeWidth={2.3} />
                <Texto style={[styles.pestanaTexto, activa && styles.pestanaTextoActiva]} numberOfLines={1}>
                  {etiqueta}
                </Texto>
              </Pressable>
            );
          })}
        </RecuadroGlass>
        </Animated.View>

        <Animated.View
          style={[
            styles.scrollContenidoCapa,
            { top: altoPestanasInternas - (layoutEnfoqueActivo ? elevacionEnfoqueMapa : 0), transform: [{ translateY: layoutEnfoqueActivo ? desplazamientoScrollEnfoque : 0 }] },
          ]}
        >
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={[styles.contenidoScroll, { paddingBottom: 180 + insets.bottom }]}
          nestedScrollEnabled
          overScrollMode="never"
          removeClippedSubviews={false}
          scrollEnabled={!mapaEnfocado}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollContenido}
        >
          {pestanaActiva === 'mis-senderos' ? (
            senderoAbierto ? (
              <Reanimated.View entering={FadeInDown.duration(220)}>
                <EspacioTrabajoSendero sendero={senderoAbierto.sendero} color={senderoAbierto.color} onCerrar={() => setSenderoAbierto(null)} />
              </Reanimated.View>
            ) : (
              <CarpetaGiganteSenderos
                alturaMapaEnfoque={alturaMapaEnfoque}
                alturaObjetivoEnfoque={insets.top + altoSuperior - altoSeparadorVisible - profundidadEnfoqueSobreIlustracion}
                categoriaAbierta={categoriaAbierta}
                elevacionEnfoque={elevacionEnfoqueMapa}
                layoutEnfoqueActivo={layoutEnfoqueActivo}
                mapaEnfocado={mapaEnfocado}
                mostrarAccionContextual={pantallaSenderosVisible && pestanaActiva === 'mis-senderos'}
                onAbrir={(sendero, color) => setSenderoAbierto({ sendero, color })}
                onActivarMapaEnfocado={activarMapaEnfocado}
                onDesactivarMapaEnfocado={cerrarMapaEnfocado}
                onMedirElevacionEnfoque={registrarElevacionEnfoque}
                onMedirInicioMapa={registrarInicioMapa}
                progresoEnfoque={progresoEnfoqueMapa}
                setCategoriaAbierta={setCategoriaAbierta}
              />
            )
          ) : pestanaActiva === 'analisis' ? (
            <AnalisisSenderos categoriaActiva={analisisCategoria} onCategoriaChange={setAnalisisCategoria} />
          ) : pestanaActiva === 'compartidos' ? (
            <CompartidosSenderos onHeroDataChange={setSharedHeroData} />
          ) : (
            <RecuadroGlass style={styles.contenidoPestana}>
              <View style={styles.iconoContenido}>
                <Sprout color={Bioma.MasterColor} size={18} strokeWidth={2.4} />
              </View>
              <Texto style={styles.contenidoTitulo}>{contenidoActivo.titulo}</Texto>
              <Texto style={styles.contenidoSubtitulo}>{contenidoActivo.subtitulo}</Texto>
            </RecuadroGlass>
          )}
        </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: '#F4E8DC',
    flex: 1,
    position: 'relative',
  },
  superior: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  ilustracion: {
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 0,
  },
  veloIlustracion: {
    backgroundColor: 'rgba(244, 232, 220, 0.02)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  encabezadoTexto: {
    left: espaciado.lg,
    maxWidth: 280,
    position: 'absolute',
    top: espaciado.lg,
  },
  titulo: {
    color: colores.texto,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 26,
    lineHeight: 30,
  },
  subtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  tituloFila: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espaciado.xs,
  },
  contenedorPestanas: {
    marginHorizontal: espaciado.lg,
    marginTop: -28,
    position: 'relative',
    zIndex: 2,
  },
  estadoVacio: {
    alignItems: 'flex-start',
    borderRadius: 14,
    gap: 5,
    padding: 10,
    width: 180,
  },
  estadoVacioPosicion: {
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingTop: 34,
    paddingLeft: espaciado.lg,
    position: 'absolute',
    top: 0,
    width: 226,
  },
  iconoPlanta: {
    alignItems: 'center',
    backgroundColor: 'rgba(95, 193, 62, 0.14)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pestana: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    gap: 3,
    height: 52,
    justifyContent: 'center',
    minWidth: 0,
    zIndex: 2,
  },
  pestanaPresionada: {
    opacity: 0.76,
    transform: [{ translateY: 1 }],
  },
  pestanasCorte: {
    alignSelf: 'stretch',
    borderRadius: 18,
    flexDirection: 'row',
    gap: gapPestanas,
    padding: paddingPestanas,
    position: 'relative',
    zIndex: 2,
  },
  indicadorPestana: {
    backgroundColor: 'rgba(95, 193, 62, 0.12)',
    borderColor: 'rgba(95, 193, 62, 0.14)',
    borderRadius: 14,
    borderWidth: 0.5,
    bottom: paddingPestanas,
    left: paddingPestanas,
    position: 'absolute',
    top: paddingPestanas,
    zIndex: 1,
  },
  nieblaInferior: {
    bottom: -520,
    left: -espaciado.lg,
    opacity: 0.92,
    position: 'absolute',
    right: -espaciado.lg,
    top: -8,
    zIndex: 1,
  },
  niebla: {
    height: '100%',
    width: '100%',
  },
  pestanaTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  pestanaTextoActiva: {
    color: Bioma.MasterColor,
  },
  contenidoScroll: {
    flexGrow: 1,
    paddingTop: espaciado.md,
  },
  scrollContenido: {
    elevation: 3,
    flex: 1,
    zIndex: 3,
  },
  scrollContenidoCapa: {
    bottom: 0,
    elevation: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  contenidoPestana: {
    borderRadius: 18,
    gap: 7,
    padding: espaciado.md,
    zIndex: 2,
  },
  carpetaGigante: {
    zIndex: 2,
  },
  carpetaGiganteActiva: {
    paddingTop: 38,
  },
  carpetaGiganteEnfocada: {
    elevation: 9,
    zIndex: 9,
  },
  pestanasColorCarpeta: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: altoSeparadorVisible,
    paddingHorizontal: 18,
    position: 'relative',
    top: 0,
    elevation: 0,
    zIndex: 0,
  },
  pestanasColorCarpetaActiva: {
    marginTop: 38,
  },
  subcategoriasOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  subcategoriaPosicion: {
    bottom: 0,
    position: 'absolute',
  },
  separadorCarpetaHitbox: {
    height: altoSeparadorVisible,
    justifyContent: 'flex-end',
    position: 'relative',
    width: 38,
  },
  pestanaColorCarpeta: {
    alignItems: 'center',
    borderRadius: 10,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    height: altoSeparadorCompleto,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#5B4B36',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    top: 0,
    width: 36,
  },
  pestanaColorBordeSeleccionado: {
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 9,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pestanaColorActivaBrillo: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 999,
    height: 12,
    position: 'absolute',
    right: 5,
    top: 7,
    width: 3,
  },
  pestanaColorIcono: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 7,
  },
  pestanaColorTexto: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 7,
    letterSpacing: 0.35,
    lineHeight: 9,
    maxWidth: 62,
    position: 'absolute',
    textAlign: 'center',
    top: 43,
    transform: [{ rotate: '-90deg' }],
  },
  pestanaColorTextoLargo: {
    fontSize: 6,
    letterSpacing: 0.25,
    lineHeight: 8,
  },
  carpetaGiganteCuerpo: {
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 24,
    borderTopLeftRadius: 16,
    borderWidth: 0.7,
    overflow: 'hidden',
    padding: 12,
    shadowColor: '#594936',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    zIndex: 2,
  },
  carpetaGiganteCuerpoCapa: {
    elevation: 3,
    position: 'relative',
    zIndex: 3,
  },
  carpetaGiganteTinte: {
    backgroundColor: 'rgba(255, 250, 239, 0.64)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  carpetaGiganteBrillo: {
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 999,
    height: 74,
    position: 'absolute',
    right: -20,
    top: -34,
    transform: [{ rotate: '-12deg' }],
    width: 180,
  },
  carpetaGiganteCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  carpetaGiganteTituloBloque: {
    flex: 1,
    paddingRight: espaciado.sm,
  },
  carpetaGiganteTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  carpetaGiganteSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  carpetaGiganteSello: {
    alignItems: 'center',
    backgroundColor: 'rgba(95, 193, 62, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 999,
    borderWidth: 0.6,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  filasCarpeta: {
    gap: 8,
  },
  modoCategoria: {
    gap: 10,
  },
  mapaSubcategoria: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapaSubcategoriaContenido: {
    flexGrow: 1,
  },
  particulasEnfoque: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  particulaEnfoque: {
    borderRadius: 999,
    height: 6,
    position: 'absolute',
    top: '55%',
    width: 6,
  },
  estadoNuevaSubcategoria: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 18,
    borderWidth: 0.6,
    gap: 5,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  estadoNuevaSubcategoriaTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  estadoNuevaSubcategoriaTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  subcategoriaVacia: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    paddingVertical: 12,
    textAlign: 'center',
  },
  barraBusquedaCategoria: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  barraBusquedaTexto: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
  filtrosCategoria: {
    flexDirection: 'row',
    gap: 7,
  },
  filtroCategoria: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 999,
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filtroCategoriaActivo: {
    borderRadius: 999,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    lineHeight: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listaVerticalSenderos: {
    gap: 9,
    paddingBottom: 4,
  },
  listaVerticalSenderosScroll: {
    flexGrow: 0,
  },
  archivadorRaiz: {
    gap: 8,
  },
  archivadorCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  archivadorEtiqueta: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    letterSpacing: 1.1,
  },
  archivadorContador: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
  },
  archivadorPaginador: {
    height: 168,
  },
  archivadorPagina: {
    height: 168,
    position: 'relative',
  },
  fichaArchivadorPosicion: {
    bottom: 32,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fichaArchivadorPresionable: {
    flex: 1,
  },
  fichaArchivadorPresionada: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  fichaArchivador: {
    backgroundColor: 'rgba(255, 253, 247, 0.91)',
    borderRadius: 21,
    borderWidth: 0.7,
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#4D4132',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 15,
  },
  fichaArchivadorLomo: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 7,
  },
  fichaArchivadorContenido: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingLeft: 18,
    paddingVertical: 10,
  },
  fichaArchivadorTexto: {
    flex: 1,
    gap: 2,
  },
  fichaArchivadorCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fichaArchivadorTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
  fichaArchivadorMeta: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 9,
    lineHeight: 13,
  },
  fichaArchivadorPestana: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 999,
    bottom: 8,
    height: 3,
    left: 20,
    position: 'absolute',
    width: 42,
  },
  lomosArchivador: {
    bottom: 0,
    gap: 4,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  lomoArchivador: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 11,
    borderWidth: 0.6,
    flexDirection: 'row',
    gap: 8,
    height: 28,
    paddingHorizontal: 11,
  },
  lomoArchivadorPresionado: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },
  lomoArchivadorTitulo: {
    color: colores.texto,
    flex: 1,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
  },
  archivadorPuntos: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  archivadorPunto: {
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  filaCategoria: {
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderRadius: 18,
    borderWidth: 0.6,
    overflow: 'hidden',
  },
  categoriaBoton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    minHeight: 58,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  categoriaBotonPresionada: {
    opacity: 0.78,
    transform: [{ translateY: 1 }],
  },
  iconoBaseColor: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E241D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
  },
  iconoBaseColorCentro: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: -1,
    position: 'absolute',
    right: 0,
    top: -3,
  },
  categoriaTexto: {
    flex: 1,
  },
  categoriaTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  categoriaDescripcion: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },
  categoriaContador: {
    alignItems: 'center',
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  categoriaContadorTexto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    lineHeight: 15,
  },
  carruselCategoria: {
    paddingBottom: 10,
  },
  carruselCategoriaContenido: {
    gap: 10,
    paddingHorizontal: 10,
  },
  tarjetaSenderoMini: {
    width: 232,
  },
  tarjetaSenderoMiniPresionada: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  tarjetaSenderoMiniGlass: {
    borderRadius: 20,
    borderWidth: 0.7,
    flexDirection: 'row',
    gap: 9,
    minHeight: 112,
    overflow: 'hidden',
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 10,
    shadowColor: '#312719',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  tarjetaSenderoTinte: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  marcadorSenderoMini: {
    borderRadius: 999,
    bottom: 12,
    left: 7,
    position: 'absolute',
    top: 12,
    width: 4,
  },
  tarjetaSenderoMiniTexto: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  tarjetaSenderoMiniSuperior: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  senderoEstado: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: 999,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    lineHeight: 12,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  placeholderIlustracionMini: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 17,
    borderWidth: 0.6,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 76,
  },
  placeholderIlustracionVertical: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 20,
    borderWidth: 0.7,
    justifyContent: 'center',
    minHeight: 96,
    overflow: 'hidden',
    width: 96,
  },
  placeholderIlustracionBrillo: {
    borderRadius: 999,
    height: 82,
    position: 'absolute',
    right: -28,
    top: -26,
    transform: [{ rotate: '-18deg' }],
    width: 54,
  },
  tarjetaSenderoVertical: {
    borderRadius: 22,
  },
  tarjetaSenderoVerticalGlass: {
    borderRadius: 22,
    borderWidth: 0.7,
    overflow: 'hidden',
    shadowColor: '#312719',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
  },
  cintaSenderoVertical: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 7,
  },
  tarjetaSenderoVerticalContenido: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 12,
    minHeight: 124,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 12,
  },
  tarjetaSenderoVerticalTexto: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  tarjetaSenderoVerticalCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tarjetaSenderoVerticalTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
  },
  tarjetaSenderoVerticalDescripcion: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },
  tarjetaFolderPestana: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 15,
    left: 12,
    position: 'absolute',
    top: 0,
    width: 62,
    zIndex: 2,
  },
  tarjetaFolderCuerpo: {
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 17,
    borderTopLeftRadius: 10,
    borderWidth: 0.6,
    minHeight: 122,
    overflow: 'hidden',
    padding: 10,
    shadowColor: '#2B2B2B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tarjetaSenderoCabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tarjetaSenderoPorcentaje: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  tarjetaSenderoTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    minHeight: 32,
  },
  barraMiniProgreso: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 999,
    height: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  barraMiniProgresoActiva: {
    borderRadius: 999,
    height: '100%',
  },
  chipsMiniSendero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  chipMiniSendero: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 999,
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 8,
    lineHeight: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  iconoContenido: {
    alignItems: 'center',
    backgroundColor: 'rgba(95, 193, 62, 0.12)',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  contenidoTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    lineHeight: 19,
  },
  contenidoSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 11,
    lineHeight: 16,
  },
  estadoTitulo: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  estadoSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
});
