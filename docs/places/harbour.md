# Greenhollow Harbour and the far-off islands

Files: `src/harbour.js` (the room, its sky and sea, and the harbour gate drawn in the village; the lighthouse
beam is `beam` from `src/crossing.js`),
`src/distant.js` (the other islands in every outdoor sky), the room in `src/shared/sim.js` (`HARBOUR`,
`HARBOUR_W`, `HARBOUR_GATE_X`, `HARBOUR_EXIT_X`, `HARBOUR_PLATFORMS`, `GANGWAY_X`), Captain Brine's persona in
`server/characters.js`, the `harbour` music scene in `src/audio.js`. The ferry's deck: `docs/places/crossings.md`. Story: `story/world/regions/greenhollow.md`,
`story/world/atlas.md` (Phases 0, 1 and 3 of the build order).

## The harbour (room 19)
- Reached through the harbour gate at the village's west end (`HARBOUR_GATE_X`, left of the spawn); the
  path back to Slimeville is at the harbour's east end. The village's "Slimeville" signpost moved east to
  make room, and the west-end fence went.
- West to east: the rocky point and the **lighthouse** (lit: a warm lamp and a soft beam sweeping round),
  the old keeper's hut (Granny Wicks is home: shutters open, a lamp in the window, geraniums, the chimney
  smoking), crates, the **ferry Puddle Jumper** at the quay with steam up and her gangway down, the sailing
  board, two fishing boats, a net rack, the path up. Pickles, Brine's one-legged gull, sits on the gangway
  post.
- Climbable for fun: crates → the hut roof → the lighthouse gallery (`HARBOUR_PLATFORMS`). No mobs: harbours
  are safe rooms (`story/world/atlas.md`).
- **The ferry runs** (atlas Phase 3, `docs/places/crossings.md`). E at the gangway (`GANGWAY_X`) takes you
  aboard her deck (`FERRY_N`); coming home you land back here at the gangway. History: in Phase 1 she was
  laid up, shown but not boardable (owner's rule: the next phase shows but doesn't open), because Brine
  wouldn't sail while the lighthouse was dark. The Phase 3 update itself lit the lamp, no unlock quest
  (owner's call): in-world, Granny Wicks came home from inland and lit it.
- Captain Brine is aboard now, at the wheel on both decks, not on the quay.
- The telescope on the east cliffs (`docs/places/cliffs.md`) shows the same islands up close.

## Captain Brine
An AI character like Elder Mochi (`docs/social/ai-characters.md`): he sails the ferry, and you can chat
with him at her wheel during the crossing. His persona knows only canon Tier 0 and his own trade, deflects
lore questions ("ask old Mochi"), knows the fjord thawed and she sails right in to Icefang Hamlet again
(and knows its three people a little, and that the Lodestar sails south again, atlas Phase 5), and mostly talks about his
own life: forty years at sea, his
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
