/* =============================================================
   MINEKUBE STUDIOS // TEST STRÁNKY LAUNCHER
   Spouští se: node tools/launcher_page_test.mjs

   Postaví launcher/index.html v jsdom, podstrčí mu nahrávací GitHub
   API a ověří, že:
     1. Windows je živá platforma a stáhne instalátor z GitHubu,
     2. stav po kliknutí je „zahájeno“, nikdy „hotovo“,
     3. macOS a Linux jsou „v plánu“ a nic nestahují,
     4. když Releases API nic nemá, najde se instalátor v obsahu repa,
     5. když GitHub API neodpovídá, použije se záložní adresa,
     6. chybový stav jde opravit tlačítkem „Zkusit znovu“,
     7. přepínání jazyků překreslí dynamické texty i popisky obrázků,
     8. všechny překladové klíče existují ve všech třech jazycích,
     9. prohlídka rozhraní jde ovládat klávesnicí,
    10. obrázky mají popisek „ilustrační náhled“, odkazy na repo
        i navigaci z ostatních stránek webu.
   ============================================================= */

import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
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

const HTML = read("launcher/index.html").replace(
  /<script src="([^"]+)"><\/script>/g,
  (match, src) => (SCRIPT_FILES[src] ? `<script>\n${read(SCRIPT_FILES[src])}\n<\/script>` : match)
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
    userAgent,
    beforeParse(window) {
      /* jsdom 30 volbu userAgent ignoruje — podstrčíme ji přímo. */
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
      window.HTMLElement.prototype.scrollIntoView = () => {};
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
      window.onerror = (message, file, line, column, error) => {
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


/* Rozměry WebP bez externí knihovny — chrání proti rozbitému layoutu. */
function webpSize(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8 ") {
    assert.equal(buffer[23], 0x9d, "neplatný VP8 start code");
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    assert.equal(buffer[20], 0x2f, "neplatný VP8L podpis");
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1
    };
  }
  throw new Error(`neznámý WebP chunk ${chunk}`);
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

  const hero = document.querySelector(".lp-hero .lp-btn[data-launcher-download]");
  assert.equal(hero.dataset.state, "idle");
  assert.equal(hero.dataset.os, "windows");
  assert.match(text(document, "[data-launcher-version]"), /^v1\.0\.0-local$/);
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
  assert.match(text(document, "[data-launcher-version]"), /^v1\.2\.1$/);
});

test("macOS a Linux jsou v plánu a nic nestahují", async () => {
  const page = await buildPage("withReleases");
  const { document, window, downloads } = page;

  assert.equal(window.MinekubeLauncherReleases.status().source, "releases");

  for (const os of ["macos", "linux"]) {
    const button = document.querySelector(`.lp-platform__actions [data-launcher-download][data-os="${os}"]`);
    assert.equal(button.dataset.state, "planned");
    assert.equal(button.disabled, false, "tlačítko zůstává dostupné kvůli vysvětlení");
    const badge = button.closest(".lp-platform").querySelector(".lp-badge--planned");
    assert.match(badge.textContent, /V plánu|Planned/);

    button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  }

  assert.equal(downloads.length, 0, "platformy v plánu nesmí nic stahovat");
  assert.equal(document.getElementById("toast").classList.contains("show"), true);
  assert.deepEqual(page.errors, []);
});

test("Návštěvník na macOS dostane Windows a slušné vysvětlení", async () => {
  const page = await buildPage("repoOnly", {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
  });
  const { document } = page;

  assert.equal(document.querySelector(".lp-hero .lp-btn").dataset.os, "windows");
  assert.equal(document.querySelector("[data-os-label]").textContent.trim(), "Stáhnout pro Windows");
  assert.match(document.querySelector(".toast-message").textContent, /macOS/);
  assert.deepEqual(page.errors, []);
});

