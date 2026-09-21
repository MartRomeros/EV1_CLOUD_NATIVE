import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ClientesService } from '../../../core/services/clientes.service';
import { Cliente, ClienteInput } from '../../../core/models/cliente.model';

const emptyForm: ClienteInput = { nombre: '', telefono: '', email: '' };

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
})
export class ClientesComponent implements OnInit {
  private readonly clientesService = inject(ClientesService);
  private readonly cdr = inject(ChangeDetectorRef);

  clientes: Cliente[] = [];
  form: ClienteInput = { ...emptyForm };
  editingId: string | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading = true;
    this.error = null;
    this.clientesService.list().subscribe({
      next: (data) => {
        this.clientes = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudieron cargar los clientes.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleSubmit(f: NgForm): void {
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }

    this.error = null;
    const request = this.editingId
      ? this.clientesService.update(this.editingId, this.form)
      : this.clientesService.create(this.form);

    request.subscribe({
      next: () => {
        this.form = { ...emptyForm };
        this.editingId = null;
        this.loadClientes();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo guardar el cliente.');
        this.cdr.detectChanges();
      },
    });
  }

  handleEdit(cliente: Cliente): void {
    this.editingId = cliente.clienteId;
    this.form = { nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email };
  }

  handleCancelEdit(): void {
    this.editingId = null;
    this.form = { ...emptyForm };
  }

  handleDelete(clienteId: string): void {
    this.error = null;
    this.clientesService.remove(clienteId).subscribe({
      next: () => this.loadClientes(),
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo eliminar el cliente.');
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
