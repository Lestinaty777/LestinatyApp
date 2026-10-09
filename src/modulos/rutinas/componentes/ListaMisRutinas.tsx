import { Archive, Pencil, Sparkles } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { diasAbreviados } from '../formatoRutina';
import type { Rutina } from '../rutinas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494' };

export function ListaMisRutinas({ onArchivar, onEditar, rutinas }: { onArchivar: (rutina: Rutina) => void; onEditar: (rutina: Rutina) => void; rutinas: readonly Rutina[] }) {
  const { t } = useTranslation();
  if (rutinas.length === 0) return <Texto style={estilos.vacio}>{t('rutinas.misRutinas.vacio')}</Texto>;

  function confirmarArchivar(rutina: Rutina) {
    Alert.alert(t('rutinas.misRutinas.archivarTitulo', { titulo: rutina.titulo }), t('rutinas.misRutinas.archivarMensaje'), [
      { style: 'cancel', text: t('rutinas.misRutinas.cancelar') },
      { onPress: () => onArchivar(rutina), style: 'destructive', text: t('rutinas.misRutinas.archivar') },
    ]);
  }

  return (
    <View>
      {rutinas.map((rutina) => {
        const icono = buscarIconoHabito(rutina.iconoLucide);
        const dias = diasAbreviados(rutina.diasSemana, (dia) => t(`rutinas.crear.d${dia}`)) ?? t('rutinas.misRutinas.todosLosDias');
        const partes = [t(`rutinas.franjas.${rutina.franja}`), dias, t('rutinas.tarjeta.pasos', { count: rutina.pasos.length })];
        if (rutina.estado === 'pausada') partes.push(t('rutinas.misRutinas.pausada'));
        return (
          <MasterGlass key={rutina.id} style={estilos.fila}>
            <MasterIconBg fuente={icono?.fuente} size={44}>{!icono && <Sparkles color={rutina.color} size={22} />}</MasterIconBg>
            <View style={{ flex: 1 }}>
              <Texto numberOfLines={1} style={estilos.titulo}>{rutina.titulo}</Texto>
              <Texto numberOfLines={2} style={estilos.meta}>{partes.join(' · ')}</Texto>
            </View>
            <Pressable accessibilityLabel={t('rutinas.misRutinas.editar', { titulo: rutina.titulo })} accessibilityRole="button" hitSlop={10} onPress={() => onEditar(rutina)} style={estilos.archivar}>
              <Pencil color={C.tenue} size={18} />
            </Pressable>
            <Pressable accessibilityLabel={t('rutinas.misRutinas.archivarTitulo', { titulo: rutina.titulo })} accessibilityRole="button" hitSlop={10} onPress={() => confirmarArchivar(rutina)} style={estilos.archivar}>
              <Archive color={C.tenue} size={18} />
            </Pressable>
          </MasterGlass>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  vacio: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingVertical: 18, textAlign: 'center' },
  fila: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, marginBottom: 10, padding: 12 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
  archivar: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
});
