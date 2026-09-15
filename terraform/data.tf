# Datos del entorno. En AWS Academy (Learner Lab) la cuenta y las credenciales
# cambian en cada sesión; se resuelven en tiempo de ejecución.
data "aws_caller_identity" "current" {}

# LabRole: único rol disponible en el lab. Se usa como principal en las
# políticas de repositorio de ECR y como rol de ejecución para otros servicios.
data "aws_iam_role" "lab_role" {
  name = var.lab_role_name
}
