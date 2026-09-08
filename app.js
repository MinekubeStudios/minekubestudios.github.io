/* =============================================================
   MINEKUBE STUDIOS // HLAVNÍ STRÁNKA
   Jedna sekce „O projektu“ (obsahuje i obsah dřívějších sekcí
   Domů a Studio). Žádné celoobrazovkové animace — žádné boot
   loadingy, portálové přechody ani celoplošné pulzy.
   ============================================================= */

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

/* =============================================================
   I18N // ENGLISH · ČEŠTINA · SLOVENČINA
   Překládá texty označené data-i18n a textové atributy
   označené data-i18n-aria / data-i18n-title.
   ============================================================= */

const LANGUAGES = {
  en: { name: "English", code: "EN", dir: "ltr", html: "en" },
  cs: { name: "Čeština", code: "CZ", dir: "ltr", html: "cs" },
  sk: { name: "Slovenčina", code: "SK", dir: "ltr", html: "sk" }
};

const I18N = {
  cs: {
    "meta.title": "Minekube Studios — O projektu",
    "meta.description": "Minekube Studios — nezávislé československé studio výkonných Minecraft modpacků, komunitního serveru, Store a open-source projektů.",
    "brand.aria": "Minekube Studios — domovská stránka",
    "nav.aria": "Hlavní navigace",
    "nav.mobile.aria": "Mobilní navigace",
    "nav.about": "O projektu",
    "nav.modpacks": "Modpacky",
    "nav.server": "Server",
    "nav.server.aria": "Komunitní server — právě ho připravujeme",
    "nav.store": "Store",
    "theme.aria": "Přepnout motiv",
    "lang.aria": "Přepnout jazyk stránky",
    "lang.menu.title": "Jazyk stránky",
    "menu.aria": "Otevřít menu",
    "cta.modpacks.kicker": "VSTOUPIT DO KATALOGU",
    "cta.modpacks.title": "Procházet modpacky",
    "cta.github.kicker": "ZDROJOVÝ KÓD",
    "cta.github.title": "Minekube na GitHubu",
    "cta.github.aria": "Zdrojové kódy Minekube Studios na GitHubu",
    "kofi.label": "Podpořit projekt",
    "kofi.aria": "Podpořit Minekube Studios na Ko-fi",
    "intro.title1": "Minecraft budoucnosti.",
    "intro.title2": "Otevřený úplně všem.",
    "intro.lead": "Minekube Studios je nezávislé československé studio, které staví <strong>výkonné modpacky</strong>, komunitní Minecraft server, Store a moderní open-source projekty do jednoho ekosystému. Nové technologie hraní tvoříme společně s komunitou — bez paywallu a zcela zdarma.",
    "intro.stat1": "výkonových profilů",
    "intro.stat2": "zdarma pro komunitu",
    "intro.stat3": "moderní vývoj",
    "panel.modpacks": "5 výkonových profilů",
    "panel.server": "Komunitní server — ve vývoji",
    "panel.store": "Obsah zdarma, bez paywallu",
    "panel.open": "Stavíme společně",
    "about.title": "Výkon bez zničení původního Minecraftu",
    "about.p1": "Smyslem projektu je zachovat známý vanilla pocit, ale odstranit zbytečné propady FPS, dlouhé načítání a mikrosekání. Každý mod má mít jasný důvod, žádná výplň a žádné náhodné experimenty v produkčním vydání.",
    "about.p2": "Výsledkem je Minecraft, který se hraje stejně jako ten původní — jen je rychlejší, klidnější a šetrnější k tvému počítači.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Bezpečné aktualizace",
    "about.tag3": "Čistá konfigurace",
    "about.tag4": "Transparentní changelog",
    "principles.kicker": "PRINCIPY PROJEKTU",
    "principles.title": "Pravidla, podle kterých projekt chodí",
    "principles.lead": "Žádné náhodné experimenty — každé rozhodnutí v balíčku má jasný důvod.",
    "step1.title": "Vanilla friendly",
    "step1.text": "Hra se má cítit jako Minecraft — jen rychlejší, hladší a bez propadů a sekání.",
    "step2.title": "Bezpečné aktualizace",
    "step2.text": "Každý release jde dopředu bez ztráty světa i nastavení — s kontrolou stability před vydáním.",
    "step3.title": "Čistá konfigurace",
    "step3.text": "Smyslné výchozí nastavení od prvního spuštění. Žádná ruční dohlazování a laciné mody na výplň.",
    "step4.title": "Transparentní changelog",
    "step4.text": "Co se do balíčku přidalo, změnilo nebo odebralo — je vidět. Komunita ví, co stahuje.",
    "studio.title": "Studio, které staví ekosystém kolem Minecraftu",
    "studio.lead": "Nejsme firemní vývojář. Jsme nezávislá československá skupina vývojářů a fanoušků, kteří chtějí, aby Minecraft běhal lépe — a aby to bylo dostupné každému.",
    "studio.kicker": "KDO JSME",
    "studio.cardTitle": "Stavíme pro komunitu, ne pro byznys",
    "studio.cardP1": "Minekube Studios propojuje vývoj výkonných modpacků, komunitní server, Store s beplatným obsahem a moderní open-source projekty. Každý pilíř posiluje ostatní — a všechno držíme otevřené.",
    "studio.cardP2": "Vývoj sleduješ přímo, k projektu se můžeš podílet a o novinkách se dozvíš z první ruky. Nic za paywallelem, nic na úkor komunity.",
    "studio.value1": "100% zdarma pro komunitu",
    "studio.value2": "Open development",
    "studio.value3": "CZ/SK komunita",
    "studio.value4": "Store bez paywallu",
    "studio.factsAria": "Fakta o studiu",
    "studio.fact1": "domov studia",
    "studio.fact2Value": "0 KČ",
    "studio.fact2": "ceník pro komunitu",
    "studio.fact3": "pilíře ekosystému",
    "pillars.kicker": "CO STUDIO BUDUJE",
    "pillars.title": "Čtyři pilíře ekosystému",
    "pillars.lead": "Každý modul má vlastní misi — spolu tvoří jedno celé.",
    "pillar1.title": "Modpacky",
    "pillar1.text": "Pět výkonových profilů od Ultra až po PvP — čistě optimalizovaný Minecraft bez ztráty vanilla pocitu.",
    "pillar1.link": "Procházet modpacky",
    "pillar2.status": "VE VÝVOJI",
    "pillar2.title": "Komunitní server",
    "pillar2.text": "Vlastní Minecraft server s komunitními pravidly, eventovými akcemi a podporou od lidí, které znáš.",
    "pillar2.soon": "Brzy",
    "pillar3.title": "Store",
    "pillar3.text": "Beplatný obsah pro komunitu — bez paywallu a bez malicherností. Všechno, co vyjde, je otevřené.",
    "pillar3.link": "Otevřít Store",
    "pillar4.status": "STAVÍME SPOLEČNĚ",
    "pillar4.title": "Open source",
    "pillar4.text": "Moderní open-source projekty, které můžeš studovat, rozšiřovat a zlepšovat společně s námi.",
    "pillar4.link": "Přispět do projektu",
    "cta.kicker": "SPOLEČNĚ STAVÍME",
    "cta.title": "Ekosystém tvoříme společně.",
    "cta.lead": "Sleduj, co se chystá — a přidej se k tomu, co stavíme pro celou komunitu.",
    "cta.button": "Procházet modpacky",
    "footer.about": "Nezávislé československé studio výkonných Minecraft projektů.",
    "footer.col1": "Projekt",
    "footer.col2": "Informace",
    "footer.col3": "Komunita",
    "footer.info1": "Changelog",
    "footer.info2": "Kompatibilita",
    "footer.info3": "Licence",
    "footer.community1": "Discord",
    "footer.community2": "Game Jolt",
    "footer.community3": "GitHub",
    "footer.discord.aria": "Discord — doplň vlastní odkaz",
    "footer.github.aria": "GitHub — doplň vlastní odkaz",
    "footer.copyright": "Minekube Studios. Demo web.",
    "footer.trademark": "Minecraft je ochranná známka společnosti Mojang Studios.",
    "modal.closeAria": "Zavřít detail",
    "modal.badge": "DEMONSTRAČNÍ OBSAH",
    "modal.note": "Tento text uprav podle skutečného projektu.",
    "modal.close": "Zavřít",
    "modal.changelog.title": "Changelog",
    "modal.changelog.text": "Tady může být seznam verzí, datum vydání, přidané a odebrané mody, změny konfigurace, známé chyby a pokyny pro bezpečný update.",
    "modal.compatibility.title": "Kompatibilita",
    "modal.compatibility.text": "Tady můžeš popsat podporované verze Minecraftu, loadery, doporučené verze Javy, kompatibilitu se shadery, resource packy a známé konflikty.",
    "modal.license.title": "Licence a upozornění",
    "modal.license.text": "Před zveřejněním doplň vlastní licenční podmínky a zkontroluj oprávnění jednotlivých autorů modů k distribuci v modpacku.",
    "toast.system.kicker": "MINEKUBE SYSTEM",
    "toast.theme.kicker": "ROZHRANÍ",
    "toast.theme.light": "Zapnut světlý motiv.",
    "toast.theme.dark": "Zapnut tmavý motiv.",
    "toast.warning.kicker": "UPOZORNĚNÍ",
    "toast.server.soon": "Komunitní server právě připravujeme — brzy.",
    "toast.lang.kicker": "JAZYK",
    "toast.lang.changed": "Stránka je teraz v jazyce {lang}."
  },

  en: {
    "meta.title": "Minekube Studios — About the project",
    "meta.description": "Minekube Studios — an independent Czech-Slovak studio building high-performance Minecraft modpacks, a community server, a Store and open-source projects.",
    "brand.aria": "Minekube Studios — homepage",
    "nav.aria": "Main navigation",
    "nav.mobile.aria": "Mobile navigation",
    "nav.about": "About the project",
    "nav.modpacks": "Modpacks",
    "nav.server": "Server",
    "nav.server.aria": "Community server — we are preparing it right now",
    "nav.store": "Store",
    "theme.aria": "Toggle theme",
    "lang.aria": "Switch page language",
    "lang.menu.title": "Page language",
    "menu.aria": "Open menu",
    "cta.modpacks.kicker": "ENTER THE CATALOG",
    "cta.modpacks.title": "Browse modpacks",
    "cta.github.kicker": "SOURCE CODE",
    "cta.github.title": "Minekube on GitHub",
    "cta.github.aria": "Minekube Studios source code on GitHub",
    "kofi.label": "Support the project",
    "kofi.aria": "Support Minekube Studios on Ko-fi",
    "intro.title1": "The future of Minecraft.",
    "intro.title2": "Open to absolutely everyone.",
    "intro.lead": "Minekube Studios is an independent Czech-Slovak studio that builds <strong>high-performance modpacks</strong>, a community Minecraft server, a Store and modern open-source projects into a single ecosystem. We shape new ways of playing together with the community — no paywall, completely free.",
    "intro.stat1": "performance profiles",
    "intro.stat2": "free for the community",
    "intro.stat3": "modern development",
    "panel.modpacks": "5 performance profiles",
    "panel.server": "Community server — in development",
    "panel.store": "Free content, no paywall",
    "panel.open": "We build it together",
    "about.title": "Performance without breaking original Minecraft",
    "about.p1": "The point of the project is to keep the familiar vanilla feeling while removing pointless FPS drops, long load times and micro-stutter. Every mod has to have a clear reason — no filler, no random experiments in a production release.",
    "about.p2": "The result is a Minecraft that plays just like the original — only faster, calmer and gentler on your computer.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Safe updates",
    "about.tag3": "Clean configuration",
    "about.tag4": "Transparent changelog",
    "principles.kicker": "PROJECT PRINCIPLES",
    "principles.title": "The rules the project runs on",
    "principles.lead": "No random experiments — every decision inside the pack has a reason.",
    "step1.title": "Vanilla friendly",
    "step1.text": "The game should feel like Minecraft — just faster, smoother and free of drops and stuttering.",
    "step2.title": "Safe updates",
    "step2.text": "Every release moves forward without losing your world or settings — with a stability check before publishing.",
    "step3.title": "Clean configuration",
    "step3.text": "Sensible defaults from the first launch. No manual fine-tuning and no cheap filler mods.",
    "step4.title": "Transparent changelog",
    "step4.text": "What was added, changed or removed in the pack is visible. The community knows what it downloads.",
    "studio.title": "A studio building an ecosystem around Minecraft",
    "studio.lead": "We are not a corporate dev team. We are an independent Czech-Slovak group of developers and fans who want Minecraft to run better — and want that to be available to everyone.",
    "studio.kicker": "WHO WE ARE",
    "studio.cardTitle": "We build for the community, not for business",
    "studio.cardP1": "Minekube Studios connects high-performance modpack development, a community server, a Store with free content and modern open-source projects. Every pillar strengthens the others — and we keep it all open.",
    "studio.cardP2": "You can follow development directly, take part in the project and hear the news first-hand. Nothing behind a paywall, nothing at the community's expense.",
    "studio.value1": "100% free for the community",
    "studio.value2": "Open development",
    "studio.value3": "CZ/SK community",
    "studio.value4": "Store without a paywall",
    "studio.factsAria": "Studio facts",
    "studio.fact1": "studio home",
    "studio.fact2Value": "FREE",
    "studio.fact2": "price list for the community",
    "studio.fact3": "ecosystem pillars",
    "pillars.kicker": "WHAT THE STUDIO BUILDS",
    "pillars.title": "Four pillars of the ecosystem",
    "pillars.lead": "Every module has its own mission — together they form one whole.",
    "pillar1.title": "Modpacks",
    "pillar1.text": "Five performance profiles from Ultra to PvP — purely optimised Minecraft without losing the vanilla feeling.",
    "pillar1.link": "Browse modpacks",
    "pillar2.status": "IN DEVELOPMENT",
    "pillar2.title": "Community server",
    "pillar2.text": "Our own Minecraft server with community rules, event nights and support from people you know.",
    "pillar2.soon": "Soon",
    "pillar3.title": "Store",
    "pillar3.text": "Free content for the community — no paywall, no pettiness. Everything we release stays open.",
    "pillar3.link": "Open Store",
    "pillar4.status": "BUILD TOGETHER",
    "pillar4.title": "Open source",
    "pillar4.text": "Modern open-source projects you can study, extend and improve together with us.",
    "pillar4.link": "Contribute to the project",
    "cta.kicker": "JOIN THE BUILD",
    "cta.title": "We create the ecosystem together.",
    "cta.lead": "Follow what is coming — and join what we are building for the whole community.",
    "cta.button": "Browse modpacks",
    "footer.about": "An independent Czech-Slovak studio of high-performance Minecraft projects.",
    "footer.col1": "Project",
    "footer.col2": "Information",
    "footer.col3": "Community",
    "footer.info1": "Changelog",
    "footer.info2": "Compatibility",
    "footer.info3": "Licence",
    "footer.community1": "Discord",
    "footer.community2": "Game Jolt",
    "footer.community3": "GitHub",
    "footer.discord.aria": "Discord — add your own link",
    "footer.github.aria": "GitHub — add your own link",
    "footer.copyright": "Minekube Studios. Demo website.",
    "footer.trademark": "Minecraft is a trademark of Mojang Studios.",
    "modal.closeAria": "Close detail",
    "modal.badge": "DEMO CONTENT",
    "modal.note": "Rewrite this text to match your real project.",
    "modal.close": "Close",
    "modal.changelog.title": "Changelog",
    "modal.changelog.text": "This is where a version list could live: release dates, added and removed mods, configuration changes, known issues and instructions for a safe update.",
    "modal.compatibility.title": "Compatibility",
    "modal.compatibility.text": "Here you can describe supported Minecraft versions, loaders, recommended Java versions, compatibility with shaders and resource packs, and known conflicts.",
    "modal.license.title": "Licence and notices",
    "modal.license.text": "Before publishing, add your own licence terms and check that each mod author allows redistribution inside your modpack.",
    "toast.system.kicker": "MINEKUBE SYSTEM",
    "toast.theme.kicker": "INTERFACE",
    "toast.theme.light": "Light theme enabled.",
    "toast.theme.dark": "Dark theme enabled.",
    "toast.warning.kicker": "NOTICE",
    "toast.server.soon": "We are preparing the community server right now — soon.",
    "toast.lang.kicker": "LANGUAGE",
    "toast.lang.changed": "The page is now in {lang}."
  },

  sk: {
    "meta.title": "Minekube Studios — O projekte",
    "meta.description": "Minekube Studios — nezávislý česko-slovenský štúdio výkonných Minecraft modpackov, komunitného servera, Store a open-source projektov.",
    "brand.aria": "Minekube Studios — domovská stránka",
    "nav.aria": "Hlavná navigácia",
    "nav.mobile.aria": "Mobilná navigácia",
    "nav.about": "O projekte",
    "nav.modpacks": "Modpacky",
    "nav.server": "Server",
    "nav.server.aria": "Komunitný server — práve ho pripravujeme",
    "nav.store": "Store",
    "theme.aria": "Prepnúť motív",
    "lang.aria": "Prepnúť jazyk stránky",
    "lang.menu.title": "Jazyk stránky",
    "menu.aria": "Otvoriť menu",
    "cta.modpacks.kicker": "VSTÚPIŤ DO KATALÓGU",
    "cta.modpacks.title": "Prechádzať modpacky",
    "cta.github.kicker": "ZDROJOVÝ KÓD",
    "cta.github.title": "Minekube na Githube",
    "cta.github.aria": "Zdrojové kódy Minekube Studios na GitHube",
    "kofi.label": "Podporiť projekt",
    "kofi.aria": "Podporiť Minekube Studios na Ko-fi",
    "intro.title1": "Minecraft budúcnosti.",
    "intro.title2": "Otvorený úplne všetkým.",
    "intro.lead": "Minekube Studios je nezávislé česko-slovenské štúdio, ktoré stavia <strong>výkonné modpacky</strong>, komunitný Minecraft server, Store a moderné open-source projekty do jedného ekosystému. Nové technológie hrania tvoríme spoločne s komunitou — bez paywallu a úplne zadarmo.",
    "intro.stat1": "výkonnostných profilov",
    "intro.stat2": "zdarma pre komunitu",
    "intro.stat3": "moderný vývoj",
    "panel.modpacks": "5 výkonnostných profilov",
    "panel.server": "Komunitný server — vo vývoji",
    "panel.store": "Obsah zadarmo, bez paywallu",
    "panel.open": "Staviame spolu",
    "about.title": "Výkon bez zničenia pôvodného Minecraftu",
    "about.p1": "Zmyslom projektu je zachovať známy vanilla pocit, ale odstrániť zbytočné propady FPS, dlhé načítanie a mikrosekanie. Každý mod musí mať jasný dôvod, žiadna výplň a žiadne náhodné experimenty v produkčnom vydaní.",
    "about.p2": "Výsledkom je Minecraft, ktorý sa hrá rovnako ako ten pôvodný — len je rýchlejší, kľudnejší a šetrnejší k tvojmu počítaču.",
    "about.tag1": "Vanilla friendly",
    "about.tag2": "Bezpečné aktualizácie",
    "about.tag3": "Čistá konfigurácia",
    "about.tag4": "Transparentný changelog",
    "principles.kicker": "PRINCÍPY PROJEKTU",
    "principles.title": "Pravidlá, podľa ktorých projekt chodí",
    "principles.lead": "Žiadne náhodné experimenty — každé rozhodnutie v balíčku má jasný dôvod.",
    "step1.title": "Vanilla friendly",
    "step1.text": "Hra sa má cítiť ako Minecraft — len rýchlejšia, hladšia a bez propadov a sekania.",
    "step2.title": "Bezpečné aktualizácie",
    "step2.text": "Každý release ide dopredu bez straty sveta i nastavenia — s kontrolou stability pred vydaním.",
    "step3.title": "Čistá konfigurácia",
    "step3.text": "Zmysluplné východzie nastavenie od prvého spustenia. Žiadne ručné doladenie a lacné mody na výplň.",
    "step4.title": "Transparentný changelog",
    "step4.text": "Čo sa do balíčka pridalo, zmenilo alebo odoberalo — je vidno. Komunita vie, čo sťahuje.",
    "studio.title": "Štúdio, ktoré stavia ekosystém okolo Minecraftu",
    "studio.lead": "Nie sme firemný vývojár. Jsme nezávislá česko-slovenská skupina vývojárov a fanúšikov, ktorí chcú, aby Minecraft behal lepšie — a aby to bolo dostupné každému.",
    "studio.kicker": "KTO SME",
    "studio.cardTitle": "Stavíme pre komunitu, nie pre biznis",
    "studio.cardP1": "Minekube Studios spája vývoj výkonných modpackov, komunitný server, Store s obsahom zadarmo a moderné open-source projekty. Každý pilier posilňuje ostatné — a všetko držíme otvorené.",
    "studio.cardP2": "Vývoj sleduješ priamo, k projektu sa môžeš pridať a o novinkách sa dozvieš z prvej ruky. Nič za paywallom, nič na úkor komunity.",
    "studio.value1": "100 % zadarmo pre komunitu",
    "studio.value2": "Open development",
    "studio.value3": "CZ/SK komunita",
    "studio.value4": "Store bez paywallu",
    "studio.factsAria": "Fakty o štúdiu",
    "studio.fact1": "domov štúdia",
    "studio.fact2Value": "0 €",
    "studio.fact2": "cenník pre komunitu",
    "studio.fact3": "piliera ekosystému",
    "pillars.kicker": "ČO ŠTÚDIO STAVIA",
    "pillars.title": "Štyri piliere ekosystému",
    "pillars.lead": "Každý modul má vlastnú misiu — spolu tvoria jedno celé.",
    "pillar1.title": "Modpacky",
    "pillar1.text": "Päť výkonnostných profilov od Ultra po PvP — čisto optimalizovaný Minecraft bez straty vanilla pocitu.",
    "pillar1.link": "Prechádzať modpacky",
    "pillar2.status": "VO VÝVOJI",
    "pillar2.title": "Komunitný server",
    "pillar2.text": "Vlastný Minecraft server s komunitnými pravidlami, eventovými akciami a podporou od ľudí, ktorých poznáš.",
    "pillar2.soon": "Čoskoro",
    "pillar3.title": "Store",
    "pillar3.text": "Obsah zadarmo pre komunitu — bez paywallu a bez malicherností. Všetko, čo vyjde, je otvorené.",
    "pillar3.link": "Otvoriť Store",
    "pillar4.status": "STAVIAME SPOLOČNE",
    "pillar4.title": "Open source",
    "pillar4.text": "Moderné open-source projekty, ktoré môžeš študovať, rozširovať a zlepšovať spoločne s nami.",
    "pillar4.link": "Zapojiť sa do projektu",
    "cta.kicker": "SPOLOČNĚ STAVIAME",
    "cta.title": "Ekosystém tvoríme spoločne.",
    "cta.lead": "Sleduj, čo sa chystá — a pridaj sa k tomu, čo staviame pre celú komunitu.",
    "cta.button": "Prechádzať modpacky",
    "footer.about": "Nezávislé česko-slovenské štúdio výkonných Minecraft projektov.",
    "footer.col1": "Projekt",
    "footer.col2": "Informácie",
    "footer.col3": "Komunita",
    "footer.info1": "Changelog",
    "footer.info2": "Kompatibilita",
    "footer.info3": "Licencia",
    "footer.community1": "Discord",
    "footer.community2": "Game Jolt",
    "footer.community3": "GitHub",
    "footer.discord.aria": "Discord — doplň vlastný odkaz",
    "footer.github.aria": "GitHub — doplň vlastný odkaz",
    "footer.copyright": "Minekube Studios. Demo web.",
    "footer.trademark": "Minecraft je ochranná známka spoločnosti Mojang Studios.",
    "modal.closeAria": "Zavrieť detail",
    "modal.badge": "DEMONŠTRAČNÝ OBSAH",
    "modal.note": "Tento text uprav podľa skutočného projektu.",
    "modal.close": "Zavrieť",
    "modal.changelog.title": "Changelog",
    "modal.changelog.text": "Tu môže byť zoznam verzií, dátum vydania, pridané a odobrané mody, zmeny konfigurácie, známe chyby a pokyny na bezpečný update.",
    "modal.compatibility.title": "Kompatibilita",
    "modal.compatibility.text": "Tu môžeš opísať podporované verzie Minecraftu, loadery, odporúčané verzie Javy, kompatibilitu so shadery, resource packy a známe konflikty.",
    "modal.license.title": "Licencia a upozornenia",
    "modal.license.text": "Pred zverejnením doplň vlastné licenčné podmienky a skontroluj oprávnenia jednotlivých autorov modov na distribúciu v modpacku.",
    "toast.system.kicker": "MINEKUBE SYSTEM",
    "toast.theme.kicker": "ROZHRANIE",
    "toast.theme.light": "Zapnutý svetlý motív.",
    "toast.theme.dark": "Zapnutý tmavý motív.",
    "toast.warning.kicker": "UPOZORNENIE",
    "toast.server.soon": "Komunitný server práve pripravujeme — čoskoro.",
    "toast.lang.kicker": "JAZYK",
    "toast.lang.changed": "Stránka je teraz v jazyku {lang}."
  }
};

