import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrdenesService } from '../../core/services/ordenes.service';

@Component({
  selector: 'app-orden-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './orden-form.component.html',
  styleUrl: './orden-form.component.css',
})
export class OrdenFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordenesService = inject(OrdenesService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  submitting = false;
  error: string | null = null;

  form = this.fb.nonNullable.group({
    clienteId: ['', Validators.required],
    patente: ['', Validators.required],
    descripcion: [''],
    items: this.fb.array([this.buildItemGroup()]),
  });

  get items() {
    return this.form.controls.items;
  }

  private buildItemGroup() {
    return this.fb.nonNullable.group({
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnit: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.buildItemGroup());
    this.cdr.detectChanges();
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.cdr.detectChanges();
    }
  }

  subtotal(index: number): number {
    const item = this.items.at(index).value as { cantidad: number; precioUnit: number };
    return Math.round((item.cantidad ?? 0) * (item.precioUnit ?? 0));
  }

  get total(): number {
    return this.items.controls.reduce((sum, _, index) => sum + this.subtotal(index), 0);
  }

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = null;
    this.submitting = true;
    const value = this.form.getRawValue();

    this.ordenesService.create(value).subscribe({
      next: (creada) => {
        this.submitting = false;
        this.router.navigate(['/ordenes', creada.otId]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.extractMessage(err, 'No se pudo crear la orden de trabajo.');
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
