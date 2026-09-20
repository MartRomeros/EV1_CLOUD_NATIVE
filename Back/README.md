# Backend - API REST con Node.js y PostgreSQL (TallerPro360)

Este proyecto es una API RESTful desarrollada con Node.js y Express que implementa un sistema para la gestión de **Órdenes de Trabajo (OT)**. El modelo de datos está basado en el script SQL original de TallerPro360. 

Los datos se almacenan en una base de datos PostgreSQL y la aplicación está preparada para ser ejecutada mediante contenedores Docker, conectándose al esquema `tallerpro360`.

## 🚀 Características principales y Actualizaciones Recientes
- **Servidor Web:** Node.js usando el framework [Express.js](https://expressjs.com/).
- **Base de Datos:** PostgreSQL 15, conectada usando el paquete `pg` hacia la base de datos `DB_CLOUD`.
- **Esquema Personalizado:** La aplicación fue configurada para apuntar al esquema `tallerpro360` de forma predeterminada mediante el parámetro `search_path`.
- **Eventos y Logs:** Simulación del registro de eventos en la base de datos (`OT_EVENT`) cuando se crea una nueva orden.
- **Contenerización:** Orquestación utilizando Docker Compose (`docker-compose up -d --build`).

## 📋 Estructura de Datos Principal

El backend interactúa principalmente con las siguientes tablas del esquema `tallerpro360`:
- `OT`: Almacena la cabecera de las Órdenes de Trabajo (ID, cliente, patente, descripción, total).
- `OT_ITEM`: Detalles o ítems asociados a cada OT (concepto, cantidad, precio unitario, subtotal calculado).
- `OT_EVENT`: Registro histórico de eventos (ej. evento `OtCreada`).
- `NOTIFY_LOG`: Registro de notificaciones enviadas a clientes.

## 🛠️ Requisitos
- **Docker** y **Docker Compose** instalados en tu computadora.
- **PostgreSQL** corriendo y la base de datos `DB_CLOUD` inicializada (el backend levanta las tablas en su inicialización si no existen, buscando primero en el esquema `tallerpro360`).

## ⚙️ Instrucciones de Ejecución

Para levantar el backend, abre una terminal en la raíz de esta carpeta (`Back/`) y ejecuta el siguiente comando:

```bash
docker-compose up -d --build
```

Esto levantará el servidor en el puerto **8085** y se conectará automáticamente a la base de datos PostgreSQL.

## 🌐 Endpoints (Rutas de la API)

La URL base de la aplicación una vez levantada es: `http://localhost:8085`

### Órdenes de Trabajo (OT)

#### 1. Crear una Orden de Trabajo (Create)
- **Ruta:** `POST /ot`
- **Body (JSON):**
  ```json
  {
    "cliente_id": "CLI-001",
    "patente": "XXYY11",
    "descripcion": "Mantención 10k",
    "total": 62000
  }
  ```
- *Nota: Esto automáticamente generará el evento "OtCreada" en la tabla `OT_EVENT`.*

#### 2. Obtener todas las Órdenes (Read All)
- **Ruta:** `GET /ot`
- **Respuesta:** Retorna una lista con todas las órdenes ordenadas por fecha de creación.

#### 3. Obtener una Orden Específica (Read One)
- **Ruta:** `GET /ot/:id`
- **Ejemplo:** `GET /ot/OT-2026-000001`

#### 4. Actualizar una Orden (Update)
- **Ruta:** `PUT /ot/:id`
- **Body (JSON):**
  ```json
  {
    "cliente_id": "CLI-001",
    "patente": "XXYY11",
    "descripcion": "Cambio de pastillas",
    "total": 85000
  }
  ```

#### 5. Eliminar una Orden (Delete)
- **Ruta:** `DELETE /ot/:id`

### Ítems de la Orden (OT_ITEM)

#### 6. Agregar un Ítem a una Orden
- **Ruta:** `POST /ot/:id/items`
- **Body (JSON):**
  ```json
  {
    "concepto": "Filtro de Aceite",
    "cantidad": 1,
    "precio_unit": 12000
  }
  ```

#### 7. Obtener los Ítems de una Orden
- **Ruta:** `GET /ot/:id/items`
- **Ejemplo:** `GET /ot/OT-2026-000001/items`
- **Respuesta:** Devuelve todos los ítems asociados a la OT solicitada.

### Resumen y Vistas

#### 8. Obtener Vista de Resumen
- **Ruta:** `GET /resumen`
- **Respuesta:** Devuelve un resumen consolidado de las órdenes (emulando la vista `V_OT_RESUMEN`), incluyendo la cuenta de ítems (`N_ITEMS`) y el cálculo de subtotales sumados (`SUBTOTAL_CALC`).
