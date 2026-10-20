# Roadmap: game changes the story asks for

**Future sessions start here.** Pick an item, read the story files it names and the `docs/` it touches,
build it, then tick it here and update `inventory.md`. The build order for places, and the slots for
new mobs, bosses, towns and characters, are in `world/atlas.md`. Every change still follows `Agent.md`
(mobile, docs, economy, dev copy for big features).

**Between phases** (owner): what isn't built yet is shown but blocked by an in-world reason, never a
"coming soon" sign or a stand-in door. **Characters** (owner): a purpose AND chattable with memory, narrow
lore, rich personal lives (`characters/people.md`).

## 0. Island depth (owner, 2026-10-20: the current priority)
Deep islands before new ones. Greenhollow covers Lv 1-60 and Frostpeak 40-100, with branching maps, hard
and easy pockets, field bosses, no quests (owner, explicit), and the levelling speed unchanged. Today's mobs and gear are
legacy units (kept, reusable). New islands (atlas Phase 5 on) wait until Greenhollow, then Frostpeak,
are fleshed out. **The plan and its phases: `world/island-depth.md`.**
- [ ] G0: systems (field bosses and elites, door level labels, the island map)
- [ ] G1-G5: Greenhollow's branches, bottom of the band up
- [ ] Frostpeak's depth pass (40-100)

## 1. Geography (the owner's top complaint: the islands are too close)
- [ ] **Remove the back-door chain.** The Wildwood → Highlands trail (gone, Phase 3), the Highlands → Caldera pass and the
      Caldera → Citadel skylift go. Each island is reached by its crossing. (`world/geography.md`)
- [x] **Greenhollow Harbour**, a new room west of the village: piers, an unlit lighthouse, Captain Brine,
      the ferry. (`world/regions/greenhollow.md`)
- [x] **Crossing rooms:** a ship deck over a scrolling sea, for roughly a minute, then you arrive. One room
      type, themed per route (cold sea, Steam Straits, cloud climb). Movement on deck is normal `step()`
      physics; the scroll is drawing only. (The cold sea ferry shipped: `docs/places/crossings.md`.)
- [ ] **A landing town at the start of each island** (Icefang Fjord: done, Phase 4; Black Sand Shore and
      Forgehold; the Skydocks camp): a calm stretch with a town and harbour, before the mobs. Owner's
      rule: every landing is a town with respawn and a door home (`world/atlas.md`).
- [x] **The Wildwood ends at sea cliffs** with the view across the water (room 20, the telescope; the
      Highlands trail beside it went in Phase 3).
- [x] **Distant islands in every outdoor sky,** in compass direction (`world/geography.md`, `src/distant.js`).
- [ ] Gating: the Steam Straits voyage needs the Astral Wyrm beaten (stars restored). Ask the owner
      before adding any hard gate. The game has none today, on purpose (`docs/world.md`).

## 2. Story delivery
- [ ] **Per-account story progress:** bosses beaten at least once, saved with the character. Gives the
      lore tier.
- [ ] **Mochi and Clio fed canon by tier** (`canon.md`, `delivery.md`).
- [ ] **Boss lines:** on entering, at each phase, and when freed (`characters/bosses.md`).
- [ ] **Rewrite flavor text** in the region's register: items, mobs, zone names, door labels.
- [x] **Keeper ruins** in Bramble Woods, with readable plaques (four stones, Tier 1 text, `src/ruins.js`).

## 3. New places and people
- [ ] Regional AI characters: Captain Brine (done), Old Skaldi, Runa and Tove (done), Forgewarden Ash, the
      Last Echo.
- [ ] Settlements: the fjord hamlet (done), Forgehold, the Skydocks camp.
- [ ] The Slime Ages wing in the museum.
- [ ] Each island's people drawn as their own slime type (`characters/people.md`): the fjord folk done
      (`Slime.setFolk`); forge-slimes next.

## 4. Endgame and beyond
- [ ] The Wheel restart: a server-wide event, then the world flag and the changed skies.
- [ ] Pell as a post-game character by the apple tree.
- [ ] Uncharted islands as new stages (`world/regions/uncharted.md`, `expansion.md`).

## Renames under consideration
Today's stage names fit the story with small changes. Propose these to the owner before renaming:
- Done (owner, Phase 4): "Frostpeak Highlands" → **Frostpeak** (the island), the Highlands its interior.
- "Emberdeep Caldera" → **Emberdeep** (the island), with the Caldera as its heart.
- The skylift → a **balloon** riding the thermal column.
