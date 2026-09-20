import { Service, signal } from '@angular/core';
import { Producto } from '../models/producto';
import { Sucursal } from '../models/sucursal';

const PRODUCTOS_MOCK: Producto[] = [
  { id: 'PROD-01', nombre: 'Notebook 14"', precioUnitario: 650000 },
  { id: 'PROD-02', nombre: 'Mouse inalámbrico', precioUnitario: 12000 },
  { id: 'PROD-03', nombre: 'Teclado mecánico', precioUnitario: 45000 },
  { id: 'PROD-04', nombre: 'Monitor 24"', precioUnitario: 180000 },
  { id: 'PROD-05', nombre: 'Webcam HD', precioUnitario: 25000 },
];

const SUCURSALES_MOCK: Sucursal[] = [
  { id: 'S1', nombre: 'Sucursal Centro' },
  { id: 'S2', nombre: 'Sucursal Norte' },
];

@Service()
export class CatalogoService {
  private readonly _productos = signal<Producto[]>(PRODUCTOS_MOCK);
  private readonly _sucursales = signal<Sucursal[]>(SUCURSALES_MOCK);

  readonly productos = this._productos.asReadonly();
  readonly sucursales = this._sucursales.asReadonly();
}
