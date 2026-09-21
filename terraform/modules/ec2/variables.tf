variable "project" {
  description = "Prefijo de nombre para la instancia EC2 backend."
  type        = string
}

variable "subnet_id" {
  description = "Una de las private-app subnets (network/vpc)."
  type        = string
}

variable "security_group_id" {
  description = "sg_ec2 (network/security-groups)."
  type        = string
}

variable "instance_profile_name" {
  description = "Nombre del instance profile asociado a LabRole (necesario para SSM)."
  type        = string
}

variable "instance_type" {
  description = "Tipo de instancia EC2."
  type        = string
  default     = "t3.micro"
}

variable "app_port" {
  description = "Puerto en el que escucha el contenedor del backend."
  type        = number
  default     = 3000
}

variable "docker_image" {
  description = "Imagen Docker Hub del backend, ej. \"usuario/tallerpro360-backend:latest\". Sin default: debe pasarse explícitamente."
  type        = string
}

variable "db_host" {
  description = "Endpoint de la instancia RDS."
  type        = string
}

variable "db_port" {
  description = "Puerto de la instancia RDS."
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Nombre de la base de datos."
  type        = string
}

variable "db_username" {
  description = "Usuario de la base de datos."
  type        = string
}

variable "db_password" {
  description = "Password de la base de datos."
  type        = string
  sensitive   = true
}
