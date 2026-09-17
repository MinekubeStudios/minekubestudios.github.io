# Jak nahrát nové vydání modpacku

Návod krok za krokem — od hotové instance ve launcheru po tlačítko
„Stáhnout balíček“ na webu. Celé to trvá asi pět minut.

---

## Co budeš potřebovat

- **Prism Launcher** (nebo MultiMC / ATLauncher / Modrinth App) s hotovou instancí,
- **Git** a **GitHub CLI** (`gh`) přihlášené k účtu, který má právo publikovat
  v `MinekubeStudios/modpacky`:
  ```bash
  gh auth login
  gh auth status
  ```
- **Node 18+** (generátor manifestu) a **zip** (balení) — na macOS/Linuxu obojí
  obvykle stačí doinstalovat jedním příkazem.

Kontrola, že máš čerstvý repozitář:

```bash
git clone https://github.com/MinekubeStudios/modpacky.git
cd modpacky
```

---

## Krok 1 — Najdi složku instance

V Prism Launcheru: pravý klik na instanci → **Edit** → **Mods** → tlačítko
**Folder** (nebo *Instance → Folder*). Otevře se složka, kde jsou `mods/`,
`config/`, `resourcepacks/`, `shaderpacks/` a `options.txt`.

Přesnou cestu zjistíš i v *Edit → Settings* nebo v terminálu:

```bash
ls ~/.local/share/PrismLauncher/instances   # Linux
ls ~/Library/Application\ Support/PrismLauncher/instances   # macOS
```

---

## Krok 2 — Zabal instanci do `.mrpack`

```bash
./tools/make-mrpack.sh \
  ~/.local/share/PrismLauncher/instances/minekube-ultra \
  Minekube-Ultra-1.2.0.mrpack \
  --name "Minekube Ultra" \
  --version-id 1.2.0 \
  --mc 1.21.4 \
  --loader fabric \
  --loader-version 0.16.14 \
  --summary "Maximum FPS pro moderní sestavy."
```

Skript:

- vygeneruje `modrinth.index.json` (pokud ve složce už nějaký je, použije ten),
- překopíruje obsah instance do `overrides/`,
- zahodí logy, savy, crash reporty a soubory s přihlašovacími údaji,
- vytvoří `Minekube-Ultra-1.2.0.mrpack` **a** k němu `.sha256`.

> Chceš balíček i jako `.zip` pro ruční instalaci? Zabal ho stejným obsahem:
> ```bash
> ( cd ~/.local/share/PrismLauncher/instances/minekube-ultra && \
>   zip -rX -9 ~/Minekube-Ultra-1.2.0.zip mods config resourcepacks options.txt )
> ```
> Dostupný je i export přímo z Prismu: *Instance → Export instance* → formát
> „Modrinth pack“ / „MultiMC“.

---

## Krok 3 — Napiš changelog

Vytvoř `notas-1.2.0.md` (klidně zkopíruj novou sekci z
`packs/<id>/CHANGELOG.md`) a nezapomeň na metadata, ze kterých web pozná
cílovou verzi hry:

```markdown
## Minekube Ultra 1.2.0 — výkonnější chunk rendering

Minecraft: 1.21.4
Loader: Fabric

### Přidáno
- Sodium 0.6 a Lithium 0.14.

### Změněno
- Menší nároky na RAM (4 GB → 3,5 GB).
```

> Řádky `Minecraft:` a `Loader:` jsou volitelné — když je neuvedeš, použije se
> hodnota z `packs/<id>/pack.json`.

---

## Krok 4 — Publikuj vydání

```bash
./tools/publish-release.sh ultra 1.2.0 \
  Minekube-Ultra-1.2.0.mrpack Minekube-Ultra-1.2.0.zip \
  --notes-file notas-1.2.0.md
```

Skript založí release s tagem **`ultra-v1.2.0`**, nahraje soubory i checksumy
a spustí workflow, který přegeneruje `manifest.json`.

Beta verze (hráči ji uvidí jako „beta“ a web upřednostní stabilní vydání):

```bash
./tools/publish-release.sh ultra 1.3.0-beta.1 Minekube-Ultra-1.3.0-beta.1.mrpack \
  --prerelease --notes "Testovací build, prosím o zpětnou vazbu."
```

Než něco pošleš, můžeš si to vyzkoušet na nečisto:

```bash
./tools/publish-release.sh ultra 1.2.0 Minekube-Ultra-1.2.0.mrpack --dry-run
```

---

## Krok 5 — Zkontroluj web

1. **Actions → Aktualizovat manifest** musí doběhnout zeleně (do minuty).
2. Otevři <https://minekubestudios.github.io/modpacky/> a najdi balíček.
3. Tlačítko „Stáhnout balíček“ musí mířit na soubor z nového vydání.

Když se vydání na webu neobjeví:

| Příznak | Příčina | Řešení |
|---|---|---|
| Tlačítko píše „Odkaz připravujeme“ | manifest ještě neproběhl, nebo tag nesedí | zkontroluj Actions; tag musí být `<pack-id>-v<verze>` |
| Vydání v katalogu je staré | prohlížeč má cache (web si manifest drží ~10 minut) | obnov stránku s `?releases=refresh` nebo počkej |
| Balíček má jiné `id` | tag odkazuje na neznámý balíček | přidej `packs/<id>/pack.json` a `id` i do webu |
| Workflow spadl | chybí token nebo práva | nastav *Settings → Actions → General → Workflow permissions → Read and write* |

Ruční přegenerování manifestu, když workflow nechce běžet:

```bash
GITHUB_TOKEN=$(gh auth token) node tools/build-manifest.mjs
git commit -am "manifest: ruční přegenerování" && git push
```

---

## Nahrání přes GitHub UI (bez terminálu)

1. *Releases → Draft a new release*.
2. **Choose a tag** → napiš `ultra-v1.2.0` → *Create new tag on publish*.
3. Titulek: `Minekube Ultra 1.2.0`.
4. Přetáhni `.mrpack` a `.zip` do *Attach binaries*.
5. Popis = changelog z kroku 3, **Publish release**.

Manifest si workflow přegeneruje sám (spouští se na `release: published`).

---

## Co dělat a co ne

- **Nikdy nepřepisuj soubory starého vydání** — hráči mají staženo právě to
  a checksum by přestal sedět. Nahraj novou verzi s novým tagem.
- **Netvoř jeden tag pro víc balíčků.** Každý balíček má vlastní řadu tagů.
- **Nezakládej tag bez vydání** (`git tag` ručně) — web čte vydání, ne tagy.
- **Soubory nech na GitHubu**, ne v gitu: velké balíčky patří do *Assets*
  u vydání, ne do historie repozitáře.
