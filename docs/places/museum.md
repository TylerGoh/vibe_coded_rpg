# Grand Museum of History

Files: `src/museum.js` (room, building, fact sheet), `src/history.js` (content), layout in
`src/shared/sim.js` (`MUSEUM_WINGS`, `exhibitX`, `wingPortalX`, `wingReturnX`).

- Lobby (exit, Curator Clio, statues, numbered portals) plus wings in time order (Ancient, Medieval,
  Renaissance, Revolutions, World Wars, Hall of Dictators, Cold War & Modern).
- E at an exhibit opens its fact sheet (←/→ browse, Esc/E close; "Ask Clio about this").
- Content in `src/history.js` is hand-written (not AI) and was fact-checked by a subagent (Oct 2026).
  Keep figures as scholarly ranges and the dictator/memorial tone sober and neutral. Dictator portraits
  are featureless grey busts with no symbols. **Per-wing exhibit counts must match `MUSEUM_WINGS`.**
- Clio: `docs/social/ai-characters.md`.
