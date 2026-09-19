# Frontend — Pedidos360

Angular 22 + TypeScript. Autenticación con Azure Entra ID vía MSAL (`@azure/msal-browser` + `@azure/msal-angular`) y un CRUD de **Órdenes de Trabajo (OT)** que consume el backend a través de AWS API Gateway (frontend → Entra ID → bearer token → API Gateway → Backend Spring Boot → Oracle).

Corresponde al **Encargo de la Evaluación Parcial N°1 (DSY1107 - Desarrollo Cloud Native I)**: esta parte (frontend) está **completa y verificada**. Lo que falta es exclusivamente el backend (microservicios Spring Boot + BFF con validación JWT), detallado más abajo.

## ✅ Qué se hizo

### Frontend (Angular)

- Proyecto Angular 22 standalone (sin NgModules), generado a mano con la misma estructura que produce `ng new` (Angular CLI estaba bloqueado en este entorno, se armó el `angular.json`/`tsconfig`/scaffolding manualmente).
- **MSAL integrado con `@azure/msal-angular`**: `MsalService`, `MsalGuard`, `MsalBroadcastService`, `MsalInterceptor` — no la librería `msal-react` que traía la versión anterior en React.
- Flujo de login/logout completo con `loginRedirect`/`logoutRedirect`, lectura de cuenta activa y de roles desde los claims del ID token.
- CRUD de **Órdenes de Trabajo (OT)** basado en el esquema Oracle real (`Script.sql`, tablas `OT`/`OT_ITEM`), no un CRUD genérico de ejemplo.
- Verificado: `ng build` (dev y producción) compila sin errores ni warnings; `ng serve` funciona; login real probado end-to-end contra un tenant de Azure real (ver abajo).

### Azure Entra ID

- Se creó el **App Registration del frontend** en el tenant `manuelcarvajalapp` (Microsoft Entra ID):
  - Nombre: `pedidos360-frontend`
  - Tipo de cuenta: **Single tenant** (solo este directorio)
  - Plataforma: **SPA (Single-page application)**
  - Redirect URI: `http://localhost:4200`
  - **Client ID** y **Tenant ID** ya están cargados en [`src/environments/environment.ts`](src/environments/environment.ts).
- Login probado con una cuenta real del tenant (`@duocuc.cl`): el flujo completo (redirect a Microsoft → consentimiento de permisos → vuelta a la SPA autenticado) funciona correctamente.

### Bugs de plataforma que se encontraron y arreglaron (dejar registro para no repetirlos)

Durante la integración salieron 3 problemas no obvios, específicos de este stack (Angular 22 + Vite + `msal-angular`), que vale la pena documentar por si vuelven a aparecer:

1. **`MsalService.loginRedirect()`/`logoutRedirect()` devuelven un Observable**, no una Promise ni un valor void. Si no se hace `.subscribe()`, MSAL nunca ejecuta nada (el click "no hacía nada"). Arreglado en [`login.component.ts`](src/app/pages/login/login.component.ts) y [`app.component.ts`](src/app/app.component.ts).
2. **Proveer `MsalGuard`/`MsalBroadcastService` dos veces** (una vía `importProvidersFrom(MsalModule)` y otra manualmente en el array de `providers`) puede crear una segunda instancia de `MsalBroadcastService` que nunca recibe el reset de `InteractionStatus`, dejando componentes como el de login pegados en estado "Startup" para siempre. Se sacaron los duplicados de [`app.config.ts`](src/app/app.config.ts) — `MsalModule` ya provee ambos.
3. **`NgZone` arrancaba en modo `NoopNgZone`** (detección de cambios "noop") a pesar de tener `zone.js` cargado como polyfill, porque faltaba el provider `provideZoneChangeDetection({ eventCoalescing: true })` en `app.config.ts` (lo agrega automáticamente `ng new`, pero como se armó el proyecto a mano no estaba). Sin esto, los datos se actualizaban correctamente en los componentes pero la vista nunca se refrescaba sola (había que forzar `ChangeDetectorRef.detectChanges()` a mano para verlo). Ya está agregado; además se dejaron llamadas explícitas a `detectChanges()` en los componentes que reaccionan a eventos de MSAL/HTTP como defensa extra.

