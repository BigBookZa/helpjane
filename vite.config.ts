import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Слушаем на всех интерфейсах
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    // Настройка для SPA маршрутизации
    historyApiFallback: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    // Для production preview тоже нужна поддержка SPA
    historyApiFallback: true
  }
});