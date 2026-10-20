# Proximity voice and broadcast

Files: `src/voice.js` (WebRTC), `server/turn.js` (TURN credentials), signalling routed by `server/index.js`.

- Peer-to-peer WebRTC; the server only relays `rtc` signalling. Calls open within a near distance and
  close beyond a slightly larger one (hysteresis); the lower player id makes the offer. Volume falls off
  with distance and is set on `<audio>` elements (not Web Audio) so echo cancellation keeps working.
  Mic is off by default (M / the top-right button).
- **Broadcast** (B / the "Broadcast" button next to Mic, works on touch): `cast` messages; the server keeps
  `p.cast`, tells everyone, and lists current `casts` in `welcome`. A broadcaster is called by every slime
  in every room and played at full volume. It's one way: the broadcaster hears others by proximity only.
  Turning it on turns the mic on; mic off ends it. A red "LIVE …" pill shows for everyone. Because of
  this, `main.js` passes *all* online players (with their room) to `voice.update()`, not just visible ones.
- Cloudflare Realtime TURN relays strict NATs (keys in `~/.config/rpg/turn.env`). The Esc menu shows each
  call's state and route (direct/relay): check that first when someone can't be heard.
- The owner's word "proximity chat" meant this voice feature, not text.
