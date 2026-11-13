# Not done yet, and what's untested

The roadmap (`story/roadmap.md`) holds planned work. This file holds the rest: things asked for but not
planned, what each shipped phase left behind, and what only bots have tried. When a phase ships, add its
"left for later" section here (newest at the bottom of its track) and one line to `story/done.md`.

## Asked about, not planned
- Houses: selling furniture back, colour options per piece, visiting a friend's house without an
  invite (e.g. an "open house" switch), a doorbell, a second storey, seasons / weather in the garden.
- Economy: more late-game gold sinks; boss gear selling for less (see `docs/economy.md`).
- Parties (S5's party bosses don't need a party system: they count slimes in the room); level gates on
  the harder doors only if people complain (owner: no hard gates).
- Fill wide phone screens (no side bars): let the camera show a wider slice; needs a variable view width.
- Real-device checks on an iPhone (home-screen mode) and of typing with the phone keyboard open.
- A bigger bag or a herb pouch, if bags (`BAG_SLOTS`) fill up with herbs and brews.

## Untested with real players
Almost everything since 2026-10-20 was checked by bots on a test server (with TEST_GOD and weakened
bosses) and by screenshots, never by people at the content's own level. Most worth watching:
- All balance: mob and boss HP and damage, drop rates, prices, the EXP curve, skill and ability-point
  numbers (the INT-heavy mage may be too strong), brews next to shop potions (far cheaper per HP).
- Every boss and ultimate, and every branch at its own level. Full kills untested: the Old Narwhal,
  the Pale Wyrm, the Hall Troll, Sigrun.
- The AI characters since Icefang Hamlet (Skaldi, Runa, Tove, Bun, Moss, Truffle, Acorn, Eyvind, Hakon,
  Ash, Soot, Slag, Arne): personas only read, never chatted with (no DeepSeek key on test servers).
- Phones: decorating a house under a thumb, the waystone card, the forge folk and the ember waystone
  look (headless screenshots only).
- Audio has never been listened to (only measured). iPhones' silent switch may mute Web Audio.
- Houses with many guests at once, and whether house prices feel right (the sheet models solo farming).
- Field bosses: whether Turnipop's stomp is fair on new players, and whether 20 minutes between spawns
  feels right.

## Greenhollow (G1–G5) left for later
- **G1:** fishing and riverside herbs in Willowmere (no system exists yet).
- **G1, G2, G5:** the "freed" world changes (the Tidemother's pools running clear, the Knotmole's threads
  glowing west again, the Root Warden's roots letting go): only their lines say so (roadmap, story delivery).
- **G2:** a field boss for the Mycelium Deep (Glowroot Hollow's elites stand in as its danger).
- **G3:** the Hornet Queen only dives; calling wasps out of her nest needs a summon for field bosses.
- **G3:** a vertical camera for the Canopy: its own `step()`/camera project, never started.
- **G4:** a room hazard for hard pockets: the Thornheart's thorn patches shipped with FB1 (b) (server-tick timed,
  `docs/places/thornheart.md`); Wreck Cave's tide surges could reuse the same pattern, not done.
- **G5:** the Root Warden's `party` mechanics wait for S5; the root grid (random in phase 2) was never seen
  in a test fight.

## R (the rebalance) left for later
- Raised dens' coins and materials are worth less, in minutes of farming, than the old 6–20×: raise their
  coins if boss loot feels thin (`docs/economy.md`).

## Frostpeak (F1–F4) left for later
- **F1:** Old Rimehorn's "back in about 20 minutes" line ignores `TEST_FIELD_RESPAWN_MS` (tests only).
- **F2:** the Old Narwhal's freed change (the floes drifting out) waits for per-account story progress.
- **F2:** Hakon's comb for Captain Brine: a little thread for Brine's persona one day.
- **F3:** the Pale Wyrm, as a field boss, has no `lines` and no freed moment; field bosses would need
  `lines` support.
- **F3, F4:** no trader on the Heights or the Bridge: nothing on Frostpeak sells gear aimed past Lv 66.
- **F4:** Sigrun's `party` mechanics wait for S5. The frozen guards and the far shore are scenery only
  (the far island is never named, on purpose).

## Emberdeep (E0) left for later
- Nobody has sat through a real 90-second Lodestar voyage with friends: check it doesn't drag.
- E0's optionals, for E1 or later: the Black Sands' hot-spring herb, the gear teeth in the Cinder Flats'
  ash, the slag golem in Magma Heart.
- Ash's Tier 3 waits for per-account story progress.
- E1's Ashwood is untested in play (no bot tests): Greyback's `log` throws at a party, the Green Tree's jump from
  the great trunk, Pitch's shop on a phone. Players holding the old Queen's Bridge `seal_whisker` now hold the Skerries'
  cheaper one (the id clash fix); nobody has complained.
- E2's Smoking Coast is untested in play (no bot tests): the jump from the tallest stack's shoulder up to Liv's Lookout,
  how many pumice crumbs a busy Pillow Shelf throws at once, the `thinned` look on a dark screen, Liv's shop on a phone.
- E2's Hatchkeeper and Drained Tubes are untested in play: Boiling Sand's tide-wet patches with a party, the jump from
  the ledge up to the Skylight, a lava drip on that ledge (maybe too mean), Hundredfoot's burning trail in a crowd.
  The mini Hatchkeeper and mini Hundredfoot are only their bosses' art shrunk (no pet art of their own, `petWH`).
- E3a's Brimstone Fields are untested in play (no bot tests): the jump from the tall chimney's shoulder up to the Organ,
  the Condor's `dive` from `fly` 90 at a party, two chimney spitters on the High Vents' ledges (maybe too mean), the
  acid puddles' look over yellow crust, Ochre's yoke and hat on a phone. The mini Brimstone Condor is its art shrunk.
- E3b's Old Foundry is untested in play (no bot tests): the jump from the crane's end girder up to the Pattern's loft,
  the slag golems' slaglings in a crowd (and the Great Slag Golem's), the bellows toads' blast next to the soot hounds'
  rush (maybe too mean together on the Casting Floor), Old Crucible's `molten` lobs and `curse` with a party, reading
  the tally board with mobs about, the dark hall on a phone. The mini Old Crucible is its art shrunk. No gate is laid
  yet for Emberdeep's final boss (E5: past the Foundry or the Tubes, `story/final-bosses.md`).
