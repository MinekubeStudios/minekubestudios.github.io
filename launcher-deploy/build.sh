#!/usr/bin/env bash
# Sestaví launcher-deploy/launcher-site.tar.gz z launcher/ v tomto repu.
#
# Co to dělá:
#   1. vezme launcher/ — celou stránku (index.html, shared/, icons/,
#      wallpapers/, lpx.css, launcher.js, releases.js, i18n.js i testy),
#   2. přidá GitHub Actions workflow pro Pages a .nojekyll,
#   3. zabalí to jako launcher-site.tar.gz, který se dá rozbalit
#      a nasadit jako root nové domény.
#
# Zdroj pravdy je launcher/ v tomto repu — tam se stránka vyvíjí.
# Nový repo minekubelauncher/minekubelauncher.github.io je jeho kopie.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="launcher-deploy/launcher-site.tar.gz"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
DEST="$STAGE/launcher-site"

echo "→ sestavuji z launcher/"
mkdir -p "$DEST"
cp -r launcher/. "$DEST"/

echo "→ kopíruji testy (v novém repu běží z rootu)"
mkdir -p "$DEST/tools"
cp tools/launcher_page_test.mjs "$DEST/tools/"
# Test v hlavním repu čte cesty s prefixem launcher/; v novém repu je
# stránka v rootu, takže se prefix odstraní.
sed -i \
  -e 's|"launcher/index.html"|"index.html"|g' \
  -e 's|"launcher/lpx.css"|"lpx.css"|g' \
  -e 's|"launcher/i18n.js"|"i18n.js"|g' \
  -e 's|"launcher/releases.js"|"releases.js"|g' \
  -e 's|"launcher/launcher.js"|"launcher.js"|g' \
  -e 's|"launcher/launcher-pulse.css"|"launcher-pulse.css"|g' \
  -e 's|"launcher/shared/|"shared/|g' \
  -e 's|ROOT + "launcher/|ROOT + "|g' \
  -e 's|`launcher/wallpapers/|`wallpapers/|g' \
  -e 's|"https://minekubestudios.github.io/launcher/"|"https://minekubelauncher.github.io/"|g' \
  "$DEST/tools/launcher_page_test.mjs"

echo "→ odstraňuji testy cizích stránek (hlavní web, modpacky)"
# Test ověřuje odkazy z index.html a modpacky/index.html hlavního webu.
# Ty v novém repu nejsou, takže by test hlásil chybu, která tam nepatří.
python3 - "$DEST/tools/launcher_page_test.mjs" <<'PYFIX'
import re, sys
path = sys.argv[1]
src = open(path, encoding="utf-8").read()
start = src.find("  // Launcher musí být dosažitelný z navigace domů i z katalogu modpacků.")
if start != -1:
    end = src.find("  assert.deepEqual(page.errors, []);", start)
    if end != -1:
        src = src[:start] + """  /* Navigace na cizí stránky (hlavní web, modpacky) se testuje
     v hlavním repu — tenhle web o nich neví. */
  const selfLinks = [...document.querySelectorAll(".desktop-nav a, .mobile-nav a")]
    .filter(link => link.querySelector('[data-i18n="nav.launcher"]'));
  assert.ok(selfLinks.length >= 2, "chybí odkaz na launcher v navigaci");
  selfLinks.forEach(link => assert.equal(link.getAttribute("href"), "./"));
""" + src[end:]
        open(path, "w", encoding="utf-8").write(src)
        print("  ✓ test cizích stránek nahrazen")
PYFIX

echo "→ doplňuji GitHub Actions a .nojekyll"
mkdir -p "$DEST/.github/workflows"
cat > "$DEST/.github/workflows/pages.yml" <<'YML'
name: Deploy na GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
YML
: > "$DEST/.nojekyll"

echo "→ balím do $OUT"
tar -czf "$OUT" -C "$STAGE" launcher-site
echo "✓ hotovo: $OUT ($(du -h "$OUT" | cut -f1), $(tar -tzf "$OUT" | wc -l) položek)"
echo
echo "Dál podle launcher-deploy/JAK-NASADIT.md"
