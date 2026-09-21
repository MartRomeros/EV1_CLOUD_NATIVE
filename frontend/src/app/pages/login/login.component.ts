import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject, takeUntil } from 'rxjs';
import { loginRequest } from '../../auth/msal.config';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroying$ = new Subject<void>();

  error: string | null = null;
  loginInProgress = false;

  ngOnInit(): void {
    // MsalGuard ya dispara loginRedirect automaticamente al intentar entrar a una
    // ruta protegida sin sesion. Deshabilitamos el boton mientras eso ocurre para
    // no disparar un segundo loginRedirect en paralelo (causa interaction_in_progress).
    // detectChanges() se llama explicitamente porque estas emisiones de MSAL pueden
    // llegar fuera del ciclo automatico de deteccion de cambios de Angular.
    this.msalBroadcastService.inProgress$
      .pipe(takeUntil(this.destroying$))
      .subscribe((status) => {
        this.loginInProgress = status !== InteractionStatus.None;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  login(): void {
    if (this.loginInProgress) {
      return;
    }
    // Se marca en progreso de forma sincronica: el broadcast de MsalBroadcastService
    // (inProgress$) tarda unos milisegundos en emitir, y en esa ventana un doble click
    // dispara un segundo loginRedirect() que sobreescribe el "state" cacheado del primero,
    // causando ClientAuthError: state_mismatch al volver de Entra ID.
    this.loginInProgress = true;
    this.error = null;
    this.msalService.loginRedirect(loginRequest).subscribe({
      error: (err) => {
        this.error = err instanceof Error ? err.message : 'No se pudo iniciar sesión.';
        this.loginInProgress = false;
        this.cdr.detectChanges();
      },
    });
  }
}
