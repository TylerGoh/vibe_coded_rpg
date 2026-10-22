# The Whale Skerries (room 37, `SKERRIES`): Lv 55–70, Hakon, the Old Narwhal (den 38)

Frostpeak's depth pass, phase F2 (`story/world/island-depth.md`): low black islets and shingle along the
fjord's outer shore, out of Icefang Hamlet's west end along the shore path. The snow slide that buried the
path is dug through (`src/branch-gates.js` `OPEN.snowslide`: the heap cut in two, the marker posts stood back
up, shovels left in the bank). **You come in at the EAST end** (`SKERRIES_EXIT_X`; the hamlet lies east) and
walk west, deeper and harder, so its zones run hard → easy by x (`SKERRIES_ZONES`), like Saltspray Coves.
Don't "fix" this.

- Data: `SKERRIES_ZONES`, `SKERRIES_PLATFORMS`, `HAKON_X`, `NARWHAL_DEN_X`, `GROTTO_GATE_X` and the spawns in
  `src/shared/rpg.js`; the room and its doors in `src/shared/sim.js`. Art: `src/skerries.js` (the room),
  `src/skerries-art.js` (mobs, gear, icons, Hakon's clothes; the Grotto's mobs too), `src/dens-skerries.js`
  (the den, its way in, the Old Narwhal).
- Grey, cold and quiet: a pale low sun, the open sea behind with more skerries and floes on it and the far
  islands on the horizon, sea smoke drifting over the water. To the west the sea fills with pack ice: the
  Old Narwhal holds it shut across the outer sound.
- East to west: **the Whaling Hut** (no mobs: Hakon's stone hut with a turf roof, which is a platform, and a
  whalebone arch over the door; his carving bench; the old try-pot; the drying racks; the Sounding Stone and
  a waystone), **the Black Skerries** (ice seals, skuas), **the Whalebones** (sea urchins, whalebone crabs;
  Grandmother's skeleton: her jaw, backbone and a fallen rib are platforms) and **the Floe Edge** (sea smoke,
  bull walruses; the floor turns to sea ice; the Old Narwhal's breathing hole and, at the very end, the sea
  cliff with the Narwhal Grotto's mouth in it: `docs/places/grotto.md`).
- **Grandmother's Crown**, the hidden spot (last in `SKERRIES_PLATFORMS`): the top of the whale skull,
  reached up her backbone. Hakon's first carving, a little bone seal, sits there. His persona only hints.
- **The Sounding Stone** (`RUIN_STONES`, shape `sounding`): a Keeper stone on a black rock by the hut. Two
  islands drawn very close, an arch over the water between them, a line of whales swimming nose to tail
  under it ("THE WHALE ROAD"), off the stone's south edge toward the now-wide sea; a newer narwhal scratched
  at the end, facing back. Frostpeak's tier (canon Tier 2) by showing only; never Pangelea, the Wheel or the
  Stopped Hour.
- **Hakon the Bone-Carver** (`hakon`, `docs/social/ai-characters.md`): fjord folk (`folk: 'fjord'`, dress
  `bonecarver`: the Sealskin Hood with a whalebone comb in it, an oiled coat, a carving knife, shavings). He
  carves only bone the sea gives (his grandfather was Frostpeak's last whaler) and trades (`SHOPS.hakon`):
  potions, the Bone-Carver's Saber / Driftbone Staff and the Sealskin Hood, aimed at Lv 60. His life: sweet
  on Captain Brine, who has never noticed him waving from the point; plays a bone flute badly. Named Hakon,
  not Bjarni: Runa's husband is Bjarn.

## Mobs (on the frozen curve)
- ice seal (passive) · skua = `dive` (`fly` 62) · sea urchin = `lob`, `anchored`, `style: 'spine'`
  (`src/hazards.js`) · whalebone crab = `shell` (a bit of whale skull worn in front) · sea smoke = `phase` ·
  bull walrus = `stomp` (a small one: rears up and slams the ice; be off the floor).
- No elites, no field boss here: the den is the Skerries' big fight.

## The Old Narwhal (den 38, The Breathing Hole, Lv 70)
A big boss with a story (`story/characters/bosses.md`) and `lines`: the last of her pod, who stayed when the
rest swam south, holding the floes shut across the outer sound so nothing can leave the fjord: not the fish,
not the seals. Things may come in (the ferry does); nothing goes out. Freed, she sings them out past the
skerries. Moves: charge, slam, rain (slabs of sea ice off the roof), beam (`looks.beam: 'jet'`, a jet of
freezing sea), summon (whalebone crabs), echo (her song cracking the ice), leap, barrage; ultimate **Close
the Floes** (`lanes`, drawn as ice coming down everywhere but one lane). Den theme `floe` (its rows in
`dens.js`'s shared tables). Drops the Narwhal Tusk / Narwhal Song Staff and the Floe Crown (9 slots, like
the Root Warden's), narwhal ivory. Her pet is in the Pet Shop (`PETS`).

## Gear (`docs/combat/items.md`)
Hakon's tier (`aim` 60): Bone-Carver's Saber / Driftbone Staff, Sealskin Hood. Mob drops: the Whalebone Helm
(whalebone crabs), the Ivory Cutlass / Walrus Ivory Staff (bull walruses). The Old Narwhal: above.

## Waystone
One by the whaling hut (`isle: 'frost'`), reaching the hamlet's and the Glacier's (`docs/places/waystones.md`).

## Decisions and history
- 2026-10-23: built as F2 with the Narwhal Grotto. Liberal decisions (owner's standing instruction): Hakon,
  Grandmother, the Sounding Stone, the Breathing Hole and the Old Narwhal's story are new; the den is in the
  Skerries, at the Floe Edge (the plan left it open), with the Grotto's mouth next to it, like the
  Tidemother's cave and Wreck Cave in the Coves.
- Music: `skerries`, den `narwhal` (`docs/ui/audio.md`).
