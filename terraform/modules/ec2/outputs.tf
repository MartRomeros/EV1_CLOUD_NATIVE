output "instance_id" {
  description = "ID de la instancia EC2 backend."
  value       = aws_instance.this.id
}

output "private_ip" {
  description = "IP privada de la instancia EC2 backend."
  value       = aws_instance.this.private_ip
}
