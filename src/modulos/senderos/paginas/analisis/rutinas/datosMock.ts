import { RutinasEstadisticas } from './tipos';

// Generamos 28 dias de datos mock (4 semanas)
const generarActividad = () => {
  const actividad = [];
  for (let i = 27; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    actividad.push({
      fecha: date.toISOString().split('T')[0],
      total: 3,
      completadas: Math.random() > 0.3 ? Math.floor(Math.random() * 4) : 0, // Algunas veces 0, a veces 1-3
    });
  }
  return actividad;
};

export const rutinasMockData: RutinasEstadisticas = {
  tasaConsistencia: 78,
  rachaActual: 5,
  mejorRacha: 14,
  distribucionHoraria: {
    manana: 45,
    tarde: 15,
    noche: 40,
  },
  actividadReciente: generarActividad(),
};
