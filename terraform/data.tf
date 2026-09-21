# Datos del entorno. En AWS Academy (Learner Lab) la cuenta y las credenciales
# cambian en cada sesión; se resuelven en tiempo de ejecución.
data "aws_caller_identity" "current" {}

# LabRole: único rol disponible en el lab. Se usa como rol de ejecución para
# los servicios que se provisionen (EC2, etc.).
data "aws_iam_role" "lab_role" {
  name = var.lab_role_name
}
