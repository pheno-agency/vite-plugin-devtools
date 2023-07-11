import { getBase } from 'vite-plugin-devtools'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({base: getBase('devtools-test'),
  build: {
    target: 'esnext',
    sourcemap: 'inline',
    minify: false
  }
})
