import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolverCategoriaRuta } from '../../../src/modulos/habitos/categorias';
import { CategoriaHabitosPantalla } from '../../../src/modulos/habitos/pantallas/CategoriaHabitosPantalla';

export default function CategoriaHabitosRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const categoria = resolverCategoriaRuta(id);
  return categoria ? <CategoriaHabitosPantalla categoria={categoria} /> : <Redirect href="/habitos" />;
}
