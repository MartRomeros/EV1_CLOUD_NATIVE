output "instance_id" {
  description = "ID de la instancia EC2 Frontend."
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Elastic IP asociada a la EC2 Frontend."
  value       = aws_eip.this.public_ip
}
