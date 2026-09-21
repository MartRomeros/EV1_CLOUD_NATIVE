import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteInput } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  list(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.baseUrl);
  }

  get(clienteId: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${clienteId}`);
  }

  create(data: ClienteInput): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl, data);
  }

  update(clienteId: string, data: ClienteInput): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${clienteId}`, data);
  }

  remove(clienteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${clienteId}`);
  }
}
