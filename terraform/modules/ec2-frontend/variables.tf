variable "project" {
  description = "Prefijo de nombre para la instancia EC2 Frontend."
  type        = string
}

variable "subnet_id" {
  description = "Una de las public subnets de network/vpc (la misma familia donde vive la Instancia NAT)."
  type        = string
}

variable "security_group_id" {
  description = "sg_frontend (network/security-groups)."
  type        = string
}

variable "instance_profile_name" {
  description = "Nombre del instance profile asociado a LabRole, igual que en modules/ec2 (necesario para SSM)."
  type        = string
}

variable "instance_type" {
  description = "Tipo de instancia EC2."
  type        = string
  default     = "t3.micro"
}

variable "docker_image" {
  description = "Imagen Docker Hub que sirve el build del frontend, ej. \"usuario/tallerpro360-frontend:latest\". Sin default: debe pasarse explícitamente. Se publica solo en 127.0.0.1:8080 — el nginx del host es quien queda expuesto en 80/443."
  type        = string
}

variable "frontend_domain" {
  description = "Dominio para el cual Certbot solicita el certificado TLS, ej. \"app.ejemplo.cl\". Debe apuntar (registro A) a la Elastic IP de esta instancia antes del primer arranque para que el challenge HTTP-01 de Certbot funcione."
  type        = string
}

variable "certbot_email" {
  description = "Email de contacto para el registro ACME de Let's Encrypt. Sin default: Let's Encrypt exige uno real."
  type        = string
}
