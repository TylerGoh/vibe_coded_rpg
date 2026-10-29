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
  dark on dim screens, and the audio (the bellows and hammer don't share the art's breath clock: they drift). The held
  furnace door's banging is art only; it opens with E5 (c)'s `DENS` row (`TYPHON_DOOR_OPEN`).
- Getting home is two sailings: if it annoys people, a direct Forgehold to Greenhollow sailing waits for
  the "routes reconnect" idea in `story/world/geography.md`.

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
