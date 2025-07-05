#!/bin/bash

# Diagnostic Script для Helper for Jane
# Диагностика и исправление типичных проблем

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_redis() {
    echo -e "${BLUE}=== Проверка Redis ===${NC}"
    
    if ! command -v redis-server &> /dev/null; then
        error "Redis не установлен"
        return 1
    fi
    
    if ! pgrep redis-server > /dev/null; then
        warn "Redis не запущен, запускаем..."
        sudo systemctl start redis-server
        sleep 2
    fi
    
    if redis-cli ping | grep -q "PONG"; then
        log "Redis работает корректно"
        
        # Проверка памяти Redis
        REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        log "Использование памяти Redis: $REDIS_MEMORY"
        
        # Проверка количества ключей
        REDIS_KEYS=$(redis-cli dbsize)
        log "Количество ключей в Redis: $REDIS_KEYS"
        
    else
        error "Redis не отвечает на ping"
        echo "Попробуйте:"
        echo "  sudo systemctl restart redis-server"
        echo "  sudo systemctl status redis-server"
        return 1
    fi
}

check_nodejs() {
    echo -e "${BLUE}=== Проверка Node.js ===${NC}"
    
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен"
        return 1
    fi
    
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    
    log "Node.js версия: $NODE_VERSION"
    log "npm версия: $NPM_VERSION"
    
    # Проверка версии Node.js
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [[ $MAJOR_VERSION -lt 18 ]]; then
        error "Требуется Node.js 18+, установлена версия $NODE_VERSION"
        return 1
    fi
    
    # Проверка глобальных пакетов
    if command -v pm2 &> /dev/null; then
        log "PM2 установлен: $(pm2 -v)"
    else
        warn "PM2 не установлен"
    fi
}

check_ports() {
    echo -e "${BLUE}=== Проверка портов ===${NC}"
    
    # Проверка порта 3001 (backend)
    if netstat -tuln | grep -q ":3001 "; then
        warn "Порт 3001 занят:"
        netstat -tuln | grep ":3001 "
        
        # Поиск процесса на порту
        PORT_PROCESS=$(lsof -t -i:3001 2>/dev/null || echo "не найден")
        if [[ "$PORT_PROCESS" != "не найден" ]]; then
            log "Процесс на порту 3001: PID $PORT_PROCESS"
            ps -p $PORT_PROCESS -o pid,ppid,cmd 2>/dev/null || echo "Процесс завершился"
        fi
    else
        log "Порт 3001 свободен"
    fi
    
    # Проверка порта 5173 (frontend)
    if netstat -tuln | grep -q ":5173 "; then
        warn "Порт 5173 занят:"
        netstat -tuln | grep ":5173 "
        
        PORT_PROCESS=$(lsof -t -i:5173 2>/dev/null || echo "не найден")
        if [[ "$PORT_PROCESS" != "не найден" ]]; then
            log "Процесс на порту 5173: PID $PORT_PROCESS"
            ps -p $PORT_PROCESS -o pid,ppid,cmd 2>/dev/null || echo "Процесс завершился"
        fi
    else
        log "Порт 5173 свободен"
    fi
    
    # Проверка порта 6379 (Redis)
    if netstat -tuln | grep -q ":6379 "; then
        log "Redis порт 6379 активен"
    else
        warn "Redis порт 6379 не активен"
    fi
}

check_project_structure() {
    echo -e "${BLUE}=== Проверка структуры проекта ===${NC}"
    
    # Проверка основных файлов
    FILES=(
        "package.json"
        "server/package.json"
        "server/.env"
        ".env"
    )
    
    for file in "${FILES[@]}"; do
        if [[ -f "$file" ]]; then
            log "✅ $file существует"
        else
            error "❌ $file не найден"
        fi
    done
    
    # Проверка директорий
    DIRS=(
        "server"
        "uploads"
        "data"
        "logs"
    )
    
    for dir in "${DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            log "✅ Директория $dir существует"
        else
            warn "⚠️  Директория $dir не найдена"
            mkdir -p "$dir"
            log "📁 Создана директория $dir"
        fi
    done
}

check_database() {
    echo -e "${BLUE}=== Проверка базы данных ===${NC}"
    
    DB_PATH="server/data/database.sqlite"
    
    if [[ -f "$DB_PATH" ]]; then
        log "✅ База данных найдена: $DB_PATH"
        
        # Проверка размера базы данных
        DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
        log "Размер базы данных: $DB_SIZE"
        
        # Проверка доступности SQLite
        if command -v sqlite3 &> /dev/null; then
            TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null || echo "ошибка чтения")
            if [[ "$TABLES" != "ошибка чтения" ]]; then
                log "Таблицы в базе данных: $TABLES"
            else
                warn "Не удалось прочитать таблицы базы данных"
            fi
        else
            warn "sqlite3 не установлен для проверки содержимого БД"
        fi
    else
        warn "❌ База данных не найдена"
        log "Попробуйте создать базу данных:"
        echo "  cd server && npm run migrate"
    fi
}

