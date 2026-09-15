terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # En AWS Academy se usa el backend local (terraform.tfstate en disco): la cuenta
  # se recrea cada sesión y no conviene depender de un bucket remoto.
  # Si se habilita un backend S3, crear antes el bucket a mano:
  # backend "s3" {
  #   bucket  = "ev1-terraform-state"
  #   key     = "ev1/terraform.tfstate"
  #   region  = "us-east-1"
  #   encrypt = true
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = local.common_tags
  }
}
