# Delivery: how the story reaches players

Slimeville is a hangout first. The story must **never block hanging out**: no forced cutscenes, no
locked village, no quest you have to read. It sits in the world, waiting for whoever's curious, and
it gets stronger the further people go.

## The tone gradient (a rule for every line of text)
| region | register | humour | example of an item description |
|---|---|---|---|
| Greenhollow | storybook, warm | puns welcome | "Squishy, sweet, and only slightly sticky." |
| Frostpeak | quiet, sparse | rare, dry | "Cold to hold. The fjord folk carry these for luck." |
| Emberdeep | blunt, heavy | almost none | "Forged for a wheel that never got it." |
| the Citadel | solemn, strange | none | "It still keeps time. Whose, is unclear." |
Item, mob, zone and boss text should be rewritten to match its region (`roadmap.md`).

## Surfaces, from cheapest to richest
1. **AI characters fed canon by tier.** Each persona gets the canon tiers the *asking player* has
   earned. The server already knows who's asking; it also needs a per-account story progress record
   (bosses beaten at least once). This is the single cheapest, strongest lever, because Mochi then
   reveals the story at the right pace, in his own words.
2. **Flavor text:** item descriptions, zone names, door labels, the den entrance banners, boss ultimate
   banners (`drawUltBanner`).
3. **Boss lines:** a short line on entering the den, at each phase change, and when freed. Drawn as a
   speech bubble, no dialog box. Written in the region's register.
4. **Places:** Keeper ruins, the cracked ice bridge, the gear-teeth in the ash, the jammed Wheel. Story
   told by scenery, with an E-to-read plaque on some (the museum's fact-sheet UI can be reused).
5. **The Slime Ages wing** in the museum: lore exhibits that unlock as players return with proof.
   Clio explains them with her accuracy rules applied to canon.
6. **Crossings:** the ferry, ship and balloon rooms. Ambient lines from the captain, songs, the view.
7. **The finale event**, once, for everyone.

## Progress model
- Per account: which bosses have been beaten at least once gives the **lore tier** (Tier 1 after any
  Wildwood boss, Tier 2 after Bramble Behemoth, and so on, matching `canon.md`). No quest log needed.
- World-wide: story events that happened to the world (e.g. the Wheel restarted) are one flag, shared
  by everyone, and shown in the skies.
- A player who skips everything still has a lovely village. A curious player finds a whole world.
