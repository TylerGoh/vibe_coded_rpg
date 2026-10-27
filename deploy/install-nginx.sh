#!/usr/bin/env bash
# Install the staged nginx config: the /rpg route (tylergoh.com/rpg/ incl. WebSocket -> 127.0.0.1:3002) and the dev
# sandbox's /rpg_dev route (-> 127.0.0.1:3003, docs/sandbox.md).
# Run with: sudo bash /home/tylergoh/rpg/deploy/install-nginx.sh
#
# The staged file is a WHOLE copy of /etc/nginx/conf.d/owntracks.conf, which other projects' installers change too
# (/cal/, /bank/). So this refuses to install a staged copy that would drop a location the live config has: restage it
# from the live file first.
set -euo pipefail

SRC=/home/tylergoh/rpg/deploy/nginx-owntracks.conf
DST=/etc/nginx/conf.d/owntracks.conf

if [ "$(id -u)" -ne 0 ]; then
  echo "run me with sudo: sudo bash $0" >&2
  exit 1
fi

missing=$(grep -o 'location[^{]*' "$DST" | sort -u | while read -r loc; do grep -qF "$loc" "$SRC" || echo "$loc"; done)
if [ -n "$missing" ]; then
  echo "refusing: the staged config would drop these routes from the live one:" >&2
  echo "$missing" >&2
  exit 1
fi

# Keep the pre-change config (first backup of each change wins)
[ -e "$DST.pre-rpg" ] || cp -a "$DST" "$DST.pre-rpg"
[ -e "$DST.pre-rpgdev" ] || cp -a "$DST" "$DST.pre-rpgdev"

install -m 644 "$SRC" "$DST"
nginx -t
systemctl reload nginx

curl -s -o /dev/null -w 'public /rpg/ -> HTTP %{http_code}\n' https://tylergoh.com/rpg/
curl -s -o /dev/null -m 120 -w 'public /rpg_dev/ -> HTTP %{http_code} (502 until rpg-dev.socket is installed)\n' https://tylergoh.com/rpg_dev/ || true
echo "OK: nginx reloaded. Rollback: sudo cp $DST.pre-rpgdev $DST && sudo systemctl reload nginx"
