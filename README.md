# Minekube Studios // Web (v16 — nový hero text a hloubkový audit chyb)

## v16 — **nový hero text, titulkový nadpis na dva řádky a audit celého webu**

Hero dostal nový text. Oba řádky jsou velký nadpis (dřív byl velký jen
první), takže „Launcher Of The Future." a „Your Minecraft." nesou stejnou
váhu. Překlady (cs/sk) jsou vlastní, ne doslovné:

* cs — „Launcher budoucnosti." / „Tvůj Minecraft."
* sk — „Launcher budúcnosti." / „Tvoj Minecraft."
* en — „Launcher Of The Future." / „Your Minecraft."

Odstavec pod nadpisem se **rozdělil na čtyři skutečné `<p>`** (úvod,
komu je launcher určený, „no ads, no telemetry, no subscriptions",
„Free forever for everyone!"). Dřív to byl jeden odstavec s `<br><br>`,
což čtečka přečte jako jednu dlouhou větu bez pauz. Poslední věta je
vlastní zvýrazněný odstavec `.lpx-lead__claim`.

### Opravené chyby (v16)

* **Titulek hero přetékal — na mobilu i na desktopu.** Nový anglický
  nadpis „Launcher Of The Future." měří v Space Grotesku (váha 700,
  letter-spacing −0,02em) **11,22 em**, staré „Tvůj Minecraft." jen
  7,07 em — nárůst o 59 %. Původní `clamp(2.35rem, 4.9vw, 3.95rem)`
  tak nechal 438–735px textu v 240–595px prostoru: na mobilu se lámal
  do tří řádků, ve dvousloupcovém hero na desktopu přetékal o 140px
  a rozbíjel layout. Opraveno **container query** — titulek se měří
  podle sloupce s textem (`container-type: inline-size`), ne podle
  okna: `clamp(1.3rem, 8.2cqi, 3.95rem)`. Ověřeno na 280–2200px, text
  drží 92 % šířky sloupce. Pro prohlížeče bez container queries
  (Chrome < 105, Safari < 16, Firefox < 110) je připravený dvojitý
  `vw` fallback — jeden pro jeden sloupec, druhý přes media query pro
  dvousloupcový hero. Hlídá to test, který propočítá obě cesty.
* **`.lpx-title` měl duplicitní `max-width: 18ch`** ve druhém bloku se
  stejným selektorem — tiše přebíjel nových 20ch. Druhý blok teď řeší
  jen `text-shadow`. Strop je 22ch (rezerva 9 % místo 3 %).
* **`.kofi-gate` mohl chytit fokus, i když je skrytý** — `visibility:
  hidden` sice portál nevykreslí, ale tlačítko „Zrušit" zůstávalo
  v a11y stromu pod `aria-hidden="true"`. Doplněn `inert` v HTML i při
  přepínání v `app.js`.
* **Homepage: `role="region"` na skrytém manifestu** — prázdný landmark
  bez jména. Odebráno (kontejner zůstal `inert`).
* **Homepage: `aria-label` na `div` bez role** u `.studio-facts` —
  doplněno `role="group"`.
* **Homepage: boolean atributy se zápisem `checked="checked"` a
  `hidden=""`** — sjednoceno na `checked` / `hidden`.
* **24 ikon pod ohybem se stahovalo eager** — doplněn `loading="lazy"`
  od sekce Funkce níž. Hero si drží eager (leží nad ohybem).
* **Hero tapeta se načítala pozdě** — `preload` pro
  `wallpapers/hero-backdrop.webp` (LCP prvek).
* **Zastaralé cache-busting verze** — `lpx.css`, `launcher.js` a
  `i18n.js` měly v odkazu stará čísla, takže prohlížeč mohl servírovat
  předchozí verzi.

