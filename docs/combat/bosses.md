# Boss dens, bosses and ultimates

Data: `DENS`, `MOBS` (entries with `boss: true`), `PHASE_AT`, `COMBO_CHANCE`, `COMBO_MAX`, `ULT_FIRST`,
`ULT_EVERY`, `ULT_WARN`, `BOSS_HP_PER_PLAYER`, `BOSS_RESPAWN_MS` in `src/shared/rpg.js`. Brain:
`bossBrain()` in `server/rpg.js`. Client: `bossEvent` / `step` in `src/rpg.js`. Art: `src/dens.js` (dens,
the first five bosses, boss bar, `drawUltBanner`), `src/dens-caldera.js` and `src/dens-citadel.js`
(`DEN_ART` / `ENTRANCE_ART` / `BOSS_ART` / `FX2` hooked into dens.js).

Small bosses that roam the open stages (field bosses, like Turnipop) aren't den bosses: `docs/combat/stages.md`.

## The nine dens (each a room behind a cave mouth in its stage)
Wildwood: Sprout King, Mother Mushroom, Bramble Behemoth · Highlands: Frost Queen Glacia, Astral Wyrm ·
Caldera: Ignis the Magma Tyrant, Pyra the Ember Phoenix · Citadel: The Clockwork Colossus, Chronos.

