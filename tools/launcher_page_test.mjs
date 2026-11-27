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
  /* Launcher si veze vlastní kopie sdílených souborů v launcher/shared/,
     takže je připravený i na přesun na samostatnou doménu. */
  "shared/app.js": "launcher/shared/app.js",
  "releases.js": "launcher/releases.js",
  "launcher.js": "launcher/launcher.js",
  "apple-motion.js": "launcher/apple-motion.js",
  "shared/design-plus.js": "launcher/shared/design-plus.js"
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
  /* Stavový řádek pod tlačítkem je pryč (na přání) — velikost, formát
     i název souboru musí zůstat dostupné čtečce přes skrytý popis
     a viditelně na kartě Windows. */
  assert.equal(document.querySelector("[data-os-sub]"), null, "stavový řádek měl zmizet");
  assert.equal(document.querySelector('[data-launcher-file="hero"]'), null, "řádek se souborem měl zmizet");
  const hint = text(document, "[data-launcher-hint]");
  assert.match(hint, /23[.,]5 MB/, "čtečka dostane velikost");
  assert.match(hint, /\.exe/, "čtečka dostane formát");
  assert.match(hint, /setup\.exe/, "čtečka dostane název souboru");
  assert.equal(document.querySelector('[data-launcher-file="windows"]').hidden, false);
  assert.match(text(document, '[data-launcher-file="windows"] [data-launcher-file-name]'), /setup\.exe/);
  // Skeletony zmizí, jakmile jsou data k dispozici.
  assert.equal(document.querySelector('[data-launcher-skeleton="windows"]').hidden, true);

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 320);
  assert.equal(downloads.length, 1, "klik musí spustit právě jedno stažení");
  assert.ok(downloads[0].href.includes("example.invalid/repo-setup.exe"), downloads[0].href);

  // Zahájeno — a nikdy „hotovo“: dokončení hlásí prohlížeč; text tlačítka zůstává vždy „Stáhnout pro Windows“.
  assert.equal(hero.dataset.state, "started");
  assert.match(text(document, "[data-os-label]"), /^Stáhnout pro Windows$/);
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
  assert.equal(document.querySelector("[data-os-sub]"), null);
  assert.match(document.querySelector("[data-launcher-hint]").textContent, /Stáhnout pro Windows/);
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
  assert.match(text(document, ".lpx-cta h2"), /play first|see what/);
  assert.match(text(document, '[data-i18n="lp.tour.title"]'), /Look inside|inside/);
  assert.equal(text(document, ".lpx-cta h2"), "Want to see what there is to play first?");

  window.eval(`applyLanguage("sk")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stiahnuť pre Windows$/);
  assert.ok(text(document, ".lpx-cta h2").length > 10, "CTA se přeložilo");

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
  /* Launcher má vlastní doménu, takže sdílené překlady hlavičky a patičky
     vozí jeho kopie app.js v launcher/shared/. */
  const appDictionary = read("launcher/shared/app.js");
  const missingShared = [...sharedKeys].filter(key => !appDictionary.includes(`"${key}"`));
  assert.deepEqual(missingShared, [], "chybí sdílené překlady v launcher/shared/app.js");

  // Dynamické klíče, které skládá launcher.js.
  const dynamic = [
    "lp.os.windows", "lp.os.linux",
    "lp.os.sub.windows", "lp.os.sub.linux", "lp.os.sub.planned",
    "lp.dl.label.download",
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

test("Přepínač animací v hero je jediný a přepíná apple/legacy režim", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  /* Lišta sekcí i přepínač Platformy/Funkce jsou pryč — ovládání
     pohybu zůstalo jen v hero a nesmí jich být víc. */
  const toggles = [...document.querySelectorAll("[data-fx-toggle]")];
  assert.equal(toggles.length, 1, "na stránce je právě jeden přepínač pohybu");
  assert.equal(document.querySelectorAll(".lpx-fx").length, 0, "lišta sekcí zmizela");

  const button = toggles[0];
  const root = document.querySelector(".launcher-page");
  const html = document.documentElement;
  assert.equal(button.disabled, false, "tlačítko musí být použitelné");

  /* VÝCHOZÍ = apple: nová vrstva, staré efekty potlačené (fx-state off). */
  assert.equal(html.getAttribute("data-motion-mode"), "apple");
  assert.equal(root.getAttribute("data-motion-mode"), "apple");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(root.getAttribute("data-fx-state"), "off");
  assert.equal(text(document, "[data-mc-motion-label]"), "Animace zapnuté");
  assert.equal(window.MinekubeLauncherApi.getMotionMode(), "apple");
  assert.ok(html.classList.contains("ap-js"), "apple-motion.js se načetl");

  /* Klik → legacy: PŮVODNÍ animace (fx-state on) + ostrá pozadí. */
  button.click();
  assert.equal(html.getAttribute("data-motion-mode"), "legacy");
  assert.equal(root.getAttribute("data-motion-mode"), "legacy");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(root.getAttribute("data-fx-state"), "on");
  assert.equal(text(document, "[data-mc-motion-label]"), "Animace vypnuté");
  assert.equal(window.localStorage.getItem("minekube:launcher-motion"), "legacy");

  /* Rychlý dvojklik zpět → apple, žádná rekurze ani zdvojený stav. */
  button.click();
  assert.equal(html.getAttribute("data-motion-mode"), "apple");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(root.getAttribute("data-fx-state"), "off");
  assert.equal(text(document, "[data-mc-motion-label]"), "Animace zapnuté");
  assert.equal(window.localStorage.getItem("minekube:launcher-motion"), "apple");
  assert.deepEqual(page.errors, []);
});

test("Uložený legacy režim se obnoví při načtení stránky", async () => {
  /* Představíme uloženou volbu dřív, než se skripty rozběhnou. */
  const page = await buildPage("repoOnly");
  const { document, window } = page;
  window.localStorage.setItem("minekube:launcher-motion", "legacy");
  window.MinekubeLauncherApi.setMotionMode("legacy");
  assert.equal(document.documentElement.getAttribute("data-motion-mode"), "legacy");
  assert.equal(document.querySelector(".launcher-page").getAttribute("data-fx-state"), "on");
  assert.equal(text(document, "[data-mc-motion-label]"), "Animace vypnuté");
  assert.deepEqual(page.errors, []);
});

test("Apple vrstva má nástřel hero; stahovací tlačítko zůstává VŽDY původní", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  const hero = document.querySelector(".lpx-hero");
  /* Nástřel běží přes dva rAF snímky — počkáme na ně. */
  await tick(window, 80);
  assert.ok(hero.classList.contains("is-ap-ready"), "hero nástřel se spustil");

  /* Stahovací tlačítko je VŽDY původní — i v apple režimu klik spustí
     původní pulz + explozi, žádnou „apple“ variantu. */
  assert.equal(document.documentElement.getAttribute("data-motion-mode"), "apple");
  const button = document.querySelector(".lpx-hero .lpx-download");
  button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.ok(button.classList.contains("is-pulse"), "klik spustí původní pulz i v apple režimu");
  assert.equal(button.classList.contains("is-ap-press"), false, "žádná apple varianta pulzu");
  assert.equal(document.querySelectorAll(".lp-pulse-burst").length, 1, "původní explozivní vrstva");
  assert.match(text(document, ".lpx-hero [data-os-label]"), /^Stáhnout pro Windows$/, "popisek se nemění");

  /* Pulz se uklidí po ~1,96 s, exploze po 2,4 s — stejně jako dřív. */
  await tick(window, 2050);
  assert.equal(button.classList.contains("is-pulse"), false, "pulz se uklidil");
  await tick(window, 450);
  assert.equal(document.querySelectorAll(".lp-pulse-burst").length, 0, "exploze se uklidila");
  assert.deepEqual(page.errors, []);
});

test("Apple-motion CSS: legacy = ostrá HD pozadí, apple = nová vrstva", () => {
  const css = read("launcher/apple-motion.css");
  const html = read("launcher/index.html");

  /* Vrstva se načítá poslední, aby vyhrála v kaskádě. */
  const links = [...html.matchAll(/<link href="([^"]+)" rel="stylesheet"\/>/g)].map(m => m[1]);
  assert.equal(links[links.length - 1].split("?")[0], "apple-motion.css", "apple-motion.css musí být poslední stylesheet");

  /* LEGACY: žádný blur na tapetách, HD zdroj. */
  const legacyWall = css.match(/:root\[data-motion-mode="legacy"\] \.lpx-wall\s*\{([^}]*)\}/);
  assert.ok(legacyWall, "chybí legacy pravidlo celostránkové tapety");
  assert.match(legacyWall[1], /filter:\s*none !important/, "legacy tapeta nesmí být rozostřená");
  assert.match(legacyWall[1], /wallpapers\/hd\/hero-backdrop\.webp/, "legacy tapeta musí být HD");

  const legacyBackdrop = css.match(/:root\[data-motion-mode="legacy"\] \.lpx-hero__backdrop\s*\{([^}]*)\}/);
  assert.ok(legacyBackdrop, "chybí legacy pravidlo hero tapety");
  assert.match(legacyBackdrop[1], /filter:\s*none !important/, "legacy hero tapeta nesmí být rozostřená");
  assert.match(legacyBackdrop[1], /wallpapers\/hd\/hero-backdrop\.webp/, "legacy hero tapeta musí být HD");

  const legacyBand = css.match(/:root\[data-motion-mode="legacy"\] \.lpx-band__bg\s*\{([^}]*)\}/);
  assert.ok(legacyBand, "chybí legacy pravidlo pásů");
  assert.match(legacyBand[1], /filter:\s*none !important/, "legacy pásy nesmí být rozostřené");
  assert.match(legacyBand[1], /var\(--bg-hd/, "legacy pásy musí brát HD zdroj");

  /* HTML pásy nesou HD zdroj přes --bg-hd. */
  const bands = [...html.matchAll(/class="lpx-band__bg" style="([^"]+)"/g)];
  assert.equal(bands.length, 3, "tři atmosférické pásy");
  bands.forEach(([, style]) => assert.match(style, /--bg-hd:url\('wallpapers\/hd\//, "pás musí mít HD zdroj"));

  /* HD assety opravdu existují. */
  for (const asset of ["hero-backdrop", "crimson-forest", "subdungeon", "lobby-s"]) {
    assert.ok(existsSync(ROOT + `launcher/wallpapers/hd/${asset}.webp`), `chybí HD asset ${asset}`);
  }

  /* APPLE: nová odhalovací vrstva + nástřel hero. */
  assert.match(css, /:root\[data-motion-mode="apple"\] \.lpx \[data-reveal\]/, "apple přepisuje odhalování");
  assert.match(css, /@keyframes apHeroRise/, "chybí nástřel hero");

  /* Stahovací tlačítko je VŽDY původní — apple vrstva na něj NESAHÁ.
     Po odstranění komentářů zde nesmí být žádné .lpx-download /
     .download-ultimate pravidlo ani apple varianta pulzu; button
     řídí výhradně lpx.css, styles.css a launcher-pulse.css. */
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!stripped.includes(".lpx-download"), "apple-motion.css nesmí mít pravidlo pro .lpx-download");
  assert.ok(!stripped.includes(".download-ultimate"), "apple-motion.css nesmí mít pravidlo pro .download-ultimate");
  assert.ok(!/apPress|apSheen|is-ap-press/.test(stripped), "žádná apple varianta pulzu stahovacího tlačítka");

  /* Přístupnost: redukce pohybu, nucené barvy, tisk. */
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media print/);

  /* Bez JS nesmí nic zůstat skryté. */
  assert.match(css, /html\.ap-js:root\[data-motion-mode="apple"\] \.lpx-hero \.lpx-title/, "skrytí hero je podmíněné .ap-js");
});

test("Sekce „Tři kroky“ i carousel zmizely i se svou logikou", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  /* Oba bloky jsou pryč celé — včetně tlačítka „Ponoř se hloub“,
     které na „Tři kroky“ skákalo. */
  for (const selector of [
    "[data-mc-carousel]",
    "[data-mc-track]",
    "[data-mc-prev]",
    "[data-mc-next]",
    "[data-mc-dig]",
    ".lpx-dig",
    ".lpx-carousel",
    ".lpx-slide",
    ".lpx-steps",
    ".lpx-step"
  ]) {
    assert.equal(document.querySelector(selector), null, `${selector} mělo zmizet`);
  }
  assert.equal(document.getElementById("jak-to-funguje"), null);
  assert.equal(document.getElementById("co-najdes"), null);

  /* Po smazaném carouselu nesmí zůstat ani klíče, ani scroll handlery. */
  assert.equal(window.MinekubeLauncherApi.translate("lp.mc.car.1.t"), "lp.mc.car.1.t");
  assert.equal(window.MinekubeLauncherApi.translate("lp.mc.how.title"), "lp.mc.how.title");
  assert.equal(window.MinekubeLauncherApi.translate("lp.carousel.prev"), "lp.carousel.prev");
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

  /* Tapety: hero má předpečenou tapetu, pásy i atmo sekce inline --bg. */
  const bands = [...document.querySelectorAll("main .lpx-band, main .lpx-section--atmo")];
  assert.ok(bands.length >= 3, `stránka má alespoň tři sekce s tapetou (${bands.length})`);
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
  ["chest", "ender-chest", "pickaxe", "windows", "linux", "toggle-on"].forEach(name => {
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

  /* Launcher běží na vlastní doméně, takže odkazy do zbytku webu
     musejí být absolutní — relativní by na nové doméně vedly do prázdna. */
  assert.equal(
    document.querySelector(".lpx-cta .lpx-btn--primary").getAttribute("href"),
    "https://minekubestudios.github.io/modpacky/"
  );

  const releases = document.querySelector('[data-site-link="launcherReleases"]');
  assert.equal(releases.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher/releases");

  /* Sekční navigace je pryč; každý interní odkaz na kotvu musí
     mířit na existující prvek — jinak vznikne mrtvý klik. */
  const navLinks = [...document.querySelectorAll('a[href^="#"]')];
  assert.ok(navLinks.length >= 1, "hero CTA zůstalo");
  navLinks.forEach(link => {
    assert.ok(document.querySelector(link.getAttribute("href")), `neexistující cíl ${link.getAttribute("href")}`);
  });

  // Launcher musí být dosažitelný z navigace domů i z katalogu modpacků.
  // Běží ve stejnojmenné složce, takže obě stránky odkazují relativně.
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

test("JS neodkazuje na prvky, které na stránce nejsou", async () => {
  /* Při mazání sekcí zůstaly v launcher.js selektory na prvky, které
     už neexistují — skip link pak nikdy nefungoval a syncTabPill
     házel ReferenceError. Tenhle test to hlídá plošně. */
  const page = await buildPage("repoOnly");
  const { document, window } = page;
  const js = read("launcher/launcher.js");

  /* 1) Každý data-* selektor z JS musí mít v DOM protějšek. */
  const dataSelectors = [...new Set([...js.matchAll(/\[(data-[a-z0-9-]+)\]/g)].map(m => m[1]))];
  assert.ok(dataSelectors.length > 10, "selektory se našly");
  dataSelectors.forEach(name => {
    assert.ok(document.querySelector(`[${name}]`), `JS hledá [${name}], ale v DOM není`);
  });

  /* 2) Odkazy na třídy, které JS používá jako háček, musí existovat
        v HTML (kromě stavových tříd, které si JS sám přidává). */
  /* Stavové třídy si JS přidává sám a některé prvky (přelití, ripple,
     burst) vytváří až za běhu — ty v HTML být nemají. */
  const stateClasses = new Set([
    "is-active", "is-copied", "is-busy", "is-stuck", "is-in", "is-pulse",
    "is-on", "is-pointer-active", "is-loading",
    "lp-btn-flash", "lp-pulse-burst", "lp-ripple"
  ]);
  const hookClasses = [...new Set([...js.matchAll(/querySelector(?:All)?\(\s*"\.([\w-]+)/g)].map(m => m[1]))];
  assert.ok(hookClasses.length > 5, "háčky se našly");
  hookClasses.forEach(cls => {
    if (stateClasses.has(cls)) return;
    assert.ok(document.querySelector(`.${cls}`), `JS hledá .${cls}, ale v DOM není`);
  });

  /* 3) getElementById musí mířit na existující prvek (modalTitle
        vkládá app.js až při otevření, ten je výjimka). */
  const ids = [...new Set([...js.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]))];
  ids.forEach(id => {
    assert.ok(document.getElementById(id), `JS hledá #${id}, ale v DOM není`);
  });
  assert.deepEqual(page.errors, []);
});

