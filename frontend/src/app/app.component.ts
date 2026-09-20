import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { Subject, filter, takeUntil } from 'rxjs';
import { getRolesFromAccount } from './auth/msal.config';
import { LoginComponent } from './pages/login/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroying$ = new Subject<void>();

  isAuthenticated = false;
  username: string | null = null;
  roles: string[] = [];

  ngOnInit(): void {
    this.msalService.handleRedirectObservable().subscribe();

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this.destroying$),
      )
      .subscribe((result) => {
        const payload = result.payload as AuthenticationResult;
        this.msalService.instance.setActiveAccount(payload.account);
      });

    // detectChanges() se llama explicitamente porque estas emisiones de MSAL pueden
    // resolver fuera del ciclo automatico de deteccion de cambios de Angular (se
    // verifico que NgZone.run() no era suficiente en este entorno).
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroying$),
      )
      .subscribe(() => {
        this.ensureActiveAccount();
        this.refreshAuthState();
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroying$.next();
    this.destroying$.complete();
  }

  logout(): void {
    this.msalService.logoutRedirect().subscribe();
  }

  private ensureActiveAccount(): void {
    if (this.msalService.instance.getActiveAccount()) {
      return;
    }
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  private refreshAuthState(): void {
    const account = this.msalService.instance.getActiveAccount();
    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = !!account;
    this.username = account?.username ?? null;
    this.roles = getRolesFromAccount(account);

    if (this.isAuthenticated && !wasAuthenticated) {
      this.router.navigate(['/ordenes']);
    }
  }
}
