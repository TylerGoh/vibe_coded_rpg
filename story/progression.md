# Classes and progression: the S track (plan)

**Status: plan, written 2026-10-23; S0, S1, L, R, S2 and S3 shipped 2026-10-23, S4 on 2026-10-24; S5–S6 not built yet.** Runs alongside the island-depth G track
(`world/island-depth.md`). Everything below is `[proposed]` until the owner settles the open decisions at
the bottom; the recommended answer is written in each time, so a session can start from it.

The owner asked for: mages feel neglected, no boss drops a magic weapon, an archer class, a Cleric class, the
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
- **Casual first** (owner, 2026-10-23). Changing class is a short walk home, never a grind: you keep
  your level and everything you own, and only your points start over. The weapon in your hands still
  shows your class to everyone at a glance.
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
  alone** (owner): a party makes it faster and safer, never possible-at-all. The capstones are
  extremely hard alone, but still not impossible.
- **Never take away what people earned.** Levels stay. Points get refunded and re-spent, never deleted.

## The design

### 1. Four classes, from three weapons
| weapon | class | main stat | role in a group |
|---|---|---|---|
| sword | **Warrior** | STR | catches anything and stays on it: holds the boss (Knight) or hits hardest up close (Berserker) |
| staff | **Mage** | INT | area damage, freezing and stunning, breaking magic shields |
| staff | **Cleric** | INT (and some LUK) | heals, shields, cleansing curses, reviving, summons |
| bow | **Archer** | DEX | steady damage from range, hitting what's high up or far away |
LUK stays the shared crit stat. DEX finally gets a job (today it only raises the minimum roll).

