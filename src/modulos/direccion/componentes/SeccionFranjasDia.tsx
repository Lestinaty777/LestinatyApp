import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatoHoraEntera, LIMITES_FRANJA_DEFECTO, moverLimite, tramosDelDia, type LimitesFranja,
} from '../../../compartido/utilidades/franjas';
import { Boton, MasterGlass, Texto, useTonoMaster } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { actualizarLimitesFranja, CLAVE_PERFIL_BASICO, obtenerPerfilBasico, type PerfilBasico } from '../../configuracion/configuracion.servicio';

const CAMPOS: readonly { campo: keyof LimitesFranja; franja: 'manana' | 'tarde' | 'noche' }[] = [
  { campo: 'mananaDesde', franja: 'manana' }, { campo: 'tardeDesde', franja: 'tarde' }, { campo: 'nocheDesde', franja: 'noche' },
];

function iguales(a: LimitesFranja, b: LimitesFranja): boolean {
  return a.mananaDesde === b.mananaDesde && a.tardeDesde === b.tardeDesde && a.nocheDesde === b.nocheDesde;
}

// Ajustes → "Franjas del día": a qué hora empieza la mañana, la tarde y la
// noche. Los botones − y + nunca dejan un orden inválido (moverLimite), así
// que no hace falta un mensaje de error de validación: solo se desactivan.
// Spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md
export function SeccionFranjasDia() {
  const { t } = useTranslation();
  const tono = useTonoMaster();
  const cliente = useQueryClient();
  const consulta = useQuery({ queryKey: CLAVE_PERFIL_BASICO, queryFn: obtenerPerfilBasico });
  const guardados = consulta.data?.limitesFranja ?? LIMITES_FRANJA_DEFECTO;
  const [limites, setLimites] = useState<LimitesFranja>(guardados);
  useEffect(() => { setLimites(guardados); }, [guardados.mananaDesde, guardados.tardeDesde, guardados.nocheDesde]);

  const guardar = useMutation({
    mutationFn: () => actualizarLimitesFranja(limites),
    onSuccess: (nuevos) => {
      hapticSeguro('confirmacion');
      cliente.setQueryData<PerfilBasico>(CLAVE_PERFIL_BASICO, (previo) => ({ nombreVisible: previo?.nombreVisible ?? '', limitesFranja: nuevos }));
    },
    onError: () => hapticSeguro('impacto'),
  });

  const hayCambios = !iguales(limites, guardados);

  return (
    <MasterGlass style={estilos.tarjeta}>
      <Texto style={[estilos.descripcion, { color: tono.paleta.suave }]}>{t('franjas.ajustes.descripcion')}</Texto>
      {CAMPOS.map(({ campo, franja }) => {
        const menos = moverLimite(limites, campo, -1);
        const mas = moverLimite(limites, campo, 1);
        const nombre = t(`franjas.${franja}`);
        return (
          <View key={campo} style={estilos.fila}>
            <Texto style={[estilos.nombre, { color: tono.paleta.titulo }]}>{t('franjas.ajustes.empieza', { franja: nombre })}</Texto>
            <View style={estilos.control}>
              <Pressable
                accessibilityLabel={t('franjas.ajustes.antes', { franja: nombre })}
                accessibilityRole="button"
                accessibilityState={{ disabled: menos === limites }}
                disabled={menos === limites || consulta.isLoading}
                hitSlop={8}
                onPress={() => { hapticSeguro('seleccion'); setLimites(menos); }}
                style={[estilos.boton, menos === limites && estilos.botonInactivo]}
              >
                <Minus color={tono.paleta.titulo} size={16} strokeWidth={2.6} />
              </Pressable>
              <Texto accessibilityLabel={formatoHoraEntera(limites[campo])} style={[estilos.hora, { color: tono.paleta.titulo }]}>{formatoHoraEntera(limites[campo])}</Texto>
              <Pressable
                accessibilityLabel={t('franjas.ajustes.despues', { franja: nombre })}
                accessibilityRole="button"
                accessibilityState={{ disabled: mas === limites }}
                disabled={mas === limites || consulta.isLoading}
                hitSlop={8}
                onPress={() => { hapticSeguro('seleccion'); setLimites(mas); }}
                style={[estilos.boton, mas === limites && estilos.botonInactivo]}
              >
                <Plus color={tono.paleta.titulo} size={16} strokeWidth={2.6} />
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={estilos.previa}>
        {tramosDelDia(limites).map((tramo) => (
          <Texto key={tramo.franja} style={[estilos.previaTexto, { color: tono.paleta.suave }]}>
            {t('franjas.ajustes.tramo', { franja: t(`franjas.${tramo.franja}`), desde: formatoHoraEntera(tramo.desde), hasta: formatoHoraEntera(tramo.hasta) })}
          </Texto>
        ))}
      </View>

      {guardar.isError ? <Texto style={estilos.error}>{t('franjas.ajustes.errorGuardar')}</Texto> : null}
      {hayCambios ? (
        <Boton disabled={guardar.isPending} onPress={() => guardar.mutate()} variante="sendero">
          {guardar.isPending ? t('franjas.ajustes.guardando') : t('franjas.ajustes.guardar')}
        </Boton>
      ) : null}
    </MasterGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 18, gap: 12, padding: 14 },
  descripcion: { fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17 },
  fila: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nombre: { flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  control: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  boton: { alignItems: 'center', backgroundColor: 'rgba(26,19,53,0.08)', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  botonInactivo: { opacity: 0.35 },
  hora: { fontFamily: 'Montserrat-Bold', fontSize: 15, minWidth: 52, textAlign: 'center' },
  previa: { gap: 2 },
  previaTexto: { fontFamily: 'Montserrat-Medium', fontSize: 12 },
  error: { color: '#DC2626', fontFamily: 'Montserrat-Medium', fontSize: 12 },
});
