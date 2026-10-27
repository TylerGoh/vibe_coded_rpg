# AI characters (DeepSeek `deepseek-chat`)

Files: `NPCS` in `src/shared/sim.js` (placement), `server/characters.js` (personas, `CHARACTERS`),
`server/npc.js` (conversations, memory, limits; exports the `deepseek()` helper, which supports
`{ json, temperature }` and is reused by the lecture and tutor), `src/npc.js` (one shared dialog box and
one shared corner feed).

- Elder Mochi (village, by the big tree), Captain Brine (at the wheel of the ferry, on both decks: `also` on his `NPCS` entry, so always test rooms with `npcIn()`, `docs/places/crossings.md`) and Curator Clio (museum lobby; a history expert who knows the
  exhibit list), and Icefang Hamlet's Old Skaldi, Netmender Runa and Tove (`docs/places/fjord.md`), Willowmere's Miller Bun and
  Saltspray Coves' Beachcomber Moss (both trade; `docs/places/willowmere.md`, `docs/places/coves.md`), the
  Mycelium Deep's Forager Truffle (trades; `docs/places/deep.md`), the Old Oak Canopy's Ranger Acorn
  (trades; `docs/places/canopy.md`), the Rimeglass Glacier's Ice-Cutter Eyvind (fjord folk, trades;
  `docs/places/glacier.md`), the Whale Skerries' Hakon the Bone-Carver (fjord folk, trades;
  `docs/places/skerries.md`), the Lodestar's Skipper Arne (fjord folk, at her wheel on both decks, like
  Brine; `docs/places/crossings.md`), Forgehold's Forgewarden Ash, Auntie Soot and Slag (forge folk; Soot and
  Slag trade; `docs/places/forgehold.md`), the Ashwood's Collier Pitch (forge folk, trades; `docs/places/ashwood.md`), and
  the Pet Shop's Auntie Clover (sells pet food, preaches feeding; `docs/places/pets.md`). Press E
  in range to talk.
