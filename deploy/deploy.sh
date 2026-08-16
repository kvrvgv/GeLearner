#!/usr/bin/env bash
# Идемпотентный деплой GeLerner. Запускается на сервере (в APP_DIR) после того,
# как свежий код уже синхронизирован туда (см. .github/workflows/deploy.yml).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIST="$APP_DIR/frontend/dist"
DOMAIN="ge.zlgvpn.org"
SERVICE_NAME="gelerner"
APP_PORT="8731"
CERTBOT_EMAIL="artemkurganovstreet2@gmail.com"
ENV_FILE="$BACKEND_DIR/.env"

echo "==> [1/6] Python venv и зависимости"
cd "$BACKEND_DIR"
python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "==> [2/6] .env (создаётся один раз, дальше не трогаем)"
if [ ! -f "$ENV_FILE" ]; then
  SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
  cat > "$ENV_FILE" <<EOF
DJANGO_SECRET_KEY=$SECRET
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=$DOMAIN
DJANGO_CSRF_TRUSTED_ORIGINS=https://$DOMAIN
EOF
  echo "Создан новый $ENV_FILE"
fi

echo "==> [3/6] Миграции, сид данных, статика"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
python manage.py migrate --noinput
python manage.py seed_data
python manage.py collectstatic --noinput
deactivate

echo "==> [4/6] systemd-сервис ($SERVICE_NAME)"
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<EOF
[Unit]
Description=GeLerner Django (gunicorn)
After=network.target

[Service]
User=deploy
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$BACKEND_DIR/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:$APP_PORT --workers 3
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME" > /dev/null
sudo systemctl restart "$SERVICE_NAME"

echo "==> [5/6] nginx: $DOMAIN"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
sudo mkdir -p /var/www/certbot
sudo tee "$NGINX_CONF" > /dev/null <<EOF
upstream ${SERVICE_NAME}_upstream {
    server 127.0.0.1:$APP_PORT fail_timeout=0;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
    }

    location /api/ {
        proxy_pass http://${SERVICE_NAME}_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://${SERVICE_NAME}_upstream;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        root $FRONTEND_DIST;
        try_files \$uri /index.html;
    }
}
EOF

sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
sudo nginx -t
sudo systemctl reload nginx

echo "==> [6/6] TLS-сертификат"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "Сертификат для $DOMAIN уже есть, пропускаем certbot"
fi

echo "==> Готово: https://$DOMAIN"
