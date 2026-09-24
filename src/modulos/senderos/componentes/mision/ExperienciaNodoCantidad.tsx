import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react-native';

import { useTintarHex } from '../../../../diseno';
import { TonoDelHabito } from '../../../habitos/componentes/TonoDelHabito';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { reproducirSonido } from '../../../../nucleo/dispositivo/sonido';
import { calcularHitos } from './hitosMision';
import { PantallaMisionAnillo } from './PantallaMisionAnillo';
import { useMisionHabito } from './useMisionHabito';

// Spec 1B sobre el shell compartido PantallaMisionAnillo: mismo anillo
// "arena" e hitos que duración, aquí en unidades de conteo. El botón
// principal suma 1 por toque (reemplaza el stepper +/- de dos botones);
// restar 1 queda como acción secundaria.
export function ExperienciaNodoCantidad() {
  const params = useLocalSearchParams<{ habitoId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const mision = useMisionHabito(params.habitoId ?? '');
  const [conteo, setConteo] = useState(0);

  useEffect(() => {
    if (mision.habito?.valorHoy !== undefined) setConteo(mision.habito.valorHoy);
  }, [mision.habito?.valorHoy]);

  const color = mision.habito?.colorPaquete ?? mision.habito?.color ?? esm('#7FE3B0');
  const meta = mision.habito?.meta ?? 1;
  const unidad = mision.habito?.unidad || t('senderos.mision.unidadVeces');
  const porcentaje = Math.min(100, Math.round((conteo / Math.max(1, meta)) * 100));

  function sumar() {
    hapticSeguro('seleccion');
    void reproducirSonido('clickSuave');
    setConteo((prev) => prev + 1);
  }

  function restar() {
    hapticSeguro('seleccion');
    void reproducirSonido('clickSuave');
    setConteo((prev) => Math.max(0, prev - 1));
  }

  function registrar() {
    hapticSeguro('confirmacion');
    void reproducirSonido('exito');
    mision.enviarRegistro(conteo);
  }

  const hitos = calcularHitos(meta, conteo, (valor) => `${valor}`);

  return (
    <TonoDelHabito colorPaquete={mision.habito?.colorPaquete} paqueteId={mision.habito?.paqueteId}>
      <PantallaMisionAnillo
        botonPrincipalDisabled={mision.registrar.isPending || mision.registrar.isSuccess}
        botonPrincipalIcono={Plus}
        botonPrincipalTexto={t('senderos.mision.sumar')}
        botonReiniciarDisabled={conteo === 0 || mision.registrar.isPending}
        botonReiniciarIcono={Minus}
        botonReiniciarTexto={t('senderos.mision.restar')}
        botonTerminarDisabled={mision.registrar.isPending || mision.registrar.isSuccess || conteo <= 0}
        botonTerminarTexto={t('senderos.mision.terminar')}
        cargando={mision.consulta.isLoading}
        chipTexto={t('senderos.mision.chipSesionHoyCantidad', { meta, unidad })}
        color={color}
        hitos={hitos}
        iconoLucide={mision.habito?.iconoLucide}
        onBotonPrincipal={sumar}
        onBotonReiniciar={restar}
        onBotonTerminar={registrar}
        onTerminado={() => router.back()}
        paqueteId={mision.habito?.paqueteId ?? ''}
        porcentaje={porcentaje}
        resultado={mision.registrar.data}
        titulo={mision.habito?.titulo}
        valorMetaTexto={t('senderos.mision.deValor', { valor: `${meta} ${unidad}` })}
        valorPrincipalTexto={String(conteo)}
      />
    </TonoDelHabito>
  );
}
