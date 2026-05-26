import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isGitHubActions = Boolean(globalThis.process?.env?.GITHUB_ACTIONS)

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubActions ? '/IsiVoltPro_almacen/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})

