# Helper for Jane - AI Image Processing Assistant

A comprehensive web application for AI-powered image analysis and metadata generation, designed for photographers, content creators, and digital asset managers.

## Features

### 🎯 Core Functionality
- **AI Image Analysis**: Automated description and keyword generation using OpenAI GPT-4 Vision
- **Project Management**: Organize images into projects with custom categories and settings
- **Template System**: Create and manage reusable AI prompts with variable substitution
- **Batch Processing**: Queue-based processing system for handling multiple files
- **Advanced Search**: Powerful filtering and search capabilities across all metadata

### 🔧 Technical Features
- **Real-time Queue Monitoring**: Live updates on processing status and progress
- **Multiple Storage Options**: Local storage and Yandex Disk integration
- **Import/Export**: Comprehensive data backup and migration tools
- **Telegram Notifications**: Real-time alerts and status updates
- **Responsive Design**: Modern, mobile-friendly interface

### 🛡️ Enterprise Ready
- **User Authentication**: Secure JWT-based authentication system
- **Role-based Access**: Admin and user role management
- **Activity Logging**: Comprehensive audit trail
- **Rate Limiting**: API protection and usage monitoring
- **Error Handling**: Robust error recovery and retry mechanisms

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Redis server (for queue management)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd helper-for-jane
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp server/.env.example server/.env
   
   # Edit server/.env with your configuration
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run migrate
   npm run seed  # Optional: add demo data
   cd ..
   ```

5. **Start the application**
   ```bash
   # Development mode (starts both frontend and backend)
   npm run dev:full
   
   # Or start separately:
   npm run dev          # Frontend (http://localhost:5173)
   cd server && npm run dev  # Backend (http://localhost:3001)
   ```

## Configuration

### Backend Environment Variables (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/database.sqlite

# Redis (for queue management)
REDIS_URL=redis://localhost:6379

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Yandex Disk (optional)
YANDEX_DISK_TOKEN=your_yandex_disk_token

# Security
JWT_SECRET=your_jwt_secret_key

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

### Frontend Environment Variables (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Helper for Jane
VITE_APP_VERSION=1.0.0
```

## Architecture

### Backend Stack
- **Node.js + Express**: RESTful API server
- **SQLite + better-sqlite3**: Database with WAL mode for performance
- **Bull + Redis**: Queue management for background processing
- **OpenAI API**: GPT-4 Vision for image analysis
- **Sharp**: Image processing and thumbnail generation
- **JWT**: Authentication and authorization

### Frontend Stack
- **React 18 + TypeScript**: Modern React with type safety
- **Tailwind CSS**: Utility-first styling framework
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors

### Key Components

#### Queue System
- Background processing with Bull queues
- Automatic retry with exponential backoff
- Real-time status monitoring
- Concurrent processing limits

#### File Management
- Multi-format image support (JPEG, PNG, WebP, HEIC)
- Automatic thumbnail generation
- Metadata extraction and storage
- Cloud storage integration (Yandex Disk)

#### AI Integration
- OpenAI GPT-4 Vision API integration
- Template-based prompt system
- Variable substitution in prompts
- Token usage tracking and limits

## API Documentation

### Authentication
```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Projects
```bash
# Get all projects
GET /api/projects

# Create project
POST /api/projects
{
  "name": "My Project",
  "description": "Project description",
  "category": "photography",
  "storage": "local"
}

# Update project
PUT /api/projects/:id
{
  "name": "Updated Project Name"
}
```

### Files
```bash
# Upload files
POST /api/files/upload
Content-Type: multipart/form-data
files: [File objects]
projectId: 123

# Get project files
GET /api/files/project/:projectId?page=1&limit=50&status=completed

# Update file metadata
PUT /api/files/:id
{
  "description": "Updated description",
  "keywords": ["keyword1", "keyword2"]
}
```

### Queue Management
```bash
# Get queue status
GET /api/queue/status

