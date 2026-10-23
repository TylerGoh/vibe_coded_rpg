# Not done yet, and what's untested

## Asked about or planned
- Houses: selling furniture back, colour options per piece, visiting a friend's house without an
  invite (e.g. an "open house" switch), a doorbell, a second storey, seasons / weather in the garden.
- Economy: more late-game gold sinks; boss gear selling for less (see `docs/economy.md`).
- Parties; trading between players (next on `story/roadmap.md`); level gates on the harder doors if people complain.
- Fill wide phone screens (no side bars): let the camera show a wider slice; needs a variable view width.
- Real-device checks on an iPhone (home-screen mode) and of typing with the phone keyboard open.

## Untested with real players
- Farming and alchemy: whether brews are too strong next to shop potions (they're far cheaper per HP),
  and whether bags (`BAG_SLOTS`) fill up with herbs and brews: a herb pouch or a bigger bag may be next.
- Houses: decorating on a real phone (tapping to place under a thumb), and many guests at once. Whether
  the house prices feel right to real players (the balance sheet only models solo mob farming).
- All balance: mob and boss HP and damage, drop rates, prices, the EXP curve, skill numbers, and the
  ability-point numbers (the INT-heavy mage buff may be too strong).
- Every boss and ultimate was only fought by bots and checked by screenshots.
- Audio has never been listened to (only measured). iPhones' silent switch may mute Web Audio.
- Island depth G0: Turnipop and the Elder Bramblehogs were fought by a bot only; whether Turnipop's stomp
  is fair on new players who poke it, and whether 20 minutes between field bosses feels right.
- Icefang Hamlet (`docs/places/fjord.md`): the three new characters' personas have only been read, not
  chatted with (no DeepSeek key on test servers); the new Frostpeak mobs' numbers and Runa's prices
  only went through the balance sheet.
- Island depth G1 (Willowmere, Saltspray Coves, the Tidemother, waystones): checked by a bot (rooms render,
  no errors, waystones attune and travel, the Tidemother speaks) but nobody has fought Old Snapjaw or the
  Tidemother, chatted to Bun or Moss, or tried the waystone card on a real phone.
- Island depth G2 (the Mycelium Deep, Glowroot Hollow, the Knotmole): a bot walked every zone, attuned the
  Deep's waystone, opened Truffle's Trade button and bought from her, popped a puffball into pufflings, saw
  spore shots, glowworm beams and threadweaver threads, and beat the Knotmole at 5% HP (all her lines, Root
  Quake, the drops). Nobody has fought her at full HP, tried Glowroot Hollow's elites at their level, or
  chatted to Truffle (no DeepSeek key on test servers). Phone checked by screenshot only.

## G1 left for later (owner, 2026-10-20: "wrap up and add the rest to future plans")
- Fishing and riverside herbs in Willowmere (the plan's easy-pocket extras); no system exists yet.
- A phone screenshot pass over the two new rooms and the `#ways` card (layout only checked on desktop).
- The Tidemother "freed" world change (the pools running clear after a kill): only her line says so.
- More boss `lines`: the older den bosses have none (roadmap §2 "Boss lines").

## G2 left for later
- The Knotmole "freed" world change (the threads glowing all the way west again after a kill): like the
  Tidemother, only her line says so.
- A field boss for the Deep (the plan names none; Glowroot Hollow's elites stand in as its danger).

## G3 left for later
- The Hornet Queen only dives (one field-boss brain). Calling wasps out of her nest would need a summon for
  field bosses, which they don't have (small bosses get a move or two, owner).
- A vertical camera for the Canopy (climbing up, not along): its own `step()`/camera project, never started.

## S1 left for later
- Staff twins for the swords that only drop from mobs (`docs/combat/items.md` lists them).
- The staff bolt and staff numbers were tried by a bot (bolts land, caps hold, drops follow the weapon held);
  nobody has played a staff-wielder for real. The bolt may feel weak or strong next to a sword swing.

## G4 left for later
- The plan's "nasty hazard" for hard pockets: none beyond the mobs' own (water jets, ink, thorn seeds). A
  room hazard (tide surges in Wreck Cave, thorn patches in the Thornheart) would need a stage-hazard system
  outside the mob brains.
- Tested on a test server with a Lv 81 character and TEST_GOD: both ways in and out, every mob spawning,
  both readables, both field bosses' moves (ink, the stamp), the island map, a phone screenshot. Nobody has
  fought the pockets at their own level, so how hard they really are is a guess.

## R (the rebalance) left for later
- Raised dens' coins and materials are worth less, in minutes of farming, than the docs' old 6–20× (gear
  carries more of their worth now): raise their coins if boss loot feels thin (`docs/economy.md`).
- The atlas's island sheets still carry their old bands (a note at the top says how to read them).
- Untested with real players: the raised mobs' and bosses' difficulty at their new levels (bots only).

## E0 (atlas Phase 5: the Lodestar and Forgehold) left for later
- Nobody has sat through a real 90-second Lodestar voyage with friends aboard: the long out-trip was the
  owner's "the long voyage", but check it doesn't drag. The fog stretch hides the landmarks on purpose.
- Liv isn't in the game yet (E2): Soot holds Arne's sack of letters for her; Eyvind's persona still waits.
- The Black Sands' hot-spring herb for the alchemy lab (plan: "if cheap"), the Cinder Flats gear-teeth half
  buried in the ash, and the slag golem in Magma Heart (E0's optionals) weren't done; E1 or later.
- Ignis's and Pyra's `lines` wait for E4. Ash's Tier 3 waits for per-account story progress (Phase 7).
- The ember waystone look and the forge folk are only checked in headless screenshots, not on a real phone.
- Getting home from Emberdeep is two sailings (the default): if it annoys people, a direct Forgehold to
  Greenhollow sailing waits for the "routes reconnect" idea in `story/world/geography.md`.

## F4 (the Queen's Bridge and Sigrun) left for later
- Emberdeep is next (atlas Phase 5): `story/world/emberdeep-depth.md` holds the plan and the owner's open
  decisions (renames, gating the voyage on the Astral Wyrm, the balloon's block, the band top, new characters).
- No trader on the bridge (like the Spine and the Heights): nothing on Frostpeak sells gear aimed past Lv 66.
- Sigrun's `party` mechanics wait for S5; until then she's a big solo-able boss like the Root Warden.
- Lore stones now say what they can at Tier 2; the frozen guards and the far shore are scenery only (the far
  island is never named, on purpose).
- Tested with a Lv 96 test character, TEST_GOD and a weakened Sigrun (doors, every mob, the stone, the waystone,
  the map, her lines, phase 2 and her ultimate, the bag, a phone screenshot). Not tested: a full kill, her grid
  and beam up close, the rime archer's javelin up close. Personas not talked to (no DeepSeek key on the test
  server). Nobody has fought the bridge at its level.

## F3 (the Aurora Heights and the Blue Halls) left for later
- (F4, the Queen's Bridge and Sigrun, shipped: see below.)
- The Pale Wyrm has a story but, as a field boss, no `lines` and no freed moment: if the owner wants it to
  speak (or lift a little higher each time it's beaten), field bosses would need `lines` support.
- No trader on the Heights (the plan named none, like the Spine); Eyvind sells nothing aimed past Lv 66.
- Tested with a Lv 85 test character, TEST_GOD and weakened bosses: both new doors both ways, every mob in
  both rooms spawning (both elites, both field bosses), the Serpent Stone card, attuning the Heights stone
  and travelling to it from the hamlet, the Frostpeak map with the pin on the Heights (label beside it), the
  new gear and icons in the bag, phone screenshots. Not tested: a full kill of either field boss, the Wyrm's
  dive and the troll's thrown block up close, the prism beam and star sparks up close. Personas not talked
  to (no DeepSeek key on the test server). Nobody has fought either room at its level.

## F2 (the Whale Skerries and the Narwhal Grotto) left for later
- F3–F4: F3 shipped (above).
- The Old Narwhal's freed change (the floes drifting out, fat fish in Runa's nets) isn't shown: like the
  other bosses', it waits for per-account story progress (`story/roadmap.md`, Story delivery).
- Hakon's comb for Captain Brine: a natural little thread for Brine's persona one day (she doesn't know him).
- Tested with a Lv 70 test character (TEST_GOD for the den): the slide door both ways, every Skerries and
  Grotto mob spawning (both elites), the den's lines, charge and leap, the Sounding Stone card, attuning the
  Skerries stone and travelling to it from the hamlet, Hakon's dialog and shop, the Frostpeak map with the
  pin on the Skerries, phone screenshots. Not tested: a full kill of the Old Narwhal, her ultimate's look
  (the default icicle lanes), the urchin's spine and the brine slug's slick up close. The personas weren't
  talked to (no DeepSeek key on the test server). Nobody has fought either room at its level.

## F1 (Frostpeak's depth pass: F0 and the Rimeglass Glacier) left for later
- Old Rimehorn's "back in about 20 minutes" line ignores `TEST_FIELD_RESPAWN_MS` (tests only).
- Tested with a Lv 70 test character, TEST_GOD and a weakened Rimehorn: the snout both ways, every glacier
  mob spawning, all four new gates' E messages, the Rime Stone card, attuning both Frostpeak stones and
  travelling between them (Slimeville correctly left off the card), Eyvind's dialog and shop, the Frostpeak
  island map with the pin on the Glacier, Rimehorn's stomp telegraph and a kill (EXP and loot), phone
  screenshots. Nobody has fought the glacier at its level, and the AI personas weren't talked to (no
  DeepSeek key on the test server).

## G5 left for later
- The Root Warden's party mechanics (focus, pulse, barrier, weak point: `party` on its entry) wait for S5;
  today it fights with the shared moves only, so it's a hard solo boss, not yet a party check.
- The Warden "freed" world change (the roots letting go of the gate after a kill): only its line says so,
  like the Tidemother and the Knotmole.
- Tested with a Lv 81 test character, TEST_GOD and a weakened boss: the trunk both ways, every Spine mob
  spawning (sentinel beams seen), the Road Stone card, attuning the waystone, the Watch Seat, the island
  map, the den and a full Warden kill (enter / phase / freed lines, its beam, Hold Fast, summoned rootlings,
  the loot), the Pet Shop, phone screenshots. The root grid didn't come up in the test fight (it's random
  in phase 2), so its look has only been read, not seen. Nobody has fought the Spine at its level.
