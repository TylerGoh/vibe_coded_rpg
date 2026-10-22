# Combat core: attacking, damage, HP, fainting, the bag, characters

Files: `src/shared/rpg.js` (shared data and formulas), `server/rpg.js` (characters, mobs, hits, loot, bag
actions), `src/rpg.js` (client: mobs, damage numbers, HUD, hotbar, bag UI). Stages and mob AI:
`docs/combat/stages.md`. Bosses: `docs/combat/bosses.md`. Skills, stats: `docs/combat/skills.md`.

## Combat rooms
`COMBAT_ROOMS` / `isCombat(room)`: the four stages and all dens. HP/MP/EXP HUD, the hotbar, skills and
dropping items only exist there. Mobs run on the server at 60 Hz in any combat room with a player in it
and go out at 30 Hz as `mobs` (`[id, kind, x, y, hp, flags, maxHp]`).

## Combat is client-decided, on purpose
The owner chose responsiveness over cheat-proofing (it's a game among friends).
- **Hitting mobs:** the client picks what its slap or skill hit from what's on screen and rolls the damage
  (`slapHits`, `cast`, `roll` in `src/rpg.js`), shows it at once and sends the hits. The server only
  checks each mob exists within range + slack and caps damage at the best possible roll (`applyHits`,
  `capOf`). If you change how damage is rolled, keep the cap ≥ the best roll or real hits get clipped.
- **Being hit:** the client detects contact, slams, falling things and hazards in `rpg.step()` on each
  fresh fixed step and sends `ouch` with that input's seq; it predicts the knockback (`applyKick` in
  `src/net.js`) and the server applies the same knockback after the same input (see `docs/netcode.md`).
  Knockback strengths are in `OUCH` on both sides and must match.
- **Slaps on friends** stay server-judged, against where the slapper saw them (players keep ~0.5 s of
  position history).

## Damage
- Attack: click/tap toward a side, or X / Hit toward where you face. Reach `SLAP_REACH` plus the sword's.
- **With a staff** (S1) the attack is a **staff bolt** instead: a small orb to the first mob ahead within
  `STAFF_BOLT_RANGE` plus the staff's reach (`boltRange` in `statsFor`), for `STAFF_BOLT_MULT` of MAGIC,
  flying at `STAFF_BOLT_SPEED` (`staffBolt` in `src/rpg.js`; the hit is sent at once and shown on landing).
  The server's `attack()` checks that range and caps at MAGIC × `STAFF_BOLT_MULT`. Other players see the bolt
  (`otherBolt`). Slapping friends with a staff is still a close bonk, judged by the server as before.
- All of a character's numbers come from `statsFor(char, buffs)` in `src/shared/skills.js` (gear, scrolls,
  skills, ability points, buffs). Use it, never the parts.
- A roll is `minRoll` (raised by DEX) to `MAX_ROLL` of ATK or MAGIC, then a crit chance and multiplier.
- Everyone who hit a mob recently (a boss: the whole fight) gets its EXP, scaled by `overlevelScale`:
  a mob more than `OVERLEVEL_GRACE` levels below you gives less, down to `OVERLEVEL_FLOOR` (S0, owner
  2026-10-23: levels had run far past the content). Fighting at your own level is untouched. Den bosses
  also have a reward window (`docs/combat/bosses.md`).
- **Friendly fire:** slaps in combat rooms hurt friends only if BOTH have it on (per player, saved, default
  on; toggle in the Esc menu or the bag; a red dot by the name tag = on).
- Defences (Bubble, Aegis, Sanctuary, Second Wind, DEF) are all applied in server `hurt()`.

## Fainting and regen
0 HP → `faint`: the slime splats into a puddle of its colour for a moment (`drawSplats` in main.js; the
server zeroes its inputs and the client sends none), then `wakeUp()` puts it in **its town** (the last
town it was in: `TOWNS`, `docs/world.md`; Slimeville or Icefang Hamlet) with full HP, minus a slice of a
level's EXP. `placeAt` keeps its house door working (waking up used to shut it until the next login). Regen is slow in combat rooms (none right after a hit), fast
elsewhere.

## HUD and bag
- HUD (combat rooms): level, HP, MP, EXP, gold, pills for unspent skill points ("· K") and ability
  points ("AP · I"). Name tags show "Lv N" there.
- Z / Loot picks up the nearest loot (hidden locally at once). I / Bag: `BAG_SLOTS` slots + Helmet and
  Sword; tap to select, tap again to equip/use; "Put on hotbar" for potions; Drop only in combat rooms;
  scrolls get "Use on …" (`docs/combat/items.md`). The bag's left column holds the stats
  (`docs/combat/skills.md`), and its Style row the cosmetics.

## Characters (table `rpg_chars`)
- One JSON blob per user. `load()` in `server/rpg.js` sanitises every field (unknown items/skills dropped,
  over-spent points reset), so **a new saved field needs a default in `newChar()`, a sanitise line in
  `load()` and a place in `save()`**. Sent to its owner as `me` by `sendMe()`.
- Saved every few seconds, on disconnect and on SIGTERM (deploys). New characters start with a Wooden
  Sword and a few jellies.
