# Atlas Phase 9: Amberdune, on paper (for the owner to approve)

**Status: written 2026-11-15 at the owner's "continue with next phase and the phase after", right after the Citadel's
C6 (c). Approved 2026-11-17 ("continue with the next two phases": every default standing). A0 and A1 shipped together
2026-11-17 (`docs/places/amberdune.md`, `glassdunes.md`, `oasis.md`, `observatory.md`); A2 and A3 together 2026-11-18
(`docs/places/saltflats.md`, `buried.md`); A4 and A5 to come.** Like Lantern Fen's (`phase8-plan.md`), this phase starts on
paper because the band and the island's shape are the owner's to settle.

This is Phase 9 of `world/atlas.md`: the south-west side island, a desert, and Old Carapace. It follows
`world/island-depth.md` (the method and the "deep" checklist) the way `phase8-plan.md` did, and the owner's story rules in
`roadmap.md`. Read `world/atlas.md` ("Amberdune"), `world/regions/uncharted.md` and `docs/places/blacksands.md` first.

How to read it:
- `[default]` means what gets built unless the owner says otherwise.
- Everything named here is `[proposed]` until it ships.
- The owner's calls are in **Open decisions** at the bottom, each with a default.

## The idea
The theme from another angle again: **moving on**. Everywhere else slimes hold on to something that's gone. In Amberdune
they can't stop leaving.
- **The caravan folk** are always packing. Their town, Caravanserai, is tents round a well, and every tent is half struck.
  The sea has pulled back from Saltmouth's piers (the Drift, made visible), the wells are going down, and every year the
  caravan talks about moving on and never quite does.
- **Old Carapace** is the island's heart. A tortoise as big as a hill, he carries the empty caravan town of his people on
  his back, walking toward where Pangelea's heart used to be: the middle of the sea, where the Maelstrom is now. A shard
  sits in him.
  - He won't stop, and the town on his back is dying of thirst.
  - Beaten, he lies down, and the town can finally settle.
- **Holding on to the journey itself** is his trouble. Letting go is lying down.

**Tone** (`delivery.md`): **dry, ancient, quietly grand.** Sun-bleached and patient, the oldest-feeling place in the world,
with long silences and big skies. Warmer than the Citadel, sparer than Emberdeep. Quiet humour is fine (the caravan folk
are wry and practical); no puns near Old Carapace.

**Names**: dry, old trade-road words (salt, dune, well, tally, drover, mirage, caravan, amber).

## The band: Lv 215–250 `[default]`
- **Why there.** Amberdune covers **Lv 215–250**, new top-end content past the Citadel's (the Undercroft 205–215, the
  Escapement recommended at 215). The owner's standing notes point that way:
  - "let it expand forever with new places" (2026-11-06);
  - "don't be afraid to make the levels go past 200" (2026-11-12);
  - Lantern Fen went past the Citadel the same way (150–180, then 190).
- **Overlaps.** Its bottom overlaps the Citadel's top; its top (240–250) has the island's own deep places.
- **Its final boss.** Old Carapace is fought at **Lv 250**: his tag reads `finalTag(DUNE_TOP)`, "Lv 270 · recommended Lv
  250, 4+ players".
- **Still a side island in the story.** The atlas has it opening "after Emberdeep", off the main road. It's reached from
  Emberdeep's west shore (below), just a far harder place than its neighbours: the desert grew strange and dangerous round
  a walking hill with a shard in it.
- **No canon tier** `[default]`, like the Fen. Nothing in the main road needs it.
  - The caravan folk know Tier 0 and their own island. Mother Dune reads the Keepers' star-dials and knows the stars moved
    (Tier 0: everyone does), but not why.
  - Old Carapace walking toward the old heart is a hint at the finale (Phase 10), shown, never told.
- **The numbers.** New mobs go on the frozen curve as always (`island-depth.md` "Numbers"). The sheet's `PROGRESS` and
  `CURVES` already read to 220 and 250; **A0 stretches both past 250** (the L5 (b) pattern, `docs/economy.md`).
- **Gear** in Amberdune's register: sandstone, sun-glass, salt-iron, amber, caravan brass, drover's leather.

## The landing (A0)
### The crossing: a salt-skiff from the Black Sands `[default]`
- **The skiff.** The atlas says "by ship from Black Sand Shore": the Black Sands (room 54, west of Forgehold) is the shore.
  The update itself brings her in (no quest): **the Saltwind**, a caravan skiff with a patched ochre sail, drawn up on the
  black sand by the Beach Path, come round the coast for Forgehold coal.
  - Her gangway is a door with `ask` (the Set sail card) and a "Lv 215+" label, no gate.
