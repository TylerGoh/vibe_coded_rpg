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
  (dashing or just after), "↓+X Leap Slam" (in the air, ▼ Hit on touch), "X Upward Cut" (still rising),
  "↓+Shift Hook" ("▼ Dash" on touch; SP2) while Hook and Dash are ready and a mob stands ahead within Hook's
  range but out of a sword's reach (`HOOK_RANGE`, `rpg.ahead`). An
  Archer with a bow sees "X Retreat Shot" while dashing or just after (S4: X / Hit then shoots backward).
- A boss's focus (S5, `docs/combat/bosses.md`): the focused slime sees "Shift get clear: the boss is after you"
  (Dash on touch; `Shift` is in `TOUCH_NAMES`), and anyone with Rally on the hotbar, ready and with the MP sees
  "<its key> Rally: take the boss's focus" while the focus is on a friend. The first `PARTY_HINTS` times a session
  a toast also names the answer to a focus or a pulse (`tell` in `src/party.js`).
- S5.2's mechanics: anyone with Cleanse on the hotbar, ready and with the MP sees "<its key> Cleanse: lift your
  friend's curse" (or "Cleanse your curse") while someone in reach is cursed (`rpg.cleanseTarget`), and anyone
  without a bow near a boss whose weak point is open sees "Space jump and hit the glowing weak point" (Jump on touch:
  `Space` is in `TOUCH_NAMES`). Cursed, with no Cleanse to cast but a Cleansing Tonic on the potion bar and off
  `CURE_CD`, you see "<its key> drink a Cleansing Tonic" (S5.5). The `tell` toasts (each `PARTY_HINTS` times a session, worded for your class) cover
  the sigil, being cursed, a friend cursed when you have Cleanse, the barrier, the armour, the weak point and the
  stagger; an interrupt always toasts who froze the ultimate away. Over the boss, a hit cut by a phase pops
  "WARDED" / "ARMOURED" and one on the weak point "WEAK POINT!" (at most every 0.7 s).
- S5.3's party dens: while Sigrun's front-only shield is up and you stand on its side (not a Mage), "Shift get round
  behind her shield" (`←→` without Dash; `rpg.party.frontShield()`); the jump prompt only shows for a weak point too
  high to hit from the floor (hers is in her shield). Her shield and weak point have their own toasts
  (`barrierFront`, `weakFront`).
- `drawHints()` builds the list in the same order the E key acts in. **A new interaction must add its
  line there.** (The old per-object pills were removed in favour of this.)
- Room-wide actions stay as pills top-right on desktop (H hand, C courses, Q Clio, X/I/K in combat rooms,
  R decorate / P invite in your own house;
  the piano room says "Jump on the keys to play them!").
