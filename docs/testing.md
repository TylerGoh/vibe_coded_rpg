# Testing

## A throwaway server (never the live one on 3002)
```
(set -a; . ~/.config/rpg/deepseek.env; set +a; \
 PORT=3010 DB=<scratch>/test.sqlite DIST=<scratch>/testdist node server/index.js)
npx vite build --outDir <scratch>/testdist --emptyOutDir
DB=<scratch>/test.sqlite node server/accounts.js add walker pw
```
- `DIST` must point at a scratch build: building into `dist/` changes the LIVE site.
- To test with a real-looking character, write a row straight into `rpg_chars` in the test DB (JSON in
  the `data` column: lvl, gear, skills, hotbar…) before logging in.
- Stop it by PID after checking `readlink /proc/<pid>/cwd`. Never `pkill -f "node server/index.js"`.
- Test-only server env vars (never set them live): `TEST_SPAWN=room:x`, `TEST_BOSS_HP=0.05`, `TEST_GOD=1`,
  `TEST_GROW=60` (crops grow 60× faster), `TEST_FIELD_RESPAWN_MS=15000` (field bosses come back sooner),
  `TEST_TP=1` (accepts `{t:'tp', room?, x, vt?}`: room -1 is your own house, `vt` how far into a crossing; send it from the page with
  `slimeville.net.sendNpc(…)` and wait ~200 ms for the next snapshot).
- **Keep browser tests short.** Walking with real key presses runs in real time (the sim is a fixed 60 Hz
  on purpose, so a "faster" test server would stop testing the real game): teleport with `TEST_TP` to
  where the test needs to be and walk only the last few px when walking itself is what's tested. Check
  state with `Runtime.evaluate` instead of screenshots where you can; screenshot only what needs eyes.

## Headless browser (CDP)
- `/usr/bin/chromium --headless=new --remote-debugging-port=…`, driven by a small Node script using
  `node_modules/ws`: `Input.dispatchKeyEvent` for keys, `Runtime.evaluate` to read state,
  `Page.captureScreenshot` to look (then Read the PNG). Log in by filling `#name` / `#pass` and clicking `#go`.
- Phones: `Emulation.setDeviceMetricsOverride` (mobile, 844×390) + `setTouchEmulationEnabled` +
  `setEmulatedMedia` pointer: coarse; tap HTML buttons with a dispatched `pointerdown`, the canvas with
  `Input.dispatchTouchEvent`. Always check a phone screenshot for any UI change.
- Voice: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`.
- Programmatic clicks aren't user gestures, so audio contexts stay suspended in tests.
- Open the game with `#debug` to get `window.slimeville` (`net`, `voice`, `characters`, `museum`, `hall`,
  `piano`, `tutor`, `courseMenu`, `rpg`, `skillTree`, `shop`, `audio`, `slimes`, `mine`, `camX`).
- Past sessions left reusable scripts in their scratchpads (e.g. boutique.mjs, ap.mjs); copying one
  is faster than starting over, but they are not part of the repo.

## What a bot can't tell you
Balance, audio and real phones have never been checked by people: see `docs/ideas.md`.
