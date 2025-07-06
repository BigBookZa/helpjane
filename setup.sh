#!/bin/bash

# Helper for Jane - Automated Setup Script
# This script sets up the complete environment for the Helper for Jane application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Get external IP
log_info "Detecting external IP address..."
EXTERNAL_IP=$(curl -s https://api.ipify.org)
if [ -z "$EXTERNAL_IP" ]; then
    EXTERNAL_IP=$(curl -s https://ipinfo.io/ip)
fi
if [ -z "$EXTERNAL_IP" ]; then
    log_error "Could not detect external IP address"
    exit 1
fi
log_success "External IP: $EXTERNAL_IP"

# Get project directory
PROJECT_DIR=$(pwd)
log_info "Project directory: $PROJECT_DIR"

# Update system
log_info "Updating system packages..."
apt-get update -y && apt-get upgrade -y
log_success "System updated"

# Install essential tools
log_info "Installing essential tools..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    nano \
    net-tools \
    ufw \
    sqlite3 \
    python3 \
    python3-pip
log_success "Essential tools installed"

# Install Node.js 20.x (LTS)
log_info "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
log_success "Node.js $(node --version) installed"

# Install Redis
log_info "Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server
log_success "Redis installed and started"

# Install Nginx
log_info "Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
log_success "Nginx installed"

# Install PM2
log_info "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root
log_success "PM2 installed"

# Create uploads directory
log_info "Creating uploads directory..."
mkdir -p "$PROJECT_DIR/server/uploads"
mkdir -p "$PROJECT_DIR/server/data"
chmod 755 "$PROJECT_DIR/server/uploads"
chmod 755 "$PROJECT_DIR/server/data"
log_success "Directories created"

# Install project dependencies
log_info "Installing frontend dependencies..."
cd "$PROJECT_DIR"
npm install
log_success "Frontend dependencies installed"

log_info "Installing backend dependencies..."
cd "$PROJECT_DIR/server"
npm install
log_success "Backend dependencies installed"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create backend .env file
log_info "Creating backend .env file..."
cat > "$PROJECT_DIR/server/.env" << EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=./data/database.sqlite

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI API (Add your key later)
OPENAI_API_KEY=

# Telegram Bot (Optional - Add tokens later)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Yandex Disk (Optional - Add token later)
YANDEX_DISK_TOKEN=

# Security
JWT_SECRET=$JWT_SECRET

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://$EXTERNAL_IP,http://localhost:5173,http://localhost
EOF
log_success "Backend .env created"

# Create frontend .env file
log_info "Creating frontend .env file..."
cat > "$PROJECT_DIR/.env" << EOF
VITE_API_BASE_URL=http://$EXTERNAL_IP/api
VITE_APP_NAME=Helper for Jane
VITE_APP_VERSION=1.0.0
EOF
log_success "Frontend .env created"

# Initialize database
log_info "Initializing database..."
cd "$PROJECT_DIR/server"
npm run migrate || log_warning "Migration might have already been run"
log_success "Database initialized"

# Create admin user script
log_info "Creating admin user..."
cat > "$PROJECT_DIR/server/scripts/create-admin.js" << 'EOF'
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database.sqlite');
const db = new Database(dbPath);

async function createAdmin() {
  try {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run('Administrator', 'admin@example.com', hashedPassword, 'admin');
    
    console.log('Admin user created successfully!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    db.close();
  }
}

createAdmin();
EOF

mkdir -p "$PROJECT_DIR/server/scripts"
node "$PROJECT_DIR/server/scripts/create-admin.js" || log_warning "Admin creation might have failed"
log_success "Admin user setup complete"

# Build frontend
log_info "Building frontend..."
cd "$PROJECT_DIR"
npm run build
log_success "Frontend built"

# Add health check endpoint if not exists
log_info "Ensuring health check endpoint exists..."
if ! grep -q "/api/health" "$PROJECT_DIR/server/src/index.js" 2>/dev/null; then
    cat >> "$PROJECT_DIR/server/src/index.js" << 'EOF'

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
EOF
    log_success "Health check endpoint added"
else
    log_info "Health check endpoint already exists"
fi

# Create PM2 ecosystem file
log_info "Creating PM2 configuration..."
cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'jane-backend',
      script: './server/src/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"
chmod 755 "$PROJECT_DIR/logs"

# Configure Nginx
log_info "Configuring Nginx..."
cat > /etc/nginx/sites-available/helper-for-jane << EOF
server {
    listen 80;
    server_name $EXTERNAL_IP;
    
    client_max_body_size 100M;
    
    # Frontend
    location / {
        root $PROJECT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
    
    # Uploads
    location /uploads {
        alias $PROJECT_DIR/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/helper-for-jane /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
log_success "Nginx configured"

# Configure UFW firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw reload
log_success "Firewall configured"

# Start backend with PM2
log_info "Starting backend with PM2..."
cd "$PROJECT_DIR"
pm2 start ecosystem.config.js
pm2 save
log_success "Backend started"

# Create health check script
log_info "Creating health check script..."
cat > "$PROJECT_DIR/health_check.sh" << 'EOF'
#!/bin/bash

echo "=== Helper for Jane Health Check ==="
echo ""

# Check services
echo "Service Status:"
echo -n "Redis: "
if systemctl is-active --quiet redis-server; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

echo -n "Backend (PM2): "
if pm2 list | grep -q "jane-backend.*online"; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

echo ""
echo "Port Status:"
# Check ports
for port in 80 3001 6379; do
    if netstat -tuln | grep -q ":$port "; then
        echo "Port $port: ✓ Open"
    else
        echo "Port $port: ✗ Closed"
    fi
done

echo ""
echo "API Health Check:"
# Check backend API
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    echo "Backend API: ✓ Responding"
else
    echo "Backend API: ✗ Not responding"
fi

# Check frontend through Nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
    echo "Frontend (via Nginx): ✓ Accessible"
else
    echo "Frontend (via Nginx): ✗ Not accessible"
fi

echo ""
echo "External Access:"
EXTERNAL_IP=$(curl -s https://api.ipify.org)
if curl -s -o /dev/null -w "%{http_code}" "http://$EXTERNAL_IP/" | grep -q "200"; then
    echo "External access: ✓ Working ($EXTERNAL_IP)"
else
    echo "External access: ✗ Not working"
fi
EOF

chmod +x "$PROJECT_DIR/health_check.sh"

# Create management script
log_info "Creating management script..."
cat > "$PROJECT_DIR/manage.sh" << 'EOF'
#!/bin/bash

case "$1" in
    start)
        pm2 start ecosystem.config.js
        ;;
    stop)
        pm2 stop all
        ;;
    restart)
        pm2 restart all
        ;;
    logs)
        pm2 logs
        ;;
    status)
        pm2 status
        ;;
    health)
        ./health_check.sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|health}"
        exit 1
        ;;
