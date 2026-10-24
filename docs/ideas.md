# Not done yet, and what's untested

## Asked about or planned
- Houses: selling furniture back, colour options per piece, visiting a friend's house without an
  invite (e.g. an "open house" switch), a doorbell, a second storey, seasons / weather in the garden.
- Economy: more late-game gold sinks; boss gear selling for less (see `docs/economy.md`).
- Parties; trading between players (next on `story/roadmap.md`); level gates on the harder doors if people complain.
- Shop previews (owner, 2026-10-24): an item's stats in the shop before you buy it (`story/roadmap.md`).
- Fill wide phone screens (no side bars): let the camera show a wider slice; needs a variable view width.
- Real-device checks on an iPhone (home-screen mode) and of typing with the phone keyboard open.

## Untested with real players
- The Warrior's chase moves (S2.5, `docs/combat/skills.md`): a bot did every move on desktop and phone
  buttons, with and without 150 ms of fake lag; nobody has chained charge, hit, charge across a room, or
  said whether the grace windows (`SLAM_GRACE`, `UPCUT_GRACE`) feel right on a real phone. Hook (proposed in
  `story/progression.md` 1c) isn't built.
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

## S4 (the Archer) left for later
- **Weak points** (S5, `story/progression.md` 6): Deadeye and Hunter's Mark are built to pay off there (crits on
  a crystal on a boss's back, a nest on a ledge); until then the Sniper's edge is distance (Snipe's
  `FAR_BONUS`) and the mark helping friends.
- **Net Trap catches only what walks in**: slow walkers (moss turtles) take a while to reach a net, flying mobs
  pass over it, and a boss is only slowed. Untested with people: whether a Trapper can kite a boss into nets.
- Hunter's Mark: a slime who walks in after it was cast sees the mark (the flag) but not its size, so its
  rolls assume the lowest boost (the server's cap is right either way).
- The bow on a slime's back hides behind a big helmet (the Shield-Oath horns cover most of it), as swords do.
- Retreat Shot fires back on X / Hit while it's open, even if you meant to shoot ahead: dash first, then shoot
  forward after the window (`CHARGE_WINDOW`). A tap aims where you tap, so phones can always choose.
- The legacy swords with staff twins (`frost_blade` and the other pre-rebalance ones) have no bow twin, on
  purpose (nobody owned a legacy bow). The mob-only swords without staff twins have no bow either.
- Tested on a throwaway server with Lv 100 test Archers: the bow shot, every skill (the mark seen by a second
  player, Retreat Shot from a dash with its hint and word, the net catching a mob, both rains), Evasion missing
  about a fifth of the hits, a Lv 12 Novice choosing Archer at the pool (the strongest bow from its bag
  equipped), the pool card and the K panel on a phone, bow icons in the bag. Nobody has fought a real den boss
  as an Archer at its level, and the bow sounds were never heard (headless).

## S3 (the Cleric) left for later
- **Cleanse** (`story/progression.md` 5): nothing puts a curse on a slime yet, so it waits for S5's curses,
  with the potion backups (a Cleansing Tonic, a Barrier Draught at the alchemy lab).
- **The Clerics' trader** (`[proposed]`: Auntie Clover or Elder Mochi), and boss drops by class (S5).
- Summons only touch combat: the spirits don't climb (they float to the mob's height), they don't dodge, and
  a boss's aimed moves go at them but its room-wide ones still hit the slimes (as intended). Untested with
  people: whether a spirit holding a boss feels right, whether the wisp's +1s are noise, and whether the
  meter's three sections crowd a phone in a big party.
- Tested on a throwaway server with Lv 100 test Clerics: every Cleric skill cast, the spirit hunting and
  killing mobs, the wisp following and healing, the totem cutting and being worn down, the Seraph, the
  Barrier, a friend fainting, waiting and being Revived, the meter's Healing and Damage taken rows, the pool
  card and the K panel on a phone. Nobody has fought a real den boss as a Cleric at its level.

## S2.6 (the Mage's combos and Arcane Charge) left for later
- **The interrupt** (story/progression.md 3): freezing a boss inside its `ULT_WARN` window should cancel or
  weaken the ultimate. Waits for S5 (party mechanics); the freeze already reaches bosses (`FREEZE_BOSS`).
- A shatter needs an Elementalist and a Frostbinder together (the branches split fire and frost). If solo
  Mages feel they're missing the combo, a branch could get a weak spell of the other element.
- Untested with people: whether the states read in a busy fight (the ice rooms of Frostpeak are pale too),
  and whether burns' small numbers are noise. Arcane Charge's numbers are from the economy sheet only.
