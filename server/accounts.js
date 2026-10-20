// Docs: docs/accounts.md
// Player accounts, in a small SQLite file (Node's built-in node:sqlite — no dependencies).
// There is no sign-up page: accounts are made by hand with this file as a CLI.
//
//   node server/accounts.js add <user> <password>      create an account (or reset its password)
//   node server/accounts.js list                       show every account
//   node server/accounts.js remove <user>
//
// Passwords are scrypt-hashed. The point of accounts here is one login per person, not security.
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { cleanHue } from '../src/shared/sim.js';

const scryptAsync = promisify(scrypt);
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const DEFAULT_DB = join(ROOT, 'data', 'accounts.sqlite');

// Usernames: lowercase letters, digits, _ and -, 1–12 chars (the name shown above the slime).
export const cleanUser = (u) => String(u ?? '').trim().toLowerCase();
const VALID_USER = /^[a-z0-9_-]{1,12}$/;

const hashSync = (pass) => {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pass, salt, 32).toString('hex')}`;
};

export function openAccounts(path = DEFAULT_DB) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      user TEXT PRIMARY KEY,
      pass TEXT NOT NULL,
      hue INTEGER NOT NULL DEFAULT 148,
      created_at INTEGER NOT NULL,
      last_login INTEGER
    );
  `);
  const get = db.prepare('SELECT user, pass, hue FROM accounts WHERE user = ?');
  const touch = db.prepare('UPDATE accounts SET hue = ?, last_login = ? WHERE user = ?');

  return {
    path,
    // → { user, hue } on success, or null for a wrong user/password
    async login(user, pass, hue) {
      user = cleanUser(user);
      const row = get.get(user);
      if (!row || typeof pass !== 'string') return null;
      const [salt, want] = row.pass.split(':');
      const got = await scryptAsync(pass, Buffer.from(salt, 'hex'), 32);
      if (!timingSafeEqual(got, Buffer.from(want, 'hex'))) return null;
      const h = hue === undefined || hue === null ? row.hue : cleanHue(hue);
      touch.run(h, Date.now(), user);
      return { user, hue: h };
    },
    add(user, pass) {
      user = cleanUser(user);
      if (!VALID_USER.test(user)) throw new Error('username must be 1–12 of a-z 0-9 _ -');
      if (!pass) throw new Error('password required');
      db.prepare(`INSERT INTO accounts (user, pass, created_at) VALUES (?, ?, ?)
                  ON CONFLICT(user) DO UPDATE SET pass = excluded.pass`).run(user, hashSync(pass), Date.now());
      return user;
    },
    remove: (user) => db.prepare('DELETE FROM accounts WHERE user = ?').run(cleanUser(user)).changes > 0,
    list: () => db.prepare('SELECT user, hue, created_at, last_login FROM accounts ORDER BY user').all(),
  };
}

// CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, user, pass] = process.argv.slice(2);
  const acc = openAccounts(process.env.DB || DEFAULT_DB);
  const when = (t) => (t ? new Date(t).toISOString().slice(0, 16).replace('T', ' ') : '—');
  if (cmd === 'add' && user && pass) console.log(`saved account: ${acc.add(user, pass)}`);
  else if (cmd === 'remove' && user) console.log(acc.remove(user) ? `removed ${cleanUser(user)}` : 'no such account');
  else if (cmd === 'list') for (const a of acc.list()) console.log(`${a.user.padEnd(12)}  hue ${String(a.hue).padStart(3)}  last login ${when(a.last_login)}`);
  else {
    console.log('usage: node server/accounts.js add <user> <password> | remove <user> | list');
    process.exitCode = 1;
  }
}
