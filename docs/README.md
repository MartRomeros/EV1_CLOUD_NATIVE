# Índice de Documentación Técnica y CI/CD (TallerPro360)

Este directorio centraliza las guías técnicas operativas, especificaciones de integración continua y despliegue continuo (CI/CD), y la gestión segura de credenciales para el proyecto **TallerPro360**.

---

## 📚 Documentos Disponibles en esta Carpeta

| Documento | Descripción |
| :--- | :--- |
| [`CI_CD_SECRETS_GUIDE.md`](CI_CD_SECRETS_GUIDE.md) | Guía exhaustiva de configuración de **GitHub Actions Secrets**, detallando variables requeridas para AWS Academy, Docker Hub y parámetros de despliegue. |

---

## ⚙️ Pipelines de CI/CD (GitHub Actions)

El proyecto cuenta con dos flujos automatizados de trabajo ubicados en `.github/workflows/`:

### 1. `docker-publish.yml` (Construcción y Publicación de Imágenes)
- **Disparador:** Push a la rama principal (`main`) con cambios en `backend/**` o `frontend/**`, o ejecución manual (`workflow_dispatch`).
- **Acciones:**
  - Inicia sesión en **Docker Hub** con `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN`.
  - Construye la imagen del frontend (multi-stage Node 22 + Nginx Alpine) y la etiqueta con el commit SHA y `latest`.
  - Construye la imagen del backend (Node.js 20 ESM) y la etiqueta correspondientemente.
  - Publica ambas imágenes en los repositorios configurados de Docker Hub.

### 2. `aws-deploy.yml` (Despliegue de Infraestructura y Aplicación)
- **Disparador:** Concurrente a la publicación de imágenes o mediante ejecución manual con parámetros.
- **Acciones:**
  - Configura credenciales temporales de **AWS Academy Learner Lab** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`).
  - Ejecuta `terraform init`, `terraform plan` y `terraform apply` con el archivo `terraform.tfvars` provisionado de forma segura desde los secretos.
  - Se conecta mediante **AWS Systems Manager (SSM Session Manager)** a las instancias EC2 (pública y privada) para refrescar y reiniciar los contenedores Docker con las nuevas imágenes publicadas.

---

## 🔐 Matriz de Secretos Requeridos en GitHub

Para que los workflows se ejecuten exitosamente, deben configurarse los siguientes secretos en el repositorio (*Settings > Secrets and variables > Actions*):

| Secreto | Descripción | Ejemplo / Observación |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Access Key de AWS Academy | Obtenida desde la pestaña *AWS Details* en Learner Lab |
| `AWS_SECRET_ACCESS_KEY` | Secret Key de AWS Academy | Obtenida desde la pestaña *AWS Details* en Learner Lab |
| `AWS_SESSION_TOKEN` | Token de sesión temporal | **Obligatorio** en AWS Academy |
| `AWS_REGION` | Región de despliegue en AWS | `us-east-1` |
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub | Cuenta personal o de equipo |
| `DOCKERHUB_TOKEN` | Access Token de Docker Hub | Token generado con permisos de Read/Write |
| `TF_VARS_FILE` | Contenido del archivo `terraform.tfvars` | Contiene todas las variables de configuración de Terraform |

Para consultar instrucciones detalladas sobre cómo obtener, rotar y configurar estos secretos, dirígete a [`CI_CD_SECRETS_GUIDE.md`](CI_CD_SECRETS_GUIDE.md).

---

## 🔗 Navegación Rápida
- [README Maestro del Repositorio](../README.md)
- [Documentación del Backend y RBAC](../backend/README.md)
- [Documentación del Frontend en Angular](../frontend/README.md)
- [Aprovisionamiento con Terraform](../terraform/README.md)
- [Configuración de Microsoft Entra ID](../azure/README.md)
