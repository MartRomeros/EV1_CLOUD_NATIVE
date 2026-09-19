export type CategoriaServicio = 'mano_obra' | 'repuesto';

// Catalogo de "conceptos" que se usan como items de una OT (ver OT_ITEM en Script.sql).
export interface Servicio {
  concepto: string;
  descripcion: string;
  precioUnit: number;
  categoria: CategoriaServicio;
}

export type ServicioInput = Servicio;
