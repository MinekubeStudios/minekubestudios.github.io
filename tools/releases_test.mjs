#!/usr/bin/env node
/* =============================================================
   MINEKUBE STUDIOS // test napojení modpacků na repozitář

   Ověřuje celou cestu od repozitáře MinekubeStudios/modpacky
   k tlačítku na webu:
     • manifest.json   → karta i detail balíčku stahují .mrpack/.zip
     • GitHub API      → záložní cesta, když manifest selže
     • bez sítě        → tlačítko hlásí „Odkaz připravujeme“

   Spuštění (potřebuje jsdom, viz README):
     npm install jsdom --no-audit --no-fund --prefix /tmp/testenv
     node tools/releases_test.mjs
   ============================================================= */

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const require = createRequire(import.meta.url);

/* ===================== jsdom ===================== */

const jsdomCandidates = [
  process.env.JSDOM_PATH,
  "/tmp/testenv/node_modules/jsdom",
  "jsdom"
].filter(Boolean);

const jsdomPath = jsdomCandidates.find(candidate => {
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

const { JSDOM, VirtualConsole } = require(jsdomPath);

/* ===================== FALEŠNÁ DATA ===================== */

const asset = (name, url, size, digest = null) => ({ name, browser_download_url: url, size, digest });

const MANIFEST = {
  schema: 1,
  generated: "2026-09-17T18:00:00.000Z",
  repository: "MinekubeStudios/modpacky",
  packs: {
    ultra: {
      id: "ultra",
      name: "Minekube Ultra",
      released: true,
      latest: {
        tag: "ultra-v1.2.0",
        version: "1.2.0",
        name: "Minekube Ultra 1.2.0",
        channel: "stable",
        published: "2026-09-15T10:00:00Z",
        htmlUrl: "https://github.com/MinekubeStudios/modpacky/releases/tag/ultra-v1.2.0",
        notes: "## Novinky\n- Sodium 0.6 vyladěný pro 1.21.4",
        files: [
          { name: "Minekube-Ultra-1.2.0.mrpack", url: "https://example.test/ultra.mrpack", size: 24 * 1024 * 1024, sha256: "abc123", format: "mrpack", primary: true },
          { name: "Minekube-Ultra-1.2.0.zip", url: "https://example.test/ultra.zip", size: 18 * 1024 * 1024, sha256: "def456", format: "zip", primary: false },
          { name: "Minekube-Ultra-1.2.0.mrpack.sha256", url: "https://example.test/ultra.sha256", size: 80, format: "checksum", primary: false }
        ]
      },
      history: [
        {
          tag: "ultra-v1.1.0",
          version: "1.1.0",
          published: "2026-08-01T10:00:00Z",
          channel: "stable",
          htmlUrl: "https://example.test/v1.1.0",
          files: [{ name: "old.mrpack", url: "https://example.test/old.mrpack", format: "mrpack", primary: true }]
        }
      ]
    },
    performance: { id: "performance", name: "Minekube Performance", released: false, latest: null, history: [] }
  }
};

/* Verze z API: novější beta + starší stabilní vydání → web musí sáhnout
   po stabilním (stejně jako generátor manifestu). */
const API_RELEASES = [
  {
    tag_name: "pvp-v1.21.4-3",
    name: "Minekube PvP 3",
    prerelease: false,
    draft: false,
    published_at: "2026-09-10T10:00:00Z",
    html_url: "https://github.com/MinekubeStudios/modpacky/releases/tag/pvp-v1.21.4-3",
    body: "",
    assets: [asset("Minekube-PvP-3.mrpack", "https://example.test/pvp.mrpack", 5 * 1024 * 1024, "sha256:pvp123")]
  },
  {
    tag_name: "pvp-v1.21.4-4-beta.1",
    name: "Minekube PvP 4 beta",
    prerelease: true,
    draft: false,
    published_at: "2026-09-16T10:00:00Z",
    html_url: "https://example.test/pvp-beta",
    body: "",
    assets: [asset("Minekube-PvP-4-beta.mrpack", "https://example.test/pvp-beta.mrpack", 5 * 1024 * 1024)]
  }
];

/* ===================== POMOCNÉ ===================== */

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const checks = [];
const check = (label, ok, detail = "") => checks.push({ label, ok: Boolean(ok), detail });

async function openPage(fetchImpl, query = "") {
  /* Statický server, aby si jsdom načetl ../app.js, releases.js i styles.css. */
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://localhost").pathname.replace(/^\//, "") || "index.html";
    try {
      const body = readFileSync(join(ROOT, path));
      response.writeHead(200, { "content-type": MIME[extname(path)] || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });

  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const port = server.address().port;

  const virtualConsole = new VirtualConsole();
  const pageErrors = [];
  virtualConsole.on("jsdomError", error => pageErrors.push(error.message));

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/modpacky/index.html${query}`, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.fetch = fetchImpl;
      window.scrollTo = () => {};
      /* jsdom neumí matchMedia ani animace — app.js je potřebuje. */
      window.matchMedia = query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false
      });
      window.requestAnimationFrame = callback => window.setTimeout(() => callback(Date.now()), 0);
      window.cancelAnimationFrame = id => window.clearTimeout(id);
    }
  });

  const wait = ms => new Promise(done => dom.window.setTimeout(done, ms));
  await wait(2500);

  return { dom, server, wait, pageErrors, close: () => server.close() };
}

const json = data => Promise.resolve({ ok: true, status: 200, json: async () => data });
const missing = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}) });

/* Přístup k datům, která si stránka načetla (releases.js). */
const releasesSource = page => page.dom.window.MinekubeReleases.status().source;
const releasesChecksum = (page, id) =>
  page.dom.window.MinekubeReleases.latest(id)?.files.find(file => file.sha256)?.sha256 || null;

/* ===================== SCÉNÁŘE ===================== */

async function scenarioManifest() {
  const page = await openPage(url =>
    String(url).includes("raw.githubusercontent.com") ? json(MANIFEST) : missing()
  );

  const { document, MouseEvent } = page.dom.window;
  const text = selector => document.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim() || "";
  const href = selector => document.querySelector(selector)?.getAttribute("href") || "";

  check("manifest: karta má řádek s vydáním", Boolean(document.querySelector("#pack-ultra .pack-release-row")));
  check("manifest: verze na kartě", text("#pack-ultra .pack-release-chip b") === "1.2.0", text("#pack-ultra .pack-release-chip b"));
  check("manifest: tlačítko míří na .mrpack", href("#pack-ultra [data-download]") === "https://example.test/ultra.mrpack", href("#pack-ultra [data-download]"));
  check("manifest: popisek tlačítka je .mrpack", /mrpack/.test(text("#pack-ultra [data-download] .download-label")));
  check("manifest: nabízí i .zip", href("#pack-ultra .pack-alt-download") === "https://example.test/ultra.zip");
  check("manifest: balíček bez vydání zůstal „připravujeme“", Boolean(document.querySelector("#pack-performance .release-pending-button")));
  check("manifest: stav balíčku je „stabilní“", /stabiln|stable/i.test(text("#pack-ultra .release-state")), text("#pack-ultra .release-state"));
  check("manifest: všech 5 balíčků se vykreslilo", document.querySelectorAll(".pack-card").length === 5);

  document.querySelector("#pack-ultra [data-details]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await page.wait(500);

  const modal = document.getElementById("modalContent");
  check("manifest: detail se otevřel", document.getElementById("modalBackdrop").hidden === false);
  check("manifest: dvě tlačítka ke stažení (.mrpack + .zip)", modal.querySelectorAll(".modal-release-button").length === 2);
  check("manifest: tlačítko v detailu míří na soubor", modal.querySelector(".modal-release-button")?.getAttribute("href") === "https://example.test/ultra.mrpack");
  check("manifest: checksum je vidět", modal.querySelector(".modal-release-meta p")?.textContent.trim() === "abc123");
  check("manifest: odkaz na stránku vydání", href(".modal-release-links a").includes("/releases/tag/ultra-v1.2.0"));
  check("manifest: changelog z vydání", /Sodium 0\.6/.test(modal.querySelector(".modal-release-notes p")?.textContent || ""));
  check("manifest: starší vydání v seznamu", /1\.1\.0/.test(modal.querySelector(".modal-release-history")?.textContent || ""));
  check("manifest: odkaz na repozitář v sekci instalace", href("[data-repo-link]").includes("MinekubeStudios/modpacky"));
  check("manifest: stránka bez chyb", page.pageErrors.length === 0, page.pageErrors.join(" | "));

  page.close();
}

async function scenarioApiFallback() {
  const page = await openPage(url =>
    String(url).includes("api.github.com") ? json(API_RELEASES) : missing()
  );

  const { document } = page.dom.window;
  const href = selector => document.querySelector(selector)?.getAttribute("href") || "";

  check("api: bez manifestu se použije GitHub API", releasesSource(page) === "api", String(releasesSource(page)));
  check("api: stabilní vydání má přednost před novější betou", href("#pack-pvp [data-download]") === "https://example.test/pvp.mrpack", href("#pack-pvp [data-download]"));
  check("api: historie obsahuje i betu", page.dom.window.MinekubeReleases.pack("pvp").history.some(entry => entry.channel === "beta"));
  check("api: sha256 z GitHub digestu je k dispozici", releasesChecksum(page, "pvp") === "pvp123", String(releasesChecksum(page, "pvp")));
  /* Ultra v API žádné vydání nemá — musí zůstat záložní ruční zrcadlo (Game Jolt). */
  check("api: balíčky bez vydání hlásí „odkaz připravujeme“", document.querySelectorAll(".release-pending-button").length === 3, String(document.querySelectorAll(".release-pending-button").length));
  check("api: balíček bez vydání použije záložní zrcadlo", href("#pack-ultra [data-download]").includes("gamejolt"), href("#pack-ultra [data-download]"));

  page.close();
}

async function scenarioDemo() {
  /* ?releases=demo — ukázková data z repa webu, ať se dá UI prohlédnout
     i bez publikovaného vydání (a ať zůstane validní JSON). */
  const demo = JSON.parse(readFileSync(join(ROOT, "modpacky", "manifest.demo.json"), "utf8"));
  const page = await openPage(url => (String(url).includes("manifest.demo.json") ? json(demo) : missing()), "?releases=demo");

  const { document } = page.dom.window;
  const text = selector => document.querySelector(selector)?.textContent.replace(/\s+/g, " ").trim() || "";

  check("demo: zdroj dat je ukázkový manifest", releasesSource(page) === "demo", String(releasesSource(page)));
  check("demo: karta Ultra má řádek s vydáním", text("#pack-ultra .pack-release-chip b") === "1.2.0", text("#pack-ultra .pack-release-chip b"));
  check("demo: ukázkový manifest obsahuje i beta vydání", page.dom.window.MinekubeReleases.pack("ultra").history.some(entry => entry.channel === "beta"));
  check("demo: performance zůstal bez vydání", Boolean(document.querySelector("#pack-performance .release-pending-button")));

  page.close();
}

async function scenarioOffline() {
  const page = await openPage(() => missing());
  const { document } = page.dom.window;
  const href = selector => document.querySelector(selector)?.getAttribute("href") || "";

  /* Bez sítě i bez vydání: 4 balíčky hlásí „odkaz připravujeme“,
     Ultra má ještě ruční zrcadlo z MODPACKS, takže zůstane funkční. */
  check("offline: balíčky bez vydání hlásí „odkaz připravujeme“", document.querySelectorAll(".release-pending-button").length === 4, String(document.querySelectorAll(".release-pending-button").length));
  check("offline: ruční zrcadlo zůstalo funkční", href("#pack-ultra [data-download]").includes("gamejolt"), href("#pack-ultra [data-download]"));
  check("offline: žádný řádek s vydáním", document.querySelectorAll(".pack-release-row").length === 0);
  check("offline: stránka stále funguje (karty vykreslené)", document.querySelectorAll(".pack-card").length === 5);

  page.close();
}

/* ===================== SPUŠTĚNÍ ===================== */

if (!existsSync(join(ROOT, "modpacky", "releases.js"))) {
  console.error("✗ Spouštěj z kořene repozitáře webu.");
  process.exit(1);
}

await scenarioManifest();
await scenarioApiFallback();
await scenarioDemo();
await scenarioOffline();

for (const item of checks) {
  const mark = item.ok ? "\u001b[32m✓\u001b[0m" : "\u001b[31m✗\u001b[0m";
  console.log(`${mark} ${item.label}${item.ok || !item.detail ? "" : ` \u001b[2m(${item.detail})\u001b[0m`}`);
}

const failed = checks.filter(item => !item.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} kontrol prošlo.`);
process.exit(failed ? 1 : 0);
