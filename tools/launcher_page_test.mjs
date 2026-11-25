/* =============================================================
   MINEKUBE STUDIOS // TEST STRÁNKY LAUNCHER
   Spouští se: node tools/launcher_page_test.mjs

   Postaví novou stránku launcheru v jsdom a ověří, že:
     1. Windows je živá platforma a stáhne instalátor z GitHubu,
     2. stav po kliknutí je „zahájeno“, nikdy „hotovo“,
     3. Windows a Linux karty existují, Linux je „v plánu“ a nic nestahuje,
     4. když Releases API nic nemá, najde se instalátor v obsahu repa,
     5. když GitHub API neodpovídá, použije se záložní adresa,
     6. chybový stav jde opravit tlačítkem „Zkusit znovu“,
     7. přepínání jazyků překreslí dynamické texty i placeholdery,
     8. všechny překladové klíče existují ve všech třech jazycích,
     9. prohlídka rozhraní i přepínač Platformy/Funkce jdou z klávesnice,
    10. carousel se posouvá šipkami, kolečkem i klávesnicí,
    11. nový design stojí na tapetách a pixelových ikonách, studio
        na stránce neexistuje,
    12. přepínač efektů animace vypne a volbu si pamatuje,
    13. obrázky mají alt, rozměry a lazy loading (včetně tapet),
    14. stránka je sémantická a značky vyvážené.
   ============================================================= */

import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..") + "/";

/* jsdom není součástí repozitáře — hledáme ho na obvyklých místech.
   Instalace:  npm install jsdom --no-audit --no-fund --prefix /tmp/testenv */
const jsdomPath = [process.env.JSDOM_PATH, "/tmp/testenv/node_modules/jsdom", "jsdom"]
  .filter(Boolean)
  .find(candidate => {
    try {
      require.resolve(candidate);
      return true;
    } catch {
      return false;
    }
  });

if (!jsdomPath) {
  console.error("✗ Chybí jsdom. Nainstaluj ho: npm install jsdom --no-audit --no-fund --prefix /tmp/testenv");
  process.exit(1);
}

const { JSDOM } = require(jsdomPath);

const read = file => readFileSync(ROOT + file, "utf8");

/* Stránku skládáme s vloženými skripty — v prohlížeči sdílejí jeden
   globální prostor, a přesně to potřebujeme (app.js deklaruje `t`,
   kterou pak používá launcher.js). */
const SCRIPT_FILES = {
  "i18n.js": "launcher/i18n.js",
  "../app.js": "app.js",
  "releases.js": "launcher/releases.js",
  "launcher.js": "launcher/launcher.js",
  "../design-plus.js": "design-plus.js"
};

/* Cache-busting ?v= v src nesmí test rozbít. */
const HTML = read("launcher/index.html").replace(
  /<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g,
  (match, src) => (SCRIPT_FILES[src] ? `<script>\n${read(SCRIPT_FILES[src])}\n<\/script>` : match.replace(/<script[^>]*><\/script>/, ""))
);

const EXE = "Minekube.Launcher_1.2.1_x64-setup.exe";
const EXE_URL = `https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/v1.2.1/${EXE}`;
const SHA = "35ed1956632bb28a574e08de3ce323a5c4369ffaf1ede59205aa1c19e52434d7";
const WINDOWS_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/* ===================== NAHRÁVAČE ===================== */

function scenarios() {
  return {
    // Repozitář nemá použitelné Releases — instalátor leží přímo ve větvi.
    repoOnly(url) {
      if (url.includes("/releases?")) return { status: 200, body: [] };
      if (url.includes("/contents/")) {
        return {
          status: 200,
          body: [
            { type: "file", name: "Minekube Launcher_1.0.0-local_x64-setup.exe", size: 24691528, download_url: "https://example.invalid/repo-setup.exe" },
            { type: "file", name: "README.md", size: 18, download_url: "https://example.invalid/README.md" },
            { type: "file", name: "source-code .zip", size: 19019056, download_url: "https://example.invalid/src.zip" }
          ]
        };
      }
      return { status: 404, body: { message: "Not Found" } };
    },

    // Plnohodnotné vydání s přílohami pro všechny tři systémy + otisk souboru.
    withReleases(url) {
      if (url.includes("/releases?")) {
        return {
          status: 200,
          body: [
            {
              tag_name: "v1.2.1",
              draft: false,
              html_url: "https://github.com/MinekubeStudios/MinekubeLauncher/releases/tag/v1.2.1",
              assets: [
                { name: EXE, size: 27140257, digest: `sha256:${SHA}`, browser_download_url: EXE_URL },
                { name: "Minekube.Launcher_1.2.1_aarch64.dmg", size: 26000000, browser_download_url: "https://example.invalid/mac.dmg" },
                { name: "Minekube.Launcher_1.2.1_amd64.AppImage", size: 27000000, browser_download_url: "https://example.invalid/linux.appimage" },
                { name: `${EXE}.sig`, size: 100, browser_download_url: "https://example.invalid/sig" }
              ]
            },
            {
              tag_name: "v1.0.0",
              draft: false,
              assets: [{ name: "Old_1.0.0_x64-setup.exe", size: 1, browser_download_url: "https://example.invalid/old.exe" }]
            }
          ]
        };
      }
      return { status: 200, body: [] };
    },

    // GitHub API je nedostupné (limit / offline).
    down() {
      return { status: 403, body: { message: "API rate limit exceeded" } };
    },

    // Prázdný repozitář bez jediného sestavení — nastoupí záložní adresa.
    empty() {
      return { status: 200, body: [] };
    }
  };
}

