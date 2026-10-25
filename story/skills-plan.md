# SP: the skill pool (plan)

**Status: SP1–SP4 live (SP4, the Cleric, 2026-10-25). SP5 next.** Written 2026-10-24 (owner's ask). Comes first on the roadmap, ahead of
Greenhollow's final boss. Builds on the class design in `progression.md` (sections 1b, 1c, 3–7) and on how
skills work today (`docs/combat/skills.md`). Read both first. Names here are working names; numbers live
in `src/shared/skills.js` and are set by `npm run economy` (`CLASS_FIT`, `BAD_AT`), never guessed here.

## The owner's ask (2026-10-24)
- "It has very little skills." The pool is too small: most branches get one or two skills at Lv 60 and a
  single capstone at Lv 100, and the Knight and the Cleric have no way to hit a crowd before Lv 100.
- **Every class gets mobbing skills.** **Mages should be best at mobbing without moving around much.**
- **Every class gets buffs and cool passives.**
- **Every advancement brings its own staple skills**, so reaching Lv 30, 60 or 100 changes what's on
  your hotbar, MapleStory style.
- **The hotbar stays as it is: "I want the player to figure out how to do this."** No more slots and no
  buff bar. Fitting more skills than slots is the player's puzzle: long buffs, the two setups (swapped
  only from the Esc menu, unchanged), and the new casting from the K panel (below).
- **"Let them cast directly from skills":** a skill can be cast from its card in the K panel without
  being on the hotbar (below).

## Rules for every new skill
1. **Staples at every advancement.** Every branch, at each of Lv 30, 60 and 100, gets a **mobbing staple**
   (hits a crowd) and a **single-target staple** (for bosses), each stronger than the tier before, so the new
   one replaces the old on the hotbar. The basics (Lv 10) get the same pair. Where a branch already has a
   skill that fills a slot, it stays and nothing new is added for that slot.
2. **Each class mobs in its own way** (the "how it mobs" lines below). The Mage clears a pack from where it
   stands: big areas at range, and fields that stay on the ground. The Warrior has to move into the pack, the
   Archer clears in lines and volleys, and the Cleric uses summons and holy ground (slowest, never in danger).
3. **Buffs are long** (minutes, not seconds): cast once before a fight, from the K panel if you like, so
   they don't need a hotbar slot. Short combat buffs (Berserk, Rally) stay short; they're timing skills.
   A long buff lasts through room changes and ends when you faint, change class or log off. Every class gets at
   least one long buff that also helps friends nearby, so a party wants one of each class.
4. **Passives change how you play, not only +%.** Examples: a kill refunds a cooldown, a dying mob
   explodes, a stored hit gets released. Some plain +% passives stay where they already are; the new ones
   should change what you do.
5. **Reuse the existing kinds** (`strike`, `cleave`, `spin`, `storm`, `bolt`, `fireball`, `nova`, `chain`,
   `meteor`, `starfall`, `shot`, `pierce`, `rain`, `summon`, `zone`, `buff`, `heal`, `barrier`) wherever one
   fits. Only a few new kinds are needed: SP1 lists them.
6. **No new hard counters.** A new skill can make a class better at its job, never the only answer to a
   boss mechanic (`progression.md` section 6). Nothing moves your slime outside `step()`.
7. **Identity from what you give up still holds.** With this many skills, `spRoom` grows, so the two points
   a level no longer cover every rank at once. That's on purpose: you choose, then Reset all is free.

## Casting from the K panel (owner)
- The skill card in the K panel gets a **Cast** button next to + / − / Hotbar for every active skill you
  hold. It sends the same `{t:'skill'}` the hotbar does (the server never checks the hotbar), so MP,
  cooldowns, combat rooms only and every refusal work unchanged. Outside a combat room the button is greyed
  ("Only in combat areas").
- Desktop: double-clicking a node casts it too. Phones: the Cast button, 44 px like the others.
- The panel stays open after casting (to cast three buffs in a row), and the node shows its cooldown sweep.
- The point: buffs live in the tree, so the bar can be all attacks. Players work out their own setup.

## The new skills, class by class
"have" = already built and kept. **Bold** = new. Each row is one advancement. A dash means nothing new is
needed there (or the skill is already in another column).

