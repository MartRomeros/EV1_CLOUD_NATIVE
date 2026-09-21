import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdenesService } from '../../core/services/ordenes.service';
import { OrdenResumen } from '../../core/models/orden.model';

@Component({
  selector: 'app-dashboard-mecanico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-mecanico.component.html',
  styleUrl: './dashboard-mecanico.component.css',
})
export class DashboardMecanicoComponent implements OnInit {
  private readonly ordenesService = inject(OrdenesService);
  private readonly cdr = inject(ChangeDetectorRef);

  ordenes: OrdenResumen[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadOrdenes();
  }

  loadOrdenes(): void {
    this.loading = true;
    this.error = null;
    this.ordenesService.list().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudieron cargar las órdenes de trabajo.');
        this.loading = false;
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
