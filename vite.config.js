import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where the app's API lives. In dev we proxy the base path to the backend
  // gateway so the browser talks to same-origin `/api` (no CORS).
  const apiBase = env.VITE_API_URL || '/api'
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      // Vite rejects requests whose Host header it doesn't recognize (DNS-rebinding
      // protection) — a Cloudflare quick tunnel's random *.trycloudflare.com hostname
      // would otherwise be blocked. Scoped to that one suffix, not "allow everything".
      allowedHosts: ['.trycloudflare.com'],
      // Only proxy when the API base is a same-origin path (starts with '/').
      ...(apiBase.startsWith('/')
        ? {
            proxy: {
              [apiBase]: {
                target: proxyTarget,
                changeOrigin: true,
                // The backend serves routes at the root (/auth/login, /workspace, ...);
                // /api exists only as the browser-side same-origin base path.
                rewrite: (path) => path.replace(new RegExp(`^${apiBase}`), ''),
              },
            },
          }
        : {}),
    },
  }
})
