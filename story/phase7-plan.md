# Atlas Phase 7: story progress, on paper (for the owner to approve)

**Status: approved by the owner 2026-11-04 with every default (backfill: from now on). (b) and (c) built
2026-11-04 (`docs/social/story.md`); (d) next.** Phase 7 of `world/atlas.md` and "Story delivery" in `roadmap.md`: per-account lore
tiers feeding the AI characters, boss lines for the older dens, the "freed" world changes. Rules: `delivery.md` (the
story never blocks hanging out; no quest log), `canon.md` (the tiers, reviewed by the owner). Marked `[default]` = what
gets built unless the owner says otherwise.

## 1. Your story progress (per account, never reset)
- A new `story` record saved with the character: **every den boss you've ever helped beat** (a set of boss kinds, with
  the date of the first time). Written when a boss dies with you counted in its fight (the same "who fought" the loot
  uses). Never cleared: not by rebirth, a class change or the rollback (unlike `bossAt`, which only remembers the
  reward window).
- **Your lore tier** comes from it `[default]`: Tier 1 once you've beaten any Greenhollow den boss, Tier 2 any Frostpeak
  den boss, Tier 3 any Emberdeep den boss, Tier 4 the Colossus or Chronos. A tier brings every tier under it (the
  story is told in order, and the islands are reached in order anyway). Field bosses don't count.
- **Backfill** `[default: from now on]`: nobody has a record yet. Start everyone at Tier 0 except what `bossAt` still
  remembers (kills in the last reward window). Alternative: grant tiers by level reached (a guess).
- **When a tier opens**, one quiet toast, once: "Something has changed. Elder Mochi might have more to tell you now."
  `[default]` No Esc page, no log (`delivery.md`: no quest log).

## 2. The characters, fed by tier
- The canon text gets sliced by tier into one shared file the server reads (`canon.md` stays the source; a builder
  copies it into code, and a check makes sure they match `[default]`).
- **Each character has a cap**: the deepest tier it could know. The persona gets the canon up to
  `min(the asking player's tier, its cap)`, with a line telling it that's what this slime has earned and may discuss.
  Above that, it deflects in character as today. Caps `[default]`:
  - **Elder Mochi: 4.** The heart of it: he knows everything (he was Pell's apprentice) and tells it only as each slime
    earns it, in his own words, gently. At Tier 4 he can finally say who he is.
  - **Curator Clio: 4**, with her accuracy rules: she states what the evidence shows at the player's tier, no more.
  - Greenhollow's people: 1. Frostpeak's: 2. Emberdeep's: 3 (Ash keeps Tier 3 for "the old smith", as today). The
    Skydocks camp: 3 for Tamp, 0 for Kestrel and Ione; the Dockwarden: 0 ("NOT IN THE LEDGER"). Brine and Arne: 2.
- Since each line of chat is for the slime who asked, a character can tell one slime more than another standing beside
  them (the chat is public). `[default: fine]`: it's how rumours spread, and the deeper lines are earned.
- **Order** `[default]`: Mochi and Clio first (b), every other character in (c).

## 3. Boss lines for the older dens `[default: write all six]`
The six den bosses with no `lines` get them (entering, each phase, when freed; the region's register, `delivery.md`):
Sprout King, Mother Mushroom, Bramble Behemoth (Greenhollow: storybook, a pun allowed), the Astral Wyrm (Frostpeak:
sparse), the Clockwork Colossus and Chronos (the Citadel: solemn, strange). Chronos's are the closest the game comes to
saying Tier 4 out loud; they hint and never name Pell.

## 4. The "freed" world changes `[default: per player]`
Once **you** have beaten a boss, its place shows the change for you (from your own `story` record, drawing only; other
slimes see their own world). The four from the roadmap:
- the Tidemother: Saltspray Coves' tide pools run clear;
- the Knotmole: the Mycelium Deep's threads glow again;
- the Old Narwhal: floes back in the Whale Skerries' water;
- the Root Warden: Keeper's Spine's roots pull back off the stones.
Later, if wanted: Ladon, Fenrir (the cutters finish the Long Stair), Typhon (the Foundry's pits go cold). The one
world-wide flag stays for the finale (`delivery.md`).

## 5. Not in this phase
- Rewriting flavor text in each region's register (items, mobs, zone names): a phase of its own `[default]`.
- The Slime Ages wing, the Last Echo: Later on the roadmap.

## Build order `[default]`
- **(b)** the `story` record, tiers, the tier toast, the canon slices, Mochi and Clio fed by tier.
- **(c)** every other character's cap; the six bosses' lines.
- **(d)** the four freed world changes.