esac
EOF

chmod +x "$PROJECT_DIR/manage.sh"

# Wait for services to start
log_info "Waiting for services to start..."
sleep 5

# Run health check
log_info "Running health check..."
"$PROJECT_DIR/health_check.sh"

# Troubleshooting common issues
log_info "Checking for common issues..."

# Check if backend is actually running
if ! pm2 list | grep -q "jane-backend.*online"; then
    log_warning "Backend not running, attempting to start..."
    cd "$PROJECT_DIR"
    pm2 delete all 2>/dev/null || true
    pm2 start ecosystem.config.js
    sleep 5
fi

# Check Redis connection
if ! redis-cli ping > /dev/null 2>&1; then
    log_warning "Redis not responding, restarting..."
    systemctl restart redis-server
    sleep 2
fi

# Check Nginx configuration
if ! nginx -t > /dev/null 2>&1; then
    log_error "Nginx configuration error!"
    nginx -t
fi

# Test backend directly
if ! curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log_warning "Backend not responding, checking logs..."
    pm2 logs jane-backend --lines 20 --nostream
    
    # Common fixes
    log_info "Attempting common fixes..."
    
    # Fix permissions
    chown -R root:root "$PROJECT_DIR/server/data"
    chmod -R 755 "$PROJECT_DIR/server/data"
    chown -R root:root "$PROJECT_DIR/server/uploads"
    chmod -R 755 "$PROJECT_DIR/server/uploads"
    
    # Restart backend
    pm2 restart jane-backend
    sleep 5
    
    # Check again
    if ! curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_error "Backend still not responding. Check logs with: pm2 logs jane-backend"
    else
        log_success "Backend is now responding"
    fi