## Requisitos

- Node 20+
- Angular CLI (`npm install -g @angular/cli` o usar el binario local con `npm run`)
- Acceso al portal de Azure con permisos para crear App Registrations

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

Angular no usa `.env`; la configuración vive en `src/environments/`. El **Client ID y Tenant ID del frontend ya están cargados** en `environment.ts`. Lo único que falta configurar es lo relacionado al backend (ver guía pendiente más abajo):

- `src/environments/environment.ts` (desarrollo, `ng serve`)
- `src/environments/environment.prod.ts` (producción, `ng build --configuration production`)

```ts
export const environment = {
  production: false,
  azureClientId: '...',      // ✅ ya configurado (App Registration del frontend)
  azureTenantId: '...',      // ✅ ya configurado (tenant manuelcarvajalapp)
  redirectUri: 'http://localhost:4200',
  apiScope: 'api://00000000-0000-0000-0000-000000000000/access_as_user', // ⏳ placeholder, pendiente
  apiUrl: 'https://TU-API-ID.execute-api.TU-REGION.amazonaws.com',       // ⏳ placeholder, pendiente
};
```

Estos valores no son secretos (MSAL en SPA es un cliente público sin client secret), por eso se pueden versionar en el repo.

## 3. Correr en local

```bash
npm start
```

Abre `http://localhost:4200`. Muestra el botón "Iniciar sesión con Microsoft"; al autenticarte con una cuenta del tenant, te lleva a `/ordenes`. Ahí mismo va a fallar la carga de datos hasta que exista el backend real (ver guía pendiente) — es esperado, no es un bug del frontend.

## Estructura

```
src/
  app/
    auth/
      msal.config.ts        # Factories de MSAL_INSTANCE, MSAL_GUARD_CONFIG y MSAL_INTERCEPTOR_CONFIG
    core/
      models/orden.model.ts       # Tipos de Orden de Trabajo (OT) e Item, segun Script.sql
      services/ordenes.service.ts # Llamadas al API Gateway (HttpClient): listar, detalle, crear, eliminar
    pages/
      login/                 # Pantalla de login (loginRedirect)
      ordenes-list/           # Listado de OT (vista V_OT_RESUMEN)
      orden-form/             # Crear una OT nueva con sus items (FormArray)
      orden-detalle/          # Detalle de una OT: items, total, eliminar
    app.component.ts         # Root: maneja el redirect de MSAL, header con usuario/roles/logout
    app.config.ts            # Providers: MsalModule, MsalGuard, MsalInterceptor, HttpClient, Router, zona
    app.routes.ts            # Rutas ('ordenes' protegida con MsalGuard)
  environments/               # Configuración de MSAL y API por entorno
```

### Autenticación (MSAL)

- **MsalService.handleRedirectObservable()** procesa la respuesta del login redirect al volver de Entra ID (`app.component.ts`).
- La ruta raíz **no** redirige automáticamente a una ruta protegida — así se evita que `MsalGuard` dispare el login antes de que el usuario vea el botón. El único disparador del login es `LoginComponent`; tras autenticarse, `AppComponent` navega a `/ordenes` explícitamente.
- **MsalGuard** protege `/ordenes`, `/ordenes/nueva` y `/ordenes/:id`: si alguien intenta entrar directo por URL sin sesión, dispara el login automáticamente (`app.routes.ts`).
- **MsalInterceptor** adjunta el bearer token a cada request HTTP cuya URL matchee `protectedResourceMap` (configurado en `auth/msal.config.ts` con el scope del API Gateway).
- Los roles de aplicación (App Roles de Entra ID) se leen desde los claims del ID token vía `getRolesFromAccount()` y se muestran en el header.

## Deploy (FTP a cPanel)

Este frontend está pensado para subirse por **FTP** a un hosting **cPanel**, en el subdirectorio `/cloud` del dominio: `https://martin-romero.cl/cloud` (ajustar si el dominio final es otro).

Por eso:

