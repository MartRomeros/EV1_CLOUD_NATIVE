output "vpc_link_security_group_id" {
  description = "SG del VPC Link de API Gateway."
  value       = aws_security_group.vpc_link.id
}

output "nlb_security_group_id" {
  description = "SG del NLB interno."
  value       = aws_security_group.nlb.id
}

output "ec2_security_group_id" {
  description = "SG de la EC2 backend."
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "SG de la instancia RDS."
  value       = aws_security_group.rds.id
}

output "frontend_security_group_id" {
  description = "SG de la EC2 Frontend."
  value       = aws_security_group.frontend.id
}
