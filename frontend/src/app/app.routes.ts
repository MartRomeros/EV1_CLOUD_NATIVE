import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './auth/role.guard';
import { OrdenesListComponent } from './pages/ordenes-list/ordenes-list.component';
import { OrdenFormComponent } from './pages/orden-form/orden-form.component';
import { OrdenDetalleComponent } from './pages/orden-detalle/orden-detalle.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component';
import { CatalogoComponent } from './pages/admin/catalogo/catalogo.component';
import { UsuariosComponent } from './pages/admin/usuarios/usuarios.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { DashboardMecanicoComponent } from './pages/dashboard-mecanico/dashboard-mecanico.component';
import { DashboardRecepcionComponent } from './pages/dashboard-recepcion/dashboard-recepcion.component';

// La ruta raiz NO redirige automaticamente a una ruta protegida: eso haria que
// MsalGuard dispare loginRedirect apenas carga la app, sin dar chance de ver el
// boton de login. El login lo dispara unicamente LoginComponent; una vez
// autenticado, AppComponent navega a /ordenes explicitamente (ver app.component.ts).
//
// MsalGuard solo se aplica en /ordenes (la puerta de entrada al area autenticada):
// protege el deep-link directo (entrar por URL sin sesion dispara el login
// automaticamente, ya verificado). Las demas rutas internas NO llevan MsalGuard
// porque vuelve a invocar handleRedirectObservable() en cada activacion, y eso
// falla al navegar entre paginas ya autenticado en este entorno (Vite dev
// server). No es un hueco de seguridad: AppComponent nunca renderiza el
// <router-outlet> mientras isAuthenticated sea false, asi que estas rutas son
// inalcanzables sin sesion de todas formas.
//
// roleGuard SI se aplica a rutas internas (admin/* y dashboard/*): a diferencia
// de MsalGuard nunca llama a handleRedirectObservable() ni dispara ninguna
// interaccion de MSAL, solo lee la cuenta activa ya resuelta segun el Rol de
// Aplicacion declarado en data.roles (spec 007-msal-role-guards).
export const routes: Routes = [
  { path: 'ordenes', component: OrdenesListComponent, canActivate: [MsalGuard] },
  { path: 'ordenes/nueva', component: OrdenFormComponent },
  { path: 'ordenes/:id', component: OrdenDetalleComponent },
  { path: 'admin/clientes', component: ClientesComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
  { path: 'admin/catalogo', component: CatalogoComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
  { path: 'admin/usuarios', component: UsuariosComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
  { path: 'dashboard/admin', component: DashboardAdminComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
  { path: 'dashboard/mecanico', component: DashboardMecanicoComponent, canActivate: [roleGuard], data: { roles: ['mecanico'] } },
  { path: 'dashboard/recepcion', component: DashboardRecepcionComponent, canActivate: [roleGuard], data: { roles: ['recepcion'] } },
  { path: '**', redirectTo: '' },
];
