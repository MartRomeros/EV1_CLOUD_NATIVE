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
4. **Redirect URI**: selecciona plataforma **Single-page application (SPA)** y pon `http://localhost:5173` (agrega luego la URL de produccion cuando la tengan).
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

## Notas sobre el CRUD de ejemplo

La vista `Items` asume que el backend expone `GET/POST /items` y `PUT/DELETE /items/{id}` devolviendo/recibiendo `{ id, nombre, descripcion }`. Ajusta `src/types/item.ts` y `src/api/items.ts` cuando definan el recurso real y sus endpoints.
