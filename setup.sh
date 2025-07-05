#!/bin/bash

# Helper for Jane - Automated Setup Script for Ubuntu
# Этот скрипт автоматически настроит и запустит проект

set -e  # Останавливаться при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка прав sudo
check_sudo() {
    if [[ $EUID -eq 0 ]]; then
        error "Не запускайте скрипт от root! Используйте обычного пользователя с sudo правами."
    fi
    
    if ! sudo -n true 2>/dev/null; then
        log "Требуются sudo права для установки системных пакетов"
        sudo -v
    fi
}

# Обновление системы
update_system() {
    log "Обновление списка пакетов..."
    sudo apt update -y
    
    log "Установка базовых пакетов..."
    sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
}

# Установка Node.js
install_nodejs() {
    log "Проверка установки Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
        
        if [[ $MAJOR_VERSION -ge 18 ]]; then
            log "Node.js $NODE_VERSION уже установлен"
            return 0
        else
            warn "Установлена старая версия Node.js ($NODE_VERSION), обновляем..."
        fi
    fi
    
    log "Установка Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    log "Установлена версия Node.js: $(node -v)"
    log "Установлена версия npm: $(npm -v)"
}

# Установка Redis
install_redis() {
    log "Проверка установки Redis..."
    
    if command -v redis-server &> /dev/null; then
        log "Redis уже установлен"
        # Проверяем, запущен ли Redis
        if ! pgrep redis-server > /dev/null; then
            log "Запуск Redis..."
            sudo systemctl start redis-server
            sudo systemctl enable redis-server
        fi
        return 0
    fi
    
    log "Установка Redis..."
    sudo apt install -y redis-server
    
    log "Настройка Redis..."
    # Базовая конфигурация Redis
    sudo sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
    sudo sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    log "Запуск и включение Redis..."
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # Проверка работы Redis
    if redis-cli ping | grep -q "PONG"; then
        log "Redis успешно запущен"
    else
        error "Redis не отвечает на ping"
    fi
}

# Установка PM2 для управления процессами
install_pm2() {
    log "Установка PM2..."
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
        pm2 startup
        log "PM2 установлен. Выполните команду, которую показал PM2 выше (sudo env PATH=...)"
        read -p "Нажмите Enter после выполнения команды PM2 startup..."
    else
        log "PM2 уже установлен"
    fi
}

# Клонирование или обновление проекта
setup_project() {
    PROJECT_DIR="$HOME/helper-for-jane"
    
    if [[ -d "$PROJECT_DIR" ]]; then
        log "Проект уже существует в $PROJECT_DIR"
        read -p "Хотите обновить проект? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Обновление проекта..."
            cd "$PROJECT_DIR"
            git pull origin main || git pull origin master
        fi
    else
        log "Клонирование проекта..."
        read -p "Введите URL репозитория: " REPO_URL
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    
    # Создание директорий
    log "Создание необходимых директорий..."
    mkdir -p uploads data logs
    
    # Установка зависимостей
    log "Установка зависимостей frontend..."
    npm install
    
    log "Установка зависимостей backend..."
    cd server
    npm install
    cd ..
}

# Настройка конфигурации
setup_config() {
    log "Настройка конфигурации..."
    
    # Backend конфигурация
    if [[ ! -f "server/.env" ]]; then
        log "Создание server/.env..."
        cat > server/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/database.sqlite

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Yandex Disk (optional)
YANDEX_DISK_TOKEN=

# Security
JWT_SECRET=$(openssl rand -base64 32)

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Performance
QUEUE_CONCURRENCY=3
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=5000
EOF
    else
        log "server/.env уже существует"
    fi
    
    # Frontend конфигурация
    if [[ ! -f ".env" ]]; then
        log "Создание .env для frontend..."
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Helper for Jane
VITE_APP_VERSION=1.0.0
EOF
    else
        log ".env уже существует"
    fi
}

# Настройка базы данных
setup_database() {
    log "Настройка базы данных..."
    cd server
    
    # Запуск миграций
    if [[ -f "package.json" ]] && npm run | grep -q "migrate"; then
        log "Запуск миграций..."
        npm run migrate
    fi
    
    # Создание базовых данных
    if [[ -f "package.json" ]] && npm run | grep -q "seed"; then
        log "Создание базовых данных..."
        npm run seed
    fi
    
    cd ..
}

# Создание PM2 конфигурации
create_pm2_config() {
    log "Создание PM2 конфигурации..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'helper-jane-backend',
      script: 'server/dist/server.js',
      cwd: '$(pwd)',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log'
    },
    {
      name: 'helper-jane-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '$(pwd)',
      env: {
        NODE_ENV: 'development'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log'
    }
  ]
};
EOF
}

