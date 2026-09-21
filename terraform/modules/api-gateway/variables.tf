variable "project" {
  description = "Prefijo de nombre para la API."
  type        = string
}

variable "subnet_ids" {
  description = "Las private-app subnets, donde el VPC Link coloca sus ENIs."
  type        = list(string)
}

variable "security_group_id" {
  description = "sg_vpc_link (network/security-groups)."
  type        = string
}

variable "nlb_listener_arn" {
  description = "ARN del listener del NLB al que apunta la integración."
  type        = string
}
