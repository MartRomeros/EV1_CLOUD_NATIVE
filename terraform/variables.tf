variable "aws_region" {
  description = "Región de AWS. En AWS Academy (Learner Lab) suele estar fijada a us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = <<-EOT
    Perfil de credenciales de AWS CLI. En AWS Academy se pegan las credenciales
    temporales del panel "AWS Details" en ~/.aws/credentials bajo [default];
    deja este valor en null para usar ese perfil / las variables de entorno.
  EOT
  type        = string
  default     = null
}

variable "lab_role_name" {
  description = "Nombre del rol de ejecución de AWS Academy. Es el único rol disponible en el lab."
  type        = string
  default     = "LabRole"
}

variable "project" {
  description = "Nombre del proyecto, usado como prefijo y tag."
  type        = string
  default     = "ev1-cloud"
}

variable "environment" {
  description = "Entorno de despliegue (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags adicionales a fusionar con los tags comunes en todos los recursos."
  type        = map(string)
  default     = {}
}

# --- Red (network/vpc) ------------------------------------------------------

variable "owner_name" {
  description = "Nombre del owner, exigido por el módulo de la Instancia NAT (network/vpc/vendor/nat-instance)."
  type        = string
}

variable "nat_instance_type" {
  description = "Tipo de instancia para la Instancia NAT."
  type        = string
  default     = "t3.micro"
}

# --- Security Groups (network/security-groups) -----------------------------

variable "app_port" {
  description = "Puerto de la app backend (contenedor EC2 y target group del NLB)."
  type        = number
  default     = 3000
}

# --- EC2 backend / EC2 Frontend (SSM) ---------------------------------------

variable "instance_profile_name" {
  description = "Nombre del instance profile asociado a LabRole en esta cuenta de AWS Academy (necesario para administrar las EC2 vía SSM)."
  type        = string
}

# --- EC2 backend -------------------------------------------------------------

variable "ec2_instance_type" {
  description = "Tipo de instancia de la EC2 backend."
  type        = string
  default     = "t3.micro"
}

variable "docker_image" {
  description = "Imagen Docker Hub del backend, ej. \"usuario/tallerpro360-backend:latest\". Sin default: debe pasarse explícitamente en terraform.tfvars."
  type        = string
}

# --- RDS ---------------------------------------------------------------------

variable "db_name" {
  description = "Nombre de la base de datos inicial en RDS."
  type        = string
  default     = "tallerpro360"
}

variable "db_username" {
  description = "Usuario maestro de RDS."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Password maestro de RDS. Si es \"\", el módulo rds genera uno aleatorio."
  type        = string
  default     = ""
  sensitive   = true
}

# --- EC2 Frontend ------------------------------------------------------------

variable "frontend_instance_type" {
  description = "Tipo de instancia de la EC2 Frontend."
  type        = string
  default     = "t3.micro"
}

variable "frontend_docker_image" {
  description = "Imagen Docker Hub del frontend, ej. \"usuario/tallerpro360-frontend:latest\". Sin default: debe pasarse explícitamente en terraform.tfvars."
  type        = string
}

variable "frontend_domain" {
  description = "Dominio para el cual Certbot solicita el certificado TLS, ej. \"app.ejemplo.cl\". Debe apuntar por DNS (registro A) a la Elastic IP de la EC2 Frontend antes del primer apply."
  type        = string
}

variable "certbot_email" {
  description = "Email de contacto para el registro ACME de Let's Encrypt. Sin default: Let's Encrypt exige uno real."
  type        = string
}

# --- API Gateway / Entra ID JWT Authorizer -----------------------------------

variable "entra_tenant_id" {
  description = "Tenant ID de Microsoft Entra ID. Sin default: cada entorno/tenant debe pasarlo explícitamente en terraform.tfvars."
  type        = string
}

variable "entra_audience" {
  description = "Audience(s) del JWT esperado por el authorizer (client ID / URI de scope de la App Registration de la API). Sin default: debe pasarse explícitamente."
  type        = list(string)
}
