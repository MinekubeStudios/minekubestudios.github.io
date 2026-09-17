#!/usr/bin/env bash
# =============================================================
#  MINEKUBE STUDIOS // modpacky — zabalení instance do .mrpack
#
#  Vezme složku instance (to, co má hráč v .minecraft) a zabalí ji
#  do formátu .mrpack (Modrinth), který umí naimportovat Prism
#  Launcher, ATLauncher, MultiMC i Modrinth App.
#
#  Když složka obsahuje vlastní modrinth.index.json, použije se beze
#  změny. Jinak se vygeneruje jednoduchý index (vše jako „overrides“).
#
#  Použití:
#    ./tools/make-mrpack.sh <slozka-instance> <vystup.mrpack> [volby]
#
#  Příklad:
#    ./tools/make-mrpack.sh ~/instances/minekube-ultra Minekube-Ultra-1.2.0.mrpack \
#      --name "Minekube Ultra" --version-id 1.2.0 --mc 1.21.4 --loader fabric \
#      --loader-version 0.16.14 --summary "Maximum FPS pro moderní sestavy."
#
#  Volby:
#    --name "…"            název instance (výchozí: název složky)
#    --version-id "…"      verze instance (výchozí: dnešní datum)
#    --mc "1.21.4"         verze Minecraftu
#    --loader fabric|neoforge|forge|quilt   (výchozí: fabric)
#    --loader-version "…"  verze loaderu
#    --summary "…"         krátký popis instance
#    --all                 nezahazovat nic (logy, savy, nastavení účtu)
#    --force               přepsat existující výstupní soubor
# =============================================================

set -euo pipefail

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_BOLD=$'\033[1m'

fail() { printf '%s\n' "${C_ERR}✗ $*${C_RESET}" >&2; exit 1; }
warn() { printf '%s\n' "${C_WARN}! $*${C_RESET}" >&2; }
ok()   { printf '%s\n' "${C_OK}✓ $*${C_RESET}"; }
step() { printf '%s\n' "${C_DIM}→ $*${C_RESET}"; }

usage() {
  sed -n '3,31p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

[[ $# -ge 2 ]] || usage 1
case "${1:-}" in -h|--help) usage 0 ;; esac

SRC="${1%/}"; shift
OUT="$1"; shift

[[ -d "$SRC" ]] || fail "Složka instance „$SRC“ neexistuje."
[[ -n "$OUT" ]] || fail "Chybí cesta k výstupnímu souboru."
[[ "$OUT" == *.mrpack ]] || warn "Výstup nekončí na .mrpack — doporučuju příponu .mrpack."

NAME=""; VERSION_ID=""; MC=""; LOADER="fabric"; LOADER_VERSION=""; SUMMARY=""
KEEP_ALL=0; FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="${2:-}"; shift 2 ;;
    --version-id) VERSION_ID="${2:-}"; shift 2 ;;
    --mc) MC="${2:-}"; shift 2 ;;
    --loader) LOADER="${2:-}"; shift 2 ;;
    --loader-version) LOADER_VERSION="${2:-}"; shift 2 ;;
    --summary) SUMMARY="${2:-}"; shift 2 ;;
    --all) KEEP_ALL=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage 0 ;;
    *) fail "Neznámá volba: $1" ;;
  esac
done

[[ -n "$NAME" ]] || NAME="$(basename "$SRC")"
[[ -n "$VERSION_ID" ]] || VERSION_ID="$(date +%Y.%m.%d)"

case "$LOADER" in
  fabric|quilt) DEP_KEY="${LOADER}-loader" ;;
  neoforge|forge|neo) DEP_KEY="neoforge"; LOADER="neoforge" ;;
  vanilla|none) DEP_KEY="" ;;
  *) fail "Neznámý loader „$LOADER“ (použij fabric, neoforge, forge, quilt nebo vanilla)." ;;
esac

OUT_DIR="$(cd "$(dirname "$OUT")" && pwd)"
OUT_ABS="$OUT_DIR/$(basename "$OUT")"
[[ -f "$OUT_ABS" && $FORCE -eq 0 ]] && fail "Soubor $OUT_ABS už existuje (použij --force)."

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/overrides"

# ---- 1) index -------------------------------------------------------------
if [[ -f "$SRC/modrinth.index.json" ]]; then
  step "Používám existující modrinth.index.json ze složky instance."
  cp "$SRC/modrinth.index.json" "$TMP/modrinth.index.json"
