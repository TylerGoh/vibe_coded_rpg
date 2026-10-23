# Classes, skills, MP, the hotbar, Mobility and ability points

Files: `src/shared/skills.js` (all rules, `CLASSES`, `statsFor`), `src/skilltree.js` (the K panel),
`src/skillfx.js` (icons and effects), `src/elements.js` (the Mage's combo states drawn on mobs, the Arcane
Charge pips), the hotbar and stats UI in `src/rpg.js`, server actions in the `skills()` and `rebirth()`
handlers of `server/rpg.js`.

**Classes are being built in pieces** (`story/s2-plan.md`; the design is `story/progression.md`, read it
before changing classes, skills, AP or the point schedule). S2.1 (the data, the rules, the server, the
migration), S2.2 (the node-tree K panel) and S2.3 (the Rebirth Pool: place, card, banners, Elder Mochi) are
built, and the CLASSES tables in the economy sheet (S2.4, `docs/economy.md`) measure and tuned them; the
Warrior's chase moves (S2.5) and the Mage's combos and Arcane Charge (S2.6), both below, too.
Archer and Cleric come later (S3, S4).

## Classes (S2)
- `CLASSES`: `novice`, `warrior` (sword, STR), `mage` (staff, INT), each with its weapon kind, starter
  weapon, colour, blurb, strong / bad at text (for the pool's card) and two `branches` (Knight / Berserker,
  Elementalist / Frostbinder). Saved on the character as `c.cls`, plus `c.reborn` (how many times a class
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
  takes its place; with none, you get the class's starter (`wood_sword` / `wood_staff`). A wrong weapon with
  a full bag refuses the change ("make room first"). Unarmed still slaps.
- **The migration** (one time, in `load()`): a saved character with no `cls` becomes a Novice with every
  skill point and AP refunded and both skill hotbars cleared (potion bars kept), `reborn` 0, and a one-time
  `notice` with `news: 'classes'` (a banner, below; the chat line stays). A
  character that is also due the L3 rollback gets both notices, one per line.
- Healing: Jelly Heal left with the old Magic tree and comes back with the Cleric (S3); its icon and effect
  code stay. Until then, Jelly Patch and potions.
- **The pool's card** (`PoolCard` in `src/rebirth.js`, `#pool` in `index.html`; E at the pool, or the E button
  on touch): below `CLASS_LVL` only "Come back at Lv 10" and what the classes are; from it, Warrior and Mage
  from `CLASSES` (never the Novice, and no teasing of classes not built yet) with strong / bad at, your own one
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
- `TREES`: the Novice tree, one per class, and Mobility (`wind`). Every skill in `SKILLS` has `cls`
  (`novice`, a class, or `any` for Mobility), `tree`, `adv` (the level it opens at) and, past the basics,
  a `branch`.
