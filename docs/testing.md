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
- Test-only server env vars (never set them live): `TEST_SPAWN=room:x`, `TEST_BOSS_HP=0.05` (den and field bosses), `TEST_GOD=1`,
  `TEST_GROW=60` (crops grow 60× faster), `TEST_PET_FAST=1440` (a pet's full belly lasts 2 min), `TEST_FIELD_RESPAWN_MS=15000` (field bosses come back sooner),
  `TEST_SPEED=10` (the whole game 10× real time, below), `TEST_ACCUSE_FAST=20` (botting accusations' timers 20× shorter), `TEST_PARTY=sprout_king:focus,pulse` (gives that
  boss those S5 party mechanics and switches them on, `partyLive`; several bosses separated by `;`. Two test players
  in the den turn them on: `docs/combat/bosses.md`), `TEST_TP=1` (accepts `{t:'tp', room?, x, vt?}`: room -1 is your own house, `vt` how far into a crossing; send it from the page with
  `slimeville.net.sendNpc(…)` and wait ~200 ms for the next snapshot).
- **Speed tests up with `TEST_SPEED=N`; use `TEST_SPEED=10` by default** (owner, 2026-10-24; drop lower only
  for a test that measurably falls behind) (`src/shared/testspeed.js`): every clock on the server runs N×
  fast (it ticks N×60 times a real second) and a client installs the same from `welcome`, so a headless
  browser keeps up with no change to the test. The game itself doesn't change: still one 1/60 s step per
  tick, cooldowns and boss timers in the same game-ms, so it still tests the real game, just compressed.
  Measured: 4× and 10× both scale walking and ticks exactly. Divide your script's own real-time waits by N
  (and hold keys N× shorter). The `#debug` fps readout reads N× low (it uses the sped-up clock). Up to ~10×
  works on this box; past that the server or a busy browser can fall behind (ticks just stop scaling).
  Date.now runs ahead of real time, so timestamps saved in the test DB (pets, crops) end up in the future:
  use a copy of the DB. **The client's own clock falls behind past ~2×**: `rpg.time` adds the frame's dt, which
  the animation cap holds at 1/30 s, so client-side cooldowns run slow (a headless player attacks and casts far
  less often than at real speed: S5.3's bots fought ~4× slower at 10×) and phase timers the server sends as "ms
  left" (a boss's barrier, weak point, stagger) end early on the client. Measure fight lengths and hit
  prediction at `TEST_SPEED=1`; use high speeds for server-side timing and waiting.
- Several headless players at once need **one browser each** (`launch({ game, cdp: <its own port> })` before each
  `page()`): background tabs stop running their frames. Drive them in-page (a `setInterval` dispatching
  `KeyboardEvent`s on `window`) rather than with `key()`, which only reaches the focused page.
- **Keep browser tests short** anyway: teleport with `TEST_TP` to where the test needs to be and walk only
  the last few px when walking itself is what's tested. Check state with `Runtime.evaluate` instead of
  screenshots where you can; screenshot only what needs eyes.

## Headless browser (CDP)
- `/usr/bin/chromium --headless=new --remote-debugging-port=…`, driven by a small Node script using
  `node_modules/ws`: `Input.dispatchKeyEvent` for keys, `Runtime.evaluate` to read state,
  `Page.captureScreenshot` to look (then Read the PNG). Log in by filling `#name` / `#pass` and clicking `#go`.
- Phones: `Emulation.setDeviceMetricsOverride` (mobile, 844×390) + `setTouchEmulationEnabled` +
  `setEmulatedMedia` pointer: coarse; tap HTML buttons with a dispatched `pointerdown`, the canvas with
  `Input.dispatchTouchEvent`. Always check a phone screenshot for any UI change.
- Voice: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`.
- Programmatic clicks aren't user gestures, so audio contexts stay suspended in tests.
- Frame rate: `#debug` shows fps in the corner and keeps `slimeville.perf`; for an old laptop use
  the DevTools CPU throttling command (Emulation.setCPUThrottlingRate) (`docs/performance.md`).
- Open the game with `#debug` to get `window.slimeville` (`net`, `voice`, `characters`, `museum`, `hall`,
  `piano`, `tutor`, `courseMenu`, `rpg`, `skillTree`, `shop`, `audio`, `slimes`, `mine`, `camX`).
- **`scripts/cdp.mjs`** is the shared helper: `launch({ game: port })`, `page()` per player, then `login(user,
  mobile?)`, `tp(room, x)` (TEST_TP), `key`, `eval`, `shot` (PNGs go to `OUT=<scratch>`), `front()`
  before typing on one of several pages. `wait(ms)` waits game ms (run the script with `SPEED=N` to match
  `TEST_SPEED=N`); `sleep(ms)` is real time. Import it from a scratch script; don't add tests to the repo.

## What a bot can't tell you
Balance, audio and real phones have never been checked by people: see `docs/ideas.md`.
