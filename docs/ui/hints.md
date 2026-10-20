# Interaction prompts

Files: `src/hints.js` (drawing, `keyName`), `drawHints()` in `src/main.js` (what's listed).

- Players said they couldn't tell what they could do where. Everything possible at your spot is listed
  above your own slime as key caps (E door/talk/read/buy furniture/plant/harvest/brew, Z loot, X attack, ↓ drop down); on touch the caps
  name the on-screen buttons instead (`keyName`).
- Doors and characters nearby but out of reach get a bouncing "E" beacon (the nearest two).
- `drawHints()` builds the list in the same order the E key acts in. **A new interaction must add its
  line there.** (The old per-object pills were removed in favour of this.)
- Room-wide actions stay as pills top-right on desktop (H hand, C courses, Q Clio, X/I/K in combat rooms,
  R decorate / P invite in your own house;
  the piano room says "Jump on the keys to play them!").
