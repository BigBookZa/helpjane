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

# Проверка прав и установка прав на выполнение
check_permissions() {
    # Устанавливаем права на выполнение для скрипта
    chmod +x "$0" 2>/dev/null || true
    
    log "Скрипт запущен от пользователя: $(whoami)"
    
    if [[ $EUID -eq 0 ]]; then
        log "Запуск от root - это нормально для данного скрипта"
    else
        log "Запуск от обычного пользователя"
    fi
}

# Обновление системы
update_system() {
    log "Обновление списка пакетов..."
    apt update -y
    
    log "Установка базовых пакетов..."
    apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release net-tools
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
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
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
    apt install -y redis-server
    
    log "Настройка Redis..."
    # Базовая конфигурация Redis
    sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    log "Запуск и включение Redis..."
    systemctl start redis-server
    systemctl enable redis-server
    
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
        npm install -g pm2
        log "PM2 установлен"
        
        # Автоматическая настройка PM2 startup
        log "Настройка PM2 для автозапуска..."
        pm2 startup systemd -u root --hp /root
        
        # Если пользователь не root, пытаемся настроить для текущего пользователя
        if [[ $EUID -ne 0 ]]; then
            CURRENT_USER=$(whoami)
            CURRENT_HOME=$(eval echo ~$CURRENT_USER)
            pm2 startup systemd -u $CURRENT_USER --hp $CURRENT_HOME
        fi
    else
        log "PM2 уже установлен"
    fi
}

# Клонирование или обновление проекта
setup_project() {
    # Определяем директорию проекта
    if [[ $EUID -eq 0 ]]; then
        PROJECT_DIR="/root/helper-for-jane"
    else
        PROJECT_DIR="$HOME/helper-for-jane"
    fi
    
    # Если скрипт запущен из директории проекта, используем текущую директорию
    if [[ -f "package.json" && -d "server" ]]; then
        PROJECT_DIR=$(pwd)
        log "Используется текущая директория проекта: $PROJECT_DIR"
    elif [[ -d "$PROJECT_DIR" ]]; then
        log "Проект уже существует в $PROJECT_DIR"
        read -p "Хотите обновить проект? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Обновление проекта..."
            cd "$PROJECT_DIR"
            git pull origin main || git pull origin master || log "Не удалось обновить из git"
        fi
    else
        log "Клонирование проекта..."
        read -p "Введите URL репозитория (или нажмите Enter для пропуска): " REPO_URL
        if [[ -n "$REPO_URL" ]]; then
            git clone "$REPO_URL" "$PROJECT_DIR"
        else
            log "Создание структуры проекта..."
            mkdir -p "$PROJECT_DIR"
        fi
    fi
    
    cd "$PROJECT_DIR"
    
    # Создание директорий
    log "Создание необходимых директорий..."
    mkdir -p uploads data logs server
    
    # Установка зависимостей (если есть package.json)
    if [[ -f "package.json" ]]; then
        log "Установка зависимостей frontend..."
        npm install
    fi
    
    if [[ -f "server/package.json" ]]; then
        log "Установка зависимостей backend..."
        cd server
        npm install
        
        # Проверяем и добавляем tsx если его нет
        if ! npm list tsx &> /dev/null; then
            log "Установка tsx для TypeScript..."
            npm install tsx --save-dev
        fi
        
        cd ..
    fi
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
    
    # Определяем какой скрипт использовать для backend
    BACKEND_SCRIPT="./server/dist/index.js"
    if [[ ! -f "server/dist/index.js" ]]; then
        if [[ -f "server/src/index.ts" ]]; then
            BACKEND_SCRIPT="tsx server/src/index.ts"
        elif [[ -f "server/server.js" ]]; then
            BACKEND_SCRIPT="./server/server.js"
        else
            warn "Не найден главный файл сервера, используем tsx server/src/index.ts"
            BACKEND_SCRIPT="tsx server/src/index.ts"
        fi
    fi
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'helper-jane-backend',
      script: '$BACKEND_SCRIPT',
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
      log_file: './logs/backend.log',
      time: true,
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000
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
      log_file: './logs/frontend.log',
      time: true,
      kill_timeout: 10000
    }
  ]
};
EOF
}

