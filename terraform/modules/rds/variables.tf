variable "project" {
  description = "Prefijo de nombre para los recursos de RDS."
  type        = string
}

variable "subnet_ids" {
  description = "Las 2 private-data subnets (el DB Subnet Group exige >= 2 AZs)."
  type        = list(string)
}

variable "security_group_id" {
  description = "sg_rds (network/security-groups)."
  type        = string
}

variable "instance_class" {
  description = "Clase de instancia de RDS."
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Almacenamiento asignado en GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Nombre de la base de datos inicial."
  type        = string
  default     = "tallerpro360"
}

variable "db_username" {
  description = "Usuario maestro de RDS."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Password maestro. Si es \"\", el módulo genera uno aleatorio."
  type        = string
  default     = ""
  sensitive   = true
}
