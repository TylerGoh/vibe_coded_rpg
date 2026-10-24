# Classes and progression: the S track

**Status (2026-10-24): S0–S4, L and R shipped; S5 and S6 are next.** This is the design the class code is
built on: code comments cite its section numbers (1b, 1c, 3–7, L1–L3), so keep them. The finished parts
of the plan (the measurements that started it, L1–L3 in full, the migration, the settled decisions) are in
`archive/progression-full.md`. How the classes work today: `docs/combat/skills.md`.

The owner asked for: mages that don't feel neglected, magic weapons from bosses, an Archer, a Cleric, a
real skill tree, high-level rewards spaced further apart, and bosses that are really hard without a mix
of classes.

## Principles (for the owner and every builder)
- **Identity comes from what you give up.** More tree than any one character can fill. Free respec stays
  (the owner's "nobody stuck in a build"); having everything at once goes.
- **Loot speaks to every class.** Every boss drops something for each class.
- **Casual first** (owner). Changing class is a short walk home, never a grind: level and belongings stay.
- **Rewards get rarer and bigger as you go**, and power comes from choices and gear, not just the level.
- **Close the faucet before adding rewards.** The fastest EXP source decides how the game plays.
- **Skill = good decisions under pressure, visible to others** (timing, positioning, order), never
  precision aiming a phone can't do.
- **Roles have a job they do best, never a job only they can do.** No "no Cleric, no kill".
- **Equal power, different shape** (owner: "no class should be weaker and yet they all have something
  they're bad at"). **Every class, even the Cleric, can clear bosses at its own level alone** (owner); the
  capstones are extremely hard alone, but not impossible.
- **Never take away what people earned.** Levels stay; points get refunded and re-spent.

## The design

### 1. Four classes, from three weapons
| weapon | class | main stat | role in a group |
|---|---|---|---|
| sword | **Warrior** | STR | catches anything and stays on it: holds the boss (Knight) or hits hardest up close (Berserker) |
| staff | **Mage** | INT | area damage, freezing and stunning, breaking magic shields |
| staff | **Cleric** | INT (and some LUK) | heals, shields, cleansing curses, reviving, summons |
| bow | **Archer** | DEX | steady damage from range, hitting what's high up or far away |

LUK is the shared crit stat. Everyone starts as a **Novice** and chooses a class at Lv 10 at the
**Rebirth Pool** in Slimeville (Elder Mochi tends it; only in Slimeville, owner). The first choice is
free; later changes cost `rebirthCost` (section L2). Your class decides your tree and the one weapon kind
your skills work with; only **Mobility** is shared. Points within a class move freely outside combat.
Mage and Cleric share the staff (owner); a Cleric shows a halo, a Mage a sparkle round the staff.

### 1b. Balance: equal power, different shape
| class | strong at | bad at | how it solos a boss |
|---|---|---|---|
| Warrior | toughness, damage up close, catching things | range: it has to be next to its target, and getting there takes busy hands | chases down, stays on top of the boss, heals a little from hitting |
| Mage | area damage and burst, control | toughness (least HP and DEF), runs out of MP | freezes and interrupts, Blinks out, kills fast before it gets hit much |
| Archer | steady single-target damage, range, moving | swarms of adds, toughness up close | keeps its distance, kites, Net Trap to stop chasers |
| Cleric | staying alive, helping others, summons | burst damage: kills slowest | can't really die: heals and shields itself while its summons hold the boss and Smite chips away |

- **The Cleric solos on sustain:** it takes longer, it never loses.
- **Both branches of every class can solo.** A fork changes how you win, never whether you can.
- **Every class carries an answer to every boss mechanic**, even a poor one (section 6), and **brewed
  potions** give everyone a backup (a Cleansing Tonic for curses, a Barrier Draught for pulses:
  `docs/places/alchemy.md`, to build in S5).
- **Measured, not guessed:** the CLASSES tables in `npm run economy` (`CLASS_FIT`, `BAD_AT`;
  `docs/economy.md`). Any skill number change re-runs it.
- **Real fights will disagree with the sheet.** Watch who picks what and the damage meter, and nudge.

### 1c. The Warrior: the chaser (owner)
"Close range but high mobility to catch, but it takes a lot of movement inputs." Many short moves
*toward* the target, each its own press: Charge, Leap Slam, Upward Cut, Momentum (all built,
`docs/combat/skills.md`). Not built: **Hook** `[proposed]` (yank yourself to a mob, or, as a Knight, a mob
to you). Anything that moves you goes in `step()`; chains use buttons phones already have.

### 2. Staves and the Mage
Built in S1/S2 (`docs/combat/items.md`, `docs/combat/skills.md`): staves give MAGIC on the sword curve,
every boss drops one, weapon scrolls work on any weapon, forks Elementalist (fire) and Frostbinder (ice).

### 3. How the Mage is made skilful
- **Fragile power:** positioning is the skill (range, behind the Knight, Blink out).
- **Elements that combo** (built, S2.6): chill → freeze → shatter, burn → spread, visible on the mob.
- **MP is a budget;** Arcane Charge rewards weaving cheap bolts between big spells (built).
- **Delayed spells you lead** (Meteor lands late: cast where the boss will be).
- **Interrupts** (S5): a Frostbinder's freeze inside a boss's `ULT_WARN` window cancels or weakens the
  ultimate. The freeze already reaches bosses (`FREEZE_BOSS`).
- **Channelled spells with a risk** `[proposed]`: strong while you hold still; moving or a hit stops them.
- **Avoid:** mouse-aimed skillshots, cast bars on every spell, anything skilful only because it's confusing.

### 4. Bows and the Archer
Built in S4: bows on the sword curve with a long reach, client-aimed and server-capped like every hit;
Ranger Acorn is the archers' trader. Forks Sniper and Trapper. The Archer's job in S5: **weak points**
(Deadeye and Hunter's Mark are built to pay off there).

### 5. The Cleric
Built in S3: staff-based heals, shields, Revive, server-run summons (`server/summons.js`), healing and
damage taken on the damage meter; forks Priest and Warden. Waiting for S5: **Cleanse** (needs curses).
`[proposed]`: Auntie Clover or Elder Mochi as the Clerics' trader.

### 6. Bosses that need a party (S5)
Each boss asks a few of these questions. The class in brackets answers it best; the others answer it
badly (potions, running, a much longer fight).
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

- **How hard:** dens and field bosses stay doable **alone, by any class** (owner), just slower without the
  right classes. The **capstones** (one per island: the Root Warden, Sigrun, later Brenna) are built for a
  full mixed party and are **extremely hard without one** (owner), but never locked.
- **Scaling:** `BOSS_HP_PER_PLAYER` stays; a mechanic only appears once enough slimes are there, so a solo
  player isn't punished for being alone.
- **Loot by class:** a boss's loot includes one weapon, its kind picked from the classes who fought it.
- **Retrofit:** the older dens and field bosses each get one or two mechanics, a boss at a time. The
  capstones already name theirs (`party` on their entries).
- **The status box** (owner, 2026-10-24): every buff and curse on you, as icons with timers.
- Cut into five agent-sized pieces: `s5-plan.md`.

### 7. A real tree: advancements at widening gaps
| advancement | opens at | what it brings |
|---|---|---|
| Novice | Lv 1 | the Novice tree and Mobility |
| 1st: the class | Lv 10 (at the Rebirth Pool, free) | the class's basic skills |
| 2nd | Lv 30 | the **fork**: one of two branches |
| 3rd | Lv 60 | the branch's middle tier |
| 4th | Lv 100 | the branch's capstone skill |
| 5th | Lv 150 | mastery nodes: passives that change how skills behave (S6) |

**No quests** (owner): an advancement opens at its level with a banner. The point schedule is sized so a
character fills its branch and some of Mobility, never everything (`spClass`, `SP_CAP_LVL`).

### 8. Levelling past the content (S6)
Built (S0): the over-level EXP falloff and the per-player boss reward window (`BOSS_WINDOW_MS`,
`docs/combat/bosses.md`). Still to build:
- **Stat growth tapers past the content** (above Lv 200): gear and the tree decide power there. **Applies
  to everyone** (owner), so today's highest characters lose a little; the banner should say so.
- **Mastery stars:** every N levels past the cap gives a star by your name and a cosmetic or comfort
  reward (an aura colour, a title, a bag row), not raw power. Plus the 5th advancement at Lv 150.

## L: the levelling pace, prices and the rollback (shipped 2026-10-23)
In full, with the rollback table: `archive/progression-full.md`. What a builder needs:
- **L1, the curve** (owner): about 10 minutes of farming a level on average, slowing as you go (Lv 100 in
  ~10 h, Lv 200 in ~35 h). Only `expToNext` encodes it (`LEVEL_MIN`, checked by `LEVEL_PACE`).
- **L2, prices in farming time** (owner: "things shouldn't feel cheap"): a thing costs a number of
  minutes of farming at its `aim` level, by band (potions and small things 1–3, gear and small houses
  10–20, pets ~20, the high end ~30). Class changes cost `REBIRTH_HOURS` of farming at your level
  (`rebirthCost`). Method and bands: `docs/economy.md`.
- **L3, the rollback:** a one-time move of the top characters to the level their play time gives (the `lb`
  flag, `rollbackLevel`). Done; don't run it again.

## Phases
Done: S0, S1, L, R, S2, S3, S4 (one line each in `done.md`).
- [ ] **S5: bosses that need a party** (section 6), with loot by class and the status box. Plan:
      `s5-plan.md`.
- [ ] **S6: past the cap** (section 8): stat taper, mastery stars, the Lv 150 advancement.

## Open decisions
None. Settled ones are in `archive/progression-full.md`.