const FALLBACK_LANG = "cs";
const THEME_KEY = "minekube-theme";
const LANG_KEY = "minekube-lang";
// Priorita: ?lang=en|cs|sk → uložená volba → jazyk prohlížeče → čeština.
const urlLang = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
const browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
let currentLang = urlLang || safeStorage.get(LANG_KEY) || browserLang || FALLBACK_LANG;
if (!I18N[currentLang]) currentLang = FALLBACK_LANG;

const t = key => I18N[currentLang]?.[key] ?? I18N[FALLBACK_LANG][key] ?? key;

function applyLanguage(lang, { notify = false } = {}) {
  currentLang = I18N[lang] ? lang : FALLBACK_LANG;
  safeStorage.set(LANG_KEY, currentLang);

  const meta = LANGUAGES[currentLang];
  document.documentElement.lang = meta.html;
  document.documentElement.dataset.lang = currentLang;
  document.title = t("meta.title");

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t("meta.description"));

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    // Texty obsahujú značku <strong>/<em> — povolené je iba zvýraznenie.
    element.innerHTML = /<\s*(strong|em)\s*>/.test(value) ? value : escapeHtml(value);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach(element => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });

  document.querySelectorAll("[data-i18n-title]").forEach(element => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  const langCode = document.getElementById("langCode");
  if (langCode) langCode.textContent = meta.code;

  document.querySelectorAll("#langMenu [data-lang]").forEach(button => {
    const active = button.dataset.lang === currentLang;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", String(active));
  });

  renderLabelLetters();

  if (notify) {
    showToast(t("toast.lang.changed").replace("{lang}", meta.name), "language");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ===================== ODKAZY NA JEDNOM MÍSTĚ =====================
   Tlačítka v HTML odkazují na tyto cíle — stačí změnit jen tady. */

const SITE_LINKS = {
  kofi: "https://ko-fi.com/minekubestudios",
  github: "https://github.com/minekubestudios",
  store: "https://minekubestudios.github.io/store/"
};

function applySiteLinks() {
  document.querySelectorAll("[data-site-link]").forEach(element => {
    const href = SITE_LINKS[element.dataset.siteLink];
    if (href) {
      element.href = href;
      if (element.target === "_blank") {
        element.rel = "noopener noreferrer";
      }
    }
  });
}

/* Rozloží popisek na jednotlivá písmena, aby se mohla vlnit po sobě
   (layout tlačítka zůstává identický — každé písmeno jen dostane svůj --i index). */
function renderLabelLetters() {
  document.querySelectorAll("[data-letters]").forEach(element => {
    const text = element.textContent.trim();
    element.textContent = "";

    [...text].forEach((char, index) => {
      const letter = document.createElement("span");
      letter.style.setProperty("--i", index);
      if (char === " ") {
        letter.classList.add("is-space");
        letter.textContent = "\u00A0";
      } else {
        letter.textContent = char;
      }
      element.appendChild(letter);
    });
  });
}

/* ===================== TOAST ===================== */

const toast = document.getElementById("toast");
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
    warning: { className: "is-warning", kicker: t("toast.warning.kicker") },
    theme: { className: "is-theme", kicker: t("toast.theme.kicker") },
    language: { className: "is-theme", kicker: t("toast.lang.kicker") }
  }[type];

  if (toastConfig) {
    toast.classList.add(toastConfig.className);
    if (toastKicker) toastKicker.textContent = toastConfig.kicker;
  } else {
    toast.classList.add("is-system");
    if (toastKicker) toastKicker.textContent = t("toast.system.kicker");
  }

  // Reštartuje vstupnú animáciu toastu pri každom novom oznámení.
  void toast.offsetWidth;
  toast.classList.add("show");

  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

/* ===================== MODAL (informačné okná pätičky) ===================== */

const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
let modalCloseTimer = null;
let lastModalTrigger = null;
let openModalType = null;

function openInfoModal(type) {
  const content = {
    changelog: { title: t("modal.changelog.title"), text: t("modal.changelog.text") },
    compatibility: { title: t("modal.compatibility.title"), text: t("modal.compatibility.text") },
    license: { title: t("modal.license.title"), text: t("modal.license.text") }
  }[type];

  if (!content) return;
  openModalType = type;

  modalContent.innerHTML = `
    <div class="modal-hero" style="--cover-bg:linear-gradient(135deg,#210623,#7c1194,#ff8500,#ffd84f)">
      <div><h2 id="modalTitle">${content.title}</h2></div>
    </div>
    <div class="modal-body">
      <p>${content.text}</p>
      <div class="modal-download">
        <div>
          <span>${t("modal.badge")}</span>
          <strong>${t("modal.note")}</strong>
        </div>
        <button class="button button-secondary" type="button" data-close-modal>${t("modal.close")}</button>
      </div>
    </div>
  `;
  showModal();
}

function showModal() {
  window.clearTimeout(modalCloseTimer);
  modalCloseTimer = null;
  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  modalBackdrop.classList.remove("is-closing", "is-visible");
  modalClose.classList.remove("is-closing-trigger");
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");

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
    openModalType = null;

    if (lastModalTrigger?.isConnected) {
      lastModalTrigger.focus({ preventScroll: true });
    }
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  modalCloseTimer = window.setTimeout(finishClosing, reducedMotion ? 20 : 430);
}

modalClose.addEventListener("click", () => closeModal({ animateCloseButton: true }));
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});
modalContent.addEventListener("click", event => {
  if (event.target.closest("[data-close-modal]")) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!modalBackdrop.hidden) closeModal();
    closeLangMenu();
  }
});
document.querySelectorAll("[data-dialog]").forEach(button => {
  button.addEventListener("click", () => openInfoModal(button.dataset.dialog));
});

