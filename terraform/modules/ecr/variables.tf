variable "name_prefix" {
  description = "Prefijo aplicado al nombre de cada repositorio (p. ej. \"ev1-\")."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags comunes aplicados a todos los repositorios."
  type        = map(string)
  default     = {}
}

variable "access_principal_arns" {
  description = <<-EOT
    ARNs de principales IAM a los que se concede push/pull sobre los repositorios
    que no definan su propio policy_json. En AWS Academy (Learner Lab) se usa el
    ARN de LabRole, que es el único rol disponible.
  EOT
  type        = list(string)
  default     = []
}

variable "repositories" {
  description = <<-EOT
    Mapa de repositorios a crear. La clave es el nombre lógico del repositorio;
    el nombre real en AWS es "<name_prefix><clave>".

    Atributos por repositorio (todos opcionales):
      - image_tag_mutability : "MUTABLE" | "IMMUTABLE" (default "IMMUTABLE")
      - scan_on_push         : escaneo de vulnerabilidades al hacer push (default true)
      - force_delete         : permite destruir el repo aunque contenga imágenes (default false)
      - encryption_type      : "AES256" | "KMS" (default "AES256")
                              En AWS Academy no se pueden crear claves KMS
                              gestionadas por el cliente: deja "AES256".
      - kms_key              : ARN de la clave KMS (obligatorio si encryption_type = "KMS")
      - max_image_count      : nº de imágenes a conservar; 0 desactiva la regla (default 10)
      - untagged_expiry_days : días antes de expirar imágenes sin tag; 0 desactiva la regla (default 14)
      - policy_json          : política de repositorio en JSON (opcional)
      - tags                 : tags específicos del repositorio
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

  validation {
    condition = alltrue([
      for r in values(var.repositories) : contains(["MUTABLE", "IMMUTABLE"], r.image_tag_mutability)
    ])
    error_message = "image_tag_mutability debe ser \"MUTABLE\" o \"IMMUTABLE\"."
  }

  validation {
    condition = alltrue([
      for r in values(var.repositories) : contains(["AES256", "KMS"], r.encryption_type)
    ])
    error_message = "encryption_type debe ser \"AES256\" o \"KMS\"."
  }

  validation {
    condition = alltrue([
      for r in values(var.repositories) : r.encryption_type != "KMS" || r.kms_key != null
    ])
    error_message = "kms_key es obligatorio cuando encryption_type es \"KMS\"."
  }
}
