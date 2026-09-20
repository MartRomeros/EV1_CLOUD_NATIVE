import { Service, computed, signal } from '@angular/core';
import { UsuarioSimulado } from '../models/usuario-simulado';

@Service()
export class CurrentUserService {
  private readonly _currentUser = signal<UsuarioSimulado | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(usuario: UsuarioSimulado): void {
    this._currentUser.set(usuario);
  }

  logout(): void {
    this._currentUser.set(null);
  }
}
