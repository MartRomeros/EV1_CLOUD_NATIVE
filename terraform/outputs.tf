output "account_id" {
  description = "ID de la cuenta AWS activa (cambia en cada sesión de AWS Academy)."
  value       = data.aws_caller_identity.current.account_id
}

output "lab_role_arn" {
  description = "ARN del rol LabRole de AWS Academy."
  value       = data.aws_iam_role.lab_role.arn
}

output "vpc_id" {
  description = "ID de la VPC."
  value       = module.vpc.vpc_id
}

output "ec2_instance_id" {
  description = "ID de la instancia EC2 backend."
  value       = module.ec2.instance_id
}

output "ec2_private_ip" {
  description = "IP privada de la EC2 backend."
  value       = module.ec2.private_ip
}

output "frontend_public_ip" {
  description = "Elastic IP de la EC2 Frontend."
  value       = module.ec2_frontend.public_ip
}

output "frontend_instance_id" {
  description = "ID de la instancia EC2 Frontend."
  value       = module.ec2_frontend.instance_id
}

output "rds_endpoint" {
  description = "Endpoint de conexión de la instancia RDS."
  value       = module.rds.endpoint
}

output "nlb_dns_name" {
  description = "DNS name interno del NLB."
  value       = module.nlb.dns_name
}

output "api_invoke_url" {
  description = "URL de invocación pública de la API."
  value       = module.api_gateway.invoke_url
}
