export type Rol = 'Cliente' | 'Vendedor' | 'Administrador';

export interface UsuarioSimulado {
  rol: Rol;
  userId: string;
  sucursalId?: string;
}
