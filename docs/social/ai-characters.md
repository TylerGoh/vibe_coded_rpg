# AI characters (DeepSeek `deepseek-chat`)

Files: `NPCS` in `src/shared/sim.js` (placement), `server/characters.js` (personas, `CHARACTERS`),
`server/npc.js` (conversations, memory, limits; exports the `deepseek()` helper, which supports
`{ json, temperature }` and is reused by the lecture and tutor), `src/npc.js` (one shared dialog box and
one shared corner feed).

- Elder Mochi (village, by the big tree) and Curator Clio (museum lobby; a history expert who knows the
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
- Without `DEEPSEEK_API_KEY` the characters stay silent; the startup log says whether it's enabled.