- **Two crossing rooms** (out and home), a new route theme `'dune'` (`src/crossing.js`, `docs/places/crossings.md`). The
  voyage:
  - Emberdeep's smoke column astern, and the warm green sea paling to turquoise.
  - Sandbars, then the water so shallow the skiff's keel hisses.
  - Dunes on the horizon, gold, then a whole coast of them.
  - **Saltmouth's piers** standing high and dry a long way inland of the water.
  - The skiff ties up at a new jetty where the sea is now, and the walk in is across the old seabed.
- **Skipper Kesh** (AI, dune folk, at the tiller of both decks via `also`). Purpose: the crossing, like Brine, Arne and
  Netta. Lore: Tier 0 and the coast road. Life:
  - she's the caravan's sailor, the only one who likes water;
  - she keeps moving the jetty further out every season as the sea goes, and counts it a personal insult;
  - she trades sand-glass beads to Soot for hot-spring salts and won't say what for.
- **No link to Lantern Fen or the Citadel** `[default]`: Amberdune is reached from Emberdeep and left the same way (or by a
  Return scroll). Its waystones are its own island's (`isle: 'dune'`).

### The town: Caravanserai, with Saltmouth's dry piers as its waterfront `[default: one room]`
Owner's rule: every landing is a town. Like Wickmere, Icefang Hamlet and Forgehold, it's **one room**:
- **West: Saltmouth.** The old harbour, its stone piers standing on dry sand, boats careened on their sides where the water
  left them, a salt line high on every wall. The path in from Kesh's jetty comes up over the old seabed.
- **East: Caravanserai.** Striped tents round a deep stone well with a windlass, packs and bundles everywhere, half-struck
  tents, laden pack-beasts (slime-sized sand lizards) dozing in the shade, and lanterns of amber glass. The Star Court is a
  ring of Keeper star-dials half-buried at its edge, where Mother Dune sits at night.
  - The east end leads out onto the Glass Dunes.
- A `TOWNS` entry (wake by the well), a home door (a tent flap), a waystone, no mobs.
- **The dune folk look** (`folk: 'dune'`, `characters/people.md`):
  - warm amber-gold jelly with a little sand caught inside;
  - a slow, steady wobble (they walk a long way every day);
  - long scarves, wrapped hoods and veils against the sun and sand;
  - brass rings and beads.
