// Docs: docs/social/ai-characters.md
// The AI characters (Elder Mochi in the village, Curator Clio in the museum). Replies come from the
// DeepSeek chat API; personalities are in server/characters.js.
//
// Talking to a character is public: everyone sees what's said and answered (server/index.js broadcasts
// it). The character sees the recent public conversation with every line labelled by speaker, and is
// told who it's answering.
//
// On top of that, each player has their own memory of talking with each character, stored in the
// accounts database and capped at MEMORY_TOKENS (estimated). When it outgrows that, the oldest exchanges
// are folded into a short running summary ("what Mochi remembers about you") rather than simply forgotten.
//
// Configure with DEEPSEEK_API_KEY (and optionally DEEPSEEK_MODEL) — rpg.service reads them from
// ~/.config/rpg/deepseek.env. Without a key the characters say they're napping.
import { DatabaseSync } from 'node:sqlite';

const MEMORY_TOKENS = 3000; // per player and character: summary + remembered messages
const KEEP_AFTER_FOLD = 1800; // after summarising, the recent conversation is trimmed to about this
const SUMMARY_TOKENS = 400; // the summary itself stays small
const COOLDOWN_MS = 2000;
const DAILY_LIMIT = 150; // messages per player per day (per character), to keep API costs bounded
const PUBLIC_LINES = 12; // recent public conversation the character sees (and new arrivals are shown)

// DeepSeek's guide: ~0.3 tokens per English character, ~0.6 per Chinese character; plus a little per message.
export function estimateTokens(text) {
  let t = 0;
  for (const ch of text) t += /[　-鿿가-힯＀-￯]/.test(ch) ? 0.6 : 0.3;
  return Math.ceil(t);
}
const msgTokens = (m) => estimateTokens(m.content) + 4;
const memoryTokens = (mem) => estimateTokens(mem.summary) + mem.messages.reduce((s, m) => s + msgTokens(m), 0);

const configured = () => Boolean(process.env.DEEPSEEK_API_KEY);

// opts: { json: true } to ask for a JSON object back (returned as text), temperature (default 1.1)
export async function deepseek(messages, maxTokens, opts = {}) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', messages, max_tokens: maxTokens, temperature: opts.temperature ?? 1.1,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`DeepSeek: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('DeepSeek: empty reply');
  return text;
}

