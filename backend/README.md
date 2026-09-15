# Backend - API REST con Node.js y PostgreSQL

Este proyecto es una API RESTful desarrollada con Node.js y Express que implementa un CRUD (Crear, Leer, Actualizar, Eliminar) para administrar usuarios. Los datos se almacenan en una base de datos PostgreSQL, y la aplicación está preparada para ser ejecutada mediante contenedores Docker, conectándose a una base de datos externa (local).

## 🚀 Características principales
- **Servidor Web:** Node.js usando el framework [Express.js](https://expressjs.com/).
- **Base de Datos:** PostgreSQL 15, conectada usando el paquete `pg` hacia la base de datos `DB_CLOUD`.
- **Contenerización:** Orquestación utilizando Docker Compose para garantizar que la aplicación se ejecute en un contenedor y se comunique con el motor PostgreSQL del host (`host.docker.internal`).

## 📋 Estructura de la Tabla `usuario`

| Campo      | Tipo         | Descripción                                     |
|------------|--------------|-------------------------------------------------|
| `id`       | INTEGER      | Clave primaria numérica autoincrementable       |
| `nombre`   | VARCHAR(100) | Nombre del usuario                              |
| `apellido` | VARCHAR(100) | Apellido del usuario                            |
| `email`    | VARCHAR(100) | Correo electrónico (único)                      |
| `password` | VARCHAR(100) | Contraseña (texto plano, en un caso real se encriptaría) |

## 🛠️ Requisitos
- **Docker** y **Docker Compose** instalados en tu computadora.
- **PostgreSQL** corriendo en tu máquina (`localhost:5432`) con una base de datos llamada `DB_CLOUD`, usuario `postgres` y contraseña `PossGAdmin`.

## ⚙️ Instrucciones de Ejecución

Para levantar el backend, abre una terminal en la raíz de esta carpeta (`Back/`) y ejecuta el siguiente comando:

```bash
docker-compose up -d --build app
```

Esto hará lo siguiente:
1. Descargará las imágenes base necesarias (Node.js).
2. Instalará las dependencias de Node.js (`express`, `pg`).
3. Levantará el servidor en el puerto **8085**.
4. Se conectará a la base de datos PostgreSQL existente de tu máquina anfitriona.

Para detener el servidor:
```bash
docker-compose down
```

## 🌐 Endpoints (Rutas de la API)

La URL base de la aplicación una vez levantada es: `http://localhost:8085`

### 1. Crear un usuario (Create)
- **Ruta:** `POST /usuario`
- **Body (JSON):**
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@example.com",
    "password": "mypassword123"
  }
  ```

### 2. Obtener todos los usuarios (Read All)
- **Ruta:** `GET /usuario`
- **Respuesta:** Retorna una lista con todos los usuarios registrados.

### 3. Obtener un usuario específico (Read One)
- **Ruta:** `GET /usuario/:id`
- **Respuesta:** Retorna los detalles del usuario asociado a ese ID en particular.

### 4. Actualizar un usuario (Update)
- **Ruta:** `PUT /usuario/:id`
- **Body (JSON):** Todos los campos a actualizar (nombre, apellido, email, password).

### 5. Eliminar un usuario (Delete)
- **Ruta:** `DELETE /usuario/:id`
- **Respuesta:** Borra el usuario asociado a ese ID de la base de datos.