* **Hero titulek byl jen o 4 % větší než nadpisy sekcí.** Po zvětšení
  textu z 7,07 na 11,22 em se h1 a h2 potkaly na 48,8 px vs 46,4 px —
  stránka ztratila typografickou hierarchii a nadpisy sekcí vypadaly
  stejně důležité jako hlavní titulek. Textový sloupec hero se rozšířil
  (grid 1,22 : 1, nad 1320px má hero 1400px, ostatní sekce zůstávají na
  1200px) a nadpisy sekcí mírně zmenšily na
  `clamp(1.5rem, 3.2vw, 2.55rem)`. Poměr h1 : h2 je teď 1,17–2,35
  podle šířky — hlídá to vlastní test.
* **`max-width: 20ch` byl o 3 % těsný.** Znak „0" je v Space Grotesku
  0,638 em, takže 20ch = 12,75 em proti 11,64 em textu. Zvednuto na
  22ch.

### Ověřeno, ne opraveno

* 27 použitých ikon je optimalizovaných; ztrátová kvantizace na PNG8
  ukládá 39 %, ale je **vidět** (PSNR 26–38 dB při reálné velikosti),
  takže se **nepoužila**. Bezztrátová komprese ušetří jen 1,4 %.
* Kontrasty v obou motivech: titulek 18,4:1 (tmavý) / 17,0:1 (světlý),
  zlaté `em` 14,8:1 / 4,6:1, lead 10,8:1 / 6,7:1 — vše nad AA.

## v15 — **stránka Launcheru bez „Tří kroků“ a carouselu, tapety zůstaly**

Dvě další sekce, které opakovaly obsah, jsou pryč:

1. **„Tři kroky ke hře“** (Nainstaluj → Přines si svět → Hraj) i s pásem
   tapety Pouštního chrámu. Spolu s ní zmizel **přepínač „Ponoř se hloub“**
   v hero — po smazání mířil na stejné místo jako sousední „Prohlédnout
   funkce“.
2. **„Projeď si záložky“** (carousel šesti dlaždic) i s ovládáním šipkami,
   kolečkem a klávesnicí. Sekce „Co launcher umí“ ty záložky popisuje
   v kartách.

**Tapety z archivů zůstaly** — jen se přesunuly. Místo smazaných pásů
dostaly tapetu sekce **Funkce** (`crimson-forest.webp`) a **Prohlídka**
(`subdungeon.webp`) přes novou variantu `.lpx-section--atmo`. Ta si drží
rytmus `.lpx-section`, přidá tapetu `z-index: -2`, na ni gradient a obsah
posune do vlastní vrstvy. Ve světlém motivu má tapeta nižší krytí
a gradient z krémova, aby text zůstal čitelný.

### Opravené chyby (v15)

* **Skip link nefungoval** — `launcher.js` hledal `.lp-skip`, ale odkaz
  se jmenuje `.lpx-skip`. Handler se tedy nikdy nepřipojil a po kliknutí
  zůstal fokus na odkazu místo na obsahu. (Ověřeno v jsdom: fokus teď
  skončí na `#top`.)
* **`syncTabPill` shazoval taby** — funkce se smazala s carouselem, ale
  volala se dál z `selectTour`, takže každé přepnutí prohlídky vyhodilo
  `ReferenceError`. Odstraněno i volání.
* **`initSparkles` byl 95 řádků mrtvého kódu** — hledal
  `canvas[data-fx]`, který na stránce není, takže se okamžitě vracel.
  Odebrán i s vazbou v přepínači efektů.
* **`renderSource`, `heroSub`, `heroFileRow`, hero souborový řádek** —
  další zbytky po dřívějších smazáních; v HTML nebyly, v JS zůstaly.
  Popis pro čtečku (velikost, formát, název souboru) se teď skládá
  přímo v `renderHero`.
* **`syncAltTexts`** — překládal `data-i18n-alt` obrázky, které stránka
  nemá ani jeden.
* **Nový test hlídá mrtvé selektory** — projde `launcher.js`, vytáhne
  všechny `[data-*]`, `.třída` a `#id` selektory a ověří, že v DOM
  existují. Přesně tahle třída chyb (skip link, syncTabPill) se dřív
  neodhalila.

## v14 — **stránka Launcheru bez lišty sekcí, faktů a pásu platforem**

Na přání vypadly tři bloky, které jen opakovaly obsah okolo:

