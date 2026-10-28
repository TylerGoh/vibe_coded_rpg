# Forgehold (Emberdeep's landing town) and the south

Atlas Phase 5, "the south", and Emberdeep's depth pass E0 (`story/world/emberdeep-depth.md`, approved by the
owner 2026-10-23 with every default). Story: `story/world/regions/emberdeep.md`, `story/characters/people.md`.

Files: the room in `src/shared/sim.js` (`FORGEHOLD` in `ROOMS`, its doors, the `TOWNS` entry, the `NPCS`
entries), its layout constants in `src/shared/rpg.js` (`FORGE_W`, `FORGE_DOCK_X`, `FORGE_HOME_X`,
`FORGE_SPAWN_X`, `FORGE_FIRE_X`, `FORGE_WALL_X`, `FORGE_EXIT_X`, `SANDS_GATE_X`, `SOOT_X`, `ASH_X`, `SLAG_X`,
`FORGE_PLATFORMS`, `SHOPS.soot` and `SHOPS.slag`), the drawing in `src/forgehold.js` (`drawForgehold`), the
forge folk's look, everyone's clothes, Slag's gear and the egg's icon in `src/forgehold-art.js`, the four
personas in `server/characters.js`, the `forgehold` music scene in `src/audio.js`. The Lodestar's crossing:
`docs/places/crossings.md`. The island's map and its gates: `docs/places/branches.md`.

