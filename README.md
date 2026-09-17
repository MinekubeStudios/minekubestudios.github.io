# Minekube Studios // Web (v8.4 — originální PNG loga od autora)

## v8.4 — originální loga **Minekube Original Logo + TextIcon** (místo SVG)

SVG logo z v8.3 nahradila autorova originální PNG grafika: zlatá
hexagonální kostka s fialovou mlhovinou (ikona) a minecraftí 3D nápis
MINEKUBE / STUDIOS (textové logo).

1. **Textové logo** (`assets/minekube-studios-text.png`, 1200×279) —
   černé pozadí vyčištěno na průhledné (`-fuzz 6% -transparent black`),
   ořezáno (`-trim`) a zmenšeno ze 4K. Sedí na tmavém i světlém motivu.
   V hlavičce a patičce nahrazuje text „Minekube / CZ/SK STUDIOS“.
2. **Ikona** (`assets/minekube-original-logo.png`, 512×512) — zmenšeno
   z 1024 px (2,1 MB → 440 KB) bez viditelné ztráty; v hlavičce,
   patičce, závoji i mocku launcheru. Zobrazuje se v zaobleném rámečku
   se zlatým okrajem, hover si nechal naklonění a lesklý přeblesk.
3. **Favicons** generované z kostky: `assets/favicon.png` (64 px) a
   `assets/apple-touch-icon.png` (180 px). Staré `favicon.svg`,
   `logo-mark.svg` a `logo.svg` smazány; sdílené SVG gradienty a všechna
   `mk-*` pravidla odstraněna z HTML i CSS.
4. Zdrojové soubory dodal autor přes GitHub upload na `main`
   (kořen repa, commit `e7fe95a`); web používá jen zpracované kopie
   v `assets/` na téhle větvi.


## v8.3 — nové logo **MK Hexa-Cube** (hlavička, patička, závoj, favicon)

Starou plochou kostku nahradilo nové logo naprogramované čistě v SVG:
zaoblená tmavá dlaždice se zlatofialovým prstencem, izometrická 3D kostka
(zlatý vrch, oranžový bok, fialový bok) a krémové písmeno **M** s tmavým
obrysem, jiskřičkami a jemnou minecraftí texturou pixelů na vrchu.

1. **Kde logo žije** — inline SVG v `index.html`, `modpacky/index.html`
   i `launcher/index.html` (hlavička `.brand-mark`, patička, závoj
   `.page-veil-mark`, titulek okna launcheru). Každá stránka nese jeden
   skrytý blok sdílených gradientů (`#mkBg` … `#mkSpark`), na který se
   všechna její loga odkazují — žádné duplicitní definice, žádné externí
   soubory, logo je ostré v každé velikosti.
2. **Složka `assets/`** (dřív chyběla, favicon vracel 404):
   `favicon.svg` (tučnější zjednodušená varianta pro malé velikosti),
   `logo-mark.svg` (plná značka), `logo.svg` (horizontální lockup
   MINEKUBE / STUDIOS • CZ/SK) a `apple-touch-icon.png` (180 px pro iOS).
3. **Styly (`styles.css`)** — `.brand-mark` má zlatofialovou záři, při
   najetí se nakloní a přeběhne přes něj lesklý přeblesk (`mkLogoSheen`),
   jiskry jemně třpytí (`mkSparkleIdle`, na závoji rychleji); ve světlém
   motivu i při `prefers-reduced-motion` se chová klidně. Nápis
   „Minekube / CZ/SK STUDIOS“ vedle loga dostal tučnější řez a zlatý
   gradient. V ministroni launcheru se pixely a malá jiskra schovávají,
   aby logo zůstalo čitelné.
4. **Oprava avataru** v mocku launcheru — rozbitý zlomek kostky
   (`d="m24 3 0 0 …"`) nahradila správná ikona uživatele.
5. Ověřeno: všechna `url(#…)` log mají na každé stránce svůj gradient,
   SVG tagy jsou párové, logo vyrenderované přes resvg je čitelné
   od 480 px až po 16px favicon.


## v8.2 — stránka **Launcher** (hero s mockem aplikace, platformy, roadmapa)

Nová podstránka `launcher/` v duchu modrinth.com/app, ale v barvách a jazyce
Minekube. Celý web je teď provázaný: hlavní stránka ↔ modpacky ↔ launcher
(stejné hlavičky, patičky, plynulé přechody i jeden jazykový přepínač).

1. **Architektura — stejný vzorec jako u `modpacky/`**
   - `launcher/i18n.js` se načítá před `app.js` a nastavuje
     `window.MINEKUBE_PAGE_I18N` (133 klíčů × CZ/EN/SK, parita ověřená),
   - `launcher/launcher.js` = logika stránky: detekce platformy
     (Windows/macOS/Linux) a přepínání tlačítka ke stažení, toasty
     „sestavení připravujeme", živá simulace stahování v mocku okna
     a reveal při scrollu přes `registerRevealElements()` z app.js,
   - `app.js`: `/launcher/` přidané do `PAGE_TRANSITION_PATHS` (plynulý
     závoj mezi všemi třemi stránkami) + klíče `panel.launcher`,
     `cta.launcher.title` a `cta.launcher.aria` do tří jazyků.
