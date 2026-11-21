# The Gathering Fair: the plan

Owner's ask (2026-11-20): the world lacks flair; a carnival with an entrance in every region, all into one carnival
world; a rollercoaster that uses the swing's trick to carry you round a large fair; carnival games you zoom into.
Owner's picks: **the Keepers' fair**, **town tents only**, **cosmetic only**. How the shipped parts work:
`docs/places/fair.md`.

## The story (canon since 2026-11-20)
The Keepers held a fair at every Gathering, when the whole land met. In the Stopped Hour it was caught out of time with
all its gates open, so a striped tent in every town still opens onto it, and from its pier the islands still sit close
on the horizon. Ringmaster Fizz has run it "since forever". It's the one place friends on different islands meet
without a voyage: the game's theme (distance isn't the end of closeness) made into a fairground. It stays cozy; the
tone gradient doesn't reach inside.

## The phases
Each phase shows the next one's rides closed for an in-world reason, and lifts that reason when it ships.

- [x] **F1** (2026-11-20): the room, the six town tents, the Gate Plaza, Ringmaster Fizz (AI), tickets and the prize
  counter (five cosmetics), **booth mode** (the zoom-in minigame mechanic) with Pop Gallery and Bonk-a-Knotmole, today's
  best at each booth, the carousel (ride a bobbing horse), the Hall of Mirrors, the Pier's End, the calliope waltz.
  Shown closed: the Ring Toss, Hook-a-Duck, the Big Top, the coaster's station; the Ferris wheel turns empty.
- [x] **F2: the Gathering Line** (the coaster; shipped 2026-11-21, `docs/places/coaster.md`: as planned, with the stations' rides
  shown in seconds on the card and the way back west high over everything). The station's rope comes down (the chain lift is greased). Board at a
  station, pick where to get off on a card (like the Set sail card). Your place on the track comes from a ride clock in
  `step()` (like the voyage clock `vt`: predicted, in snapshots, a wire version bump), so friends who board together
  ride together and everyone on the ground sees you go by; the car tilts with the track and your slime turns with it
  (the house swing's drawing trick). Stations at the Gate Plaza, the Midway, Ride Row and the Pier's End; a loop over the
  Hall of Mirrors and a dive through the Big Top's roof.
- [ ] **F3: rides and the Big Top.** The Ferris wheel's gondolas (sit in one, it turns you to the top, where every island
  shows); the teacups (your controls swap while you spin: the boss challenges' `cs`); the Big Top opens (a trampoline
  ring: a bouncy platform kind in `step()`, and Fizz's show on a server clock); the High Striker (slap the pad, the
  server decides how high the puck goes); the dunk tank (a friend on the plank, you throw at the target).
- [ ] **F4: more games and the evening.** Ring Toss (Pim's back with the rings: hold to set power and angle), Hook-a-Duck
  (the ducks are back: timing, golden ducks), Jelly Stack, Slime-Ball; Madame Wobble the fortune teller (AI, dreamy,
  narrow lore); fireworks over the pier on a server clock; more prizes (plush furniture for houses, a goldfish-in-a-bag
  pet on the Pet Shop's feeding rules, a carousel horse for the garden).

- [x] **Town tents, given a real place** (owner, 2026-11-20; done 2026-11-21): the six tents (`FAIR_TENT_X`) had been
  squeezed into gaps (Slimeville's against the waystone and the bakery's sign, Icefang Hamlet's over a turf hut,
  Forgehold's on the seam of the caldera wall, the Camp's over a canvas tent, Wickmere's in front of a stilt house,
  Caravanserai's on a stall). Each now stands in its own plot (`drawFairPlot`): Slimeville's on a cleared green between the
  bakery and Home, the other five in room made by widening the town by its road out (`docs/places/fair.md`).

## Rules kept
- Tickets buy prizes only; prizes are looks only. No game, ride or prize gives or costs gold, EXP or power, so the
  economy sheet never moves for the fair (a gold cost per game was considered and dropped: free is friendlier).
- Every game works on a phone (taps), and its score is capped by the server from a shared seeded plan.
- No entrances outside towns.
