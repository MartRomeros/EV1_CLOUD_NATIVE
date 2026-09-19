import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrdenDetalle, OrdenInput, OrdenResumen } from '../models/orden.model';

// El backend expone estos endpoints via API Gateway HTTP -> NLB -> Backend (ver diagrama de arquitectura).
// MsalInterceptor adjunta el bearer token automaticamente segun protectedResourceMap (ver auth/msal.config.ts).
@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ot`;

  list(): Observable<OrdenResumen[]> {
    return this.http.get<OrdenResumen[]>(this.baseUrl);
  }

  get(otId: string): Observable<OrdenDetalle> {
    return this.http.get<OrdenDetalle>(`${this.baseUrl}/${otId}`);
  }

  create(data: OrdenInput): Observable<OrdenDetalle> {
    return this.http.post<OrdenDetalle>(this.baseUrl, data);
  }

  remove(otId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${otId}`);
  }
}
