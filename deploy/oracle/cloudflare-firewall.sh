#!/usr/bin/env bash
# Slimeville on the Oracle box (deploy/oracle/README.md): let only Cloudflare reach port 443.
# Puts Cloudflare's published IP ranges into a firewalld zone "cloudflare" that allows https. The public zone keeps
# only ssh, so anyone else hitting the box's IP on 443 is dropped. Safe to re-run (it refreshes the ranges).
# Run: sudo bash deploy/oracle/cloudflare-firewall.sh
set -euo pipefail
zone=cloudflare

v4=$(curl -fsS https://www.cloudflare.com/ips-v4)
v6=$(curl -fsS https://www.cloudflare.com/ips-v6)
if [ -z "$v4" ] || [ -z "$v6" ]; then echo "could not fetch Cloudflare's IP ranges; nothing changed" >&2; exit 1; fi

firewall-cmd --permanent --get-zones | tr ' ' '\n' | grep -qx "$zone" || firewall-cmd --permanent --new-zone="$zone"
for s in $(firewall-cmd --permanent --zone="$zone" --list-sources); do
  firewall-cmd --permanent --zone="$zone" --remove-source="$s" >/dev/null
done
for s in $v4 $v6; do
  firewall-cmd --permanent --zone="$zone" --add-source="$s" >/dev/null
done
firewall-cmd --permanent --zone="$zone" --add-service=https >/dev/null
# 443 must not be open to everyone in the public zone.
firewall-cmd --permanent --zone=public --remove-service=https >/dev/null 2>&1 || true
firewall-cmd --reload >/dev/null

echo "zone $zone: $(firewall-cmd --zone="$zone" --list-sources | wc -w) Cloudflare ranges, services: $(firewall-cmd --zone="$zone" --list-services)"
echo "public zone services: $(firewall-cmd --zone=public --list-services)"
