import { defineConfig } from 'vite';

// Served publicly at tylergoh.com/rpg/ (nginx → 127.0.0.1:3002), so every URL lives under /rpg/. The dev sandbox
// (docs/sandbox.md) builds the same client with RPG_BASE=/rpg_dev/ (scripts/sandbox-build.mjs); the client finds its
// WebSocket from the base (src/main.js), and the server serves under the same RPG_BASE.
const base = `/${(process.env.RPG_BASE || '/rpg/').replace(/^\/+|\/+$/g, '')}/`;

export default defineConfig({
  base,
  // Local dev with hot reloading: http://localhost:3003/rpg/ — run `npm run serve` alongside it
  // for the multiplayer server (the WebSocket is proxied through). (3003 is also the dev sandbox's port: stop
  // rpg-dev.socket first, or run this with --port.)
  server: {
    port: 3003,
    strictPort: true,
    proxy: {
      [`${base}ws`]: { target: 'ws://127.0.0.1:3002', ws: true },
    },
  },
});
