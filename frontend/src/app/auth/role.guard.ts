import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { getRolesFromAccount } from './msal.config';
import { RolReconocido, getRoleDashboardPath, resolveRolReconocido } from './role-dashboard';
import { ToastService } from '../core/services/toast.service';

const MENSAJE_SECCION_NO_ACCESIBLE = 'No tienes permisos para acceder a esta sección.';

// Guard propio del proyecto (no una reconfiguracion de MsalGuard): a diferencia
// de MsalGuard, nunca llama a handleRedirectObservable() ni dispara ninguna
// interaccion de MSAL, solo lee la cuenta activa ya resuelta. Por eso si puede
// aplicarse a rutas internas sin repetir el bug de navegacion documentado en
// app.routes.ts.
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): Observable<boolean | UrlTree> => {
  const msalService = inject(MsalService);
  const broadcastService = inject(MsalBroadcastService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  // Fail-closed: una ruta con roleGuard pero sin data.roles no la puede
  // activar ningun rol.
  const requiredRoles = (route.data['roles'] ?? []) as RolReconocido[];

  return broadcastService.inProgress$.pipe(
    filter((status) => status === InteractionStatus.None),
    take(1),
    map(() => {
      const account = msalService.instance.getActiveAccount();
      const roles = getRolesFromAccount(account);
      const rol = resolveRolReconocido(roles);

      if (rol && requiredRoles.includes(rol)) {
        return true;
      }

      toastService.show(MENSAJE_SECCION_NO_ACCESIBLE, 'warning');
      return router.parseUrl(rol ? getRoleDashboardPath(roles)! : '/ordenes');
    }),
  );
};
