import { useQuery } from '@tanstack/react-query';
import { Check, Play, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIcon, MasterIconBg, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { fechaLocalHoy } from '../../../nucleo/dispositivo/fechaLocal';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { diasConSesionEstaSemana } from '../rachaRutina';
import { CLAVE_RACHAS_RUTINAS, obtenerSesionesCompletasRutinas } from '../rutinas.servicio';
import type { Rutina } from '../rutinas.tipos';
import { planearSesion } from '../sesionRutina';

const C = { texto: '#1A1335', tenue: '#7B7494' };
const DIAS = [1, 2, 3, 4, 5, 6, 7] as const;

// Widget del encabezado de Rutinas: responde "¿qué hago ahora?". Muestra la
// próxima rutina pendiente de hoy con cuánto lleva, y un botón que abre su
// sesión guiada con un solo toque. Debajo, los siete días de la semana con los
// que ya tuvieron alguna sesión completa. Sin pendientes, lo dice y deja la semana.
export function WidgetSiguienteSesion({ color, hayRutinasHoy, onEmpezar, rutina }: {
  /** Acento del módulo. */
  color: string;
  /** ¿Tocaba alguna rutina hoy? Distingue "todo hecho" de "hoy no toca ninguna". */
  hayRutinasHoy: boolean;
  onEmpezar: (rutina: Rutina) => void;
  /** La próxima rutina pendiente de hoy; null si no queda ninguna. */
  rutina: Rutina | null;
}) {
  const { t } = useTranslation();
  // Misma consulta (y caché) que usa la racha de cada tarjeta.
  const { data: sesiones } = useQuery({ queryKey: CLAVE_RACHAS_RUTINAS, queryFn: () => obtenerSesionesCompletasRutinas() });
  const diasHechos = diasConSesionEstaSemana(sesiones ?? [], fechaLocalHoy());
  const plan = rutina ? planearSesion(rutina.pasos, null) : null;
  const icono = rutina ? buscarIconoHabito(rutina.iconoLucide) : null;

  return (
    <MasterGlass style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        {rutina ? (
          <MasterIconBg fuente={icono?.fuente} size={34}>{!icono && <Sparkles color={color} size={16} />}</MasterIconBg>
        ) : (
          <MasterIconBg size={34}><MasterIcon alTema name={hayRutinasHoy ? 'trofeo' : 'sol'} size={20} /></MasterIconBg>
        )}
        <View style={{ flex: 1 }}>
          <Texto style={estilos.etiqueta}>{t('rutinas.widget.etiqueta')}</Texto>
          <Texto numberOfLines={1} style={estilos.titulo}>
            {rutina ? rutina.titulo : t(hayRutinasHoy ? 'rutinas.widget.todoHecho' : 'rutinas.widget.sinRutinasHoy')}
          </Texto>
        </View>
      </View>

      <View style={estilos.centro}>
        <Texto numberOfLines={1} style={estilos.resumen}>
          {plan ? t('rutinas.sesion.preparar.resumen', { count: plan.pasos.length, minutos: plan.minutosTotal }) : t('rutinas.widget.descanso')}
        </Texto>
        {rutina ? (
          <Pressable
            accessibilityLabel={t('rutinas.widget.empezar', { titulo: rutina.titulo })}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => { hapticSeguro('seleccion'); onEmpezar(rutina); }}
            style={[estilos.reproducir, { backgroundColor: color }]}
          >
            <Play color="#FFFFFF" fill="#FFFFFF" size={15} />
          </Pressable>
        ) : null}
      </View>

      <View accessibilityLabel={t('rutinas.widget.semana', { count: diasHechos.length })} accessible style={estilos.semana}>
        {DIAS.map((dia) => {
          const hecho = diasHechos.includes(dia);
          return (
            <View key={dia} style={[estilos.dia, hecho ? { backgroundColor: color } : { backgroundColor: conAlfa(color, 0.14) }]}>
              {hecho ? <Check color="#FFFFFF" size={9} strokeWidth={3.5} /> : null}
            </View>
          );
        })}
      </View>
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 18, gap: 9, padding: 10 },
  cabecera: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  etiqueta: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 12 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 13, lineHeight: 16 },
  centro: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 34 },
  resumen: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 12, lineHeight: 15 },
  reproducir: { alignItems: 'center', borderRadius: 17, height: 34, justifyContent: 'center', paddingLeft: 2, width: 34 },
  semana: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { alignItems: 'center', borderRadius: 7, height: 14, justifyContent: 'center', width: 14 },
});
