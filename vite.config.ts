import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * 本地开发时模拟 Vercel Serverless Functions
 * 将 /api/* 请求转发给 api/ 目录下对应模块处理
 */
function localApiPlugin(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage & { body?: any }, res: ServerResponse, next: Connect.NextFunction) => {
        if (!req.url?.startsWith('/api/')) return next();

        const urlPath = req.url.split('?')[0]; // e.g. /api/divine
        const handlerPath = path.resolve(__dirname, `.${urlPath}.js`);

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const bodyStr = Buffer.concat(chunks).toString();
            const body = bodyStr ? JSON.parse(bodyStr) : {};

            // 构造 Vercel-like 的 req/res 对象
            const mockReq = {
              method: req.method,
              headers: req.headers,
              url: req.url,
              body,
            };

            const mockRes = res as any;
            mockRes.status = (code: number) => { 
                res.statusCode = code; 
                return mockRes; 
            };
            mockRes.setHeader = (name: string, value: string) => {
              res.setHeader(name, value);
              return mockRes;
            };
            mockRes.write = (chunk: any) => {
              res.write(chunk);
              return true;
            };
            mockRes.end = (chunk?: any) => {
              res.end(chunk);
              return mockRes;
            };
            mockRes.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };

            // 动态 require（每次清除缓存确保 hot reload）
            delete require.cache[require.resolve(handlerPath)];
            const handler = require(handlerPath).default;
            await handler(mockReq, mockRes);
          } catch (err) {
            console.error('[local-api] error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Local API Error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        localApiPlugin(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['logo.png'],
          manifest: {
            name: '周易六爻算卦',
            short_name: '卜卦',
            description: '东方极简周易数字起卦系统',
            theme_color: '#080808',
            background_color: '#080808',
            display: 'standalone',
            icons: [
              {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