- **Its people** (AI with memory, narrow lore, rich lives; `docs/social/ai-characters.md`):
  - **Mother Dune** (the lore-holder and potion trader: water-skins and the basic potions, sold dear).
    - The caravan's leader, very old, reads the Keepers' star-dials, and knows the stars are wrong without knowing why.
    - Life: she has led the caravan out of Caravanserai a hundred times in her head and never once in fact, because the
      well still gives a little.
    - She says Old Carapace's name only as "the Walker" and won't look east at sundown.
  - **Tally** (the gear trader: salt-iron and sandstone, a tier with an `aim` at the island's start, staff and bow twins).
    - A trader who counts everything (the tents, the stars, the drops in the well bucket, your coins twice).
    - Life: he's been counting the days since the Walker last passed close to town, and the number frightens him. He
      keeps a ledger of everyone who ever left the caravan, and every one of them he still sets a cup for.
  - **Well-keeper Asra** (purpose: the well, a farming and alchemy nod; sells water-plant seeds for the garden; chattable).
    - She lowers the bucket a little further every morning and marks the rope.
    - Life: she's in love with the idea of rain, which she has never seen; she collects stories of it from travellers
      and gets the details wrong on purpose so they'll correct her.
  - **Skipper Kesh** (above).
- **Every sky now draws Amberdune** in the south-west: `src/distant.js` gains its landmark, a long low gold line of dunes
  with heat shimmer over it and, sometimes, a far hill on the horizon that has moved since you last looked. It gets a
  `dune` view too. Soot and Liv learn that the skiff calls.

## Amberdune's map `[proposed]`
```
                                         [the Long Road] -- Old Carapace (final boss, A5): on his back
                                                 |  the Shell Road (approach: up his foreleg)
                                         [the Dry Wells 244-250] (deep room)
                                                 |  down a well that went dry
 Saltmouth/Caravanserai -- [the Glass Dunes 215-224] -- [the Buried Observatory 222-232] -- [the Storm Road 236-250]
 (town)          |                |                          |                              the Red Wall (party den, A4)
                 |         [the Mirage Oasis 215-220]  [the Buried Caravanserai 234-242] hard pocket, the Last Drover (field)
                 |               easy                   the Sunroller's dial floor (den, A1)
        [the Salt Flats 226-236] -- the Netwife's harbour (den, A2)
         (across the old seabed)
```
Every 5-level slice has two places (the checklist):

| levels | places |
|---|---|
| 215–220 | the Glass Dunes, the Mirage Oasis (plus the Undercroft's top) |
| 220–225 | the Glass Dunes, the Buried Observatory |
| 225–232 | the Buried Observatory, the Salt Flats |
| 232–240 | the Salt Flats, the Buried Caravanserai, the Storm Road |
| 240–250 | the Storm Road, the Dry Wells |

### The branches
- **The Glass Dunes** (215–224, the main trail east off the town). Gold dunes, wind-polished sandstone shelves, and patches
  where lightning fused the sand to glass.
  - Mobs: **sand skippers** (quick, scurry), **dune beetles** (burrow, then burst up under you: the `phase` brain's pulse),
    **glass scorpions** (a front claw shell: hit from behind), **heat mirages** (passive, harmless, too many: the
    drifting light's kind).
  - Field boss **the Glassjaw**, a dune beetle grown huge, its jaw fused to glass.
  - Find: a caravan's milestone, every mile scratched out but the last.
- **The Mirage Oasis** (215–220, an easy pocket off the Glass Dunes). Palms, a still pool that shows a different sky (a
  green one, with rain), low mobs, good for newcomers and chatting.
  - Find: Asra's rain stories carved into a palm, by someone who's been here before.
- **The Buried Observatory** (222–232, the main trail). The Keepers' star-dials half swallowed by sand: great bronze
  rings, a sundial's gnomon as tall as a tower, steps going down into the sand.
  - Mobs: **dust wraiths** (fade and pulse: the atlas's), **dial sentries** (Keeper-made, still on watch: a beam), **sand
    asps** (lunge from the sand), **amber moths** (dive).
  - Den **the Sunroller**: a great scarab rolling a stone sun round the observatory's dial floor to keep the hours
    turning. Holding on: the old sky's time. Freed, it lets the stone sun come to rest at noon.
  - Find: a Keeper stone readable to the shoulders (the island's waystone-kin).
- **The Salt Flats** (226–236, a side branch west from Saltmouth across the old seabed). White salt crust, beached boats,
  the sea a far bright line.
  - Mobs: **salt crabs** (crusted shells), **brine slimes** (`trail`: a crust that stings), **flat gulls** (dive), **wreck
    hermits** (carry a boat's prow as a shell).
  - Den **the Netwife**: a great salt-crusted sand spider in the dried harbour, mending the fleet's nets for boats that
    will never come back. Holding on: the fleet. Freed, she lets the nets go to the wind.
  - Its trader: Kesh, from her jetty `[default]`.
- **The Buried Caravanserai** (234–242, a hard pocket under the Observatory). The first town, swallowed by a dune long
  ago, its streets dark and close under sand ceilings, tents stiff as wood.
  - Elites throughout.
  - Field boss **the Last Drover**: a dried-out drover slime driving a string of phantom pack-beasts that never arrive.
  - Find: a well-rope cut, the bucket still on it.
- **The Storm Road** (236–250, the main trail's top). The old caravan road east into a standing sandstorm, the sky going
  red, wind on every rise (drawing, and a room hazard on the gusts' pattern: no `step()` change).
  - Mobs: **storm riders** (dive), **sand golems** (stomp), **red wisps** (beam).
  - Party den **the Red Wall**: a sandstorm that swallowed a caravan an age ago and has held it inside ever since, the
    pack-beasts and the tents turning round and round in it. Holding on: the caravan it took. Freed, it settles, and the
    caravan's things lie on the dunes in the sun.
  - Field boss `[default]` **the Sirocco**, a great dust devil.
- **The Dry Wells** (244–250, the deep room down a well in the Storm Road that went dry). The darkest, most enclosed place
  on the island (the owner's "trapped" mood, `final-bosses.md`): old well-shafts and the cisterns between them, dry for
  an age, the walls scratched with tally marks of the days without rain. Elites throughout.

### The final boss: Old Carapace `[default: the final boss]`
The island's heart and its biggest story, so he's the final boss: four or more at Lv 250, about 45 minutes on the sheet
(`final-bosses.md`).
- **The way in** is the way the others' is: through the darkest pocket, the deep room (the Dry Wells), then an approach.
  - **The Shell Road**: up out of the wells onto the open desert at dusk, where **Old Carapace walks past**, a hill
    moving. You climb his foreleg as it plants, scale by scale, the ground shaking with each step.
- **The den, the Long Road**, is his back, a whole empty caravan town on it:
  - tents, a dry well, lanterns gone out, all tilting a little with every step;
  - the desert scrolling past below (drawing only);
  - his head far off at the east end, looking ahead.
- **His fight gets its own plan** (`a5-plan.md`, like `l5-plan.md`) when its phase comes. The shape:
  - he won't stop: the den keeps moving (drawn), and things come at you out of the east as he walks;
  - the town is thirsty: the dry well, and water you carry to it;
  - he draws his head in (armour) and stamps (a quake through the whole shell);
  - his last phase is the walk into the storm.
- **Freed**, he lies down. The town on his back settles for the first time, and the dust stops.
- **Afterwards**, for that character only (`[default]`: Phase 7's freed world changes are per character,
  `docs/social/story.md`), the hill on Amberdune's horizon is lying still in every sky, and Caravanserai's well rises a
  little. Mother Dune finally strikes her tent.

## The phases (each one or two sessions; the roadmap tracks them)
Each phase shows the next but doesn't open it (owner's rule): a blocked way with an in-world reason, lifted by the update
that ships it.
- **A0, the landing.**
  - The Saltwind and the `'dune'` crossing.
  - Caravanserai and Saltmouth (town, waystone, home door).
  - Mother Dune, Tally, Asra and Kesh, and the dune folk look.
  - Amberdune in every sky, a music scene.
  - **The Glass Dunes** (the first fighting room, so the town isn't a dead end), with the Mirage Oasis if it fits.
  - Blocks:
    - the Observatory's steps buried under a dune (the wind moves it; the update clears it);
    - the Salt Flats' way sinking soft (the salt's wet this season);
    - the Storm Road's red wall on the horizon.
- **A1, the Buried Observatory and the Sunroller** (and the Mirage Oasis if A0 ran long).
- **A2, the Salt Flats and the Netwife** (Kesh trades from her jetty).
- **A3, the Buried Caravanserai** (hard pocket) and the field bosses (the Glassjaw, the Last Drover).
- **A4, the Storm Road, the Red Wall** (party den) and the Sirocco. Blocks:
  - the dry well's mouth chained shut (the caravan's rule);
  - Old Carapace seen walking on the horizon, out of reach.
- **A5, Old Carapace:**
  - (a) his plan on paper;
  - (b) the Dry Wells and the Shell Road;
  - (c) the Long Road and the fight: his art, music and drops (class weapons, a hat, a mini Old Carapace).

Every phase also needs:
- mobile and touch;
- the economy sheet (`npm run economy`);
- music;
- docs, `docs/world.md` for new rooms, and `docs/places/branches.md` for gates;
- the boss challenges from day one (`docs/combat/challenges.md`): each new boss gets a `ch` list as it ships, not a later
  retrofit.

## Open decisions (each has a default)
1. **The band.**
   - Default: **Lv 215–250**, past the Citadel's top, Old Carapace recommended at 250 (tag Lv 270).
   - Alternatives: 215–240 (a shorter island, Old Carapace at 240); or Lv 90–150 beside Emberdeep, as the atlas's first
     sketch had it (crowded: Frostpeak, Emberdeep and the Fen's bottom already fill it).
2. **The way there.**
   - Default: **the Saltwind, a caravan skiff, from the Black Sands** (the atlas's Black Sand Shore).
   - Alternatives: from Forgehold's quay; or the Lodestar calls at Saltmouth.
3. **Old Carapace's size.**
   - Default: **the final boss** (A5).
   - Alternative: a party den (A4), with no final boss (a lighter side island).
4. **The whole depth pass, or a lighter side island.**
   - Default: **the whole pass** (A0–A5, about the size of Lantern Fen's).
   - Alternative: A0–A2 plus Old Carapace, about half.
5. **No canon tier** `[default]`, like the Fen.
   - Alternative: Tier 4 hearsay through Mother Dune's star-dials (she'd know the Keepers watched the stars from here).
6. **All four A0 characters AI** (Mother Dune, Tally, Asra, Kesh).
   - Default: yes, like Phase 8.
7. **Names**: the Saltwind, Kesh, Asra, the Glassjaw, the Sunroller, the Netwife, the Last Drover, the Red Wall, the
   Sirocco, the Dry Wells, the Shell Road. All proposed. Saltmouth, Caravanserai, Mother Dune, Tally, Old Carapace and the
   Long Road are the atlas's.
