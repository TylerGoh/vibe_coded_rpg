# Atlas Phase 8: Lantern Fen, on paper (for the owner to approve)

**Status: approved by the owner 2026-11-11: Lv 150–180 (not the 70–110 default), the Hush from Icefang Hamlet, the
full island with the Wickmother as its final boss, every other default. L0 built 2026-11-11 (`docs/places/fen.md`,
`docs/places/shallows.md`); L1 built 2026-11-11 (`docs/places/firefly.md`, `docs/places/grove.md`); L2 built 2026-11-11 (`docs/places/stillmere.md`); L3 built 2026-11-11 (`docs/places/barrows.md`: the Sunk Barrows, the Sleeper, the Bog Bloat; the Peat Barrows' gate laid early); next is L4.** Phase 8 of `world/atlas.md`: the east side island, a
marsh of ghost lights, and the Wickmother. It follows `world/island-depth.md` (the method and the "deep" checklist)
the way `world/emberdeep-depth.md` did for the south, and the owner's story rules in `roadmap.md`. Read
`world/atlas.md` ("Lantern Fen"), `world/regions/uncharted.md` and Pilgrim Ione's persona (`server/characters.js`,
`docs/places/skydocks.md`) first: she is the Fen's "seen but not open" today. Marked `[default]` = what gets built
unless the owner says otherwise; everything named here is `[proposed]` until it ships. The owner's calls are in
**Open decisions** at the bottom, each with a default.

## The idea
A detour off the main road, and the theme from another angle: **grief**. Everywhere else the world is breaking
apart and slimes hold on; here the holding on is the trouble. Every window in Wickmere has a lantern lit for
someone gone, the dead's lights drift out on the water, and none of them ever goes out, because the Wickmother, a
great moth who swallowed a shard, can't bear to let a single light go. The fen is choked with them and nobody
can grieve. Beaten, she lets go and the lights dim one by one, gently.

Tone (`delivery.md`): **strange, gentle, sad.** Softer than Emberdeep, odder than Frostpeak. Quiet humour is
fine (the fen folk are kind and a little eerie); no puns near the Hall of Lamps. Names: soft, old-country,
watery (reed, sedge, wick, mere, hush).

## The band: Lv 150–180 (owner, 2026-11-11)
- **The Fen covers Lv 150–180**: new top-end content past the Citadel's (the Skydocks 135–145, Cogwork Bastion,
  the Chrono Spire, Chronos at 170). The owner chose it over the plan's 70–110 default ("let it expand forever
  with new places", 2026-11-06). Its bottom overlaps the Citadel's top; its top (175–180) has the Fen's own deep
  places. The frozen curve already runs to Lv 200 (`src/shared/curve.js`).
- **Still a side island in the story:** the atlas's detour (reached from the north, off the main road), just a
  far harder one: the fen folk have lived beside the Wickmother's lights so long that the wilds round them
  grew strange and dangerous.
- **No canon tier:** nothing in the main road needs it, and it adds **no canon tier** (`canon.md`): it's a story of
  its own about letting go. The fen folk know Tier 0, their own island, and old funeral songs that name "the
  Keepers" without knowing who they were (Tier 1 by hearsay at most).
- New mobs on the frozen curve as always (`island-depth.md` "Numbers"); gear in the Fen's register: reed,
  willow, lantern-glass, bog-iron, moth-silk.

## The landing (L0)
### The crossing: a Wickmere fishing boat from Icefang Hamlet `[default]`
- Ione came "a fishing boat, the Lodestar from the north, then the balloon": the fishing boat is the way. The
  update itself brings her in (no quest): **the Hush**, a Wickmere eel-boat, black-hulled, a lantern on a pole
  at her bow, tied up at Icefang Hamlet's quay beside the Lodestar. Her gangway is a door with `ask` (the Set
  sail card) and a "Lv 150+" label, no gate.
