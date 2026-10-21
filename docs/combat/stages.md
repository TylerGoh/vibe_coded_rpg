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
5. **Willowmere** and 6. **Saltspray Coves**: Greenhollow's first branches (`docs/places/willowmere.md`,
   `docs/places/coves.md`). `COMBAT_ROOMS` is every `STAGES` room plus the dens; `STAGES[room].pill` names
   it in the location pill. `lob` and `trail` take a `style` for their shot / puddle look, `beam` too.
7. **The Mycelium Deep** and 8. **Glowroot Hollow** (a hard pocket, the first with its own elites: Old
   Glowworm, Elder Threadweaver): G2, under Mushroom Grove (`docs/places/deep.md`).

Each spawn patrols its own strip (ground or a platform) and respawns after `MOB_RESPAWN_MS`.

## Special mobs (`ai` in `MOBS`, run by `mobAi`)
stomp (field bosses) leaps and lands with a shockwave · ember imp lobs fireballs · magma slug leaves burning puddles · obsidian crab's front shell blocks most of
a hit from the front, and it lunges · cinder bat dives · cogling splits into two cogbits · sentry drone
fires a low laser (jump it) · aether knight blinks behind you, then slashes · chrono wraith phases out
(immune), then pulses. Mobs with `fly` hover with no gravity. The branches' mobs reuse these brains under
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
