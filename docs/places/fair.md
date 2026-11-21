# The Gathering Fair (room 112)

Owner's ask (2026-11-20): "the world lacks flair: add a carnival, different entrances per region, all into one carnival
world", with a rollercoaster and minigames you zoom into. Owner's picks: **the Keepers' fair** (story), **town tents
only** (no entrances out in the wilds), **cosmetic only** (tickets never become gold, EXP or power). The plan and the
phases still to come: `story/fair-plan.md`. F1 shipped 2026-11-20.

Files: `src/shared/fair.js` (layout, tents, booths, prizes, the seeded rounds, tickets), `src/fair.js` (the client:
E at the fair, booth mode, the carousel ride), `src/fair-games.js` (Pop Gallery, Bonk-a-Knotmole), `src/fair-art.js`
(the tents, the fairground, the worn prizes, Fizz's outfit), `server/fair.js` (rounds, score caps, tickets, prizes;
created by `server/rpg.js`), Fizz's persona in `server/characters.js`, the `fair` song and the booth sounds in
`src/audio.js`, the `fair` view in `src/distant.js`.

## The story
- Canon (owner, 2026-11-20): Tier 0, every town has a striped tent onto the same fair, run by Ringmaster Fizz, and
  nobody finds that odd; Tier 3, it was the Keepers' fair, held at every Gathering when the whole land met, caught out
  of time in the Stopped Hour, so its gates still open on every shore and from its pier the islands still sit close.
- So: the sky is an evening that never quite gets dark, and every island but the Citadel sits close round its horizon
  (`fair` in `src/distant.js`: the Citadel was still on the ground then). The fair stays cozy everywhere; the "tone
  hardens with distance" rule doesn't reach inside it.

## Getting in and out
- Each town's tent is a door (`FAIR_TENT_X`, in `TOWNS` order; `src/shared/sim.js` gives each `TOWNS` entry its
  `fairX` and pushes the door into the town's room). Every tent leads to the same room, at `FAIR_EXIT_X`.
- The fair's tent flap is a door with `to: TOWN` and `fair: true`: `step()` lands you at your town's `fairX` (a house's
  front door, the other `TOWN` door, lands at `homeX`). The fair isn't a town, so your town stays the one you came in
  from: in at Wickmere, out at Wickmere.
- **Each tent has its own plot** (owner, 2026-11-21: F1's tents had been squeezed into gaps, over a turf hut, a stilt
  house, a stall, against the bakery and the waystone). `FAIR_PLOT_HALF` either side of the tent is the fair's patch:
  sawdust, a candy-striped pole each side with pennants strung up to the tent's peak, balloons on the east pole, an
  "ALL WELCOME" board by the west one (`drawFairPlot`, drawn just before `drawFairTent` from `render()` for any room with
  a town). The same fair colours in every town, as if a corner of the fair came through with the tent.
  - Slimeville's is the green between the bakery and Home: the waystone moved east of Home (where a lamp stood), and the
    floating island over the old spot, the green's lamp and its bunting went.
  - The other five towns were **widened by the road out of town** and the plot sits just before it (Icefang Hamlet by
    the path up to Frostpine Ridge, Forgehold by the road up to Cinder Flats, the Skydocks Camp by the plank, Wickmere by
    the way into the Shallows, Caravanserai by the way onto the Glass Dunes). Only what stood east of the plot moved
    (the exits, the path up's pines and rock, a brazier and a flue, a lantern; one of the Star Court's bronze rings went).
- **Placing a tent:** keep the doorway clear of the town's waystone (`WAY_RANGE`), every NPC's talk range and the other
  doors, because E does one thing at a time (talk first, then waystones, then doors), and keep the plot clear of
  platforms and scenery. Slimeville's first spot sat on the waystone and Icefang Hamlet's in Tove's range.
- A safe room: no mobs, no combat.

## The room, west to east
The Gate Plaza (the tent flap, the ticket kiosk, Ringmaster Fizz at `FIZZ_X`, the prize counter from `PRIZE_X`), the
Big Top (scenery, laced shut), the Midway (`BOOTHS`), Ride Row (the Ferris wheel turning empty behind, the coaster's
track over everything and its station at `STATION_X`, the carousel at `CAROUSEL_X`), the Hall of Mirrors
(`MIRRORS_X0`–`MIRRORS_X1`), the Pier's End (from `PIER_X`). Platforms (`FAIR_PLATFORMS`): the kiosk's roof, each
booth's canopy, the carousel's horses and canopy rim, the mirrors' roof, crates and the pier's posts.
- **The carousel:** its four front horses (`HORSES`) are platforms. A slime standing on one is drawn bobbing with it
  (`rideOf`, `horseBob`; drawing only, like the house swing: the physics never moves). The far horses circling round the
  back are just drawing.