- E4a's Caldera Rim is untested in play (no bot tests): the jump from the spur up to the Bearer's Seat, the crag rocs'
  `dive` with heat shimmers about on the High Rim (maybe too mean together), the pumice bits in a crowd, how big the
  Citadel looks crossing the sky (and whether its few-minute loop reads as circling), the crater and column behind the
  path on a phone. (E4b drew the den's cleft in front of the old hoist frame; whether they read well together is untested.)
- E4b's Brenna is untested in play: whether a party finds the buckle on her back (`weak.back`, the first weak point
  that only opens from behind) without a hint, the tooth-down front wall on a phone, Last Delivery's tooth as a thing
  to jump (its tumbling is drawn to the shared wave's 66 px), the crag roc adds in a den, her freed animation over her
  fading sprite, the tooth on the Seat's left half (drawn only: you can stand "in" it) and the readable name on the
  memorial wall at its small size. On the sheet a lone Archer faints at 16:48 when a pulse, the ultimate and a hit
  land in the same half second (both branches, at any ATK tried); Sigrun's and the Colossus's Archers survive it. If
  players find her unsoloable as an Archer, look there. The mini Brenna is her art shrunk, tooth and all.
- E5 (b) (the Under-Flues, the Long Flue: `docs/places/underflues.md`) is untested in play (no bot tests): the hot
  grates' timing (do players read the glow as a warning before the vent?), Orthrus's charge and its alternating barks,
  the jump to the Damper, the clinker bits, the flue bats' dive at `fly` 60, whether the shape under the Long Flue's
  grating reads in the 90 px strip below the floor (on a phone too), whether the nearly-dark between breaths is too
  dark on dim screens, and the audio (the bellows and hammer don't share the art's breath clock: they drift). The
  furnace door opens since E5 (c)'s `DENS` row (`TYPHON_DOOR_OPEN`).
- Getting home is two sailings: if it annoys people, a direct Forgehold to Greenhollow sailing waits for
  the "routes reconnect" idea in `story/world/geography.md`.

## Atlas Phase 6 (b) and (c) left for later
- Untested by people: the balloon both ways, the camp, the Trade button showing only on the pier; (c)'s Skydocks (the
  mobs, the gusts' timing and damage, the Harbour Lamp's jump from the gantry, the ramp both ways, the Dockwarden's
  arrival count), the column vista and the ramp's top in Cogwork Bastion. Nothing was playtested headless (owner's
  rule); the art was checked by reading the code, not by eye.