### Warrior: how it mobs
Into the pack: spins, slams and pulls, every one of them up close. The Knight gathers the pack (and taunts
it) for the party; the Berserker gets inside it and carves it up. A Warrior moves the most of any class while
mobbing, which is its "busy hands" (1c).

| adv | mobbing staple | single-target staple | buff | passive |
|---|---|---|---|---|
| 10 basics | Cleave (have; more targets with rank) | Power Strike (have) | **War Cry**: long, +ATK for you and friends near | Iron Jelly, Jelly Thirst, Momentum (have); the chase moves (have) |
| 30 Knight | **Ground Shake**: slams the floor; every mob around is dragged a little toward you and taunted | **Shield Bash**: a hit that stuns an ordinary mob briefly | Rally, Jelly Bubble (have) | Vitality, Second Wind (have) |
| 60 Knight | **Shockwave**: a wave along the floor both ways, hitting everything on your platform | **Holy Lance**: a long thrust through the first two mobs | Sanctuary (have) | **Retribution**: damage you take while Rally is up is stored; your next Shield Bash lets it out |
| 100 Knight | **Judgement**: light falls on every mob in a wide circle round you and they all turn on you | Aegis stays the capstone | **Guardian's Oath**: long, friends near take less damage and you take a share of it | **Unbroken**: +DEF for every mob attacking you |
| 30 Berserker | Whirlwind (have) | **Rending Slash**: a hit that leaves the mob bleeding | Berserk (have) | **Bloodlust**: below half HP you hit harder and Jelly Thirst heals double |
| 60 Berserker | Blade Storm (have) | **Execution**: huge against a mob low on HP; a kill refunds its cooldown | - | Sword Mastery (have); **Frenzy**: kills add time to Berserk |
| 100 Berserker | **Cyclone**: for a few seconds you're a spinning blade, hitting everything you run through | Sky Splitter (have) | - | **Rampage**: Momentum stacks higher, and Whirlwind and Blade Storm add stacks too |

**Hook** (proposed in 1c) goes in the Warrior's basics as a fifth chase move: Down + Dash toward a mob
yanks you to it. For the Knight, Ground Shake does the pulling.

### Mage: how it mobs
From where it stands. Its mobbing spells land at range on the pack, or plant a field the pack has to walk
into, so a Mage holds a spot while the others run around. That's what it pays for with the least HP.