Tenth den: **The Tidemother's Hoard** (room 26, Saltspray Coves, art `src/dens-coves.js`). Eleventh:
**The Knotted Burrow** (room 30, the Mycelium Deep, art `src/dens-deep.js`; `docs/places/deep.md`).
Twelfth: **The Warden's Court** (room 35, Keeper's Spine, art `src/dens-spine.js`; `docs/places/spine.md`),
the Root Warden, Greenhollow's party den. Thirteenth: **The Breathing Hole** (room 38, the Whale Skerries, art
`src/dens-skerries.js`, theme `floe`; `docs/places/skerries.md`), the Old Narwhal. Fourteenth: **The Seam**
(room 43, the Queen's Bridge, art `src/dens-qbridge.js`, theme `oath`; `docs/places/queensbridge.md`), Sigrun,
the Queen's Shield, Frostpeak's party den (Lv 100); her `wave` ult is new ice racing along the floor (`iceMass`).
E2 added **The Buried Clutch** (room 57, the Smoking Coast, art `src/dens-hatch.js`, theme `hatch`;
`docs/places/coast.md`), the Hatchkeeper (Lv 115): her `spores` ult is drawn as boiling sand with tide-wet safe
patches through `ULT_LOOKS` (a den's own look for a shared ult, by theme, checked first in `drawUltFx`), and her
freeing is a longer `bossDie` for her theme (`drawHatchFreed`: the eggs hatch and the little ones run to the sea).
Big bosses can have `lines` (enter / phase / freed) that they say in a bubble and the chat: those five have them so far. `looks` on a boss picks how the shared beam
and grid moves are drawn (the Warden's Keeper amber and roots; the Old Narwhal's jet of sea water; Sigrun's `shield` beam and `seam` grid), and `party` names the party mechanics a
boss is built for (below: "Bosses that need a party"). Field bosses (no den;
`docs/combat/stages.md`) have no `lines`: F3's Pale Wyrm, which has a story, tells it through the Serpent Stone
and the personas instead (`docs/places/heights.md`). A new den's art lives in its own file with `DEN_ART` / `ENTRANCE_ART` / `BOSS_ART`
(merged in `dens.js`), plus its theme's row in the shared effect tables (`FXPAL`, `THEME_RGB`, the theme
branches of `drawBit` and `drawFallObj`).

## How a fight works
- Three stages by HP (`PHASE_AT`), each with its own move list (`MOBS[boss].phases`) and longer combos.
  Stage 3 is enraged (music intensifies via `audio.setIntensity`).
- Basic moves: slam (anyone on the floor within range when it lands: jump or use a ledge), leap, charge,
  rain, barrage, summon. The later bosses add their own (geysers, feathers, beams, clock bombs, void
  sweeps…), all sent through the hazards pipeline (`docs/combat/stages.md`).
- The Mage's combos (`docs/combat/skills.md`): a frozen boss (den or field) isn't stopped, only slowed
  to `FROZEN_BOSS_SLOW` for `FREEZE_BOSS`, and its timers and moves run on; a fire spell still shatters it.
  Burns count for their caster on the damage meter. Freezing a boss while its ultimate warns cancels it on a boss
  with the `interrupt` mechanic (S5.2, below).
- Boss HP grows per extra slime in the den (`BOSS_HP_PER_PLAYER`). Since SP6 (owner, 2026-10-25) a den boss soloed at
  its level is a ~15 min fight on the economy sheet, a field boss ~4, a top boss ~45 for a party of four
  (`docs/economy.md`, "The balance pass"); rewards grew with them. Every boss hit also takes a share of the target's max
  HP (`bossHitPct`, `docs/combat/core.md`).
  Everyone leaving for a few seconds resets it; a kill respawns after `BOSS_RESPAWN_MS` (`b` in `mobs`
  is the countdown). Bosses drop their unique gear, scrolls, gold and potions. Events: `{t:'boss', a: …}`.

## Bosses that need a party (S5; plan `story/s5-plan.md`)
The design is `story/progression.md` section 6: a boss asks questions a mixed party answers best, but **only once
enough slimes are fighting**, so a solo player fights it exactly as before. S5.1 built the engine, the focus and
the pulse; S5.2 the curse (and Cleanse), the barrier, the armour, weak points, the interrupt and the stagger.
- **One table, one gate.** `PARTY` in `src/shared/rpg.js` holds each mechanic's `min` (fighters needed on a den or
  field boss) and `capMin` (on a party den, `partyDen` on the boss: the Root Warden, Sigrun). `partyActive(k,
  fighters, mech)` is the rule and `partyOn(m, mech)` in `server/rpg.js` asks it for a live fight (`m.fighters`, the
  same count `BOSS_HP_PER_PLAYER` uses: a den boss's never drops mid-fight, so a friend leaving doesn't switch
  anything off). Owner's gates (2026-10-24): den and field bosses every mechanic at 2 fighters, `interrupt` always
  on; party dens everything from 1 but `focus`. `partyAll` on a boss (the final bosses, `story/final-bosses.md`)
  switches every one on from the first slime (the final bosses: below, "Final bosses").
- **It ships dark.** Nothing switches on unless the boss also has `partyLive` (S5.3 gave it to the party dens,
  S5.4 gives it to the retrofitted bosses, a stage at a time). Tests use `TEST_PARTY` (`docs/testing.md`).
- **The party dens (S5.3)**: the Root Warden and Sigrun have `partyLive` with focus, pulse, barrier, weak point,
  adds and the interrupt (added here: the Frostbinder's payoff), all but the focus on from the first slime. Their
  HP is never under `PARTY_DEN_HP_FLOOR` slimes' worth (since SP6 two, and for every top boss; `bossMaxHp`, shared: spawn and the den's growth in
  `bossBrain`), so a lone slime faces a party's HP and every mechanic; the barrier's and weak point's HP stay shares
  of the plain `hp`. Each has a `lines.shield`, said the first time its barrier goes up in a fight (`saidShield`).
  `looks.dome` tints the barrier (`keeper`: amber with little gears; `ice`). Tuning and tests: their place docs and
  the PARTY DENS table in `npm run economy` (`docs/economy.md`).
- **Front-only mechanics (S5.3, Sigrun)**: `barrierFront` on a boss makes its barrier cover only the side it
  faces (`barrierCovers`, shared like the Obsidian Crab's shell cut): a hit from behind does full damage, and only
  hits on it wear it down (`onShield` in `partyHit`). `weak.front` puts the weak point on its front (`weakFaces`).
  The client passes the hitter's x to `Party.mod`; the server is generous for 400 ms after the boss turns round
  (`dirAt`) and within 24 px of its middle. While a front-only barrier is up the boss plants its feet in
  `bossBrain` and turns to its target only `BARRIER_TURN_S` after they got behind it (`behindSince`), so a party
  flanks while whoever has the focus holds the front, and a lone slime dodges round and hits before it turns. Drawn
  as a curved wall of ice off its front (`drawFrontWall`).
- **adds (S5.3)**: a summon brings `ADDS_PER_FIGHTER` more minions for each slime past the first, and one more may
  stand at once for each, up to `ADDS_MAX` (`addsCap`); alone a wave is what it always was.
- **The engine**: `partyTick(m, k, here, t)` runs from `stepMob` for every den and field boss with a `party`, before
  its targeting. It works out the bits (`PARTY_MECHS` order, `partyBit`) and sends `{t:'party', id, on, f, fl}` to
  the room when they change and every 2 s while any is on (for anyone walking in); the client (`src/party.js`,
  `Party` on the Rpg) keeps them per boss and forgets one it hasn't heard of for 5 s. This is a JSON message, not
  more mob flags: eight bits don't fit the binary mob record (`docs/netcode.md`). "Who's in the fight" is the
  whole den, or round a field boss the slimes near it or who hit it lately (`inFight`).
- **focus**: the boss locks onto one slime for `FOCUS_S` (`m.focus`, picked at random among the fighters, someone
  else than last time if it can), then `FOCUS_GAP` s off, then again. While it lasts `partyTick` points
  `m.target` at them every tick, so every move that aims (charges, leaps, shots) goes at them, and their hits
  taken from it are ×`FOCUS_ATK` (`ouch`). `damage()` and the summons' taunts don't steal its eye meanwhile.
  Drawn as a marching red dashed line from the boss to them and a turning reticle over them; they also get a
  red-rimmed icon in the status box (`docs/combat/skills.md`).
- **Rally's taunt** (the Knight; owner 2026-10-24: folded into Rally instead of a new Taunt skill): casting Rally
  also pulls every mob within its range onto the caster for `TAUNT_S` (`taunt()` in `server/rpg.js`,
  `m.tauntUntil`), and if the boss's focus is on (even between two focuses) the focus moves to the caster for
  `TAUNT_S`. On a boss without focus it still pulls the target, so it's never a dead button. The echo's `taunt`
  pops "TAUNT!" over the Knight.
- **pulse**: every `PULSE_EVERY` s, `{t:'boss', a:'pulseWarn', dur: PULSE_WARN}` (rings close in on the boss,
  "PULSE 2.1" over it), then `pulseHit`: the server itself hurts every fighter for `PULSE_HP` of their max HP
  through `hurt()` with `flat` (no DEF, no roll, no Evasion, no knockback; no `ouch`). Aegis blocks it, a Bubble
  pops on it, a Barrier soaks it, Sanctuary, the Guardian Totem, a brewed ward and Mana Shield cut it as they cut
  any hit. Neither starts during an ultimate's warning. A Barrier Draught (S5.5, `docs/places/alchemy.md`) takes
  it whole before any of those, in `hurt()` on `flat === true`.
- **No hints** (owner, 2026-10-26): nothing names a mechanic's answer; the telegraphs and pops are the whole
  explanation (`docs/ui/hints.md`). Keep it that way for new bosses.
- **The hit cap** (combat stays client-decided, server-capped: `docs/combat/core.md`): barrier, armour, weak points
  and the stagger all scale a hit through one shared rule, `partyHitMult(state, { magic, heavy, weak })`. The client
  predicts with `Party.mod` (src/party.js) at every hit site and shows that number; `applyHits` caps with the same
  rule from its own state (`partyHit`, a little generous at a phase's edges so a hit the client saw a moment
  earlier isn't clipped). What kind a hit is comes from `hitKinds` (shared/skills.js) for skills, and from the
  weapon for normal attacks (a staff bolt is magic, a bow shot an arrow, a slap or Charge heavy if its multiplier
  reaches `ARMOUR_CRACK`). The Cleric's summons and burns go through `damage()` straight and ignore the phases.
- **The stagger** (`STAGGER_S`, `STAGGER_DMG`): a barrier broken, armour broken, a weak point filled or an ultimate
  interrupted. The boss stands dazed (no moves: `bossBrain` and `mobAi` return early; nothing new starts in
  `partyTick`) and every hit on it is ×(1 + `STAGGER_DMG`). A wind-up it was in is dropped; a move already going off
  (or an ultimate) finishes first (`staggerQueued`, sent as `st: -1`). Drawn as stars circling its head and "DAZED"
  with the seconds; `{t:'boss', a:'stagger'}` pops "STAGGERED!". It's the shared "you did it" payoff.
- **curse**: every `CURSE_EVERY` s a dark sigil opens on the floor under the boss's target (`curseWarn`, `CURSE_WARN` s
  to step out), then everyone fighting within `CURSE_R` of it gets a stack (`curseHit`, up to `CURSE_MAX`; Aegis
  blocks it). Curses live on the player (`p.curse { n, until, by, room }`, not saved; a KO, leaving the room or the
  boss dying lifts it): each stack takes `CURSE_DMG` off the hitter's damage (`curseMult`, in the client's `roll` and
  the server's cap alike) and burns `CURSE_DOT` of max HP a second through `hurt()` with `flat: 'dot'` (no Bubble
  pop, no invulnerability, no flash; the meter counts it as damage taken). Standing past `CURSE_FADE_R` from the
  boss fades a stack every `CURSE_FADE_S`; a new stack refreshes `CURSE_S`. Cleanse (the Cleric) lifts it all.
  Shown as the sigil, dark wisps over every cursed slime (`{t:'curse', id, n}`, and `cu` in the party message for
  late comers), and the status box's red-rimmed icon with the stacks.
- **barrier** / **armour**: shield phases (`m.shield`); a boss with both alternates. `shieldUp` fades it in over
  `BARRIER_WARN` / `ARMOUR_WARN`, then it holds for `BARRIER_S` / `ARMOUR_S` or until broken, and the next comes
  `BARRIER_EVERY` / `ARMOUR_EVERY` s after it ends. The barrier (a rune dome) lets physical hits through at
  `BARRIER_PHYS`; magic hits do full damage and wear its HP (`BARRIER_HP` of the boss's HP for one slime, not the
  party-scaled max, so one Mage breaks it in a few seconds in any party). The armour (a shell of plates) cuts every
  hit that isn't heavy to `ARMOUR_CUT`; a heavy hit does full damage and cracks it (one crack a cast, `crack`
  events), and `ARMOUR_CRACKS` cracks break it. Both drop by themselves when the time runs out (`shieldDrop`), no
  stagger. Sigrun's covers only her front (below).
