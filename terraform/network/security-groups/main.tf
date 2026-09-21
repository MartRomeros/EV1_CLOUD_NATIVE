# Cadena de Security Groups por referencia (SG-a-SG, no CIDR):
#   sg_vpc_link -> sg_nlb -> sg_ec2 -> sg_rds
# sg_frontend es independiente de esa cadena: es el único punto público
# (80/443) del proyecto. Ningún Security Group de este módulo abre el
# puerto 22 — el acceso administrativo es exclusivamente vía AWS SSM.

resource "aws_security_group" "vpc_link" {
  name        = "${var.project}-sg-vpc-link"
  description = "VPC Link de API Gateway hacia el NLB del backend. Sin ingreso: solo inicia trafico saliente."
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-sg-vpc-link"
  }
}

resource "aws_security_group" "nlb" {
  name        = "${var.project}-sg-nlb"
  description = "NLB interno frente a la EC2 backend. Ingreso solo desde el VPC Link."
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port desde el VPC Link"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc_link.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-sg-nlb"
  }
}

resource "aws_security_group" "ec2" {
  name        = "${var.project}-sg-ec2"
  description = "EC2 backend. Ingreso solo desde el NLB. Sin puerto 22: acceso via AWS SSM."
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port desde el NLB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.nlb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-sg-ec2"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-sg-rds"
  description = "RDS PostgreSQL. Ingreso solo desde la EC2 backend."
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL desde la EC2 backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name = "${var.project}-sg-rds"
  }
}

resource "aws_security_group" "frontend" {
  name        = "${var.project}-sg-frontend"
  description = "EC2 Frontend. Unico punto publico HTTP/HTTPS del proyecto. Sin puerto 22."
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-sg-frontend"
  }
}
