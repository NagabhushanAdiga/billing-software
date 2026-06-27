import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { scanRelayPlugin } from './plugins/scanRelay.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), scanRelayPlugin()],
})