// char: { id, name, short, persona(user), replyTokens } — see server/characters.js and NPCS in sim.js
export function createNpc(dbPath, char) {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS npc_memory (
      user TEXT NOT NULL,
      npc TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      messages TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user, npc)
    );
  `);
  const load = db.prepare('SELECT summary, messages FROM npc_memory WHERE user = ? AND npc = ?');
  const save = db.prepare(`INSERT INTO npc_memory (user, npc, summary, messages, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user, npc) DO UPDATE SET summary = excluded.summary, messages = excluded.messages, updated_at = excluded.updated_at`);

  const memoryOf = (user) => {
    const row = load.get(user, char.id);
    return row ? { summary: row.summary, messages: JSON.parse(row.messages) } : { summary: '', messages: [] };
  };
  const busy = new Set(); // users with a reply in flight
  const lastAt = new Map();
  const today = new Map(); // user → { day, count }
  const log = []; // the public conversation: { from: user | null for the character, to?, text, ts }
  const remember = (line) => {
    log.push(line);
    if (log.length > PUBLIC_LINES) log.shift();
  };

  // Keep a player's memory within MEMORY_TOKENS: fold the oldest messages into the summary.
  async function compact(user, mem) {
    if (memoryTokens(mem) <= MEMORY_TOKENS) return mem;
    const old = [];
    while (mem.messages.length > 2 && memoryTokens(mem) > KEEP_AFTER_FOLD) {
      old.push(mem.messages.shift());
    }
    let summary = mem.summary;
    try {
      summary = await deepseek([
        { role: 'system', content: `You keep ${char.name}'s memory notes about the slime "${user}". Merge the old notes and the conversation below into updated notes: facts about ${user}, things they shared, promises, running jokes. Third person, plain sentences, under 120 words.` },
        { role: 'user', content: `Old notes:\n${mem.summary || '(none)'}\n\nConversation:\n${old.map((m) => `${m.role === 'user' ? user : char.short}: ${m.content}`).join('\n')}` },
      ], SUMMARY_TOKENS);
    } catch (e) {
      console.error('npc: summary failed, dropping oldest messages instead:', String(e));
    }
    mem.summary = summary;
    // Last resort if the summary itself came back long: trim it and older messages until we fit.
    while (memoryTokens(mem) > MEMORY_TOKENS && mem.messages.length > 2) mem.messages.shift();
    if (memoryTokens(mem) > MEMORY_TOKENS) mem.summary = mem.summary.slice(0, Math.floor(SUMMARY_TOKENS / 0.3));
    return mem;
  }

  // Everything the character needs to answer `user`: persona, his notes and older chats with them, then the
  // recent public conversation as turns (consecutive lines of the same role merged).
  function prompt(user, mem) {
    const since = log[0]?.ts ?? Infinity; // personal lines older than the public window
    const older = mem.messages.filter((m) => (m.ts ?? 0) < since);
    let system = char.persona(user);
    if (mem.summary) system += `\n\nWhat you remember about ${user}:\n${mem.summary}`;
    if (older.length) system += `\n\nEarlier chats with ${user}:\n${older.map((m) => `${m.role === 'user' ? user : 'You'}: ${m.content}`).join('\n')}`;
    const turns = [];
    for (const l of log) {
      const role = l.from ? 'user' : 'assistant';
      const content = l.from ? `${l.from}${l.ctx ? ` (${l.ctx})` : ''}: ${l.text}` : l.text;
      if (turns.at(-1)?.role === role) turns.at(-1).content += `\n${content}`;
      else turns.push({ role, content });
    }
    return [{ role: 'system', content: system }, ...turns];
  }

  return {
    // The recent public conversation, for someone opening the dialog
    recent: () => log.map(({ from, to, text }) => ({ from, to, text })),

    // Before anything is said publicly: can `user` talk now? → null, or an error phrased for the player.
    // Reserves their turn (cooldown, daily allowance) when it says yes; reply() must follow.
    check(user) {
      if (!configured()) return `${char.name} is fast asleep… (the AI isn't set up yet)`;
      if (busy.has(user)) return `${char.short} is still thinking about your last words…`;
      const now = Date.now();
      if (now - (lastAt.get(user) ?? 0) < COOLDOWN_MS) return 'Slow down a little, young one.';
      const day = new Date().toDateString();
      const used = today.get(user)?.day === day ? today.get(user).count : 0;
      if (used >= DAILY_LIMIT) return `${char.short} is tired of talking for today. Come back tomorrow!`;
      busy.add(user);
      lastAt.set(user, now);
      today.set(user, { day, count: used + 1 });
      return null;
    },

    // `user` said `text` publicly → { reply } or { error }
    // ctx: optional note on where the speaker is (e.g. which museum exhibit they're standing at)
    async reply(user, text, ctx) {
      try {
        const ts = Date.now();
        remember({ from: user, text, ts, ctx });
        const mem = memoryOf(user);
        const reply = await deepseek(prompt(user, mem), char.replyTokens ?? 300);
        remember({ from: null, to: user, text: reply, ts: Date.now() });
        mem.messages.push({ role: 'user', content: text, ts }, { role: 'assistant', content: reply, ts: Date.now() });
        await compact(user, mem);
        save.run(user, char.id, mem.summary, JSON.stringify(mem.messages), Date.now());
        return { reply };
      } catch (e) {
        console.error('npc:', String(e));
        return { error: `Hmm… ${char.short} lost the thread mid-thought. Try again in a moment.` };
      } finally {
        busy.delete(user);
      }
    },

    // For checking/clearing from the shell (see the CLI below)
    memory: memoryOf,
    forget: (user) => db.prepare('DELETE FROM npc_memory WHERE user = ? AND npc = ?').run(user, char.id).changes > 0,
  };
}

export { configured as npcConfigured, memoryTokens };
