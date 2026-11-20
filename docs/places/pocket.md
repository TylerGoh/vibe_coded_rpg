# The pocket world (an experiment, dev sandbox only)

Owner (2026-11-20): "experiment… something akin to minecraft, a pocket dimension world", then "incrementally: a 3d flat
world first, not too many features". It lives on the `dev` branch only (the sandbox at /rpg_dev, `docs/sandbox.md`)
until the owner says it ships. Files: `src/pocket.js` (the scene, the loop, controls, the hotbar), `src/pocket-world.js` (the block grid, `BLOCKS`,
collisions, aiming, meshing: no Three.js or DOM, so it's tested in Node), `POCKET_X` in `src/shared/fair.js` (the way in), the
hooks in `src/main.js` and `src/fair.js`, the sandbox panel's **To the Gathering Fair** button (`src/sandbox.js`,
`server/sandbox.js`: it puts you by the Hall of Mirrors).

## What's in it (step 1, the flat world; step 2, breaking and placing blocks; step 3, the menu and rebindable keys)
- The way in: the Hall of Mirrors' upside-down mirror (`POCKET_X`, the `flip` one) in the Gathering Fair
  (`docs/places/fair.md`). E there: "step through the upside-down mirror".
- A flat field (`World`: `SIZE` × `SIZE` columns, `HEIGHT` tall; grass on top at y = 0, dirt under it, unbreakable
  bedrock at the bottom, `GROUND` rows in all) floating in a pastel sky with fog. Each block is a shade off its
  neighbours for the blocky look. First person: walk, look, jump (`SPEED`, raised in step 2 at the owner's ask; `GRAVITY`,
  `JUMP_V`: a jump clears one block). You collide with blocks (`collide`: the player's box, `PW` × `PH`, one axis at a
  time, in small steps so a fall can't pass through). Walk off the edge and you fall, then you're back in the middle,
  standing on whatever's built there (`topAt`).
- Breaking and placing (step 2): the crosshair's block (`aim`, a grid walk up to `REACH`) gets an outline. Break it, or
  place the hotbar's block on the face you're looking at (never inside your own box: `boxInCell`; never bedrock, which
  is `fixed`). The hotbar (`HOTBAR`): grass, dirt, stone, planks, brick, pink leaves, jelly, sand. Held buttons repeat
  every `ACT_GAP`. A change rebuilds only its chunk (`CHUNK`, and the neighbour when it's on an edge).
- Solo and client-only: no server messages, nobody else in it. What you build lives in the page (`world`, one per tab):
  leave and come back and it's still there, reload and it's gone. Your slime stands still at the mirror meanwhile
  (`inputBits` sends nothing) and the fair keeps running under it.
- Controls (step 3: rebindable, on their own tab). Desktop: click into the world to capture the mouse (a small "Click to
  look around" pill until you do); by default WASD or the arrows walk, Space jumps, Q / left click breaks, E / right
  click places, 1–8 or the wheel pick a block. The keys are `KEY_ACTIONS` rows with `tab: 'pocket'` (`pk_*`), read with
  `keys.of(e, 'pocket')`, saved on the character with the rest, and shown on the Controls page's **Pocket world** tab and
  on the pocket's own controls card. The mouse buttons and the wheel aren't keys and stay as they are.
- Leaving (owner, step 3: the old dark pause card was jarring): Leave is always top right. Esc (the browser takes it to
  let the mouse go) opens a small light menu over the world: Back to the world, Controls (the pocket tab, its own Reset),
  Leave the pocket world. Esc again closes it, back in the world with the "Click to look around" pill (a browser won't
  capture the mouse again from a key straight after an Esc, so a click does that; Back to the world, a click, tries at
  once). Past mistake: the first Esc both let the mouse go (opening the menu) and arrived as a key press a moment later
  (closing it again): an Esc within `ESC_GAP` of the menu opening is ignored. Phones: the left
  thumb is a stick from wherever it lands, the right thumb drags to look and a quick still tap with it (`TAP_MS`, `TAP_PX`)
  breaks or builds at the crosshair, by the Break / Build button; tap a hotbar swatch to pick a block; Jump, Leave.

## How it's drawn
- Three.js (`three` in `package.json` on `dev`), on its own full-window canvas in a fixed overlay over the game, as
  `docs/performance.md` foresaw. It's `import()`ed the first time someone steps in, so it's its own chunk (~190 KB
  gzipped) and the game's bundle doesn't grow. The renderer and scene are built once and kept for the next visit.
- One mesh per chunk, built by `meshChunk`: only faces that touch air, each corner coloured with its face's shade baked in
  (top brightest, bottom darkest, the four sides apart), so a `MeshBasicMaterial` with vertex colours needs no lights.
  (Step 1's instanced boxes went: blocks you can change need a mesh you can rebuild.) While it's open, `frame()` in `src/main.js` skips the game's `render()` (the 2D canvas is hidden anyway).
- No WebGL: the loading card says so, and Leave still works.

## Testing it
Headless Chromium on the Oracle box (ARM, SwiftShader) can't run Three.js: every context is lost at the first draw, with
every ANGLE backend tried (plain WebGL clears work). So the 3D view has only been checked by the owner in a real browser.
Its movement and blocks are plain code, checked in Node (walking at speed, stopping at a block, jumping onto one,
aiming at the right block and face, bedrock staying put, meshing a chunk).

## Next steps (owner decides, one at a time)
- **A mirror in the 3D world as the way out** (owner, 2026-11-20, future work): walk through it to step back into the
  fair, instead of the menu's Leave.
- The owner found the block-building concept less fun than hoped (2026-11-20) and asked to try smoother 3D instead: a
  beach, a palm tree, waves.
Terrain with hills and trees, saving what's built, other players in it, a bigger world.
