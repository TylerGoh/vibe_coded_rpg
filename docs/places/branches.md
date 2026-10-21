# Greenhollow's branches: blocked ways in and the island map

The island depth plan (`story/world/island-depth.md`) grows Greenhollow to Lv 1–60 with side areas
("branches") off the main trail. Phase G0 laid every branch's entrance before any of them exists, so the
island shows what's coming.

- Data: `GREENHOLLOW` in `src/shared/branches.js`. It holds every place on the island map: the towns, the
  three Wildwood zones, the cliffs and the eight branches, each with its band, `hard` for hard pockets,
  the node it hangs off (`from`) and where it sits on the map (`at`). `ISLAND_MAPS` says which islands
  have a map (Greenhollow only; Frostpeak's comes with its depth pass).
- **A branch that hasn't shipped has a `gate`**: the blocked way in, in a real room (the room and x, the
  kind of art, the prompt, and what E says). Gates are drawn by `src/branch-gates.js`: Willowmere's
  washed-out footbridge (Sprout Meadow), the rockfall on the shore path (the harbour's west end), the
  Mycelium Deep's root-choked stump (Mushroom Grove), the Old Oak Canopy's rotten rope ladder (Bramble
  Woods, before the ruins) and the Thornheart's wall of thorns (the mob-free end of Bramble Woods). Each
  has a small sign with the place's name (red-trimmed for a hard pocket).
- Places behind another unshipped one (Wreck Cave, Glowroot Hollow, Keeper's Spine) have `past: true`
  and no gate: their way in will be in a room that doesn't exist yet.
- Walking up to a gate shows an E prompt and a beacon (`gateAt`, `drawHints` in `src/main.js`); E shows a
  toast saying what's in the way. Nothing goes to the server.
- **Owner rules** (`Agent.md`, story): the block is an in-world reason, never a "coming soon" sign or a
  stand-in door. When a branch ships, the update itself lifts the block: give it its rooms (`rooms` on
  its node), remove its `gate`, and the art and prompt go with it. Then its children (e.g. Wreck Cave
  after Saltspray Coves) get gates in the new room.
- **Shipped (G1):** Willowmere and Saltspray Coves have `rooms` and an `entry` (`ENTRIES`, drawn by
  `drawEntries`: the mended footbridge, the rockfall rolled aside). Wreck Cave's gate is now in the Coves
  (`flooded`, a hard pocket).
- **Shipped (G2):** the Mycelium Deep (the stump's roots cut back, a rope down: `stump` drawn open) and
  Glowroot Hollow, whose way in is the Deep's own far end (`entry` in the Deep, `crack`). An entry takes
  its node's `hard` for a red-trimmed sign, like a gate's.
- The island map (`docs/ui/world-map.md`) reads the same list: shipped places solid with their levels,
  the rest dashed with a short `block` reason. Keep both in step: a node's `block` should match its gate.