- **weakpoint**: every `WEAK_EVERY` s a glowing crystal opens high on the boss for `WEAK_OPEN_S` (`WEAK_MARK_S` while
  Hunter's Mark is on it). Where: `weak: { dx, dy, r }` on the boss (shares of its width and height from its feet,
  dx toward the way it faces; `front: true`: only hit from in front); `weakOf` has a default for bosses without one
  (the Warden's and Sigrun's are placed; S5.4 places the rest). A hit
  the client sees reach it carries `h[4] = 1` and does `WEAK_MULT`; the server takes it only while it's open and the
  hitter could reach it (`weakReach`: any arrow, from anywhere in range; anything else needs the hitter's body
  within `WEAK_REACH` of the spot's height: a jump, a ledge, Upward Cut, Flash Jump). Hits on it fill `WEAK_HP` of
  the boss's one-slime HP (the ring round the crystal); full, it breaks (`weakBreak`) and the boss staggers.
- **interrupt**: no boss move. A freeze landing while an ultimate is still warning (`element()` → `interruptUlt`)
  cancels it outright: `{t:'boss', a:'ultCancel', by}` drops everyone's banner and its warning art, "INTERRUPTED!"
  pops, the next one comes `ULT_EVERY` later as usual, and the boss staggers. Not Pyra's Rebirth (her egg is its own
  answer). On from the first slime (`min: 1`), but only on a boss that lists it.
