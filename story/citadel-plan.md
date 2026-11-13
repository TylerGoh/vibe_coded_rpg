# The Citadel's depth pass (C0–C6), on paper (for the owner to approve)

**Status: approved 2026-11-13 (the owner's "continue with next phase": every default stands); C0 built the same day
(`docs/places/citadel.md`, `docs/places/gardens.md`), C1 (`docs/places/orrery.md`), C2 (`docs/places/archive.md`) and C3 (`docs/places/engine.md`). Revisions at C0: the band stretched past 200 as the owner's 2026-11-12
note asked (the Keel 188–200, the Bell Walks 195–208, the Undercroft 205–215, the Escapement fought at ~215; the Engine
Halls 175–190 and the Helm ~190 as written), and the Engine Halls' blast door is in the Spire (room 13), not the Orrery.
Written 2026-11-11 at the owner's ask ("why does Aether Citadel just end abruptly? why aren't there a
lot of bosses and things to choose from?"). Order (owner, 2026-11-11): after the Wickmother (atlas Phase 8 L5),
before Amberdune (Phase 9) `[default]`.** It follows `world/island-depth.md` (the method and the "deep" checklist)
the way `world/emberdeep-depth.md` and `phase8-plan.md` did, and the owner's story rules in `roadmap.md`. Read
`world/regions/citadel.md`, the Citadel in `world/atlas.md`, `arcs/main-arc.md` (Act IV and the finale) and
`characters/mochi-and-chronos.md` first. Marked `[default]` = what gets built unless the owner says otherwise;
everything named here is `[proposed]` until it ships. The owner's calls are in **Open decisions** at the bottom.

## Why the Citadel feels short
Every other island got a depth pass; the Citadel never did. It is still the old stage 4: one room (room 13,
`CITADEL`: Cogwork Bastion west, the Chrono Spire east) with two dens (the Clockwork Colossus, Lv 150; Chronos,
Lv 170), plus Phase 6's camp and Skydocks in front of it. No branches, no pockets, no field bosses, no elites, no
party den, no final boss, no island map. The atlas had it as "none: Chronos is the end", which made sense while the
game had a level cap; the owner dropped the cap on 2026-11-06 and the Citadel was never revisited.

## The idea
The Citadel stays what it is: **solemn, no whimsy, no living people**: machines still doing their last jobs and
echoes of Keepers replaying their last hour (`delivery.md`: "It still keeps time. Whose, is unclear."). The depth
pass gives it the rooms a seat of the Keepers would have had (their gardens, their star-hall, their records, the
engines that hold the city up, the bells at the top, the keel underneath), each one a **machine or a place still
holding on to the moment before the Stopped Hour.** Freed, each lets go a little. None of it restarts the Wheel:
that stays the finale's (Phase 10, a server-wide event).

**Chronos stays where he is** `[default]`, the story's climax at Lv 170, unchanged. Beating him frees Pell, but the
city still doesn't turn: something underneath is still holding the Wheel. That is the final boss (below), and it
points straight at the finale without closing anything in canon.

## The band: Lv 140–200 `[default]`
- The atlas's band for the Citadel, now filled. Today it runs 135–170 (the Skydocks to Chronos); the pass adds
  155–200. Its middle overlaps Lantern Fen (150–180), so from 150 to 180 there are two islands to choose between;
  **180–200 is the Citadel's alone**, the game's new top. The frozen curve already runs to Lv 200
  (`src/shared/curve.js`).
- **Owner, 2026-11-12: "don't be afraid to make the levels go past 200."** Lantern Fen's deep room now runs to 190 (L5 (b),
  the Wickmother at Lv 190, tag 210), so 180–190 is shared and the Citadel's top can go well past 200: when this plan is
  revisited, stretch its last places (the Bell Walks, the Keel, the Undercroft) and the Escapement to ~200–220 or beyond
  rather than squeezing into 200. The curve carries on past its last knot as a power law, and the sheet reads past 200.
