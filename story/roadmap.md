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
         shield means a lopsided party there is slower only in potions (so does the Colossus's, since S5.4).
2. [x] **Fewer fight hints** (2026-10-26): every boss-answer prompt and toast gone, ultimate banners without the
   answer line, hazard hints gone; telegraphs and pops kept (`docs/ui/hints.md`). Also: top bosses give full EXP
   at any level gap (`expFalloff`, owner).
3. [x] **FB1: Greenhollow's final boss** (2026-10-26): Ladon, the Briar Hydra, under the Thornheart (the Sunken Road,
   the Road's End, the Root of the Road). Design `fb1-plan.md`, docs `docs/places/ladon.md`, `sunkenroad.md`. Next:
   **the owner plays** it with friends (untested with people; the 45 minutes only on the sheet).
4. [x] **S5.4 for Emberdeep** (2026-10-27): the last of the retrofit (`s5-plan.md`): Ignis, Pyra, the Clockwork
   Colossus (with a steam pulse added) and Chronos have their party mechanics. Next: **the owner plays** them in a party.
5. [x] **FB2: Frostpeak's final boss**, below the Blue Halls (the Old Ice, the Long Stair). (a) on paper 2026-10-27:
   Fenrir, the Bound Wolf (`fb2-plan.md`), approved. (b) live 2026-10-27: the Blue Halls' fallen
   wall, the Old Ice (50), the Long Stair (51), the door holding (`docs/places/oldice.md`). (c1) live 2026-10-27: the Wolf's Hold (52) and the
   whole fight (`docs/places/fenrir.md`). (c2) live 2026-10-27: its art, its track, the
   four class weapons, the Wolf-Pelt Hood, the mini Fenrir. **FB2 done.** Next: **the owner plays** it with friends.
5b. [x] **The dev sandbox at `/rpg_dev`** (owner, 2026-10-27; right after FB2 (c2), before E1). Why: friends say some
   classes don't *feel* right, and bots can't judge feel, so the owner wants to test by hand with a quick loop.
   Owner's answers: its **own server process** running a dev copy at `/rpg_dev` (nginx change with the owner's sudo;
   RAM is tight, so consider starting it on demand), **open to the owner and friends** (any account), and not the
   full game: **instant character swap** (class, advancement, level, skills, ability points, gear from a panel),
   **training dummies with a DPS readout** (single, a pack, one that hits back; per-skill breakdown, a timer), and
   **bosses on demand** (any boss, any phase). The buff bar and every "feel" element (hit pops, sounds, shakes) as
   in the game. Not wanted: live number sliders.
   **Built 2026-10-27** (`docs/sandbox.md`): its own on-demand server (`rpg-dev.socket`, port 3003, exits when idle)
   running the `~/rpg-dev` worktree (`dev` branch), logins copied read-only from live, the Training Yard (room 53),
   the panel (character swap, dummies incl. one that hits back, DPS readout, bosses at any phase, god mode / full MP /
   no cooldowns). Stopped 2026-10-27 (owner; the socket still starts it on a visit). Next: the owner nginx's `/rpg_dev/` block is in (since the move to OCI); **the owner and friends play** it.
6. **Emberdeep's depth pass, E1–E4** (Lv 90–150; plan, map and settled decisions:
   `world/emberdeep-depth.md`, method: `world/island-depth.md`, how to ship a branch:
   `docs/places/branches.md`). E0 shipped.
   - [x] E1: the Ashwood (115–130) and the Black Sands (90–100, easy) (2026-10-27; rooms 55 and 54,
         `docs/places/ashwood.md`, `blacksands.md`). Next: **the owner plays** them.
   - [x] E2: the Smoking Coast and the Drained Tubes (hard), the Hatchkeeper, Liv (2026-10-28; rooms 56, 57 and 58,
         `docs/places/coast.md`, `tubes.md`). Next: **the owner plays** them.
   - [x] E3: the Brimstone Fields and the Old Foundry (hard), the Brimstone Condor, Old Crucible, Picker Ochre (2026-10-28;
         rooms 59 and 60, `docs/places/brimstone.md`, `foundry.md`). Next: **the owner plays** them.
   - [x] E4: the Caldera Rim and Brenna, Emberdeep's party den; Ignis's and Pyra's lines (2026-10-28; rooms 61 and 62,
         `docs/places/rim.md`). Emberdeep's depth pass is done but its final boss. Next: **the owner plays** them, then
         E5 and atlas Phase 6 (below).