1. **Pruh rychlých faktů** (Instance vedle sebe / .mrpack i .zip / Ticho
   po síti / Java pod kontrolou) — hero i karty funkcí říkají totéž.
2. **Lepivá lišta sekcí** (Funkce · Prohlídka · Stažení · Otázky) — na
   stránce se dá skrolovat a hero má vlastní CTA. Přepínač „Efekty“
   v liště byl jediný způsob, jak vypnout animace — po jeho smazání
   zůstal ovládáním **přepínač v hero** („Animace zapnuté“), který
   teď nese `data-fx-toggle` a `aria-pressed`.
3. **Sekce „Jeden launcher. Všechny edice.“** i s přepínačem
   Platformy/Funkce, tabulkou osmi vlastností a kartami Windows/Linux.
   Platformy zůstávají v sekci Stažení, kde mají tlačítka.

Ze stavového řádku pod tlačítkem zmizel i **řádek s verzí, velikostí
a odkazem na GitHub Releases** i **název souboru**. Velikost, formát
a název souboru ale nesmí zmizet pro čtečku — zůstaly ve skrytém
`aria-describedby` popisu, který se plní dál.

### Opravené chyby (v14)

* **Responzivní pravidla od 860 px dolů byla mrtvá** — při mazání
  sekcí se zapomněl uzavřít `@media (max-width: 1080px)`, takže všechna
  užší rozložení (hero na jeden sloupec, karty 2×2, panel prohlídky,
  tabulka, CTA) byla vnořená v blocích, které se nikdy neuplatnily.
  Test na vyváženost závorek a zanoření `@media` to teď hlídá.
* **`painter.wake()` mohl shodit inicializaci přepínače efektů** —
  když prohlížeč nemá `requestAnimationFrame` (nebo ho blokuje),
  výjimka utekla z `apply()` a přepínač zůstal viset bez listeneru
  a s `disabled`. Volání je v `try/catch`, tlačítko funguje vždy.
* **Prázdný 300×150 box v layoutu** — `<svg class="mk-sprite">` se
  symboly neměl v žádném CSS pravidlo, takže si prohlížeč vyrobil
  box a posunul jím obsah. `.mk-sprite` je `position: absolute` s 0 px.
* **Mrtvé zbytky po smazaných blocích** — 6,5 kB CSS (`.lpx-facts`,
  `.lpx-nav`, `.lpx-switch`, `.lpx-plat`, tabulka, `.lpx-meta`,
  `.lpx-file`), dvě JS funkce (`initScrollUi`, `initMcSwitch`),
  44 nepoužívaných překladových klíčů ve třech jazycích a tři mrtvé
  selektory (`.lpx-screen`, `.lpx-fx__dot`, `.lpx-download__actions`).
* **„Ponoř se hloub“ mířil na smazanou sekci** — teď skáče na
  `#jak-to-funguje`.
* **Přepínač animací hlásil špatný stav** — hero tlačítko volalo
  `.click()` na druhý přepínač, který už neexistoval.

## v13 — **stránka Launcheru znovu: tapety z archivu, pixelové ikony, bez studia**

Sekce `#studio` je pryč i se svými soubory (`launcher/studio.js`,
`launcher/launcher.css`, `launcher/launcher-mc.css`). Stránka stojí na
jednom novém stylu a na skutečné grafice z archivů `WebBackgroundsV1–V3`
a `WebIcons`.

1. **Tapety dostaly hlavní roli** — `launcher/wallpapers/atmo/` má 14
   ztmavených dlaždic (Lobby, Lobby · slunce, Pouštní chrám, Karmínový les,
   Kaktusový kaňon, Pevnost, Zkažená citadela, Podzemní sluj, Java Edition,
   PC bundle, Tux, Windows, Tux a Windows, Hlavní kulisa). Prolínají se
   v pruzích mezi sekcemi přes `--bg` a `background-image`, hero má vlastní
   `hero-backdrop.webp` (59 kB). Originály měly 1,3–13 MB, proto se do
   stránky nedostaly; staré `wallpapers/hero/` + `wallpapers/thumb/`
   (2 MB) jsou smazané, protože je nikdo nepoužíval.
