import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { getRolesFromAccount } from './msal.config';
import { getRoleDashboardPath } from './role-dashboard';
import { ToastService } from '../core/services/toast.service';

// Complementa a MsalInterceptor (que adjunta el bearer token): este interceptor
// solo reacciona a respuestas de error de la API, no toca el request de salida.
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly msalService = inject(MsalService);
  private readonly toastService = inject(ToastService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(environment.apiUrl)) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.toastService.show('Tu sesión expiró o no es válida. Inicia sesión nuevamente.', 'error');
      console.error('[auth] 401 de la API, sesion invalida o expirada. Redirigiendo a /ordenes.', error);
      this.router.navigateByUrl('/ordenes');
    } else if (error.status === 403) {
      this.toastService.show('No tienes permisos para realizar esta acción.', 'error');
      const roles = getRolesFromAccount(this.msalService.instance.getActiveAccount());
      const destino = getRoleDashboardPath(roles) ?? '/ordenes';
      console.error(`[auth] 403 de la API. Redirigiendo a ${destino}.`, error);
      this.router.navigateByUrl(destino);
    }

    return throwError(() => error);
  }
}