test("Když GitHub API mlčí, nastoupí záložní adresa", async () => {
  const page = await buildPage("down");
  const { document, window, downloads } = page;
  const Releases = window.MinekubeLauncherReleases;

  assert.equal(Releases.status().source, "fallback");
  assert.equal(Releases.status().degraded, true);
  assert.equal(Releases.isAvailable("windows"), true);

  const hero = document.querySelector(".lp-hero .lp-btn[data-launcher-download]");
  assert.equal(hero.dataset.state, "idle");
  assert.equal(document.querySelector("[data-launcher-state]").dataset.state, "ready");
  assert.match(text(document, "[data-launcher-state-label]"), /Záložní|Fallback/);

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(downloads.length, 1);
  assert.ok(downloads[0].href.startsWith("https://github.com/MinekubeStudios/MinekubeLauncher/releases/download/"), downloads[0].href);
  assert.deepEqual(page.errors, []);
});

test("Chybový stav se ukáže a „Zkusit znovu“ ho opraví", async () => {
  const page = await buildPage("down");
  const { document, window } = page;

  // Záložní zdroj je stále k dispozici, takže chybová hláška nesvítí.
  assert.equal(document.querySelector("[data-launcher-error]").hidden, true);

  // Když i záložní zdroj chybí (prázdné API a žádný fallback), stav je error.
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

test("Přepnutí jazyka překreslí dynamické texty i popisky obrázků", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const heroImage = document.querySelector(".lp-hero img");
  const csAlt = heroImage.getAttribute("alt");
  assert.match(csAlt, /Hlavní okno/);

  window.eval(`applyLanguage("en")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Download for Windows$/);
  assert.match(text(document, "[data-launcher-state-label]"), /Ready to download/);
  assert.match(heroImage.getAttribute("alt"), /main Minekube Launcher window/i);
  assert.match(text(document, ".lp-platform--planned .lp-badge--planned"), /Planned/);

  window.eval(`applyLanguage("sk")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stiahnuť pre Windows$/);
  assert.match(heroImage.getAttribute("alt"), /Hlavné okno/);

  window.eval(`applyLanguage("cs")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stáhnout pro Windows$/);
  assert.match(heroImage.getAttribute("alt"), /Hlavní okno/);
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
    "lp.os.windows", "lp.os.macos", "lp.os.linux",
    "lp.os.sub.windows", "lp.os.sub.macos", "lp.os.sub.linux", "lp.os.sub.planned",
    "lp.dl.label.download", "lp.dl.label.planned", "lp.dl.label.started",
    "lp.dl.state.loading", "lp.dl.state.ready", "lp.dl.state.fallback", "lp.dl.state.error",
    "lp.dl.source.releases", "lp.dl.source.repo", "lp.dl.source.fallback",
    "lp.toast.start", "lp.toast.fallback", "lp.toast.planned", "lp.toast.os",
    "lp.toast.error", "lp.toast.fetching", "lp.toast.retryFailed",
    "lp.dl.error.retry", "lp.dl.started.note"
  ];
  for (const lang of ["cs", "en", "sk"]) {
    dynamic.forEach(key => assert.ok(dictionaries[lang][key], `${lang}: chybí dynamický klíč ${key}`));
  }
  dom.window.close();
  dictionaryDom.window.close();
});

test("Prohlídka rozhraní funguje i z klávesnice", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const tabs = [...document.querySelectorAll(".lp-tour__tabs [role='tab']")];
  const panels = [...document.querySelectorAll(".lp-tour [role='tabpanel']")];
  assert.equal(tabs.length, 3);
  assert.equal(panels.length, 3);
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);

  tabs[0].focus();
  const list = document.querySelector(".lp-tour__tabs");
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

test("Upravené vizuály jsou označené jako ilustrační náhled", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  const captions = [...document.querySelectorAll(".lp-caption, .lp-stage__caption, .lp-cta__media figcaption")];
  assert.ok(captions.length >= 6, `čekáme popisek u každého snímku, nalezeno ${captions.length}`);
  captions.forEach(caption => assert.match(caption.textContent, /Ilustrační|náhled/));

  const images = [...document.querySelectorAll(".launcher-page img")];
  assert.ok(images.length >= 8, "stránka má použít všechny připravené vizuály");
  images.forEach(image => {
    assert.ok(image.getAttribute("alt") !== null, `obrázek bez alt: ${image.getAttribute("src")}`);
    assert.match(image.getAttribute("src"), /^img\/[\w-]+\.webp$/);
    assert.ok(image.getAttribute("width") && image.getAttribute("height"), "obrázky musí mít rozměry proti posunu layoutu");
    assert.equal(image.getAttribute("loading") === "eager", false);
  });

  window.eval(`applyLanguage("en")`);
  assert.match(document.querySelector(".lp-caption").textContent, /Illustrative preview/);
  window.eval(`applyLanguage("cs")`);
  assert.deepEqual(page.errors, []);
});

test("Odkazy na repozitář, katalog a navigaci sedí", async () => {
  const page = await buildPage("repoOnly");
  const { document } = page;

  const repoLinks = [...document.querySelectorAll("[data-launcher-repo]")];
  assert.ok(repoLinks.length >= 3, "hero, karta vývoje i závěrečné CTA");
  repoLinks.forEach(link => {
    assert.equal(link.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher");
    assert.equal(link.getAttribute("target"), "_blank");
    assert.match(link.getAttribute("rel"), /noopener/);
  });

  assert.equal(document.querySelector(".lp-cta .lp-btn--primary").getAttribute("href"), "../modpacky/");

  const releases = document.querySelector('[data-site-link="launcherReleases"]');
  assert.equal(releases.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher/releases");

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
  dom.window.close();
});


test("Obrázky jsou optimalizované a odpovídají atributům width/height", async () => {
  const dom = new JSDOM(HTML);
  const { document } = dom.window;
  const files = readdirSync(ROOT + "launcher/img");

  const used = new Set();
  [...document.querySelectorAll(".launcher-page img")].forEach(image => {
    const src = image.getAttribute("src");
    used.add(src.replace("img/", ""));
    const bytes = statSync(ROOT + "launcher/" + src).size;
    assert.ok(bytes < 90 * 1024, `${src} je moc velký (${Math.round(bytes / 1024)} kB)`);

    const real = webpSize(readFileSync(ROOT + "launcher/" + src));
    assert.equal(real.width, Number(image.getAttribute("width")), `${src}: šířka nesedí s atributem`);
    assert.equal(real.height, Number(image.getAttribute("height")), `${src}: výška nesedí s atributem`);
  });

  const unused = files.filter(file => !used.has(file));
  assert.deepEqual(unused, [], "v img/ zůstaly nepoužité soubory");
  dom.window.close();
});

test("Styly mají světlý motiv i respekt k redukci pohybu", async () => {
  const css = read("launcher/launcher.css");

  const lightBlock = css.slice(css.indexOf(':root[data-theme="light"] .launcher-page'));
  ["--lp-bg", "--lp-surface", "--lp-text", "--lp-muted", "--lp-line"].forEach(token => {
    assert.ok(lightBlock.includes(`${token}:`), `světlý motiv nedefinuje ${token}`);
  });

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /scroll-margin-top/);
  assert.match(css, /:focus-visible/);

  // Každá akcentní barva z textu musí mít v světlém motivu kontrastní variantu.
  assert.ok(css.includes(':root[data-theme="light"] .launcher-page :is(.lp-tag'), "chybí kontrastní akcenty pro světlý motiv");
});

test("Stahovací tlačítka nikdy netvrdí dokončení", async () => {
  const page = await buildPage("withReleases");
  const { document, window } = page;

  const buttons = [...document.querySelectorAll("[data-launcher-download]")];
  assert.ok(buttons.length >= 3);

  const hero = document.querySelector(".lp-hero [data-launcher-download]");
  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

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
