# The Gathering Line (the Gathering Fair's coaster, F2)

Owner's ask (2026-11-20, in the fair's first message): "a rollercoaster that uses the swing mechanic and brings you to
different parts of this large carnival". Planned as F2 in `story/fair-plan.md`; shipped 2026-11-21 with a pick-your-stop
card, then the same day changed at the owner's word: "instead of a toggle people can catch a cart by pressing e as it
passes and can dismount by pressing e or jumping off". The fair itself: `docs/places/fair.md`.

Files: `src/shared/coaster.js` (the track, its speeds, the stations, the cars' clock, `trackAt`, `nearestOnTrack`, shared by
the client and the server), the ride inside `step()` in `src/shared/sim.js` (`rd`, `rc`, `CATCH`, `RIDE_FLING`),
`src/coaster.js` (the track's art, the station sheds and the empty cars, `drawCoaster`; a rider in their car,
`drawRider`; which car is in reach, `cartNear`), the prompts in `src/fair.js`, the wiring in `src/main.js`, Fizz's lines
in `server/characters.js`.

## What it is
- One closed loop round the whole fair. Out east, low: the **Gate Plaza** station, a chain lift beside the Big Top, a dive
  in through the Big Top's roof and out of its far side, the **Midway** station, hills over the booths, the Ferris wheel
  and the carousel, the **Ride Row** station, a lift up to the loop over the Hall of Mirrors, down to the **Pier's End**
  station; then up a turnaround at the east end, back west high over everything, and down a turnaround into the Gate
  Plaza again.
- `CARTS` empty cars go round all the time, evenly spaced, on the server's clock (`cartTimes`), so everyone sees the same
  cars in the same places. They slow right down through the stations.
- **Catch one:** press E when a car's seat is within `CATCH_R` of you ("catch the Gathering Line" shows then). Easiest
  from a station's platform as one crawls through; you can also jump up to one going by, or catch it from a platform under
  the track. Not inside the Big Top.
- **Ride** as long as you like, round and round; keys do nothing else. Everyone sees you go by in your car, your name tag
  hanging under it; inside the Big Top you're out of sight (tag too).
- **Hop off:** E or Jump ("hop off (E or Jump)"), anywhere but inside the Big Top. You fly on with the car's speed (sideways
  capped at `RIDE_FLING`), plus a jump if you jumped, and land wherever that takes you: a booth's canopy, the pier, the sand.
  Off the high line that's a long way down; the fair's a safe room, so nothing hurts.
- Cosmetic only (the fair's rule): no gold, EXP or power, so the economy sheet doesn't move.

## The netcode (owner's rule: anything that moves you is in `step()`, driven by input bits)
- Riding is two numbers on the state: `rd` (1 while riding) and `rc` (where on the loop, its loop time, 0 to `LOOP_T`).
  While `rd` is set, `step()` moves `rc` on a tick and puts you at `trackAt(rc)` (feet `SEAT` above the rail), keeps you
  grounded and returns before anything else (no doors, no walking). An E or Jump press drops you off.
- Catching is the E press itself with `CATCH` (bit 10 of the input) set: the client sets it only when it can see a car in
  reach (`cartNear`, at the tick other slimes are drawn at). `step()` doesn't know where the cars are (it has no world
  clock): it puts you on the nearest point of the track if that's within `CATCH_R` (`nearestOnTrack`). So catching and
  riding are predicted like walking. The rider's own car stands in for the empty one they caught (an empty car isn't drawn
  within a few ticks of a rider's loop time); friends who catch the same car ride a car's length or so apart. The server
  doesn't check that a car was really there: a modified client could ride a car of its own, which is harmless.
- `rd` and `rc` are in snapshots (wire version 12, `src/shared/wire.js`: 58 bytes a slime). Older tabs get version 11's
  records: they see riders gliding along the track with no car. Positions saved over a restart don't keep a ride: you're
  put down on the ground below where you were.
- The track is built once at load from the nodes in `src/shared/coaster.js` (Catmull-Rom between them, raw runs for the
  turnarounds and the loop, `SMOOTH` passes of rounding with each station's middle pinned flat, then resampled every few
  px). Each sample's time comes from its speed: steady `LIFT_V` up a chain lift, slow at the crests and quick in the
  dips by height (`TOP_V`, `GRAV`), braking to `STATION_V` over `STATION_RUN` either side of every station. `LOOP_TICKS`
  is once round. The client and the server build the same table from the same code.

## Drawing
- `drawCoaster` (called by `drawFair` after the Big Top, so the high line runs in front of its roof): lattice legs, the
  rail (not drawn where it runs inside the Big Top, with a dark hole in the canvas where it goes in and out), the four
  station sheds (a striped roof, a board with the stop's name, bulbs) and the empty cars. `setCoaster` gives it the tick
  and the riders' loop times each frame.
- `drawRider` (from the slime pass in `main.js`): the car's back, the slime rotated with the rail about the rail point
  (the house swing's trick: drawing only, the physics never rotates), then the car's front and lap bar over the slime's
  lower half.
- Which way up (`trackAt`'s `d` and `sx`): cars stay upright heading west (tilted with the rail, mirrored), turn round each
  end's turnaround as if on a spiral ramp (level, squashing through to face the other way), and only go upside down in the
  loop over the Hall of Mirrors. The first version used the rail's angle as it was, which drew every car on the way back
  upside down.

## Past mistakes
- The first spline had a sign wrong in its cubic term, which threw the track kilometres off; the station runs pinned
  whole left a kink where each drop met them (pin only the middle). A check worth keeping: the loop's length and the
  largest turn a tick (`node` over `src/shared/coaster.js`).

## Not done
- No sounds of its own yet (the chain's clack, a whoosh down the drops). Untested with people: whether catching a car from
  a station is easy enough (on a phone too), how hopping off from up high feels, and phones' frame rate on it.