2. **Hero stránky Launcher**
   - štítky ALPHA // VE VÝVOJI a OPEN SOURCE, velké zlaté tlačítko
     „Stáhnout pro {os}" s detekcí a přepínačem platformy,
   - **mock okna launcheru čistě v CSS/HTML** (žádné obrázky): sidebar,
     karty instancí (Ultra/Performance/PvP), animovaný průběh stahování
     s procenty, statusová lišta „Java 21 nalezena", plovoucí 3D náklon
     a záře na pozadí; respektuje `prefers-reduced-motion`,
   - mock je `aria-hidden` a plně nefokusovatelný (přístupnost).
3. **Sekce stránky**: mřížka 6 funkcí („Launcher, jaký jsi ještě neviděl"),
   tři alternující řady s CSS mocky (bezpečná aktualizace s changelogem,
   vestavěný katalog pěti profilů s odkazem na `modpacky/`, výkonový
   monitor s animovaným FPS grafem), karty platforem s požadavky,
   roadmapa v0.1 → v0.2 → v1.0, open-source banner a CTA na katalog.
4. **Propojení s hlavní stránkou (`index.html`)**
   - navigace (desktop i mobil) a patička: Launcher už není `aria-disabled`,
   - hero panel: nový modul **LAUNCHER** („Modpacky na jeden klik"),
     OPEN SOURCE modul je nyní přes celou šířku (`.mk-intro-module--wide`),
   - CTA sekce: druhé tlačítko „Stáhnout launcher" (`.button-cta-ghost`).
5. **Propojení se stránkou Modpacky**: navigace (desktop i mobil) a patička
   odkazují na `../launcher/`; launcher zase z řady „Katalog vestavěný"
   odkazuje zpět na `../modpacky/`.

## v8.1 — modpacky se stahují z vlastního repozitáře `MinekubeStudios/modpacky`

Balíčky už nejsou odkázané na ruční zrcadla: každý modpack má vlastní
**vydání (GitHub Release)** v samostatném repozitáři `modpacky` a web si
z něj bere **vždy to nejnovější**.

1. **Nový repozitář `MinekubeStudios/modpacky`** (obsah je připravený ve
   složce `modpack-repo/` v tomhle repu, založí ho
   `tools/create-modpack-repo.sh`):
   - `packs/<id>/pack.json` + `CHANGELOG.md` — metadata a changelog balíčku,
   - `manifest.json` — **generovaný** index nejnovějších vydání pro web,
   - `tools/build-manifest.mjs` — sestaví manifest z GitHub Releases,
   - `tools/publish-release.sh` — založí vydání (tag `<id>-v<verze>`),
     nahraje `.mrpack` / `.zip`, doplní `.sha256`, spustí manifest,
   - `tools/make-mrpack.sh` — zabalí složku instance do `.mrpack`
     (`modrinth.index.json` + `overrides/`) a přidá checksum,
   - `tools/validate-release.mjs` — kontrola konvencí vydání,
   - `.github/workflows/manifest.yml` — po publikování vydání sám
     přegeneruje `manifest.json` (a `[skip ci]` commitne),
   - `.github/workflows/validate-release.yml` — kontrola tagu a souborů.
   - Návody: `docs/JAK-NAHRAT-VYDANI.md` (krok za krokem) a `docs/MANIFEST.md`.
2. **Web (`modpacky/releases.js`)** — jediné místo, kde je repozitář
   napojený (`CONFIG.owner` / `CONFIG.repo`). Načítá data v pořadí:
   `manifest.json` → jsDelivr → GitHub Releases API → statická data
   v katalogu. Výsledek drží 10 minut v `localStorage`
   (`?releases=refresh` vynutí nové načtení, `?releases=demo` ukáže
   `manifest.demo.json` bez publikovaného vydání).
3. **Katalog (`modpacky/modpacky.js`)**:
   - karta má řádek `.pack-release-row` s verzí a datem vydání a vedle
     `.zip` druhou variantu (když balíček nabízí oba formáty),
   - tlačítko stahuje **primární soubor vydání** (`.mrpack`, jinak `.zip`);
     popisek se mění podle formátu, tooltip nese verzi a datum,
   - detail balíčku vykresluje `packModalReleaseHtml()`: dvě tlačítka
     (`.mrpack` + `.zip`), SHA-256, odkazy na stránku vydání a na všechna
     vydání, rozbalovací changelog a seznam starších vydání,
   - dokud balíček žádné vydání nemá, chování zůstává původní
     („Odkaz připravujeme“, případně ruční zrcadlo z `MODPACKS`),
   - „stav vydání“ v kartách i filtrech se počítá z reálných vydání
     (`packIsLive()`), datum aktualizace taky.
4. **Sekce „Jak nainstalovat“** má nový blok `.repo-note` s odkazem na
   repozitář a kroky popisují `.mrpack` (import v Prism Launcheru) i `.zip`.

### Nasazení nového repozitáře (2 kroky)

```bash
./tools/create-modpack-repo.sh --dry-run   # co se stane
./tools/create-modpack-repo.sh             # založí MinekubeStudios/modpacky a nahraje obsah
```

Když účet nemá právo zakládat repozitáře v organizaci, založ prázdný
repozitář ručně na GitHubu a spusť `./tools/create-modpack-repo.sh --push-only`.
Web funguje i bez vydání — jen místo tlačítka ukazuje „Odkaz připravujeme“.

## v8 — stránka **Modpacky** je na světě (katalog, filtry, detail balíčku)

Hlavní stránka na `modpacky/` odkazovala od začátku (navigace, hero CTA, modul
v panelu, pilíř, footer) — chyběla jen samotná stránka. Teď existuje a používá
**stejný design systém** (`styles.css`), **stejnou `app.js`** (motiv, jazyk,
toast, modal, Ko-fi portál) i stejnou hlavičku a patičku.

1. **Architektura (jedna app.js pro celý web)**
   - `modpacky/i18n.js` se načítá **před** `app.js` a nastaví
     `window.MINEKUBE_PAGE_I18N = { cs: {…}, en: {…}, sk: {…} }`; `app.js` si
     klíče přidá do svého slovníku. Jeden přepínač jazyka, jedna
     `localStorage`, žádná duplikace kódu.
   - `app.js` po přepnutí jazyka posílá událost `minekube:language`; katalog si
     podle ní překreslí dynamické karty, filtry i řazení.
   - `modpacky/modpacky.js` = data balíčků + logika katalogu (načítá se po
     `app.js`, používá jeho `t()`, `escapeHtml()`, `showToast()`,
     `showModal()`/`closeModal()` i reveal při scrollu).
2. **Katalog** (`.catalog.catalog-clean-aligned` — bloky „MODPACKY …“ ve
   `styles.css`, které na tuhle stránku čekaly):
   - **Filtry** (`.filters-panel`): hledání, loader, verze Minecraftu, zaměření
     a stav vydání. Počty u každé volby se počítají průběžně (fasetové filtrování)
     a volba, která nic nenajde, se rovnou zašedne.
   - **Vlastní řazení** (`.sort-control`): doporučené (oblíbené napřed), název
     A–Z, nejvyšší FPS, naposledy aktualizované. Nad tím `result-count`
     s počtem výsledků a `empty-state`, když filtr nic nevrátí.
   - **Karty** (`.pack-card`): barevný banner s 3D Minekube kostkou
     (`--pack-accent`, `--pack-accent-rgb`, `--cover-accent-rgb`, `--cube-c`,
     `--cover-bg`), HUD popisky, data strip, srdíčko oblíbených
     (`.favorite-button` + burst částice), release stav, tagy, tři statistiky
     a akce — stahovací tlačítko `download-ultimate` nebo zlaté
     `release-pending-button` („Odkaz připravujeme“).
   - **Detail balíčku** v modalu (`.modal-hero`, `.modal-stats`, `.modal-columns`,
     `.modal-download`) — statistiky, popis, tři featury, požadavky a zrcadla.
   - **Přepínač filtrů na mobilu** (`.filter-toggle` → `.filters-panel.mobile-open`),
     zkratka **Ctrl K** pro hledání a **Esc** zavře řazení i modal.
3. **Obsah** — 5 profilů: `ultra`, `performance`, `pvp`, `lite`, `vanilla`
   (rozpracovaný). Každý má vlastní verzi, loader, zaměření, FPS, RAM, počet
   modů a datum aktualizace.
   - **Kde upravit balíčky:** `modpacky/modpacky.js`, konstanta `MODPACKS`
     (jediné místo — jméno, barvy, verze, statistiky i `mirrors`).
   - **Kde upravit texty:** `modpacky/i18n.js` (CZ/EN/SK, včetně popisů balíčků).
   - **Odkazy ke stažení:** `mirrors: [{ label, url }]`. Když je pole prázdné,
     karta ukáže `release-pending-button` a klik otevře detail balíčku.
     Předvyplněný je jen Game Jolt u `ultra` (stejný odkaz jako v patičce).
4. **Drobné (aditivní) úpravy sdílené `app.js`** — nic z chování hlavní stránky
   se nemění: převzetí `MINEKUBE_PAGE_I18N`, událost `minekube:language`, tři
   nové typy toastu (`download`, `success`, `favorite` → `is-download-start`,
   `is-download-success`, `is-favorite`) a guard na `#currentYear`.
5. **Plynulý přechod mezi oběma stránkami** (blok `PLYNULÝ PŘECHOD MEZI STRÁNKAMI`
   v `styles.css` + `initializePageTransition()` v `app.js`)
   - klik na odkaz, který vede z hlavní stránky na `modpacky/` (navigace, hero CTA
     „Procházet modpacky“, modul v panelu, pilíř, patička i CTA) se **nepřeskočí**:
     přes obrazovku se převalí lehký závoj (`#pageVeil` — gradient, mřížka,
     paprsek, logo Minekube + popisek a tenká progress linka) a teprve v momentě,
     kdy je scéna zakrytá (**430 ms**), se změní dokument;
   - cílová stránka je na okamžik zakrytá stejně (inline skript v `<head>`
     přečte `sessionStorage` příznak a přidá `html.mk-arriving`), závoj se z ní
     stečí pryč a obsah se zvedne — přechod tak působí jako jedna plynulá akce;
   - závoj kreslí **jen tyhle dvě stránky** (`PAGE_TRANSITION_PATHS`), takže se
     nespustí na Store ani na jiný web; kotvy na téže stránce, nová karta
     (Ctrl/Cmd), střední tlačítko ani `prefers-reduced-motion` závoj nepoužívají;
   - při návratu z historie (bfcache) se závoj okamžitě uklidí (`pageshow`),
     třída `mk-arriving` zmizí i po dohrání animace nebo po časové pojistce
     v hlavičce — nikdy nezůstane viset.

6. **Nový CSS blok** na konci `styles.css`: `STRÁNKA MODPACKY (modpacky/index.html)`
   — drobečková navigace, poznámka v panelu profilů, viditelnost vlastního
   řazení, zvýraznění karty po kliknutí na profil, jádro výkonu v modalu
   a responzivita.

Ověřeno jsdomem nad reálným během obou stránek: `modpacky/` **43/43** kontrol
(vykreslení pěti karet, fasetové filtry, prázdný stav, řazení, oblíbené
v `localStorage`, detail balíčku, překlad dynamického obsahu, pokrytí CSS tříd)
a hlavní stránka **13/13** (jazyky, modaly, manifest, toast, odkazy na
`modpacky/`, stejný počet klíčů ve všech jazycích — 146/146/146).

---

## v7 — tlačítko je zase originál, jen si ponechalo jiskry a celostránkový portál

Podklad: nahrané soubory (`uploads/index.html`, `uploads/styles.css`, `uploads/app.js`)
jsou přesně stav po kole v4 — tedy **původní Ko-fi tlačítko** tak, jak bylo navržené.

1. **Vzhled tlačítka = nahraný originál, byte po byte.** Z `site/styles.css` byly
   **vyříznuté** bloky, které tlačítko v 5. a 6. kole měnily:
   `KO-FI TLAČÍTKO // SYTĚJŠÍ A ŽIVĚJŠÍ` (dobarvovací `filter`, přepis conic ringu,
   dlaždice 46 px, titulek 15 px, `min-width: 268px`) a
   `KO-FI TLAČÍTKO // V6 …` + `V6 B` + `V6 C` (zmenšenina 36 px, `kofiLetterGlow`,
   `kofiLetterHot`, `kofiLabelSweep`, `kofiKickerBlink`, `kofiMarkGlow`, `kofiIconHalo`,
   `kofiSteam`, gradient `#kofiMarkWarm`).
   Prvních 334 566 znaků souboru je teď **identických** s `uploads/styles.css`
   (test to kontroluje přímo), takže tlačítko má zase dlaždice 42 px, logo 23 px,
   popisek 12 px, rozložení `232px / 42px minmax(118px,1fr) 31px`, ring
   `inset:-4px / 3.1s` a záři i animace přesně podle originálu.
2. **Z v6 zůstaly jen částice** — nový blok `KO-FI TLAČÍTKO // ČÁSTICE Z HOVERU`
   obsahuje výhradně styly jisker: `.kofi-button .store-fx-icon.is-heart`,
   `.is-cup`, `.is-bolt`, `.is-cube` (s rámečkem a tvrdou hranou) a tenký
   `store-fx-bolt`. Jiskry pořád sype `spawnStoreFx` v `app.js` ve čtyřech druzích
   (srdíčka `♥ ♥ ♡`, kafíčka `☕︎ ☕︎ ♨︎`, blesky `ϟ ↯ ↯`, kostky `▣ ◈ ⬢ ✦`),
   burst **34 ks**, únik **12 ks / 190 ms**, život **820–1480 ms** — tohle
   se měnit nebude, dokud si to nevymyslíš jinak.
3. **Celostránkový portál zůstává beze změny** — bloky `KO-FI GATE // CELOSTRÁNKOVÝ
   PŘECHOD` a `KO-FI GATE // OKAMŽIK PŘESMEROVÁNÍ`, markup `#kofiGate`, logika
   `openKofiGate()` ani tři i18n klíče `kofi.gate.*` se nedotkly. Tedy: klik na
   tlačítko ⇒ pulz z místa kliknutí, sjíždějící poloviny 57 %, mřížka, paprsek 16°,
   14 jisker, konzole s emblémem a progresem, navigace v 1080 ms, Escape/Zrušit,
   `prefers-reduced-motion` = přímý přechod bez animace.
4. **HTML tlačítka** je také zpět: pryč je `<span class="kofi-steam">` a `<defs>`
   z gradientu loga. Zůstalo `data-kofi-gate` a **stejný panel** (bez `target="_blank"`)
   — bez toho by celostránkový přechod nemohl proběhnout. Když chceš Ko-fi v nové
   kartě, stačí vrátit `target="_blank"` a vypnout `initializeKofiGate()`.

Ověřeno: `bash tools/build.sh` → `node --check app.js: OK`,
`tools/dom_test.js` **136/136**, `tools/lang_test.js` **31/31**,
`css-tree` 0 chyb; test navíc srovnává úvod `styles.css` s nahraným souborem.

---

## v6 — tlačítko bylo kompaktní, text dýchal, logo svítilo a létalo víc jisker

> ⚠ Tenhle blok je z větší části **vrácený** (v kole v7) — platí z něj jen:
> body 4 (částice) a 5 (redukovaný pohyb). Popis níže necháváme jako historii.

Původní popis šestého kola: blok v `site/styles.css` se jmenoval
`KO-FI TLAČÍTKO // V6 — KOMPAKTNÍ, TEXT DÝCHÁ, LOGO VYLEPŠENÉ` (+ `V6 B — DOLADĚNÍ`),
částice se změnily v `app.js` (`spawnStoreFx`).

1. **Zmenšené tlačítko** (bylo příliš velké):
   - dlaždice s logem **46 → 36 px**, SVG **30 → 23 px**, `min-height` **54 → 46 px**,
     `min-width` **268 → 226 px**, sloupce `46 / 140 / 31` → **`36 / 112 / 26`**, gap 11 → 8 px;
   - titulek **15 → 12,5 px**, kicker **9 → 8 px**, scvrkl se i ring kolem tlačítka
     (`inset: -4px; padding: 4px`), záře `::after` a šipka (18 → 15 px);
   - na mobilu dlaždice 34 px a titulek 12 px; sytost (`saturate 1.3 / 1.48`) zůstala.
2. **Rozanimovaný text** — písmena si drží původní vlnu (`storeTextIdle`,
   `storeTextWave`) a **navíc** k nim běží druhá animace, která sahá jen na barvu a záři,
   takže se to nepřetlačuje:
   - `kofiLetterGlow` — teplé a studené dýchání po písmenech se staggerem `calc(var(--i) * .13s)`;
   - `kofiLetterHot` — na hover písmena zčervenají a dostanou trojitou záři (1,15 s);
   - `kofiLabelSweep` — světelný pruh přejíždí přes celý popisek (3,8 s, na hover 1,5 s),
     `mix-blend-mode: screen`, skew -16°; aby neřízl vlnící se písmena, má popisek
     `padding: 3px 0; margin: -3px 0` místo čistého ořezu;
   - `kofiKickerBlink` — kicker „KO-FI“ jemně dýchá spolu se svou jiskrou.
3. **Vylepšené logo Ko-fi**:
   - pohár už není ploše bílý — `fill: url(#kofiMarkWarm)` (teplý přechod
     `#fffaf4 → #ffd9ac → #ff9f57`, `<defs>` přímo ve SVG v hlavičce);
   - `kofiMarkGlow` — celé logo pulzující září (3 s, na hover 1,25 s);
   - `kofiSteam` — **tři proužky páry** stoupající nad pohárem
     (`<span class="kofi-steam"><i></i><i></i><i></i></span>`), na hover zrychlí;
   - `kofiIconHalo` — dlaždice dýchá prstencem, aby záře kolem loga nebyla statická;
   - srdíčko jasnější (dvojité `drop-shadow`) a na hover přepne výplň na `#ff736e`,
   - srdíčko dál bije v původním rytmu (`kofiHeartBeat` 2,1 s, hover 1,15 s).
4. **Víc částic na hover — a jen ty správné tvary**:
   - `spawnStoreFx` má čtyři druhy s vlastní paletou i glyfy —
     **srdíčka** `♥ ♥ ♡`, **kafíčka** `☕︎ ☕︎ ♨︎`, **blesky** `ϟ ↯ ↯`,
     **kostky** `▣ ◈ ⬢ ✦` (Minecraft block s rámečkem a tvrdou hranou);
   - Víc jich je: burst po najetí **28 → 34 ks**, únik **9 / 210 ms → 12 / 190 ms**,
     život 720–1260 → **820–1480 ms**, první burst se rozléhá do větší šířky;
   - glyfy mají vynucenou textovou prezentaci (`U+FE0E`), aby se neobarvily do emoji;
   - třída `store-fx-icon is-heart|is-cup|is-bolt|is-cube` to celé obarví a doplní
     `text-shadow` / rámeček; barvu i velikost posílá JS (`--fx-color`, `--fx-size`).
5. **`prefers-reduced-motion`**: dýchání textu, sweep, pára, pulz loga i prstenec
   dlaždice se vypínají (`animation: none !important`), sweep se schová úplně.

> Poznámka ke glyfům: `☕︎` a `♨︎` mají ve většině prohlížečů textovou podobu,
> ale třeba na iOS se můžou vykreslit jako emoji. Kdybys chtěl jistotu,
> dají se zaměnit za čisté textové tvary nebo vlastní SVG — řekni.

## v5 — Ko-fi tlačítko je výraznější a po kliknutí otevře portál

1. **Sytější a živější tlačítko „Podpořit projekt“** (`site/styles.css`, blok
   `KO-FI TLAČÍTKO // SYTĚJŠÍ A ŽIVĚJŠÍ`). Barvy ani animace se neměnily — jen
   jejich síla a čitelnost:
   - `filter: saturate(1.3) brightness(1.07)` nad celým tlačítkem, na hover
     `saturate(1.48) brightness(1.16)`;
   - rotující RGB ohraničení má navíc Ko-fi červeň `#ff5f5b` (conic gradient
     `#ff7a5c → #59f7ff → #9d60ff → #ff4fdf → #ff8b48 → #ffe173 → #ff5f5b`),
     trojnásobné `drop-shadow` záření a zrychlenou rotaci 2.4 s (na hover 0.92 s);
   - galaxie, mlha (`opacity: .88`, `saturate(1.45)`), hvězdy i scan linka jsou
     sytější a teplejší, chladná modrá paleta zůstává zachovaná;
   - **logo je větší a čitelnější**: dlaždice 46 px, SVG 30 px, pohár v
     `#fff6ee` s teplou září, srdíčko `#ff5f5b` s `drop-shadow(0 0 10px …)`
     a dál bije (`kofiHeartBeat`, na hover zrychleně);
   - **text je výraznější**: kicker „KO-FI“ 9 px s letter-spacingem a teplou
     oranžovou, titulek 15 px skoro bílý `#fffdfb` se třemi vrstvami textového
     stínu (teplá + fialová), na hover se písmena zvedají pořád po jedné
     (`storeTextWave`);
   - tlačítko je širší — `min-width: 268 px`, sloupce `46 px / 140 px / 31 px`.
   Všechny doby a křivky zůstaly původní, jen se přidaly barvy a rozměry.

2. **Celostránkový přechod při kliknutí na Ko-fi** (bloky `KO-FI GATE …` a
   `KO-FI GATE // OKAMŽIK PŘESMEROVÁNÍ`, markup `#kofiGate` v `index.html`,
   logika `openKofiGate()` v `app.js`). Jde o věrný přepis původního
   Minekube portálu (`mk-page-transition` z originálu), přebarvený do Ko-fi
   červené `#ff5f5b` a Minekube zlaté `#ffb51f`:
   - dvě poloviny **57 %** se **šikmým střihem** (`clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%)`)
     sjedou z boků a drží zamčenou obrazovku; doba **1.52 s** s krytím scény
     od 28 % do 72 % a křivkou `cubic-bezier(.72, 0, .18, 1)` — stejné jako originál;
   - **perspektivní mřížka** (`perspective(700px) rotateX(64deg)`), **paprsek
     pootočený o 16°**, polární záře, **14 jisker** se souřadnicemi z originálu,
     scanlinky;
   - **konzole** uprostřed: emblém se **dvěma oběžnicemi** a logem Ko-fi
     (pohár + tloučící srdíčko), kicker `MINEKUBE // KO-FI CHANNEL`, nadpis
     **„Otevírám ko-fi.com“**, status, **progress linka na 1.2 s** a hostitel;
   - z místa kliknutí se rozletí **pulz** — prstencová záře, mřížka a kříž
     (`.kofi-pulse`, `z-index: 15200`);
   - **přesměrování startuje v 1080 ms**, tedy uvnitř zamčené scény, a zároveň
     se spustí „odpálení“: záře z paprsku a konzole odpluje do dálka
     (`kofiGateLaunch`, `kofiGateFlare`). Prohlížeč mění dokument v momentě,
     kdy je celá obrazovka zakrytá — žádné bliknutí prázdné stránky;
   - portál se dá **zrušit** (tlačítko Zrušit nebo **Escape**) dokud
     neproběhla navigace; po odehraní se sám skryje a stránka se odblokuje;
   - Ko-fi se otevírá **ve stejném panelu** (na tlačítku už není
     `target="_blank"`), jinak by přechod nedával smysl. Střední/tlačítko s Ctrl
     nebo Cmd otevírá novou kartu bez animace, jako zvykem;
   - `@media (prefers-reduced-motion: reduce)`: JS animaci přeskočí a jde
     rovnou na Ko-fi, CSS navíc portál zkracuje na `0.001 ms`.

3. **Překlady** — přibyla tři klíče pro portál ve všech třech jazycích:
   `kofi.gate.title`, `kofi.gate.status`, `kofi.gate.cancel` (120 klíčů na jazyk,
   pokrytí ověřeno oběma směry).

## v4 — tlačítka (design původního webu)

1. **Primární CTA „Procházet modpacky“** — design původního tlačítka
   „O projektu Minekube“ (`.mk-home-primary` z originálu): zlatý gradient
   `#ffdb55 → #ffaf18 → #ff733b → #e864ef`, rotující conic aura za obsahem,
   světelný bod sledující kurzor (`--mx/--my` v JS), dlaždice s ikonou,
   kicker + titulek a šipka, která při hoveru odjíždí.
   Třídy se jmenují `.mk-cta-primary*` (aby se ve sdíleném `styles.css`
   nepotkaly s originálem), `@keyframes mkCtaAuraSpin` je přepsané z `mkHomeActionSpin`.
2. **„Otevřít Store“ v intru je pryč** — na jeho místě je **GitHub tlačítko**
   (`.mk-cta-github`) s oficiálním logem (vnořené SVG, žádný obrázek navíc),
   kickerem „ZDROJOVÝ KÓD“, titulkem „Minekube na GitHubu“ a šipkou ↗.
   Otevírá se v novém panelu s `rel="noopener noreferrer"`.
3. **Hlavičkové animované tlačítko „MINEKUBE STORE“ → „Podpořit projekt“**
   (`<a class="store-button kofi-button" data-kofi-gate>`). Design systém
   zůstal beze změny: galaxie s mlhou a hvězdami, rotující RGB ohraničení,
   blesky, oběžné dráhy, scan linka, rohy, částice generované JS a vlnování
   popisku po písmenech. Logo Ko-fi (pohár + ucho) je v `currentColor`, srdíčko
   zvlášť v barvě Ko-fi s vlastní animací. Obě cesty jsou vygenerované
   skriptem `tools/kofi_paths.py` ze SVG Simple Icons (CC0) a rasterem ověřené
   jako pixelově shodné s originálem.
4. **Odkazy na jednom místě** — `SITE_LINKS` v `app.js` (Ko-fi, GitHub, Store).
   V HTML jsou prvky označené `data-site-link="kofi|github"`; bez JavaScriptu
   fungují odkazy napsané natvrdo v HTML.

> **Doplň vlastní Ko-fi adresu:** `https://ko-fi.com/minekubestudios`
> je předvyplněná podle názvu účtu (při kontrole vrací Cloudflare 403, takže
> se nedala ověřit z profilu) — změň ji v `SITE_LINKS` a v `href` v `index.html`.
> Portál i popisek hostitele berou URL odtud, stačí tedy jedna změna + `href`.

## Stav z předchozích kol (pořád platí)

- **Žádné celoobrazovkové animace u běžné navigace** — boot loader
  `#futureLoader`, přechod sekcí `#pageTransition`, „nájezd“ cílové sekce
  (`.mk-section-preparing` / `-arriving` / `.mk-section-entry-sweep`) ani
  Store pulz nebyly vrácené; celou obrazovku překrývá **jen** portál ke Ko-fi
  a od v8 krátký závoj při přechodu hlavní web ↔ `modpacky/` (430 ms, viz výše). Z `styles.css` zůstávají fyzicky smazané
  odpovídající pravidla i mrtvé `@keyframes` (původně 681 pravidel,
  92 keyframes, soubor klesl z 411 kB na 319 kB).
- **Sloučené sekce** — `Domů` a `Studio` jsou uvnitř jedné sekce **O projektu
  (`#projekt`)**: intro → manifest → 4 principy → Kdo jsme → 4 pilíře.
- **Server** — tlačítko (ne odkaz) v navigaci i v mobilním menu, po kliknutí
  toast „Komunitní server právě připravujeme“.
- **Přepnutí jazyka** — glóbus CZ/EN/SK vedle tlačítka motivu; překlad přes
  `data-i18n` / `data-i18n-aria` / `data-i18n-title`, zahrnuje i `<title>`,
  `meta description`, texty tlačítek, modaly a toasty.
  Ukládá se do `localStorage` (`minekube-lang`), umí `?lang=en|cs|sk`.

## Struktura

| Soubor | Popis |
|---|---|
| `index.html` | Jedna stránka: portál `#kofiGate` → hlavička → O projektu → CTA → patička |
| `styles.css` | Design systém původního webu **minus** pravidla celoobrazovkových animací, **plus** bloky `LANG SWITCHER + NAV SERVER BUTTON + SLOUČENÁ JEDNA STRÁNKA` (v3), `INTRO CTA` + `KO-FI` (v4), `KO-FI GATE // …` + `OKAMŽIK PŘESMEROVÁNÍ` (v5)
  a `KO-FI TLAČÍTKO // ČÁSTICE Z HOVERU` (v7). Přepisové bloky `SYTĚJŠÍ A ŽIVĚJŠÍ` (v5)
  a `V6 …` byly v kole v7 vyříznuté — `styles.css` tak začíná přesně obsahem nahraného originálu. Soubor se **pouze doplňuje**, nikdy se regeneruje ze starých uploadů. |
| `app.js` | Motiv, jazyk (i18n + `MINEKUBE_PAGE_I18N` pro podstránky), toast, modaly, reveal při scrollu, 3D tilt, `SITE_LINKS`, rozklad popisku na písmena, kurzorový svit primárního CTA, částice tlačítka, `openKofiGate()` / `closeKofiGate()` / `launchKofiPulse()` a `initializePageTransition()` |
| `modpacky/index.html` | **Druhá stránka — katalog modpacků**: stejná hlavička, patička, Ko-fi portál, modal i toast jako hlavní stránka + hero s profily, filtry, mřížka balíčků, instalace a CTA |
| `modpacky/i18n.js` | Překlady stránky Modpacky (CZ/EN/SK) — `window.MINEKUBE_PAGE_I18N`, načítá se před `app.js` |
| `modpacky/modpacky.js` | Data balíčků (`MODPACKS`) a logika katalogu: filtry, hledání, vlastní řazení, oblíbené, detail balíčku v modalu, animace stahování, napojení na vydání z repozitáře |
| `modpacky/releases.js` | **Vydání z repozitáře `MinekubeStudios/modpacky`** — adresa repa je jen tady (`CONFIG`), čtení `manifest.json` → jsDelivr → GitHub API, cache v `localStorage`, událost `minekube:releases`, veřejné API `window.MinekubeReleases` |
| `modpacky/manifest.demo.json` | Ukázkový manifest pro vývoj (`modpacky/?releases=demo`) — ostrá data chodí z repozitáře s modpacky |
| `modpack-repo/` | **Obsah samostatného repozitáře s modpacky** (`packs/`, `manifest.json`, `tools/`, `.github/workflows/`, `docs/`) — nahrává ho `tools/create-modpack-repo.sh` |
| `tools/create-modpack-repo.sh` | Založí `MinekubeStudios/modpacky` a nahraje do něj `modpack-repo/` |
| `tools/releases_test.mjs` | Test napojení na repozitář (jsdom): manifest, záložní GitHub API, demo i stav bez sítě |
| `assets/favicon.svg` | Favicon z brand znaku |

## Sekce stránky

1. **O projektu (`#projekt`)** — vše na jedné stránce
   - **Intro** — titulek „Minecraft budoucnosti. Otevřený úplně všem.“, lead text,
     tlačítka (Procházet modpacky, GitHub), 3 čísla a informativní panel
     se 4 moduly ekosystému
   - **Manifest** — karta „Výkon bez zničení původního Minecraftu“ + 4 štítky + 3D emblém
   - **Principy** — 4 karty (Vanilla friendly, Bezpečné aktualizace, Čistá konfigurace,
     Transparentní changelog)
   - **Studio** (`#ekosystem`) — karta „Kdo jsme“ (hodnoty + fakty + emblém) a
     **4 pilíře**: Modpacky (LIVE → `modpacky/`), Komunitní server (tlačítko „Brzy“),
     Store (OPEN → Store), Open source
2. **CTA + patička** — CTA na modpacky, patička s dialogy (Changelog, Kompatibilita, Licence)

## Navigace

- **O projektu** — kotva `#projekt`
- **Modpacky** — odkaz na `modpacky/` (druhá stránka, součástí balíčku od v8);
  na své stránce je položka označená jako aktivní a „O projektu“ vede zpět na `../`
- **Server** — tlačítko, žádná stránka (jen info toast)
- **vpravo v hlavičce** — tlačítko motivu, tlačítko jazyka a **Ko-fi tlačítko**,
  které otevírá portál přes celou obrazovku

## Jak spustit

```bash
cd site
python3 -m http.server 8080 --bind 0.0.0.0
```

## Poznámky

- Odkazy na Store a Game Jolt vedou na produkční URL; GitHub je napojený
  (`data-site-link="github"`), Discord zůstává placeholder (`#`) — doplň vlastní odkaz.
- `styles.css` je sdílený s dalšími stránkami. Portál ke Ko-fi je samostatný
  v selector `.kofi-gate*`, takže se nesrazí s nicím jiným; odstraněné
  celoobrazovkové animace se týkají i přechodů na stránce Modpacky.
- Tmavý/světlý motiv je beze změny; portál i tlačítko vypadají stejně v obou
  (tlačítko je záměrně „temná galaxie“ v obou motivech, jako byl Store).

## Testy

Testy jsou přiložené v adresáři `tools/` (potřebují `jsdom`:
`npm install jsdom --no-audit --no-fund --prefix /tmp/testenv`).

```bash
node --check site/app.js
bash tools/build.sh      # totéž + obě sady testů
node tools/dom_test.js   # 136 kontrol (chování, i18n, tlačítka, CSS, portál, částice)
node tools/lang_test.js  #  31 kontrol (jazyky, portál v 3 jazycích, odkazy, bez localStorage)
```

Navíc test napojení modpacků na repozitář s vydáními (`tools/releases_test.mjs`,
31 kontrol ve čtyřech scénářích — manifest, GitHub API, demo, úplně bez sítě):

```bash
node tools/releases_test.mjs
```

Stejně jako generátor manifestu v repu s modpacky se dá ověřit i sám:

```bash
cd modpack-repo && node tools/test-manifest.mjs   # 24 kontrol
```

Testy běží v jsdomu (CSS parser `css-tree` hlásí 0 chyb na 2287 pravidlech).
Ověřují mj. to, že úvod `styles.css` je shodný s nahraným originálem (tlačítko = původní), že najetí myší nasype 34 jisker správných tvarů a barev, a že navigace startuje uvnitř zamčené scény (1080 ms ze 1520 ms,
tedy uvnitř krytí 28 %–72 %), že druhý klik animaci nepřehraje znovu, že Escape
portál zavře a už nenaviguje, a že se portál po sobě sám sklidí.
