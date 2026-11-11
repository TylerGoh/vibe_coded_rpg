# Firefly Hollow (room 74, Lv 150–155, Lantern Fen's easy pocket)

Atlas Phase 8, L1 (`story/phase8-plan.md`; the town is `docs/places/fen.md`, the room it hangs off `docs/places/shallows.md`).
Down the side path off the Shallows' Reedbeds: a calm glade under old willows, still water like glass, and more fireflies
than anywhere else on the Fen. Easy and quiet on purpose: good for newcomers to the island and for sitting and chatting.

Files: the room in `src/shared/rpg.js` (`FIREFLY`, `FIREFLY_W`, `FIREFLY_EXIT_X`, `FIREFLY_RING_X`, `FIREFLY_ZONES`,
`FIREFLY_PLATFORMS`, the `STAGES` row, the fen newt, its material and the spawns), `ROOMS[FIREFLY]` and its door in
`ROOMS[SHALLOWS]` (`src/shared/sim.js`), its drawing in `src/firefly.js` (`drawFirefly`; the sky is Wickmere's
`drawFenSky` / `drawFenAir`, the water, reeds, tussocks and pads are the Shallows' exported helpers), the newt and its
material in `src/grove-art.js`, the way in (`willowfall` drawn open: `drawWillowfallOpen` in `src/branch-gates.js`), the
`firefly` music scene in `src/audio.js`.

## The room
West to east (`FIREFLY_ZONES`):
- **The Willow Gap** (no mobs): where the great willow that fell across the side path was sawn through, its two ends
  pushed back either side of the way, sawdust on the peat. The way back up to the Shallows is its west end.
- **The Glade** (150–152): mossy logs, a low willow bough; fen newts and the Shallows' lantern moths.
- **The Still Pool** (152–155): lily pads, a peat tussock; bog slimes and newts.
- **The Sitting Stones** (no mobs, `FIREFLY_RING_X`): a ring of low flat stones worn smooth on top round a very small, very
  old peat fire, a lantern on a willow stake. Where the fen folk come to sit with their dead and say nothing much (Wren,
  Hob and Sedge all speak of it). The find for chatting, not reading.
- **The hidden spot** (last in `FIREFLY_PLATFORMS`): the high willow crook above the bough, a hollow full of glow-worms.
- No waystone: it's beside the Shallows' Landing Stage stone (the Black Sands' rule, next to town).

## Its mobs (on the frozen curve; no elites, no field boss)
- **Fen newt** (151): a little dark-olive newt with orange spots and a frilly crest; a plain aggressive hopper. Material:
  the fen newt tail.
- It shares the Shallows' **lantern moths** (150) and **bog slimes** (152), placed lower in the band than in the Shallows.

## Decisions and history
- 2026-11-11: built in L1 with the Drowned Grove and Long-Neck. **Not played by anyone yet.** Hob and his two eldest sawed
  the willow through (the personas say so); the update itself lifted the gate (owner's rule: no unlock quest).
- One new mob, not the plan's "low mobs" plural: the 150–155 slice already had the Shallows' four, so the Hollow reuses
  two of them and adds the newt.
