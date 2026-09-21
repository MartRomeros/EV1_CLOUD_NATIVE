# Configuración de Identidad y Autenticación con Microsoft Entra ID

Guía completa para la configuración del proveedor de identidad (**Microsoft Entra ID**) utilizado en **TallerPro360**. El sistema utiliza OAuth 2.0 y OpenID Connect (OIDC) para autenticar usuarios en la SPA (Angular 22 vía MSAL) y emitir tokens JWT con **App Roles** para el control de acceso basado en roles (**RBAC**) en el backend.

---

## 📌 Datos Clave del Tenant

| Parámetro | Valor Configurado |
| :--- | :--- |
| **Nombre del Tenant** | `manuelcarvajalapp` |
| **Directory (Tenant) ID** | `639a8b7f-479a-4d37-9418-bad57badccb1` |
| **Application (Client) ID** | `952083c2-4584-4dec-a3d3-5b0077da3e8f` |
| **Application ID URI** | `api://952083c2-4584-4dec-a3d3-5b0077da3e8f` |
| **JWKS Discovery URI** | `https://login.microsoftonline.com/639a8b7f-479a-4d37-9418-bad57badccb1/discovery/v2.0/keys` |

> [!WARNING]
> **Directorio de Trabajo:**
> Asegúrate de iniciar sesión en el portal de Azure con una cuenta que tenga privilegios de administrador en el tenant `manuelcarvajalapp` (o el tenant personal de pruebas). En cuentas institucionales restringidas (como `duocuc.cl`), la creación de App Registrations o la exposición de APIs suele estar bloqueada por políticas de la organización.

---

## 🚀 Paso a Paso de Configuración en el Portal de Azure

### 1. Registro de la Aplicación (App Registration)
1. Ingresa a [Azure Portal](https://portal.azure.com) y busca **Microsoft Entra ID**.
2. En el menú lateral, selecciona **App registrations** > **New registration**.
3. Configura los campos:
   - **Name:** `pedidos360-frontend` (o `tallerpro360-app`).
   - **Supported account types:** *Accounts in this organizational directory only (Single tenant)*.
   - **Redirect URI:** Selecciona plataforma **SPA (Single-page application)** e ingresa:
     - `http://localhost:4200`
4. Haz clic en **Register**.
5. Una vez creada, ve a **Authentication** en el menú lateral:
   - Añade la URI de producción: `https://app.martin-romero.cl`.
   - Bajo **Implicit grant and hybrid flows**, marca:
     - [x] **Access tokens** (used for implicit flows)
     - [x] **ID tokens** (used for implicit and hybrid flows)
   - Guarda los cambios (**Save**).

---

### 2. Exponer la API (Expose an API)
Para que el frontend pueda solicitar un Access Token válido para el backend/API Gateway:
1. En el menú lateral de la app, selecciona **Expose an API**.
2. Al lado de **Application ID URI**, haz clic en **Add** (o *Set*) y confirma:
   - `api://952083c2-4584-4dec-a3d3-5b0077da3e8f`
3. Haz clic en **Add a scope**:
   - **Scope name:** `access_as_user`
   - **Who can consent?:** *Admins and users*
   - **Admin consent display name:** *Acceso a la API de TallerPro360*
   - **Admin consent description:** *Permite al frontend consumir los endpoints de órdenes de trabajo.*
   - **User consent display name:** *Acceso a tu cuenta en TallerPro360*
   - **User consent description:** *Permite a la aplicación acceder a las órdenes de trabajo en tu nombre.*
   - **State:** *Enabled*
4. Guarda el scope.

---

### 3. Configuración de App Roles (RBAC)
Para que el token JWT contenga el claim `roles`, se deben crear los App Roles en el registro de la aplicación:

1. En el menú lateral, selecciona **App roles** > **Create app role**.
2. Crea los tres roles con los valores exactos requeridos por el frontend y el backend:

#### Rol Administrador:
- **Display name:** `Administrador`
- **Allowed member types:** `Users/Groups`
- **Value:** `admin` *(en minúsculas)*
- **Description:** *Acceso total al sistema: Órdenes, Clientes, Catálogo, Usuarios y Resumen.*
- **Do you want to enable this app role?:** Marcado.

#### Rol Recepcionista:
- **Display name:** `Recepcionista`
- **Allowed member types:** `Users/Groups`
- **Value:** `recepcion` *(en minúsculas)*
- **Description:** *Acceso al panel de recepción: Listar y crear OT, y gestionar Clientes.*
- **Do you want to enable this app role?:** Marcado.

#### Rol Mecánico:
- **Display name:** `Mecanico`
- **Allowed member types:** `Users/Groups`
- **Value:** `mecanico` *(en minúsculas)*
- **Description:** *Acceso al panel de mecánico: Consulta de listado y detalle de OT.*
- **Do you want to enable this app role?:** Marcado.

---

### 4. Asignación de Roles a Usuarios

Una vez definidos los App Roles, deben asignarse a los usuarios o grupos en la Aplicación Empresarial:

1. En el menú principal de Microsoft Entra ID, dirígete a **Enterprise applications**.
2. Busca y abre la aplicación creada (`pedidos360-frontend`).
3. En el menú lateral, selecciona **Users and groups** > **Add user/group**.
4. Selecciona el usuario deseado (ej. tu cuenta `@duocuc.cl` o de prueba).
5. En el campo **Select a role**, escoge el rol que deseas otorgarle (`admin`, `recepcion` o `mecanico`).
6. Haz clic en **Assign**.

---

## 🔍 Estructura del Token JWT Generado

Al autenticarse mediante MSAL, Microsoft Entra ID emite un token de acceso cuyo payload contiene los claims validados por el backend:

```json
{
  "aud": "952083c2-4584-4dec-a3d3-5b0077da3e8f",
  "iss": "https://login.microsoftonline.com/639a8b7f-479a-4d37-9418-bad57badccb1/v2.0",
  "iat": 1789998160,
  "nbf": 1789998160,
  "exp": 1790003619,
  "name": "MARTIN ROMERO SERRANO",
  "preferred_username": "mart.romeros@duocuc.cl",
  "roles": [
    "admin"
  ],
  "scp": "access_as_user",
  "sub": "go6KH5_C61Zrcd3daIRUUXRprfb9nWib0neEW5tcfvI",
  "tid": "639a8b7f-479a-4d37-9418-bad57badccb1"
}
```

- **`aud` (Audience):** Debe coincidir con `AZURE_CLIENT_ID` o `api://${AZURE_CLIENT_ID}` configurado en el backend.
- **`iss` (Issuer):** Valida que el token proceda exclusivamente de este tenant.
- **`roles`:** Array de roles activos. El middleware [`requireRole`](../backend/src/middlewares/auth.js) evalúa este claim para autorizar o responder con `403 Forbidden`.
- **`scp`:** Permisos delegados (debe incluir `access_as_user`).