export type RolUsuario = 'admin' | 'mecanico' | 'recepcion';

// Reflejo local de los App Roles de Azure Entra ID (ver auth/msal.config.ts -> getRolesFromAccount).
// La asignacion real de roles se hace en el portal de Azure; esta pantalla es un mock hasta que
// exista integracion con Microsoft Graph API (o un endpoint propio del backend) para administrarlos.
export interface Usuario {
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export type UsuarioInput = Usuario;
