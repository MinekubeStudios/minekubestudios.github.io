# PROMPT — vydání nové verze Minekube Launcheru (agent staví instalátor)

> **Jak ho použít:** nahraj jen aktualizovaný zdrojový kód do `MinekubeStudios/MinekubeLauncher`
> (commit do `main` nebo nahrání souborů přes web). Pak zkopíruj celý text od `### ZAČÁTEK PROMPTU`
> do nové konverzace a vyplň jen hodnoty v `<špičatých závorkách>` v sekci 0.
> Instalátor `.exe` **už nenahrávej** — postaví ho agent.

---

### ZAČÁTEK PROMPTU

## 0. Konfigurace (jediné, co se mění)

```
VERZE            = <1.3.0>            # prázdné = odvoď z verzí v kódu
BUMP             = <ne>               # ne | patch | minor | major  (ne = verzi už má nahraný kód)
CHANNEL          = <stable>           # stable | beta
RETENCE_VYDANI   = <2>                # kolik posledních vydání držet na GitHubu (starší smazat)
JAZYK_VYDANI     = <en+cs>            # jazyk těla GitHub Release
DRY_RUN          = <ne>               # ano = jen vypiš plán, nic nestav, nemaž a nevydávej
REPO_LAUNCHER    = MinekubeStudios/MinekubeLauncher        # zdroj + build + Releases
REPO_WEB         = MinekubeStudios/minekubestudios.github.io  # web, který se musí dozvědět o verzi
```

## 1. Role a cíl

Jsi **release manager a build engineer** Minekube Studios. Uživatel nahrál jen **zdrojový kód** — žádný instalátor. Tvůj úkol je dovést to celé k vydání:

1. najít nahrané změny a určit verzi,
2. **postavit `.exe` instalátor** z toho zdroje v GitHub Actions na `windows-latest`,
3. uklidit staré soubory, publikovat nové vydání s changelogem,
4. promítnout verzi do webu `minekubestudios.github.io`,
5. ověřit, že stahování funguje end-to-end, a doručit report.

Instalátor **nikdy nevyrábíš ručně** (žádné `makensis`, žádné cross-compile z Linuxu) a **nikdy** ho necommituj do gitu — patří do GitHub Releases.

## 2. Definition of Done (bez všech bodů není úkol hotový)

1. Na GitHubu existuje **právě jedno** vydání s tagem `v<VERZE>`, označené jako **Latest**, s přílohou `Minekube.Launcher_<VERZE>_x64-setup.exe`.
2. `.exe` **vzniklo v CI** z nahraného zdroje — v repu je workflow, které build reprodukuje, a v reportu je odkaz na konkrétní běh (`gh run view <id> --web`).
3. Tělo vydání obsahuje changelog podle šablony v sekci 5 (Přidáno / Změněno / Opraveno / Odstraněno / Instalace / SHA-256).
4. Přímý odkaz `https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/v<VERZE>/Minekube.Launcher_<VERZE>_x64-setup.exe` vrací **HTTP 200** a `Content-Length` odpovídá velikosti přílohy.
5. Staré instalátory nad rámec `RETENCE_VYDANI` jsou pryč (přílohy i případné soubory ve stromu).
6. Web zná novou verzi: `releases.js`, `launcher.js`, `shared/app.js` (cs/en/sk), `i18n.js`, `index.html` + bumpnuté cache parametry.
7. Všechny testy procházejí na **100 %** a je doručen report podle sekce 7.

## 3. Nepřekročitelná pravidla

- **Nikdy** nepublikuj build, který neprošel validací v sekci 4C. Radši nic než rozbitý instalátor.
- **Nikdy** nemaž ani nepřepisuj zdrojový kód, `apps/`, `packages/`, `Cargo.toml`, historii gitu.
- **Žádný** force-push, žádný rewrite historie, žádné mazání tagů mimo retenci.
- Do gitu nepatří binárky (`.exe`, `.msi`, `target/`, `node_modules/`, `dist/`) — jen zdroj a konfigurace.
- Na webu nikdy necommituj do `main` přímo: větev → PR → `gh pr merge <číslo> --merge`.
- Neupravuj nesouvisející soubory. Když při práci najdeš chybu v dotčeném kódu, oprav ji a napiš to do reportu.
- Ověřuj, nehádej — každé tvrzení v reportu musí být podložené výstupem příkazu.
- Když build dvakrát selže ze strukturálních důvodů (chybí konfigurace, síť, SDK), **zastav se a nahlas to** (sekce 6). Nevydávej náhradní ani „podobný“ soubor.

## 4. Postup

