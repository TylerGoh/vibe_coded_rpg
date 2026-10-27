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
  Green Tree is and won't quite say. Dry, slow, sad. Tier 0 plus the Ashwood.
- **The Last Echo** (the Citadel): a Keeper echo stuck repeating, who becomes briefly lucid when players
  bring Mochi's name. Holds Tier 4.
- **Pell** (post-game, by the apple tree): see `mochi-and-chronos.md`.

## Existing villagers
Merchant Pip, the baker and the innkeeper keep their cozy roles. Over the acts they hear news from the
other islands, which is a cheap way to make home feel connected to the story.
