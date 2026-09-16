import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrentUserService } from '../../core/services/current-user';
import { UsuarioSimulado } from '../../core/models/usuario-simulado';

const USUARIO_SIMULADO_FIJO: UsuarioSimulado = {
  rol: 'Cliente',
  userId: 'cliente.demo1@pedidos360.com',
};

@Component({
  selector: 'app-login',
  imports: [NgbAlertModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);

  mostrarMensajeReset = false;

  onLoginMicrosoft(): void {
    this.currentUser.login(USUARIO_SIMULADO_FIJO);
    this.router.navigateByUrl('/home');
  }

  onResetPassword(): void {
    this.mostrarMensajeReset = true;
  }
}
