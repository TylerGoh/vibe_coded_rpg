# The peoples of the islands, and proposed characters

Each island's slimes are shaped by their climate. That keeps the cast visually and tonally distinct,
and it's cheap to draw (hue, texture, how they wobble).

| people | island | look | temperament |
|---|---|---|---|
| Greenhollow slimes | Greenhollow | bright pastel jelly, bouncy | cozy, curious, forgetful of the wider world |
| fjord folk | Frostpeak | pale, frosted, half-solid, slow wobble | stoic, few words, deep loyalty |
| forge-slimes | Emberdeep | dark and dense, ember flecks, stiff | blunt, proud, guilty |
| Keepers (echoes) | the Citadel | translucent, faint clockwork inside | gone; only echoes remain |

## AI characters (one per region keeps the lore delivery local)
**Owner's rule:** every character serves a purpose AND can be chatted to with memory, like Mochi. Keep
what each knows of the lore narrow (their tier, or less), and give them a personal life to talk about.
All `[proposed]`. Each needs a persona in `server/characters.js` that's fed canon tiers (`../delivery.md`).
- **Captain Brine** (Greenhollow Harbour, **exists**): the old ferry captain. Gruff-cozy and
  superstitious. He says the crossing takes longer every year, and he's right. Knows Tier 0 only; his
  life (forty years at sea, Pickles the one-legged gull, cards at the Inn) is in `server/characters.js`.
- **Old Skaldi** (Icefang Hamlet, **exists**): lamplighter and keeper of songs. Speaks in short, sad,
  beautiful lines. Holds Tier 2, but only as song fragments he won't explain. His life: Ylva, his late
  wife, who taught him the songs; Tove; carving driftwood birds. He knew Sigrun, the Queen's Shield, as a girl
  (F4), and has one line for the bridge he won't explain.
- **Netmender Runa** (Icefang Hamlet, **exists**): the hamlet's trader (warm gear, frostbloom). Brisk, dry,
  warm underneath. Tier 0 plus gossip. Her husband Bjarn fishes the outer fjord; her cousin Arne owns
  the laid-up Lodestar. Her great-uncle is one of the Queen's guards frozen on the bridge (F4).
- **Tove** (Icefang Hamlet, **exists**): Skaldi's granddaughter, about eight. Feeds the yeti cubs (Lumpy,
  Mitten, Big Grumble) and tells travellers about the ridge's creatures (and the glacier's, since F1). Tier 0.
- **The branches' traders** (Greenhollow, island depth, **exist**): Miller Bun (Willowmere), Beachcomber
  Moss (Saltspray Coves), Forager Truffle (the Mycelium Deep) and Ranger Acorn (the Old Oak Canopy). Tier 0 plus their own corner; Truffle
  also knows the threads run off under the sea. Truffle's life: moved underground for the quiet (too much
  sky makes her dizzy), a lamp mushroom called Wick, Chirp the cave cricket, an eleven-year mushroom guide. Acorn's life: hasn't touched the ground in six years (the ground is where the
  bramblehogs are), Zip the hat-stealing flying squirrel, knitted hats for the squirrels, Professor Hoot the
  owl who judges her knitting, a nest logbook on volume nine; she restrung the Canopy's ladder herself.
