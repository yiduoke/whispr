import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" assert { type: "json" };

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        contentScript: "src/contentScript.js",
        background: "src/background.js",
        sidebar: "src/sidebar.html"
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});