2. **Ikony jsou jednotné** — 52 ze 53 PNG v `launcher/icons/` má plátno
   192×192 (dřív se míchaly poměry 256×179, 165×256, 320×180…). Šest
   nových glyfů (pickaxe, anvil, bucket, torch, bell, ender-chest) a
   `windows.png` doplňují archiv; wordmark `java-edition.png` 512×107
   zůstal v původním poměru, protože se používá jako logo v okně
   launcheru, ne jako glyf v mřížce.
3. **Jeden styl místo tří** — `launcher/lpx.css` (~68 kB, scoped na
   `.lpx`) drží celou stránku včetně světlého motivu, `forced-colors`,
   tisku a redukce pohybu; `launcher/launcher-pulse.css` nese explozi
   tlačítka (`.lp-pulse-burst*` + `.lpx-download.is-pulse*`). Smazané
   `launcher.css` a `launcher-mc.css` už nic nenačítá.
4. **Stahování beze změny pravidel** — tlačítko bere instalátor z GitHub
   Releases, hlásí „Stahování zahájeno“ (nikdy „hotovo“), macOS a Linux
   jsou „V plánu“. Vzhled `.download-ultimate` zůstal ve sdíleném
   `styles.css`, `lpx.css` k němu přidává jen spinner, přelití a překryv.
5. **Patička a navigace sedí s hlavičkou webu** — lepivá navigace sekcí
   startuje pod plovoucí hlavičkou (`--lpx-nav-top`), kotvy mají
   `scroll-margin-top`, patička je 13 px a v světlém motivu má
   dostatečný kontrast (`#7a5f71`).
6. **Přístupnost** — skip link (`.lpx-skip`) se ukáže až při fokusu,
   taby prohlídky a carousel jdou z klávesnice, přepínač efektů si volbu
   pamatuje, `aria-label` má i tlačítko „Znovu zkontrolovat verzi“.

### Opravené chyby (v13)

* **Prohlídka rozhraní nereagovala na klik ani šipky** — `launcher.js`
  hledal staré `.lp-panel[role="tabpanel"]`, ale panely se jmenují
  `.lpx-panel`; taby se přepínaly jen vizuálně.
* **Carousel se zasekl na nule** — krok se počítal ze šířky dlaždice;
  když nebyla změřená (skrytá sekce, bez layoutu), posun byl 0 px.
  Nově se v tom případě skočí o kus tracku (min. 1 px).
* **33 ikon mělo jiný poměr, než uvádělo HTML** — v mřížkách se
  deformovaly; srovnáno na čtvercové plátno s průhledným okrajem.
* **Chyběl překlad `lp.toast.retryFailed`** v češtině (a doplněn i do
  angličtiny a slovenštiny), takže druhá neúspěšná kontrola verze
  hlásila syrový klíč.
* **Aura stahovacího tlačítka byla oříznutá** — `lpx.css` dával
  `.lpx-download` i `overflow: hidden`, což uřízlo rám a svit
  z `styles.css` (inset −9 px). Overflow teď má jen `.lpx-btn`.
* **Obsah pásů mohl podlézt tapetu** — `.lpx-band > .lpx-wrap` má
  vlastní vrstvu `z-index: 1` nad gradientem (`-1`) i tapetou (`-2`).

## v12 — **vizuální studio launcheru: 14 tapet z archivu a 46 ikon**

## v11 — **apple rytmus na celém webu a 3D kostka Minekube**

Nové vrstvy `apple.css` / `apple.js` (celý web) a `cube.css` / `cube.js`
(úvodní stránka) se načítají jako poslední a **nesahají do `styles.css`
ani `design-plus.css`** — každá je scoped na třídu v `<body>` nebo na
`[data-cube]`, takže se dá kdykoli vypnout odebráním jedné třídy.

