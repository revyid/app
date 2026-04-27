import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

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

export default defineConfig({
  plugins: [react(), mobileLogPlugin()],
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
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
