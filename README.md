# Minekube Studios // Hlavní web (v4 — Ko-fi tlačítko, GitHub CTA, jedna sekce)

Stránka byla upravovaná oproti verzi v2. Novinky:

1. **Odstraněné animace přes celou obrazovku**
   - boot loader `#futureLoader` (inicializace ekosystému s 3D kostkou) — pryč z HTML, JS i CSS
   - celoobrazovkový portálový přechod `#pageTransition` (přepínání sekcí) — pryč
   - „nájezd" cílové sekce (`.mk-section-preparing` / `-arriving` / `.mk-section-entry-sweep`) — pryč
   - celoplošný Store pulz a dimenzní brána (`.store-cyber-pulse`, `.store-dimension-portal`,
     `.store-portal-*`) — pryč; odkaz na Store teď otevírá normálně (nový panel)
   - odkazy na kotvy teď používají jen běžný plynulý scroll prohlížeče
   - z `styles.css` byly **fyzicky smazané** všechny odpovídající pravidla i mrtvé `@keyframes`
     (681 pravidel, 92 keyframes, soubor klesl z 411 kB na 319 kB)
   - zůstaly pouze animace uvnitř jednotlivých prvků (hover, toast, reveal při scrollu,
     3D tilt karet, částice ve Store tlačítku) — žádné nepřekrývají celou obrazovku

2. **Sloučení sekcí** — sekce `Domů (#home)` a `Studio (#studio)` byly smazány jako
   samostatné sekce a jejich obsah je teď celý uvnitř jediné sekce **O projektu (`#projekt`)**:
   `intro (bývalé Domů)` → `manifest projektu` → `4 principy` → `Kdo jsme (bývalé Studio)`
   → `4 pilíře ekosystému`. Navigace má proto jedinou kotvu `#projekt`.

