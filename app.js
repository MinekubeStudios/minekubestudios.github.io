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
    "kofi.gate.title": "Otevírám ko-fi.com",
    "kofi.gate.status": "Připojuji k podpoře komunity",
    "kofi.gate.cancel": "Zrušit",
    "transition.label": "Načítám stránku",
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
    "about.kicker": "NEZÁVISLÝ ČESKÝ PROJEKT",
    "about.title": "Minecraft, který patří hráčům — <em>svobodně a navždy zdarma.</em>",
    "about.p1": "Minekube je nezávislý český projekt postavený na Minecraftu jako otevřený základ pro hraní i tvorbu. Žádné licence, žádné předplatné, žádné DRM ani skryté sledování — projekt společně vlastníme, vyvíjíme a posouváme dál komunita hráčů a tvůrců.",
    "about.tag1": "Plně open-source",
    "about.tag2": "Hra bez DRM",
    "about.tag3": "Bez telemetrie a sledování",
    "about.tag4": "Vlastněno komunitou",
    "about.more": "Celé informace",
    "about.less": "Skrýt informace",
    "about.more.aria": "Zobrazit celé informace a cíl projektu",
    "about.emblemTop": "OPEN SOURCE",
    "about.emblemBottom": "NAVŽDY ZDARMA",
    "about.manifestKicker": "POSLÁNÍ PROJEKTU",
    "about.manifestTitle": "Celý cíl projektu v kostce",
    "about.mp1": "Cílem Minekube je otevřený herní ekosystém kolem Minecraftu, který hráčům i vývojářům dává maximální svobodu a podporu. Za projektem nestojí žádná firma ani investor — tvoří ho nezávisle komunita sama pro sebe, a proto si nikdy nepůjde proti hráčům.",
    "about.mp2": "Do hry ti nikdo nemluví: žádná DRM omezení, žádné nucené účty, žádná telemetrie ani sledování. Soukromí je u nás výchozí stav, ne marketingový slogan. Vše, co vytváříme, je plně otevřené — kód můžeš studovat, upravovat i dál šířit.",
    "about.promise1.title": "Nezávislost a svoboda",
    "about.promise1.text": "Žádné licence, žádné předplatné ani skryté poplatky. Hraješ a tvoříš bez omezení.",
    "about.promise2.title": "Maximum soukromí",
    "about.promise2.text": "Žádné sledování, žádná telemetrie, žádný prodej dat. Tvoje hra zůstává tvoje.",
    "about.promise3.title": "Hra bez DRM",
    "about.promise3.text": "Svobodné hraní i spouštění bez aktivačních zámků a nuceného online ověřování.",
    "about.promise4.title": "Otevřený ekosystém",
    "about.promise4.text": "Plně open-source — kód, nástroje i obsah může kdokoliv studovat, vylepšovat a rozšiřovat.",
    "about.promise5.title": "Vlastněno komunitou",
    "about.promise5.text": "Projekt vlastníme a vyvíjíme společně. Hráči i vývojáři spolurozhodují o jeho směřování.",
    "about.promise6.title": "Přátelská komunita",
    "about.promise6.text": "Otevřená CZ/SK parta hráčů a tvůrců, kde každý najde podporu i místo k vlastní tvorbě.",
    "about.noteLead": "Celý ekosystém Minekube funguje čistě na bázi Donate —",
    "about.noteText": "na dobrovolných finančních darech komunity, které pohánějí růst a budoucí vývoj. Nikdy tu nebude paywall, prémiové zámky ani předplatné. Minekube zůstává navždy pro všechny ZDARMA a plně OPEN-SOURCE.",
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
    "toast.lang.changed": "Stránka je teraz v jazyce {lang}.",
    "toast.download.kicker": "STAHOVÁNÍ",
    "toast.success.kicker": "HOTOVO",
    "toast.favorite.kicker": "OBLÍBENÉ"
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
    "kofi.gate.title": "Opening ko-fi.com",
    "kofi.gate.status": "Connecting to community support",
    "kofi.gate.cancel": "Cancel",
    "transition.label": "Loading page",
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
    "about.kicker": "INDEPENDENT CZECH PROJECT",
    "about.title": "Minecraft owned by its players — <em>free and open forever.</em>",
    "about.p1": "Minekube is an independent Czech project built on Minecraft as an open foundation for playing and creating. No licenses, no subscriptions, no DRM and no hidden tracking — the project is owned, built and pushed forward together by a community of players and creators.",
    "about.tag1": "Fully open-source",
    "about.tag2": "DRM-free gameplay",
    "about.tag3": "No telemetry, no tracking",
    "about.tag4": "Community owned",
    "about.more": "Full information",
    "about.less": "Hide information",
    "about.more.aria": "Show the full information and project mission",
    "about.emblemTop": "OPEN SOURCE",
    "about.emblemBottom": "FREE FOREVER",
    "about.manifestKicker": "OUR MISSION",
    "about.manifestTitle": "The whole project goal at a glance",
    "about.mp1": "Minekube's goal is an open gaming ecosystem around Minecraft that gives players and developers maximum freedom and support. No company or investor stands behind it — the community independently builds it for itself, which is why it will never turn against its players.",
    "about.mp2": "Nobody controls how you play: no DRM restrictions, no forced accounts, no telemetry or tracking. Privacy is the default here, not a marketing slogan. Everything we make is fully open — you can study, modify and redistribute the code.",
    "about.promise1.title": "Independence & freedom",
    "about.promise1.text": "No licenses, no subscriptions and no hidden fees. Play and create without limits.",
    "about.promise2.title": "Privacy first",
    "about.promise2.text": "No tracking, no telemetry, no selling your data. Your game stays yours.",
    "about.promise3.title": "DRM-free gameplay",
    "about.promise3.text": "Play and launch freely, without activation locks or forced online verification.",
    "about.promise4.title": "Open ecosystem",
    "about.promise4.text": "Fully open-source — anyone can study, improve and extend the code, tools and content.",
    "about.promise5.title": "Community owned",
    "about.promise5.text": "We all own and build the project together. Players and developers co-decide where it goes.",
    "about.promise6.title": "Friendly community",
    "about.promise6.text": "An open CZ/SK crowd of players and creators where everyone finds support and room to create.",
    "about.noteLead": "The entire Minekube ecosystem runs purely on Donate —",
    "about.noteText": "voluntary financial contributions from the community that power growth and future development. There will never be a paywall, premium locks or subscriptions. Minekube stays FREE for everyone, forever — and fully OPEN-SOURCE.",
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
    "toast.lang.changed": "The page is now in {lang}.",
    "toast.download.kicker": "DOWNLOAD",
    "toast.success.kicker": "DONE",
    "toast.favorite.kicker": "FAVOURITES"
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
    "kofi.gate.title": "Otváram ko-fi.com",
    "kofi.gate.status": "Pripojujem k podpore komunity",
    "kofi.gate.cancel": "Zrušiť",
    "transition.label": "Načítavam stránku",
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
    "about.kicker": "NEZÁVISLÝ ČESKÝ PROJEKT",
    "about.title": "Minecraft, ktorý patrí hráčom — <em>slobodne a navždy zadarmo.</em>",
    "about.p1": "Minekube je nezávislý český projekt postavený na Minecrafte ako otvorený základ pre hranie aj tvorbu. Žiadne licencie, žiadne predplatné, žiadne DRM ani skryté sledovanie — projekt spoločne vlastníme, vyvíjame a posúvame vpred komunita hráčov a tvorcov.",
    "about.tag1": "Plne open-source",
    "about.tag2": "Hra bez DRM",
    "about.tag3": "Bez telemetrie a sledovania",
    "about.tag4": "Vlastnený komunitou",
    "about.more": "Celé informácie",
    "about.less": "Skryť informácie",
    "about.more.aria": "Zobraziť celé informácie a cieľ projektu",
    "about.emblemTop": "OPEN SOURCE",
    "about.emblemBottom": "NAVŽDY ZADARMO",
    "about.manifestKicker": "POSLANIE PROJEKTU",
    "about.manifestTitle": "Celý cieľ projektu v kocke",
    "about.mp1": "Cieľom Minekube je otvorený herný ekosystém okolo Minecraftu, ktorý hráčom aj vývojárom dáva maximálnu slobodu a podporu. Za projektom nestojí žiadna firma ani investor — tvorí ho nezávisle komunita sama pre seba, a preto si nikdy nepôjde proti hráčom.",
    "about.mp2": "Do hry ti nikto nehovorí: žiadne DRM obmedzenia, žiadne nútené účty, žiadna telemetria ani sledovanie. Súkromie je u nás východiskový stav, nie marketingový slogan. Všetko, čo vytvárame, je plne otvorené — kód môžeš študovať, upravovať aj ďalej šíriť.",
    "about.promise1.title": "Nezávislosť a sloboda",
    "about.promise1.text": "Žiadne licencie, žiadne predplatné ani skryté poplatky. Hráš a tvoríš bez obmedzení.",
    "about.promise2.title": "Maximum súkromia",
    "about.promise2.text": "Žiadne sledovanie, žiadna telemetria, žiadny predaj dát. Tvoja hra zostáva tvoja.",
    "about.promise3.title": "Hra bez DRM",
    "about.promise3.text": "Slobodné hranie aj spúšťanie bez aktivačných zámkov a núteného online overovania.",
    "about.promise4.title": "Otvorený ekosystém",
    "about.promise4.text": "Plne open-source — kód, nástroje aj obsah môže ktokoľvek študovať, vylepšovať a rozširovať.",
    "about.promise5.title": "Vlastnený komunitou",
    "about.promise5.text": "Projekt vlastníme a vyvíjame spoločne. Hráči aj vývojári spolurozhodujú o jeho smerovaní.",
    "about.promise6.title": "Priateľská komunita",
    "about.promise6.text": "Otvorená CZ/SK parta hráčov a tvorcov, kde každý nájde podporu aj miesto na vlastnú tvorbu.",
    "about.noteLead": "Celý ekosystém Minekube funguje čisto na báze Donate —",
    "about.noteText": "na dobrovoľných finančných daroch komunity, ktoré poháňajú rast a budúci vývoj. Nikdy tu nebude paywall, prémiové zámky ani predplatné. Minekube zostáva navždy pre všetkých ZDARMA a plne OPEN-SOURCE.",
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
    "toast.lang.changed": "Stránka je teraz v jazyku {lang}.",
    "toast.download.kicker": "SŤAHOVANIE",
    "toast.success.kicker": "HOTOVO",
    "toast.favorite.kicker": "OBĽÚBENÉ"
  }
};

