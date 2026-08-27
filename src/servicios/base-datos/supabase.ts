import 'react-native-url-polyfill/auto';

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { entorno } from '../../nucleo/configuracion/entorno';

let clienteSupabase: SupabaseClient | null = null;

const almacenamientoMemoria = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

function usarAlmacenamientoMemoria() {
  return Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
}

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
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: !usarAlmacenamientoMemoria(),
        storage: usarAlmacenamientoMemoria() ? almacenamientoMemoria : AsyncStorage,
      },
    });
  }

  return clienteSupabase;
}
