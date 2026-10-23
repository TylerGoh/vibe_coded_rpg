# Roadmap: game changes the story asks for

**Future sessions start here.** Pick an item, read the story files it names and the `docs/` it touches,
build it, then tick it here and update `inventory.md`. The build order for places, and the slots for
new mobs, bosses, towns and characters, are in `world/atlas.md`. Every change still follows `Agent.md`
(mobile, docs, economy, dev copy for big features).

**Between phases** (owner): what isn't built yet is shown but blocked by an in-world reason, never a
"coming soon" sign or a stand-in door. **Characters** (owner): a purpose AND chattable with memory, narrow
lore, rich personal lives (`characters/people.md`).

## Trading coins and items (owner, 2026-10-23; shipped 2026-10-23, `docs/social/trading.md`)
Left over: starting a trade by tapping a slime on the canvas; cosmetics stay untradeable until the owner decides.
Players can give or swap coins and items with
each other. It also makes the S track's 500k Rebirth reachable as a gift between friends.
- [x] A trade between two slimes standing near each other, outside combat rooms: one asks (from the
      Players panel or by tapping a slime), the other accepts. A trade window with both sides' offers
      (items from the bag, and coins).
- [x] **The server decides everything** and swaps both sides at once: it rechecks both bags and purses at
      the moment of the swap, so nothing is duplicated or lost if someone disconnects or moves an item.
- [x] Anti-scam: any change to an offer un-ticks both "Ready" boxes; both must confirm again. The window
      shows every item's full card (scroll enhancements, Legacy tags) so nobody is fooled by a name.
- [x] Items keep their enhancement (`e`) when traded. Worn gear must be taken off first. Brewed potions,
      herbs and scrolls trade like anything else. Not tradeable: houses, furniture placed in a house,
      pets (they live in a house), cosmetics already bought (decide with the owner).
