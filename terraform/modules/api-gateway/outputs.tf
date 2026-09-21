output "invoke_url" {
  description = "URL de invocación pública de la API."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  description = "ID de la API."
  value       = aws_apigatewayv2_api.this.id
}

output "authorizer_id" {
  description = "ID del JWT Authorizer (Entra ID) asociado al HTTP API."
  value       = aws_apigatewayv2_authorizer.entra_jwt.id
}
