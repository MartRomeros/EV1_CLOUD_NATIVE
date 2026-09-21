# Frontend — TallerPro360 (Angular 22)

Aplicación web SPA (Single Page Application) desarrollada en **Angular 22** con arquitectura standalone (sin NgModules) y **TypeScript**. Integra autenticación corporativa con **Microsoft Entra ID** mediante `@azure/msal-angular`, navegación y vistas diferenciadas mediante **Dashboards por Rol** (`admin`, `recepcion`, `mecanico`), y un CRUD para **Órdenes de Trabajo (OT)** que consume el backend mediante un API Gateway en AWS.

---

## 🚀 Características Principales

- **Angular 22 Standalone:** Componentes independientes optimizados, sin sobrecarga de NgModules ni librerías de UI externas (estilos puros en CSS modular).
- **Autenticación OIDC / OAuth 2.0:** Integración completa de MSAL (`MsalService`, `MsalGuard`, `MsalBroadcastService`, `MsalInterceptor`) contra el tenant `manuelcarvajalapp`.
- **Dashboards Dinámicos por Rol:** Enrutamiento inteligente según el claim `roles` del usuario autenticado:
  - **Administrador (`/dashboard/admin`):** Acceso centralizado a Órdenes, Clientes, Catálogo, Usuarios y resumen numérico de OT e ítems.
  - **Recepción (`/dashboard/recepcion`):** Vista de órdenes de trabajo, creación de nueva orden (`/ordenes/nueva`) y gestión de clientes.
  - **Mecánico (`/dashboard/mecanico`):** Listado y detalle de todas las órdenes de trabajo con aviso de alcance de la orden.
- **Intercepción Automática de Tokens:** `MsalInterceptor` adjunta el Bearer Token con el scope `access_as_user` a las peticiones hacia la API.
- **Despliegue Contenerizado en AWS:** Docker multi-stage (Node 22 + Nginx Alpine) corriendo en una instancia EC2 bajo HTTPS con Certbot SSL (`https://app.martin-romero.cl`).

---

## 🏛️ Estructura del Proyecto

```
src/
  app/
    auth/
      msal.config.ts             # Fábricas de configuración de MSAL, Guards e Interceptores
      role-dashboard.ts          # Resolución y mapeo de roles hacia sus respectivos dashboards
    core/
      models/
        orden.model.ts           # Modelos de datos para OT e Items
        usuario.model.ts         # Modelo de datos para usuarios y roles
      services/
        ordenes.service.ts       # Consumo del API REST de Órdenes de Trabajo (HttpClient)
        clientes.service.ts      # Servicio de Clientes
        catalogo.service.ts      # Servicio de Catálogo de repuestos/servicios
        usuarios.service.ts      # Servicio de Usuarios
    pages/
      login/                     # Pantalla de inicio de sesión institucional
      dashboard-admin/           # Panel exclusivo para Administradores
      dashboard-recepcion/       # Panel exclusivo para Recepción
      dashboard-mecanico/        # Panel exclusivo para Mecánicos
      ordenes-list/              # Listado general de órdenes
      orden-form/                # Formulario reactivo para registrar una OT con ítems
      orden-detalle/             # Vista detallada de una orden de trabajo
      admin/                     # Vistas administrativas de clientes, catálogo y usuarios
    app.component.ts             # Manejo de redirección MSAL, navbar superior y logout
    app.config.ts                # Proveedores globales: MSAL, HttpClient, Routing, ChangeDetection
    app.routes.ts                # Definición de rutas protegidas
  environments/
    environment.ts               # Variables para entorno de desarrollo local
    environment.prod.ts          # Variables para entorno de producción (AWS EC2 / API Gateway)
```

---

## 👥 Sistema de Roles y Dashboards

El archivo [`src/app/auth/role-dashboard.ts`](src/app/auth/role-dashboard.ts) implementa la lógica de resolución de roles y redirección post-login:

```typescript
export type RolReconocido = 'admin' | 'mecanico' | 'recepcion';

// Orden de prioridad si la cuenta cuenta con múltiples roles asignados:
const ROLE_PRIORITY: readonly RolReconocido[] = ['admin', 'recepcion', 'mecanico'];
```

