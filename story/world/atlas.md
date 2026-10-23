# Atlas: landscapes, links and the build order

The working plan for **what to draw and build next, starting from Slimeville**, and the reference sheet for
anyone adding a mob, boss, town or character. `geography.md` says *why* the map is shaped this way; this
file says *what each place is made of* and *in what order to make it*. Region files (`regions/`) hold the
mood and story for each island. Anything not already in the game is `[proposed]` until the owner signs off.

## Contents
1. How to use this file
2. The shape of every island (the room kinds, and the rules for linking them)
3. The link graph (which island connects to which, and the level bands)
4. Landscape catalogue (the art brief for every landscape type)
5. Island sheets: Greenhollow, Frostpeak, Lantern Fen, Emberdeep, Amberdune, the Citadel, the post-game
6. Boss slots at a glance
7. Hometown checklist
8. Where each thing goes in the code
9. The build order (start at the village and walk outward)

## How to use this file
- **Adding a mob:** find its zone's sheet below, fill an open mob slot (or add one that fits the slot
  rules), and match the zone's level band and landscape. Then `docs/combat/stages.md` and `docs/economy.md`.
- **Adding a boss:** it goes in a boss slot below, with its holding-on / letting-go story
  (`../characters/bosses.md`). Then `docs/combat/bosses.md` and `docs/economy.md`.
- **Adding a character:** put them in a hometown's cast below. Then `../characters/people.md` and
  `docs/social/ai-characters.md`.
