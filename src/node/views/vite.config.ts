import { resolve } from "path";
import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "./app.js"),
      name: "view",
      fileName: "view",
      formats: ["es"],
    },
  },
});
