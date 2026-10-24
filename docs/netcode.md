# Netcode, protocol and the client's wiring

Files: `src/shared/sim.js` (physics, `pack` / `unpack`), `src/shared/wire.js` (binary frames),
`server/index.js` (server loop, routing; **the full
protocol is documented in the comment at the top of that file: keep it updated**), `src/net.js`
(prediction, reconciliation, interpolation, routing), `src/main.js` (loop, input, HUD, Esc menu).

## The model
- Fixed 60 Hz (`TICK_RATE`) on both sides. One `in` message = one input = one sim step. The server acks
  the last input it ran in every `s` snapshot; the client rewinds to the server state and replays its
  unacked inputs. State is quantised inside `step()` so prediction matches the server bit for bit.
- **Anything that changes movement goes in `step()`**, driven by input bits (`LEFT RIGHT JUMP DOWN USE`
  plus `DASH BLINK` for the Mobility skills and `ATTACK` for the Warrior's chase moves), never by
  side-channel messages. Doors, rooms, Dash, Blink, Flash Jump, Leap Slam and Upward Cut all work this way.
  Per-player movement abilities ride in the state (`state.mv`, `state.mw`) so prediction knows them too.
- **Predicted state edits**: two things change your state from a client-decided event rather than an
  input: a mob's knockback (`applyKick`, from `ouch`) and a Warrior's Charge connecting (`applyCharge`,
  from a slap). The client stores the edit on that input's `pending` entry, applies it now and on every
  replay; the server applies the same edit when it runs the message at that `s`. Both sides must compute
  it from the state alone (see `docs/combat/skills.md`).
- Remote slimes render 100 ms behind, interpolated. Mobs are drawn on the server clock the same way
  (`net.renderTick()`).
- Animation dt is capped at 1/30 s separately from the sim's catch-up: bigger steps turned the jelly
  spring inside out (the old "glitch after tabbing away" bug).
- New fields in the physics state must go through `pack` / `unpack` and `src/shared/wire.js`, unless they never change during a
  session: `home` (your house's room) is sent once in welcome / join info instead, and `reconcile()`
  keeps it.
- `state.vt`, the voyage clock (ticks aboard a crossing, `docs/places/crossings.md`), is a physics field:
  `step()` counts it and a door's `after` / `before` read it, so arriving at the far side is predicted.
- `state.town`, your town (`TOWNS`, `docs/world.md`), is a physics field too: `step()` sets it in a town
  room and a house's front door (`to: TOWN`) reads it. The server's teleports (waking up, invites, tests)
  go through `placeAt`, which keeps `home`, `mv` and `town`; don't hand-roll `Object.assign(newState…)`.
- A door with `ask` (a ship's gangway) is confirmed on the client first; its Set sail button sends the E
  press as an ordinary input (`sail` in `src/main.js`), so the door is still taken inside `step()`.

## Bandwidth and performance changes (the owner allows these; log each one here)
- 2026-10-20: `state.home` stays out of the 60 Hz snapshots (sent once per player instead).
- 2026-10-20: the three high-rate messages are binary (`src/shared/wire.js`): inputs (6 bytes instead of
  ~25), snapshots (32 bytes per slime instead of ~54, plus a 9-byte header) and mob updates (23 bytes per
  mob instead of ~35). Each decodes to exactly the old JSON shape, so nothing past the decoder changed.
  Physics values go as integer hundredths, which is lossless because `step()` quantises to 1/100
  (checked over 20k random steps). Only clients that say `bin` in their hello get binary; tabs still
  open from before a deploy keep getting JSON (that path can go once nobody runs old tabs). The server
  encodes the shared slime block once per tick and only the 9-byte header per recipient.
  **Adding a physics field now means adding it to `wire.js` too** (and widening `SLIME_BYTES`).
- 2026-10-20: snapshot wire version 2 adds `vt` (34 bytes per slime). The client's hello says
  `bin: BIN_VERSION`; tabs from before say `bin: 1` and keep getting the 32-byte records (the server
  encodes each version someone needs, once per tick). **Bump `BIN_VERSION` for the next wire change too**:
  old tabs reconnect after a deploy with their old code, so a silent format change garbles every slime.
- 2026-10-20: wire version 3 adds `town` (35 bytes per slime; `BYTES_OF` in `wire.js` per version).
- 2026-10-23: wire version 4 adds the chase moves' state (`mw`, a second flags byte: Attack held and
  slamming, `sc`, `uc`, `cw`, `uw`, `lw`): 44 bytes per slime. Tested with 150 ms of fake lag: no snapping.
- 2026-10-23: wire version 5 (the Mage's combos): mob flags grow past a byte (256 chilled, 512 frozen, 1024
  burning). In binary they ride in the egg byte's upper bits (bit 0 still says an egg follows), so a mob
  record stays 23 bytes; `encodeMobs` takes the recipient's version and gives tabs from before (`bin` < 5)
  the egg bit alone (their decoder reads any non-zero byte as an egg). The server encodes the mobs once per
  version in the room. Slime records are unchanged (`BYTES_OF[5]` is version 4's 44). JSON tabs get the
  wide flags, which their code masks away.
- 2026-10-24 (the Archer, S4): no wire version change. Two more mob flags in the same byte (2048 marked by
  Hunter's Mark, 4096 netted; the 7 bits there hold up to 16384), Retreat Shot's rank in `mw` bits 6–7 (it was
  6 bits used of the byte), the slap echo's `retreat`, the skill's `mob` / echo's `mark`, and
  `{t:'netcatch', id, m, x, y}` with the summons messages. Retreat Shot changes no physics: it's read from
  the state at the shot's input (`retreatOpen`), like Charge, but with nothing to replay.
- 2026-10-24 (S5.1, the party mechanics): no wire version change. Which mechanics are on for a boss and who its
  focus is on go in their own low-rate JSON message, `{t:'party', id, on, f, fl}` (on change and every 2 s while
  any is on), instead of more mob flags: eight bits don't fit the 7 spare bits of the mob record, and they change
  rarely. The pulse is two `boss` events; Rally's echo carries `taunt`.
- 2026-10-24 (S5.2): no wire version change. The `party` message grows `st` (the stagger), `sh` (the shield phase),
  `wk` (the weak point) and `cu` (who's cursed, for late comers); `{t:'curse', id, n}` is new (routed through the
  `RPG` set); a hit on a mob may carry a 5th element (`h[4]`: aimed at an open weak point); `hurt` may carry `dot`
  and `me` a `curse`. New boss events: `curseWarn`, `curseHit`, `shieldUp`, `shieldBreak`, `shieldDrop`, `crack`,
  `weakOpen`, `weakBreak`, `stagger`, `ultCancel` (listed in the protocol comment in `server/index.js`).
- Ideas not done yet: send snapshots of only the slimes in your room (plus broadcasters), or at 30 Hz
  for remote slimes; delta-encode mob updates.

## Input-ordered actions
Messages that carry `s` (the input seq they happened at: `slap`, `skill`, `ouch`, `pickup`) are queued
on the server and run after that same input (`ORDERED` / `runActions` in `server/index.js`), so knockback
and hits happen exactly where the client saw them. Client-predicted knockback is `applyKick` in
`src/net.js`, re-applied on replays.

## Restarts keep positions
Deploys restart the server. On SIGTERM it writes where every slime stands (`savePositions`, next to the
accounts DB); at startup it reads that once, and each account's first login within `POS_KEEP_MS` goes back
there (`restorePos`). House room ids change every restart, so your own house is saved as "home" and anyone
else's as its front door. Owner's ask: small deploys mustn't send everyone back to spawn. A `reset-positions`
file next to the DB skips it for a game-breaking deploy.
Reloads keep them too: when a slime disconnects (not while splatted, not when a newer login took it over),
its spot goes into the same map for `RELOAD_KEEP_MS` (`posOf`), so a reload, e.g. Install on the new-patch
banner (`docs/ui/updates.md`), comes straight back where it stood.

## Protocol cheat sheet
`hello`/`welcome`/`denied` login · `in` inputs · `s` snapshots · `join`/`leave` · `rtc` voice signalling ·
`chat`/`chat-log`/`chat-error` text chat ·
`cast` broadcast · `npc-*` AI characters · `lecture`/`hands`/`ask*` lecture hall · `vote`/`courses` ·
`tutor*` quiz · `note` piano · `slap` · the combat set (`me`, `mobs`, `loot`, `hurt`, `faint`, `got`,
`gear`, `toast`, `skill`, `boss`, `nomana`, `shop`, `scrolled`; the Cleric's summons `summons`, `sumhit`,
`sumhurt`, `sumgone`, and S5's `party` and `curse`, which `src/net.js` must list in its `RPG` set to route) · bag / skills / stats actions (`equip`,
`unequip`, `use`, `drop`, `scroll`, `learn`, `unlearn`, `respec`, `hotbar`, `hotswap`, `ap`, `pvp`,
`wear`, `showhelm`, `buy`, `sell`, `buycos`) · houses (`house`, `house-set`, `house-kick`, `invite`, `visit`). Routing for these is one `if` chain in `server/index.js`;
a new message needs a branch there and a line in the protocol comment.

## `src/main.js`
Owns the keyboard handler (panels first, then room-specific keys, then the Esc menu), the Esc menu
buttons (and its Controls page, `CONTROLS`: keep it in step with new keys), the HUD and splats, and wires every feature module together. `#debug` in the URL exposes
`window.slimeville` (see `docs/testing.md`).
