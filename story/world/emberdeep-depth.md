# Emberdeep's depth plan: the south (atlas Phase 5 and the E track)

**Approved by the owner 2026-10-23, with every default below** ("all these look good"). E0 shipped the same
day (`docs/places/forgehold.md`). It covers what happens after Frostpeak's party den (F4): atlas Phase 5 (the
Steam Straits, the landing and its town) and then Emberdeep's depth pass, the same way `island-depth.md`
did Greenhollow and Frostpeak. It follows that file's owner direction and "deep" checklist; read them
first. Places, mobs, bosses and people below are `[proposed]` until they ship; anything the owner has to
settle is in **Open decisions** at the bottom, each with a default so a builder isn't blocked.

Tone (`regions/emberdeep.md`, `../delivery.md`): harsh, hot, industrial; grief and anger; blunt people,
almost no humour. The springs and Auntie Soot are the last soft spot. Names get older and plainer.

## The band: Lv 90–150 `[default]`
- **Emberdeep covers Lv 90–150.** The legacy stage (Cinder Flats 90–100, Magma Heart 100–115, Ignis Lv 99,
  Pyra Lv 110, since the rebalance) is the bottom of it; the depth pass fills 115–150.
- **Overlaps:** with Frostpeak's top (the Queen's Bridge, 85–100) on 90–100, and with the Citadel's legacy
  stage (Cogwork Bastion from 140) on 140–150. Both are 10 levels, half Greenhollow/Frostpeak's 20 (an open
  decision below). As on Frostpeak, the island's last slice (145–150) has one place of its own plus the
  next island's bottom.
- **Levelling speed unchanged:** new mobs sit on the frozen curve (`CURVE` in `src/shared/curve.js`, which
  already runs to Lv 200), within `MOB_FIT`. The island just holds more levels.

## The landing: the Steam Straits and Forgehold (atlas Phase 5)
### The crossing: the Lodestar
- **From Icefang Hamlet's quay**, where she's laid up today (`docs/places/fjord.md`). The update itself
  lifts the block, no quest: Skipper Arne says the stars are right enough to steer by again. Her gangway
  is a door with `ask` (the Set sail card) and a "Lv 90+" label; no hard level gate (decision below).
- **Two crossing rooms** (out and home), a new route theme `'steam'` in `src/crossing.js`
  (`from: 'frost', to: 'ember'`): the hamlet, the cracked ice bridge and the aurora slide away astern;
  the icebergs thin out, fog banks, the water turns warm and green, geysers spout from the sea, steam
  walls, ash settling on the deck; the smoke column grows over the bow; then black cliffs, Forgehold's
  lights in the wall and a rusted iron quay. **The long voyage** (`geography.md`): the out deck's `ticks`
  clearly longer than the ferry's; the way home shorter. Movement on deck is plain `step()` as always.
- **Skipper Arne** (AI, fjord folk, at the wheel of both decks via `also`): Runa's cousin. Purpose: the
  crossing, like Brine. Narrow lore: Tier 0, the southern passage, steering by the stars (the Wyrm's fall
  only as "the stars went wrong", Tier 2 by hearsay at most). Life: seven years tied up and ashamed of
  it; on the last voyage his deckhand, Liv, stayed behind in the south and he sailed home without her;
  he carries Eyvind's sack of letters on the first run; keeps the log in a cramped hand and reads the
  weather off his bad knee; can't stand the heat and sleeps on deck in the Straits.

### The town: Forgehold, with Black Sand Shore as its waterfront `[default: one room]`
Owner's rule: every landing is a town. Like Icefang Hamlet, the harbour and the town are **one room**:
- **West: Black Sand Shore**: the rusted iron quay where the Lodestar ties up, black sand, steaming pools
  and **Auntie Soot's springs** (a bathhouse of stacked stone; the rest spot). East: **Forgehold proper**,
  cut into the caldera's outer wall in ledges joined by chains and iron stairs (platforms), bellows, a
  great forge, heat-haze, and **the memorial wall** of smiths' names with one blank space left near the
  top. The east end climbs out into Cinder Flats. The smoke column and (far up) the Citadel are in the sky.
