#!/usr/bin/env bash
# =============================================================
#  MINEKUBE STUDIOS // založení repozitáře s modpacky
#
#  Vezme obsah složky modpack-repo/ v tomhle repozitáři a založí
#  z něj samostatný repozitář MinekubeStudios/modpacky — tedy místo,
#  kam se nahrávají vydání modpacků a odkud si je bere web.
#
#  Použití:
#    ./tools/create-modpack-repo.sh                 # založí a nahraje
#    ./tools/create-modpack-repo.sh --dry-run       # jen ukáže, co udělá
#    ./tools/create-modpack-repo.sh --push-only     # repo už existuje, jen nahraje obsah
#    REPO_SLUG=MinekubeStudios/jiny-nazev ./tools/create-modpack-repo.sh
#
#  Potřebuješ gh CLI přihlášené k účtu, který smí v organizaci
#  zakládat repozitáře (Administration: write).
# =============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/modpack-repo"
SLUG="${REPO_SLUG:-MinekubeStudios/modpacky}"
BRANCH="${BRANCH:-main}"
DESCRIPTION="Oficiální úložiště Minekube modpacků a instancí. Každý modpack má vlastní vydání (mrpack + zip), web Minekube si odsud bere vždy to nejnovější."

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_BOLD=$'\033[1m'

fail() { printf '%s\n' "${C_ERR}✗ $*${C_RESET}" >&2; exit 1; }
warn() { printf '%s\n' "${C_WARN}! $*${C_RESET}" >&2; }
ok()   { printf '%s\n' "${C_OK}✓ $*${C_RESET}"; }
step() { printf '%s\n' "${C_DIM}→ $*${C_RESET}"; }

PUSH_ONLY=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push-only) PUSH_ONLY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '3,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) fail "Neznámá volba: $1" ;;
  esac
done

[[ -d "$SRC" ]] || fail "Chybí složka modpack-repo/ — není co nahrát."
command -v gh >/dev/null 2>&1 || fail "Chybí gh CLI (https://cli.github.com)."
command -v git >/dev/null 2>&1 || fail "Chybí git."
gh auth status >/dev/null 2>&1 || fail "Nejsi přihlášený v gh CLI — spusť: gh auth login"

EXISTS=0
gh repo view "$SLUG" --json name >/dev/null 2>&1 && EXISTS=1

printf '%s\n' ""
printf '%s\n' "${C_BOLD}Minekube modpacky → $SLUG${C_RESET}"
printf '%s\n' "  zdroj     : modpack-repo/"
printf '%s\n' "  branch    : $BRANCH"
printf '%s\n' "  repozitář : $([[ $EXISTS -eq 1 ]] && echo 'už existuje' || echo 'bude založen')"
printf '%s\n' ""

if [[ $PUSH_ONLY -eq 0 && $EXISTS -eq 0 ]]; then
  if [[ $DRY_RUN -eq 1 ]]; then
    step "DRY-RUN: gh repo create $SLUG --public --description …"
  else
    step "Zakládám repozitář $SLUG"
    if ! gh repo create "$SLUG" --public --description "$DESCRIPTION" --enable-issues --disable-wiki; then
      fail "$(cat <<'TEXT'
Repozitář se nepodařilo založit. Nejčastěji proto, že přihlášený účet
(nebo GitHub App v Areně) nemá právo zakládat repozitáře v organizaci.

Řešení:
  1) Založ prázdný repozitář ručně na https://github.com/organizations/MinekubeStudios/repositories/new
     (public, bez README, bez .gitignore) a pak spusť:
       ./tools/create-modpack-repo.sh --push-only
  2) Nebo povol agentovi právo „Administration: write“ a spusť skript znovu.
TEXT
)"
    fi
    ok "Repozitář založen."
  fi
fi

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

step "Kopíruji obsah modpack-repo/ do $TMP"
cp -Rp "$SRC/." "$TMP/"
rm -rf "$TMP/.git"

cd "$TMP"
git init -q -b "$BRANCH"

GIT_NAME="$(git config --global user.name || true)"
GIT_MAIL="$(git config --global user.email || true)"
[[ -n "$GIT_NAME" ]] || GIT_NAME="Minekube Studios"
[[ -n "$GIT_MAIL" ]] || GIT_MAIL="noreply@minekubestudios.cz"

