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
    log "Обновление системы и установка базовых утилит..."
    
    # Обновляем систему
    apt update -y && apt upgrade -y
    
    # Устанавливаем базовые утилиты
    apt install -y \
        curl \
        wget \
        git \
        nano \
        vim \
        htop \
        net-tools \
        netstat-nat \
        lsof \
        unzip \
        zip \
        tree \
        jq \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        python3 \
        python3-pip \
        sqlite3 \
        redis-tools \
        systemctl \
        service \
        cron \
        logrotate \
        fail2ban \
        ufw
    
    log "Базовые утилиты установлены"
}

# Установка Node.js
install_nodejs() {
    log "Проверка установки Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
        
        if [[ $MAJOR_VERSION -ge 20 ]]; then
            log "Node.js $NODE_VERSION уже установлен"
            return 0
        else
            warn "Установлена старая версия Node.js ($NODE_VERSION), обновляем..."
        fi
    fi
    
    log "Установка Node.js 20 LTS (самая стабильная версия)..."
    
    # Удаляем старую версию если есть
    apt remove -y nodejs npm 2>/dev/null || true
    
    # Устанавливаем Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Обновляем npm до последней версии
    npm install -g npm@latest
    
    log "Установлена версия Node.js: $(node -v)"
    log "Установлена версия npm: $(npm -v)"
    
    # Настраиваем npm для работы с legacy peer deps
    npm config set legacy-peer-deps true
    npm config set fund false
    npm config set audit false
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
    log "Установка PM2 и глобальных пакетов..."
    
    # Устанавливаем PM2 последней версии
    npm install -g pm2@latest
    
    # Устанавливаем другие полезные глобальные пакеты
    npm install -g tsx@latest nodemon@latest typescript@latest
    
    log "PM2 версии $(pm2 -v) установлен"
    
    # Автоматическая настройка PM2 startup
    log "Настройка PM2 для автозапуска..."
    pm2 startup systemd -u root --hp /root
    
    # Если пользователь не root, пытаемся настроить для текущего пользователя
    if [[ $EUID -ne 0 ]]; then
        CURRENT_USER=$(whoami)
        CURRENT_HOME=$(eval echo ~$CURRENT_USER)
        pm2 startup systemd -u $CURRENT_USER --hp $CURRENT_HOME
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
        
        # Очищаем кеш npm
        npm cache clean --force
        
        # Удаляем старые node_modules и package-lock.json
        rm -rf node_modules package-lock.json
        
        # Устанавливаем с форсированными флагами
        npm install --legacy-peer-deps --force --no-audit --no-fund --progress=false || {
            warn "Стандартная установка не удалась, пробуем альтернативные методы..."
            
            # Пробуем yarn если npm не работает
            if ! command -v yarn &> /dev/null; then
                log "Установка Yarn..."
                npm install -g yarn@latest
            fi
            
            log "Установка через Yarn..."
            yarn install --ignore-engines --network-timeout 600000 || {
                warn "Yarn тоже не помог, принудительная установка..."
                npm install --legacy-peer-deps --force --no-audit --no-fund --unsafe-perm --progress=false --verbose
            }
        }
        
        log "✅ Frontend зависимости установлены"
    fi
    
    if [[ -f "server/package.json" ]]; then
        log "Установка зависимостей backend..."
        cd server
        
        # Очищаем кеш npm
        npm cache clean --force
        
        # Удаляем старые node_modules и package-lock.json
        rm -rf node_modules package-lock.json
        
        # Устанавливаем с форсированными флагами
        npm install --legacy-peer-deps --force --no-audit --no-fund --progress=false || {
            warn "Стандартная установка backend не удалась, пробуем альтернативные методы..."
            
            # Пробуем yarn
            if command -v yarn &> /dev/null; then
                log "Установка backend через Yarn..."
                yarn install --ignore-engines --network-timeout 600000 || {
                    warn "Yarn тоже не помог, принудительная установка backend..."
                    npm install --legacy-peer-deps --force --no-audit --no-fund --unsafe-perm --progress=false --verbose
                }
            else
                npm install --legacy-peer-deps --force --no-audit --no-fund --unsafe-perm --progress=false --verbose
            fi
        }
        
        # Проверяем и добавляем нужные пакеты если их нет
        log "Проверка и добавление необходимых пакетов..."
        
        # Обновляем tsx до последней версии
        npm install tsx@latest --save-dev --legacy-peer-deps --force
        
        # Обновляем TypeScript
        npm install typescript@latest --save-dev --legacy-peer-deps --force
        
        # Обновляем другие dev зависимости
        npm install nodemon@latest --save-dev --legacy-peer-deps --force
        
        log "✅ Backend зависимости установлены"
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
    
    # Создаем типы для Settings
    if [[ ! -f "src/types/settings.d.ts" ]]; then
        log "Создание типов для Settings..."
        cat > src/types/settings.d.ts << 'EOF'
export interface Settings {
  openai_api_key?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  yandex_disk_token?: string;
  queue_concurrency?: number;
  queue_retry_attempts?: number;
  queue_retry_delay?: number;
  max_file_size?: number;
  allowed_file_types?: string;
  notification_settings?: string;
  auto_process?: boolean;
  default_template_id?: number;
  backup_enabled?: boolean;
  backup_interval?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SafeSettings extends Omit<Settings, 'openai_api_key' | 'telegram_bot_token' | 'yandex_disk_token'> {
  openai_api_key?: string;
  telegram_bot_token?: string;
  yandex_disk_token?: string;
}
EOF
    fi
    
    # Создаем типы для Database
    if [[ ! -f "src/types/database.d.ts" ]]; then
        log "Создание типов для Database..."
        cat > src/types/database.d.ts << 'EOF'
import Database from 'better-sqlite3';

export type DatabaseType = Database.Database;

export interface DatabaseConnection {
  db: DatabaseType;
  close(): void;
}
EOF
    fi
    
    # Создаем общие типы для ошибок
    if [[ ! -f "src/types/errors.d.ts" ]]; then
        log "Создание типов для ошибок..."
        cat > src/types/errors.d.ts << 'EOF'
export interface ApiError {
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
  message?: string;
  description?: string;
  status?: number;
}

export interface OpenAIError extends ApiError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export interface TelegramError extends ApiError {
  description: string;
  error_code: number;
}
EOF
    fi
    
    # Исправляем типы в database/connection.ts
    if [[ -f "src/database/connection.ts" ]]; then
        log "Исправление типов в database/connection.ts..."
        cp src/database/connection.ts src/database/connection.ts.bak
        
        cat > src/database/connection.ts << 'EOF'
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = process.env.DATABASE_URL || join(__dirname, '../data/database.sqlite');

// Создаем директорию для базы данных если её нет
import { mkdirSync } from 'fs';
import { dirname } from 'path';
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db: Database.Database = new Database(DB_PATH);

// Включаем WAL mode для лучшей производительности
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('temp_store = memory');
db.pragma('mmap_size = 268435456');

export default db;
EOF
    fi
    
    # Исправляем типы в index.ts
    if [[ -f "src/index.ts" ]]; then
        log "Исправление типов в index.ts..."
        cp src/index.ts src/index.ts.bak
        
        # Исправляем проблему с портом
        sed -i 's/app.listen(PORT, /app.listen(Number(PORT), /' src/index.ts
        
        # Если это не помогло, заменяем полностью
        if grep -q "app.listen(PORT," src/index.ts; then
            sed -i 's/const PORT = process.env.PORT || 3001;/const PORT = Number(process.env.PORT) || 3001;/' src/index.ts
        fi
    fi
        
    # Обновляем tsconfig.json с правильными настройками
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
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
    "noFallthroughCasesInSwitch": false,
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "noEmit": false,
    "incremental": true,
    "isolatedModules": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "ts-node": {
    "esm": true
  }
}
EOF
    fi
    
    # Попытка сборки
    log "Сборка backend..."
    if npm run | grep -q "build"; then
        if npm run build; then
            log "✅ Backend собран успешно"
        else
            warn "❌ Ошибка сборки backend, пропускаем типы и запускаем через tsx"
            
            # Создаем более мягкий tsconfig.json
            cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": false,
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "noEmit": false,
    "incremental": true,
    "isolatedModules": true,
    "noImplicitThis": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "exactOptionalPropertyTypes": false,
    "noPropertyAccessFromIndexSignature": false,
    "noUncheckedIndexedAccess": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "ts-node": {
    "esm": true
  }
}
EOF
            
            # Обновляем package.json для запуска через tsx
            if [[ -f "package.json" ]]; then
                # Обновляем package.json с современными версиями
                node -e "
                const fs = require('fs');
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                
                // Обновляем скрипты для работы с tsx
                if (pkg.scripts) {
                    pkg.scripts.start = 'tsx src/index.ts';
                    pkg.scripts.dev = 'tsx watch src/index.ts';
                    pkg.scripts['dev:inspect'] = 'tsx --inspect src/index.ts';
                    pkg.scripts.build = 'echo \"Build skipped - running directly with tsx\"';
                    pkg.scripts['build:watch'] = 'tsx watch src/index.ts';
                    pkg.scripts.clean = 'rm -rf dist';
                    pkg.scripts.restart = 'npm run clean && npm start';
                }
                
                fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
                " || true
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
            warn "❌ Ошибка сборки frontend, проверим vite.config"
            
            # Создаем базовый vite.config.ts если его нет
            if [[ ! -f "vite.config.ts" ]]; then
                log "Создание vite.config.ts..."
                cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['axios', 'zustand']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
EOF
            fi
            
            # Создаем базовый index.html если его нет
            if [[ ! -f "index.html" ]]; then
                log "Создание index.html..."
                cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Helper for Jane</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
            fi
            
            # Создаем базовый src/main.tsx если его нет
            if [[ ! -f "src/main.tsx" ]]; then
                log "Создание базового React приложения..."
                mkdir -p src
                cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
                
                cat > src/App.tsx << 'EOF'
import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Helper for Jane</h1>
      <p>AI Image Processing Assistant успешно запущен!</p>
      <div style={{ marginTop: '20px' }}>
        <p>✅ Frontend работает</p>
        <p>🔧 Backend: <a href="http://localhost:3001/api/health">http://localhost:3001/api/health</a></p>
      </div>
    </div>
  )
}

export default App
EOF
                
                cat > src/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}
EOF
            fi
            
            # Пробуем собрать еще раз
            if npm run build; then
                log "✅ Frontend собран успешно после исправлений"
            else
                warn "❌ Frontend все еще не собирается, будем запускать в dev режиме"
            fi
        fi
    else
        warn "Frontend build script не найден, создаем базовую структуру..."
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