# S2, split into pieces (sub-plan for agents)

**Status: plan, written 2026-10-23. S2.1 built 2026-10-23 on the git branch `s2` (not deployed: deploy #1
needs S2.2 and S2.3 too; start S2.2–S2.4 from that branch).** S2 in `progression.md` ("the tree") is too big for one
session, so it's cut into six pieces, each sized for one agent. The design and the owner's decisions are in
`progression.md` (sections 1, 1a, 1b, 1c, 2, 3, 7, 9): read it first. This file pins down what that plan
left open and says who does what. Numbers here (maxes, the schedule) are starting points: S2.4's CLASSES
table is what tunes them.

## Order and shipping
**L comes first** (`progression.md`, "L: the levelling rebalance"): the new EXP curve is what makes the
advancement levels below (10, 30, 60, 100) widen in play time (~20 min, ~1.5 h, ~4.5 h, ~10 h). **L shipped
on its own on 2026-10-23**: `rebirthCost` and `REBIRTH_HOURS` already exist in `src/shared/rpg.js` (S2.1 only
uses them), and the rollback already happened, so S2's migration has its own banner.
```
S2.1 data + server ──┬── S2.2 node tree UI ──┐
                     ├── S2.3 Rebirth Pool ──┼── deploy #1 (classes go live, the refund happens)
                     └── S2.4 CLASSES sheet ─┘
                          then S2.5 Warrior chase moves → deploy #2
                          then S2.6 Mage combos        → deploy #3
```
- **S2.1 first, alone.** Everything else builds on its data.
- S2.2, S2.3, S2.4 can run at the same time. File overlap: S2.2 and S2.3 both touch `index.html`,
  `src/style.css` and `src/main.js` (different blocks); give each its own repo copy and merge by hand, or run
  them one after the other. S2.4 only touches `scripts/economy.mjs` and `docs/economy.md`.
- **Deploy #1 needs S2.1 + S2.2 + S2.3 together**: the refund and the class lock are broken without the new
  tree and the pool. S2.4 should land with it (Agent.md: anything touching power runs the sheet).
