# The climb: the balloon, the column, the Skydocks camp (the Citadel's town) and the Skydocks

Atlas Phase 6, "the climb" (`story/world/atlas.md`; plan `story/phase6-plan.md`, approved by the owner 2026-11-04 with
every default). Story: `story/world/regions/citadel.md`, `story/world/geography.md` (Emberdeep → Citadel: a balloon up
the thermal column), `story/world/emberdeep-depth.md` (decision 3: the column stalls; Slag's burner lifts it).

Files: the camp's layout in `src/shared/rpg.js` (`SKYCAMP`, `CAMP_W`, `KESTREL_X`, `CAMP_DOCK_X`, `CAMP_HOME_X`,
`CAMP_WAY_X`, `CAMP_SPAWN_X`, `CAMP_FIRE_X`, `IONE_X`, `TAMP_X`, `CAMP_END_X`, `CAMP_PLATFORMS`, `SHOPS.kestrel`, the
`aeronaut_goggles`; Phase 6 (c): `SKYDOCKS`, `SKYDOCKS_W`, `SKYDOCKS_EXIT_X`, `SKYDOCKS_RAMP_X`, `WARDEN_X`,
`DOCKS_WAY_X`, `SKYDOCKS_ZONES`, `SKYDOCKS_PLATFORMS`, `GUSTS` and `gustAt`, the three mobs, their materials, the
`STAGES` row and spawns, `COLUMN_VISTA_X`), the rooms in `src/shared/sim.js` (`SKY_UP`, `SKY_DOWN`, `ROOMS[SKYCAMP]`,
`ROOMS[SKYDOCKS]`, the balloon's door in `ROOMS[CALDERA]` at `BALLOON_X`, the Citadel's west door, the `TOWNS` entry,
the four `NPCS`, their `SLAP_QUIPS`), the camp's drawing in `src/skycamp.js` (`drawSkycamp`, `drawSkycampView`, and
`drawCitadelSky` / `drawCitadelAir`, shared with the Skydocks), the Skydocks' drawing in `src/skydocks.js`
(`drawSkydocks`), its mobs and materials in `src/skydocks-art.js` (`SKYDOCKS_MOB_ART`, `SKYDOCKS_ICONS`), the people's
clothes and Kestrel's goggles in `src/skycamp-art.js` (`drawCampDress`, the Dockwarden's 'porter' too;
`CAMP_HELMETS`), the flight and the column vista in `src/balloon.js` (`drawColumnVista`; the flight called by
`src/crossing.js`), the balloon up in its cradle in `src/branch-gates.js` (`drawBalloonUp`, the `column` node's `entry`
in `src/shared/branches.js`), the top of the loading ramp in `src/citadel.js` (`drawExit`), the gusts' damage in
`server/rpg.js`, the two waystones in `src/shared/waystones.js`, the personas in `server/characters.js`, the `sky`,
`skycamp` and `skydocks` music scenes in `src/audio.js`, the World map's pins in `src/worldmap.js`.

