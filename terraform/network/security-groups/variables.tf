variable "project" {
  description = "Prefijo de nombre para los Security Groups."
  type        = string
}

variable "vpc_id" {
  description = "VPC donde crear los Security Groups (output de network/vpc)."
  type        = string
}

variable "app_port" {
  description = "Puerto de la app backend (contenedor EC2 y target group del NLB)."
  type        = number
  default     = 3000
}
