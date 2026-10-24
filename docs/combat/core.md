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
  A predicted kill hides an ordinary mob at once, but **never a boss or field boss** (`showHit` keeps it at
  1 HP): its death waits for the server's `die` / `fieldDown`. Predicting it made bosses die on screen, come
  back with a sliver of HP when the server disagreed, and die again (owner bug, 2026-10-24).
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
- **With a bow** (S4) it's a **bow shot**: an arrow to the first mob ahead within `arrowRange` (`statsFor`) for
  `BOW_SHOT_MULT` of ATK (`bowShot`; others see `otherArrow`); the server's `shoot()` checks the range and caps
  it, a Retreat Shot (`retreatOpen`) higher. Hits on friends with a bow are a close slap, as with a staff.
- All of a character's numbers come from `statsFor(char, buffs)` in `src/shared/skills.js` (gear, scrolls,
  skills, ability points, buffs). Use it, never the parts.
- A roll is `minRoll` (raised by DEX) to `MAX_ROLL` of ATK or MAGIC, then a crit chance and multiplier.
- Everyone who hit a mob recently (a boss: the whole fight) gets its EXP, scaled by `overlevelScale`:
  a mob more than `OVERLEVEL_GRACE` levels below you gives less, down to `OVERLEVEL_FLOOR` (S0, owner
  2026-10-23: levels had run far past the content). Fighting at your own level is untouched. Den bosses
  also have a reward window (`docs/combat/bosses.md`).
- **Friendly fire:** slaps in combat rooms hurt friends only if BOTH have it on (per player, saved, default
  on; toggle in the Esc menu or the bag; a red dot by the name tag = on).
- Defences (Bubble, Aegis, Sanctuary, Second Wind, DEF, a brewed ward, Mana Shield, the Archer's Evasion) are
  all applied in server `hurt()`. Mana Shield takes its share of a hit off MP while there's MP (never an
  ultimate's). An evaded hit (S4) still knocks you back, as the client predicted, but does no damage.
- **Hunter's Mark** (S4): every slime's hits on a marked mob may be `boost` bigger; `applyHits` raises any
  hitter's cap while `m.mark` is up, and a netted mob, like a frozen one, can't hurt anyone by touch.
- **Charge** (Warrior): a slap while dashing or just after (`chargeOpen`) is judged by `attack()` from the
  server's own state at that input: a higher cap and the same state edit the client predicted
  (`docs/combat/skills.md`).
- **The Mage's combos** (`docs/combat/skills.md`): `applyHits` takes the spell's element (`el`) and applies
  chill / freeze / burn / spread after each hit (`element()`); a fire hit the client marked as a shatter is
  capped at `SHATTER_MULT` more only if the server's mob is frozen too. A Mage spell's cap also includes
  the server's Arcane Charge count (`arcaneMult`). Burns tick on the server as the caster's hits.
- **Jelly Thirst** (Warrior): `thirst()` heals the hitter a share of the damage its slap or skill just did
  (after the server's cap), and tells the room `{t:'thirst', id, n}` for the green +HP.

## Fainting and regen
0 HP → `faint`: the slime splats into a puddle of its colour for a moment (`drawSplats` in main.js; the
server zeroes its inputs and the client sends none), then `wakeUp()` puts it in **its town** (the last
town it was in: `TOWNS`, `docs/world.md`; Slimeville or Icefang Hamlet) with full HP, minus a slice of a
level's EXP. `placeAt` keeps its house door working (waking up used to shut it until the next login).
With a Cleric holding Revive ready in the room, the faint lasts `REVIVE_WAIT` instead, so it can be got back
up where it fell with no EXP lost (`docs/combat/skills.md`, the Cleric). Regen is slow in combat rooms (none right after a hit), fast
elsewhere.

## HUD and bag
- HUD (combat rooms): level, HP, MP, EXP, gold, pills for unspent skill points ("· K") and ability
  points ("AP · I"). Name tags show "Lv N" there.
- Z / Loot picks up the nearest loot that fits (hidden locally at once; `lootFits`): with a full bag it skips
  items it can't hold, so the coins beside them still come in (owner bug, 2026-10-24). I / Bag: `BAG_SLOTS` slots + Helmet and
  Sword; tap to select, tap again to equip/use; "Put on hotbar" for potions; Drop only in combat rooms;
  scrolls get "Use on …" (`docs/combat/items.md`). The bag's left column holds the stats
  (`docs/combat/skills.md`), and its Style row the cosmetics.

## Characters (table `rpg_chars`)
- One JSON blob per user. `load()` in `server/rpg.js` sanitises every field (unknown items/skills dropped,
  over-spent points reset), so **a new saved field needs a default in `newChar()`, a sanitise line in
  `load()` and a place in `save()`**. Sent to its owner as `me` by `sendMe()`.
- **Play time** (owner, 2026-10-23, for balancing how long levels take): `played` (ms logged in) and
  `active` (the part of it with a key pressed in the last `ACTIVE_WINDOW_MS`), counted by `clock()` on every
  save. Recorded from 2026-10-23 only: older characters started at 0. Read them straight from the DB.
- **Levels** (L1, `story/progression.md`): `expToNext` in `src/shared/rpg.js` is built so a level takes
  about `LEVEL_MIN` minutes of farming at your own level (slowing as you go: ~10 min at Lv 100, ~20 at
  Lv 200), never faster than the old curve. `docs/economy.md` checks the pace. Fainting costs a tenth of a
  level's EXP, so since L1 that's up to a minute or two of farming late on, not a few seconds.
- **The rollback** (L3, one time): `load()` moves the characters in `ROLLBACK` (the ones who had levelled
  far past their play time) down to the level the owner set for them, plus what their recorded `active`
  time adds at `LEVEL_MIN` a level (`rollbackLevel`). EXP to 0, skill points, AP and skill hotbars reset
  (both setups), `bossAt` cleared; gold, bag, gear, house and pets kept. The saved flag `lb` marks a
  character as done (fresh ones start with it; the check reads the saved row, not the merged one, since
  `newChar()`'s default would hide a missing flag). A rolled-back character gets a one-time `notice` (a
  toast and a chat line) on joining, sent from `entered()`.
- **Classes** (S2): `cls` and `reborn` are saved; the one-time migration to Novices is in `load()` too
  (`docs/combat/skills.md`).
- Saved every few seconds, on disconnect and on SIGTERM (deploys). New characters start as Novices with a
  Wooden Sword and a few jellies.