- **Two crossing rooms** (out and home), a new route theme `'fen'` (`src/crossing.js`, `docs/places/crossings.md`):
  the hamlet and the aurora astern; grey northern water warming and stilling; mist; then **lights on the water**,
  small lanterns set adrift by the dead's families, more and more of them; lily pads, reeds, a heron; the
  fog opens on **Reedwater**, a single jetty. Shorter than the Lodestar's long voyage (it's a side trip).
- **Skipper Netta** (AI, fen folk, at the tiller of both decks via `also`): an eel-fisher who comes north twice a
  year with smoked eels for Runa's shed. Purpose: the crossing, like Brine and Arne. Lore: Tier 0 and the sea
  road east. Life: she ferried Ione north and frets about her; won't sail over the drifting lanterns, steers
  round every one, which makes her late everywhere; her late husband's lantern is in her cabin window and she
  talks to it about the weather; trades eel recipes with Runa and loses every argument about salt.
- **No link to Emberdeep** `[default]`: the Fen is reached from the north and left the same way (or by a Return
  scroll). Its waystones are their own island's (`isle: 'fen'`).

### The town: Wickmere, with Reedwater as its waterfront `[default: one room]`
Owner's rule: every landing is a town. Like Icefang Hamlet and Forgehold, **one room**:
- **West: Reedwater**, the jetty in fog where the Hush ties up. East: **Wickmere**, stilt houses on boardwalks
  over black water (platforms), rope bridges between them, reed roofs, fireflies, mist low on the water, and a
  lantern in every window, each with a name tag on a string. The **Lamp Walk** runs along the boardwalk:
  everyone's lanterns for their dead, hundreds of them, all lit. Out on the mere, lights drift that nobody goes
  near. The east end leads off the boardwalk into the Shallows.