test("Hero má nový text jako skutečné odstavce, ne <br><br>", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const title = document.getElementById("lpxTitle");
  const lead = document.querySelector(".lpx-lead");
  assert.ok(title && lead, "hero má titulek i text");

  /* Čtyři odstavce = čtyři pauzy pro čtečku. <br><br> by text slepilo
     do jedné dlouhé věty, proto se to hlídá. */
  const paragraphs = [...lead.querySelectorAll("p")];
  assert.equal(paragraphs.length, 4, "text hero má čtyři odstavce");
  paragraphs.forEach(p => {
    assert.ok(p.textContent.trim().length > 10, `prázdný odstavec: ${p.textContent}`);
    assert.equal(p.querySelectorAll("br").length, 0, "odstavce nesmí používat <br>");
  });
  assert.ok(lead.querySelector(".lpx-lead__claim"), "poslední slib má vlastní zvýraznění");

  /* Titulek: dva řádky, druhý zvýrazněný. */
  assert.equal(title.querySelectorAll("em").length, 1);
  assert.ok(title.innerHTML.includes("<br>"), "titulek má řízený zlom");

  /* Ve všech jazycích stejná struktura a žádný syrový klíč. */
  const expected = {
    cs: ["Launcher budoucnosti.", "Tvůj Minecraft."],
    en: ["Launcher Of The Future.", "Your Minecraft."],
    sk: ["Launcher budúcnosti.", "Tvoj Minecraft."]
  };
  for (const [lang, lines] of Object.entries(expected)) {
    window.eval(`applyLanguage("${lang}")`);
    await tick(window);
    const parts = title.innerHTML.replace(/<br>/g, "|").replace(/<\/?em>/g, "").trim().split("|").map(x => x.trim());
    assert.deepEqual(parts, lines, `${lang}: titulek`);
    const ps = [...lead.querySelectorAll("p")].map(p => p.textContent.trim());
    assert.equal(ps.length, 4, `${lang}: čtyři odstavce`);
    ps.forEach((text, index) => {
      assert.ok(text.length > 5, `${lang}: odstavec ${index + 1} je prázdný`);
      assert.ok(!text.includes("<"), `${lang}: v textu zůstala značka`);
    });
  }
  window.eval(`applyLanguage("cs")`);
  await tick(window);
  assert.deepEqual(page.errors, []);
});

