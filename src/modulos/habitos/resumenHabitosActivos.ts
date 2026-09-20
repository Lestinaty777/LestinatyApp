import type { HabitoResumen, TipoMetaHabito } from './tipos';

type FilaHabitoActivo = { id: string; titulo: string; descripcion: string | null; icono_lucide: string; color: string; tipo_meta: TipoMetaHabito; unidad: string | null; paquete_id: string; arboles_paquetes?: { master_pack_color: string } | { master_pack_color: string }[] | null };
type FilaPlanActivo = { habito_id: string; frecuencia: 'diaria' | 'dias_semana' | 'veces_semana'; dias_semana: number[] | null; objetivo_valor: number; desde_fecha: string; hasta_fecha: string | null };
type FilaRegistroActivo = { habito_id: string; fecha_local: string; valor: number };

// El embed de PostgREST llega como objeto (relación N:1) o como lista según el cliente.
function colorDelPaquete(paquete: FilaHabitoActivo['arboles_paquetes']): string | undefined {
  return (Array.isArray(paquete) ? paquete[0] : paquete)?.master_pack_color;
}

export function resumirHabitosActivos({ fecha, items, planes, registros }: { fecha: string; items: FilaHabitoActivo[]; planes: FilaPlanActivo[]; registros: FilaRegistroActivo[] }): HabitoResumen[] {
  return items.flatMap((item) => {
    const plan = planes.find((fila) => fila.habito_id === item.id && fila.desde_fecha <= fecha && (!fila.hasta_fecha || fila.hasta_fecha > fecha));
    if (!plan) return [];
    const valorHoy = Number(registros.find((fila) => fila.habito_id === item.id && fila.fecha_local === fecha)?.valor ?? 0);
    const meta = Number(plan.objetivo_valor);
    return [{
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      iconoLucide: item.icono_lucide,
      color: item.color,
      tipoMeta: item.tipo_meta,
      unidad: item.unidad,
      meta,
      valorHoy,
      completado: item.tipo_meta === 'check' ? valorHoy > 0 : valorHoy >= meta,
      paqueteId: item.paquete_id,
      colorPaquete: colorDelPaquete(item.arboles_paquetes),
    }];
  });
}
