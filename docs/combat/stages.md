# Stages, zones, mobs and hazards

Data: `src/shared/rpg.js` (`ZONES`, `HIGHLAND_ZONES`, `CALDERA_ZONES`, `CITADEL_ZONES`, `STAGES`, `MOBS`,
`SPAWNS`). `zoneAt(x, room)` names the zone. Mob brains: `server/rpg.js` (`mobAi` for the special ones).

## The four stages (each zone's level range is its `lvl` in the data)
1. **The Wildwood** (`FIELD`, art `src/field.js`, which also draws the village gate and every mob and item
   icon): Sprout Meadow, Mushroom Grove, Bramble Woods. Bramblehogs are aggressive (chase on sight). Bramble
   Woods holds the Keeper ruins, and a spawn-free stretch at the very end (where the Highlands trail used
   to be) leads to the east cliffs (`docs/places/cliffs.md`).
2. **Frostpeak** (`HIGHLANDS`, `src/highlands.js`; the owner renamed it from "Frostpeak Highlands": the
   island is Frostpeak, the Highlands its interior): Frostpine Ridge, Starfall Summit. Reached by the
   ferry from Greenhollow Harbour, which lands at Icefang Hamlet (a safe town room, `docs/places/fjord.md`);
   its west end is the path down there. The old trail from the Wildwood is gone. Phase 4 filled its open
   mob slots: **floe seals** (passive, belly-slide) and **snow owls** (the cinder bat's dive) on the ridge,
   **shard-moths** (passive flyers) on the summit; art in `src/fjord-art.js`. Mob kinds go over the wire
   as their index in `MOBS`, so new mobs are appended at the end of it.
3. **Emberdeep Caldera** (`CALDERA`, `src/caldera.js`): Cinder Flats, Magma Heart.
4. **Aether Citadel** (`CITADEL`, `src/citadel.js`): Cogwork Bastion, Chrono Spire.
Stages 3 and 4 were added because players were Lv 35–88 and out of content.
**The rebalance (R, 2026-10-23, `story/world/island-depth.md`):** once Greenhollow covered Lv 1–60, stages
2–4 moved up to the bottom of their islands' new bands, keeping their order and spacing: Frostpeak 40–60
(of its 40–100), Emberdeep 90–115 (of ~90–150), the Citadel 140–170 (of ~140–200). Same `MOBS` entries and
kinds, only `lvl`, `hp`, `atk`, `exp` and coins changed, read off the frozen curve at the new level
(`docs/economy.md`); zone labels, `band`s, the ferry's label and the Caldera and Citadel signs moved with
them, and Tove's and Brine's personas name the new levels. Their gear became Legacy (`docs/combat/items.md`).
Lv 60–90 had no fresh content until Frostpeak's depth pass started filling the top of its band (F1: the
Rimeglass Glacier, 60–75; F2: the Whale Skerries, 55–70, and the Narwhal Grotto, 70–80; F3: the Aurora
Heights, 75–90, and the Blue Halls, 80–90).
5. **Willowmere** and 6. **Saltspray Coves**: Greenhollow's first branches (`docs/places/willowmere.md`,
   `docs/places/coves.md`). `COMBAT_ROOMS` is every `STAGES` room plus the dens; `STAGES[room].pill` names
   it in the location pill. `lob` and `trail` take a `style` for their shot / puddle look, `beam` too.
7. **The Mycelium Deep** and 8. **Glowroot Hollow** (a hard pocket, the first with its own elites: Old
   Glowworm, Elder Threadweaver): G2, under Mushroom Grove (`docs/places/deep.md`).
9. **The Old Oak Canopy**: G3, the treetops over Bramble Woods, with the Hornet Queen (a field boss) and
   wasp nests that burst into wasps (`docs/places/canopy.md`).
10. **Wreck Cave** and 11. **the Thornheart**: G4, the hard pockets off the Coves (Lv 30–40, the Drowned
   Bosun) and off Bramble Woods (Lv 50–60, the Thorn Hart), elites in both (`docs/places/wreck.md`,
   `docs/places/thornheart.md`). A rooted shooter is `speed: 0`, `anchored` and `keep: 0` (the pitcher plant).
12. **Keeper's Spine**: G5, the ridge above the Canopy (Lv 45–60), Greenhollow's last branch, with the Root
   Warden's den at its end (`docs/places/spine.md`). No elites and no field boss: the capstone is the danger.
