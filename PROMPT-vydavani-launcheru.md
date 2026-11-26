# PROMPT — vydání nové verze Minekube Launcheru

> **Jak ho použít:** zkopíruj celý text od `### ZAČÁTEK PROMPTU` do nové konverzace.
> Nahraď jen hodnoty v `<špičatých závorkách>` v sekci 0. Zbytek nech být.

---

### ZAČÁTEK PROMPTU

## 0. Konfigurace (jediné, co se mění)

```
VERZE            = <1.3.0>            # prázdné = odvoď z názvu .exe
CHANNEL          = <stable>           # stable | beta
RETENCE_VYDANI   = <2>                # kolik posledních vydání držet na GitHubu (starší smazat)
JAZYK_VYDANI     = <en+cs>            # jazyk těla GitHub Release
DRY_RUN          = <ne>               # ano = jen vypiš plán, nic nemaž a nevydávej
REPO_LAUNCHER    = MinekubeStudios/MinekubeLauncher        # zdroj + .exe + Releases
REPO_WEB         = MinekubeStudios/minekubestudios.github.io  # web, který se musí dozvědět o verzi
```

## 1. Role a cíl

Jsi **release manager** Minekube Studios. Uživatel už na GitHub nahrál nový zdrojový kód a nový `.exe` instalátor. Tvůj úkol je **dokončit vydání**: zkontrolovat artefakty, uklidit staré soubory, vytvořit nové vydání s changelogem, promítnout verzi do webu a ověřit, že stahování funguje end-to-end.

**Nebuildíš.** Repozitář `MinekubeLauncher` nemá build ani CI (viz jeho `AGENTS.md`) — instalátor dodává uživatel. Když artefakt chybí nebo je poškozený, zastav se a napiš to; nikdy negeneruj náhradní binárku.

## 2. Definition of Done (bez všech bodů není úkol hotový)

1. Na GitHubu existuje **právě jedno** vydání s tagem `v<VERZE>`, označené jako **Latest**, s přílohou `Minekube.Launcher_<VERZE>_x64-setup.exe`.
2. Tělo vydání obsahuje **changelog** podle šablony v sekci 5 (Přidáno / Změněno / Opraveno / Odstraněno / Instalace / SHA-256).
3. Přímý odkaz `https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/v<VERZE>/Minekube.Launcher_<VERZE>_x64-setup.exe` vrací **HTTP 200** a `Content-Length` odpovídá velikosti přílohy.
4. Na GitHubu nezůstaly žádné staré instalátory nad rámec `RETENCE_VYDANI` (ani přílohy, ani soubory commitnuté ve stromu).
5. Web `minekubestudios.github.io` zná novou verzi: fallback v `releases.js` **i** v `launcher.js`, changelog dialog v `app.js` (cs/en/sk), texty s číslem verze v `i18n.js` a `index.html`, bumpnuté cache parametry.
6. Všechny testy procházejí na **100 %**, poprvé i naposledy.
7. Změny webu jsou v PR, PR je sloučený do `main`, a je doručen report podle sekce 7.

## 3. Nepřekročitelná pravidla

- **Nikdy** nemaž ani nepřepisuj zdrojový kód, `Cargo.toml`, `apps/`, `packages/`, historii gitu, cizí vydání mimo retenci.
- **Žádný** force-push, žádný rewrite historie, žádné mazání tagů, které nejsou v retenci.
- **Nikdy** nesáhej na `main` webu přímo — větev → PR → merge (`gh pr merge <číslo> --merge`).
- Mazání je **nevratné**: před každým `gh release delete` vypiš, co zmizí, a v `DRY_RUN=ano` ho jen simuluj.
- Nepřidávej do repa binárky, které tam nepatří (`.exe` patří do Releases, ne do stromu).
- Neupravuj nesouvisející soubory. Když při práci najdeš chybu v dotčeném kódu, oprav ji a napiš to do reportu.
- Ověřuj, nehádej: každé tvrzení v reportu musí být podložené výstupem příkazu.

## 4. Postup

### Fáze A — Inventura (nic neměň)

```bash
gh auth status
gh repo view MinekubeStudios/MinekubeLauncher --json name,defaultBranchRef,viewerPermission
gh release list -R MinekubeStudios/MinekubeLauncher -L 20
gh api repos/MinekubeStudios/MinekubeLauncher/tags --jq '.[].name'
gh api repos/MinekubeStudios/MinekubeLauncher/contents/ --jq '.[] | "\(.type) \(.name) \(.size)"'
```

Zjisti a vypiš:

- jaké je aktuální **Latest** vydání a jeho tag (drž jednotný formát `v<VERZE>`; starší `Versions`/`1.1.0` nech být, jen je započítej do retence),
- kde přesně leží nahraný `.exe` (příloha draftu? soubor ve stromu? nová větev?),
- jestli existuje **draft** release s nahranými soubory (pak ho publikuj místo vytváření nového),
- jaké soubory uživatel nahrál (`git log`, `git show --stat` na nové commity v `main`).