check_dependencies() {
    echo -e "${BLUE}=== Проверка зависимостей ===${NC}"
    
    # Проверка frontend зависимостей
    if [[ -f "package.json" ]]; then
        log "Проверка frontend зависимостей..."
        if [[ -d "node_modules" ]]; then
            log "✅ Frontend node_modules существует"
        else
            warn "❌ Frontend node_modules не найден"
            echo "  Выполните: npm install"
        fi
    fi
    
    # Проверка backend зависимостей
    if [[ -f "server/package.json" ]]; then
        log "Проверка backend зависимостей..."
        if [[ -d "server/node_modules" ]]; then
            log "✅ Backend node_modules существует"
        else
            warn "❌ Backend node_modules не найден"
            echo "  Выполните: cd server && npm install"
        fi
    fi
}

check_environment() {
    echo -e "${BLUE}=== Проверка переменных окружения ===${NC}"
    
    # Проверка backend .env
    if [[ -f "server/.env" ]]; then
        log "Проверка server/.env..."
        
        # Проверка критических переменных
        if grep -q "OPENAI_API_KEY=your_openai_api_key_here" server/.env; then
            warn "⚠️  OpenAI API ключ не настроен"
        elif grep -q "OPENAI_API_KEY=" server/.env; then
            log "✅ OpenAI API ключ настроен"
        else
            warn "❌ OpenAI API ключ не найден в конфигурации"
        fi
        
        if grep -q "JWT_SECRET=" server/.env; then
            log "✅ JWT_SECRET настроен"
        else
            warn "❌ JWT_SECRET не найден"
        fi
        
        if grep -q "REDIS_URL=" server/.env; then
            log "✅ Redis URL настроен"
        else
            warn "❌ Redis URL не найден"
        fi
    else
        error "❌ server/.env не найден"
    fi
    
    # Проверка frontend .env
    if [[ -f ".env" ]]; then
        log "✅ Frontend .env найден"
    else
        warn "❌ Frontend .env не найден"
    fi
}

check_pm2() {
    echo -e "${BLUE}=== Проверка PM2 ===${NC}"
    
    if ! command -v pm2 &> /dev/null; then
        error "PM2 не установлен"
        return 1
    fi
    
    log "PM2 версия: $(pm2 -v)"
    
    # Статус процессов
    PM2_STATUS=$(pm2 list 2>/dev/null | grep -E "(helper-jane|online|stopped|errored)" || echo "нет процессов")
    
    if [[ "$PM2_STATUS" != "нет процессов" ]]; then
        log "Статус PM2 процессов:"
        pm2 list
    else
        log "PM2 процессы не запущены"
    fi
}

check_system_resources() {
    echo -e "${BLUE}=== Проверка системных ресурсов ===${NC}"
    
    # Проверка памяти
    MEMORY_INFO=$(free -h | grep "Mem:")
    log "Память: $MEMORY_INFO"
    
    # Проверка дискового пространства
    DISK_INFO=$(df -h . | tail -n1)
    log "Дисковое пространство: $DISK_INFO"
    
    # Проверка загрузки CPU
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}')
    log "Загрузка CPU: $CPU_LOAD"
    
    # Проверка количества процессов
    PROCESS_COUNT=$(ps aux | wc -l)
    log "Количество процессов: $PROCESS_COUNT"
}

fix_common_issues() {
    echo -e "${BLUE}=== Исправление типичных проблем ===${NC}"
    
    # Очистка портов
    read -p "Очистить занятые порты 3001 и 5173? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Очистка портов..."
        
        # Остановка процессов на портах
        PORT_3001=$(lsof -t -i:3001 2>/dev/null || echo "")
        PORT_5173=$(lsof -t -i:5173 2>/dev/null || echo "")
        
        if [[ -n "$PORT_3001" ]]; then
            log "Остановка процесса на порту 3001..."
            kill -9 $PORT_3001 2>/dev/null || true
        fi
        
        if [[ -n "$PORT_5173" ]]; then
            log "Остановка процесса на порту 5173..."
            kill -9 $PORT_5173 2>/dev/null || true
        fi
        
        # Остановка PM2 процессов
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        
        sleep 2
        log "Порты очищены"
    fi
    
    # Перезапуск Redis
    read -p "Перезапустить Redis? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Перезапуск Redis..."
        sudo systemctl restart redis-server
        sleep 2
        
        if redis-cli ping | grep -q "PONG"; then
            log "✅ Redis перезапущен успешно"
        else
            error "❌ Не удалось перезапустить Redis"
        fi
    fi
    
    # Переустановка зависимостей
    read -p "Переустановить зависимости? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Переустановка з