git -c user.name="$GIT_NAME" -c user.email="$GIT_MAIL" add -A
git -c user.name="$GIT_NAME" -c user.email="$GIT_MAIL" commit -qm "Minekube modpacky: úložiště modpacků a instancí

Struktura: packs/<id>/pack.json + CHANGELOG.md, manifest.json (index
vydání pro web), tools/ (publikace vydání, generátor manifestu, balení
.mrpack) a .github/workflows (automatické přegenerování manifestu)."

FILES="$(git ls-files | wc -l | tr -d ' ')"
printf '%s\n' "  souborů   : $FILES"

if [[ $DRY_RUN -eq 1 ]]; then
  ok "Dry-run — do GitHubu se nic neposlalo."
  exit 0
fi

git remote add origin "https://github.com/$SLUG.git"

step "Nahrávám do $SLUG ($BRANCH)"
PUSH_OUTPUT="$(git push -u origin "$BRANCH" 2>&1)" && PUSHED=1 || PUSHED=0

if [[ $PUSHED -eq 1 ]]; then
  ok "Obsah nahrán."
else
  printf '%s\n' "${C_DIM}$(printf '%s' "$PUSH_OUTPUT" | tail -4)${C_RESET}" >&2

  # GitHub App bez práva „Workflows“ nesmí nahrát .github/workflows/* — zbytek
  # repozitáře se ale nahrát dá, takže workflowy vynecháme a upozorníme.
  if printf '%s' "$PUSH_OUTPUT" | grep -qi "workflow"; then
    warn "Instalace nemá právo „Workflows“ — nahrávám obsah bez .github/workflows/."
    git rm -rq --cached .github/workflows 2>/dev/null || true
    printf '.github/workflows/\n' >> .git/info/exclude
    git -c user.name="$GIT_NAME" -c user.email="$GIT_MAIL" commit -q --amend --no-edit

    if git push -u origin "$BRANCH" 2>/dev/null; then
      ok "Obsah nahrán (workflowy zůstaly mimo)."
      printf '%s\n' ""
      warn "Workflowy přidej ručně — soubory najdeš v modpack-repo/.github/workflows/:"
      printf '%s\n' "    manifest.yml         → automatické přegenerování manifest.json"
      printf '%s\n' "    validate-release.yml → kontrola konvencí u nového vydání"
      printf '%s\n' "  Na GitHubu: Add file → Create new file → název i obsah zkopíruj."
      printf '%s\n' "  Nebo po rozšíření práv spusť tenhle skript znovu."
      exit 0
    fi
  fi

  fail "$(cat <<TEXT
Push do $SLUG se nepovedl. Nejčastěji proto, že přihlášený účet
(nebo GitHub App v Areně) nemá k repozitáři $SLUG přístup.

Řešení:
  1) V Areně znovu připoj GitHub a v „Repository access“ zaškrtni
     i MinekubeStudios/modpacky (nebo zvol „All repositories“).
  2) Nebo na GitHubu: Settings → Applications → instalační aplikace →
     Configure → Repository access → přidat $SLUG.
  3) Pak spusť znovu: ./tools/create-modpack-repo.sh --push-only

Bez GitHubu to nahraješ i ručně —
obsah je ve složce modpack-repo/:
  cd modpack-repo && git init -b main && git add -A \\
    && git commit -m "Minekube modpacky: úložiště modpacků a instancí" \\
    && git remote add origin https://github.com/$SLUG.git \\
    && git push -u origin main
TEXT
)"
fi

printf '%s\n' ""
ok "Hotovo: https://github.com/$SLUG"
printf '%s\n' ""
printf '%s\n' "Další kroky:"
printf '%s\n' "  1) git clone https://github.com/$SLUG && cd $(basename "$SLUG")"
printf '%s\n' "  2) ./tools/make-mrpack.sh <slozka-instance> Minekube-Ultra-1.2.0.mrpack --mc 1.21.4"
printf '%s\n' "  3) ./tools/publish-release.sh ultra 1.2.0 Minekube-Ultra-1.2.0.mrpack --notes-file notas.md"
printf '%s\n' "  4) Web si nové vydání vezme sám (manifest se přegeneruje workflowem)."
