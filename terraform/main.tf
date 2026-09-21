locals {
  common_tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

module "vpc" {
  source = "./network/vpc"

  project               = var.project
  environment           = var.environment
  owner_name            = var.owner_name
  nat_instance_type     = var.nat_instance_type
  instance_profile_name = var.instance_profile_name
}

module "security_groups" {
  source = "./network/security-groups"

  project  = var.project
  vpc_id   = module.vpc.vpc_id
  app_port = var.app_port
}

module "ec2_frontend" {
  source = "./modules/ec2-frontend"

  project               = var.project
  subnet_id             = module.vpc.public_subnet_ids[0]
  security_group_id     = module.security_groups.frontend_security_group_id
  instance_profile_name = var.instance_profile_name
  instance_type         = var.frontend_instance_type
  docker_image          = var.frontend_docker_image
  frontend_domain       = var.frontend_domain
  certbot_email         = var.certbot_email
}

module "rds" {
  source = "./modules/rds"

  project           = var.project
  subnet_ids        = module.vpc.private_data_subnet_ids
  security_group_id = module.security_groups.rds_security_group_id
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
}

module "ec2" {
  source = "./modules/ec2"

  # depends_on explícito: sin esto, Terraform podría crear esta instancia en
  # paralelo con module.nat_instance (dentro de module.vpc), porque el output
  # private_app_subnet_ids que se usa abajo no referencia al NAT.
  depends_on = [module.vpc]

  project               = var.project
  subnet_id             = module.vpc.private_app_subnet_ids[0]
  security_group_id     = module.security_groups.ec2_security_group_id
  instance_profile_name = var.instance_profile_name
  instance_type         = var.ec2_instance_type
  app_port              = var.app_port
  docker_image          = var.docker_image
  db_host               = module.rds.endpoint
  db_port               = module.rds.port
  db_name               = module.rds.db_name
  db_username           = module.rds.username
  db_password           = module.rds.password
}

module "nlb" {
  source = "./modules/nlb"

  project           = var.project
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_app_subnet_ids
  security_group_id = module.security_groups.nlb_security_group_id
  app_port          = var.app_port
  ec2_instance_id   = module.ec2.instance_id
}

module "api_gateway" {
  source = "./modules/api-gateway"

  project           = var.project
  subnet_ids        = module.vpc.private_app_subnet_ids
  security_group_id = module.security_groups.vpc_link_security_group_id
  nlb_listener_arn  = module.nlb.listener_arn
}
