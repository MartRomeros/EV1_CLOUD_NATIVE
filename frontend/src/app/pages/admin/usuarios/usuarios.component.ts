import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { Usuario, UsuarioInput } from '../../../core/models/usuario.model';

const emptyForm: UsuarioInput = { email: '', nombre: '', rol: 'recepcion' };

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  form: UsuarioInput = { ...emptyForm };
  editingEmail: string | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading = true;
    this.error = null;
    this.usuariosService.list().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudieron cargar los usuarios.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleSubmit(): void {
    this.error = null;
    const request = this.editingEmail
      ? this.usuariosService.update(this.editingEmail, this.form)
      : this.usuariosService.create(this.form);

    request.subscribe({
      next: () => {
        this.form = { ...emptyForm };
        this.editingEmail = null;
        this.loadUsuarios();
      },
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo guardar el usuario.');
        this.cdr.detectChanges();
      },
    });
  }

  handleEdit(usuario: Usuario): void {
    this.editingEmail = usuario.email;
    this.form = { ...usuario };
  }

  handleCancelEdit(): void {
    this.editingEmail = null;
    this.form = { ...emptyForm };
  }

  handleDelete(email: string): void {
    this.error = null;
    this.usuariosService.remove(email).subscribe({
      next: () => this.loadUsuarios(),
      error: (err) => {
        this.error = this.extractMessage(err, 'No se pudo eliminar el usuario.');
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
