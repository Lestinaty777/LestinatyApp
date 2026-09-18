import { ConexionHabito, HabitoResumen, ImpactoHabito, PanelHabitos, PatronHabito, RiesgoHabito, SeccionPanelHabitos } from './tipos';

type ProgresoRemoto = { actual: number; requerido: number };
type SeccionRemota<T> = { estado: SeccionPanelHabitos<T[]>['estado']; datos: T[]; progreso?: ProgresoRemoto };
type HabitoRemoto = { id: string; titulo: string; descripcion: string | null; icono_lucide: string; color: string; tipo_meta: HabitoResumen['tipoMeta']; unidad: string | null; meta: number; valor_hoy: number; completado: boolean };
type PanelRemoto = {
  hoy: SeccionRemota<HabitoRemoto>;
  patrones: SeccionRemota<{ dia_semana: number; completados: number; muestras: number; porcentaje: number }>;
  conexiones: SeccionRemota<{ origen_habito_id: string; destino_habito_id: string; comparables: number; juntos: number; fuerza: number }>;
  riesgo: SeccionRemota<{ habito_id: string; titulo: string; icono_lucide: string; color: string; reciente: number; base: number; nivel: RiesgoHabito['nivel'] }>;
  impacto: SeccionRemota<{ origen_habito_id: string; destino_habito_id: string; con_origen: number; sin_origen: number; impacto: number }>;
};

function mapearSeccion<TOrigen, TDestino>(seccion: SeccionRemota<TOrigen>, mapear: (dato: TOrigen) => TDestino): SeccionPanelHabitos<TDestino[]> {
  return {
    estado: seccion.estado,
    datos: seccion.datos.map(mapear),
    ...(seccion.progreso ? { progreso: { actual: Number(seccion.progreso.actual), requerido: Number(seccion.progreso.requerido) } } : {}),
  };
}

export function mapearPanelHabitos(remoto: PanelRemoto): PanelHabitos {
  return {
    hoy: mapearSeccion(remoto.hoy, (habito): HabitoResumen => ({ id: habito.id, titulo: habito.titulo, descripcion: habito.descripcion, iconoLucide: habito.icono_lucide, color: habito.color, tipoMeta: habito.tipo_meta, unidad: habito.unidad, meta: Number(habito.meta), valorHoy: Number(habito.valor_hoy), completado: habito.completado })),
    patrones: mapearSeccion(remoto.patrones, (patron): PatronHabito => ({ diaSemana: patron.dia_semana, completados: Number(patron.completados), muestras: Number(patron.muestras), porcentaje: Number(patron.porcentaje) })),
    conexiones: mapearSeccion(remoto.conexiones, (conexion): ConexionHabito => ({ origenHabitoId: conexion.origen_habito_id, destinoHabitoId: conexion.destino_habito_id, comparables: Number(conexion.comparables), juntos: Number(conexion.juntos), fuerza: Number(conexion.fuerza) })),
    riesgo: mapearSeccion(remoto.riesgo, (riesgo): RiesgoHabito => ({ habitoId: riesgo.habito_id, titulo: riesgo.titulo, iconoLucide: riesgo.icono_lucide, color: riesgo.color, reciente: Number(riesgo.reciente), base: Number(riesgo.base), nivel: riesgo.nivel })),
    impacto: mapearSeccion(remoto.impacto, (impacto): ImpactoHabito => ({ origenHabitoId: impacto.origen_habito_id, destinoHabitoId: impacto.destino_habito_id, conOrigen: Number(impacto.con_origen), sinOrigen: Number(impacto.sin_origen), impacto: Number(impacto.impacto) })),
  };
}