- **Nothing makes a boss immune**: a barrier still lets `BARRIER_PHYS` through, armour `ARMOUR_CUT`, a missed weak
  point only means a slower fight. The party message carries the state (`st`, `sh`, `wk`, `cu`: `docs/netcode.md`);
  it's sent on change, at most every 150 ms while hits wear a phase down, and every 2 s.

### Every class's answers (progression.md 1b: a mechanic only one class can answer is a bug)
| mechanic | best | everyone else |
|---|---|---|
| focus | Knight's Rally takes it | the focused one Dashes and kites; others hit |
| pulse | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught (S5.5) |
| curse | Cleric's Cleanse | step out of the sigil; stand past `CURSE_FADE_R` to fade it; the Cleansing Tonic (S5.5) |
| barrier | Mage's spells (and a Cleric's holy bolts and Smite) break it | wait it out; `BARRIER_PHYS` still lands |
| armour | Berserker (Sky Splitter, Blade Storm, Power Strike); Snipe, Heartseeker; a shatter, Meteor | wait it out; `ARMOUR_CUT` still lands |
| weak point | Archer: every arrow reaches it | jump for it (Upward Cut, Flash Jump, a ledge); a staff bolt cast mid-jump |
| interrupt | Frostbinder (Frost Nova, then Glacial Spike); an Elementalist with a Frostbinder friend | dodge the ultimate as always |
- Tested (S5.1) with two and three test players on a test boss (`TEST_PARTY=sprout_king:focus,pulse`): alone nothing
  shows; with two the focus goes on, Rally pulls it, it rotates, the pulse lands for 30%, a Barrier soaks it.
- Tested (S5.2) on the Sprout King with two headless players each (`TEST_PARTY=sprout_king:<mech>`, `TEST_BOSS_HP`
  raised): alone only the `interrupt` bit is on and nothing shows; a Berserker's slaps into the barrier came out
  ~0.35×, a Frostbinder broke it in ~6 s and the boss staggered (a staggered slap ~+30%); arrows and slaps into the
  armour ~0.4×, four Power Strikes cracked and broke it; an Archer's arrows filled the weak point in ~4 s (the mark
  held it open 11 s); a curse landed on both, burned, softened a slap ~12%, Cleanse lifted a friend's then the
  Cleric's own, and walking far off faded one; a Frostbinder froze the Sprout King's warning stomp away (both
  banners gone). Numbers untested with people.

### The retrofit (S5.4): Greenhollow (built 2026-10-24)
Den and field bosses, the owner's gates (every mechanic at 2 fighters, `interrupt` from 1): alone they fight as before.
| boss | mechanics | drawn as |
|---|---|---|
| Bramble Behemoth (den, Lv 12) | armour, interrupt | bark plates with thorns (`looks.shell: 'bark'`) |
| Old Snapjaw (field, 15) | armour (on top of his front shell) | mossy scutes (`looks.shell: 'scute'`) |
| The Tidemother (den, 25) | pulse (the tide), adds, interrupt | sea-green rings with foam, "TIDE" (`looks.pulse: 'tide'`) |
| The Knotmole (den, 35) | focus, adds, interrupt | the usual line and reticle |
| The Hornet Queen (field, 38) | adds, weakpoint | her honey sac on her abdomen, a honeycomb cell (`looks.weak: 'honey'`) |
| The Drowned Bosun (field, 40) | curse (the drowned) | a sea-green ink sigil with bubbles (`looks.curse: 'drowned'`) |
| The Thorn Hart (field, 58) | focus, curse (the thorns) | a briar sigil with thorns round its rim (`looks.curse: 'thorn'`) |
- The `looks` keys (`shell`, `pulse`, `curse`, `weak`) are tables in `src/party.js` (`SHELLS`, `PULSES`, `CURSES`); a
  boss without one gets the S5.2 look. The cursed slime's own wisps stay violet.
- **Field bosses** (first used here): `fieldFighters` is the gate's count (a second slime's hit switches them on;
  they stay on till it heals up alone, which now also sends its party bits off and sends its called adds away, as
  its death does). The curse sigil goes on the field boss's floor (`fy` on `curseWarn`: the Thorn Hart may be mid-leap).
  A field boss has no summon move, so `adds` there is its own call: every `FIELD_ADDS_EVERY` s, `ADDS_PER_FIGHTER` of
  its `minion` a slime past the first (at least one), `FIELD_ADDS_MAX` of its own at once (`by` on each, `ownMinions`).
  No ultimates, so no `interrupt`.
