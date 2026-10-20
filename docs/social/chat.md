# Text chat and private messages

Files: `server/chat.js` (storing, routing, rate limit, the login log), `src/chat.js` (the chatbox, tabs,
commands, unread counts, speech bubbles), `CHAT_MAX` in `src/shared/sim.js`. The corner feed it shares
with the AI characters is `addFeed` / `drawFeed` in `src/npc.js`; the Players panel's Message button is
in `src/players.js`.

## Owner decisions (2026-10-20)
- Asked for "a chatbox feature with private messaging". Choices made without asking (liberal-decisions
  rule): one **public channel for everyone online, in every room** (it's a small group of friends; voice
  is the proximity thing), plus **private messages** between two accounts.
- Private messages work to **offline** accounts too: they're stored and delivered at the recipient's next
  login (the tab says so). Nothing else about who you can message is restricted.
- Public lines also show as a **speech bubble** over the speaker when they're in your room, MapleStory
  style, and in the corner feed while the box is closed.

## How it works
- Opening: Enter (or `/`, which starts a command), or the Chat button in `#hudbtns` (touch). The box stays
  up while you walk: an empty Enter hands the keys back to the game, Enter again types, Esc closes it. It
  isn't an "overlay", so the touch pad stays unless you're typing (any focused INPUT hides it).
- Tabs: Everyone, then one per conversation (most recent first). Clicking a name in the log or Message in
  the Players panel opens a tab with them. Commands: `/w name text` (also /msg /dm /t /tell), `/r text`
  replies to whoever whispered last, `/all text` says it in public from a private tab.
- Everything goes through the `chat` table in the accounts DB, so the login message (`chat-log`) carries
  the recent public lines plus your own private ones, and a reconnect or takeover rebuilds the box.
  Old lines are pruned (`KEEP_PUBLIC`, `KEEP_PRIVATE_DAYS`).
- Unread private lines are counted against the last line id you saw per conversation, kept in
  localStorage per account (`slimeville-chat-<name>`); the server keeps no read state. Unread public
  lines are only counted for this session. The Chat button shows the total and turns pink for private ones.
- The server rate-limits each player (`BURST`, `PER_SEC`), cleans text with `cleanText`, and checks the
  recipient is a real account. The sender's own line comes back from the server (no local echo), so
  what you see is what was stored.
- On phones the box sits at the top (the keyboard covers the bottom half).
