document.documentElement.classList.add("js");

const safeStorage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Web zůstane plně funkční i v režimu, kde je úložiště blokované.
    }
  }
};

/* =========================================================
   I18N // ČEŠTINA / SLOVENŠTINA / ENGLISH
   ========================================================= */
const SUPPORTED_LANGS = ["cs", "sk", "en"];
const LANG_LOCALES = { cs: "cs-CZ", sk: "sk-SK", en: "en-US" };
const LANG_CODES = { cs: "CZ", sk: "SK", en: "EN" };

const I18N = {
  cs: {
    "meta.title": "Minekube FPS — Minecraft Performance Modpacks",
    "meta.desc": "Minekube FPS modpacky – rychlejší, plynulejší a stabilnější Minecraft.",
    "a11y.brand": "Minekube Studios – domovská stránka",
    "a11y.nav": "Hlavní navigace",
    "a11y.mobileNav": "Mobilní navigace",
    "a11y.theme": "Přepnout motiv",
    "a11y.lang": "Změnit jazyk",
    "a11y.langMenu": "Výběr jazyka",
    "a11y.store": "Otevřít Minekube Store",
    "a11y.menu": "Otevřít menu",
    "a11y.filters": "Filtry modpacků",
    "a11y.sort": "Řazení modpacků",
    "a11y.benchmarks": "Výkon",
    "a11y.benchmarkBoard": "Animované porovnání výkonu Vanilla a Ultra Performance",
    "a11y.install": "Instalace",
    "a11y.discord": "Discord – doplň vlastní odkaz",
    "a11y.github": "GitHub – doplň vlastní odkaz",
    "nav.modpacks": "Modpacky",
    "nav.server": "Server",
    "nav.about": "O projektu",
    "catalog.kicker": "KATALOG",
    "catalog.title": "Vyber si správný výkonový profil",
    "catalog.text": "Každý modpack cílí na jiný hardware a styl hraní. Filtry ti pomohou najít přesně ten tvůj.",
    "filters.kicker": "NAJDI SVŮJ BUILD",
    "filters.title": "Filtry",
    "filters.reset": "Resetovat",
    "search.placeholder": "Hledat modpack...",
    "legend.version": "Verze Minecraftu",
    "legend.loader": "Mod loader",
    "legend.focus": "Zaměření",
    "verified.title": "Bezpečné sestavení",
    "verified.text": "Každý release lze doplnit kontrolním součtem a seznamem změn.",
    "toolbar.filters": "Filtry",
    "sort.label": "Řadit podle",
    "sort.current": "AKTUÁLNÍ ŘAZENÍ",
    "sort.featured": "Doporučené",
    "sort.downloads": "Nejstahovanější",
    "sort.fps": "Nejvyšší FPS",
    "sort.newest": "Nejnovější",
    "sort.name": "Název A–Z",
    "results.oneReleased": "profil · 1 vydaný",
    "results.onePending": "profil · připravujeme",
    "results.many": "{n} profilů · {r} vydaný",
    "empty.title": "Žádný modpack neodpovídá filtrům",
    "empty.text": "Zkus upravit hledaný výraz nebo některý filtr vypnout.",
    "empty.reset": "Vymazat filtry",
    "pack.download": "Stáhnout Modpack",
    "pack.unreleased": "Zatím nevydáno",
    "pack.details": "Detail modpacku",
    "pack.detailsAria": "Zobrazit detail {name}",
    "pack.favAdd": "Přidat do oblíbených",
    "pack.favRemove": "Odebrat z oblíbených",
    "pack.perf": "VÝKON",
    "pack.mods": "MODŮ",
    "pack.maxfps": "MAX FPS",
    "pack.minecraft": "MINECRAFT",
    "pack.live": "LIVE BUILD",
    "pack.indev": "IN DEVELOPMENT",
    "pack.engine": "FPS ENGINE",
    "pack.soon": "COMING SOON",
    "pack.perfTitle": "Celkový výkon",
    "pack.modsTitle": "Počet modů",
    "pack.fpsTitle": "Maximální FPS",
    "pack.core": "PERFORMANCE CORE",
    "modal.verified": "MINEKUBE VERIFIED BUILD",
    "modal.stable": "Stabilní release",
    "modal.client": "Optimalizováno pro klienta",
    "modal.gameVersion": "VERZE HRY",
    "modal.content": "OBSAH BALÍČKU",
    "modal.contentValue": "{n} optimalizačních modů",
    "modal.size": "VELIKOST",
    "modal.perfProfile": "VÝKONOVÝ PROFIL",
    "modal.perfValue": "{p} · Maximum FPS",
    "modal.proven": "PROVĚŘENÁ KONFIGURACE",
    "modal.provenText": "Nastavení je připravené tak, aby poskytovalo vysoký výkon, rychlé načítání a stabilní průběh hry bez zbytečného nastavování.",
    "modal.advKicker": "HLAVNÍ VÝHODY",
    "modal.advTitle": "Co balíček nabízí",
    "modal.reqKicker": "RYCHLÝ START",
    "modal.reqTitle": "Požadavky a doporučení",
    "modal.release": "AKTUÁLNÍ RELEASE",
    "modal.releaseMeta": "{loader} build · {size} · připraveno ke stažení",
    "modal.downloadZip": "Stáhnout ZIP",
    "modal.unavailable": "Zatím nedostupné",
    "modal.demo": "DEMONSTRAČNÍ OBSAH",
    "modal.demoText": "Tento text uprav podle skutečného projektu.",
    "modal.close": "Zavřít",
    "modal.closeAria": "Zavřít detail",
    "info.methodologyTitle": "Metodika měření výkonu",
    "info.methodologyText": "Pro důvěryhodné srovnání používej stejný svět, seed, pozici hráče, render distance, rozlišení, verzi Javy i ovladače. Každý test spusť několikrát, první průchod nepočítej a uváděj nejen průměrné FPS, ale také 1% low a frametime.",
    "info.changelogTitle": "Changelog",
    "info.changelogText": "Tady může být seznam verzí, datum vydání, přidané a odebrané mody, změny konfigurace, známé chyby a pokyny pro bezpečný update.",
    "info.compatibilityTitle": "Kompatibilita",
    "info.compatibilityText": "Tady můžeš popsat podporované verze Minecraftu, loadery, doporučené verze Javy, kompatibilitu se shadery, resource packy a známé konflikty.",
    "info.licenseTitle": "Licence a upozornění",
    "info.licenseText": "Před zveřejněním doplň vlastní licenční podmínky a zkontroluj oprávnění jednotlivých autorů modů k distribuci v modpacku.",
    "toast.favAdd": "Modpack byl uložen do oblíbených.",
    "toast.favRemove": "Modpack byl odebrán z oblíbených.",
    "toast.themeLight": "Zapnut světlý motiv.",
    "toast.themeDark": "Zapnut tmavý motiv.",
    "toast.dlStart": "Navazuji bezpečné spojení…",
    "toast.dlOk": "Stahování bylo úspěšně zahájeno",
    "toast.dlNone": "Soubor ke stažení zatím není nastavený.",
    "toast.unreleased": "Tento modpack zatím není vydaný.",
    "toast.serverCopied": "IP serveru zkopírována do schránky.",
    "toast.langSwitched": "Jazyk přepnut: Čeština.",
    "kicker.transfer": "PŘIPRAVUJI PŘENOS",
    "kicker.download": "MINEKUBE DOWNLOAD",
    "kicker.warn": "UPOZORNĚNÍ",
    "kicker.fav": "OBLÍBENÉ",
    "kicker.ui": "ROZHRANÍ",
    "kicker.lang": "JAZYK",
    "kicker.sys": "MINEKUBE SYSTEM",
    "bench.kicker": "MĚŘITELNÝ ROZDÍL",
    "bench.title": "Ne marketing. Výkon, který můžeš změřit.",
    "bench.text": "Připravený prostor pro reálné výsledky tvých testů — stejný seed, stejné místo, stejné nastavení a několik opakovaných měření.",
    "bench.li1": "Oddělené profily pro low-end, mid-range a high-end PC",
    "bench.li2": "Přehled použité verze Javy, ovladačů a nastavení",
    "bench.li3": "Hodnoty FPS, 1% low, frametime, RAM a času načítání",
    "bench.how": "Jak správně měřit výkon",
    "bench.sub": "1080p / 8 chunks / bez shaderů",
    "bench.vanillaSub": "bez optimalizací",
    "bench.perf": "VÝKON",
    "bench.ram": "📟 PAMĚŤ RAM",
    "bench.load": "🔃 DOBA NAČÍTÁNÍ",
    "install.kicker": "RYCHLÝ START",
    "install.title": "Od stažení ke hraní za pár minut",
    "install.text": "Jednoduchý postup vhodný pro Modrinth App i další launchery podporující formát .mrpack.",
    "step1.title": "Stáhni balíček",
    "step1.text": "Vyber kompatibilní verzi Minecraftu a stáhni soubor modpacku.",
    "step2.title": "Importuj do launcheru",
    "step2.text": "V Modrinth App nebo Prism Launcheru zvol import existujícího balíčku.",
    "step3.title": "Spusť a hraj",
    "step3.text": "Launcher automaticky připraví správné mody, knihovny i doporučené nastavení.",
    "about.title": "Výkon bez zničení původního Minecraftu",
    "about.lead": "Minekube Studios propojuje výkonné modpacky, komunitní Minecraft server, Store a moderní open-source projekty do jednoho československého ekosystému — bez paywallu a zcela zdarma.",
    "about.text": "Smyslem projektu je zachovat známý vanilla pocit, ale odstranit zbytečné propady FPS, dlouhé načítání a mikrosekání. Každý mod má mít jasný důvod, žádná výplň a žádné náhodné experimenty v produkčním vydání.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Bezpečné aktualizace",
    "about.tag3": "Čistá konfigurace",
    "about.tag4": "Transparentní changelog",
    "server.kicker": "COMMUNITY SERVER",
    "server.title": "Připoj se na náš Minecraft server",
    "server.text": "Server Minekube Studios je otevřený všem hráčům z Česka i Slovenska. Zkopíruj IP adresu a přidej si server do hry.",
    "server.button": "Zkopírovat IP serveru",
    "cta.title": "Dej Minecraftu výkon, který si zaslouží.",
    "cta.text": "Vyber si profil podle svého počítače a začni hrát plynuleji.",
    "cta.button": "Procházet modpacky",
    "footer.desc": "Nezávislý demonstrační web pro Minecraft performance modpacky.",
    "footer.project": "Projekt",
    "footer.info": "Informace",
    "footer.compat": "Kompatibilita",
    "footer.license": "Licence",
    "footer.community": "Komunita",
    "footer.rights": "Minekube FPS. Demo web.",
    "footer.tm": "Minecraft je ochranná známka společnosti Mojang Studios."
  },
  sk: {
    "meta.title": "Minekube FPS — Minecraft Performance Modpacks",
    "meta.desc": "Minekube FPS modpacky – rýchlejší, plynulejší a stabilnejší Minecraft.",
    "a11y.brand": "Minekube Studios – domovská stránka",
    "a11y.nav": "Hlavná navigácia",
    "a11y.mobileNav": "Mobilná navigácia",
    "a11y.theme": "Prepnúť motív",
    "a11y.lang": "Zmeniť jazyk",
    "a11y.langMenu": "Výber jazyka",
    "a11y.store": "Otvoriť Minekube Store",
    "a11y.menu": "Otvoriť menu",
    "a11y.filters": "Filtre modpackov",
    "a11y.sort": "Radenie modpackov",
    "a11y.benchmarks": "Výkon",
    "a11y.benchmarkBoard": "Animované porovnanie výkonu Vanilla a Ultra Performance",
    "a11y.install": "Inštalácia",
    "a11y.discord": "Discord – doplň vlastný odkaz",
    "a11y.github": "GitHub – doplň vlastný odkaz",
    "nav.modpacks": "Modpacky",
    "nav.server": "Server",
    "nav.about": "O projekte",
    "catalog.kicker": "KATALÓG",
    "catalog.title": "Vyber si správny výkonový profil",
    "catalog.text": "Každý modpack cieli na iný hardvér a štýl hrania. Filtre ti pomôžu nájsť presne ten tvoj.",
    "filters.kicker": "NÁJDI SVOJ BUILD",
    "filters.title": "Filtre",
    "filters.reset": "Resetovať",
    "search.placeholder": "Hľadať modpack...",
    "legend.version": "Verzia Minecraftu",
    "legend.loader": "Mod loader",
    "legend.focus": "Zameranie",
    "verified.title": "Bezpečné zostavenie",
    "verified.text": "Každý release je možné doplniť kontrolným súčtom a zoznamom zmien.",
    "toolbar.filters": "Filtre",
    "sort.label": "Zoradiť podľa",
    "sort.current": "AKTUÁLNE RADENIE",
    "sort.featured": "Odporúčané",
    "sort.downloads": "Najsťahovanejšie",
    "sort.fps": "Najvyššie FPS",
    "sort.newest": "Najnovšie",
    "sort.name": "Názov A–Z",
    "results.oneReleased": "profil · 1 vydaný",
    "results.onePending": "profil · pripravujeme",
    "results.many": "{n} profilov · {r} vydaný",
    "empty.title": "Žiadny modpack nezodpovedá filtrom",
    "empty.text": "Skús upraviť hľadaný výraz alebo niektorý filter vypnúť.",
    "empty.reset": "Vymazať filtre",
    "pack.download": "Stiahnuť Modpack",
    "pack.unreleased": "Zatiaľ nevydané",
    "pack.details": "Detail modpacku",
    "pack.detailsAria": "Zobraziť detail {name}",
    "pack.favAdd": "Pridať do obľúbených",
    "pack.favRemove": "Odobrať z obľúbených",
    "pack.perf": "VÝKON",
    "pack.mods": "MODOV",
    "pack.maxfps": "MAX FPS",
    "pack.minecraft": "MINECRAFT",
    "pack.live": "LIVE BUILD",
    "pack.indev": "IN DEVELOPMENT",
    "pack.engine": "FPS ENGINE",
    "pack.soon": "COMING SOON",
    "pack.perfTitle": "Celkový výkon",
    "pack.modsTitle": "Počet modov",
    "pack.fpsTitle": "Maximálne FPS",
    "pack.core": "PERFORMANCE CORE",
    "modal.verified": "MINEKUBE VERIFIED BUILD",
    "modal.stable": "Stabilný release",
    "modal.client": "Optimalizované pre klienta",
    "modal.gameVersion": "VERZIA HRY",
    "modal.content": "OBSAH BALÍČKA",
    "modal.contentValue": "{n} optimalizačných modov",
    "modal.size": "VEĽKOSŤ",
    "modal.perfProfile": "VÝKONNOSTNÝ PROFIL",
    "modal.perfValue": "{p} · Maximum FPS",
    "modal.proven": "OVERENÁ KONFIGURÁCIA",
    "modal.provenText": "Nastavenia sú pripravené tak, aby poskytovali vysoký výkon, rýchle načítanie a stabilný priebeh hry bez zbytočného nastavovania.",
    "modal.advKicker": "HLAVNÉ VÝHODY",
    "modal.advTitle": "Čo balíček ponúka",
    "modal.reqKicker": "RÝCHLY ŠTART",
    "modal.reqTitle": "Požiadavky a odporúčania",
    "modal.release": "AKTUÁLNY RELEASE",
    "modal.releaseMeta": "{loader} build · {size} · pripravené na stiahnutie",
    "modal.downloadZip": "Stiahnuť ZIP",
    "modal.unavailable": "Zatiaľ nedostupné",
    "modal.demo": "DEMONŠTRAČNÝ OBSAH",
    "modal.demoText": "Tento text uprav podľa skutočného projektu.",
    "modal.close": "Zavrieť",
    "modal.closeAria": "Zavrieť detail",
    "info.methodologyTitle": "Metodika merania výkonu",
    "info.methodologyText": "Pre dôveryhodné porovnanie používaj rovnaký svet, seed, pozíciu hráča, render distance, rozlíšenie, verziu Javy aj ovládače. Každý test spusti niekoľkokrát, prvý priechod nepočítaj a uvádzaj nielen priemerné FPS, ale aj 1% low a frametime.",
    "info.changelogTitle": "Changelog",
    "info.changelogText": "Tu môže byť zoznam verzií, dátum vydania, pridané a odobrané mody, zmeny konfigurácie, známe chyby a pokyny pre bezpečný update.",
    "info.compatibilityTitle": "Kompatibilita",
    "info.compatibilityText": "Tu môžeš popísať podporované verzie Minecraftu, loadery, odporúčané verzie Javy, kompatibilitu so shadermi, resource packy a známe konflikty.",
    "info.licenseTitle": "Licencia a upozornenie",
    "info.licenseText": "Pred zverejnením doplň vlastné licenčné podmienky a skontroluj oprávnenia jednotlivých autorov modov na distribúciu v modpacku.",
    "toast.favAdd": "Modpack bol uložený do obľúbených.",
    "toast.favRemove": "Modpack bol odobraný z obľúbených.",
    "toast.themeLight": "Zapnutý svetlý motív.",
    "toast.themeDark": "Zapnutý tmavý motív.",
    "toast.dlStart": "Nadväzujem bezpečné spojenie…",
    "toast.dlOk": "Sťahovanie bolo úspešne zahájené",
    "toast.dlNone": "Súbor na stiahnutie zatiaľ nie je nastavený.",
    "toast.unreleased": "Tento modpack zatiaľ nie je vydaný.",
    "toast.serverCopied": "IP servera skopírovaná do schránky.",
    "toast.langSwitched": "Jazyk prepnutý: Slovenština.",
    "kicker.transfer": "PRIPRAVUJEM PRENOS",
    "kicker.download": "MINEKUBE DOWNLOAD",
    "kicker.warn": "UPOZORNENIE",
    "kicker.fav": "OBĽÚBENÉ",
    "kicker.ui": "ROZHRANIE",
    "kicker.lang": "JAZYK",
    "kicker.sys": "MINEKUBE SYSTEM",
    "bench.kicker": "MERATEĽNÝ ROZDIEL",
    "bench.title": "Nie marketing. Výkon, ktorý môžeš zmerať.",
    "bench.text": "Pripravený priestor pre reálne výsledky tvojich testov — rovnaký seed, rovnaké miesto, rovnaké nastavenia a niekoľko opakovaných meraní.",
    "bench.li1": "Oddelené profily pre low-end, mid-range a high-end PC",
    "bench.li2": "Prehľad použitej verzie Javy, ovládačov a nastavení",
    "bench.li3": "Hodnoty FPS, 1% low, frametime, RAM a času načítania",
    "bench.how": "Ako správne merať výkon",
    "bench.sub": "1080p / 8 chunkov / bez shaderov",
    "bench.vanillaSub": "bez optimalizácií",
    "bench.perf": "VÝKON",
    "bench.ram": "📟 PAMÄŤ RAM",
    "bench.load": "🔃 DOBA NAČÍTANIA",
    "install.kicker": "RÝCHLY ŠTART",
    "install.title": "Od stiahnutia k hraniu za pár minút",
    "install.text": "Jednoduchý postup vhodný pre Modrinth App aj ďalšie launchery podporujúce formát .mrpack.",
    "step1.title": "Stiahni balíček",
    "step1.text": "Vyber kompatibilnú verziu Minecraftu a stiahni súbor modpacku.",
    "step2.title": "Importuj do launchera",
    "step2.text": "V Modrinth App alebo Prism Launcheri zvoľ import existujúceho balíčka.",
    "step3.title": "Spusti a hraj",
    "step3.text": "Launcher automaticky pripraví správne mody, knižnice aj odporúčané nastavenia.",
    "about.title": "Výkon bez zničenia pôvodného Minecraftu",
    "about.lead": "Minekube Studios prepája výkonné modpacky, komunitný Minecraft server, Store a moderné open-source projekty do jedného československého ekosystému — bez paywallu a úplne zadarmo.",
    "about.text": "Zmyslom projektu je zachovať známy vanilla pocit, ale odstrániť zbytočné prepady FPS, dlhé načítanie a mikrosekánie. Každý mod má mať jasný dôvod, žiadna výplň a žiadne náhodné experimenty v produkčnom vydaní.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Bezpečné aktualizácie",
    "about.tag3": "Čistá konfigurácia",
    "about.tag4": "Transparentný changelog",
    "server.kicker": "COMMUNITY SERVER",
    "server.title": "Pripoj sa na náš Minecraft server",
    "server.text": "Server Minekube Studios je otvorený všetkým hráčom z Česka aj Slovenska. Skopíruj IP adresu a pridaj si server do hry.",
    "server.button": "Skopírovať IP servera",
    "cta.title": "Daj Minecraftu výkon, ktorý si zaslúži.",
    "cta.text": "Vyber si profil podľa svojho počítača a začni hrať plynulejšie.",
    "cta.button": "Prechádzať modpacky",
    "footer.desc": "Nezávislý demonštračný web pre Minecraft performance modpacky.",
    "footer.project": "Projekt",
    "footer.info": "Informácie",
    "footer.compat": "Kompatibilita",
    "footer.license": "Licencia",
    "footer.community": "Komunita",
    "footer.rights": "Minekube FPS. Demo web.",
    "footer.tm": "Minecraft je ochranná známka spoločnosti Mojang Studios."
  },
  en: {
    "meta.title": "Minekube FPS — Minecraft Performance Modpacks",
    "meta.desc": "Minekube FPS modpacks – a faster, smoother and more stable Minecraft.",
    "a11y.brand": "Minekube Studios – home page",
    "a11y.nav": "Main navigation",
    "a11y.mobileNav": "Mobile navigation",
    "a11y.theme": "Toggle theme",
    "a11y.lang": "Change language",
    "a11y.langMenu": "Language selection",
    "a11y.store": "Open Minekube Store",
    "a11y.menu": "Open menu",
    "a11y.filters": "Modpack filters",
    "a11y.sort": "Modpack sorting",
    "a11y.benchmarks": "Performance",
    "a11y.benchmarkBoard": "Animated Vanilla vs Ultra Performance comparison",
    "a11y.install": "Installation",
    "a11y.discord": "Discord – add your own link",
    "a11y.github": "GitHub – add your own link",
    "nav.modpacks": "Modpacks",
    "nav.server": "Server",
    "nav.about": "About",
    "catalog.kicker": "CATALOG",
    "catalog.title": "Choose the right performance profile",
    "catalog.text": "Each modpack targets different hardware and playstyle. Filters will help you find yours.",
    "filters.kicker": "FIND YOUR BUILD",
    "filters.title": "Filters",
    "filters.reset": "Reset",
    "search.placeholder": "Search modpacks...",
    "legend.version": "Minecraft version",
    "legend.loader": "Mod loader",
    "legend.focus": "Focus",
    "verified.title": "Safe build",
    "verified.text": "Each release can include a checksum and changelog.",
    "toolbar.filters": "Filters",
    "sort.label": "Sort by",
    "sort.current": "CURRENT SORTING",
    "sort.featured": "Featured",
    "sort.downloads": "Most downloaded",
    "sort.fps": "Highest FPS",
    "sort.newest": "Newest",
    "sort.name": "Name A–Z",
    "results.oneReleased": "profile · 1 released",
    "results.onePending": "profile · coming soon",
    "results.many": "{n} profiles · {r} released",
    "empty.title": "No modpack matches the filters",
    "empty.text": "Try adjusting your search or disabling a filter.",
    "empty.reset": "Clear filters",
    "pack.download": "Download Modpack",
    "pack.unreleased": "Not released yet",
    "pack.details": "Modpack details",
    "pack.detailsAria": "Show details for {name}",
    "pack.favAdd": "Add to favorites",
    "pack.favRemove": "Remove from favorites",
    "pack.perf": "PERFORMANCE",
    "pack.mods": "MODS",
    "pack.maxfps": "MAX FPS",
    "pack.minecraft": "MINECRAFT",
    "pack.live": "LIVE BUILD",
    "pack.indev": "IN DEVELOPMENT",
    "pack.engine": "FPS ENGINE",
    "pack.soon": "COMING SOON",
    "pack.perfTitle": "Overall performance",
    "pack.modsTitle": "Number of mods",
    "pack.fpsTitle": "Maximum FPS",
    "pack.core": "PERFORMANCE CORE",
    "modal.verified": "MINEKUBE VERIFIED BUILD",
    "modal.stable": "Stable release",
    "modal.client": "Optimized for client",
    "modal.gameVersion": "GAME VERSION",
    "modal.content": "PACKAGE CONTENTS",
    "modal.contentValue": "{n} optimization mods",
    "modal.size": "SIZE",
    "modal.perfProfile": "PERFORMANCE PROFILE",
    "modal.perfValue": "{p} · Maximum FPS",
    "modal.proven": "PROVEN CONFIGURATION",
    "modal.provenText": "The settings are tuned for high performance, fast loading and stable gameplay with no extra setup.",
    "modal.advKicker": "KEY BENEFITS",
    "modal.advTitle": "What the pack offers",
    "modal.reqKicker": "QUICK START",
    "modal.reqTitle": "Requirements & recommendations",
    "modal.release": "CURRENT RELEASE",
    "modal.releaseMeta": "{loader} build · {size} · ready to download",
    "modal.downloadZip": "Download ZIP",
    "modal.unavailable": "Not available yet",
    "modal.demo": "DEMO CONTENT",
    "modal.demoText": "Edit this text to match the real project.",
    "modal.close": "Close",
    "modal.closeAria": "Close details",
    "info.methodologyTitle": "Performance testing methodology",
    "info.methodologyText": "For a fair comparison, use the same world, seed, player position, render distance, resolution, Java version and drivers. Run each test several times, discard the first run and report not only average FPS but also 1% lows and frametime.",
    "info.changelogTitle": "Changelog",
    "info.changelogText": "This can hold the version list, release dates, added and removed mods, config changes, known issues and safe-update instructions.",
    "info.compatibilityTitle": "Compatibility",
    "info.compatibilityText": "Describe supported Minecraft versions, loaders, recommended Java versions, shader and resource-pack compatibility and known conflicts here.",
    "info.licenseTitle": "License & notice",
    "info.licenseText": "Before publishing, add your own license terms and check each mod author's permission for modpack distribution.",
    "toast.favAdd": "Modpack saved to favorites.",
    "toast.favRemove": "Modpack removed from favorites.",
    "toast.themeLight": "Light theme enabled.",
    "toast.themeDark": "Dark theme enabled.",
    "toast.dlStart": "Establishing secure connection…",
    "toast.dlOk": "Download started successfully",
    "toast.dlNone": "No download file is set yet.",
    "toast.unreleased": "This modpack is not released yet.",
    "toast.serverCopied": "Server IP copied to clipboard.",
    "toast.langSwitched": "Language switched: English.",
    "kicker.transfer": "PREPARING TRANSFER",
    "kicker.download": "MINEKUBE DOWNLOAD",
    "kicker.warn": "WARNING",
    "kicker.fav": "FAVORITES",
    "kicker.ui": "INTERFACE",
    "kicker.lang": "LANGUAGE",
    "kicker.sys": "MINEKUBE SYSTEM",
    "bench.kicker": "MEASURABLE DIFFERENCE",
    "bench.title": "Not marketing. Performance you can measure.",
    "bench.text": "A dedicated space for your real test results — same seed, same spot, same settings and several repeated runs.",
    "bench.li1": "Separate profiles for low-end, mid-range and high-end PCs",
    "bench.li2": "Overview of the Java version, drivers and settings used",
    "bench.li3": "FPS, 1% low, frametime, RAM and load-time values",
    "bench.how": "How to measure performance correctly",
    "bench.sub": "1080p / 8 chunks / no shaders",
    "bench.vanillaSub": "no optimizations",
    "bench.perf": "PERFORMANCE",
    "bench.ram": "📟 RAM USAGE",
    "bench.load": "🔃 LOAD TIME",
    "install.kicker": "QUICK START",
    "install.title": "From download to playing in minutes",
    "install.text": "A simple process for Modrinth App and other launchers supporting the .mrpack format.",
    "step1.title": "Download the pack",
    "step1.text": "Pick a compatible Minecraft version and download the modpack file.",
    "step2.title": "Import into your launcher",
    "step2.text": "In Modrinth App or Prism Launcher, choose to import an existing pack.",
    "step3.title": "Launch and play",
    "step3.text": "The launcher automatically prepares the right mods, libraries and recommended settings.",
    "about.title": "Performance without ruining vanilla Minecraft",
    "about.lead": "Minekube Studios connects powerful modpacks, a community Minecraft server, the Store and modern open-source projects into one Czechoslovak ecosystem — no paywall, completely free.",
    "about.text": "The goal is to keep the familiar vanilla feel while removing unnecessary FPS drops, long loading times and micro-stutter. Every mod must have a clear purpose — no filler and no random experiments in production releases.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Safe updates",
    "about.tag3": "Clean configuration",
    "about.tag4": "Transparent changelog",
    "server.kicker": "COMMUNITY SERVER",
    "server.title": "Join our Minecraft server",
    "server.text": "The Minekube Studios server is open to all players from Czechia and Slovakia. Copy the IP address and add the server in-game.",
    "server.button": "Copy server IP",
    "cta.title": "Give Minecraft the performance it deserves.",
    "cta.text": "Pick a profile for your PC and start playing smoother.",
    "cta.button": "Browse modpacks",
    "footer.desc": "An independent demo site for Minecraft performance modpacks.",
    "footer.project": "Project",
    "footer.info": "Information",
    "footer.compat": "Compatibility",
    "footer.license": "License",
    "footer.community": "Community",
    "footer.rights": "Minekube FPS. Demo site.",
    "footer.tm": "Minecraft is a trademark of Mojang Studios."
  }
};