7. [x] **E5: Emberdeep's final boss** (`final-bosses.md`), the pass's last phase. (a) on paper 2026-10-29:
   Typhon, the Buried Fire, under the Old Foundry (`e5-plan.md`), approved with every default
   (the owner may polish it). (b) built 2026-10-29: the Foundry's fallen pit, ledger and hot grates, the Under-Flues
   (63), the Long Flue (64), the furnace door holding (`docs/places/underflues.md`). (c1) built 2026-11-02: the furnace
   door opens on the Hearth (65), the whole fight (the plates, the pressure and vents, the Pour, the coils, the Inhale,
   Eruption and the Last Pour), stand-in art, music and drop (`docs/places/typhon.md`). (c2) built 2026-11-03: Typhon's
   look, its own track, the Last Hammer / Pour Staff / Hearthstone Rod / Bellows Bow, the Furnace Mask and the mini
   Typhon. **E5 done.** Next: **the owner plays** it with friends.

## Next
- [x] **Atlas Phase 6: the climb**: the thermal column vista, the balloon crossing (Slag's forge-burner lifts the
      block), the Skydocks zone, the Skydocks camp as the Citadel's town, the Dockwarden. **The skylift goes** once the
      balloon works, which ends the old back-door chain (`world/geography.md`).
      - [x] (a) on paper 2026-11-04 (`phase6-plan.md`), approved with every default.
      - [x] (b) built 2026-11-04: the balloon flies (the Kite, `'sky'` crossing, rooms 66/67), the cradle in Magma Heart as
            the vista, the Skydocks Camp (room 68, a town: Kestrel and her shop, Ione, Tamp, a waystone), music
            (`docs/places/skydocks.md`). The plank to the Skydocks is lashed up (wind); the skylift stays.
      - [x] (c) built 2026-11-04: the Skydocks (room 69, Lv 135–145: loose bolts, rigging moths, mooring hooks, gusts on
            the planks, the Harbour Lamp), the Dockwarden (AI), the plank laid, the loading ramp into Cogwork Bastion;
            **the skylift is gone** (the column vista stands there). Phase 6 done.
- ~~S6: past the cap~~ dropped (owner, 2026-11-06): "this level cap is not needed, just let it expand forever with new
  places". No stat taper, no mastery stars; the Colossus and Chronos are the capstone only for now (`progression.md` 8).
