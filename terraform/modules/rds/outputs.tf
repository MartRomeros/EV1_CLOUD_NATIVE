output "endpoint" {
  description = "Endpoint de conexión de la instancia RDS."
  value       = aws_db_instance.this.address
}

output "port" {
  description = "Puerto de la instancia RDS."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Nombre de la base de datos."
  value       = aws_db_instance.this.db_name
}

output "username" {
  description = "Usuario maestro de RDS."
  value       = aws_db_instance.this.username
}

output "password" {
  description = "Password maestro (generado si no se pasó por variable)."
  value       = local.password
  sensitive   = true
}
