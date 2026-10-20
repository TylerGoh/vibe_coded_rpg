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
  their numbers stay as they are, and their stat blocks and brains (`ai` in `MOBS`) can be reused, re-themed,
  to fill the new bands. The legacy Emberdeep and Citadel stages stay open as they are for high-level
  players until those islands get their own depth pass, which brings harder bosses that fit their themes.

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
The legacy mobs themselves stay where they are. New mobs are appended to `MOBS` (kinds go over the wire as
their index).

## Greenhollow's map `[proposed]`
```
                              [Keeper's Spine 45-60] -- the Root Warden (capstone)
                                        |
                              [Old Oak Canopy 25-40]
                                        |  climb up from Bramble Woods
 Harbour -- Slimeville -- Sprout Meadow -- Mushroom Grove -- Bramble Woods -- East Cliffs
    |                          |                |                  |
 [Saltspray Coves 10-25]  [Willowmere 5-15]  [the Mycelium Deep 15-35]  [the Thornheart 50-60] hard
    |                                           |
 [Wreck Cave 30-40] hard                     [Glowroot Hollow 40-50] hard
```
The existing Wildwood (1–12) stays as the main trail's start, untouched.

- **Willowmere** (easy pocket and branch, 5–15): a pond and slow river north of the meadow, willows,
  reeds and a mill. Gloop snails, dragonflies, frogs; fishing; riverside herbs. **Field boss: Old
  Snapjaw**, a huge pond turtle who surfaces now and then. People: **Miller Bun** (AI: runs the mill,
  grumbles that the eels eat the bread, sells flour-based snacks).
- **Saltspray Coves** (branch, 10–25): south from the harbour along the shore. Tide pools, sea stacks,
  gull rookeries. Rock crabs, storm gulls, tide jellies. People: **Beachcomber Moss** (AI: collects things
  the sea brings in, some of them Keeper-made, a light Tier 1 thread). Den: **the Tidemother** `[slot]`.
  - **Wreck Cave** (hard pocket, 30–40): a sea cave at the cove's end, a wreck in it, drowned lamps.
- **The Mycelium Deep** (branch, 15–35): down through a hollow stump in Mushroom Grove. The glowing
  threads seen above are thick roots down here, and they run *off toward the sea* (canon: the mycelium
  net runs under the sea). Puffcaps, puffballs, cave bats. Den: **the Sporelord** `[slot]`.
  - **Glowroot Hollow** (hard pocket, 40–50): the deepest cave, where the threads knot. Glowworms.
- **Old Oak Canopy** (branch, 25–40): climb up from Bramble Woods into the treetops. A vertical room:
  branches, rope bridges, hollow-trunk ladders. Squirrels, owls, wasp nests. A treehouse camp with
  **Ranger Acorn** `[name proposed]` (AI: watches the woods, knows every nest). Field boss: **the Hornet Queen**.
- **Keeper's Spine** (the heart, 45–60): the island's ridge above the canopy, bare stone and wind, the
  biggest Keeper ruins on the island (the Waystone network starts here). Moss turtles, stone sentinels.
  - **The Thornheart** (hard pocket, 50–60): the briar's root, thorn stalkers.
  - **Capstone: the Root Warden** `[proposed]`: a Keeper guardian the roots grew through, still
    guarding a sealed gate beside the Root Stone. It holds on to its post (the theme); beaten, it lets
    the roots have it. Ties to the Heartroot and the apple tree (`../characters/mochi-and-chronos.md`).

Each branch's entrance follows the owner's rule between phases: until it ships, its way in is visible
but blocked in-world (the mill bridge washed out, the stump's hole choked with roots, the tide in over
the cove path), and the update itself lifts it.

## Systems the depth needs (built once, used on every island)
- **Field bosses and elites:** a big mob that spawns in a wilds room on a long timer and roams; elite
  versions of normal mobs (more HP and damage, a glow, better drops) for the hard pockets.
- **Level labels on doors** (some exist already: "(Lv 28+)"), and a danger look for hard-pocket doors.
- **Waystones:** fast travel between the Keeper waystones you've touched (per character). The lore is
  already in the ruins (the Waystone plaque).
- **An island map:** the World map page zooms into an island and shows its branches, their level bands
  and where you are (`docs/ui/world-map.md`).
- **The economy sheet** learns the new bands, field bosses and elites (`docs/economy.md`).

## Greenhollow phases
Each is its own session. The order puts the systems first, then fills the band from the bottom up.
- [ ] **G0: systems.** Field bosses and elites, door level labels, the island map.
- [ ] **G1: Willowmere and Saltspray Coves** (5–25), Old Snapjaw, Miller Bun and Beachcomber Moss.
- [ ] **G2: the Mycelium Deep and Glowroot Hollow** (15–50), the Sporelord.
- [ ] **G3: Old Oak Canopy** (25–40), the Hornet Queen, waystones.
- [ ] **G4: Keeper's Spine, the Thornheart and Wreck Cave** (30–60), the Root Warden. Check the
      checklist above; when it holds, Greenhollow is done.

## After Greenhollow
**Frostpeak's depth pass (40–100)**, the same way: the existing ridge and summit (Lv 13–27, legacy)
become its easy end, and new branches explore the cold north properly (the fjord coast and its sea
caves, the glacier, the ice bridge, ice caves, the aurora heights), with harder versions of Glacia's and
the Wyrm's stories at the top. Until then Frostpeak stays as it is, a little easy for its place in the
order. Only after that does the atlas's Phase 5 (the south) resume, with Emberdeep re-banded above
Frostpeak.
