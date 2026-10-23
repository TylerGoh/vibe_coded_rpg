# Classes, skills, MP, the hotbar, Mobility and ability points

Files: `src/shared/skills.js` (all rules, `CLASSES`, `statsFor`), `src/skilltree.js` (the K panel),
`src/skillfx.js` (icons and effects), the hotbar and stats UI in `src/rpg.js`, server actions in the
`skills()` and `rebirth()` handlers of `server/rpg.js`.

**Classes are being built in pieces** (`story/s2-plan.md`; the design is `story/progression.md`, read it
before changing classes, skills, AP or the point schedule). S2.1 (the data, the rules, the server, the
migration) is built; the node-tree K panel (S2.2), the Rebirth Pool's place and card (S2.3), the CLASSES
table in the economy sheet (S2.4), the Warrior's chase moves (S2.5) and the Mage's combos (S2.6) are not.
Archer and Cleric come later (S3, S4).

## Classes (S2)
- `CLASSES`: `novice`, `warrior` (sword, STR), `mage` (staff, INT), each with its weapon kind, starter
  weapon, colour, blurb, strong / bad at text (for the pool's card) and two `branches` (Knight / Berserker,
  Elementalist / Frostbinder). Saved on the character as `c.cls`, plus `c.reborn` (how many times a class
  was chosen; 0 = the next choice is free).
- **Everyone starts as a Novice** (owner, 2026-10-23): the Novice tree, any weapon. **From `CLASS_LVL` you
  choose a class at the Rebirth Pool** in Slimeville (`REBIRTH_X`, `REBIRTH_RANGE` in sim.js; a placeholder
  spot until S2.3 places and draws it). `{t:'rebirth', cls}` → `rebirth()`: near the pool, Lv 10+, a
  different class, never back to Novice; the first choice is free, every change after costs
  `rebirthCost(lvl)` (an hour of farming gold at your level, `docs/economy.md`). Level, EXP, gold, bag,
  gear and house stay; skill points and AP all come back, the skill hotbars of both setups empty, buffs
  end. Everyone in the room gets `{t:'reborn'}` (S2.3 draws the splash).
- **Weapon lock:** a class only wields its own kind (`weaponOk`; equip is refused on both sides). On
  choosing a class, a wrong weapon in hand goes back to the bag and the strongest right one from the bag
  takes its place; with none, you get the class's starter (`wood_sword` / `wood_staff`). A wrong weapon with
  a full bag refuses the change ("make room first"). Unarmed still slaps.
- **The migration** (one time, in `load()`): a saved character with no `cls` becomes a Novice with every
  skill point and AP refunded and both skill hotbars cleared (potion bars kept), `reborn` 0, and a one-time
  `notice` with `news: 'classes'` (a toast and chat lines for now; S2.3 can turn `news` into a banner). A
  character that is also due the L3 rollback gets both notices, one per line.
- Healing: Jelly Heal left with the old Magic tree and comes back with the Cleric (S3); its icon and effect
  code stay. Until then, Jelly Patch and potions.

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
  damage you take comes off MP instead); **Elementalist** (Fireball: a bolt that bursts where it lands; then
  Meteor, Kindling: fire spells (`fire` on the skill) hit harder; then Starfall); **Frostbinder** (Frost
  Nova, Chain Lightning, then Glacial Spike: a long bolt that slows hard, then Absolute Zero).
- Skills whose old max was 5 and now 3 (Power Strike, Cleave, Iron Jelly, Magic Bolt, Mana Flow, Arcane
  Mind) had their per-rank numbers raised so the max rank is worth what the old max was. S2.4's CLASSES
  table is what tunes them.
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
- K / Skills: + learn, − take a point back (always allowed now: no skill needs another), "Reset all"
  refunds everything for free. **The owner wants nobody stuck in a build**: every allocation (skills and
  stats) must stay reversible for free; only the class itself costs gold to change. The panel is still the
  old column list working on the new data (a Novice sees both classes' trees greyed to look ahead); S2.2
  replaces it with the node tree.
- MP: `maxMpFor`; active skills cost MP and have cooldowns (`cooldownOf`; the server allows slack for lag).
  Skills only work in combat rooms. Buffs live on the server player (`*Until`) and feed `statsFor`.

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