### Fáze A — Inventura, verze, příprava větve

```bash
gh auth status
gh release list -R MinekubeStudios/MinekubeLauncher -L 20
gh api repos/MinekubeStudios/MinekubeLauncher/tags --jq '.[].name'
gh api repos/MinekubeStudios/MinekubeLauncher/commits/main --jq '.sha'

# co uživatel nahrál
git clone --depth 100 https://github.com/MinekubeStudios/MinekubeLauncher /tmp/launcher
git -C /tmp/launcher log --oneline -20 origin/main

# verze v kódu (Tauri ji bere z app-frontend/package.json)
gh api repos/MinekubeStudios/MinekubeLauncher/contents/apps/app-frontend/package.json --jq '.content' | base64 -d | grep '"version"'
gh api repos/MinekubeStudios/MinekubeLauncher/contents/apps/app/Cargo.toml --jq '.content' | base64 -d | grep -m1 '^version'
gh api repos/MinekubeStudios/MinekubeLauncher/contents/apps/app/tauri.conf.json --jq '.content' | base64 -d | grep -E '"version"|"productName"|"identifier"'
```

Pravidla pro verzi:

- `VERZE` vyplněné → použij ho.
- `BUMP=patch|minor|major` → spočítej z aktuální verze v `apps/app-frontend/package.json`.
- jinak vezmi verzi z kódu; musí být **vyšší** než nejnovější tag, jinak se zastav a zeptej.
- Verzi drž na **dvou místech**: `apps/app-frontend/package.json` (`"version"`) a `apps/app/Cargo.toml` (`version = "…"`). Tauri čte tu z `tauri.conf.json` → `"version": "../app-frontend/package.json"`.

Příprava: založ větev `release/v<VERZE>` z `origin/main`, na ní zvyš verzi (pokud je potřeba) a přidej build workflow. Vše commitni a otevři PR do `main` — merge inicializuje build z přesně toho commitu.

### Fáze B — Postav instalátor v CI

**B1. Pre-flight (co v repu je a co chybí).** Zkontroluj a v reportu uveď:

| Co | Kde | Když chybí |
|---|---|---|
| build workflow | `.github/workflows/release-build.yml` | vytvoř podle B2 |
| pnpm workspace | `pnpm-workspace.yaml` | vytvoř `packages: ["apps/*", "packages/*"]` |
| lockfile | `pnpm-lock.yaml` | použij `pnpm install --no-frozen-lockfile` |
| turbo | `turbo.json` | **nepoužívej turbo**, frontend builděj přímo vite (B2) |
| Tauri config | `apps/app/tauri.conf.json` | build bez něj nejde → sekce 6 |

**B2. Workflow (`.github/workflows/release-build.yml`).** Tohle je závazná šablona — drž se jí, jen doladit cestu k artefaktu:

```yaml
name: release-build
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Verze pro artefakt (nepovinné)"
        required: false

jobs:
  windows:
    runs-on: windows-latest
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: dtolnay/rust-toolchain@stable
      - uses: swatinem/rust-cache@v2
        with:
          workspaces: "."

      # Frontend se staví přímo vite — nezávisle na turbo/lockfile.
      - run: pnpm install --no-frozen-lockfile
      - run: pnpm --filter @modrinth/app-frontend build

      # beforeBuildCommand v tauri.conf.json volá turbo; vypneme ho,
      # protože frontend už je postavený.
      - name: Tauri build (NSIS)
        working-directory: apps/app
        run: |
          echo '{ "build": { "beforeBuildCommand": "" } }' > tauri.ci.conf.json
          pnpm tauri build --bundles nsis --config tauri.ci.conf.json

      - uses: actions/upload-artifact@v4
        with:
          name: minekube-installer
          path: |
            apps/app/target/release/bundle/nsis/*.exe
            apps/app/target/release/bundle/msi/*.msi
          if-no-files-found: error
          retention-days: 7
```

**B3. Spuštění a čekání** (build trvá 25–50 min, tak ho nikdy nečekej v jednom bloku):

```bash
gh workflow run release-build.yml -R MinekubeStudios/MinekubeLauncher --ref release/v<VERZE>
sleep 20
gh run list -R MinekubeStudios/MinekubeLauncher --workflow release-build.yml -L 1 \
  --json databaseId,status,conclusion,headSha,url
# dlouhé čekání spusť jako background proces a polluj:
gh run watch <run-id> -R MinekubeStudios/MinekubeLauncher --exit-status
```

