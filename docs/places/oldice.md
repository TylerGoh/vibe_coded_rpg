# The Old Ice (room 50, `OLDICE`) and the Long Stair (room 51, `LONGSTAIR`)

FB2 (b): the way to Frostpeak's final boss, Fenrir, the Bound Wolf (`story/fb2-plan.md`, "On the way there"; the
pattern is `story/final-bosses.md`, "The way in", and FB1's `docs/places/sunkenroad.md`). Deep room, then approach,
then den (room 52, `FENRIR_DEN`, kept for FB2 (c)).

## The way in
One of the Hall Troll's walls at the Blue Halls' east end has fallen over (`OLDICE_GATE_X`), and behind it there
was a way down all along: a slot in the ice with the cutters' old ladder in it (`OPEN.fallenwall` in
`src/branch-gates.js`, a red-trimmed "The Old Ice" sign). Owner's rule: the update itself knocked it over, no quest
or event. The Blue Halls' side (the cutters' record, thin ice) is in `docs/places/bluehalls.md`. On the island map
it's one node, `oldice`, under the Blue Halls (`FROSTPEAK` in `src/shared/branches.js`; both rooms are its `rooms`),
and (until FB2 (c)) under it the den's node, `wolfhold`, blocked ("the ice holds").

## The Old Ice (Lv 90–100, a deep room on hard-pocket rules)
- Data: `OLDICE_*` and the spawns in `src/shared/rpg.js`, the room in `src/shared/sim.js`. Art: `src/oldice.js`
  (the room), `src/oldice-art.js` (mobs, gear, icons). Music scene `oldice`.
- The glacier's bed: the oldest ice there is, black-blue, layered like the pages of a book, lit only by faint
  cold glows deep inside it. Darker toward the east. Things frozen in the walls older than the hamlet (great ribs,
  a cart wheel, an antlered beast far bigger than a deer, a Keeper lamp post, a great fish): silhouettes only,
  no labels, no lore beyond "old".
- Hard-pocket rules (`hard` in `STAGES`): red level chips, red-trimmed zone signs, **no waystone, no trader**,
  elites throughout. West to east: the Cutters' Last Camp (no mobs: the camp left in a hurry, a sledge half-loaded
  and its rope dropped, a pot frozen solid on a dead fire, a lantern on its side, a stool knocked over, a pick left
  standing in a half-cut block), the Black Ice, the Frozen Wall and the Gate, where an iron ring is set in the floor
  with a broken chain and the cut stair goes down at `OLDICE_END_X` into the Long Stair.
- Mobs (legacy brains, on the frozen curve, `docs/economy.md`): gnawers (pale ice rats; `blink`: under the ice and
  up behind you), rime ravens (`dive`, `fly` 60: inside the 70 px flier rule), chain-wardens (Keeper stone figures
  holding a length of old glowing fetter ribbon across their front; `shell`: hit them from behind) and black-ice
  wolves (the pack: a charge, which is the `shell` brain's lunge with `cut: 0`, no shell). **Naming:** the Glacier's
  Lv 67 `rime_wolf` already had "Rime Wolf", so the deep ones are `black_wolf`, "Black-Ice Wolf"; FB2 (c)'s pack
  should reuse them. Elites: Gnawer Queen, Elder Chain-Warden, Black-Ice Packleader. The wolf's things share one
  tell: pale blue-white eyes with no pupils.
- **Garm, the Hound at the Gate**: a named elite at the far end (not a boss: no den, no phases, an ordinary
  respawn), the hound that guards the head of the way down, as in the myth. `elite('black_wolf', …)` with its own
  `art` (`garm`: heavier, chest frosted rust-red, an iron collar with a broken chain swinging), bigger, a longer,
  quicker charge. The economy script checks it as an elite of the black-ice wolf.
- Drops: four materials (gnawer tooth, rime raven quill, fetter scrap, black-ice pelt), the Chain-Warden's Helm
  (chain-wardens) and the Gatehound Fang with its staff and bow twins (rare off black-ice wolves, likelier off Garm),
  priced on the curve between the Blue Halls' gear and Sigrun's.
- The Old Lamp (last in `OLDICE_PLATFORMS`): the hidden spot, a Keeper lamp post frozen high in the wall over the
  Frozen Wall, its stone cap the ledge, a cutter's dark lantern still hanging on its hook (the den's lanterns in
  FB2 (c) hang on posts like it).

## The Long Stair (the approach: no mobs, no combat)
`src/longstair.js`. Not a stage (no `STAGES` row, not a combat room): safe ground where the party gathers.
Owner's rule: everything cinematic here is drawing and sound, never `step()`, never a cutscene; you should feel shut
in, never be shut in.
- A stair the cutters cut down into clear ice and never finished, landing by landing: the floor you walk is each
  landing (`LANDING_W` apart), and the flight you came down is cut into the wall behind it. A cutters' lantern on
  an iron post at every landing.
- `stairDepth(x)` (0 at the way in, 1 at the den's door) drives it all, from **your own** slime's x: the wolf's
  shape behind the clear ice wall grows (a shadow, then the curve of its back with rimed fur, then past `EYE_WX` an
  eye that opens as you pass and turns to follow you), its breath frosts the ice in front of its muzzle every
  `BREATH_S`, the lanterns go out below you one by one (and behind you, the deeper you go), the roof comes down,
  the ice dust stops falling, the dark closes in from the edges (`drawLongStairFront`), and frost creeps over the
  stair behind you (art only: the door back always works, and walking back up thaws it).
- Music scene `longstair`: the Old Ice's tune thinning to nothing by the middle, the ice's hum (two low notes
  beating), a slow breath, and a chain clinking somewhere, nearer and more often the deeper you are
  (`audio.setDepth`, set every frame from `src/main.js`, as the Road's End).
- **Fenrir's line** (`FENRIR_LINE`): the first slime past `FENRIR_MARK_X` in an empty Long Stair makes the server
  send `{t:'boss', a:'voice', who, text}` to the room (`longStairSaid` in `server/rpg.js`, checked every
  `PATCH_HIT_EVERY` ticks, reset when the room empties), exactly like Ladon's. The client shows a pale bubble out of
  the ice and a chat line.
- **The den's door** at `FENRIR_DEN_X`: an arch cut into the black ice with a sheet of ice over it that cracks by
  itself as you come near, the breath seeping through the cracks. The sign beside it: `FENRIR_DEN_NAME`,
  `finalTag(FROST_TOP)` (both levels, from `FINAL_LVL_OVER` and `FINAL_MIN_PLAYERS`) and a live count,
  "3 here, 4+ recommended": a count, never a lock.

## The door opens (FB2 (c))
Until FB2 (c) the door was a gate (the phases rule: shown, blocked by an in-world reason): a `wolfhold` node in
`FROSTPEAK`, the ice cracked but holding. FB2 (c) added the den's `DENS` row (`from: LONGSTAIR`, `fromName`,
`entranceX: FENRIR_DEN_X`, room `FENRIR_DEN`) and deleted the node: the door comes through `denDoors(LONGSTAIR)`, and
`FENRIR_DOOR_OPEN` (true once the row exists) lets the ice break open by itself as you come near. No quest, no event.
The den and the fight: `docs/places/fenrir.md`.

## Decisions and history
- 2026-10-27: built in FB2 (b). Names new here: the Cutters' Last Camp, the Black Ice, the Frozen Wall, the Gate,
  the Old Lamp, the Wolf's Hold, the black-ice wolf (the plan's "rime wolf" clashed with the Glacier's).
