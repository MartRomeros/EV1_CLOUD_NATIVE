output "nlb_arn" {
  description = "ARN del NLB."
  value       = aws_lb.this.arn
}

output "listener_arn" {
  description = "ARN del listener del NLB (integración de API Gateway)."
  value       = aws_lb_listener.this.arn
}

output "dns_name" {
  description = "DNS name interno del NLB."
  value       = aws_lb.this.dns_name
}
