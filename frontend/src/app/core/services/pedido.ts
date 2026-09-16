import { Service, signal } from '@angular/core';
import { EstadoPedido, ItemPedido, Pedido } from '../models/pedido';

const SECUENCIA_ESTADOS: readonly EstadoPedido[] = ['Pendiente', 'En preparación', 'Despachado'];

export interface DatosNuevoPedido {
  clienteId: string;
  sucursalId: string;
  items: ItemPedido[];
}

const PEDIDOS_MOCK: Pedido[] = [
  {
    id: 'PED-001',
    clienteId: 'cliente.demo1@pedidos360.com',
    sucursalId: 'S1',
    estado: 'Pendiente',
    fecha: '2026-09-10',
    items: [{ productoNombre: 'Notebook 14"', cantidad: 1, precioUnitario: 650000 }],
  },
  {
    id: 'PED-002',
    clienteId: 'cliente.demo1@pedidos360.com',
    sucursalId: 'S1',
    estado: 'En preparación',
    fecha: '2026-09-08',
    items: [{ productoNombre: 'Mouse inalámbrico', cantidad: 2, precioUnitario: 12000 }],
  },
  {
    id: 'PED-003',
    clienteId: 'cliente.demo2@pedidos360.com',
    sucursalId: 'S2',
    estado: 'Pendiente',
    fecha: '2026-09-12',
    items: [{ productoNombre: 'Teclado mecánico', cantidad: 1, precioUnitario: 45000 }],
  },
  {
    id: 'PED-004',
    clienteId: 'cliente.demo2@pedidos360.com',
    sucursalId: 'S2',
    estado: 'Despachado',
    fecha: '2026-09-01',
    items: [{ productoNombre: 'Monitor 24"', cantidad: 1, precioUnitario: 180000 }],
  },
  {
    id: 'PED-005',
    clienteId: 'cliente.demo3@pedidos360.com',
    sucursalId: 'S1',
    estado: 'Cancelado',
    fecha: '2026-08-28',
    items: [{ productoNombre: 'Webcam HD', cantidad: 1, precioUnitario: 25000 }],
  },
];

@Service()
export class PedidoService {
  private readonly _pedidos = signal<Pedido[]>(PEDIDOS_MOCK);

  readonly pedidos = this._pedidos.asReadonly();

  cancelar(id: string): void {
    this._pedidos.update((lista) =>
      lista.map((p) => (p.id === id && p.estado === 'Pendiente' ? { ...p, estado: 'Cancelado' } : p)),
    );
  }

  cambiarEstado(id: string): void {
    this._pedidos.update((lista) =>
      lista.map((p) => {
        if (p.id !== id) return p;
        const siguiente = SECUENCIA_ESTADOS[SECUENCIA_ESTADOS.indexOf(p.estado) + 1];
        return siguiente ? { ...p, estado: siguiente } : p;
      }),
    );
  }

  crear(datos: DatosNuevoPedido): Pedido {
    const nuevoPedido: Pedido = {
      id: this.generarId(),
      clienteId: datos.clienteId,
      sucursalId: datos.sucursalId,
      estado: 'Pendiente',
      fecha: new Date().toISOString().slice(0, 10),
      items: datos.items,
    };
    this._pedidos.update((lista) => [...lista, nuevoPedido]);
    return nuevoPedido;
  }

  private generarId(): string {
    const numeros = this._pedidos().map((p) => Number(p.id.replace('PED-', '')) || 0);
    const siguiente = Math.max(0, ...numeros) + 1;
    return `PED-${String(siguiente).padStart(3, '0')}`;
  }
}