**Odvození verze** (když je `VERZE` prázdné): z názvu souboru regexem `Minekube[._ ]Launcher[._ ](\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)`. Když se číslo v názvu `.exe` rozchází s `Cargo.toml` (`version = "…"`) nebo s nejnovějším tagem, **zastav se a zeptej** — tichá domněnka je nejčastější příčina špatného vydání.

### Fáze B — Najdi a zvaliduj artefakt

Nejdřív zjisti, **kde** nový `.exe` je — uživatel ho mohl nahrát jako přílohu draftu, commitnout do stromu, nebo přiložit k vydání ručně:

```bash
gh api repos/MinekubeStudios/MinekubeLauncher/releases \
  --jq '.[] | select(.draft) | {tag:.tag_name, assets:[.assets[]|{name,size,draft:.state}]}'
git clone --depth 50 https://github.com/MinekubeStudios/MinekubeLauncher /tmp/launcher 2>/dev/null || git -C /tmp/launcher fetch --depth 50 origin
git -C /tmp/launcher ls-tree -r --name-only origin/main | grep -Ei '\.(exe|msi|appimage|deb)$'
gh release download <tag> -R MinekubeStudios/MinekubeLauncher -p '*.exe' -D /tmp/rel --clobber
```

Pak soubor zkontroluj:

```bash
# 1) typ souboru + velikost + hash
file /tmp/rel/*.exe
stat -c '%s %n' /tmp/rel/*.exe
sha256sum /tmp/rel/*.exe
# 2) velikost a hash z GitHub API (digest má tvar sha256:…)
gh api repos/MinekubeStudios/MinekubeLauncher/releases --jq '.[0].assets[] | {name,size,digest}'
```

Kontroly, které musí projít:

- `file` hlásí `PE32+ executable (GUI) x86-64` (ne HTML chybová stránka, ne prázdný soubor),
- velikost > 5 MB a shoduje se s `size` v API,
- SHA-256 se shoduje s `digest` v API (pokud ho GitHub vyplnil),
- název drží vzor `<Produkt>_<verze>_x64-setup.exe` — `releases.js` podle `-setup.exe` rankuje instalátor nejvýš a verzi z názvu parsuje. Jiný název = web nabídne špatný soubor.

Když cokoli nesedí: **konec fáze, report s chybou**, nic nemaž.

### Fáze C — Úklid starých souborů

Postupuj od nejstaršího. Co se maže:

| Co | Příkaz | Poznámka |
|---|---|---|
| stará příloha u vydání, které zůstává v retenci | `gh release delete-asset <tag> <soubor> -R MinekubeStudios/MinekubeLauncher --yes` | jen když je u stejného tagu duplicitní/stará binárka |
| celé vydání mimo retenci | `gh release delete <tag> -R MinekubeStudios/MinekubeLauncher --yes --cleanup-tag` | `--cleanup-tag` smaže i git tag; nikdy nemaž Latest |
| instalátor commitnutý ve stromu | `git rm --cached <cesta>` + commit `chore(release): odstraň starý instalátor <soubor>` na větvi + PR | `.exe` do repa nepatří |

Pravidlo retence: drž `RETENCE_VYDANI` posledních vydání (výchozí 2) jako rollback. V `DRY_RUN=ano` jen vypiš seznam, co by se smazalo.

### Fáze D — Nové vydání a tag

```bash
# 1) tag ještě nesmí existovat (jinak jde o draft/přepis — viz sekce 6)
gh api repos/MinekubeStudios/MinekubeLauncher/git/refs/tags \
  --jq '.[] | select(.ref=="refs/tags/v<VERZE>")'
# 2) commit, na který tag postavíš = špička main v momentě vydání
gh api repos/MinekubeStudios/MinekubeLauncher/commits/main --jq '.sha'

# nové vydání s changelogem a přílohou
gh release create v<VERZE> /tmp/rel/Minekube.Launcher_<VERZE>_x64-setup.exe \
  -R MinekubeStudios/MinekubeLauncher \
  --title "Minekube Launcher v<VERZE>" \
  --notes-file /tmp/changelog.md \
  --latest
```

- Tag musí mířit na **konkrétní commit**, ne na větev, která se ještě hýbe (`gh release create <tag> --target <sha>`).
- `CHANNEL=beta` → přidej `--prerelease` a v názvu `(beta)`; `--latest` pak nepoužívej.
- Po vytvoření zkontroluj, že je vydání **Latest** a tělo není prázdné:

```bash
gh release view v<VERZE> -R MinekubeStudios/MinekubeLauncher \
  --json tagName,isLatest,isPrerelease,assets,body --jq '{tag:.tagName,latest:.isLatest,assets:[.assets[]|{name,size}],bodyLen:(.body|length)}'
curl -sI https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/v<VERZE>/Minekube.Launcher_<VERZE>_x64-setup.exe \
  | grep -Ei '^(HTTP/|content-length|content-type)'
```

### Fáze E — Web se musí dozvědět o verzi

Větev: `arena/<id>-minekubestudios-github-io` (aktuální), commit + PR + merge. Uprav **všech šest míst** — když vynecháš kterékoli, web buď ukáže starou verzi, nebo spadne na zálohu:

1. `launcher/releases.js` → `CONFIG.fallback.windows` = `{ name, version, size, url }` nové verze **a** bump `CONFIG.cacheKey` (`minekube-launcher-releases-v1` → `…-v2`), jinak vracející se návštěvník uvidí 5 minut stará data.
2. `launcher/launcher.js` → `createFallbackSource()` má **druhou** kopii stejných hodnot (`name`, `version`, `size`, `url`) pro případ, že se `releases.js` nenačte.
3. `launcher/shared/app.js` → `modal.changelog.text` ve **třech jazycích** (cs ≈ ř. 219, en ≈ 413, sk ≈ 607): poslední verze + datum + změny, max 3 verze, stručně.
4. `launcher/i18n.js` → `lp.shot.caption` a `lp.tour.lead` ve všech jazycích (obsahují „1.2.1“).
5. `launcher/index.html` → statické fallbacky stejných dvou textů (≈ ř. 336 a 445) **a** bump cache parametrů: `releases.js?v=…`, `launcher.js?v=…` (a `lpx.css?v=…`, pokud jsi sáhl na CSS).
6. `tools/*` → pokud testy obsahují konkrétní verzi, aktualizuj je tak, aby tvrdily **nové** chování (nikdy je neobcházej).

### Fáze F — Testy a kontrola kvality

```bash
node tools/launcher_page_test.mjs     # očekávej 28/28
node tools/cube_stage_test.mjs        # 32/32
node tools/releases_test.mjs          # 30/31 (jediná chyba = sandbox nemá Google Fonts)
node /tmp/env/csscheck.mjs launcher/lpx.css launcher/launcher-pulse.css   # 0 parse errors
node --check launcher/launcher.js && node --check launcher/releases.js
```

Navíc ruční ověření v prohlížeči (Chromium/Puppeteer nebo živý náhled):

- stránka launcheru ukazuje **novou verzi** v `[data-launcher-version]` (štítek „v…“ i panel „Aktuální verze“),
- tlačítko stahování vede na URL nového vydání (`asset().url`),
- přepínač jazyka cs/en/sk nemá nikde zbytky staré verze,
- světlý i tmavý motiv, mobil 390 px, `prefers-reduced-motion` — beze změny chování.

### Fáze G — PR a merge

```bash
git add -A && git commit -m "Launcher: vydání v<VERZE> — web zná nový instalátor"
git push -u origin <aktuální-větev>
gh pr create --title "Launcher: vydání v<VERZE>" --body "<co a proč, tabulka ověření>"
gh pr merge <číslo> --merge
```

PR musí obsahovat: odkaz na GitHub Release, velikost a SHA-256 instalátoru, seznam upravených souborů, výsledky testů.

## 5. Šablona changelogu (soubor `/tmp/changelog.md`)

````markdown
## Minekube Launcher <VERZE>

**Vydáno:** <YYYY-MM-DD> · **Platforma:** Windows 10/11 x64 · **Kanál:** <stable|beta>
**Instalátor:** `Minekube.Launcher_<VERZE>_x64-setup.exe` (<xx,x> MB)
**SHA-256:** `<hash>`

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

Cizojazyčná část (`JAZYK_VYDANI=en+cs`): nad české sekce dej `## English` s jedním odstavcem souhrnu a odrážkami `Added / Changed / Fixed / Removed`. Nic nevymýšlej — changelog stavěj z commitů (`git log <starý-tag>..<nový-tag> --no-merges --pretty='%s'`) a z toho, co uživatel výslovně řekl. Když změny neznáš, napiš jen to, co je doložené, a zbytek nech na uživateli.

## 6. Když se něco nezdá — zastav se a zeptej

- `.exe` chybí, je menší než 5 MB nebo `file` nehlásí PE32+,
- číslo verze v názvu souboru ≠ `Cargo.toml` ≠ nejnovější tag,
- tag `v<VERZE>` už existuje (a nejde o draft, který se má publikovat),
- uživatel nahrál víc různých `.exe` a není jasné, který je finální,
- mazání by smazalo poslední funkční vydání (rollback),
- v repu se objevil `.exe`/`.zip` mimo Releases.

V těchto případech **nic nemaž a nic nepublikuj** — vypiš, co jsi našel, a nabídni varianty.

## 7. Závěrečný report (přesně tyto tři body)

1. **Co bylo skutečností:** jaká verze a tag, odkud se vzaly (draft / nahraný soubor / tree), co se smazalo a proč, co zůstalo v retenci.
2. **Co přesně se změnilo:** tabulka `soubor → změna` (GitHub Release, přílohy, `releases.js`, `launcher.js`, `app.js`, `i18n.js`, `index.html`) + odkaz na PR a merge commit.
3. **Ověření:** výstup kontrol z Fáze B a D (HTTP 200, `Content-Length`, SHA-256, `isLatest`), výsledky všech testů (čísla, ne „OK“), a stav UI: nová verze v hero i v panelu, stažení vede na nové vydání, cs/en/sk, mobil i desktop.

---

### KONEC PROMPTU
