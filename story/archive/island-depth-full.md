> **Archived 2026-10-24: the island-depth plan as it stood after F4.** The live, trimmed method is `story/world/island-depth.md`. This copy keeps the finished parts: the legacy-units table, the rebalance (R) design, Greenhollow's and Frostpeak's maps, branch tables and phases. What shipped is described in each place's doc under `docs/places/`. Paths inside are relative to `story/world/`.

# Island depth: deep islands before new ones

**The current plan.** The build order in `atlas.md` (one new island per phase) is **paused after Phase 4**
until Greenhollow, then Frostpeak, is deep enough. This file says how an island gets "deep" and lays out
Greenhollow's branching map and phases. Specific places, mobs and bosses below are `[proposed]`; the
owner's direction (next section) is settled.

## The owner's direction (2026-10-20)
- **Islands cover wide level bands, and they overlap.** Greenhollow covers **Lv 1–60**, Frostpeak **Lv
  40–100**; the later islands move up the same way when their turn comes. The 20-level overlap is on
  purpose: you can leave early for the next island or stay to finish the side areas.
- **The levelling speed stays as it is** (`expToNext`, mob EXP per level). Progress isn't slowed down;
  each island simply holds far more levels of mobs, so you spend longer on it.
- **Islands branch.** Not one strip of zones but a map with forks: a main trail, side branches, much
  harder pockets, easier pockets, and sometimes bigger bosses out in the open.
- **More to discover on each island:** each island's theme explored properly (every corner of "green
  temperate island", not three zones of it), with things found by wandering.
- **No quests** (owner, explicit). No quest system, quest givers, quest log or tracker. Discovery comes
  from the places themselves: hidden spots, rare spawns, readable ruins, field bosses, and characters
  worth chatting with. Don't add quests back in another form.
- **Don't move on to the next island until this one is fleshed out.** It doesn't all ship at once.
- **Existing characters keep their levels and gear.** Today's mobs, bosses and gear are **legacy units**:
  their stat blocks and brains (`ai` in `MOBS`) can be reused, re-themed, to fill the new bands. The
  later islands' stages are already in the game and tied into content, so they stay open.
- **Once Greenhollow's new mobs cover the old levels, the later islands move up** (owner, 2026-10-20):
  their mobs and bosses are raised to their island's new band (**the rebalance**, below). Loot follows:
  the gear players already own stays exactly as it is and is marked **Legacy**; the raised mobs and bosses
  drop a **new copy** of each item with stats scaled to the new level. Then each island's own depth pass
  adds harder bosses that fit its theme on top.

## What "deep" means: the checklist for calling an island done
1. **Every 5-level slice of its band has at least two places to farm**, in different branches, so a
   player is never stuck grinding one strip.
