#!/bin/bash
set -eu

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
apt-get install -y nginx certbot python3-certbot-nginx

groupadd -f docker
usermod -aG docker ubuntu
id -u ssm-user >/dev/null 2>&1 && usermod -aG docker ssm-user
systemctl enable --now docker

docker run -d --name frontend --restart unless-stopped \
  -p 127.0.0.1:8080:80 \
  ${docker_image}

cat > /etc/nginx/sites-available/frontend <<'NGINX'
server {
    listen 80;
    server_name ${frontend_domain};

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d ${frontend_domain} -m ${certbot_email} \
  --agree-tos --non-interactive --redirect || \
  echo "certbot fallo (DNS todavia no apunta a la EIP?) - reintentar manualmente via SSM" >&2
