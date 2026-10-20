# Sound

File: `src/audio.js` (all of it). Called as `audio.sfx(name, {pan, vol})`; unknown names are silently
ignored, so check a new name exists in the effects list.

- Procedural Web Audio music + ambience per room (and per zone in the stages), crossfading on change
  (`setScene(room, zoneName)`); none in the Music House; houses reuse the tutoring room's music box; the harbour has a sea waltz with waves and gulls; the east cliffs a slow, airy tune with wind, seabirds and the sea booming below; the ferry's deck (both crossing rooms) a rolling 6/8 shanty with the paddle wheel churning and the ship's bell; boss tracks in dens, intensified in a boss's last
  stage (`setIntensity`).
- Effects for slaps, swings, hits, every skill, boss attacks, per-mob hurt/death voices
  (`sfx('mobHurt', {kind})`), the shop, scrolls, level up, doors, splats.
- Esc menu → "Music: on/off" (localStorage `slimeville-music`). `audio.unlock()` runs on every gesture.
- The overall music level is `MUSIC` at the top of the file, kept low on purpose. Nobody has listened to
  the audio yet: levels were measured offline (`createEngine(ctx)` renders into an OfflineAudioContext),
  so adjust on player feedback.
