# Classes and progression: the S track (plan)

**Status: plan, written 2026-10-23, nothing built yet.** Runs alongside the island-depth G track
(`world/island-depth.md`). Everything below is `[proposed]` until the owner settles the open decisions at
the bottom; the recommended answer is written in each time, so a session can start from it.

The owner asked for four things: mages feel neglected, no boss drops a wand, maybe an archer class, the
skills should be a real tree instead of a list, and high-level players need rewards spaced further apart.
They all have the same root, so this is one plan.

## What's wrong today (measured 2026-10-23, live saves and `npm run economy`)
1. **Nobody makes a choice.** The four trees hold 94 points in total and you get one per level, so by
   Lv 94 every character owns every skill. The two highest players (Lv 390 and Lv 379) have identical,
   fully maxed trees. A "tree" you always finish is a list.
2. **Mages have no loot.** Spell power is `magicFor(lvl)` plus INT: only level and stats, never gear.
   Every boss, trader and scroll feeds swords. A mage's normal attack is still a sword swing on ATK. Raising
   INT and Arcane Mind (the last mage fix) changed numbers but not the feeling: nothing a mage picks up
   makes them better.
3. **Levels have run away from the content.** The top mob is Lv 72 and the top boss Lv 80, yet players are
   at 390. Chronos gives 220k EXP, respawns every `BOSS_RESPAWN_MS` (one minute), every hitter gets the
   full EXP, and nothing is reduced for fighting far below your level. Lv 80 → 390 is about 200 Chronos
   kills: roughly 3 hours of boss farming, against about 32 hours of farming the Lv 72 wraiths.
4. **Late levels are empty.** Past the point where the tree is full, a level is +2 ATK, +12 HP and 5 AP.
   At Lv 390 the level alone gives 784 ATK while the best sword gives 135, so gear stops mattering too.

