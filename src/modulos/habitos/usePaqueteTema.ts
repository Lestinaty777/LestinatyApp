import { useMemo } from 'react';

import { useTonoMaster } from '../../diseno';
import { obtenerAssetsPaquete } from '../senderos/algoritmo/registroPaquetesArbol';
import { resolverPaqueteHabito } from './paqueteHabito';

/**
 * Las ilustraciones del paquete del tema activo: el árbol final (etapa 7), el arbusto, la flor y la semilla.
 * Cambian con la personalización igual que los colores: con Sakura el árbol y el arbusto son los de Sakura;
 * dentro de la card de un hábito (TonoDelHabito) son los del paquete de ese hábito.
 * Lo que no debe cambiar (onboarding, splash) sigue usando el asset de Esmeralda directamente.
 */
export function useAssetsPaqueteTema() {
  const { id } = useTonoMaster();
  return useMemo(() => {
    const paqueteId = resolverPaqueteHabito(id);
    const assets = obtenerAssetsPaquete(paqueteId)!;
    return { arbol: assets.etapas[6], arbusto: assets.arbusto, etapas: assets.etapas, flor: assets.flor, paqueteId, semilla: assets.semilla };
  }, [id]);
}
