import type { LucideIcon } from 'lucide-react-native';
import {
  ChevronRight,
  Compass,
  Flame,
  GraduationCap,
  Handshake,
  Leaf,
  ListChecks,
  Map,
  PiggyBank,
  Repeat2,
  Search,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Animated, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BarraProgresoLiquida } from '../../../diseno/componentes/BarraProgresoLiquida';
import FogEffectSkia from '../../../diseno/componentes/NieblaUi';
import { RecuadroGlass, Texto, biomas, colores, espaciado } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AnalisisSenderos } from '../paginas/AnalisisSenderos';
import { CompartidosSenderos } from '../paginas/CompartidosSenderos';
import { PaginaSenderosId, paginasSenderos } from '../paginas/paginasSenderos';

const Bioma = biomas.inicio;
const paddingPestanas = 6;
const gapPestanas = 4;
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

function hapticSeleccion() {
  hapticSeguro('seleccion');
}

function colorConAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
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

function TarjetaSenderoMini({ categoria, sendero }: { categoria: CategoriaCarpeta; sendero: SenderoMini }) {
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
        onPress={() => hapticSeguro('accion')}
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

function TarjetaSenderoVertical({ categoria, sendero }: { categoria: CategoriaCarpeta; sendero: SenderoMini }) {
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
        onPress={() => hapticSeguro('accion')}
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

function FilaCategoriaCarpeta({
  abierta,
  categoria,
  onPress,
}: {
  abierta: boolean;
  categoria: CategoriaCarpeta;
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
              <TarjetaSenderoMini key={sendero.id} categoria={categoria} sendero={sendero} />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

function SeparadorColorCarpeta({
  activo,
  categoria,
  onPress,
}: {
  activo: boolean;
  categoria: CategoriaCarpeta;
  onPress: () => void;
}) {
  const IconoCategoria = categoria.Icono;
  const progreso = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progreso, {
      damping: 15,
      mass: 0.72,
      stiffness: 235,
      toValue: activo ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [activo, progreso]);

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
  const etiquetaSeparador = categoria.etiquetaSeparador ?? categoria.titulo;
  const textoLargo = etiquetaSeparador.length > 8;

  return (
    <Pressable onPress={onPress} style={styles.separadorCarpetaHitbox}>
      <Animated.View
        style={[
          styles.pestanaColorCarpeta,
          {
            backgroundColor: categoria.acento,
            transform: [{ translateY: desplazamiento }, { scale: escala }],
          },
        ]}
      >
        <View pointerEvents="none" style={styles.pestanaColorActivaBrillo} />
        <View pointerEvents="none" style={styles.pestanaColorIcono}>
          <IconoCategoria color="#FFFFFF" size={15} strokeWidth={2.6} />
        </View>
        <Animated.Text style={[styles.pestanaColorTexto, textoLargo && styles.pestanaColorTextoLargo, { opacity: opacidadTexto }]}>
          {etiquetaSeparador}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function CarpetaGiganteSenderos({ categoriaAbierta, setCategoriaAbierta }: { categoriaAbierta: string, setCategoriaAbierta: React.Dispatch<React.SetStateAction<string>> }) {
  const [itemsCargados, setItemsCargados] = useState(0);

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
  const categoriaEnfocada = categoriasCarpeta.find((categoria) => categoria.id === categoriaAbierta) ?? null;
  const IconoCategoriaEnfocada = categoriaEnfocada?.Icono;

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
    hapticSeguro('seleccion');
    setCategoriaAbierta((actual) => (actual === id ? '' : id));
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

  return (
    <Animated.View
      style={[
        styles.carpetaGigante,
        categoriaEnfocada && styles.carpetaGiganteActiva,
        { opacity: entradaCarpeta, transform: [{ translateY: desplazamientoEntrada }] },
      ]}
    >
      <View style={styles.pestanasColorCarpeta}>
        {categoriasCarpeta.map((categoria, index) => {
          if (index >= itemsCargados) {
            return (
              <View 
                key={`skel-sep-${categoria.id}`} 
                style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 14, borderTopRightRadius: 14, marginRight: 2 }} 
              />
            );
          }
          return (
            <SeparadorColorCarpeta
              key={categoria.id}
              activo={categoriaAbierta === categoria.id}
              categoria={categoria}
              onPress={() => alternarCategoria(categoria.id)}
            />
          );
        })}
      </View>

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
              {categoriaEnfocada ? categoriaEnfocada.titulo : 'Biblioteca de senderos'}
            </Texto>
            <Texto style={styles.carpetaGiganteSubtitulo}>
              {categoriaEnfocada ? categoriaEnfocada.descripcion : 'Abre una categoria y desliza sus caminos'}
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
            <Reanimated.View key={'busq-' + categoriaEnfocada.id} entering={FadeInDown.delay(200).duration(400)} style={styles.barraBusquedaCategoria}>
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

            <View style={styles.listaVerticalSenderos}>
              {categoriaEnfocada.senderos.map((sendero, idx) => (
                <Reanimated.View key={sendero.id} entering={FadeInDown.delay(400 + idx * 100).duration(400)}>
                  <TarjetaSenderoVertical categoria={categoriaEnfocada} sendero={sendero} />
                </Reanimated.View>
              ))}
            </View>
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
                  onPress={() => alternarCategoria(categoria.id)}
                />
              );
            })}
          </Animated.View>
        )}
      </RecuadroGlass>
    </Animated.View>
  );
}

