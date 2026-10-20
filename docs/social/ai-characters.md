# AI characters (DeepSeek `deepseek-chat`)

Files: `NPCS` in `src/shared/sim.js` (placement), `server/characters.js` (personas, `CHARACTERS`),
`server/npc.js` (conversations, memory, limits; exports the `deepseek()` helper, which supports
`{ json, temperature }` and is reused by the lecture and tutor), `src/npc.js` (one shared dialog box and
one shared corner feed).

- Elder Mochi (village, by the big tree), Captain Brine (at the wheel of the ferry, on both decks: `also` on his `NPCS` entry, so always test rooms with `npcIn()`, `docs/places/crossings.md`) and Curator Clio (museum lobby; a history expert who knows the
  exhibit list). Press E in range to talk.
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