- A `TOWNS` entry (wake by the great forge), a home door, a waystone, no mobs. The forge-slime look
  (`folk: 'forge'`, `../characters/people.md`): dark, dense, ember-flecked, stiff wobble.
- **Forgewarden Ash** (AI, the lore-holder): keeps the great forge and the memorial wall, and is the town's
  plain-spoken guide to what's dangerous inland (Tove's job, done grimly). Holds Tier 3 in the long run;
  until per-account story progress exists he deflects anything about what the gears were for ("Go and
  ask the old smith in the Forge. Then come back."): a character's refusal, not a gate. Life: his sister
  Brenna went up to the rim the morning everything broke and never came down; hers is the blank space on
  the wall, because he won't carve a name for someone who isn't dead. He hammers one nail into the wall
  for every smith who dies, grows a stubborn pot of mint on the forge sill that Soot waters when he isn't
  looking, and loses to her at stones every evening (he says on purpose).
- **Auntie Soot** (AI, the trader for potions; the one kind voice): runs the springs. "Auntie" to the whole
  town, children of her own none. Boils eggs in the hottest pool and sells them with the potions, knits
  socks from slag-wool, feeds Slag, keeps a room made up for any sailor who might come, and has started
  knitting something for "the northern girl out on the coast" (Liv, before her branch opens). Tier 0
  plus town gossip.
- **Slag** (AI, the gear trader; heavy gear, a tier with an `aim` around the island's start, staff twin
  included): Ash's young apprentice, who believes the gears can still be finished. He drags gear-teeth out
  of the ash and stacks them in the square, has been filing one tooth for three years, has never seen
  snow and asks every northerner about it, and is afraid of the sea. Tier 0 plus the forges.
- The legacy room's west door (the pass's landing, `CALDERA_EXIT_X`) is repointed to Forgehold's east end.

The atlas's old shore mobs (steam toads, scald eels, at "27–30") move into the Black Sands, an easy pocket
off the town (below); the town itself stays safe.

## Emberdeep's map `[proposed]`
```
                               [the Caldera Rim 135-150] -- Brenna, the Last Bearer (party den)
                                          |  the Bearers' stair
                               [the Brimstone Fields 125-140]
                                          |  up the cone's flank            (the thermal column:
 Black Sands -- Forgehold -- Cinder Flats -- Magma Heart ---------------------  the balloon, Phase 6)
 [90-100] easy  (town)      |        |      Ignis, Pyra (legacy dens)
                            |   [the Ashwood 115-130] -- [the Old Foundry 130-145] hard
                            |
               [the Smoking Coast 100-115] -- the Hatchkeeper (den)
                            |
               [the Drained Tubes 115-125] hard
```
Slices: 90–100 the Black Sands and Cinder Flats; 100–115 Magma Heart and the Smoking Coast; 115–125 the
Ashwood and the Drained Tubes; 125–130 the Ashwood and the Brimstone Fields; 130–140 the Brimstone Fields
and the Old Foundry (the Rim from 135); 140–145 the Foundry and the Rim; 145–150 the Rim and the Citadel's
bottom. Every bracket is its own combat room with its own art file and music scene; room ids are the next
free ones below `HOUSE_BASE` after F4.