async function buildPage(scenario, { userAgent = WINDOWS_UA } = {}) {
  const downloads = [];
  const requests = [];
  const errors = [];
  const handler = scenarios()[scenario];

  const dom = new JSDOM(HTML, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://minekubestudios.github.io/launcher/",
    beforeParse(window) {
      /* jsdom volbu userAgent ignoruje — podstrčíme ji přímo. */
      Object.defineProperty(window.navigator, "userAgent", { configurable: true, get: () => userAgent });

      window.matchMedia = query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false
      });
      window.IntersectionObserver = class {
        constructor(callback) {
          this.callback = callback;
        }
        observe(element) {
          this.callback([{ isIntersecting: true, target: element }], this);
        }
        disconnect() {}
        unobserve() {}
      };
      window.ResizeObserver = class {
        observe() {}
        disconnect() {}
        unobserve() {}
      };
      window.scrollTo = () => {};
      /* jsdom bez balíčku canvas — plátna v testu jen nesmí nic rozbít. */
      window.HTMLCanvasElement.prototype.getContext = () => null;
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.HTMLElement.prototype.scrollBy = function scrollBy() {};
      window.HTMLAnchorElement.prototype.click = function click() {
        if (this.href) downloads.push({ href: this.href, download: this.download });
      };

      const store = new Map();
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: key => (store.has(key) ? store.get(key) : null),
          setItem: (key, value) => store.set(key, String(value)),
          removeItem: key => store.delete(key),
          clear: () => store.clear()
        }
      });
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        value: window.localStorage
      });

      window.fetch = async url => {
        const address = String(url);
        requests.push(address);
        const result = handler(address);
        return {
          ok: result.status >= 200 && result.status < 300,
          status: result.status,
          json: async () => result.body
        };
      };

      window.addEventListener("error", event => errors.push(event.message || String(event.error)));
      window.onerror = (message, file, line) => {
        errors.push(`${message} (${file}:${line})`);
        return false;
      };
    }
  });

  const { window } = dom;
  await window.MinekubeLauncherReleases.ready;
  // jsdom hlásí navigator.language = en-US; stránka má české výchozí texty.
  window.eval('applyLanguage("cs")');
  await new Promise(done => window.setTimeout(done, 40));

  return { dom, window, document: window.document, downloads, requests, errors };
}

const tick = (window, ms = 40) => new Promise(done => window.setTimeout(done, ms));
const text = (document, selector) => document.querySelector(selector)?.textContent.trim() ?? null;

/* ===================== TESTY ===================== */

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("Windows: najde instalátor v repozitáři a stáhne ho", async () => {
  const page = await buildPage("repoOnly");
  const { document, window, downloads } = page;
  const Releases = window.MinekubeLauncherReleases;

  assert.equal(Releases.status().source, "repo");
  assert.equal(Releases.status().state, "ready");
  assert.equal(Releases.isAvailable("windows"), true);

  const hero = document.querySelector(".lpx-hero [data-launcher-download]");
  assert.equal(hero.dataset.state, "idle");
  assert.equal(hero.dataset.os, "windows");
  assert.match(text(document, ".lpx-version__value"), /^v1\.0\.0-local$/);
  assert.match(text(document, "[data-os-label]"), /Windows/);
  assert.match(text(document, "[data-os-sub]"), /23[.,]5 MB/);
  assert.match(text(document, "[data-os-sub]"), /\.exe$/);
  assert.equal(document.querySelector('[data-launcher-file="hero"]').hidden, false);
  assert.equal(document.querySelector('[data-launcher-file="windows"]').hidden, false);
  assert.match(text(document, '[data-launcher-file="windows"] [data-launcher-file-name]'), /setup\.exe/);
  assert.equal(document.querySelector("[data-launcher-source]").hidden, false);
  // Skeletony zmizí, jakmile jsou data k dispozici.
  assert.equal(document.querySelector('[data-launcher-skeleton="windows"]').hidden, true);

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 320);
  assert.equal(downloads.length, 1, "klik musí spustit právě jedno stažení");
  assert.ok(downloads[0].href.includes("example.invalid/repo-setup.exe"), downloads[0].href);

  // Zahájeno — a nikdy „hotovo“: dokončení hlásí prohlížeč.
  assert.equal(hero.dataset.state, "started");
  assert.match(text(document, "[data-os-label]"), /Stahování zahájeno/);
  assert.notEqual(hero.dataset.state, "done");
  assert.equal(document.querySelector("[data-launcher-start-note]").hidden, false);

  assert.deepEqual(page.errors, []);
});

