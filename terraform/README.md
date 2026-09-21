# IAC Para EV1 de Cloud Native

Infraestructura AWS para el proyecto, pensada para **AWS Academy (Learner
Lab)**: credenciales temporales, un único rol IAM disponible (`LabRole`),
backend de estado local, y la cuenta se recrea entre sesiones.

## Módulos

- `network/vpc`: VPC de 2 AZs, 6 subredes (2 públicas, 2 privadas de
  aplicación, 2 privadas de datos), tablas de rutas, e Instancia NAT dando
  salida a internet a las subredes privadas. La Instancia NAT usa una copia
  local parcheada (`network/vpc/vendor/nat-instance/`, basada en
  `franciscobrioneslavados/terraform-aws-nat-instance` tag `v1.5.1`) en vez
  del módulo remoto: el original no está publicado en el Terraform Registry
  y además crea su propio IAM Role para SSM, algo que AWS Academy no
  permite (`iam:CreateRole` denegado) — la copia local reusa el instance
  profile de `LabRole` en su lugar.
- `network/security-groups`: los 5 Security Groups del proyecto, encadenados
  por referencia (`sg_vpc_link -> sg_nlb -> sg_ec2 -> sg_rds`) más
  `sg_frontend` (único punto público, HTTP/HTTPS). Ninguno abre el puerto
  22 — el acceso administrativo es exclusivamente vía AWS SSM.
- `modules/rds`: instancia RDS PostgreSQL 15 en subred privada de datos, sin
  acceso público.
- `modules/ec2`: instancia EC2 backend en subred privada de aplicación,
  corre el contenedor de `backend/` vía Docker.
- `modules/ec2-frontend`: instancia EC2 en subred pública con Elastic IP,
  corre el contenedor del frontend detrás de un nginx del sistema operativo
  que gestiona TLS con Certbot.
- `modules/nlb`: Network Load Balancer interno frente a la EC2 backend.
- `modules/api-gateway`: API Gateway HTTP (v2) público, conectado al NLB
  mediante VPC Link.

Orden real de aplicación (Terraform ya lo infiere del grafo de
dependencias): `vpc -> security_groups -> {ec2_frontend, rds/ec2} -> nlb ->
api_gateway`. El único `depends_on` explícito es `module.ec2` sobre
`module.vpc`, para garantizar que la Instancia NAT ya exista antes de que la
EC2 backend arranque su script de `user_data` (necesita salida a internet
para instalar Docker).

## Antes del primer `apply`

1. Verificar en la consola de AWS Academy que existe un instance profile
   asociado a `LabRole` (variable `instance_profile_name`) y que `LabRole`
   tiene adjunta una policy equivalente a `AmazonSSMManagedInstanceCore` —
   sin ella, `aws ssm start-session` no va a poder conectarse a ninguna EC2
   (no hay acceso SSH de respaldo).
2. Configurar el registro DNS (A) de `frontend_domain` apuntando a la
   Elastic IP que va a asignarse a la EC2 Frontend, **antes** de aplicar por
   primera vez — si no, `certbot --nginx` va a fallar el challenge HTTP-01
   en el primer arranque (no bloquea el resto de la instancia; se puede
   reintentar manualmente después vía SSM).
3. Completar en `terraform.tfvars` (copiado de `terraform.tfvars.example`)
   las variables sin valor por defecto: `owner_name`,
   `instance_profile_name`, `docker_image`, `frontend_docker_image`,
   `frontend_domain`, `certbot_email`.

## Comandos

```bash
cd terraform
terraform init
terraform validate
terraform plan  -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Si `terraform plan` sobre una cuenta de AWS Academy recién recreada muestra
que quiere recrear *todo* desde cero, el `terraform.tfstate` local queda
desincronizado de una sesión anterior — borrarlo y volver a `apply` suele
ser más rápido que reconciliar.