import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Cliente, ClienteInput } from '../models/cliente.model';

// MOCK: datos en memoria mientras no existe el endpoint /clientes en el backend.
// Reemplazar por llamadas HttpClient (mismo patron que OrdenesService) cuando este listo.
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private clientes: Cliente[] = [
    { clienteId: 'CLI-001', nombre: 'Juan Pérez', telefono: '+56 9 1111 1111', email: 'juan.perez@example.com' },
    { clienteId: 'CLI-002', nombre: 'María López', telefono: '+56 9 2222 2222', email: 'maria.lopez@example.com' },
  ];
  private nextId = 3;

  list(): Observable<Cliente[]> {
    return of([...this.clientes]).pipe(delay(150));
  }

  create(data: ClienteInput): Observable<Cliente> {
    const cliente: Cliente = { clienteId: `CLI-${String(this.nextId++).padStart(3, '0')}`, ...data };
    this.clientes = [...this.clientes, cliente];
    return of(cliente).pipe(delay(150));
  }

  update(clienteId: string, data: ClienteInput): Observable<Cliente> {
    const index = this.clientes.findIndex((c) => c.clienteId === clienteId);
    if (index === -1) {
      return throwError(() => new Error('Cliente no encontrado.'));
    }
    const actualizado: Cliente = { clienteId, ...data };
    this.clientes = this.clientes.map((c) => (c.clienteId === clienteId ? actualizado : c));
    return of(actualizado).pipe(delay(150));
  }

  remove(clienteId: string): Observable<void> {
    this.clientes = this.clientes.filter((c) => c.clienteId !== clienteId);
    return of(undefined).pipe(delay(150));
  }
}
