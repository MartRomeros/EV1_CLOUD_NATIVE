data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project}-vpc"
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-igw"
  }
}

# Subredes públicas: alojan la Instancia NAT.
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project}-public-${local.azs[count.index]}"
  }
}

# Subredes privadas de aplicación: EC2 backend + NLB.
resource "aws_subnet" "private_app" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 10 + count.index)
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${var.project}-private-app-${local.azs[count.index]}"
  }
}

# Subredes privadas de datos: RDS (subred distinta de la de EC2 backend).
resource "aws_subnet" "private_data" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 20 + count.index)
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${var.project}-private-data-${local.azs[count.index]}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${var.project}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Sin ruta 0.0.0.0/0 todavía: el módulo nat_instance la agrega apuntando a su ENI.
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-private-app-rt"
  }
}

resource "aws_route_table_association" "private_app" {
  count          = var.az_count
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

resource "aws_route_table" "private_data" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-private-data-rt"
  }
}

resource "aws_route_table_association" "private_data" {
  count          = var.az_count
  subnet_id      = aws_subnet.private_data[count.index].id
  route_table_id = aws_route_table.private_data.id
}

# Instancia NAT (reemplaza a un NAT Gateway administrado), con IDs reales de
# esta misma VPC en vez de los placeholders del borrador original.
#
# Se usa una copia local parcheada en ./vendor/nat-instance (basada en
# franciscobrioneslavados/terraform-aws-nat-instance tag v1.5.1) en vez del
# módulo original por dos motivos:
#   1. El módulo original no está publicado en el Terraform Registry público
#      (registry.terraform.io/v1/modules/franciscobrioneslavados/nat-instance/aws
#      devuelve 404) — solo existe como repo de GitHub.
#   2. El módulo original crea siempre su propio aws_iam_role +
#      aws_iam_instance_profile para dar acceso SSM a la NAT instance, sin
#      ninguna variable para evitarlo — y AWS Academy no otorga el permiso
#      iam:CreateRole (falla con AccessDenied en el apply). La copia local
#      reemplaza esos recursos por var.instance_profile_name, el mismo
#      instance profile de LabRole que ya usan modules/ec2 y
#      modules/ec2-frontend.
module "nat_instance" {
  source = "./vendor/nat-instance"

  vpc_id                 = aws_vpc.main.id
  public_subnet_ids      = aws_subnet.public[*].id
  private_subnet_cidrs   = concat(aws_subnet.private_app[*].cidr_block, aws_subnet.private_data[*].cidr_block)
  route_table_ids        = [aws_route_table.private_app.id, aws_route_table.private_data.id]
  instance_profile_name  = var.instance_profile_name

  project_name  = var.project
  environment   = var.environment
  owner_name    = var.owner_name
  instance_type = var.nat_instance_type
}