test("Titulek hero se vejde na jeden řádek na mobilu i na desktopu", () => {
  const css = readFileSync(ROOT + "launcher/lpx.css", "utf8");
  const block = css.match(/\.lpx-title\s*\{[^}]*\}/);
  assert.ok(block, "chybí pravidlo .lpx-title");

  /* Zlom v titulku řídí <br>, takže každý řádek musí na šířku sednout sám.
     „Launcher Of The Future." měří v Pixelify Sans (700, letter-spacing 0)
     12,144 em — změřenо v Chromiu canvasem nad skutečným woff2. Měří se
     kontejner `.lpx-hero__copy`, protože ve dvousloupcovém hero je
     nejužší místo tam — odtud jednotka cqi. */
  const EM = 12.144;
  const size = block[0].match(/font-size:\s*clamp\(([^,]+),\s*([\d.]+)cqi,\s*([^)]+)\)/);
  assert.ok(size, ".lpx-title nemá tekutý font-size v jednotkách cqi (container query)");

  const minRem = parseFloat(size[1]);
  const cqi = parseFloat(size[2]) / 100;
  const maxRem = parseFloat(size[3]);

  /* Prohlížeče bez container queries dostanou dva fallbacky: základní
     v jednom sloupci a zpevněný strop v media query nad 1080px. I ty
     musí titulek udržet na jednom řádku. */
  const fallback = block[0]
    .split("\n")
    .map(line => line.match(/font-size:\s*clamp\(([^,]+),\s*([\d.]+)vw,\s*([^)]+)\)/))
    .filter(Boolean)
    .map(m => ({ min: parseFloat(m[1]), k: parseFloat(m[2]) / 100, max: parseFloat(m[3]) }));
  assert.ok(fallback.length >= 1, ".lpx-title nemá vw fallback pro starší prohlížeče");

  const twoCol = css.match(/@media \(min-width: 1081px\)\s*\{[^}]*\.lpx-title\s*\{[^}]*\}/);
  assert.ok(twoCol, "chybí fallback pro dvousloupcový hero (media min-width: 1081px)");
  const wide = twoCol[0].match(/font-size:\s*clamp\(([^,]+),\s*([\d.]+)vw,\s*([^)]+)\)/);
  assert.ok(wide, "dvousloupcový fallback nemá vw clamp");
  const wideFallback = { min: parseFloat(wide[1]), k: parseFloat(wide[2]) / 100, max: parseFloat(wide[3]) };

  /* Šířka sloupce s textem. Do 1080px je hero jednosloupcový, nad ním
     dvousloupcový (1,22 : 1) a od 1320px je hero grid širší (1400px)
     než zbytek stránky. */
  const containerWidth = vw => {
    const gutter = Math.min(Math.max(20, 0.042 * vw), 56);
    if (vw <= 1080) return Math.min(1200, vw - 2 * gutter);
    const wrap = Math.min(vw >= 1320 ? 1400 : 1200, vw - 2 * gutter);
    const gap = Math.min(Math.max(28, 0.04 * vw), 64);
    return ((wrap - gap) * 1.22) / 2.22;
  };

  const fits = (vw, px, cw, note) => {
    assert.ok(
      EM * px <= cw + 0.5,
      `titulek přeteče na ${vw}px${note}: text ${Math.round(EM * px)}px > sloupec ${Math.round(cw)}px`
    );
  };

  /* Pod 360px se nadpis na jeden řádek nevejde, aniž by byl menší než
     nadpisy sekcí — tam má přednost hierarchie a text se zalomí. Od
     360px (nejmenší běžný telefon) musí sedět na jeden řádek. */
  for (let vw = 360; vw <= 2200; vw += 2) {
    const cw = containerWidth(vw);

    // 1) cesta s container queries
    fits(vw, Math.max(minRem * 16, Math.min(cqi * cw, maxRem * 16)), cw, " (cqi)");

    // 2) fallback bez container queries
    const fb = vw <= 1080 ? fallback[fallback.length - 1] : wideFallback;
    fits(vw, Math.max(fb.min * 16, Math.min(fb.k * vw, fb.max * 16)), cw, " (vw fallback)");
  }
});

