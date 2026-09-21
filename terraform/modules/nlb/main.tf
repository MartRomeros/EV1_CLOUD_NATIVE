resource "aws_lb" "this" {
  name               = "${var.project}-nlb"
  load_balancer_type = "network"
  internal           = true
  subnets            = var.subnet_ids
  security_groups    = [var.security_group_id]

  tags = {
    Name = "${var.project}-nlb"
  }
}

resource "aws_lb_target_group" "this" {
  name        = "${var.project}-tg-backend"
  port        = var.app_port
  protocol    = "TCP"
  target_type = "instance"
  vpc_id      = var.vpc_id

  health_check {
    protocol = "HTTP"
    path     = var.health_check_path
    port     = tostring(var.app_port)
  }

  tags = {
    Name = "${var.project}-tg-backend"
  }
}

resource "aws_lb_target_group_attachment" "this" {
  target_group_arn = aws_lb_target_group.this.arn
  target_id        = var.ec2_instance_id
  port             = var.app_port
}

resource "aws_lb_listener" "this" {
  load_balancer_arn = aws_lb.this.arn
  port              = var.app_port
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}
