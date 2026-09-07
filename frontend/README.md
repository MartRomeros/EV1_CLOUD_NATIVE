# Frontend — EV1 Cloud Native

React + TypeScript + Vite. Autenticacion con Azure Entra ID via MSAL (`@azure/msal-browser` + `@azure/msal-react`) y una vista CRUD simple (`Items`) que consume el API Gateway HTTP del diagrama de arquitectura (frontend -> Entra ID -> bearer token -> API Gateway -> NLB -> Backend -> RDS).

## Requisitos

- Node 20+
- Acceso al portal de Azure con permisos para crear App Registrations

## 1. Instalar dependencias

```bash
npm install
```

## 2. Crear el App Registration en Azure Entra ID

1. Entra a [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. **Name**: `ev1-cloud-native-frontend` (o el que prefieras).
3. **Supported account types**: "Accounts in this organizational directory only" (single tenant), salvo que necesiten multi-tenant.
4. **Redirect URI**: selecciona plataforma **Single-page application (SPA)** y agrega **dos**:
   - `http://localhost:5173` (desarrollo local)
   - `https://martin-romero.cl/cloud` (produccion — ver seccion de Deploy mas abajo)
5. Click **Register**.
6. En la pagina **Overview** del App Registration, copia:
   - **Application (client) ID** → `VITE_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `VITE_AZURE_TENANT_ID`

### Exponer el API (para el scope que usa el frontend al llamar al backend)

Si el backend/API Gateway aun no tiene su propio App Registration:

1. Crea un **segundo** App Registration para el backend (ej. `ev1-cloud-native-api`), o usa el mismo si es un solo proyecto.
2. En ese App Registration ve a **Expose an API** → **Add a scope**.
3. Application ID URI: deja el default `api://<client-id-del-backend>` → **Save and continue**.
4. Scope name: `access_as_user` (o el nombre que prefieran) → **Admin consent display name/description** (cualquier texto) → **Add scope**.
5. Copia el valor completo, ej. `api://<client-id-del-backend>/access_as_user` → `VITE_API_SCOPE`.

### Dar permiso al frontend para llamar a ese scope

1. Vuelve al App Registration del **frontend** → **API permissions** → **Add a permission** → **My APIs** → selecciona el App Registration del backend.
2. Elige **Delegated permissions** → marca `access_as_user` → **Add permissions**.
3. Si el tenant lo requiere, click **Grant admin consent**.

Esto es justo lo que usa el **Lambda Authorizer** del diagrama para validar el bearer token en el API Gateway.

## 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `.env` con los valores obtenidos arriba:

```
VITE_AZURE_CLIENT_ID=<client id del frontend>
VITE_AZURE_TENANT_ID=<tenant id>
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_API_SCOPE=api://<client id del backend>/access_as_user
VITE_API_URL=<URL del API Gateway HTTP>
```

`.env` esta en `.gitignore`, no se sube al repo.

## 4. Correr en local

```bash
npm run dev
```

Abre `http://localhost:5173`. Deberia mostrar el boton "Iniciar sesion con Microsoft"; al autenticarte, redirige a la vista de **Items**.

## Estructura

```
src/
  authConfig.ts        # Configuracion de MSAL (lee .env)
  api/
    client.ts           # Axios + interceptor que adjunta el bearer token
    items.ts             # Llamadas CRUD al API Gateway
  components/
    Layout.tsx           # Header con usuario logueado / logout
  pages/
    Login.tsx            # Pantalla de login (loginRedirect)
    Items.tsx             # CRUD simple: listar, crear, editar, eliminar
  types/item.ts          # Tipos del recurso CRUD (ejemplo generico)
```

## Deploy (FTP a cPanel)

Este frontend esta pensado para subirse por **FTP** a un hosting **cPanel**, en el subdirectorio `/cloud` del dominio: `https://martin-romero.cl/cloud`.

Por eso:

- `vite.config.ts` tiene `base: '/cloud/'` — para que los assets (`/cloud/assets/...`) resuelvan bien dentro del subdirectorio.
- `main.tsx` usa `<BrowserRouter basename="/cloud">` — para que las rutas de React Router coincidan.
- `public/.htaccess` se copia tal cual a `dist/` en el build; en cPanel (Apache) reescribe cualquier ruta que no sea un archivo/carpeta real (ej. `/cloud/items`) hacia `index.html`, para que el router de React la resuelva en el navegador. Sin este archivo, recargar la pagina en una ruta distinta a `/cloud` da 404.

Pasos:

1. Completa `.env` con `VITE_AZURE_REDIRECT_URI=https://martin-romero.cl/cloud` y el resto de variables de produccion.
2. Genera el build:
   ```bash
   npm run build
   ```
3. Sube **el contenido** de la carpeta `dist/` (incluyendo `.htaccess`, que es un archivo oculto — asegurate que tu cliente FTP muestre archivos ocultos) a la carpeta `cloud` dentro del `public_html` del cPanel.
4. Verifica en el navegador que `https://martin-romero.cl/cloud` cargue el login y que navegar a `https://martin-romero.cl/cloud/items` directamente (o recargar ahi) tambien funcione, gracias al `.htaccess`.

## Notas sobre el CRUD de ejemplo

La vista `Items` asume que el backend expone `GET/POST /items` y `PUT/DELETE /items/{id}` devolviendo/recibiendo `{ id, nombre, descripcion }`. Ajusta `src/types/item.ts` y `src/api/items.ts` cuando definan el recurso real y sus endpoints.
