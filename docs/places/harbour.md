# Greenhollow Harbour and the far-off islands

Files: `src/harbour.js` (the room, its sky and sea, and the harbour gate drawn in the village),
`src/distant.js` (the other islands in every outdoor sky), the room in `src/shared/sim.js` (`HARBOUR`,
`HARBOUR_W`, `HARBOUR_GATE_X`, `HARBOUR_EXIT_X`, `HARBOUR_PLATFORMS`), Captain Brine's persona in
`server/characters.js`, the `harbour` music scene in `src/audio.js`. Story: `story/world/regions/greenhollow.md`,
`story/world/atlas.md` (Phases 0 and 1 of the build order).

## The harbour (room 19)
- Reached through the harbour gate at the village's west end (`HARBOUR_GATE_X`, left of the spawn); the
  path back to Slimeville is at the harbour's east end. The village's "Slimeville" signpost moved east to
  make room, and the west-end fence went.
- West to east: the rocky point and the **lighthouse** (lamp dark for ages: grey glass, a cobweb), the old
  keeper's hut, crates, the **ferry Puddle Jumper** moored at the quay, **Captain Brine** with the notice
  and rope across the berth, two fishing boats, a net rack, the path up. Pickles, Brine's one-legged gull,
  sits on the barrier post.
- Climbable for fun: crates → the hut roof → the lighthouse gallery (`HARBOUR_PLATFORMS`). No mobs: harbours
  are safe rooms (`story/world/atlas.md`).
- **The ferry is shown but can't be boarded** (owner's rule: the next phase shows but doesn't open, see
  `Agent.md`). The in-world reason: Brine won't sail while the lighthouse is dark, and nobody has lit it
  since its keeper moved inland. The gangway is hauled up and the notice says so. There's no door. When the
  crossing room ships (atlas Phase 3), that update simply lights the lamp and the ferry runs: no unlock
  quest (owner's call). Update Brine's persona to match.
- The Frostpeak Highlands trail in the Wildwood stays until the ferry works (never remove a back door
  before its crossing exists).

## Captain Brine
An AI character like Elder Mochi (`docs/social/ai-characters.md`): he runs (well, keeps) the ferry, and you
can chat with him. His persona knows only canon Tier 0 and his own trade, deflects lore questions ("ask
old Mochi"), never promises a sailing date, and mostly talks about his own life: forty years at sea, his
ship, Pickles, superstitions, cards at the Inn. Slapping him gets `SLAP_QUIPS.brine`.

## The far-off islands in the sky
- `drawDistantIslands` draws each other island's landmark: Frostpeak's snowy peaks under the aurora,
  Emberdeep's volcano and smoke column, the Aether Citadel hanging in the sky, Greenhollow's green hump with
  the apple tree. Called from every outdoor sky: the village, Wildwood and house windows (`drawBackground`
  in `src/background.js`), the harbour, the Highlands, the Caldera and the Citadel. Dens don't (enclosed).
- **Each island's view faces the middle of the Glass Sea**, so compass bearings become left/right: from
  home, Frostpeak (north) is left, Emberdeep (south) right, the Citadel middle (`VIEWS`). The panorama
  turns a little as you walk (`PAN`).
- **They must look FAR.** The first pass drew them big and they looked next door, which is exactly the
  owner's complaint the story is fixing. Keep them small and hazed toward the horizon colour; each sky
  passes its own `scale`, `fade` and `haze`.
- In the Caldera Frostpeak is nudged west of due north so the Caldera's own volcano doesn't hide it.
- `[proposed]` The Drift as a live feature (`story/world/geography.md`) would shrink these a little over
  real time; the drawing takes a `scale` per call, so it's a parameter change.