3. **Server** — v navigaci hned vedle „Modpacky" je nové **tlačítko Server** (není to odkaz
   na stránku, jen tlačítko). Po kliknutí ukáže toast „Komunitní server právě připravujeme".
   Stejné tlačítko je v mobilní navigaci (štítek „VE VÝVOJI"), v informativním panelu
   v intru a v pilíři „Komunitní server".

4. **Přepnutí jazyka** — vedle tlačítka motivu je tlačítko jazyka (glóbus + kód CZ/EN/SK).
   Otevře menu s **English / Čeština / Slovenčina**. Překlad běží přes slovník v `app.js`
   (`data-i18n`, `data-i18n-aria`, `data-i18n-title`), překlopené texty zahrnují i nadpis
   stránky, `meta description`, texty tlačítek, modaly v patičce a toasty. Volba se ukládá
   do `localStorage` (klíč `minekube-lang`) a načítá se ještě před vykreslením stránky.
   Při první návštěvě se zkusí jazyk prohlížeče, jinak čeština; vynutit lze i `?lang=en|cs|sk`.

## v4 — tlačítka (design původního webu)

1. **Primární CTA „Procházet modpacky“** — dostalo design původního tlačítka
   „O projektu Minekube“ (`.mk-home-primary` z originálu): zlatý gradient
   `#ffdb55 → #ffaf18 → #ff733b → #e864ef`, rotující conic aura za obsahem,
   světelný bod sledující kurzor (`--mx/--my` v JS), dlaždice s ikonou,
   kicker + titulek a šipka, která při hoveru odjíždí.
   Tříd se jmenuje `.mk-cta-primary*` (aby se ve sdíleném `styles.css`
   nepotkalo s originálem), `@keyframes mkCtaAuraSpin` je přepsané z původního `mkHomeActionSpin`.
2. **„Otevřít Store“ v intru je pryč** — na jeho místě je **GitHub tlačítko**
   (`.mk-cta-github`) s oficiálním logem (vnořené SVG, žádný obrázek navíc),
   kickerkem „ZDROJOVÝ KÓD“, titulkem „Minekube na GitHubu“ a šipkou ↗ pro
   externí odkaz. Otevírá se v novém panelu s `rel="noopener noreferrer"`.
3. **Hlavičkové animované tlačítko „MINEKUBE STORE“ → „Podpořit projekt“**
   (`.store-button.kofi-button`). Kompletní design systém zůstal beze změny:
   galaxie s mlhou a hvězdami, rotující RGB ohraničení `conic-gradient`,
   blesky, oběžné dráhy, scan linka, rohy, částice generované JS a vlnování
   popisku po písmenech. Nové:
   - **logo Ko-fi** (pohár + ucho) v `currentColor`, **srdíčko** zvlášť
     v barvě Ko-fi `#ff5f5b` s vlastní animací `kofiHeartBeat` (zrychlí se při hoveru);
   - popisek se skládá z JavaScriptu do písmen (`[data-letters]`), takže vlní
     u libovolně dlouhého textu a v libovolném jazyce;
   - malý řádek nad titulkem je „KO-FI“ s původní scan linkou;
   - teplý oranžový nádech v místech, kde byla chladná modrá (ikona, core, scan),
     zbytek palety (tyrkysová/fialová/magenta) zůstal.
   - Obě loga jsou rozštěpená a vygenerovaná skriptem `tools/kofi_paths.py` z SVG cesty
     Simple Icons (CC0), rasterem ověřeno jako pixelově shodné s originálem.
4. **Odkazy na jednom místě** — `SITE_LINKS` v `app.js` (Ko-fi, GitHub, Store).
   V HTML jsou prvky označené `data-site-link="kofi|github"`; bez JavaScriptu
   fungují odkazy napsané natvrdo v HTML.

> **Doplň vlastní Ko-fi adresu:** `https://ko-fi.com/minekubestudios`
> je předvyplněná podle názvu účtu — změň ji v `SITE_LINKS` (a v `href`
> v `index.html`), pokud tvoje Ko-fi stránka má jiné URL.

## Struktura

| Soubor | Popis |
|---|---|
| `index.html` | Jedna stránka: O projektu (intro + manifest + principy + studio + pilíře) → CTA → patička |
| `styles.css` | Design systém původního webu (beze změny vzhledu) **minus** pravidla celoobrazovkových animací, **plus** bloky `LANG SWITCHER + NAV SERVER BUTTON + SLOUČENÁ JEDNA STRÁNKA` (v3) a `INTRO CTA` + `KO-FI` (v4) |
| `app.js` | Motiv, jazyk (i18n), toast, modaly, reveal při scrollu, 3D tilt, `SITE_LINKS`, rozklad popisku na písmena, kurzorový svit primárního CTA, částice tlačítka |
| `assets/favicon.svg` | Favicon z brand znaku |

## Sekce stránky

1. **O projektu (`#projekt`)** — vše na jedné stránce
   - **Intro** — titulek „Minecraft budoucnosti. Otevřený úplně všem.", lead text,
     tlačítka (Modpacky, Store), 3 čísla a informativní panel se 4 moduly ekosystému
   - **Manifest** — karta „Výkon bez zničení původního Minecraftu" + 4 štítky + 3D emblém
   - **Principy** — 4 karty (Vanilla friendly, Bezpečné aktualizace, Čistá konfigurace,
     Transparentní changelog)
   - **Studio** (`#ekosystem`) — karta „Kdo jsme" (hodnoty + fakty + emblém) a
     **4 pilíře**: Modpacky (LIVE → `modpacky/`), Komunitní server (tlačítko „Brzy"),
     Store (OPEN → Store), Open source
2. **CTA + patička** — CTA na modpacky, patička s dialogy (Changelog, Kompatibilita, Licence)

## Navigace

- **O projektu** — kotva `#projekt`
- **Modpacky** — odkaz na `modpacky/` (druhá stránka, není součástí tohoto balíčku)
- **Server** — tlačítko, žádná stránka (jen info toast)
- Store zůstává vpravo v hlavičce + v mobilním menu

## Jak spustit

```bash
cd site
python3 -m http.server 8080 --bind 0.0.0.0
```

## Poznámky

- Odkazy na Store a Game Jolt vedou na produkční URL; GitHub je nově napojený
  (`data-site-link="github"`), Discord zůstává placeholder (`#`) — doplň vlastní odkaz.
- `styles.css` zůstává sdílený s dalšími stránkami; odstraněné celoobrazovkové animace
  se týkají i přechodů na stránce Modpacky (pokud by je některá verze používala).
- Tmavý/světlý motiv je beze změny, přibyla jen ikona měsíce pro světlý motiv.

## Testy

```bash
node --check site/app.js
node tools/dom_test.js   # 78 kontrol (chování, i18n, tlačítka, CSS)
node tools/lang_test.js  # 27 kontrol (jazyky, odkazy, bez localStorage)
```
