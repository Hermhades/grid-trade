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
      '/api/fund/f10': {
        target: 'https://fundf10.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => {
          return path.replace(/^\/api\/fund\/f10/, '');
        },
        headers: {
          'Referer': 'https://fund.eastmoney.com',
          'Origin': 'https://fund.eastmoney.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      },
      '/api/fund': {
        target: 'https://fundsuggest.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ''),
        headers: {
          'Referer': 'https://fund.eastmoney.com',
          'Origin': 'https://fund.eastmoney.com'
        }
      },
      '/api/detail': {
        target: 'https://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = '/js' + path.replace('/api/detail', '');
          console.log('Rewriting path:', path, 'to:', newPath);
          return newPath;
        },
        headers: {
          'Referer': 'https://fund.eastmoney.com',
          'Origin': 'https://fund.eastmoney.com',
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'
        }
      },
      '/api/history': {
        target: 'https://api.fund.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/history/, ''),
        headers: {
          'Referer': 'https://fund.eastmoney.com',
          'Origin': 'https://fund.eastmoney.com'
        }
      }
    }
  }
});