## What it is
- **Room 44, a town and a safe room** (no mobs). West to east: the beach path out to the Black Sands (its door
  at `SANDS_GATE_X`; E0's geyser across it went quiet in E1, stones laid over it: `docs/places/blacksands.md`); Black Sand Shore's rusted iron quay where the Lodestar ties up
  (her gangway, `FORGE_DOCK_X`, boards `STEAM_S` after the "Set sail?" card); **Auntie Soot's springs**, a
  bathhouse of stacked stone over steaming pools; then the town cut into the caldera's outer wall: ledges
  joined by chains and iron stairs, the iron door that is **everyone's own front door** (`FORGE_HOME_X`), the
  waystone, **the great forge** (you wake by it, `FORGE_SPAWN_X`) with Forgewarden Ash, **the memorial wall**
  (`FORGE_WALL_X`), **Slag's stack of gear-teeth**, and the road up into Cinder Flats (`FORGE_EXIT_X`, into
  the legacy stage's west end at `CALDERA_EXIT_X`).
- One room, with the shore as its waterfront (owner's default: you step off the boat into a town). The
  atlas listed Black Sand Shore and Forgehold separately; the Black Sands proper is a branch (E1, room 54).
- Climbable (`FORGE_PLATFORMS`; the drawing reads them): iron crates on the quay, the bathhouse roof, three
  ledges in the wall, the forge's hood, and Slag's stack.
- The sky: an ash-hazed dusk, warm green sea, the other islands far off to the north (`drawDistantIslands`
  from `'ember'`), the island's own smoke column leaning over the wall. Ash drifts down; embers rise.
- **The memorial wall**: smiths' names carved small (strokes, not text) with a nail beside each, candles at its
  foot, and near the top one framed space that stood blank for years: Ash's sister Brenna's. **Since E4b her name is in
  it** (`drawMemorial`): BRENNA, the one name on the wall cut deep enough to read (real text, on purpose), a new
  bright nail beside it and a sprig of Ash's mint tucked behind. A permanent world change shipped with her den, not
  per kill (`docs/places/rim.md`). In-world Ash carved it himself the night Ochre came down and told him the tooth was
  set down on the Bearer's Seat; Soot sat up with him. Keep the personas consistent with that.

## A town (owner's rule: every island's landing has one)
- In `TOWNS`: being here makes it **your town** (`state.town`): you wake by the forge after fainting (in
  Cinder Flats or Magma Heart too, once it's your town), your house's front door lets you out here, invites
  work from here. How towns work: `docs/world.md`.
- A waystone by the forge (`isle: 'ember'`), and one in Magma Heart just past the Molten Forge's mouth
  (`docs/places/waystones.md`).

## The people (AI characters, `docs/social/ai-characters.md`)
- **Forgewarden Ash** (`ash`): keeps the great forge and the memorial wall; the plain-spoken guide to what's
  dangerous inland (Tove's job, done grimly): the four legacy mobs, Ignis and Pyra, and every shut way out.
  He holds Tier 3 in the long run but **deflects** until per-account story progress exists: "Go and ask the
  old smith in the Forge. Then come back." (a character's refusal, not a gate). His sister Brenna is the
  newest name on the wall (E4b; before that the blank space, "It's spoken for."); he gives it slowly ("My sister. She
  put it down." the first time) and never says what she carried it for. Keep his mob list in step with Emberdeep's
  (E1: the Black Sands and the Ashwood are open in it; of the Old Foundry's bricked-up adit he says only that the
  forge folk bricked it themselves and it stays bricked: `docs/places/ashwood.md`; E2: the Smoking Coast is open,
  its old tube's steam is the shut way, and he says Liv's edges are better than his: `docs/places/coast.md`; E3a: the
  Brimstone Fields are open (he likes Picker Ochre, who carries his sulphur), and he won't go near the Bearers' stair
  at their top or say why: `docs/places/brimstone.md`; E3b: he had the adit's bricks taken down himself, lists the
  Old Foundry's dangers and won't say why it was shut: `docs/places/foundry.md`; the balloon stays in his shut-ways list).
- **Auntie Soot** (`soot`, `shop: 'soot'`): the springs, the one kind voice. Sells the basic potions and her
  **Spring-Boiled Egg** (`spring_egg`, a plain heal). Holds Arne's sack of letters for "the northern girl out
  on the coast"; since E2 (`docs/places/coast.md`) she has met Liv, passes letters both ways for her and the
  Lodestar, and knitted her the thinnest scarf she could spin. Makes Picker Ochre (E3a) sit in the springs till the
  yellow comes off.
- **Slag** (`slag`, `shop: 'slag'`, lively): Ash's apprentice; sells the basic potions and the island's first
  gear tier, aimed at its start: the **Slag Maul**, its staff twin the **Bellows Rod**, and the **Smith's Iron
  Cap** (`docs/combat/items.md`, `docs/economy.md`). Never seen snow; afraid of the sea. Laid the Black Sands' stones
  and riveted the Ashwood bridge's new plates (E1); pegged the Coast gully's hand-chain and asks Liv about snow (E2); asked Picker Ochre what the vents smell like (E3a).
- **Their look** (the forge folk): `folk: 'forge'` makes `Slime.setFolk` paint them dark and dense with ember
  flecks and a warm glow low down (`FORGE_PALETTE`, `drawForgeFolk`), with the same stiff wobble as the
  fjord folk (`lively` still bounces). Mid-dark, not black, so the face reads. Their clothes are the
  accessories `forgewarden`, `bathkeeper`, `apprentice` (`drawForgeDress`; Arne's `skipper` is there too).

## Phase 5's other changes (the same update)
- **The Lodestar sails** from Icefang Hamlet (`docs/places/fjord.md`, `docs/places/crossings.md`): the update
  lifted the block, no quest (owner's rule); her notice says "Sailing again. Stars enough to steer by."
- **The Caldera pass went**, once the Lodestar was tested both ways (never strand an island): its door and
  arch on Starfall Summit are gone, and the summit's east end is a plain lookout (`SUMMIT_LOOKOUT_X`,
  `drawSummitLookout` in `src/highlands.js`): posts, a rope, a cairn, the old steps drifted over. The
  legacy stage's west door now leads down the road to Forgehold, its arch signed "Forgehold".
- **Renamed** (owner's default): the stage is "Emberdeep" (`STAGES[CALDERA]`, its room, its door chips; the
  zones keep their names). The code still calls the room `CALDERA`. The skylift stays until the balloon
  works (atlas Phase 6).
- **Phase 6's block**: the balloon lies deflated in its cradle by the thermal column in Magma Heart
  (`BALLOON_X`, a gate on the island map: "the column stalls"). Phase 6 lifts it (Slag's forge-burner).
- Personas that changed: Brine, Skaldi, Runa, Eyvind (his letters went south; no answer yet), Tove.

## Decisions and history
- 2026-10-23: built (E0). The owner took every default in `story/world/emberdeep-depth.md`'s open decisions:
  the rename; no gate on the Wyrm (the gangway says "Lv 90+"); the balloon grounded by the stalling column;
  the band to 150; one room for the town; Liv in Emberdeep (E2); Brenna the party den boss (E4); Ash deflecting
  Tier 3; Arne, Liv, Pitch and Ochre as AI characters; a plain lookout on the summit; new pets squeezed in;
  getting home by the house door; heat as flavour only.
