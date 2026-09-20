import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdenesService } from '../../core/services/ordenes.service';
import { OrdenResumen } from '../../core/models/orden.model';

@Component({
  selector: 'app-ordenes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ordenes-list.component.html',
  styleUrl: './ordenes-list.component.css',
})
export class OrdenesListComponent implements OnInit {
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
        this.error = this.extractMessage(err, 'No se pudieron cargar las ordenes de trabajo.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleDelete(otId: string): void {
    this.error = null;
    this.ordenesService.remove(otId).subscribe({
      next: () => this.loadOrdenes(),
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
