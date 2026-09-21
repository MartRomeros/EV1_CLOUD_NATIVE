import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Servicio, ServicioInput } from '../models/servicio.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalogo`;

  list(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.baseUrl);
  }

  get(concepto: string): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.baseUrl}/${encodeURIComponent(concepto)}`);
  }

  create(data: ServicioInput): Observable<Servicio> {
    return this.http.post<Servicio>(this.baseUrl, data);
  }

  update(concepto: string, data: ServicioInput): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.baseUrl}/${encodeURIComponent(concepto)}`, data);
  }

  remove(concepto: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(concepto)}`);
  }
}