1. **Struktura a typografie** — hero je jedna centrovaná myšlenka (Inter
   700, proklad −0,048 em, strop 96 px kvůli delším lokalizacím), HUD panel
   se změnil v mřížku dlaždic bez rámu, sekce dýchají v rytmu
   `clamp(88 px, 11 vw, 164 px)`. Space Grotesk zůstal na kickery a labely.
2. **Scroll-driven scéna** — lepivý produkt a tři kroky, které se odemykají
   podle scrollu (kotva 42 % výšky okna) s indikátorem průběhu. Na mobilu
   blokový tok, aby sticky skutečně cestovalo.
3. **3D kostka** (`cube.css` + `cube-webgl.js`, jen na úvodu) — skutečná
   krychle vykreslovaná **WebGL**: zaoblený box (Minkowski součet), přesné
   normály, procedurální studio se třemi světly, Fresnel a tonální
   mapování, značka vyrytá texturou na každé stěně. Vlevo sloupec pilulek
   jako na apple.com, vpravo produkt, který na volby reaguje: **barvy**
   (5 palet), **povrch** (matný / sklo / drát), **světlo** (zleva / zepředu
   / zprava) a **otáčení** (jemné kývání, po prvním tažení volné otáčení
   se setrvačností). Když WebGL chybí, nastoupí `cube.js` s CSS krychlí
   a statický `assets/cube-poster.webp` jako první snímek.
4. **Přístupnost scény** — pilulky jsou tlačítka s `aria-expanded`
   a `aria-controls`, zavřené panely mají `inert` (mimo tab i čtečku),
   volby jsou skutečné radio buttony a `aria-pressed` tlačítka, přepínač
   je `role="switch"`. Kostka je dekorace (`aria-hidden`) — informace
   nese jen panel. Bez JS zůstávají všechny panely otevřené.
5. **Pohybu se nebojíme, ale nevnucujeme ho** — `prefers-reduced-motion`
   vypne auto-rotaci i setrvačnost a odhalí poznámku, proč se kostka
   netočí; tisk skryje 3D scénu a rozbalí panely.
6. **Překlady** — 24 nových klíčů `cube.*` v CS / EN / SK vedle
   `ap.scene.*`; test hlídá, že žádný v HTML použitý klíč nechybí.
7. **Ověřeno** — `csstree-validator` bez chyby (`apple.css`, `cube.css`,
   `launcher.css`), `html-validate` bez nálezů, `node --check` čistý,
   `tools/cube_stage_test.mjs` má **24 scénářů**, `tools/launcher_page_test.mjs`
   drží **18/18**. Prohlížeč v sandboxu není — sticky scéna, 3D a hover
   jsou ověřené staticky (kaskáda, dopočet, jsdom), ne okem.

## v10 — **stránka Launcheru znovu od nuly: hravá, animovaná, s galerií**

Produktová stránka `launcher/` dostala nový kabát postavený na pohybu —
ale s rozpočtem na výkon. Všechno dekorativní jde vypnout jedním tlačítkem
(`[data-fx-toggle]`, volba se pamatuje v `localStorage`) a samo se vypne
při `prefers-reduced-motion`.

1. **Animace s rozpočtem** — jedno `requestAnimationFrame` plátno pro prach
   v hero i pro jiskry pod kurzorem (žádné dvě souběžné smyčky), DPR strop
   2× resp. 1,5×, prach kreslí ~32 fps, smyčka se zastaví, když je hero
   mimo viewport nebo je stránka na pozadí, částice mají tvrdý strop
   a jiskry se načítají jen na zařízeních s jemným ukazatelem.
2. **Hravé prvky** — 3D náklon hero okna s odleskem sledujícím kurzor,
   světelný bod na kartách, nekonečný pás (zdvojený v JS kvůli bezešvé
   smyčce), pulzující odznak, plovoucí nálepky, ripple v tlačítkách,
   posuvná pilulka v tabech, scroll-spy v lepivé navigaci a odhalování
   sekcí s kaskádou `--d`.
