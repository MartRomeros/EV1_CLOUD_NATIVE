# Infraestructura como Código (IaC) en AWS con Terraform

Módulo de aprovisionamiento automatizado de infraestructura cloud para **TallerPro360** (Evaluación Parcial N°1 - DSY1107). Diseñado específicamente para ejecutarse sobre el entorno **AWS Academy (Learner Lab)** utilizando el provider de AWS `~> 6.0`.

---

## 🏗️ Topología de Red y Arquitectura de Infraestructura

```mermaid
flowchart TD
    subgraph Internet["Internet Pública"]
        Users["Usuarios Web (HTTPS)"]
        EntraID["Azure Entra ID (OIDC)"]
    end

    subgraph VPC["VPC TallerPro360 (10.0.0.0/16) - 2 Zonas de Disponibilidad"]
        subgraph PublicSubnets["Subredes Públicas (10.0.1.0/24, 10.0.2.0/24)"]
            NAT["Instancia NAT (Salida a Internet)"]
            EC2Front["EC2 Frontend + Elastic IP<br/>• Nginx Reverse Proxy (SSL Certbot)<br/>• Docker Contenedor Angular 22"]
        end

        subgraph PrivateAppSubnets["Subredes Privadas de Aplicación (10.0.10.0/24, 10.0.11.0/24)"]
            NLB["Network Load Balancer (NLB) Interno"]
            EC2Back["EC2 Backend (Docker)<br/>• Node.js + Express API REST<br/>• Middleware JWT + RBAC"]
        end

        subgraph PrivateDataSubnets["Subredes Privadas de Datos (10.0.20.0/24, 10.0.21.0/24)"]
            RDS["Amazon RDS PostgreSQL 15<br/>(db.t3.micro / db.t4g.micro)"]
        end
    end

    subgraph Serverless["Servicios Gestionados AWS"]
        APIGW["AWS API Gateway HTTP API (v2)<br/>• Integración VPC Link al NLB"]
    end

    Users -->|HTTPS:443| EC2Front
    Users -->|API Requests| APIGW
    APIGW -->|VPC Link (Túnel Privado)| NLB
    NLB -->|Puerto 8085| EC2Back
    EC2Back -->|Puerto 5432| RDS
    EC2Back -.->|Descarga paquetes/Docker Hub| NAT
    NAT -.->|Tráfico de Salida| Internet
```

---

## 📦 Módulos Terraform

La infraestructura está modularizada para facilitar el mantenimiento y la separación de responsabilidades:

| Módulo | Directorio | Descripción |
| :--- | :--- | :--- |
| **VPC & Red** | `network/vpc` | Crea la VPC (10.0.0.0/16), 6 subredes en 2 AZs (`us-east-1a`, `us-east-1b`), Internet Gateway, tablas de ruteo e Instancia NAT basada en una copia local parcheada para AWS Academy (`network/vpc/vendor/nat-instance/`). |
| **Security Groups** | `network/security-groups` | 5 grupos de seguridad encadenados por referencia: `sg_frontend` (público 80/443), `sg_vpc_link`, `sg_nlb`, `sg_ec2` y `sg_rds`. **El puerto 22 (SSH) no está abierto**: el acceso administrativo se realiza exclusivamente vía **AWS Systems Manager (SSM)**. |
| **RDS PostgreSQL** | `modules/rds` | Instancia de base de datos PostgreSQL 15 en las subredes privadas de datos, protegida contra acceso público. |
| **EC2 Backend** | `modules/ec2` | Servidor en subred privada que ejecuta el contenedor Docker del backend (`Node.js/Express`). Cuenta con `depends_on = [module.vpc]` para asegurar que la Instancia NAT esté disponible antes del `user_data`. |
| **EC2 Frontend** | `modules/ec2-frontend` | Servidor en subred pública con Elastic IP asignada, configurado con Nginx, Certbot SSL y Docker para servir la SPA Angular bajo `app.martin-romero.cl`. |
| **NLB Interno** | `modules/nlb` | Network Load Balancer interno de capa 4 situado frente a la EC2 backend para recibir el tráfico del API Gateway. |
| **API Gateway** | `modules/api-gateway` | HTTP API (v2) público que reenvía peticiones al NLB interno a través de un `aws_apigatewayv2_vpc_link`. |

---

## ⚠️ Consideraciones de AWS Academy Learner Lab

El entorno de AWS Academy presenta características que determinan la configuración de este proyecto:

1. **Rol IAM Fijo (`LabRole`):** Las políticas de AWS Academy deniegan la creación de nuevos roles IAM (`iam:CreateRole`). Por ello, todos los recursos y módulos reutilizan el instance profile existente asociado a `LabRole`.
2. **Sin Llaves SSH:** Las instancias no exponen el puerto 22. La administración remota se realiza mediante **AWS SSM Session Manager**:
   ```bash
   aws ssm start-session --target <INSTANCE_ID>
   ```
3. **Estado Local (`terraform.tfstate`):** Dado que la cuenta de AWS Academy se recrea periódicamente perdiendo los buckets S3 creados en sesiones previas, el backend de estado se mantiene intencionalmente en local (`local backend`).
4. **Desincronización de Estado:** Si se inicia una nueva sesión en AWS Academy y `terraform plan` intenta recrear todo o arroja errores de recursos inexistentes, es recomendable eliminar el archivo `terraform.tfstate` local y re-aplicar.

---

## 🚀 Guía de Despliegue

### 1. Configurar Credenciales Temporales de AWS
Descarga o copia las credenciales activas desde la pestaña **AWS Details** de tu sesión en Learner Lab y expórtalas en tu terminal:

```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Configurar Variables (`terraform.tfvars`)
Copia la plantilla de ejemplo y ajusta los valores necesarios:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Parámetros clave a revisar en `terraform.tfvars`:
- `owner_name`: Identificador personal para el etiquetado de recursos.
- `instance_profile_name`: Nombre del instance profile en AWS Academy (habitualmente `LabInstanceProfile` o similar).
- `frontend_domain`: Nombre de dominio asignado (ej. `app.martin-romero.cl`).
- `certbot_email`: Correo electrónico para la renovación de certificados SSL.
- `docker_image`: Imagen de Docker Hub para el backend.
- `frontend_docker_image`: Imagen de Docker Hub para el frontend.

### 3. Comandos de Despliegue

```bash
# 1. Inicializar proveedores y módulos
terraform init

# 2. Validar sintaxis y configuración
terraform validate

# 3. Planificar y previsualizar cambios
terraform plan -var-file=terraform.tfvars

# 4. Aprovisionar infraestructura en AWS
terraform apply -var-file=terraform.tfvars
```

---

## 🧹 Destrucción de Recursos

Para liberar recursos al finalizar las pruebas o la sesión de laboratorio:

```bash
terraform destroy -var-file=terraform.tfvars
```

---

## 🔗 Enlaces Relacionados
- [Documentación Maestro del Repositorio](../README.md)
- [Backend REST API y Control de Acceso RBAC](../backend/README.md)
- [Frontend Angular 22 y Dashboards](../frontend/README.md)
- [Guía de Secretos para CI/CD con Terraform](../docs/CI_CD_SECRETS_GUIDE.md)