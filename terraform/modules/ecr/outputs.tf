output "repository_urls" {
  description = "URL de cada repositorio (<registry>/<name>), por clave."
  value       = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

output "repository_arns" {
  description = "ARN de cada repositorio, por clave."
  value       = { for k, r in aws_ecr_repository.this : k => r.arn }
}

output "repository_names" {
  description = "Nombre real en AWS de cada repositorio, por clave."
  value       = { for k, r in aws_ecr_repository.this : k => r.name }
}

output "registry_ids" {
  description = "ID de registro (cuenta AWS) de cada repositorio, por clave."
  value       = { for k, r in aws_ecr_repository.this : k => r.registry_id }
}
