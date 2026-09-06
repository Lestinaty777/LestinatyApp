export type NodoSendero = { id: string; orden: number; tipo: 'leccion' | 'evaluacion'; titulo?: string | null; descripcion?: string | null; objetivo?: string | null; tiempoEstimadoMinutos?: number | null; lessonPack?: unknown };
export type SenderoResumen = { descripcion: string | null; id: string; nivelTitulo: string | null; nodosTotales: number; titulo: string };
export type SenderoDetalle = SenderoResumen & { categoriaCodigo: 'estudio'; nivelId: string; nivelNumero: number; nodos: NodoSendero[] };
