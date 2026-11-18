# The Salt Flats (room 104, Lv 226–236) and the Netwife's den (room 105, the Dry Harbour)

Atlas Phase 9, A2 (`story/phase9-plan.md`; the town is `docs/places/amberdune.md`). The old seabed west of Saltmouth, down
off Caravanserai's west end: white salt crust to the horizon, the fleet's boats beached on their sides where the sea left
them, nets strung on poles between them drying for boats that will never sail, and the sea a far bright line. In the old
harbour at the far end, the Netwife mends the nets.

Files: the room in `src/shared/rpg.js` (`SALTFLATS`, `SFLATS_W`, `SFLATS_EXIT_X`, `SFLATS_WAY_X`, `FLEET_X`, `NET_DEN_X`,
`NET_DEN`, `SFLATS_ZONES`, `SFLATS_PLATFORMS`, the `STAGES` row, the four mobs, the Netwife, their materials and gear, the
spawns, the `DENS` row, Kesh's `SHOPS.kesh`), `ROOMS[SALTFLATS]` and its door in `ROOMS[CARAVAN]` (`src/shared/sim.js`; the
den door comes through `denDoors(SALTFLATS)`), the room's drawing in `src/saltflats.js` (`drawSaltFlats`), the creatures, the
gear and the materials in `src/saltflats-art.js` (`SFLATS_MOB_ART`, `SFLATS_SWORDS`, `SFLATS_HELMETS`, `SFLATS_ICONS`; the
staves and bows in `src/staff-art.js`, `src/bow-art.js`), the den, its way in, the Netwife, The Last Haul and her freeing in
`src/dens-net.js` (theme `nets`, registered in `src/dens.js`), the way in from town (`drawSoftSalt`'s open look in
`src/branch-gates.js`), the waystone in `src/shared/waystones.js`, the brine slime's crust (`saltcrust` in
`src/hazards.js`), her thrown net (`PAL.net` in `src/challenge.js`), the `saltflats` and `netwife` music scenes in
`src/audio.js`, her pet in `src/shared/house.js`, her freed change in `src/shared/story.js` (`BOSS_TIER`) and
`server/lore.js` (`FREED`). The sky is Caravanserai's (`drawDuneSky`), with the seabed's white drawn over its far sand.

## The way in
A0 laid the gate: the salt crust wet that season, planks sinking, a pole leaning where someone went in to the knee. **A2
dried it** (the update did it, no quest, the owner's rule): the crust hard and white and crazed into plates, the planks
lying flat, the pole stood up straight with Kesh's blue rag on top for a marker (`drawSoftSalt`'s `open` flag,
`OPEN.softsalt`). The node has `rooms` and an `entry` (`docs/places/branches.md`); its door at `SALTFLATS_GATE_X` in
Caravanserai goes down to the Salt Steps.

## The room
West to east (`SFLATS_ZONES`):
- **The Salt Steps** (no mobs): the old harbour's slipway down off the town's edge, stone steps salt-white; a waystone
  (`SFLATS_WAY_X`, `isle: 'dune'`).
- **The Crust** (226–229): salt crust heaved up into shelves, white on top, layered pink and grey down their edges (the
  `crust` platforms). The old fleet's first boats lying out on the salt behind.
- **The Beached Fleet** (229–233): boats on their sides everywhere, bleached, a band of old paint on each and a salt line
  where the water stood in her last; poles between them with nets hung drying (the `hull` platforms are upturned hull
  sides). **The tallest of the fleet** (`FLEET_X`) still has her mast up, its stays hung with a net; **the crow's nest** at
  its top is the hidden spot (last in `SFLATS_PLATFORMS`), a scrap of blue pennant still on it.
- **The Harbour Mouth** (233–236): the old breakwater, a long wall of dressed stone high and dry, iron mooring rings along
  it; the stumps of the harbour's piers (the `pier` platforms). **The Netwife's den** opens at `NET_DEN_X`: a gap in the
  breakwater with nets hung over it like a curtain from a spar, the harbour steps going down, and now and then a pale
  long-legged shape going by behind the nets.
- No way on: the far end is the breakwater and the sea a bright line beyond it.
- **Freed** (per character, `docs/social/story.md`): for a slime who has freed the Netwife the nets are gone off every pole
  and the mast's stay, the poles stand bare, and one last net goes away high up on the wind.

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Salt crabs** (226): the old harbour's crabs left high and dry, shells crusted white with salt, scuttling in bunches,
  claws up (plain chasers, `hops`).
