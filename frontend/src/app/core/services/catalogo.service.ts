import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Servicio, ServicioInput } from '../models/servicio.model';

// MOCK: datos en memoria mientras no existe el endpoint /catalogo en el backend.
// Reemplazar por llamadas HttpClient (mismo patron que OrdenesService) cuando este listo.
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private catalogo: Servicio[] = [
    { concepto: 'MO-HH', descripcion: 'Mano de obra (hora hombre)', precioUnit: 25000, categoria: 'mano_obra' },
    { concepto: 'FILTRO-ACEITE', descripcion: 'Filtro de aceite', precioUnit: 12000, categoria: 'repuesto' },
    { concepto: 'PASTILLA-FRENO-DEL', descripcion: 'Pastillas de freno delanteras', precioUnit: 55000, categoria: 'repuesto' },
  ];

  list(): Observable<Servicio[]> {
    return of([...this.catalogo]).pipe(delay(150));
  }

  create(data: ServicioInput): Observable<Servicio> {
    if (this.catalogo.some((s) => s.concepto === data.concepto)) {
      return throwError(() => new Error('Ya existe un servicio con ese concepto.'));
    }
    this.catalogo = [...this.catalogo, data];
    return of(data).pipe(delay(150));
  }

  update(concepto: string, data: ServicioInput): Observable<Servicio> {
    const index = this.catalogo.findIndex((s) => s.concepto === concepto);
    if (index === -1) {
      return throwError(() => new Error('Servicio no encontrado.'));
    }
    this.catalogo = this.catalogo.map((s) => (s.concepto === concepto ? data : s));
    return of(data).pipe(delay(150));
  }

  remove(concepto: string): Observable<void> {
    this.catalogo = this.catalogo.filter((s) => s.concepto !== concepto);
    return of(undefined).pipe(delay(150));
  }
}
