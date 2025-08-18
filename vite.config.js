import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server.js'),
      name: 'CashDNRBackend',
      fileName: 'server'
    },
    rollupOptions: {
      external: ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@config': resolve(__dirname, 'src/config'),
      '@controllers': resolve(__dirname, 'src/controllers'),
      '@middleware': resolve(__dirname, 'src/middleware'),
      '@models': resolve(__dirname, 'src/models'),
      '@routes': resolve(__dirname, 'src/routes'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  }
});
