/* =============================================================
   MINEKUBE STUDIOS // TEST STRÁNKY LAUNCHER
   Spouští se: node tools/launcher_page_test.mjs

   Postaví stránku launcher/index.html v jsdom, podstrčí jí
   nahrávací GitHub API a ověří, že:
     1. Windows je živá platforma a stáhne se soubor z repozitáře,
     2. macOS a Linux jsou „v plánu“ a nic nestahují,
     3. když Releases API nic nemá, web najde instalátor v obsahu
        repozitáře,
     4. když GitHub API vůbec neodpovídá, použije se záložní adresa,
     5. přepnutí jazyka překreslí dynamické texty.
   ============================================================= */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
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
   které pak používá launcher.js). */
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

const EXE = "Minekube Launcher_1.0.0-local_x64-setup.exe";
const EXE_URL = `https://raw.githubusercontent.com/MinekubeStudios/MinekubeLauncher/main/${encodeURIComponent(EXE)}`;

/* ===================== NAHRÁVAČE ===================== */

function scenarios() {
  return {
    // Repozitář zatím nemá Releases — instalátor leží přímo ve větvi.
    repoOnly(url) {
      if (url.includes("/releases?")) return { status: 200, body: [] };
      if (url.includes("/contents/")) {
        return {
          status: 200,
          body: [
            { type: "file", name: EXE, size: 24691528, download_url: EXE_URL },
            { type: "file", name: "README.md", size: 18, download_url: "https://example.invalid/README.md" },
            { type: "file", name: "source-code .zip", size: 19019056, download_url: "https://example.invalid/src.zip" }
          ]
        };
      }
      return { status: 404, body: { message: "Not Found" } };
    },

    // Plnohodnotné vydání s přílohami pro všechny tři systémy.
    withReleases(url) {
      if (url.includes("/releases?")) {
        return {
          status: 200,
          body: [
            {
              tag_name: "v1.1.0",
              draft: false,
              html_url: "https://github.com/MinekubeStudios/MinekubeLauncher/releases/tag/v1.1.0",
              assets: [
                { name: "MinekubeLauncher_1.1.0_x64-setup.exe", size: 25000000, browser_download_url: "https://example.invalid/win.exe" },
                { name: "MinekubeLauncher_1.1.0_aarch64.dmg", size: 26000000, browser_download_url: "https://example.invalid/mac.dmg" },
                { name: "MinekubeLauncher_1.1.0_amd64.AppImage", size: 27000000, browser_download_url: "https://example.invalid/linux.appimage" },
                { name: "MinekubeLauncher_1.1.0_x64-setup.exe.sig", size: 100, browser_download_url: "https://example.invalid/sig" }
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
    }
  };
}

async function buildPage(scenario, { userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } = {}) {
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
  await new Promise(resolve => window.setTimeout(resolve, 40));

  return { dom, window, document: window.document, downloads, requests, errors };
}

const tick = (window, ms = 40) => new Promise(resolve => window.setTimeout(resolve, ms));

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
  assert.equal(Releases.asset("windows").name, EXE);

  const hero = document.querySelector(".launcher-download-btn[data-launcher-download]");
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

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(downloads.length, 1, "klik musí spustit právě jedno stažení");
  assert.ok(downloads[0].href.includes("Minekube%20Launcher_1.0.0-local_x64-setup.exe"), downloads[0].href);
  assert.ok(downloads[0].href.includes("githubusercontent.com/MinekubeStudios/MinekubeLauncher/main/"), downloads[0].href);
  assert.equal(hero.dataset.state, "downloading");

  await tick(window, 1800);
  assert.equal(hero.dataset.state, "done");

  assert.deepEqual(page.errors, []);
});

test("macOS a Linux jsou v plánu a nic nestahují", async () => {
  const page = await buildPage("withReleases");
  const { document, window, downloads } = page;

  assert.equal(window.MinekubeLauncherReleases.status().source, "releases");
  assert.equal(window.MinekubeLauncherReleases.asset("windows").name, "MinekubeLauncher_1.1.0_x64-setup.exe");

  for (const os of ["macos", "linux"]) {
    const chip = document.querySelector(`.launcher-os-chip[data-os="${os}"]`);
    assert.equal(chip.dataset.status, "planned");
    assert.ok(chip.classList.contains("is-planned"));
    assert.match(chip.textContent, /V plánu|Planned/);

    chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(document.querySelector(".launcher-download-btn").dataset.os, os);
    assert.equal(document.querySelector(".launcher-download-btn").dataset.state, "planned");
    assert.match(text(document, "[data-os-label]"), /v plánu|still planned/i);

    document.querySelector(".launcher-download-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const card = document.querySelector(`.launcher-platform-btn[data-os="${os}"]`);
    assert.equal(card.dataset.state, "planned");
    card.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  }

  assert.equal(downloads.length, 0, "platformy v plánu nesmí nic stahovat");
  assert.deepEqual(page.errors, []);
});

test("Návštěvník na macOS dostane Windows a vysvětlení", async () => {
  const page = await buildPage("repoOnly", {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
  });
  const { document, window } = page;

  assert.equal(document.querySelector(".launcher-download-btn").dataset.os, "windows");
  assert.equal(document.querySelector(".launcher-os-chip.is-active").dataset.os, "windows");
  assert.equal(document.getElementById("toast").classList.contains("show"), true);
  assert.match(document.querySelector(".toast-message").textContent, /macOS/);
  assert.deepEqual(page.errors, []);
});

test("Když GitHub API mlčí, použije se záložní adresa z repozitáře", async () => {
  const page = await buildPage("down");
  const { document, window, downloads } = page;
  const Releases = window.MinekubeLauncherReleases;

  assert.equal(Releases.status().source, "fallback");
  assert.equal(Releases.status().degraded, true);
  assert.equal(Releases.isAvailable("windows"), true);

  const hero = document.querySelector(".launcher-download-btn[data-launcher-download]");
  assert.equal(hero.dataset.state, "idle");

  hero.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(downloads.length, 1);
  assert.ok(downloads[0].href.startsWith("https://github.com/MinekubeStudios/MinekubeLauncher/raw/main/"), downloads[0].href);
  assert.deepEqual(page.errors, []);
});

test("Přepnutí jazyka překreslí texty i stav tlačítka", async () => {
  const page = await buildPage("repoOnly");
  const { document, window } = page;

  window.eval(`applyLanguage("en")`);
  await tick(window);
  assert.equal(text(document, "[data-launcher-version]"), "v1.0.0-local");
  assert.match(text(document, "[data-os-label]"), /^Download for Windows$/);
  assert.match(text(document, "[data-os-sub]"), /MB/);
  assert.equal(text(document, ".launcher-platforms .launcher-platform.is-planned .launcher-platform-btn span"), "Planned");

  window.eval(`applyLanguage("sk")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stiahnuť pre Windows$/);

  window.eval(`applyLanguage("cs")`);
  await tick(window);
  assert.match(text(document, "[data-os-label]"), /^Stáhnout pro Windows$/);
  assert.deepEqual(page.errors, []);
});

test("Odkazy na repozitář vedou na MinekubeLauncher", async () => {
  const page = await buildPage("repoOnly");
  const { document } = page;

  const links = [...document.querySelectorAll("[data-launcher-repo]")];
  assert.ok(links.length >= 2, "čekáme odkaz v hero sekci i v open-source poznámce");
  links.forEach(link => {
    assert.equal(link.getAttribute("href"), "https://github.com/MinekubeStudios/MinekubeLauncher");
  });
  assert.deepEqual(page.errors, []);
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