- [ ] **Tanky to tricky** (owner, 2026-11-06): boss HP cut to 0.6× (done, `docs/economy.md`); the difficulty moves into
  the moves: tighter dodges, more going on, traps you escape with a key combination. Plan `tricky-plan.md` (approved
  2026-11-06, every challenge type, every boss's set, G1 and G2).
  - [x] T0: the engine (shipped dark): challenge table, wire version 8 (trapped, controls swapped), the combo overlay and
        touch arrow pad, first-meeting banners, the sandbox's "challenge now", the sheet's uptime; types A1 and A17.
        Built 2026-11-06 (`docs/combat/challenges.md`); no boss uses them yet. The owner checks the snare and the swap
        by hand in the sandbox (and on a phone) before T1 ships.
  - [x] T1: the top and final bosses (Root Warden, Ladon, Sigrun, Fenrir, Brenna, Colossus, Chronos, Typhon), with the
        types they need and Head Swap, Hunt and Rewind (T1a Greenhollow and Frostpeak, T1b Emberdeep and the end-game
        if it runs long). Next after it: **the owner plays** them in the sandbox and with friends.
    - [x] T1a (2026-11-10, live): the Root Warden (arena, cage, lock), Sigrun (parry, tethers, cage), Ladon (snare, two
          at once, the moving gaps, Head Swap), Fenrir (rhythm lock, blackout, gaps, the Hunt); wire v9 (`pf`); their HP
          cut by their uptime so the fights last what they did. Unplayed; the phone check is still owed.
    - [x] T1b (2026-11-10, live): Brenna (tilting floor, the tooth's chip to throw, cage), the Colossus (laser grid,
          off-beat slams, the gear lock on its armour), Chronos (time reversed, the stopped hour, Rewind), Typhon (the
          iron snare, two at once, lava waves, the mirror trap); wire v10 (`tl`); HP cut by uptime as T1a. Unplayed; the
          phone check is still owed.
  - [x] T2 (2026-11-10, live): the den bosses (Behemoth: roots, the bark mid-leap; Tidemother: tide waves, bubble wall;
        Knotmole: the burrow; Frost Queen: ice beams, the coffin; Astral Wyrm: star rings, gravity flip; Old Narwhal: the
        late tusk, the floe sea; Ignis: magma waves, a rock to throw; Pyra: fire rings, the Rebirth's drifting safe ring;
        Hatchkeeper: buried in sand, hatchlings that grow), the punish window on every boss with challenges. Unplayed.
  - [x] T3 (2026-11-10, live): the field bosses (Hornet Queen: stinger rings, wax cell; Pale Wyrm: feint dives; Hall
        Troll: feint throws, blocks knocked back; Bellower: cinders with one gap; Hundredfoot: the Tubes' ledges crumble;
        Greyback: feint throws; Condor: sulphur rings; Old Crucible: slag to throw back), aimed only at their fighters;
        the Novices' two: a three-arrow snare and the punish window. Unplayed.
  - [ ] T4: tuning after the owner and friends have played.
- [x] **Boss gear worth the fight** (owner, 2026-11-06): stats above the curve by boss kind (`BOSS_GEAR`), and 22 unique
  effects the owner approved (movement, attack changes, costs; `docs/combat/items.md`). Next: **the owner plays** them.
- [x] **The Archer's Trapper becomes the Skirmisher** (owner, 2026-11-06: "this game rewards jumping around dealing
  damage; placing traps neither helps with farming nor bossing"): Backflip Volley, Aerial Archery, Explosive Arrow, Hit
  and Run, Skyfall (`docs/combat/skills.md`). Next: **the owner plays** it.
- [ ] **Story delivery (atlas Phase 7)**, can run alongside anything (`delivery.md`, `canon.md`). Plan
      `phase7-plan.md` (approved 2026-11-04, every default): (b), (c) and (d) built: Phase 7 done but for the flavor-text rewrite (its own phase).
  - [x] per-account story progress: bosses beaten at least once, saved with the character; gives the lore tier
        (`docs/social/story.md`; from now on, owner's choice)
  - [x] Mochi and Clio fed canon by tier (read from `canon.md` itself, `server/lore.js`)
  - [x] every other character fed canon by tier (its island's cap, as hearsay; Phase 7 (c))
  - [x] boss `lines` for the older dens (Phase 7 (c): seven bosses)
  - [x] the "freed" world changes (the Tidemother's clear pools,
        the Knotmole's threads, the Old Narwhal's floes, the Root Warden's roots; Phase 7 (d), per player)
  - [ ] rewrite flavor text in each region's register: items, mobs, zone names, door labels

## Later
- [ ] The Last Echo (AI, Tier 4) in the Chrono Spire.
- [ ] The Slime Ages wing in the museum.
- [ ] **Atlas Phase 8: Lantern Fen** (the Wickmother), the next island (owner, 2026-11-10). (a) on paper 2026-11-10:
      `phase8-plan.md`; approved 2026-11-11 with Lv 150–180 (the owner's change), the rest as written.
  - [x] L0 (2026-11-11, live): the landing: the Hush, the `'fen'` crossing, Wickmere, its four people, the fen folk look,
        the Fen in every sky and on the World map, the Shallows (`docs/places/fen.md`, `docs/places/shallows.md`).
        Unplayed.
  - [x] L1 (2026-11-11, live): Firefly Hollow (74), the Drowned Grove (75), Long-Neck and her den the Stone Nest (76,
        challenges from day one: late tells, the mire flood), the Sunk Stone, gates laid to the Sunk Barrows (L3) and the
        Lantern Causeway (L4) (`docs/places/firefly.md`, `docs/places/grove.md`). Unplayed.
  - [x] L2 (2026-11-11, live): the Still Mere (77, by Hob's punt, now afloat; Hob trades from it), Old Gullet and his den the
        Eel Pit (78, challenges from day one: swallowed and the dark) (`docs/places/stillmere.md`). Unplayed. Next: **L3**
        (the Sunk Barrows and the field bosses).
  - [ ] L3–L4: the Sunk Barrows and the field bosses, the Causeway and Grandfather Mire. L5: the Wickmother.
- [ ] Atlas Phase 9: Amberdune (Old Carapace).
- [ ] Atlas Phase 10, the finale and the post-game: the Wheel restart (a server-wide event, the world flag,
      the changed skies), Pell by the apple tree, the Maelstrom rim, swim physics and the Sunken Reach,
      uncharted islands (`world/regions/uncharted.md`, `expansion.md`).

## Small asks
- [x] **Bug (owner, 2026-10-30), fixed 2026-11-06** (owner: skip it for the safe spot; the flat 60% is gone, and a freeze
      now interrupts an ultimate only 1 time in 5, `INTERRUPT_CHANCE`). Was: seen in the `/rpg_dev` sandbox: every one-shot boss skill (ultimates and the
      like) still kills you while you stand in its safe zone. Check whether it's sandbox-only (the Bosses tab's
      "Ultimate now" / restart-at-phase path, `docs/sandbox.md`) or live too (the safe-zone check in the boss
      moves, `docs/combat/bosses.md`). E5 (c1)'s reading (not fixed): a top boss's uninterrupted ultimate also takes
      `TOP_ULT_HP` (60%) of max HP from everyone, safe spot or not (`ultGoesOff`), so anyone under that dies in the
      safe zone, more so right after a pulse; owner to decide (lower it, or skip it for slimes in the safe spot).
- Trading: start a trade by tapping a slime on the canvas (today: the Players panel).
- Owner to decide: whether bought cosmetics become tradeable.
- Everything else asked for but not planned: `docs/ideas.md`.
