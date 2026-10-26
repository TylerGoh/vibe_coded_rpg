# The Thornheart (room 33, `THORNHEART`): Lv 50–60, a hard pocket

Island depth G4 (`story/world/island-depth.md`). The root of the briar that covers the east of the Wildwood,
through the wall of thorns at `THORN_GATE_X` in Bramble Woods' mob-free east end. The wall is cut back into
a low tunnel now (`OPEN.thorns` in `src/branch-gates.js`: canes bent aside into an arch, the cut stems heaped
by it, the eyes still blinking far down the tunnel). You arrive at the WEST end (`THORN_EXIT_X`) and go
east, deeper and harder.

- Data: `THORN_ZONES`, `THORN_PLATFORMS` and the spawns in `src/shared/rpg.js`; the room in `src/shared/sim.js`.
  Art: `src/thornheart.js` (the room), `src/thornheart-art.js` (mobs, the Thorn Hart, gear, icons).
- Under a roof of woven canes, with daylight only through the gaps: plum and moss-green, pale thorns, petals
  drifting. West to east: the Briar Gate (no mobs; the tunnel back to the woods), the Bramble Maze and the
  Thornheart itself, where every cane grows out of one great root knot at the east end.
- **The Hedge Stone** (`RUIN_STONES`, shape `hedge`, in front of the knot): a Keeper stone the briar grows up
  through. Tier 1 only: the Keepers planted the briar "to keep the road", and a carved hand points north to
  the high ridge (Keeper's Spine, where the Root Warden holds the road's sealed gate: `docs/places/spine.md`,
  whose Road Stone agrees with it).
- **The White Rose**, a briar arch high over the Maze (last in `THORN_PLATFORMS`), is the off-the-path spot.
  FB1 (b) added a second find: **the Cast Coil**, a briar arch over the Maze's west end with the empty, papery
  cast of something long and thorny coiled on it like a shed snakeskin (`drawCoil`). Nobody says what shed it.
- **The split knot (FB1 (b))**: the root knot has split at its east end, a dark way down between the roots
  (`SUNKEN_GATE_X`, `OPEN.rootsplit` in `src/branch-gates.js`) to the Sunken Road (`docs/places/sunkenroad.md`).
  The update itself split it: no quest.
- **Thorn patches (FB1 (b), the pocket's room hazard)**: `THORN_PATCHES` on the floor of the Maze and the heart.
  Each grows (`PATCH_GROW`: runners creep in, a dark bruise of soil under them), stands sharp (`PATCH_UP`), then
  dies back, on its own offset in `PATCH_CYCLE`. `patchAt(i, tick)` reads the server tick on both sides, so
  nothing goes over the wire: the client draws from `net.renderTick()` (`drawPatch`), and the server
  (`tick` in `server/rpg.js`) hurts anyone on the floor in a sharp one, `PATCH_DOT` of max HP every
  `PATCH_HIT_EVERY` ticks, as a flat `'dot'` (no knockback, so no `step()` change and nothing to predict). A
  ledge or a jump is safe. The patches don't care about mobs.
- A hard pocket: no trader, no waystone, a red "Lv 50–60" chip on the door, red-trimmed signs, elites. Mobs
  reuse legacy brains: thornback = `shell` (a mask of thorns in front: hit it from behind), thistle puff =
  `split` into three thistledown (minions: small EXP and gold), pitcher plant = `lob` with `style: 'thorn'`
  (rooted: `speed: 0`, `anchored`, `keep: 0`), thorn stalker = `blink`. Elites: the Old Thornback (Maze)
  and the Elder Thorn Stalker (the heart).
- **The Thorn Hart** (field boss, Lv 58, small: no story): a great white stag with antlers of living briar,
  velvet green, white roses at the tips. Roams the Thornheart on the `stomp` brain (rears, then stamps a
  shockwave along the floor), passive until hit. His pet is the Mini Thorn Hart. S5.4: with two or more fighting
  him, `focus` (his antlers lowered at one slime; Rally takes it) and the thorns' `curse` (a briar-green sigil with
  thorns round its rim, `looks.curse: 'thorn'`) (`docs/combat/bosses.md`).
- Gear (drops only, on the frozen curve): the Thornback Helm and the Stalker's Claw off the mobs, the
  Briarheart Blade and Hart's Antler Crown off the Hart. Ranger Acorn's persona knows the tunnel is cut and
  has watched the Hart from the treetops. Music scene `thornheart` (a stern E phrygian tune, a slow
  heartbeat on low drums).
