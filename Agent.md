# Slimeville — notes for agents

A small multiplayer 2D village (MapleStory-style side view) for a group of friends. Slimes walk and jump
around, talk by proximity voice, text chat (public and private messages), trade coins and items, chat with AI characters, sit in on AI lectures and quizzes, slap each
other, play a giant floor piano, tour a huge history museum, sail the ferry to Frostpeak, invite friends over to their own houses
with gardens (furnished from a store, bought bigger with gold; farm herbs there and brew potions at an
alchemy lab; keep pets from the Pet Shop fed or they die), and fight mobs and bosses across four
stages (levels, skills, stats, loot, gear, scrolls, a shop). Canvas + Vite client, a Node server with WebSockets,
SQLite. The art is procedural canvas code that started as a copy of the sibling project `~/game`
(Slime Hop): soft, rounded, pastel; no image assets and no emoji in canvas text.

**This file is always loaded. Everything feature-specific lives in `docs/`: read the docs your task
touches (see the index at the bottom) before changing code. Every source file names its doc in a
`// Docs:` line at the top.**

## Working with the user (tyler, the owner)
- Wants features shipped live quickly; deploys straight to production (there is no staging). Asks in
  short, informal messages and often adds requests mid-task.
- Likes to be asked when a request is genuinely ambiguous. Past misses: "proximity chat" meant VOICE, not
  text; "swap hotbars with the escape key" meant a button IN the Esc menu, with no hotkey on purpose.
  Otherwise "make liberal decisions / good compromises" is the standing instruction.
- **Always make new features work on mobile too** (touch controls, layout). See `docs/ui/mobile.md`.
- Is often online in the live village, so never run test players on the live server.
- Cares about agent context: keep this file small and the docs tree current (rules below).

## Keeping the docs current (part of every change)
- A change isn't done until its doc in `docs/` (and its row in the index below, if the scope changed) is
  updated. New feature area → new doc + index row + `// Docs:` lines in its source files.
- Docs explain intent, invariants, owner decisions and past mistakes. Don't copy tunable numbers out of the
  code: name the constant (`BOSS_HP_PER_PLAYER`), the code holds the value.
- `npm run docs:check` (`scripts/docs-check.mjs`) fails when a doc names a file or identifier that no
  longer exists, a doc is missing from the index, or a source file has no valid `// Docs:` line. A Stop
  hook (`.claude/settings.json` → `scripts/docs-hook.mjs`) runs it and also flags a turn that edited code
  but no docs. If no doc needs changing, say so explicitly in your reply.
- Spawning a subagent: pass it the doc paths its task needs; it gets this file automatically.

## Keeping the game fair (part of every change that touches gold, EXP or power)
- Anything that gives or costs gold, EXP or power (mobs, bosses, drops, prices, house sizes, skill
  numbers) is checked against the economy balance sheet: read `docs/economy.md`, run `npm run economy`
  before and after, keep `npm run economy -- --check` green, and say what moved in your reply. Price new
  things with its method (aim level → share of gold earned by then) instead of guessing.

## Run / deploy
- Public https://tylergoh.com/rpg/ → Cloudflare tunnel → nginx `location /rpg/` (WebSocket upgrade) →
  `127.0.0.1:3002`. The whole box is described in `~/NETWORK.md`. nginx changes need the user's sudo
  (staged config + `deploy/install-nginx.sh`).
- User systemd unit `rpg.service` (source `deploy/rpg.service`) runs `npm run build` then
  `node server/index.js`. **Deploy = `systemctl --user restart rpg`** (rebuilds). Logs:
  `journalctl --user -u rpg` (the startup log says whether TURN and DeepSeek are on). Restarting drops
  everyone for a few seconds; clients reconnect where they stood (owner: small deploys mustn't reset
  positions; `savePositions` in `server/index.js`). For a game-breaking change, create an empty
  `reset-positions` file next to the accounts DB before restarting and everyone starts at spawn. Unit changes: `install -m 644 deploy/rpg.service
  ~/.config/systemd/user/` + `daemon-reload`.
- Git: `~/rpg` is a repo, remote `origin` = github.com:TylerGoh/vibe_coded_rpg (branch `main`). **Always
  commit and push after every deploy** without asking (owner's standing instruction: it's a low-stakes
  project). `.gitignore` keeps out `data/` (accounts DB), `dist/` and `node_modules/`; never commit secrets.
- Secrets (mode 600, loaded via EnvironmentFile; never print or commit): `~/.config/rpg/turn.env`
  (Cloudflare TURN) and `~/.config/rpg/deepseek.env` (DEEPSEEK_API_KEY).
- **Big features: work in a copy of the repo** (tar `~/rpg` minus node_modules/data/dist into the
  scratchpad, symlink node_modules, copy `data/accounts.sqlite`). The service has `Restart=` and rebuilds
  from `~/rpg` on every start, so a crash would ship half-finished edits. Deploy by `install`-ing the
  changed files back (diff first: only your files should differ), then restart.

