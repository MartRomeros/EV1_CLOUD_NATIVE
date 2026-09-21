data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "this" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  iam_instance_profile        = var.instance_profile_name
  associate_public_ip_address = false

  # user_data (no user_data_base64): aws_instance ya codifica en base64 antes
  # de enviarlo a la API de EC2. Pasarle un string ya base64-encodeado acá
  # produciría doble codificación y el cloud-init nunca correría.
  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    docker_image    = var.docker_image
    frontend_domain = var.frontend_domain
    certbot_email   = var.certbot_email
  })

  tags = {
    Name = "${var.project}-ec2-frontend"
  }
}

resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id

  tags = {
    Name = "${var.project}-eip-frontend"
  }
}
