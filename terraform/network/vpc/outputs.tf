output "vpc_id" {
  description = "ID de la VPC."
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR de la VPC."
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs de las subredes públicas (alojan la Instancia NAT)."
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs de las subredes privadas de aplicación (EC2 backend, NLB)."
  value       = aws_subnet.private_app[*].id
}

output "private_data_subnet_ids" {
  description = "IDs de las subredes privadas de datos (RDS)."
  value       = aws_subnet.private_data[*].id
}

output "private_app_route_table_id" {
  description = "ID de la tabla de rutas de las subredes privadas de aplicación."
  value       = aws_route_table.private_app.id
}

output "private_data_route_table_id" {
  description = "ID de la tabla de rutas de las subredes privadas de datos."
  value       = aws_route_table.private_data.id
}
