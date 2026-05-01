import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin, type Connect } from "vite"
import type { IncomingMessage, ServerResponse } from "http"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── API Dev Plugin ───────────────────────────────────────────────────
// Runs Vercel Edge Function handlers locally during `pnpm dev`.
// Intercepts /api/* requests, loads the .ts handler via Vite's SSR
// module system, and executes it with the standard Request/Response API.
function apiDevPlugin(): Plugin {
  let envLoaded = false;

  return {
    name: 'api-dev',
    configureServer(server) {
      // Load .env into process.env once (for API route access)
      if (!envLoaded) {
        const envPath = path.resolve(__dirname, '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const value = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = value;
          }
          console.log('\x1b[36m[api-dev]\x1b[0m Loaded .env for API routes');
        }
        envLoaded = true;
      }
      server.middlewares.use(async (
        req: Connect.IncomingMessage,
        res: ServerResponse<IncomingMessage>,
        next: Connect.NextFunction
      ) => {
        if (!req.url?.startsWith('/api/')) return next();

        try {
          // Parse the incoming URL
          const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);

          // Map URL → file path: /api/auth/github → api/auth/github.ts
          const routePath = fullUrl.pathname.slice(1); // remove leading /
          let filePath = path.resolve(__dirname, routePath + '.ts');

          if (!fs.existsSync(filePath)) {
            filePath = path.resolve(__dirname, routePath, 'index.ts');
            if (!fs.existsSync(filePath)) {
              return next();
            }
          }

          // Read request body for POST/PUT
          let body: string | undefined;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await new Promise<string>((resolve) => {
              let data = '';
              req.on('data', (chunk: Buffer) => data += chunk);
              req.on('end', () => resolve(data));
            });
          }

          // Build standard Request object (same API as Vercel Edge)
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
          // Simulate Vercel's IP detection headers for local dev
          if (!headers.has('x-forwarded-for')) {
            headers.set('x-forwarded-for', '127.0.0.1');
          }

          const request = new Request(fullUrl.toString(), {
            method: req.method || 'GET',
            headers,
            body: body || undefined,
          });

          // Load the handler via Vite's SSR module loader (handles TS transpilation)
          const mod = await server.ssrLoadModule(filePath);
          const handler = mod.default;

          if (typeof handler !== 'function') {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Handler not found in ' + routePath }));
            return;
          }

          // Execute handler
          const response: Response = await handler(request);

          // Send the Response back
          res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
          const responseBody = await response.text();
          res.end(responseBody);
        } catch (err: any) {
          console.error('\x1b[31m[api-dev]\x1b[0m', err.message || err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dev API error: ' + (err.message || 'Unknown') }));
        }
      });
    },
  }
}

// ─── Mobile Log Plugin ────────────────────────────────────────────────
// Pipes browser console.* to terminal for mobile debugging.
function mobileLogPlugin(): Plugin {
  return {
    name: 'mobile-log',
    configureServer(server) {
      server.middlewares.use('/__log', (req, res) => {
        let body = ''
        req.on('data', (chunk: Buffer) => body += chunk)
        req.on('end', () => {
          try {
            const { level, args } = JSON.parse(body)
            const prefix = `\x1b[35m[mobile:${level}]\x1b[0m`
            console.log(prefix, ...args)
          } catch {}
          res.writeHead(204)
          res.end()
        })
      })
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend' as const,
          children: `
            (function() {
              const _log = (level, args) => {
                const serialized = args.map(a => {
                  try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
                })
                fetch('/__log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ level, args: serialized }) }).catch(() => {})
              }
              ;['log','warn','error','info'].forEach(lvl => {
                const orig = console[lvl].bind(console)
                console[lvl] = (...args) => { orig(...args); _log(lvl, args) }
              })
            })()
          `,
        },
      ]
    },
  }
}

// ─── Vite Config ──────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react(), apiDevPlugin(), mobileLogPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ['.trycloudflare.com', 'dev.revy.my.id'],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