- **Ice-Cutter Eyvind** (the Rimeglass Glacier, Frostpeak's depth pass F1, **exists**): fjord folk; cuts blue
  ice for the hamlet and trades at the Cutters' Camp. Plain and quiet, a dry joke now and then. Tier 0 plus
  the glacier (the Rime Stone's stars bother him); since F3 he has cut new steps up to the Aurora Heights and
  mended the Blue Halls' ladder (with Runa's rope), and knows the Pale Wyrm ("tired") and the Hall Troll; since F4 his cutters have mended the ice stair onto the
  Queen's Bridge, and he won't go near Sigrun. His life: his
  daughter Liv sailed south on the Lodestar's last voyage and is stuck there while the stars are wrong; he
  writes her a letter a month for when ships sail again; he carries Skaldi's driftwood bird up to Ylva's
  Cairn each year; he names the crevasses. Liv used to climb a spire on the Heights where the lights come down
  and left a red mitten there (Liv's Reach); his grandfather's pick is frozen in the Blue Halls' Cutters' Niche.
- **Hakon the Bone-Carver** (the Whale Skerries, Frostpeak's depth pass F2, **exists**): fjord folk; carves
  whalebone (only what the sea gives: his grandfather was Frostpeak's last whaler) in the old whaling hut and
  trades. Shy, plain, a dry joke now and then. Tier 0 plus the Skerries: Grandmother the whale skeleton (he
  talks to her), the Old Narwhal singing under the ice, the Grotto he went into once. His life: sweet on
  Captain Brine, who has never noticed him waving from the point (a comb carved for her, never given); plays
  a bone flute badly; Runa sends him darned socks. Not "Bjarni": Runa's husband is Bjarn.
- **Forgewarden Ash** (Forgehold, Phase 5, **exists**): forge folk; keeps the great forge and the memorial wall,
  and tells newcomers plainly what's dangerous inland. Bitter, honest, slow to trust. Holds Tier 3 but
  deflects it ("Go and ask the old smith in the Forge. Then come back.") until per-account progress exists.
  His sister Brenna went up to the rim the morning everything broke; the wall's blank space is hers. One nail
  for every smith who dies; a stubborn pot of mint Soot waters; loses to Soot at stones every evening.
- **Auntie Soot** (Forgehold, **exists**): forge folk; runs the springs, sells potions and spring-boiled eggs.
  "Auntie" to the whole town, no children of her own; knits slag-wool socks; holds Arne's letters for "the
  northern girl out on the coast" (Liv) and is knitting her something. The one kind voice. Tier 0 plus gossip.
- **Slag** (Forgehold, **exists**): forge folk, young; Ash's apprentice and the gear trader. Drags gear-teeth out
  of the ash, has filed one for three years, believes the gears can still be finished; never seen snow, asks
  every northerner; afraid of the sea. Tier 0 plus the forges.
- **Skipper Arne** (the Lodestar, **exists**): fjord folk, Runa's cousin; the crossing south. Seven years laid up
  and ashamed of it; sailed home without his deckhand Liv on the last voyage; carried Eyvind's letters south;
  reads the weather off his bad knee; sleeps on deck in the heat. Tier 0 plus the southern passage.
- **Collier Pitch** (the Ashwood, E1, **exists**): forge folk; the last charcoal-burner, whose family burned the
  forest for the foundry; trades. Burns only deadwood now, counts fern seedlings in a ledger, knows where the
  Green Tree is and won't quite say. Dry, slow, sad. Tier 0 plus the Ashwood. His grandfather was a stoker in the
  flues under the foundry's furnaces before he took to the trees; came up one day and never went back down (E5 (b)).
- **Liv** (the Smoking Coast, E2, **exists**): fjord folk thinned nearly clear by seven years of heat; Ice-Cutter
  Eyvind's daughter, Arne's deckhand left behind on the last voyage. Cuts and trades black glass, one clean stroke
  like her father with ice; stays, afraid the cold would set her solid; letters go both ways on the Lodestar. Keeps
  the other red mitten, sits up with the Hatchkeeper's nest, copied Skaldi's birds in glass on her lookout. Tier 0
  plus the Coast.
- **Picker Ochre** (the Brimstone Fields, E3a, **exists**): forge folk; carries sulphur down to Forgehold's forges in
  two baskets on a yoke; lost her sense of smell to the fumes, keeps a canary called Saffron (her third) who warns
  her of bad air, sings to the vents; the plainest-spoken person on the island; trades. Tier 0 plus the Fields.
- **Pilot Kestrel** (the Skydocks camp, atlas Phase 6 (b), **exists**): forge folk; flies the balloon Kite up the
  thermal column (Slag built her burner); trades at her stall on the pier. Talks to the Kite, counts flights again
  from one, afraid of staying on the ground; her mother wanted her at the anvil. Tier 0 plus the sky.
- **Pilgrim Ione** (the Skydocks camp, **exists**; fen folk since atlas Phase 8): from Wickmere, carrying a lantern for
  "the one who went up" long ago; never lets it go out. Gentle, strange, everything surprises her. Tier 0 plus home;
  knows the Hush sails again.
- **Tamp** (the Skydocks camp, **exists**): forge folk; the old master's bellows-boy, looking for the master's best
  gear (a hammer over a flame on it), sure it went up to the city. Taught Ash to hold tongs; a little deaf; strong tea.
- **The Dockwarden** (the Skydocks' Warden's Pier, **exists** since Phase 6 (c)): a brass porter automaton logging
  arrivals that never came, until the camp's travellers; speaks in capitals and ledger entries, logs every traveller by
  name with an arrival number, knows "the port is open; departures are suspended pending the hour" and nothing more.
  Logged Kestrel's cargo as "OPINIONS" and Tamp as "TAMPE"; Ione keeps asking it about the one who went up.
- **The Last Echo** (the Chrono Spire, by the Orrery's door, **exists** since the Citadel's C1): a Keeper echo stuck repeating
  its last hour (hurrying to the star-hall as the stars began to move, the lock turning), who becomes briefly lucid when
  players bring Mochi's name: it remembers a small green apprentice who swept the leaves and was always late. Holds Tier
  4; has lost its own name, never names the other Keepers.
- **Folio** (the Archive's Reading Room, **exists** since the Citadel's C2): a small brass archive automaton at the issue
  desk, prim and dry, shushes; opens a reader's card for everyone; catalogued every record and read none. One volume still
  out on loan from before the day stopped; it works out the fine every morning. Sells the archivists' kit; Tier 4 at most,
  hearsay only.
- **Number Nine** (the Engine Halls' Boiler Gallery, **exists** since the Citadel's C3): the last of twelve stoker automata on
  shift, never relieved; takes everyone for its relief; counts shovels, keeps the other eleven tags in a tin, hums with the
  turbines. Sells the stokers' kit; no lore. The Last Echo asks after it.
- **Pell** (post-game, by the apple tree): see `mochi-and-chronos.md`.

## Existing villagers
Merchant Pip, the baker and the innkeeper keep their cozy roles. Over the acts they hear news from the
other islands, which is a cheap way to make home feel connected to the story.

## Lantern Fen: Wickmere (atlas Phase 8, L0, **exist**; `../phase8-plan.md`, `docs/places/fen.md`)
The **fen folk**: pale, see-through violet-grey jelly with a soft light deep inside, as if each carries a small lantern;
slow, floaty wobble; hoods and reed capes. Every family keeps a lantern lit on the Lamp Walk for each of its dead, and
none has ever gone out. Nobody says the Wickmother's name: "the Mother", and a change of subject.
- **Skipper Netta**: sails the eel-boat Hush between Wickmere and Icefang Hamlet; steers round every drifting lantern,
  never over; sells smoked eels to Runa and loses every argument about salt; talks to her drowned husband Tam's lantern
  in the wheelhouse window about the weather. Took Ione north, frets about her. Tier 0 plus the sea road east.
- **Wren the Lamplady**: tends every lantern on the Lamp Walk; trades "lamp oil" (potions). Knows the old funeral songs
  (one names "the Keepers"; she doesn't know who they were). Has wanted for years to let her husband's lantern go out
  and can't; finds it strange that no lantern in Wickmere ever has. Tier 0 plus the town.
- **Ferryman Hob**: poles the punt to the islets of the Still Mere, not while the mere's this high. Twelve grandchildren,
  no lantern for any of them; carves willow ducks; can't swim. Calls the thing in the mere "the old eel".
- **Sedge**: a young reed-weaver who makes armour of reed and bog-iron (trades the Fen's first gear). Has lost no one
  and keeps a lantern lit "for practice". Wants to see snow.
