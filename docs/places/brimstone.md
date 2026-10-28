# The Brimstone Fields (room 59, `BRIMSTONE`): Lv 125–140, Picker Ochre, the Breathing Stone, the Organ, the Brimstone Condor

Emberdeep's depth pass, phase E3's first piece (E3a; `story/world/emberdeep-depth.md`, "The Brimstone Fields"): a
branch on the volcano's cone above Magma Heart. You reach it up the flank at `BRIMSTONE_GATE_X` in the Caldera room.
The vent field fumed across the path there (E0's gate, `fumes`); the update itself lifted the block, no quest
(owner's rule): the wind on the flank turned, the fumes lean off the path, and Picker Ochre cairned it.
`src/branch-gates.js` draws `OPEN.fumes` (`drawFumes` with an `open` flag, the F3 pattern: thin threads of fume
blowing east, cairns all the way up, a yellow rag on the top one). **You come in at the EAST end** (`BRIM_EXIT_X`)
and climb west, harder as you go (`BRIM_ZONES` run hard → easy by x, like the Ashwood and the Coast; each zone's sign
stands at its east edge). The top of the Fields (the west end) is where the Caldera Rim begins. Don't "fix" the
direction.

- Data: `BRIM_ZONES`, `BRIM_PLATFORMS`, `OCHRE_X`, `BRIM_STONE_X`, `RIM_GATE_X` and the spawns in `src/shared/rpg.js`;
  the room and the door pair in `src/shared/sim.js`. Art: `src/brimstone.js` (the room, `drawBrimstone`),
  `src/brimstone-art.js` (mobs, the Condor, gear, icons, Ochre's dress; the staves and bows are rows in
  `src/staff-art.js` and `src/bow-art.js`).
- The look: Emberdeep's harshest palette, still soft and rounded. A hazy yellow-grey sky, the cone's upper slope rising
  west to the crater's lip with the smoke column pouring off it, the sea a pale band far below. Dark crust with a
  yellow lip that gets heavier toward the top, fumaroles puffing (`VENTS`, bigger toward the High Vents), acid pools
  in the ground of the Acid Pools (`POOLS`, drawing only: they don't hurt), sulphur chimneys in the background and as
  platforms, yellow fume drifting through, thicker at the top.
- East to west: **the Picker's Camp** (no mobs: Ochre's lean-to of iron sheet and old basket hoops, its roof a
  platform, her stack of full baskets and spare yoke, a water butt; the Breathing Stone; the waystone; the sign back
  to Magma Heart), **the Yellow Crust** (hoppers, acid slugs), **the Acid Pools** (vent crabs, fume wisps) and **the
  High Vents** (sulphur kites, chimney spitters, the Condor, the Organ), with **the Bearers' stair** at the very west
  end (`RIM_GATE_X`, the Caldera Rim's way up since E4a, below).
- **The Organ**, the find (last in `BRIM_PLATFORMS`, `organ`): a cluster of open-topped sulphur chimneys round the
  tallest, which has a ledge on top, reached from its shoulder (the `chimney` platform before it in the list). When
  the wind gusts, rings of sound lift off the pipes' mouths (and the music plays the chord). A worn sitting place, kite
  feathers wedged in a crack. Ochre hints ("climb the tall chimney and keep going; you'll hear it first").
- **The Breathing Stone** (`RUIN_STONES`, shape `breathing`, `src/ruins.js`): a tall stone crusted yellow at its foot,
  a thread of fume beside it. Carved twice: the mountain breathing in (the islands drawn close) and breathing out (the
  islands pushed far off, waves between), a gear between with an arrow going back round. Emberdeep's tier by showing
  only: never the Tidewheel, the Stopped Hour, Chronos or Pell. Ochre talks to it some mornings.
- **Waystone** `brimstone` in the camp past the stone (`isle: 'ember'`, `src/shared/waystones.js`).

## The Bearers' stair (the Caldera Rim's way up; lifted in E4a)
**E4a opened it** (`docs/places/rim.md`): Slag forged new hand-chains, Ochre hung them, the fallen top steps were rebuilt
in iron. The `rim` node has `rooms` and an `entry` here (`bearerstair`, drawn open), and `ROOMS[BRIMSTONE]` has the door up
at `RIM_GATE_X` (its Lv chip from `STAGES`). Ochre's, Ash's, Soot's and Slag's personas say so. How it was laid (E3a):
the Rim lost `past` and got its gate here (`EMBERDEEP` in `src/shared/branches.js`, kind `bearerstair`, drawn by
`drawBearerStair` in `src/branch-gates.js`, sign at `SIGN_AT.bearerstair`): old steps cut steeply up a rock rib toward
the rim, iron stanchions and hand-chains along them; the fumes ate the iron, the chains rusted through and hang slack,
and the top steps fell away with them. E says so (`says`, under the toast's ~90 characters). `drawBearerStair` already
has its `open` look (new chains, the gap bridged with iron steps) and `OPEN.bearerstair` is registered, so shipping the
Rim (E4) is data plus its rooms: give the `rim` node `rooms` and an `entry`, add the door to `ROOMS[BRIMSTONE]`, and
update the personas that mention the stair (Ochre, Ash). Nobody says who the Bearers were (Brenna is E4's story).

## Picker Ochre (AI trader, `docs/social/ai-characters.md`)
A forge-slime (`folk: 'forge'`, hue 40) who picks sulphur off the vents and carries it down to Forgehold's forges in
two baskets on a yoke. Accessory `picker` (`drawPickerDress`): a wide straw hat stuck with kite feathers, a wet cloth
round her neck, the yoke across her shoulders with a basket of sulphur at each end and **Saffron**, her canary, in a
little cage hooked on it (hopping, singing now and then). She lost her sense of smell to the fumes (misses rain most),
goes by Saffron for bad air (her third Saffron), sings to the vents, and is the plainest-spoken person on the island.
Tier 0 plus her corner (the Fields and its mobs, the Condor, the fumes turning, the Bearers' stair (she doesn't know who
the Bearers were), the Breathing Stone, the Organ, Forgehold's people). Shop `ochre` (`SHOPS`): the basic potions and a
tier aimed at Lv 135 (`aim`): the Brimstone Pick, its Picker's Staff and Picker's Bow twins, the Picker's Fume Mask.

Personas that learned she exists in the same update: Ash (the Fields' dangers instead of the fumes in his shut-ways
list; he likes her; won't go near the stair), Soot (makes her sit in the springs till the yellow comes off), Slag
(asked her what the vents smell like).

## Mobs (on the frozen curve)
- brimstone hopper (passive, `hops`, Lv 127) · acid slug = `trail` with the new `acid` puddle style (`drawAcid` in
  `src/hazards.js`, drawing only: it burns like any trail; Lv 129) · vent crab = `shell` (~124% HP like the other shell
  mobs; Lv 132) · fume wisp = `phase` (`fly` 44; Lv 134) · sulphur kite = `dive` (`fly` 62, under the 70 px notice
  limit; Lv 136) · chimney spitter = a rooted `lob` (`speed: 0`, `anchored`, `keep: 0`, like the lava drip and the
  pitcher plant) with the new `sulphur` shot style (`SHOT.sulphur`; Lv 138). Voices borrowed (`MOB_HURT` /
  `MOB_DEATH`). No elites (not a hard pocket).
- **The Brimstone Condor** (field boss, Lv 140, `desc` is its line): a great bald vulture, wings ragged at the tips
  and crusted yellow along the leading edges, a ruff of grey down, a bare grey-pink head. Passive until hit, then the
  `dive` brain (`fly` 90: field bosses can hover high, they don't need to notice anyone). It roams the High Vents.
  S5.4 party pair: `focus` and `pulse` (its wingbeats whipping the fumes into a gust; `looks.pulse: 'steam'`). Its pet
  is in the Pet Shop (`PETS`).

## Gear (`docs/combat/items.md`)
Ochre's tier (Lv 131, `aim` 135): Brimstone Pick / Picker's Staff / Picker's Bow, Picker's Fume Mask. Mob drops at
their mob's level: the Fumarole Helm (vent crabs), Kitetalon / Kitetalon Staff / Kitetalon Bow (sulphur kites). The
Condor a step over (Lv 142): Condor Pinion / Pinion Staff / Condor Bow, Condor Helm. Materials from every mob (hopper
leg, slug acid, vent carapace, fume crystal, kite plume, spitter's sulphur, condor quill). Ids checked unique across
`ITEMS` (the Black Sands' toad wart is already called "Sulphur Wart"). Names in Emberdeep's register (sulphur, slag,
iron; "Forged for a wheel that never got it").

## Decisions and history
- 2026-10-28: built as E3a (E3's first piece; the Old Foundry is E3b). Liberal decisions (owner's standing
  instruction): the block lifted by the wind turning and Ochre's cairns, east entry with the Rim's stair at the top
  (west) end, zone names, the camp as the hub, the Organ's chord drawn as sound rings, Saffron as her third canary,
  the Condor's `focus` + `pulse`, gear names. Music scene `brimstone` (`docs/ui/audio.md`).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
