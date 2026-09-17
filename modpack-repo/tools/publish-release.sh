#!/usr/bin/env bash
# =============================================================
#  MINEKUBE STUDIOS // modpacky — publikace vydání balíčku
#
#  Založí (nebo doplní) GitHub Release s tagem <pack-id>-v<verze>,
#  nahraje soubory .mrpack / .zip, doplní chybějící .sha256 a na
#  konci spustí workflow, který přegeneruje manifest.json.
#
#  Použití:
#    ./tools/publish-release.sh <pack-id> <verze> <soubor> [<soubor>…] [volby]
#
#  Příklad:
#    ./tools/publish-release.sh ultra 1.2.0 \
#      Minekube-Ultra-1.2.0.mrpack Minekube-Ultra-1.2.0.zip \
#      --notes-file notas-1.2.0.md
#
#  Volby:
#    --title "…"        titulek vydání (výchozí „<Název> <verze>“)
#    --notes "…"        popis vydání (changelog pro hráče)
#    --notes-file cesta popis vydání ze souboru
#    --prerelease       označit jako betu (web preferuje stabilní vydání)
#    --latest           označit jako „Latest“ v rámci celého repa (jinak ne)
#    --no-manifest      nespouštět workflow Aktualizovat manifest
#    --dry-run          jen vypsat, co by se stalo
# =============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_BOLD=$'\033[1m'

fail() { printf '%s\n' "${C_ERR}✗ $*${C_RESET}" >&2; exit 1; }
warn() { printf '%s\n' "${C_WARN}! $*${C_RESET}" >&2; }
ok()   { printf '%s\n' "${C_OK}✓ $*${C_RESET}"; }
step() { printf '%s\n' "${C_DIM}→ $*${C_RESET}"; }

usage() {
  sed -n '3,28p' "$ROOT/tools/publish-release.sh" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

[[ $# -ge 1 ]] || usage 1
case "$1" in -h|--help) usage 0 ;; esac

PACK_ID="$1"; shift
[[ $# -ge 1 ]] || { warn "Chybí verze."; usage 1; }
VERSION="$1"; shift

FILES=()
TITLE=""
NOTES=""
NOTES_FILE=""
PRERELEASE=0
MARK_LATEST=0
RUN_MANIFEST=1
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title) TITLE="${2:-}"; shift 2 ;;
    --notes) NOTES="${2:-}"; shift 2 ;;
    --notes-file) NOTES_FILE="${2:-}"; shift 2 ;;
    --prerelease) PRERELEASE=1; shift ;;
    --latest) MARK_LATEST=1; shift ;;
    --no-manifest) RUN_MANIFEST=0; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage 0 ;;
    -*) fail "Neznámá volba: $1" ;;
    *) FILES+=("$1"); shift ;;
  esac
done

command -v gh >/dev/null 2>&1 || fail "Chybí gh CLI (https://cli.github.com)."
gh auth status >/dev/null 2>&1 || fail "Nejsi přihlášený v gh CLI — spusť: gh auth login"

PACK_FILE="packs/$PACK_ID/pack.json"
[[ -f "$PACK_FILE" ]] || fail "Balíček „$PACK_ID“ neexistuje ($PACK_FILE). Dostupné: $(ls packs | tr '\n' ' ')"

PACK_NAME="$(node -e "process.stdout.write(require('./$PACK_FILE').name || '$PACK_ID')")"
TAG="${PACK_ID}-v${VERSION}"
[[ -n "$TITLE" ]] || TITLE="${PACK_NAME} ${VERSION}"

[[ ${#FILES[@]} -gt 0 ]] || fail "Není co nahrát — přidej aspoň jeden soubor (.mrpack nebo .zip)."

REPO_SLUG="${REPO_SLUG:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}"
[[ -n "$REPO_SLUG" ]] || fail "Nepodařilo se zjistit repozitář (git remote / gh)."

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  else shasum -a 256 "$1" | awk '{print $1}'; fi
}

UPLOADS=()
for file in "${FILES[@]}"; do
  [[ -f "$file" ]] || fail "Soubor „$file“ neexistuje."
  [[ -s "$file" ]] || fail "Soubor „$file“ je prázdný."
  UPLOADS+=("$file")

  case "$file" in
    *.mrpack|*.zip)
      sidecar="${file}.sha256"
      if [[ ! -f "$sidecar" ]]; then
        step "Počítám SHA-256 pro $file"
        if [[ $DRY_RUN -eq 0 ]]; then
          printf '%s  %s\n' "$(sha256_of "$file")" "$(basename "$file")" > "$sidecar"
        fi
      fi
      UPLOADS+=("$sidecar")
      ;;
  esac
done

printf '%s\n' ""
printf '%s\n' "${C_BOLD}Minekube release${C_RESET} · ${PACK_NAME} ${VERSION}"
printf '%s\n' "  repozitář : $REPO_SLUG"
printf '%s\n' "  tag       : $TAG"
printf '%s\n' "  kanál     : $([[ $PRERELEASE -eq 1 ]] && echo beta || echo stabilní)"
printf '%s\n' "  soubory   :"
for file in "${UPLOADS[@]}"; do printf '%s\n' "    · $file ($(du -h "$file" | cut -f1))"; done
printf '%s\n' ""

if [[ $DRY_RUN -eq 1 ]]; then
  ok "Dry-run — nic se neodeslalo."
  exit 0
fi

NOTES_ARGS=()
if [[ -n "$NOTES_FILE" ]]; then
  [[ -f "$NOTES_FILE" ]] || fail "Soubor s popisem „$NOTES_FILE“ neexistuje."
  NOTES_ARGS=(--notes-file "$NOTES_FILE")
elif [[ -n "$NOTES" ]]; then
  NOTES_ARGS=(--notes "$NOTES")
else
  warn "Bez --notes / --notes-file — popis vydání bude prázdný (hráči v detailu balíčku nic neuvidí)."
  NOTES_ARGS=(--notes "")
fi

if gh release view "$TAG" --repo "$REPO_SLUG" >/dev/null 2>&1; then
  step "Vydání $TAG už existuje — nahrávám soubory (přepisuji starší verze stejných jmen)."
  gh release upload "$TAG" "${UPLOADS[@]}" --repo "$REPO_SLUG" --clobber
  ok "Soubory aktualizovány."
else
  step "Zakládám vydání $TAG"
  gh release create "$TAG" "${UPLOADS[@]}" \
    --repo "$REPO_SLUG" \
    --title "$TITLE" \
    "${NOTES_ARGS[@]}" \
    $([[ $PRERELEASE -eq 1 ]] && echo --prerelease) \
    $([[ $MARK_LATEST -eq 1 ]] && echo --latest || echo --latest=false)
  ok "Vydání publikováno."
fi

printf '%s\n' "  stránka   : $(gh release view "$TAG" --repo "$REPO_SLUG" --json url -q .url 2>/dev/null || echo "https://github.com/$REPO_SLUG/releases/tag/$TAG")"

if [[ $RUN_MANIFEST -eq 1 ]]; then
  if gh workflow run manifest.yml --repo "$REPO_SLUG" >/dev/null 2>&1; then
    ok "Spuštěn workflow „Aktualizovat manifest“ — web uvidí vydání do minuty."
  else
    warn "Workflow se nepodařilo spustit. Přegeneruj manifest ručně:"
    printf '%s\n' "    GITHUB_TOKEN=\$(gh auth token) node tools/build-manifest.mjs && git commit -am 'manifest' && git push"
  fi
fi
