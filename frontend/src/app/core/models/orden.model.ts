// Refleja el esquema TALLERPRO360 (ver Script.sql): tabla OT + OT_ITEM y la vista V_OT_RESUMEN.
// Se asume que el backend expone estos campos en camelCase (convencion Jackson/Spring Boot).

export interface OrdenItemInput {
  concepto: string;
  cantidad: number;
  precioUnit: number;
}

export interface OrdenItem extends OrdenItemInput {
  itemId: number;
  subtotal: number;
}

// Fila de V_OT_RESUMEN: listado de ordenes con totales agregados.
export interface OrdenResumen {
  otId: string;
  clienteId: string;
  patente: string;
  descripcion: string | null;
  total: number;
  createdAt: string;
  nItems: number;
  subtotalCalc: number;
}

// Detalle completo de una OT, incluyendo sus items.
export interface OrdenDetalle {
  otId: string;
  clienteId: string;
  patente: string;
  descripcion: string | null;
  total: number;
  createdAt: string;
  updatedAt: string | null;
  items: OrdenItem[];
}

export interface OrdenInput {
  clienteId: string;
  patente: string;
  descripcion: string;
  items: OrdenItemInput[];
}