test("Windows: otisk SHA-256 z GitHub API se zobrazí zkráceně", async () => {
  const page = await buildPage("withReleases");
  const { document } = page;

  const hash = document.querySelector("[data-launcher-hash]");
  assert.equal(hash.hidden, false);
  assert.match(text(document, "[data-launcher-hash-value]"), /^sha256:[a-f0-9]{12}…[a-f0-9]{8}$/);
  assert.equal(hash.getAttribute("title"), `sha256:${SHA}`);
  assert.match(text(document, ".lpx-version__value"), /^v1\.2\.1$/);
});

test("Windows a Linux karty existují, Linux je v plánu a nic nestahuje", async () => {
  const page = await buildPage("withReleases");
  const { document, window, downloads } = page;

  assert.equal(window.MinekubeLauncherReleases.status().source, "releases");

  /* Stránka má jen Windows a Linux — macOS se nikde neslibuje. */
  const buttons = [...document.querySelectorAll("[data-launcher-download]")];
  assert.deepEqual(buttons.map(button => button.dataset.os), ["windows", "windows", "linux"]);
  assert.equal(document.querySelector('[data-launcher-download][data-os="macos"]'), null);

  const linux = document.querySelector('.lpx-platform__actions [data-launcher-download][data-os="linux"]');
  assert.equal(linux.dataset.state, "planned");
  assert.equal(linux.disabled, false, "tlačítko zůstává dostupné kvůli vysvětlení");
  const badge = linux.closest(".lpx-platform").querySelector(".lpx-badge--planned");
  assert.match(badge.textContent, /V plánu|Planned/);

  linux.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(downloads.length, 0, "platforma v plánu nesmí nic stahovat");
  assert.equal(document.getElementById("toast").classList.contains("show"), true);
  assert.match(document.querySelector(".toast-message").textContent, /Linux/);
  assert.deepEqual(page.errors, []);
});

test("Návštěvník na macOS dostane Windows a slušné vysvětlení", async () => {
  const page = await buildPage("repoOnly", {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
  });
  const { document } = page;

  assert.equal(document.querySelector(".lpx-hero .lpx-download").dataset.os, "windows");
  assert.equal(document.querySelector("[data-os-label]").textContent.trim(), "Stáhnout pro Windows");
  /* macOS sestavení neexistuje, takže stránka o něm nemluví — hlavní
     tlačítko prostě nabídne Windows, které jediné existuje. */
  assert.equal(document.querySelector('[data-os="macos"]'), null);
  assert.match(document.querySelector("[data-os-sub]").textContent.trim(), /^Windows 10\+ · 64bit · [\d,]+ MB · \.exe$/);
  assert.deepEqual(page.errors, []);
});

test("Když GitHub API mlčí, nastoupí záložní adresa", async () => {
  const page = await buildPage("down");
  const { document, window, downloads } = page;
  const Releases = window.MinekubeLauncherReleases;

  assert.equal(Releases.status().source, "fallback");
  assert.equal(Releases.status().degraded, true);
  assert.equal(Releases.isAvailable("windows"), true);

  const hero = document.querySelector(".lpx-hero [data-launcher-download]");
  assert.equal(hero.dataset.state, "idle");
  assert.equal(document.querySelector("[data-launcher-state]").dataset.state, "ready");
  assert.match(text(document, "[data-launcher-state-label]"), /Záložní|Fallback/);

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 320);
  assert.equal(downloads.length, 1);
  assert.ok(downloads[0].href.startsWith("https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/"), downloads[0].href);
  assert.deepEqual(page.errors, []);
});