/* ===================== MOBILNÉ MENU ===================== */

const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");

menuButton.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuButton.classList.toggle("active", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
});

mobileNav.querySelectorAll("a, button").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

/* ===================== MOTÍV (TMAVÝ / SVETLÝ) ===================== */

const themeToggle = document.getElementById("themeToggle");
const savedTheme = safeStorage.get(THEME_KEY);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = current;
  safeStorage.set(THEME_KEY, current);
  showToast(current === "light" ? t("toast.theme.light") : t("toast.theme.dark"), "theme");
});

/* ===================== PREPÍNAČ JAZYKA ===================== */

const langSwitcher = document.getElementById("langSwitcher");
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");

function openLangMenu() {
  langMenu.hidden = false;
  langSwitcher.classList.add("is-open");
  langToggle.setAttribute("aria-expanded", "true");
  langMenu.querySelector("[data-lang]")?.focus({ preventScroll: true });
}

function closeLangMenu() {
  if (langMenu.hidden) return;
  langMenu.hidden = true;
  langSwitcher.classList.remove("is-open");
  langToggle.setAttribute("aria-expanded", "false");
}

langToggle.addEventListener("click", event => {
  event.stopPropagation();
  if (langMenu.hidden) openLangMenu();
  else closeLangMenu();
});

