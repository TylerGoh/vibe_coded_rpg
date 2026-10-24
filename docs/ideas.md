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
- **G4:** a room hazard for hard pockets (tide surges in Wreck Cave, thorn patches in the Thornheart)
  would need a stage-hazard system outside the mob brains.
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
- Liv arrives in E2: until then Soot holds Arne's letters for her.
- E0's optionals, for E1 or later: the Black Sands' hot-spring herb, the gear teeth in the Cinder Flats'
  ash, the slag golem in Magma Heart.
- Ash's Tier 3 waits for per-account story progress.
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
