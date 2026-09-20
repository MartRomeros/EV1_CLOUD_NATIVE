import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Usuario, UsuarioInput } from '../models/usuario.model';

// MOCK: datos en memoria. La asignacion real de roles vive en Azure Entra ID (App Roles,
// ver auth/msal.config.ts -> getRolesFromAccount). Esta pantalla sirve para demostrar el
// flujo de administracion hasta que se integre Microsoft Graph API o un endpoint propio.
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private usuarios: Usuario[] = [
    { email: 'man.carvajalc@duocuc.cl', nombre: 'Manuel Carvajal', rol: 'admin' },
    { email: 'martin.romero@duocuc.cl', nombre: 'Martín Romero', rol: 'mecanico' },
  ];

  list(): Observable<Usuario[]> {
    return of([...this.usuarios]).pipe(delay(150));
  }

  create(data: UsuarioInput): Observable<Usuario> {
    if (this.usuarios.some((u) => u.email === data.email)) {
      return throwError(() => new Error('Ya existe un usuario con ese correo.'));
    }
    this.usuarios = [...this.usuarios, data];
    return of(data).pipe(delay(150));
  }

  update(email: string, data: UsuarioInput): Observable<Usuario> {
    const index = this.usuarios.findIndex((u) => u.email === email);
    if (index === -1) {
      return throwError(() => new Error('Usuario no encontrado.'));
    }
    this.usuarios = this.usuarios.map((u) => (u.email === email ? data : u));
    return of(data).pipe(delay(150));
  }

  remove(email: string): Observable<void> {
    this.usuarios = this.usuarios.filter((u) => u.email !== email);
    return of(undefined).pipe(delay(150));
  }
}