## What it is
- **The balloon flies.** The Kite lay deflated in her cradle on a ledge by the thermal column at Magma Heart's east end
  from Phase 5 on (the next phase shown but shut: "the column stalls"). The Phase 6 update lifted it, no quest (owner's
  rule): Slag built her pilot a forge-burner hot enough to carry the basket through the column's stalls. The cradle at
  `BALLOON_X` now shows her full and straining at her tethers, the burner roaring in bursts, the column pouring up
  behind (`OPEN.balloon`), and its door asks first ("Cast off up the column…", the sail card's button says **Cast
  off**: a door's `go`) and boards `SKY_UP`. Its label says "Lv 135+"; no gate.
- **The flight is a crossing** (`docs/places/crossings.md`): route `'sky'`, two decks like the ferry and the Lodestar,
  `SKY_UP` (room 66, the slow one) and `SKY_DOWN` (67). The deck is her long wicker gondola under the belly of a huge
  patched envelope; the same `DECK_PLATFORMS` become cargo crates, a wicker cabin, the rigging hoop and the burner's
  iron platform. Pilot Kestrel stands at her trim lines at the stern on both decks (`also`).
- **The climb** (`src/balloon.js`, all drawing, driven by your voyage clock as `h`, how high you are): Magma Heart's
  crater falls away below, the column's smoke and sparks stream past, three cloud layers come down through the deck (a
  whiteout as each one passes), then a cold, clear blue with **the whole archipelago small on the Glass Sea far below**
  (Greenhollow, Frostpeak under its aurora, Emberdeep right under you with its smoke rising, and in the far east a
  violet blur with lights in it nobody names: Lantern Fen, atlas Phase 8, seen and not open), and the Citadel's
  underside comes down over the envelope: brass plating, a gear the size of a house, broken piers hanging on chains.
  She ties up at the camp's pier. Coming down runs it backwards and ends at the ledge in Magma Heart.
- **The Skydocks camp (room 68, a town and a safe room)**: tents and a brazier on the one pier under the dead city that
  still holds. West to east: **Pilot Kestrel's stall** under a striped awning (crates, a platform), the **mooring mast**
  with the Kite alongside (her gangway, `CAMP_DOCK_X`, boards `SKY_DOWN`; a brass ring up the mast is a platform), the
  ridge **tent whose flap is everyone's own front door** (`CAMP_HOME_X`; its ridge pole is a platform), the waystone,
  **the brazier** chained down against the wind (you wake by it, `CAMP_SPAWN_X`), a **gantry** hanging off the city on
  chains (a platform), **Pilgrim Ione's lantern pole**, **Tamp's pile of salvaged gears** (a platform), a second tent,
  and **the pier's end** (`CAMP_END_X`). Behind: a high cold sky with a few stars, a sea of cloud below with the other
  islands' landmarks standing up out of it (`drawDistantIslands` from `'citadel'`), the Citadel's underside overhead,
  wind streaks and ice motes blowing through.
- **A town** (owner's rule, `docs/world.md`): in `TOWNS`, so being here makes it your town; you wake by the brazier,
  your house's front door lets you out here, and houses can take the camp as their window view. The waystone has a new
  island, `isle: 'citadel'`: it reaches only the Citadel's stones (just this one for now, `docs/places/waystones.md`),
  and the Citadel's stones are wind-scoured, rimed and bolted to the pier with brass collars.

## The Skydocks (room 69, Lv 135–145, Phase 6 (c))
- **The way in:** at the camp's pier end (`CAMP_END_X`) the plank is laid flat now and lashed down, ropes strung along
  it, a board on the flagpole chalked "The Skydocks"; its door crosses to the Skydocks' west end. (Until (c) the plank
  stood on end, lashed against the wind, and the people said nobody could cross: the next step shown but shut. The
  update laid it; no quest.)
- **The room** (`src/skydocks.js`): the city's broken piers, under the same sky as the camp (`drawCitadelSky`), more
  broken piers far off at every height on their chains, chains hanging out of the city, bollards with empty mooring
  rings. West to east: the plank end ("To the camp"), **the Outer Moorings** (loose bolts, rigging moths), **the
  Warden's Pier** (no mobs: the Dockwarden at its post, `WARDEN_X`, with its arrivals board, every slot blank but
  "KITE"; the crates of cargo nobody came for, a platform; the waystone, `DOCKS_WAY_X`), **the Hanging Gantries**
  (moths and mooring hooks) and **the Loading Ramp** (hooks), whose foot (`SKYDOCKS_RAMP_X`) climbs into an open brass
  gate in the city's underside: the door into Cogwork Bastion's west end. Platforms: loading stages on iron legs,
  gantries hung off the city on chains, the crates. Zone signs stand just inside each zone's west edge (you come in from
  the west).
