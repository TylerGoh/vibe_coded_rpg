# The pocket world (an experiment, dev sandbox only)

Owner (2026-11-20): "experiment… something akin to minecraft, a pocket dimension world", then "incrementally: a 3d flat
world first, not too many features". It lives on the `dev` branch only (the sandbox at /rpg_dev, `docs/sandbox.md`)
until the owner says it ships. Files: `src/pocket.js` (everything), `POCKET_X` in `src/shared/fair.js` (the way in), the
hooks in `src/main.js` and `src/fair.js`, the sandbox panel's **To the Gathering Fair** button (`src/sandbox.js`,
`server/sandbox.js`: it puts you by the Hall of Mirrors).

## What step 1 is
- The way in: the Hall of Mirrors' upside-down mirror (`POCKET_X`, the `flip` one) in the Gathering Fair
  (`docs/places/fair.md`). E there: "step through the upside-down mirror".
- A flat field of grass blocks (`SIZE` × `SIZE`, each block a shade off its neighbours for the blocky look; `DEPTH` dirt
  layers showing at the edges) floating in a pastel sky with fog. First person: walk, look, jump (`SPEED`, `GRAVITY`,
  `JUMP_V`: a jump clears one block, ready for later steps). Walk off the edge and you fall, then you're back in the middle.
- Solo and client-only: no server messages, nobody else in it, nothing saved. Your slime stands still at the mirror
  meanwhile (`inputBits` sends nothing) and the fair keeps running under it.
- Controls. Desktop: click to capture the mouse, WASD or the arrows walk, the mouse looks, Space jumps; Esc lets the
  mouse go (the browser takes that Esc) and shows the pause card, a second Esc or Leave goes back. These keys are fixed,
  not `KEY_ACTIONS` (first-person movement is its own scheme, like the waystone card's number keys). Phones: the left
  thumb is a stick from wherever it lands, the right thumb drags to look, a Jump button, Leave top-right.

## How it's drawn
- Three.js (`three` in `package.json` on `dev`), on its own full-window canvas in a fixed overlay over the game, as
  `docs/performance.md` foresaw. It's `import()`ed the first time someone steps in, so it's its own chunk (~190 KB
  gzipped) and the game's bundle doesn't grow. The renderer and scene are built once and kept for the next visit.
- Two `InstancedMesh`es of unit boxes (grass, edge dirt) with per-instance colours, Lambert materials, a hemisphere light
  and a sun. While it's open, `frame()` in `src/main.js` skips the game's `render()` (the 2D canvas is hidden anyway).
- No WebGL: the loading card says so, and Leave still works.

## Testing it
Headless Chromium on the Oracle box (ARM, SwiftShader) can't run Three.js: every context is lost at the first draw, with
every ANGLE backend tried (plain WebGL clears work). So the 3D view has only been checked by the owner in a real browser.
Its movement is plain code, checked in Node (walking, the jump's height, falling off and coming back).

## Next steps (owner decides, one at a time)
Placing and breaking blocks, terrain with hills and trees, saving what's built, other players in it.