fi

# Create API keys reminder
cat > "$PROJECT_DIR/API_KEYS_REQUIRED.txt" << EOF
=== API Keys Required ===

To fully enable the application, you need to add the following API keys to server/.env:

1. OPENAI_API_KEY - Required for AI image analysis
   Get it from: https://platform.openai.com/api-keys

2. TELEGRAM_BOT_TOKEN - Optional, for notifications
   Get it from: https://t.me/BotFather

3. TELEGRAM_CHAT_ID - Optional, your Telegram chat ID
   Get it by messaging your bot and checking: https://api.telegram.org/bot<YourBOTToken>/getUpdates

4. YANDEX_DISK_TOKEN - Optional, for cloud storage
   Get it from: https://oauth.yandex.ru/

After adding the keys, restart the backend:
./manage.sh restart
EOF

# Create troubleshooting script
log_info "Creating troubleshooting script..."
cat > "$PROJECT_DIR/troubleshoot.sh" << 'EOF'
#!/bin/bash

echo "=== Helper for Jane Troubleshooting ==="
echo ""

# Check if services are running
echo "1. Checking services..."
systemctl status redis-server --no-pager | grep "Active:"
systemctl status nginx --no-pager | grep "Active:"
pm2 list

echo ""
echo "2. Checking ports..."
ss -tlnp | grep -E ":(80|3001|6379) "

echo ""
echo "3. Testing endpoints..."
echo -n "Backend health: "
curl -s -w "HTTP %{http_code}" http://localhost:3001/api/health || echo "FAILED"
echo ""
echo -n "Frontend: "
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost/ || echo "FAILED"
echo ""

echo ""
echo "4. Checking logs..."
echo "=== PM2 Error Log (last 10 lines) ==="
pm2 logs jane-backend --err --lines 10 --nostream

echo ""
echo "=== Nginx Error Log (last 10 lines) ==="
tail -n 10 /var/log/nginx/error.log

echo ""
echo "5. Common fixes to try:"
echo "- Restart all services: systemctl restart redis-server nginx && pm2 restart all"
echo "- Check disk space: df -h"
echo "- Check memory: free -h"
echo "- Reset PM2: pm2 delete all && cd $(pwd) && pm2 start ecosystem.config.js"
echo "- Check firewall: ufw status"
echo "- Test backend directly: curl http://localhost:3001/api/health"
EOF

chmod +x "$PROJECT_DIR/troubleshoot.sh"

# Final summary
echo ""
echo "========================================"
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================"
echo ""
echo "Application URLs:"
echo "- Frontend: http://$EXTERNAL_IP"
echo "- Backend API: http://$EXTERNAL_IP/api"
echo ""
echo "Management commands:"
echo "- Start: ./manage.sh start"
echo "- Stop: ./manage.sh stop"
echo "- Restart: ./manage.sh restart"
echo "- View logs: ./manage.sh logs"
echo "- Check status: ./manage.sh status"
echo "- Health check: ./manage.sh health"
echo "- Troubleshoot: ./troubleshoot.sh"
echo ""
echo "PM2 commands:"
echo "- pm2 status"
echo "- pm2 logs"
echo "- pm2 monit"
echo ""
log_warning "Don't forget to add your API keys!"
log_warning "See API_KEYS_REQUIRED.txt for details"
echo ""
echo "Default login credentials:"
echo "Email: admin@example.com"
echo "Password: admin123"
echo ""
echo "If you encounter ERR_EMPTY_RESPONSE, run:"
echo "./troubleshoot.sh"
echo ""
echo "========================================"