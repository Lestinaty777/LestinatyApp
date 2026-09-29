import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';

import { Boton, HojaDeslizante, Rebote, Texto } from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { TOPE_ESCALA_TEXTO_COMPACTO } from '../../../diseno/fundamentos/accesibilidad';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../../tienda/gemas.servicio';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import type { PrioridadTarea } from '../tareas.tipos';

type CrearTareaHojaProps = {
  guardando: boolean;
  onCerrar: () => void;
  onCrear: (input: { titulo: string; fechaVencimiento: string | null; prioridad: PrioridadTarea | null; semillaId: string | null; paqueteId: string | null }) => void;
};

function fechaISO(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}

const OPCIONES_FECHA: { clave: string; valor: string | null }[] = [
  { clave: 'hoy', valor: fechaISO(0) },
  { clave: 'manana', valor: fechaISO(1) },
  { clave: 'semana', valor: fechaISO(7) },
  { clave: 'sinFecha', valor: null },
];

const OPCIONES_PRIORIDAD: { clave: string; valor: PrioridadTarea | null }[] = [
  { clave: 'urgenteImportante', valor: 'urgente_importante' },
  { clave: 'urgenteNoImportante', valor: 'urgente_no_importante' },
  { clave: 'noUrgenteImportante', valor: 'no_urgente_importante' },
  { clave: 'noUrgenteNoImportante', valor: 'no_urgente_no_importante' },
  { clave: 'sinPrioridad', valor: null },
];

// Espejo liviano del selector de semillas del wizard de hábitos (CrearHabitoWizard):
// una tarjeta de color por paquete con semillas libres, agrupadas por familia
// de color. No se comparte el componente porque ese archivo ya es sensible —
// acá alcanza con la versión simple, sin las animaciones de revelado.
export function CrearTareaHoja({ guardando, onCerrar, onCrear }: CrearTareaHojaProps) {
  const { t } = useTranslation();
  const consultaSemillas = useQuery({ queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  const consultaPaquetes = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState<string | null>(OPCIONES_FECHA[0].valor);
  const [prioridad, setPrioridad] = useState<PrioridadTarea | null>(null);
  const [semillaSeleccionada, setSemillaSeleccionada] = useState<string | null>(null);

  const paquetePorId = useMemo(() => new Map((consultaPaquetes.data ?? []).map((paquete) => [paquete.id, paquete])), [consultaPaquetes.data]);
  const semillasPorPaquete = useMemo(() => {
    const agrupadas = new Map<string, string[]>();
    for (const semilla of consultaSemillas.data ?? []) {
      const lista = agrupadas.get(semilla.paqueteId) ?? [];
      lista.push(semilla.id);
      agrupadas.set(semilla.paqueteId, lista);
    }
    return [...agrupadas.entries()]
      .map(([paqueteId, semillaIds]) => ({ paquete: paquetePorId.get(paqueteId), semillaIds }))
      .filter((grupo): grupo is { paquete: NonNullable<typeof grupo.paquete>; semillaIds: string[] } => Boolean(grupo.paquete))
      .sort((a, b) => colorMasterMasCercano(a.paquete.masterPackColor) - colorMasterMasCercano(b.paquete.masterPackColor));
  }, [consultaSemillas.data, paquetePorId]);

  const semillaInfo = semillasPorPaquete.find((grupo) => grupo.semillaIds.includes(semillaSeleccionada ?? ''));
  const puedeCrear = titulo.trim().length > 0 && !guardando;

  function confirmar() {
    if (!puedeCrear) return;
    onCrear({ titulo, fechaVencimiento: fecha, prioridad, semillaId: semillaSeleccionada, paqueteId: semillaInfo?.paquete.id ?? null });
  }

  return (
    <HojaDeslizante onCerrar={onCerrar}>
      <View style={{ gap: 16, paddingHorizontal: 20, paddingTop: 6 }}>
        <Texto variante="subtitulo">{t('tareas.pantalla.nuevaTarea')}</Texto>
        <TextInput
          autoFocus
          keyboardAppearance="light"
          maxFontSizeMultiplier={TOPE_ESCALA_TEXTO_COMPACTO}
          onChangeText={setTitulo}
          placeholder={t('tareas.pantalla.tituloPlaceholder')}
          style={{ backgroundColor: '#F5F3F9', borderRadius: 14, color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 15, padding: 14 }}
          value={titulo}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OPCIONES_FECHA.map((opcion) => {
            const activa = fecha === opcion.valor;
            return (
              <Rebote key={opcion.clave} onPress={() => setFecha(opcion.valor)} estilo={{ backgroundColor: activa ? '#1A1335' : '#F5F3F9', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Texto style={{ color: activa ? '#FFFFFF' : '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{t(`tareas.pantalla.fecha.${opcion.clave}`)}</Texto>
              </Rebote>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {OPCIONES_PRIORIDAD.map((opcion) => {
            const activa = prioridad === opcion.valor;
            return (
              <Rebote key={opcion.clave} onPress={() => setPrioridad(opcion.valor)} estilo={{ backgroundColor: activa ? '#EEE8FB' : '#F5F3F9', borderColor: activa ? '#7C3AED' : 'transparent', borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Texto style={{ color: activa ? '#5B21B6' : '#7B7494', fontFamily: 'Montserrat-Bold', fontSize: 11 }}>{t(`tareas.pantalla.prioridad.${opcion.clave}`)}</Texto>
              </Rebote>
            );
          })}
        </View>

        {semillasPorPaquete.length > 0 && (
          <View>
            <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('tareas.pantalla.semilla.titulo')}</Texto>
            <Texto style={{ color: '#7B7494', fontSize: 12, marginTop: 2, marginBottom: 8 }}>{t('tareas.pantalla.semilla.descripcion')}</Texto>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', gap: 10 }} horizontal showsHorizontalScrollIndicator={false}>
              {semillasPorPaquete.map(({ paquete, semillaIds }) => {
                const activa = semillaIds.includes(semillaSeleccionada ?? '');
                return (
                  <Rebote
                    accessibilityLabel={paquete.nombre}
                    key={paquete.id}
                    onPress={() => setSemillaSeleccionada(activa ? null : semillaIds[0])}
                    estilo={{ alignItems: 'center', backgroundColor: paquete.masterPackColor, borderColor: activa ? '#1A1335' : 'transparent', borderRadius: 999, borderWidth: 3, height: 44, justifyContent: 'center', width: 44 }}
                  >
                    {activa ? <Check color="#FFFFFF" size={18} strokeWidth={3} /> : null}
                  </Rebote>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Boton color="#1A1335" disabled={!puedeCrear} onPress={confirmar} style={{ marginTop: 4 }}>
          {guardando ? t('tareas.pantalla.creando') : t('tareas.pantalla.crear')}
        </Boton>
      </View>
    </HojaDeslizante>
  );
}