- **No new canon tier.** The Citadel is Tier 4 already (`canon.md`); the new places show Tier 2–4 things (fallen
  stars, the Wheel, the Keepers' city) without anyone saying them. The "deliberately open" list stays open (who the
  other Keepers were: records with names scratched out, never named).
- New mobs on the frozen curve; gear in the Citadel's register: clock-brass, aether-glass, Keeper silver, bell
  bronze, star-iron.

## The Citadel's map `[proposed]`
```
                         [the Bell Walks 188-198]  -- the Great Bell (field boss)
                                  |  the stair above the Sanctum (frozen rain)
 camp -- [Skydocks 135-145] -- [room 13: Cogwork Bastion 140-155 | Chrono Spire 156-170]
                                 |    |    |                 |         |
                                 |    |  the Grand Foundry   |   the Hour Sanctum (Chronos)
                                 |    |  (the Colossus)      |
          [the Keepers' Gardens 145-152] easy   [the Orrery 160-170] -- Meridian (den)
                                 |    |                      |
                                 |   [the Engine Halls 175-190] -- the Helm: the Helmsman (party den)
                                 |        the Stormcoil (field boss)
                       [the Archive 165-178] -- the Indexer (den)
                                 |
           the Foundry's maintenance hatch: [the Keel 183-193] hard pocket, elites, the Rustwyrm (field boss)
                                 |  down among the Wheel's lowest teeth
                       [the Undercroft 192-200] (deep room)
                                 |  the Spoke (approach)
                       [the Catch] -- the Escapement (final boss)
```
Every 5-level slice has two Citadel places (the checklist): 140–145 the Skydocks and the Bastion; 145–155 the
Bastion and the Gardens; 155–160 the Bastion's top and the Spire (and the Fen); 160–165 the Spire and the Orrery;
165–170 the Orrery and the Archive; 170–175 the Spire's top and the Archive; 175–180 the Archive and the Engine
Halls; 180–190 the Engine Halls and the Keel; 190–195 the Bell Walks and the Keel; 195–200 the Bell Walks and the
Undercroft.

**Room 13 stays one room** `[default]`: its den doors, saved positions and waystones keep working. The branches
open off it through gates. It gains a field boss and a trader (C0).

### The branches
- **Cogwork Bastion, more of it** (room 13's west half, C0): **the Siege Engine** (field boss, ~Lv 154), a wall
  engine on tracks still defending the Bastion against an attack that never came (rams, a slow volley of bolts).
  **The Commissary** (trader `[default]`: a vending automaton still issuing kit to Keepers' guards; gear tier aim
  ~150, the basic potions). Find: a duty roster with every shift filled in to the end of time.
- **The Keepers' Gardens** (145–152, easy pocket, up from the Bastion): roof gardens open to the wind, dead beds,
  dry fountains, brass watering automata still tending soil where nothing grows. Low, mostly gentle mobs
  (gardener drones that drift and sprinkle, seed moths, hedge shears that snip if you crowd them). Good for alts and
  sitting. Find: one living thing, a sapling in a cracked urn, its leaves the apple tree's shape (shown, not named:
  the Heartroot is Tier 4).
