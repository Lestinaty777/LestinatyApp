import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const DURACION_COOLDOWN_MS = 60_000;
const PREFIJO_LLAVE = 'acceso:otp-cooldown';

type TipoCooldownOtp = 'recovery' | 'signup';

function normalizarEmail(email: string | null) {
  return email?.trim().toLowerCase() ?? '';
}

function obtenerLlave(tipo: TipoCooldownOtp, email: string | null) {
  const emailNormalizado = normalizarEmail(email);

  return emailNormalizado ? `${PREFIJO_LLAVE}:${tipo}:${emailNormalizado}` : null;
}

async function leerRestanteMs(tipo: TipoCooldownOtp, email: string | null) {
  const llave = obtenerLlave(tipo, email);

  if (!llave) {
    return 0;
  }

  const valorGuardado = await AsyncStorage.getItem(llave);
  const expiraEn = valorGuardado ? Number(valorGuardado) : 0;
  const restante = expiraEn - Date.now();

  if (restante <= 0) {
    await AsyncStorage.removeItem(llave);
    return 0;
  }

  return restante;
}

export async function obtenerSegundosCooldownOtp(tipo: TipoCooldownOtp, email: string | null) {
  const restanteMs = await leerRestanteMs(tipo, email);

  return Math.ceil(restanteMs / 1000);
}

async function guardarCooldown(tipo: TipoCooldownOtp, email: string | null) {
  const llave = obtenerLlave(tipo, email);

  if (!llave) {
    return 0;
  }

  const expiraEn = Date.now() + DURACION_COOLDOWN_MS;
  await AsyncStorage.setItem(llave, String(expiraEn));

  return DURACION_COOLDOWN_MS;
}

export function usarCooldownOtp(tipo: TipoCooldownOtp, email: string | null) {
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  const sincronizar = useCallback(async () => {
    const restanteMs = await leerRestanteMs(tipo, email);
    setSegundosRestantes(Math.ceil(restanteMs / 1000));
  }, [email, tipo]);

  const iniciar = useCallback(async (emailObjetivo?: string | null) => {
    const restanteMs = await guardarCooldown(tipo, emailObjetivo ?? email);
    setSegundosRestantes(Math.ceil(restanteMs / 1000));
  }, [email, tipo]);

  useEffect(() => {
    void sincronizar();
  }, [sincronizar]);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      return undefined;
    }

    const intervalo = setInterval(() => {
      void sincronizar();
    }, 1000);

    return () => clearInterval(intervalo);
  }, [segundosRestantes, sincronizar]);

  return {
    iniciar,
    segundosRestantes,
    sincronizar,
  };
}