/* ===================== PŘEKLADY PRO DALŠÍ STRÁNKY =====================
   Podstránka (např. modpacky/) si před načtením app.js nastaví
   window.MINEKUBE_PAGE_I18N = { cs: { … }, en: { … }, sk: { … } }.
   Klíče se přidají do slovníku níže, takže celý web sdílí jednu app.js,
   jeden přepínač jazyka i stejné klíče v localStorage. */
if (window.MINEKUBE_PAGE_I18N) {
  Object.entries(window.MINEKUBE_PAGE_I18N).forEach(([lang, dictionary]) => {
    if (I18N[lang] && dictionary) Object.assign(I18N[lang], dictionary);
  });
}

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

  // Podstránky (katalog modpacků) si poslechnou tuhle událost a překreslí
  // dynamický obsah — jinak by zůstal v jazyce, ve kterém se vykreslil.
  document.dispatchEvent(new CustomEvent("minekube:language", { detail: { lang: currentLang } }));

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
    language: { className: "is-theme", kicker: t("toast.lang.kicker") },
    // Používá katalog modpacků (podstránka modpacky/).
    download: { className: "is-download-start", kicker: t("toast.download.kicker") },
    success: { className: "is-download-success", kicker: t("toast.success.kicker") },
    favorite: { className: "is-favorite", kicker: t("toast.favorite.kicker") }
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
    cancelKofiGate();
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
  /* Ko-fi svět: srdíčka, kafíčka, blesky a Minecraft kostky. Každý druh má
     vlastní paletu i glyfy, takže jiskry nepůsobí jako náhodné emoji. */
  const fxShapes = {
    heart: ["\u2665", "\u2665", "\u2661"],
    cup: ["\u2615\uFE0E", "\u2615\uFE0E", "\u2668\uFE0E"],
    bolt: ["\u03DF", "\u21AF", "\u21AF"],
    cube: ["\u25A3", "\u25C8", "\u2B22", "\u2726"]
  };
  const fxColors = {
    heart: ["#ff5f5b", "#ff7a76", "#ff9ab0"],
    cup: ["#ffcf9c", "#ffb072", "#ff9a52"],
    bolt: ["#d7fbff", "#69f7ff", "#9fe9ff"],
    cube: ["#b998ff", "#8f6cff", "#ffd36e"]
  };
  const fxKinds = ["heart", "heart", "cup", "cup", "bolt", "cube", "cube"];
  let fxTimer = 0;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const spawnStoreFx = amount => {
    if (!storeButton.matches(":hover")) return;

    for (let index = 0; index < amount; index += 1) {
      const roll = Math.random();
      const node = document.createElement("i");
      const angle = randomBetween(0, Math.PI * 2);
      const spread = spawnStoreFx.burst ? 1.18 : 1;
      const x = Math.cos(angle) * randomBetween(64, 138) * spread;
      const y = Math.sin(angle) * randomBetween(46, 104) * spread;
      const kind = roll < .52 ? fxKinds[Math.floor(Math.random() * fxKinds.length)] : null;
      const palette = kind ? fxColors[kind] : fxPalette;
      const color = palette[Math.floor(Math.random() * palette.length)];
      let iconSize = 7.5;

      if (roll >= .52 && roll < .68) {
        node.className = "store-fx-bolt";
      } else if (kind) {
        const shapes = fxShapes[kind];
        node.className = `store-fx-icon is-${kind}`;
        node.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        iconSize = kind === "cup" ? randomBetween(12, 17) : kind === "cube" ? randomBetween(10, 15) : randomBetween(8, 15);
      } else {
        node.className = "store-fx-particle";
      }

      node.style.setProperty("--fx-x", `${x.toFixed(1)}px`);
      node.style.setProperty("--fx-y", `${y.toFixed(1)}px`);
      node.style.setProperty("--fx-size", kind ? `${iconSize.toFixed(1)}px` : `${randomBetween(3, 7.5).toFixed(1)}px`);
      node.style.setProperty("--fx-duration", `${Math.round(randomBetween(820, 1480))}ms`);
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
    spawnStoreFx.burst = true;
    spawnStoreFx(34);
    window.setTimeout(() => { spawnStoreFx.burst = false; }, 90);
    window.clearInterval(fxTimer);
    fxTimer = window.setInterval(() => spawnStoreFx(12), 190);
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

/* ===================== KO-FI GATE — celostránkový přechod =====================
   Kliknutí na „Podpořit projekt“ nezavede na Ko-fi hned. Nejdřív se stránka
   plynule otevře do Minekube portálu (panely, mřížka, paprsek, jiskry,
   konzole s progresem) v barvách Ko-fi a přesměrování startuje v momentě,
   kdy portál drží celou obrazovku. Při prefers-reduced-motion se animace
   přeskočí a stránka odejde ihned. */

const kofiGate = document.getElementById("kofiGate");
const kofiGateHost = document.getElementById("kofiGateHost");
const KOFI_GATE_NAV_MS = 1080;
const KOFI_GATE_TOTAL_MS = 1560;
let kofiGateBusy = false;
let kofiGateNavTimer = 0;
let kofiGateCleanupTimer = 0;

function isKofiGateNavigating() {
  return !!kofiGate && kofiGate.classList.contains("is-navigating");
}

function closeKofiGate() {
  window.clearTimeout(kofiGateNavTimer);
  window.clearTimeout(kofiGateCleanupTimer);
  kofiGateNavTimer = 0;
  kofiGateCleanupTimer = 0;
  if (!kofiGate) return;
  kofiGate.classList.remove("is-active", "is-navigating");
  kofiGate.setAttribute("aria-hidden", "true");
  document.body.classList.remove("kofi-gate-open");
  kofiGateBusy = false;
}

function cancelKofiGate() {
  if (isKofiGateNavigating()) return;
  closeKofiGate();
}

function launchKofiPulse(clientX, clientY, origin) {
  if (prefersReducedMotion.matches) return;

  const rect = origin.getBoundingClientRect();
  const x = Number.isFinite(clientX) && clientX > 0 ? clientX : rect.left + rect.width / 2;
  const y = Number.isFinite(clientY) && clientY > 0 ? clientY : rect.top + rect.height / 2;

  const pulse = document.createElement("span");
  pulse.className = "kofi-pulse";
  pulse.setAttribute("aria-hidden", "true");
  pulse.style.setProperty("--pulse-x", `${Math.round(x)}px`);
  pulse.style.setProperty("--pulse-y", `${Math.round(y)}px`);
  pulse.innerHTML = '<i class="kofi-pulse-grid"></i><i class="kofi-pulse-cross"></i>';
  document.body.appendChild(pulse);
  window.setTimeout(() => pulse.remove(), 1500);
}

function openKofiGate(origin, clientX = 0, clientY = 0) {
  const url = SITE_LINKS.kofi;
  if (!url) return;
  if (prefersReducedMotion.matches || !kofiGate) {
    window.location.assign(url);
    return;
  }
  if (kofiGateBusy) return;
  kofiGateBusy = true;

  launchKofiPulse(clientX, clientY, origin);
  if (kofiGateHost) kofiGateHost.textContent = url.replace(/^https?:\/\//, "");

  document.body.classList.add("kofi-gate-open");
  kofiGate.setAttribute("aria-hidden", "false");
  kofiGate.classList.remove("is-active", "is-navigating");
  // Dva snímky + reflow zajistí, že se všechny keyframy přehrají znovu.
  void kofiGate.offsetWidth;
  kofiGate.classList.add("is-active");

  kofiGateNavTimer = window.setTimeout(() => {
    kofiGate.classList.add("is-navigating");
    window.location.assign(url);
  }, KOFI_GATE_NAV_MS);

  // Pojišťka pro případ, že prohlížeč přesměrování zamítne — portál se skryje.
  kofiGateCleanupTimer = window.setTimeout(closeKofiGate, KOFI_GATE_TOTAL_MS + 1400);
}

function initializeKofiGate() {
  const kofiButton = document.querySelector(".store-button.kofi-button");
  if (!kofiButton) return;

  kofiButton.addEventListener("click", event => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openKofiGate(kofiButton, event.clientX, event.clientY);
  });
}

document.querySelectorAll("[data-kofi-cancel]").forEach(button => {
  button.addEventListener("click", cancelKofiGate);
});

// Po návratu přes tlačítko Zpět (bfcache) nesmí portál zůstat přes celou obrazovku.
window.addEventListener("pageshow", event => {
  if (event.persisted) closeKofiGate();
});

/* ===================== SERVER — iba tlačidlo (stránka ještě nevznikla) ===================== */

document.querySelectorAll("[data-soon]").forEach(button => {
  button.addEventListener("click", () => {
    showToast(t("toast.server.soon"), "warning", 3200);
  });
});

/* ===================== MANIFEST — ROZBALITELNÉ CELÉ INFORMACE ===================== */

function initializeManifestToggle() {
  const card = document.getElementById("aboutCard");
  const toggle = document.getElementById("aboutMoreToggle");
  const panel = document.getElementById("aboutManifest");
  if (!card || !toggle || !panel) return;

  const setExpanded = expanded => {
    card.classList.toggle("is-expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    panel.setAttribute("aria-hidden", String(!expanded));
    panel.inert = !expanded;
  };

  // Výchozí stav: sbaleno (inert z HTML jistoty kvůli starším prohlížečům).
  setExpanded(false);

  toggle.addEventListener("click", () => {
    const expanded = !card.classList.contains("is-expanded");
    setExpanded(expanded);

    if (expanded) {
      // Po rozbalení plynule přiscrollujeme, pokud je nový obsah pod okrajem viewportu.
      window.setTimeout(() => {
        if (prefersReducedMotion.matches) return;
        const rect = panel.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 28) {
          toggle.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 540);
    }
  });
}

/* ===================== PLYNULÝ PŘECHOD MEZI STRÁNKAMI =====================
   Klik na odkaz, který vede na druhou stránku webu (/ a /modpacky/), nezobrazí
   novou stránku skokem: přes obrazovku se převalí lehký závoj s logem a teprve
   v momentě, kdy je scéna zakrytá, se změní dokument. Cílová stránka je na
   okamžik zakrytá stejně a závoj se z ní stečí pryč (viz `html.mk-arriving`
   v inline skriptu hlavičky) — takže přechod působí jako jedna plynulá akce.
   Při prefers-reduced-motion se nic neanimuje a odkazy fungují normálně. */

const PAGE_TRANSITION_PATHS = ["/", "/modpacky/"];
const PAGE_TRANSITION_MS = 430;

function normalizeTransitionPath(pathname) {
  const clean = pathname.replace(/index\.html$/, "");
  return clean.endsWith("/") ? clean : `${clean}/`;
}

function initializePageTransition() {
  const veil = document.getElementById("pageVeil");

  // Návrat z historie (bfcache) má být okamžitý, žádné dohrávání závoje.
  window.addEventListener("pageshow", event => {
    if (event.persisted) document.documentElement.classList.remove("mk-arriving");
  });

  // Po dohrání závoje na cílové stránce třídu uklidíme (nezávisle na časovači
  // v hlavičce, který je jen pojistka pro případ, že by se animace nekonala).
  veil?.querySelector(".page-veil-panel")?.addEventListener("animationend", event => {
    if (event.animationName === "mkVeilClear") document.documentElement.classList.remove("mk-arriving");
  });

  if (!veil) return;

  if (prefersReducedMotion.matches) {
    document.documentElement.classList.remove("mk-arriving");
    return;
  }

  let leaving = false;

  document.addEventListener("click", event => {
    if (leaving || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    if (link.dataset.noTransition !== undefined) return;
    if (link.origin !== window.location.origin) return;

    // Závoj mají jen stránky, které ho umí i přijmout (hlavní web a modpacky/).
    if (!PAGE_TRANSITION_PATHS.includes(normalizeTransitionPath(link.pathname))) return;
    if (normalizeTransitionPath(link.pathname) === normalizeTransitionPath(window.location.pathname)) return;

    event.preventDefault();
    leaving = true;

    try {
      window.sessionStorage.setItem("minekube:page-transition", "1");
    } catch {
      // Bez úložiště se prostě jen neanimuje příchod cílové stránky.
    }

    veil.classList.add("is-active");
    window.setTimeout(() => {
      window.location.href = link.href;
    }, PAGE_TRANSITION_MS);
  });
}

/* ===================== INICIALIZÁCIA ===================== */

const currentYearNode = document.getElementById("currentYear");
if (currentYearNode) currentYearNode.textContent = new Date().getFullYear();

applySiteLinks();
applyLanguage(currentLang);
initializeSurfaceInteractions();
initializeScrollExperience();
initializeSupportButtonFx();
initializeKofiGate();
initializePrimaryCta();
initializeManifestToggle();
initializePageTransition();