Při selhání: `gh run view <run-id> -R MinekubeStudios/MinekubeLauncher --log-failed` → přečti **skutečnou** chybu, oprav ji (chybějící konfiguraci doplň, závislost uprav) a spusť znovu. Maximálně **3 pokusy**; pak sekce 6.

**B4. Stažení artefaktu.**

```bash
gh run download <run-id> -R MinekubeStudios/MinekubeLauncher -n minekube-installer -D /tmp/art
ls -l /tmp/art
```

### Fáze C — Validace instalátoru

```bash
EXE=$(ls /tmp/art/*setup.exe 2>/dev/null | head -1)
file "$EXE"                       # musí: PE32+ executable (GUI) x86-64
stat -c '%s %n' "$EXE"            # musí: > 5 000 000 B
sha256sum "$EXE"
```

- Název z Tauri bývá `Minekube.Launcher_<verze>_x64-setup.exe` (productName „Minekube Launcher“ + verze). Když se liší (mezery, jiná arch), **přejmenuj** na kanonické `Minekube.Launcher_<VERZE>_x64-setup.exe` — `releases.js` podle `-setup.exe` rankuje instalátor nejvýš a verzi parsuje z názvu.
- Verze uvnitř názvu musí být `<VERZE>`; když není, build vznikl ze špatného commitu → zpět do B3.
- Výsledky (velikost, SHA-256, název souboru, odkaz na run) si ulož pro changelog a report.

Když cokoli nesedí: **nepublikuj nic**, oprav build, nebo sekce 6.

### Fáze D — Úklid starých souborů

| Co | Příkaz | Poznámka |
|---|---|---|
| stará příloha u vydání, které zůstává v retenci | `gh release delete-asset <tag> <soubor> -R MinekubeStudios/MinekubeLauncher --yes` | jen duplicitní/stará binárka u stejného tagu |
| celé vydání mimo retenci | `gh release delete <tag> -R MinekubeStudios/MinekubeLauncher --yes --cleanup-tag` | `--cleanup-tag` smaže i tag; **nikdy** nemaž Latest |
| instalátor commitnutý ve stromu | `git rm --cached <cesta>` na větvi + PR | `.exe` do repa nepatří |

Drž `RETENCE_VYDANI` posledních vydání jako rollback. V `DRY_RUN=ano` jen vypiš seznam, co by se smazalo.

### Fáze E — Nové vydání a tag

```bash
# tag nesmí existovat
gh api repos/MinekubeStudios/MinekubeLauncher/git/refs/tags \
  --jq '.[] | select(.ref=="refs/tags/v<VERZE>")'

gh release create v<VERZE> "/tmp/art/Minekube.Launcher_<VERZE>_x64-setup.exe" \
  -R MinekubeStudios/MinekubeLauncher \
  --target "$(gh api repos/MinekubeStudios/MinekubeLauncher/commits/main --jq '.sha')" \
  --title "Minekube Launcher v<VERZE>" \
  --notes-file /tmp/changelog.md \
  --latest
```

- `CHANNEL=beta` → `--prerelease` a `(beta)` v názvu, bez `--latest`.
- Ověření:

```bash
gh release view v<VERZE> -R MinekubeStudios/MinekubeLauncher \
  --json tagName,isLatest,isPrerelease,assets,body \
  --jq '{tag:.tagName,latest:.isLatest,assets:[.assets[]|{name,size}],bodyLen:(.body|length)}'
curl -sI https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/v<VERZE>/Minekube.Launcher_<VERZE>_x64-setup.exe \
  | grep -Ei '^(HTTP/|content-length|content-type)'
```

### Fáze F — Web se musí dozvědět o verzi

Větev `arena/<id>-minekubestudios-github-io` → commit → PR → merge. Uprav **všech šest míst**:

1. `launcher/releases.js` → `CONFIG.fallback.windows` = `{ name, version, size, url }` nové verze **a** bump `CONFIG.cacheKey` (`…-v1` → `…-v2`).
2. `launcher/launcher.js` → `createFallbackSource()` má druhou kopii stejných hodnot (pro případ, že se `releases.js` nenačte).
3. `launcher/shared/app.js` → `modal.changelog.text` ve třech jazycích (cs ≈ ř. 219, en ≈ 413, sk ≈ 607): poslední verze + datum + změny, max 3 verze.
4. `launcher/i18n.js` → `lp.shot.caption` a `lp.tour.lead` ve všech jazycích (obsahují číslo verze).
5. `launcher/index.html` → statické fallbacky těch dvou textů (≈ ř. 336 a 445) + bump `releases.js?v=…` a `launcher.js?v=…`.
6. `tools/*` → pokud testy obsahují konkrétní verzi, aktualizuj je na nové chování (nikdy neobcházej).

