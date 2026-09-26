import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Clock3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import { TOPE_ESCALA_TEXTO_COMPACTO } from '../../../diseno/fundamentos/accesibilidad';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { solicitarPermisoYRegistrar } from '../../../nucleo/notificaciones/oneSignal';
import { actualizarPreferenciaNotificacion } from '../../configuracion/configuracion.servicio';
import { actualizarHabitoDesdeDetalle } from '../habitos.servicio';
import type { EdicionHabito } from '../gestionDetalleHabito';
import { validarEdicionHabito } from '../gestionDetalleHabito';
import type { TipoMetaHabito } from '../tipos';
import { GridIconosHabito } from './CrearHabitoWizard';

type SubtipoMeta = TipoMetaHabito | 'paginas';

const DIAS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }];
const HORAS_PRESET = ['08:00', '13:00', '20:00'];

type Props = {
  colorHabito: string;
  edicionInicial: EdicionHabito;
  habitoId: string;
  onCancelar: () => void;
  onGuardado: () => void;
};

export function EditarHabitoFormulario({ colorHabito, edicionInicial, habitoId, onCancelar, onGuardado }: Props) {
  const { t } = useTranslation();
  const [titulo, setTitulo] = useState(edicionInicial.titulo);
  const [descripcion, setDescripcion] = useState(edicionInicial.descripcion);
  const [iconoLucide, setIconoLucide] = useState(edicionInicial.iconoLucide);
  const [subtipoMeta, setSubtipoMeta] = useState<SubtipoMeta>(edicionInicial.tipoMeta);
  const [meta, setMeta] = useState(String(edicionInicial.meta));
  const [unidad, setUnidad] = useState(edicionInicial.unidad);
  const [frecuencia, setFrecuencia] = useState(edicionInicial.frecuencia);
  const [diasSemana, setDiasSemana] = useState<number[]>(edicionInicial.diasSemana);
  const [vecesSemana, setVecesSemana] = useState(String(edicionInicial.vecesPorSemana ?? 3));
  const [recordatorio, setRecordatorio] = useState(edicionInicial.recordatorioActivo);
  const [hora, setHora] = useState(edicionInicial.horaRecordatorio ?? '08:00');
  const [horaPersonalizada, setHoraPersonalizada] = useState(
    edicionInicial.horaRecordatorio !== null && !HORAS_PRESET.includes(edicionInicial.horaRecordatorio),
  );
  const [mostrarNombre, setMostrarNombre] = useState(edicionInicial.mostrarNombreNotificacion);
  const [error, setError] = useState<string | null>(null);

  // Mismo requisito que en la creación: el permiso nativo y el registro del
  // dispositivo no bastan, el despachador también exige la preferencia global
  // 'habito_recordatorio' habilitada — sin esto el recordatorio queda
  // activado en la UI pero nunca se envía nada.
  useEffect(() => {
    if (!recordatorio) return;
    void solicitarPermisoYRegistrar().then((resultado) => {
      if (resultado.estado !== 'concedido') { setRecordatorio(false); return; }
      void actualizarPreferenciaNotificacion('habito_recordatorio', true).catch(() => undefined);
    }).catch(() => setRecordatorio(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordatorio]);

  const guardar = useMutation({
    mutationFn: async () => {
      const edicion: EdicionHabito = {
        titulo,
        descripcion,
        iconoLucide,
        tipoMeta: subtipoMeta === 'paginas' ? 'cantidad' : subtipoMeta,
        unidad,
        meta: Number(meta) || 1,
        frecuencia,
        diasSemana: frecuencia === 'dias_semana' ? diasSemana : [],
        vecesPorSemana: frecuencia === 'veces_semana' ? Math.max(1, Math.min(7, Number(vecesSemana) || 1)) : null,
        recordatorioActivo: recordatorio,
        horaRecordatorio: recordatorio ? hora : null,
        mostrarNombreNotificacion: mostrarNombre,
      };
      const mensajeError = validarEdicionHabito(edicion);
      if (mensajeError) throw new Error(mensajeError);
      await actualizarHabitoDesdeDetalle(habitoId, edicion);
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('habitos.detalle.errorGuardar')),
    onSuccess: () => onGuardado(),
  });

  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
  const toggleDia = (dia: number) => setDiasSemana((v) => (v.includes(dia) ? v.filter((x) => x !== dia) : [...v, dia].sort()));
  const etiquetaIcono = (id: string, etiquetaPredeterminada: string) => {
    const clave = id.replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());
    return t(`habitos.crearWizard.templateTitles.${clave}`, {
      defaultValue: t(`habitos.crearWizard.iconLabels.${clave}`, { defaultValue: etiquetaPredeterminada }),
    });
  };

  const metas: { id: SubtipoMeta; titulo: string; icono: string }[] = [
    { id: 'check', titulo: t('habitos.crearWizard.goal.checkTitle'), icono: 'tareas' },
    { id: 'cantidad', titulo: t('habitos.crearWizard.goal.quantityTitle'), icono: 'estadistica' },
    { id: 'duracion', titulo: t('habitos.crearWizard.goal.durationTitle'), icono: 'reloj' },
    { id: 'paginas', titulo: t('habitos.crearWizard.goal.pagesTitle'), icono: 'estudiar' },
  ];

  const elegirSubtipo = (nuevo: SubtipoMeta) => {
    setSubtipoMeta(nuevo);
    if (nuevo === 'check') setUnidad('');
    else if (nuevo === 'duracion' && subtipoMeta !== 'duracion') { setMeta('10'); setUnidad(t('habitos.crearWizard.goal.durationUnitPlaceholder')); }
    else if (nuevo === 'paginas' && subtipoMeta !== 'paginas') { setMeta('20'); setUnidad(t('habitos.crearWizard.goal.pagesTitle').toLowerCase()); }
  };

  return (
    <View style={{ gap: 14 }}>
      <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 18 }}>{t('habitos.detalle.editorTitulo')}</Texto>

      <MasterGlass style={{ borderRadius: 20, gap: 10, padding: 16 }}>
        <Texto style={{ color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('habitos.crearWizard.identity.title')}</Texto>
        <TextInput
          keyboardAppearance="light"
          maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
          onChangeText={setTitulo}
          placeholder={t('habitos.crearWizard.identity.namePlaceholder')}
          style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14 }}
          value={titulo}
        />
        <TextInput
          keyboardAppearance="light"
          maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
          multiline
          onChangeText={setDescripcion}
          placeholder={t('habitos.detalle.descripcionPorDefecto')}
          style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', fontSize: 13, minHeight: 44, padding: 14 }}
          value={descripcion}
        />
        <View>
          <Texto style={{ color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 12, marginBottom: 8 }}>{t('habitos.crearWizard.identity.chooseIcon')}</Texto>
          <GridIconosHabito color={colorHabito} etiquetaIcono={etiquetaIcono} iconoSeleccionado={iconoLucide} onElegir={setIconoLucide} />
        </View>
      </MasterGlass>

      <MasterGlass style={{ borderRadius: 20, gap: 10, padding: 16 }}>
        <Texto style={{ color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('habitos.crearWizard.goal.title')}</Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {metas.map((x) => {
            const activo = subtipoMeta === x.id;
            return (
              <Pressable
                key={x.id}
                onPress={() => { hapticSeguro('seleccion'); elegirSubtipo(x.id); }}
                style={{
                  alignItems: 'center',
                  backgroundColor: activo ? `${colorHabito}1A` : '#F5F3F9',
                  borderColor: activo ? colorHabito : 'transparent',
                  borderRadius: 14,
                  borderWidth: 1.5,
                  flexDirection: 'row',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <MasterIcon alTema name={x.icono} size={22} />
                {/* A diferencia de los otros selectores de esta pantalla
                    (frecuencia, hora), acá el texto NO cambia de color al
                    activarse — mismo patrón que ya usa el wizard de creación
                    (tarjetaCompacta): solo tinte leve de fondo + borde de
                    color. Poner el texto en `colorHabito` sobre un fondo
                    también en `colorHabito` lo volvía invisible. */}
                <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{x.titulo}</Texto>
              </Pressable>
            );
          })}
        </View>
        {subtipoMeta !== 'check' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              keyboardAppearance="light"
              keyboardType="decimal-pad"
              maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
              onChangeText={setMeta}
              style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14 }}
              value={meta}
            />
            <TextInput
              keyboardAppearance="light"
              maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
              onChangeText={setUnidad}
              style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', flex: 2, fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14 }}
              value={unidad}
            />
          </View>
        )}
      </MasterGlass>

      <MasterGlass style={{ borderRadius: 20, gap: 12, padding: 16 }}>
        <Texto style={{ color: '#77718A', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t('habitos.detalle.programacion')}</Texto>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['diaria', 'dias_semana', 'veces_semana'] as const).map((valor) => {
            const activo = frecuencia === valor;
            const etiqueta = valor === 'diaria' ? t('habitos.detalle.frecuenciaDiaria') : valor === 'dias_semana' ? t('habitos.detalle.frecuenciaDiasSeleccionados') : t('habitos.detalle.frecuenciaVecesSemana', { veces: '' });
            return (
              <Rebote key={valor} onPress={() => { setFrecuencia(valor); if (valor === 'diaria') setDiasSemana([1, 2, 3, 4, 5, 6, 7]); }} colorHabito={colorHabito} activo={activo} compacto>
                <Texto style={{ color: activo ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{etiqueta}</Texto>
              </Rebote>
            );
          })}
        </View>
        {frecuencia === 'dias_semana' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {DIAS.map((x) => {
              const activo = diasSemana.includes(x.id);
              return (
                <Rebote key={x.id} onPress={() => toggleDia(x.id)} colorHabito={colorHabito} activo={activo} redondo>
                  <Texto style={{ color: activo ? '#FFFFFF' : '#6F687F', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t(`habitos.crearWizard.schedule.dayLabels.${x.id - 1}`)}</Texto>
                </Rebote>
              );
            })}
          </View>
        )}
        {frecuencia === 'veces_semana' && (
          <TextInput
            keyboardAppearance="light"
            keyboardType="number-pad"
            maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
            maxLength={1}
            onChangeText={setVecesSemana}
            style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14, textAlign: 'center' }}
            value={vecesSemana}
          />
        )}
      </MasterGlass>

      <RecuadroGlass blur style={{ borderRadius: 20, padding: 16 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Texto style={{ color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 14 }}>{t('habitos.crearWizard.reminder.daily')}</Texto>
            <Texto style={{ color: '#77718A', fontSize: 12 }}>{recordatorio ? t('habitos.crearWizard.reminder.enabledDescription') : t('habitos.crearWizard.reminder.disabledDescription')}</Texto>
          </View>
          <Switch value={recordatorio} onValueChange={(valor) => { hapticSeguro('seleccion'); setRecordatorio(valor); }} />
        </View>
        {recordatorio && (
          <View style={{ gap: 12, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {HORAS_PRESET.map((valor) => (
                <Rebote key={valor} onPress={() => { setHora(valor); setHoraPersonalizada(false); }} colorHabito={colorHabito} activo={!horaPersonalizada && hora === valor} compacto>
                  <Texto style={{ color: !horaPersonalizada && hora === valor ? '#FFFFFF' : '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{valor}</Texto>
                </Rebote>
              ))}
              <Rebote onPress={() => setHoraPersonalizada(true)} colorHabito={colorHabito} activo={horaPersonalizada} compacto>
                <Clock3 color={horaPersonalizada ? '#FFFFFF' : colorHabito} size={16} />
              </Rebote>
            </View>
            {horaPersonalizada && (
              <TextInput
                keyboardAppearance="light"
                keyboardType="numbers-and-punctuation"
                maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
                maxLength={5}
                onChangeText={setHora}
                placeholder={t('habitos.crearWizard.reminder.timePlaceholder')}
                style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: horaValida ? '#1A1335' : '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14, textAlign: 'center' }}
                value={hora}
              />
            )}
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Texto style={{ color: '#1A1335', flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('habitos.crearWizard.reminder.includeName')}</Texto>
              <Switch value={mostrarNombre} onValueChange={(valor) => { hapticSeguro('seleccion'); setMostrarNombre(valor); }} />
            </View>
          </View>
        )}
      </RecuadroGlass>

      {error && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Bold', fontSize: 12, textAlign: 'center' }}>{error}</Texto>}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MasterButton color="#E4E1EC" colorTexto="#554E68" onPress={onCancelar} style={{ flex: 1 }}>
          {t('habitos.detalle.cancelar')}
        </MasterButton>
        <MasterButton color={colorHabito} disabled={guardar.isPending} onPress={() => { setError(null); guardar.mutate(); }} style={{ flex: 2 }}>
          {guardar.isPending ? '…' : t('habitos.detalle.guardarCambios')}
        </MasterButton>
      </View>
    </View>
  );
}

function Rebote({ activo, children, colorHabito, compacto, onPress, redondo }: { activo: boolean; children: ReactNode; colorHabito: string; compacto?: boolean; onPress: () => void; redondo?: boolean }) {
  return (
    <Pressable
      onPress={() => { hapticSeguro('seleccion'); onPress(); }}
      style={redondo
        ? { alignItems: 'center', backgroundColor: activo ? colorHabito : '#F5F3F9', borderRadius: 15, height: 46, justifyContent: 'center', width: 38 }
        : { alignItems: 'center', backgroundColor: activo ? colorHabito : '#F5F3F9', borderRadius: 14, flex: compacto ? 1 : undefined, flexDirection: compacto ? 'row' : 'column', gap: 4, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: compacto ? 10 : 12 }}
    >
      {children}
    </Pressable>
  );
}