3. **Galerie (lightbox)** — každý ilustrační snímek je tlačítko
   `data-lightbox`; otevře se hi-res verze z `launcher/img/full/`
   (8 souborů, 2400/1800/960/640 px, dohromady ~490 kB, načítají se až
   při otevření). Dialog má `role="dialog"`, `aria-modal`, past na fokus,
   `inert` na podkladu, zámek scrollu, listování šipkami i swipem, zoom
   kliknutím, přednačtení sousedů a návrat fokusu na spouštěč.
   **Lightbox leží mimo `<main>`**, proto má vlastní sadu tokenů `--lp-*`.
4. **Vizuály** — náhledy v `launcher/img/` zůstávají (8 WebP, ~330 kB),
   nově k nim přibyly ostré hi-res protějšky prozvětšení. Všechny nesou
   popisek **„Ilustrační náhled“** a překládaný `alt` (`data-i18n-alt`).
5. **Stahování** beze změny pravidel: Windows míří na GitHub Releases,
   tlačítko hlásí **„Stahování zahájeno“** (nikdy „hotovo“), macOS a Linux
   jsou „V plánu“ a nic nestahují. Stavový řádek, otisk SHA-256, skeleton,
   chybová hláška s „Zkusit znovu“ i záložní adresa zůstaly.
6. **Přístupnost a jazyky** — jedna `h1`, sekce s `aria-labelledby`, taby
   s obsluhou šipek/Home/End, `aria-pressed` u přepínače efektů, `aria-live`
   u počítadla galerie, viditelný focus, `forced-colors`, tisk a redukce
   pohybu (i pro lightbox). `launcher/i18n.js` má **170 klíčů** v CS/EN/SK.
7. **Ověřeno** — `launcher.css` prošel `csstree-validator` bez chyby,
   `html-validate` hlásí už jen dědičné nálezy ve sdílené hlavičce a patičce,
   `node --check` je čistý a `tools/launcher_page_test.mjs` má **18 scénářů**
   (nově otevírání galerie, hi-res soubory, fokus a Esc, přepínač efektů).

## v8.6 — **nová produktová stránka Launcheru** (vizuály z reálného rozhraní)

Stránka `launcher/` prošla kompletní přestavbou. Místo dřívější makety
z HTML kostek stojí na **skutečných snímcích launcheru**: každý je oříznutý
o okraj rámečku zachycení, sjednocený na 1200 px, zaoblený a uložený jako
WebP. Výsledkem jsou celá, přirozeně vypadající okna aplikace (rám, stíny,
průhledné rohy), ne useknuté screenshoty. Všechny takto upravené vizuály
nesou viditelný popisek **„Ilustrační náhled“**.

1. **Vizuály** (`launcher/img/`, 8 souborů, dohromady ~330 kB) —
   `hero-welcome` (uvítací okno), `panel-instance` (panel hráče a instance),
   `settings-features` / `settings-appearance` / `settings-performance` /
   `settings-privacy` (nastavení, sjednoceno na 1200×644), `dialog-account`
   a `splash`. Každý má `width`/`height` proti posunu layoutu, `loading="lazy"`
   (hero naopak `fetchpriority="high"` + `<link rel="preload">`) a překládaný
   `alt` přes `data-i18n-alt` (app.js alt neřeší, dělá to `launcher.js`).
   Nepoužívaný `launcher/landscape.png` (2,3 MB) zmizel.
2. **Nová struktura** — hero s velkým oknem launcheru, pás rychlých fakt,
   dva střídavé feature řádky (knihovna instancí, vzhled), tři karty
   (modpacky a import, soukromí, otevřený vývoj), **prohlídka rozhraní**
   s taby Vzhled / Výkon / Soukromí, sekce stažení a závěrečné CTA.
3. **Stahování zůstalo napojené na GitHub** a je poctivější: tlačítko po
   kliknutí hlásí **„Stahování zahájeno“**, nikdy „hotovo“ — dokončení hlásí
   prohlížeč. Stavový řádek rozlišuje `loading` / `ready` / `fallback` /
   `error`, u Windows karty se zobrazí název souboru, velikost a zkrácený
   `SHA-256` z GitHub API (`digest`). Záložní adresa v `releases.js` míří na
   skutečné vydání `v1.2.1`, ne na dávno smazaný soubor. Když API mlčí,
   objeví se vysvětlující toast; když chybí vše, karta nabídne „Zkusit znovu“.
