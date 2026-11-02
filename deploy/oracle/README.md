# Moving Slimeville to the Oracle box

Status: **done 2026-11-02.** Slimeville (live, `/rpg/`) and its dev sandbox (`/rpg_dev/`) moved from the
home Arch box to an **Oracle Linux 9** instance on OCI (ARM, Singapore). Kept as the record of how, and as the recipe
for rebuilding the box. Everything else on the home box (other apps,
Home Assistant, the Cloudflare tunnel) stays where it is. Written for the owner and for an agent on either box.

## The plan (owner decision: "option A")

```
before:  browser → Cloudflare → tunnel (cloudflared, home box) → nginx → 127.0.0.1:3002 / 3003
after:   browser → Cloudflare (proxied DNS) → Oracle public IP :443 → nginx (Origin cert) → 127.0.0.1:3002 / 3003
         tylergoh.com/rpg/… and /rpg_dev/… on the home box → 301 to https://rpg.tylergoh.com/…
```

- **New hostname `rpg.tylergoh.com`**, an orange-cloud (proxied) A record pointing at the Oracle box's public IP. No
  cloudflared on Oracle. On the free plan Cloudflare can't send one *path* of `tylergoh.com` to a different server
  (an Origin Rule's DNS override is Enterprise-only), which is why the game gets its own hostname.
- **The paths stay**: `https://rpg.tylergoh.com/rpg/` and `/rpg_dev/`, so `RPG_BASE`, Vite's `base` and the units
  don't change. `/` redirects to `/rpg/`.
- **TLS**: a Cloudflare Origin Certificate on nginx. A Configuration Rule makes SSL "Full (strict)" for this hostname
  only, so the zone-wide SSL mode (and the tunnel's hostnames) are untouched.
- **Firewall**: 443 is open only to Cloudflare's IP ranges (firewalld zone, `cloudflare-firewall.sh`). The OCI
  security list opens 443 to the internet and firewalld does the filtering. ssh stays as OCI set it up.
- Browsers keep saved data per hostname, so once after the move, friends retype their name on the login screen and
  their music and damage-meter settings reset (`slimeville-profile`, `-music`, `-meter` in localStorage). Accounts,
  characters, houses and hotbars are in the DB and move intact.

## What moves

| thing | from (home box) | to (Oracle) | how |
|---|---|---|---|
| code | `~/rpg` (`main`) | `~/rpg` | `git clone` |
| sandbox code | `~/rpg-dev` (worktree on `dev`) | `~/rpg-dev` | `git worktree add` |
| live DB + saved state | `~/rpg/data/` (`accounts.sqlite` + `-wal`/`-shm`, `positions.json`, `bosses.json` after a stop) | `~/rpg/data/` | owner copies the **whole folder** with the service stopped |
| sandbox DB (optional) | `~/.local/share/rpg-dev/` | same | owner copies; without it the sandbox starts fresh and copies logins from live |
| secrets | `~/.config/rpg/turn.env`, `deepseek.env` | same, mode 600 | owner copies (scp); never print or commit |
| units | `deploy/rpg.service`, `rpg-dev.service`, `rpg-dev.socket` | `~/.config/systemd/user/` | `install` (they use `%h`, so any username works) |
| nginx | the `/rpg/` blocks in the home box's shared nginx file (the repo copy, `deploy/nginx-owntracks.conf`, was deleted after the move) | `/etc/nginx/conf.d/rpg.conf` | `deploy/oracle/nginx-rpg.conf` |

Every server module opens the one `data/accounts.sqlite` (accounts, characters, houses, chat, trades, NPC memory).
There are no native npm modules (SQLite is Node's built-in `node:sqlite`), so x86 or ARM (Ampere) both work. Node
must be a recent major (the home box runs **Node 26**; `node:sqlite` needs ≥ 22.13 unflagged). Use 26.

## 1. Cloudflare dashboard (owner, from anywhere)

1. **Origin certificate**: SSL/TLS → Origin Server → Create Certificate. RSA, hostnames `rpg.tylergoh.com` (add
   `*.tylergoh.com` too if you want to reuse it), 15 years. Keep the page open: the certificate and key go onto the
   Oracle box in step 3 (the key is shown only once).
2. **DNS**: wait until the Oracle box answers on 443 (step 3), then add `A rpg → <Oracle public IP>`,
   **Proxied**. If you add it earlier, nothing breaks; the hostname just errors until nginx is up.
3. **Configuration Rule** (Rules → Configuration Rules): if hostname equals `rpg.tylergoh.com` → SSL: **Full (strict)**.
4. WebSockets are on by default (Network → WebSockets): check it's on.

## 2. OCI console (owner)

- The instance's subnet security list (or its NSG): add ingress **TCP 443 from 0.0.0.0/0**. firewalld restricts it to
  Cloudflare. Nothing else needs opening (port 80 isn't used: Cloudflare connects on 443).
- Note the public IP for the DNS record. A reserved public IP survives the instance being recreated.

## 3. The Oracle box (Oracle Linux 9, default user `opc`)

Run as the normal user; the `sudo` lines need the owner. The owner sets up the GitHub deploy key and copies the DB.

```bash
# Packages. Node 26 from NodeSource puts node/npm in /usr/bin, where the units expect them.
sudo dnf install -y git nginx curl tar
curl -fsSL https://rpm.nodesource.com/setup_26.x | sudo bash -
sudo dnf install -y nodejs
node -v   # v26.x
# (OL9's own AppStream module may already have put an older Node in /usr/bin: remove it and disable the module first,
#  sudo dnf remove -y nodejs npm && sudo dnf module reset -y nodejs && sudo dnf module disable -y nodejs)
# (If NodeSource has no 26 build: download the official linux-<x64|arm64> tarball from nodejs.org into /opt/node and
#  sudo ln -sf /opt/node/bin/{node,npm,npx} /usr/bin/ ; the units call /usr/bin/node and /usr/bin/npm.)

# User services keep running without a login.
sudo loginctl enable-linger "$USER"

# Code: live on main, sandbox worktree on dev (node_modules shared through a symlink, as on the home box).
git clone git@github.com:TylerGoh/vibe_coded_rpg.git ~/rpg
cd ~/rpg && npm ci
git worktree add ~/rpg-dev dev
ln -s ~/rpg/node_modules ~/rpg-dev/node_modules

# Secrets (owner copies the two files from the home box into ~/.config/rpg/ first).
mkdir -p ~/.config/rpg && chmod 700 ~/.config/rpg && chmod 600 ~/.config/rpg/*.env

# Units: install now, start only after the DB is in place (step 5), or the live server creates an empty DB.
mkdir -p ~/.config/systemd/user
install -m 644 deploy/rpg.service deploy/rpg-dev.service deploy/rpg-dev.socket ~/.config/systemd/user/
systemctl --user daemon-reload

# nginx: Origin certificate from step 1, the site config, SELinux allowed to proxy to localhost ports.
sudo mkdir -p /etc/nginx/ssl
sudo tee /etc/nginx/ssl/rpg-origin.pem >/dev/null   # paste the certificate, then Ctrl-D
sudo tee /etc/nginx/ssl/rpg-origin.key >/dev/null   # paste the private key, then Ctrl-D
sudo chmod 600 /etc/nginx/ssl/rpg-origin.key
sudo restorecon -R /etc/nginx/ssl
sudo setsebool -P httpd_can_network_connect 1        # without this SELinux blocks nginx → 127.0.0.1:3002 (502s)
sudo install -m 644 deploy/oracle/nginx-rpg.conf /etc/nginx/conf.d/rpg.conf
sudo nginx -t && sudo systemctl enable --now nginx

# Firewall: 443 only from Cloudflare.
sudo systemctl enable --now firewalld
sudo bash deploy/oracle/cloudflare-firewall.sh
```

Check nginx before any game data is there (expect a 502 because the game isn't running yet; that's fine, it
proves TLS and the config load):

```bash
curl -sk -o /dev/null -w '%{http_code}\n' --resolve rpg.tylergoh.com:443:127.0.0.1 https://rpg.tylergoh.com/rpg/
```

## 4. Cutover: stop the home box (owner, on the home box)

Do this when friends are offline if possible. The home server must be stopped **before** copying, so it saves
positions and bosses into `data/` and nobody plays on the old copy afterwards.

```bash
systemctl --user stop rpg rpg-dev.socket rpg-dev.service
systemctl --user disable rpg rpg-dev.socket
ls ~/rpg/data/        # accounts.sqlite (+ -wal/-shm if present), positions.json, bosses.json
# copy the whole folder (plus the optional sandbox DB and the secrets) to the Oracle box, e.g.:
scp -r ~/rpg/data opc@<oracle-ip>:~/rpg/
scp -r ~/.local/share/rpg-dev opc@<oracle-ip>:~/.local/share/     # optional
scp ~/.config/rpg/turn.env ~/.config/rpg/deepseek.env opc@<oracle-ip>:~/.config/rpg/
```

Copy the SQLite file together with its `-wal`/`-shm` files when they exist. If a server ever ran on the Oracle box
before the copy, stop it and `rm -f ~/rpg/data/accounts.sqlite*` first: a stale WAL from an empty DB sitting next
to the real one corrupts it.

## 5. Start on Oracle

```bash
chmod 600 ~/.config/rpg/*.env
systemctl --user enable --now rpg rpg-dev.socket
sudo journalctl _SYSTEMD_USER_UNIT=rpg.service -n 30   # startup log (journalctl --user shows nothing here): listening on 3002, TURN on, DeepSeek on
curl -sk -o /dev/null -w '%{http_code}\n' --resolve rpg.tylergoh.com:443:127.0.0.1 https://rpg.tylergoh.com/rpg/   # 200
```

Add the DNS record now if it isn't there yet (step 1.2), then open `https://rpg.tylergoh.com/rpg/` and log in with a
real account: the character, house and position should be as they were. Then open `/rpg_dev/`: the first load waits
while the sandbox builds.

## 6. Home box afterwards (owner + an agent there)

1. **Redirect the old URLs.** In `~/assistant/deploy/nginx/owntracks.conf`, replace the `location /rpg/`,
   `location = /rpg_dev` and `location /rpg_dev/` blocks with:
   ```nginx
   location /rpg/     { return 301 https://rpg.tylergoh.com$request_uri; }
   location = /rpg_dev { return 301 https://rpg.tylergoh.com/rpg_dev/; }
   location /rpg_dev/ { return 301 https://rpg.tylergoh.com$request_uri; }
   ```
   then `sudo bash ~/assistant/deploy/nginx/install.sh`. Tabs still open on the old URL lose their socket and come
   back on the new one after a reload.
2. **Backups**: remove `[db.rpg-accounts]` from `~/assistant/deploy/backups.toml` (it would keep uploading the dead
   copy), and set up a backup on the Oracle box instead (e.g. rclone to the same `obs_crypt` remote, copying its
   config over; or a cron `sqlite3 .backup` to OCI object storage).
3. `~/NETWORK.md`: drop `rpg.service`, 3002/3003 and the `/rpg/` route; note that Slimeville lives on Oracle.
4. Keep `~/rpg` and `~/rpg-dev` on the home box for a while as a fallback (the units are disabled), then delete.

## 7. The repo afterwards (an agent on the Oracle box) — done 2026-11-02

Once it runs there, make the repo describe its new home, and delete this file's "planned" status:
- `Agent.md` → "Run / deploy": the public path (Cloudflare proxied DNS → nginx on Oracle → 3002), no tunnel, where
  nginx lives (`/etc/nginx/conf.d/rpg.conf` from `deploy/oracle/nginx-rpg.conf`), the cert, firewalld, SELinux's
  `httpd_can_network_connect`; `~/NETWORK.md` doesn't exist there. Testing rules that name Slime Hop (`~/game`,
  port 3000) no longer apply on this box.
- `deploy/nginx-owntracks.conf` (the home box's shared nginx file) and `deploy/install-nginx.sh`: delete or replace
  with the Oracle ones; update `docs/sandbox.md`, which names the `/rpg_dev/` block in `deploy/nginx-owntracks.conf`.
- Comments that say `tylergoh.com/rpg/` (`server/index.js`, `vite.config.js`) → `rpg.tylergoh.com/rpg/`.
- Claude Code memory from the home box (`~/.claude/projects/-home-tylergoh-rpg/memory/`) can be copied to the new
  box's project folder (named after the new path, e.g. `~/.claude/projects/-home-opc-rpg/memory/`).

## What bit during the move (2026-11-02)
- `deploy/rpg.service` had `WorkingDirectory=/home/tylergoh/rpg` hardcoded; it is `%h/rpg` now. Keep the units
  user-agnostic.
- The box came with Node 20 from OL9's AppStream module (too old for `node:sqlite`); see the note in step 3.
- `journalctl --user` shows nothing for user units here: use `sudo journalctl _SYSTEMD_USER_UNIT=rpg.service`.
- The public URL gave 522 (Cloudflare couldn't connect) until the OCI side was fixed: no SYN reached the box
  (`tcpdump -ni enp0s6 'tcp port 443'`), so check the security list and the A record before nginx or firewalld.
