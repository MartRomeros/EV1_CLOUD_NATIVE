import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CatalogoService } from '../../../core/services/catalogo';
import { CurrentUserService } from '../../../core/services/current-user';
import { PedidoService } from '../../../core/services/pedido';
import { ItemPedido } from '../../../core/models/pedido';

interface LineaItem {
  productoId: string;
  cantidad: number;
}

@Component({
  selector: 'app-nuevo-pedido-modal',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './nuevo-pedido-modal.html',
})
export class NuevoPedidoModal {
  protected readonly activeModal = inject(NgbActiveModal);
  protected readonly catalogo = inject(CatalogoService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly pedidoService = inject(PedidoService);

  protected readonly Number = Number;

  protected readonly sucursalId = signal<string | null>(null);
  protected readonly lineas = signal<LineaItem[]>([]);

  protected readonly sinSucursal = computed(() => this.sucursalId() === null);
  protected readonly sinLineas = computed(() => this.lineas().length === 0);
  protected readonly hayCantidadInvalida = computed(() =>
    this.lineas().some((l) => !Number.isInteger(l.cantidad) || l.cantidad <= 0),
  );
  protected readonly formularioInvalido = computed(
    () => this.sinSucursal() || this.sinLineas() || this.hayCantidadInvalida(),
  );

  protected readonly total = computed(() =>
    this.lineas().reduce((acc, l) => acc + l.cantidad * this.precioDe(l.productoId), 0),
  );

  protected precioDe(productoId: string): number {
    return this.catalogo.productos().find((p) => p.id === productoId)?.precioUnitario ?? 0;
  }

  protected nombreDe(productoId: string): string {
    return this.catalogo.productos().find((p) => p.id === productoId)?.nombre ?? '';
  }

  protected agregarLinea(): void {
    const primerProducto = this.catalogo.productos()[0];
    this.lineas.update((actual) => [...actual, { productoId: primerProducto?.id ?? '', cantidad: 1 }]);
  }

  protected eliminarLinea(index: number): void {
    this.lineas.update((actual) => actual.filter((_, i) => i !== index));
  }

  protected actualizarLinea(index: number, cambios: Partial<LineaItem>): void {
    this.lineas.update((actual) => actual.map((l, i) => (i === index ? { ...l, ...cambios } : l)));
  }

  protected confirmar(): void {
    if (this.formularioInvalido()) return;
    const usuario = this.currentUser.currentUser();
    if (!usuario) return;

    const items: ItemPedido[] = this.lineas().map((l) => ({
      productoNombre: this.nombreDe(l.productoId),
      cantidad: l.cantidad,
      precioUnitario: this.precioDe(l.productoId),
    }));

    const nuevoPedido = this.pedidoService.crear({
      clienteId: usuario.userId,
      sucursalId: this.sucursalId()!,
      items,
    });

    this.activeModal.close(nuevoPedido.id);
  }
}
