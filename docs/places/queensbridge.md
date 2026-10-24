# The Queen's Bridge (room 42, `QBRIDGE`): Lv 85–100, and Sigrun (den 43)

Frostpeak's depth pass, phase F4 (`story/world/island-depth.md`), the last of Frostpeak's branches: out onto
the ice bridge Queen Glacia froze across the strait. The way in is the ice stair on Frostpine Ridge by the
Frozen Throne (`BRIDGE_GATE_X`), built up again (`OPEN.icestair` in `src/branch-gates.js`: the gap filled with
fresh-cut blocks, a rope rail on pegs, the cutters' red flag). You arrive at the bridge's WEST end
(`QBRIDGE_EXIT_X`, the stair's head) and walk east out over the strait, higher and harder. Frostpeak has no
gates left.

- Data: `QBRIDGE_ZONES`, `QBRIDGE_PLATFORMS`, `SIGRUN_DEN_X` and the spawns in `src/shared/rpg.js`; the room
  and its door in `src/shared/sim.js`. Art: `src/qbridge.js` (the room), `src/qbridge-art.js` (mobs, gear,
  icons), `src/dens-qbridge.js` (the Seam, its way in, Sigrun); the staves are rows in `src/staff-art.js`
  (Sigrun's has its own `shield` head).
- High, grey and windy: a pale overcast sky, snow blowing sideways from the west, cloud scudding past at the
  bridge's height; far below, the strait with floes, Frostpeak's cliffs falling behind as you walk out and the
  next island's cliffs a grey ghost in the east (never named: the plan leaves the far shore open). The deck
  is blue ice under snow with a balustrade of ice arches along its back, a little crown on every post;
  icicles and empty air under the deck.
- West to east: **the Stairhead** (no mobs: a waystone, the Strait Stone, an empty sentry box with a horn
  never blown), **the Span** (ice arches), **the Frozen Guard** (guard posts; the Queen's guards frozen at
  their posts along the rail, scenery that never moves: `drawFrozenGuard`) and **the Crack** (slabs of the
  deck heaved up, a crack running east along the floor and widening) to **the Seam**, the crack frozen shut
  again, where Sigrun's den is (`SIGRUN_DEN_X`). Past it the bridge's far half sags away into fog
  (`drawFarHalf`): the room ends there.
- **The Shield's Perch**, the hidden spot (last in `QBRIDGE_PLATFORMS`, on the tallest arch over the Frozen
  Guard): a lookout with two silver cups frozen side by side on its ledge, one with a crown on it.
- **The Strait Stone** (`RUIN_STONES`, shape `strait`, `src/ruins.js`): a Keeper stone older than the bridge,
  the Queen's ice grown round it. Two shores whose edges would fit together and a gear split between them,
  then carved again lower down further apart with waves between, and again. A newer crown and shield cut in
  the ice over it. Canon Tier 2 by showing only (the drift); never Pangelea, the Wheel or the Stopped Hour.
- No trader and no character up here (like the Spine and the Heights). Skaldi, Runa, Tove and Eyvind talk
  about it (`docs/social/ai-characters.md`): Eyvind's cutters mended the stair (with Runa's rope); some of
  the frozen guards were hamlet folk (Runa's great-uncle); Skaldi knew Sigrun as a girl.

## Mobs (on the frozen curve)
- rime puffin (passive, hops) · sleet harrier = `dive` (`fly` 62: under the 70 px notice limit) · rimeguard =
  `shell` (a round shield of ice in front: hit it from behind; the Queen's guards, frozen half-solid, still on
  watch) · hoarfrost shade = `phase` (`fly` 44) · leopard seal = `blink` (down a crack, up behind you; drawn as
  a hole with whiskers while gone) · rime archer = `lob`, `style: 'javelin'` (`src/hazards.js`).
- No elites (not a hard pocket) and no field boss: the party den is the danger, as on Keeper's Spine.

## Sigrun, the Queen's Shield (The Seam, den 43)
Frostpeak's **party den** boss (Lv 100; the island's second-strongest, after the final boss to come: `story/final-bosses.md`), with a story (`story/characters/bosses.md`): Glacia's sworn guard,
fjord folk frozen half to ice, who still freezes the crack shut every night though her queen has let go.
The harder Glacia story: holding on to someone else's holding on. Her `lines` are an oath nobody released her
from; freed, she stops mending it ("Cross while it lasts"). No world change after a kill (like the Root
Warden: only her line says so).
- Moves: slam, charge, ice rain; phase 2 adds her shield's cold **beam** (`looks.beam: 'shield'`), the deck
  heaving along the seam (**grid**, `looks.grid: 'seam'`) and summons (rimeguards); phase 3 adds echo,
  barrage and leap. Her ultimate **Close the Seam** is the shared `wave` ult drawn as new ice racing along
  the floor (`iceMass` in `src/dens.js`, theme `oath`): jump it.
- **Built for the party mechanics** (`story/progression.md`, S5): `party` names focus, barrier (her shield
  turns blades from the front), pulse, weakpoint (the shard set in her shield's boss, already drawn) and adds;
  nothing reads it yet.
- The den: the middle of the bridge at dusk, high over the strait, the balustrade snapped near the seam, the
  seam itself glowing in the floor at the far end; the name on a pale blue pennant with a crown.
- Loot: the Shield-Oath Spear (a sword; its twin the Shield-Oath Staff) and Sigrun's Helm, on the frozen
  curve a step above the bridge's mob gear (9 slots); Seam Ice. Her pet is in the Pet Shop (`PETS`, priced
  just above Ignis's, the next boss up by level; `PETSHOP_W` was raised for it).

## Gear (`docs/combat/items.md`)
Mob drops: the Rimeguard Helm (rimeguards), the Rimeguard Blade / Rimeguard Staff (rime archers). Sigrun:
above. Materials from every mob.

## Waystone
One at the Stairhead (`isle: 'frost'`), reaching Frostpeak's others (`docs/places/waystones.md`).

## Decisions and history
- 2026-10-23: built as F4. Liberal decisions (owner's standing instruction): the names (the Stairhead, the
  Span, the Frozen Guard, the Crack, the Seam, the Strait Stone, the Shield's Perch) and the mobs are new; no
  trader or field boss (the plan named none); the far shore stays unnamed fog. Frostpeak's depth pass is done;
  atlas Phase 5 (Emberdeep, `story/world/emberdeep-depth.md`) comes next.
- Music scenes `qbridge` (B minor 3/4, wind in the arches, a horn call) and `sigrun` (`docs/ui/audio.md`).
- Tested with a Lv 96 test character, TEST_GOD and a weakened Sigrun: the stair both ways, every mob spawning,
  the Strait Stone's card, attuning the waystone and travelling to it from the hamlet, the Frostpeak map with
  the pin on the bridge, the den, her lines, phase 2 and Close the Seam, the gear and icons in the bag, a
  phone screenshot. Not tested: a full kill, her grid and beam up close. Personas not talked to (no DeepSeek
  key on the test server). Nobody has fought it at its level.