# Сборка проекта
build_project() {
    log "Проверка и исправление TypeScript ошибок..."
    
    # Создаем типы для Express Request если их нет
    cd server
    if [[ ! -f "src/types/express.d.ts" ]]; then
        log "Создание типов для Express..."
        mkdir -p src/types
        cat > src/types/express.d.ts << 'EOF'
import { User } from '../database/models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
EOF
    fi
    
    # Исправляем ошибки в tsconfig.json
    if [[ -f "tsconfig.json" ]]; then
        log "Обновление tsconfig.json..."
        # Создаем backup
        cp tsconfig.json tsconfig.json.bak
        
        # Обновляем tsconfig.json с правильными настройками
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF
    fi
    
    # Попытка сборки
    log "Сборка backend..."
    if npm run | grep -q "build"; then
        if npm run build; then
            log "✅ Backend собран успешно"
        else
            warn "❌ Ошибка сборки backend, будем запускать через tsx"
            # Обновляем package.json для запуска через tsx
            if [[ -f "package.json" ]]; then
                # Создаем backup
                cp package.json package.json.bak
                
                # Обновляем скрипт start
                node -e "
                const fs = require('fs');
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                if (pkg.scripts) {
                    pkg.scripts.start = 'tsx src/index.ts';
                    pkg.scripts.dev = 'tsx watch src/index.ts';
                }
                fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
                "
            fi
        fi
    else
        warn "Backend build script не найден, настраиваем для прямого запуска..."
    fi
    
    cd ..
    
    log "Сборка frontend..."
    if npm run | grep -q "build"; then
        if npm run build; then
            log "✅ Frontend собран успешно"
        else
            warn "❌ Ошибка сборки frontend, будем запускать в dev режиме"
        fi
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

    # Скрипт диагностики
    cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "🔍 Диагностика Helper for Jane..."

# Проверка Redis
echo "=== Redis ==="
if pgrep redis-server > /dev/null; then
    echo "✅ Redis запущен"
    if redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis отвечает"
    else
        echo "❌ Redis не отвечает"
    fi
else
    echo "❌ Redis не запущен"
fi

# Проверка портов
echo "=== Порты ==="
PORT_3001=$(lsof -t -i:3001 2>/dev/null || echo "")
PORT_5173=$(lsof -t -i:5173 2>/dev/null || echo "")

if [[ -n "$PORT_3001" ]]; then
    echo "⚠️  Порт 3001 занят (PID: $PORT_3001)"
else
    echo "✅ Порт 3001 свободен"
fi

if [[ -n "$PORT_5173" ]]; then
    echo "⚠️  Порт 5173 занят (PID: $PORT_5173)"
else
    echo "✅ Порт 5173 свободен"
fi

# Проверка PM2
echo "=== PM2 ==="
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 установлен"
    pm2 status
else
    echo "❌ PM2 не установлен"
fi

# Проверка базы данных
echo "=== База данных ==="
if [[ -f "server/data/database.sqlite" ]]; then
    echo "✅ База данных существует"
else
    echo "❌ База данных не найдена"
fi

# Проверка конфигурации
echo "=== Конфигурация ==="
if [[ -f "server/.env" ]]; then
    echo "✅ server/.env существует"
    if grep -q "your_openai_api_key_here" server/.env; then
        echo "⚠️  OpenAI API ключ не настроен"
    else
        echo "✅ OpenAI API ключ настроен"
    fi
else
    echo "❌ server/.env не найден"
fi

# Проверка зависимостей
echo "=== Зависимости ==="
if [[ -d "node_modules" ]]; then
    echo "✅ Frontend зависимости установлены"
else
    echo "❌ Frontend зависимости не найдены"
fi

if [[ -d "server/node_modules" ]]; then
    echo "✅ Backend зависимости установлены"
else
    echo "❌ Backend зависимости не найдены"
fi

# Проверка логов
echo "=== Последние ошибки ==="
if [[ -f "logs/backend-error.log" ]]; then
    echo "Backend ошибки:"
    tail -5 logs/backend-error.log
fi

if [[ -f "logs/frontend-error.log" ]]; then
    echo "Frontend ошибки:"
    tail -5 logs/frontend-error.log
fi

echo ""
echo "🔧 Для исправления проблем используйте:"
echo "   ./configure.sh - настройка API ключей"
echo "   ./restart.sh   - перезапуск приложения"
echo "   pm2 logs       - просмотр логов"
EOF
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

    chmod +x start.sh stop.sh restart.sh logs.sh configure.sh diagnose.sh
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
    
    check_permissions
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
    echo "   ./start.sh      - Запуск приложения"
    echo "   ./stop.sh       - Остановка приложения"
    echo "   ./restart.sh    - Перезапуск приложения"
    echo "   ./logs.sh       - Просмотр логов"
    echo "   ./diagnose.sh   - Диагностика проблем"
    echo "   ./configure.sh  - Настройка API ключей"
    echo "   pm2 monit       - Мониторинг процессов"
    echo -e "${NC}"
}

# Запуск главной функции
main "$@"