## Testing (details: `docs/testing.md`)
- **Never test on the live server (3002).** Run a throwaway server on another port with its own DB and
  `DIST=<scratch>/testdist`, built with `npx vite build --outDir <scratch>/testdist`. Building into
  `dist/` changes the LIVE site, which serves `dist/` from disk.
- Stop test servers by PID (check `readlink /proc/<pid>/cwd`). `pkill -f "node server/index.js"` also kills
  the live service and Slime Hop (`~/game`, port 3000).

## Core rules (break these and things desync or glitch; details in `docs/netcode.md`)
- Fixed 60 Hz on both sides; one input message = one sim step; client predicts and replays unacked inputs.
  **Anything that changes movement goes in `step()` in `src/shared/sim.js`**, driven by input bits, never
  by side-channel messages. State is quantised there so prediction matches exactly.
- Animation dt is capped at 1/30 s separately from the sim's catch-up (bigger steps break the jelly).
- The server decides anything shared: slaps on friends, piano landings, votes, quiz turns. Exception, on
  purpose: hits on mobs and hits on you are client-decided and server-capped (`docs/combat/core.md`).
- Clients only draw (and voice-call) slimes in their own room, except that a broadcaster is heard everywhere.

## Pitfalls already hit
- `cp` is aliased to `cp -i` and hangs: use `install`.
- Shell heredocs turn ` ` in JS source into a literal line separator, which breaks regexes: write JS
  with Python or the Write tool.
- Emoji in canvas text render as boxes on machines without emoji fonts.
- Subagents that run `npm run build` rewrite the live `dist/`: tell them to build into the scratchpad.

