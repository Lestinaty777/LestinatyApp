import type { ColorMaster } from '../../diseno/componentes/MasterChanger';

// Orden arcoíris fijo, lunes a domingo — coincide 1-a-1 con COLORES_MASTER de
// MasterChanger (1=Azul...7=Morado), así que el día ISO de la semana (1-7) es
// directamente el ColorMaster del día, sin tabla de mapeo aparte.
export const ID_PAQUETE_ARCOIRIS = 'paquete_arcoiris';

export function colorMasterDelDia(fecha: Date = new Date()): ColorMaster {
  const diaIso = ((fecha.getDay() + 6) % 7) + 1; // getDay(): 0=domingo..6=sábado -> 1=lunes..7=domingo
  return diaIso as ColorMaster;
}
