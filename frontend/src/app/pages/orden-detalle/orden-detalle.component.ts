import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdenesService } from '../../core/services/ordenes.service';
import { OrdenDetalle } from '../../core/models/orden.model';

@Component({
  selector: 'app-orden-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orden-detalle.component.html',
  styleUrl: './orden-detalle.component.css',
})
export class OrdenDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordenesService = inject(OrdenesService);
  private readonly cdr = inject(ChangeDetectorRef);

  orden: OrdenDetalle | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    const otId = this.route.snapshot.paramMap.get('id');
    if (otId) {
      this.loadOrden(otId);
    }
  }

  loadOrden(otId: string): void {
    this.loading = true;
    this.error = null;
    this.ordenesService.get(otId).subscribe({
      next: (data) => {
        this.orden = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo cargar la orden de trabajo.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleDelete(): void {
    if (!this.orden) {
      return;
    }
    this.ordenesService.remove(this.orden.otId).subscribe({
      next: () => this.router.navigate(['/ordenes']),
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo eliminar la orden.');
        this.cdr.detectChanges();
      },
    });
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message) || fallback;
    }
    return fallback;
  }
}