- **The find: the Harbour Lamp**, a dead signal lamp in a brass cage hung on one chain high over the Gantries (last in
  `SKYDOCKS_PLATFORMS`), reached off the gantry under it. Drawing only: the whole underside from up there.
- **A room hazard: gusts** (`GUSTS`). Between the piers the deck is only two planks laid over the cloud, a rope either
  side, a pennant post at each end. On each gap's own offset in a `GUST_CYCLE` the wind gets up (`GUST_WARN`: streaks
  thicken, the pennants stand out, the planks shudder), blows (`GUST_BLOW`: white tearing streaks, red pennants; it
  hurts whoever stands on the planks, `GUST_DOT` of max HP every `PATCH_HIT_EVERY` ticks) and drops. Both sides read the
  server tick (`gustAt`), so nothing goes over the wire; a flat `'dot'` (no knockback), so no `step()` change. On the
  planks only: a ledge over a gap or a jump is out of it. The same pattern as the Old Foundry's hot grates.
- **Mobs** (`src/skydocks-art.js`, on the curve: `docs/economy.md`): **loose bolts** (Lv 136, a hopping swarm of the
  city's brass hardware, plain chasers), **rigging moths** (Lv 140, pale sailcloth moths, `fly` under the 66 px aggro
  limit, the `dive` brain) and **mooring hooks** (Lv 144, cargo winches with a hook on a jib, the `stomp` brain: the hook
  swings back as it crouches, then it heaves up its chain and slams down; jump the shockwave). Materials: Stray Bolt,
  Rigging Silk, Mooring Link. No elites, no field boss, no rare gear (`docs/ideas.md`).
- **Cogwork Bastion's west end** is now the top of the ramp (`drawExit` in `src/citadel.js`: an open brass gate with
  cold daylight through it, the ramp going down out of it, a sign "The Skydocks · Lv 135+"); its door goes down to the
  ramp's foot.

## The skylift is gone (Phase 6 (c))
- The balloon was built and shipped in (b) and has both decks; (c) removed the skylift in the same update that opened
  the Skydocks, so the Citadel is never stranded: Magma Heart's skylift door, its constant and the
  station's art in `src/citadel.js` are deleted, and Cogwork Bastion's west door goes to the Skydocks instead of the Caldera.
- Magma Heart's east end is **the column vista** (`COLUMN_VISTA_X`, `drawColumnVista` in `src/balloon.js`, all behind
  the slimes): iron stakes and a sagging chain along the back of the ledge, and behind them the thermal column pouring
  up out of the vent, ash and sparks streaming up it, and far overhead the city's underside with broken piers hanging
  off it. The Caldera's scenery keeps clear of it (`CLEAR_XS`).
- So the way in now is: the balloon from Magma Heart, the camp, the plank, the Skydocks, the ramp. Players saved inside
  the Citadel are unaffected (they wake in their town as ever).

## The Dockwarden (AI, `dockwarden`)
- A brass porter automaton at its post on the Warden's Pier (`folk` none: a brass-hued slime, `accessory: 'porter'`: a
  navy porter's cap with a brass badge, rivets, verdigris at the seams, a lens over one eye glowing pale blue, a ledger
  held open with a pen ticking down it). Still logging arrivals at a port where nobody has come in for longer than it
  can count. Speaks in capitals, in ledger entries ("ARRIVAL NOTED." "DEPARTURES ARE SUSPENDED PENDING THE HOUR.").
- **It logs you by name** and counts your arrivals: that rides on the ordinary per-player memory
  (`docs/social/ai-characters.md`), not a server counter. The persona tells it to keep an arrival number per traveller
  and to open a new entry on a first talk (the `first` flag).