| adv | mobbing staple | single-target staple | buff | passive |
|---|---|---|---|---|
| 10 basics | **Arcane Burst**: a burst on the first mob ahead that hits everything near it (arcane: spends Arcane Charge, no element) | Magic Bolt (have) | **Arcane Insight**: long, +MAGIC for you and friends near | Mana Flow, Arcane Mind, Arcane Charge (have); Mana Shield (have) |
| 30 Elementalist | Fireball (have); **Fire Wall**: a wall of fire planted ahead for a few seconds, burning everything that walks through | **Flame Lance**: a fast, hard bolt that burns | - | **Ignite**: a burning mob that dies bursts, setting the mobs near it alight |
| 60 Elementalist | Meteor (have) | **Combustion**: sets off a mob's burn all at once | - | Kindling (have) |
| 100 Elementalist | Starfall (have) | **Phoenix**: a firebird circles you and dives at mobs for a while | - | - |
| 30 Frostbinder | Frost Nova, Chain Lightning (have) | **Frost Bolt**: a cheap chilling bolt, so a Frostbinder freezes on its own from Lv 30 (today it can't until Glacial Spike at 60) | **Frost Armor**: long, +DEF, and mobs that touch you are chilled | - |
| 60 Frostbinder | **Blizzard**: a storm planted at range for several seconds, hitting and chilling everything inside it | Glacial Spike (have) | - | **Cold Snap**: a frozen mob that dies bursts into ice, chilling everything near |
| 100 Frostbinder | Absolute Zero (have) | **Thunder Call**: one huge storm bolt that then chains (storm: it spreads burns) | - | **Static**: storm hits leave a charge; frost on a charged mob freezes it straight away |

Ignite and Cold Snap make a Mage's packs chain-react, which is how it mobs better without moving. Fire Wall
and Blizzard are its "hold this spot" fields.

### Cleric: how it mobs
Summons and holy ground. Its spirits and zones do the clearing while the Cleric heals. It's the slowest at
clearing, but it never dies (1b). Every damage skill also heals a little, so attacking is never wasted.

| adv | mobbing staple | single-target staple | buff | passive |
|---|---|---|---|---|
| 10 basics | **Radiance**: light around you that hurts every mob near and heals every friend near a little | Smite (have) | **Blessing**: long, +max HP and a little ATK and MAGIC for you and friends near | Faith (have); Jelly Heal, Jelly Spirit, Cleanse (have) |
| 30 Priest | **Sacred Light**: a column of light on a group at range; heals you for each mob it hits | Smite stays | Mend, Lantern Wisp (have) | **Devotion**: overhealing turns into a small barrier |
| 60 Priest | **Consecration**: holy ground for a while; mobs on it are hurt, friends on it healed | **Judgment**: a holy bolt that hits harder the more friends near are hurt | **Holy Symbol**: long, more EXP for you and friends near (owner: OK) | Revive, Holy Power (have) |
| 100 Priest | **Genesis**: light falls on every mob in the room | - | Miracle (have) | - |
| 30 Warden | **Sprites**: three little spirits, each going after a different mob | - | Guardian Totem, Barrier (have) | **Warding Totem**: your totem pulses damage at mobs near it |
| 60 Warden | - | **Stone Guardian**: a golem summon that taunts and slams the mob in front of it | **Resolve**: long, friends near take less damage while they stand near your summons | Spirit Bond (have) |
| 100 Warden | Seraph (have) | - | - | **Host**: one more of every summon at a time |

### Archer: how it mobs
In lines and volleys, on the move. Arrows go through a row of mobs or rain on a pack at range, and the
Archer keeps shifting to get its angle. Still worse at swarms than a Mage (1b): a Mage's fields keep hitting,
an Archer's volleys come and go.

| adv | mobbing staple | single-target staple | buff | passive |
|---|---|---|---|---|
| 10 basics | **Spread Shot**: a fan of three arrows, one at each of the first three mobs ahead | Double Shot (have) | **Focus**: long, +ATK and crit with a bow | Keen Eye, Steady Hands, Evasion (have); Retreat Shot (have) |
| 30 Sniper | Piercing Arrow (have) | Snipe (have) | - | **Ricochet**: an arrow that kills jumps on to the next mob |
| 60 Sniper | **Splitting Arrow**: bursts into a fan when it hits, catching the mobs behind | Hunter's Mark (have) | **Sharp Eyes**: long, + crit for you and friends near | Deadeye (have) |
| 100 Sniper | Heartseeker (have) | - | - | **Eagle Eye**: a Snipe from past `FAR_PX` always crits |
| 30 Trapper | Arrow Rain (have) | **Poison Arrow**: a hit that leaves poison ticking | - | Net Trap (have) |
| 60 Trapper | **Blast Trap**: a trap that explodes on the pack that walks over it | - | - | Barbed Arrows, Trap Mastery (have) |
| 100 Trapper | Thousand Arrows (have) | **Hawk**: a hawk summon that dives at whatever you're shooting | - | **Huntmaster**: your traps and your hawk hit harder on a slowed or netted mob |

### Mobility
No change. Mobility stays shared and small: movement is in `step()`, and the classes' own movement (the
Warrior's chase moves, Hook) is where new moves go.

## What's new under the hood (SP1 builds these)
- **Long buffs**: a `buff` with a `party` radius and minutes-long `dur`, kept on the server player like
  `*Until` today, fed to `statsFor` (so the hit caps follow), shown in the status box, cleared on faint, class
  change and logoff. Many buffs from different players can stack (one of each kind).
- **Fields**: `kind: 'field'`, an area on the ground that hits whatever is inside every tick for a while
  (Fire Wall, Blizzard, Consecration, Radiance's lingering version). Server-run like burns and Mend; drawn for
  the room.
- **Damage over time** in general: today's burn tick (`BURN_*`) widened to bleed (Rending Slash) and poison
  (Poison Arrow), each with its own colour of numbers. Bleed and poison don't take part in the Mage's combos.
- **On-kill passives** (Ignite, Cold Snap, Execution, Ricochet, Frenzy): a hook where `damage()` kills a mob.
- **Pull**: Ground Shake moves mobs (server-side mob positions, no player physics), never a boss.
- **New summons** on the Cleric's summon code: phoenix, sprites, stone guardian, hawk, blast trap.
- **Cast from the K panel** (above).
- The skill tree panel gets more nodes per row: the layout must still fit at 667×375 on a phone
  (`docs/ui/mobile.md`).

## The pieces (one agent each, a dev copy each; `Agent.md`)
| piece | what | needs |
|---|---|---|
| SP1 | Under the hood (above), the K panel's Cast button and its bigger rows, the status box lines. Ships dark: no new skill learnable yet. | - |
| SP2 | Warrior skills, Hook included | SP1 |
| SP3 | Mage skills | SP1 |
| SP4 | Cleric skills | SP1 |
| SP5 | Archer skills | SP1 |
| SP6 | Balance pass: all four at once in `npm run economy`, then the owner plays | SP2–SP5 |

### SP1: live (2026-10-24)
What landed (details: `docs/combat/skills.md`, "The skill pool's machinery (SP1)", and "Cast from the K panel"):
- **Long buffs**: `kind: 'buff'` with `fx(rank)` (`BUFF_FX` names the effects: `atk`, `magic`, `def`, `hp`, `crit`,
  `critDmg`, `exp`, `cut`), `party` (radius), `dur` in seconds (minutes long). Nothing else to write: the server
  keeps them, `statsFor` folds them in, the status box shows them, faint / rebirth / logoff clear them.
- **Fields**: `kind: 'field'` with `at`, `shape`, `radius`, `range`, `dur`, `every`, `mult`, `el`, `heal`, `look`.
  A frost field only chills (no freeze per tick); fire burns.
- **Damage over time**: `dot: { kind: 'bleed' | 'poison', share(rank) }` on any hitting skill.
- **On-kill**: `onKill: { what: 'burst' | 'refund' | 'extendBuff' | 'ricochet', when?, from?, … }` on a passive (every
  kill) or an active skill (its own kills). Ignite = burst `when: 'burning'`, `el: 'fire'`; Cold Snap = burst
  `when: 'frozen'`, `el: 'frost'`; Execution = `refund` on the skill itself; Frenzy = `extendBuff` `buff: 'berserk'`;
  Ricochet = `ricochet` `from: 'arrow'` (client-side part in `src/rpg.js ricochet`, already wired to bow shots and
  arrow skills).
- **Pull / taunt**: `pull: px` and `taunt: true` on any hitting skill (Ground Shake = a `spin` with both).
- **Summons**: `what` 'phoenix' | 'sprite' (`count`) | 'guardian' | 'hawk' | 'blast', with `mult`, `life`, `every`,
  `radius`, `el`, `stat`. Their art is a first look: polish it in your piece.
- **The K panel**: Cast on every held active skill's card (double-click on desktop), cooldown sweeps, 5 nodes to a
  branch line (more wrap), the hotbar hidden while it's open. This part is live once deployed.
- `TEST_SKILLS=1` (test servers only) gives everyone a test skill per piece (`TEST_SKILLS` in `src/shared/skills.js`).
What SP2–SP5 should know:
- Skills only declare data; new `kind`s or `onKill.what`s go in `cast()` / `onKill()` in `server/rpg.js` and
  `cast()` in `src/rpg.js` (and the echo in `skillEcho`). Give each new skill an icon in `src/skillfx.js` (`ICONS`,
  `TREE_OF`): long buffs show it in the status box.
- Not built, left to the pieces: Retribution's stored damage, Unbroken's DEF per attacker, Bloodlust, Devotion's
  overheal barrier, Static, Combustion, Frost Armor's chill-on-touch, Resolve's "near your summons", Host (bump
  `summonCap`), Eagle Eye, Huntmaster, Shield Bash's stun, Judgment's "more friends hurt", Cyclone, Genesis. Each
  is a small rule on top of what's here.
- Holy Symbol (SP4): an `exp` effect. Name its share as a constant and fold it into the sheet's pace
  (`docs/economy.md`, "Long buffs"); the LONG BUFFS line in `npm run economy` lists it automatically.
- The mob flag bits are full (16384 was the last spare): another mob state needs a wire version bump or a message.
- Phones: the K panel fits 5 nodes per branch line at 667×375; a 6th wraps. Keep names short.

### SP2: live (2026-10-25)
What landed (details: `docs/combat/skills.md`, "The Warrior's skill pool (SP2)" and the chase moves' Hook):
- Every skill in the Warrior table, as planned. Kinds reused: `buff` (War Cry, Guardian's Oath), `spin` (Ground Shake
  with `pull` + `taunt`, Judgement with `taunt`), `strike` (Shield Bash, Rending Slash with a bleed, Execution),
  `cleave` (Holy Lance), `field` (Cyclone). New: `kind: 'wave'` (Shockwave), `stun`, `exec`, `follow` (a field that
  moves with its caster), `anim` (a skill's own look on a shared kind), and the passives' rules (Retribution,
  Unbroken, Bloodlust, Rampage) in `statsFor` / `hurt()` / `momentumMax`. Cleave's targets grow with rank (`targetsOf`).
- **Hook** is in `step()`: Down + Dash (▼ then Dash on touch). The physics can't see mobs, so the client cuts the
  yank at its mob with a predicted edit (`applyHook`), Charge-style. Wire version 6 (`hk`, `hc`, `mw`'s high byte).
- Found and fixed on the way: a chase move's message must go right after its input (`net.afterInput`), or the server
  can run it before that input (Leap Slam / Upward Cut hits could be dropped that way too).
What SP3–SP5 should know:
- `anim` on a skill picks its look in `hitFx` (src/rpg.js) for strike / cleave / spin / wave: add a look there and in
  `FX` (src/skillfx.js) rather than a new kind. `follow: true` on a field makes a moving aura. `targets` can be a
  function of rank (`targetsOf`). `stun: true` on a hit works for any class (echo-drawn, no mob flag).
- **The economy sheet doesn't model the hotbar's six slots**: every learned active fires, so each new staple adds
  damage rather than replacing the old one. The Warrior now leads single and crowd from Lv 100 (1.26 / 1.65× the
  others' mean). Expect the same jump for your class; keep `CLASS_FIT` green and leave the cross-class shape to SP6.
- Long buffs held count as always on in `fight` (cast before the fight).

### SP3: live (2026-10-25)
What landed (details: `docs/combat/skills.md`, "The Mage's skill pool (SP3)"):
- Every skill in the Mage table, as planned. Kinds reused: `fireball` (Arcane Burst, `anim: 'arcane'`, no element),
  `buff` (Arcane Insight, party; Frost Armor, yours, with `chills`), `field` (Fire Wall, a strip; Blizzard, round),
  `bolt` (Flame Lance, Combustion, Frost Bolt), `summon` (Phoenix, SP1's flier, its art polished), `chain` (Thunder
  Call, `lead` × on its first mob), on-kill `burst` passives (Ignite, Cold Snap). New small rules: `combust` (×
  on a burning mob, which spends the burn; `applyHits`), `lead` (the first hit of a chain), Static (storm hits set
  `m.staticUntil`; frost on a charged mob freezes it at once, in `element()`), Frost Armor's chill on touch (`ouch`).
- No wire bump: Static and Combustion ride the skill echo (`charged` + `cs`, `combust`), drawn from there like the
  SP2 stun. Kindling now names every Elementalist fire spell.
What SP4–SP5 should know:
- **The economy sheet now swaps staples** (`HOTBAR_SWAPS` in `scripts/economy.mjs`, Rule 1: a new staple takes the
  slot of the one a tier before it). It applies to every class (owner, 2026-10-25): the Mage's and the Warrior's are listed, and the Warrior now sits
  low on the sheet (about 0.75× single and crowd from Lv 60) until SP6 retunes it. Without it no
  Mage skill could be added: **the Cleric sits at the edge of `CLASS_FIT`** (1.59× the median on Colossus before SP3),
  so any class getting faster at den bosses pushes the median down and fails the Cleric. SP4's Cleric damage
  should give room; until then keep your class's den solo times where they are. List your swaps there too.
- Planted fields count `FIELD_BOSS_SHARE` of their ticks on a lone boss (it walks out); follow fields (Cyclone)
  count in full. A field is the cheapest way to add crowd damage without boss damage on the sheet.
- `lead` (chain) and `combust` (any hit) are generic: a Cleric's Judgment-style "more on X" can copy `combust`'s
  shape (client reads the state, server checks its own with slack).

### SP4: live (2026-10-25)
What landed (details: `docs/combat/skills.md`, "The Cleric's skill pool (SP4)"):
- Every skill in the Cleric table, as planned. Kinds reused: `field` (Radiance, a `follow` aura in its own `radiance`
  look; Consecration, a strip where you stand), `buff` (Blessing; Holy Symbol, `fx: exp`; Resolve), `meteor` (Sacred
  Light, `anim: 'sacred'`), `bolt` (Judgment, `anim: 'judgment'`), `starfall` (Genesis, `whole`: every mob in the room),
  `summon` (Sprites, the Stone Guardian: SP1's sprite and guardian, their art polished). New small rules: `lightHeal`
  (every Cleric damage skill and summon heals the hurt friend nearest, the holy bolt's rule), `selfPer` (Sacred Light),
  Devotion's ward (`q.devo`, from `healFrom`'s overheal; never an ultimate), Judgment's `judge` (`judgmentMult`: the
  client counts the hurt it sees, the server caps with its own count), the Warding Totem's pulse (`server/summons.js`),
  Resolve's cut near its Warden's summons (`resolveCut` in `hurt()`; `buffText` for a buff with no plain effect), Host
  (`summonCap` + 1). Sprites with only one mob near leave the others idle by the Cleric (a mobbing staple, not a boss one).
- No wire bump: `judged` rides the skill echo, the ward rides `me`, the totem's pulse rides `sumhit`.
What SP5 should know:
- `HOLY_SYMBOL_EXP` is on the sheet: PROGRESS's "with Holy Symbol" column and a check that the pace with it stays at or
  over `LEVEL_PACE`'s floor. Another EXP buff would need the same.
- The Cleric's sheet now sits 1.02–1.05× single, 0.68–0.75× crowd, about 1.2× the median on the late dens (was 1.45×):
  `CLASS_FIT` has room again. The Archer is the Cleric's neighbour in the crowd column (0.95–1.04 from Lv 60): Archer
  crowd skills that lift it well past the Cleric are fine (Rule 2), but keep the Archer under the Mage there.
- `HOTBAR_SWAPS` for the Cleric keeps Smite (a cheap filler can't be "replaced" by a long-cooldown staple on the sheet:
  it made the Priest slower). The Archer's Double Shot is the same kind of filler; swap only staples with cooldowns.
- `buffText(rank)` on a long buff words what `fxText` can't (Resolve); the status box and the LONG BUFFS line read it.

SP2–SP5 touch different parts of `SKILLS` and their own effects. They can run side by side, but `src/shared/skills.js`
is shared, so they merge one at a time. Each one deploys on its own: a class at a time is fine (the others
are untouched). No skill points are lost: new ranks only add to `spRoom`.

## Economy and balance (every piece)
- **Faster farming is fine** (owner, 2026-10-24): higher-level players with better area skills farm faster,
  and the curve can scale with that. Don't hold mobbing back to protect `KILLS_PER_MIN`; just say in the reply
  how far a full-pack clear moves it, and retune the sheet's assumption to match.
- **What matters is balance between classes, by shape**: some classes are better at bossing, some at
  mobbing, and that's on purpose (owner). The Mage should top mobbing, the Archer single-target at range, the
  Cleric be last at mobbing but first at staying alive, the Warrior in between with the most movement.
  `CLASS_FIT` and `BAD_AT` stay green; a class that's best at both, or worst at both, is the bug.
- Party buffs stack across classes on purpose (a full party should feel strong), but S5's party dens and the
  final bosses are tuned with them on.

## Settled (owner, 2026-10-24)
- **Holy Symbol gives the party more EXP**, MapleStory style (asked: the EXP version is OK). It goes on the
  economy sheet like any faucet: name its share as a constant and show it in `npm run economy`.
- Names are working names: rename freely.