| place | band | way in | blocked until it ships by |
|---|---|---|---|
| the Black Sands | 90–100, easy | Forgehold's west end, past the springs | a new geyser broken out across the beach path, scalding |
| the Smoking Coast | 100–115 | a gully south off Cinder Flats, down to the sea | a fresh lava tongue across the gully, still crusting over |
| the Drained Tubes | 115–125, hard | an old tube mouth in the Coast's sea cliff | behind the Coast (`past`), then ships with it |
| the Ashwood | 115–130 | the old charcoal road north out of Cinder Flats | the charcoal road's iron bridge, fallen into a lava channel |
| the Old Foundry | 130–145, hard | a mine adit in the Ashwood's slope | `past`; once the Ashwood ships: the adit bricked up by the forge-slimes themselves |
| the Brimstone Fields | 125–140 | up the cone's flank from Magma Heart | the vent field fuming across the path: no one can breathe that air |
| the Caldera Rim | 135–150 | the top of the Brimstone Fields | `past`; then: the Bearers' stair, its chains rusted through |
| the thermal column | vista | Magma Heart's east end, by the skylift | the balloon grounded (atlas Phase 6, not part of the E track) |

### The places
- **The Black Sands** (easy pocket, 90–100): the beach west of the quay. Black sand, small geysers (drawing
  only; a geyser that throws you would be a `step()` job, not planned), warm shallows, sea stacks. Black-
  sand crabs (passive), steam toads (`trail`, a steam puff `style`), scald eels (`phase`: duck into a pool,
  surface in a scalding ring), frigatebirds (`dive`, `fly` under 70). **Field boss: the Bellower**, a steam
  toad the size of a hut squatting on the biggest vent (`stomp`). Find: **the Kettle**, a hidden pool on a
  sea stack with two mugs left on the rim. Keeper stone: **the Turning Stone**, a dial with the islands
  drawn close at the top and scattered at the bottom, going round. No trader (Soot is next door). A
  hot-spring herb for the alchemy lab if cheap to add.