- `angular.json` tiene `baseHref: "/cloud/"` en la configuración `production` — Angular reescribe el `<base href>` de `index.html` en el build para que las rutas y assets resuelvan bien dentro del subdirectorio.
- `environment.prod.ts` usa ese mismo dominio como `redirectUri` (hay que agregarlo como Redirect URI en el App Registration cuando se conozca el dominio final).
- `public/.htaccess` se copia tal cual a `dist/frontend/browser/` en el build; en cPanel (Apache) reescribe cualquier ruta que no sea un archivo/carpeta real (ej. `/cloud/ordenes`) hacia `index.html`, para que el router de Angular la resuelva en el navegador. Sin este archivo, recargar la página en una ruta distinta a `/cloud` da 404.

Pasos:

1. Verifica que `environment.prod.ts` tenga los valores de producción correctos (incluyendo `apiScope`/`apiUrl` reales del backend).
2. Genera el build:
   ```bash
   npm run build:prod
   ```
3. Sube **el contenido** de la carpeta `dist/frontend/browser/` (incluyendo `.htaccess`, que es un archivo oculto — asegúrate que tu cliente FTP muestre archivos ocultos) a la carpeta `cloud` dentro del `public_html` del cPanel.
4. Verifica en el navegador que el dominio cargue el login y que navegar a `/cloud/ordenes` directamente (o recargar ahí) también funcione, gracias al `.htaccess`.

## Modelo de datos: Órdenes de Trabajo (OT)

El CRUD del frontend refleja el esquema Oracle `TALLERPRO360` (ver `Script.sql` en la raíz del repo): un taller mecánico gestiona **Órdenes de Trabajo (OT)**, cada una con cliente, patente y una lista de **ítems** (mano de obra, repuestos) con subtotal calculado.

Se asume que el backend expone estos endpoints (camelCase, convención Jackson/Spring Boot):

- `GET /ot` → lista de órdenes (equivalente a la vista `V_OT_RESUMEN`: `otId, clienteId, patente, descripcion, total, createdAt, nItems, subtotalCalc`).
- `GET /ot/{otId}` → detalle de una orden con su arreglo `items` (`itemId, concepto, cantidad, precioUnit, subtotal`).
- `POST /ot` → crea una orden junto con sus ítems (`{ clienteId, patente, descripcion, items: [{ concepto, cantidad, precioUnit }] }`).
- `DELETE /ot/{otId}` → elimina la orden (cascada sobre `OT_ITEM`, igual que la FK del script SQL).

Ajusta `src/app/core/models/orden.model.ts` y `src/app/core/services/ordenes.service.ts` si el backend define nombres o rutas distintos. Las tablas `OT_EVENT` (eventos Kafka) y `NOTIFY_LOG` (notificaciones RabbitMQ) del script son pobladas por los consumidores del backend, no por el frontend, por lo que no tienen vista propia en esta primera etapa.

---

## ⏳ Guía paso a paso de lo que falta

Todo esto es responsabilidad de quien construya el backend (no del frontend), pero se deja documentado acá porque son pasos de Azure que probablemente hagan juntos.

### A. En Azure Entra ID (App Registration del backend)

1. **Crear un segundo App Registration** para el backend/API:
   - Portal de Azure → **Microsoft Entra ID** → **App registrations** → **New registration**.
   - Nombre: `pedidos360-api` (o similar).
   - Tipo de cuenta: mismo tenant, **Single tenant** (`manuelcarvajalapp`).
   - No hace falta configurar Redirect URI (el backend no hace login interactivo).
2. **Exponer la API** (para que el frontend pueda pedir un token con permiso sobre ella):
   - En ese App Registration → **Expose an API** → **Add** (junto a "Application ID URI") → dejar el default `api://<client-id-del-backend>` → **Save and continue**.
   - **Add a scope**: nombre `access_as_user`, "Who can consent" = Admins and users, agregar un texto cualquiera en los campos de descripción → **Add scope**.
   - Copiar el valor completo, ej. `api://<client-id-del-backend>/access_as_user`.
