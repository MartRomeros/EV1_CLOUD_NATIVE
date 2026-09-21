locals {
  entra_issuer = "https://login.microsoftonline.com/${var.entra_tenant_id}/v2.0"
}

resource "aws_apigatewayv2_vpc_link" "this" {
  name               = "${var.project}-vpc-link"
  security_group_ids = [var.security_group_id]
  subnet_ids         = var.subnet_ids
}

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allowed_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id             = aws_apigatewayv2_api.this.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.this.id
  integration_uri    = var.nlb_listener_arn
}

resource "aws_apigatewayv2_authorizer" "entra_jwt" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  name             = "${var.project}-entra-jwt-authorizer"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = local.entra_issuer
    audience = var.entra_audience
  }
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "ANY /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.entra_jwt.id
}

# Preflight CORS: "ANY /{proxy+}" también matchea OPTIONS y exige JWT, pero el
# preflight del navegador nunca manda Authorization. Sin esta ruta explícita
# sin auth, el authorizer rechaza el preflight antes de que aplique el
# cors_configuration de la API.
resource "aws_apigatewayv2_route" "proxy_options" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "OPTIONS /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.backend.id}"
  authorization_type = "NONE"
}

# Ruta pública: backend/src/routes/index.js expone GET /health sin auth, y
# terraform/modules/nlb ya lo usa como health check del target group. No
# lleva authorizer_id: queda fuera del JWT_Authorizer a propósito.
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true
}
