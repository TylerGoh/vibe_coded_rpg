# Classes, skills, MP, the hotbar, Mobility and ability points

Files: `src/shared/skills.js` (all rules, `CLASSES`, `statsFor`), `src/skilltree.js` (the K panel),
`src/skillfx.js` (icons and effects), `src/elements.js` (the Mage's combo states drawn on mobs, Hunter's Mark
and a net on a caught mob), `src/status.js` (the status box, below), `server/summons.js` and `src/summons.js` (the Cleric's
summons, its halo, the Mage's staff sparkle, the Archer's Net Trap, SP1's new summons), `src/fields.js` (SP1's fields),
the hotbar and stats UI in `src/rpg.js`, server actions in the `skills()` and `rebirth()` handlers of `server/rpg.js`.

**The design is `story/progression.md`: read it before changing classes, skills, AP or the point
schedule.** All four classes are built: S2 (2026-10-23, in six pieces, plan archived in
`story/archive/s2-plan.md`: the data and server, the K panel, the Rebirth Pool, the CLASSES tables in
`docs/economy.md`, the Warrior's chase moves, the Mage's combos), the Cleric (S3) and the Archer (S4), each
with its section below. Next for classes: the bigger skill pool (`story/skills-plan.md`: new skills at every advancement, long buffs, casting from the K panel). Its machinery and the K panel's Cast button are built (SP1, below); SP2–SP5 add the class skills on top. Before that: S5's party mechanics (`story/s5-plan.md`; each class's answers are in
`docs/combat/bosses.md`, "Every class's answers").

