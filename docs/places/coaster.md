# The Gathering Line (the Gathering Fair's coaster, F2)

Owner's ask (2026-11-20, in the fair's first message): "a rollercoaster that uses the swing mechanic and brings you to
different parts of this large carnival". Planned as F2 in `story/fair-plan.md`; shipped 2026-11-21. The fair itself:
`docs/places/fair.md`.

Files: `src/shared/coaster.js` (the track, its speeds, the stations, `rideAt`, shared by the client and the server), the
ride inside `step()` in `src/shared/sim.js` (`rd`, `rc`, `PICK`), `src/coaster.js` (the track's art and the station sheds,
`drawCoaster`; a rider in their car, `drawRider`; the "where to?" card, `RideCard`), the `#ride` card in `index.html`,
the station prompt in `src/fair.js`, the wiring in `src/main.js`, Fizz's lines in `server/characters.js`.

## What it is
- One closed loop round the whole fair. Out east, low: the **Gate Plaza** station, a chain lift beside the Big Top, a dive
  in through the Big Top's roof and out of its far side, the **Midway** station, hills over the booths, the Ferris wheel
  and the carousel, the **Ride Row** station, a lift up to the loop over the Hall of Mirrors, down to the **Pier's End**
  station; then up a half circle at the east end, back west high over everything, and down a half circle into the Gate
  Plaza again. So every station reaches every other, some the long way round (the card shows each ride's seconds).
- Board: stand on a station's platform (`STATION_R` of its x), press E, pick where to get off on the card (or 1–3). Esc,
  E or Not now closes it; walking off the platform does too. Phones: the same card, tapped.
- Riding: you sit in a car on the rail; keys do nothing until it sets you down at your stop. Everyone in the fair sees you
  go by, your name tag hanging under the car. Inside the Big Top you're out of sight (tag too) until you come out of its
  far side.
- Cosmetic only (the fair's rule): no gold, EXP or power, so the economy sheet doesn't move.

## The netcode (owner's rule: anything that moves you is in `step()`, driven by input bits)
- A ride is two numbers on the state: `rd` (1 + from × 4 + to; 0 when not riding) and `rc` (ticks since the car left).
  While `rd` is set, `step()` puts you where `rideAt(rd, rc)` says (feet `SEAT` above the rail), keeps you grounded and
  returns before anything else (no doors, no walking); when the ride's over it sets you down at the station's x.
- Boarding is the E press itself: the card's button ORs USE and the pick (1 + the stop, `PICK`, three bits of the input's
  second byte from `PICK_SHIFT`) into the next input, like the Set sail card does with E. `step()` boards you if you're on
  a station's platform in the fair and the pick isn't that station. So it's predicted like walking, and friends who board
  on the same tick ride the same car's path together. `KEY_MASK` grew to let the pick through.
- `rd` and `rc` are in snapshots (wire version 12, `src/shared/wire.js`: 58 bytes a slime). Older tabs get version 11's
  records: they see riders gliding along the track with no car. Positions saved over a restart don't keep a ride: you're
  put down on the ground below where you were.
- The track is built once at load from the nodes in `src/shared/coaster.js` (Catmull-Rom between them, raw runs for the
  half circles and the loop, `SMOOTH` passes of rounding with each station's middle pinned flat, then resampled every few
  px). Each sample's time comes from its speed: steady `LIFT_V` up a chain lift, slow at the crests and quick in the
  dips by height (`TOP_V`, `GRAV`), braking to `STATION_V` over `STATION_RUN` either side of every station. `LOOP_TICKS`
  is once round. The client and the server build the same table from the same code.

## Drawing
- `drawCoaster` (called by `drawFair` after the Big Top, so the high line runs in front of its roof): lattice legs, the
  rail (not drawn where it runs inside the Big Top, with a dark hole in the canvas where it goes in and out), and the four
  station sheds (a striped roof, a board with the stop's name, bulbs, an empty car waiting).
- `drawRider` (from the slime pass in `main.js`): the car's back, the slime rotated with the rail about the rail point
  (the house swing's trick: drawing only, the physics never rotates), then the car's front and lap bar over the slime's
  lower half. Upside down at the top of the loop.

## Past mistakes
- The first spline had a sign wrong in its cubic term, which threw the track kilometres off; the station runs pinned
  whole left a kink where each drop met them (pin only the middle). A check worth keeping: the loop's length, the ride
  times and the largest turn a tick (`node` over `src/shared/coaster.js`).

## Not done
- No sounds of its own yet (the chain's clack, a whoosh down the drops). Untested with people: whether the ride times feel
  right, whether being carried with no control for up to half a minute is fun or dull, and phones' frame rate on it.