test("Chybový stav se ukáže a „Zkusit znovu“ ho opraví", async () => {
  const page = await buildPage("down");
  const { document, window } = page;

  // Záložní zdroj je stále k dispozici, takže chybová hláška nesvítí.
  assert.equal(document.querySelector("[data-launcher-error]").hidden, true);

  // Prázdné API + fallback: otisk není, takže řádek se skryje.
  const empty = await buildPage("empty");
  assert.equal(empty.window.MinekubeLauncherReleases.status().state, "ready");
  assert.equal(empty.document.querySelector("[data-launcher-hash]").hidden, true);
  assert.deepEqual(empty.errors, []);

  const retry = document.querySelector("[data-launcher-retry]");
  assert.ok(retry, "tlačítko pro nové načtení musí existovat");
  retry.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 80);
  assert.ok(page.requests.length >= 2, "retry musí znovu zavolat GitHub");
  assert.deepEqual(page.errors, []);
});

test("Přepnutí jazyka překreslí dynamické texty i navigaci", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  assert.equal(document.querySelector("[data-os-label]").textContent.trim(), "Stáhnout pro Windows");
  assert.equal(document.querySelector(".lpx-hero__cta [data-mc-motion-label]").textContent.trim(), "Animace zapnuté");

  window.eval(`applyLanguage("en")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Download for Windows$/);
  assert.match(text(document, "[data-launcher-state-label]"), /Ready to download/);
  assert.equal(text(document, ".lpx-hero__cta [data-mc-motion-label]"), "Animations on");
  assert.equal(text(document, '.lpx-nav__link[href="#funkce"]'), "Features");
  assert.equal(text(document, ".lpx-cta h2"), "Want to see what there is to play first?");

  window.eval(`applyLanguage("sk")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stiahnuť pre Windows$/);
  assert.equal(text(document, '.lpx-nav__link[href="#faq"]'), "Otázky");

  window.eval(`applyLanguage("cs")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stáhnout pro Windows$/);
  assert.deepEqual(page.errors, []);
});

test("Každý překladový klíč existuje ve všech třech jazycích", async () => {
  const dom = new JSDOM(HTML);
  const { document } = dom.window;
  const dictionaryDom = new JSDOM(`<script>${read("launcher/i18n.js")}<\/script>`, {
    runScripts: "dangerously"
  });
  const dictionaries = dictionaryDom.window.MINEKUBE_PAGE_I18N;
  assert.ok(dictionaries, "i18n.js musí definovat window.MINEKUBE_PAGE_I18N");

  const pageKeys = new Set();
  const sharedKeys = new Set();
  ["data-i18n", "data-i18n-aria", "data-i18n-title", "data-i18n-alt"].forEach(attribute => {
    document.querySelectorAll(`[${attribute}]`).forEach(node => {
      const key = node.getAttribute(attribute);
      (key.startsWith("lp.") || key.startsWith("meta.") ? pageKeys : sharedKeys).add(key);
    });
  });
  assert.ok(pageKeys.size > 60, `na stránce má být dost textů, nalezeno ${pageKeys.size}`);

  for (const lang of ["cs", "en", "sk"]) {
    assert.ok(dictionaries[lang], `chybí jazyk ${lang}`);
    const missing = [...pageKeys].filter(key => !(key in dictionaries[lang]));
    assert.deepEqual(missing, [], `${lang}: chybí překlady stránky`);
  }

  // Klíče sdílené hlavičky a patičky patří do app.js — musí tam být taky.
  const appDictionary = read("app.js");
  const missingShared = [...sharedKeys].filter(key => !appDictionary.includes(`"${key}"`));
  assert.deepEqual(missingShared, [], "chybí sdílené překlady v app.js");

  // Dynamické klíče, které skládá launcher.js.
  const dynamic = [
    "lp.os.windows", "lp.os.linux",
    "lp.os.sub.windows", "lp.os.sub.linux", "lp.os.sub.planned",
    "lp.dl.label.download", "lp.dl.label.planned", "lp.dl.label.started",
    "lp.dl.state.loading", "lp.dl.state.ready", "lp.dl.state.fallback", "lp.dl.state.error",
    "lp.dl.source.releases", "lp.dl.source.repo", "lp.dl.source.fallback",
    "lp.toast.start", "lp.toast.fallback", "lp.toast.planned", "lp.toast.os",
    "lp.toast.error", "lp.toast.fetching", "lp.toast.retryFailed", "lp.toast.refreshed",
    "lp.dl.error.retry", "lp.dl.started.note", "lp.hint.planned",
    "lp.mc.motion.on", "lp.mc.motion.off",
    "lp.dl.copy", "lp.dl.copied", "lp.dl.checked", "lp.dl.checked.now",
    "lp.dl.hash.missing", "lp.dl.hash.failed", "lp.dl.hash.copied"
  ];
  for (const lang of ["cs", "en", "sk"]) {
    dynamic.forEach(key => assert.ok(dictionaries[lang][key], `${lang}: chybí dynamický klíč ${key}`));
  }
  dom.window.close();
  dictionaryDom.window.close();
});

test("Překlady nepřekládají klíč na klíč (žádný text není syrový klíč)", async () => {
  const dictionaryDom = new JSDOM(`<script>${read("launcher/i18n.js")}<\/script>`, {
    runScripts: "dangerously"
  });
  const dictionaries = dictionaryDom.window.MINEKUBE_PAGE_I18N;
  for (const lang of ["cs", "en", "sk"]) {
    const raw = Object.entries(dictionaries[lang]).filter(([key, value]) => key === value);
    assert.deepEqual(raw, [], `${lang}: klíč se překládá sám na sebe`);
    const empty = Object.entries(dictionaries[lang]).filter(([, value]) => !String(value).trim());
    assert.deepEqual(empty, [], `${lang}: prázdný překlad`);
  }
  dictionaryDom.window.close();
});

test("Prohlídka rozhraní funguje i z klávesnice", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const tabs = [...document.querySelectorAll(".lpx-tabs [role='tab']")];
  const panels = [...document.querySelectorAll(".lpx-panel[role='tabpanel']")];
  assert.equal(tabs.length, 3);
  assert.equal(panels.length, 3);
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);

  tabs[0].focus();
  const list = document.querySelector(".lpx-tabs");
  list.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(tabs[1].tabIndex, 0);
  assert.equal(panels[1].hidden, false);
  assert.equal(panels[0].hidden, true);

  list.dispatchEvent(new window.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");

  list.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.equal(tabs[0].tabIndex, 0);
  assert.deepEqual(page.errors, []);
});

test("Přepínač Platformy/Funkce přepíná panely a jde z klávesnice", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const tabs = [...document.querySelectorAll("[data-mc-switch-btn]")];
  const panes = [...document.querySelectorAll("[data-mc-pane]")];
  assert.equal(tabs.length, 2);
  assert.equal(panes.length, 2);
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.equal(panes[0].hidden, false);
  assert.equal(panes[1].hidden, true);
  assert.ok(panes[0].querySelector(".lpx-plat--live"), "v první pane jsou platformy");
  assert.ok(panes[1].querySelector(".lpx-table"), "ve druhé pane je tabulka");

  tabs[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(panes[1].hidden, false);
  assert.equal(panes[0].hidden, true);

  tabs[0].focus();
  document.querySelector("[data-mc-switch]").dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
  );
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(panes[1].hidden, false);
  assert.deepEqual(page.errors, []);
});

test("Carousel „Co v launcheru najdeš“ jde ovládat myší i klávesnicí", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const root = document.querySelector("[data-mc-carousel]");
  const track = root.querySelector("[data-mc-track]");
  const prev = root.querySelector("[data-mc-prev]");
  const next = root.querySelector("[data-mc-next]");
  assert.equal(track.querySelectorAll(".lpx-slide").length, 6);
  assert.ok(prev && next, "obě šipky existují");

  /* jsdom neumí layout, takže scrollBy jen zapíšeme. Rozhoduje směr
     a to, že krok není nula — posun o nulu by carousel zasekl. */
  const calls = [];
  track.scrollBy = options => {
    calls.push(options);
    track.scrollLeft += options.left;
  };
  prev.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  next.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(calls.length, 2, "obě šipky musí carousellem pohnout");
  assert.ok(calls[0].left < 0 && calls[1].left > 0, "šipky jdou proti sobě");
  assert.ok(Math.abs(calls[1].left) >= 1, "krok nesmí být nula");

  const before = calls.length;
  track.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  track.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  assert.equal(calls.length, before + 2, "klávesnice ovládá carousel");
  assert.ok(calls[before].left > 0 && calls[before + 1].left < 0);
  assert.deepEqual(page.errors, []);
});

test("Nový design stojí na tapetách a pixelových ikonách, studio zmizelo", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  // Studio ani jeho úložiště na stránce nejsou.
  assert.equal(document.querySelector("[data-studio]"), null, "studio musí být pryč");
  assert.equal(document.querySelector("[data-studio-stage]"), null);
  assert.equal(window.MinekubeLauncherStudio, undefined, "studio.js se nenačítá");
  assert.equal(window.MinekubeLauncherApi.WALLPAPERS, undefined, "API studia je pryč");
  assert.equal(window.MinekubeLauncherApi.ICONS, undefined);

  /* Tapety: hero má předpečenou tapetu, pásy mají inline --bg. */
  const bands = [...document.querySelectorAll("main .lpx-band")];
  assert.ok(bands.length >= 3, "stránka má alespoň tři pásy s tapetou");
  const backgrounds = bands.map(band => {
    const bg = band.querySelector(".lpx-band__bg");
    assert.ok(bg, "pás bez vrstvy tapety");
    const value = bg.getAttribute("style") || "";
    const match = value.match(/wallpapers\/atmo\/([a-z-]+)\.webp/);
    assert.ok(match, `pás bez tapety: ${value}`);
    return match[1];
  });
  assert.equal(new Set(backgrounds).size, backgrounds.length, "každý pás má jinou tapetu");
  backgrounds.forEach(slug => {
    const file = `launcher/wallpapers/atmo/${slug}.webp`;
    const bytes = statSync(ROOT + file).size;
    assert.ok(bytes > 3000, `${file} je podezřele malý`);
    assert.ok(bytes < 80 * 1024, `${file} je moc velký (${Math.round(bytes / 1024)} kB)`);
  });

  const hero = statSync(ROOT + "launcher/wallpapers/hero-backdrop.webp").size;
  assert.ok(hero > 20000 && hero < 120 * 1024, "hero tapeta musí být předpečená a malá");
  assert.match(read("launcher/lpx.css"), /wallpapers\/hero-backdrop\.webp/);

  /* Pixelové ikony: každá dekorativní ikona má soubor, rozměry i prázdný alt. */
  const icons = [...document.querySelectorAll("main img")];
  assert.ok(icons.length >= 30, `stránka má používat ikony, nalezeno ${icons.length}`);
  const used = new Set();
  icons.forEach(image => {
    const src = image.getAttribute("src");
    assert.match(src, /^icons\/[a-z-]+\.png$/, `nečekaný zdroj ${src}`);
    used.add(src.replace("icons/", "").replace(".png", ""));
    assert.equal(image.getAttribute("alt"), "", `${src}: dekorativní ikona má mít prázdný alt`);
    assert.ok(image.getAttribute("width") && image.getAttribute("height"), `${src}: chybí rozměry`);
    assert.ok(statSync(ROOT + "launcher/" + src).size < 60 * 1024, `${src} je moc velký`);
  });
  ["chest", "ender-chest", "anvil", "pickaxe", "fenix"].forEach(name => {
    if (name === "fenix") return;
    assert.ok(used.has(name), `chybí ikona ${name}`);
  });

  /* Žádná stránka studia: v HTML nesmí zůstat ani klíč, ani skript. */
  const html = read("launcher/index.html");
  assert.ok(!html.includes("studio.js"), "index.html nesmí načítat studio.js");
  assert.ok(!/"std\.[a-z]/.test(read("launcher/i18n.js")), "i18n nesmí obsahovat klíče studia");
  assert.ok(!existsSync(ROOT + "launcher/studio.js"), "studio.js musí být smazaný");
  assert.ok(!existsSync(ROOT + "launcher/launcher.css"), "starý launcher.css musí být smazaný");
  assert.ok(!existsSync(ROOT + "launcher/launcher-mc.css"), "starý launcher-mc.css musí být smazaný");

  assert.deepEqual(page.errors, []);
});

test("Přepínač efektů animace vypne a volbu si pamatuje", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;
  const pageEl = document.querySelector(".launcher-page");
  const toggle = document.querySelector("[data-fx-toggle]");

  assert.equal(pageEl.dataset.fxState, "on");
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  assert.equal(document.querySelectorAll(".lpx-marquee__item").length, 16, "pás se má zdvojnásobit kvůli smyčce");

  toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(pageEl.dataset.fxState, "off");
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.equal(window.localStorage.getItem("minekube:launcher-fx"), "off");

  /* Druhý přepínač v hero (Animace) ukazuje stejný stav. */
  await tick(window);
  assert.equal(document.querySelector("[data-mc-motion]").getAttribute("aria-pressed"), "false");

  toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window);
  assert.equal(pageEl.dataset.fxState, "on");
  assert.equal(window.localStorage.getItem("minekube:launcher-fx"), "on");
  assert.equal(document.querySelector("[data-mc-motion]").getAttribute("aria-pressed"), "true");
  assert.deepEqual(page.errors, []);
});

test("Odkazy na repozitář, katalog a navigaci sedí", async () => {
  const page = await buildPage("repoOnly");
  const { document } = page;

  const repoLinks = [...document.querySelectorAll("[data-launcher-repo]")];
  assert.ok(repoLinks.length >= 3, "hero, FAQ i závěrečné CTA");
  repoLinks.forEach(link => {
    assert.equal(link.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher");
    assert.equal(link.getAttribute("target"), "_blank");
    assert.match(link.getAttribute("rel"), /noopener/);
  });

  assert.equal(document.querySelector(".lpx-cta .lpx-btn--primary").getAttribute("href"), "../modpacky/");

  const releases = document.querySelector('[data-site-link="launcherReleases"]');
  assert.equal(releases.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher/releases");

  // Sekční navigace míří na existující sekce.
  const navLinks = [...document.querySelectorAll("[data-nav-link]")];
  assert.equal(navLinks.length, 4);
  navLinks.forEach(link => {
    assert.ok(document.querySelector(link.getAttribute("href")), `neexistující cíl ${link.getAttribute("href")}`);
  });

  // Launcher musí být dosažitelný z navigace domů i z katalogu modpacků.
  for (const [file, expected] of [["index.html", "launcher/"], ["modpacky/index.html", "../launcher/"]]) {
    const dom = new JSDOM(read(file));
    const links = [...dom.window.document.querySelectorAll(".desktop-nav a, .mobile-nav a")]
      .filter(link => link.querySelector('[data-i18n="nav.launcher"]'));
    assert.equal(links.length, 2, file);
    links.forEach(link => assert.equal(link.getAttribute("href"), expected));
    dom.window.close();
  }
  assert.deepEqual(page.errors, []);
});

test("Stránka je sémantická a bez duplicitních ID", async () => {
  const dom = new JSDOM(HTML);
  const { document } = dom.window;

  assert.equal(document.querySelectorAll("main").length, 1);
  const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], [], "duplicitní ID");

  // Jedna h1, sekce mají vlastní nadpisy.
  assert.equal(document.querySelectorAll("h1").length, 1);
  document.querySelectorAll("main section").forEach(section => {
    const labelled = section.getAttribute("aria-labelledby");
    if (!labelled) return;
    assert.ok(document.getElementById(labelled), `aria-labelledby míří na neexistující #${labelled}`);
  });
  // Taby musí odkazovat na existující panely a naopak.
  document.querySelectorAll("[role='tab']").forEach(tab => {
    assert.ok(document.getElementById(tab.getAttribute("aria-controls")), "aria-controls míří na neexistující panel");
  });
  document.querySelectorAll("[role='tabpanel']").forEach(panel => {
    assert.ok(document.getElementById(panel.getAttribute("aria-labelledby")), "tabpanel bez platného aria-labelledby");
  });
  // Sekce, na které vede navigace, existují.
  ["launcher", "platformy-prehled", "jak-to-funguje", "funkce", "prohlidka", "co-najdes", "platformy", "faq", "dalsi"].forEach(id => {
    assert.ok(document.getElementById(id), `chybí sekce #${id}`);
  });
  dom.window.close();
});

