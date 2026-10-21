# Personal houses, the furniture store, who's online, invites

Files: `src/shared/house.js` (`HOUSE_SIZES`, furniture catalogue, wallpapers, floors, layout format,
`cleanLayout`, `houseRoom`, `snapPlacement`), `src/house.js` (drawing the room and the garden, decorating,
the Expand button), `src/furniture.js` (every furniture drawing, wallpapers, floors), `src/players.js` (the
Players panel and the invite card), `server/house.js` (house rooms, saved layouts, owned furniture, buying it, invites, sending guests
home, `grow`). `src/store.js` (the furniture store's showroom, its buy card, its shop window in the village). Physics hooks in `src/shared/sim.js` (`roomDef`, `setHouseRoom`, `HOUSE_BASE`, `HOME`).

## Owner decisions (2026-10-20)
- Every account has its own house. The way in is the village's mushroom house (sign "Home",
  `HOME_DOOR_X`): E there takes you into **your** house; each player gets a private copy behind that door.
- **Every town has that door** (owner, 2026-10-20: "all new places should have the home access, like
  towns"): Icefang Hamlet's turf hut (`FJORD_HOME_X`) leads into the same house. The house's front door
  (`to: TOWN`) lets you out into **your town**, the last one you were in (`TOWNS`, `docs/world.md`).
- Invites: you can invite from **any town** or from inside your own house, but only slimes who are
  **standing in a town**. They get a card (Go over / Not now); Go over only works while they're
  still in a town and takes them straight into your house. An invite lasts `INVITE_MS`; there's no
  other way into someone else's house.
- Houses are decoratable (the owner asked for it over a fixed interior).

## Owner decisions (2026-10-20, third round): furniture is bought at a store with a showroom
- The **furniture store** is a building at the village's west end (`STORE_DOOR_X`, room `STORE`). Inside
  is a long showroom: one of every piece on display in sections (living room, bedroom, little things on
  pedestals, wall things, a garden corner), each with its price tag. Walk up to one, press E (or tap E):
  a card shows the price and how many you own; Buy spends the gold (`furni-buy`, server-checked, only in
  the store). New pieces in `FURNITURE` show up in the showroom by themselves (`DISPLAY` in
  `src/shared/house.js` lays them out by `sec`); if they don't fit, raise `STORE_W` (both sides warn in the
  console; a too-small room once left the whole garden corner out of reach).
