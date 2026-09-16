import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbAlertModule, NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { CurrentUserService } from '../../core/services/current-user';
import { PedidoService } from '../../core/services/pedido';
import { Pedido } from '../../core/models/pedido';
import { NuevoPedidoModal } from './nuevo-pedido-modal/nuevo-pedido-modal';

interface ToastEstado {
  tipo: 'success' | 'error';
  mensaje: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgbAlertModule, NgbToastModule, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly router = inject(Router);
  private readonly pedidoService = inject(PedidoService);
  private readonly modal = inject(NgbModal);
  protected readonly currentUser = inject(CurrentUserService);

  protected readonly pedidoExpandidoId = signal<string | null>(null);
  protected readonly toast = signal<ToastEstado | null>(null);
  protected readonly esCliente = computed(() => this.currentUser.currentUser()?.rol === 'Cliente');

  protected readonly pedidosVisibles = computed<Pedido[]>(() => {
    const usuario = this.currentUser.currentUser();
    if (!usuario) return [];
    const pedidos = this.pedidoService.pedidos();
    switch (usuario.rol) {
      case 'Cliente':
        return pedidos.filter((p) => p.clienteId === usuario.userId);
      case 'Vendedor':
        return pedidos.filter((p) => p.sucursalId === usuario.sucursalId);
      case 'Administrador':
        return pedidos;
    }
  });

  protected totalPedido(pedido: Pedido): number {
    return pedido.items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
  }

  protected toggleDetalle(id: string): void {
    this.pedidoExpandidoId.update((actual) => (actual === id ? null : id));
  }

  protected puedeCancelar(pedido: Pedido): boolean {
    const usuario = this.currentUser.currentUser();
    return (
      !!usuario &&
      usuario.rol === 'Cliente' &&
      pedido.clienteId === usuario.userId &&
      pedido.estado === 'Pendiente'
    );
  }

  protected puedeCambiarEstado(pedido: Pedido): boolean {
    const usuario = this.currentUser.currentUser();
    if (!usuario || (usuario.rol !== 'Vendedor' && usuario.rol !== 'Administrador')) return false;
    if (usuario.rol === 'Vendedor' && pedido.sucursalId !== usuario.sucursalId) return false;
    return pedido.estado === 'Pendiente' || pedido.estado === 'En preparación';
  }

  protected onCancelar(pedido: Pedido, contenidoModal: unknown): void {
    this.modal.open(contenidoModal).result.then(
      () => this.pedidoService.cancelar(pedido.id),
      () => undefined,
    );
  }

  protected onCambiarEstado(pedido: Pedido): void {
    const estadoAntes = pedido.estado;
    this.pedidoService.cambiarEstado(pedido.id);
    const actualizado = this.pedidoService.pedidos().find((p) => p.id === pedido.id);
    if (actualizado && actualizado.estado !== estadoAntes) {
      this.toast.set({ tipo: 'success', mensaje: `Pedido ${pedido.id} avanzado a "${actualizado.estado}".` });
    } else {
      this.toast.set({ tipo: 'error', mensaje: `No se pudo avanzar el estado del pedido ${pedido.id}.` });
    }
  }

  protected closeToast(): void {
    this.toast.set(null);
  }

  protected abrirNuevoPedido(): void {
    const ref = this.modal.open(NuevoPedidoModal, { size: 'lg' });
    ref.result.then(
      (pedidoId: string) => this.toast.set({ tipo: 'success', mensaje: `Pedido ${pedidoId} creado correctamente.` }),
      () => undefined,
    );
  }

  onLogout(): void {
    this.currentUser.logout();
    this.router.navigateByUrl('/login');
  }
}
