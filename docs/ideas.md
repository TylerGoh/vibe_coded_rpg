# Not done yet, and what's untested

## Asked about or planned
- Houses: selling furniture back, colour options per piece, visiting a friend's house without an
  invite (e.g. an "open house" switch), a doorbell, a second storey, seasons / weather in the garden.
- Economy: more late-game gold sinks; boss gear selling for less (see `docs/economy.md`).
- Parties; trading between players; level gates on the harder doors if people complain.
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
- Then G3 (the Old Oak Canopy, the Hornet Queen, Ranger Acorn) per `story/world/island-depth.md`.