const storedLang = safeStorage.get("minekube-lang", "cs");
const initialLang = SUPPORTED_LANGS.includes(storedLang) ? storedLang : "cs";

function t(key, vars = {}) {
  const lang = state?.lang || initialLang;
  let text = I18N[lang]?.[key] ?? I18N.cs[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function currentLocale() {
  return LANG_LOCALES[state?.lang] || "cs-CZ";
}

const SERVER_IP = "play.minekube.eu";

const modpacks = [
  {
    id: "ultra-performance",
    name: "Ultra Performance",
    shortName: "Ultra Performance - Release",
    description: "Maximálně optimalizovaný FPS modpack.",
    longDescription: "Maximálně optimalizovaný FPS modpack pro Minecraft 1.21.1 s Fabric loaderem.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Maximum FPS",
    tags: ["Fabric", "Client", "Maximum FPS"],
    badge: "DOPORUČENO",
    status: "released",
    statusLabel: "STABLE RELEASE",
    downloads: 24870,
    performance: "10/10",
    fps: 1000,
    fpsLabel: "1000 FPS+",
    updated: "2026-07-18",
    release: "1.21.1",
    size: "95 MB",
    mods: 80,
    downloadUrl: "https://github.com/MinekubeStudios/minekubestudios.github.io/releases/download/v1.21.1/Minekube-Ultra-Performance-1.21.1.zip",
    downloadFileName: "Minekube-Ultra-Performance-1.21.1.zip",
    gameJoltUrl: "https://gamejolt.com/games/_/1053229",
    color: "linear-gradient(135deg, #04130b 0%, #0a3d20 34%, #159447 62%, #d1a31a 83%, #ffd85a 100%)",
    cube: ["#fff07a", "#e9b91e", "#178f43"],
    accentRgb: "63, 232, 126",
    accent: "#49ef8c",
    visual: "ultra",
    features: [
      "Maximum FPS profil",
      "Optimalizované vykreslování chunků",
      "Rychlejší start hry",
      "Nízké využití operační paměti",
      "Přednastavené video nastavení"
    ],
    requirements: [
      "Minecraft Java Edition",
      "Doporučeno 4 GB RAM pro instanci",
      "Java 21 pro řadu 1.21.x",
      "Samostatná čistá instance"
    ],
    i18n: {
      sk: {
        badge: "ODPORÚČANÉ",
        description: "Maximálne optimalizovaný FPS modpack.",
        longDescription: "Maximálne optimalizovaný FPS modpack pre Minecraft 1.21.1 s Fabric loaderom.",
        features: [
          "Maximum FPS profil",
          "Optimalizované vykresľovanie chunkov",
          "Rýchlejší štart hry",
          "Nízke využitie operačnej pamäte",
          "Prednastavené video nastavenia"
        ],
        requirements: [
          "Minecraft Java Edition",
          "Odporúčané 4 GB RAM pre inštanciu",
          "Java 21 pre rad 1.21.x",
          "Samostatná čistá inštancia"
        ]
      },
      en: {
        badge: "RECOMMENDED",
        description: "Maximally optimized FPS modpack.",
        longDescription: "Maximally optimized FPS modpack for Minecraft 1.21.1 with the Fabric loader.",
        features: [
          "Maximum FPS profile",
          "Optimized chunk rendering",
          "Faster game startup",
          "Low memory usage",
          "Preset video settings"
        ],
        requirements: [
          "Minecraft Java Edition",
          "4 GB RAM per instance recommended",
          "Java 21 for the 1.21.x series",
          "A separate clean instance"
        ]
      }
    }
  },
  {
    id: "insider-performance",
    name: "Insider Performance",
    shortName: "Insider Performance",
    description: "Experimentální profil s nejnovějšími výkonovými optimalizacemi.",
    longDescription: "Připravovaný experimentální výkonový profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Insider",
    tags: ["Fabric", "Client", "Insider"],
    badge: "INSIDER BUILD",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-23",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #170a02 0%, #7d2604 34%, #f0780b 62%, #e6a51b 82%, #ffe06a 100%)",
    cube: ["#fff09c", "#f4a616", "#e86b08"],
    accentRgb: "255, 132, 22",
    accent: "#ff8c24",
    visual: "insider",
    i18n: {
      sk: {
        statusLabel: "VO VÝVOJI",
        description: "Experimentálny profil s najnovšími výkonnostnými optimalizáciami.",
        longDescription: "Pripravovaný experimentálny výkonnostný profil Minekube Studios."
      },
      en: {
        statusLabel: "IN DEVELOPMENT",
        description: "Experimental profile with the latest performance optimizations.",
        longDescription: "Upcoming experimental performance profile from Minekube Studios."
      }
    }
  },
  {
    id: "balanced-performance",
    name: "Balanced Performance",
    shortName: "Balanced Performance",
    description: "Vyvážený poměr vysokých FPS, stability a vizuální kvality.",
    longDescription: "Připravovaný vyvážený profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Balanced",
    tags: ["Fabric", "Client", "Balanced"],
    badge: "BALANCED",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-22",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #03101d 0%, #0d356f 34%, #1676cf 61%, #d29d1d 83%, #ffe06a 100%)",
    cube: ["#fff09c", "#e7b72b", "#1674c9"],
    accentRgb: "67, 158, 255",
    accent: "#4a9eff",
    visual: "balanced",
    i18n: {
      sk: {
        statusLabel: "VO VÝVOJI",
        description: "Vyvážený pomer vysokých FPS, stability a vizuálnej kvality.",
        longDescription: "Pripravovaný vyvážený profil Minekube Studios."
      },
      en: {
        statusLabel: "IN DEVELOPMENT",
        description: "A balanced mix of high FPS, stability and visual quality.",
        longDescription: "Upcoming balanced profile from Minekube Studios."
      }
    }
  },
  {
    id: "quality-performance",
    name: "Quality Performance",
    shortName: "Quality Performance",
    description: "Vysoká vizuální kvalita bez zbytečné ztráty výkonu.",
    longDescription: "Připravovaný kvalitativní profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Quality",
    tags: ["Fabric", "Client", "Quality"],
    badge: "QUALITY",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-21",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #190405 0%, #6e1015 33%, #d52e31 61%, #d69f1c 82%, #ffe16d 100%)",
    cube: ["#fff0a0", "#e5b62b", "#cc2830"],
    accentRgb: "255, 74, 81",
    accent: "#ff4a51",
    visual: "quality",
    i18n: {
      sk: {
        statusLabel: "VO VÝVOJI",
        description: "Vysoká vizuálna kvalita bez zbytočnej straty výkonu.",
        longDescription: "Pripravovaný kvalitatívny profil Minekube Studios."
      },
      en: {
        statusLabel: "IN DEVELOPMENT",
        description: "High visual quality without unnecessary performance loss.",
        longDescription: "Upcoming quality profile from Minekube Studios."
      }
    }
  },
  {
    id: "pvp-performance",
    name: "PvP Performance",
    shortName: "PvP Performance",
    description: "Rychlá odezva a čisté nastavení pro kompetitivní hraní.",
    longDescription: "Připravovaný kompetitivní profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "PvP",
    tags: ["Fabric", "Client", "PvP"],
    badge: "PVP PROFILE",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-20",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #12051d 0%, #421069 34%, #8220bd 61%, #d4a11e 83%, #ffe06c 100%)",
    cube: ["#fff0a0", "#e7b52b", "#8d25c7"],
    accentRgb: "190, 78, 255",
    accent: "#bd55ff",
    visual: "pvp",
    i18n: {
      sk: {
        statusLabel: "VO VÝVOJI",
        description: "Rýchla odozva a čisté nastavenie pre kompetitívne hranie.",
        longDescription: "Pripravovaný kompetitívny profil Minekube Studios."
      },
      en: {
        statusLabel: "IN DEVELOPMENT",
        description: "Fast response and clean settings for competitive play.",
        longDescription: "Upcoming competitive profile from Minekube Studios."
      }
    }
  }
];

function packText(pack, field) {
  const lang = state?.lang || "cs";
  return pack.i18n?.[lang]?.[field] ?? pack[field];
}

const state = {
  lang: initialLang,
  query: "",
  versions: new Set(),
  loaders: new Set(),
  categories: new Set(),
  sort: "featured",
  favorites: new Set(JSON.parse(safeStorage.get("minekube-favorites", "[]")))
};

const packGrid = document.getElementById("packGrid");
const resultCount = document.getElementById("resultCount");
const resultLabel = document.getElementById("resultLabel");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filtersPanel = document.querySelector(".filters-panel");
const filterToggle = document.getElementById("filterToggle");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const toast = document.getElementById("toast");
let modalCloseTimer = null;
let lastModalTrigger = null;
let currentModal = null;

function formatDownloads(value) {
  return new Intl.NumberFormat(currentLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}


function modalIcon(name, className = "") {
  const icons = {
    verified: '<path d="M12 3.2 14.2 5l2.8-.2.8 2.7 2.4 1.5-1.1 2.6 1.1 2.6-2.4 1.5-.8 2.7-2.8-.2L12 20.8 9.8 19l-2.8.2-.8-2.7L3.8 15l1.1-2.6-1.1-2.6 2.4-1.5L7 5.6l2.8.2L12 3.2Z"/><path d="m8.7 12.1 2.1 2.1 4.6-4.8"/>',
    game: '<path d="M6.4 8.2h11.2a3.4 3.4 0 0 1 3.2 4.5l-1.5 4.5a2.3 2.3 0 0 1-3.8.9l-1.3-1.2H9.8l-1.3 1.2a2.3 2.3 0 0 1-3.8-.9l-1.5-4.5a3.4 3.4 0 0 1 3.2-4.5Z"/><path d="M8 11v4M6 13h4M16.7 12.2h.1M18.4 14h.1"/>',
    cubes: '<path d="m12 3 7 4-7 4-7-4 7-4Z"/><path d="m5 7 7 4 7-4M5 12l7 4 7-4M5 17l7 4 7-4"/>',
    archive: '<path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/>',
    speed: '<path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/>',
    rocket: '<path d="M14.5 5.5c2.2-2.2 4.6-2.4 5.4-2.3.1.8-.1 3.2-2.3 5.4l-4 4-3.4-.6-.6-3.4 4-4Z"/><path d="m9.7 10.3-3.2.5-2.4 2.4 4.1.8M13.7 14.3l-.5 3.2-2.4 2.4-.8-4.1M15.6 7.4h.1"/>',
    chunks: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/>',
    memory: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 10h8v4H8zM8 4v3M12 4v3M16 4v3M8 17v3M12 17v3M16 17v3M2 10h3M2 14h3M19 10h3M19 14h3"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 4v6M16 14v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    java: '<path d="M8 18h8M9 21h6M8.5 14.5h7l-.7 3.5H9.2l-.7-3.5Z"/><path d="M11 3c3 2-2 3.3 1 5.2M14 4.5c2 1.4-1.2 2.5.5 3.8"/>',
    layers: '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 20h14"/>',
    shield: '<path d="M12 3 19 6v5c0 4.4-2.7 7.8-7 10-4.3-2.2-7-5.6-7-10V6l7-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>'
  };
  return `<svg class="modal-svg-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.check}</svg>`;
}

function createDownloadButton(packId, label, extraClass = "") {
  return `
    <button class="button button-primary download-ultimate ${extraClass}" type="button" data-download="${packId}" aria-label="${label}">
      <span class="download-hover-back" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </span>
      <span class="download-fx" aria-hidden="true">
        <span class="download-plasma"></span>
        <span class="download-matrix"></span>
        <span class="download-sweep"></span>
        <span class="download-pulse-line"></span>
        <span class="download-particles">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
      </span>
      <span class="download-label">${label}</span>
      <span class="download-icon" aria-hidden="true">
        <span class="download-icon-orbit"></span>
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>
      </span>
    </button>
  `;
}

function createUnreleasedButton(packId) {
  const label = t("pack.unreleased");
  return `
    <button class="release-pending-button" type="button" data-unreleased="${packId}" aria-label="${label}" title="${label}">
      <span class="pending-button-ambient" aria-hidden="true"></span>
      <span class="pending-button-grid" aria-hidden="true"></span>
      <span class="pending-button-label">${label}</span>
      <span class="pending-button-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M12 14v2"/></svg>
      </span>
    </button>
  `;
}

function createPackCard(pack) {
  const favorite = state.favorites.has(pack.id);
  const isReleased = pack.status === "released";
  const tagIcons = {
    Fabric: '<path d="M5 7h14v10H5z"/><path d="M8 4v3M12 4v3M16 4v3M8 17v3M12 17v3M16 17v3"/>',
    Client: '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "Maximum FPS": '<path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/>',
    Insider: '<path d="M12 3 5 6v5c0 4.6 2.7 7.8 7 10 4.3-2.2 7-5.4 7-10V6l-7-3Z"/><path d="M9 12h6M12 9v6"/>',
    Balanced: '<path d="M12 3v18M5 7h14M7 7l-3 5h6L7 7ZM17 7l-3 5h6l-3-5Z"/>',
    Quality: '<path d="m12 3 2.6 5.2 5.7.8-4.1 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.1-4 5.7-.8L12 3Z"/>',
    PvP: '<path d="m7 4 10 16M17 4 7 20M5 7h14M5 17h14"/>'
  };

  const actionMarkup = isReleased
    ? `${createDownloadButton(pack.id, t("pack.download"), "download-button")}
       <button class="details-button" type="button" data-details="${pack.id}" aria-label="${t("pack.detailsAria", { name: pack.name })}" title="${t("pack.details")}">
         <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
       </button>`
    : createUnreleasedButton(pack.id);

  const favLabel = favorite ? t("pack.favRemove") : t("pack.favAdd");

  return `
    <article class="pack-card pack-card-${pack.visual || "default"} ${isReleased ? "is-released" : "is-unreleased"}" data-pack-id="${pack.id}" style="--pack-accent:${pack.accent}; --pack-accent-rgb:${pack.accentRgb}">
      <span class="pack-card-aura" aria-hidden="true"></span>
      <span class="pack-card-grid" aria-hidden="true"></span>
      <div class="pack-cover" style="--cover-bg:${pack.color}; --cube-a:${pack.cube[0]}; --cube-b:${pack.cube[1]}; --cube-c:${pack.cube[2]}; --cover-accent:${pack.accent}; --cover-accent-rgb:${pack.accentRgb}">
        <span class="pack-badge ${isReleased ? "" : "is-coming"}"><i></i>${packText(pack, "badge")}</span>
        <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-favorite="${pack.id}" aria-label="${favLabel}" aria-pressed="${favorite}">
          <span class="favorite-orbit" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
        <div class="cover-speed-lines"><i></i><i></i><i></i></div>
        <div class="cover-hud cover-hud-left" aria-hidden="true"><i></i><span>${t("pack.core")}</span></div>
        <div class="cover-hud cover-hud-right" aria-hidden="true"><span>MK // ${String(modpacks.indexOf(pack) + 1).padStart(2, "0")}</span><i></i></div>
        <div class="cover-cube" aria-hidden="true">
          <span class="face-top"></span>
          <span class="face-left"></span>
          <span class="face-right"></span>
        </div>
        <div class="cover-data-strip" aria-hidden="true"><span><i></i> ${isReleased ? t("pack.live") : t("pack.indev")}</span><b>${isReleased ? t("pack.engine") : t("pack.soon")}</b></div>
      </div>
      <div class="pack-body">
        <div class="pack-title-row">
          <div class="pack-title-main">
            <span class="release-state ${isReleased ? "" : "is-coming"}"><i></i> ${packText(pack, "statusLabel")}</span>
            <h3>${pack.name}</h3>
          </div>
          <span class="pack-version"><small>${t("pack.minecraft")}</small>${pack.release}</span>
        </div>
        <p class="pack-description">${packText(pack, "description")}</p>
        <div class="tag-row">
          ${pack.tags.map(tag => `<span class="tag"><svg viewBox="0 0 24 24" aria-hidden="true">${tagIcons[tag] || '<path d="m5 12 4 4L19 6"/>'}</svg>${tag}</span>`).join("")}
        </div>
        <div class="pack-stats">
          <span class="pack-stat" title="${t("pack.perfTitle")}">
            <svg viewBox="0 0 24 24"><path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/></svg>
            <small>${t("pack.perf")}</small><strong>${pack.performance}</strong>
          </span>
          <span class="pack-stat" title="${t("pack.modsTitle")}">
            <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>
            <small>${t("pack.mods")}</small><strong>${pack.mods}</strong>
          </span>
          <span class="pack-stat" title="${t("pack.fpsTitle")}">
            <svg viewBox="0 0 24 24"><path d="M5 17a7 7 0 1 1 14 0"/><path d="m12 17 4-5"/></svg>
            <small>${t("pack.maxfps")}</small><strong>${pack.fpsLabel}</strong>
          </span>
        </div>
        <div class="pack-actions ${isReleased ? "" : "pending-only"}">
          ${actionMarkup}
        </div>
      </div>
    </article>
  `;
}

function getFilteredPacks() {
  const locale = currentLocale();
  const query = state.query.trim().toLocaleLowerCase(locale);

  let result = modpacks.filter(pack => {
    const searchable = `${pack.name} ${packText(pack, "description")} ${pack.loader} ${pack.category} ${pack.tags.join(" ")}`.toLocaleLowerCase(locale);
    const queryMatch = !query || searchable.includes(query);
    const versionMatch = state.versions.size === 0 || pack.versions.some(version => state.versions.has(version));
    const loaderMatch = state.loaders.size === 0 || state.loaders.has(pack.loader);
    const categoryMatch = state.categories.size === 0 || state.categories.has(pack.category);
    return queryMatch && versionMatch && loaderMatch && categoryMatch;
  });

  const sorters = {
    featured: (a, b) => modpacks.indexOf(a) - modpacks.indexOf(b),
    downloads: (a, b) => b.downloads - a.downloads,
    fps: (a, b) => b.fps - a.fps,
    newest: (a, b) => new Date(b.updated) - new Date(a.updated),
    name: (a, b) => a.name.localeCompare(b.name, currentLocale())
  };

  return result.sort(sorters[state.sort]);
}

function renderPacks() {
  const filtered = getFilteredPacks();
  packGrid.innerHTML = filtered.map(createPackCard).join("");
  requestAnimationFrame(() => registerRevealElements(packGrid.querySelectorAll(".pack-card"), 90));
  resultCount.textContent = filtered.length;
  if (resultLabel) {
    const releasedCount = filtered.filter(pack => pack.status === "released").length;
    resultLabel.textContent = filtered.length === 1
      ? (releasedCount === 1 ? t("results.oneReleased") : t("results.onePending"))
      : t("results.many", { n: filtered.length, r: releasedCount });
  }
  emptyState.hidden = filtered.length !== 0;
  packGrid.hidden = filtered.length === 0;
}

function updateFilterState(input) {
  const collection = input.name === "version"
    ? state.versions
    : input.name === "loader"
      ? state.loaders
      : state.categories;

  input.checked ? collection.add(input.value) : collection.delete(input.value);
  renderPacks();
}

function resetFilters() {
  state.query = "";
  state.versions.clear();
  state.loaders.clear();
  state.categories.clear();
  searchInput.value = "";
  document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => input.checked = false);
  renderPacks();
}

function renderPackModalContent(pack) {
  const featureIcons = ["speed", "chunks", "rocket", "memory", "settings"];
  const requirementIcons = ["game", "memory", "java", "layers"];
  const features = packText(pack, "features") || [];
  const requirements = packText(pack, "requirements") || [];

  return `
    <div class="modal-hero" style="--cover-bg:${pack.color}">
      <span class="modal-hero-grid-lines" aria-hidden="true"></span>
      <span class="modal-hero-glow" aria-hidden="true"></span>
      <div class="modal-hero-layout">
        <div class="modal-hero-copy">
          <span class="modal-kicker">${modalIcon("verified")} ${t("modal.verified")}</span>
          <h2 id="modalTitle">${pack.shortName || pack.name}</h2>
          <p>${pack.category} <i></i> ${pack.loader} <i></i> Minecraft ${pack.release}</p>
          <div class="modal-hero-status">
            <span><b></b> ${t("modal.stable")}</span>
            <span>${t("modal.client")}</span>
          </div>
        </div>
        <div class="modal-power-core" aria-hidden="true">
          <span class="power-ring power-ring-one"></span>
          <span class="power-ring power-ring-two"></span>
          <span class="power-ring power-ring-three"></span>
          <span class="power-diamond"><i></i></span>
          <small>ULTRA</small>
        </div>
      </div>
    </div>

    <div class="modal-body">
      <div class="modal-stats" aria-label="Parametry modpacku">
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("game")}</span>
          <div><small>${t("modal.gameVersion")}</small><strong>Minecraft ${pack.versions[0]}</strong></div>
        </article>
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("cubes")}</span>
          <div><small>${t("modal.content")}</small><strong>${t("modal.contentValue", { n: pack.mods })}</strong></div>
        </article>
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("archive")}</span>
          <div><small>${t("modal.size")}</small><strong>${pack.size}</strong></div>
        </article>
        <article class="modal-stat-card modal-stat-highlight">
          <span class="modal-stat-icon">${modalIcon("speed")}</span>
          <div><small>${t("modal.perfProfile")}</small><strong>${t("modal.perfValue", { p: pack.performance })}</strong></div>
        </article>
      </div>

      <div class="modal-description">
        <span class="modal-description-icon">${modalIcon("shield")}</span>
        <div>
          <small>${t("modal.proven")}</small>
          <p>${packText(pack, "longDescription")} ${t("modal.provenText")}</p>
        </div>
      </div>

      <div class="modal-columns">
        <section class="modal-panel modal-panel-features">
          <header class="modal-panel-heading">
            <span>${modalIcon("rocket")}</span>
            <div><small>${t("modal.advKicker")}</small><h3>${t("modal.advTitle")}</h3></div>
          </header>
          <ul class="modal-feature-list">
            ${features.map((feature, index) => `
              <li>
                <span class="modal-list-icon">${modalIcon(featureIcons[index] || "check")}</span>
                <span>${feature}</span>
                <b>${modalIcon("check")}</b>
              </li>`).join("")}
          </ul>
        </section>

        <section class="modal-panel modal-panel-requirements">
          <header class="modal-panel-heading">
            <span>${modalIcon("settings")}</span>
            <div><small>${t("modal.reqKicker")}</small><h3>${t("modal.reqTitle")}</h3></div>
          </header>
          <ul class="modal-feature-list">
            ${requirements.map((item, index) => `
              <li>
                <span class="modal-list-icon">${modalIcon(requirementIcons[index] || "check")}</span>
                <span>${item}</span>
                <b>${modalIcon("check")}</b>
              </li>`).join("")}
          </ul>
        </section>
      </div>

      <div class="modal-download">
        <div class="modal-release-icon">${modalIcon("download")}</div>
        <div class="modal-release-copy">
          <span>${t("modal.release")}</span>
          <strong>${pack.release} · Minecraft ${pack.versions[0]}</strong>
          <small>${t("modal.releaseMeta", { loader: pack.loader, size: pack.size })}</small>
        </div>
        ${pack.downloadUrl ? `
        ${createDownloadButton(pack.id, t("modal.downloadZip"), "modal-download-button")}` : `
        <button class="button button-secondary" type="button" disabled>
          ${t("modal.unavailable")}
        </button>`}
      </div>
    </div>
  `;
}

function openPackModal(pack) {
  if (!pack) return;
  currentModal = { kind: "pack", id: pack.id };
  modalContent.innerHTML = renderPackModalContent(pack);
  showModal();
}

function renderInfoModalContent(type) {
  const content = {
    methodology: {
      title: t("info.methodologyTitle"),
      text: t("info.methodologyText")
    },
    changelog: {
      title: t("info.changelogTitle"),
      text: t("info.changelogText")
    },
    compatibility: {
      title: t("info.compatibilityTitle"),
      text: t("info.compatibilityText")
    },
    license: {
      title: t("info.licenseTitle"),
      text: t("info.licenseText")
    }
  }[type];

  return `
    <div class="modal-hero" style="--cover-bg:linear-gradient(135deg,#210623,#7c1194,#ff8500,#ffd84f)">
      <div><h2 id="modalTitle">${content.title}</h2></div>
    </div>
    <div class="modal-body">
      <p>${content.text}</p>
      <div class="modal-download">
        <div>
          <span>${t("modal.demo")}</span>
          <strong>${t("modal.demoText")}</strong>
        </div>
        <button class="button button-secondary" type="button" data-close-modal>${t("modal.close")}</button>
      </div>
    </div>
  `;
}

function openInfoModal(type) {
  currentModal = { kind: "info", type };
  modalContent.innerHTML = renderInfoModalContent(type);
  showModal();
}

function refreshOpenModalLanguage() {
  if (modalBackdrop.hidden || !currentModal) return;
  if (currentModal.kind === "pack") {
    const pack = modpacks.find(item => item.id === currentModal.id);
    if (pack) modalContent.innerHTML = renderPackModalContent(pack);
  } else if (currentModal.kind === "info") {
    modalContent.innerHTML = renderInfoModalContent(currentModal.type);
  }
}

function showModal() {
  window.clearTimeout(modalCloseTimer);
  modalCloseTimer = null;
  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  modalBackdrop.classList.remove("is-closing", "is-visible");
  modalClose.classList.remove("is-closing-trigger");
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");

  // Dva snímky zajistí, že prohlížeč nejdřív vykreslí počáteční stav a až potom animaci.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalBackdrop.classList.add("is-visible");
      modalClose.focus({ preventScroll: true });
    });
  });
}

