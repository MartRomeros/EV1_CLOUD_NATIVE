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

variable "ecr_grant_lab_role" {
  description = "Añade una política de repositorio que permite a LabRole hacer push/pull en todos los repos ECR."
  type        = bool
  default     = true
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

variable "ecr_repositories" {
  description = <<-EOT
    Mapa de repositorios ECR a crear. La clave es el nombre del repositorio
    (se le antepone "<project>-"). Todos los atributos son opcionales.
  EOT
  type = map(object({
    image_tag_mutability = optional(string, "IMMUTABLE")
    scan_on_push         = optional(bool, true)
    force_delete         = optional(bool, false)
    encryption_type      = optional(string, "AES256")
    kms_key              = optional(string)
    max_image_count      = optional(number, 10)
    untagged_expiry_days = optional(number, 14)
    policy_json          = optional(string)
    tags                 = optional(map(string), {})
  }))
  default = {}
}
