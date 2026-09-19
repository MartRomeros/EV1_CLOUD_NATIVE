export interface Cliente {
  clienteId: string;
  nombre: string;
  telefono: string;
  email: string;
}

export type ClienteInput = Omit<Cliente, 'clienteId'>;