- Swaps from the plan's draft: the Hornet Queen's weak point is on her (a separate nest would be a separate mob to
  hit). Every den boss here also got `interrupt` (all three ults read as something you can freeze mid-rise). No
  `lines` were added: the Behemoth and the field bosses have none, and the Tidemother's and Knotmole's mechanics have
  no line hook (only `lines.shield`).
- Tested with two headless players on each of the seven (`TEST_SPEED=10`, `TEST_GOD`): alone the bits were 0 (field)
  or only `interrupt` (den); with two they switched on. Seen: the Behemoth's armour up, Power Strikes cracking and
  breaking it, the stagger; Snapjaw's armour; the tide pulse warn and hit; the Knotmole's focus; the Hornet Queen's
  wasps called, her weak point opened, filled by arrows and broken (stagger), also on a phone; the Bosun's and Hart's
  curses landing (stacks on the status box), the Hart's focus. Not tried: the interrupt on these three (S5.2's code),
  den adds' bigger waves (no summon came in the test window), real people.

### The retrofit (S5.4): Frostpeak (built 2026-10-24)
Same gates. The armour uses the same numbers as Greenhollow's (owner OK'd a duo ~20% slower under it, 2026-10-24).
| boss | mechanics | drawn as |
|---|---|---|
| Frost Queen Glacia (den, Lv 47) | barrier (ice), interrupt | an ice-blue dome with snowflakes turning round it (`looks.dome: 'queen'`); one `lines.shield` |
| Astral Wyrm (den, 57) | weakpoint (a star on its back), barrier, interrupt | a five-pointed star on its rear hump (`weak`, `looks.weak: 'star'`); a dome of starlight with gold stars (`looks.dome: 'star'`) |
| The Old Narwhal (den, 70) | weakpoint (the tusk's root), pulse (the breathing hole), interrupt | the S5.2 crystal over her own shard (`weak.front`); steel-blue rings with spray and a plume of mist, "BREATH" (`looks.pulse: 'breath'`) |
| Old Rimehorn (field, 75) | armour, focus | plates of rime with icicles hanging off them (`looks.shell: 'rime'`) |
| The Hall Troll (field, 88) | armour, focus | square-cut blocks of blue ice (`looks.shell: 'block'`) |
| The Pale Wyrm (field, 90) | curse, weakpoint | a pale indigo sigil with dim stars sinking into it (`looks.curse: 'pale'`); a star mid-back, in the air (`looks.weak: 'star'`) |
- No swaps from the draft, one addition: every den boss also got `interrupt` (as in Greenhollow; Glacia's, a frost
  queen frozen out of her own Absolute Zero, is the one the plan asked for). The Narwhal's weak point is `front`
  (Sigrun's rule): her shard sits at the tusk's root on her face, so only a hit from in front finds it, and it's
  low enough that a melee slime on the floor reaches it. Melee classes stand in her beam's line for it, archers
  don't care; the economy sheet doesn't model `front` on a weak point (it reads a duo as always in front).
- Every class's answer: the barriers (Glacia, the Wyrm) are a Mage's to break (the RETROFIT table: a Berserker +
  Sniper duo ~26% slower on Glacia, a duo with a Mage no slower); without one, wait the dome out (`BARRIER_S`).
  The armour (Rimehorn, the Troll): Power Strike, a shatter, Snipe. The weak points: arrows, or jump.
- Tested with two headless players (`TEST_SPEED=10`, `TEST_GOD`): alone the bits were 0 (Rimehorn, the Troll) or
  only `interrupt` (Glacia, the Wyrm); with two: Glacia's dome up, broken by a Frostbinder, stagger; the Wyrm's
  star opened and broken, its dome up and broken, its Supernova frozen out; the Narwhal's BREATH warning and hit,
  her shard broken, Close the Floes frozen out (a phone player there); Rimehorn's and the Troll's armour cracked and
  broken, their focus; the Pale Wyrm's star broken by arrows, its curse landing (on a phone). **The interrupt was
  tested here** (Greenhollow couldn't): a lone Frostbinder casting Glacial Spike then Frost Nova into Glacia's
  Absolute Zero warning cancelled it ("Your freeze interrupted...", the banner gone, DAZED). Not tried: people,
  the den adds, a Narwhal fight from behind.

### The retrofit (S5.4): Emberdeep (built 2026-10-27)
Same gates (every mechanic at 2 fighters, `interrupt` from 1; the Colossus and Chronos are `top` but not party dens, so
alone they fight as before too). The armour and barrier use the shared numbers (`TOP_BARRIER_*` on the two top bosses).
| boss | mechanics | drawn as |
|---|---|---|
| Ignis the Magma Tyrant (den, Lv 99) | armour (cooling rock), pulse (the heat), interrupt | basalt plates with a glowing seam down each (`looks.shell: 'cinder'`); ember rings with heat shimmer going up, "HEAT" (`looks.pulse: 'heat'`) |
| Pyra the Ember Phoenix (den, 110) | curse (burning), adds | a charred sigil with a red-hot rim and sparks flying up (`looks.curse: 'ember'`); her cinder bats in bigger flocks |
| The Clockwork Colossus (den, `top`, 150) | armour, weakpoint (the core), pulse (steam), interrupt | riveted plates of dark bronze (`looks.shell: 'brass'`); its clock-gear heart opens as a spinning cyan gear (`weak.front`, `looks.weak: 'core'`); white steam rings and a plume off its stacks, "STEAM" (`looks.pulse: 'steam'`) |
| The Bellower (field, 100; E1) | armour, focus | Ignis's basalt plates with a glowing seam (`looks.shell: 'cinder'`): the black sand on its back baked hard |
| The Hatchkeeper (den, 115; E2) | weakpoint (the shard under her crest), pulse (the nest's heat), interrupt | the S5.2 crystal over her neck; Ignis's ember rings, "HEAT" (`looks.pulse: 'heat'`) |
| Hundredfoot (field, 125; E2) | armour, pulse (the heat) | Ignis's basalt plates (`looks.shell: 'cinder'`): its clinker closing up; Ignis's ember rings, "HEAT" (`looks.pulse: 'heat'`) |
| Greyback (field, 130; E1) | focus, curse (smouldering) | Pyra's charred sigil (`looks.curse: 'ember'`): his burning logs leave you smouldering |
| Chronos, Keeper of Hours (den, `top`, 170) | barrier, curse (borrowed time), interrupt | a gold dome with hour marks and two clock hands turning inside (`looks.dome: 'hours'`); a dial of gold light on the floor, its hand sweeping round (`looks.curse: 'hours'`) |
- **Swaps and additions:** Pyra has no `interrupt` (Rebirth's egg is its own answer; `interruptUlt` skips it). The
  Colossus got a **pulse** on top of the draft's armour + weak point: a top boss is meant to punish a party with no
  healer (owner's SP6 rule 4), and armour and a weak point are exactly the lopsided team's own answers (Berserkers,
  Archers), so without it a no-healer party beat it as fast as the right mix. Ignis, the Colossus and Chronos got
  `interrupt` like every den with a freezable ult; for the two top bosses that's also a way out of `TOP_ULT_HP`'s chip
  (the Frostbinder's). Pyra's adds only show in her middle stage (`summon` is only in her stage-2 moves).
- The Colossus's core sits on its chest (`front`, the Narwhal's rule): low enough that a slap from the floor finds it,
  so a melee party breaks it as well as arrows do, from in front.
- No `lines`: Ignis and Pyra get theirs with E4 (`story/roadmap.md`), and Chronos's voice is the story's to give.
- Contrast (screenshots): brass plates vanished into the Grand Foundry's brass walls, so the Colossus's are dark bronze;
  Pyra's sigil is dark on her sunset-orange roost; Chronos's sigil is gold light on his violet floor.
- Tested with two and three headless players (`TEST_SPEED=10`, `TEST_GOD`, a phone player in each): alone the bits were
  only `interrupt` (Colossus); with two: Ignis's armour cracked and broken by Power Strikes (stagger) and its HEAT
  pulses; Pyra's curse stacking to 4 on both, her bat waves of 3 with 6 standing at once (`TEST_BOSS_HP=0.1`); the
  Colossus's armour broken, its core filled and broken, STEAM pulses, and **Overclock frozen out twice** by a
  Frostbinder (Glacial Spike then Frost Nova, `TEST_BOSS_HP=0.003`), each a stagger; Chronos's dome up and worn down
  (a cursed bot Frostbinder didn't break it inside its `TOP_BARRIER_S`: four curse stacks halve your damage, which is
  Cleanse's job) and his curse stacking. Not tried: Ignis's and Chronos's interrupts, people.

## Top bosses (SP6, owner 2026-10-25)
`top` on a boss: the party dens (the Root Warden, Sigrun, Emberdeep's to come), the final bosses (FB1, FB2, E5) and the
end-game capstones, the Clockwork Colossus and Chronos. Built for a party of four (~45 min on the sheet), hard-hitting and
punishing; alone possible but 2–3× as long (their HP floor, `PARTY_DEN_HP_FLOOR`). Every class still has an answer to
every mechanic (S5's rule), but a weak answer costs more here than on an ordinary den (which keeps the S5 numbers):
- they hit harder: `TOP_HIT_PCT` of max HP a hit;
- the pulse takes `TOP_PULSE_HP` (`pulseHpOf`): unhealed, a party lives on potions;
- the barrier is up `TOP_BARRIER_S`, back `TOP_BARRIER_EVERY` s after it ends, and lets `TOP_BARRIER_PHYS` of a physical
  hit through (`barrierOf`; the client's `Party.mod` and the server's `partyHit` both pass its `phys` to
  `partyHitMult`): unbroken, it roughly doubles the fight. Its HP and the weak point's are `TOP_BARRIER_HP`, `TOP_WEAK_HP`;
- an ultimate nobody interrupted hits everyone in the den for `TOP_ULT_HP` of max HP even in the safe spot
  (`ultGoesOff`, flat like a pulse: Aegis, a Bubble, a Barrier, Sanctuary, the totem, a ward, a Barrier Draught take it
  as they take one); standing in the wrong place is still a KO. Not Pyra's Rebirth (she isn't top anyway). Since S5.4
  the Colossus and Chronos have `interrupt` too: a Frostbinder freezes theirs away; otherwise a Knight's Sanctuary or
  Aegis and a Cleric's Barrier are the answers.
On the sheet a right-mix party (`PARTY_TEAM`) takes ~45 min; a lopsided one (no healer, Mage or Frostbinder) ~73 min on
the Root Warden with ~2,300 potions. Future bosses are held to the same checks (TOP BOSSES in `npm run economy`).
- Pyra's egg is `EGG_HP` of her max HP (her HP went up ~8.5× in SP6).
- Untested with people; the ultimate's chip and the top numbers were seen only on the sheet (a Root Warden hit on a test
  server took ~15% of a Lv 150's HP, DEF 0).

## Final bosses (FB1 (c), 2026-10-26; `story/final-bosses.md`, Ladon: `docs/places/ladon.md`)
A boss with `final` (a key into `FINAL`, `src/shared/final.js`) runs a final-boss brain instead of `bossBrain`. FB2
generalised FB1's engine: each FINAL row names its `brain` and `createFinal` (`server/final.js`) routes `tick`, `part`,
`hitHead`, `send` to it (`hydra`: Ladon's heads and coils, in that file; `wolf`: Fenrir's fetters, lanterns and sons,
`server/fenrir.js`, `docs/places/fenrir.md`), plus `son` for an add with `son` (stepMob). On the client `src/finals.js`
routes to one object per boss with the same face (`src/ladon.js`, `src/fenrir.js`): the `final` message by its `fb`, a
hit by the boss's kind, events, ultimates and drawing by room. What every brain shares: the loop runner (phases,
`name:2`, `shield`, `ult` with `alternateFrom`), the enrage clock, the S5 hookup below, and other targets on the boss
(`heads` on the mob: `h[4] = 2 + slot`, re-checked with `headReach`). A target can be a **prop** (`{ prop }` from
`part`, Fenrir's anchors and lanterns): `applyHits` then fills its ring but doesn't damage the boss or touch its
shields, elements and dots (the hit still counts as fighting it), and the client doesn't predict the boss's HP down.
E5 adds a FINAL row and, if it needs one, a brain with that face.
- **Owner's rules**: HP fixed for four (`bossMaxHp` returns `k.hp`: no `BOSS_HP_PER_PLAYER`, no floor), no reward
  window (`kill` pays every kill in full), every S5 mechanic on from the first slime (`partyAll`), Lv on the tag from
  `finalTag`, stats from the FINAL table. The economy sheet doesn't hold a final boss to `TOP_SOLO`.
- **Four phases** (`FINAL[row].at`, `finalPhase`: PHASE_AT's FINAL row), each a **written loop** run in order for ever
  (`loops`: a move, `name:2` every other loop, `shield` bark and ward by turns, `ult`), a short opening after each move
  (`FINAL_GAP_S`, where a queued stagger lands). Ultimates come on a timer in phases 1–3 (`ultEvery`, the first below
  `ULT_FIRST`), alternate from `alternateFrom`, and warn `FINAL_ULT_WARN`; a freeze in the wind-up interrupts them as
  on any boss (`interruptUlt`), and one nobody interrupts hits for `TOP_ULT_HP` (`top`). `startUlt` takes the forced
  ultimate; new kinds `heads` (safe gaps, `u.gaps`) and `strangle` (only the high arch: `LADON_HIGH`), judged on the
  client in `src/ladon.js`.
- **The loop drives S5's engine**: `partyTick` starts no focus, pulse, shield or weak point by itself for a final boss
  (its timers sit at Infinity); the loop's moves do: `watch` sets the focus for `WATCH_S` (Rally still takes it),
  `breath` sets `pulseAt` (`m.pulseN` counts the landings), `bark` / `ward` / `both` call `shieldUp`, `gaze` opens
  the weak point (`GAZE_WEAK` × its HP; filling it staggers `GAZE_STAGGER_S`). The curse keeps its own timer from
  phase 2. **Both shields at once** (`'both'`, `'w'` on the wire): magic wears the roses, heavy hits crack the bark,
  each one broken staggers and the other holds for its time (`breakShield(m, part)`, `partyHitMult`).
- **The heads** (`heads` on the boss): several targets on one boss, each with a ring (`HEAD_RING` of the plain hp).
  The client picks the part a hit is on (`Final.reach` / `reachAround`, from the Rpg's `ahead` / `around`, stored as
  `v.part`; a head in reach comes before the body) and sends `h[4] = 2 + slot`; `final.part` re-checks the reach
  (`headReach`: any arrow in range, any spell on a stump, anything else at the head's height) or falls back to the
  body, and `final.hitHead` fills the ring. Hits on a head skip the body's shields; a hit on a turned head's far side
  during a Coil (`throatOpen`) does `THROAT_MULT` and fills `THROAT_FILL` × as fast. Full: `HEAD_CHUNK` of max HP off
  the boss, `HEAD_ADDS` minions, a stump that regrows as two after `REGROW_S` (cap `HEAD_MAX`) unless a fire hit
  seals it (a fire spell, a burn, holy light: `fire` in `applyHits`). A new phase pushes every stump through again
  and tops up to its `heads` count. Heads act in turn (`nextHead`) and the acting one's eyes light first (`act`).
- **The coils** (phase 3 on): a hazard from both ends (`inCoils`, ouch `coil`: it hurts, it never blocks), a
  `COIL_STEP` in on each Breath landing, one back on each head cut or stagger, at most `COIL_STEPS`.
- **The enrage** at `FINAL_ENRAGE_MIN` of fight (`TEST_ENRAGE_MIN` in tests): stumps regrow at once and can't be
  sealed, the coils close to the middle over `COIL_ENRAGE_S`, an extra Breath every `ENRAGE_BREATH_S`, `finalRage`.
- State goes out as `{t:'final'}` (`docs/netcode.md`); everyone leaving resets the fight (`resetBoss`, `m.fin`).
- **Pay and art** (FB1 piece 3): numbers from the economy sheet's FINAL BOSSES (`docs/economy.md`), one weapon a kill by
  class (`twinPick`, a Cleric's rod: `docs/combat/items.md`); its track's intensity follows the phase and the enrage, and
  its death is slow (a final boss's ghost fades slowly while `src/ladon.js` sinks the heads). Ladon's look: `docs/places/ladon.md`.

## The reward window (S0, 2026-10-23)
Bosses still respawn every `BOSS_RESPAWN_MS`, but each slime gets a den boss's full EXP only once per
`BOSS_WINDOW_MS` (`bossAt` on the character: boss kind → when, saved, so relogging or a deploy doesn't
reopen it). Kills inside it give `BOSS_REPEAT_SHARE` of the EXP, on top of the over-level falloff
(`docs/combat/core.md`). Loot is one shared set per kill, so it rolls at full chance if anyone in the
fight has their window open, else every drop's chance is cut to `BOSS_REPEAT_SHARE`. A toast tells each
fighter which they got and how long is left. Why: camping Chronos every minute took players from Lv 80
to 390 in a few hours (`story/progression.md`). Rotating between dens is fine and intended. Field bosses
don't need it (`FIELD_BOSS_RESPAWN_MS` is longer than the window).

## The damage meter (owner, 2026-10-21)
- Every den boss and field boss counts the damage each slime has done to it (`dmg` on the mob in
  `server/rpg.js`, by name; overkill doesn't count) and sends it to the room as `{t:'bossdmg'}` while it
  changes. The client draws it on the right, under the boss bar (`drawMeter` in `src/rpg.js`): the top
  five with their share, and you always.
- **It can be hidden** (owner, 2026-10-26: clutter): the Esc menu's "Damage meter: on / off" (`meterOn` on the Rpg,
  remembered per device in localStorage, `src/main.js`).
- **Healing done and damage taken** (S3, for the Cleric and the Knight): under the damage, once anyone has
  some, the top three of each (`heal` and `taken` on the mob, sent as `h` and `k` on `bossdmg`). `credit()` in
  `server/rpg.js` adds to every den boss in the room and every field boss being fought there: a heal from
  `healFrom` (Jelly Heal, Mend, the wisp, Smite, the holy bolt), damage taken from a mob or boss in `hurt()`
  (capped at the HP that was left). A heal there also counts as fighting the boss (`hitters`), so a Cleric
  who only heals still gets the EXP and the loot roll. Same resets as the damage.
- **It starts over whenever the boss's HP does**: a respawn after a kill, a den boss healing when
  everyone left, a field boss healing when left alone. HP growing for more fighters
  (`BOSS_HP_PER_PLAYER`) and Pyra's Rebirth heal aren't resets. After a kill the den keeps showing the
  final standings until the boss is back.

## Ultimates: one-hit KOs, on purpose (the owner wanted real stakes)
First below `ULT_FIRST`, then every `ULT_EVERY` s, after a `ULT_WARN` warning banner (`drawUltBanner`: the boss and
the move's name, no line saying what to do: owner, 2026-10-26; it draws over the boss bar) with the safe spots
drawn. Likewise Pyra's egg bar reads only "EGG n / max" and Time Stop only "TIME STOP" and its countdown. The **client** decides whether you were safe and sends an `ult` ouch; the server KOs unless Aegis,
Bubble, Sanctuary or Second Wind save you.
- stomp: be off the floor · spores: stand in a safe circle · wave: jump the rolling wave · lanes: stand in
  the safe lane · nova: be `NOVA_SAFE` px away
- magma (Ignis): stand on the one ledge that holds · rebirth (Pyra): break her egg in time or everyone is
  KO'd and she heals · overclock (Colossus): three lethal zaps, safe columns far apart, needs Dash + Blink
  · timestop (Chronos): don't move · collapse (Chronos): void walls from both ends, Dash/Blink through one
- Dash/Blink i-frames don't save you from ultimates marked noDodge (all but collapse and wave).

## Status
Only bots have fought these; numbers are untested with people (`docs/ideas.md`).
