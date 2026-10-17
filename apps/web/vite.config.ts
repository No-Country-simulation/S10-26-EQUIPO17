import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Inside the dev container "localhost" resolves to ::1, but VS Code port
    // forwarding connects to 127.0.0.1. Bind IPv4 loopback only (not 0.0.0.0).
    host: '127.0.0.1',
  },
})