- A `TOWNS` entry (wake on the Lamp Walk's landing), a home door (a stilt-house door), a waystone, no mobs.
- **The fen folk look** (`folk: 'fen'`, `characters/people.md`): pale, translucent violet-grey jelly with a soft
  glow deep inside (as if each carries a small light), slow, floaty wobble, hoods and reed capes. **Pilgrim Ione
  gets it** in the same update (she's plain today: `docs/ideas.md`).
- **Its people** (AI with memory, narrow lore, rich lives; `docs/social/ai-characters.md`):
  - **Wren the Lamplady** (the lore-holder and potion trader: "lamp oil" and the basic potions): tends every
    lantern on the Lamp Walk, trims wicks at dawn, knows the old funeral songs (the ones that mention "the
    Keepers", sung without knowing who they were). Speaks softly. Life: her husband's lantern is the oldest on
    the Walk; she has quietly wanted to let it go out for years and can't, and feels guilty for wanting to. She
    never names the Wickmother ("the Mother") and changes the subject.
  - **Ferryman Hob** (purpose: his punt is the way across the mere to the Still Mere branch, below; chattable):
    poles the punt between the islets, sings to keep time, can't swim (slimes don't sink, he says, but he isn't
    taking chances). Life: twelve grandchildren and a lantern for none of them, which he's proud of; carves
    ducks; won't go near the drifting lights after dark.
  - **Sedge** (the gear trader: woven reed and bog-iron, a tier with an `aim` at the island's start, staff and
    bow twins): a young reed-cutter who makes armour out of things nobody else would. Life: hasn't lost anyone,
    and feels left out of the Lamp Walk, which she knows is a strange thing to feel; keeps a lantern lit
    "for practice". Wants to see snow.
- **Ione's persona** moves on: she may now say the way home is open (the Hush from the hamlet) and still never
  names the Wickmother. The balloon's view keeps the violet blur; **every sky now draws Lantern Fen** in the east
  (`src/distant.js` gains the Fen's landmark: a low violet blur with lights hovering over it, and a `fen` view).

## The Fen's map `[proposed]`
```
                                  [the Hall of Lamps] -- the Wickmother (final boss, L5)
                                          |  the Lamp Road (approach)
                                  [the Peat Barrows 175-180] (deep room)
                                          |  down the old peat cuts
 Reedwater/Wickmere -- [the Shallows 150-158] -- [the Drowned Grove 156-166] -- [the Lantern Causeway 168-180]
 (town)        |                 |                   |                         Grandfather Mire (party den, L4)
               |           Long-Neck's Heronry   [the Sunk Barrows 170-178] hard pocket, the Sleeper (field boss)
       [Firefly Hollow 150-155] easy
               |  Hob's punt
       [the Still Mere 160-170] -- Old Gullet's Eel Pit (den)
```
Every 5-level slice has two places (the checklist): 150–155 the Shallows and Firefly Hollow (plus the Citadel's
top); 155–160 the Shallows and the Drowned Grove; 160–170 the Drowned Grove and the Still Mere; 170–175 the Sunk
Barrows and the Causeway; 175–180 the Causeway and the Peat Barrows.

### The branches
- **The Shallows** (150–158, main trail, east off the town): knee-deep water, lily pads, reed beds, half-sunk
  boardwalks. **Lantern moths** (passive, glow, flutter off), **bog slimes** (sticky: a hit that slows you
  `[default]`, not a `step()` change), **mire frogs** (hop, a tongue lash at range), **mudskippers** (scurry).
  Field boss **the Bog Bloat** (a huge bog slime that splits as it's hit). Find: the drowned signpost, every arm
  pointing at a different island.
- **Firefly Hollow** (150–155, easy pocket, off the Shallows): a calm glade of fireflies over still water, low
  mobs, good for newcomers and chatting. Find: a ring of stones where the fen folk come to sit.
- **The Drowned Grove** (156–166, main trail): a flooded willow wood, roots like ribs, the light green and dim.
  **Will-o'-wisps** (phase out and back: the fume wisp's `phase`), **reed stalkers** (wait in the reeds, lunge),
  **willow wights** (roots that grab: a short slow), **marsh herons** (dive). Den **Long-Neck**, a great grey
  heron standing guard over a nest of stones in the Heronry (holding on: an egg that never hatched; freed,
  she flies). Find: a Keeper stone sunk to its shoulders (the island's waystone-kin, a readable stone).
- **The Still Mere** (160–170, side branch, by Hob's punt from the town): open black water and islets joined by
  stepping stones, mist, the drifting lanterns thickest here. **Mere eels** (surface and snap), **lamp crabs**
  (carry a stolen lantern on their back as a shell: hit from behind), **mist shades** (fade and pulse). Den
  **Old Gullet**, a giant eel in the Eel Pit who swallows every lantern that sinks and glows from the inside
  (holding on: the lights; freed, he lets them out and they float up). Its trader: Hob, from his punt `[default]`.
- **The Sunk Barrows** (170–178, hard pocket, off the Drowned Grove): the old burial mounds, flooded; dark and
  closed in. Elites; field boss **the Sleeper in the Peat** (a great bog-preserved slime that rises when you
  near it, slow and sad). Find: a lantern with no name tag, still lit.
- **The Lantern Causeway** (168–180, main trail's top): a stone causeway across the mere toward the Hall of Lamps,
  lined both sides with posts, a lantern on each. **Lamp moths** (bigger, dive), **causeway guards** (old
  stilt-slimes in reed armour who won't let anyone pass: a front shield), **drifting lights** (harmless, too
  many). Party den **Grandfather Mire**, a vast old toad who sits across the causeway and keeps the way to the
  Hall shut, because the Mother asked him to (holding on: his promise; freed, he steps aside). Field boss
  `[default]` the Will-Queen, a great wisp.
- **The Peat Barrows** (175–180, the deep room under the Sunk Barrows, L5): the darkest, most enclosed place on the
  island (the owner's "trapped" mood, `final-bosses.md`): old peat cuttings under the bog, roots overhead, the
  only light the lanterns of the dead somebody carried down here. Elites throughout.

### The final boss: the Wickmother `[default: the final boss]`
The island's heart and its biggest story, so she's the final boss (four or more at Lv 180, about 45 minutes,
`final-bosses.md`), reached the way the others are: through the darkest pocket (the Sunk Barrows), the deep room
(the Peat Barrows), and an approach, **the Lamp Road**: a long walk under a roof of moth-silk strung with every
lantern the fen has ever lit, all burning, their name tags turning in a draught, the music down to a music box.
The den, **the Hall of Lamps**, is a great hollow willow hung with lanterns, and she is wrapped round them. Her
fight gets its own plan (`l5-plan.md`, like `fb1-plan.md`) when its phase comes; the shape: she shields the
lights with her wings, you have to put lanterns out to reach her (the opposite of Fenrir's lanterns), and her
last phase is the whole hall going dark but for her. Freed: the lights dim one by one, gently. Afterwards, for
that character only, the Lamp Walk in Wickmere burns low and a few lanterns are out, their tags gone home
(`[default]`: Phase 7's freed world changes are per character, `docs/social/story.md`; it never goes dark for
everyone).

## The phases (each one or two sessions; the roadmap tracks them)
Each phase shows the next but doesn't open it (owner's rule): a blocked way with an in-world reason, lifted by
the update that ships it.
- **L0, the landing:** the Hush and the `'fen'` crossing, Wickmere and Reedwater (town, waystone, home door),
  Wren, Hob, Sedge, Netta, the fen folk look (and Ione's), the Fen in every sky, a music scene, **and the
  Shallows** (the first fighting room, so the town isn't a dead end), with Firefly Hollow if it fits. Blocks:
  the Drowned Grove's path flooded too deep (the water's up; the update lets it down), Hob's punt drawn up
  ("not with the mere this high"), the Causeway seen far off across the water.
- **L1, the Drowned Grove and Long-Neck** (and Firefly Hollow if L0 ran long).
- **L2, the Still Mere and Old Gullet** (Hob's punt in the water).
- **L3, the Sunk Barrows** (hard pocket) and the field bosses.
- **L4, the Lantern Causeway and Grandfather Mire** (party den). Blocks: the Hall of Lamps' door shut by
  moth-silk; the Peat Barrows' way down caved in.
- **L5, the Wickmother:** (a) her plan on paper, (b) the Peat Barrows and the Lamp Road, (c) the Hall and the
  fight, her art, music, drops (class weapons, a hat, a mini Wickmother).

Every phase: mobile and touch, the economy sheet (`npm run economy`), music, docs, `docs/world.md` for new rooms,
`docs/places/branches.md` for gates, and the boss challenges from day one (`docs/combat/challenges.md`: each new
boss gets a `ch` list as it ships, not a later retrofit).

## Open decisions (each has a default)
1. **The band.** Settled: **Lv 150–180** (owner, 2026-11-11), not the 70–110 default.
2. **The way there.** Settled (the default): **a Wickmere fishing boat, the Hush, from Icefang Hamlet** (Ione's road).
   Alternatives: Captain Brine sails a second route east from Greenhollow Harbour; or the Lodestar calls at the
   Fen on its way south.
3. **The Wickmother's size.** Settled (the default): **the final boss** (L5). Alternative: a party den (L4), with no final boss
   (a lighter side island).
4. **The whole depth pass, or a lighter side island.** Settled (the default): **the whole pass** (L0–L5, about the size of an
   Emberdeep pass, since the method asks every island for it). Alternative: L0–L2 plus the Wickmother, about half.
5. **Names** (Netta, Wren, Hob, Sedge, the Hush, Long-Neck, Old Gullet, Grandfather Mire, the Sleeper in the Peat,
   the Will-Queen, the Bog Bloat): proposed; Wren and Hob are the atlas's.
6. **All four L0 characters AI** (Netta, Wren, Hob, Sedge). Default yes, like Phase 6.
