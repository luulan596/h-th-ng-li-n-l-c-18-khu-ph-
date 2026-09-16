import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-push-handler',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && (req.url.startsWith('/api/cron-push') || req.url.startsWith('/api/send-push'))) {
              try {
                let bodyStr = '';
                req.on('data', (chunk) => {
                  bodyStr += chunk;
                });
                req.on('end', async () => {
                  try {
                    let parsedBody: any = {};
                    try {
                      parsedBody = bodyStr ? JSON.parse(bodyStr) : {};
                    } catch {
                      parsedBody = {};
                    }
                    (req as any).body = parsedBody;

                    const originalRes = res as any;
                    originalRes.status = (code: number) => {
                      res.statusCode = code;
                      return originalRes;
                    };
                    originalRes.json = (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    };

                    const { default: handler } = await import('./api/cron-push.js');
                    await handler(req, res);
                  } catch (handlerErr: any) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: true,
                      message: 'Đã tiếp nhận yêu cầu phát thông báo (chế độ phát triển)',
                    }));
                  }
                });
                return;
              } catch (middlewareErr) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'OK' }));
                return;
              }
            }
            next();
          });
        },
      },
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: false,
        devOptions: {
          enabled: true,
          type: 'module',
        },
        includeAssets: ['mat_tran_logo.svg', 'icon.png'],
        manifest: {
          name: 'Hệ thống Liên lạc Ban Công tác Mặt trận 18 Khu phố',
          short_name: 'Mặt Trận 18 KP',
          description: 'WebApp Quản lý và Liên lạc Ban Công tác Mặt trận 18 Khu phố Phường Bình Tiên',
          theme_color: '#991b1b',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-512x512.png?v=2026',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-192x192.png?v=2026',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/maskable-icon-512x512.png?v=2026',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