## Story
`story/` is the narrative bible (world, geography, characters, arcs). The game is being reshaped to fit
it: read `story/README.md` before changing places, travel, NPC personas, boss names or flavor text, and
start story work from `story/roadmap.md`. Owner rules for story work:
- **Built in phases; the next one shows but doesn't open.** A place the next phase delivers (the ferry, a
  crossing, an island) is visible but blocked by an in-world reason (a barricade, a laid-up ship, a
  character's refusal), never a "coming soon" sign and never a stand-in door into an existing area.
  When the phase ships, the update itself lifts the block (the light is lit, the barricade gone): no
  unlock quest or event.
- **Every island's landing has a town**, and every town works like Slimeville: your respawn point and a
  door into your own house (`TOWNS`, `docs/world.md`). Arriving after a crossing, you step into a town.
- **NPCs serve a purpose AND are chattable**, like Elder Mochi: a DeepSeek persona with per-player memory
  (`docs/social/ai-characters.md`). Keep what each one knows of the lore narrow (usually canon Tier 0 plus
  their trade) so the story stays hidden, and lean into their personal lives instead.

## Code map (one line per area; the docs go deeper)
- `src/shared/`: code shared by client and server. `sim.js` (rooms, platforms, doors, physics `step()`,
  wire format, piano keys, museum layout, `NPCS`), `rpg.js` (stages, mobs, items, dens, shop, formulas),
  `skills.js` (skill trees, ability points, `statsFor`), `courses.js`.
- `server/index.js`: HTTP + WebSocket `/rpg/ws` (protocol documented at its top), 60 Hz tick, login,
  rooms, message routing. `server/rpg.js`: characters, mobs, bosses, hits, loot, bag, shops. Others:
  `accounts.js`, `turn.js`, `chat.js`, `npc.js`, `characters.js`, `lecture.js`, `tutor.js`, `vote.js`.
- `src/main.js`: loop, input, HUD, login, Esc menu and the wiring of everything; `src/net.js`: prediction
  and routing. Each feature has its own client file(s), named in its doc.
- HTML overlays live in `index.html`, positioned in canvas pixels × `--s` in `src/style.css`; the canvas
  is a fixed 960×540, letterboxed.

## Docs index: read the ones your task touches
| doc | read when you touch… |
|---|---|
| [docs/world.md](docs/world.md) | rooms, doors, map layout, platforms, the village, room ids, towns (respawn, home doors) |
| [docs/netcode.md](docs/netcode.md) | `step()`, prediction, snapshots, the protocol, `server/index.js`, `src/net.js`, `src/main.js` wiring |
| [docs/accounts.md](docs/accounts.md) | login, accounts, test accounts, takeover |
| [docs/testing.md](docs/testing.md) | running a test server, headless browser tests, test env vars, `#debug` |
| [docs/art.md](docs/art.md) | slime art, accessories, scenery, the art style |
| [docs/combat/core.md](docs/combat/core.md) | attacking, damage, HP/EXP, fainting, friendly fire, the bag, saving characters |
| [docs/combat/stages.md](docs/combat/stages.md) | the four stages, zones, mobs and their AI, hazards, elites, field bosses |
| [docs/combat/bosses.md](docs/combat/bosses.md) | boss dens, boss moves, ultimates, boss art, the damage meter |
| [docs/combat/skills.md](docs/combat/skills.md) | skill trees, MP, the hotbar and its two setups, Mobility, ability points (STR/DEX/INT/LUK) |
| [docs/combat/items.md](docs/combat/items.md) | items, gear, scrolls, gold, the shop, the Boutique |
| [docs/economy.md](docs/economy.md) | ANY gold / EXP / price / drop / scaling change: the balance sheet, `npm run economy` |
| [docs/social/voice.md](docs/social/voice.md) | proximity voice, broadcast, TURN |
| [docs/social/chat.md](docs/social/chat.md) | the chatbox, public chat, private messages, chat speech bubbles |
| [docs/social/ai-characters.md](docs/social/ai-characters.md) | Elder Mochi, Captain Brine, Curator Clio, Icefang Hamlet's three, the branches' traders (Bun, Moss, Truffle, Acorn), Auntie Clover, DeepSeek, NPC memory, how much lore a character knows, characters who trade |
| [docs/social/trading.md](docs/social/trading.md) | trading coins and items between players, the trade log |
| [docs/social/accuse.md](docs/social/accuse.md) | accusing someone of botting, the canvas deny button, the EXP skim |
| [docs/social/lecture-tutor.md](docs/social/lecture-tutor.md) | the lecture hall, courses, votes, the tutoring room |
| [docs/places/piano.md](docs/places/piano.md) | the Music House floor piano |
| [docs/places/museum.md](docs/places/museum.md) | the history museum and its content |
| [docs/places/houses.md](docs/places/houses.md) | personal houses, the furniture store, the backyard, expanding, decorating, pets, the swing, the Players panel, invites |
| [docs/places/harbour.md](docs/places/harbour.md) | Greenhollow Harbour, the lighthouse, Captain Brine, the far-off islands drawn in every sky |
| [docs/places/crossings.md](docs/places/crossings.md) | crossing rooms (the ferry's deck), the voyage clock `state.vt`, boarding (the Set sail card), future sea/balloon routes |
| [docs/places/fjord.md](docs/places/fjord.md) | Icefang Fjord and Icefang Hamlet (Frostpeak's landing town), Skaldi, Runa and her shop, Tove, the fjord folk's look, the laid-up Lodestar |
| [docs/places/cliffs.md](docs/places/cliffs.md) | the Keeper ruins in Bramble Woods, Greenhollow's east cliffs, the telescope |
| [docs/places/branches.md](docs/places/branches.md) | each island's branches, their blocked entrances (gates), the island maps' data (`GREENHOLLOW`, `FROSTPEAK`); **how to ship a branch (checklist, gotchas) and where the next phases' gates are** |
| [docs/places/willowmere.md](docs/places/willowmere.md) | Willowmere (room 24), Miller Bun, Old Snapjaw, the weir stone |
| [docs/places/coves.md](docs/places/coves.md) | Saltspray Coves (room 25), Beachcomber Moss, the Tidemother's den (26), boss `lines` |
| [docs/places/canopy.md](docs/places/canopy.md) | the Old Oak Canopy (room 31), Ranger Acorn, the Hornet Queen, wasp nests, the Lifted Stone, the cut trunk to Keeper's Spine |
| [docs/places/wreck.md](docs/places/wreck.md) | Wreck Cave (room 32, a hard pocket off the Coves), the Brave Pippin and its log, the Drowned Bosun |
| [docs/places/thornheart.md](docs/places/thornheart.md) | the Thornheart (room 33, a hard pocket off Bramble Woods), the Hedge Stone, the Thorn Hart |
| [docs/places/spine.md](docs/places/spine.md) | Keeper's Spine (room 34, the ridge above the Canopy), the Road Stone, the Watch Seat, the Root Warden and its court (den 35), Greenhollow's capstone |
| [docs/places/glacier.md](docs/places/glacier.md) | the Rimeglass Glacier (room 36, Frostpeak's first branch, Lv 60–75), Ice-Cutter Eyvind, Old Rimehorn, the Rime Stone, Ylva's Cairn |
| [docs/places/deep.md](docs/places/deep.md) | the Mycelium Deep (room 28), Glowroot Hollow (29, a hard pocket), Forager Truffle, the Knotmole's burrow (30), the Listening Stone |
| [docs/places/waystones.md](docs/places/waystones.md) | waystones (fast travel, within one island), attuning, the travel card |
| [docs/places/pets.md](docs/places/pets.md) | pets' hunger, moods and dying, feeding, the Pet Shop, Auntie Clover, pet food |
| [docs/places/alchemy.md](docs/places/alchemy.md) | farming (garden plots, crops), the alchemy lab, recipes, brewed potions and their buffs |
| [docs/ui/mobile.md](docs/ui/mobile.md) | touch controls, phone layout, fullscreen, home-screen mode |
| [docs/ui/hints.md](docs/ui/hints.md) | the on-screen prompts above your slime, any new interaction |
| [docs/ui/world-map.md](docs/ui/world-map.md) | the World map page in the Esc menu |
| [docs/ui/audio.md](docs/ui/audio.md) | music, ambience, sound effects |
| [docs/performance.md](docs/performance.md) | frame rate, lag on old laptops, the Graphics setting, big gradients and glows, caching art, WebGL/3D questions |
| [docs/ideas.md](docs/ideas.md) | what's untested and what's been asked for but not done |
