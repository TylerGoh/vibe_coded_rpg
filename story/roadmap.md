# Roadmap: what to build next

**Future sessions start here.** Pick an item, read the plan and docs it names, build it, then move it to
`done.md` (one line) and update `inventory.md`. Leftovers go in `docs/ideas.md` under the phase's name.
Every change follows `Agent.md` (mobile, docs, economy, a dev copy for big features). The build order for
places, and the slots for new mobs, bosses, towns and characters, are in `world/atlas.md`.

**Owner's rules:** what the next phase delivers is shown but blocked by an in-world reason, never a "coming
soon" sign or a stand-in door, and the update itself lifts the block. Every landing is a town. Characters
have a purpose AND are chattable with memory, narrow lore, rich personal lives (`characters/people.md`).
No quests, no hard level gates.

## Now, in this order (owner, 2026-10-24)
1. **SP: the skill pool** (plan: `skills-plan.md`): more skills for every class, mobbing, long buffs,
   passives that change play, staples at every advancement, casting from the K panel.
   - [x] SP1: under the hood (long buffs, fields, damage over time, on-kill hooks, pull, new summons), the
         K panel's Cast button (live 2026-10-24, acae22d; the machinery dark behind `TEST_SKILLS`)
   - [x] SP2: the Warrior's new skills (live 2026-10-25)
   - [x] SP3: the Mage's new skills (live 2026-10-25)
   - [x] SP4: the Cleric's new skills (2026-10-25)
   - [x] SP5: the Archer's new skills (2026-10-25), with **holding the attack button down to keep firing**
         (owner: attack speed is one of the Archer's core features; desktop and touch, every weapon)
   - [x] SP6: the balance pass (2026-10-25; details `docs/economy.md` "The balance pass", `docs/combat/bosses.md`
         "Top bosses"). Next: **the owner plays**. Owner's decisions (2026-10-25), settled and built:
         1. Every boss hit does a % of the target's max HP on top of its flat hit less DEF (`bossHitPct`:
            `BOSS_HIT_PCT`, `TOP_HIT_PCT`), so being over-levelled never makes a boss harmless; ultimates stay KOs.
         2. An ordinary den soloed at its level ~15 min on the sheet (`DEN_SOLO_MIN`); field bosses ~4 (`FIELD_SOLO_MIN`).
         3. Top bosses (`top`): the party dens (Root Warden, Sigrun, Emberdeep's to come), the final bosses (FB1, FB2,
            E5), and the Clockwork Colossus and Chronos as the end-game capstones: ~45 min for a party of four at their
            level (`TOP_PARTY_MIN`), hard-hitting; solo possible but 2–3× longer (`TOP_SOLO`, `PARTY_DEN_HP_FLOOR` 2).
         4. Weak answers cost more on top bosses (`TOP_PULSE_HP`, the `TOP_BARRIER_*`, `TOP_ULT_HP`): right mix ~45 min,
            a lopsided party 70–90 on lots of potions (`TOP_LOPSIDED_MIN`, `LOPSIDED_POTS`). Ordinary dens keep S5's.
         5. A boss twice your level kills you in about 6 hits or fewer (`KILL_HITS`, HITS TO KO on the sheet).
         6. No level-gap damage penalty, no gear level requirements (owner declined): the % hits are the answer.
         7. Boss respawn timers unchanged; rewards scale with the fight so an hour of bosses pays what it did (BOSS PAY).
         8. Cross-class: the Warrior brought into line (`SWORD_MASTERY_ATK`); `CLASS_FIT`, `BAD_AT` green.
         Left for the owner: the Novices' dens (Sprout King, Mother Mushroom) weren't lengthened; Sigrun's front-only
         shield means a lopsided party there is slower only in potions; Colossus and Chronos have no mechanics yet.
2. [x] **Fewer fight hints** (2026-10-26): every boss-answer prompt and toast gone, ultimate banners without the
   answer line, hazard hints gone; telegraphs and pops kept (`docs/ui/hints.md`). Also: top bosses give full EXP
   at any level gap (`expFalloff`, owner).
3. **FB1: Greenhollow's final boss**, under the Thornheart (the Sunken Road, the Road's End). Plan:
   `final-bosses.md`: very hard, a top boss (SP6: about 45 minutes for four players at the recommended level, `TOP_PARTY_MIN`) (the boss's own
   level shown far higher); each pocket gets better, then a new deep room, a cinematic approach room, the
   den. Moves in a designed order, written up for the owner first.
4. **S5.4 for Emberdeep**: the last of the retrofit (`s5-plan.md`; design: `progression.md` section 6).
   S5.1–S5.3, S5.5 and S5.4's Greenhollow and Frostpeak parts are done.
5. **FB2: Frostpeak's final boss**, below the Blue Halls (the Old Ice, the Long Stair).
6. **Emberdeep's depth pass, E1–E4** (Lv 90–150; plan, map and settled decisions:
   `world/emberdeep-depth.md`, method: `world/island-depth.md`, how to ship a branch:
   `docs/places/branches.md`). E0 shipped.
   - [ ] E1: the Ashwood (115–130) and the Black Sands (90–100, easy)
   - [ ] E2: the Smoking Coast and the Drained Tubes (hard), the Hatchkeeper, Liv
   - [ ] E3: the Brimstone Fields and the Old Foundry (hard)
   - [ ] E4: the Caldera Rim and Brenna, Emberdeep's party den; Ignis's and Pyra's lines
7. **E5: Emberdeep's final boss** (`final-bosses.md`), the pass's last phase.

## Next
- [ ] **Atlas Phase 6: the climb** (after E4; can run alongside E5): the thermal column vista, the balloon crossing (Slag's
      forge-burner lifts the block), the Skydocks zone, the Skydocks camp as the Citadel's town, the
      Dockwarden, the Skydocks' folk look. **The skylift goes** once the balloon works, which ends the
      old back-door chain (`world/geography.md`).
- [ ] **S6: past the cap** (`progression.md` section 8): stat taper, mastery stars, the Lv 150 advancement.
- [ ] **Story delivery (atlas Phase 7)**, can run alongside anything (`delivery.md`, `canon.md`):
  - [ ] per-account story progress: bosses beaten at least once, saved with the character; gives the lore tier
  - [ ] Mochi and Clio (then every character) fed canon by tier
  - [ ] boss `lines` for the older dens, and the "freed" world changes (the Tidemother's clear pools,
        the Knotmole's threads, the Old Narwhal's floes, the Root Warden's roots)
  - [ ] rewrite flavor text in each region's register: items, mobs, zone names, door labels

## Later
- [ ] The Last Echo (AI, Tier 4) in the Chrono Spire.
- [ ] The Slime Ages wing in the museum.
- [ ] Atlas Phase 8: Lantern Fen (the Wickmother). Phase 9: Amberdune (Old Carapace).
- [ ] Atlas Phase 10, the finale and the post-game: the Wheel restart (a server-wide event, the world flag,
      the changed skies), Pell by the apple tree, the Maelstrom rim, swim physics and the Sunken Reach,
      uncharted islands (`world/regions/uncharted.md`, `expansion.md`).

## Small asks
- Trading: start a trade by tapping a slime on the canvas (today: the Players panel).
- Owner to decide: whether bought cosmetics become tradeable.
- Everything else asked for but not planned: `docs/ideas.md`.