test("Obrázky odpovídají atributům width/height a nikdo neodkazuje do prázdna", async () => {
  const dom = new JSDOM(HTML);
  const { document } = dom.window;

  [...document.querySelectorAll(".launcher-page img")].forEach(image => {
    const src = image.getAttribute("src");
    assert.ok(src, "obrázek bez src");
    const bytes = statSync(ROOT + "launcher/" + src).size;
    assert.ok(bytes < 120 * 1024, `${src} je moc velký (${Math.round(bytes / 1024)} kB)`);
    if (!/\.png$/i.test(src)) return;
    /* Wordmark Javy není čtvercová ikona — má vlastní poměr 512×107
       a v okně launcheru se používá jako logo, ne jako glyf. */
    if (src === "icons/java-edition.png") {
      assert.equal(image.getAttribute("width"), "76");
      assert.equal(image.getAttribute("height"), "16");
      return;
    }
    /* PNG: rozměry se čtou z IHDR, aby se layout neposunul. */
    const buffer = readFileSync(ROOT + "launcher/" + src);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    /* Ikony se zobrazují menší než soubor (v liště 18 px, soubor 192 px),
       ale poměr stran musí sedět — jinak se layout posune. */
    const declared = Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
    const intrinsic = width / height;
    assert.ok(Math.abs(declared - intrinsic) < 0.06, `${src}: poměr stran nesedí (${declared.toFixed(2)} vs ${intrinsic.toFixed(2)})`);
  });

  /* Žádný lokální odkaz nesmí mířit na neexistující soubor. */
  const refs = new Set();
  for (const match of read("launcher/index.html").matchAll(/(?:src|href)="((?!#|https?:|mailto:)[^"]+)"/g)) {
    refs.add(match[1].split("?")[0]);
  }
  refs.forEach(ref => {
    /* Kotva na jiné stránce webu („../#projekt") soubor nemá —
       kontroluje se jen cesta před # a existence cílové stránky. */
    const [path] = ref.split("#");
    if (!path) return;
    const target = path.startsWith("../") ? ROOT + path.slice(3) : ROOT + "launcher/" + path;
    const resolved = path.endsWith("/") ? target + "index.html" : target;
    assert.ok(existsSync(resolved), `odkaz do prázdna: ${ref}`);
  });
  dom.window.close();
});

