import type { PanelTareas, PatronTarea, RiesgoTarea, SeccionPanelTareas } from './tareas.tipos';

type SeccionRemota<T> = { estado: SeccionPanelTareas<T[]>['estado']; datos: T[]; progreso: { actual: number; requerido: number } };
type PanelRemoto = {
  patrones: SeccionRemota<{ dia_semana: number; completados: number; muestras: number; porcentaje: number }>;
  riesgo: SeccionRemota<{ tarea_id: string; titulo: string; icono_lucide: string | null; color: string | null; reciente: number; base: number; nivel: RiesgoTarea['nivel'] }>;
};

function mapearSeccion<TOrigen, TDestino>(seccion: SeccionRemota<TOrigen>, mapear: (dato: TOrigen) => TDestino): SeccionPanelTareas<TDestino[]> {
  return {
    estado: seccion.estado,
    datos: seccion.datos.map(mapear),
    progreso: { actual: Number(seccion.progreso.actual), requerido: Number(seccion.progreso.requerido) },
  };
}

export function mapearPanelTareas(remoto: PanelRemoto): PanelTareas {
  return {
    patrones: mapearSeccion(remoto.patrones, (patron): PatronTarea => ({
      diaSemana: patron.dia_semana, completados: Number(patron.completados), muestras: Number(patron.muestras), porcentaje: Number(patron.porcentaje),
    })),
    riesgo: mapearSeccion(remoto.riesgo, (riesgo): RiesgoTarea => ({
      tareaId: riesgo.tarea_id, titulo: riesgo.titulo, iconoLucide: riesgo.icono_lucide, color: riesgo.color, reciente: Number(riesgo.reciente), base: Number(riesgo.base), nivel: riesgo.nivel,
    })),
  };
}
