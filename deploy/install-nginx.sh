#!/usr/bin/env bash
# Install the /rpg nginx route (proxies tylergoh.com/rpg/ incl. WebSocket -> 127.0.0.1:3002).
# Run with: sudo bash /home/tylergoh/rpg/deploy/install-nginx.sh
set -euo pipefail

SRC=/home/tylergoh/rpg/deploy/nginx-owntracks.conf
DST=/etc/nginx/conf.d/owntracks.conf

if [ "$(id -u)" -ne 0 ]; then
  echo "run me with sudo: sudo bash $0" >&2
  exit 1
fi

# Keep the pre-change config (first backup wins)
[ -e "$DST.pre-rpg" ] || cp -a "$DST" "$DST.pre-rpg"

install -m 644 "$SRC" "$DST"
nginx -t
systemctl reload nginx

curl -s -o /dev/null -w 'public /rpg/ -> HTTP %{http_code}\n' https://tylergoh.com/rpg/
echo "OK: nginx reloaded. Rollback: sudo cp $DST.pre-rpg $DST && sudo systemctl reload nginx"
