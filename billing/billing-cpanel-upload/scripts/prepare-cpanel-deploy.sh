#!/usr/bin/env bash
# Prepare billing app for cPanel upload (billing-mithras)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/billing-cpanel-upload"
ZIP="$ROOT/billing-cpanel-upload.zip"

echo "==> Installing Composer dependencies..."
cd "$ROOT"
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Building upload folder..."
rm -rf "$OUT" "$ZIP"
mkdir -p "$OUT"

rsync -a \
  --exclude 'billing-cpanel-upload' \
  --exclude 'billing-cpanel-upload.zip' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'node_modules' \
  "$ROOT/" "$OUT/"

cp "$ROOT/.env.cpanel.example" "$OUT/.env.example"
cp "$ROOT/UPLOAD_TO_CPANEL.txt" "$OUT/READ_ME_FIRST.txt"

echo "==> Creating zip..."
cd "$ROOT"
zip -rq billing-cpanel-upload.zip billing-cpanel-upload

echo ""
echo "Done!"
echo "  Folder: $OUT"
echo "  Zip:    $ZIP"
echo ""
echo "Upload billing-cpanel-upload.zip to cPanel File Manager,"
echo "extract into public_html/billing-mithras/, then follow READ_ME_FIRST.txt"