export function SenderosPantalla() {
  const { height, width } = useWindowDimensions();
  
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
  const progresoPestana = useRef(new Animated.Value(0)).current;
  const ultimoTapPestana = useRef(0);

  const handleCambiarPestana = (id: PaginaSenderosId) => {
    const ahora = Date.now();
    if (ahora - ultimoTapPestana.current < 350) return; // Bloqueo Anti-Spam
    ultimoTapPestana.current = ahora;
    if (id === pestanaActiva) return;
    hapticSeleccion();
    setPestanaActiva(id);
  };
  const altoSuperior = height * 0.4;
  const altoZonaPestanas = height - altoSuperior + 28;
  const anchoSubtitulo = width * 0.5;
  const anchoTabs = width - espaciado.lg * 2;
  const anchoIndicador = (anchoTabs - paddingPestanas * 2 - gapPestanas * (pestanasSenderos.length - 1)) / pestanasSenderos.length;
  const indiceActivo = pestanasSenderos.findIndex(({ id }) => id === pestanaActiva);
  const desplazamientoIndicador = progresoPestana.interpolate({
    inputRange: pestanasSenderos.map((_, indice) => indice),
    outputRange: pestanasSenderos.map((_, indice) => indice * (anchoIndicador + gapPestanas)),
  });
  const contenidoActivo = paginasSenderos[pestanaActiva];

  let headerImg = require('../../../../assets/ilustraciones/senderos.png');
  let headerTitle = '{headerTitle}';
  let emptyStateTitle = 'Aún no tienes senderos';
  let emptyStateSub = 'Crea tu primer camino y empieza a construir hábitos que te acerquen a tus metas.';
  let EmptyIcon = Sprout;
  let emptyIconColor = Bioma.MasterColor;
  const catInfo = categoriasCarpeta.find(c => c.id === catActiva);
  if (catInfo) {
    EmptyIcon = catInfo.Icono;
    emptyIconColor = catInfo.acento;
  }
  
  const catActiva = pestanaActiva === 'mis-senderos' ? categoriaAbierta : pestanaActiva === 'analisis' ? analisisCategoria : null;
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

        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={[styles.contenidoScroll, { paddingBottom: 180 + insets.bottom }]}
          nestedScrollEnabled
          overScrollMode="never"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollContenido}
        >
          {pestanaActiva === 'mis-senderos' ? (
            <CarpetaGiganteSenderos categoriaAbierta={categoriaAbierta} setCategoriaAbierta={setCategoriaAbierta} />
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
    flex: 1,
    zIndex: 2,
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
  pestanasColorCarpeta: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: altoSeparadorVisible,
    paddingHorizontal: 18,
    position: 'relative',
    top: 0,
    zIndex: 1,
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
