# Interaction prompts

Files: `src/hints.js` (drawing, `keyName`), `drawHints()` in `src/main.js` (what's listed).

- Players said they couldn't tell what they could do where. Everything possible at your spot is listed
  above your own slime as key caps (E door/talk/read/buy furniture/adopt a pet/feed a pet/plant/harvest/brew/telescope/the Rebirth Pool, Z loot, X attack, ↓ drop down); on touch the caps
  name the on-screen buttons instead (`keyName`).
- Doors, characters, the Keeper stones, the telescope and the Rebirth Pool (`nearPool`, `src/rebirth.js`) nearby but out of reach get a bouncing "E"
  beacon (the nearest two). A door that's shut for now (`doorOpen`: the ferry's gangway before she's in)
  gets no beacon and no prompt.
- Doors into combat rooms add their level band to the prompt as a chip (`band`, `docs/world.md`); a hard
  pocket's is red. The blocked ways into branches (`docs/places/branches.md`) get an E prompt ("look at
  the washed-out footbridge") and a beacon.
- Waystones (`wayPrompt`) and every room's Keeper stones (`ruinStoneAt` is room-aware now) have prompts
  and beacons.
- In combat rooms a Warrior also sees its chase moves while each is possible right now: "X Charge"
  (dashing or just after), "↓+X Leap Slam" (in the air, ▼ Hit on touch), "X Upward Cut" (still rising). An
  Archer with a bow sees "X Retreat Shot" while dashing or just after (S4: X / Hit then shoots backward).
- `drawHints()` builds the list in the same order the E key acts in. **A new interaction must add its
  line there.** (The old per-object pills were removed in favour of this.)
- Room-wide actions stay as pills top-right on desktop (H hand, C courses, Q Clio, X/I/K in combat rooms,
  R decorate / P invite in your own house;
  the piano room says "Jump on the keys to play them!").