- When a place opens, update the personas that can see it, or they keep describing the block: Moss knows
  Wreck Cave's water is down and what lives in it, Acorn (who watches Bramble Woods from the treetops) knows
  the tunnel through the thorns and the Thorn Hart (G4), and that the trunk to Keeper's Spine is cut through (G5), and (FB1 (b)) that the Thornheart's root knot has split
  open onto a road underneath, which he won't go down (he notices the roses all face east).
  F1: Skaldi, Runa and Tove know the Rimeglass Glacier and Eyvind (Tove lists its creatures and levels;
  Skaldi knows Ylva's Cairn), and Eyvind knows the two blocked ways on (the Blue Halls, the Aurora Heights).
  F2: Skaldi, Runa and Tove know the Skerries (the slide dug through), Hakon and the Old Narwhal; Runa's
  husband Bjarn says the floes stay shut (so the new trader is Hakon, not a second Bjarn). Hakon knows the
  Skerries, the den and the Grotto, and hints at Grandmother's Crown.
  F3: Eyvind cut the new steps up to the Aurora Heights and mended the Blue Halls' ladder (with Runa's rope,
  which she wants back); he knows both rooms, the Pale Wyrm and the Hall Troll, and hints at Liv's Reach and
  the Cutters' Niche. Skaldi has one line of song about the small star that fell with the serpent and won't
  get up (no explaining; his "doesn't know" moved to past the Heights). Tove knows both by their creatures.
  F4: Eyvind's cutters mended the ice stair onto the Queen's Bridge (Runa's rope again); he knows the bridge's
  creatures and won't go near Sigrun ("she watched us build that stair"). Skaldi knew Sigrun as a girl and has
  one line for the bridge ("Two shores, one road. Hold, and hold, and let it go."); Runa's great-uncle is one of
  the frozen guards; Tove knows the bridge by its creatures.
  FB2 (b): Eyvind has heard (not seen) that a troll wall at the Deep Blue's end fell over onto a ladder going
  down, older than his, to black ice and a camp left in a hurry; he won't go down. On the writing carved by the
  hole he goes quiet: his grandfather's crew came back up early one winter and never said why, but he never says
  it was them ("Some crews come back early. You don't ask them why.").
  E0 (atlas Phase 5): the Lodestar sails and the Caldera pass is gone. Brine is thrilled for Arne and says the
  only way south is his ship; Skaldi lit every quay lamp; Runa is glad and cross (her tarp); Eyvind sent his box
  of letters south with Arne and has no answer yet; Tove wants to go. In Forgehold, Ash lists every shut way
  out by its in-world block and deflects Tier 3 ("Go and ask the old smith in the Forge. Then come back."),
  and only tells of Brenna on a second asking. Soot holds Arne's letters for "the northern girl out on the
  coast" (Liv, E2). When an Emberdeep branch opens, update Ash (and Soot, Slag, Arne where they'd know); E1 did it for the Black
  Sands (Ash lists its dangers, Soot says the path's open, Slag laid the stones), and for the Ashwood (Ash lists its
  dangers and says of the Old Foundry's adit only "We bricked it up ourselves. It stays bricked."; Slag riveted the
  bridge's new plates and once got fern seed from Pitch; Soot says Pitch comes down for eggs again).
  **Collier Pitch** (`pitch`, E1): the last charcoal-burner, dry, slow and sad; Tier 0 plus the Ashwood, Greyback,
  the bridge, the adit he helped brick up (he sends you to Ash), the Kiln Stone (his family's story, it bothers him),
  and the Green Tree, which he hints at and won't place.
- **Elder Mochi tends the Rebirth Pool** (S2.3, `docs/combat/skills.md`): he knows what it does, that the
  first choice is free and later changes cost about an hour's gold at your level, and only Warrior, Mage,
  Cleric and Archer (the Cleric added with S3, the Archer with S4, pointing archers at Ranger Acorn; add each
  new class to his persona in `server/characters.js` when it ships). The branch traders' personas name what
  they sell, so a new item in a shop needs a line there too (S4 added each one's bow, and the staves Bun, Moss
  and Truffle had been selling without saying).
  The server labels each line to him with the speaker's level and class (`whoIs` in `server/index.js`, the
  `ctx` of `reply()`), so he brings the pool up with any Lv 10+ Novice; and `persona(user, { first })` (from
  `server/npc.js`: no memory of them yet) makes him welcome a newcomer and mention the pool once. His
  lore is canon Tier 0 only; anything deeper he deflects ("better found than told").
- `hello` on an `NPCS` entry is the line their dialog opens with. `shop` (a `SHOPS` key) adds a **Trade**
  button to their dialog (Runa). `folk` dresses them as another island's people (`docs/art.md`).
- Clio has `anywhere: true`: she can be asked from anywhere in the museum (Q, the "Ask Clio" touch button,
  or "Ask Clio about this" on a fact sheet). The server tells her where the asker stands (`museumPlace()`).
- Conversations are public: every line goes to all players (speech bubbles, the corner feed, the dialog
  log), and the character sees the recent public lines labelled "name: text".
- Per-player memory per character in table `npc_memory`, capped by an estimated token budget; overflow is
  folded into a DeepSeek-written summary. Per-player cooldown and daily message cap.
- **Add a character:** an `NPCS` entry (room, x, hue, range, size, accessory, faces, blurb), a persona in
  `CHARACTERS`, an accessory drawing in `src/slime.js` and lines in `SLAP_QUIPS` (characters can be
  slapped; they answer with fixed quips, no AI call). Add its prompt line in `drawHints()` (`docs/ui/hints.md`).
- **Story characters (owner's rule):** each serves a purpose in the world AND can be chatted to, with
  memory, like Mochi. Their persona says exactly which canon they know (usually `story/canon.md` Tier 0
  plus their own trade), tells them to deflect anything deeper in character, and gives them a rich
  personal life to talk about instead, so the lore stays hidden and is found in order. Brine is the model.
- Without `DEEPSEEK_API_KEY` the characters stay silent; the startup log says whether it's enabled.
