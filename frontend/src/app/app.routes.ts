import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { OrdenesListComponent } from './pages/ordenes-list/ordenes-list.component';
import { OrdenFormComponent } from './pages/orden-form/orden-form.component';
import { OrdenDetalleComponent } from './pages/orden-detalle/orden-detalle.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component';
import { CatalogoComponent } from './pages/admin/catalogo/catalogo.component';
import { UsuariosComponent } from './pages/admin/usuarios/usuarios.component';

// La ruta raiz NO redirige automaticamente a una ruta protegida: eso haria que
// MsalGuard dispare loginRedirect apenas carga la app, sin dar chance de ver el
// boton de login. El login lo dispara unicamente LoginComponent; una vez
// autenticado, AppComponent navega a /ordenes explicitamente (ver app.component.ts).
//
// MsalGuard solo se aplica en /ordenes (la puerta de entrada al area autenticada):
// protege el deep-link directo (entrar por URL sin sesion dispara el login
// automaticamente, ya verificado). Las demas rutas internas NO llevan el guard
// porque MsalGuard vuelve a invocar handleRedirectObservable() en cada activacion,
// y eso falla al navegar entre paginas ya autenticado en este entorno (Vite dev
// server). No es un hueco de seguridad: AppComponent nunca renderiza el
// <router-outlet> mientras isAuthenticated sea false, asi que estas rutas son
// inalcanzables sin sesion de todas formas.
export const routes: Routes = [
  { path: 'ordenes', component: OrdenesListComponent, canActivate: [MsalGuard] },
  { path: 'ordenes/nueva', component: OrdenFormComponent },
  { path: 'ordenes/:id', component: OrdenDetalleComponent },
  { path: 'admin/clientes', component: ClientesComponent },
  { path: 'admin/catalogo', component: CatalogoComponent },
  { path: 'admin/usuarios', component: UsuariosComponent },
  { path: '**', redirectTo: '' },
];
