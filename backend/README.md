# Backend - API REST con Node.js, PostgreSQL y RBAC (TallerPro360)

API RESTful desarrollada en **Node.js** y **Express** para el sistema de gestión de taller mecánico **TallerPro360**. Implementa control de acceso basado en roles (**RBAC**), validación de tokens JWT emitidos por **Microsoft Entra ID**, persistencia en **PostgreSQL** sobre el esquema `tallerpro360` y compatibilidad completa con el frontend en Angular.

---

## 🚀 Arquitectura y Tecnologías

- **Runtime:** Node.js (módulos ECMAScript nativos `"type": "module"`).
- **Framework Web:** [Express.js 4](https://expressjs.com/).
- **Base de Datos:** PostgreSQL 15, esquema `tallerpro360` (`search_path = tallerpro360,public`).
- **Autenticación (JWT):** `express-jwt` y `jwks-rsa` validando tokens de Microsoft Entra ID.
- **Autorización (RBAC):** Middleware propio `requireRole` para control de permisos por endpoint.
- **Normalización de Datos:** Transformador a camelCase (`caseConverter.js`) para compatibilidad directa con el frontend.
- **Contenerización:** Docker y Docker Compose (red interna app <-> db).

---

## 🔒 Autenticación y Control de Acceso (RBAC)

### 1. Autenticación JWT (`validateJwt`)
El middleware global [`validateJwt`](src/middlewares/auth.js) valida los Bearer Tokens emitidos por Microsoft Entra ID:
- Obtiene las claves públicas dinámicamente desde el endpoint JWKS de Microsoft:
  `https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys`
- Valida el emisor (`iss`), la audiencia (`aud`) y el algoritmo de firma (`RS256`).
- Al validar exitosamente, `express-jwt` inyecta la carga útil decodificada en `req.auth`.
- Si el token falta, expiró o es inválido, retorna **HTTP 401 Unauthorized**:
  ```json
  {
    "error": "Token de autenticación no proporcionado o inválido"
  }
  ```

> [!TIP]
> **Modo Local (`AUTH_REQUIRED=false`):**
> Cuando la variable de entorno `AUTH_REQUIRED` es `false` (por defecto en local), la validación estricta de JWT y de roles se desactiva para facilitar pruebas y desarrollo local sin requerir credenciales de Entra ID.

---

### 2. Extracción y Validación de Roles (`requireRole`)
Los roles de aplicación se asignan en Entra ID (App Roles) y viajan en el token de acceso dentro del claim `roles`:

```json
{
  "aud": "952083c2-4584-4dec-a3d3-5b0077da3e8f",
  "iss": "https://login.microsoftonline.com/639a8b7f-479a-4d37-9418-bad57badccb1/v2.0",
  "roles": [
    "admin"
  ],
  "scp": "access_as_user"
}
```

El middleware [`requireRole(...allowedRoles)`](src/middlewares/auth.js):
1. Extrae los roles desde `req.auth.roles`.
2. Normaliza los roles a minúsculas (`toLowerCase()`) para evitar discrepancias de mayúsculas/minúsculas.
3. Verifica si el usuario posee al menos uno de los roles permitidos.
4. Si no cuenta con los permisos necesarios, interrumpe el procesamiento y responde con **HTTP 403 Forbidden**:
   ```json
   {
     "error": "Acceso denegado: permisos insuficientes para este recurso"
   }
   ```

---

## 📊 Matriz de Permisos por Rol

| Recurso / Acción | Método & Ruta | Administrador (`admin`) | Recepcionista (`recepcion`) | Mecánico (`mecanico`) |
| :--- | :--- | :---: | :---: | :---: |
| **Health Check** | `GET /health` | Público | Público | Público |
| **Listar Órdenes de Trabajo** | `GET /ot` | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Ver Detalle de OT** | `GET /ot/:id` | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Listar Ítems de OT** | `GET /ot/:id/items` | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Crear Orden de Trabajo** | `POST /ot` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Agregar Ítems a OT** | `POST /ot/:id/items` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Modificar Orden de Trabajo** | `PUT /ot/:id` | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Eliminar Orden de Trabajo** | `DELETE /ot/:id` | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Listar Clientes** | `GET /clientes` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Ver Detalle Cliente** | `GET /clientes/:id` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Crear Cliente** | `POST /clientes` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Modificar Cliente** | `PUT /clientes/:id` | ✅ Permitido | ✅ Permitido | ❌ 403 Forbidden |
| **Eliminar Cliente** | `DELETE /clientes/:id` | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Catálogo de Servicios/Repuestos** | `* /catalogo` (CRUD) | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Gestión de Usuarios** | `* /usuarios` (CRUD) | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Resumen Agregado de OT** | `GET /resumen` | ✅ Permitido | ❌ 403 Forbidden | ❌ 403 Forbidden |

---

## ⚙️ Variables de Entorno

Configurables mediante archivo `.env` en la raíz de `backend/`:

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto donde escucha el servidor Express | `3000` |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `POSTGRES_HOST` | Host de la base de datos PostgreSQL | `db` (o `localhost`) |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |
| `POSTGRES_DB` | Nombre de la base de datos | `DB_CLOUD` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `PossGAdmin` |
| `POSTGRES_SEARCH_PATH` | Esquema preferente en PostgreSQL | `tallerpro360,public` |
| `AUTH_REQUIRED` | Activa validación estricta de JWT y roles (`true`/`false`) | `false` |
| `AZURE_TENANT_ID` | Tenant ID de Microsoft Entra ID | `639a8b7f-479a-4d37-9418-bad57badccb1` |
| `AZURE_CLIENT_ID` | Client ID / Audience de la API en Entra ID | `952083c2-4584-4dec-a3d3-5b0077da3e8f` |

---

## 🛠️ Instrucciones de Ejecución

### Opción 1: Con Docker Compose (Recomendado)
Levanta la API (`app`) en el puerto host `8085` y la base de datos PostgreSQL (`db`) en el puerto `5433`:

```bash
docker-compose up -d --build
```

Para detener los servicios:
```bash
docker-compose down
```

### Opción 2: Ejecución Local Directa con Node.js
Asegúrate de tener PostgreSQL corriendo localmente con las credenciales correspondientes:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev

# O en modo estándar
npm start
```

---

## 🌐 Catálogo de Endpoints

URL Base (Docker): `http://localhost:8085` | URL Base (Local): `http://localhost:3000`

### 1. Sistema & Monitoreo
- `GET /health`: Endpoint público para health check del balanceador (NLB).

### 2. Órdenes de Trabajo (`/ot`)
- `GET /ot`: Retorna todas las OT registradas. *(Roles: `admin`, `recepcion`, `mecanico`)*
- `GET /ot/:id`: Retorna una OT por su ID (ej. `OT-2026-000001`). *(Roles: `admin`, `recepcion`, `mecanico`)*
- `POST /ot`: Crea una nueva OT. *(Roles: `admin`, `recepcion`)*
  ```json
  {
    "clienteId": "CLI-001",
    "patente": "XXYY11",
    "descripcion": "Mantención periódica",
    "total": 65000
  }
  ```
- `PUT /ot/:id`: Modifica una orden existente. *(Rol: `admin`)*
- `DELETE /ot/:id`: Elimina una orden de trabajo. *(Rol: `admin`)*

### 3. Ítems de Orden (`/ot/:id/items`)
- `GET /ot/:id/items`: Lista los ítems asociados a la OT. *(Roles: `admin`, `recepcion`, `mecanico`)*
- `POST /ot/:id/items`: Agrega un nuevo ítem a la orden. *(Roles: `admin`, `recepcion`)*
  ```json
  {
    "concepto": "Cambio Filtro Aceite",
    "cantidad": 1,
    "precioUnit": 15000
  }
  ```

### 4. Clientes (`/clientes`)
- `GET /clientes`: Lista todos los clientes. *(Roles: `admin`, `recepcion`)*
- `GET /clientes/:id`: Obtiene el detalle de un cliente. *(Roles: `admin`, `recepcion`)*
- `POST /clientes`: Registra un nuevo cliente. *(Roles: `admin`, `recepcion`)*
- `PUT /clientes/:id`: Actualiza datos de un cliente. *(Roles: `admin`, `recepcion`)*
- `DELETE /clientes/:id`: Elimina un cliente. *(Rol: `admin`)*

### 5. Catálogo de Servicios y Repuestos (`/catalogo`)
*Exclusivo para `admin`.*
- `GET /catalogo`: Lista conceptos del catálogo.
- `GET /catalogo/:concepto`: Detalle de un concepto.
- `POST /catalogo`: Registra un concepto en catálogo.
- `PUT /catalogo/:concepto`: Actualiza un concepto.
- `DELETE /catalogo/:concepto`: Elimina un concepto.

### 6. Gestión de Usuarios (`/usuarios`)
*Exclusivo para `admin`.*
- `GET /usuarios`: Lista los usuarios.
- `GET /usuarios/:email`: Consulta un usuario por correo.
- `POST /usuarios`: Registra un nuevo usuario.
- `PUT /usuarios/:email`: Actualiza información del usuario.
- `DELETE /usuarios/:email`: Elimina un usuario.

### 7. Resumen Agregado (`/resumen`)
*Exclusivo para `admin`.*
- `GET /resumen`: Emula la vista `V_OT_RESUMEN` con conteo consolidado de ítems y subtotales calculados.
