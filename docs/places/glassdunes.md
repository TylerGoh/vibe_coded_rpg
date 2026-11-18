# The Glass Dunes (room 100, Lv 215–224)

Atlas Phase 9, A0 (`story/phase9-plan.md`; the town is `docs/places/amberdune.md`). Amberdune's first wilds, the main trail
east out of Caravanserai: gold dunes, wind-polished sandstone shelves, and patches where lightning fused the sand to glass.

Files: the room in `src/shared/rpg.js` (`GLASSDUNES`, `GDUNES_W`, `GDUNES_EXIT_X`, `GDUNES_WAY_X`, `OASIS_GATE_X`,
`GDUNES_END_X`, `GDUNES_ZONES`, `GDUNES_PLATFORMS`, the `STAGES` row, the four mobs, their materials, the fulgurite
scorpion's rare crest, A3's Glassjaw and its gear, the spawns), `ROOMS[GLASSDUNES]` and its door in `ROOMS[CARAVAN]` (`src/shared/sim.js`), the room's
drawing in `src/glassdunes.js` (`drawGlassDunes`; its signpost, `drawDuneSign`, is borrowed by the Oasis and the
Observatory), the creatures and materials in `src/glassdunes-art.js` (`DUNES_MOB_ART`, `DUNES_ICONS`), the crest in
`src/dune-art.js`, the waystone in `src/shared/waystones.js`, the `glassdunes` music scene in `src/audio.js`. The sky is
Caravanserai's (`drawDuneSky`).

## The room
You come in at the west end from the town and go east, harder (`GDUNES_ZONES`):
- **The Dune Gate** (no mobs): two tall wind-carved sandstone pillars, banded red and gold, their fallen lintel leaning
  between them; a waystone (`GDUNES_WAY_X`).
- **The Wind Shelves** (215–218): sandstone shelves on waisted stacks (platforms). **The side path down to the Mirage
  Oasis** (`OASIS_GATE_X`): a low saddle between two dunes with palm tops showing over it and a cairn with a blue rag tied
  on it (Asra's marker); its door goes down to `docs/places/oasis.md`.
- **The Glass Fields** (218–221): lightning glass glinting in the sand, and slabs of it standing up, clear and branching
  inside (the `glass` platforms).
- **The High Dunes** (221–224), and at the east end the first bronze rings of the Buried Observatory standing out of the
  sand where the trail goes down its sunken steps (`GDUNES_END_X`, `docs/places/observatory.md`).
- **The find**: the caravan milestone on top of the tallest stack in the High Dunes (last in `GDUNES_PLATFORMS`): a squat
  carved stone with mile marks cut in rows, every one scratched through but the last, and a little caravan of three cut
  below. Nobody tells you it's there.

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Sand skippers** (215): little sand lizards up on their toes, tail high, a striped frill; quick and low, in bunches.
- **Heat mirages** (216): the shimmer over hot sand got up and wandering, a mirrored sliver of sky in it. Passive and
  harmless (the drifting light's kind), and everywhere.
- **Dune beetles** (219): the `phase` brain as burrowing: under the sand they're only a travelling mound with a horn tip
  showing, then they burst up under you (the pulse).
- **Fulgurite scorpions** (222): a front, claws and all, crusted over in lightning glass (`shell`, the lamp crab's: hit
  them from behind); the rare **Fulgurite Crest** (Lv 222, on the helmet curve). (Emberdeep already had a Glass
  Scorpion, so these are named for the glass the lightning makes.)
- No elites.

## The Glassjaw (field boss, Lv 223; A3)
A dune beetle grown as big as a house, black with a gold sheen, its great jaws fused to lightning glass in some old storm,
clear and branching inside. It lies under the High Dunes with a cap of sand on its back like another dune (spawn strip in
the High Dunes), passive until hit; then it heaves up out of the sand, sand pouring off it, and comes down on you (`stomp`).
Art: `drawGlassjaw` in `src/glassdunes-art.js` (in `DUNES_MOB_ART`), with its gear (`DUNES_SWORDS`, `DUNES_HELMETS`).
- **Challenges** (T3, `chf`): **late tells** from the start (the sand only bulges after it's already on its way), and from
  its second third **bullet rings** of glass splinters off its jaws (`looks.rings: 'glass'`, the `glass` shot style in
  `src/hazards.js`); the punish window like every field boss's.
- **Party** (S5.4): with two or more on it its glass jaw closes up over it (**armour**, `looks.shell: 'glass'`, `SHELLS.glass`
  in `src/party.js`: heavy hits crack it) and it picks one slime to dig toward (**focus**).
- **Rewards**: **the Glass Mandible** and its twins the **Glassjaw Staff** and the **Mandible Bow** (Lv 225), **the Glassjaw
  Helm**, Glassjaw Shards, Beetle Wing-Cases, coins, scrolls; the **mini Glassjaw** at the Pet Shop.
