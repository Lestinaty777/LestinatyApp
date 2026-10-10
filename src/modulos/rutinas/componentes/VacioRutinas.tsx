import { LayoutTemplate, ListChecks, Plus } from 'lucide-react-native';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterIcon, MasterIconBg, Texto } from '../../../diseno';

const C = { texto: '#1A1335', tenue: '#7B7494' };

// Estados vacíos de la vista "Hoy" de Rutinas. Dos casos distintos:
//  · 'sin_rutinas': la persona aún no creó ninguna → se explica qué es una
//    rutina en tres ideas y se ofrecen las dos formas de empezar.
//  · 'nada_hoy': tiene rutinas, pero hoy no toca ninguna → se le recuerda por
//    qué está vacío y se la lleva a verlas.
export function VacioRutinas({ color, ilustracion, onCrear, onVerMisRutinas, onVerPlantillas, tipo }: {
  /** Acento del módulo (Ignate). */
  color: string;
  /** Arte del paquete: la semilla para "sin rutinas", el arbusto para "nada hoy". */
  ilustracion?: ImageSourcePropType;
  onCrear: () => void;
  onVerMisRutinas: () => void;
  onVerPlantillas: () => void;
  tipo: 'sin_rutinas' | 'nada_hoy';
}) {
  const { t } = useTranslation();
  const arte = ilustracion ? (
    // Imagen normal, no `fuente`: ya es el arte del paquete y no debe rotarse otra vez con el tema.
    // MasterIconBg se alinea a la izquierda por defecto (alignSelf: 'flex-start'): aquí va centrado.
    <MasterIconBg size={104} style={estilos.centrado}><Image resizeMode="contain" source={ilustracion} style={estilos.arte} /></MasterIconBg>
  ) : null;

  if (tipo === 'nada_hoy') {
    return (
      <View style={estilos.raiz}>
        {arte}
        <Texto accessibilityRole="header" style={estilos.titulo}>{t('rutinas.pantalla.nadaHoyTitulo')}</Texto>
        <Texto style={estilos.texto}>{t('rutinas.pantalla.nadaHoyDescripcion')}</Texto>
        <View style={estilos.boton}><MasterButton color={color} iconoIzquierda={ListChecks} onPress={onVerMisRutinas}>{t('rutinas.pantalla.vacio.verMisRutinas')}</MasterButton></View>
      </View>
    );
  }

  // Íconos propios de la app (assets/icons/ui), teñidos al tema: no de lucide.
  const pistas: { clave: string; icono: string }[] = [
    { clave: 'rutinas.pantalla.vacio.pistaOrden', icono: 'tareas' },
    { clave: 'rutinas.pantalla.vacio.pistaSesion', icono: 'reloj' },
    { clave: 'rutinas.pantalla.vacio.pistaEsencial', icono: 'rayo' },
  ];
  return (
    <View style={estilos.raiz}>
      {arte}
      <Texto accessibilityRole="header" style={estilos.titulo}>{t('rutinas.pantalla.vacio.titulo')}</Texto>
      <Texto style={estilos.texto}>{t('rutinas.pantalla.vacioDescripcion')}</Texto>
      <View style={estilos.pistas}>
        {pistas.map(({ clave, icono }) => (
          <View key={clave} style={estilos.pista}>
            <MasterIconBg size={38}><MasterIcon alTema name={icono} size={22} /></MasterIconBg>
            <Texto style={estilos.pistaTexto}>{t(clave)}</Texto>
          </View>
        ))}
      </View>
      <View style={estilos.boton}><MasterButton color={color} iconoIzquierda={Plus} onPress={onCrear}>{t('rutinas.pantalla.access.creacion.label')}</MasterButton></View>
      <MasterButton color="#FFFFFF" colorSombra="#E4DDF0" colorTexto={color} iconoIzquierda={LayoutTemplate} onPress={onVerPlantillas}>{t('rutinas.pantalla.vacio.usarPlantilla')}</MasterButton>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 8, paddingBottom: 6, paddingTop: 4 },
  arte: { height: 84, width: 84 },
  centrado: { alignSelf: 'center' },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 19, marginTop: 4, textAlign: 'center' },
  texto: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingHorizontal: 8, textAlign: 'center' },
  pistas: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
  pista: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  pistaTexto: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 17 },
  boton: { marginTop: 8 },
});