13. **The Rimeglass Glacier**: Frostpeak's depth pass F1, up the glacier's snout from Starfall Summit (Lv
   60–75), with Old Rimehorn (a field boss) and Ice-Cutter Eyvind (`docs/places/glacier.md`). It fills
   60–75, which had nothing of its own after the rebalance; Frostpeak's later phases fill 75–100.
14. **The Whale Skerries** and 15. **the Narwhal Grotto**: F2, out of Icefang Hamlet's west end (Lv 55–70,
   entered at its east end like the Coves) with the Old Narwhal's den at its far end, and a hard pocket in
   the sea cliff beside it (Lv 70–80, elites) (`docs/places/skerries.md`, `docs/places/grotto.md`). A small
   mob can use `stomp` too (the bull walrus, with a small `r`).
16. **The Aurora Heights** and 17. **the Blue Halls**: F3, both off the Rimeglass Glacier: up the Icefall's
   new steps (Lv 75–90, the Pale Wyrm, a `dive` field boss) and down the crevasse's mended ladder (Lv 80–90, a
   hard pocket with elites and the Hall Troll, a `lob` field boss) (`docs/places/heights.md`,
   `docs/places/bluehalls.md`). New shot styles `star` and `ice`, beam style `prism` (`src/hazards.js`).

Each spawn patrols its own strip (ground or a platform) and respawns after `MOB_RESPAWN_MS`.

## Special mobs (`ai` in `MOBS`, run by `mobAi`)
stomp (field bosses) leaps and lands with a shockwave · ember imp lobs fireballs · magma slug leaves burning puddles · obsidian crab's front shell blocks most of
a hit from the front, and it lunges · cinder bat dives · cogling splits into two cogbits · sentry drone
fires a low laser (jump it) · aether knight blinks behind you, then slashes · chrono wraith phases out
(immune), then pulses. Mobs with `fly` hover with no gravity (and only notice slimes within 70 px of their own height, so keep
`fly` low on mobs meant to aggro). `anchored` mobs take no knockback (wasp nests). The branches' mobs reuse these brains under
new names and art (each branch's doc lists which is which).

## Elites and field bosses (island depth G0, `story/world/island-depth.md`)
- **Elites** are separate `MOBS` entries made by `elite(base, name)` from an ordinary mob: the `ELITE_*`
  multipliers (HP, attack, EXP, coins, other drops' chances, level, size), `elite: true` and `base`. Nothing
  new on the wire: the client draws the base mob's art bigger, with a glow (`drawEliteGlow`,
  `src/fieldboss-art.js`), a golden name tag, and its base mob's sounds. They belong in hard pockets;
  the first ones (the Elder Bramblehog) are in Bramble Woods as a proof.
- **Field bosses** (`field: true`, not `boss`) roam an ordinary strip of a wilds room and come back only
  every `FIELD_BOSS_RESPAWN_MS`. When one comes back the room gets `boss`/`fieldUp` (a toast, a horn and a
  line in chat and the feed, its `desc`), and `fieldDown` when it's beaten. Its HP grows by
  `BOSS_HP_PER_PLAYER` per slime who hit it lately (`fieldFighters`; the open field has bystanders, so
  it counts fighters, not everyone in the room), it heals up after `FIELD_BOSS_IDLE_MS` alone, it takes no
  knockback, everyone who hit it during the fight gets the EXP, and its loot is shared like a den
  boss's. Small bosses get no story, den, phases or ultimate (owner): a name, a look, a line, and a move
  or two from the mob tricks. Its tag always shows its HP. Art: `FIELD_BOSS_ART` in
  `src/fieldboss-art.js`.
- **Turnipop** (Sprout Meadow) is the first: a turnip that grew far too big and far too grumpy. It's
  passive until hit (new players walk past it), then uses `stomp`: it crouches (the shockwave's reach is
  marked), leaps and lands with a shockwave along the floor (jump it or stand on a ledge). `stompLands`
  in `server/rpg.js`; the client reuses the bosses' slam warning and shockwave.
- Both are checked by `npm run economy` (`docs/economy.md`).

## Hazards pipeline (mob and boss attacks)
The server sends one event per attack (`newMove` / `mobAi`); `hazardEvent` in `src/rpg.js` turns it into
`this.hz` entries; `hazardHits` judges them on each fresh step (client-decided, see
`docs/combat/core.md`); `src/hazards.js` draws them. Dash / Blink i-frames (`ifr`) skip hazard hits.

## Adding a stage
Room in `ROOMS` (sim.js), zones + platforms + `STAGES` + spawns + `COMBAT_ROOMS` in rpg.js, a door pair,
an art file that paints its own sky, music scene in `src/audio.js`, and its dens (`docs/combat/bosses.md`).
