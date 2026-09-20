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

module "ecr" {
  source = "./modules/ecr"

  name_prefix           = "${var.project}-"
  repositories          = var.ecr_repositories
  tags                  = local.common_tags
  access_principal_arns = var.ecr_grant_lab_role ? [data.aws_iam_role.lab_role.arn] : []
}
