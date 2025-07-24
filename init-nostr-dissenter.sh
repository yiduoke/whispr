#!/usr/bin/env zsh
set -e

# ───────────── config ─────────────
PROJECT_NAME="nostr-dissenter-extension"
NPM_INIT_FLAGS="--yes"
# ──────────────────────────────────

echo "▶︎ Creating project folder: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME"/{src/lib,assets,dist}

cd "$PROJECT_NAME"

echo "▶︎ Initialising npm..."
npm init $NPM_INIT_FLAGS >/dev/null

echo "▶︎ Installing dev dependencies..."
npm install -D vite @sveltejs/vite-plugin-svelte @crxjs/vite-plugin svelte nostr-tools

echo "▶︎ Writing placeholder files & folders"

# Root-level skeletons
cat > manifest.json <<'EOF'
{
  "manifest_version": 3,
  "name": "Nostr Dissenter (Svelte)",
  "version": "0.0.0",
  "description": "Decentralized page-level comments via Nostr",
  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "dist/background.js" },
  "content_scripts": [
    { "matches": ["<all_urls>"], "js": ["dist/contentScript.js"], "run_at": "document_idle" }
  ],
  "web_accessible_resources": [
    { "resources": ["dist/sidebar.html","dist/sidebar.js","dist/sidebar.css"], "matches": ["<all_urls>"] }
  ],
  "action": { "default_title": "Nostr Dissenter" }
}
EOF

cat > vite.config.js <<'EOF'
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
      output: { entryFileNames: "[name].js" }
    }
  }
});
EOF

# src placeholders
touch \
  src/contentScript.js \
  src/background.js \
  src/sidebar.html

# Svelte component & helper lib
mkdir -p src/lib
touch src/Sidebar.svelte src/lib/nostr.js

# Default icons dir
mkdir -p assets
# (you can drop icon-16.png, etc. later)

echo "▶︎ Updating package.json scripts"
npx json -I -f package.json -e \
  'this.scripts={dev:"vite",build:"vite build",preview:"vite preview"}'

echo "✅  Project scaffolding complete."
echo "➡︎  Run 'npm run dev' to start HMR server, then load dist/ as unpacked extension."