- S2.5 and S2.6 both edit `src/shared/skills.js`, `server/rpg.js` cast and `src/rpg.js` cast, so run them one
  after the other (S2.5 first: it's the riskier netcode change), each its own deploy.

## Rules for every agent (repeat these in the prompt)
- Read `Agent.md`, `story/progression.md`, this file, and the docs listed under your piece.
- Work in your own copy of the repo (Agent.md "Big features"). Build into the scratchpad
  (`npx vite build --outDir <scratch>/testdist`), test on a throwaway port with a copy of the DB
  (`docs/testing.md`). **Never build into `dist/`, never restart `rpg`, never deploy or push.** Hand back a
  list of changed files and what you tested; the main session deploys.
- Mobile works too (`docs/ui/mobile.md`). No emoji in canvas text. Docs updated, `npm run docs:check` green,
  `npm run economy -- --check` green.

## Settled here (beyond progression.md)
- **Novices (owner, 2026-10-23):** everyone starts as a Novice (`cls: 'novice'`): the Novice tree and
  Mobility, any weapon. **At Lv 10 you choose a class at the Rebirth Pool, free** (the first choice is the
  free one; every change after costs `rebirthCost(lvl)`, which scales with level: `progression.md` L2). Below Lv 10 the pool's card says "Come back at Lv 10".
  Staying a Novice past Lv 10 is allowed; class points just pile up unspent, and a reminder shows in the K
  panel.
- **Migration (piece S2.1):** every existing character becomes a Novice. All skill points and AP refunded,
  the skill hotbars of both setups cleared (potion bars kept), `reborn: 0` so the first choice is free, and a
  one-time banner on next login ("Classes are here: choose yours at the Rebirth Pool by Elder Mochi").
- **Weapon lock:** Novices can equip any weapon. A class can only equip its own kind (Warrior sword, Mage
  staff). Choosing a class puts a wrong-kind weapon back in the bag (refused if the bag is full: "make room
  first"), and hands out a free starter weapon (`wood_sword` / `wood_staff`) if you own none of the new kind.
  Unarmed still slaps.
- **The Novice tree, kept forever** (like MapleStory's Beginner skills): ★Slime Bash 3 (a strike, on ATK),
  ★Pebble Toss 3 (a short-range throw, on the better of ATK and MAGIC, so a staff Novice isn't stuck),
  ★Jelly Patch 3 (a small self-heal on a long cooldown). Nine points, exactly what Lv 1–9 gives. They stay
  usable after you choose a class, but are weak by then.
- **Who heals until S3:** Jelly Heal leaves with the Magic tree and comes back in the Cleric (S3). Until
  then, only Jelly Patch (yourself) and potions. Mention it in the banner. (Recommend S3 soon after.)
- **Advancements gate by level, not by points:** each skill has `adv` (Novice 1; class 10, 30, 60, 100); it
  can be learned from that level. `TIER_NEEDS` goes. The Lv 150 masteries are S6's.
- **The fork:** each class has two branches (`branch` on the skill). Points can sit in one branch only;
  learning in the other is refused with "Take your Knight points back first" (free, any time out of combat).
  Basics and Mobility have no branch.
- **The `spTotal` schedule** (constants named in skills.js, values a starting point): Lv 1–9 one point a
  level (the Novice tree's 9); then class points: +3 at Lv 10, one per 3 levels to Lv 60, one per 10 levels
  to Lv 200, +2 at each of Lv 30, 60, 100; nothing past Lv 200 (S6). Class points: 3 at Lv 10, 23 at Lv 60,
  29 at Lv 100, 39 at Lv 200, against ~51 to fill basics, one branch and Mobility: you finish your branch and
  get some of Mobility, never all. Novice and class points are separate counts (`spNovice`, `spClass`), so
  the Novice tree can never eat class points. Mobility takes class points (a Novice can't learn it).
- **Chase moves cost no MP** (piece S2.5): they move you, so they live in `step()`, which can't know MP. Only
  cooldowns, kept in the physics state.

## The trees (S2.1 builds the rows; ★ = new skill, (S2.5)/(S2.6) = lands with that piece)
Levels below: the class's basics open at Lv 10 (when you choose it), the fork at Lv 30, then Lv 60 and
Lv 100. The masteries (★Bastion, ★Bloodlust, ★Wildfire, ★Permafrost) move to Lv 150 and ship with S6.
**Warrior** (sword, STR)
| adv | basics | Knight (holds the boss, tough) | Berserker (hits hardest up close) |
|---|---|---|---|
| Lv 10 | Power Strike 3, Cleave 3, Iron Jelly 3, ★Jelly Thirst 3 (hits heal you a share of the damage: the Warrior's solo answer), ★Charge 2 (S2.5), ★Leap Slam 2 (S2.5), ★Upward Cut 2 (S2.5), ★Momentum 2 (S2.5) | | |
| Lv 30 | | Jelly Bubble 3, Vitality 5, Rally 3, Second Wind 3 | Whirlwind 5, Berserk 3 |
| Lv 60 | | Sanctuary 3 | Sword Mastery 5, Blade Storm 3 |
| Lv 100 | | Aegis 3 | Sky Splitter 3 |
| Lv 150 (S6) | | ★Bastion 1 (Second Wind also restores 30% HP and gives a short bubble) | ★Bloodlust 1 (while Berserk is up, Jelly Thirst heals 3x and +10% crit) |

**Mage** (staff, INT)
| adv | basics | Elementalist (fire: area burst) | Frostbinder (ice and storm: control) |
|---|---|---|---|
| Lv 10 | Magic Bolt 3, Mana Flow 3, Arcane Mind 3, ★Mana Shield 3 (a buff: a share of damage taken comes off MP instead of HP), ★Arcane Charge 3 (S2.6) | | |
| Lv 30 | | ★Fireball 5 (a bolt that bursts in a small radius where it lands) | Frost Nova 3, Chain Lightning 5 |
| Lv 60 | | Meteor 3, ★Kindling 5 (passive: fire spells hit harder) | ★Glacial Spike 5 (a long-range ice bolt that slows hard) |
| Lv 100 | | Starfall 3 | ★Absolute Zero 3 (every mob near you: damage and a long slow) |
| Lv 150 (S6) | | ★Wildfire 1 (Fireball's burst is twice as wide and Meteor lands twice) | ★Permafrost 1 (Frost Nova stops ordinary mobs dead, and slows bosses longer) |

**Mobility** (every class, class points): Dash 3, Flash Jump 3, Blink 3, Phantom Step 2, unchanged.

**Novice** (Lv 1, Novice points, kept forever): ★Slime Bash 3, ★Pebble Toss 3, ★Jelly Patch 3.

---

## S2.1: classes, trees and the server (data, rules, migration; no new UI) — built 2026-10-23
As built (`docs/combat/skills.md` has the details): `REBIRTH_X` is a placeholder (2300) for S2.3 to move.
The migration notice and the advancement messages are toasts plus chat lines (`notice` carries
`news: 'classes'`, `{t:'advance'}`), for S2.2/S2.3 to turn into banners. On choosing a class the strongest
weapon of its kind in the bag is equipped. Novice skills reset with the rest on a rebirth (all points
come back). The per-rank numbers of skills whose max fell from 5 to 3 were raised to keep the max rank's
worth; Jelly Thirst, Mana Shield, Fireball, Kindling, Glacial Spike and Absolute Zero have first-guess
numbers for S2.4 to tune. Tested: the live DB's ten characters migrate (including a rollback + classes
double notice), the learn / fork / level / class gates, rebirth (free once, then paid; refusals: level,
distance, gold, full bag), weapon lock, Mana Shield in `hurt()`, Jelly Thirst, the Lv 30 advancement
message, and every new skill cast in a headless browser.
Docs: `docs/combat/skills.md`, `docs/combat/core.md`, `docs/combat/items.md`, `docs/netcode.md` (protocol).
- `src/shared/skills.js`: `CLASSES` (`novice`, `warrior`, `mage`: name, weapon kind, main stat, colour, blurb, strong /
  bad at text for the pool's card, its two branches with names and blurbs); `TREES` becomes per class plus
  Mobility; every skill gets `cls`, `branch` (or none) and `adv`; the rows above (the ★ skills without an
  (S2.x) tag are built here, with their numbers); `ADVANCEMENTS` (level → what opens, for the banner);
  `spTotal` as the schedule; `cantLearn(c, id)` / `cantUnlearn(c, id)` learn the class, the fork and `adv`
  (callers pass the character, not `lvl, skills`). `statsFor` learns Jelly Thirst, Mana Shield, Kindling
  (the Lv 150 masteries wait for S6). Remove `TIER_NEEDS` and old skills that no class uses (`heal` waits for S3: keep its
  icon/fx code, drop it from `SKILLS`).
- `server/rpg.js`: `c.cls` and `c.reborn` saved; `load()` runs the migration once (no `cls` yet: everyone a Novice) and drops
  skills that aren't the class's; `cast()` refuses another class's skills; equip refuses the wrong weapon
  kind; Jelly Thirst heals in `attack`/`cast` hits, Mana Shield in `hurt()`;
  `sendMe` sends `cls`, `reborn`, and a `news` flag for the one-time banner; a level-up that crosses an
  advancement level sends a toast/banner event. New message **`{t:'rebirth', cls}`** (handler written here,
  server-checked: in Slimeville within range of `REBIRTH_X` from `src/shared/sim.js` (S2.3 places it; define
  the constant here with a placeholder value), different class, not back to Novice, Lv 10 or up, `rebirthCost(lvl)` unless `reborn` is 0, the
  weapon rules above; resets skills, AP, skill hotbars, buffs; broadcasts `{t:'reborn', id, cls}`).
  `rebirthCost(lvl)` and `REBIRTH_HOURS` are already in `src/shared/rpg.js` and the economy sheet (L shipped
  them); just use them.
- `server/index.js`: route `rebirth`, protocol comment.
- Client, minimal: `src/rpg.js` / `src/skillfx.js` cast and icons for the new skills (reuse effects with a
  tint where possible: Fireball = bolt + small nova, Glacial Spike = bolt in ice blue, Absolute Zero = nova);
  the old K panel keeps working well enough on the new data to test (S2.2 replaces it); the banner text.
- Test: a copy of the live DB loads with no errors; the Lv 390 and a Lv 5 migrate to Novices right; learn /
  unlearn / fork / level gates; rebirth through a test client (free once, then 500k); every new skill casts.

## S2.2: the node tree UI (K panel), desktop and phone
Docs: `docs/combat/skills.md`, `docs/ui/mobile.md`, `docs/ui/hints.md`. Files: `src/skilltree.js`,
`index.html` (`#skills`), `src/style.css`.
- Tabs: Novice, your class (a Novice sees "Choose a class at Lv 10 at the Rebirth Pool" instead, with
  the two classes' trees greyed out so they can look ahead), and Mobility. The class tab shows the basics on top, then the fork as two columns
  (branch names and blurbs as headers) with rows per advancement (Lv 10, 30, 60, 100), nodes joined by lines.
  The branch you hold points in is bright, the other dimmed with "Take your points back to switch".
- A node: round skill icon (`drawSkillIcon`), rank badge `2/3`. Rows not open yet are greyed with "opens at
  Lv 30". Tap/click a node: its card (name, MP/cooldown or passive, desc and next rank, why it can't be
  learned) opens under the tree, with + / − / Hotbar. Reset all stays. Points left and the next advancement
  shown in the header.
- Phone: one tab at a time, nodes at least 44 px, the card below the tree, scrolls inside the panel. Check at
  the phone sizes in `docs/ui/mobile.md`.
- Test with headless screenshots at desktop and phone size, Warrior and Mage, low and high level.

## S2.3: the Rebirth Pool (place, card, Elder Mochi)
Docs: `docs/world.md`, `docs/art.md`, `docs/ui/hints.md`, `docs/ui/mobile.md`, `docs/social/ai-characters.md`,
`docs/ui/audio.md`; `story/world/regions/greenhollow.md` and `story/world/atlas.md` before placing it.
- Place: a softly glowing spring in Slimeville near Elder Mochi (`x: 2075`), set `REBIRTH_X` to its spot,
  clear of doors and NPC talk ranges. Procedural canvas art in the village scenery, pastel, gently
  shimmering (respect the Graphics setting, `docs/performance.md`), drawn on the world map if the village
  details are there (`docs/ui/world-map.md`).
- A prompt above your slime near it (`docs/ui/hints.md`): "E: the Rebirth Pool". E / tap opens the card
  (HTML overlay): below Lv 10, only "Come back at Lv 10 to choose your class" (with what the classes are);
  from Lv 10, the classes from `CLASSES` (only Warrior and Mage exist in S2; don't list or tease the
  others), each with strong at / bad at, your current one marked, the price ("Free: your first choice" or
  your price from `rebirthCost(lvl)`), and what's kept and what resets. Choosing asks twice when it costs gold. Sends
  `{t:'rebirth', cls}`; the server's answer closes it.
- `{t:'reborn'}` for everyone in the room: a splash out of the pool and a sound.
- Elder Mochi's persona (`server/characters.js`) learns the pool: he tends it, knows what it does and costs,
  points newcomers at it; nothing beyond canon Tier 0. The new-player flow (where Mochi greets them) mentions
  it once.
- The migration banner and the Lv 10 banner (from S2.1) point at the pool; Mochi brings it up with any
  Lv 10+ Novice who chats to him.

## S2.4: the CLASSES table in `npm run economy`
Docs: `docs/economy.md`, `story/progression.md` 1b. Files: `scripts/economy.mjs`, `docs/economy.md`.
- For each class and branch at Lv 10, 30, 60, 100, 150, 200: a sensible build (a `BUILDS` constant: skill
  priority per branch, spent with `spTotal`; AP into the main stat, a share into LUK), gear on the frozen
  curve (a staff's MAGIC on the sword curve, as S1 did), `statsFor` for the numbers.
- Single-target damage a second from a 60 s rotation sim (cooldowns, MP budget with regen, normal attacks
  in between), crowd damage a second (5 mobs), toughness (HP with DEF as `hurt()` applies it, plus lifesteal
  and Mana Shield), and the time to solo each den at the den's level.
- Checks under `--check`: each class's solo time per den within `CLASS_FIT` of the median; each class's
  "bad at" (progression.md 1b) really is its lowest column. Tune skill numbers until green, and say what
  moved.

## S2.5: Warrior chase moves (in `step()`)
Docs: `docs/netcode.md` (all of it), `docs/combat/skills.md`, `docs/combat/core.md`, `docs/ui/mobile.md`.
Files: `src/shared/sim.js`, `src/shared/wire.js`, `src/net.js`, `src/main.js`, `src/rpg.js`, `server/rpg.js`,
`server/index.js`, `src/shared/skills.js`.
- New input bit `ATTACK = 128` (`KEY_MASK` 255): set on the step an attack is pressed (X, click, the touch
  attack). The press still sends its normal slap/hits as today.
- `state.mw`: a second ranks byte for Charge, Leap Slam, Upward Cut (2 bits each), set by the server like
  `mv`. New state for their cooldowns and the slam (`sc`, `uc` ticks, a charge window `cw`, a slamming flag)
  through `pack`/`unpack` and **wire version 4** (`BIN_VERSION`, `BYTES_OF`; old tabs keep v3).
- **Leap Slam:** in the air, Down + Attack: straight down fast; on landing the client sends the hits around
  the landing point as a skill (`{t:'skill', skill:'leap_slam', s, hits}`), the server caps them.
- **Upward Cut:** Attack while holding Jump and still rising: an extra upward burst plus a hit on mobs above.
- **Charge:** a hit landed during or just after a Dash makes that hit stronger and resets most of Dash's
  cooldown. Only the client knows it connected (hits are client-decided), so generalise `applyKick` into a
  predicted state edit at that input (`{dc}`); the server applies the same edit when it runs the slap at
  that `s`. Both sides must match exactly: test reconciliation with lag.
- **Momentum:** a server buff, stacking on each chase-move hit, gone when you stop moving; in `statsFor` and
  `me`.
- Phones: only the buttons that exist (direction, Jump, Attack, Dash), a forgiving window. Controls page
  (`CONTROLS` in main.js) and `docs/ui/hints.md` updated.
- Test: prediction with 150 ms of fake lag shows no snapping; desktop and touch.

## S2.6: Mage combos and Arcane Charge
Docs: `docs/combat/skills.md`, `docs/combat/core.md`, `docs/combat/stages.md`, `docs/combat/bosses.md`,
`docs/art.md`, `docs/performance.md`. Files: `server/rpg.js`, `src/rpg.js`, `src/skillfx.js`, mob drawing,
`src/shared/wire.js` (mob flags), `src/shared/skills.js`.
- Mob states, server-owned (`chillUntil`, `frozenUntil`, `burn` {until, dps, by}), sent in the mob flags
  byte (check which bits are free) and drawn on the mob (an ice crust, small flames), so friends can read a
  good mage.
- Frost spells (Frost Nova, Glacial Spike, Absolute Zero) **chill**; a second frost spell on a chilled mob
  **freezes** it (an ordinary mob stops; a boss is only slowed, a short `FREEZE_BOSS` time).
- A fire spell (Fireball, Meteor, Starfall) on a frozen mob **shatters** it: `SHATTER_MULT` damage, the freeze
  ends. Fire **burns** (damage over time ticked by the server, counted for the caster on the damage meter).
  Chain Lightning on a burning mob **spreads** the burn to mobs near it.
- The client predicts its own combo damage (it decides its hits); the server's cap reads the mob's state, so
  a shatter isn't refused.
- **Arcane Charge** (passive): each staff bolt that hits stores a charge (up to a max), the next spell spends
  them all for extra damage each; shown on the HUD by the MP bar.
- The interrupt (freezing a boss during `ULT_WARN` cancels its ultimate) waits for S5; note it in
  `docs/ideas.md`.