- The Skydocks have no rare gear drop and no field boss (the plan's default); a Dockwarden-themed cosmetic could come
  later. The Dockwarden's arrival count is only as good as its chat memory (it can drift once memories fold).
- Soot, Arne, Brine, Ochre and Pitch don't mention the balloon yet (only Ash and Slag do).
- No Citadel island map (the World map's tap goes nowhere on the Citadel). (Lantern Fen's folk look came with atlas
  Phase 8's L0; Ione has it.)
- Kestrel sells no weapon of her own (only the goggles).

## Classes (S1–S4) left for later
- **S1:** staff twins for the swords that only drop from mobs (`docs/combat/items.md` lists them).
- **S2.5:** nobody has chained the Warrior's charge, hit, charge across a room, or said whether the grace
  windows (`SLAM_GRACE`, `UPCUT_GRACE`) feel right on a phone. Hook isn't built (`story/progression.md` 1c).
- **S2.6:** the interrupt is built (S5.2) but dark until a boss lists it. A shatter
  needs an Elementalist and a Frostbinder together; if solo Mages miss it, a branch could get a weak
  spell of the other element. Untested: whether the states read in Frostpeak's pale rooms.
- **S3:** Cleanse is built (S5.2); the Cleansing Tonic and the Barrier Draught (S5.5) too. Untested by people:
  whether `CURE_CD` and `DRAUGHT_S` feel right once real bosses curse and pulse.
  The Clerics' trader (`[proposed]`: Auntie Clover or Elder Mochi). Summons don't climb or dodge.
  Untested: whether a spirit holding a boss feels right, whether the meter crowds a phone in a big party.
- **S4:** weak points are built (S5.2, dark until a boss lists them): every arrow reaches one, the mark holds it open. Net Trap catches only what walks
  in (flyers pass over, bosses are only slowed). A slime who arrives after Hunter's Mark sees the flag but
  not its size. The bow on a slime's back hides behind big helmets. Retreat Shot fires back while its
  window (`CHARGE_WINDOW`) is open. Legacy and mob-only swords have no bow twin, on purpose. Bow sounds
  never heard.
- **S5.1** (built, dark until a boss gets `partyLive`): the focus, the pulse and Rally's taunt were only tried
  by headless players on a test boss, never on a field boss. Untested: `FOCUS_ATK` / `PULSE_HP` against real
  parties, whether the status box crowds a phone with many buffs, whether Rally's taunt pulling ordinary mobs
  annoys Knights who only wanted the buff.
- **S5.2** (built, dark the same way): the curse, barrier, armour, weak point, interrupt and stagger were only tried
  by headless players on the Sprout King. Untested: every number against real parties (`BARRIER_HP`, `ARMOUR_CRACK`
  lets any Warrior's Power Strike crack armour, `WEAK_HP`, `CURSE_DOT`), whether the weak point's default spot
  (`weakOf`) is reachable on tall bosses without Flash Jump, whether the curse's sigil reads in dark dens, and a
  stagger on a field boss mid-lunge (it waits for the lunge to end).

## Atlas Phase 8, L0 (Lantern Fen's landing) left for later
- Untested by people: the Hush both ways, Wickmere, the four characters' chat and the two shops, the Shallows' mobs and
  numbers, the drowned signpost's jump, the World map's Fen. Nothing was playtested headless (owner's rule): a build, the
  sheet, a server boot and a Node draw check of every new drawing function against a fake canvas. Nobody has looked at
  the art by eye.
- The bog slime's "sticky: slows you" (the plan) is a trail of bog muck instead; a real slow needs a field in `step()`.
- The Hush's deck is the shared ship, the ferry's size; an eel-boat of her own size would need her own deck platforms.
- Soot, Arne, Brine, Skaldi and Kestrel don't mention the Hush or the Fen yet (Runa and Ione do).
- L1–L5 are on the roadmap: Firefly Hollow and the Drowned Grove (L1), the Still Mere (L2), the Sunk Barrows and the field
  bosses (L3, done), the Causeway and Grandfather Mire (L4, done), the Wickmother (L5: (a) and (b) done, (c) next).
- **L3 left for later:** the Will-Queen (the Causeway's field boss) comes with L4. The Bog Bloat's boglings aren't on the
  sheet (it can't model `shed`), so its real fight is a little longer than the sheet's 2:56. The Sleeper "rising when you
  near it" is drawn (asleep at full HP) rather than a new brain. No freed moments for field bosses. Nobody has seen the
  Barrows' art by eye.
- **L4 left for later:** nobody has fought Grandfather Mire or the Will-Queen; his party split (armour breakers and the
  throat from the front, no front wall) and his three challenges are on paper only. His gear's effects (The Promise, Sit
  Tight) are untested, including whether the Promise's broken hit makes AoE too costly to bother with. The Toad's Reach
  still shows his eyes in the pool after you've freed him (no per-character freed changes on the Fen). The drifting light
  is a passive mob that is also the sheet's "own level" farm at 170. (L5 (a) decided: the Road comes up from the Peat Barrows
  and the Causeway's moth-silk door stays the Hall's front door, opening for a slime who has freed her: `story/l5-plan.md`.)
  The art was seen once, in static screenshots, not in play.
- **L5 (b) left for later:** nobody has walked the Peat Barrows or the Lamp Road, or seen their art by eye (a Node draw check
  only). Between Lv 180 and 190 the Peat Barrows is the only place to farm (the island-depth checklist wants two a slice: the
  Citadel's pass is the second), and past 190 nothing new until the Citadel's pass. No room hazard in the Peat Barrows.
- **L5 (c) left for later** (`docs/places/wickmother.md`): nobody has fought the Wickmother or seen her, the Hall or her
  rewards by eye (an offline brain tick-through and a fake-canvas draw check only): her poses, the lanterns' heights for
  every class's reach, the moths' flight to the high lanterns, the Hold's HELD pop, the silk walls and phase 4's dark on
  real slimes, the front door for a freed slime, the den on a phone. Her track wasn't rendered or measured offline. Old
  Gullet, Long-Neck and Grandfather Mire aren't in the story record (no Fen tier), so only the Wickmother has freed changes
  on the Fen.

## The Citadel's depth pass, C3 (2026-11-13)
- Unplayed: the Engine Halls (its three mobs, the `cinder` lob and `arc` beam, the turbine blades), the Stormcoil (rings, late
  tells, its pulse with a party), Number Nine's chat and Trade button, the Helm's bulkhead E message and the map's `helm`
  node; the art and the music weren't seen or heard (no headless test; the draw functions ran against a stub canvas). The
  telegraph's tag (HOLD) is 5 px text: check it reads on a phone.
- The turbine blades only hurt; an idea not built: a slime caught by one is flung along the catwalk (needs knockback, so a
  `step()` change and the owner's say).

## The Citadel's depth pass, C2 (2026-11-13)
- Unplayed: the Archive (its four mobs, the `ink` trail), the Indexer (the grid, the paper snare, the swap, Closing Time,
  the weak point and armour with a party, its freeing), Folio's chat and Trade button, the Archive's waystone, the freed
  pages; the art and the two music scenes weren't seen or heard (no headless test, owner's rule; the draw functions were run
  against a stub canvas in Node, which catches thrown errors only). The ledger's one legible name is 5 px text: check it
  reads on a phone.
- The laser grid draws the Colossus's pistons whatever `looks.laser` says: the Indexer's index lines are pistons too. An
  idea not built: a `looks.laser` look of its own (drawers on the roof, ruled ink lines).

## The Citadel's depth pass, C1 (2026-11-13)
- Unplayed: the Orrery (its three mobs, the astrolabe sentry's `astro` beam), Meridian (its rings, Rewind in a den, The Old
  Sky, the barrier and weak point with a party, its freeing), the Last Echo's chat (its lucid moments when Mochi comes up),
  the freed dome; the art and the two music scenes weren't seen or heard (no headless test, owner's rule).
- The dome's dragged stars are drawing only; an idea not built: let a freed slime's dome show a constellation it can name.

## The Citadel's depth pass, C0 (2026-11-13)
- Unplayed: the Keepers' Gardens, the Siege Engine (its feints and rings), the Commissary's chat and Trade button, the five gates' E messages and the Citadel's island map; no phone screenshot taken (no headless test, owner's rule).
- The Siege Engine's armour reuses the Colossus's bronze plates (`looks.shell: 'brass'`) rather than drawing its own shutters coming down.
