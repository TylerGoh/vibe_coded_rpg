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
  `docs/places/skerries.md`), and
  the Pet Shop's Auntie Clover (sells pet food, preaches feeding; `docs/places/pets.md`). Press E
  in range to talk.
- When a place opens, update the personas that can see it, or they keep describing the block: Moss knows
  Wreck Cave's water is down and what lives in it, Acorn (who watches Bramble Woods from the treetops) knows
  the tunnel through the thorns and the Thorn Hart (G4), and that the trunk to Keeper's Spine is cut through (G5).
  F1: Skaldi, Runa and Tove know the Rimeglass Glacier and Eyvind (Tove lists its creatures and levels;
  Skaldi knows Ylva's Cairn), and Eyvind knows the two blocked ways on (the Blue Halls, the Aurora Heights).
  F2: Skaldi, Runa and Tove know the Skerries (the slide dug through), Hakon and the Old Narwhal; Runa's
  husband Bjarn says the floes stay shut (so the new trader is Hakon, not a second Bjarn). Hakon knows the
  Skerries, the den and the Grotto, and hints at Grandmother's Crown.
  F3: Eyvind cut the new steps up to the Aurora Heights and mended the Blue Halls' ladder (with Runa's rope,
  which she wants back); he knows both rooms, the Pale Wyrm and the Hall Troll, and hints at Liv's Reach and
  the Cutters' Niche. Skaldi has one line of song about the small star that fell with the serpent and won't
  get up (no explaining; his "doesn't know" moved to past the Heights). Tove knows both by their creatures.
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
