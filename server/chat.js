// Docs: docs/social/chat.md
// Text chat: one public channel for everyone online, and private messages between two accounts (also to
// someone who's offline: they get it at their next login). Everything is kept in the accounts DB, so the
// recent public chat and your own private conversations come back at login (`chat-log`).
import { DatabaseSync } from 'node:sqlite';
import { cleanText, CHAT_MAX } from '../src/shared/sim.js';

const LOG_PUBLIC = 60; // public lines sent at login
const LOG_PRIVATE = 200; // private lines (to or from you) sent at login
const KEEP_PUBLIC = 1000; // public lines kept in the DB
const KEEP_PRIVATE_DAYS = 90; // private lines older than this are deleted
const BURST = 6; // lines a player may send in a burst…
const PER_SEC = 0.5; // …and on average

// players: the server's id → player map. send(ws, msg). users() → every account name.
export function createChat({ dbPath, players, send, users }) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL,
             from_user TEXT NOT NULL, to_user TEXT, text TEXT NOT NULL);
           CREATE INDEX IF NOT EXISTS chat_to ON chat (to_user, id);
           CREATE INDEX IF NOT EXISTS chat_from ON chat (from_user, id);`);
  const insert = db.prepare('INSERT INTO chat (at, from_user, to_user, text) VALUES (?, ?, ?, ?)');
  const publicLog = db.prepare('SELECT * FROM (SELECT * FROM chat WHERE to_user IS NULL ORDER BY id DESC LIMIT ?) ORDER BY id');
  const privateLog = db.prepare(`SELECT * FROM (SELECT * FROM chat WHERE to_user = ? OR (from_user = ? AND to_user IS NOT NULL)
                                 ORDER BY id DESC LIMIT ?) ORDER BY id`);
  const prune = () => {
    db.prepare('DELETE FROM chat WHERE to_user IS NULL AND id NOT IN (SELECT id FROM chat WHERE to_user IS NULL ORDER BY id DESC LIMIT ?)').run(KEEP_PUBLIC);
    db.prepare('DELETE FROM chat WHERE to_user IS NOT NULL AND at < ?').run(Date.now() - KEEP_PRIVATE_DAYS * 86400_000);
  };
  prune();
  setInterval(prune, 3600_000).unref();

  const line = (r) => ({ id: r.id, at: r.at, from: r.from_user, to: r.to_user ?? undefined, text: r.text });
  const error = (p, text) => send(p.ws, { t: 'chat-error', text });

  return {
    // at login (and after a takeover): the recent public chat and your private conversations
    sendLog(p) {
      const lines = [...publicLog.all(LOG_PUBLIC), ...privateLog.all(p.name, p.name, LOG_PRIVATE)].sort((a, b) => a.id - b.id).map(line);
      send(p.ws, { t: 'chat-log', lines });
    },
    // → {t:'chat', text, to?}
    say(p, m) {
      const text = cleanText(m.text, CHAT_MAX);
      if (!text) return;
      const to = m.to === undefined || m.to === null ? null : String(m.to).trim().toLowerCase();
      if (to !== null && !users().includes(to)) return error(p, `There's no slime called "${to.slice(0, 12)}".`);
      if (to === p.name) return error(p, "That's you!");
      const now = Date.now() / 1000;
      p.chatTokens = Math.min(BURST, (p.chatTokens ?? BURST) + (now - (p.chatAt ?? now)) * PER_SEC);
      p.chatAt = now;
      if (p.chatTokens < 1) return error(p, 'Slow down a little!');
      p.chatTokens--;
      const at = Date.now();
      const id = Number(insert.run(at, p.name, to, text).lastInsertRowid);
      const data = JSON.stringify({ t: 'chat', id, at, from: p.name, to: to ?? undefined, text });
      for (const q of players.values()) if (q.joined && (to === null || q.name === to || q.name === p.name)) send(q.ws, data);
    },
  };
}