4. **macOS a Linux** zůstávají „V plánu“ (přerušovaný rám, odznak s hodinami,
   `data-state="planned"`), klik nic nestahuje a jen vysvětlí situaci.
   Připravované položky jsou vypsané i v seznamu „Připravujeme“.
5. **Přístupnost** — jedna `h1`, sekce s `aria-labelledby`, taby s `role`
   a obsluhou šipek/Home/End, `aria-describedby` u hlavního tlačítka,
   `aria-busy` během načítání, viditelný focus ring (v světlém motivu tmavý),
   `prefers-reduced-motion`, `forced-colors` a tiskové styly.
6. **Motivy a jazyky** — celá stránka stojí na tokenech `--lp-*`; světlý
   motiv má vlastní kontrastní akcenty (zlatá na krémové by neprošla).
   `launcher/i18n.js` má **133 klíčů ve všech třech jazycích** (CS/EN/SK).
7. **Testy** `tools/launcher_page_test.mjs` — 16 scénářů v jsdomu: stažení
   z repozitáře i z Releases, otisk SHA-256, platformy v plánu, návštěvník
   z macOS, záložní zdroj, chybový stav a retry, přepínání jazyků včetně
   `alt`, úplnost slovníků, ovládání tabů klávesnicí, popisky „Ilustrační
   náhled“, odkazy na repo/katalog/navigaci, duplicitní ID, vyváženost
   značek, velikost a skutečné rozměry WebP.

## v8.5 — Launcher: **nové ikony platforem** a skutečné stahování z GitHubu

