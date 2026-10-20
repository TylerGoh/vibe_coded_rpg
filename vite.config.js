import { defineConfig } from 'vite';

export default defineConfig({
  // Served publicly at tylergoh.com/rpg/ (nginx → 127.0.0.1:3002), so every URL lives under /rpg/.
  base: '/rpg/',
  // Local dev with hot reloading: http://localhost:3003/rpg/ — run `npm run serve` alongside it
  // for the multiplayer server (the WebSocket is proxied through).
  server: {
    port: 3003,
    strictPort: true,
    proxy: {
      '/rpg/ws': { target: 'ws://127.0.0.1:3002', ws: true },
    },
  },
});
