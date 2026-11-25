# Nasazení launcheru na minekubelauncher.github.io

Tenhle adresář obsahuje **nástroje pro nasazení**, ne web samotný.

- **[JAK-NASADIT.md](./JAK-NASADIT.md)** — tři způsoby, jak stránku
  dostat na novou doménu.
- **[JAK-SMAZAT-WEB.md](./JAK-SMAZAT-WEB.md)** — jak uklidit neúplný web
  nahraný omylem do kořene repa `MinekubeLauncher`.
- **`build.sh`** — sestaví `launcher-site.tar.gz` z `launcher/`.

## Rychle

```bash
./launcher-deploy/build.sh          # -> launcher-deploy/launcher-site.tar.gz
tar -xzf launcher-deploy/launcher-site.tar.gz
cd launcher-site
GH_TOKEN=ghp_tvuj_token ./deploy.sh <ucet>
```

## Co balíček obsahuje

- celou stránku launcheru ze `launcher/` (zdroj pravdy je tam)
- `.github/workflows/pages.yml` — automatické nasazení na Pages
- `.nojekyll` — aby Pages nezpracovával přes Jekyll
- `tools/launcher_page_test.mjs` — 24 testů, cesty přepsané do rootu
- `deploy.sh` — založí repo, pushne obsah a zapne Pages

## Pozor na adresu

Aby adresa byla `https://minekubelauncher.github.io/`, musí se účet
jmenovat `minekubelauncher`. Účet `minekubeproject` (přihlášený bot)
dá `https://minekubeproject.github.io/minekubelauncher.github.io/`.
Detaily v [JAK-NASADIT.md](./JAK-NASADIT.md).