- The showroom is long, so it teleports like the museum (owner's request): the entrance lobby has a
  numbered door to each section (`storePortalX`) and every section after the first has an "Entrance" door
  back. They're ordinary doors in `ROOMS[STORE]`, added by `src/shared/house.js` (it knows the layout), so
  the physics on both sides has them.
- Wall and floor patterns are drawn from a fixed grid (`snap` in `src/store.js`), not from the screen's
  edge: drawn from the edge, the stripes slid along with the camera.
- **Big pieces are expensive** (owner's words). Prices (`price` on each `FURNITURE` entry) scale with how
  big and grand a piece is: little things cost pocket money, big furniture is a mid-game goal, and the
  piano, fireplace and garden tree are long-term ones. `npm run economy` lists them all and checks that a
  piece 4× the size of another never costs less, and that one of every piece is a long collection goal
  (see `docs/economy.md`).
- You own furniture (`owned`, counts per piece); the decorate panel only shows what you own, with how
  many are still put away. "Put away" (the old Remove) puts a piece back in storage; nothing is ever sold
  back. Wallpaper and floors stay free.
- A new house owns exactly its starting pieces (`STARTER`). Houses from before the store own what they
  had out (`placed`), so nobody lost anything.
- The server enforces it: `cleanLayout(layout, owned)` drops any piece beyond what you own, on both
  sides, so a hacked client can't place furniture it never bought.

## Owner decisions (2026-10-20, later): bigger, open, with a backyard, expandable for gold
- Every house is **open plan**: the inside (x 0 → the size's `inside`) has big arched picture windows that
  show the real village sky and hills (main.js draws `drawBackground` behind houses; the wall is clipped
  around the windows), then an open patio straight into a **backyard** (the size's `yard`): lawn, a picket
  fence, the sky. No door between them; you just walk out.
- Houses are wider than one screen, so the camera pans like anywhere else. Decorating works wherever you
  are: walk to pan (on phones too, the touch pad stays), click / tap where the piece goes.
- **Pay to expand**: `HOUSE_SIZES` from the free Cottage up to a prestige Grand Estate; each size is wider
  inside and out and holds more `pieces`. Expand (in the decorate panel) asks once, then buys on a second
  press (`house-grow` with the size being bought, so a double click can't buy two). Sizes only grow. Prices
  are set against the balance sheet (`docs/economy.md`): keep `npm run economy -- --check` green when you
  touch them.
- Garden plots and the alchemy lab ("Farm & lab" in the store) are furniture too, with their own rules:
  `docs/places/alchemy.md`. Plots only go in the backyard and carry an `id` (their crop is kept under it).
- Garden furniture (bench, flower bed, hedge, birdbath, lamp post, garden tree you can climb into, swing,
  pond, all sold in the store's garden corner) works inside too. Wall things only hang inside (`cleanLayout` and `snapPlacement` keep them there).
- A picture window that a wall thing would cover isn't drawn (the wall stays solid behind a painting),
  so old layouts with paintings where the windows now are still look right.

## Owner decisions (2026-10-21): the swing is sittable, and pets
- The swing's seat is a narrow perch (`seat` on its `FURNITURE` entry: a platform only slimes use, nothing
  can be put on it). Hop on and you swing with the seat, harder than its idle sway (`swingFor` in
  `src/house.js`; main.js rotates the slime's drawing around the swing's top bar, the physics doesn't move).
- **Pets** are mini bosses (`PETS` in `src/shared/house.js`, their art the boss's own at `PET_SCALE`),
  sold at the Pet Shop on cushioned plinths (since 2026-10-21; it was the store's "Pets" corner before)
  and placed like furniture (always on the floor). They get hungry, sad, and die if not fed:
  `docs/places/pets.md`.
  They're `FURNITURE` entries (`pet_<boss>`), so owning, the decorate panel and `cleanLayout` work as for
  any piece. In the house each one wanders around where it was put (`petAt`: from the time, so everyone sees
  about the same walk); while you decorate, yours stand still on their spot so you can pick them up.
- Prices: owner asked "around 50k per pet or more for more premium ones". They're prestige sinks: the later
  the boss, the dearer (`npm run economy` has a pets table and checks it, `docs/economy.md`).

## How it works
- Saved rows hold the layout plus `owned`; `{t:'furni', owned}` tells the owner what they own at login
  and after each purchase (the store and the decorate panel both read it).
- The layout carries its `size` (an index into `HOUSE_SIZES`). Only the server changes it, and only when
  you pay (`grow`, which spends gold through `pay` in `server/rpg.js` and saves both at once); `house-set`
  keeps the stored size whatever the client sends.
- House rooms aren't in `ROOMS`. Their ids start at `HOUSE_BASE`; the server hands each account one at
  its first login after a start (`homeOf`), so the ids only mean something for this run. Layouts are saved
  by username in the `houses` table of the accounts DB. `roomDef(room)` is the way to look up any room
  now; code that does `ROOMS[room]` for a room that might be a house is a bug.
- `state.home` (your house's room) lives in the physics state so the "go into your house" door (`to:
  HOME`) is predicted like any other door. The server sets it at login; it isn't in snapshots (it never
  changes), so welcome / join info carry it and `src/net.js` keeps ours across reconciles.
- A layout decides its room: the width (from its size) and a one-way platform on every piece with a `top`
  (hop onto the bed, the bookshelf, a wall shelf, the garden tree). Server and client both call
  `setHouseRoom(room, houseRoom(layout))` whenever a layout arrives, so prediction matches; until it
  arrives a house is `HOUSE_W` wide (the smallest size); during a change there can be a tiny correction.
- `cleanLayout` runs on both sides (server: authoritative; client: so its local copy is the same) and
  settles floating pieces: moving a table drops what was on it.
- Being invited in and being sent home are server-side moves (`moveTo` = `placeAt`, like waking from a
  faint): the client's prediction just snaps to the new room on the next snapshot. Sent-home guests go
  out their own town's front door.
- Music in houses reuses the tutoring room's music box (`sceneKey` in `src/audio.js`).

## Decorating (R, or the Decorate button, in your own house)
- A panel at the top: icons of the furniture you own with how many are put away (scroll sideways; the
  mouse wheel works), Wallpaper / Floor cycle styles, Flip (F), Put away (Delete), Send guests home, Done (R / Esc). Click a piece in the room to pick it
  up; click / tap where it goes. Floor pieces snap onto the highest furniture top at or below the pointer
  (`snapPlacement`); wall pieces hang where you point; rugs stay on the floor.
- Walking and doors keep working while decorating (the panel isn't an "overlay", so the touch pad stays).
- Every change sends the whole layout (`house-set`, at most the size's `pieces`, a few KB); the server
  cleans, saves and sends it to everyone in the house. Growing sends it too, plus `house-grew` (a toast
  for everyone inside).

## Players panel (P, or the Players button, anywhere)
- Everyone online, with level and where they are, an Accuse button (botting, for fun:
  `docs/social/accuse.md`), and a Message button (opens a private chat tab,
  `docs/social/chat.md`) ("at home", "at tyler's house", "in the Wildwood"…),
  read from the newest snapshot. Invite buttons are only enabled when the rules above allow it; the
  server re-checks everything.
- The Players / Decorate buttons are HTML (`#hudbtns`, below the location pill; below the HP / MP panel in
  combat rooms), so they work on touch
  without a touch-pad button.