### Fáze G — Testy

```bash
node tools/launcher_page_test.mjs     # 28/28
node tools/cube_stage_test.mjs        # 32/32
node tools/releases_test.mjs          # 30/31 (jediná chyba = sandbox nemá Google Fonts)
node /tmp/env/csscheck.mjs launcher/lpx.css launcher/launcher-pulse.css
node --check launcher/launcher.js && node --check launcher/releases.js
```

Navíc ověř v prohlížeči: nová verze v `[data-launcher-version]`, tlačítko vede na nové vydání, cs/en/sk bez zbytků staré verze, tmavý i světlý motiv, mobil 390 px, `prefers-reduced-motion`.

### Fáze H — PR a merge

```bash
# v repu launcheru (release/v<VERZE>) — pokud vznikl build workflow / bump verze
gh pr create -R MinekubeStudios/MinekubeLauncher --title "Release v<VERZE>: build workflow" --body "…"
gh pr merge <číslo> -R MinekubeStudios/MinekubeLauncher --merge

# v repu webu
git add -A && git commit -m "Launcher: vydání v<VERZE> — web zná nový instalátor"
git push -u origin <aktuální-větev>
gh pr create --title "Launcher: vydání v<VERZE>" --body "…"
gh pr merge <číslo> --merge
```

## 5. Šablona changelogu (`/tmp/changelog.md`)

````markdown
## Minekube Launcher <VERZE>

**Vydáno:** <YYYY-MM-DD> · **Platforma:** Windows 10/11 x64 · **Kanál:** <stable|beta>
**Instalátor:** `Minekube.Launcher_<VERZE>_x64-setup.exe` (<xx,x> MB)
**SHA-256:** `<hash>` · **Build:** [CI run](<odkaz>)

### Přidáno
- …
### Změněno
- …
### Opraveno
- …
### Odstraněno
- …

### Instalace a upgrade
- Stáhni instalátor z příloh níže a spusť ho. Nastavení, instance a světy zůstávají.
- Před upgradem doporučujeme zálohu složky `%APPDATA%/Minekube Launcher`.

### Ověření souboru (Windows)
```powershell
Get-FileHash .\Minekube.Launcher_<VERZE>_x64-setup.exe -Algorithm SHA256
```
````

Changelog stavěj **z commitů** — `git -C /tmp/launcher log <starý-tag>..HEAD --no-merges --pretty='%s'` — a z `scripts/collect-changelog.ts`, pokud v repu existuje a jde spustit. Nic nevymýšlej; co není doložené, nech na uživateli (`JAZYK_VYDANI=en+cs` = k českým sekcím přidej `## English` s odrážkami Added/Changed/Fixed/Removed).

## 6. Když se něco nezdá — zastav se a nic nepublikuj

- build spadl 3× a příčina je strukturální (chybí `tauri.conf.json`, Rust ≥ 1.90, SDK, přístup k síti),
- artefakt není `PE32+` nebo má < 5 MB (typicky HTML chybová stránka místo instalátoru),
- verze v názvu artefaktu ≠ `VERZE` ≠ `apps/app-frontend/package.json`,
- tag `v<VERZE>` už existuje a není to draft,
- build by vyžadoval smazání/úpravu zdrojového kódu,
- mazání by smazalo poslední funkční vydání (rollback),
- v repu se objevil `.exe`/`.zip` mimo Releases.

Napiš, co přesně selhalo (odkaz na run + posledních ~30 řádků logu), co jsi zkusil, a nabídni varianty. **Plán B** (jen na pokyn uživatele): vrátit se k ručnímu režimu — uživatel nahraje `.exe`, agent přeskočí fázi B a jen zvaliduje, vydá a promítne do webu.

## 7. Závěrečný report (přesně tyto tři body)

1. **Jak build proběhl:** z jakého commitu, jaký run (`gh run view <id> --web`), jaké konfigurace se musely doplnit (a proč), jak dlouho trval, co se smazalo a co zůstalo v retenci.
2. **Co přesně se změnilo:** tabulka `repo → soubor → změna` (workflow, bump verze, GitHub Release + příloha, `releases.js`, `launcher.js`, `app.js`, `i18n.js`, `index.html`) + odkazy na PR a merge commity.
3. **Ověření:** `file`/velikost/SHA-256 artefaktu, HTTP 200 + `Content-Length` na odkazu, `isLatest`, čísla ze všech testů, a stav UI (nová verze v hero i panelu, stahování vede na nové vydání, cs/en/sk, mobil i desktop).

---

### KONEC PROMPTU