- **Novice tree** (kept forever, weak once you have a class): Slime Bash, Pebble Toss (on the better of
  ATK and MAGIC, `stat: 'best'`, so a staff Novice isn't stuck), Jelly Patch (heals only you). Nine points.
- **Warrior**: basics at Lv 10 (Power Strike, Cleave, Iron Jelly, Jelly Thirst: hits heal you a share of
  their damage, the Warrior's solo answer); **Knight** (Jelly Bubble, Vitality, Rally, Second Wind, then
  Sanctuary, Aegis); **Berserker** (Whirlwind, Berserk, then Sword Mastery, Blade Storm, Sky Splitter).
- **Mage**: basics at Lv 10 (Magic Bolt, Mana Flow, Arcane Mind, Mana Shield: for a while a share of the
  damage you take comes off MP instead; Arcane Charge, below); **Elementalist** (Fireball: a bolt that bursts where it lands; then
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
- **The fork**: points sit in one branch at a time; learning in the other is refused ("Take your Knight
  points back first", free). Basics and Mobility have no branch.
- **Points, two counts** so the Novice tree can't eat class points: `spNovice` (one a level to
  `SP_NOVICE_LVL`) and `spClass` (from `CLASS_LVL`: `SP_CLASS_START`, then one every `SP_EVERY_EARLY` levels
  to Lv 60, one every `SP_EVERY_LATE` to `SP_CAP_LVL`, plus `SP_ADV_BONUS` at each later advancement).
  Sized so you fill one branch and some of Mobility, never everything. Mobility takes class points, so a
  Novice can't learn it; a Novice's class points pile up unspent. `me.sp` is what you can spend now
  (`spFree`), `me.spLeft` both counts.
- `cantLearn(c, id)` / `cantUnlearn(c, id)` take the character (`{lvl, cls, skills}`), not its parts;
  `cleanSkills(c)` is what `load()` keeps (the class's skills, opened by the level, adding up, one branch;
  otherwise every point back).
- **The K panel** (K / the Skills button, `src/skilltree.js`) is a node tree in three tabs: **Novice**,
  **your class** and **Mobility**. The class tab shows the basics on top, then the fork as two columns
  (branch names and blurbs from `CLASSES[cls].branches`), a row per advancement past the basics (from
  `ADVANCEMENTS`), nodes joined by lines (CSS lines: a spine per column, a line through each row, an arch
  where the basics split). The branch you hold (`heldBranch`) is bright; the other is dimmed with "Take
  your points back to switch". A node is the round skill icon (`drawSkillIcon`, cropped to a circle) with a
  `2/3` rank badge, a small + when a point can go in, a gold ring when maxed. Rows the level hasn't opened
  are greyed and labelled "opens at Lv 60".
- **A Novice** sees a "Classes" tab instead: "Choose a class at Lv 10 at the Rebirth Pool" with a Warrior /
  Mage switch, each class's whole tree greyed so they can look ahead (cards still open, and say "Choose
  Warrior at the Rebirth Pool…"). From `CLASS_LVL` a pink reminder under the header says the class points
  are piling up and to visit the Rebirth Pool by Elder Mochi. Mobility is greyed for a Novice too.
- Clicking a node opens its **card under the tree**: name, rank, branch, level, MP / cooldown (or passive),
  what it does now and at the next rank, and why it can't take a point (`cantLearn`, worded by the panel
  for a Novice's look-ahead), with + / − / Hotbar (`startAssign`; "Key 3" once it's there). The header
  shows the points left (`me.spLeft`: Novice and class; the tabs carry a badge with what's spendable there),
  MP, and the next advancement. "Reset all" stays.
- + learn, − take a point back (always allowed now: no skill needs another), "Reset all" refunds
  everything for free. The panel predicts: `change()` sets `me.skills`, `sp` and `spLeft` at once and the
  server's `me` confirms (`learn`, `unlearn`, `respec`). Every `me` re-renders the panel (it keeps the tab,
  the open card and the scroll; icons are cached canvases). **The owner wants nobody stuck in a build**:
  every allocation (skills and stats) must stay reversible for free; only the class itself costs gold to
  change.
- Phones (`body.touch`): bigger nodes (at least 44 px on screen at 667×375), big + / − / Hotbar buttons,
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
  one and all go after `MOMENTUM_STILL` s standing still (the server's tick). Shown as pips right of the HP
  panel; `me.momentum`.
- The server only takes a slam's or a cut's hits if its own physics landed that slam / fired that cut near
  that input (`p.chaseAt`, noted in index.js's input loop; `CHASE_SLACK`), and only once.
- Effects for anyone come from state changes (main.js `moveFx`: `sl`, `uc`), like Dash's; the E-hint list
  shows "Charge", "↓+X Leap Slam" and "Upward Cut" while each is possible (`docs/ui/hints.md`).
- Not built: **Hook** (progression.md 1c, `[proposed]`).

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
  without saying who casts them). Alone, a Frostbinder freezes (control; from Lv 60, when Glacial Spike gives it a second frost spell inside `CHILL_S`) and an Elementalist burns.
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
  The HUD shows `ARCANE_MAX` diamonds in the MP bar's right end, lit per charge, for anyone with a rank.
- Not built: the **interrupt** (freezing a boss during `ULT_WARN` cancels its ultimate) waits for S5
  (`docs/ideas.md`); the masteries (Permafrost, Wildfire) are S6's.

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
  minimum damage roll (`minRollFor`) and a little ATK and MAGIC, INT → MAGIC and MP, LUK → crit chance and
  crit damage. The bag shows ATK and MAGIC damage-range bars (normal hit bright, crit pale).
- MAGIC = `magicFor(lvl)` + the staff's MAGIC (S1) + INT + scrolls; a staff also adds max MP. Warrior skills
  use ATK and Mage spells MAGIC; the weapon lock makes a class's weapon match its skills.
- Added because the owner said mages were weak: INT gives more per point than STR, and Arcane Mind was
  raised at the same time. Untested with real players.
