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
    app_port     = var.app_port
    docker_image = var.docker_image
    db_host      = var.db_host
    db_port      = var.db_port
    db_name      = var.db_name
    db_username  = var.db_username
    db_password  = var.db_password
  })

  tags = {
    Name = "${var.project}-ec2-backend"
  }
}
