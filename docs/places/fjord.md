# Icefang Fjord and Icefang Hamlet (Frostpeak's landing town)

Atlas Phase 4, "Frostpeak's front" (`story/world/atlas.md`). Story: `story/world/regions/frostpeak.md`,
`story/characters/people.md`.

Files: the room in `src/shared/sim.js` (`FJORD` in `ROOMS`, its doors, the `TOWNS` entry), its layout
constants in `src/shared/rpg.js` (`FJORD`, `FJORD_W`, `FJORD_DOCK_X`, `FJORD_LODESTAR_X`, `FJORD_HOME_X`, `FJORD_SPAWN_X`,
`FJORD_FIRE_X`, `FJORD_EXIT_X`, `RUNA_X`, `FJORD_PLATFORMS`, Runa's stock in `SHOPS`), the drawing in
`src/fjord.js` (`drawFjord`, plus `drawFjordPath` for the path down at the ridge's west end, and the Lodestar,
`drawLodestar` and `drawLodestarGangway`, shared with Forgehold), the fjord folk's
look, dress, the later Frostpeak mobs and Runa's gear in `src/fjord-art.js`, the three personas in
`server/characters.js`, the `fjord` music scene in `src/audio.js`, the hamlet on the World map
(`src/worldmap.js`).

## What it is
- **Room 23, a town and a safe room** (no mobs, like every harbour and hometown: atlas). West to east: the
  stone quay where the Puddle Jumper ties up (her gangway, `FJORD_DOCK_X`, boards `FERRY_S` after the usual
  "Set sail?" card), the **Lodestar** with her gangway (`FJORD_LODESTAR_X`, boards `STEAM_N` south to
  Emberdeep, `docs/places/crossings.md`) and Arne's notice, **Runa's net shed**, the turf hut whose door
  is **everyone's own front door** (`FJORD_HOME_X`), the **lamp-fire** where Old Skaldi stands and where you
  wake up, Tove with her bucket, the smokehouse, and the **path up to Frostpine Ridge** (`FJORD_EXIT_X`,
  into the stage's west end at `HIGHLANDS_EXIT_X`).
- **Frostpeak's depth pass** (F0–F2): a waystone by the lamp-fire, next to where you wake up (Frostpeak's
  stones only reach Frostpeak's, `docs/places/waystones.md`), and at the quay's west end the shore path to
  the Whale Skerries, its snow slide dug through since F2 (a door, `SKERRIES_GATE_X`; `docs/places/skerries.md`).
  The three personas know the Rimeglass Glacier and Eyvind the ice-cutter (`docs/places/glacier.md`), and
  the Skerries, Hakon and the Old Narwhal; Skaldi knows Ylva's Cairn.
- Climbable: crates on the quay, the home hut's roof, the smokehouse roof, a rock by the path
  (`FJORD_PLATFORMS`; the drawings read them).
- The sky: a pale dusk with the aurora, snow, the other islands far down the fjord (`drawDistantIslands`),
  the fjord's rock walls, floes on black water, and the **Queen's ice bridge** arching across the south,
  cracked through the middle, a shard falling off now and then.

## A town (owner's rule: every island's landing has one)
- It's in `TOWNS` (`src/shared/sim.js`): being here makes it **your town** (`state.town`), so you wake up
  by the fire after fainting, start here when your spot wasn't kept, and your house's front door lets you
  out here. Its hut is a `HOME` door like Slimeville's mushroom house. Inviting works from here too.
  How towns work: `docs/world.md`.

## The phase's history (show, don't open)
- In Phase 3 the fjord was frozen and the ferry tied up at a rough jetty at the ridge's west end, with
  the hamlet visible up the fjord. The Phase 4 update thawed it, no quest (owner's rule): the ferry now
  lands here, the ridge jetty became a path down to the hamlet, and Brine's persona says the ice went out.
- **The next phase showed but didn't open:** from Phase 4 the Lodestar lay laid up at the end of the quay,
  frosted, a tarp on her wheel, no door on her: her skipper Arne wouldn't take her out because the stars were
  wrong ("No sailings. No stars to steer by.", canon Tier 2: the Astral Wyrm fell and ships can't steer).
  The Phase 5 update lifted it, no quest (owner's rule): the frost and the tarp are gone, her gangway is a door,
  and the notice says "Sailing again. Stars enough to steer by." The Caldera pass from the summit went then
  (`docs/places/forgehold.md`).

## The people (AI characters, `docs/social/ai-characters.md`)
- **Old Skaldi** (`skaldi`): the lamplighter, by the fire. Speaks in short, sad lines. Knows Tier 0 and the
  fjord folk's old songs, which carry canon Tier 2 as fragments he sings and won't explain (the atlas puts
  Tier 2 with him; it's the tier you learn in Frostpeak). Personal life: his late wife Ylva, his
  granddaughter Tove, carving driftwood birds.
- **Netmender Runa** (`runa`): the hamlet's trader (`shop: 'runa'` on her `NPCS` entry). Her dialog has a
  **Trade** button that opens her shop (`SHOPS.runa`): jellies, elixirs, Frostbloom, and her own
  **Seal-Fur Hood** and **Whalebone Harpoon** (priced by the balance sheet's `aim`, `docs/economy.md`; since
  the rebalance the Lv 40s copies, `docs/combat/items.md` "Legacy items").
  Tier 0 plus gossip; her cousin Arne owns the Lodestar.
- **Tove** (`tove`): Skaldi's granddaughter, a child who feeds the yeti cubs. Her purpose is being the
  guide to the creatures up the path (which ones chase, which are harmless, the dens: "Grandpa says
  don't"). Tier 0 only. Keep her persona's mob list in step with Frostpeak's mobs.
- **Their look** (the fjord folk, `story/characters/people.md`): `folk: 'fjord'` on their `NPCS` entries
  makes `Slime.setFolk` paint them pale and frosted (a rime crust and glints, `drawFolk`) with a slow,
  half-solid wobble and no Greenhollow leaf; Tove is `lively` and still bounces. Their clothes are the
  accessories `lamplighter`, `netmender`, `mittens` (`drawFolkDress`).

## Decisions and history
- 2026-10-20: built (atlas Phase 4). The owner chose: rename "Frostpeak Highlands" to **Frostpeak** (the
  island; the Highlands are its interior), keep the fjord **safe with no mobs** (the new mobs went on the
  ridge and summit instead), and make every landing a proper town with a home door and respawn.
- The fjord's slippery-ice movement idea (atlas) is not built: it would be a `step()` change.
