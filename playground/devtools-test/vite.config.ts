import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({base: '/__devtools-test_devtools__/',
  build: {
    target: 'esnext',
    sourcemap: 'inline',
    minify: false
  }
})