### Funcionalidades por Panel

| Dashboard | Rol | Capacidades en la Interfaz | Enlaces Disponibles |
| :--- | :--- | :--- | :--- |
| **`/dashboard/admin`** | `admin` | Visibilidad total, métricas agregadas (total de órdenes y de ítems). | Órdenes, Clientes, Catálogo, Usuarios. |
| **`/dashboard/recepcion`** | `recepcion` | Registro rápido y consulta de órdenes de clientes en taller. | Órdenes, Nueva orden (`/ordenes/nueva`), Clientes. |
| **`/dashboard/mecanico`** | `mecanico` | Consulta técnica de órdenes con aviso explicativo sobre asignación. | Listado de Órdenes (acceso al detalle de cada una). |

> [!NOTE]
> La interfaz adapta los accesos visibles según el rol del usuario, pero la **autorización estricta** la ejerce el backend en cada petición HTTP, rechazando con código `403 Forbidden` cualquier intento no autorizado.

---

## ⚙️ Configuración y Variables de Entorno

La configuración de Entra ID y del backend reside en `src/environments/`:

```typescript
export const environment = {
  production: false,
  azureClientId: '952083c2-4584-4dec-a3d3-5b0077da3e8f',
  azureTenantId: '639a8b7f-479a-4d37-9418-bad57badccb1',
  redirectUri: 'http://localhost:4200',
  apiScope: 'api://952083c2-4584-4dec-a3d3-5b0077da3e8f/access_as_user',
  apiUrl: 'http://localhost:3000', // En producción apunta al AWS API Gateway HTTP API
};
```

---

## 🛠️ Ejecución en Desarrollo Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor local
```bash
npm start
```
Abre tu navegador en `http://localhost:4200`. Al presionar **Iniciar sesión con Microsoft**, se abrirá la ventana de autenticación de Microsoft Entra ID.

---

## 🚢 Despliegue en Producción (AWS EC2 + Docker + SSL)

El frontend se compila y ejecuta como un contenedor Docker en una instancia EC2 pública (`t3.small` / `t2.micro`):

1. **Compilación de Producción:**
   ```bash
   npm run build:prod
   ```
2. **Reverse Proxy Nginx en EC2:**
   - Termina conexiones TLS/SSL con certificados emitidos automáticamente por **Certbot (Let's Encrypt)**.
   - Redirecciona tráfico HTTP (puerto 80) a HTTPS (puerto 443).
   - Reenvía las peticiones internamente al contenedor Docker en `http://127.0.0.1:8080`.
   - Consulta el paso a paso en [`DEPLOY_EC2.md`](DEPLOY_EC2.md).

---

## 🐛 Notas Técnicas y Problemas Resueltos (Troubleshooting)

Durante el desarrollo e integración de Angular 22 con `@azure/msal-angular`, se resolvieron 4 comportamientos particulares de la plataforma:

1. **Observables en `loginRedirect` / `logoutRedirect`:** En versiones recientes de MSAL Angular, estas funciones devuelven un `Observable` que debe ser obligatoriamente suscrito (`.subscribe()`) para que el redirect se ejecute.
2. **Duplicidad de Providers de MSAL:** Proveer `MsalGuard` o `MsalBroadcastService` simultáneamente en `providers: []` y en `importProvidersFrom(MsalModule)` causaba un bloqueo permanente en el estado de autenticación `InteractionStatus.Startup`. Se corrigió centralizando la provisión exclusivamente en `MsalModule`.
3. **`provideZoneChangeDetection`:** Al ser un proyecto standalone configurado a mano, faltaba `provideZoneChangeDetection({ eventCoalescing: true })`, provocando que la vista no se refrescara tras resolver llamadas asíncronas.
4. **Prevención de `state_mismatch`:** Para evitar errores de doble clic en el botón de login, el componente activa síncronamente un flag de bloqueo antes de emitir la llamada de redirección a Entra ID.

---

## 🔗 Enlaces Relacionados
- [Documentación Maestro del Repositorio](../README.md)
- [Backend REST API y Matriz RBAC](../backend/README.md)
- [Infraestructura AWS con Terraform](../terraform/README.md)
- [Guía de Configuración en Microsoft Entra ID](../azure/README.md)
 