- **Brine slimes** (229): the last of the sea gone thick and bitter, salt drying white round their rims; they leave a
  stinging crust behind them (`trail`, style `saltcrust`: a pink sheen drying white, salt cubes standing up on it).
- **Flat gulls** (232): big grey-and-white gulls gliding on the hot air with their long flat wings; they tuck and drop
  (`dive`).
- **Wreck hermits** (235): hermit crabs grown huge, each wearing the prow of a beached boat as its shell, an eye painted on
  each side of it (`shell`: get round behind them); the rare **Prow Helm** (Lv 235). The Netwife's minions are the crabs.
- No elites, no field boss.

## Kesh's jetty (`SHOPS.kesh`)
With the salt dry, Skipper Kesh walks out to the old fleet and brings back salvage, and **trades from her jetty** in
Caravanserai (her NPC row has `shop: 'kesh'`; on the Saltwind's decks the Trade button stays hidden: her shop's room is the
town). Her tier, aimed at Lv 230 and on the gear curve at 226 like every trader's: the **Skiff Gaff** (a boat-hook's gaff
filed to an edge), its twins the **Tiller Staff** and the **Beadstring Bow**, and the **Sailcloth Hood**. Her persona,
Mother Dune's, Tally's and Asra's know the Flats are dry and what's out there.

## The Netwife (den 105, Lv 236)
A den boss with a story (`story/phase9-plan.md`): a great sand spider crusted white with salt, as big as a boat, in the
dried harbour where Saltmouth's fleet used to come home. When the sea went out she kept on mending the fleet's nets, every
one, for boats that will never sail again. A shard in her back. Holding on: the fleet.
- **The den, the Dry Harbour**: the old harbour basin from its floor: the quay walls of dressed stone all round with a salt
  line far overhead and iron rings, the hot sky over it, two of the fleet lying in the grey-white silt, and her rigging
  across the basin, poles and lines hung everywhere with nets. The ledges are upturned boats on trestles. The name is
  painted on a boat's board hung from her rigging.
- **Her look**: a broad round abdomen behind, banded and crusted white across the top (the shard glints in the salt there:
  `weak`, in reach with a jump), a smaller head in front with a cluster of soft dark eyes (two big, four small: kind and
  very tired), eight long jointed legs salt-white at the knees, and in her front legs a bone netting needle and the fold of
  net she's mending. On a warning she rears and lifts the needle; charging, salt dust flies.
- **Her moves** (`phases`): charges, slams, rain and **the snare** (her thrown net) in every phase; from phase 2 her crabs
  (summon), **late tells** and **the cage**; from phase 3 leaps and barrages.
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`): **the snare** (every phase: she throws a net over you,
  `looks.snare: 'net'`, salt-stiff twine, `PAL.net`), **late tells** (phase 2 on: her shadow comes too late as she drops out
  of her rigging) and **the rescue cage** (phase 2 on, a party only: she winds one of you up in her nets to mend later; a
  friend at the cage enters its arrows).
- **Party** (S5.4): the weak point, **focus** (she picks one slime to haul in), and freezing her ultimate as it gathers
  cancels it.
- **Her ultimate, The Last Haul**: the shared `wave` ult drawn as a great net hauled the length of the harbour (`ULT_LOOKS`:
  the haul-lines going taut and the net rising off the floor as she takes up the slack, then a wall of mesh, floats along
  its top, sinkers along the floor). Jump it or get up on a ledge.
- **Her lines** (`lines`): "Mind the nets... The fleet comes in on the evening tide."; at phase 3, "The sea will come back.
  The boats will come back. And when they do the nets will be READY!"; freed, "...The tide is not coming in. It has not
  come in for a long time, has it. ...Then let the wind have them. Let them go."
- **Freed** (the den's bossDie, `NET_FREED_S`): the nets lift off their poles on the wind and go up and away over the
  harbour wall, and the den stays bare (the lines empty) until she's back.
- **Rewards** (`docs/combat/items.md`, `docs/economy.md`): **the Netwife's Needle** and its twins the **Net Shuttle Staff**
  and the **Netting Bow** (Lv 237, 9 slots), the **Saltnet Veil** (Lv 237, 9 slots), Netwife's Knots, coins, royal sap,
  scrolls; the **mini Netwife** at the Pet Shop (`docs/places/pets.md`).
