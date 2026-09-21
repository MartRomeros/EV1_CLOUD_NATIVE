variable "project" {
  description = "Prefijo de nombre para los recursos de red."
  type        = string
}

variable "environment" {
  description = "Entorno (lab, dev, ...), usado en tags y en el módulo nat-instance."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR de la VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Cantidad de zonas de disponibilidad a usar (mínimo 2, exigido por el DB Subnet Group de RDS)."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2
    error_message = "az_count debe ser >= 2: RDS requiere un DB Subnet Group en al menos 2 AZs."
  }
}

variable "owner_name" {
  description = "Nombre del owner, exigido por el módulo franciscobrioneslavados/terraform-aws-nat-instance."
  type        = string
}

variable "nat_instance_type" {
  description = "Tipo de instancia para la Instancia NAT."
  type        = string
  default     = "t3.micro"
}

variable "instance_profile_name" {
  description = "Nombre del instance profile asociado a LabRole, reusado por la Instancia NAT para SSM (ver ./vendor/nat-instance)."
  type        = string
}
