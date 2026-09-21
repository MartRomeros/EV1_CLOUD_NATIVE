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

variable "entra_tenant_id" {
  description = "Tenant ID de Microsoft Entra ID usado para construir el issuer del JWT Authorizer. Sin default: debe pasarse explícitamente."
  type        = string
}

variable "entra_audience" {
  description = "Audience(s) esperado en el claim \"aud\" del JWT (client ID o URI de scope de la App Registration). Sin default: debe pasarse explícitamente."
  type        = list(string)
}

variable "cors_allowed_origins" {
  description = "Orígenes permitidos para el frontend (Angular dev server + dominio en producción)."
  type        = list(string)
}
