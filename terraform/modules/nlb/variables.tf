variable "project" {
  description = "Prefijo de nombre para los recursos del NLB."
  type        = string
}

variable "vpc_id" {
  description = "VPC donde vive el NLB."
  type        = string
}

variable "subnet_ids" {
  description = "Las private-app subnets."
  type        = list(string)
}

variable "security_group_id" {
  description = "sg_nlb (network/security-groups)."
  type        = string
}

variable "app_port" {
  description = "Puerto de la app backend."
  type        = number
  default     = 3000
}

variable "ec2_instance_id" {
  description = "ID de la instancia EC2 backend a registrar como target."
  type        = string
}

variable "health_check_path" {
  description = "Path HTTP de health check. backend/src/routes/index.js expone GET /health."
  type        = string
  default     = "/health"
}