Sekce Launcher přestala být maketou. Tlačítko „Stáhnout“ teď opravdu stahuje
nejnovější vydání přímo z repozitáře
[`MinekubeStudios/MinekubeLauncher`](https://github.com/MinekubeStudios/MinekubeLauncher)
a macOS s Linuxem jsou poctivě označené jako **v plánu**.

1. **Nový sprite ikon** (`launcher/index.html`, skrytý blok `.mk-sprite` za
   `<body>`) — všechny ikony sekce se kreslí jednou a odkazují se přes
   `<use href="#…">`, takže se dají přebarvit přes `currentColor`:
   - `#mk-os-windows` — čtyřoknový znak Windows 11 (vlastní kresba),
   - `#mk-os-macos` — jablko ze sady Simple Icons (CC0),
   - `#mk-os-linux` — Tux ze sady Simple Icons (CC0), místo dřívějšího
     terminálového okýnka,
   - `#mk-tray`, `#mk-check`, `#mk-clock`, `#mk-alert`, `#mk-package`,
     `#mk-refresh`, `#mk-github` — stavové piktogramy tlačítka.
2. **`launcher/releases.js`** — napojení na repozitář launcheru ve stejném
   duchu jako `modpacky/releases.js`. Adresa repa je jen v `CONFIG`, hledá se
   ve třech krocích: **GitHub Releases API** → **obsah repozitáře** (právě
   tenhle případ — v repu zatím není žádné Release, jen
   `Minekube Launcher_1.0.0-local_x64-setup.exe`) → **statická záloha**, kdyby
   API mlčelo. Soubory se třídí podle přípony a názvu platformy (`.exe`/`.msi`,
   `.dmg`/`.pkg`/`.app.tar.gz`, `.AppImage`/`.deb`/`.rpm`), zdrojový archiv
   `source-code .zip` se ignoruje. Cache v `localStorage` (5 minut), událost
   `minekube:launcher-releases`, veřejné API `window.MinekubeLauncherReleases`.
3. **Stavy tlačítka** (`data-state`) — `loading` → `idle` → `downloading` →
   `done`, plus `planned` a `error`. Tlačítko ukazuje verzi vydání, zdroj
   (GitHub Releases / repozitář), název souboru i velikost a podle stavu
   mění ikonu (tác se šipkou, kolo, fajfka, hodiny, vykřičník). Když se
   vydání nepodaří najít, klik zkusí načtení znovu.
4. **Platformy v plánu** — čipy i karty macOS a Linuxu mají přerušovaný
   rámec, odznak „V plánu“ s hodinami, ztlumenou ikonu a poznámku, že se
   sestavení na webu objeví samo, jakmile vyjde v repozitáři. Klik nic
   nestahuje, jen vysvětlí situaci a na chvilku zvýrazní Windows. Když
   návštěvník přijde z macOS nebo Linuxu, hlavní tlačítko zůstane na Windows
   a toast mu to řekne. Až vydáme `.dmg`/`.AppImage`, stačí v
   `CONFIG.platformStatus` přepsat `planned` na `live`.
5. **`launcher/launcher.css`** — nový soubor se styly téhle sekce (načítá se
   po `styles.css` a `design-plus.css`), včetně tabletového rozložení, kde
   živá karta Windows zabírá celou šířku, světlého motivu, `color-mix`
   fallbacku a `prefers-reduced-motion`.
6. **`app.js`** — do `SITE_LINKS` přibyly `launcherRepo` a
   `launcherReleases`, odkaz „Repozitář launcheru“ v hero sekci i v
   open-source poznámce teď vede na repozitář launcheru, ne na profil studia.
7. **`launcher/i18n.js`** — 22 nových klíčů ve všech třech jazycích
   (odznaky, stavy, toast stahování, poznámky k platformám).
8. **Test** `tools/launcher_page_test.mjs` — 6 scénářů v jsdomu nad reálným
   během stránky (instalátor z repozitáře + stažení, platformy v plánu,
   návštěvník z macOS, nedostupné API a záložní adresa, přepínání jazyků,
   odkazy na repozitář).


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
| `launcher/releases.js` | **Vydání launcheru z repozitáře `MinekubeStudios/MinekubeLauncher`** — GitHub Releases API → obsah repozitáře → statická záloha, cache v `localStorage`, událost `minekube:launcher-releases`, veřejné API `window.MinekubeLauncherReleases` |
| `launcher/lpx.css` | Celý nový design stránky Launcheru (scoped `.lpx`): hero, pásy s tapetami, karty, prohlídka, platformy, FAQ, patička; bez lišty sekcí a bez pásu platforem (v14) |
| `launcher/launcher-pulse.css` | Exploze a přelití stahovacího tlačítka (`.lp-pulse-burst*`, `.lpx-download.is-pulse*`) |
| `tools/releases_test.mjs` | Test napojení na repozitář (jsdom): manifest, záložní GitHub API, demo i stav bez sítě |
| `tools/launcher_page_test.mjs` | Test stránky Launcher (jsdom, 20 scénářů): stahování z GitHubu, platformy v plánu, záložní adresa, jazyky, prohlídka, carousel, tapety a ikony |
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

A test stránky Launcher (`tools/launcher_page_test.mjs`, 20 scénářů —
instalátor z GitHubu a jeho otisk, Linux „v plánu“, návštěvník z macOS,
nedostupné API a záložní adresa, chybový stav s novým pokusem, tři jazyky,
překlady klíčů i dynamických textů, prohlídka z klávesnice, carousel,
přepínač efektů, tapety a ikony, sémantika, obrázky, světlý motiv,
tisk a redukce pohybu):

```bash
node tools/launcher_page_test.mjs
```

Stejně jako generátor manifestu v repu s modpacky se dá ověřit i sám:

```bash
cd modpack-repo && node tools/test-manifest.mjs   # 24 kontrol
```

Testy běží v jsdomu (CSS parser `css-tree` hlásí 0 chyb na 2287 pravidlech).
Ověřují mj. to, že úvod `styles.css` je shodný s nahraným originálem (tlačítko = původní), že najetí myší nasype 34 jisker správných tvarů a barev, a že navigace startuje uvnitř zamčené scény (1080 ms ze 1520 ms,
tedy uvnitř krytí 28 %–72 %), že druhý klik animaci nepřehraje znovu, že Escape
portál zavře a už nenaviguje, a že se portál po sobě sám sklidí.