- **Building a place:** take the next unticked phase in **The build order** at the bottom.
- Tick things here *and* in `../roadmap.md` when they ship, and update `../inventory.md`.
- **The World map** in the Esc menu (`docs/ui/world-map.md`) draws this geography for players. When a
  place ships, add it there too (un-fog an uncharted island once it's real).

## The shape of every island
Each island is a walk **from where you land, inland, then up or down to its heart**. The same room kinds
repeat on every island, so every new island is a known amount of work:

| room kind | what it is | combat? | examples |
|---|---|---|---|
| **Harbour / landing** | where the crossing arrives. Piers, a dock, the island's first view | no | Greenhollow Harbour, Icefang Fjord landing, Black Sand Shore harbour, the Skydocks mooring |
| **Hometown** | the island's people: a lore-holder, a trader, a place to rest. Safe. A game town: respawn and a door home | no | Slimeville, Icefang Hamlet, Forgehold |
| **Wilds** | the stage room: 2–4 zones, harder the further inland | yes | the Wildwood, Frostpine Ridge, Cinder Flats |
| **Heart / height** | the last zone: the landmark you saw from the sea | yes | Bramble Woods' ruins, Starfall Summit, Magma Heart, Chrono Spire |
| **Den** | a boss room off the wilds, one per boss | boss | the nine existing dens |
| **Vista** | a short dead end that shows the world: the "how far everything is" moment | no | Greenhollow's east cliffs, the thermal column launch |
| **Crossing** | a moving deck between islands (one room type, themed per route) | light | the ferry, the Steam Straits ship, the balloon |

Rules:
- **Islands link only by crossings**, harbour to harbour. Inside an island, rooms link by doors as now.
  No back door ever joins two islands' wilds again (`geography.md`).
- **Order inside an island:** harbour → hometown → wilds (easy zone to hard) → heart, with dens off the
  wilds and the onward crossing at the heart or the harbour. A player always meets the people before the
  danger.
- **Safe rooms stay safe.** No mobs in a harbour, hometown or crossing (crossings may get light, optional
  "things climbing aboard" later; never a death trap).
- **Every landing has a town** (owner, 2026-10-20: "there should be one town each, especially if long
  sailing is needed"). Arriving somewhere new after a crossing, you walk off the boat into a town, not
  straight into the wilds. Every town is a game town like Slimeville (`TOWNS`, `docs/world.md`): being
  there makes it your respawn point, and it has a door into your own house. Icefang Hamlet is the first
  (Phase 4). The harbour and the town can be one room (Icefang) or two (Greenhollow).
- Each island needs **one landmark** visible from every other outdoor sky (`geography.md`).

## The link graph
```
                       [Frostpeak]  Lv 12-27
                Icefang Fjord landing + Icefang Hamlet
                → Frostpine Ridge → Starfall Summit
                        ^            |
                 the ferry           | ship through the Steam Straits
                 (cold sea)          | (needs the stars back?  see open-questions)
                        |            v
 [Greenhollow] Lv 1-12  |       [Emberdeep]  Lv 27-50
 Harbour - Slimeville --+       Black Sand Shore + Forgehold
 - the Wildwood - east cliffs   → Cinder Flats → Magma Heart → thermal column
                                     |
                                     | the balloon (cloud climb)
                                     v
                          [Aether Citadel]  Lv 48-80
                          the Skydocks → Cogwork Bastion → Chrono Spire

 Side islands [proposed], reached by boat once their route opens:
   Lantern Fen (east, Lv 24-34)      opens after Frostpeak   (a quiet detour before the south)
   Amberdune (south-west, Lv 40-55)  opens after Emberdeep   (the missing desert)
 Post-game [proposed]:
   the Maelstrom rim (Lv 80+) → the Sunken Reach (under the sea, needs swim physics)
```
**These bands are being widened** (owner, 2026-10-20): Greenhollow 1-60, Frostpeak 40-100, the later
islands above them in turn. The numbers in the graph are today's (legacy) ones; `island-depth.md` has
the plan, and each island's band changes when its depth pass ships.
Level bands overlap by a level or two on purpose, so a player arriving somewhere new isn't instantly
over- or under-matched. The bands are the zones' `lvl` in `src/shared/rpg.js`; the code is the truth.

## Landscape catalogue (the art brief)
Every landscape keeps the house style (`docs/art.md`): soft, rounded, pastel, procedural, no images. The
further from home, the *deeper and less sugary* the palette gets, never harsh or gritty.

| landscape | island | ground and platforms | sky and light | things that move | hazard idea |
|---|---|---|---|---|---|
| bay village | Greenhollow | grass, cobbles, wooden decks | warm day cycle | leaves, chimney smoke | none |
| harbour | Greenhollow | plank piers over water, stacked crates | sea haze, gulls | boats bobbing, waves | none |
| meadow | Greenhollow | rolling grass, stumps | bright, open | flowers, butterflies | none |
| damp lowland | Greenhollow | moss, big caps as platforms | dim green, glowing threads | spores drifting | spore clouds (boss only) |
| thorn thicket + ruins | Greenhollow | briar arches, mossy standing stones | green-gold dusk | falling petals | thorn walls |
| sea cliffs (vista) | Greenhollow | grass to a sheer edge | huge sky, the other islands | wind in grass, birds | none |
| fjord | Frostpeak | black rock, blue ice shelves, turf huts | grey sea, early aurora | ice floes, the cracked ice bridge | slippery ice `[proposed, step()]` |
| snow forest | Frostpeak | snowdrifts, pine boughs | pale blue | snowfall | none |
| star crater | Frostpeak | glassy ground, crystal spires | wrong stars, smeared and clumped | star-dust | falling stars (boss) |
| black sand beach + hot springs | Emberdeep | obsidian sand, rusted iron piers, steaming pools | orange haze, smoke column | steam, geysers | geyser jets |
| ash plains | Emberdeep | ash dunes, half-buried giant gear teeth | dim red | ash fall | burning puddles |
| forge town | Emberdeep | stone ledges cut into the caldera wall, chains | forge glow, heat haze | bellows, sparks | none (safe) |
| magma core | Emberdeep | basalt over lava | lava-lit from below | lava bubbles | lava |
| sky docks | Citadel | broken piers over a cloud sea, mooring rings | cold bright sky, the archipelago far below | wind streaks, loose banners | wind gusts `[proposed, step()]` |
| cog city | Citadel | brass walkways, turning gears | pale gold | automatons, ticking | lasers |
| time spire | Citadel | floating stone, frozen rain | wrong-coloured, still | echoes replaying | time slows (boss) |
| ghost marsh | Lantern Fen | reeds, boardwalks, lily pads | violet night, drifting lights | lanterns, fireflies | sticky bog `[proposed, step()]` |
| desert | Amberdune | dunes, sandstone shelves, a buried observatory | bleached gold, heat shimmer | sand blowing | sandstorm visibility |
| seabed | the Sunken Reach | coral over clockwork, drowned Keeper roads | blue-green gloom, light shafts | bubbles, fish | currents `[needs swim physics]` |

**Anything that changes how players move (ice, wind, bog, swimming) is a `step()` change**, driven by
the room and position, never by messages (`docs/netcode.md`). Budget for that work, or make it drawing
only.

## Island sheets
**Level bands moved (the rebalance, R, 2026-10-23; `world/island-depth.md`):** Greenhollow is Lv 1–60,
Frostpeak 40–100, Emberdeep about 90–150, the Citadel about 140–200. The bands in the sheets below are
from before it; read each as "the same order, in the island's new band".

Each sheet lists rooms in walking order. **Mob slots:** each wilds zone wants 3–4 kinds: one *passive*
(free EXP, shows the landscape), one *aggressive* (chases), and one or two with a *gimmick* that comes
from the landscape (reuse an existing `ai` in `server/rpg.js` before writing a new one). Names soften
near home and get older and plainer further out (`../README.md`). Mobs are the island's wildlife; only
the Citadel's are machines and echoes.

### Greenhollow (home, Lv 1–12): cozy, puns welcome
1. **Greenhollow Harbour** (exists, room 19 west of the village): piers, the lighthouse (lit since
   Phase 3: Granny Wicks came home), fishing boats, the ferry Puddle Jumper (running). Cast: **Captain Brine** (AI, the ferry), Pickles his
   gull. Later: sailors from other islands.
2. **Slimeville** (exists): hometown. Cast: Elder Mochi, Curator Clio, Merchant Pip, the baker, the
   innkeeper. Over the acts it changes a little (lit lighthouse, foreign goods at Pip's).
3. **The Wildwood** (exists):
   - *Sprout Meadow* (1–3): sprouts. Open slot: a passive meadow critter (a bumblebee, a hopping
     dandelion).
   - *Mushroom Grove* (4–7): mushlings. Open slot: something on the glowing threads (a firefly that
     lights up when hit).
   - *Bramble Woods* (8–12): bramblehogs. **Keeper ruins** (exist: four readable stones, Tier 1). Open slot:
     a stone moss-turtle near the ruins (shell AI, the first "block from the front" lesson).
   - Dens: Sprout King, Mother Mushroom, Bramble Behemoth (all exist).
4. **The east cliffs** (exists, room 20, a vista): through a gap in the briar at the Wildwood's east end.
   No mobs. A bench, a telescope (E to look: swings between Frostpeak, the Citadel and Emberdeep).
   The Wildwood's only east exit since the Highlands trail went (Phase 3).

### Frostpeak (far north, Lv 12–27): quiet, dry humour at most
1-2. **Icefang Fjord and Icefang Hamlet** (exists, Phase 4, one room: `docs/places/fjord.md`): the
   ferry's quay, the cracked ice bridge in the sky, turf-roofed huts round a lamp-fire. A town: respawn
   and a home door. Cast (all AI characters): **Old Skaldi** (lamplighter and songs, Tier 2 as song
   fragments), **Netmender Runa** (the trader: warm gear, frostbloom; her cousin Arne owns the Lodestar),
   **Tove** (Skaldi's granddaughter, feeds the yeti cubs, the guide to the ridge's creatures). No mobs
   (owner's call).
3. **Frostpine Ridge** (exists, 40–46 since the rebalance; was 13–17): frostlings, yeti cubs, **floe seals** (passive, belly-slide) and
   **snow owls** (dive), the last two added in Phase 4.
4. **Starfall Summit** (exists, 47–60 since the rebalance; was 18–27): star wisps, crystal golems, **shard-moths** (Phase 4).
   - Dens: Frost Queen Glacia, Astral Wyrm (exist).
   - **The Rimeglass Glacier** (exists, 60–75, Frostpeak's depth pass F1): snow hares, snow petrels, glacier
     rams, rime wolves, frost wraiths, great yetis; Old Rimehorn (field boss); Ice-Cutter Eyvind.
   - **The Whale Skerries** (exists, 55–70, F2, off the hamlet) with the Old Narwhal's den, and **the Narwhal
     Grotto** (exists, 70–80, hard).
   - **The Aurora Heights** (exists, 75–90, F3, up the Glacier's Icefall): ptarmigan, snow foxes, rime eagles,
     aurora jellies, musk oxen, lost stars; the Pale Wyrm (field boss). **The Blue Halls** (exists, 80–90,
     hard, under the Glacier): icicle bats, ice worms, glass beetles, prism crawlers, elites; the Hall Troll
     (field boss). The Queen's Bridge is planned in `island-depth.md`.
5. Onward: the ship south leaves from the fjord's quay: the **Lodestar**, laid up (shown, not open) until
   Phase 5, because nobody will steer south while the stars are wrong.

### Lantern Fen (east side island, Lv 24–34) `[proposed]`: strange, gentle, sad
A detour for players between Frostpeak and Emberdeep, and the theme from another angle: grief.
1. **Reedwater landing**: a single jetty in fog.
2. **Wickmere** (hometown): stilt houses joined by boardwalks; every window has a lantern for someone
   gone. Cast: **Wren the Lamplady** (AI: tends the lanterns, speaks softly, knows the old funeral songs
   that mention the Keepers), **Ferryman Hob** (poles the punt between islets).
3. Wilds: *the Shallows* (24–28): **lantern moths** (passive, glow), **bog slimes** (sticky, slow you:
   needs `step()`, or make it a hit that applies a slow); *the Drowned Grove* (29–34): **will-o'-wisps**
   (phase out, reuse the chrono wraith), **reed stalkers** (ambush from the reeds).
4. Boss slot: **The Wickmother**, a great moth who swallowed a shard and now can't let any lantern go out,
   so the fen is choked with the lights of the dead and nobody can grieve. Beaten, the lights dim one by
   one, gently. Den: *The Hall of Lamps*.

### Emberdeep (far south, Lv 27–50): blunt, heavy, almost no humour
1. **Black Sand Shore** `[proposed]`: the ship lands at a rusted iron harbour. Hot springs where slimes
   soak, the last soft spot. Mobs only past the springs (27–30): **steam toads** (hop, leave steam puffs:
   reuse the magma slug puddle), **scald eels** (pop up from the pools).
2. **Forgehold** `[proposed hometown]`: cut into the caldera wall; the memorial wall of smiths' names.
   Cast: **Forgewarden Ash** (AI, Tier 3, trusts you only after Ignis), **Auntie Soot** `[proposed]` (runs
   the springs at the shore; the one kind voice here), **Slag** `[proposed]` (a young smith who still
   believes the gears can be finished; sells heavy gear).
3. **Cinder Flats** (exists, 28–38): ember imps, magma slugs, obsidian crabs. Giant gear teeth in the ash
   `[proposed scenery]`.
4. **Magma Heart** (exists, 38–50): cinder bats. Open slot: a **slag golem** half-made from a dropped gear.
   - Dens: Ignis, Pyra (exist).
5. **The thermal column** `[proposed vista]`: the balloon launch, replacing the skylift.

### Amberdune (south-west desert island, Lv 40–55) `[proposed]`: dry, ancient, quietly grand
The missing desert. Reached by ship from Black Sand Shore once Emberdeep's bosses are beaten.
1. **Saltmouth**: a dry harbour; the sea has pulled back from the old piers (the Drift, made visible).
2. **Caravanserai** (hometown): tents and a well, people always packing to move on. Cast: **Mother
   Dune** (AI: caravan leader, reads the old Keeper star-dials), **Tally** (a trader who counts
   everything).
3. Wilds: *the Glass Dunes* (40–47): **sand skippers**, **dune beetles** (burrow, then burst up);
   *the Buried Observatory* (48–55): Keeper star-dials half-swallowed by sand, **dust wraiths**.
4. Boss slot: **Old Carapace**, a giant tortoise carrying the empty caravan town of its people on its
   back, still walking toward where Pangelea's heart used to be. It won't stop, and the town is dying of
   thirst on top of it. Beaten, it lies down, and the town can finally settle. Den: *The Long Road*.

### The Aether Citadel (sky, Lv 48–80): solemn, no whimsy
1. **The Skydocks** `[proposed first zone]` (48–52): broken piers, empty mooring rings, wind. Mobs:
   **loose bolts** (swarm, like cogbits), **rigging moths** (fly). Cast: **the Dockwarden** `[proposed]`,
   a still-working porter automaton that keeps logging arrivals that never come; not an AI character,
   just a few fixed lines.
2. **Cogwork Bastion** (exists, 50–65): coglings, sentry drones, aether knights.
3. **Chrono Spire** (exists, 66–80): chrono wraiths. Cast: **the Last Echo** (AI, Tier 4).
   - Dens: the Clockwork Colossus, Chronos (exist).
4. No people of its own: the Citadel has no living people, and that absence is the point. **But its
   landing still gets a town** (the owner's rule above) `[proposed]`: **the Skydocks camp**, tents and a
   brazier lashed to the one pier that still holds, kept by travellers from the other islands who came
   up by balloon: the balloon's pilot (the trader), a Wickmere pilgrim, a forge-slime looking for Ignis's
   lost gear. The Citadel stays empty; the camp is visitors huddled at its edge.

### Post-game: the Maelstrom and the Sunken Reach (Lv 80+) `[proposed]`
1. **The Maelstrom rim**: a raft-camp lashed to wreckage where the sea turns. Hometown-lite. Cast:
   **Captain Brine**, who came this far for the first time; **Pell** (after the finale, maybe here before
   he goes home to the apple tree).
2. **The Sunken Reach**: drowned Keeper roads. Needs a swim mode in `step()` (slimes float). Mobs:
   **lantern-fish**, **coral automatons**, **drowned echoes**. Boss slots: the guardians of the other
   Keepers' parts of the Wheel, one per future arc (`../expansion.md`). Don't name the other Keepers in
   canon yet; it's deliberately open (`../canon.md`).

## Boss slots at a glance
| island | bosses | open slots |
|---|---|---|
| Greenhollow | Sprout King, Mother Mushroom, Bramble Behemoth | none needed |
| Frostpeak | Frost Queen Glacia, Astral Wyrm | optional fjord boss (a sea creature under the ice bridge) |
| Lantern Fen | | The Wickmother `[proposed]` |
| Emberdeep | Ignis, Pyra | none needed |
| Amberdune | | Old Carapace `[proposed]` |
| Citadel | Clockwork Colossus, Chronos | none: Chronos is the end |
| Sunken Reach | | the other Keepers' guardians `[proposed]` |
Every new **big** boss (a den or a capstone; owner, 2026-10-20: small field bosses and elites need no
story, just a name and a line): a creature twisted by an Anchor shard, a small holding-on or letting-go story, an
ultimate that comes from its landscape, a line on entering / phase change / freed, and loot that names
its island (`../delivery.md` for the register).

## Hometown checklist
Every hometown has, in this order of importance:
1. **One lore-holder AI character** fed the canon tiers (`../delivery.md`). Only one per town: AI
   characters are the expensive part.
2. **A trader** with the island's goods (fixed lines are fine; can share Pip's shop UI).
3. **One or two flavour NPCs** with fixed lines, to make the place feel lived in.
4. A harbour door, a rest spot (bench, fire, springs), and a view of the landmark.
5. Its people's own slime look (`../characters/people.md`): hue, texture, wobble.
6. In the game: a `TOWNS` entry (where you wake up) and a door into your own house (`docs/world.md`).
Owner's call (2026-10-20): every town character is an AI character (a purpose AND chattable), so item 3's
fixed-line NPCs are now AI characters too, with narrow lore; the "one per town" cost note stands for
lore-holders.

## Where each thing goes in the code
Names here are the code's; the docs in brackets say how each part works. Check them before you build:
the code is the truth, and this list only points at it.

| to add… | touch | read |
|---|---|---|
| a mob | `MOBS` and `SPAWNS` in `src/shared/rpg.js`; its brain in `mobAi` (`server/rpg.js`) only if it has an `ai`; its look in the stage's art file | `docs/combat/stages.md`, `docs/economy.md` |
| a loot item or gear | `ITEMS` in `src/shared/rpg.js`, the mob's drops | `docs/combat/items.md`, `docs/economy.md` |
| a boss and its den | `MOBS` (with `boss: true`, `ult`, `minion`), a den in `DENS`, its moves in `server/rpg.js`, art in `src/dens.js` | `docs/combat/bosses.md`, `docs/economy.md` |
| a zone in a stage | the stage's zone list (`ZONES`, `HIGHLAND_ZONES`, `CALDERA_ZONES`, `CITADEL_ZONES`), its platforms, spawns | `docs/combat/stages.md` |
| a new room (harbour, town, crossing, stage) | `ROOMS` and the doors in `src/shared/sim.js`; for a combat stage also `STAGES` and `COMBAT_ROOMS` in `src/shared/rpg.js`; an art file that paints its own sky; a music scene in `src/audio.js` | `docs/world.md`, `docs/combat/stages.md`, `docs/ui/audio.md` |
| an AI character | a persona in `server/characters.js`, placed in `NPCS` (`src/shared/sim.js`) | `docs/social/ai-characters.md`, `../delivery.md` |
| movement that's new (ice, wind, bog, swim) | `step()` in `src/shared/sim.js` only | `docs/netcode.md` |
| the World map | `src/worldmap.js` | `docs/ui/world-map.md` |
Then the `// Docs:` line, the doc update, the index row in `Agent.md` for a new area, and mobile.

## The build order (start at the village and walk outward)
**Paused after Phase 4** (owner, 2026-10-20): islands get deep before new ones are added. Work
Greenhollow's depth phases, then Frostpeak's, in `island-depth.md`; Phase 5 resumes after that.

Each phase leaves the game fully playable. **Never remove a back door before its crossing works**, or an
island becomes unreachable. Each phase is its own session; read the docs it names first.

**Owner's rule between phases:** what the next phase delivers is visible but blocked by an in-world
reason (a barricade, a laid-up ship, a character's refusal), never a "coming soon" sign and never a
stand-in door into an existing area.

- [x] **Phase 0: skies.** Distant islands drawn in every outdoor sky in their compass direction
      (`src/distant.js`, shipped 2026-10-20; `docs/places/harbour.md`).
- [x] **Phase 1: the west end.** Greenhollow Harbour room, the lighthouse, Captain Brine as an AI
      character (shipped 2026-10-20). The ferry Puddle Jumper is moored but laid up: Brine won't sail
      while the lighthouse is dark. No door to the Highlands, by the rule above.
- [x] **Phase 2: the Wildwood's story.** Keeper ruins with plaques in Bramble Woods; the east cliffs vista
      with the telescope (shipped 2026-10-20; `docs/places/cliffs.md`). The Highlands trail stays until
      Phase 3's ferry works.
- [x] **Phase 3: the crossing room.** One moving-deck room type, themed per route. First theme: the cold
      sea ferry. The patch itself lights the lighthouse (no quest, owner's call); the harbour then
      leads onto the ferry, the ferry to Frostpeak, and the Highlands trail goes (shipped 2026-10-20;
      `docs/places/crossings.md`). She ties up at a jetty at the ridge's west end: the fjord is frozen
      over, with the hamlet and ice bridge in sight from the deck (Phase 4's visible-but-blocked).
- [x] **Phase 4: Frostpeak's front.** Icefang Fjord and Icefang Hamlet in one town room (Old Skaldi, Runa
      and her shop, Tove), the fjord-folk slime look, the cracked ice bridge, floe seals, snow owls and
      shard-moths. The update thawed the fjord: the ferry lands at the hamlet's quay, the ridge jetty
      became the path down, Brine's persona dropped the frozen-fjord line (shipped 2026-10-20,
      `docs/places/fjord.md`). Towns came with it: respawn in your town and a home door in every town
      (`docs/world.md`). The stage is renamed **Frostpeak**. Phase 5's visible-but-blocked: the Lodestar,
      laid up at the quay, no stars to steer by.
- [ ] **Phase 5: the south.** The Steam Straits crossing (the Lodestar sails), Black Sand Shore with the
      springs, Forgehold (Ash, Auntie Soot, Slag) as Emberdeep's town (respawn, home door). The Caldera
      pass goes. Next phase's block: the balloon, grounded for an in-world reason.
- [ ] **Phase 6: the climb.** The thermal column vista, the balloon crossing, the Skydocks zone, the
      Skydocks camp as the Citadel's town, and the Dockwarden. The skylift goes.
- [ ] **Phase 7: story progress.** Per-account lore tiers feeding every AI character; boss lines
      (`../roadmap.md` §2). Can run alongside any phase from 1 on.
- [ ] **Phase 8: Lantern Fen** (side island, the Wickmother).
- [ ] **Phase 9: Amberdune** (side island, Old Carapace).
- [ ] **Phase 10: the finale and the post-game**: the Wheel event, the Maelstrom rim, swim physics, the
      Sunken Reach.

Every phase: mobile layout and touch (`docs/ui/mobile.md`), economy check for any new mob or loot
(`docs/economy.md`), a `// Docs:` line and doc updates for new code, a music/ambience scene
(`docs/ui/audio.md`), and new rooms in `docs/world.md`.
