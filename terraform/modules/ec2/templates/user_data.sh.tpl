#!/bin/bash
set -eu

# Reintenta apt-get update: la Instancia NAT puede seguir configurando su
# propio NAT (iptables) unos segundos despues de que Terraform la marco
# como creada (depends_on ordena la creacion, pero no espera al arranque
# interno de la NAT).
apt_update_with_retry() {
  for i in 1 2 3 4 5; do
    apt-get update -y && return 0
    sleep 15
  done
  return 1
}

apt_update_with_retry
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt_update_with_retry
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo apt install postgresql-client -y

groupadd -f docker
usermod -aG docker ubuntu
id -u ssm-user >/dev/null 2>&1 && usermod -aG docker ssm-user
systemctl enable --now docker

docker run -d --name backend --restart unless-stopped \
  -p ${app_port}:${app_port} \
  -e PORT=${app_port} \
  -e POSTGRES_HOST=${db_host} \
  -e POSTGRES_PORT=${db_port} \
  -e POSTGRES_DB=${db_name} \
  -e POSTGRES_USER=${db_username} \
  -e POSTGRES_PASSWORD='${db_password}' \
  ${docker_image}