function closeModal({ animateCloseButton = false } = {}) {
  if (modalBackdrop.hidden || modalBackdrop.classList.contains("is-closing")) return;

  window.clearTimeout(modalCloseTimer);
  modalBackdrop.classList.remove("is-visible");
  modalBackdrop.classList.add("is-closing");

  if (animateCloseButton) {
    modalClose.classList.remove("is-closing-trigger");
    void modalClose.offsetWidth;
    modalClose.classList.add("is-closing-trigger");
  }

  const finishClosing = () => {
    modalBackdrop.hidden = true;
    modalBackdrop.classList.remove("is-closing");
    modalClose.classList.remove("is-closing-trigger");
    document.body.classList.remove("modal-open");
    currentModal = null;

    if (lastModalTrigger?.isConnected) {
      lastModalTrigger.focus({ preventScroll: true });
    }
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  modalCloseTimer = window.setTimeout(finishClosing, reducedMotion ? 20 : 430);
}

let toastTimer;
function showToast(message, type = "default", duration = 2900) {
  clearTimeout(toastTimer);

  const toastMessage = toast.querySelector(".toast-message");
  const toastKicker = toast.querySelector(".toast-kicker");
  const typeClasses = ["is-download-start", "is-download-success", "is-warning", "is-favorite", "is-theme", "is-system"];

  toast.classList.remove("show", ...typeClasses);
  toast.style.setProperty("--toast-duration", `${duration}ms`);

  if (toastMessage) toastMessage.textContent = message;

  const toastConfig = {
    "download-start": { className: "is-download-start", kicker: t("kicker.transfer") },
    "download-success": { className: "is-download-success", kicker: t("kicker.download") },
    warning: { className: "is-warning", kicker: t("kicker.warn") },
    favorite: { className: "is-favorite", kicker: t("kicker.fav") },
    theme: { className: "is-theme", kicker: t("kicker.ui") },
    lang: { className: "is-theme", kicker: t("kicker.lang") }
  }[type];

  if (toastConfig) {
    toast.classList.add(toastConfig.className);
    if (toastKicker) toastKicker.textContent = toastConfig.kicker;
  } else {
    toast.classList.add("is-system");
    if (toastKicker) toastKicker.textContent = t("kicker.sys");
  }

  // Restartuje vstupní, pulzní i časovací animaci při každém novém oznámení.
  void toast.offsetWidth;
  toast.classList.add("show");

  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

function createFavoriteBurst(button, activating) {
  if (!button || prefersReducedMotion.matches) return;

  const burst = document.createElement("span");
  burst.className = `favorite-burst ${activating ? "is-love" : "is-unlove"}`;

  for (let index = 0; index < 10; index += 1) {
    const particle = document.createElement("i");
    particle.style.setProperty("--favorite-angle", `${index * 36 + Math.random() * 10 - 5}deg`);
    particle.style.setProperty("--favorite-distance", `${22 + Math.random() * 18}px`);
    particle.style.setProperty("--favorite-delay", `${Math.random() * 70}ms`);
    burst.appendChild(particle);
  }

  button.appendChild(burst);
  window.setTimeout(() => burst.remove(), 760);
}

function toggleFavorite(id, button) {
  const activating = !state.favorites.has(id);

  if (activating) {
    state.favorites.add(id);
    showToast(t("toast.favAdd"));
  } else {
    state.favorites.delete(id);
    showToast(t("toast.favRemove"));
  }

  safeStorage.set("minekube-favorites", JSON.stringify([...state.favorites]));

  if (button) {
    button.classList.toggle("active", activating);
    button.classList.remove("is-popping", "is-unpopping");
    void button.offsetWidth;
    button.classList.add(activating ? "is-popping" : "is-unpopping");
    button.setAttribute("aria-pressed", String(activating));
    button.setAttribute("aria-label", activating ? t("pack.favRemove") : t("pack.favAdd"));
    createFavoriteBurst(button, activating);
    window.setTimeout(() => button.classList.remove("is-popping", "is-unpopping"), 720);
  }
}

function playDownloadAnimation(button, event) {
  if (!button) return;

  button.classList.remove("download-animating");
  void button.offsetWidth;
  button.classList.add("download-animating");

  const rect = button.getBoundingClientRect();
  const hasPointerPosition = event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY) && (event.clientX || event.clientY);
  const x = hasPointerPosition ? event.clientX : rect.left + rect.width / 2;
  const y = hasPointerPosition ? event.clientY : rect.top + rect.height / 2;

  // Původní čistý pulz — jen jemně detailnější a s více částicemi.
  const burst = document.createElement("span");
  burst.className = "download-click-burst download-click-burst-classic-plus";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  for (let index = 0; index < 3; index += 1) {
    const ring = document.createElement("span");
    ring.className = "download-burst-ring";
    ring.style.setProperty("--ring-delay", `${index * 74}ms`);
    ring.style.setProperty("--ring-scale", `${6.9 + index * 2.25}`);
    burst.appendChild(ring);
  }

  const sparkCount = 28;
  for (let index = 0; index < sparkCount; index += 1) {
    const spark = document.createElement("i");
    const angle = (360 / sparkCount) * index + (Math.random() * 10 - 5);
    spark.style.setProperty("--spark-angle", `${angle}deg`);
    spark.style.setProperty("--spark-distance", `${64 + Math.random() * 72}px`);
    spark.style.setProperty("--spark-length", `${10 + Math.random() * 21}px`);
    spark.style.setProperty("--spark-delay", `${Math.random() * 105}ms`);
    spark.style.setProperty("--spark-width", `${1.7 + Math.random() * 2.2}px`);
    burst.appendChild(spark);
  }

  const fragmentCount = 16;
  for (let index = 0; index < fragmentCount; index += 1) {
    const fragment = document.createElement("b");
    const angle = (360 / fragmentCount) * index + (Math.random() * 20 - 10);
    fragment.style.setProperty("--fragment-angle", `${angle}deg`);
    fragment.style.setProperty("--fragment-distance", `${48 + Math.random() * 74}px`);
    fragment.style.setProperty("--fragment-spin", `${180 + Math.random() * 500}deg`);
    fragment.style.setProperty("--fragment-delay", `${25 + Math.random() * 115}ms`);
    burst.appendChild(fragment);
  }

  const microParticleCount = 14;
  for (let index = 0; index < microParticleCount; index += 1) {
    const particle = document.createElement("u");
    const angle = (360 / microParticleCount) * index + (Math.random() * 26 - 13);
    particle.style.setProperty("--micro-angle", `${angle}deg`);
    particle.style.setProperty("--micro-distance", `${38 + Math.random() * 64}px`);
    particle.style.setProperty("--micro-delay", `${55 + Math.random() * 135}ms`);
    particle.style.setProperty("--micro-size", `${2 + Math.random() * 2.6}px`);
    burst.appendChild(particle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1240);
  window.setTimeout(() => button.classList.remove("download-animating"), 1020);
}

async function triggerDownload(button, pack, event) {
  if (!button || button.getAttribute("aria-busy") === "true") return;

  button.setAttribute("aria-busy", "true");
  playDownloadAnimation(button, event);

  await new Promise(resolve => window.setTimeout(resolve, 620));

  try {
    await demoDownload(pack);
  } finally {
    button.removeAttribute("aria-busy");
  }
}

async function demoDownload(pack) {
  if (!pack?.downloadUrl) {
    showToast(t("toast.dlNone"), "warning", 3600);
    return;
  }

  showToast(t("toast.dlStart"), "download-start", 1800);

  // Přímý odkaz míří na soubor v GitHub Release. GitHub ho vrátí
  // jako přílohu, takže se neotevře stránka projektu ani Game Jolt.
  const link = document.createElement("a");
  link.href = pack.downloadUrl;
  link.download = pack.downloadFileName || "";
  link.target = "_self";
  link.rel = "noopener noreferrer";
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast(t("toast.dlOk"), "download-success", 4200);
}


searchInput.addEventListener("input", event => {
  state.query = event.target.value;
  renderPacks();
});

document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => {
  input.addEventListener("change", () => updateFilterState(input));
});

sortSelect.addEventListener("change", event => {
  state.sort = event.target.value;
  renderPacks();
});

document.getElementById("resetFilters").addEventListener("click", resetFilters);
document.getElementById("emptyReset").addEventListener("click", resetFilters);

filterToggle.addEventListener("click", () => {
  filtersPanel.classList.toggle("mobile-open");
  filterToggle.setAttribute("aria-expanded", filtersPanel.classList.contains("mobile-open"));
});

packGrid.addEventListener("click", event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  const detailsButton = event.target.closest("[data-details]");
  const downloadButton = event.target.closest("[data-download]");
  const unreleasedButton = event.target.closest("[data-unreleased]");

  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite, favoriteButton);
  if (detailsButton) {
    detailsButton.classList.remove("is-activating");
    void detailsButton.offsetWidth;
    detailsButton.classList.add("is-activating");
    window.setTimeout(() => detailsButton.classList.remove("is-activating"), 420);
    openPackModal(modpacks.find(pack => pack.id === detailsButton.dataset.details));
  }
  if (downloadButton) triggerDownload(downloadButton, modpacks.find(pack => pack.id === downloadButton.dataset.download), event);
  if (unreleasedButton) showToast(t("toast.unreleased"), "warning", 3200);
});

