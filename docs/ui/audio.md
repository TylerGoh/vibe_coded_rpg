# Sound

File: `src/audio.js` (all of it). Called as `audio.sfx(name, {pan, vol})`; unknown names are silently
ignored, so check a new name exists in the effects list.

- Procedural Web Audio music + ambience per room (and per zone in the stages), crossfading on change
  (`setScene(room, zoneName)`); none in the Music House; houses reuse the tutoring room's music box; the harbour has a sea waltz with waves and gulls; the east cliffs a slow, airy tune with wind, seabirds and the sea booming below; the ferry's deck (both crossing rooms) a rolling 6/8 shanty with the paddle wheel churning and the ship's bell; Icefang Hamlet (`fjord`) a slow minor waltz on a fiddle-like line over a drone, with far bells and the lamp-fire crackling; Willowmere (`willowmere`, a lazy riverside tune), Saltspray Coves (`coves`, breezy shore strum), the Tidemother's den (`tidemother`, a heaving 6/8), the Mycelium Deep (`deep`, a hushed music box with drips), Glowroot Hollow (`glowroot`, racing glockenspiel over the heart knot's beat), the Knotmole's burrow (`knotmole`, a stubborn 6/8 with digging thumps), the Old Oak Canopy (`canopy`, a sunny swaying 3/4 with birdsong, a woodblock and a far-off woodpecker); Wreck Cave (`wreck`, a slow 3/4 shanty on a squeezebox with drips, a creaking hull and a far-off bosun's whistle), the Thornheart (`thornheart`, a stern E phrygian tune over a slow heartbeat, harp notes falling like petals), Keeper's Spine (`spine`, A dorian, a horn over open fifths, the wind, a far bell and a kite's cry) and the Root Warden's court (`warden`, stone footfalls, low brass and a bell tolling every bar); the Rimeglass Glacier (`glacier`, B minor, a bowed pad and a glockenspiel like light through ice, the ice groaning far down and a rising shimmer for the aurora); new mobs borrow legacy mob voices; boss tracks in dens, intensified in a boss's last
  stage (`setIntensity`).
- Effects for slaps, swings, hits, every skill, boss attacks, per-mob hurt/death voices
  (`sfx('mobHurt', {kind})`), the shop, scrolls, level up, doors, splats.
- Esc menu → "Music: on/off" (localStorage `slimeville-music`). `audio.unlock()` runs on every gesture.
- The overall music level is `MUSIC` at the top of the file, kept low on purpose. Nobody has listened to
  the audio yet: levels were measured offline (`createEngine(ctx)` renders into an OfflineAudioContext),
  so adjust on player feedback.
