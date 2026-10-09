import { useState } from 'react';
import { Share, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MasterButton, MasterGlass, MasterIcon, Rebote, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { generarCodigoInvitacionPlan, unirseAPlan, usuarioActualId } from '../planes.servicio';
import type { ResumenPlan } from '../planes.tipos';

const CLAVE_PLANES_LISTA = ['planes', 'lista'] as const;
const CLAVE_USUARIO_ACTUAL = ['auth', 'usuarioId'] as const;

// Fase 12 — única pantalla donde se "arma" compartir: unirse con un código
// ajeno, o generar/copiar/mandar el propio para cualquier plan que
// creaste. DetallePlanPantalla.tsx solo MUESTRA el progreso de cada
// participante una vez que ya son dos o más — no repite esto.
export function SeccionCompartidos({ planes }: { planes: ResumenPlan[] }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const cliente = useQueryClient();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [planExpandidoId, setPlanExpandidoId] = useState<string | null>(null);

  const consultaUsuario = useQuery({ queryFn: usuarioActualId, queryKey: CLAVE_USUARIO_ACTUAL, staleTime: Infinity });
  const misPlanes = planes.filter((plan) => plan.creadorId === consultaUsuario.data);

  const unirse = useMutation({
    mutationFn: () => unirseAPlan(codigo.trim()),
    onSuccess: (resultado) => {
      hapticSeguro('confirmacion');
      cliente.invalidateQueries({ queryKey: CLAVE_PLANES_LISTA });
      setCodigo('');
      router.push(`/planes/${resultado.planId}`);
    },
  });

  return (
    <View style={{ gap: 14 }}>
      <MasterGlass style={{ borderRadius: 18, gap: 10, padding: 16 }}>
        <Texto style={{ color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 15 }}>{t('planes.compartidos.unirseTitulo')}</Texto>
        <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('planes.compartidos.unirseDescripcion')}</Texto>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setCodigo}
          placeholder={t('planes.compartidos.codigoPlaceholder')}
          placeholderTextColor="#9A93A8"
          style={{ backgroundColor: '#fff', borderColor: '#E4DDF0', borderRadius: 14, borderWidth: 1, color: '#1A1335', fontSize: 15, padding: 13 }}
          value={codigo}
        />
        {unirse.isError && <Texto style={{ color: '#B64747', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('planes.compartidos.errorUnirse')}</Texto>}
        <MasterButton color={acento} disabled={!codigo.trim() || unirse.isPending} onPress={() => unirse.mutate()}>
          {unirse.isPending ? t('planes.compartidos.uniendo') : t('planes.compartidos.unirme')}
        </MasterButton>
      </MasterGlass>

      <Texto style={{ color: '#554E68', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{t('planes.compartidos.misPlanesTitulo')}</Texto>
      {misPlanes.length === 0 ? (
        <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('planes.compartidos.sinPlanesPropios')}</Texto>
      ) : (
        misPlanes.map((plan) => (
          <FilaPlanCompartible
            expandido={planExpandidoId === plan.id}
            key={plan.id}
            onToggle={() => setPlanExpandidoId((actual) => (actual === plan.id ? null : plan.id))}
            plan={plan}
          />
        ))
      )}
    </View>
  );
}

function FilaPlanCompartible({ expandido, onToggle, plan }: { expandido: boolean; onToggle: () => void; plan: ResumenPlan }) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const [copiado, setCopiado] = useState(false);

  const generar = useMutation({ mutationFn: () => generarCodigoInvitacionPlan(plan.id) });

  async function copiar() {
    if (!generar.data) return;
    hapticSeguro('confirmacion');
    await Clipboard.setStringAsync(generar.data);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2400);
  }

  async function compartir() {
    if (!generar.data) return;
    hapticSeguro('seleccion');
    try { await Share.share({ message: t('planes.compartidos.mensajeInvitacion', { codigo: generar.data, titulo: plan.titulo }) }); } catch { /* el usuario canceló la hoja de compartir */ }
  }

  function alternar() {
    hapticSeguro('seleccion');
    onToggle();
    if (!expandido && !generar.data) generar.mutate();
  }

  return (
    <MasterGlass style={{ borderRadius: 16, gap: 10, padding: 14 }}>
      <Rebote onPress={alternar}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
          <Texto numberOfLines={1} style={{ color: '#1A1335', flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }}>{plan.titulo}</Texto>
          <MasterIcon alTema name="equipo" size={18} />
        </View>
      </Rebote>
      {expandido && (
        generar.isPending ? (
          <Texto style={{ color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 12 }}>{t('planes.compartidos.generandoCodigo')}</Texto>
        ) : generar.data ? (
          <>
            <View style={{ alignItems: 'center', backgroundColor: conAlfa(acento, 0.1), borderRadius: 12, flexDirection: 'row', gap: 8, padding: 10 }}>
              <Texto style={{ color: '#1A1335', flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 16, letterSpacing: 2 }}>{generar.data}</Texto>
              <Rebote onPress={copiar}>
                <Texto style={{ color: acento, fontFamily: 'Montserrat-Bold', fontSize: 12 }}>{copiado ? t('planes.compartidos.copiado') : t('planes.compartidos.copiar')}</Texto>
              </Rebote>
            </View>
            <MasterButton color={acento} onPress={compartir}>{t('planes.compartidos.compartirBoton')}</MasterButton>
          </>
        ) : null
      )}
    </MasterGlass>
  );
}