## Classes (S2)
- `CLASSES`: `novice`, `warrior` (sword, STR), `mage` (staff, INT), `cleric` (staff, INT; S3), `archer` (bow,
  DEX; S4), each with its weapon kind, starter weapon, colour, blurb, strong / bad at text (for the pool's card)
  and two `branches` (Knight / Berserker, Elementalist / Frostbinder, Priest / Warden, Sniper / Trapper).
  `classNames()` words the list ("Warrior, Mage, Cleric or Archer") for the banners and notices, and `aOrAn`
  the article ("an Archer"), so a new class needs no text hunt. Saved on the character as `c.cls`, plus `c.reborn` (how many times a class
  was chosen; 0 = the next choice is free).
- **Everyone starts as a Novice** (owner, 2026-10-23): the Novice tree, any weapon. **From `CLASS_LVL` you
  choose a class at the Rebirth Pool** in Slimeville (`REBIRTH_X`, `REBIRTH_RANGE` in sim.js; between
  the Inn and Pip's stall, `docs/world.md`). `{t:'rebirth', cls}` → `rebirth()`: near the pool, Lv 10+, a
  different class, never back to Novice; the first choice is free, every change after costs
  `rebirthCost(lvl)` (an hour of farming gold at your level, `docs/economy.md`). Level, EXP, gold, bag,
  gear and house stay; skill points and AP all come back, the skill hotbars of both setups empty, buffs
  end. Everyone in the room gets `{t:'reborn'}`: a jet of water out of the pool, droplets and sparkles in the
  new class's colour round the slime, its class name, and the `reborn` sound (`poolSplash`, `src/rebirth.js`).
- **Weapon lock:** a class only wields its own kind (`weaponOk`; equip is refused on both sides). On
  choosing a class, a wrong weapon in hand goes back to the bag and the strongest right one from the bag
  takes its place; with none, you get the class's starter (`wood_sword` / `wood_staff` / `wood_bow`). A wrong weapon with
  a full bag refuses the change ("make room first"). Unarmed still slaps.
- **The migration** (one time, in `load()`): a saved character with no `cls` becomes a Novice with every
  skill point and AP refunded and both skill hotbars cleared (potion bars kept), `reborn` 0, and a one-time
  `notice` with `news: 'classes'` (a banner, below; the chat line stays). A
  character that is also due the L3 rollback gets both notices, one per line.
- Healing: Jelly Heal left with the old Magic tree and came back as a Cleric skill (S3, the same `heal` id
  and icon).
- **The pool's card** (`PoolCard` in `src/rebirth.js`, `#pool` in `index.html`; E at the pool, or the E button
  on touch): below `CLASS_LVL` only "Come back at Lv 10" and what the classes are; from it, every class in
  `CLASSES` side by side (never the Novice, and no teasing of classes not built yet; the card is nearly the
  canvas's width since there are four) with strong / bad at, your own one
  marked, the price ("Free: your first choice" while `reborn` is 0, else `rebirthCost(lvl)`; the button says
  "Not enough gold" when short), and what's kept and what resets. Choosing asks once when free, twice when it
  costs gold, then sends `{t:'rebirth', cls}`; `reborn` for you closes it, a toast while it waits shows in
  it as the refusal (`rpg.onToast`). Esc steps back out of the question, E closes. Hidden HUD buttons and the
  touch pad while it's open; on phones it fills the canvas height with 44 px buttons.
- **The news banner** (`NewsBanner`, `newsFor`, `#news`): the classes notice and every advancement message
  (`{t:'advance'}`) show as a banner along the top instead of a toast (the chat line stays). The Lv 10 one for
  a Novice and the classes one point at the pool and stay until "Got it"; the others go after a while. It
  sits lower in combat rooms, under the HP panel.
- **Elder Mochi** tends the pool (`server/characters.js`): he hears each speaker's level and class, points
  Lv 10+ Novices at it, and mentions it once to someone he's never talked to (`docs/social/ai-characters.md`).

## Skill trees
- `TREES`: the Novice tree, one per class (four since S4), and Mobility (`wind`). Every skill in `SKILLS` has `cls`
  (`novice`, a class, or `any` for Mobility), `tree`, `adv` (the level it opens at) and, past the basics,
  a `branch`.
- **Descriptions never say "px"** (owner, 2026-10-24): distances are bare numbers for players to compare,
  "(range 240)" for how far a shot reaches, "within range 100" for an area. Same on item cards (`docs/combat/items.md`).
- **Novice tree** (kept forever, weak once you have a class): Slime Bash, Pebble Toss (on the better of
  ATK and MAGIC, `stat: 'best'`, so a staff Novice isn't stuck), Jelly Patch (heals only you). Nine points.
- **Warrior**: basics at Lv 10 (Power Strike, Cleave, Iron Jelly, Jelly Thirst: hits heal you a share of
  their damage, the Warrior's solo answer); **Knight** (Jelly Bubble, Vitality, Rally, Second Wind, then
  Sanctuary, Aegis; Rally also taunts, S5: every mob in its range turns on the Knight for `TAUNT_S` and a boss's
  focus moves to them, `docs/combat/bosses.md`; owner, 2026-10-24: folded into Rally instead of a new Taunt
  skill, so the Knight's point budget didn't move); **Berserker** (Whirlwind, Berserk, then Sword Mastery, Blade Storm, Sky Splitter).
  SP2 filled the Warrior's pool (below, "The Warrior's skill pool"): War Cry and Hook in the basics; the Knight's
  Ground Shake, Shield Bash, Shockwave, Holy Lance, Retribution, Judgement, Guardian's Oath, Unbroken; the Berserker's
  Rending Slash, Bloodlust, Execution, Frenzy, Cyclone, Rampage.
  SP6 (the balance pass): Sword Mastery also gives `SWORD_MASTERY_ATK` attack a rank with a sword (`statsFor`), the
  Warrior's Steady Hands, so the Warrior sits ~0.94× the others' single-target damage from Lv 60 (was ~0.7×). Any
  Warrior can learn it (no fork), so the Knight gets it too.
  Against a boss's armour (S5.2) heavy hits crack it: any hit whose multiplier reaches `ARMOUR_CRACK` (Power
  Strike, Sky Splitter, and SP2's Shield Bash, Holy Lance, Judgement from rank 2) and Blade Storm and Execution
  (`crack: true`); `hitKinds` decides.
- **Mage**: basics at Lv 10 (Magic Bolt, Mana Flow, Arcane Mind (opens at Lv 15: with two points a level a Lv 12 Mage
  holding it soloed the Bramble Behemoth too fast for `CLASS_FIT`), Mana Shield: a toggle (owner,
  2026-10-24; it was a 60 s buff): while it's on, a share of the damage you take comes off MP instead. Cast
  it again to turn it off; it costs no MP, `toggle` on the skill, `c.shield` on the saved character (so it
  survives a relog or a deploy; a rebirth or Reset all turns it off), and its hotbar slot glows blue while on; Arcane Charge, below); **Elementalist** (Fireball: a bolt that bursts where it lands; then
  Meteor, Kindling: fire spells (`fire` on the skill) hit harder; then Starfall); **Frostbinder** (Frost
  Nova, Chain Lightning, then Glacial Spike: a long bolt that slows hard, then Absolute Zero).
- Skills whose old max was 5 and now 3 (Power Strike, Cleave, Iron Jelly, Magic Bolt, Mana Flow, Arcane
  Mind) had their per-rank numbers raised so the max rank is worth what the old max was. S2.4's CLASSES
  tables then tuned (`docs/economy.md`): Slime Bash and Pebble Toss cool down slowly, so they stay a small
  extra once you have a class instead of a third of your damage; Jelly Thirst heals "a little" (it used to
  out-heal any boss); Power Strike and Cleave hit harder; Rally (it buffs you too) is the Knight's damage
  when alone, so it's stronger and up two thirds of the time. Any skill number change: re-run
  `npm run economy` and keep it green.
- **Advancements gate by level, not points**: a skill can be learned from its `adv` (Novice 1; class 10,
  30, 60, 100; Mobility: Dash and Flash Jump 10, Blink 30, Phantom Step 60). Reaching one sends
  `{t:'advance', lvl, text}` (`ADVANCEMENTS`, `advanceText`): a toast and a chat line for now.
- **No fork any more** (owner, 2026-10-24: "forget about branch locking ... the limiting factor will be their
  hotbar slots"): both branches can be learned at once; the branches are only how the tree is laid out. What
  you bring to a fight is what fits on the hotbar (`HOTBAR`, and its two setups). Before that, points sat in
  one branch at a time ("Take your Knight
  points back first", free). Basics and Mobility have no branch.
- **Points, two counts** so the Novice tree can't eat class points: `spNovice` (one a level to
  `SP_NOVICE_LVL`) and `spClass(c)`: `SP_PER_LVL` a level from `CLASS_LVL` (owner, 2026-10-24: "2 points per
  level"; it was one every three), never more than `spRoom(c)`, the ranks of every class skill and Mobility
  skill your level has opened, so points never pile up past what you can spend. In practice you can hold
  everything that's open soon after each advancement. Mobility takes class points, so a Novice can't learn
  it; a Novice's class points pile up unspent (no cap until it has a class). `me.sp` is what you can spend now
  (`spFree`), `me.spLeft` both counts.
- `cantLearn(c, id)` / `cantUnlearn(c, id)` take the character (`{lvl, cls, skills}`), not its parts;
  `cleanSkills(c)` is what `load()` keeps (the class's skills, opened by the level, adding up;
  otherwise every point back).
- **The K panel** (K / the Skills button, `src/skilltree.js`) is a node tree in three tabs: **Novice**,
  **your class** and **Mobility**. The class tab shows the basics on top, then the two branches as columns
  (branch names and blurbs from `CLASSES[cls].branches`), a row per advancement past the basics (from
  `ADVANCEMENTS`), nodes joined by lines (CSS lines: a spine per column, a line through each row, an arch
  where the basics split). A branch with points in it is bright (`held`); nothing is dimmed or locked. A node is the round skill icon (`drawSkillIcon`, cropped to a circle) with a
  `2/3` rank badge, a small + when a point can go in, a gold ring when maxed. Rows the level hasn't opened
  are greyed and labelled "opens at Lv 60".
- **A Novice** sees a "Classes" tab instead: "Choose a class at Lv 10 at the Rebirth Pool" with a switch
  between the classes, each class's whole tree greyed so they can look ahead (cards still open, and say "Choose
  Warrior at the Rebirth Pool…"). From `CLASS_LVL` a pink reminder under the header says the class points
  are piling up and to visit the Rebirth Pool by Elder Mochi. Mobility is greyed for a Novice too.
- Clicking a node opens its **card under the tree**: name, rank, branch, level, MP / cooldown (or passive),
  what it does now and at the next rank, and why it can't take a point (`cantLearn`, worded by the panel
  for a Novice's look-ahead), with + / − / Hotbar (`startAssign`; "Key 3" once it's there) / **Cast** (below). The header
  shows the points left (`me.spLeft`: Novice and class; the tabs carry a badge with what's spendable there),
  MP, and the next advancement. "Reset all" stays.
- + learn, − take a point back (always allowed now: no skill needs another), "Reset all" refunds
  everything for free. The panel predicts: `change()` sets `me.skills`, `sp` and `spLeft` at once and the
  server's `me` confirms (`learn`, `unlearn`, `respec`). Every `me` re-renders the panel (it keeps the tab,
  the open card and the scroll; icons are cached canvases). **The owner wants nobody stuck in a build**:
  every allocation (skills and stats) must stay reversible for free; only the class itself costs gold to
  change.
- **Cast from the K panel** (SP1; owner, 2026-10-24: "let them cast directly from skills"): the card of every active
  skill you hold has a Cast button, and on desktop a double-click on its node casts it too (`cast()` in
  `src/skilltree.js` → `castSkill` in `src/main.js`, the hotbar key's own path: the server never checks the hotbar,
  so MP, cooldowns and every refusal are unchanged). Outside combat rooms it's greyed, "Only in combat areas". The
  panel stays open (cast three buffs in a row) and each node shows its cooldown sweep (`tick()`, every frame while
  open: `--cd` on the icon). The hotbar hides while the panel is open (it sat over the card). The point: long buffs
  live in the tree, so the bar can be all attacks; the owner wants players to work out their own setup.
- **More nodes per row** (SP1): a branch column holds `PER_ROW.branch` (5) nodes to a line, a full-width row
  `PER_ROW.wide` (10); more wrap onto a line of their own (each with its own connecting line). Node widths are
  sized so 5 fit a branch column on desktop and at 667×375 on a phone (icons still 44 px there).
- Phones (`body.touch`): bigger nodes (at least 44 px on screen at 667×375), big + / − / Hotbar / Cast buttons (44 px),
  and the card sits in the panel's scroll after the tree (tapping a node scrolls it into view); on desktop
  the tree scrolls and the card stays pinned under it. The HUD buttons (`#hudbtns`) hide while the panel is
  open, since they'd sit on its title.
- MP: `maxMpFor`; active skills cost MP and have cooldowns (`cooldownOf`; the server allows slack for lag).
  Skills only work in combat rooms. Buffs live on the server player (`*Until`) and feed `statsFor`.

## Gifts (one player's own skill)
- A skill with `gift: ['<account>', …]` (`cls`/`tree` `'gift'`) belongs to those accounts alone: `load()` in
  server/rpg.js grants it (rank 1) and strips it from anyone else. It can't be learned or taken back
  (`cantLearn` / `cantUnlearn`), costs no points (`poolOf` → `'gift'`), and survives Reset all, a rebirth and
  the rollback (`giftsOf`). The K panel shows it in the Novice tab under "A gift from the gods".
- **Challenge the Gods** (`challenge_gods`, chenyirong's and justin's; an owner easter egg, 2026-10-23): for
  `GODS_DUR` s their max HP is 1 (`statsFor` with `buffs.gods`, so every heal, potion and regen is capped by the usual
  `maxHp` clamps) and ATK / MAGIC are ×(1 + `GODS_BOOST`), which the hit caps follow too. Surviving it,
  the server's tick (`godsEnd`) heals them to full; fainting ends it with no heal. Cooldown `GODS_CD`. They
  glow white while it's up (`drawGodsAura`; owner asked for white). With it came a one-time reset
  (`GODS_RESET`, the `gods` flag on the save, 2 = done): Lv 1, every item gone (a new character's starter bag),
  gold gone unless `keepGold` (justin keeps his), home to Slimeville (`p.goHome`: skips the spot restored
  after a restart), and the gods' notice. chenyirong first had an earlier step (`gods` 1) that only reset his
  level; the owner then tested on his account, hence the full one.

## The Warrior's chase moves (S2.5) run in the physics too
`story/progression.md` 1c: the Warrior's skill is getting there and staying there, many short moves toward
the target, each its own press. Four Lv 10 basics (`kind: 'chase'`, `how` says the input), **no MP and no
hotbar** (`ACTIVE` leaves them out): they move you, so they live in sim.js `step()`, which can't know MP;
only cooldowns, in the physics state.
- **The Attack bit** (`ATTACK`, input bit 128; `KEY_MASK` is 255): set for a few steps whenever an attack
  goes off (X, click, tap, Hit: `slapToward` in main.js). The press still sends its normal slap as before.
  The ranks reach the physics as `state.mw` (`chaseOf`, set by the server's `moves()` with `mv`).
- **Leap Slam**: in the air, Attack within `SLAM_GRACE` ticks of holding Down: straight down at `SLAM_V`
  (`state.sl`, no steering, no Dash / Blink / Flash Jump meanwhile), and where it lands the client sends the
  hits around it (`rpg.chase` → `{t:'skill', skill:'leap_slam', s, hits}`). Cooldown `SLAM_CD` (`sc`).
- **Upward Cut**: Attack while still rising, within `UPCUT_GRACE` ticks of holding Jump: an upward burst of
  `UPCUT_V`, and a hit on every mob in a column up to `reach` px above (`rpg.above`). Cooldown `UPCUT_CD`
  (`uc`). For mobs on a ledge: it doesn't count as range in the economy sheet.
- **The grace windows are for phones** (owner: phones only get the buttons they have): Jump, ▼ and Hit are
  all under the right thumb, so "hold Down and attack" is really "tap ▼, then Hit soon after". `uw` / `lw`
  in the state count the ticks since Jump / Down were held.
- **Charge**: a slap that connects while dashing or within `CHARGE_WINDOW` ticks after (`cw`; `chargeOpen`)
  hits for the skill's `mult`, stops the dash at walking speed, and gives back `CHARGE_RESET` of Dash's
  cooldown (`applyCharge`). Only the client knows its slap connected (hits are client-decided), so this is a
  predicted state edit: `net.charge(seq)` applies it at the slap's input and on every replay, and the server
  makes the same call from its own state when it runs that slap (`attack()` in server/rpg.js), raising the
  cap to match. The slap echo carries `charge` for everyone's effect. Needs Dash.
- **Momentum** (passive): each Charge, Leap Slam or Upward Cut that lands adds a stack (`MOMENTUM_MAX`), +`per`
  ATK each, in `statsFor` (`buffs.momentum`) so the caps follow. Stacks last `MOMENTUM_DUR` s from the last
  one and all go after `MOMENTUM_STILL` s standing still (the server's tick). Shown in the status box with
  its stacks (it used to be pips right of the HP panel); `me.momentum`.
- The server only takes a slam's or a cut's hits if its own physics landed that slam / fired that cut near
  that input (`p.chaseAt`, noted in index.js's input loop; `CHASE_SLACK`), and only once.
- Effects for anyone come from state changes (main.js `moveFx`: `sl`, `uc`), like Dash's; the E-hint list
  shows "Charge", "↓+X Leap Slam" and "Upward Cut" while each is possible (`docs/ui/hints.md`).
- **Hook** (SP2, the fifth): Down (held, or within `SLAM_GRACE` ticks: "▼ then Dash" on touch) + Dash, needs Dash
  and its own cooldown `HOOK_CD` (`hc`). `step()` throws the chain: a level yank at `HOOK_V` for up to `HOOK_TICKS`
  (`hk`; a Dash doesn't go off with it). The physics can't see mobs, so the step it fires `net.tick` asks
  `rpg.hook` (main.js `onHook`), which finds the first mob ahead on your level within `HOOK_RANGE`, works out the
  ticks left to reach it (0: nothing there, the chain comes back and you stay) and both sides cut the yank there
  (`applyHook`, a predicted edit like Charge's: `docs/netcode.md`). The message always goes, in any room, so the
  server's physics stay in step; in a combat room it also carries the landing's hit (capped by `chase()`, which
  checks `p.chaseAt.hook`). It only ever shortens the yank, so a lying client gets no more than a Dash-like move.
  Knockback 0, so the mob stays where you land. A Hook that lands adds Momentum. Drawn as a chain (`hook` fx) for
  everyone; the E-hint list shows "↓+Shift Hook" when a mob is ahead out of reach. **On a platform, ▼ drops you
  through first** (the drop isn't held back for it), so Hook from a platform yanks you along just under it: a
  known quirk, not worth another button (owner: phones only have the buttons they have).

## The Mage's combos and Arcane Charge (S2.6)
`story/progression.md` 3: the Mage's skill is the order you cast in, and friends can see it on the mobs.
Rules and numbers in `src/shared/skills.js` (`CHILL_S` and the constants after it); the state lives on the
server's mob (`chillUntil`, `frozenUntil`, `burn`), set in `element()` from `applyHits` in `server/rpg.js`.
- **Elements**: `el` on the skill. Frost (Frost Nova, Glacial Spike, Absolute Zero) **chills** for `CHILL_S`
  (slowed like `slow`); frost on a chilled mob **freezes** it: an ordinary mob stops dead for `FREEZE_S` (no
  AI, no walking, its touch harmless on both sides), a den or field boss is only slowed to
  `FROZEN_BOSS_SLOW` for `FREEZE_BOSS`. Frost on a frozen mob does nothing (no refresh: nothing stays frozen).
- Fire (Fireball, Meteor, Starfall) on a frozen mob **shatters** it: `SHATTER_MULT` damage and the freeze
  ends. The client decides it like any hit (`v.frozen` on its screen) and marks that hit (`[id, dmg, crit,
  1]`); the server's cap allows `SHATTER_MULT` only if the mob is frozen there too (or thawed less than
  `SHATTER_GRACE_MS` ago), else the hit is capped as a plain one. The echo marks a shattered hit
  (`[id, dmg, crit, killed, 1]`) so friends see the shards and "SHATTER!".
- Fire also **burns**: `BURN_DPS` of the hit's damage a second for `BURN_S` (a new burn keeps the stronger
  dps), ticked by the server every `BURN_TICK_MS` through `damage()` as the caster's hit, so it counts on
  the damage meter and for EXP; it ends early if the caster leaves the room. Everyone in the room gets
  `{t:'burn', h}` (small orange numbers).
- Storm (Chain Lightning) on a burning mob **spreads** the burn to every mob within `BURN_SPREAD` px that
  isn't burning harder, as the spreader's burn.
- **Fire and frost are on opposite branches**, so a shatter (and a spread) takes an Elementalist and a
  Frostbinder together: a party combo by design (2026-10-23, S2.6's call; progression.md lists the combos
  without saying who casts them). Alone, a Frostbinder freezes (control; from Lv 30 with Frost Bolt, SP3; Static makes it instant on a charged mob) and an Elementalist burns.
- Shown on the mob for everyone (`drawMobState`, `src/elements.js`): frost at the feet and drifting flakes
  (chilled), a see-through crust of ice with a glint and icicles (frozen), small flames and sparks
  (burning). Wire: mob flags 256 / 512 / 1024 (`docs/netcode.md`). The client predicts its own spell's
  effect for half a second (`predictEl`: `chillLocal`, `frozenLocal`, `thawLocal`, `burnLocal`) until the
  server's flags arrive.
- **Arcane Charge** (`arcane_charge`, passive, Mage basics): each staff bolt that hits stores a charge (up to
  `ARCANE_MAX`, gone `ARCANE_DUR` s after the last); the next Mage damage spell (`spendsArcane`: Magic Bolt
  too) spends them all for +`per` each (`arcaneMult`). Both sides count: the client in `staffBolt` /
  `cast` (its prediction, `charges()`), the server in `attack()` / `cast()` (`p.arcane`, which sets the
  cap; `me.arcane`; fainting clears it). The echo carries `arcane` (an "ARCANE xN" pop over the caster).
  The status box shows its icon with the charges stored (it used to be diamonds in the MP bar's right end).
- **The interrupt** (S5.2; owner, 2026-10-24): a freeze landing on a boss while its ultimate is still warning
  cancels the ultimate outright and staggers the boss (`interruptUlt` in `server/rpg.js`, called from
  `element()`). It's the `interrupt` party mechanic, so it needs the boss to list it (`docs/combat/bosses.md`).
  Pyra's Rebirth is left alone (breaking her egg is its own answer). Not built: the masteries (Permafrost,
  Wildfire) are S6's.

## The Cleric (S3)
`story/progression.md` 1b and 5: the other staff class. It solos on sustain ("takes longer, never loses"),
and in a party its heals, shields and summons matter more than its damage. Rules and numbers in
`src/shared/skills.js` (`HOLY_BOLT_MULT` and the constants after it).
- **Looks**: a soft golden halo over its head (`drawHalo`, `src/summons.js`, drawn in `Slime.draw` from
  `cls`) so friends tell it from a Mage at a glance; a Mage's staff gets a faint sparkle on its back
  (`drawStaffSparkle`). Both everywhere, not just in combat rooms.
- **The holy bolt** is its normal attack: a staff bolt with the Mage's range (`statsFor` gives a Cleric with a
  staff `holyBolt` and the same `boltRange`), `HOLY_BOLT_MULT` of MAGIC, and `HOLY_BOLT_HEAL` of the damage
  heals the hurt friend nearest it within `HOLY_BOLT_HEAL_R` (itself when nobody else is hurt), so attacking is
  never wasted (`holyBolt` in `server/rpg.js`; `staffBolt` / `otherBolt` in `src/rpg.js` pick the `holybolt`
  fx by class: a spinning golden star with a sparkle trail, a ring, rays and a rising shower of stars on a
  hit). It stores no Arcane Charge (a Mage skill). **Ranged on purpose** (owner, 2026-10-24): the magic
  classes' power is their spells; the normal attack is only for weaving between them, and it used to be a
  close staff bonk with one tiny star, which felt bad and was hard to see.
- **Heals scale with MAGIC**: `healOf` (`power(rank)` × MAGIC × `heal`, Holy Power's multiplier; Jelly Patch
  keeps its flat `amount`). Every heal goes through `healFrom` on the server: capped at max HP, a green +HP
  for the room (`thirst`), and counted on the damage meter.
- **Basics (Lv 10)**: Smite (a `holy` bolt: it heals its caster `smite(rank)` of the damage; Holy Power makes
  its light stronger too), Jelly Heal (you and friends within its radius), Jelly Spirit (below), Faith
  (+MAGIC, like Arcane Mind).
- **Priest**: Mend (a heal every second for its `dur`, `q.mend`, ticked by the server; it ends if the
  caster leaves the room), the Lantern Wisp (below), Revive, Holy Power, then Miracle (heals everyone near
  and gets every knocked-out friend there up at full HP).
- **Warden**: the Guardian Totem (below), Barrier (you and friends near: `q.barrier` soaks up to its amount
  for its `dur`, before Mana Shield; **a boss ultimate breaks it instead of knocking you out**, the "shield
  before the big hit" moment; guards `'soak'` and `'barrier'`), Spirit Bond (summons' HP and damage; two
  Jelly Spirits from `BOND_TWO`), then the Seraph.
- **Revive**: a slime knocked out in a combat room stays down until its player chooses to wake up in town
  (`{t:'faint', down}`; `docs/combat/core.md`, Fainting), Cleric or no Cleric. (It used to wait only when a
  Cleric with Revive ready was in the room, and only a few seconds; the owner made staying down the default
  so players learn to wait for one.) Revive gets every
  knocked-out slime within its radius up where it fell with `share(rank)` of its HP and no EXP lost; the
  client won't cast it with nobody down (`rpg.downNear`, from main.js's splats), and neither will the
  server. The skill echo's `revived` clears their puddles (`rpg.onRevived` → `unsplat`).
- **Cleanse** (S5.2; owner, 2026-10-24: one rank, in the shared trunk at Lv 10 so Priests and Wardens both have
  it): `kind: 'cleanse'` lifts every curse stack off the nearest cursed friend within its radius, or off you if
  nobody else is cursed, and heals them a little (`healOf`). Both sides refuse it, before any MP or cooldown, when
  nobody in reach is cursed ("Nothing to cleanse"; `cleanseTarget` in `server/rpg.js` and `src/rpg.js`, the client
  from the room's curses in `Party`). Curses are a boss's party mechanic (`docs/combat/bosses.md`). Its point
  costs the Cleric builds a little damage on the economy sheet.

### Summons (`server/summons.js`, drawn by `src/summons.js`)
- Server-run like mobs, a `summon` kind skill with `what`: **spirit** (Jelly Spirit), **wisp** (Lantern Wisp),
  **totem** (Guardian Totem), **seraph** (the Seraph). HP from the caster's max HP (`summonHp`: `life(rank)`
  and Spirit Bond), hits from MAGIC (`summonHit`). One of each at a time (two spirits with Spirit Bond 3+); a
  new one replaces the oldest. They go when their time runs out, their HP does, or their Cleric leaves the
  room, logs off or changes class.
- **Spirits and the Seraph** float to the nearest mob within `SPIRIT_SEEK` (the one after their Cleric
  first), hit it every `SPIRIT_HIT_S` (the Seraph: every mob within `SERAPH_R`) through `damage()` as their
  Cleric's hit (the meter, EXP and loot count it), and **draw attention**: a mob they hit, and every mob
  within `SPIRIT_TAUNT` that's after a slime (the Seraph: every mob within `SERAPH_TAUNT`), goes after them.
  That's the Cleric's solo answer: a boss chasing the spirit aims its moves at the spirit, not the Cleric.
  The trick that makes it cheap: a summon carries the same fields a player does for the mob code
  (`state.x/y/room/facing`, `joined`, `faintUntil`), so `m.target` can be one and nothing else changed.
- **Getting worn down** (server-decided, since only clients judge hits on slimes): a mob touching a spirit or
  totem hits it for `SUMMON_TOUCH` of its ATK every `SUMMON_HURT_S`; a den or field boss within
  `BOSS_SUMMON_REACH` hits it for `BOSS_SUMMON_HIT` every `BOSS_SUMMON_S`; an ultimate going off takes
  `ULT_SUMMON` of every one's max HP. Frozen mobs don't hurt them.
- **The wisp** floats by whichever friend near its Cleric is hurt worst (or the Cleric) and heals everyone
  within `WISP_R` every `WISP_TICK`; nothing can hit it.
- **The totem** stands where it was planted; `hurt()` cuts the damage of slimes within its radius by
  `cut(rank)` (`cutAt`), not an ultimate's.
- **Wire**: `{t:'summons', s: [[id, what, owner, x, y, hp, maxHp, dir]]}` about 20 times a second to rooms
  with summons (one empty list when the last goes; `what` indexes `SUMMON_WHATS`), `{t:'sumhit', h:
  [[summonId, hits]]}` (shown like anyone's hits), `{t:'sumhurt', id, dmg}`, `{t:'sumgone', id, how:
  'faded'|'broke', x, y}`. The client glides each to its newest spot. Art: a see-through mint slime ghost
  with a wispy tail, a paper lantern with a face, a three-block carved post with a green gem and a dashed
  ring on the ground, a big winged ghost with a halo.
- **SP1's kinds** (`SUMMON_KINDS`: `hurt`, `planted`, `fly`; ids 5–9 of `SUMMON_WHATS`): the **phoenix** and the
  **hawk** circle over their caster and dive (`flier`: there in `DIVE_MS`, the hit on arrival, then back; never a
  mob target, never hurt); the phoenix picks the nearest mob within `PHOENIX_SEEK` and its `el` applies (fire
  burns), the hawk what its caster last hit (`p.lastHit`, set in `damage()` by the caster's own hits) within
  `HAWK_RANGE`, else the nearest ahead. **Sprites** are spirits, `count` at once (`summonCap`), each after a mob its
  siblings aren't. The **stone guardian** (`guardian`) walks to the mob in front, taunts everything within its
  radius every `GUARDIAN_TAUNT_S` (not a boss held by a focus or a Knight's taunt) and slams what's in front every
  `every`; it's worn down like a spirit. The **blast trap** (`blast`) is set like a net; the first mob over it sets
  it off on everything within its radius (`sumgone` with `how: 'boom'`). Every summon's hit is `summonHit`: MAGIC,
  or the skill's `stat`. Art (`src/summons.js`) is a first look for SP2–SP5 to polish: a golden firebird with flame wings, a
  plumed crest and a streaming tail of tongues and embers (SP3's polish), a red-brown hawk with a barred cream breast, a dark cap and fingered wingtips that beat up and down and fold back in a dive (SP5's polish), sky-blue small spirits with petal wings, a star
  on a curly antenna and a sparkle trail (SP4's polish), a mossy block golem with a glowing golden rune on its chest, a flower in its
  moss, eyes that brighten as it winds up and a dust ring when it slams (SP4's polish), a clay pot in a ring of stakes with a
  burst rune that pulses faster the longer it waits and a fuse with a crawling spark, going off with a flash, fire, smoke and
  shards (SP5's polish of the blast trap).
- **The damage meter** shows healing done and damage taken under the damage (`docs/combat/bosses.md`).

## The Archer (S4)
`story/progression.md` 1b and 4: the bow class. Strong at steady single-target damage from range and at
staying on the move; bad at crowds and at anything up close (it solos by keeping its distance, kiting, and
netting whatever chases it). Rules and numbers in `src/shared/skills.js` (`KEEN_RANGE` and the constants after
it); bows in `docs/combat/items.md`.
- **Looks**: the bow on its back (and the draw-and-loose pose when it shoots) is what tells friends it's an
  Archer; no halo or sparkle (`drawBowOnBack` / `drawBowShoot` in `src/slime.js`). The bow is held out
  from where a slap starts (below the eyes; owner: it used to shoot from the eye), and the arrow leaves
  from its grip (`bowShot` in `src/rpg.js`), so move both together.
- **The bow shot** is its normal attack (any bow holder's, a Novice's too): an arrow to the first mob ahead
  within `arrowRange` (`statsFor`: `BOW_RANGE` + the bow's reach + Keen Eye), `BOW_SHOT_MULT` of ATK, flying at
  `BOW_SHOT_SPEED` (`bowShot` / `otherArrow` in `src/rpg.js`; `shoot` in `server/rpg.js`).
- **Hold to keep firing** (owner, 2026-10-25: attack speed is a core Archer feature, so you hold instead of spamming):
  holding X or the touch Hit button attacks again every `SLAP_COOLDOWN_MS` (`attackHeld` in `src/main.js`; the Hit
  button is a held one in `src/touch.js`). It's every weapon's, not only the bow's (simpler, and harmless: holding X
  already repeated with the keyboard's own repeat), in combat rooms only. Each one is an ordinary `slap` from
  `slapToward`, so the server's own swing check, Retreat Shot's backward aim and the Charge all work unchanged and
  nothing about movement leaves `step()`. A key repeat (`e.repeat`) no longer fires by itself.
- **DEX's job** (owner's ask: DEX only raised the minimum roll before): with a bow, DEX does what STR does for a
  sword, +0.6 ATK and `BOW_DEX_HP` max HP a point, and STR only +0.2 ATK (it still gives its HP). `AP_STATS`
  says so in the bag.
- **Basics (Lv 10)**: Double Shot (two arrows), Retreat Shot (below), Keen Eye (range and crit), Steady Hands
  (+ATK with a bow), Evasion (`EVADE` a rank: a hit misses, see `hurt()`).
- **Sniper**: Snipe (one long hard arrow, `FAR_BONUS` more past `FAR_PX`: keeping your distance pays), Piercing
  Arrow (through every mob in a line), then Deadeye (crit, like Sword Mastery) and Hunter's Mark, then
  Heartseeker (a giant piercing arrow across the room). **Trapper**: Arrow Rain (a volley that comes down round
  the first mob ahead, `RAIN_AT` then a wave every `RAIN_EVERY`), Net Trap, then Barbed Arrows (every arrow slows
  for `BARB_SLOW`; `BARB_BONUS` a rank more on a slowed, chilled, frozen or netted mob) and Trap Mastery, then
  Thousand Arrows (a huge rain that slows).
- **Retreat Shot** (`kind: 'chase'`, no MP, no hotbar; Charge's twin for the Archer): a bow shot while dashing
  or within `CHARGE_WINDOW` ticks after, **back the way you came**, is a Retreat Shot for its `mult`. X / the
  Hit button fire back on their own while it's open (a click or tap aims where you tap, and counts only if
  it's backward). It changes nothing about the move, so unlike Charge there's no state edit: `retreatOpen`
  (sim.js) is judged by both sides from the physics state at the shot's input; its rank rides in `state.mw`
  bits 6–7 (`chaseOf`). The slap echo carries `retreat` (a "RETREAT SHOT" word), and the E-hint list shows
  "X Retreat Shot" while it's open. Needs Dash.
- **Hunter's Mark** (`kind: 'mark'`): the client sends the mob it aimed at (`mob`); the server checks the range
  and sets `m.mark` (`until`, `boost`, `by`; one per Archer), and **everyone's** hits on that mob get the boost:
  `applyHits` raises every cap, and each client's rolls use `markOn(v)` (the echo's `mark` tells everyone the
  boost; mob flag 2048 says a mob is marked, for late joiners, who assume the lowest boost). Drawn as a turning
  red target ring over the mob (`drawMark`). On a boss whose weak point is open it keeps the spot open for
  `WEAK_MARK_S` instead of `WEAK_OPEN_S` (S5.2, `docs/combat/bosses.md`).
- **Net Trap** (`summon`, `what: 'net'`): server-run with the Cleric's summons (`net` in `server/summons.js`):
  planted where you stand, never a target and never hurt; the first mob on the ground that walks within `NET_R`
  of it is caught (`m.snareUntil`): an ordinary mob stops dead and can't hurt anyone (both sides skip its
  touch, like a frozen one), a boss is only slowed to `NET_BOSS_SLOW` for half as long. Trap Mastery lets it
  catch more and bursts each catch (`burst(rank)` × ATK on everything within `NET_BURST_R`, sent as `sumhit`);
  spent, it goes with `how: 'sprung'`. `{t:'netcatch', id, m, x, y}` shows the snap and "CAUGHT!"; the caught
  mob wears a net (flag 4096, `drawNet`).
- **Evasion**: in `hurt()`, after Aegis and the bubble and never an ultimate, a dodged hit does no damage but
  still knocks you back, because the client predicted that knockback at that step (the physics would rubber-
  band otherwise). Everyone sees "MISS" (`guard` `'dodge'`).
- **Weak points** (S5.2): every arrow (bow shots and the arrow skills, `arrow` in `hitKinds`) reaches an open weak
  point from anywhere in range, where any other hit needs its hitter up at the spot's height. That's the
  Archer's party answer (`docs/combat/bosses.md`); Deadeye's crits land there like anywhere else.

## The status box (S5.1)
Owner, 2026-10-24: "buffs and nerfs probably need a box status". `src/status.js`, `#status` in `index.html`: in
combat rooms, a row of small icons under the HP/MP panel (below the Players / Chat buttons), one per thing on you,
each with its time left (a number and a clock sweep) or its stacks. `statusOf(rpg, mine)` lists them; `StatusBox`
draws the list (one HTML cell each, its icon painted once with `drawSkillIcon` / `drawItemIcon`).
- On you today: Challenge the Gods, Berserk, Rally, Jelly Bubble, Aegis (from your slime's `*Until`, which both the
  server's `me` and your own cast set), Barrier with what's left of it, Mend, SP1's long buffs (`me.buffs`, each with
  its skill's icon, its time left and what it does: `fxText`), a brewed potion, Mana Shield while
  it's on (no timer), Momentum's stacks, Arcane Charge's charges, and Second Wind recharging (greyed).
- **Debuffs** go first with a red rim: a boss's focus on you (`rpg.focusLeft()`), and a curse's stacks and time
  (S5.2, from `me.curse = { n, left }`).
- `me`'s timers are ms left when it was sent; `rpg.meAt` (when it came) turns them into time left now.
- Tap or hover an icon for its name (a small label under the row; the tap doesn't slap the game underneath).
  Phones: the strip sits in the free space left of the screen between the HUD buttons and the movement pad, cells
  of 32 instead of 30. The panels come later in the page and cover it.
- SP2: Retribution's store (`me.retri`, with the amount) and Bloodlust while it's on (HP under `BLOODLUST_AT`).
- A new buff or debuff: add its line to `statusOf` (a skill id for its icon, or a drawn one like the focus's).

## The skill pool's machinery (SP1)
`story/skills-plan.md`, "What's new under the hood". Built 2026-10-24 and shipped dark: no learnable skill uses it
yet; SP2–SP5 declare their skills on it (data in `SKILLS`, rules and constants in `src/shared/skills.js` from
`BUFF_FX` on). `TEST_SKILLS=1` on a test server gives everyone test skills for each piece (`docs/testing.md`).
- **Long buffs**: a `buff` with `fx(rank)` (effects named in `BUFF_FX`: `atk`, `magic`, `def`, `hp`, `crit`,
  `critDmg`, `exp`, `cut`) and a minutes-long `dur`; `party` is the radius it reaches friends in. Kept on the server
  player as `p.buffs` (skill id → `{ until, fx, rank, by }`): one of each skill per slime, a recast refreshes it, a
  weaker rank never replaces a stronger one, and different buffs (from anyone) stack. `buffFx` adds them up into
  `statsFor`'s `buffs.long`, so ATK / MAGIC and the hit caps follow; `exp` raises every kill's EXP (`kill()`; a
  faucet, `docs/economy.md`), `cut` takes a share off damage taken (`hurt()`). They last through room changes and
  end on fainting, a rebirth (yours and friends' on you) and logging off (`load()` starts empty; nothing is saved).
  `me.buffs` = `[[id, ms left, rank]]` for the status box. Berserk is still the old short `buff` (no `fx`).
- **Fields** (`kind: 'field'`): `at` 'self' or 'ahead' (the client aims it at the first mob ahead within `range`;
  the server clamps it), `shape` 'strip' (a band `radius` each way, `FIELD_TALL` high) or 'round', `mult` a tick
  (`statOf`: ATK or MAGIC by class, or `stat`), `every`, `dur`, `el`, `heal`. Server-run (`fieldTick`, like burns):
  each tick hits every mob inside through `damage()` as the caster's hit and heals every friend inside
  (`healFrom`); one per skill per caster; it ends if the caster leaves the room or is knocked out. **A frost field
  only chills** (`element(…, soft)`): ticking freezes would keep a pack frozen for ever. Wire: `{t:'fields', room,
  f}` with the room's whole list on every change and on walking in, `{t:'fieldhit', h}` for its hits. Drawn by
  `src/fields.js` under the mobs, a look per element (`FIELD_LOOKS`: fire, frost, holy, poison, plain).
- **Damage over time** (`DOTS`): burn, and SP1's bleed and poison, all ticked by one loop in the server's tick as
  the caster's hits; a skill's `dot: { kind, share }` leaves each mob it hits losing share × the hit a second
  (`dotOn`: a fresh one keeps the stronger dps). Bleed and poison never join the Mage's combos. `{t:'burn', h, k}`
  (k: 'bleed' / 'poison', in their own colours), mob flags 8192 / 16384 (drawn: red drops, green bubbles). The
  client never routed `burn` before SP1 (it was missing from `RPG` in `src/net.js`), so burn numbers only show since.
- **On-kill hooks** (`onKill` on a passive, or on an active skill for its own kills): `damage()` is the one place
  a mob dies, and runs `onKill()` with what made the hit (`src`) and the mob's states as it died (`mobState`).
  `burst` (a blast round the dead mob, `{t:'burst'}`; its `el` applies, so Ignite sets the pack alight and burning
  kills set off more), `refund` (`{t:'refund', skill}`), `extendBuff` (Berserk or a long buff, never past its full
  time), `ricochet`. Chains stop `ONKILL_DEPTH` deep. `when` and `from` filter (`onKillFrom`).
- **Ricochet** keeps hits client-decided: the client's arrow kill (`showHit`'s `killed`) picks the next mob within
  range and sends `{t:'skill', skill, from, hits}`; the server takes it only off a kill of `from` it saw itself
  within `RICOCHET_MS` (`p.rico`, from `onKill`), onto a mob within range of it, capped like an arrow, up to `jumps`.
- **Pull** (`pull` px on a hitting skill) and **taunt** (`taunt: true`): `pull()` slides every ordinary mob in reach
  toward the caster over `PULL_MS` (`m.pull`, at the top of `stepMob`), never a boss, field boss or anchored mob,
  never past its patrol; mob positions only. The echo carries `pulled` and `taunt` counts.

## The Warrior's skill pool (SP2)
`story/skills-plan.md`, the Warrior table. Numbers in `SKILLS`; rules and constants from `momentumMax` on in
`src/shared/skills.js`. Descriptions read their own numbers (`SKILLS.x.mult(R1(r))`), so a retune can't leave a
stale description. Every active skill has an icon (`ICONS`, `TREE_OF` in `src/skillfx.js`: the Knight's in the
guardian green, the rest coral) and its own look (`anim` on the skill → `hitFx` in `src/rpg.js` → `FX`): `bash`,
`rend`, `execute`, `lance`, `shake`, `wave`, `judgement`, `warcry`, `hook`.
- **Basics**: **War Cry**, a long party buff (`fx: atk`; SP1's machinery, cast from the K panel). **Hook**, the fifth
  chase move (above). **Cleave** goes through `2 + rank` mobs (`targets(rank)`; `targetsOf` reads a number or a
  function, for Cleave and the Archer's pierces).
- **Knight**: **Ground Shake** (a `spin` with SP1's `pull` and `taunt`: never pulls a boss), **Shield Bash** (a
  `strike` with `stun`: an ordinary mob it hits can't move or hurt anyone for `STUN_S`, `m.stunUntil`, treated like a
  net in `stepMob` and `ouch`; the mob flag bits are full, so the echo's `stun` list draws the stars, `v.stunLocal`,
  `drawStun` in `src/elements.js`; a boss only flinches), **Shockwave** (`kind: 'wave'`: every mob standing on your
  floor within `range` both ways; the client keeps it to your floor, the server only checks the distance),
  **Holy Lance** (a `cleave` with `targets: 2` and a long `reach`), **Retribution** (passive: while Rally is up, damage
  taken is stored in `p.retri`, at most `RETRI_HOLD` × max HP; the next Shield Bash adds `retriMult` on top, never
  more than `RETRI_CAP` × ATK, the same sum on both sides from `me.retri` and the server's own store, so the cap
  stays honest), **Judgement** (a wide `spin` that taunts), **Guardian's Oath** (a long party buff, `fx: def`, plus
  `oath`: in `hurt()`, a friend's hit moves `share(rank)` of it to the Knight who swore it while they're within
  `OATH_R` in the room; the Knight takes it as a `'dot'` hurt so it can't bounce between two oaths; never an
  ultimate), **Unbroken** (passive: `statsFor`'s `buffs.attackers`, the mobs after you within `UNBROKEN_R`, up to
  `UNBROKEN_MAX`, each `per(rank)` more DEF; the server counts them in `buffsOf`).
- **Berserker**: **Rending Slash** (a `strike` with SP1's bleed), **Bloodlust** (passive: `statsFor` reads `buffs.hp`;
  under `BLOODLUST_AT` of max HP, more ATK and Jelly Thirst doubled; `me.atk` follows from the server), **Execution**
  (a `strike` with `exec(rank)`: × that on a mob at `EXEC_AT` of its HP or less, read off the client's HP bar and
  allowed by `applyHits`' `exec` from the server's own HP; `onKill: refund`), **Frenzy** (passive, `onKill:
  extendBuff` on Berserk), **Cyclone** (a `field` with `follow`: `fieldTick` moves it to its caster every tick and
  `src/fields.js` draws it round them in the `blade` look; it never touches movement), **Rampage** (passive:
  `momentumMax`, and Whirlwind and Blade Storm landing add a stack, `momentumUp`).

## The Mage's skill pool (SP3)
`story/skills-plan.md`, the Mage table. Numbers in `SKILLS`; the few new rules and constants from `staticS` on in
`src/shared/skills.js`. Every new skill has an icon (`ICONS`, `TREE_OF`: fire ones in the fire palette, the rest in
mage blue) and the long buffs show in the status box. The Mage mobs **from where it stands**: big areas at range and
fields the pack walks into, and its packs chain-react (a burning or frozen kill bursts). Looks: `FX.thunder`,
`flamelance`, `combust`, `insight`, `frostarmor` (`src/skillfx.js`), Static's sparks (`drawStatic`, `src/elements.js`).
- **Basics**: **Arcane Burst** (a `fireball` with `anim: 'arcane'` and no element: a violet bolt and a mana-tinted
  burst; it spends Arcane Charge like any spell), **Arcane Insight** (a long party buff, `fx: magic`).
- **Elementalist**: **Fire Wall** (a `field`, strip, planted on the first mob ahead; fire, so it burns and Kindling
  counts), **Flame Lance** (a fire `bolt` with its own spear look), **Ignite** (passive, on-kill `burst` `when:
  'burning'`, `el: 'fire'`: the pack catches and a burning kill sets off the next), **Combustion** (a `bolt` with
  `combust(rank)`: × that on a burning mob and its burn is spent. The client reads `v.burning` and puts its burn
  out; the server allows the × only if its own `m.burn` is up, `SHATTER_GRACE_MS` of slack, then clears it and lists
  the mob in the echo's `combust`, which draws the blast and "COMBUST!" for everyone), **Phoenix** (SP1's flier
  summon with `el: 'fire'`).
- **Frostbinder**: **Frost Bolt** (a cheap frost `bolt`, short cooldown: two inside `CHILL_S` freeze, so a Frostbinder
  freezes alone from Lv 30), **Frost Armor** (a long buff for you only, `fx: def`, plus `chills`: in `ouch`, a
  touch or charge from a mob chills it, a soft chill, never a freeze; works under `TEST_GOD` too), **Blizzard** (a
  round frost `field` at range: a frost field only chills, `element(…, soft)`), **Cold Snap** (passive, on-kill
  `burst` `when: 'frozen'`, `el: 'frost'`: its blast chills, and freezes what was already chilled), **Thunder Call**
  (a storm `chain` with `lead`: the first mob takes `lead` × the per-mob hit, `applyHits` allows that only for the
  first hit; `anim: 'thunder'` drops a bolt from the sky before the chain; storm, so it spreads burns), **Static**
  (passive: a storm hit charges every mob it hits for `charge(rank)` s, `m.staticUntil` on the server; frost that
  isn't a field's soft chill freezes a charged mob at once, anyone's frost, a party combo; the freeze spends it.
  The mob flag bits are full, so the echo's `charged` + `cs` draws it, `v.staticLocal`, sparks over the body, and
  `predictEl` treats a charged mob like a chilled one).
- The economy sheet: `docs/economy.md`, "The Mage's skill pool (SP3)" (its staples swap on the sheet's hotbar).

## The Cleric's skill pool (SP4)
`story/skills-plan.md`, the Cleric table. Numbers in `SKILLS`; the new small rules and constants from `HOLY_SYMBOL_EXP`
on in `src/shared/skills.js`. Every new skill has an icon (`ICONS`, `TREE_OF`: all in the holy palette) and the long
buffs show in the status box. The Cleric mobs **with summons and holy ground**, slowest at it but never in danger, and
**every Cleric damage skill heals a little**: a field's `heal`, Sacred Light's `selfPer` (× MAGIC on you for each mob
hit), and `lightHeal` (a share of the damage on the hurt friend nearest you, else you: the holy bolt's rule, `lightHeal`
in `server/rpg.js`, which the holy bolt now uses too; `SUMMON_LIGHT` for the summons and the Warding Totem's pulse).
Looks: `FX.sacred`, `genesis`, `judgment`, `bless` (`src/skillfx.js`), the `radiance` field look (`src/fields.js`).
- **Basics**: **Radiance** (a `field` with `follow`, round, `look: 'radiance'`: a golden aura carried with you that
  hurts every mob in it and heals every friend in it), **Blessing** (a long party buff: max HP, ATK and MAGIC).
- **Priest**: **Sacred Light** (a `meteor` with `anim: 'sacred'`: a column of light on the first mob ahead, `selfPer`),
  **Devotion** (passive: in `healFrom`, `share(rank)` of a heal's overheal becomes a ward on that slime, `q.devo`, at most
  `DEVOTION_CAP` of its max HP, for `DEVOTION_S` from the last top-up; `hurt()` soaks it after the Barrier and **never an
  ultimate's** hit, so it isn't a new answer to one; `me.devo` shows it in the status box), **Consecration** (a `field`,
  strip, planted where you stand: mobs on it hurt, friends on it healed), **Judgment** (a holy `bolt`, `anim:
  'judgment'`: × `judgmentMult`, + `judge(rank)` for every slime within `JUDGMENT_R` under `JUDGMENT_AT` of its HP, you
  too, up to `JUDGMENT_MAX`. The client counts what it sees (`rpg.hurtNear` in main.js: others' HP from `hurt` and
  `thirst`), the server caps the hit with its own count (`hurtNear`); the echo's `judged` pops "JUDGMENT xN"; plus
  `lightHeal`), **Holy Symbol** (a long party buff, `fx: exp`, `HOLY_SYMBOL_EXP` a rank: a faucet, `docs/economy.md`),
  **Genesis** (a `starfall` with `whole`: every mob in the room, the client takes every mob it sees, the server allows
  the room's width; `anim: 'genesis'`, a shaft on each; plus `lightHeal`).
- **Warden**: **Sprites** (SP1's `sprite` summon, `count` 3, each after a different mob; with only one mob near, the
  others stay by you, so it's a mobbing staple, not a boss one; their hits heal, `SUMMON_LIGHT`), **Warding Totem**
  (passive: your Guardian Totem pulses every `WARD_PULSE_S` on every mob in its ring, `pulse` in `server/summons.js`,
  drawn as a golden ring from the `sumhit`), **Stone Guardian** (SP1's `guardian` summon: taunts the mobs round it, a
  boss too unless a focus or a Knight's taunt holds it, and slams; its hits heal), **Resolve** (a long party buff with no
  plain effect, `fx: () => ({})`: `hurt()` takes `cut(rank)` off while the slime stands within `RESOLVE_R` of any of its
  Warden's summons, `resolveCut`; never an ultimate; `buffText` words it in the status box and the sheet), **Host**
  (passive: `summonCap` + 1 for every Cleric summon; sprites come `count` + 1 at a time).
- No wire bump: `judged` rides the skill echo, the ward rides `me`, the totem's pulse rides `sumhit`.
- The economy sheet: `docs/economy.md`, "The Cleric's skill pool (SP4)".

## The Archer's skill pool (SP5)
`story/skills-plan.md`, the Archer table. Numbers in `SKILLS`; the few new rules and constants from `SPLIT_R` on in
`src/shared/skills.js`. Every new skill has an icon (`ICONS`, `TREE_OF`: all in the archer palette) and the two long
buffs show in the status box. The Archer mobs **in lines and volleys**: Spread Shot and Splitting Arrow fan out, the
Blast Trap goes off under the pack it leads in, and Ricochet carries a kill on. Looks: `FX.split`, `focus` (both
buffs; Sharp Eyes adds the party ring) in `src/skillfx.js`; the hawk's and the blast trap's art in `src/summons.js`.
Hold-to-fire (above) came with it.
- **Basics**: **Spread Shot** (a `shot` with `spread`: one arrow at each of the first `spread` mobs ahead; the server
  takes that many hits; others see the fan from the echo's hit list), **Focus** (id `bow_focus`, since the status box
  already uses the icon name `focus` for a boss's focus: a long buff for you only, `fx` ATK and crit).
- **Sniper**: **Ricochet** (passive, SP1's on-kill `ricochet` `from: 'arrow'`, two jumps), **Splitting Arrow** (a `shot`
  with `split`: the first mob takes the hit, then up to `split` mobs behind it, further along and within `SPLIT_R`,
  take `SPLIT_SHARE` of it; the server allows `1 + split` hits out to `range + SPLIT_R`; the client sends the fan's ends
  as `split`, echoed for the others' `FX.split`), **Sharp Eyes** (a long party buff: crit and crit damage), **Eagle Eye**
  (passive: a `far` `shot`, Snipe, at a mob past `FAR_PX` always crits: the client's `roll(…, sure)` and an "EAGLE EYE"
  pop; the server's cap always allowed a crit, so nothing changes there).
- **Trapper**: **Poison Arrow** (a `shot` with SP1's poison `dot`), **Blast Trap** (SP1's `blast` summon on ATK, `stat:
  'atk'`: the first mob on the ground over it sets it off on everything within its radius), **Hawk** (SP1's `hawk` summon on
  ATK: dives at what you last shot, `p.lastHit`), **Huntmaster** (passive: `huntX` in `server/summons.js`, × (1 +
  `bonus(rank)`) on the Net Trap's bursts, the Blast Trap and the hawk when the mob is slowed, chilled, frozen or netted;
  Barbed Arrows slows whatever you shoot, so the hawk's target nearly always is).
- No wire bump: `split` rides the skill echo; the rest is SP1's machinery.
- Not on the economy sheet: Ricochet (kills aren't modelled) and Eagle Eye (the sheet's ranged column is closer than
  `FAR_PX`). The sheet: `docs/economy.md`, "The Archer's skill pool (SP5)".

## Mobility runs in the physics
Dash and Blink are input bits (`DASH`, `BLINK`: Shift, V, the hotbar, touch buttons) handled in sim.js
`step()`; ranks reach the physics as `state.mv` (`mobilityOf`, set by the server's `moves()`). The state
carries their cooldowns and i-frames (`ifr`) and goes through `pack`. Some late ultimates need them.

## The hotbar
- HTML `#hotbar` (combat rooms only, or while choosing a slot; hidden while a Keeper stone's card or a
  conversation with a character (`#npc`) is open, since both sit in its spot): `HOTBAR` skill slots (keys 1–6) and
  `POTBAR` potion slots (7–9), tappable, with cooldown sweeps and potion counts. "Hotbar" in the skill tree
  or "Put on hotbar" in the bag, then press a slot (`startAssign` / `finishAssign`).
- **Two setups.** The active one is `c.hotbar` / `c.potbar`, the other `c.alt`, and `c.set` says which
  (0/1). `{t:'hotswap'}` swaps both rows. **It is swapped ONLY from the Esc menu button. The owner
  explicitly wants no hotkey and no hotbar button for it**: opening the menu mid-fight is meant to raise
  the skill ceiling.

## Ability points (STR / DEX / INT / LUK), MapleStory style
- `AP_PER_LVL` points per level (`apTotal`, counts levels already earned), saved as `c.ap`, spent in a
  Stats column on the left of the bag: − / + with a step of 1 / 10 / All, and Reset. All free, any time
  (`{t:'ap', stat, n}`, n < 0 takes back; `{t:'ap', reset: true}`).
- Effects are in `AP_STATS` (descriptions) and `statsFor` (numbers): STR → ATK and HP, DEX → a higher
  minimum damage roll (`minRollFor`) and a little ATK and MAGIC (with a bow: the Archer's main stat, ATK and
  HP like STR; S4), INT → MAGIC and MP, LUK → crit chance and crit damage. The bag shows ATK and MAGIC damage-range bars (normal hit bright, crit pale).
- MAGIC = `magicFor(lvl)` + the staff's MAGIC (S1) + INT + scrolls; a staff also adds max MP. Warrior skills
  use ATK and Mage spells MAGIC (Archer arrows ATK); the weapon lock makes a class's weapon match its skills.
- Added because the owner said mages were weak: INT gives more per point than STR, and Arcane Mind was
  raised at the same time. Untested with real players.
