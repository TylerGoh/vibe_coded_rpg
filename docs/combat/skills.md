# Skills, MP, the hotbar, Mobility and ability points

Files: `src/shared/skills.js` (all rules and `statsFor`), `src/skilltree.js` (the K panel),
`src/skillfx.js` (icons and effects), the hotbar and stats UI in `src/rpg.js`, server actions in the
`skills()` handler of `server/rpg.js`.

**A revamp is planned** (classes from weapons, wands, an archer, forks and advancements, levelling
rewards): `story/progression.md`. Read it before changing skills, AP or `spTotal`.

## Skill trees
- Four trees in `TREES`, skills in `SKILLS`: Blade (sword hits, Berserk, Sword Mastery), Magic (bolts,
  chain lightning, nova, meteor, starfall, Jelly Heal, Arcane Mind, Mana Flow), Guardian (Jelly Bubble,
  Vitality, Rally, Second Wind, Sanctuary, Aegis) and Mobility (`wind`: Dash, Flash Jump, Blink, Phantom
  Step).
- One skill point per level (`spTotal`). Deeper tiers need `TIER_NEEDS` points in that tree's lower tiers.
- K / Skills: + learn, − take a point back (refused if a deeper skill needs it: `cantUnlearn`), "Reset
  all" refunds everything for free. **The owner wants nobody stuck in a build**: every allocation
  (skills and stats) must stay reversible for free.
- MP: `maxMpFor`; active skills cost MP and have cooldowns (`cooldownOf`; the server allows slack for lag).
  Skills only work in combat rooms. Buffs live on the server player (`*Until`) and feed `statsFor`.

## Mobility runs in the physics
Dash and Blink are input bits (`DASH`, `BLINK`: Shift, V, the hotbar, touch buttons) handled in sim.js
`step()`; ranks reach the physics as `state.mv` (`mobilityOf`, set by the server's `moves()`). The state
carries their cooldowns and i-frames (`ifr`) and goes through `pack`. Some late ultimates need them.

## The hotbar
- HTML `#hotbar` (combat rooms only, or while choosing a slot): `HOTBAR` skill slots (keys 1–6) and
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
- Added because the owner said mages were weak: INT gives more per point than STR, and Arcane Mind was
  raised at the same time. Untested with real players.
