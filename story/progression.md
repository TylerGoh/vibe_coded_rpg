# Classes and progression: the S track (plan)

**Status: plan, written 2026-10-23, nothing built yet.** Runs alongside the island-depth G track
(`world/island-depth.md`). Everything below is `[proposed]` until the owner settles the open decisions at
the bottom; the recommended answer is written in each time, so a session can start from it.

The owner asked for: mages feel neglected, no boss drops a wand, an archer class, a Cleric class, the
skills as a real tree instead of a list, high-level rewards spaced further apart, and bosses that are
really hard without a mix of classes. They share one root, so this is one plan.

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
5. **Every class fights every boss the same way.** One person with everything can solo any den, so
   there's no reason to bring friends of a different kind.

## Game design principles this plan uses (the short version, for the owner)
- **Identity comes from what you give up.** A class feels like a class only when picking it means not
  having something else. Free respec is fine (the owner's "nobody stuck in a build" stays); what has to
  go is *having everything at once*. So: more tree than any one character can fill.
- **Loot has to speak to every class.** If a drop is useless to a quarter of the players, that quarter
  feels forgotten. Every boss drops something for each class.
- **You are what you hold.** In a game where you see your friends, the clearest class signal is the
  weapon in their hands. Tying the class to the weapon needs no new menus and reads at a glance.
- **Rewards should get rarer and bigger as you go.** Early levels come fast and each gives a little.
  Later, the gaps widen but each milestone is a real event: a new tier of the tree, a new choice, a
  visible change.
- **Power should come from choices and gear, not just the level number.**
- **Close the faucet before adding rewards.** The fastest source of EXP decides how the whole game plays.
- **Skill = good decisions under pressure, visible to others.** A class is skilful when a good player
  and a new one get clearly different results from the same buttons (timing, positioning, order), and
  the difference shows on screen. Not more buttons, and never precision aiming a phone can't do.
- **Roles need a job only they do best, not a job only they can do.** Bosses ask questions each class
  answers best; another class can still answer slowly (potions, kiting, a longer fight). A hard lock
  ("no Cleric, no kill") breaks a small friend group on a night when the Cleric isn't online.
- **Equal power, different shape** (owner, 2026-10-23: "no class should be weaker and yet they all have
  something they're bad at"). Every class gets the same total budget, spent differently: strong in one
  place means weak in another. And **every class, even the Cleric, can clear bosses at its own level
  alone** (owner): a party makes it faster and safer, never possible-at-all, except the capstones.
- **Never take away what people earned.** Levels stay. Points get refunded and re-spent, never deleted.

## The design

### 1. Four classes, each from a weapon
| weapon | class | main stat | role in a group |
|---|---|---|---|
| sword | **Warrior** | STR | holds the boss's attention (Knight) or hits hardest up close (Berserker) |
| wand | **Mage** | INT | area damage, freezing and stunning, breaking magic shields |
| bow | **Archer** | DEX | steady damage from range, hitting what's high up or far away |
| staff | **Cleric** | INT (and some LUK) | heals, shields, cleansing curses, reviving |
LUK stays the shared crit stat. DEX finally gets a job (today it only raises the minimum roll).

- Each class has its own tree. **Its active skills only work with that weapon in hand.** One small shared
  tree, **Mobility** (Dash, Flash Jump, Blink, Phantom Step), works with anything; the old Guardian tree is
  split between the Knight and the Cleric.
- Changing class = equipping another weapon. Allowed anywhere outside combat rooms, free, instant. Each
  class remembers its own points and hotbar, so a friend can keep a Cleric build and a Warrior build and
  swap in town before a boss, depending on who else turned up.
- The normal attack follows the weapon: sword swing (as now), **wand tap** (a short magic bolt on MAGIC),
  **bow shot** (an arrow to the first mob ahead in range), **staff bonk** (weak, close; a Cleric's damage
  isn't the point, but a hit lands a small heal on the nearest hurt friend so attacking is never wasted).

### 1b. Balance: equal power, different shape
Each class is strong at two things, fine at one, bad at one:
| class | strong at | bad at | how it solos a boss |
|---|---|---|---|
| Warrior | toughness, damage up close | range: weak points up high, bosses that keep away | stands in and trades hits; heals itself a little from hitting (a lifesteal passive) |
| Mage | area damage and burst, control | toughness (least HP and DEF), runs out of MP | freezes and interrupts, Blinks out, kills fast before it gets hit much |
| Archer | steady single-target damage, range, moving | swarms of adds, toughness up close | keeps its distance, kites, Net Trap to stop chasers |
| Cleric | staying alive, helping others | burst damage: kills slowest | can't really die: heals and shields itself through everything while **Smite** chips away |

- **The Cleric solos on sustain.** Its own damage is real but lower (holy spells, **Smite**: hits that
  also heal it, so attacking keeps it alive), and it almost never needs a potion. It takes longer; it
  never loses. In a group, its heals matter far more than its damage, which is the trade.
- **Both branches of every class can solo** (Priest and Warden, Knight and Berserker, ...). A fork changes
  how you win, never whether you can.
- **Every class carries an answer to every boss mechanic**, even if it's a poor one (section 6's "without
  that class" column): Mobility i-frames for ultimates, kiting for curses, jumping for weak points. And
  **brewed potions** give everyone a backup answer (a Cleansing Tonic for curses, a Barrier Draught for
  pulses: new recipes at the alchemy lab, `docs/places/alchemy.md`).
- **Measured, not guessed.** `npm run economy` gains a CLASSES table: for each class and branch, with gear
  on the frozen curve and a sensible build at each level, its damage a second (single target and in a
  crowd), its toughness (HP × DEF × healing), and the **time to solo each den at the den's level**. Checks:
  every class's solo time within a set band of the others (a `CLASS_FIT` constant), and each class's
  "bad at" really lower than the others'. Any skill number change re-runs it, like gold today.
- **Real fights will disagree with the sheet.** After each class ships, watch which class people pick and
  the damage meter (damage, healing, damage taken), and nudge numbers. Expect a few rounds.

### 2. Wands and the Mage
- New item kind `wand`: gives MAGIC (on the same frozen curve as sword ATK, so the economy sheet's
  `GEAR_FIT` check covers it) and a small MP bonus. Spell power becomes level + INT + **wand**.
- **Every den boss and field boss drops a wand**, themed like its sword (the Tidemother's coral wand, the
  Knotmole's root wand, Chronos's hourglass sceptre...). Pip sells a starter wand; branch traders sell one
  at their `aim` level.
- Scrolls: the sword scrolls become **weapon scrolls** (any weapon); the stat they add follows the weapon.
  Existing sword scrolls in bags just start working on wands, bows and staves.
- Forks: **Elementalist** (fire: big area damage, burn) or **Frostbinder** (ice and storm: freezing,
  stunning, interrupting).

### 3. How the Mage is made skilful
How games usually do it, and which fit Slimeville (a phone-friendly side view where hits are auto-aimed
at "the first mob ahead"):
- **Fragile power: positioning is the skill.** Mages hit hardest but have the least HP and DEF, so the
  skill is standing in the right place: at range, behind the Knight, ready to Blink out. Already supported
  by Mobility.
- **Elements that combo (the main one).** Spells leave a state on a mob and other spells cash it in:
  frost **chills** (slow) → a second frost spell **freezes** (stops it, and its next big move is cancelled)
  → a fire spell on a frozen mob **shatters** it for a big bonus. Fire **burns**; storm on a burning mob
  **spreads** the fire. The order you cast in decides your damage, and other players can see the ice and
  the flames. Mobs and bosses show the state on their body (art), so a good mage is readable to friends.
- **MP is a real budget.** Spells cost enough that spamming your best one runs you dry; a passive
  rewards rhythm (e.g. **Arcane Charge**: each Wand Tap stores a charge, the next big spell spends them for
  extra damage), so a good mage weaves cheap hits between expensive ones instead of mashing.
- **Delayed spells you lead.** Meteor already lands 0.8 s later: a good mage casts it where the boss will
  be, not where it is. More spells like that (a falling icicle, a lightning rune on the floor that strikes
  whatever walks over it) reward reading the boss's pattern, with no aiming needed.
- **Interrupts.** Bosses wind up their ultimates (`ULT_WARN`). A Frostbinder's freeze, cast inside that
  window, cancels or weakens it. That's the mage's moment in a boss fight, and it's pure timing.
- **Channelled spells with a risk.** A few strong spells that keep working while you hold still (a
  beam, a blizzard). Moving or getting hit stops them. Big payoff if you read when it's safe to stand.
  (Netcode: the server checks you haven't moved; movement itself stays in `step()`.)
- **Avoid:** free mouse-aimed skillshots (hopeless on a phone), cast bars on every spell (feels slow and
  clunky in a jumpy platformer), and anything that's only skilful because it's confusing.

### 4. Bows and the Archer
- New item kind `bow`: ATK on the sword curve, a long reach, lower base so range is paid for.
- Arrows are aimed by the client like every other hit (`docs/combat/core.md`: client-decided,
  server-capped hits; the cap needs the bow's range).
- **Ranger Acorn** (the Canopy) is the archers' trader: she lives in the trees and a bow suits her. Pip
  sells a starter bow. Bosses drop bows too.
- Forks: **Sniper** (Snipe, Piercing Arrow, weak-point crits) or **Trapper** (Arrow Rain, Net Trap, slows).
  Skill: the Archer is the class that hits **weak points** (below) and keeps moving (Retreat Shot fires
  while dashing away, reusing the `DASH` physics).

### 5. Staves and the Cleric
- New item kind `staff`: gives MAGIC (healing scales with it) on the same curve as a wand, a bit less
  damage. Clerics heal with MAGIC so a good staff matters.
- Takes over from today's Magic and Guardian trees: Jelly Heal, Rally, Sanctuary, Aegis, Jelly Bubble
  (cast on a friend), Second Wind (on a friend). New: **Cleanse** (removes a boss's curse), **Revive**
  (gets a fainted friend up where they fell, with a long cooldown), **Mend Over Time** (a heal that ticks).
- Forks: **Priest** (big heals, Revive, Cleanse) or **Warden** (shields and wards: absorbs damage before
  it lands, Sanctuary, Aegis). Healing well is a skill about *when*: a shield before the ultimate is worth
  three heals after it.
- Lore `[proposed]`: Auntie Clover or Elder Mochi as the Clerics' trader, whichever fits their persona.
- Clerics need recognition: the damage meter (`docs/combat/bosses.md`) also shows **healing done** and
  **damage taken** (for the Knight), so the support roles see their part.

### 6. Bosses that need a party
Each boss asks a few of these questions. The class in brackets answers it best; the others can answer
it badly (potions, running, a much longer fight).
| boss mechanic | answered best by | without that class |
|---|---|---|
| **Crushing focus**: the boss locks onto one slime with heavy hits | Knight (Taunt holds the boss on them, they have the DEF) | the boss bounces between squishy players |
| **Room-wide pulses**: damage nobody can dodge, every few seconds | Cleric (heals, shields before the pulse) | everyone drinks potions on cooldown |
| **Curses**: a stacking debuff that gets worse until removed | Cleric (Cleanse) | wait it out at range, losing damage |
| **Magic barrier**: a phase where physical hits do little | Mage (spells break it) | a long, slow phase |
| **Ultimate wind-up**: a huge move after a warning | Mage (Frostbinder freezes it) | dodge with Mobility i-frames, as now |
| **Weak points up high**: a crystal on the boss's back, a nest on a ledge | Archer (range, Piercing Arrow) | jump for it under fire |
| **Adds**: a swarm of small mobs | Mage (area damage), Trapper | the swarm chews through the healer |
| **Armour phase**: only heavy single hits crack the shell | Berserker | a long, slow phase |

- **How hard:** den and field bosses stay doable **alone, by any class** (owner), at the boss's level,
  just slower and riskier without the right classes. The **capstone bosses** (one per island, `world/island-depth.md`) are built for a full mixed
  party: in practice not doable without most roles. That's the endgame for groups.
- **Scaling:** `BOSS_HP_PER_PLAYER` stays; on top, a mechanic only appears once enough slimes are there
  (no Taunt check when you're alone), so a solo player isn't punished for being alone.
- **Loot by class:** a boss's loot set includes one weapon, with the kind picked from the classes of the
  slimes who fought it, so every role sees drops for itself.
- **Retrofit:** today's nine dens and four field bosses each get one or two of the mechanics above, a boss
  at a time, in the same pass that gives them their wand/bow/staff drop. New bosses (G5's Root Warden on)
  are designed around them from the start.

### 7. A real tree: advancements at widening gaps
Each class tree is drawn as connected nodes, not columns, and opens in **advancements** (MapleStory's
job advancements), at levels spaced further apart each time:
| advancement | opens at | what it brings |
|---|---|---|
| 1st: the class | Lv 1 (pick your weapon) | the class's basic skills |
| 2nd | Lv 10 | the **fork**: choose one of two branches (listed per class above) |
| 3rd | Lv 30 | the branch's middle tier and a smaller second fork |
| 4th | Lv 60 | the branch's capstone skill (the big ultimate) |
| 5th | Lv 100 | mastery nodes: passives that change how skills behave, not just +% |
| 6th | Lv 150 | the second capstone [proposed: lands with the rebalanced late islands] |

- **Forks** are the "giving something up" part: points go into one branch at a time (free to switch,
  outside combat).
- **No quests** (owner, island-depth plan): an advancement simply opens when you reach the level, with a
  banner and a sound. A class trainer can say something about it in chat, but there's nothing to fetch.
- **Points:** `spTotal` becomes a schedule: one per level early, then fewer per level but a lump at each
  advancement, ending where the content ends (Lv 200 after the rebalance). Sized so a character fills its
  branch and some of Mobility, never everything. AP stay at `AP_PER_LVL` (steady small rewards per level).
- **Mobile:** the node tree has to work on a phone (`docs/ui/mobile.md`): one tree per tab, nodes big
  enough to tap, a node's card opening below it.

### 8. Levelling: closing the faucet, then spacing the rewards
1. **Over-level EXP falloff.** A mob or boss more than a few levels below you gives less EXP, down to a
   small floor. Doesn't touch anyone fighting at their own level, so the Progress table is unchanged.
2. **Boss rewards once per window.** Bosses still respawn every minute, but each player gets full EXP and
   a loot roll from a given boss once per reward window (10-15 min); kills inside it give a small share.
3. **Stat growth tapers past the content** (above Lv 200 after the rebalance): gear and the tree decide
   power there. **This lowers the current Lv 300+ players a bit**: owner decision below.
4. **Past the last advancement: mastery stars.** Every N levels past the cap gives a star by your name
   and a cosmetic or comfort reward (an aura colour, a title, a bag row), not raw power.

### 9. Existing characters (the migration)
- Levels, gold, bags and gear all stay. Swords keep working.
- **One free full refund** of skill points and AP when the new tree ships, with a banner saying so. Old
  skill ids map to their new homes where they still exist, so hotbars don't empty.

## The phases (each one shippable alone)
- [ ] **S0: close the boss faucet** (small): over-level EXP falloff, the per-player boss reward window.
      Before the rebalance (R), because R raises boss EXP.
- [ ] G5 (Keeper's Spine) as planned; the Root Warden is the first boss designed with the role mechanics
      in mind (built so they can be switched on in S5).
- [ ] **S1: wands and the Mage** (medium): the `wand` kind, Wand Tap, MAGIC from wands, wands on every
      boss's drops, starter and trader wands, weapon scrolls, the economy script learning wands. Before R,
      so R's "new copy of every boss item" pass copies the wands too.
- [ ] **S2: the tree** (large), with the CLASSES table in `npm run economy`: class trees from weapons, forks, advancements, the `spTotal` schedule, the
      node UI (desktop and phone), per-class hotbars, the one-time refund. Warrior and Mage, with the mage
      combos (chill/freeze/shatter, burn/spread, Arcane Charge).
- [ ] **S3: the Cleric** (medium): the `staff` kind, the Cleric tree (mostly today's heal and Guardian
      skills moved and extended: Cleanse, Revive), healing and damage-taken on the damage meter.
- [ ] R, the rebalance, as planned (copies swords, wands and staves).
- [ ] **S4: the Archer** (large): `bow` kind, arrows, the Archer tree, DEX's new job, Acorn's bows.
- [ ] **S5: bosses that need a party**: the mechanics in the table above (Taunt, pulses, curses, barriers,
      weak points, armour), retrofitted a boss at a time, loot by class.
- [ ] **S6: past the cap**: stat taper, mastery stars, the advancement at Lv 150.
- [ ] Frostpeak's depth pass, as planned (its bosses designed for mixed parties from the start).

## Open decisions for the owner (recommended answer first)
1. **Class = the weapon you hold** (recommended), or a class picked at a trainer?
2. **Can classes mix?** Recommended: no class's active skills with another's weapon; only Mobility shared.
3. **The capstone bosses:** settled that every class can solo dens and field bosses at their level. Should the
   one capstone per island be the exception, built for a full mixed party (recommended), or soloable too?
4. **Stat taper past the content** (S6): for everyone, which lowers today's Lv 300+ characters somewhat
   (recommended), or only for levels gained after it ships?
5. **Boss reward window** (S0): 10-15 minutes recommended.
6. **Cleric's weapon:** a staff (recommended: clear at a glance), or something softer like a bell?