- **The Cinder Flats and Magma Heart** (legacy, 90–115): unchanged mobs and dens (Ignis's Molten Forge,
  Pyra's Roost). Optional in E0: the atlas's gear-teeth half-buried in the ash (scenery) and its open slot,
  a **slag golem** in Magma Heart (`split` into two slaglings, minions kept small: `split` minions aren't
  checked by the economy script).
- **The Smoking Coast** (branch, 100–115): where lava still runs into the sea: pillow lava, steam walls,
  new black land being made (the one place in the game where land grows), warm surf. Marine iguanas
  (passive, bask), ashfoot boobies (`dive`), rock lobsters (`shell`), pumice crabs (`split`), steam rays
  (`phase`). People: **Liv** (AI, trader, below). **Den: the Hatchkeeper** (~Lv 115, story below). Keeper
  stone: **the Landing Stone**, a loading quay's stone with gear-teeth stacked on barges and a tally whose
  last mark is half cut. Find: **Liv's Lookout**, a north-facing sea stack with a row of black-glass birds,
  copied from Skaldi's driftwood ones.
- **The Drained Tubes** (hard pocket, 115–125): old lava tubes, long cold, running down into the cliff;
  glassy walls, roof skylights, rooted lava drips. Clinker beetles (`shell`), tube adders (`blink`), lava
  drips (a rooted `lob` shooter: `speed: 0`, `anchored`, `keep: 0`, like the pitcher plant), cinder moths
  (`phase`). Elites of the beetle and the adder. **Field boss: Hundredfoot**, a tube centipede (`trail`,
  burning). Find: **the Skylight**, a ledge under a roof-hole with the column in view. No waystone.
- **The Ashwood** (branch, 115–130): the windward outer slope, the old forest cut and burned for charcoal to
  feed the foundry: standing charcoal trunks, ash rain, ferns coming back. Ash moths (passive, low `fly`),
  char boars (aggressive chasers), ember foxes (`blink`), ironbark beetles (`shell`), smoke wisps (`phase`).
  **Field boss: Greyback**, an ash-grey bear who throws burning logs (`lob`). People: **Collier Pitch**
  (AI, trader). Keeper stone: **the Kiln Stone**, trees to fire to metal to a toothed wheel, in a row.
  Find: **the Green Tree**, the last living tree of the old forest, high in a hidden hollow (Pitch hints).
- **The Old Foundry** (hard pocket, 130–145): where the gear-teeth were cast: casting pits, rails, slag
  heaps, cold moulds, a half-cast tooth in the biggest pit. Slag golems (`split`), crucible newts (`lob`,
  molten metal), soot hounds (aggressive), bellows toads (`beam`, a low blast of hot air), iron ants
  (`shell`). Elites of the golem and the hound. **Field boss: Old Crucible**, a fire salamander living in
  the casting pit (`lob` or `stomp`). Finds: **the Pattern**, the wooden master pattern of the tooth with
  Ignis's mark, and his tally board, the last line "one short".
- **The Brimstone Fields** (branch, 125–140): the cone's flank: yellow crusts, fumaroles, acid pools,
  sulphur chimneys. Brimstone hoppers (passive), acid slugs (`trail`, an acid `style`), vent crabs
  (`shell`), fume wisps (`phase`), sulphur kites (`dive`), chimney spitters (rooted `lob`). **Field boss:
  the Brimstone Condor** (`dive`). People: **Picker Ochre** (AI, trader). Keeper stone: **the Breathing
  Stone**, the mountain drawn breathing in and out, and the islands with it. Find: **the Organ**, a cluster
  of chimneys that whistle a chord in the wind, with a ledge on top.
- **The Caldera Rim** (the heart, 135–150): the volcano's rim round the crater: wind, a turquoise crater
  lake far down, the column roaring up from the vent, and the Citadel circling close overhead. Rim goats
  (passive, hop), crag rocs (`dive`), glass scorpions (`shell`), heat shimmers (`phase`), pumice puffs
  (`split`). No elites and no field boss: the party den is the danger (like Keeper's Spine). No trader. Keeper
  stone: **the Hoist Stone**, every island's road meeting at a city on the ground, and a gear going up the
  road. Find: **the Bearer's Seat**, where you can watch the Citadel pass. **Party den: the Bearer's
  Hoist**, Brenna (below).
- **The thermal column** (vista, atlas Phase 6): the balloon's launch, by the skylift at Magma Heart's
  east end. Not built in the E track; its balloon is the visible-but-blocked thing for Phase 6.

### The branches' people (AI characters, `docs/social/ai-characters.md`)
Each a trader with a tier aimed at its branch's middle (`aim`, a staff twin for every sword), Tier 0 plus
their own corner, and a life of their own.
- **Liv** (the Smoking Coast): Ice-Cutter Eyvind's daughter, fjord folk thinned almost clear by seven years
  of heat (canon: great heat thins slimes out). She cuts black glass the way her father cuts ice and trades
  it. She stayed when the Lodestar went home, and now she's afraid the cold would set her solid; she
  stays, and the Lodestar carries letters both ways (her father's and Skaldi's personas learn this in her
  phase). She still has the other red mitten (the first is on Liv's Reach); she sits up with the
  Hatchkeeper's nest some nights; Soot knits for her; Slag asks her about snow. No quest: nothing to deliver.
- **Collier Pitch** (the Ashwood): the last charcoal-burner, a forge-slime whose family burned the forest
  for the foundry. Burns only deadwood now, counts fern seedlings in a ledger, knows where the Green Tree is
  and won't quite say. Dry, slow, sad.
- **Picker Ochre** (the Brimstone Fields): carries sulphur down to Forgehold's forges in two baskets on a
  yoke. Lost her sense of smell years ago, keeps a canary called Saffron (who warns her of bad air), sings
  to the vents. The plainest-spoken person on the island.

## Bosses: which ones get a story
Owner's rule (`island-depth.md`): big bosses get a story and `lines`; field bosses and elites get a name, a
look and a line. Move the stories into `../characters/bosses.md` when they ship.
- **The Hatchkeeper** (den, the Smoking Coast, ~Lv 115; shipped E2, story moved to `../characters/bosses.md`): a great black marine iguana. With a shard under
  her crest she keeps her clutch buried in sand the lava keeps hot, warm forever, so it never hatches and
  never leaves her. Holding on to her young (the same story as Eyvind and Liv, from the other side).
  Freed, the eggs hatch and the little ones run down to the sea. Ultimate from the landscape: the sand
  boils except in the tide-wet patches (reuse `spores`' safe circles). Minions: marine iguanas.
- **Brenna, the Last Bearer** (party den, the Caldera Rim, ~Lv 148–150; shipped E4b at Lv 149, story moved to `../characters/bosses.md`): a forge-slime, Forgewarden Ash's
  sister, chosen to carry the last tooth up the road to the Keepers' city. She set out the morning the
  land broke; there was no road left, so she climbed the rim, the highest place, and has held the tooth up
  ever since to the city circling past overhead, grown round it and into it, a shard in the tooth. Holding
  on to a duty nobody can take delivery of. Lines: "Is it time? Has someone come for it?" wearing down to
  "Not yet." Freed, she sets it down on the rim (it stays there: the Bearer's Seat), and the memorial wall's
  blank space gets her name in the same update. Ultimate: **Last Delivery**, the tooth rolled end to end of
  the den (reuse `wave`: jump it) `[proposed]`; built with a `party` entry for S5 (a weak point on the
  straps). Tier 3 by showing only: a tooth, a wheel, a city; the words (Tidewheel, Stopped Hour) stay
  Ignis's. Ash's persona learns that something with her shape stands on the rim; he won't go up.
- **Ignis and Pyra get `lines`** in the E track (shipped E4b) (their stories are already in `bosses.md`). Ignis's freed
  line carries Tier 3 in his own words; that is how the island delivers its truth.
- Small: **the Bellower**, **Hundredfoot**, **Greyback**, **Old Crucible**, **the Brimstone Condor**.

## Numbers (the island-depth defaults, applied)
- Mobs on the frozen curve at their level, within `MOB_FIT`; elites from `elite()` with the `ELITE_*`
  multipliers, only in the two hard pockets; field bosses worth `FIELD_BOSS_WORTH` minutes, respawning
  every `FIELD_BOSS_RESPAWN_MS`, HP by `BOSS_HP_PER_PLAYER`; dens like the Old Narwhal's (coins and
  materials a few minutes of farming, gear the rest; camped EXP under `BOSS_CAMP_MAX`).
- Trader tiers: Slag near the island's start, Liv near 108, Pitch near 122, Ochre near 135, each with an
  `aim`; mob-drop gear a little under, den and field-boss gear a step over; every item with a `lvl` within
  `GEAR_FIT` of the gear curve. Gear names in Emberdeep's register: basalt, black glass, iron, slag,
  charcoal, sulphur, ember; never ice, fur, shell or leaf. "Forged for a wheel that never got it."
- **Pets** (`PETS`): each new boss's pet must sit by level between Ignis's/Pyra's and the Colossus's (Lv 150),
  so prices for six new pets fit between the existing ones; watch `PETSHOP_W`.
- `npm run economy` before and after each phase; "farming your own level" past 115 picks the new mobs, which
  should pull "gold earned by" Lv 120–150 back down a little, as F1 did for 60–90. Re-check `HOUSE_SIZES`.
- **Potions on the road:** Soot, Liv, Pitch and Ochre all sell the basic potions.

## Systems: nothing new
Field bosses, elites, door level labels, the island map, waystones and crossing rooms all exist. The E
track adds data: `EMBERDEEP` in `src/shared/branches.js` (and `ISLAND_MAPS`), `ISLAND_OF_STAGE` rows in
`src/worldmap.js`, waystones with `isle: 'ember'` (Forgehold, Magma Heart by the Molten Forge's mouth, and
each branch hub; none in hard pockets), a crossing theme, a folk look. Follow the checklist in
`docs/places/branches.md`.

## Emberdeep phases
Each its own session and dev copy. Order: the landing first, then the empty levels (115–130), then bottom
up, then the party den (E4) and the final boss (E5); then atlas Phase 6.
- [x] **E0: the south (atlas Phase 5)** (shipped 2026-10-23; the Caldera pass went after both directions were
      tested; Magma Heart's waystone came with it; the balloon's gate sits west of Pyra's den, by the column). The Lodestar sails (two `'steam'` decks, Skipper Arne); Forgehold
      with Black Sand Shore (a town: respawn, home door, waystone; Ash, Soot and her shop, Slag and his
      shop; the forge-slime look; the memorial wall); the legacy room renamed and its west door repointed
      to Forgehold; Emberdeep's island map with every gate in the table laid. **The Caldera pass goes in
      the same update, and only once the Lodestar has been tested both ways** (never strand an island):
      the door and `drawCalderaPass` off Starfall Summit, its east end becoming a plain lookout with the
      smoke column on the southern horizon (drawing only). The skylift stays (the Citadel's only way in).
      **Phase 6's block:** the balloon lies deflated in its cradle on a ledge by the column, seen from
      Magma Heart's east end; E there: "The column keeps stalling. Nobody goes up in a wind that drops out
      under them." Personas: Runa (Arne sailed), Eyvind (his letters went south; no answer yet), Skaldi,
      Brine and Tove (the pass is gone, the Lodestar sails). Music scenes for the deck and the town. If
      it runs long, the map and gates move to the start of E1.
- [x] **E1: the Ashwood** (115–130) and **the Black Sands** (90–100, easy): Greyback, the Bellower, Collier
      Pitch, the Kiln Stone, the Turning Stone, the Green Tree, the Kettle; waystone in the Ashwood. Lifts
      the bridge and the geyser; lays the Old Foundry's gate (the bricked-up adit) in the Ashwood.
      Shipped 2026-10-27 (the Black Sands room 54, the Ashwood room 55); the hot-spring herb skipped (`docs/ideas.md`).
- [x] **E2: the Smoking Coast** (100–115) and **the Drained Tubes** (115–125, hard), the Hatchkeeper's den
      (with lines), Liv and her shop, Hundredfoot, the Tubes' elites, the Landing Stone, Liv's Lookout,
      the Skylight; waystone on the Coast. Eyvind's, Skaldi's, Soot's and Arne's personas learn Liv's news.
      Shipped 2026-10-28 (the Coast room 56, the Hatchkeeper's den 57, the Tubes room 58; `docs/places/coast.md`,
      `docs/places/tubes.md`); the mini Hatchkeeper and mini Hundredfoot are their art shrunk (`docs/ideas.md`).
- [x] **E3: the Brimstone Fields** (125–140) and **the Old Foundry** (130–145, hard): the Brimstone Condor,
      Old Crucible, the Foundry's elites, Picker Ochre and her shop, the Breathing Stone, the Organ, the
      Pattern; waystone in the Fields. Lays the Rim's gate (the Bearers' stair) in the Fields.
      Shipped 2026-10-28 (the Fields room 59, the Foundry room 60; `docs/places/brimstone.md`, `docs/places/foundry.md`).
- [x] **E4: the Caldera Rim** (135–150) and Brenna's party den (with lines and a `party` entry),
      the Hoist Stone, the Bearer's Seat, the name on the memorial wall; Ignis's and Pyra's lines. Then
      Emberdeep is done and **atlas Phase 6** resumes: the column vista, the balloon (the update lifts
      the block: Slag built the pilot a forge-burner that carries the basket through the stalls), the
      Skydocks and its camp, and the skylift goes once the balloon works.
      E4a shipped 2026-10-28: the Caldera Rim (room 61, `docs/places/rim.md`: the stair rechained by Slag and Ochre,
      the Hoist Stone, the Bearer's Seat with room left for the tooth, a waystone; personas learn the stair is open).
      E4b shipped 2026-10-28: Brenna's den (room 62, the Bearer's Hoist, at `BRENNA_DEN_X`: her lines, `party` entry with
      a weak point on the straps behind her, `weak.back`), the tooth set down on the Seat, her name on the wall (Ash
      carved it), Ignis's and Pyra's lines. Story moved to `../characters/bosses.md`. E4 is done.
- [ ] **E5: Emberdeep's final boss** (owner, 2026-10-24; `../final-bosses.md`): four or more players at the recommended Lv 150 (the boss shown far higher),
      about 30 minutes, far past the Old Foundry `[default]` (a deep room, an approach, the den). The pass's last phase; atlas Phase 6 can
      start alongside it, since the balloon doesn't depend on it.
      (a) on paper 2026-10-29, approved: Typhon, the Buried Fire, under the Old Foundry (`../e5-plan.md`).

## When a phase ships
Tick it here, move it to `../done.md` (one line) and off `../roadmap.md`, add its leftovers to
`docs/ideas.md`, add new people to `../characters/people.md` and new places to `../inventory.md`.

## Decisions (settled 2026-10-23: the owner took every default)
Kept as written for the reasoning; each `[default]` below is now the decision.
1. **Renames.** "Emberdeep Caldera" → **Emberdeep** (the island and the stage's pill and room name; the
   zones keep their names, "the Caldera" being Magma Heart's bowl) `[default: yes, in E0]`. The skylift →
   **a balloon** `[default: not a rename; the skylift is removed in Phase 6 when the balloon replaces it]`.
2. **Is the Steam Straits voyage gated on the Astral Wyrm?** `[default: no]`. The game has no hard gates on
   purpose; the update lifts the block and Arne's line credits the stars. The gangway just says "Lv 90+".
   Once per-account story progress exists (atlas Phase 7), characters can react to whether you beat the
   Wyrm, still without a gate.
3. **The balloon's grounding reason** `[default: the column stalls, and no pilot launches into a wind that
   drops out]`; Phase 6 lifts it with Slag's forge-burner. Alternatives: a torn envelope being re-sewn;
   tie it to Pyra ("only she knows the column's moods").
4. **The band's top** `[default: 150]`, with the Citadel at 140–200. The overlaps are 10 levels, not the 20
   between Greenhollow and Frostpeak. Alternatives: start the Black Sands at 85 (overlap 15), or run to 160.
5. **Forgehold as one room with Black Sand Shore as its quay** `[default]` vs two rooms (shore, then town).
   One room keeps "you step off the boat into a town" exact; the atlas listed them separately.
6. **Liv lives in Emberdeep** `[proposed]` and stays there (letters both ways). It closes a thread Eyvind's
   persona has carried since F1; the alternative is to leave her unfound.
7. **Brenna, the Last Bearer** `[proposed]`: a forge-slime as the party den boss (like Glacia, a person), and
   Ash's sister. The memorial wall's name appears in her phase.
8. **Ash and Tier 3** `[default: he deflects until per-account progress exists]`; the island's Tier 3 is
   told by Ignis's lines meanwhile. Keeper stones show (wheels, teeth, a city) but never name the Tidewheel,
   the Stopped Hour, Chronos or Pell.
9. **New AI characters:** Skipper Arne, Liv, Collier Pitch, Picker Ochre `[default: all four, AI with
   memory]`, plus the three the atlas named. Names all `[proposed]`.
10. **The pass's end on Starfall Summit** `[default: a plain lookout, drawing only]`; no door, no sign.
11. **Pets:** six new boss pets squeezed between Pyra's and the Colossus's prices `[default: fit them in;
    if it's too tight, raise the Citadel's pets, keeping Chronos's on top]`.
12. **Getting home:** Emberdeep is two sailings from Slimeville `[default: leave it; the house door in
    Forgehold and a Return scroll cover it; a direct Forgehold to Greenhollow sailing waits for the
    "routes reconnect" idea in `geography.md`]`.
13. **Heat** as a mechanic (heat thins slimes) `[default: none; flavour only]`.