# Pause queue
POST /api/queue/pause

# Resume queue
POST /api/queue/resume

# Retry failed files
POST /api/queue/retry
{
  "fileIds": [1, 2, 3]
}
```

## Deployment

### Production Build
```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build application
RUN npm run build:full

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure Redis connection
- Set up SSL certificates
- Configure reverse proxy (nginx)
- Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

## Roadmap

- [ ] Advanced AI models integration (Claude, Gemini)
- [ ] Batch export to Adobe Stock
- [ ] Advanced image editing tools
- [ ] Team collaboration features
- [ ] Mobile application
- [ ] Plugin system for extensibility
```
helpjane
├─ .bolt
│  ├─ config.json
│  └─ prompt
├─ diagnostic.sh
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ README.md
├─ server
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ controllers
│  │  │  ├─ dashboardController.ts
│  │  │  └─ settingsController.ts
│  │  ├─ database
│  │  │  ├─ connection.ts
│  │  │  ├─ migrate.ts
│  │  │  ├─ schema.sql
│  │  │  └─ seed.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.ts
│  │  │  └─ errorHandler.ts
│  │  ├─ models
│  │  │  ├─ ApiUsage.ts
│  │  │  ├─ File.ts
│  │  │  ├─ Project.ts
│  │  │  ├─ Queue.ts
│  │  │  ├─ Settings.ts
│  │  │  └─ User.ts
│  │  ├─ routes
│  │  │  ├─ auth.ts
│  │  │  ├─ dashboard.ts
│  │  │  ├─ files.ts
│  │  │  ├─ notifications.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ queue.ts
│  │  │  ├─ settings.ts
│  │  │  └─ templates.ts
│  │  └─ utils
│  │     ├─ activityLogger.ts
│  │     └─ logger.ts
│  └─ tsconfig.json
├─ setup.sh
├─ src
│  ├─ App.tsx
│  ├─ components
│  │  ├─ ActivityLog.tsx
│  │  ├─ AdvancedFilters.tsx
│  │  ├─ AuthProvider.tsx
│  │  ├─ BulkEditModal.tsx
│  │  ├─ ErrorBoundary.tsx
│  │  ├─ FileEditModal.tsx
│  │  ├─ FileUpload.tsx
│  │  ├─ Header.tsx
│  │  ├─ ImportExportModal.tsx
│  │  ├─ Layout.tsx
│  │  ├─ LoginForm.tsx
│  │  ├─ NotificationCenter.tsx
│  │  ├─ ProjectModal.tsx
│  │  ├─ QueueMonitor.tsx
│  │  ├─ RecentProjects.tsx
│  │  ├─ SearchBar.tsx
│  │  ├─ Sidebar.tsx
│  │  ├─ StatsCard.tsx
│  │  ├─ SystemMonitor.tsx
│  │  └─ TemplateEditor.tsx
│  ├─ hooks
│  │  ├─ useNotifications.ts
│  │  └─ useSearch.ts
│  ├─ index.css
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ Dashboard.tsx
│  │  ├─ ProjectDetail.tsx
│  │  ├─ Projects.tsx
│  │  ├─ Settings.tsx
│  │  └─ Templates.tsx
│  ├─ services
│  │  ├─ api.ts
│  │  └─ queue.ts
│  ├─ store
│  │  └─ useStore.ts
│  ├─ types
│  │  └─ lucide-react.d.ts
│  ├─ utils
│  │  ├─ csvUtils.ts
│  │  ├─ dateUtils.ts
│  │  └─ fileUtils.ts
│  └─ vite-env.d.ts
├─ supabase
│  └─ migrations
│     ├─ 20250703184035_graceful_trail.sql
│     ├─ 20250704011554_late_unit.sql
│     ├─ 20250704012212_sweet_temple.sql
│     └─ schema.sql
├─ tailwind.config.js
├─ tests
│  └─ manual-test-checklist.md
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts

```