- Lore: narrow on purpose (Tier 4 stays the Last Echo's). It knows the port, its hazards and the camp's three (it logged
  Kestrel's cargo as "OPINIONS" and Tamp as "TAMPE"), that "the port is open" and "departures are suspended pending the
  hour", and nothing about the hour itself; anything else is "NOT IN THE LEDGER".
- Kestrel, Ione and Tamp's personas changed: the plank is laid (Kestrel and Tamp lashed it), each has met the Dockwarden.

## The camp's people (AI characters, `docs/social/ai-characters.md`)
The Citadel has no living people of its own (that absence is the point, atlas); the camp is visitors huddled at its
edge, each from a different island.
- **Pilot Kestrel** (`kestrel`, `shop: 'kestrel'`, forge folk): flies the Kite; the trader. Her stall sells the
  potions and her own **Aeronaut's Goggles** (a flying cap with brass goggles, aimed at Lv 140, `docs/economy.md`).
  She stands in three rooms (`also`), but trades only at the stall: the Trade button and the "(or trade)" hint show only
  in the shop's room (`src/npc.js`; a character in several rooms also stands on each room's own ground). Tier 0 plus
  the sky. Life: talks to the Kite, counts flights in a logbook (starting again from one), afraid of staying on the
  ground, her mother wanted her at the anvil; Ash calls her "the balloon girl".
- **Pilgrim Ione** (`ione`, a violet slime in a hood, in the fen folk's look since atlas Phase 8's L0): from Wickmere,
  carrying a lantern for "the one who went up" long ago. Gentle, strange. Tier 0 and home talk (Wickmere's lanterns);
  she never names the Wickmother. She was Phase 8's "seen but not open"; since L0 she says the Hush sails from Icefang
  Hamlet again (`docs/places/fen.md`).
- **Tamp** (`tamp`, forge folk): an old forge hand, once the bellows-boy of "the master" (Ignis, never named by him),
  sorting salvaged gears for the master's best piece, marked with a hammer over a flame, which he's sure went up to
  the city. It didn't (players who've seen Typhon's tooth may guess where it went); he never says what the gears were
  for. Taught Ash to hold tongs; makes strong tea; a little deaf.
- Personas that changed: **Ash** (the balloon is off his shut-ways list; he looked Slag's burner over and said nothing),
  **Slag** (he built the burner, at night, for a season; goes red if it's mentioned).

## HUD, hints and phones
- The voyage pill says "Kite · The Skydocks in 42 s" / "Kite · Emberdeep in …"; aboard, the World map's pin sits on
  the balloon's route (`islandOf` gives `'sky'`); at the camp it's on the Citadel. The camp's pill: "The Skydocks Camp".
- Nothing new to press: E at the cradle and the mast, the same Set sail card (its button reads Cast off), E at the plank
  and the ramp. Phones get the same card and the usual talk button. The gusts are telegraphed by drawing only (no new
  HUD): watch the pennants.
- Every character here has `SLAP_QUIPS` (Kestrel, Ione and Tamp shipped in (b) without any; the server reads the list
  for any character you slap, so (c) added them with the Dockwarden's).

## Decisions and history
- 2026-11-04: Phase 6 (b) built (the balloon, the vista at the cradle, the camp and its three people, the music). The
  owner took every default in `story/phase6-plan.md`: four rooms (two decks, the camp, the Skydocks), the camp a safe
  town with the fighting zone past it, the band 135–145, all four new characters AI with memory (the Dockwarden too,
  in (c)), no new folk look, Kestrel's goggles only, no Citadel island map yet.
- The column vista is the cradle's ledge at Magma Heart's east end (no new room): the column was already drawn there;
  in (b) the skylift's station still stood at the east end.
- 2026-11-04: Phase 6 (c) built (the plank laid, the Skydocks, its mobs and gusts, the Dockwarden, the ramp into
  Cogwork Bastion; the skylift removed and the column vista drawn where it stood). Defaults kept: gusts a telegraphed
  hit with no physics change, no field boss, the Dockwarden an AI character. The ramp's door sits at the ramp's foot
  (`SKYDOCKS_RAMP_X`, not at the room's very end) so you don't walk under the ramp to reach it.
