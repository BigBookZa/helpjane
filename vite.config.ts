import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001', // если бекенд на этой же машине
        // если бекенд на другом сервере, поставь IP и порт нужный!
        changeOrigin: true,
        secure: false,
      },
    }
  }
});