else
  command -v node >/dev/null 2>&1 || fail "Pro vygenerování modrinth.index.json potřebuju Node 18+."
  step "Generuji modrinth.index.json (verze $VERSION_ID)"

  NAME="$NAME" VERSION_ID="$VERSION_ID" MC="$MC" SUMMARY="$SUMMARY" \
  DEP_KEY="$DEP_KEY" LOADER_VERSION="$LOADER_VERSION" \
  node -e '
    const out = {
      formatVersion: 1,
      game: "minecraft",
      versionId: process.env.VERSION_ID,
      name: `${process.env.NAME} ${process.env.VERSION_ID}`,
      summary: process.env.SUMMARY || undefined,
      files: [],
      dependencies: {}
    };
    if (process.env.MC) out.dependencies.minecraft = process.env.MC;
    if (process.env.DEP_KEY && process.env.LOADER_VERSION) {
      out.dependencies[process.env.DEP_KEY] = process.env.LOADER_VERSION;
    }
    require("fs").writeFileSync(process.argv[1], JSON.stringify(out, null, 2) + "\n");
  ' "$TMP/modrinth.index.json"
fi

# ---- 2) obsah instance do overrides/ -------------------------------------
step "Kopíruji obsah instance do overrides/"
( cd "$SRC" && find . -mindepth 1 -maxdepth 1 ! -name 'modrinth.index.json' -exec cp -R {} "$TMP/overrides/" \; )

if [[ $KEEP_ALL -eq 0 ]]; then
  step "Zahazuji osobní a diagnostické soubory (použij --all pro zachování)"
  for junk in logs crash-reports backups saves screenshots .git .mixin.out debug; do
    rm -rf "$TMP/overrides/$junk"
  done
  find "$TMP/overrides" -name '*.log' -type f -delete 2>/dev/null || true
  find "$TMP/overrides" -name '.DS_Store' -type f -delete 2>/dev/null || true
  for personal in servers.dat usercache.json usernamecache.json launcher_accounts.json \
                  launcher_profiles.json launcher_profiles_microsoft_store.json realms_persistence.json; do
    rm -f "$TMP/overrides/$personal"
  done
fi

# ---- 3) zabalení ----------------------------------------------------------
step "Balím do $OUT_ABS"
if command -v zip >/dev/null 2>&1; then
  ( cd "$TMP" && zip -rX -9 -q "$OUT_ABS" modrinth.index.json overrides -x '*.DS_Store' )
else
  warn "Chybí zip — použiju python3."
  command -v python3 >/dev/null 2>&1 || fail "Potřebuju zip nebo python3."
  ( cd "$TMP" && python3 - "$OUT_ABS" <<'PY'
import os, sys, zipfile
with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as archive:
    for root, _dirs, files in os.walk("."):
        for name in files:
            path = os.path.join(root, name)
            archive.write(path, os.path.relpath(path, "."))
PY
  )
fi

[[ -s "$OUT_ABS" ]] || fail "Balíček se nepodařilo vytvořit."

# ---- 4) checksum + souhrn -------------------------------------------------
if command -v sha256sum >/dev/null 2>&1; then SUM="$(sha256sum "$OUT_ABS" | awk '{print $1}')"
else SUM="$(shasum -a 256 "$OUT_ABS" | awk '{print $1}')"; fi
printf '%s  %s\n' "$SUM" "$(basename "$OUT_ABS")" > "$OUT_ABS.sha256"

ENTRIES="?"
command -v unzip >/dev/null 2>&1 && ENTRIES="$(unzip -l "$OUT_ABS" | tail -1 | awk '{print $2}')"

printf '%s\n' ""
printf '%s\n' "${C_BOLD}$(basename "$OUT_ABS")${C_RESET}"
printf '%s\n' "  velikost : $(du -h "$OUT_ABS" | cut -f1)"
printf '%s\n' "  souborů  : $ENTRIES"
printf '%s\n' "  sha256   : $SUM"
printf '%s\n' ""
ok "Hotovo. Nahraj ho do repa:"
printf '%s\n' "    ./tools/publish-release.sh <pack-id> <verze> \"$OUT_ABS\" \"$OUT_ABS.sha256\" --notes-file notas.md"