modalContent.addEventListener("click", event => {
  const downloadButton = event.target.closest("[data-download]");
  const closeButton = event.target.closest("[data-close-modal]");
  if (downloadButton) triggerDownload(downloadButton, modpacks.find(pack => pack.id === downloadButton.dataset.download), event);
  if (closeButton) closeModal();
});

modalClose.addEventListener("click", () => closeModal({ animateCloseButton: true }));
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

document.getElementById("methodologyButton").addEventListener("click", () => openInfoModal("methodology"));
document.querySelectorAll("[data-dialog]").forEach(button => {
  button.addEventListener("click", () => openInfoModal(button.dataset.dialog));
});

const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");

menuButton.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuButton.classList.toggle("active", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
});

mobileNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
  });
});


function initializeUltimateDownloadButtons() {
  const precisePointer = window.matchMedia("(pointer: fine)");
  if (!precisePointer.matches || prefersReducedMotion.matches) return;

  let activeButton = null;
  let frame = 0;
  let pendingEvent = null;

  const updateButton = () => {
    frame = 0;
    if (!activeButton || !pendingEvent || !activeButton.isConnected) return;

    const rect = activeButton.getBoundingClientRect();
    const px = Math.min(Math.max((pendingEvent.clientX - rect.left) / rect.width, 0), 1);
    const py = Math.min(Math.max((pendingEvent.clientY - rect.top) / rect.height, 0), 1);
    const nx = px - .5;
    const ny = py - .5;

    activeButton.style.setProperty("--pointer-x", `${px * 100}%`);
    activeButton.style.setProperty("--pointer-y", `${py * 100}%`);
    activeButton.style.setProperty("--tilt-x", `${ny * -7}deg`);
    activeButton.style.setProperty("--tilt-y", `${nx * 9}deg`);
    activeButton.style.setProperty("--magnet-x", `${nx * 5}px`);
    activeButton.style.setProperty("--magnet-y", `${ny * 3}px`);
  };

  document.addEventListener("pointermove", event => {
    const button = event.target.closest?.(".download-ultimate");
    if (!button) return;

    activeButton = button;
    pendingEvent = event;
    button.classList.add("is-pointer-active");

    if (!frame) frame = requestAnimationFrame(updateButton);
  });

  document.addEventListener("pointerout", event => {
    const button = event.target.closest?.(".download-ultimate");
    if (!button || button.contains(event.relatedTarget)) return;

    button.classList.remove("is-pointer-active");
    button.style.setProperty("--pointer-x", "50%");
    button.style.setProperty("--pointer-y", "50%");
    button.style.setProperty("--tilt-x", "0deg");
    button.style.setProperty("--tilt-y", "0deg");
    button.style.setProperty("--magnet-x", "0px");
    button.style.setProperty("--magnet-y", "0px");

    if (activeButton === button) {
      activeButton = null;
      pendingEvent = null;
    }
  });
}

