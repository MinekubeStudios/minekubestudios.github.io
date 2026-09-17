# `manifest.json` — index vydání pro web

`manifest.json` je jediný soubor, který si web Minekube čte, aby věděl,
jaké je nejnovější vydání každého balíčku. Generuje ho
`tools/build-manifest.mjs` z GitHub Releases — **needituj ho ručně**,
přepíše se.

Proč index a ne přímé dotazy na GitHub API: neautentizované GitHub API má
limit **60 dotazů za hodinu na IP adresu**, což u návštěvnosti webu přeteče.
`manifest.json` se servíruje jako statický soubor (raw.githubusercontent.com)
a limit nemá.

---

## Jak si web data bere

Pořadí zdrojů (`modpacky/releases.js` v repu webu):

1. `manifest.json` z tohoto repozitáře (rychlé, bez limitu),
2. GitHub Releases API — záložní cesta, když manifest chybí nebo selže,
3. statická data v kódu webu — když nejde nic (tlačítko pak hlásí
   „Odkaz připravujeme“).

Web si výsledek drží 10 minut v `localStorage`. Obnovit se dá ručně
parametrem v URL: `modpacky/?releases=refresh`.

---

## Tvar souboru

```jsonc
{
  "schema": 1,                       // verze formátu
  "generated": "2026-09-17T18:04:11.220Z",
  "repository": "MinekubeStudios/modpacky",
  "branch": "main",
  "releasesUrl": "https://github.com/MinekubeStudios/modpacky/releases",
  "web": "https://minekubestudios.github.io/modpacky/",
  "packs": {
    "ultra": {
      "id": "ultra",
      "name": "Minekube Ultra",
      "badge": "ULTRA",
      "tagPrefix": "ultra",
      "minecraft": ["1.21.4", "1.21.1"],
      "loader": "Fabric",
      "focus": ["fps", "vanilla"],
      "state": "released",
      "released": true,               // true = existuje aspoň jedno vydání
      "website": "https://…/#pack-ultra",
      "summary": "…",

      "latest": {                     // null = balíček zatím nemá vydání
        "tag": "ultra-v1.2.0",
        "version": "1.2.0",
        "name": "Minekube Ultra 1.2.0",
        "channel": "stable",          // stable | beta (pre-release)
        "published": "2026-09-17T10:00:00Z",
        "htmlUrl": "https://github.com/…/releases/tag/ultra-v1.2.0",
        "notes": "## Přidáno …",      // popis vydání = changelog pro hráče
        "mc": "1.21.4",
        "loader": "Fabric",
        "files": [
          {
            "name": "Minekube-Ultra-1.2.0.mrpack",
            "url": "https://github.com/…/releases/download/ultra-v1.2.0/…",
            "size": 24117248,
            "sha256": "9f2c…",        // z GitHub asset digest, když je k dispozici
            "format": "mrpack",       // mrpack | zip | checksum | other
            "primary": true           // soubor, na který míří tlačítko na kartě
          }
        ]
      },

      "history": [ /* stejný tvar, starší vydání (max 20) */ ]
    }
  }
}
```

### Pravidla, která generátor používá

- Bere se posledních **100 × `--max-pages`** vydání a ignoruje koncepty (drafts).
- Tag se čte jako `<tagPrefix>-v<verze>`; neznámé tagy se přeskočí a jen
  se ohlásí ve výpisu.
- **`latest`** = nejnovější *stabilní* vydání; když žádné stabilní není,
  použije se nejnovější beta a označí se `"channel": "beta"`.
- `primary` = první `.mrpack`, jinak první `.zip`.
- `mc` a `loader` se berou z popisu vydání (řádky `Minecraft:` / `Loader:`),
  jinak z `packs/<id>/pack.json`.
- Zápis je deterministický: když se obsah nezmění, zůstane i původní
  `generated`, aby v gitu nevznikaly prázdné commity.

---

## Ověření

```bash
# jak by manifest vypadal teď (nic nezapisuje)
GITHUB_TOKEN=$(gh auth token) node tools/build-manifest.mjs --dry-run

# kontrola, že vydání má správný tag a soubory
GITHUB_TOKEN=$(gh auth token) node tools/validate-release.mjs --tag ultra-v1.2.0
```
