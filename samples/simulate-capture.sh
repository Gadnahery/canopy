#!/usr/bin/env bash
# Simulate an ESP32-CAM capture: upload an image and run it through the
# live pipeline (Storage -> process-capture -> dashboard). No hardware needed.
#
#   ./simulate-capture.sh [imagePath] [deviceId]
#   defaults: samples/canopy-medium.jpg , canopy-01
#
# Reads Supabase URL + anon key from web/.env.local (nothing hardcoded).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ENVFILE="$HERE/../web/.env.local"
URL=$(grep '^VITE_SUPABASE_URL='       "$ENVFILE" | cut -d= -f2-)
ANON=$(grep '^VITE_SUPABASE_ANON_KEY=' "$ENVFILE" | cut -d= -f2-)
HOST=${URL#http*://}; HOST=${HOST%/}

IMG=${1:-"$HERE/canopy-medium.jpg"}
DEV=${2:-canopy-01}
TS=$(date +%s)
NAME=$(basename "$IMG" .jpg)
P="samples/sim-$NAME-$TS.jpg"

echo "Uploading $IMG -> $P ..."
curl -s -X POST "https://$HOST/storage/v1/object/captures/$P" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: image/jpeg" -H "x-upsert: true" --data-binary "@$IMG" >/dev/null

echo "Processing ..."
curl -s -X POST "https://$HOST/functions/v1/process-capture" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d "{\"device_id\":\"$DEV\",\"image_path\":\"$P\"}"

echo ""
echo "Done - check the dashboard."