langMenu.querySelectorAll("[data-lang]").forEach(button => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang;
    applyLanguage(lang, { notify: lang !== currentLang });
    closeLangMenu();
    langToggle.focus({ preventScroll: true });
  });
});

document.addEventListener("click", event => {
  if (langMenu.hidden) return;
  if (!langSwitcher.contains(event.target)) closeLangMenu();
});

langMenu.addEventListener("keydown", event => {
  const items = [...langMenu.querySelectorAll("[data-lang]")];
  const index = items.indexOf(document.activeElement);
  if (index === -1) return;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(index + step + items.length) % items.length].focus();
  }
});

/* ===================== SCROLL — progress, hlavička, reveal ===================== */

const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scrollProgress span");
let scrollFramePending = false;

function syncScrollExperience() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

  siteHeader?.classList.toggle("scrolled", window.scrollY > 16);
  scrollProgress?.style.setProperty("--scroll-progress", progress.toFixed(4));

  scrollFramePending = false;
}

window.addEventListener("scroll", () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(syncScrollExperience);
}, { passive: true });

window.addEventListener("resize", syncScrollExperience, { passive: true });

let revealObserver = null;

function registerRevealElements(elements, baseDelay = 65) {
  const list = [...elements].filter(element => !element.classList.contains("scroll-reveal"));
  if (!list.length) return;

  list.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 6) * baseDelay}ms`);

    if (element.matches(".about-copy, .studio-copy")) {
      element.style.setProperty("--reveal-x", "-28px");
      element.style.setProperty("--reveal-y", "0px");
    } else if (element.matches(".about-emblem, .studio-emblem")) {
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
    [document.querySelectorAll(".mk-intro"), 0],
    [document.querySelectorAll(".section-heading"), 0],
    [document.querySelectorAll(".about-copy, .about-emblem"), 110],
    [document.querySelectorAll(".steps-grid .step-card"), 105],
    [document.querySelectorAll(".studio-copy, .studio-emblem"), 110],
    [document.querySelectorAll(".studio-pillars .studio-pillar"), 90],
    [document.querySelectorAll(".cta-card"), 0],
    [document.querySelectorAll(".footer-grid > *"), 70]
  ];

  revealGroups.forEach(([elements, delay]) => registerRevealElements(elements, delay));

  // Odkazy na kotvy — obyčajný plynulý scroll, žiadny celoobrazovkový portál.
  const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]')];
  const observedSections = [...new Set(sectionLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean))];

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  if (observedSections.length && "IntersectionObserver" in window) {
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

/* ===================== POVRCHOVÉ INTERAKCIE — 3D tilt kariet ===================== */

function initializeSurfaceInteractions() {
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

  document.querySelectorAll(".step-card, .studio-pillar, .mk-intro-module").forEach(card => {
    card.addEventListener("pointermove", event => applyTilt(card, event, 4));
    card.addEventListener("pointerleave", () => resetTilt(card));
  });

  document.querySelectorAll(".about-card, .studio-card").forEach(card => {
    card.addEventListener("pointermove", event => applyTilt(card, event, 2.5));
    card.addEventListener("pointerleave", () => resetTilt(card));
  });
}

/* ===================== PODPORNÉ TLAČIDLO — galaxia a častice =====================
   Design originálu Minekube Store tlačidla sme ponechali (galaxia, RGB linka,
   blesky, oběžné dráhy, scan, rohy, částice z JS) — jen míří na Ko-fi.
   Žiadny celoobrazovkový portál: odkaz otevírá cíl normálně. */

function initializeSupportButtonFx() {
  const storeButton = document.querySelector(".store-button");
  if (!storeButton || prefersReducedMotion.matches) return;

  const fxLayer = storeButton.querySelector(".store-button-fx");
  if (!fxLayer || !window.matchMedia("(pointer: fine)").matches) return;

  const fxPalette = ["#69f7ff", "#8f6cff", "#ff58df", "#ffd36e", "#78adff"];
  const fxIcons = ["✦", "♥", "◇", "⬡", "+", "✧"];
  let fxTimer = 0;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const spawnStoreFx = amount => {
    if (!storeButton.matches(":hover")) return;

    for (let index = 0; index < amount; index += 1) {
      const roll = Math.random();
      const node = document.createElement("i");
      const angle = randomBetween(0, Math.PI * 2);
      const x = Math.cos(angle) * randomBetween(64, 138);
      const y = Math.sin(angle) * randomBetween(46, 104);
      const color = fxPalette[Math.floor(Math.random() * fxPalette.length)];

      if (roll < .19) {
        node.className = "store-fx-bolt";
      } else if (roll < .44) {
        node.className = "store-fx-icon";
        node.textContent = fxIcons[Math.floor(Math.random() * fxIcons.length)];
      } else {
        node.className = "store-fx-particle";
      }

      node.style.setProperty("--fx-x", `${x.toFixed(1)}px`);
      node.style.setProperty("--fx-y", `${y.toFixed(1)}px`);
      node.style.setProperty("--fx-size", `${randomBetween(3, roll < .44 ? 15 : 7.5).toFixed(1)}px`);
      node.style.setProperty("--fx-duration", `${Math.round(randomBetween(720, 1260))}ms`);
      node.style.setProperty("--fx-delay", `${Math.round(randomBetween(0, 100))}ms`);
      node.style.setProperty("--fx-rotation", `${Math.round(randomBetween(-180, 180))}deg`);
      node.style.setProperty("--fx-scale", randomBetween(.38, 1.08).toFixed(2));
      node.style.setProperty("--fx-color", color);
      fxLayer.appendChild(node);
      node.addEventListener("animationend", () => node.remove(), { once: true });
    }
  };

  storeButton.addEventListener("pointermove", event => {
    const rect = storeButton.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    storeButton.style.setProperty("--store-x", `${x * 100}%`);
    storeButton.style.setProperty("--store-y", `${y * 100}%`);
  });

  storeButton.addEventListener("pointerenter", () => {
    spawnStoreFx(28);
    window.clearInterval(fxTimer);
    fxTimer = window.setInterval(() => spawnStoreFx(9), 210);
  });

  storeButton.addEventListener("pointerleave", () => {
    window.clearInterval(fxTimer);
    storeButton.style.setProperty("--store-x", "50%");
    storeButton.style.setProperty("--store-y", "50%");
  });
}

/* ===================== PRIMÁRNÍ CTA — světelný bod sleduje kurzor ===================== */

function initializePrimaryCta() {
  const primary = document.querySelector(".mk-cta-primary");
  if (!primary || !window.matchMedia("(pointer: fine)").matches || prefersReducedMotion.matches) return;

  primary.addEventListener("pointermove", event => {
    const rect = primary.getBoundingClientRect();
    primary.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    primary.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });

  primary.addEventListener("pointerleave", () => {
    primary.style.setProperty("--mx", "50%");
    primary.style.setProperty("--my", "50%");
  });
}

/* ===================== SERVER — iba tlačidlo (stránka ještě nevznikla) ===================== */

document.querySelectorAll("[data-soon]").forEach(button => {
  button.addEventListener("click", () => {
    showToast(t("toast.server.soon"), "warning", 3200);
  });
});

/* ===================== INICIALIZÁCIA ===================== */

document.getElementById("currentYear").textContent = new Date().getFullYear();

applySiteLinks();
applyLanguage(currentLang);
initializeSurfaceInteractions();
initializeScrollExperience();
initializeSupportButtonFx();
initializePrimaryCta();
