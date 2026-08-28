import type { LucideIcon } from 'lucide-react-native';
import { AlertTriangle, CalendarDays, Flame, GraduationCap, Handshake, Leaf, ListChecks, PiggyBank, Repeat2, Sparkles, TrendingUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Reanimated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';

import { RecuadroGlass, Texto, colores } from '../../../diseno';
import { RutinasAnalisis } from './analisis/rutinas/RutinasAnalisis';
import { rutinasMockData } from './analisis/rutinas/datosMock';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

type CategoriaId = 'rutinas' | 'salud' | 'habitos' | 'tareas' | 'finanzas' | 'relaciones' | 'estudio';

type Categoria = {
  acento: string;
  alerta: string;
  categoria: string;
  Icono: LucideIcon;
  id: CategoriaId;
  mejorMomento: string;
  principal: { etiqueta: string; valor: string };
  secundario: { etiqueta: string; valor: string };
  senderos: { etiqueta: string; progreso: number; titulo: string }[];
  serie: number[];
  tendencia: string;
};

const categorias: Categoria[] = [
  { acento: '#1463FF', alerta: 'Tu cierre de dia necesita una sesion para recuperar ritmo.', categoria: 'Rutinas', Icono: Repeat2, id: 'rutinas', mejorMomento: 'Viernes', principal: { etiqueta: 'consistencia', valor: '68%' }, secundario: { etiqueta: 'racha actual', valor: '6 dias' }, senderos: [{ etiqueta: '4 bloques', progreso: 68, titulo: 'Rutina de brazo' }, { etiqueta: '15 min', progreso: 42, titulo: 'Cierre del dia' }, { etiqueta: '2 bloques', progreso: 74, titulo: 'Bloque de enfoque' }], serie: [36, 54, 42, 72, 58, 86, 68], tendencia: '+12%' },
  { acento: '#34D946', alerta: 'Caminar mantiene la energia mas estable de tus senderos.', categoria: 'Salud', Icono: Leaf, id: 'salud', mejorMomento: 'Jueves', principal: { etiqueta: 'bienestar', valor: '81%' }, secundario: { etiqueta: 'objetivo semanal', valor: '4/5' }, senderos: [{ etiqueta: '20 min', progreso: 81, titulo: 'Caminar 20 min' }, { etiqueta: '10 min', progreso: 54, titulo: 'Meditacion diaria' }, { etiqueta: '7 noches', progreso: 46, titulo: 'Mejor sueno' }], serie: [48, 62, 55, 72, 66, 82, 81], tendencia: '+9%' },
  { acento: '#FF3B30', alerta: 'Leer diario esta a una sesion de proteger su racha.', categoria: 'Habitos', Icono: Flame, id: 'habitos', mejorMomento: 'Noche', principal: { etiqueta: 'ritmo mensual', valor: '72%' }, secundario: { etiqueta: 'mejor racha', valor: '12 dias' }, senderos: [{ etiqueta: '7 dias', progreso: 72, titulo: 'Leer diario' }, { etiqueta: '4 dias', progreso: 63, titulo: 'Ser constante' }], serie: [78, 68, 82, 75, 84, 58, 72], tendencia: '-4%' },
  { acento: '#FFC400', alerta: 'Una tarea importante vence esta semana.', categoria: 'Tareas', Icono: ListChecks, id: 'tareas', mejorMomento: 'Manana', principal: { etiqueta: 'resueltas', valor: '14' }, secundario: { etiqueta: 'pendientes', valor: '3' }, senderos: [{ etiqueta: '2 pendientes', progreso: 66, titulo: 'Proyecto personal' }, { etiqueta: 'vence viernes', progreso: 38, titulo: 'Organizar archivos' }], serie: [42, 66, 48, 74, 55, 72, 64], tendencia: '+6%' },
  { acento: '#FF8A00', alerta: 'Tu proximo aporte llega el 1 de septiembre.', categoria: 'Finanzas', Icono: PiggyBank, id: 'finanzas', mejorMomento: 'Lunes', principal: { etiqueta: 'meta acumulada', valor: '57%' }, secundario: { etiqueta: 'ahorro actual', valor: '$285' }, senderos: [{ etiqueta: 'aporte mensual', progreso: 57, titulo: 'Ahorro mensual' }, { etiqueta: 'presupuesto', progreso: 76, titulo: 'Gastos conscientes' }], serie: [24, 31, 36, 48, 45, 54, 57], tendencia: '+7%' },
  { acento: '#FF2D93', alerta: 'Una conversacion esta pendiente esta semana.', categoria: 'Relaciones', Icono: Handshake, id: 'relaciones', mejorMomento: 'Sabado', principal: { etiqueta: 'conexiones', valor: '5' }, secundario: { etiqueta: 'calidad', valor: '84%' }, senderos: [{ etiqueta: 'semanal', progreso: 84, titulo: 'Tiempo en familia' }, { etiqueta: 'quincenal', progreso: 52, titulo: 'Llamar a un amigo' }], serie: [58, 44, 66, 72, 60, 88, 84], tendencia: '+11%' },
  { acento: '#8E3DFF', alerta: 'Dos sesiones mas consolidan tu avance de estudio.', categoria: 'Estudio', Icono: GraduationCap, id: 'estudio', mejorMomento: 'Martes', principal: { etiqueta: 'horas enfocadas', valor: '6.5h' }, secundario: { etiqueta: 'sesiones', valor: '9' }, senderos: [{ etiqueta: 'pomodoro', progreso: 71, titulo: 'Ingles practico' }, { etiqueta: 'lectura', progreso: 48, titulo: 'Aprender diseno' }], serie: [30, 62, 72, 52, 77, 68, 71], tendencia: '+15%' },
];

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function AnalisisSenderos({ categoriaActiva, onCategoriaChange }: { categoriaActiva: string, onCategoriaChange?: (id: string) => void }) {
  const categoriaId = (categoriaActiva as CategoriaId) || 'rutinas';
  
  const [itemsCargados, setItemsCargados] = useState(0);
  useEffect(() => {
    let timeout: any;
    if (itemsCargados < 5) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 65);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);
  const categoria = categorias.find((item) => item.id === categoriaId) ?? categorias[0];
  const IconoCategoria = categoria.Icono;

  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    if (onCategoriaChange) onCategoriaChange(id);
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.selectorCategorias}>
        {categorias.map(({ acento, Icono, id, categoria: etiqueta }, index) => {
          const activa = id === categoriaId;
          return (
            <Reanimated.View key={id} entering={ZoomIn.delay(index * 60).springify()} style={{ flex: 1, minWidth: 0, aspectRatio: 1 }}>
              <Pressable accessibilityLabel={`Analiticas de ${etiqueta}`} onPress={() => seleccionarCategoria(id)} style={({ pressed }) => [styles.botonCategoria, activa && { backgroundColor: acento, borderColor: acento }, pressed && styles.botonCategoriaPresionado, { flex: 1 }]}>
                <Icono color={activa ? '#FFFFFF' : acento} size={16} strokeWidth={2.5} />
                {activa && <View style={styles.indicadorCategoriaActivo} />}
              </Pressable>
            </Reanimated.View>
          );
        })}
      </View>

      {categoriaId === 'rutinas' ? (
        <RutinasAnalisis datos={rutinasMockData} acento={categoria.acento} itemsCargados={itemsCargados} />
      ) : (
        <>
          {itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : (
      <Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.duration(400)}>
      <RecuadroGlass blur intensity={64} style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '32') }]}>
        <View pointerEvents="none" style={[styles.resumenTinte, { backgroundColor: conAlpha(categoria.acento, '0C') }]} />
        <View style={styles.resumenCabecera}>
          <View>
            <Texto style={styles.resumenTitulo}>Actividad</Texto>
            <Texto style={styles.resumenSubtitulo}>Tu progreso esta semana</Texto>
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
            <Texto style={styles.ritmoTitulo}>Ritmo semanal</Texto>
          </View>
          <Texto style={[styles.ritmoTendencia, { color: categoria.acento }]}>{categoria.tendencia}</Texto>
        </View>
        <View style={styles.graficaSemanal}>
          {categoria.serie.map((valor, indice) => (
            <View key={indice} style={styles.columnaSemana}>
              <View style={[styles.barraSemana, { backgroundColor: conAlpha(categoria.acento, indice === categoria.serie.length - 1 ? 'E8' : '45'), height: Math.max(12, valor * 0.68) }]} />
              <Texto style={styles.diaSemana}>{diasSemana[indice]}</Texto>
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
          <Texto style={styles.senalEtiqueta}>MEJOR MOMENTO</Texto>
          <Texto style={styles.senalValor}>{categoria.mejorMomento}</Texto>
        </RecuadroGlass>
        <RecuadroGlass blur intensity={36} style={styles.senalGlass}>
          <AlertTriangle color={categoria.acento} size={17} strokeWidth={2.5} />
          <Texto style={styles.senalEtiqueta}>SENAL</Texto>
          <Texto numberOfLines={2} style={styles.senalAlerta}>{categoria.alerta}</Texto>
        </RecuadroGlass>
      </Reanimated.View>
      )}

      {itemsCargados < 4 ? <View style={{ height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 21, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, marginTop: 12 }} /> : (
      <Reanimated.View key={'list-' + categoria.id} entering={FadeInDown.duration(400)}>
      <View style={styles.listaCabecera}>
        <Texto style={styles.listaTitulo}>Senderos de {categoria.categoria}</Texto>
        <CalendarDays color={categoria.acento} size={16} strokeWidth={2.4} />
      </View>
      <RecuadroGlass blur intensity={50} style={styles.tableroGlass}>
        {categoria.senderos.map((sendero, indice) => (
          <View key={sendero.titulo} style={[styles.filaSendero, indice > 0 && styles.filaSenderoDividida]}>
            <View style={[styles.puntoSendero, { backgroundColor: categoria.acento }]} />
            <View style={styles.filaSenderoTexto}>
              <Texto numberOfLines={1} style={styles.filaSenderoTitulo}>{sendero.titulo}</Texto>
              <Texto style={styles.filaSenderoEtiqueta}>{sendero.etiqueta}</Texto>
            </View>
            <Texto style={[styles.filaSenderoProgreso, { color: categoria.acento }]}>{sendero.progreso}%</Texto>
            <View style={styles.marcadoresSemana}>
              {diasSemana.map((dia, diaIndice) => <View key={dia} style={[styles.marcadorDia, diaIndice < Math.round(sendero.progreso / 16) && { backgroundColor: categoria.acento }]} />)}
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