- **The Orrery** (160–170, side branch off the Spire's foot): the Keepers' star-hall under a cracked glass dome, a
  great orrery whose brass arms sweep overhead with the planets on them. **Armillary rings** (roll), **star-glass
  wisps** (fly, phase), **astrolabe sentries** (a sweeping laser, like the sentry drone's but on a turn). Den
  **Meridian** (~Lv 168): the orrery's engine, a brass armillary sphere the size of a house that keeps dragging
  the stars back to where they were before they fell (holding on: the old sky; freed, its rings come to rest and
  the dome shows the sky as it is now). Find: a star chart with the stars drawn twice, once as they were, once as
  they are, in two inks. **The Last Echo** (AI, Tier 4, already planned for the Spire) ships in this phase,
  standing in the Spire near the Orrery's door.
- **The Archive** (165–178, side branch off the Bastion, down): the Keepers' records, shelving out of sight in
  every direction, loose pages drifting **upward** (time is wrong here too). **Page swarms**, **ink slimes**,
  **binder automata** (a shell: hit them from behind), **index moths** (dive). Den **the Indexer** (~Lv 177): a
  cataloguing automaton that has been filing the same last day for an age (holding on: the record of the last
  day, kept perfect; freed, it files the last page and closes the drawer). Its trader `[default]`: **Folio**, a
  small archive automaton (AI, Tier 4 at most, a librarian's dry manner; gear tier aim ~172, potions). Find: a
  ledger of Keepers with every name but one scratched out, and that one is Pell's (Tier 4; deliberately open: the
  others stay unreadable).
- **The Engine Halls** (175–190, main trail up from the Orrery): the engines that keep the city in the sky, huge
  aether turbines, blue fire behind glass, catwalks over a drop to the clouds, wind through every grating.
  **Stoker automata**, **arc jellies** (fly, a shock ring), **turbine blades** (spin across the catwalks: a room
  hazard like the gusts, drawn and server-ticked, no `step()` change), **governor balls** (heavy, roll). Field boss
  **the Stormcoil** (~Lv 186), an aether coil come loose and arcing. Trader `[default]`: **Number Nine**, the last
  stoker automaton still on shift (AI; gear tier aim ~185, potions).
- **The Helm** (the party den, ~Lv 190, at the Engine Halls' top): **the Helmsman**, a great automaton at a ship's
  wheel the size of a house, still holding the city on its last heading, circling over the place Pangelea's heart
  used to be, because nobody told it to land (holding on: the course; freed, it lets go of the wheel and the wheel
  spins free; the city keeps circling, it always will until the finale). Built for a mixed party (focus, armour,
  pulse, interrupt) with challenges from day one.
- **The Bell Walks** (188–198, main trail's top, up the stair above the Hour Sanctum): open galleries round the top
  of the Spire, the great bells stopped mid-swing, frozen rain hanging in the air, the whole archipelago tiny below.
  **Bell wraiths** (echoes of the bell-ringers: phase), **clapper knights** (aether knights' heavier kin, blink),
  **frozen-rain shards** (rooted, fire hanging drops). Field boss **the Great Bell** (~Lv 196), a bronze bell that
  rolls itself, tolls (rings to jump) and stops time in a ring. Find: the bell-ringers' rope, cut.
- **The Keel** (183–193, hard pocket, through the Grand Foundry's maintenance hatch in room 13): the hollow under
  the city among the Wheel's lowest teeth; dark, closed in, ticking that is always one beat slow. Elites; **gear
  lice**, **chain hounds**, **keel wardens**; field boss **the Rustwyrm** (~Lv 191), a serpent of linked chain that
  hangs from the dark. Find: the snapped tooth's empty socket (the tooth is on the Bearer's Seat in Emberdeep: shown,
  not said).
- **The Undercroft** (192–200, the deep room past the Keel's far end, C6): the darkest place in the Citadel, the
  owner's "trapped" mood (`final-bosses.md`): the Wheel's underside overhead, teeth as big as houses, no light but
  aether leaking from cracks. Elites throughout, no waystone.

### The final boss: the Escapement `[default]`
The Wheel's catch: the great toothed anchor that let the Tidewheel turn one tooth at a time. In the Stopped Hour
Chronos told it to **hold**, and it has held ever since, clamped on the jammed Wheel in the dark at the bottom of the
city, with a shard in it. Beating Chronos frees Pell; it doesn't free this. Reached the way the other final bosses
are: the Keel (the pocket), the Undercroft (the deep room), and an approach, **the Spoke**: a long walk down one of
the Wheel's spokes, the ticking getting louder and slower until it's a heartbeat, the Escapement's shape seen
through the teeth growing as you go, the way back closing in the art. Den: **the Catch**. Four or more at Lv 200
(its own level shown far higher), about 45 minutes, its own `c6-plan.md` when its phase comes (like `fb1-plan.md`).
The shape: it swings like a pendulum across the den (the floor safe only in its beat), it grips and holds (cages,
the snare), its last phase stops the whole den but for the slimes who keep moving in time. **Freed:** it unclenches,
and the whole city ticks **once**, heard in every Citadel room, and stops again (per character, Phase 7's freed
world changes: `docs/social/story.md`). The Wheel stays jammed for the finale. Drops: class weapons, a hat, a mini
Escapement.

## The phases (each one or two sessions; the roadmap tracks them)
Each phase shows the next but doesn't open it (owner's rule): a blocked way with an in-world reason, lifted by the
update that ships it. **All the gates are laid in C0** `[default]`, so the Citadel shows its whole shape from the
start:
- the Orrery's door: a combination lock still turning on its own, never stopping (C1 stops it);
- the Archive's stair: an iron shutter down, a sentinel stamp on it (C2 raises it);
- the Engine Halls' catwalk: a blast door venting steam too hot to pass (C3 vents it);
- the stair above the Sanctum: a wall of frozen rain you can't push through (C4 lets it fall);
- the Foundry's maintenance hatch: clamped shut under a jammed gear (C5 frees it);
- the Keel's far end: a tooth fallen across the way down (C6).

Phases:
- **C0, the groundwork:** the Citadel island map (the World map's tap works), waystones in the Bastion and the Spire
  (`isle: 'citadel'`), every gate laid, the Siege Engine (field boss) and the Commissary in the Bastion, the Keepers'
  Gardens (easy pocket), the Spire's zone label fixed to 156–170.
- **C1, the Orrery and Meridian**, and the Last Echo in the Spire.
- **C2, the Archive and the Indexer**, and Folio.
- **C3, the Engine Halls**, the Stormcoil, Number Nine.
- **C4, the Helm (the Helmsman, the party den) and the Bell Walks** with the Great Bell.
- **C5, the Keel** (hard pocket, elites, the Rustwyrm).
- **C6, the Escapement:** (a) its plan on paper, (b) the Undercroft and the Spoke, (c) the Catch and the fight, its
  art, music and drops.

That's **eight new bosses** (two dens, four field bosses, a party den, a final boss) beside the Colossus and Chronos,
six new fighting rooms, three traders, the Last Echo, and a find in every branch.

Every phase: mobile and touch, the economy sheet (`npm run economy`, prices by the aim-level method), music scenes,
docs (`docs/world.md` for new rooms, `docs/places/branches.md` for gates, a doc per place), and boss challenges from
day one (`docs/combat/challenges.md`: each new boss gets a `ch` list as it ships).

## Open decisions (each has a default)
1. **Order.** Settled (owner, 2026-11-11): after the Wickmother. Default: before Amberdune.
2. **The band.** Default **Lv 140–200** (the atlas's), making the Citadel the game's top; since the owner's 2026-11-12 note,
   past 200 is welcome (~140–220). Alternative: stop at 200.
3. **Room 13.** Default: **stays one room**, branches off it. Alternative: split the Bastion and the Spire into two
   rooms (more space for each; moves den doors and saved positions).
4. **Chronos.** Default: **stays as he is** (Lv 170, the story's climax). Alternative: rebuild him as the final boss
   at the bottom of the Keel (then the Escapement isn't needed).
5. **The final boss.** Default: **the Escapement**, the Wheel's catch. Alternative: something in the Bell Walks (the
   Great Bell grown into the final boss; but the top of the spire is open sky, not the "trapped" mood).
6. **Traders.** Default: **automata still on duty** (the Commissary, Folio, Number Nine), so the city keeps no
   living people. Alternative: Tamp and Kestrel set up stalls deeper in.
7. **Names** (the Siege Engine, the Keepers' Gardens, the Orrery, Meridian, the Archive, the Indexer, Folio, the
   Engine Halls, the Stormcoil, Number Nine, the Helm, the Helmsman, the Bell Walks, the Great Bell, the Keel, the
   Rustwyrm, the Undercroft, the Spoke, the Catch, the Escapement): proposed.
8. **Its freeing.** Default: **one tick of the city**, per character; the Wheel stays jammed for the finale.