3. **Dar permiso al frontend para pedir ese scope**:
   - Volver al App Registration **`pedidos360-frontend`** → **API permissions** → **Add a permission** → **My APIs** → seleccionar `pedidos360-api`.
   - Elegir **Delegated permissions** → marcar `access_as_user` → **Add permissions**.
   - Click **Grant admin consent for manuelcarvajalapp** (evita el popup de consentimiento en cada login).
4. **(Opcional pero recomendado para la pauta)** Configurar **App Roles**, ya que el indicador de evaluación pide "se leen roles y scopes desde los claims del token":
   - En `pedidos360-frontend` (o en el backend, según cómo se diseñe la autorización) → **App roles** → **Create app role** (ej. `Admin`, `Operador`).
   - **Users and groups** → asignar el/los usuarios de prueba a ese rol.
   - El frontend ya lee `roles` del ID token automáticamente (`getRolesFromAccount()` en `msal.config.ts`) — no requiere cambios de código, solo esta configuración en Azure.
5. **Actualizar el frontend** con los valores reales una vez existan:
   - En `src/environments/environment.ts` y `environment.prod.ts`, reemplazar:
     - `apiScope` → el scope completo del paso 2.
     - `apiUrl` → la URL del API Gateway HTTP (paso B.5).

### B. En el backend (Spring Boot + AWS)

1. **Estructura de microservicios en Java/Spring Boot**, según pide la pauta (varios microservicios, no un monolito). Como mínimo, un servicio que exponga el recurso `OT`.
2. **Conexión a la base de datos Oracle** usando el esquema de `Script.sql` (usuario `TALLERPRO360`, tablas `OT`/`OT_ITEM`/`OT_EVENT`/`NOTIFY_LOG`, vista `V_OT_RESUMEN`):
   - Entidades JPA para `OT` y `OT_ITEM` (relación uno-a-muchos, `OT_ID` como PK varchar generada por trigger — considerar generarla en la app o respetar el trigger `BIU_OT`).
   - Repositorios Spring Data, `application.properties`/`application.yml` con las credenciales de conexión (no comitear secretos: usar variables de entorno o AWS Secrets Manager).
3. **Endpoints REST** que el frontend ya espera consumir (ver sección "Modelo de datos" arriba):
   - `GET /ot`, `GET /ot/{otId}`, `POST /ot`, `DELETE /ot/{otId}` — devolviendo JSON en camelCase.
   - Si se prefieren otros nombres/rutas, avisar para ajustar `ordenes.service.ts` en el frontend.
4. **Filtro de validación JWT (BFF)** — esto es el 40% del indicador de evaluación restante:
   - Un `OncePerRequestFilter` (o `SecurityFilterChain` con un `JwtDecoder`) que:
     - Valide el **issuer** (`https://login.microsoftonline.com/<tenantId>/v2.0`) y el **audience** (el Client ID del backend, `pedidos360-api`).
     - Verifique la **firma** del token contra las claves públicas de Azure (JWKS endpoint: `https://login.microsoftonline.com/<tenantId>/discovery/v2.0/keys`) — Spring Security OAuth2 Resource Server hace esto automáticamente con `spring-boot-starter-oauth2-resource-server` + `spring.security.oauth2.resourceserver.jwt.issuer-uri`.
     - Verifique la **expiración** del token.
     - Aplique **autorización por rol** cuando corresponda (leer el claim `roles` del JWT, mapearlo a `GrantedAuthority`).
     - Responda con códigos de error correctos: `401` si no hay token o es inválido, `403` si el token es válido pero falta el rol/permiso.
5. **Desplegar en instancias EC2** y exponerlo a través de **AWS API Gateway** (HTTP API), que es el `apiUrl` que necesita el frontend. El diagrama de arquitectura original (`EV1_CLOUD.drawio.png`) tiene el detalle de esta parte (NLB → EC2 → RDS/Oracle).
6. Una vez el backend esté arriba, avisar para:
   - Actualizar `apiScope`/`apiUrl` en el frontend con los valores reales.
   - Probar el flujo completo: login → token → `MsalInterceptor` adjunta el bearer → API Gateway valida vía el BFF → CRUD de órdenes funcionando de punta a punta.