2. **A branching map** (`atlas.md`'s room kinds), with each branch a full theme of its own, not a recolour:
   - **the main trail**: the easy-to-hard spine you'd walk without thinking;
   - **side branches** off it, each with its own landscape, mobs, people and a den;
   - **hard pockets**: a door off a branch that is far above its surroundings (elites, a nasty
     hazard, a field boss), labelled with its level so nobody wanders in by accident;
   - **easy pockets**: calm side spots with low mobs, herbs and fishing, good for newcomers, alts and chatting.
3. **Bosses at three sizes:** the dens (as now), **field bosses** (a big mob that roams a wilds room
   on a long timer, announced to the room), and **one capstone boss** at the top of the island's band,
   with a proper den and a story beat.
4. **Things to find, no quests:** each branch has something off the beaten path: a hidden ledge or
   back room, a rare mob, readable Keeper stones or wreckage that add to the lore, a view. Its people
   are chattable AI characters with lives of their own (and a trade where it fits), not quest givers.
5. **Getting around:** a big island needs fast travel and a map that shows its branches (below).
6. The usual: towns per `atlas.md`, mobile, music scenes, the economy sheet green.

## Legacy units: reusing what exists
Today's late mobs already have tested numbers and brains. Greenhollow's upper band reuses them as
Greenhollow wildlife (new name and art, same `ai`, a stat block near the legacy one):
| legacy mob (brain) | could become, on Greenhollow |
|---|---|
| ember imp (lobs) | **puffcap**, lobs spore balls (the Deep) |
| magma slug (burning puddles) | **gloop snail**, leaves sticky puddles (Willowmere, the Deep) |
| obsidian crab (front shell) | **moss turtle** or **rock crab** (the Coves, the ruins) |
| cinder bat (dives) | **cave bat**, **storm gull** (the Coves, the Deep) |
| cogling (splits) | **puffball** that bursts into two small ones (the Deep) |
| sentry drone (low laser) | **glowworm** throwing a beam along the floor (Glowroot Hollow) |
| aether knight (blinks behind you) | **thorn stalker** (the Thornheart) |
| chrono wraith (phases out) | **will-o'-wisp**, **drowned lamp** (Wreck Cave) |
The legacy mobs themselves stay where they are (until the rebalance raises them). New mobs are appended to
`MOBS` (kinds go over the wire as their index).

**Freeze the legacy curve first (in G0).** The rebalance changes the legacy mobs' and gear's numbers,
and new mobs and gear are priced against today's. So G0 writes today's numbers down as reference curves
in `scripts/economy.mjs`: mob HP, attack, EXP and gold by level, and sword ATK and helmet DEF by level,
fitted to today's `MOBS` and gear and extended past Lv 80 along the same shape. Every new or rebalanced
mob and item is then checked against those curves (a new check in `--check`), not against whatever
the other mobs happen to be.

## The rebalance: raising the later islands `[default design]`
**When:** after G5, when Greenhollow covers Lv 1–60 and nothing is lost by raising the old stages. (It
can't come earlier: until then Frostpeak's 13–27 mobs are the only content at those levels besides the
Wildwood.) It's one session, before Frostpeak's depth pass.

**New bands** (Frostpeak's is the owner's; the rest follow the same overlap, `[proposed]`): Frostpeak
40–100, Emberdeep about 90–150, the Citadel about 140–200. Each island's **legacy mobs and bosses go to
the bottom of its new band**, keeping their order and spacing (Frostpeak's ridge and summit become
roughly 40–60, Emberdeep's stage roughly 90–115, the Citadel's roughly 140–170). The top of each band is
left for that island's depth pass.

**Mobs:** the same `MOBS` entries and kind ids, only the numbers change (`lvl`, `hp`, `atk`, `exp`,
drops' coin ranges), read off the frozen curve at the new level. Zone `lvl` labels and door labels
change with them (the ferry's "Lv 13+", the summit's "Lv 28+", the skylift's "Lv 50+"). Bosses likewise,
den by den.

**Loot: legacy copies, no save migration.** Saved bags and gear hold item ids, so:
- the **existing id stays the legacy item**: same stats, same enhancements and scrolls on it, its name
  gets " (Legacy)" (or a Legacy tag in the item card), and it's no longer dropped or sold anywhere;
- a **new id** (e.g. `magma_maul` → `magma_maul_n` or a fresh name in the island's register) is the copy
  with stats scaled to the new level along the frozen gear curve, and price/sell value scaled to match;
  the raised mob's or boss's drop table (and any shop stock, like Runa's hood and harpoon, with new
  `aim`s) switches to the new id.
- Only gear needs copies. Potions, scrolls, herbs and materials keep their ids; check whether any
  material's sell price should scale with its mob (the economy sheet's gold-per-EXP check will say).
- Legacy items keep working forever and can still be scrolled; they just stop being the best thing at
  their old level as Greenhollow's own gear fills in.

**Checks:** `npm run economy` before and after (paste the moves), every raised mob and new copy on its
curve, houses' and shops' `aim`s still green, `docs/combat/items.md` gains a "Legacy items" note, and
`docs/combat/stages.md` the new bands. High-level players (Lv 80–369 today) simply find the old stages
worth farming again.

## Greenhollow's map `[proposed]`
```
                              [Keeper's Spine 45-60] -- the Root Warden (capstone den)
                                        |
                              [Old Oak Canopy 25-40]
                                        |  climb up from Bramble Woods
 Harbour -- Slimeville -- Sprout Meadow -- Mushroom Grove -- Bramble Woods -- East Cliffs
    |                          |                |                  |
 [Saltspray Coves 10-25]  [Willowmere 5-15]  [the Mycelium Deep 15-35]  [the Thornheart 50-60] hard
    |                                           |
 [Wreck Cave 30-40] hard                     [Glowroot Hollow 40-50] hard
```
The existing Wildwood (1–12) stays as the main trail's start, untouched. Every bracket is its own combat
room (`ROOMS`, `STAGES`, `COMBAT_ROOMS`, its own zone list, art file and music scene), with room ids
taken from the next free numbers below `HOUSE_BASE`.

| branch | band | way in (rough spot: check dens, plaques and doors already there) | blocked until it ships by |
|---|---|---|---|
| Willowmere | 5–15 | a brook path north off Sprout Meadow, around x 900 in the Wildwood | the footbridge over the brook, washed out |
| Saltspray Coves | 10–25 | the shore path off the harbour's west end, past the lighthouse | a rockfall across the shore path |
| the Mycelium Deep | 15–35 | a hollow stump in Mushroom Grove, around x 2400 | the stump's hole, choked with roots |
| Glowroot Hollow | 40–50 | the Deep's far end | ships with the Deep (no block needed) |
| Old Oak Canopy | 25–40 | a giant oak's rope ladder in Bramble Woods, before the ruins (around x 3400) | the ladder's rungs rotted through |
| Wreck Cave | 30–40 | the Coves' far end | the cave mouth, flooded to the roof |
| Keeper's Spine | 45–60 | the Canopy's top end | a fallen trunk across the high path |
| the Thornheart | 50–60 | a gap in the briar in the mob-free stretch near the Wildwood's east end (around x 4900, past the bramblehogs' strip) | a solid wall of thorns |

- **Willowmere** (easy pocket and branch, 5–15): a pond and slow river north of the meadow, willows,
  reeds and a mill. Gloop snails, dragonflies, frogs; fishing; riverside herbs. **Field boss: Old
  Snapjaw** (~Lv 15), a huge pond turtle who surfaces now and then. People: **Miller Bun** (AI: runs the
  mill, grumbles that the eels eat the bread, sells potions and simple gear).
- **Saltspray Coves** (branch, 10–25): south from the harbour along the shore. Tide pools, sea stacks,
  gull rookeries. Rock crabs, storm gulls, tide jellies. People: **Beachcomber Moss** (AI: collects things
  the sea brings in, some of them Keeper-made, a light Tier 1 thread; trades). Den: **the Tidemother**
  (~Lv 25).
  - **Wreck Cave** (hard pocket, 30–40): a sea cave at the cove's end, a wreck in it, drowned lamps,
    elites. Optional field boss: **the Drowned Bosun**.
    - Shipped (2026-10-22): the wreck is the **Brave Pippin**, an apple boat from Greenhollow Bay; her
      logbook shows the run to Icefang growing from a morning to past dark (Tier 0: the sea widens). The
      Drowned Bosun is a great old octopus who moved into her and wears the bosun's coat. Barnacle crabs,
      drowned lamps, moray eels, bilge rats; the crow's nest is the hidden spot.
- **The Mycelium Deep** (branch, 15–35): down through a hollow stump in Mushroom Grove. The glowing
  threads seen above are thick roots down here, and they run *off toward the sea* (canon: the mycelium
  net runs under the sea). Puffcaps, puffballs, cave bats. Den: **the Knotmole** (~Lv 35).
  - **Glowroot Hollow** (hard pocket, 40–50): the deepest cave, where the threads knot. Glowworms, elites.
  - Shipped as planned, plus: **Forager Truffle** keeps a camp at the Deep's root stair (AI, trades), the
    Listening Stone (Keeper: "what one shore hears, every shore hears") and glow moths and threadweavers
    in the Hollow.
- **Old Oak Canopy** (branch, 25–40): up from Bramble Woods into the treetops. Squirrels, owls, wasp
  nests. A treehouse camp with **Ranger Acorn** `[name proposed]` (AI: watches the woods, knows every
  nest; trades). Field boss: **the Hornet Queen** (~Lv 38). **Built as a wide room, not a tall one:**
  rooms have a width and a fixed ground and the camera doesn't scroll up, so the "height" is layered
  platforms (branches, rope bridges) filling the screen above a forest floor, and the art (trunks running
  off the top, sky through leaves) sells it. A vertical camera is its own `step()`/camera project; don't
  start it inside G3.
  - Shipped as planned (2026-10-22): the name Ranger Acorn kept; oak squirrels (acorns), tent caterpillars
    (sticky silk), flying squirrels (glide behind you), tawny owls (dive), wasp nests that burst into wasps,
    hornets (stingers); the Treehouse Camp, the Squirrel Boughs, the Owl Hollows, the Wasp Crowns.
- **Keeper's Spine** (the heart, 45–60): the island's ridge above the canopy, bare stone and wind, the
  biggest Keeper ruins on the island. Moss turtles, stone sentinels.
  - **The Thornheart** (hard pocket, 50–60): the briar's root, thorn stalkers, elites.
    - Shipped (2026-10-22): every briar grows from one root knot round **the Hedge Stone** (Keeper: the
      briar was planted "to keep the road", a hand points north to the ridge), plus thornbacks, thistle
      puffs, pitcher plants and a field boss the plan didn't name, **the Thorn Hart** (a white stag with briar
      antlers). The White Rose arch is the hidden spot.
  - **Capstone den: the Root Warden** (~Lv 60).

## Bosses: which ones get a story
**Big bosses get a story; small ones don't** (owner, 2026-10-20). Dens and capstones are big: each has a
holding-on / letting-go story, lines on entering, at its phase and when freed, and loot that names its
place (`atlas.md`'s boss rule, `../characters/bosses.md`). **Field bosses and elites are small:** a name,
a look, a one-line description and a short announcement are enough. When a big boss ships, move its
story into `../characters/bosses.md`.
- **The Tidemother** (den, the Coves): a great hermit crab with a shard in her shell who keeps everything
  the sea washes in and won't let the tide take anything back out. The coves are choked with her hoard
  and the pools have gone stale. Freed, she lets the tide go out, and the water runs clear again.
- **The Knotmole** (den, the Deep): an old blind mole who dug down to the warm threads and, with a shard
  in her paw, tied them into knots to keep the warmth for herself, so the threads stopped carrying anything
  out to sea. Freed, she untangles them, and the glow runs off under the sea again (a quiet hint that
  the net links the islands).
- **The Root Warden** (capstone, the Spine): a Keeper guardian the roots grew through, still guarding a
  sealed gate beside the Spine's ruins. It holds on to its post long after anyone could give it new
  orders. Freed, it lets the roots have it and the gate stays shut, but the way past is open. Ties to the
  Heartroot and the apple tree (`../characters/mochi-and-chronos.md`); keep what it reveals at Tier 1.
- Small: **Old Snapjaw**, **the Hornet Queen**, **the Drowned Bosun**, **the Thorn Hart**, and any field boss added later.

## Numbers: how a builder sets them (sensible defaults)
The code holds the values; these are the rules for choosing them. Always `npm run economy` before and
after, and keep `--check` green.
- **New mobs follow the frozen legacy curve** (made in G0, above). A new mob at level L takes HP,
  attack, EXP and gold from the curve at L, then is nudged for its gimmick. Kills per level and gold per
  EXP should land where today's mobs around L have them. Because the curve doesn't
  move, the levelling speed stays the same and **today's house aims** (`HOUSE_SIZES`) and shop aims stay
  valid. Check the PROGRESS table: "farming your own level" will pick the new mobs, and its numbers
  should hardly change.
- **Elites** reuse a normal mob with multipliers named as constants in the code (more HP, more attack,
  more EXP and better drops; something like 3× HP, 1.5× attack, 2.5× EXP is a starting point), drawn
  with a glow. Elites only live in hard pockets.
- **Field bosses** sit between a branch's mobs and its den: worth a few minutes of farming per kill on
  the boss table (dens are worth 6–20×). HP scales with players in the room like dens do
  (`BOSS_HP_PER_PLAYER`).
- **Gear across 12–60** (today the shop stops at the Crystal Sword, about Lv 12). Each branch adds:
  - a **trader tier** (sword and helmet) aimed at the branch's middle level, with an `aim` so the
    economy script checks it;
  - **mob-drop gear** a little under the trader tier, at low rates;
  - **den gear** a step above, like today's boss gear.
  The frozen gear curve is the anchor for power at a level (it was fitted to today's gear: Briar
  Greatsword around Lv 12, Frostbite Blade 18, Starforged 25, Magma Maul 36, Phoenix Blade 46, Cog
  Cleaver 60, the same for helmets). A Greenhollow item at level L should be about as strong as the curve
  at L, not stronger, so legacy players
  aren't made obsolete and new players aren't stuck. New gear names fit Greenhollow (driftwood,
  shell, oak, root, Keeper stone), never fire or brass.
- **Potions on the road:** each branch's trader sells the basic potions, so a deep branch isn't a walk
  back to Pip.

## Systems the depth needs (built once, used on every island)
- **Field bosses** `[default design]`: an entry in a wilds room's spawns with a long respawn (its own
  constant, tens of minutes), roaming its strip like other mobs; when it appears, everyone in the room
  gets a short announcement (chat system line, the hint style in `docs/ui/hints.md`). Loot is shared
  like a den boss's (one set per kill). No den, no ultimate; one or two moves from the existing boss
  move set at most.
- **Elites** `[default design]`: **separate entries appended to `MOBS`** (e.g. a rock-crab elite with
  `elite: true` and its base mob's art), so nothing changes on the wire (mob kinds already go over it as
  their index in `MOBS`). The client draws an elite as its base mob plus a glow and a bigger name tag.
- **Level labels on doors:** every door into a combat room says its band ("Lv 30–40"), as some
  already do ("(Lv 28+)"); hard-pocket doors also get a danger look (red-tinted sign art, a warning in
  the label). Mobile shows the same label in its hint.
- **Waystones** (in G1, not later: fainting deep in a branch walks you back from Slimeville):
  standing stones in the Keeper style, one in Slimeville, one at each branch's entrance hub and in the
  Spine. Walk up and press E (a tap on mobile) to attune; it's saved with the character. At any attuned
  stone, E opens a list of the others and the server moves you there (validated like a door). Respawn
  stays at towns (`TOWNS`). The lore is already in the ruins (the Waystone plaque).
- **An island map** `[default design]`: on the World map page, tapping an island opens its own view:
  the branch graph (drawn from a small data list next to the rooms), each branch with its level band,
  shipped branches drawn and unshipped ones shown blocked, and your pin in the branch you're in. The
  same no-spoilers rule as the World map (`docs/ui/world-map.md`).
- **The economy sheet** learns elites and field bosses, and gets the frozen reference curves for mobs
  and gear with a check against them (`docs/economy.md`, `scripts/economy.mjs`).

## Greenhollow phases
Each is its own session (and a dev copy, per `Agent.md`: these are big features). The order puts the
systems first, then fills the band from the bottom up.
- [x] **G0: systems** (shipped 2026-10-20: Turnipop is Sprout Meadow's field boss, the Elder Bramblehog the
      first elite; `docs/places/branches.md`, `docs/combat/stages.md`, `docs/economy.md`). The frozen legacy curves in the economy script, field bosses, elites, door
      level labels, the island map. Prove them in the
      existing Wildwood (a small field boss in Sprout Meadow, an elite or two in Bramble Woods), and lay
      every branch's blocked entrance (table above) so the island shows what's coming.
- [x] **G1: Willowmere and Saltspray Coves** (5–25), Old Snapjaw, the Tidemother, Miller Bun and
      Beachcomber Moss, the first gear tiers, and waystones (shipped 2026-10-20; `docs/places/willowmere.md`,
      `docs/places/coves.md`, `docs/places/waystones.md`). Not done: fishing and riverside herbs, the
      Tidemother's world change when freed (see `docs/ideas.md`).
- [x] **G2: the Mycelium Deep and Glowroot Hollow** (15–50), the Knotmole (shipped 2026-10-21;
      `docs/places/deep.md`). The Deep's character is **Forager Truffle** (trades; the plan named none),
      its find the Listening Stone and the Glow Shelf; Glowroot Hollow has the first hard-pocket elites.
      Not done: the Knotmole's world change when freed, a field boss for the Deep (`docs/ideas.md`).
- [x] **G3: Old Oak Canopy** (25–40), the Hornet Queen, Ranger Acorn (shipped 2026-10-22;
      `docs/places/canopy.md`). Its find is the Crow's Nest (a lookout with a spyglass on the Spine) and the
      Lifted Stone (a Keeper stone the oak grew round and lifted); the Spine's ridge shows over the leaves and
      its gate is a fallen trunk at the Canopy's far end. Not done: `docs/ideas.md` ("G3 left for later").
      **Building G4/G5: start from the checklist in `docs/places/branches.md`.**
- [x] **G4: the hard pockets**: Wreck Cave (30–40) and the Thornheart (50–60), elites, the Drowned
      Bosun (shipped 2026-10-22; `docs/places/wreck.md`, `docs/places/thornheart.md`). Added: the Thorn Hart
      (a second field boss), the Brave Pippin's log and the Hedge Stone. Not done: a room hazard for the
      pockets (`docs/ideas.md`, "G4 left for later").
- [x] **G5: Keeper's Spine** (45–60) and the Root Warden (shipped 2026-10-23; `docs/places/spine.md`). Its
      find is the Road Stone (the high road, the Warden holding the gate, a root running west toward the
      village) and the Watch Seat; no character lives there. Greenhollow is done: every branch on the map is
      open, from Lv 1 to 60. Not done: `docs/ideas.md` ("G5 left for later").
- [x] **R: the rebalance** (shipped 2026-10-23; `docs/combat/stages.md`, `docs/combat/items.md`,
      `docs/economy.md`): Frostpeak's legacy stage went to 40–60, Emberdeep's to 90–115, the Citadel's to
      140–170; their gear got scaled copies (`<id>_n`, drawn through `artOf`) and what players own became
      Legacy. Next: Frostpeak's pass.

## Legacy loose ends (default: leave them alone until the rebalance)
- ~~The ferry's door still says "Lv 13+" and Frostpeak still runs 13–27.~~ Done in the rebalance: "Lv 40+", 40–60.
- The pass from Frostpeak's summit down to the legacy Emberdeep stage and the skylift to the Citadel
  stay (their signs say "Lv 90+" and "Lv 140+" since the rebalance): they're how high-level players reach that content.
  They go when the atlas's Phase 5 and 6 replace them with the ship and the balloon.

## Frostpeak's depth pass (40–100)
The same method as Greenhollow's: the existing ridge and summit (40–60 since the rebalance) are the easy end,
and new branches explore the cold north properly. Specific places, mobs and bosses are `[proposed]` until
they ship; the tone is Frostpeak's (`regions/frostpeak.md`): quiet, cold, melancholy, few jokes.

### Frostpeak's map `[proposed]`
```
                                 [the Aurora Heights 75-90]
                                            |
                                 [the Rimeglass Glacier 60-75] -- [the Blue Halls 80-90] hard
                                            |  up the glacier's snout
 Icefang Hamlet -- Frostpine Ridge -- Starfall Summit -- (the Caldera pass, legacy)
       |                  |
 [the Whale Skerries 55-70]   [the Queen's Bridge 85-100] -- Sigrun (capstone den)
       |
 [the Narwhal Grotto 70-80] hard
```
Every 5-level slice from 60 to 90 has two places on the island; 90–100 has the Bridge and Emberdeep's
legacy stage (90–115), so the island's top overlaps the next one's bottom, as planned.

| branch | band | way in | blocked until it ships by |
|---|---|---|---|
| the Rimeglass Glacier | 60–75 | the glacier's snout at Starfall Summit's east end, before the Sanctum | ships first (F1) |
| the Whale Skerries | 55–70 | the shore path off the hamlet's quay, west end | a snow slide across the shore path |
| the Narwhal Grotto | 70–80 | the Skerries' far end | behind the Skerries (`past`) |
| the Aurora Heights | 75–90 | the top of the Glacier's Icefall | an icefall: the cutters' steps up are gone |
| the Blue Halls | 80–90 | a crevasse in the Glacier's Crevasse Field | the cutters' ladder down lies smashed at the bottom |
| the Queen's Bridge | 85–100 | an ice stair on Frostpine Ridge, by the Frozen Throne | the stair broke off where the bridge cracked |

- **The Rimeglass Glacier** (branch, 60–75): a great river of blue ice above the summit. The **Cutters'
  Camp** at its foot (no mobs: a waystone, **Ice-Cutter Eyvind**, the Rime Stone), then the Snout, the
  Crevasse Field and the Icefall. Snow hares, snow petrels, glacier rams, rime wolves, frost wraiths and
  grown yetis (Tove's cubs grow up into these). **Field boss: Old Rimehorn**, a mammoth older than the
  hamlet. Find: the Rime Stone (a Keeper stone frozen in clear ice) and Ylva's Cairn on a high serac,
  where Skaldi's driftwood birds are left. Eyvind: AI, cuts blue ice for the hamlet and trades; his
  daughter Liv sailed south on the Lodestar's last voyage and hasn't come home.
- **The Whale Skerries** (branch, 55–70): low black islets and a whale's bones along the fjord's outer
  shore. Ice seals, skuas, sea urchins, whalebone crabs. A trader in an old whaling hut. Den: **the Old
  Narwhal** (shipped F2; the atlas's "sea creature under the ice bridge"), holding the floes in so the
  fjord's fish can't get out. Her story: `characters/bosses.md`. The trader is Hakon the Bone-Carver.
  - **The Narwhal Grotto** (hard pocket, 70–80): a sea cave of green ice, elites.
- **The Aurora Heights** (branch, 75–90): the high snowfield above the glacier, where the aurora hangs low
  enough to touch and the wrong stars are closest. Field boss: something of the Wyrm's kind that fell
  with it (the harder Wyrm story: one that would rather stay fallen).
  - **The Blue Halls** (hard pocket, 80–90): ice caves inside the glacier, deep blue, elites.
  - Shipped (F3): the Heights' field boss is **the Pale Wyrm**, a lesser star-serpent lying dim in the
    Wyrmfall; the Blue Halls got a field boss too, **the Hall Troll** out of the cutters' stories.
- **The Queen's Bridge** (the heart, 85–100): out onto Glacia's cracked bridge across the strait. Capstone
  den at the crack: **Sigrun, the Queen's Shield** (shipped F4), Glacia's sworn guard, who still freezes the
  crack shut every night though her queen has let go. The harder Glacia story: holding on to someone
  else's holding on. Freed, she stops mending it.

### Frostpeak phases
Each its own session and dev copy, like Greenhollow's.
- [x] **F0: systems for a second island** (2026-10-23): Frostpeak's island map (`FROSTPEAK` in
      `src/shared/branches.js`), its unshipped branches' gates, waystones kept to their own island.
- [x] **F1: the Rimeglass Glacier** (60–75), Old Rimehorn, Ice-Cutter Eyvind (2026-10-23,
      `docs/places/glacier.md`).
- [x] **F2: the Whale Skerries and the Narwhal Grotto** (55–80), the Old Narwhal's den (2026-10-23,
      `docs/places/skerries.md`, `docs/places/grotto.md`). Hakon the Bone-Carver, Grandmother, the Sounding
      Stone; the den is the Breathing Hole at the Floe Edge, next to the Grotto's mouth.
- [x] **F3: the Aurora Heights and the Blue Halls** (75–90), their field bosses (2026-10-23,
      `docs/places/heights.md`, `docs/places/bluehalls.md`). The Pale Wyrm (Lv 90) and the Hall Troll (Lv 88);
      the Serpent Stone, Liv's Reach, the Cutters' Niche; no trader.
- [x] **F4: the Queen's Bridge** (85–100) and Sigrun, Frostpeak's capstone (2026-10-23,
      `docs/places/queensbridge.md`). The Stairhead, the Span, the Frozen Guard, the Crack; Sigrun's den is the
      Seam; the Strait Stone and the Shield's Perch; no trader or field boss. Frostpeak is done; atlas Phase 5
      resumes with Emberdeep's own depth plan, `emberdeep-depth.md`.
