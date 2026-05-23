import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && /\.(mjs|js|jsx|ts|tsx)$/.test(req.url)) {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      }
      next();
    });
  },
});
