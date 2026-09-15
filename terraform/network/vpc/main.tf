

# NAT INSTANCE, Reemplaza NAT Gateway
module "nat_instance" {
  source = "franciscobrioneslavados/nat-instance/aws"

  vpc_id               = "vpc-xxxxxxxxxxxxx"
  public_subnet_ids    = ["subnet-xxxxxxxxxxxxx"]
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  route_table_ids      = ["rtb-app-tier", "rtb-database-tier"]

  project_name  = "my-project"
  environment   = "dev"
  owner_name    = "John Doe"
  instance_type = "t3.micro"
}