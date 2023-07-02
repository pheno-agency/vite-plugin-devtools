import { resolve } from "path";
import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue'

console.log('here')
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "./app.js"),
      name: "view",
      // the proper extensions will be added
      fileName: "view",
      formats: ["es"],
    },
  },
});
