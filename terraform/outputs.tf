output "ecr_repository_urls" {
  description = "URLs de los repositorios ECR, por clave de repositorio."
  value       = module.ecr.repository_urls
}

output "ecr_repository_arns" {
  description = "ARNs de los repositorios ECR, por clave de repositorio."
  value       = module.ecr.repository_arns
}

output "ecr_repository_names" {
  description = "Nombres de los repositorios ECR, por clave de repositorio."
  value       = module.ecr.repository_names
}

output "account_id" {
  description = "ID de la cuenta AWS activa (cambia en cada sesión de AWS Academy)."
  value       = data.aws_caller_identity.current.account_id
}

output "lab_role_arn" {
  description = "ARN del rol LabRole de AWS Academy."
  value       = data.aws_iam_role.lab_role.arn
}