- [x] A trade log on the server (who, what, when), so a lost item can be traced, and a check against the
      bot/accuse rules (`docs/social/accuse.md`: trading must not become a way around the EXP skim or
      to launder a bot's gold).
- [x] Mobile: the window works on a phone (`docs/ui/mobile.md`). Docs: a new `docs/social/trading.md`
      and an index row. Economy: trading moves gold rather than making it, but say in `docs/economy.md`
      that boss farmers can now fund friends (sinks priced for one player's income meet pooled gold).

## 0. Island depth (owner, 2026-10-20: the current priority)
Deep islands before new ones. Greenhollow covers Lv 1-60 and Frostpeak 40-100, with branching maps, hard
and easy pockets, field bosses, no quests (owner, explicit), and the levelling speed unchanged. Today's mobs and gear are
legacy units (kept, reusable; raised to their island's new band once Greenhollow covers 1-60). New islands (atlas Phase 5 on) wait until Greenhollow, then Frostpeak,
are fleshed out. **The plan and its phases: `world/island-depth.md`.**
- [x] G0: systems (field bosses and elites, door level labels, the island map), proved with Turnipop in
      Sprout Meadow and Elder Bramblehogs in Bramble Woods; every branch's entrance laid and blocked
      (`docs/places/branches.md`); the frozen curves in `npm run economy`
- [x] G1 (mostly, 2026-10-20): Willowmere and Saltspray Coves, Old Snapjaw, the Tidemother (with lines),
      Miller Bun and Beachcomber Moss, gear tiers, waystones. Left over: `docs/ideas.md` ("G1 left for later")
- [x] G2 (2026-10-21): the Mycelium Deep and Glowroot Hollow (Lv 15–50), the Knotmole (with lines), Forager
      Truffle, the Listening Stone, Glowroot's elites, a waystone. Left over: `docs/ideas.md` ("G2 left for later")
- [x] G3 (2026-10-22): the Old Oak Canopy (Lv 25–40), the Hornet Queen (field boss), Ranger Acorn, the Lifted
      Stone, the Crow's Nest, a waystone; Keeper's Spine shown over the leaves, blocked by a fallen trunk.
      Left over: `docs/ideas.md` ("G3 left for later")
- [x] G4 (2026-10-22): the hard pockets, Wreck Cave (Lv 30–40, the Drowned Bosun, the Brave Pippin's log)
      and the Thornheart (Lv 50–60, the Thorn Hart, the Hedge Stone), with elites in both. Left over:
      `docs/ideas.md` ("G4 left for later")
- [x] G5 (2026-10-23): Keeper's Spine (45–60), the last of Greenhollow's branches, through the cut trunk:
      the Road Stone, the Watch Seat, a waystone, moss turtles, crag kites, stone sentinels, gale sprites,
      rootlings, and the Root Warden, the capstone (with lines, built for S5's party mechanics). Greenhollow
      is done. Left over: `docs/ideas.md` ("G5 left for later")
- [x] R (2026-10-23): the rebalance: Frostpeak 40–60, Emberdeep 90–115, the Citadel 140–170; owned gear
      kept as Legacy, scaled copies (`<id>_n`) dropped and sold instead (`docs/combat/items.md`,
      `docs/combat/stages.md`). Left over: `docs/ideas.md` ("R left for later")
- [x] Frostpeak's depth pass (40-100): its map and phases are in `world/island-depth.md`
  - [x] F0 (2026-10-23): Frostpeak's island map (`FROSTPEAK`), every unshipped branch's gate, waystones kept
        to their own island
  - [x] F1 (2026-10-23): the Rimeglass Glacier (Lv 60–75), Old Rimehorn (field boss), Ice-Cutter Eyvind, the
        Rime Stone, Ylva's Cairn, waystones in the hamlet and the glacier (`docs/places/glacier.md`). Left
        over: `docs/ideas.md` ("F1 left for later")
  - [x] F2 (2026-10-23): the Whale Skerries (Lv 55–70) and the Narwhal Grotto (70–80, hard), the Old Narwhal
        (den, Lv 70, with lines), Hakon the Bone-Carver, Grandmother, the Sounding Stone, a waystone
        (`docs/places/skerries.md`, `docs/places/grotto.md`). Left over: `docs/ideas.md` ("F2 left for later")
  - [x] F3 (2026-10-23): the Aurora Heights (Lv 75–90) and the Blue Halls (80–90, hard), their field bosses
        the Pale Wyrm (Lv 90) and the Hall Troll (Lv 88), the Serpent Stone, Liv's Reach, the Cutters' Niche, a
        waystone (`docs/places/heights.md`, `docs/places/bluehalls.md`). Left over: `docs/ideas.md` ("F3 left
        for later")
  - [x] F4 (2026-10-23): the Queen's Bridge (85–100) and Sigrun, the Queen's Shield, Frostpeak's capstone (den,
        Lv 100, with lines, built for S5's party mechanics); the Strait Stone, the Shield's Perch, a waystone
        (`docs/places/queensbridge.md`). Frostpeak is done. Left over: `docs/ideas.md` ("F4 left for later")
- [ ] Emberdeep's depth pass (atlas Phase 5 on): the plan, its map and phases E0–E4 are in
      `world/emberdeep-depth.md` (approved 2026-10-23 with every default)
  - [x] E0 (2026-10-23): the south: the Lodestar sails (two `'steam'` decks, Skipper Arne), Forgehold with
        Black Sand Shore (a town; Ash, Soot and her shop, Slag and his shop; the forge folk; the memorial wall),
        the stage renamed Emberdeep, Emberdeep's island map with every gate, waystones in Forgehold and Magma
        Heart, the Caldera pass gone, the balloon grounded (`docs/places/forgehold.md`). Left over:
        `docs/ideas.md` ("E0 left for later")
  - [ ] E1: the Ashwood and the Black Sands · E2: the Smoking Coast, the Drained Tubes, the Hatchkeeper, Liv ·
        E3: the Brimstone Fields, the Old Foundry · E4: the Caldera Rim and Brenna, then atlas Phase 6

## 0b. Classes and progression: the S track (owner, 2026-10-23)
Mages neglected (no magic weapons), an archer and a cleric, bosses that need a mixed party, a real skill tree instead of a list, and rewards spaced
further apart at high levels. **The plan, its phases and the owner's open decisions: `progression.md`.**
Interleaved with the G track: S0 (close the boss EXP faucet) and S1 (staves) go before the rebalance (R).
- [x] S0 (2026-10-23): over-level EXP falloff, per-player boss reward window (`docs/combat/bosses.md`)
- [x] S1 (2026-10-23): staves (20, twins of the boss and shop swords), the staff bolt, weapon scrolls (`docs/combat/items.md`)
- [ ] L (`progression.md`, owner 2026-10-23): slower levelling (~10 min a level on average, slowing as you
      go; Lv 200 ~35 h), prices set in minutes of farming (pets ~20 min, the high end ~30), and the top characters rolled back to their play time
      (chenyirong to darrell's level, for botting). Before S2, shipped with S2's first deploy
- [ ] S2 (sub-plan: `s2-plan.md`): the four class trees, the Rebirth Pool in Slimeville tended by Elder Mochi (change class, keep level; the
      first rebirth free, owner 2026-10-23), forks, advancements, the node UI, mage combos, warrior chase moves
- [ ] S3: the Cleric (the Mage's staff, heals, Cleanse, Revive, summons)
- [ ] S4: the Archer (bows, Ranger Acorn)
- [ ] S5: bosses that need a party (Taunt, pulses, curses, barriers, weak points), loot by class
- [ ] S6: past the cap (stat taper, mastery stars)

## 1. Geography (the owner's top complaint: the islands are too close)
- [ ] **Remove the back-door chain.** The Wildwood → Highlands trail (gone, Phase 3), the Highlands → Caldera pass (gone, Phase 5) and the
      Caldera → Citadel skylift go. Each island is reached by its crossing. (`world/geography.md`)
- [x] **Greenhollow Harbour**, a new room west of the village: piers, an unlit lighthouse, Captain Brine,
      the ferry. (`world/regions/greenhollow.md`)
- [x] **Crossing rooms:** a ship deck over a scrolling sea, for roughly a minute, then you arrive. One room
      type, themed per route (cold sea, Steam Straits, cloud climb). Movement on deck is normal `step()`
      physics; the scroll is drawing only. (The cold sea ferry shipped: `docs/places/crossings.md`.)
- [ ] **A landing town at the start of each island** (Icefang Fjord: done, Phase 4; Black Sand Shore and Forgehold: done, Phase 5; the Skydocks camp): a calm stretch with a town and harbour, before the mobs. Owner's
      rule: every landing is a town with respawn and a door home (`world/atlas.md`).
- [x] **The Wildwood ends at sea cliffs** with the view across the water (room 20, the telescope; the
      Highlands trail beside it went in Phase 3).
- [x] **Distant islands in every outdoor sky,** in compass direction (`world/geography.md`, `src/distant.js`).
- [x] Gating: the Steam Straits voyage needs the Astral Wyrm beaten? **No** (owner, 2026-10-23): the update
      lifted the block, Arne's line credits the stars, the gangway says "Lv 90+". No hard gates, on purpose.

## 2. Story delivery
- [ ] **Per-account story progress:** bosses beaten at least once, saved with the character. Gives the
      lore tier.
- [ ] **Mochi and Clio fed canon by tier** (`canon.md`, `delivery.md`).
- [ ] **Boss lines:** on entering, at each phase, and when freed (`characters/bosses.md`).
- [ ] **Rewrite flavor text** in the region's register: items, mobs, zone names, door labels.
- [x] **Keeper ruins** in Bramble Woods, with readable plaques (four stones, Tier 1 text, `src/ruins.js`).

## 3. New places and people
- [ ] Regional AI characters: Captain Brine (done), Old Skaldi, Runa and Tove (done), the branches' Bun, Moss,
      Truffle and Acorn (done), Forgewarden Ash (done, Phase 5, with Auntie Soot, Slag and Skipper Arne), the Last Echo.
- [ ] Settlements: the fjord hamlet (done), Forgehold (done), the Skydocks camp.
- [ ] The Slime Ages wing in the museum.
- [ ] Each island's people drawn as their own slime type (`characters/people.md`): the fjord folk done (`Slime.setFolk`); the forge folk done (Phase 5); the Skydocks' next.

## 4. Endgame and beyond
- [ ] The Wheel restart: a server-wide event, then the world flag and the changed skies.
- [ ] Pell as a post-game character by the apple tree.
- [ ] Uncharted islands as new stages (`world/regions/uncharted.md`, `expansion.md`).

## Renames under consideration
Today's stage names fit the story with small changes. Propose these to the owner before renaming:
- Done (owner, Phase 4): "Frostpeak Highlands" → **Frostpeak** (the island), the Highlands its interior.
- Done (owner, Phase 5): "Emberdeep Caldera" → **Emberdeep** (the island), with the Caldera as its heart.
- The skylift → a **balloon** riding the thermal column.
