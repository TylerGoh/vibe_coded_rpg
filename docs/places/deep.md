# The Mycelium Deep (room 28), Glowroot Hollow (29) and the Knotmole's burrow (30): Lv 15–50

Island depth G2 (`story/world/island-depth.md`). The cave under Mushroom Grove: the glowing threads seen
in the Grove are roots as thick as trunks down here. The way in is the hollow stump at `MYCELIUM_GATE_X` in
the Wildwood (its roots cut back, a rope down: `drawEntries`, `src/branch-gates.js`); you arrive at the
Deep's WEST end (`MYCELIUM_EXIT_X`, the root stair back up) and go east, deeper and harder.

- Data: `MYCELIUM_ZONES`, `MYCELIUM_PLATFORMS`, `TRUFFLE_X`, `KNOT_DEN_X`, `GLOWROOT_GATE_X`,
  `GLOWROOT_ZONES`, `GLOWROOT_PLATFORMS` and the spawns in `src/shared/rpg.js`; rooms in `src/shared/sim.js`.
  Art: `src/deep.js` (the Deep), `src/glowroot.js` (the Hollow), `src/deep-art.js` (mobs, gear, icons,
  Truffle's dress), `src/dens-deep.js` (the burrow, its molehill mouth, the Knotmole).
- **The Deep**, west to east: the Root Stair (no mobs: Forager Truffle's camp under a mushroom-cap tent, a
  waystone, the Listening Stone, a Keeper stone in `src/ruins.js`), Puffcap Hollow, the Thread Caverns and
  the Knotted Halls, with the Knotmole's molehill and the crack down into Glowroot Hollow at the far end.
  The Root Stair runs further east than its last tent peg on purpose: puffcaps lob from range, so they
  live well clear of the camp. The **Glow Shelf**, a lone mushroom cap high over the Thread Caverns (last
  in `MYCELIUM_PLATFORMS`), is the off-the-path spot: an old lantern and a carved gear.
- The threads' glow drifts west along them (toward the sea: canon Tier 1, the net runs under the sea).
  West of the Knotted Halls only a trickle gets through; in the Halls it bunches up in the Knotmole's knots.
  Truffle's persona says the same, so keep them in step.
- **Glowroot Hollow** is a hard pocket (`hard` on its `STAGES` entry, a red "Lv 40–50" chip on its door,
  a red-trimmed sign): the Glowfall (no mobs), the Lit Galleries, the Heart Knot, where every thread meets
  in one knot that beats. Its elites (Old Glowworm, Elder Threadweaver) only live here.
- Mobs reuse legacy brains: puffcap = `lob` (`style: 'spore'`), cave bat = `dive`, puffball = `split` into
  two pufflings, root beetle = `shell`, knot spider = `blink`, glowworm = `beam` (`style: 'glow'`; ground
  spawns only, the beam runs along the floor), glow moth = `phase`, threadweaver = `trail` (`style:
  'glow'`, sticky glowing thread). Styles are drawn in `src/hazards.js`; `beam` passes its `style` from
  the server now (it was always the sentry's).
- **The Knotmole** (den, Lv 35, theme `knot`): a big boss with `lines` and a story
  (`story/characters/bosses.md`). Her ultimate is Root Quake, the shared `stomp` (get off the floor);
  minions are puffcaps. Her den, mouth and body are in `src/dens-deep.js`; `dens.js` only has her theme in
  its shared tables (`FXPAL`, `THEME_RGB`, falling clods, debris). Her pet is the Mini Knotmole. S5.4 party
  mechanics (two or more in the burrow): `focus` (she sniffs out one slime at a time; Rally takes it) and `adds`
  (more puffcaps); `interrupt` (freeze Root Quake as it warns) from the first slime (`docs/combat/bosses.md`).
- **Forager Truffle** (`server/characters.js`): trades basic potions, mega elixirs (it's a long way back to
  Pip), the Rootwood Saber and the Lantern Cap (`SHOPS.truffle`); knows Tier 0, the Deep, and that the
  threads run off under the sea, nothing else of the lore. Music: `deep`, `glowroot`, den `knotmole`.
