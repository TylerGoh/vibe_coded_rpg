# The Helm (room 92, `HELM_DEN`): the Helmsman, the Citadel's party den

The Citadel's depth pass, **C4** (`story/citadel-plan.md`). The way in is at the Engine Halls' east end
(`HELM_GATE_X`, `docs/places/engine.md`). The bulkhead there was sealed "while under way" from C3 until C4 unsealed it
and swung it back on a lit stair (the update did it, no quest). The Helm is a den, so its door is the den's own:
`denDoors(ENGINE)` from its `DENS` row, drawn by the den's entrance art as the bulkhead's open look (`CITADEL_OPEN.bulkhead`).
The `helm` node on the island map has `rooms: [HELM_DEN]` and no `entry`, so the door isn't drawn twice.

Files: the den's `DENS` row, `MOBS.helmsman`, its items (`heading_blade`, `heading_staff`, the `heading_bow` row,
`helmsman_cap`, `wheel_peg`) in `src/shared/rpg.js`; the den, its entrance, the Helmsman, The Last Heading's look
(`HELM_ULT`) and the freeing (`drawHelmFreed`) in `src/dens-helm.js` (theme `helm`, registered in `src/dens.js`: `FXPAL`,
`THEME_RGB`, the summon and roar colours); the gear's art in `src/bells-art.js` (`drawHeadingBlade`, `drawHelmsmanCap`; the
staff and bow are rows in `src/staff-art.js` and `src/bow-art.js`); the `horn` pulse in `src/party.js`; the gear's effects
(`steady`, `keel`) in `src/shared/gearfx.js`; the `helm` music scene in `src/audio.js`.

## Who he is
The plan: a great brass automaton at a ship's wheel the size of a house, still holding the city on its last heading. The
city circles over the place where Pangelea's heart used to be, because nobody ever came up to the bridge to tell it to
land. **Holding on: the course.** He's tall and narrow-shouldered, in a long coat of riveted plate that flares to the deck
like a ship's officer's. His big four-fingered hands are held out as if on spokes, and he has one great compass for an
eye, its needle pinned on the heading (wild when he heaves). He wears a peaked brass cap with a gyroscope in its crown. An
open hatch at his back shows his clockwork turning, with the shard in it.

## The den
The city's bridge, high in the bow. A long curved window across the back looks out over clouds that slide past slowly,
always the same way (the city circling). The great wheel stands on its pedestal in the middle of the bridge, held a hair
either side of the heading. Brass dials line the sill (the heading dial's needle never moves) and speaking tubes run up
the frame. The ledges are iron instrument galleries hung off the frame, and the name is on a brass plate under the
window's top rail.

## The fight (`bossBrain`, three phases)
- **Moves:** slam, charge, beam (style `arc`, the Engine Halls' arc along the deck), then rain and summon (governor balls
  shaken loose from the engines below), and in phase 3 barrage and grid. Ultimate: **The Last Heading**, the `wave` ult
  drawn as a bank of cloud driven the length of the bridge as he puts the wheel hard over (`HELM_ULT`, `cloudMass`). Jump
  it.
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`):
  - **the deck heels over** as he turns the wheel, in every phase, steeper each (`tilt`, Brenna's tilting floor);
  - from phase 2, **fake-outs** (`offslam`: he heaves on the wheel and doesn't turn);
  - in phase 3, **hard about** (`reverse`, the controls swap: the whole bridge comes round);
  - the **gear lock** on his armour (`lock`, 2+ fighting, the Colossus's: everyone's arrows at once break it).
  - The punish window, as in every den.
- **Party mechanics** (`partyDen`, `partyLive`, `top`; the plan's "focus, armour, pulse, interrupt"): focus (his compass eye
  fixes one slime), armour (`looks.shell: 'brass'`), pulse (the city's horn over the bridge, `looks.pulse: 'horn'`, "HOLD"),
  a **weak point in the open hatch at his back** (`weak.back`), adds (governor balls), and interrupt (freeze The Last
  Heading as he heaves). The party splits into whoever gets round behind him for the shard, and armour-breakers or the
  lock.
- **`lines`**: on entering, "Clear the bridge. We hold this heading. We have always held this heading." The phases go from
  "No order to land. No order to turn. Then we hold the course. We HOLD." to "Hard over! HARD OVER! ...No. No. Back to the
  heading. Back to the heading. HOLD!" Freed: "...No one is coming up to tell me. No one ever was. Then I will take my hands
  off the wheel. There. She will go round on her own. She always could."
- **Freed** (`drawHelmFreed`, `HELM_FREED_S`): he takes his hands off the wheel, lets his arms down and stands still. The
  wheel holds a beat, then goes round on its own, faster and faster. The den keeps it spinning free until he's back (the
  shard pulls him back, like every boss). The city keeps circling: that's the finale's, not his (the plan). It's the den's
  own moment, per kill. There's no world change and no story tier.

## Rewards
The Last Heading with its twins (the Compass Staff, the Wheelwood Bow), the Helmsman's Cap (Lv 193, 10 slots,
`BOSS_GEAR.top`), Wheel Pegs, coins, and the mini Helmsman at the Pet Shop. As a `top` boss, his gear carries effects
(`docs/combat/items.md`):
- **Steady As She Goes** (the weapons): go `STEADY_S` without being hurt and your hits do `STEADY_DMG` until something hits
  you (the client reads its own last ouch, `hurtAt`). Cost: max HP × `STEADY_HP`.
- **Even Keel** (the cap): nothing knocks you back (`GX.KNOCKFREE`) and a tilting floor doesn't slide you (`GX.NOTILT`, in
  `step()`). Cost: no dash (`GX.NODASH`).

## Decisions and history
- 2026-11-14: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet**; checked as
  the Bell Walks were (`docs/places/bellwalks.md`).
- Liberal decisions: Lv 191 (the plan's ~190, just over the Engine Halls' top); the challenges (the tilt, fake-outs, hard
  about, the gear lock), since the plan named only the party mechanics; the weak point at his back; governor balls as his
  adds, so nothing new was needed in the halls; the gear's effects.
- Personas that changed: Number Nine (the bulkhead opened, the Helmsman on the bridge, "then who's steering?").
