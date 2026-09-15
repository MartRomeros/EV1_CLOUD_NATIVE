import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Se despliega via FTP en un subdirectorio de cPanel: https://martin-romero.cl/cloud
// https://vite.dev/config/
export default defineConfig({
  base: '/cloud/',
  plugins: [react()],
})
