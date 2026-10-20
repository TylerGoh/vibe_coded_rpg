# Music House: the floor is a giant piano

Files: `src/piano.js` (room, building, synth), keys in `src/shared/sim.js` (`KEY_W`, `whiteMidi`,
`BLACK_KEYS`, `pianoKeyAt`).

- The white keys are the floor; the black keys are raised one-way platforms.
- The server detects landings in `stepPlayer()` and sends `note` to the room. The lander plays its own
  note straight from prediction (`onLand`, fresh steps only) and ignores the echo, so there's no delay.
- Web Audio synth, panned by position. No music plays in this room (the floor is the instrument).
