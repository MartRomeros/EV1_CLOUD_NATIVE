import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Servicio, ServicioInput } from '../../../core/models/servicio.model';

const emptyForm: ServicioInput = { concepto: '', descripcion: '', precioUnit: 0, categoria: 'repuesto' };

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent implements OnInit {
  private readonly catalogoService = inject(CatalogoService);
  private readonly cdr = inject(ChangeDetectorRef);

  catalogo: Servicio[] = [];
  form: ServicioInput = { ...emptyForm };
  editingConcepto: string | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCatalogo();
  }

  loadCatalogo(): void {
    this.loading = true;
    this.error = null;
    this.catalogoService.list().subscribe({
      next: (data) => {
        this.catalogo = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo cargar el catálogo.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleSubmit(): void {
    this.error = null;
    const request = this.editingConcepto
      ? this.catalogoService.update(this.editingConcepto, this.form)
      : this.catalogoService.create(this.form);

    request.subscribe({
      next: () => {
        this.form = { ...emptyForm };
        this.editingConcepto = null;
        this.loadCatalogo();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo guardar el servicio.');
        this.cdr.detectChanges();
      },
    });
  }

  handleEdit(servicio: Servicio): void {
    this.editingConcepto = servicio.concepto;
    this.form = { ...servicio };
  }

  handleCancelEdit(): void {
    this.editingConcepto = null;
    this.form = { ...emptyForm };
  }

  handleDelete(concepto: string): void {
    this.error = null;
    this.catalogoService.remove(concepto).subscribe({
      next: () => this.loadCatalogo(),
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo eliminar el servicio.');
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