const themeToggle = document.getElementById("themeToggle");
const savedTheme = safeStorage.get("minekube-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = current;
  safeStorage.set("minekube-theme", current);
  showToast(current === "light" ? t("toast.themeLight") : t("toast.themeDark"));
});

const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scrollProgress span");
const benchmarkSection = document.querySelector(".benchmark-section");
let scrollFramePending = false;

function syncScrollExperience() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

  siteHeader?.classList.toggle("scrolled", window.scrollY > 16);
  scrollProgress?.style.setProperty("--scroll-progress", progress.toFixed(4));

  if (benchmarkSection) {
    const rect = benchmarkSection.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const sectionCenter = rect.top + rect.height / 2;
    const normalized = Math.max(-1, Math.min(1, (sectionCenter - viewportCenter) / window.innerHeight));
    benchmarkSection.style.setProperty("--benchmark-parallax", `${normalized * 34}px`);
  }

  scrollFramePending = false;
}

window.addEventListener("scroll", () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(syncScrollExperience);
}, { passive: true });

window.addEventListener("resize", syncScrollExperience, { passive: true });

// Výkonový 3D HUD byl z katalogu odstraněn. Inicializace zůstává bezpečně volitelná,
// aby případné budoucí použití stejné komponenty nezpůsobilo chybu JavaScriptu.
const counter = document.querySelector("[data-counter]");
const performanceCard = document.querySelector(".performance-card");

