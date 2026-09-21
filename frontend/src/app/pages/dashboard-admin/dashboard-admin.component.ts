import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdenesService } from '../../core/services/ordenes.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css',
})
export class DashboardAdminComponent implements OnInit {
  private readonly ordenesService = inject(OrdenesService);
  private readonly cdr = inject(ChangeDetectorRef);

  totalOrdenes = 0;
  totalItems = 0;
  loadingResumen = false;
  resumenError: string | null = null;

  ngOnInit(): void {
    this.loadResumen();
  }

  loadResumen(): void {
    this.loadingResumen = true;
    this.resumenError = null;
    this.ordenesService.list().subscribe({
      next: (data) => {
        this.totalOrdenes = data.length;
        this.totalItems = data.reduce((acc, orden) => acc + orden.nItems, 0);
        this.loadingResumen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resumenError = this.extractMessage(err, 'No se pudo cargar el resumen de OT.');
        this.loadingResumen = false;
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
