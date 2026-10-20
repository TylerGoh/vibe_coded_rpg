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
  plus `DASH BLINK` for the Mobility skills), never by side-channel messages. Doors, rooms, Dash, Blink and
  Flash Jump all work this way. Per-player movement abilities ride in the state (`state.mv`) so prediction
  knows them too.
- Remote slimes render 100 ms behind, interpolated. Mobs are drawn on the server clock the same way
  (`net.renderTick()`).
- Animation dt is capped at 1/30 s separately from the sim's catch-up: bigger steps turned the jelly
  spring inside out (the old "glitch after tabbing away" bug).
- New fields in the physics state must go through `pack` / `unpack` and `src/shared/wire.js`, unless they never change during a
  session: `home` (your house's room) is sent once in welcome / join info instead, and `reconcile()`
  keeps it.

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

## Protocol cheat sheet
`hello`/`welcome`/`denied` login · `in` inputs · `s` snapshots · `join`/`leave` · `rtc` voice signalling ·
`chat`/`chat-log`/`chat-error` text chat ·
`cast` broadcast · `npc-*` AI characters · `lecture`/`hands`/`ask*` lecture hall · `vote`/`courses` ·
`tutor*` quiz · `note` piano · `slap` · the combat set (`me`, `mobs`, `loot`, `hurt`, `faint`, `got`,
`gear`, `toast`, `skill`, `boss`, `nomana`, `shop`, `scrolled`) · bag / skills / stats actions (`equip`,
`unequip`, `use`, `drop`, `scroll`, `learn`, `unlearn`, `respec`, `hotbar`, `hotswap`, `ap`, `pvp`,
`wear`, `showhelm`, `buy`, `sell`, `buycos`) · houses (`house`, `house-set`, `house-kick`, `invite`, `visit`). Routing for these is one `if` chain in `server/index.js`;
a new message needs a branch there and a line in the protocol comment.

## `src/main.js`
Owns the keyboard handler (panels first, then room-specific keys, then the Esc menu), the Esc menu
buttons (and its Controls page, `CONTROLS`: keep it in step with new keys), the HUD and splats, and wires every feature module together. `#debug` in the URL exposes
`window.slimeville` (see `docs/testing.md`).
