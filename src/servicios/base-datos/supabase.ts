import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { entorno } from '../../nucleo/configuracion/entorno';
import { opcionesSesionPersistente } from './sesion';

let clienteSupabase: SupabaseClient | null = null;

export function supabaseEstaConfigurado() {
  return Boolean(entorno.supabaseUrl && entorno.supabaseAnonKey);
}

export function obtenerClienteSupabase() {
  if (!supabaseEstaConfigurado()) {
    throw new Error(
      'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY antes de usar Supabase.',
    );
  }

  if (!clienteSupabase) {
    clienteSupabase = createClient(entorno.supabaseUrl, entorno.supabaseAnonKey, {
      auth: opcionesSesionPersistente(AsyncStorage),
    });
  }

  return clienteSupabase;
}
