import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/sina': {
        target: 'https://hq.sinajs.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sina/, ''),
        headers: {
          'Referer': 'https://finance.sina.com.cn'
        }
      },
      '/api/fund': {
        target: 'https://fundsuggest.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ''),
      },
      '/api/fundgz': {
        target: 'https://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fundgz/, ''),
      },
    },
  },
});