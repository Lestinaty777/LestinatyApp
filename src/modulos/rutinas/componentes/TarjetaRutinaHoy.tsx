import { Bell, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, MasterProgressbar, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { resumirRutina, siguientePaso } from '../estadoRutina';
import type { PasoRutina, Rutina } from '../rutinas.tipos';

const C = { texto: '#1A1335', tenue: '#7B7494', borde: '#D8D3CD' };

function metaPaso(paso: PasoRutina): string | null {
  if (paso.modo === 'simple' || paso.modo === 'checklist' || paso.objetivoValor == null) return null;
  const unidad = paso.unidad ?? (paso.modo === 'cronometro' ? 'min' : '');
  return `${paso.objetivoValor} ${unidad}`.trim();
}

export function TarjetaRutinaHoy({ color, onAlternarPaso, onEmpezar, pasoEnCursoId, racha = 0, rutina }: {
  /** Acento del módulo (Ignate): el avance y los checks lo usan. */
  color: string;
  /** Solo se llama para pasos propios; los de hábito y tarea se completan desde su pantalla. */
  onAlternarPaso: (rutina: Rutina, paso: PasoRutina) => void;
  /** Abre la sesión guiada. */
  onEmpezar: (rutina: Rutina) => void;
  pasoEnCursoId: string | null;
  /** Días seguidos (de los que tocaba) con la sesión completa; se muestra desde 2. */
  racha?: number;
  rutina: Rutina;
}) {
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  const resumen = resumirRutina(rutina);
  const siguiente = siguientePaso(rutina.pasos);
  const icono = buscarIconoHabito(rutina.iconoLucide);
  const sinPasosHoy = resumen.aplican === 0;

  return (
    <MasterGlass style={[estilos.tarjeta, sinPasosHoy && { opacity: 0.6 }]}>
      <Pressable
        accessibilityLabel={rutina.titulo}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        onPress={() => { hapticSeguro('seleccion'); setAbierta((actual) => !actual); }}
      >
        <View style={estilos.cabecera}>
          <MasterIconBg fuente={icono?.fuente} size={46}>{!icono && <Sparkles color={rutina.color} size={22} />}</MasterIconBg>
          <View style={estilos.cabeceraTextos}>
            <Texto numberOfLines={1} style={estilos.titulo}>{rutina.titulo}</Texto>
            <View style={estilos.metaFila}>
              {rutina.horaInicio ? (
                <View style={estilos.horaPill}>
                  {rutina.recordatorioActivo ? <Bell color={C.tenue} size={11} /> : null}
                  <Texto style={estilos.meta}>{t('rutinas.tarjeta.hora', { hora: rutina.horaInicio })}</Texto>
                </View>
              ) : null}
              <Texto style={estilos.meta}>
                {sinPasosHoy
                  ? t('rutinas.tarjeta.noToca')
                  : resumen.completa
                    ? t('rutinas.tarjeta.completa')
                    : t('rutinas.tarjeta.avance', { completed: resumen.requeridosCompletos, total: resumen.requeridos })}
              </Texto>
              {racha >= 2 ? <Texto style={[estilos.meta, { color }]}>{t('rutinas.racha', { count: racha })}</Texto> : null}
            </View>
          </View>
          {resumen.completa ? (
            <View style={[estilos.checkCirculo, { backgroundColor: color, borderColor: color }]}><Check color="#FFFFFF" size={15} strokeWidth={3} /></View>
          ) : abierta ? <ChevronUp color={C.tenue} size={20} /> : <ChevronDown color={C.tenue} size={20} />}
        </View>
        {!sinPasosHoy ? <MasterProgressbar altura={8} colorBase={color} porcentaje={resumen.porcentaje} style={estilos.barra} /> : null}
        {!abierta && siguiente ? (
          <Texto numberOfLines={1} style={estilos.siguiente}>{t('rutinas.tarjeta.siguiente', { titulo: siguiente.titulo })}</Texto>
        ) : null}
      </Pressable>
      {!resumen.completa && !sinPasosHoy ? (
        <Pressable
          accessibilityLabel={`${resumen.completos > 0 || rutina.sesionIniciadaEn ? t('rutinas.tarjeta.continuar') : t('rutinas.tarjeta.empezar')}: ${rutina.titulo}`}
          accessibilityRole="button"
          onPress={() => { hapticSeguro('seleccion'); onEmpezar(rutina); }}
          style={[estilos.empezar, { backgroundColor: color }]}
        >
          <Texto style={estilos.empezarTexto}>{resumen.completos > 0 || rutina.sesionIniciadaEn ? t('rutinas.tarjeta.continuar') : t('rutinas.tarjeta.empezar')}</Texto>
        </Pressable>
      ) : null}

      {abierta ? (
        <View style={estilos.pasos}>
          {rutina.pasos.map((paso) => {
            const editable = paso.origen === 'propio' && paso.aplica;
            const meta = metaPaso(paso);
            const origen = paso.origen === 'habito' ? t('rutinas.tarjeta.origenHabito') : t('rutinas.tarjeta.origenTarea');
            const detalle = !paso.aplica
              ? t('rutinas.tarjeta.pasoNoToca')
              : paso.origen === 'propio'
                ? meta ?? t('rutinas.tarjeta.pasoPropioHint')
                : t('rutinas.tarjeta.pasoExterno', { origen });
            return (
              <Pressable
                accessibilityLabel={paso.titulo}
                accessibilityRole={editable ? 'checkbox' : 'text'}
                accessibilityState={{ checked: paso.completo, disabled: !editable }}
                disabled={!editable || pasoEnCursoId === paso.id}
                key={paso.id}
                onPress={() => onAlternarPaso(rutina, paso)}
                style={[estilos.paso, !paso.aplica && { opacity: 0.5 }]}
              >
                <View style={[estilos.checkCirculo, paso.completo && { backgroundColor: color, borderColor: color }]}>
                  {paso.completo ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Texto numberOfLines={1} style={[estilos.pasoTitulo, paso.completo && estilos.pasoTituloHecho]}>{paso.titulo}</Texto>
                  <Texto numberOfLines={1} style={estilos.meta}>{detalle}</Texto>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 18, marginBottom: 10, padding: 12 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  cabeceraTextos: { flex: 1 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  metaFila: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 1 },
  horaPill: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  meta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11 },
  barra: { marginTop: 9 },
  empezar: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 16, marginTop: 10, minHeight: 36, justifyContent: 'center', paddingHorizontal: 18 },
  empezarTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  siguiente: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 6 },
  pasos: { gap: 2, marginTop: 8 },
  paso: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 44, paddingVertical: 6 },
  pasoTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  pasoTituloHecho: { color: C.tenue, textDecorationLine: 'line-through' },
  checkCirculo: { alignItems: 'center', borderColor: C.borde, borderRadius: 13, borderWidth: 2, height: 26, justifyContent: 'center', width: 26 },
});
