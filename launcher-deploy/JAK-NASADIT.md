# Jak nasadit launcher na minekubelauncher.github.io

Všechno je připravené. Zbývá jeden krok, který za tebe nemůžu udělat:
**založit repozitář.** Můj token nemá oprávnění `CreateRepository`.

## Co je v balíčku

`launcher-site.tar.gz` (1,6 MB) — celá stránka launcheru jako
samostatný git repo, 89 souborů:

- `index.html`, `lpx.css`, `launcher.js`, `releases.js`, `i18n.js`
- `shared/` — sdílené soubory z hlavního webu (styly, app.js, assety)
- `icons/` (53), `wallpapers/` (15), `img/`
- `.github/workflows/pages.yml` — automatické nasazení na Pages
- `.nojekyll` — aby Pages nezpracovával přes Jekyll
- `tools/launcher_page_test.mjs` — 24 testů (v hlavním repu už nejsou)
- `deploy.sh` — založí repo, pushne obsah a zapne Pages

## Varianta A — deploy.sh (nejrychlejší)

```bash
tar -xzf launcher-site.tar.gz
cd launcher-site

# token potřebuje scope `repo` (a `workflow`) a právo zakládat repa
GH_TOKEN=ghp_tvuj_token ./deploy.sh minekubeproject
```

Skript založí repo, pushne obsah i zapne Pages. Hotovo za ~30 sekund,
první build Pages trvá 1–2 minuty.

## Varianta B — ručně přes web

1. **Založ repo:** https://github.com/new
   - Owner: `minekubeproject` (nebo organizace, kde máš právo zakládat)
   - Název: **`minekubelauncher.github.io`** ← přesně takhle
   - Public, bez README/gitignore/licence
2. **Nahraj obsah:**
   ```bash
   tar -xzf launcher-site.tar.gz
   cd launcher-site
   git init -b main
   git add -A
   git commit -m "Minekube Launcher"
   git remote add origin https://github.com/UCT/minekubelauncher.github.io.git
   git push -u origin main
   ```
3. **Zapni Pages:** Settings → Pages → Source: **GitHub Actions**

## Varianta C — nechat launcher v hlavním repu

Stránka v `launcher/` **je pořád plná** (ne redirect) a funguje na
`https://minekubestudios.github.io/launcher/`. Pokud novou doménu
nechceš, nemusíš dělat nic — jen dej vědět, ať odkazy v hlavičce
a patičce vrátím na relativní `launcher/` (teď míří na novou doménu).

## Důležité: doména musí být `minekubelauncher`

Aby adresa byla `https://minekubelauncher.github.io/`, musí se účet
nebo organizace jmenovat **`minekubelauncher`**.

- Účet `minekubeproject` dá adresu `https://minekubeproject.github.io/minekubelauncher.github.io/`
- Repo `MinekubeStudios/minekubelauncher.github.io` dá `https://minekubestudios.github.io/minekubelauncher.github.io/`

Ani jedno není to, co odkazuje hlavní web. Pokud účet
`minekubelauncher` neexistuje (teď neexistuje), máš tři možnosti:

1. **Založit účet `minekubelauncher`** — pak přesně sedí adresa.
2. **Vlastní doména** — např. `launcher.minekube.com` přes CNAME.
3. **Nechat launcher v hlavním repu** jako dřív (varianta C).

## Po nasazení

Ověř, že to žije:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://minekubelauncher.github.io/
# 200 = jede
```

Pak zkontroluj, že `https://minekubestudios.github.io/launcher/`
přesměruje na novou adresu.
