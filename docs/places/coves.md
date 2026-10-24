# Saltspray Coves (room 25, `COVES`) and the Tidemother's Hoard (room 26): Lv 10–25

Island depth G1. Greenhollow's south shore, through the cleared rockfall at the harbour's west end
(`COVES_GATE_X`). **You enter at the EAST end** (`COVES_EXIT_X`; the harbour lies east) and walk west,
deeper and harder, so its zones run hard → easy by x (`COVES_ZONES`). Don't "fix" this.

- Data: `COVES_ZONES`, `COVES_PLATFORMS`, `MOSS_X`, `TIDE_DEN_X` and spawns in `src/shared/rpg.js`. Art:
  `src/coves.js` (room; the sky uses `drawDistantIslands` with the `greenSouth` view, so Emberdeep's
  smoke shows), `src/coves-art.js` (mobs, gear, icons, Moss's dress), `src/dens-coves.js` (den).
- East to west: Driftwood Cove (no mobs: Beachcomber Moss, the waystone), the Tide Pools (rock crabs:
  `shell`; tide jellies: `phase`; the tide post, a Keeper stone), the Sea Stacks (storm gulls: `dive`;
  snapshrimp: `lob` with `style: 'water'`), the Tidemother's cave mouth and Wreck Cave's mouth, its
  water gone down since G4 (a hard pocket, `docs/places/wreck.md`).
- **The Tidemother** (den, Lv 25): a big boss, so she talks: `lines` on her `MOBS` entry (on walking in,
  at phases 2 and 3, when freed) go out as `{t:'boss', a:'say'}` (`bossSays`, server/rpg.js) and show as a
  bubble and a chat line (`src/rpg.js`). Her ult is the `wave` kind, drawn as water for the `tide`
  theme (`waterMass` in `src/dens.js`). Story: `story/characters/bosses.md`. S5.4 party mechanics (two or more
  slimes in the den): the tide, a `pulse` drawn sea-green with foam and "TIDE" (`looks.pulse: 'tide'`), and `adds`
  (more rock crabs a wave); `interrupt` (freeze Riptide while it warns) is on from the first slime
  (`docs/combat/bosses.md`).
- **Beachcomber Moss**: trades potions, the Driftwood Cutlass and the Conch Helm (`SHOPS.moss`); Tier 0
  plus a light Tier 1 thread (gear-marked finds, "Keeper marks"). Music: `coves`, den `tidemother`.
