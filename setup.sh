# setup.sh
#!/bin/bash
# Скрипт автоматической установки и запуска Helper for Jane

# Выходим при ошибках и выводим команды (для отладки)
set -e

# Проверка запуска от root
if [ "$EUID" -ne 0 ]; then 
  echo "Пожалуйста, запустите этот скрипт с правами root (sudo)." 
  exit 1
fi

# Определяем внешний IP сервера
EXT_IP="$(curl -fsSL ifconfig.me || curl -fsSL checkip.amazonaws.com || echo '127.0.0.1')"
echo "Внешний IP определён как: $EXT_IP"

# Обновляем список пакетов и выполняем обновление системы
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y

# Устанавливаем необходимые пакеты через APT
# Node.js 18 будет установлен через Nodesource ниже
apt-get install -y curl git build-essential python3 nano net-tools ufw sqlite3 redis-server

# Установка Node.js 18.x через NodeSource:contentReference[oaicite:9]{index=9}
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 
apt-get install -y nodejs 
node -v && npm -v  # вывод версии Node и npm для проверки

# Установка PM2 (менеджер процессов) глобально:contentReference[oaicite:10]{index=10}
npm install -g pm2@latest

# Настройка UFW: открываем SSH (22), фронт (5173), бэк (3001) и включаем фаервол
ufw allow 22/tcp
ufw allow 5173/tcp
ufw allow 3001/tcp
ufw --force enable

# Клонирование репозитория проекта (замените <repository-url> на фактический URL)
if [ -d "helper-for-jane" ]; then
  echo "Директория 'helper-for-jane' уже существует. Удалите или переименуйте её и запустите скрипт снова."
  exit 1
fi
echo "Клонируем проект..."
git clone <repository-url> helper-for-jane
cd helper-for-jane

# Установка зависимостей фронтенда и бэкенда
echo "Устанавливаем зависимости фронтенда..."
npm install --no-fund --no-audit 
echo "Устанавливаем зависимости бэкенда..."
cd server && npm install --no-fund --no-audit && cd ..

# Настройка файлов окружения (.env) для фронта и бэка
echo "Настраиваем .env файлы..."
# Фронтенд .env
if [ -f ".env.example" ]; then
  cp .env.example .env
  # Заменяем базовый URL API на внешний IP и порт бэка
  sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://$EXT_IP:3001/api|g" .env
else
  # Если .env.example нет, создаём файл вручную
  cat > .env <<EOF
VITE_API_BASE_URL=http://$EXT_IP:3001/api
VITE_APP_NAME=Helper for Jane
VITE_APP_VERSION=1.0.0
EOF
fi

# Бэкенд .env
if [ -f "server/.env.example" ]; then
  cp server/.env.example server/.env
else
  # Создаём server/.env, если примера нет (значения по умолчанию, кроме секретов)
  cat > server/.env <<EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/database.sqlite

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Yandex Disk (optional)
YANDEX_DISK_TOKEN=

# Security
JWT_SECRET=

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOF
fi

# Генерируем случайный секрет для JWT, если он присутствует как плейсхолдер
JWT_PLACEHOLDER="your_jwt_secret_key"
if grep -q "JWT_SECRET=$JWT_PLACEHOLDER" server/.env 2>/dev/null; then
  NEW_SECRET=$(od -vN 16 -An -tx1 /dev/urandom | tr -d ' \n')
  sed -i "s/JWT_SECRET=$JWT_PLACEHOLDER/JWT_SECRET=$NEW_SECRET/" server/.env
  echo "JWT секрет сгенерирован автоматически."
fi

# При необходимости, можно здесь автоматически вставить известные API-ключи,
# например: sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=ваш_ключ|g" server/.env
# (По умолчанию ключи оставлены пустыми/примером, чтобы вы заполнили их вручную)

# Запуск миграций базы данных
echo "Выполняем миграции базы данных..."
cd server && npm run migrate && cd ..

# Запуск фронтенда и бэкенда через PM2
echo "Запускаем процессы через PM2..."
# Фронтенд (Vite) – слушаем на 0.0.0.0 для внешнего доступа
pm2 start npm --name frontend --prefix "$(pwd)" -- run dev -- --host 0.0.0.0
# Бэкенд (Node/Express)
pm2 start npm --name backend --prefix "$(pwd)/server" -- run dev

# Сохраняем процессы PM2 и настраиваем автозапуск при старте системы:contentReference[oaicite:11]{index=11}
pm2 save
pm2 startup systemd -u root --hp /root --silent

# Выводим статус процессов
echo "Процессы PM2 запущены:"
pm2 list

# Проверяем открытые порты и доступность сервисов
echo "Проверка доступности сервисов..."
if netstat -tnlp | grep -q ":5173.*LISTEN"; then
  echo "✅ Фронтенд слушает порт 5173."
else
  echo "❌ Фронтенд не слушает порт 5173! Проверьте логи PM2."
fi
if netstat -tnlp | grep -q ":3001.*LISTEN"; then
  echo "✅ Бэкенд слушает порт 3001."
else
  echo "❌ Бэкенд не слушает порт 3001! Проверьте логи PM2."
fi

# Тест локальных запросов к бэкенду (GET /api или /)
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3001/ || true)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Бэкенд отвечает на локальные запросы (HTTP $HTTP_CODE)."
else
  echo "⚠️  Бэкенд не ответил на локальный запрос (HTTP $HTTP_CODE)."
fi

# Завершающее сообщение
echo "Установка и запуск завершены. Откройте в браузере: http://$EXT_IP:5173 (фронтенд) и http://$EXT_IP:3001/api (бекенд API)."
echo "Для проверки запущенных процессов используйте 'pm2 list', для просмотра логов – 'pm2 logs'."