test("Styly mají světlý motiv, nucené barvy i respekt k redukci pohybu", async () => {
  const css = read("launcher/lpx.css");
  const pulse = read("launcher/launcher-pulse.css");

  /* Světlý motiv přebarvuje tokeny celé stránky. */
  const lightBlock = css.slice(css.indexOf(':root[data-theme="light"] .lpx'));
  assert.ok(lightBlock.length > 500, "chybí světlý motiv");
  ["--lpx-bg", "--lpx-surface", "--lpx-text", "--lpx-muted", "--lpx-line"].forEach(token => {
    assert.ok(lightBlock.includes(`${token}:`), `světlý motiv nedefinuje ${token}`);
  });

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media print/);
  assert.match(css, /scroll-margin-top/);
  assert.match(css, /:focus-visible/);

  /* Tapety jsou jen náznak: vrstva má nízkou opacitu a přes ni gradient. */
  assert.match(css, /\.lpx-band__bg\s*\{[\s\S]*?opacity:\s*0\.(1|2|3)/, "tapeta pásu musí být ztlumená");
  assert.match(css, /\.lpx-hero__backdrop\s*\{[\s\S]*?opacity:\s*0\.(2|3|4)/, "hero tapeta musí být ztlumená");

  /* Pulz animuje jen transform a opacity — žádná animace filtru. */
  assert.ok(!/animation:[^;]*filter/.test(pulse), "pulz nesmí animovat filter");
  assert.match(pulse, /@keyframes lpBtnImpact/, "chybí ráz tlačítka");
  assert.match(pulse, /prefers-reduced-motion/);

  /* Studio v žádném stylu nezůstalo. */
  assert.ok(!/std\.|lp-studio/.test(css), "ve stylech zůstaly třídy studia");
});

test("Stahovací tlačítka nikdy netvrdí dokončení", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  const buttons = [...document.querySelectorAll("[data-launcher-download]")];
  assert.ok(buttons.length >= 3);

  const hero = document.querySelector(".lpx-hero [data-launcher-download]");
  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  /* Tlačítko reaguje hned (stav se mění synchronně), soubor se pouští
     o 220 ms později — proto tu není žádné čekání. */
  assert.equal(hero.dataset.state, "started");
  assert.match(text(document, "[data-os-label]"), /zahájeno/i);
  assert.ok(!/dokončeno|hotovo|complete/i.test(text(document, "[data-os-label]")));
  assert.match(text(document, "[data-launcher-start-note]"), /prohlížeč/);
  assert.deepEqual(page.errors, []);
});

test("Značky v HTML jsou vyvážené (žádný neuzavřený obal)", async () => {
  const html = read("launcher/index.html");
  const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let body = html.replace(/<!--[\s\S]*?-->/g, "");
  body = body.replace(/<svg\b[\s\S]*?<\/svg>/g, "<svg></svg>");
  body = body.replace(/<script\b[\s\S]*?<\/script>/g, "");

  const stack = [];
  const problems = [];
  for (const match of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, rawTag, , selfClosing] = match;
    const tag = rawTag.toLowerCase();
    if (VOID.has(tag) || selfClosing) continue;
    if (!closing) stack.push(tag);
    else if (stack[stack.length - 1] === tag) stack.pop();
    else problems.push(`</${tag}> neodpovídá <${stack[stack.length - 1]}>`);
  }

  assert.deepEqual(problems, []);
  assert.deepEqual(stack, [], "neuzavřené značky");
});

/* ===================== SPUŠTĚNÍ ===================== */

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}\n      ${error.message.split("\n").join("\n      ")}`);
  }
}

console.log(failed === 0 ? `\nVšechny testy prošly (${tests.length}).` : `\n${failed} z ${tests.length} testů selhalo.`);
process.exit(failed === 0 ? 0 : 1);