## Game design principles this plan uses (the short version, for the owner)
- **Identity comes from what you give up.** A class feels like a class only when picking it means not
  having something else. Free respec is fine (the owner's "nobody stuck in a build" stays); what has to
  go is *having everything at once*. So: more tree than any one character can fill.
- **Loot has to speak to every class.** If a drop is useless to a third of the players, that third feels
  forgotten. Every boss should drop something for each class.
- **You are what you hold.** In a game where you see your friends, the clearest class signal is the
  weapon in their hands. Tying the class to the weapon needs no new menus and reads at a glance.
- **Rewards should get rarer and bigger as you go.** Early levels come fast and each gives a little (to
  hook new players). Later, the gaps widen but each milestone is a real event: a new tier of the tree, a
  new choice, a visible change. Constant tiny rewards stop being noticed; spaced big ones are remembered.
- **Power should come from choices and gear, not just the level number.** If the level alone outweighs
  everything else, loot and builds stop mattering and the top players are simply untouchable.
- **Close the faucet before adding rewards.** The fastest source of EXP decides how the whole game plays.
  Right now it's one boss on a one-minute timer, so that's the first thing to fix.
- **Never take away what people earned.** Levels stay. Points get refunded and re-spent, never deleted.

## The design

### 1. Classes come from your weapon
Three weapon kinds, three classes:
| weapon | class | main stat | plays like |
|---|---|---|---|
| sword | **Warrior** | STR | in close, tough, big single hits and spins |
| wand | **Mage** | INT | from range, area damage, crowd control, heals; fragile, MP-hungry |
| bow | **Archer** | DEX | from range, fast single-target damage, mobility, traps |
LUK stays the shared crit stat. This finally gives DEX a job (today it only raises the minimum roll).

- Each class has its own tree. **Its active skills only work with that weapon in hand.** Two shared trees
  (Guardian and Mobility, trimmed) work with anything.
- Changing class = equipping another weapon. Allowed anywhere outside combat rooms, free, instant. Each
  class remembers its own points and hotbar, so a friend can keep a warrior build and a mage build and
  swap in town (the two hotbar setups become per-class, or each class gets its own pair).
- The normal attack follows the weapon: sword swing (as now), **wand tap** (a short magic bolt on MAGIC,
  so mages stop slapping with ATK), **bow shot** (an arrow along the ground to the first mob in range).

### 2. Wands (the mage fix)
- New item kind `wand`: gives MAGIC (on the same frozen curve as sword ATK, so the economy sheet's
  `GEAR_FIT` check covers it) and a small MP bonus. Spell power becomes level + INT + **wand**.
- **Every den boss and field boss drops a wand alongside its sword**, themed like the sword (the
  Tidemother's coral wand, the Knotmole's root wand, Chronos's hourglass sceptre...). Pip sells a starter
  wand; each branch trader sells one at their `aim` level.
- Scrolls: the sword scrolls become **weapon scrolls** (any weapon); the stat they add follows the weapon
  (ATK on swords and bows, MAGIC on wands). Existing sword scrolls in bags just start working on wands.
- Mage survivability: a Mage-only passive for MP Shield (damage taken from MP first) in the tree, so
  "fragile" is a choice, not a death sentence.

### 3. Bows and the Archer
- New item kind `bow`: ATK on the sword curve, but a long reach and a lower base so range is paid for.
- Arrows are drawn and aimed by the client like every other hit (the hit rules in
  `docs/combat/core.md` already allow client-decided, server-capped hits; the cap needs the bow's range).
- **Ranger Acorn** (the Canopy) is the archers' trader: she already lives in the trees, hasn't touched the
  ground in six years, and a ranger with a bow suits her. Pip sells a starter bow. Bosses drop bows too.
- Archer skills (first draft): Double Shot, Piercing Arrow (through a line), Arrow Rain (area), Snipe (a
  slow, huge single shot), Net Trap (roots a mob), Hawk Eye (passive range and crit), Retreat Shot (a
  backflip that fires while dashing away: reuses the `DASH` physics).

### 4. A real tree: advancements at widening gaps
Each class tree is drawn as connected nodes, not columns, and opens in **advancements** (MapleStory's
job advancements), at levels spaced further apart each time:
| advancement | opens at | what it brings |
|---|---|---|
| 1st: the class | Lv 1 (pick your weapon) | the class's basic skills |
| 2nd | Lv 10 | first **fork**: choose one of two branches (below) |
| 3rd | Lv 30 | the branch's middle tier and a second smaller fork |
| 4th | Lv 60 | the branch's capstone skill (the big ultimate) |
| 5th | Lv 100 | mastery nodes: passives that change how skills behave, not just +% |
| 6th | Lv 150 | the second capstone [proposed: lands with the rebalanced late islands] |

**Forks** are the "giving something up" part. Each class splits into two branches at the 2nd
advancement; you can only put points into one at a time (free to switch, outside combat):
- Warrior: **Berserker** (damage, Berserk, Blade Storm, Sky Splitter) or **Knight** (Iron Jelly,
  taunting hits that pull bosses off friends, Aegis moves here)
- Mage: **Elementalist** (Meteor, Frost Nova, Starfall: area damage) or **Cleric** (Jelly Heal, Rally,
  Sanctuary, MP Shield: the group's healer)
- Archer: **Sniper** (Snipe, Piercing Arrow, big crits) or **Trapper** (Arrow Rain, Net Trap, slows)
Healing and team buffs moving into the Cleric gives groups a real reason to bring a mage to a boss.

**No quests** (owner, island-depth plan): an advancement simply opens when you reach the level, with a
banner and a sound. A class trainer can say something in chat about it, but there's nothing to fetch.

**Points:** skill points stop being "one per level forever". `spTotal` becomes a schedule: one per level
early, then fewer per level but a lump at each advancement, ending where the content ends (Lv 200 after
the rebalance). Sized so a character can fill its chosen branch and part of the shared trees, never
everything. AP stay at `AP_PER_LVL` (small, steady per-level rewards keep every level worth something).

**Mobile:** the node tree has to work on a phone (`docs/ui/mobile.md`): one tree per tab, the nodes big
enough to tap, the card for a node opening below it.

### 5. Levelling: closing the faucet, then spacing the rewards
In order of importance:
1. **Over-level EXP falloff.** A mob or boss more than a few levels below you gives less EXP, falling to a
   small floor (MMO standard). Stops Lv 300s levelling off Lv 80 content, and doesn't touch anyone
   fighting at their own level, so `npm run economy`'s Progress table is unchanged.
2. **Boss rewards once per window.** Bosses still respawn every minute (groups can keep fighting), but
   each player gets full EXP and a loot roll from a given boss once per reward window (e.g. 10-15 min);
   kills inside the window give a small share. Field bosses already have long timers, so they're fine.
3. **Stat growth tapers past the content.** Beyond the top of the content (Lv 200 after the rebalance),
   each level adds much less ATK/MAGIC/HP, so gear and the tree decide power there. **This lowers the
   current Lv 300+ players a bit**: owner decision below.
4. **Past the last advancement: mastery stars.** Every N levels past the cap gives a star (shown by your
   name) and a small cosmetic or comfort reward (an aura colour, a title, a bag row): something to show,
   not raw power. This is the widening-gap reward for the people already at 390.

### 6. Existing characters (the migration)
- Levels, gold, bags and gear all stay. Swords keep working (a warrior with their Chrono Blade is fine).
- **One free full refund** of skill points and AP when the new tree ships, with a banner saying so. The
  old skill ids map to their new homes where they still exist, so hotbars don't empty.
- High players will still be ahead; they just have to choose a branch like everyone else.

## The phases (each one shippable alone)
The G track still comes first where it says so; S0 is small enough to go in right away.
- [ ] **S0: close the boss faucet** (small): over-level EXP falloff and the per-player boss reward window.
      Must land **before the rebalance (R)**, because R raises boss EXP. Economy sheet: add a column for
      boss EXP inside the window.
- [ ] G5 (Keeper's Spine) as planned.
- [ ] **S1: wands and the Mage** (medium): the `wand` kind, wand tap, MAGIC from wands, a wand on every
      boss's drop table (art per boss, the biggest cost), starter and trader wands, weapon scrolls, the
      economy script learning wands. Do it **before R**, so R's "new copy of every boss item" pass copies
      the wands too instead of making them twice.
- [ ] **S2: the tree** (large): class trees from weapons, forks, advancements, the `spTotal` schedule,
      the node UI (desktop and phone), per-class hotbars, the one-time refund. Warrior and Mage only.
- [ ] R, the rebalance, as planned (now copies swords and wands).
- [ ] **S3: the Archer** (large): `bow` kind, arrows, the Archer tree, DEX's new job, Acorn's bows,
      bows on the drop tables (could ride along with R's new copies, or come right after).
- [ ] **S4: past the cap**: stat taper above the content's top, mastery stars, the advancement at Lv 150.
- [ ] Frostpeak's depth pass, as planned.

## Open decisions for the owner (recommended answer first)
1. **Class = the weapon you hold** (recommended), or a class picked at a trainer that changes with a
   visit? The weapon way needs no new UI and shows your class to everyone.
2. **Can classes mix?** Recommended: no class's active skills with another's weapon; only Guardian and
   Mobility are shared. (A "spellblade" hybrid could come later as its own fork.)
3. **Stat taper for levels past the content** (S4): apply it to everyone, which lowers today's Lv 300+
   characters somewhat (recommended: the game stays balanced for the next islands), or only for levels
   gained after it ships?
4. **Boss reward window length** (S0): about 10-15 minutes recommended; shorter keeps boss farming the best
   EXP, longer pushes people back to the open wilds.
5. **Archer now or after the mage fix?** Recommended: after (S3). Mages are the complaint today, and the
   archer reuses everything S1 and S2 build.