# Сборка проекта
build_project() {
    log "Сборка backend..."
    cd server
    if npm run | grep -q "build"; then
        npm run build
    else
        warn "Backend build script не найден, пропускаем..."
    fi
    cd ..
    
    log "Сборка frontend..."
    if npm run | grep -q "build"; then
        npm run build
    else
        warn "Frontend build script не найден, пропускаем..."
    fi
}

# Создание скриптов для управления
create_management_scripts() {
    log "Создание скриптов управления..."
    
    # Скрипт запуска
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Запуск Helper for Jane..."

# Проверка Redis
if ! pgrep redis-server > /dev/null; then
    echo "⚠️  Redis не запущен, запускаем..."
    sudo systemctl start redis-server
fi

# Проверка базы данных
if [[ ! -f "server/data/database.sqlite" ]]; then
    echo "📂 Создание базы данных..."
    cd server && npm run migrate && cd ..
fi

# Запуск через PM2
pm2 start ecosystem.config.js

echo "✅ Приложение запущено!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "📊 PM2 Dashboard: pm2 monit"
EOF

    # Скрипт остановки
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Остановка Helper for Jane..."
pm2 stop ecosystem.config.js
pm2 delete ecosystem.config.js
echo "✅ Приложение остановлено!"
EOF

    # Скрипт перезапуска
    cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Перезапуск Helper for Jane..."
pm2 restart ecosystem.config.js
echo "✅ Приложение перезапущено!"
EOF

    # Скрипт просмотра логов
    cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 Просмотр логов Helper for Jane..."
pm2 logs
EOF

    # Скрипт для настройки API ключей
    cat > configure.sh << 'EOF'
#!/bin/bash
echo "⚙️  Настройка API ключей..."

read -p "Введите OpenAI API Key: " OPENAI_KEY
read -p "Введите Telegram Bot Token (опционально): " TELEGRAM_TOKEN
read -p "Введите Telegram Chat ID (опционально): " TELEGRAM_CHAT
read -p "Введите Yandex Disk Token (опционально): " YANDEX_TOKEN

# Обновление .env файла
sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" server/.env
sed -i "s/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN/" server/.env
sed -i "s/TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=$TELEGRAM_CHAT/" server/.env
sed -i "s/YANDEX_DISK_TOKEN=.*/YANDEX_DISK_TOKEN=$YANDEX_TOKEN/" server/.env

echo "✅ Конфигурация обновлена!"
echo "🔄 Перезапустите приложение: ./restart.sh"
EOF

    chmod +x start.sh stop.sh restart.sh logs.sh configure.sh
}

# Проверка работоспособности
health_check() {
    log "Проверка работоспособности системы..."
    
    # Проверка Redis
    if redis-cli ping | grep -q "PONG"; then
        log "✅ Redis работает"
    else
        error "❌ Redis не работает"
    fi
    
    # Проверка Node.js
    if command -v node &> /dev/null; then
        log "✅ Node.js $(node -v) установлен"
    else
        error "❌ Node.js не установлен"
    fi
    
    # Проверка PM2
    if command -v pm2 &> /dev/null; then
        log "✅ PM2 установлен"
    else
        error "❌ PM2 не установлен"
    fi
    
    # Проверка портов
    if netstat -tuln | grep -q ":3001 "; then
        warn "⚠️  Порт 3001 уже занят"
    else
        log "✅ Порт 3001 свободен"
    fi
    
    if netstat -tuln | grep -q ":5173 "; then
        warn "⚠️  Порт 5173 уже занят"
    else
        log "✅ Порт 5173 свободен"
    fi
}

# Главная функция
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Helper for Jane                           ║"
    echo "║                Automated Setup Script                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_sudo
    update_system
    install_nodejs
    install_redis
    install_pm2
    setup_project
    setup_config
    setup_database
    create_pm2_config
    build_project
    create_management_scripts
    health_check
    
    echo -e "${GREEN}"
    echo "🎉 Установка завершена!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Настройте API ключи: ./configure.sh"
    echo "2. Запустите приложение: ./start.sh"
    echo "3. Откройте в браузере: http://localhost:5173"
    echo ""
    echo "💡 Полезные команды:"
    echo "   ./start.sh    - Запуск приложения"
    echo "   ./stop.sh     - Остановка приложения"
    echo "   ./restart.sh  - Перезапуск приложения"
    echo "   ./logs.sh     - Просмотр логов"
    echo "   pm2 monit     - Мониторинг процессов"
    echo -e "${NC}"
}

# Запуск главной функции
main "$@"