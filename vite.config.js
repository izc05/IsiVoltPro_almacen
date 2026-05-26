import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Si vas a desplegar en GitHub Pages, cambia la base por "/isivoltpro-almacen/"
  base: import.meta.env?.GH_PAGES ? '/isivoltpro-almacen/' : './',
  plugins: [
    react(),
    tailwindcss(),
  ],
})