test("Hero titulek je výrazně větší než nadpisy sekcí", () => {
  const css = readFileSync(ROOT + "launcher/lpx.css", "utf8");
  const h1 = css.match(/\.lpx-title\s*\{[^}]*font-size:\s*clamp\(([^,]+),\s*([\d.]+)cqi,\s*([^)]+)\)/);
  const h2Match = [...css.matchAll(/\.lpx-(?:head|cta) h2[^{]*\{[^}]*font-size:\s*clamp\(([^,]+),\s*([\d.]+)vw,\s*([^)]+)\)/g)];
  assert.ok(h1, "chybí cqi font-size titulku");
  assert.ok(h2Match.length, "chybí font-size nadpisů sekcí");
  const h2 = h2Match[0];

  const px = (m, vw) => Math.max(parseFloat(m[1]) * 16, Math.min((parseFloat(m[2]) / 100) * vw, parseFloat(m[3]) * 16));

  /* Dvousloupcový hero (od 1081px) je nejtěsnější — tam se titulku
     zužuje sloupec, takže musí zůstat jasně nad h2. */
  for (const vw of [1081, 1200, 1280, 1440, 1600, 1920]) {
    const gutter = Math.min(Math.max(20, 0.042 * vw), 56);
    const wrap = Math.min(vw >= 1320 ? 1400 : 1200, vw - 2 * gutter);
    const gap = Math.min(Math.max(28, 0.04 * vw), 64);
    const col = ((wrap - gap) * 1.22) / 2.22;
    const title = Math.max(parseFloat(h1[1]) * 16, Math.min((parseFloat(h1[2]) / 100) * col, parseFloat(h1[3]) * 16));
    const section = px(h2, vw);
    assert.ok(
      title >= section * 1.15,
      `hierarchie se ztrácí na ${vw}px: titulek ${title.toFixed(1)}px vs sekce ${section.toFixed(1)}px`
    );
  }
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
  // Sekce stránky (bez smazaných bloků).
  ["launcher", "funkce", "prohlidka", "platformy", "faq", "dalsi"].forEach(id => {
    assert.ok(document.getElementById(id), `chybí sekce #${id}`);
  });
  // Smazané bloky se nesmí vrátit omylem.
  ["platformy-prehled"].forEach(id => {
    assert.equal(document.getElementById(id), null, `#${id} mělo zmizet`);
  });
  assert.equal(document.querySelector(".lpx-facts"), null, "pruh faktů měl zmizet");
  assert.equal(document.querySelector(".lpx-nav"), null, "navigace sekcí měla zmizet");
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

test("Styly jsou syntakticky vyvážené a responzivní bloky nejsou vnořené", () => {
  /* Při mazání sekcí se snadno zapomene uzavřít @media — pak se všechna
     responzivní pravidla stanou mrtvými a nikdo si toho nevšimne. */
  for (const file of ["launcher/lpx.css", "launcher/launcher-pulse.css", "launcher/apple-motion.css"]) {
    const css = read(file);
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    let depth = 0;
    let maxDepth = 0;
    let atMediaDepth = [];
    const lines = stripped.split("\n");
    lines.forEach((line, index) => {
      const open = (line.match(/\{/g) || []).length;
      const close = (line.match(/\}/g) || []).length;
      if (depth === 0 && /@media/.test(line) && open) atMediaDepth.push(index + 1);
      depth += open - close;
      maxDepth = Math.max(maxDepth, depth);
      assert.ok(depth >= 0, `${file}: přebytečná } na řádku ${index + 1}`);
    });
    assert.equal(depth, 0, `${file}: ${depth} neuzavřených bloků`);
    /* Nejhlouběji smí být @media → pravidlo → (jedna vnořená úroveň). */
    assert.ok(maxDepth <= 3, `${file}: zanoření ${maxDepth} značí @media uvnitř @media`);
  }
});

test("Typografie jde ve stylu minecraft.net: pixely v nadpisech, Noto Sans v textu", () => {
  const css = read("launcher/lpx.css");
  const html = read("launcher/index.html");

  /* minecraft.net míchá tři role: blocky display (Minecraft Ten), 8bit
     labely (Mojangles) a Noto Sans na text. My je plníme volně
     dostupnými náhradami, aby web neporušoval licenci Mojangu. */
  assert.match(css, /--lpx-font-body:\s*"Noto Sans"/, "text nemá Noto Sans");
  assert.match(css, /--lpx-font-chunky:\s*"Pixelify Sans"/, "nadpisy nemají pixelové písmo");
  assert.match(css, /--lpx-font-label:\s*"Silkscreen"/, "labely nemají 8bit písmo");

  /* Písma musí být na :root, protože hlavička leží mimo .lpx. */
  const root = css.match(/:root\s*\{([\s\S]*?)\}/);
  assert.ok(root && root[1].includes('--lpx-font-body'), "fonty nejsou na :root");
  assert.match(css, /--plus-font-body:\s*var\(--lpx-font-body\)/, "sdílené komponenty si drží Inter");

  /* Weby z Google Fonts musí být opravdu načtené, jinak prohlížeč
     spadne na systémovou zásobu a pixelový styl zmizí. */
  ["Noto+Sans", "Pixelify+Sans", "Silkscreen"].forEach(f => {
    assert.ok(html.includes(`family=${f}`), `HTML nenačítá ${f}`);
  });

  /* Nadpis nesmí mít záporný tracking — u pixelového písma se slévá. */
  const titles = css.match(/\.lpx-title,\n\.lpx-head h2,\n\.lpx-cta h2\s*\{([\s\S]*?)\}/);
  assert.ok(titles, "chybí pravidlo nadpisů");
  assert.match(titles[1], /font-family:\s*var\(--lpx-font-chunky\)/);
  assert.match(titles[1], /letter-spacing:\s*0/);
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

  /* Tapety jsou vidět (vysoká opacita), ale rozostřené — blur drží
     obsah čitelný a tapeta nesoupeří s textem. Přes ně jde jen lehký
     závoj, ne těžký scrim. */
  assert.match(css, /\.lpx-band__bg\s*\{[\s\S]*?opacity:\s*0\.(5|6|7)/, "tapeta pásu musí být vidět");
  assert.match(css, /\.lpx-band__bg\s*\{[\s\S]*?filter:\s*blur\(/, "tapeta pásu musí být rozostřená");
  assert.match(css, /\.lpx-hero__backdrop\s*\{[\s\S]*?opacity:\s*0\.(7|8|9)/, "hero tapeta musí být vidět");
  assert.match(css, /\.lpx-hero__backdrop\s*\{[\s\S]*?filter:\s*blur\(/, "hero tapeta musí být rozostřená");

  /* Celostránková tapeta pod obsahem: sticky vrstva s blur, aby pozadí
     prosvítalo i mezi pásy. */
  const wall = css.match(/\.lpx-wall\s*\{([\s\S]*?)\}/);
  assert.ok(wall, "chybí celostránková tapeta .lpx-wall");
  assert.match(wall[1], /wallpapers\/hero-backdrop\.webp/, "celostránková tapeta musí být tapeta launcheru");
  assert.match(wall[1], /filter:\s*blur\(/, "celostránková tapeta musí být rozostřená");
  assert.match(wall[1], /position:\s*sticky/, "celostránková tapeta se musí držet okna");
  assert.match(wall[1], /z-index:\s*-\d/, "celostránková tapeta musí ležet pod obsahem");
  assert.match(read("launcher/index.html"), /class="lpx-wall"/, "HTML nemá vrstvu celostránkové tapety");

  /* Obsahové sekce mají přes tapetu jen lehký závoj a sklo karet si
     nese vlastní tmavý podklad — jinak by tapeta prosakovala do textu. */
  const veil = css.match(/\.lpx-section:not\(\.lpx-section--atmo\)::before\s*\{([\s\S]*?)\}/);
  assert.ok(veil, "chybí závoj nad tapetou v obsahových sekcích");
  assert.match(veil[1], /rgba\(10, 5, 9, 0\.(3|4)/, "závoj musí být jen lehký, ne plný scrim");
  assert.match(css, /--lpx-glass-base:/, "chybí token tmavého podkladu skla");
  const glass = css.match(/\n\.lpx-card,\n\.lpx-panel,[\s\S]*?background-color:\s*var\(--lpx-glass-base\)/);
  assert.ok(glass, "sklo karet musí mít vlastní tmavý podklad");

  /* Světlý motiv tapety nešedne — násobí se na papír. */
  assert.match(css, /mix-blend-mode:\s*multiply/, "světlý motiv musí tapetu násobit, ne šednout");

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
  assert.match(text(document, "[data-os-label]"), /^Stáhnout pro Windows$/);
  assert.ok(!/dokončeno|hotovo|complete|again|znovu|zahájeno/i.test(text(document, "[data-os-label]")));
  assert.match(text(document, "[data-launcher-start-note]"), /prohlížeč/);
  assert.deepEqual(page.errors, []);
});

test("Každé stahovací tlačítko říká jen „Stáhnout pro …“", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  const labels = () =>
    [...document.querySelectorAll(".download-ultimate .download-label")].map(node => node.textContent.trim());

  /* Windows karta i hero míří na instalátor, takže obě musí nabízet
     stažení — ne „Zkusit znovu“ ani „Stáhnout instalátor“. */
  assert.deepEqual(labels(), ["Stáhnout pro Windows", "Stáhnout pro Windows"]);

  const hero = document.querySelector(".lpx-hero .lpx-download");
  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 400);
  assert.deepEqual(labels(), ["Stáhnout pro Windows", "Stáhnout pro Windows"], "klik popisek nemění");

  window.eval(`applyLanguage("en")`);
  await tick(window);
  assert.deepEqual(labels(), ["Download for Windows", "Download for Windows"]);

  window.eval(`applyLanguage("sk")`);
  await tick(window);
  assert.deepEqual(labels(), ["Stiahnuť pre Windows", "Stiahnuť pre Windows"]);

  window.eval(`applyLanguage("cs")`);
  await tick(window);
  assert.deepEqual(labels(), ["Stáhnout pro Windows", "Stáhnout pro Windows"]);

  labels().forEach(label => {
    assert.match(
      label,
      /^(Stáhnout pro Windows|Download for Windows|Stiahnuť pre Windows)$/,
      `Na tlačítku se objevil jiný text: ${label}`
    );
  });
  assert.deepEqual(page.errors, []);
});

test("Legacy pulz se restartuje a uklidí i při kliknutí na dvě tlačítka", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  /* Původní explozivní pulz patří jen legacy režimu — přepneme. */
  window.MinekubeLauncherApi.setMotionMode("legacy");
  assert.equal(document.documentElement.getAttribute("data-motion-mode"), "legacy");

  const hero = document.querySelector(".lpx-hero .lpx-download");
  const card = document.querySelector(".lpx-platform .lpx-download");

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.ok(hero.classList.contains("is-pulse"), "klik musí spustit pulz");
  assert.equal(document.querySelectorAll(".lp-pulse-burst").length, 1, "jedna explozivní vrstva");

  /* Druhý klik na jiné tlačítko je přijat po 350ms pojistce proti
     dvojkliku; exploze se nesmí vršit ani zmizet. */
  await tick(window, 420);
  card.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(document.querySelectorAll(".lp-pulse-burst").length, 1, "exploze se nevrší");
  assert.ok(card.classList.contains("is-pulse"));

  /* Hero pulz skončil (1,96 s od kliku), karta ještě běží. */
  await tick(window, 1600);
  assert.equal(hero.classList.contains("is-pulse"), false, "starý pulz se uklidil");
  assert.equal(card.classList.contains("is-pulse"), true, "nový pulz běží dál");

  /* Po 2,4 s od kliku zmizí i vnější vrstva. */
  await tick(window, 900);
  assert.equal(card.classList.contains("is-pulse"), false);
  assert.equal(document.querySelectorAll(".lp-pulse-burst").length, 0, "po pulzu nezůstane vrstva");
  assert.deepEqual(page.errors, []);
});

test("Tlačítko má vycentrovaný popisek, mini rámeček a čistý pulz", () => {
  const css = read("launcher/lpx.css");
  const pulse = read("launcher/launcher-pulse.css");
  const js = read("launcher/launcher.js");
  const i18n = read("launcher/i18n.js");

  /* Prázdný spinner už není flex item — jinak ho gap: 9px posune. */
  assert.match(
    css,
    /\.download-ultimate\.lpx-download\s+\.lp-btn__spinner\s*\{[^}]*display:\s*none/,
    "spinner musí být mimo tok, dokud se nenačítá"
  );

  /* Ikona visí na inset-block + margin: auto — transform nesmí nést
     translateY(-50%), které by ji posunulo o 14 px nahoru. */
  const icon = css.match(/\.download-ultimate\.lpx-download\s+\.download-icon\s*\{([^}]*)\}/);
  assert.ok(icon, "chybí pravidlo pro ikonu");
  assert.match(icon[1], /inset-block:\s*0/, "ikona musí být centrovaná přes inset-block");
  assert.match(icon[1], /margin:\s*auto 0/, "ikona musí být centrovaná přes margin");
  assert.ok(!/translateY\(-50%\)/.test(icon[1]), "ikona nesmí zdědit translateY(-50%)");

  const iconHover = css.match(/\.download-ultimate\.lpx-download:hover\s+\.download-icon[^{]*\{([^}]*)\}/);
  assert.ok(iconHover, "chybí hover pravidlo ikony");
  assert.ok(!/translateY\(-50%\)/.test(iconHover[1]), "hover nesmí vrátit translateY(-50%)");

  /* Rámeček: stejný gradient jako hover, jen tlumenější. Tloušťku
     určuje padding (maska XOR mezi border boxem a content boxem) —
     1–2 px byly na displeji i na mobilu jen vlasová linka, takže
     v klidu musí být aspoň 3 px a na hoveru výrazně tlustší. */
  const ring = css.match(/\.download-ultimate\.lpx-download::after\s*\{([^}]*)\}/);
  assert.ok(ring, "chybí klidový rámeček");
  const ringPad = Number((ring[1].match(/padding:\s*([\d.]+)px/) || [])[1]);
  assert.ok(ringPad >= 3, `klidový rámeček musí mít aspoň 3 px (má ${ringPad})`);
  assert.match(ring[1], /opacity:\s*0\.82/, "klidový rámeček musí být tlumený, ale čitelný");

  const ringHover = css.match(/\.download-ultimate\.lpx-download:hover::after[^{]*\{([^}]*)\}/);
  assert.ok(ringHover, "chybí hover rámeček");
  const hoverPad = Number((ringHover[1].match(/padding:\s*([\d.]+)px/) || [])[1]);
  assert.ok(hoverPad >= ringPad + 2, `hover rámeček musí být znatelně tlustší než klidový (${hoverPad} vs ${ringPad})`);
  assert.match(ringHover[1], /opacity:\s*1/, "hover rámeček musí být plný");
  assert.match(css, /\.download-ultimate\.lpx-download\s+\.download-fx\s*\{[^}]*inset:\s*-1px/);

  /* Povrch tlačítka je světlý gradient, takže popisek i ikona musí
     zůstat tmavé (bílý text na zlaté/purpurové byl špatně čitelný).
     Během pulzu se barva nesmí ztratit a nesmí existovat dvakrát. */
  assert.match(pulse, /color:\s*#2a1204/, "klidový popisek musí být tmavý");
  const pulseLabels = [...pulse.matchAll(/\.is-pulse[^{]*\.download-label[^{]*\{([^}]*)\}/g)].map(m => m[1]);
  assert.equal(pulseLabels.length, 1, "popisek během pulzu má jediné pravidlo");
  assert.match(pulseLabels[0], /color:\s*#241005/, "pulz nesmí popisek přebarvit do ztracena");
  assert.match(pulse, /downloadFusionBorderIdle/, "gradient rámečku musí během pulzu téct dál");

  /* Chybový stav ztmavne, takže popisek musí zbělat. */
  assert.match(
    pulse,
    /data-state="error"\]\s+\.download-label[^{]*\{[^}]*color:\s*#fff8f3|data-state="error"\][^{]*\{[^}]*color:\s*#fff8f3/s,
    "v chybovém stavu musí být popisek bílý"
  );

  /* Žádný jiný text: pseudo-element popisku a klíč „again“ jsou pryč. */
  assert.match(css, /\.lpx-download\s+\.download-label::after\s*\{\s*content:\s*""/);
  assert.ok(!/lp\.dl\.label\.again/.test(i18n), "v překladech nesmí zůstat „again“");
  assert.ok(!/lp\.dl\.error\.retry/.test(js), "stahovací tlačítko nesmí sahat na text „Zkusit znovu“");
  assert.ok(!/lp\.dl\.label\.planned/.test(js), "hero popisek nesmí mít stav „v plánu“");

  /* Exploze se měří před přidáním třídy is-pulse (animace začíná
     na scale 1.02) a uklízí se podle konkrétní vrstvy. */
  assert.match(js, /const rect = button\.getBoundingClientRect\(\);[\s\S]{0,200}classList\.add\("is-pulse"\)/);
  assert.match(js, /let activeBurst/);

  /* Vrstvy exploze se centrují zápornými marginy. `translate: -50% -50%`
     z lpx.css se k nim dřív přičetlo a výbuch vystřelil o půl tlačítka
     vlevo nahoru. */
  assert.match(
    pulse,
    /\.lp-pulse-burst \*[^{]*\{[^}]*translate:\s*none/,
    "vrstvy exploze nesmí zdědit translate z lpx.css"
  );

  /* Chybový povrch musí přebít sdílené pravidlo (0,4,0) a nesmí
     spoléhat na --pointer-x bez fallbacku (jinak je deklarace neplatná). */
  assert.match(
    css,
    /\.button\[data-download\]\.download-ultimate\.lpx-download\[data-state="error"\] \.download-fx \{[^}]*var\(--pointer-x,\s*50%\)/s,
    "chybový povrch musí mít vyšší specificitu i fallbacky proměnných"
  );
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

test("První karta funkcí prezentuje lokální účet bez omezení a bez zbytků lp.library", async () => {
  const html = read("launcher/index.html");
  const i18n = read("launcher/i18n.js");
  assert.ok(!/lp\.library\./.test(html), "index.html nesmí používat staré klíče lp.library.*");
  assert.ok(!/lp\.library\./.test(i18n), "i18n.js nesmí nechávat osiřelé klíče lp.library.*");

  const page = await buildPage("repoOnly");
  const { document, window } = page;
  const firstCard = document.querySelector("#funkce .lpx-cards .lpx-card");
  assert.ok(firstCard, "chybí první karta funkcí");
  assert.equal(firstCard.querySelector(".lpx-card__icon img")?.getAttribute("src"), "icons/armor-full.png");

  for (const [lang, titleRe, b1Re, b2Re, b3Re] of [
    ["cs", /^Lokální účet v základu$/, /^Bez Microsoft účtu/, /^Volitelně i Microsoft/, /^Žádné omezení/],
    ["en", /^Local account by default$/, /^No Microsoft required/, /^Optional Microsoft login/, /^No restrictions/],
    ["sk", /^Lokálny účet v základe$/, /^Bez Microsoft účtu/, /^Voliteľne aj Microsoft/, /^Žiadne obmedzenie/]
  ]) {
    window.eval(`applyLanguage("${lang}")`);
    await tick(window);
    assert.match(firstCard.querySelector("h3").textContent.trim(), titleRe, `${lang}: titulek karty`);
    const body = firstCard.querySelector("p").textContent.trim();
    assert.ok(body.length > 40 && !body.includes("<"), `${lang}: text karty`);
    const bullets = [...firstCard.querySelectorAll(".lpx-bullets li")];
    assert.equal(bullets.length, 3, `${lang}: tři odrážky`);
    assert.match(bullets[0].textContent.trim(), b1Re, `${lang}: odrážka 1`);
    assert.match(bullets[1].textContent.trim(), b2Re, `${lang}: odrážka 2`);
    assert.match(bullets[2].textContent.trim(), b3Re, `${lang}: odrážka 3`);
    bullets.forEach((li, idx) => {
      assert.equal(li.querySelectorAll("strong").length, 1, `${lang}: odrážka ${idx + 1} má jedno zvýraznění`);
    });
  }

  /* Statický HTML fallback musí odpovídat českému slovníku v i18n.js. */
  const staticDom = new JSDOM(html);
  const cs = window.MINEKUBE_PAGE_I18N.cs;
  for (const node of staticDom.window.document.querySelectorAll("[data-i18n]")) {
    const key = node.getAttribute("data-i18n");
    if (!Object.prototype.hasOwnProperty.call(cs, key)) continue;
    const expected = cs[key].replace(/\s+/g, " ").trim();
    const actual = node.innerHTML.replace(/\s+/g, " ").trim();
    assert.equal(actual, expected, `statický HTML fallback pro ${key} neodpovídá i18n.js (cs)`);
  }
  staticDom.window.close();
  assert.deepEqual(page.errors, []);
});

test("Hover karet funkcí a platforem přebije odhalení při scrollu", () => {
  const lpxCss = read("launcher/lpx.css");
  const appleCss = read("launcher/apple-motion.css");

  /* Legacy režim: .lpx [data-reveal].is-in má specificitu (0,3,0), takže
     samotné .lpx-card:hover (0,2,0) bylo přebité a karta se nikdy nezvedla. */
  assert.match(
    lpxCss,
    /\.lpx \.lpx-card\[data-reveal\]\.is-in:hover\s*\{[^}]*transform:\s*translateY\(-4px\)/,
    "lpx.css: hover karty musí přebít transform: none z [data-reveal].is-in"
  );

  /* Apple režim: :root[data-motion-mode="apple"] .lpx [data-reveal].is-in má
     (0,5,0) a dřív přebíjelo jak transition karet (0,3,0), tak hover (0,4,0). */
  assert.match(
    appleCss,
    /:root\[data-motion-mode="apple"\] \.lpx \.lpx-card\[data-reveal\]/,
    "apple-motion.css: karta s [data-reveal] musí zachovat reveal + border/shadow transition"
  );
  assert.match(
    appleCss,
    /:root\[data-motion-mode="apple"\] \.lpx \.lpx-card\.is-in:hover[\s\S]*?:root\[data-motion-mode="apple"\] \.lpx \.lpx-platform\.is-in:hover\s*\{[^}]*transform:\s*translate3d\(0,\s*-4px,\s*0\)/,
    "apple-motion.css: hover karet i platforem musí mít vyšší specificitu než [data-reveal].is-in"
  );
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
