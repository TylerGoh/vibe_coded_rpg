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
   - [ ] SP3–SP5: the Mage's, Cleric's and Archer's new skills, one at a time (owner: tokens). **Start here: SP3.**
   - [ ] SP6: the balance pass, then the owner plays
2. **FB1: Greenhollow's final boss**, under the Thornheart (the Sunken Road, the Road's End). Plan:
   `final-bosses.md`: very hard, about 30 minutes for four players at the recommended level (the boss's own
   level shown far higher); each pocket gets better, then a new deep room, a cinematic approach room, the
   den. Moves in a designed order, written up for the owner first.
3. **S5.4 for Emberdeep**: the last of the retrofit (`s5-plan.md`; design: `progression.md` section 6).
   S5.1–S5.3, S5.5 and S5.4's Greenhollow and Frostpeak parts are done.
4. **FB2: Frostpeak's final boss**, below the Blue Halls (the Old Ice, the Long Stair).
5. **Emberdeep's depth pass, E1–E4** (Lv 90–150; plan, map and settled decisions:
   `world/emberdeep-depth.md`, method: `world/island-depth.md`, how to ship a branch:
   `docs/places/branches.md`). E0 shipped.
   - [ ] E1: the Ashwood (115–130) and the Black Sands (90–100, easy)
   - [ ] E2: the Smoking Coast and the Drained Tubes (hard), the Hatchkeeper, Liv
   - [ ] E3: the Brimstone Fields and the Old Foundry (hard)
   - [ ] E4: the Caldera Rim and Brenna, Emberdeep's party den; Ignis's and Pyra's lines
6. **E5: Emberdeep's final boss** (`final-bosses.md`), the pass's last phase.

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