- **The Hall of Mirrors:** each mirror (`MIRRORS`, `bend`: tall, wide, wobble, flip) draws every slime standing in
  front of it, bent its way, by calling the slime's own `draw()` under a transform. `drawFair` is passed the visible
  slimes for this.
- **Closed, by the owner's rule (the next phase shows, never a "coming soon"):** the Ring Toss (shutters down, "out for
  rings") and Hook-a-Duck ("gone swimming") are `BOOTHS` with `shut`; the Big Top (laced shut, the ring being raked) and
  the coaster's station (roped off, the chain lift being greased) are `FAIR_LOOKS`. E on any of them shows its line.
  The phase that opens each one changes the line into the real thing. The Ferris wheel turns with nobody on it (F3).

## Booth mode (the minigame mechanic)
- E at an open booth asks the server (`{a:'start', g}`); its `{a:'go', g, seed}` opens the round. The camera zooms into
  the booth (`applyZoom`, applied at the top of `render()`, undone after the world), and the game's card fades in over
  it (`drawGame`, drawn last). Your slime stands still meanwhile (`inputBits` sends nothing) and everyone else sees a
  "popping!" / "bonking!" sign over you (`{a:'play'}`).
- A round is `ROUND_S` seconds. Esc (or the Stop button on phones) ends it early, for fewer tickets. Then the result
  card ("TIME!", the score, the tickets), and the zoom back out.
- **Fairness, the same deal as hits on mobs:** the client plays and reports the score, the server caps it. Both sides
  build the round from the seed (`galleryPlan`, `bonkPlan`), so the server knows the best that round allows
  (`maxScore`: every good target hit, no bad one). A claim over it is cut to it; a round ended early is capped at that
  best × the share of `ROUND_S` actually played. One round at a time per player.
- Tickets: `ticketsFor`: `TICKETS_ROUND` × your share of the round's best, at least one if you scored. A good round is
  about half the best. The games are free.
- Today's best at each booth is chalked on a board beside it (`{a:'bests'}`, sent when you walk in and whenever one is
  beaten). Kept in the server's memory only: a restart or midnight clears it.
- **Input** (`Fair.key`, `Fair.pointer`): the mouse aims and clicks; the walk / jump / down keys move the crosshair or
  the mallet and attack or use fires (rebound keys follow, `docs/ui/keybinds.md`); 1–9 bonk a hole straight away (laid
  out like a number pad). On phones the touch buttons hide (`overlay`) so a tap on the canvas plays.

### The games (`src/fair-games.js`, in card units `GALLERY_W` × `GALLERY_H`)
- **Pop Gallery:** tin targets slide along three `RAILS`; pop them with a short reload between shots. Tin mobs are worth
  a little, gold stars a lot, the cardboard Elder Mochi ("not me!") costs you (`GALLERY_KINDS`).
- **Bonk-a-Knotmole:** a 3×3 field of holes; Knotmoles pop up and duck, quicker as the round goes on. Golden ones are worth
  more; a Mini Turnipop costs you (`BONK_KINDS`). A bonked one goes back down dizzy.
- A new game: its plan function in `src/shared/fair.js` (wired into `planOf`), its class in `GAMES`, a `FAIR_GAMES` entry
  and a booth in `BOOTHS` with `game`.

## Tickets and the prize counter
- `c.tickets` on the character (saved, sent in `me`, shown on the room's pill). Walk up to a prize on the counter
  (`PRIZES`, `prizeX`) and press E to trade (`{a:'prize', id}`; the server checks you're at it and can pay).
- Prizes are cosmetics in `COSMETICS` with `tickets` instead of a gold `price`: the Fair Balloon, Candy Floss, the
  Paper Crown, Star Specs, the Jester Cap. They're worn from the bag's Style row like the Boutique's, put on as soon as
  they're won, and drawn by `drawFairWear` (from `Slime.drawAccessory`). The Boutique, its server check and the economy
  sheet all skip cosmetics with no `price`, so a prize can never be bought with gold.

## The upside-down mirror
The fourth mirror (`POCKET_X`) is a way into the pocket world, a 3D beach where you're your slime in 3D: `docs/places/pocket.md`.

## Ringmaster Fizz
`fizz` in `NPCS` and `server/characters.js`: a showman in a red top hat, tailcoat and painted moustache
(`drawRingmaster`, accessory `ringmaster`). He runs the prize counter and knows every game, prize and closed ride (and
the in-world reason each is shut). He doesn't know or won't say how old the fair is. `lore: 3`: with a slime who has
learned Tier 3, he can talk over the Keepers' fair. Pim, who runs the Ring Toss, is his offstage friend.

## Not done yet (F2–F4, `story/fair-plan.md`)
The coaster (a ride clock in `step()`), the Ferris wheel's gondolas, the teacups, the High Striker, the dunk tank, the
Big Top's trampoline and show, the other booths, Madame Wobble, fireworks, plush furniture and goldfish prizes.
Untested by people: how hard the games feel, the ticket pace and the music (`docs/ideas.md`).
