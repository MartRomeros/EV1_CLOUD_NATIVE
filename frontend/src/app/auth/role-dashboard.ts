export type RolReconocido = 'admin' | 'mecanico' | 'recepcion';

// Orden de prioridad cuando la cuenta tiene mas de un rol asignado.
const ROLE_PRIORITY: readonly RolReconocido[] = ['admin', 'recepcion', 'mecanico'];

const ROLE_DASHBOARD_PATH: Record<RolReconocido, string> = {
  admin: '/dashboard/admin',
  recepcion: '/dashboard/recepcion',
  mecanico: '/dashboard/mecanico',
};

function isRolReconocido(rol: string): rol is RolReconocido {
  return rol === 'admin' || rol === 'mecanico' || rol === 'recepcion';
}

// Devuelve el Rol Reconocido de mayor prioridad presente en `roles`, o null si no hay ninguno.
export function resolveRolReconocido(roles: string[]): RolReconocido | null {
  const reconocidos = new Set(roles.filter(isRolReconocido));
  return ROLE_PRIORITY.find((rol) => reconocidos.has(rol)) ?? null;
}

// Devuelve la ruta del Dashboard de Rol para `roles`, o null si no hay Rol Reconocido.
export function getRoleDashboardPath(roles: string[]): string | null {
  const rol = resolveRolReconocido(roles);
  return rol ? ROLE_DASHBOARD_PATH[rol] : null;
}
