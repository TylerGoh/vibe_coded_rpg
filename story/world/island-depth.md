# Island depth: deep islands before new ones

**The method every island follows** (owner, 2026-10-20). Greenhollow (Lv 1–60, G0–G5) and Frostpeak
(40–100, F0–F4) are done; Emberdeep (90–150) is in progress in `emberdeep-depth.md`. Their maps, branch
tables, phases and the rebalance (R) as planned are in `../archive/island-depth-full.md`; what shipped is
in `docs/places/branches.md` and each place's doc.

## The owner's direction (2026-10-20)
- **Islands cover wide level bands, and they overlap**, so you can leave early for the next island or stay
  to finish the side areas.
- **Islands branch.** Not one strip of zones but a map with forks: a main trail, side branches, much
  harder pockets, easier pockets, and sometimes bigger bosses out in the open.
- **More to discover on each island:** each island's theme explored properly, with things found by
  wandering.
- **No quests** (owner, explicit). No quest system, quest givers, quest log or tracker. Discovery comes
  from the places themselves: hidden spots, rare spawns, readable ruins, field bosses, and characters
  worth chatting with. Don't add quests back in another form.
- **Don't move on to the next island until this one is fleshed out.** It doesn't all ship at once.
- **Existing characters keep their levels and gear.** When an island's band moves, owned gear stays as it
  is and is marked **Legacy**; mobs drop scaled copies (`<id>_n`; `docs/combat/items.md`).

## What "deep" means: the checklist for calling an island done
1. **Every 5-level slice of its band has at least two places to farm**, in different branches.
2. **A branching map** (`atlas.md`'s room kinds), each branch a full theme of its own, not a recolour:
   - **the main trail**: the easy-to-hard spine you'd walk without thinking;
   - **side branches** off it, each with its own landscape, mobs, people and a den;
   - **hard pockets**: a door off a branch far above its surroundings (elites, a field boss), labelled
     with its level so nobody wanders in by accident;
   - **easy pockets**: calm side spots with low mobs, good for newcomers, alts and chatting.
3. **Bosses at four sizes:** dens, **field bosses** (a big mob roaming a wilds room on a long timer,
   announced to the room), **one party den** at the top of the band, with a den and a story beat, built for
   a mixed party (`../progression.md` section 6), and **one final boss** (owner, 2026-10-24): four or more
   players at the recommended level (the band's top; the boss's own level shown far higher) and about 30
   minutes. It lives far deeper in than anything else, past the darkest, most closed-in hard pocket, through
   a deep room and a cinematic approach (the owner's "trapped" mood). It's always **the last
   phase** of an island's depth pass, after the party den (`../final-bosses.md`).
4. **Things to find, no quests:** each branch has something off the beaten path (a hidden ledge, a rare
   mob, a readable Keeper stone, a view). Its people are chattable AI characters with lives of their own
   (and a trade where it fits), not quest givers.
5. **Getting around:** waystones and the island map (`docs/places/waystones.md`, `docs/ui/world-map.md`).
6. The usual: a town at the landing (`atlas.md`), mobile, music scenes, the economy sheet green.

## Bosses: which ones get a story
**Big bosses get a story; small ones don't** (owner, 2026-10-20). Dens and party dens each have a
holding-on / letting-go story, `lines` on entering, at their phase and when freed, and loot that names
their place (`../characters/bosses.md`). **Field bosses and elites are small:** a name, a look, a one-line
description and a short announcement. When a big boss ships, its story goes into `../characters/bosses.md`.

## Numbers: how a builder sets them
The code holds the values; these are the rules for choosing them. `npm run economy` before and after,
`--check` green (`docs/economy.md`).
- **New mobs follow the frozen legacy curve** (`src/shared/curve.js`): HP, attack, EXP and gold from the
  curve at their level, nudged for their gimmick.
- **Elites** reuse a normal mob with the elite multipliers, drawn with a glow; only in hard pockets.
- **Field bosses** sit between a branch's mobs and its den, worth a few minutes of farming per kill. HP
  scales with players like dens (`BOSS_HP_PER_PLAYER`).
- **Gear per branch:** a trader tier aimed at the branch's middle level (with an `aim`), mob-drop gear a
  little under it, den gear a step above; every item about as strong as the gear curve at its level
  (`GEAR_FIT`), never stronger. Names in the island's register (`atlas.md`).
- **Potions on the road:** each branch's trader sells the basic potions.

## Systems (all built; reuse them)
Field bosses, elites, door level labels with a danger look for hard pockets, waystones, the island map,
crossing rooms and blocked branch gates. How to ship a branch, step by step: `docs/places/branches.md`.
