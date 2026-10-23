# Performance: frame rate on slow machines

The owner's friends play on older laptops, where the game lagged. This doc is what was measured and the
rules that keep art cheap. Files: `src/fastcanvas.js`, `src/glow.js`, `src/gfx.js`, the frame loop and
`resize()` in `src/main.js`.

## What's slow (measured 2026-10, headless Chromium at 6× CPU slowdown standing in for an old laptop)
- Not the game logic: `update()` is ~2 ms a frame even throttled. The cost is drawing, and most of that
  is the browser filling pixels, not our JS. Machines whose GPU is blocklisted draw canvas in software,
  where pixel cost dominates.
- **Pixels scale with resolution.** The canvas renders up to 2 device px per canvas px; at 1080p that's
  ~2M pixels a frame. Rendering at 1× roughly doubles the frame rate on its own.
- **Big gradients were 40–60% of all drawing.** In software, fill cost grows with the number of colour
  stops: a full-screen 4-stop linear gradient ~8 ms, a 2-stop one ~2 ms, a 1px-wide strip of it stretched
  over the screen ~0.5 ms. A 3-stop radial glow costs ~4× a 2-stop one.
- What's left is the 300–1,700 small shapes each room draws every frame (scenery and mobs). That's the
  next lever (below).
- Why not PixiJS/WebGL (owner asked): the art is shapes rebuilt every frame, which WebGL has to rebuild
  too, and a blocklisted GPU runs WebGL in software as well. Stay on Canvas2D, keep authoring art as code,
  and cache what's expensive. A 3D pocket dimension would get Three.js on its own canvas in that room only.

## The fixes in place
- **`fastGradients(ctx)`** (`src/fastcanvas.js`) wraps the game canvas's context. A straight (vertical or
  horizontal) linear gradient that fills a big rect (`MIN_AREA`) is drawn as a cached strip instead,
  clipped to the screen. Art code doesn't change: write gradients as usual. It only covers `fillRect`;
  big gradient *paths* still cost full price, so prefer a `fillRect` (under a clip if needed) for skies and
  washes. A vertical strip is smoothed (the browser's fast path), a horizontal one isn't (it's built at
  device width, so it's exact). Only the main canvas is wrapped.
- **`glow()`** (`src/glow.js`): every soft radial glow, drawn as two 2-stop fills stacked so they match
  the old 3-stop curve exactly. The rooms' own `glow`/`softGlow` helpers call it with their falloff
  (`core`, `at`, `knee`). New glows should use it instead of a hand-made 3-stop radial.
- **Graphics setting** (Esc menu → Graphics; `src/gfx.js`): High renders up to `HIGH_CAP`, Low at `LOW_CAP`
  (1×). **Auto** (the default) starts High and drops to Low for the session after `SLOW_WINDOWS`
  windows of `WINDOW_S` seconds averaging slower than `SLOW_MS` per frame, ignoring the first
  `SETTLE_S` seconds after a load, resize or room change. It never climbs back up by itself. Saved in
  localStorage (`slimeville-gfx`). Phones get it too.
- `#debug` shows the frame rate, render scale and mode in the bottom-right corner, and keeps timings in
  `slimeville.perf` (`n`, `upd`, `ren`, `gap`, `worst`; `reset()`).

## Results (6× slowdown, 1080p; fps before → High → Low)
Village 12 → 18 → 36 · Wildwood 6 → 11 → 20 · Caldera 6 → 8 → 14 · Hour Sanctum 6 → 10 → 17 ·
Mycelium Deep 9 → 14 → 23 · Harbour 18 → 39 → 58. Unthrottled, every room holds 60.

- The Mage's combo states (`src/elements.js`) are flat fills and strokes, a handful of shapes per mob that
  has one, no gradients or glows. Keep it that way: a Starfall can set a whole screen of mobs burning.

## Next, if it's still slow (not done yet)
- **Bake static scenery when a room loads**: draw the parts of a room that don't animate (platforms,
  buildings, far layers) once into canvases at device resolution and copy them 1:1 each frame, like the
  parallax layers in `src/background.js` (`layerCache`). Copy unscaled with smoothing off: a *scaled*
  smoothed `drawImage` is as slow as a gradient in software. Worst rooms first: Caldera, Highlands,
  Citadel, the Wildwood.
- **Bake mob poses**: mobs are ~20% of a busy stage. Each mob type's animation could be drawn into a few
  frames per state and copied, keeping squash/flip as transforms.

## Measuring
The harness from this work: a test server (`docs/testing.md`), headless Chromium with
the DevTools CPU throttling command (Emulation.setCPUThrottlingRate) 4–6 and a 1920×1080 viewport, `TEST_TP` into each room, then read
`slimeville.perf` over a few seconds. To find what's slow inside a frame, wrap the main context's
`fill`/`fillRect`/`stroke`/`drawImage` with a 1-pixel getImageData before and after (it forces the draw to
finish) and group the time by caller, on a build made with `--minify false`.