if (counter && performanceCard) {
  const counterObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    const target = Number(counter.dataset.counter);
    const start = performance.now();
    const duration = 1100;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    counterObserver.disconnect();
  }, { threshold: .55 });

  counterObserver.observe(performanceCard);

  if (window.matchMedia("(pointer: fine)").matches) {
    performanceCard.addEventListener("pointermove", event => {
      const rect = performanceCard.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      performanceCard.style.setProperty("--ry", `${px * 7}deg`);
      performanceCard.style.setProperty("--rx", `${py * -5}deg`);
    });

    performanceCard.addEventListener("pointerleave", () => {
      performanceCard.style.setProperty("--ry", "-4deg");
      performanceCard.style.setProperty("--rx", "2deg");
    });
  }
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const benchmarkBoard = document.querySelector(".benchmark-board");

function animateNumericValue(element, duration = 1350) {
  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || "";

  if (prefersReducedMotion.matches) {
    element.textContent = `${target}${suffix}`;
    return;
  }

  const start = performance.now();
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

if (benchmarkBoard) {
  const revealBenchmark = () => {
    benchmarkBoard.classList.add("is-visible");
    benchmarkBoard.querySelectorAll("[data-count]").forEach((element, index) => {
      window.setTimeout(() => animateNumericValue(element, index < 2 ? 1450 : 1050), 300 + index * 115);
    });
  };

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealBenchmark();
  } else {
    const benchmarkObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      revealBenchmark();
      benchmarkObserver.disconnect();
    }, { threshold: .3 });

    benchmarkObserver.observe(benchmarkBoard);
  }

  if (window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion.matches) {
    benchmarkBoard.addEventListener("pointermove", event => {
      const rect = benchmarkBoard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      benchmarkBoard.style.setProperty("--by", `${x * 3.8}deg`);
      benchmarkBoard.style.setProperty("--bx", `${y * -3}deg`);
    });

    benchmarkBoard.addEventListener("pointerleave", () => {
      benchmarkBoard.style.setProperty("--by", "0deg");
      benchmarkBoard.style.setProperty("--bx", "0deg");
    });
  }
}

