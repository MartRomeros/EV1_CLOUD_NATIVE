export type EstadoPedido = 'Pendiente' | 'En preparación' | 'Despachado' | 'Cancelado';

export interface ItemPedido {
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  sucursalId: string;
  estado: EstadoPedido;
  fecha: string;
  items: ItemPedido[];
}
