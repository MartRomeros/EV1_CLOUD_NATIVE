terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

locals {
  # Repos con política de repositorio explícita (policy_json) y repos a los que
  # se les genera una a partir de access_principal_arns (LabRole en AWS Academy).
  explicit_policies = {
    for k, v in var.repositories : k => v.policy_json
    if v.policy_json != null
  }

  generated_policy_repos = {
    for k, v in var.repositories : k => v
    if v.policy_json == null && length(var.access_principal_arns) > 0
  }
}

resource "aws_ecr_repository" "this" {
  for_each = var.repositories

  name                 = "${var.name_prefix}${each.key}"
  image_tag_mutability = each.value.image_tag_mutability
  force_delete         = each.value.force_delete

  image_scanning_configuration {
    scan_on_push = each.value.scan_on_push
  }

  encryption_configuration {
    encryption_type = each.value.encryption_type
    kms_key         = each.value.encryption_type == "KMS" ? each.value.kms_key : null
  }

  tags = merge(var.tags, each.value.tags, {
    Name = "${var.name_prefix}${each.key}"
  })
}

# Documento de política de ciclo de vida generado solo para los repos que
# activan al menos una regla (expiración de untagged o límite de imágenes).
data "aws_ecr_lifecycle_policy_document" "this" {
  for_each = {
    for k, v in var.repositories : k => v
    if v.untagged_expiry_days > 0 || v.max_image_count > 0
  }

  dynamic "rule" {
    for_each = each.value.untagged_expiry_days > 0 ? [1] : []
    content {
      priority    = 1
      description = "Expira imágenes sin tag tras ${each.value.untagged_expiry_days} días"

      selection {
        tag_status   = "untagged"
        count_type   = "sinceImagePushed"
        count_unit   = "days"
        count_number = each.value.untagged_expiry_days
      }

      action {
        type = "expire"
      }
    }
  }

  dynamic "rule" {
    for_each = each.value.max_image_count > 0 ? [1] : []
    content {
      priority    = 2
      description = "Conserva como máximo ${each.value.max_image_count} imágenes"

      selection {
        tag_status   = "any"
        count_type   = "imageCountMoreThan"
        count_number = each.value.max_image_count
      }

      action {
        type = "expire"
      }
    }
  }
}

resource "aws_ecr_lifecycle_policy" "this" {
  for_each = data.aws_ecr_lifecycle_policy_document.this

  repository = aws_ecr_repository.this[each.key].name
  policy     = each.value.json
}

# Política de repositorio: explícita (policy_json) o generada a partir de
# access_principal_arns (en AWS Academy, el ARN de LabRole).
data "aws_iam_policy_document" "access" {
  for_each = local.generated_policy_repos

  statement {
    sid    = "AllowPushPull"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = var.access_principal_arns
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:ListImages",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetRepositoryPolicy",
    ]
  }
}

resource "aws_ecr_repository_policy" "this" {
  for_each = merge(
    local.explicit_policies,
    { for k, d in data.aws_iam_policy_document.access : k => d.json },
  )

  repository = aws_ecr_repository.this[each.key].name
  policy     = each.value
}
