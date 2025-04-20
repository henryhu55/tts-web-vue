import { join } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": join(__dirname, "./src"),
      "@components": join(__dirname, "./src/components"),
    },
  },
  plugins: [
    vue(),
  ],
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  }
});
