import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioInput } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  list(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  get(email: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${encodeURIComponent(email)}`);
  }

  create(data: UsuarioInput): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, data);
  }

  update(email: string, data: UsuarioInput): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${encodeURIComponent(email)}`, data);
  }

  remove(email: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(email)}`);
  }
}
