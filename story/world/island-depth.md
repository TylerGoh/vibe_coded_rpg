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
- **The Mycelium Deep** (branch, 15–35): down through a hollow stump in Mushroom Grove. The glowing
  threads seen above are thick roots down here, and they run *off toward the sea* (canon: the mycelium
  net runs under the sea). Puffcaps, puffballs, cave bats. Den: **the Knotmole** (~Lv 35).
  - **Glowroot Hollow** (hard pocket, 40–50): the deepest cave, where the threads knot. Glowworms, elites.
- **Old Oak Canopy** (branch, 25–40): up from Bramble Woods into the treetops. Squirrels, owls, wasp
  nests. A treehouse camp with **Ranger Acorn** `[name proposed]` (AI: watches the woods, knows every
  nest; trades). Field boss: **the Hornet Queen** (~Lv 38). **Built as a wide room, not a tall one:**
  rooms have a width and a fixed ground and the camera doesn't scroll up, so the "height" is layered
  platforms (branches, rope bridges) filling the screen above a forest floor, and the art (trunks running
  off the top, sky through leaves) sells it. A vertical camera is its own `step()`/camera project; don't
  start it inside G3.
- **Keeper's Spine** (the heart, 45–60): the island's ridge above the canopy, bare stone and wind, the
  biggest Keeper ruins on the island. Moss turtles, stone sentinels.
  - **The Thornheart** (hard pocket, 50–60): the briar's root, thorn stalkers, elites.
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
- Small: **Old Snapjaw**, **the Hornet Queen**, **the Drowned Bosun**, and any field boss added later.

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
- [ ] **G0: systems.** The frozen legacy curves in the economy script, field bosses, elites, door
      level labels, the island map. Prove them in the
      existing Wildwood (a small field boss in Sprout Meadow, an elite or two in Bramble Woods), and lay
      every branch's blocked entrance (table above) so the island shows what's coming.
- [ ] **G1: Willowmere and Saltspray Coves** (5–25), Old Snapjaw, the Tidemother, Miller Bun and
      Beachcomber Moss, the first gear tiers, and waystones.
- [ ] **G2: the Mycelium Deep and Glowroot Hollow** (15–50), the Knotmole.
- [ ] **G3: Old Oak Canopy** (25–40), the Hornet Queen, Ranger Acorn.
- [ ] **G4: the hard pockets**: Wreck Cave (30–40) and the Thornheart (50–60), elites, the Drowned
      Bosun.
- [ ] **G5: Keeper's Spine** (45–60) and the Root Warden. Then go through the "deep" checklist above;
      when it holds, Greenhollow is done.
- [ ] **R: the rebalance** (section above): the later islands' legacy mobs and bosses go up to their
      new bands, their gear gets scaled new copies, and what players own is marked Legacy. Then
      Frostpeak's pass starts.

## Legacy loose ends (default: leave them alone until the rebalance)
- The ferry's door still says "Lv 13+" and Frostpeak still runs 13–27. Both change in the rebalance
  (after G5), not during Greenhollow's phases.
- The pass from Frostpeak's summit down to the legacy Emberdeep stage and the skylift to the Citadel
  stay (their level labels change in the rebalance): they're how high-level players reach that content.
  They go when the atlas's Phase 5 and 6 replace them with the ship and the balloon.

## After Greenhollow
**Frostpeak's depth pass (40–100)**, the same way: the existing ridge and summit (raised to about
40–60 by the rebalance) become its easy end, and new branches explore the cold north properly (the fjord coast and its sea
caves, the glacier, the ice bridge, ice caves, the aurora heights), with harder versions of Glacia's and
the Wyrm's stories at the top. Before starting it, write its branch map and phases here the way
Greenhollow's are. Only after that does the atlas's Phase 5 (the south) resume, with Emberdeep
already re-banded above Frostpeak by the rebalance.
