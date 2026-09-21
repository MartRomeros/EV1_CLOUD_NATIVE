# Guía de Configuración de CI/CD y GitHub Secrets (AWS Academy & Docker Hub)

Esta guía detalla la configuración y los secrets necesarios para que los dos pipelines de GitHub Actions funcionen de manera exitosa:
1. **`.github/workflows/docker-publish.yml`**: Compilación y publicación en Docker Hub.
2. **`.github/workflows/aws-deploy.yml`**: Actualización automatizada en las dos instancias EC2 de AWS Academy mediante AWS Systems Manager (SSM).

---

## 🔐 1. Resumen de Secrets Requeridos en GitHub

Configura los siguientes secrets en tu repositorio de GitHub:
👉 **Ruta en GitHub:** `Settings` ➔ `Secrets and variables` ➔ `Actions` ➔ **New repository secret**.

| Nombre del Secret | Descripción | Origen del Valor |
| :--- | :--- | :--- |
| `DOCKERHUB_USERNAME` | Tu usuario de Docker Hub | Cuenta de Docker Hub |
| `DOCKERHUB_TOKEN` | Personal Access Token (PAT) con permisos de lectura y escritura | Docker Hub ➔ Account Settings |
| `AWS_ACCESS_KEY_ID` | Access Key ID provisto por AWS Academy Learner Lab | AWS Academy ➔ AWS Details |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key provisto por AWS Academy Learner Lab | AWS Academy ➔ AWS Details |
| `AWS_SESSION_TOKEN` | Token temporal de sesión (¡Obligatorio en AWS Academy!) | AWS Academy ➔ AWS Details |
| `AWS_REGION` | Región del laboratorio (ej. `us-east-1`) | AWS Academy Learner Lab |
| `AWS_EC2_FRONTEND_INSTANCE_ID` | ID de la instancia EC2 donde corre el Frontend (ej. `i-0123456789abcdef0`) | Consola AWS EC2 |
| `AWS_EC2_BACKEND_INSTANCE_ID` | ID de la instancia EC2 donde corre el Backend (ej. `i-0987654321fedcba0`) | Consola AWS EC2 |

---

## 🐳 2. Obtención de Credenciales de Docker Hub

Para permitir que GitHub Actions suba imágenes a tu cuenta sin exponer tu contraseña personal:

1. Inicia sesión en [Docker Hub](https://hub.docker.com/).
2. Haz clic en tu avatar en la esquina superior derecha y selecciona **Account Settings**.
3. En el menú lateral, dirígete a **Security**.
4. Haz clic en **New Access Token**:
   - **Access Token Description**: `github-actions-ev1`
   - **Access permissions**: `Read & Write` (o `Read, Write, Delete`).
5. Copia el token generado (`dckr_pat_...`) y guárdalo en GitHub como `DOCKERHUB_TOKEN`.
6. Guarda tu nombre de usuario de Docker Hub como `DOCKERHUB_USERNAME`.

> **Nota:** Al ser repositorios públicos en Docker Hub, las instancias EC2 podrán descargar las imágenes (`docker pull`) directamente sin necesidad de iniciar sesión en Docker dentro del servidor.

---

## ☁️ 3. Credenciales de AWS Academy (Learner Lab)

En AWS Academy Learner Lab, las credenciales son **temporales** y cambian cada vez que inicias el laboratorio o tras 4 horas de sesión.

### Cómo obtenerlas:
1. En el portal de AWS Academy, abre el módulo **Learner Lab**.
2. Haz clic en el botón verde **Start Lab** y espera a que el círculo se vuelva verde.
3. Haz clic en el enlace **AWS Details** (junto al botón de inicio).
4. En la sección **AWS CLI**, haz clic en `Show`. Verás algo similar a:
   ```ini
   [default]
   aws_access_key_id=ASIAXXXXXXXXXXXXXXXX
   aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   aws_session_token=IQoJb3JpZ2luX2VjE...
   ```
5. Copia los tres valores correspondientes a los Secrets de GitHub:
   - `aws_access_key_id` ➔ `AWS_ACCESS_KEY_ID`
   - `aws_secret_access_key` ➔ `AWS_SECRET_ACCESS_KEY`
   - `aws_session_token` ➔ `AWS_SESSION_TOKEN`
6. Agrega `AWS_REGION` con el valor `us-east-1`.

> ⚠️ **IMPORTANTE:** Cuando reinicies o inicies una nueva sesión en AWS Academy Learner Lab, **debes actualizar únicamente estos 3 secrets en GitHub** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN`) antes de ejecutar el pipeline de despliegue.

---

## 🖥️ 4. Requisitos Previos en las Instancias EC2

El pipeline de despliegue utiliza **AWS Systems Manager (SSM Run Command)**, lo que elimina la necesidad de abrir puertos SSH (22) en internet ni guardar claves privadas `.pem` en GitHub.

Para que AWS SSM pueda comunicarse con tus instancias EC2:

### 1. Rol IAM (`LabInstanceProfile`):
En AWS Academy, tus instancias EC2 deben tener asociado el perfil de instancia del laboratorio:
1. En la consola de AWS EC2, selecciona la instancia.
2. Haz clic en **Actions** ➔ **Security** ➔ **Modify IAM role**.
3. Selecciona **`LabInstanceProfile`** (o `LabRole`) y haz clic en **Update IAM role**.
4. Repite esto tanto para la instancia de Frontend como para la de Backend.

### 2. Agente SSM (`amazon-ssm-agent`):
En imágenes Ubuntu 20.04/22.04/24.04 el agente SSM viene preinstalado. Si la instancia fue recién creada y no responde a SSM, puedes verificarlo conectándote por SSH una sola vez y ejecutando:
```bash
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
```
Si no estuviera instalado:
```bash
sudo snap install amazon-ssm-agent --classic
sudo systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service
```

### 3. Configuración del Backend (Base de Datos):
En la instancia EC2 del backend, puedes colocar un archivo opcional `/home/ubuntu/.env` para definir las credenciales de PostgreSQL si no utilizas los defaults:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=PossGAdmin
POSTGRES_DB=DB_CLOUD
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```
El pipeline detectará automáticamente este archivo si existe y lo inyectará en `docker run` con `--env-file /home/ubuntu/.env`.

---

## 🚀 5. Flujo de Trabajo y Pruebas

### Despliegue Automático:
1. Realiza cambios en `frontend/` o `backend/` y haz `git push origin main`.
2. El pipeline **`Docker Build and Push to Docker Hub`** se activará automáticamente, compilará las imágenes y las subirá a Docker Hub con tags `latest` y el SHA del commit.
3. Una vez terminado exitosamente, el pipeline **`Deploy Application to AWS Academy (EC2)`** se activará solo y desplegará en paralelo las nuevas versiones en ambas instancias EC2.

### Despliegue Manual:
1. En GitHub, ve a la pestaña **Actions**.
2. Selecciona **`Deploy Application to AWS Academy (EC2)`**.
3. Haz clic en **Run workflow**.
4. Puedes elegir el parámetro `target`:
   - `both` (actualiza ambas instancias EC2).
   - `frontend` (actualiza únicamente la EC2 del Frontend).
   - `backend` (actualiza únicamente la EC2 del Backend).
