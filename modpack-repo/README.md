# MinekubeStudios / modpacky

Oficiální **úložiště Minekube modpacků a instancí**. Nic jiného tady není —
žádný kód webu, žádné obrázky, žádné assety. Jen modpacky, jejich metadata
a soubory ke stažení.

Web [minekubestudios.github.io/modpacky](https://minekubestudios.github.io/modpacky/)
si odsud bere **nejnovější vydání** každého balíčku. Když hráč klikne v katalogu
na modpack a zmáčkne „Stáhnout balíček“, stahuje se přímo soubor z nejnovějšího
vydání (GitHub Release) v tomhle repozitáři.

---

## Jak to funguje (rychlý přehled)

```
GitHub Release  ──►  .github/workflows/manifest.yml  ──►  manifest.json  ──►  web Minekube
  (tag: ultra-v1.2.0)        (přegeneruje index)            (index vydání)      (tlačítko ke stažení)
```

1. Nahraješ nové vydání balíčku (skriptem, přes GitHub UI nebo `gh` CLI).
2. Workflow **Aktualizovat manifest** přegeneruje `manifest.json` v tomhle repu.
3. Web si `manifest.json` přečte (a když selže, sáhne po GitHub Releases API)
   a tlačítka ke stažení vždycky míří na nejnovější vydání.

Bez manifestu by web musel na každé načtení stránky volat GitHub API (limit
60 dotazů za hodinu na IP adresu) — proto ten index existuje.

---

## Struktura repozitáře

| Cesta | Význam |
|---|---|
| `packs/<id>/pack.json` | Metadata balíčku (název, Minecraft, loader, stav). `id` **musí** odpovídat `id` v katalogu na webu. |
| `packs/<id>/CHANGELOG.md` | Lidský changelog balíčku. |
| `manifest.json` | **Generovaný** index nejnovějších vydání — needituj ručně. |
| `tools/build-manifest.mjs` | Sestaví `manifest.json` z GitHub Releases. |
| `tools/publish-release.sh` | Založí vydání (tag + soubory + checksumy) a spustí manifest. |
| `tools/make-mrpack.sh` | Zabalí složku instance do `.mrpack` (+ `.sha256`). |
| `tools/validate-release.mjs` | Zkontroluje, že vydání má správný tag a soubory. |
| `.github/workflows/manifest.yml` | Po publikování vydání sám přegeneruje `manifest.json`. |
| `.github/workflows/validate-release.yml` | Po publikování vydání zkontroluje konvence. |
| `docs/JAK-NAHRAT-VYDANI.md` | Podrobný návod (CZ) — od složky instance po hotové vydání. |
| `docs/MANIFEST.md` | Schéma `manifest.json` a jak ho čte web. |

---

## Balíčky

| `id` | Název | Minecraft | Loader | Tag |
|---|---|---|---|---|
| `ultra` | Minekube Ultra | 1.21.4 | Fabric | `ultra-v*` |
| `performance` | Minekube Performance | 1.21.4 | Fabric | `performance-v*` |
| `pvp` | Minekube PvP | 1.21.1 | Fabric | `pvp-v*` |
| `lite` | Minekube Lite | 1.20.1 | Fabric | `lite-v*` |
| `vanilla` | Minekube Vanilla+ | 1.21.4 | NeoForge | `vanilla-v*` |

> Nový balíček přidáš tak, že založíš `packs/<id>/pack.json` a přidáš ho i do
> katalogu na webu (`modpacky/modpacky.js` → `MODPACKS`). Bez shodného `id`
> web vydání nenajde.

---

## Konvence vydání

- **Tag:** `<pack-id>-v<verze>`, například `ultra-v1.2.0` nebo `pvp-v1.21.4-3`.
  Část za `-v` je verze balíčku — může obsahovat i verzi Minecraftu.
- **Soubory:** `<Název-balíčku>-<verze>.mrpack` a/nebo `<Název-balíčku>-<verze>.zip`,
  ke každému navíc `.sha256` (skript ho vygeneruje sám).
- **Pre-release** (`--prerelease`) = beta kanál. Web upřednostní stabilní
  vydání; když žádné stabilní není, ukáže betu a označí ji.
- **Popis vydání** = changelog, který se zobrazí hráči.

### Formáty souborů

| Formát | Pro koho | Jak se instaluje |
|---|---|---|
| `.mrpack` | Prism Launcher, ATLauncher, MultiMC, Modrinth App | Dvojklik / „Add instance → Import from file“ |
| `.zip` | ruční instalace | Obsah se rozbalí do složky hry (`.minecraft`) |

Doporučené je nahrávat **oba**: `.mrpack` pro pohodlnou instalaci a `.zip`
jako nouzovou variantu.

---

## Nahrání nového vydání

### 1) Skriptem (doporučeno)

```bash
# zabalí složku instance do .mrpack (+ .sha256)
./tools/make-mrpack.sh ~/instances/minekube-ultra Minekube-Ultra-1.2.0.mrpack \
  --name "Minekube Ultra" --version-id 1.2.0 --mc 1.21.4 --loader fabric

# založí vydání ultra-v1.2.0 a nahraje oba soubory
./tools/publish-release.sh ultra 1.2.0 \
  Minekube-Ultra-1.2.0.mrpack Minekube-Ultra-1.2.0.zip \
  --notes-file notas-1.2.0.md
```

`publish-release.sh` sám:
- zkontroluje, že balíček existuje a soubory nejsou prázdné,
- dopočítá chybějící `.sha256`,
- založí release s tagem `ultra-v1.2.0` (nebo přidá soubory do existujícího),
- spustí workflow, který přegeneruje `manifest.json`.

### 2) Přes GitHub UI

1. *Releases* → **Draft a new release** → *Choose a tag* → napiš `ultra-v1.2.0`
   → **Create new tag on publish**.
2. Přilož `.mrpack` a/nebo `.zip`.
3. Popis = changelog, **Publish release**. Manifest se přegeneruje sám.

### 3) Přes `gh` CLI

```bash
gh release create ultra-v1.2.0 Minekube-Ultra-1.2.0.mrpack \
  --title "Minekube Ultra 1.2.0" --notes-file notas-1.2.0.md
```

---

## Ruční přegenerování manifestu

```bash
GITHUB_TOKEN=$(gh auth token) node tools/build-manifest.mjs
# nebo jen ověření, jak by manifest vypadal:
GITHUB_TOKEN=$(gh auth token) node tools/build-manifest.mjs --dry-run
```

Workflow se dá spustit i z webu: *Actions → Aktualizovat manifest → Run workflow*.

---

## Licence

Skripty a workflowy v tomhle repu jsou pod **MIT** (viz `LICENSE`).
Jednotlivé mody uvnitř balíčků si zachovávají licence svých autorů — před
zveřejněním vydání zkontroluj, že je smíš redistribuovat. Minecraft je
ochranná známka Mojang Studios; tenhle projekt s Mojangem ani Microsoftem
nijak nesouvisí.
