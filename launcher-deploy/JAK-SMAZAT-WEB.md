# Jak odstranit web z rootu MinekubeLauncher

## Co se stalo

Do repa `MinekubeStudios/MinekubeLauncher` (Rust/Tauri projekt) se nahralo
**11 souborů webu do kořene** — ale jen část. Chybí `icons/` (53 ikon),
`shared/` (app.js, styles.css, favicony), `wallpapers/` (15 tapet) a `img/`.
Ze 43 odkazů v `index.html` jich **37 vede do prázdna**.

Web se z toho rootu **nedá publikovat** — repozitář nemá zapnuté Pages a
soubor `.nojekyll` tam taky není. Nic tedy neběží a nic se nerozbíjí;
jen v repu leží 11 souborů, které tam nepatří.

## Řešení A — smazat v GitHubu (2 minuty, nic neinstaluješ)

1. Otevři https://github.com/MinekubeStudios/MinekubeLauncher
2. Klikni na **`index.html`** → vpravo nahoře **⋯ (tři tečky)** → **Delete file**
   → **Commit changes**
3. To samé pro zbývajících 10 souborů z tabulky níže

| # | Soubor |
|---|---|
| 1 | `index.html` |
| 2 | `app.js` |
| 3 | `apple-launcher.css` |
| 4 | `design-plus.css` |
| 5 | `design-plus.js` |
| 6 | `i18n.js` |
| 7 | `launcher-pulse.css` |
| 8 | `launcher.js` |
| 9 | `lpx.css` |
| 10 | `releases.js` |
| 11 | `styles.css` |

> `styles.css` má 429 KB — GitHub ho v editoru otevře pomaleji, ale smazat jde.

## Řešení B — příkazová řádka (jeden příkaz)

```bash
git clone https://github.com/MinekubeStudios/MinekubeLauncher.git
cd MinekubeLauncher
git rm index.html app.js styles.css design-plus.css design-plus.js \
       apple-launcher.css i18n.js launcher-pulse.css launcher.js \
       lpx.css releases.js
git commit -m "Odstranění neúplného webu z rootu"
git push
```

## Co zůstane

`Cargo.toml`, `package.json`, `README.md`, `LICENSE`, `apps/`, `packages/`,
`scripts/` a všechny ostatní soubory Rust projektu — **nedotčené**.
Web launcheru dál běží na `https://minekubestudios.github.io/launcher/`.

## Pokud chceš web i v MinekubeLauncheru

Nepoužívej kořen repa — patří do **`docs/`**, jinak přepíšeš `README.md`
a `package.json` Rust projektu. Balíček se 86 soubory (tam i `icons/`,
`shared/`, `wallpapers/`) sestavíš takhle:

```bash
./launcher-deploy/build.sh
tar -xzf launcher-deploy/launcher-site.tar.gz
# launcher-site/ obsahuje celou stránku + .nojekyll + workflow
```

Pak obsah `launcher-site/` nahraj do `docs/` v MinekubeLauncheru a v
*Settings → Pages* nastav zdroj na `main` / `/docs`.
Výsledek: `https://minekubestudios.github.io/MinekubeLauncher/`