let revealObserver = null;

function registerRevealElements(elements, baseDelay = 65) {
  const list = [...elements].filter(element => !element.classList.contains("scroll-reveal"));
  if (!list.length) return;

  list.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 6) * baseDelay}ms`);

    if (element.matches(".benchmark-copy, .filters-panel, .about-copy")) {
      element.style.setProperty("--reveal-x", "-28px");
      element.style.setProperty("--reveal-y", "0px");
    } else if (element.matches(".about-emblem")) {
      element.style.setProperty("--reveal-x", "28px");
      element.style.setProperty("--reveal-y", "0px");
    }

    if (prefersReducedMotion.matches || !revealObserver) {
      element.classList.add("is-revealed");
    } else {
      revealObserver.observe(element);
    }
  });
}

function initializeScrollExperience() {
  if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: .12,
      rootMargin: "0px 0px -7% 0px"
    });
  }

  const revealGroups = [
    [document.querySelectorAll(".trust-items > *"), 55],
    [document.querySelectorAll(".section-heading"), 0],
    [document.querySelectorAll(".filters-panel, .catalog-toolbar"), 80],
    [document.querySelectorAll(".pack-card"), 90],
    [document.querySelectorAll(".server-card"), 0],
    [document.querySelectorAll(".benchmark-copy"), 0],
    [document.querySelectorAll(".steps-grid .step-card"), 105],
    [document.querySelectorAll(".about-copy, .about-emblem"), 110],
    [document.querySelectorAll(".cta-card"), 0],
    [document.querySelectorAll(".footer-grid > *"), 70]
  ];

  revealGroups.forEach(([elements, delay]) => registerRevealElements(elements, delay));

  const updateNavigationActive = id => {
    document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]').forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === id);
    });
  };

  // Jednoduché plynulé scrollování bez celoplošných přechodových animací.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
      updateNavigationActive(id);
    });
  });

  const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]')];
  const observedSections = [...new Set(sectionLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean))];

  if ("IntersectionObserver" in window) {
    const navigationObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      sectionLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, { rootMargin: "-28% 0px -58% 0px", threshold: [0, .1, .35] });

    observedSections.forEach(section => navigationObserver.observe(section));
  }

  syncScrollExperience();
}


function initializeCustomSort() {
  const wrapper = sortSelect?.closest(".sort-select");
  if (!wrapper || wrapper.querySelector(".sort-control")) return;

  sortSelect.classList.add("native-sort-select");

  const control = document.createElement("div");
  control.className = "sort-control";
  control.innerHTML = `
    <button class="sort-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="sort-trigger-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 6h12M4 6h.01M8 12h9M4 12h.01M8 18h6M4 18h.01"/></svg></span>
      <span class="sort-trigger-copy"><small>${t("sort.current")}</small><strong>${sortSelect.options[sortSelect.selectedIndex].text}</strong></span>
      <span class="sort-trigger-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg></span>
    </button>
    <div class="sort-menu" role="listbox" aria-label="${t("a11y.sort")}"></div>
  `;

  const menu = control.querySelector(".sort-menu");
  [...sortSelect.options].forEach((option, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sort-option";
    item.dataset.value = option.value;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(option.selected));
    item.innerHTML = `<span class="sort-option-index">0${index + 1}</span><span class="sort-option-label">${option.text}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`;
    menu.appendChild(item);
  });

  wrapper.appendChild(control);
  const trigger = control.querySelector(".sort-trigger");
  const currentLabel = control.querySelector(".sort-trigger-copy strong");

  const close = () => {
    control.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", event => {
    event.preventDefault();
    const isOpen = control.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", event => {
    const optionButton = event.target.closest(".sort-option");
    if (!optionButton) return;
    sortSelect.value = optionButton.dataset.value;
    sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
    currentLabel.textContent = sortSelect.options[sortSelect.selectedIndex].text;
    menu.querySelectorAll(".sort-option").forEach(item => item.setAttribute("aria-selected", String(item === optionButton)));
    close();
  });

  document.addEventListener("click", event => {
    if (!control.contains(event.target)) close();
  });

  control.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      close();
      trigger.focus();
    }
  });
}

function refreshCustomSortLanguage() {
  const control = document.querySelector(".sort-select .sort-control");
  if (!control) return;
  const caption = control.querySelector(".sort-trigger-copy small");
  const currentLabel = control.querySelector(".sort-trigger-copy strong");
  const menu = control.querySelector(".sort-menu");
  if (caption) caption.textContent = t("sort.current");
  if (currentLabel && sortSelect.options[sortSelect.selectedIndex]) {
    currentLabel.textContent = sortSelect.options[sortSelect.selectedIndex].text;
  }
  if (menu) menu.setAttribute("aria-label", t("a11y.sort"));
  control.querySelectorAll(".sort-option").forEach(item => {
    const option = [...sortSelect.options].find(entry => entry.value === item.dataset.value);
    const label = item.querySelector(".sort-option-label");
    if (option && label) label.textContent = option.text;
  });
}

function initializeEpicSurfaceInteractions() {
  if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion.matches) return;

  const applyTilt = (element, event, strength = 5) => {
    const rect = element.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    element.style.setProperty("--surface-x", `${x * 100}%`);
    element.style.setProperty("--surface-y", `${y * 100}%`);
    element.style.setProperty("--surface-ry", `${(x - .5) * strength}deg`);
    element.style.setProperty("--surface-rx", `${(y - .5) * -strength}deg`);
  };

  const resetTilt = element => {
    element.style.setProperty("--surface-x", "50%");
    element.style.setProperty("--surface-y", "50%");
    element.style.setProperty("--surface-ry", "0deg");
    element.style.setProperty("--surface-rx", "0deg");
  };

  document.querySelectorAll(".step-card").forEach(card => {
    card.addEventListener("pointermove", event => applyTilt(card, event, 4));
    card.addEventListener("pointerleave", () => resetTilt(card));
  });

  const aboutCard = document.querySelector(".about-card");
  aboutCard?.addEventListener("pointermove", event => applyTilt(aboutCard, event, 2.5));
  aboutCard?.addEventListener("pointerleave", () => resetTilt(aboutCard));

  const serverCard = document.querySelector(".server-card");
  serverCard?.addEventListener("pointermove", event => applyTilt(serverCard, event, 2.5));
  serverCard?.addEventListener("pointerleave", () => resetTilt(serverCard));

  const filters = document.querySelector(".filters-panel");
  filters?.addEventListener("pointermove", event => applyTilt(filters, event, 0));
}

function initializeSearchShortcut() {
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

/* =========================================================
   JAZYK STRÁNKY // PŘEPÍNAČ V HLAVIČCE
   ========================================================= */
function applyStaticLanguage() {
  document.documentElement.lang = state.lang;
  document.title = t("meta.title");
  document.getElementById("metaDescription")?.setAttribute("content", t("meta.desc"));

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(element => {
    element.setAttribute("placeholder", t(element.dataset.i18nPh));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(element => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach(element => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  const langCurrent = document.getElementById("langCurrent");
  if (langCurrent) langCurrent.textContent = LANG_CODES[state.lang] || "CZ";

  document.querySelectorAll("#langMenu .lang-option").forEach(option => {
    const selected = option.dataset.lang === state.lang;
    option.setAttribute("aria-selected", String(selected));
    option.classList.toggle("is-selected", selected);
  });
}

function setLanguage(lang, { announce = true } = {}) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  state.lang = lang;
  safeStorage.set("minekube-lang", lang);
  applyStaticLanguage();
  refreshCustomSortLanguage();
  renderPacks();
  refreshOpenModalLanguage();
  closeLanguageMenu();
  if (announce) showToast(t("toast.langSwitched"), "lang", 2600);
}

function closeLanguageMenu() {
  const switcher = document.getElementById("langSwitcher");
  const toggle = document.getElementById("langToggle");
  if (!switcher || !toggle) return;
  switcher.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}

function initializeLanguageSwitcher() {
  const switcher = document.getElementById("langSwitcher");
  const toggle = document.getElementById("langToggle");
  const menu = document.getElementById("langMenu");
  if (!switcher || !toggle || !menu) return;

  toggle.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = switcher.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll(".lang-option").forEach(option => {
    option.addEventListener("click", () => setLanguage(option.dataset.lang));
  });

  document.addEventListener("click", event => {
    if (!switcher.contains(event.target)) closeLanguageMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLanguageMenu();
  });
}

/* =========================================================
   SERVER // KOPÍROVÁNÍ IP ADRESY
   ========================================================= */
async function copyServerIp() {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = SERVER_IP;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    try {
      document.execCommand("copy");
    } catch {
      // Schránka není dostupná — IP zůstává viditelná na stránce.
    }
    fallback.remove();
  }
  showToast(t("toast.serverCopied"), "download-success", 3200);
}

function initializeServerButton() {
  document.getElementById("serverJoinButton")?.addEventListener("click", copyServerIp);
  document.getElementById("serverIp")?.addEventListener("click", copyServerIp);
}

/* Staré odkazy na odstraněnou sekci Domů přesměrujeme na začátek stránky. */
function fixLegacyHash() {
  if (window.location.hash === "#home") {
    history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}

document.getElementById("currentYear").textContent = new Date().getFullYear();

fixLegacyHash();
applyStaticLanguage();
renderPacks();
initializeCustomSort();
initializeUltimateDownloadButtons();
initializeEpicSurfaceInteractions();
initializeSearchShortcut();
initializeScrollExperience();
initializeLanguageSwitcher();
initializeServerButton();
