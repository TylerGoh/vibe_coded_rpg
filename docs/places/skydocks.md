# The climb: the balloon, the column and the Skydocks camp (the Citadel's town)

Atlas Phase 6, "the climb" (`story/world/atlas.md`; plan `story/phase6-plan.md`, approved by the owner 2026-11-04 with
every default). Story: `story/world/regions/citadel.md`, `story/world/geography.md` (Emberdeep → Citadel: a balloon up
the thermal column), `story/world/emberdeep-depth.md` (decision 3: the column stalls; Slag's burner lifts it).

Files: the camp's layout in `src/shared/rpg.js` (`SKYCAMP`, `CAMP_W`, `KESTREL_X`, `CAMP_DOCK_X`, `CAMP_HOME_X`,
`CAMP_WAY_X`, `CAMP_SPAWN_X`, `CAMP_FIRE_X`, `IONE_X`, `TAMP_X`, `CAMP_END_X`, `CAMP_PLATFORMS`, `SHOPS.kestrel`, the
`aeronaut_goggles`), the rooms in `src/shared/sim.js` (`SKY_UP`, `SKY_DOWN`, `ROOMS[SKYCAMP]`, the balloon's door in
`ROOMS[CALDERA]` at `BALLOON_X`, the `TOWNS` entry, the three `NPCS`), the camp's drawing in `src/skycamp.js`
(`drawSkycamp`, `drawSkycampView`), its people's clothes and Kestrel's goggles in `src/skycamp-art.js`
(`drawCampDress`, `CAMP_HELMETS`), the flight in `src/balloon.js` (called by `src/crossing.js`), the balloon up in its
cradle in `src/branch-gates.js` (`drawBalloonUp`, the `column` node's `entry` in `src/shared/branches.js`), the camp's
waystone in `src/shared/waystones.js`, the personas in `server/characters.js`, the `sky` and `skycamp` music scenes in
`src/audio.js`, the World map's pins in `src/worldmap.js`.

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

## The next step shows but doesn't open (Phase 6 (c))
- At the pier's end the **plank across to the next pier is stood on end and lashed**, a flag cracking in the wind; no
  door, no sign. Up past it, across the cloud, the Skydocks' broken piers at different heights with empty mooring
  rings, and on one of them a **small brass figure at its post with a ledger** (the Dockwarden). The people say the wind
  across the gap is too strong to cross yet. Phase 6 (c) lays the plank: the Skydocks room (Lv 135–145; loose bolts,
  rigging moths, a mooring hook), the Dockwarden, the way on into Cogwork Bastion, and **the skylift goes** in the same
  update, once the balloon has been tested both ways (never strand an island). Until then the skylift at
  `CITADEL_DOOR_X` stays the way into the Citadel itself.

## The people (AI characters, `docs/social/ai-characters.md`)
The Citadel has no living people of its own (that absence is the point, atlas); the camp is visitors huddled at its
edge, each from a different island.
- **Pilot Kestrel** (`kestrel`, `shop: 'kestrel'`, forge folk): flies the Kite; the trader. Her stall sells the
  potions and her own **Aeronaut's Goggles** (a flying cap with brass goggles, aimed at Lv 140, `docs/economy.md`).
  She stands in three rooms (`also`), but trades only at the stall: the Trade button and the "(or trade)" hint show only
  in the shop's room (`src/npc.js`; a character in several rooms also stands on each room's own ground). Tier 0 plus
  the sky. Life: talks to the Kite, counts flights in a logbook (starting again from one), afraid of staying on the
  ground, her mother wanted her at the anvil; Ash calls her "the balloon girl".
- **Pilgrim Ione** (`ione`, a plain violet slime in a hood: Lantern Fen's folk look is Phase 8's): from Wickmere,
  carrying a lantern for "the one who went up" long ago. Gentle, strange. Tier 0 and home talk (Wickmere's lanterns);
  she never says how to get there or names the Wickmother. **She is Phase 8's "seen but not open".**
- **Tamp** (`tamp`, forge folk): an old forge hand, once the bellows-boy of "the master" (Ignis, never named by him),
  sorting salvaged gears for the master's best piece, marked with a hammer over a flame, which he's sure went up to
  the city. It didn't (players who've seen Typhon's tooth may guess where it went); he never says what the gears were
  for. Taught Ash to hold tongs; makes strong tea; a little deaf.
- Personas that changed: **Ash** (the balloon is off his shut-ways list; he looked Slag's burner over and said nothing),
  **Slag** (he built the burner, at night, for a season; goes red if it's mentioned).

## HUD, hints and phones
- The voyage pill says "Kite · The Skydocks in 42 s" / "Kite · Emberdeep in …"; aboard, the World map's pin sits on
  the balloon's route (`islandOf` gives `'sky'`); at the camp it's on the Citadel. The camp's pill: "The Skydocks Camp".
- Nothing new to press: E at the cradle and the mast, the same Set sail card (its button reads Cast off). Phones get the
  same card and the usual talk button.

## Decisions and history
- 2026-11-04: Phase 6 (b) built (the balloon, the vista at the cradle, the camp and its three people, the music). The
  owner took every default in `story/phase6-plan.md`: four rooms (two decks, the camp, the Skydocks), the camp a safe
  town with the fighting zone past it, the band 135–145, all four new characters AI with memory (the Dockwarden too,
  in (c)), no new folk look, Kestrel's goggles only, no Citadel island map yet.
- The column vista is the cradle's ledge at Magma Heart's east end (no new room): the column was already drawn there;
  the skylift's station is still at the east end until (c).
