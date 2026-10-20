# Art: slimes, accessories, scenery

- Everything is procedural canvas drawing, in the soft, rounded, pastel style inherited from Slime Hop.
  No image assets, and no emoji in canvas text (they render as boxes without emoji fonts).
- `src/slime.js`: the slime body (a jelly spring; keep animation dt capped, see `docs/netcode.md`), faces,
  name tags, and every accessory and helmet/sword drawing. `Slime.setLook()` combines worn gear, a
  player's own name-keyed accessories (`ACCESSORIES`) and Boutique cosmetics they wear.
- `src/village.js`: village scenery and the `text()` helper used across the HUD. `background.js`,
  `environment.js`, `particles.js` and `util.js` came from Slime Hop.
- Each room or stage draws itself in its own file (named in its doc). Stage files paint their own sky.
- A new AI character or friend accessory needs its drawing in `src/slime.js`.
