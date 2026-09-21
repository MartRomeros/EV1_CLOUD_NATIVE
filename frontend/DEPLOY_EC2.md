# Guía de Despliegue en EC2 (Ubuntu): Frontend Docker + Nginx Reverse Proxy SSL

Esta guía contiene los comandos exactos y el paso a paso para desplegar el frontend de **TallerPro360 / Pedidos360** en una instancia AWS EC2 con **Ubuntu 22.04 o 24.04 LTS**, utilizando Docker para el contenedor y Nginx nativo en el host con Certbot (Let's Encrypt) para la terminación SSL en el subdominio **`app.martin-romero.cl`**.

---

## 📋 Requisitos Previos

1. **Security Group en AWS EC2**:
   - Puerto **22 (SSH)** abierto desde tu IP.
   - Puerto **80 (HTTP)** abierto desde `0.0.0.0/0`.
   - Puerto **443 (HTTPS)** abierto desde `0.0.0.0/0`.
2. **Registro DNS**:
   - Un registro tipo **`A`** en tu proveedor de DNS que apunte:
     ```text
     app.ejemplo.cl  ->  [IP Pública o Elástica de tu EC2]
     ```
   - *Nota: Asegúrate de que el DNS haya propagado antes de pedir el certificado SSL.*
3. **Azure Entra ID (App Registration)**:
   - En el portal de Azure, dentro de la aplicación `pedidos360-frontend`:
   - Ir a **Authentication** -> **Single-page application** -> **Redirect URIs**.
   - Agregar: `https://app.ejemplo.cl`.

---

## Paso 1: Conexión y Actualización de la EC2

Conéctate por SSH a tu instancia:

```bash
ssh -i /ruta/a/tu-llave.pem ubuntu@<IP_PUBLICA_EC2>
```

Actualiza los paquetes del sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Paso 2: Instalar Docker

Ejecuta el script oficial de instalación de Docker en Ubuntu:

```bash
# Instalar utilidades previas
sudo apt install -y ca-certificates curl gnupg

# Agregar clave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Configurar repositorio estable
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Permitir ejecutar Docker sin sudo
sudo usermod -aG docker $USER
newgrp docker
```

Verifica la instalación:

```bash
docker --version
```

---

## Paso 3: Instalar Nginx y Certbot en el Host

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

---

## Paso 4: Obtener el Certificado SSL con Certbot

Con Nginx corriendo y el registro DNS `app.martin-romero.cl` apuntando a la IP pública de la EC2, genera el certificado ejecutando:

```bash
sudo certbot certonly --nginx -d app.martin-romero.cl
```

- Ingresa tu correo electrónico para notificaciones de expiración.
- Acepta los términos de servicio (`Y`).
- Una vez completado, Certbot creará los certificados en:
  `/etc/letsencrypt/live/app.martin-romero.cl/fullchain.pem`
  `/etc/letsencrypt/live/app.martin-romero.cl/privkey.pem`

---

## Paso 5: Configurar Nginx Reverse Proxy en la EC2

Copia el archivo `nginx-ec2.conf` incluido en este repositorio a la configuración de Nginx:

```bash
sudo nano /etc/nginx/sites-available/app.martin-romero.cl
```

Pega el siguiente contenido (que es exactamente el de `frontend/nginx-ec2.conf`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.martin-romero.cl;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.martin-romero.cl;

    ssl_certificate /etc/letsencrypt/live/app.martin-romero.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.martin-romero.cl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    access_log /var/log/nginx/app.martin-romero.cl.access.log;
    error_log /var/log/nginx/app.martin-romero.cl.error.log warn;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

Habilita el sitio y desactiva el default:

```bash
# Enlazar en sites-enabled
sudo ln -sf /etc/nginx/sites-available/app.martin-romero.cl /etc/nginx/sites-enabled/

# Desactivar configuración por defecto de Nginx
sudo rm -f /etc/nginx/sites-enabled/default

# Validar sintaxis
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

## Paso 6: Compilar y Ejecutar el Contenedor Docker del Frontend

Ubícate dentro de la carpeta `frontend/` en la EC2 (donde están el `Dockerfile`, `nginx.conf`, código fuente y `package.json`):

```bash
cd /ruta/a/tu/proyecto/frontend
```

### 1. Construir la imagen:

```bash
docker build -t tallerpro360-frontend:latest .
```

### 2. Ejecutar el contenedor:

```bash
docker run -d \
  --name tallerpro360-frontend \
  --restart unless-stopped \
  -p 127.0.0.1:8080:80 \
  tallerpro360-frontend:latest
```

> **Explicación del comando:**
> - `-d`: Corre en segundo plano (detached mode).
> - `--name tallerpro360-frontend`: Asigna un nombre claro al contenedor.
> - `--restart unless-stopped`: Reinicia automáticamente el contenedor si la EC2 se reinicia o si el proceso falla.
> - `-p 127.0.0.1:8080:80`: Mapea el puerto 80 del contenedor únicamente al `127.0.0.1` de la EC2, impidiendo acceso directo desde internet sin pasar por Nginx y SSL.

### 3. Verificar estado:

```bash
docker ps
curl -I http://127.0.0.1:8080
```

Deberías recibir un código `HTTP/1.1 200 OK`.

---

## Paso 7: Comprobación Final

1. Abre tu navegador web e ingresa a:
   ```text
   http://app.martin-romero.cl
   ```
   *Debe redirigir automáticamente (HTTP 301) a:*
   ```text
   https://app.martin-romero.cl
   ```
2. Comprueba el candado SSL en el navegador (debe indicar certificado válido emitido por Let's Encrypt).
3. Inicia sesión con Entra ID y prueba navegar a rutas protegidas como `/ordenes`.
4. Recarga la página (F5) estando en una ruta interna (ej. `https://app.martin-romero.cl/ordenes`): gracias a la directiva `try_files` del `nginx.conf` del contenedor, la SPA no dará error 404.

---

## Paso 8: Comandos de Mantenimiento y Actualizaciones

### Actualizar la aplicación con nuevos cambios:

Cuando subas nuevo código al repositorio:

```bash
cd /ruta/a/tu/proyecto/frontend
git pull

# Detener y eliminar el contenedor actual
docker stop tallerpro360-frontend
docker rm tallerpro360-frontend

# Reconstruir imagen con el nuevo código
docker build -t tallerpro360-frontend:latest .

# Volver a levantar el contenedor
docker run -d \
  --name tallerpro360-frontend \
  --restart unless-stopped \
  -p 127.0.0.1:8080:80 \
  tallerpro360-frontend:latest
```

### Ver logs del frontend:

```bash
docker logs -f tallerpro360-frontend
```

### Ver logs de Nginx en la EC2:

```bash
sudo tail -f /var/log/nginx/app.martin-romero.cl.access.log
sudo tail -f /var/log/nginx/app.martin-romero.cl.error.log
```

### Comprobar renovación automática de certificados:

Certbot configura automáticamente un temporizador en systemd para renovar los certificados antes de su expiración (90 días). Puedes verificar la renovación simulada con:

```bash
sudo certbot renew --dry-run
```
