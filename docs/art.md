# Art: slimes, accessories, scenery

- Everything is procedural canvas drawing, in the soft, rounded, pastel style inherited from Slime Hop.
  No image assets, and no emoji in canvas text (they render as boxes without emoji fonts).
- `src/slime.js`: the slime body (a jelly spring; keep animation dt capped, see `docs/netcode.md`), faces,
  name tags, and every accessory and helmet/sword drawing. `Slime.setLook()` combines worn gear and
  the Boutique cosmetics a player wears. Players get no free name-keyed accessories any more (owner's
  call): everyone buys them in the Boutique; NPCs set `accessories` directly.
- `src/village.js`: village scenery and the `text()` helper used across the HUD. `background.js`,
  `environment.js`, `particles.js` and `util.js` came from Slime Hop.
- Each room or stage draws itself in its own file (named in its doc). Stage files paint their own sky,
  and every outdoor sky (the east cliffs too) also calls `drawDistantIslands` (`src/distant.js`, `docs/places/harbour.md`) so the
  other islands show far off in their compass direction. A new outdoor room must call it too.
- Keep art cheap on slow machines (`docs/performance.md`): soft glows go through `glow()` in
  `src/glow.js`; big gradient fills should be `fillRect`s (which the game canvas draws as cached strips).
- A new AI character or friend accessory needs its drawing in `src/slime.js` (or a file it calls).
- **Each island's people look their own** (`story/characters/people.md`): `Slime.setFolk(folk)`. So far
  the fjord folk of Frostpeak (`folk: 'fjord'` on an `NPCS` entry): a pale, frosted palette, a rime crust
  with glints, a slow half-solid wobble, no leaf (`src/fjord-art.js`; `docs/places/fjord.md`), and the forge
  folk of Emberdeep (`folk: 'forge'`): dark and dense, mid-dark rather than black so the face reads, ember
  flecks that pulse, a warm glow low down, the same stiff wobble, no leaf (`FORGE_PALETTE`, `drawForgeFolk`
  in `src/forgehold-art.js`; `docs/places/forgehold.md`).
