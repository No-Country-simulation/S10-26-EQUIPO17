import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"; 
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Inside the dev container "localhost" resolves to ::1, but VS Code port
    // forwarding connects to 127.0.0.1. Bind IPv4 loopback only (not 0.0.0.0).
    host: "127.0.0.1",
    // The browser calls /api on Vite's own origin and Vite forwards it to the API, mirroring the
    // Vercel rewrite in production. Same origin means the session cookies are first-party and the
    // API needs no CORS. See apps/api/README.md#proxy-la-web-y-la-api-en-el-mismo-origen.
    proxy: {
      "/api": "http://127.0.0.1:3000",
    },
  },
});
