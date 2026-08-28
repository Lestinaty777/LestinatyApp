import { SaludEstadisticas } from './tipos';

const generarScatter = () => {
  const puntos = [];
  for (let i = 0; i < 24; i++) {
    const sueno = 4 + Math.random() * 5; 
    let humor = (sueno - 4) * 1.5 + 2 + (Math.random() * 3 - 1.5);
    if (humor > 10) humor = 10;
    if (humor < 1) humor = 1;
    puntos.push({ horasSueno: sueno, humor });
  }
  return puntos;
};

const generarActividad = () => {
  const actividad = [];
  // Generar datos suaves como un pulso
  let valor = 50;
  for (let i = 0; i < 28; i++) {
    valor = valor + (Math.random() * 30 - 15);
    if (valor > 95) valor = 95;
    if (valor < 20) valor = 20;
    actividad.push(valor);
  }
  return actividad;
};

export const saludMockData: SaludEstadisticas = {
  correlacionSuenoHumor: generarScatter(),
  actividadMensual: generarActividad(),
  macros: {
    proteina: 35,
    carbos: 45,
    grasas: 20
  },
  metricasCorporales: {
    pesoDelta: -2.3,
    grasaDelta: -4.1,
    masaMuscularDelta: 3.2,
    ritmoCardiacoDelta: -1.8
  },
  diasEntrenamientoIntenso: 18,
  diasDescansoActivo: 12
};
