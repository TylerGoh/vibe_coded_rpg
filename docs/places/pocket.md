# The pocket world (an experiment, dev sandbox only)

Owner (2026-11-20): "experiment… a pocket dimension world". It lives on the `dev` branch only (the sandbox at /rpg_dev,
`docs/sandbox.md`) until the owner says it ships. Files: `src/pocket.js` (the scene, the loop, moving, the camera, the
menu, controls), `src/pocket-beach.js` (the beach: its shapes as maths, and building it), `src/pocket-slime.js` (your
slime in 3D), `POCKET_X` in `src/shared/fair.js` (the way in), the hooks in `src/main.js` and `src/fair.js`, the sandbox
panel's **To the Gathering Fair** button (`src/sandbox.js`, `server/sandbox.js`: it puts you by the Hall of Mirrors).

## How it got here
- Steps 1–3 were a Minecraft-style block world (a flat field, then breaking and placing blocks, then the menu and keys).
  The owner found it less fun than hoped and asked for "real 3D" instead: a beach, a palm tree, waves, your slime in
  third person, replacing the blocks (step 4). The block code is in git history (the pocket world file of blocks, removed in step 4).

## What it is now (step 4: the beach)
- The way in: the Hall of Mirrors' upside-down mirror (`POCKET_X`) in the Gathering Fair (`docs/places/fair.md`). E there:
  "step through the upside-down mirror".
- A beach at sunset: sand rising to low dunes inland, three palm trees (`PALMS`: curved ringed trunks, drooping fronds
  that sway, coconuts) with soft shadows, rocks (`ROCKS`), starfish, a sea of rolling swells with foam on the breakers and
  a lacy foam line that runs up the sand and back (the swash), a pastel sky dome with a low sun, clouds, haze.
- You're your own slime (`makeSlime`: your hue, so it matches your 2D one; shine, eyes, cheeks, smile, leaf) in third
  person. Walk (relative to the camera), jump, wade into the shallows (slower, a little spray), swim out where it's deeper
  than `SWIM_DEPTH` (you float on the swell, bobbing; slower still), jump out of the water, splash. The jelly squashes on
  landing, stretches in the air and wobbles as it walks. The palms and rocks are in the way; the world ends at `WORLD_R`.
- **The shapes are maths** (`groundH`, `waterH`, `shore`), and the water's shader has the same formulas in GLSL
  (`WATER_GLSL`): what you see is what you stand and float on. Change one, change the other.
- Solo and client-only: no server messages, nobody else in it. Your slime stands still at the mirror meanwhile
  (`inputBits` sends nothing) and the fair keeps running under it.

## Controls and leaving
- Desktop: click into the world to capture the mouse (a small "Click to look around" pill until you do); the mouse swings
  the camera round you, the wheel zooms; by default WASD or the arrows walk and Space jumps. The keys are `KEY_ACTIONS`
  rows with `tab: 'pocket'` (`pk_fwd`, `pk_back`, `pk_left`, `pk_right`, `pk_jump`), read with `keys.of(e, 'pocket')`,
  saved on the character with the rest, and shown on the Controls page's **Pocket world** tab and on the pocket's own
  controls card (`docs/ui/keybinds.md`). Phones: the left thumb is a stick from wherever it lands, the right thumb drags
  the camera, a Jump button, Leave.
- Leaving (owner, step 3: the old dark pause card was jarring): Leave is always top right. Esc (the browser takes it to
  let the mouse go) opens a small light menu over the world: Back to the world, Controls (the pocket tab, its own Reset),
  Leave the pocket world. Esc again closes it, back in the world with the "Click to look around" pill (a browser won't
  capture the mouse again from a key straight after an Esc, so a click does that; Back to the world, a click, tries at
  once). Past mistake: the first Esc both let the mouse go (opening the menu) and arrived as a key press a moment later
  (closing it again): an Esc within `ESC_GAP` of the menu opening is ignored.

## How it's drawn
- Three.js (`three` in `package.json` on `dev`), on its own full-window canvas in a fixed overlay over the game, as
  `docs/performance.md` foresaw. It's `import()`ed the first time someone steps in, so it's its own chunk (~190 KB
  gzipped) and the game's bundle doesn't grow. The renderer and scene are built once and kept for the next visit (your
  slime is made again only if your colour changed). While it's open, `frame()` in `src/main.js` skips the game's
  `render()`.
- The sand is a heightfield with vertex colours (dry, wet near the water, tinted under it) and Lambert-ish standard
  shading; the sea is one big plane moved in its vertex shader, with its normal from the same function, a fresnel tint,
  the sun's glitter, and foam from two layers of drifting value noise (a grid of sine blobs looked tiled, so it went);
  it's transparent near the shore and discards itself under the sand, which draws the moving waterline. One sun casts
  soft shadows (its shadow box follows you), a hemisphere light fills. Splashes are one instanced mesh of drops.
- No WebGL: the loading card says so, and Leave still works.

## Testing it
`launch({ gl: true })` in `scripts/cdp.mjs` (`docs/testing.md`) draws it through Mesa's software GL on a virtual display:
slow (about 6 frames a second here, so anything that moves crawls in a test), but the screenshots are real. Headless
Chromium alone can't draw Three.js on this box. Not checked by people yet: how it feels to move and swim, the camera,
phones' frame rate.

## Next steps (owner decides, one at a time)
- **A mirror in the 3D world as the way out** (owner, 2026-11-20, future work): walk through it to step back into the
  fair, instead of the menu's Leave.
- Sound (waves, gulls), things to do on the beach, friends in it.