- **Everyone starts as a Novice** (owner, 2026-10-23, MapleStory's Beginner): no class, a few basic
  skills (the small Novice tree, `s2-plan.md`), any weapon. **At Lv 10 you choose your class** at the
  Rebirth Pool, free. Before Lv 10 the pool only tells you to come back at Lv 10.
- **You choose (and later change) your class at the Rebirth spot in Slimeville** (owner, 2026-10-23; below). Your class
  decides your tree and which weapon kind you can wield: Warrior a sword, Mage and Cleric a staff,
  Archer a bow. Other weapons stay in the bag for later.
- **Mage and Cleric share the staff** (owner, 2026-10-23), so there are only three weapon kinds to drop,
  price and draw. Friends tell the two apart at a glance: a Cleric gets a soft halo over its slime, a
  Mage a faint sparkle around its staff.
- Each class has its own tree. One small shared
  tree, **Mobility** (Dash, Flash Jump, Blink, Phantom Step), works with anything; the old Guardian tree is
  split between the Knight and the Cleric.
- Within your class, points can still be moved around for free at any time outside combat (the owner's
  "nobody stuck in a build"), including switching fork. Only changing **class** needs the Rebirth spot.

### 1a. Rebirth: changing class (owner, 2026-10-23)
- A place in **Slimeville** (built in S2.3, `s2-plan.md`: a **Rebirth Pool**, a softly glowing spring
  near Elder Mochi, who tends it and can chat about it; he already lives there and is chattable, so no
  new character is needed. Check `world/regions/greenhollow.md` and `world/atlas.md` before placing it).
- Walk up, press E (or tap; a prompt per `docs/ui/hints.md`), and a card lists the four classes with what
  each is good and bad at (section 1b). Choosing one: **your level, EXP, gold, bag, gear and house all
  stay; every skill point and AP is refunded; your hotbars empty**; you come out of the pool as the new
  class, with a splash and a sound everyone nearby sees.
- **Costs 500,000 coins for now; superseded: it will scale with level, `rebirthCost` in section L2** (owner, 2026-10-23; a constant like `REBIRTH_COST`, named in the
  economy sheet's sinks with no `aim`: it's a prestige sink, priced by the owner, not by the aim method).
  On 2026-10-23 only the three top characters (Lv 167+) held that much; mob farming alone earns about
  175k by Lv 80, so for most players it's a long goal, or a gift from a richer friend once trading
  exists (roadmap: trading comes first).
- The card shows the price and asks twice before taking the coins, since nothing is refunded.
- Only in Slimeville (owner). Other towns don't get one, which gives the home village a reason to visit.
- **New characters** start as Novices with the Wooden Sword (as today). At Lv 10 a banner and Elder
  Mochi point them at the pool, where the first choice is free. Until they choose, they stay Novices
  (nothing forces it, but class points can't be spent).
- The normal attack follows the class: sword swing (as now), **staff bolt** for a Mage (a short magic
  bolt on MAGIC), **holy bolt** for a Cleric (a golden staff bolt; a hit lands a small heal on the nearest
  hurt friend so attacking is never wasted; it was a close staff bonk until 2026-10-24, made ranged because
  a magic class's power is its spells and the normal attack is only for weaving between them), **bow shot** (an arrow to the first mob ahead in range).

### 1b. Balance: equal power, different shape
Each class is strong at two things, fine at one, bad at one:
| class | strong at | bad at | how it solos a boss |
|---|---|---|---|
| Warrior | toughness, damage up close, catching things | range: it has to be next to its target, and getting there takes busy hands | chases down, stays on top of the boss, heals a little from hitting (a lifesteal passive) |
| Mage | area damage and burst, control | toughness (least HP and DEF), runs out of MP | freezes and interrupts, Blinks out, kills fast before it gets hit much |
| Archer | steady single-target damage, range, moving | swarms of adds, toughness up close | keeps its distance, kites, Net Trap to stop chasers |
| Cleric | staying alive, helping others, summons | burst damage: kills slowest | can't really die: heals and shields itself while its summons hold the boss and **Smite** chips away |

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

### 1c. The Warrior: the chaser (owner, 2026-10-23)
"Close range but high mobility to catch, but it takes a lot of movement inputs." The Warrior's skill is
**getting there and staying there**: short, quick moves chained together, each one needing its own press.
The Archer moves too, but differently: a few long moves *away*. The Warrior makes many short ones *toward*.
- **Charge**: Dash toward a mob ahead; if it connects, the next hit is free and Dash's cooldown resets. A
  good warrior chains charge → hit → charge across a whole room.
- **Leap Slam**: in the air, Down + Attack drops straight down onto whatever's below (catching mobs on
  lower platforms, cancelling a fall).
- **Upward Cut**: Up + Attack carries you up with the swing, to reach mobs and weak points on a ledge
  above. This partly covers the Warrior's "bad at range" problem, but costs inputs and timing.
- **Momentum** (passive): every movement skill that ends in a hit stacks a short attack buff that drops
  if you stop moving. Rewards keeping the chain going instead of standing and swinging.
- **Hook** (Berserker or Knight, `[proposed]`): yank yourself to a mob up to a fair distance away, or
  (Knight) yank a mob to you, off a friend.
- **Netcode:** every one of these moves you, so it goes into `step()` in `src/shared/sim.js` from input
  bits, predicted like Dash and Blink (Agent.md's core rules). Hits stay client-decided and server-capped.
- **Phones:** the chains are built from buttons the touch layout already has (direction + Jump, Attack,
  Dash), never a new tiny button, and the timing windows are a bit forgiving for touch.

### 2. Staves and the Mage
- New item kind `staff` (shared with the Cleric): gives MAGIC (on the same frozen curve as sword ATK, so
  the economy sheet's `GEAR_FIT` check covers it) and a small MP bonus. Spell power and healing both
  become level + INT + **staff**.
- **Every den boss and field boss drops a staff**, themed like its sword (the Tidemother's coral staff,
  the Knotmole's root staff, Chronos's hourglass sceptre...). Pip sells a starter staff; branch traders
  sell one at their `aim` level.
- Scrolls: the sword scrolls become **weapon scrolls** (any weapon); the stat they add follows the weapon.
  Existing sword scrolls in bags just start working on staves and bows.
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
  rewards rhythm (e.g. **Arcane Charge**: each staff bolt stores a charge, the next big spell spends them for
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

### 5. The Cleric (the other staff class)
- Uses the same staves as the Mage (section 2): MAGIC drives its heals, shields and summons, so a good
  staff matters to both, and a staff drop is good news for either.
- Takes over from today's Magic and Guardian trees: Jelly Heal, Rally, Sanctuary, Aegis, Jelly Bubble
  (cast on a friend), Second Wind (on a friend). New: **Cleanse** (removes a boss's curse), **Revive**
  (gets a fainted friend up where they fell, with a long cooldown), **Mend Over Time** (a heal that ticks).
- **Summons** (owner, 2026-10-23). The Cleric calls helpers that fight beside it:
  - **Jelly Spirit**: a glowing slime ghost that bounces at the boss and **draws its attention** (mobs
    can target it), so a solo Cleric has something to hold the boss off it. This is the Cleric's main
    solo answer.
  - **Lantern Wisp**: floats by a friend and heals whoever stands near it.
  - **Guardian Totem**: planted on the ground; lowers damage for friends near it. Bosses can break it.
  - Rules: only a few out at once, they last a while then fade, they scale with MAGIC and the staff.
  - **Netcode:** summons are server-run like mobs (the server moves them and decides their hits), drawn
    by every client in the room; they'd join the snapshot as friendly entities. This is new plumbing:
    the biggest technical cost of the Cleric.
- Forks: **Priest** (big heals, Revive, Cleanse, the Lantern Wisp) or **Warden** (shields, the Jelly
  Spirit and Guardian Totem, Sanctuary, Aegis). Healing well is a skill about *when*: a shield before the ultimate is worth
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
  party and are **extremely hard without one** (owner, 2026-10-23): every mechanic switched on, little
  room for mistakes. A very strong player could still grind one down alone; it's never locked.
- **Scaling:** `BOSS_HP_PER_PLAYER` stays; on top, a mechanic only appears once enough slimes are there
  (no Taunt check when you're alone), so a solo player isn't punished for being alone.
- **Loot by class:** a boss's loot set includes one weapon, with the kind picked from the classes of the
  slimes who fought it, so every role sees drops for itself.
- **Retrofit:** today's nine dens and four field bosses each get one or two of the mechanics above, a boss
  at a time, in the same pass that gives them their staff and bow drops. New bosses (G5's Root Warden on)
  are designed around them from the start.

### 7. A real tree: advancements at widening gaps
Each class tree is drawn as connected nodes, not columns, and opens in **advancements** (MapleStory's
job advancements), at levels spaced further apart each time:
| advancement | opens at | what it brings |
|---|---|---|
| Novice | Lv 1 | the Novice tree (a few basic skills everyone keeps) and Mobility |
| 1st: the class | Lv 10 (at the Rebirth Pool, free) | the class's basic skills |
| 2nd | Lv 30 | the **fork**: choose one of two branches (listed per class above) |
| 3rd | Lv 60 | the branch's middle tier |
| 4th | Lv 100 | the branch's capstone skill (the big ultimate) |
| 5th | Lv 150 | mastery nodes: passives that change how skills behave, not just +% (S6) |

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
   power there. **Applies to everyone** (owner, 2026-10-23), so today's Lv 300+ characters lose some
   power when it ships; the banner that announces the refund should say so too.
4. **Past the last advancement: mastery stars.** Every N levels past the cap gives a star by your name
   and a cosmetic or comfort reward (an aura colour, a title, a bag row), not raw power.

### 9. Existing characters (the migration)
- Levels, gold, bags and gear all stay. Every existing character becomes a **Novice** (owner,
  2026-10-23) with **every skill point and AP refunded** and the skill hotbars cleared. Everyone Lv 10 and
  up gets a banner pointing them at the Rebirth Pool to choose a class, free.

## L: the levelling rebalance and the rollback (owner, 2026-10-23; shipped 2026-10-23, ahead of S2)
**Why.** After R, levels take about 1 minute each past Lv 30 (about 5 kills, flat all the way up), so the
whole game to Lv 200 is about 3 hours of farming and the advancements (section 7) land every ~30 minutes
instead of further apart. And the top characters (Lv 380+, mostly from Chronos farming before S0) are so far
above every mob that the over-level falloff means **they miss out on every older boss** (owner). So:
slow levelling down, and roll those characters back to where their play time would put them.

### L1: the new EXP curve
- **Target (owner): about 10 minutes of farming a level on average, slowing as you get stronger.** The
  curve is "A" (picked 2026-10-23 from three): minutes a level `0.5·L^0.65` up to Lv 100 (10 min at
  Lv 100), then `10·L/100` (20 min at Lv 200), but **never faster than today at any level** (today's early
  levels already take ~2 min, so Lv 1–15 barely change; a new player still chooses a class ~20 min in).
  Past Lv 200 it keeps growing at the same slope (nothing to fight there; S6's stars).
- Total farming time to reach: Lv 10 ~20 min, Lv 30 ~1.5 h, Lv 60 ~4.5 h, Lv 100 ~10 h, Lv 150 ~21 h,
  Lv 200 ~35 h. That makes section 7's advancement levels (10, 30, 60, 100, 150) widen in time as intended.
- **How:** only `expToNext` changes (in `src/shared/rpg.js`), fitted so `npm run economy`'s Progress table
  hits the targets above (`KILLS_PER_MIN` farming on the frozen curve). Mob HP, damage and EXP stay where R
  put them; the frozen curves are never refit. The sheet gains a check: minutes a level within a band of
  the target at each level (a `LEVEL_PACE` constant), so a later change can't quietly break it.
- Bosses: their EXP stays; the S0 camp check compares EXP an hour, which doesn't move. A boss kill becomes
  a smaller share of a level, which is fine: their worth is the loot and the fight.

### L2: prices in farming time (owner, 2026-10-23)
- **Gold an hour at each level stays as it is** (mob drops untouched; it already grows a lot with level:
  ~13k an hour at Lv 10, ~220k at Lv 60, ~450k at Lv 100, ~740k at Lv 150). Slower levels mean you stay at
  each level longer, not that a minute pays less.
- **Prices are set in minutes of farming at the level a thing is meant for** (its `aim`), not as a share
  of the gold earned by that level: with ~10x slower levels, saved-up gold grows ~10x and share-of-savings
  prices would all feel cheap (owner: "things shouldn't feel cheap"). Bands (constants in the sheet, values
  a starting point):
  | what | minutes of farming at its level |
  |---|---|
  | potions, pet food, seeds, small furniture | 1–3 |
  | bigger furniture | up to ~10 |
  | shop and trader gear, the smaller houses | 10–20 |
  | pets | ~20 at their boss's level, with a floor of ~15–20k so no pet is trivial (owner, 2026-10-23) |
  | the high end (big houses, top gear, the top pets) | ~30 |
- Most of today's gear and house prices already sit at 4–24 minutes, so they barely move. What changes: the
  sheet's `AIM_MIN` / `AIM_MAX` share check becomes a minutes-at-aim check per band; pets get aims (their
  boss's level) and are re-priced (Chronos's ~270k, down from 500k; the early ones down to the floor, which
  replaces the owner's earlier "around 50k a pet"); the Estate goes up to ~30 min, the Grand Estate down to
  ~30 min at Lv 120 (~210k); a few big furniture pieces go up.
- Run `npm run economy` before and after; say what moved (Agent.md).
- **Changing class costs more, and scales with your level** (owner, 2026-10-23): instead of a flat 500k,
  `rebirthCost(lvl)` = `REBIRTH_HOURS` (1, owner 2026-10-23) hour of farming gold at your level, from the sheet's gold a
  minute (`KILLS_PER_MIN` on the frozen curve; mirror it in `src/shared/rpg.js` as a small formula, and
  the sheet checks the two agree). That's about 13k at Lv 10, 220k at Lv 60, 450k at Lv 100,
  740k at Lv 150. The first choice at Lv 10 is still free. Replaces the flat `REBIRTH_COST` in
  section 1a and `s2-plan.md` (S2.1 builds the formula; the card shows your price).
- Run `npm run economy` before and after; say what moved (Agent.md).

### L3: the rollback (one time, in `load()`, behind a saved flag so it runs once per character)
- Each character's level is set to the level its **estimated play time** before 2026-10-23 gives on the
  new curve, taking the **lower end** of the estimate (owner), plus whatever its **recorded active play
  time** since then (`active`, `docs/combat/core.md`) gives on top, on the new curve. EXP to 0 within the
  new level. **chenyirong goes to darrell's level** (owner: botting).

  | character | level on 2026-10-23 | estimated play time | rolls back to (before adding recorded time) |
  |---|---|---|---|
  | chenyirong | 390 | (botting) | **Lv 57**, darrell's |
  | justin | 380 | 8–12 h | **Lv 87** |
  | darrell | 167 | 4–6 h | **Lv 57** |
  | tyler | 112 | 3–4 h | **Lv 48** |
  | qing | 81 | ~1.5 h | **Lv 32** |
  | wallace | 36 | ~45 min | **Lv 21** |
  | everyone else (Lv 10 or less) | | under 20 min | unchanged |
  (Estimates from 2026-10-23: account dates, chat activity, and the old pace of Lv 80 → 390 being about 3 h of
  Chronos farming. Play time wasn't recorded before that day.)
- **Kept:** gold, bag, gear and its scrolls, house, pets, cosmetics, waystones. Gear has no level
  requirement, so they'll be well geared for their new level, which is fine: they're replaying content they
  skipped. `bossAt` (S0's reward window) is cleared so every boss pays out again. Skill points and AP are
  refunded anyway (they shrink with the level).
- chenyirong keeps his gold and items (owner, 2026-10-23); only the level goes.
- A one-time banner explains it ("Levelling has been rebalanced: you're now Lv N, where your play time
  puts you. Everything you own is kept, and every boss is worth fighting again.").

### When it ships
- **Shipped on its own on 2026-10-23** (owner chose not to wait for S2): its own rollback notice, so S2's
  migration will be a second change with its own banner. Built as: `expToNext` and `LEVEL_MIN` in
  `src/shared/rpg.js` on the frozen curve (moved to `src/shared/curve.js`), `rebirthCost` and
  `REBIRTH_HOURS` there too (unused until S2.1), the bands in `scripts/economy.mjs`, the rollback in
  `load()` (`ROLLBACK`, `rollbackLevel`, the `lb` flag). Numbers and what moved: `docs/economy.md`.
- Was planned: **before S2, and in the same deploy as S2's deploy #1** (`s2-plan.md`), so players get one big change
  (new levels, Novices, the refund, the Rebirth Pool) with one banner, not two upheavals a few days apart.
  L can be built first and on its own (it touches `expToNext`, `scripts/economy.mjs`, prices and `load()`,
  not the skill code), then held until S2.1–S2.3 are ready.
- Split for agents: **L1+L3** together (the curve and the rollback, both in levels), **L2** after L1 (it
  needs the new Progress table). Same agent rules as `s2-plan.md`.

## The phases (each one shippable alone)
- [x] **S0: close the boss faucet** (shipped 2026-10-23): over-level EXP falloff, the per-player boss reward
      window (15 min). `docs/combat/bosses.md`, `docs/economy.md`.
- [x] G5 (Keeper's Spine, shipped 2026-10-23); the Root Warden is the first boss designed with the role mechanics
      in mind (`party` on its entry names them, for S5 to switch on; `docs/places/spine.md`).
- [x] **S1: staves and the Mage** (shipped 2026-10-23; `docs/combat/items.md`). Before classes, the weapon in
      your hand decides the normal attack; spell power never went down (staves only add). Was (medium): the `staff` kind, the staff bolt, MAGIC from staves, a staff
      on every boss's drops, starter and trader staves, weapon scrolls, the economy script learning
      staves. Before R, so R's "new copy of every boss item" pass copies the staves too.
- [x] **L: the levelling rebalance and the rollback** (shipped 2026-10-23, alone): L1 the EXP curve, L2
      prices in farming time, L3 rolling back the top characters. `docs/economy.md`, `docs/combat/core.md`.
- [x] **S2: the tree** (large; split into six agent-sized pieces in `s2-plan.md`; all deployed 2026-10-23), with the CLASSES table in `npm run economy`: the four class trees, the Rebirth spot, forks, advancements, the `spTotal` schedule, the
      node UI (desktop and phone), the one-time refund. Warrior (with the chase moves in `step()`) and Mage, with the mage
      combos (chill/freeze/shatter, burn/spread, Arcane Charge).
- [x] **S3: the Cleric** (shipped 2026-10-23; `docs/combat/skills.md`, "The Cleric"): the Cleric at the Rebirth Pool, the halo, the
      staff bonk (since a ranged holy bolt), the summons (server-run: `server/summons.js`), the tree (Smite, Jelly Heal, Jelly Spirit, Faith; Priest: Mend, the
      Lantern Wisp, Revive, Holy Power, Miracle; Warden: the Guardian Totem, Barrier, Spirit Bond, the Seraph), healing and
      damage taken on the damage meter. The Knight kept its Guardian skills (Sanctuary, Aegis, Bubble, Second Wind): the
      Cleric got its own instead of taking them, so S2's Knight didn't change. Cleanse waits for S5's curses.
- [x] R, the rebalance (shipped 2026-10-23, before S2: it copied swords and staves; `docs/combat/items.md`).
- [x] **S4: the Archer** (shipped 2026-10-24; `docs/combat/skills.md`, "The Archer"; bows in `docs/combat/items.md`):
      a bow twin for every staff-twinned sword (drops pick among three kinds), the bow shot, DEX as the bow's
      STR, the tree (Double Shot, Retreat Shot, Keen Eye, Steady Hands, Evasion; Sniper: Snipe, Piercing Arrow,
      Deadeye, Hunter's Mark, Heartseeker; Trapper: Arrow Rain, Net Trap, Barbed Arrows, Trap Mastery, Thousand
      Arrows), Acorn the archers' trader, the CLASSES tables. Weak points wait for S5.
- [ ] **S5: bosses that need a party**: the mechanics in the table above (Taunt, pulses, curses, barriers,
      weak points, armour), retrofitted a boss at a time, loot by class, and **the status box** (every buff
      and curse on you, as icons with timers; owner, 2026-10-24). Split into five pieces in `s5-plan.md`.
- [ ] **S6: past the cap**: stat taper, mastery stars, the advancement at Lv 150.
- [ ] Frostpeak's depth pass, as planned (its bosses designed for mixed parties from the start).

## Decisions
Settled by the owner (2026-10-23):
- Capstone bosses: extremely hard without a mixed party, not locked. Dens and field bosses: any class solos.
- Stat taper past the content: for everyone.
- Mage and Cleric share the staff.
- Everyone starts as a Novice and chooses a class at Lv 10 (owner, 2026-10-23). Class is chosen at the
  Rebirth spot in Slimeville: the first choice free, every change after 500k coins for now, keeps your
  level, resets all AP and skill points. A class's skills only work with its own weapon; only Mobility is shared.

Settled by the owner (2026-10-23, "all these look good"): the two below, as recommended.
Still open (recommended answer first; a session can start from it): none.
1. ~~Boss reward window~~ (S0): shipped at 15 min (`BOSS_WINDOW_MS`), easy to change if it feels harsh.
2. ~~The Rebirth spot's name and keeper~~: **a Rebirth Pool tended by Elder Mochi** (settled).
3. ~~A free first choice?~~ **Yes** (settled; superseded in part: everyone is now a Novice until they choose at Lv 10). At
   500k, a Lv 30 who wants to be a Mage can't afford it for a very long time. Recommended: each
   character's **first** rebirth is free (the migration and new players pick once at no cost), and every
   change after that costs the 500k.
