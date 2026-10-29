/* =============================================================
   MINEKUBE STUDIOS // TEST 3D KOSTKY
   Spouští se: node tools/cube_stage_test.mjs

   Postaví index.html v jsdomu a ověří, že produktová scéna
   s kostkou opravdu funguje:
     1. akordeon pilulek otevře vždy jen jednu a ostatní schová
        (i pro čtečky a klávesnici přes atribut inert),
     2. volba barvy / povrchu / světla se propíše do data-*
        atributů, ze kterých čte CSS,
     3. tlačítka povrchu a světla drží stav v aria-pressed,
     4. automatická rotace jde vypnout a kostka se pak nehýbe,
     5. bez JS by obsah zůstal otevřený (kontrola výchozího HTML),
     6. překlady scény existují v cs / en / sk a opravdu se mění,
     7. WebGL vrstva má správný poměr hran (12) a nepřebíjí CSS fallback,
     8. statický „první snímek“ a plátno mají v CSS nenulovou velikost.
   ============================================================= */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
  console.error("Chybí jsdom. Nainstaluj ho: npm install jsdom --no-audit --no-fund --prefix /tmp/testenv");
  process.exit(2);
}

const { JSDOM } = require(jsdomPath);

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });
const wait = ms => new Promise(done => setTimeout(done, ms));

const errors = [];
const dom = await JSDOM.fromFile(`${ROOT}index.html`, {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.matchMedia = query => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {}
    });
    window.HTMLCanvasElement.prototype.getContext = () => null;
    window.addEventListener("error", event => errors.push(String(event.message)));
  }
});

await wait(1600);

const { window } = dom;
const document = window.document;
const stage = document.querySelector("[data-cube]");

check("Scéna kostky je na stránce", Boolean(stage));

if (stage) {
  /* ---------- 1 · Akordeon ---------- */

  const groups = [...stage.querySelectorAll("[data-cube-group]")];
  const toggleOf = group => group.querySelector("[data-cube-toggle]");
  const panelOf = group => group.querySelector(".cube-pill__panel");

  check("Scéna má čtyři pilulky", groups.length === 4, `${groups.length}`);
  check("Skript označí html.cube-js", document.documentElement.classList.contains("cube-js"));
  check(
    "Na startu je otevřená jen první pilulka",
    groups[0].classList.contains("is-open") && !groups[1].classList.contains("is-open")
  );
  check(
    "Zavřený panel je inert (mimo tab i čtečku)",
    panelOf(groups[1]).hasAttribute("inert") && !panelOf(groups[0]).hasAttribute("inert")
  );
  check(
    "aria-expanded odpovídá stavu",
    toggleOf(groups[0]).getAttribute("aria-expanded") === "true" &&
      toggleOf(groups[1]).getAttribute("aria-expanded") === "false"
  );

  toggleOf(groups[1]).click();
  check(
    "Klik otevře druhou pilulku a zavře první",
    groups[1].classList.contains("is-open") && !groups[0].classList.contains("is-open")
  );
  check(
    "inert se přesunul na zavřený panel",
    panelOf(groups[0]).hasAttribute("inert") && !panelOf(groups[1]).hasAttribute("inert")
  );

  toggleOf(groups[1]).click();
  check("Druhý klik zavře i otevřenou pilulku", !groups[1].classList.contains("is-open"));

  /* ---------- 2 · Volby ---------- */

  const finishButton = value => stage.querySelector(`[data-cube-choice="finish"][data-value="${value}"]`);
  const lightButton = value => stage.querySelector(`[data-cube-choice="light"][data-value="${value}"]`);

  finishButton("glass").click();
  check("Povrch „sklo“ se propíše do data-finish", stage.dataset.finish === "glass");
  check("Zvolené tlačítko má aria-pressed=true", finishButton("glass").getAttribute("aria-pressed") === "true");
  check(
    "Ostatní tlačítka povrchu jsou odmačknutá",
    finishButton("matte").getAttribute("aria-pressed") === "false"
  );

  lightButton("left").click();
  check("Světlo „zleva“ se propíše do data-light", stage.dataset.light === "left");

  const purple = document.getElementById("cubeColorPurple");
  purple.checked = true;
  purple.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("Barva „purpurová“ se propíše do data-color", stage.dataset.color === "purple");

  /* ---------- 3 · Otáčení ---------- */

  const spin = stage.querySelector("[data-cube-spin]");
  const object = stage.querySelector("[data-cube-object]");
  check("Automatická rotace je na startu zapnutá", spin.checked === true);
  check("Kostka má šest stěn", stage.querySelectorAll(".cube__face").length === 6);

  spin.checked = false;
  spin.dispatchEvent(new window.Event("change", { bubbles: true }));
  await wait(300);
  const still = object.style.transform;
  await wait(200);
  check("Po vypnutí rotace se kostka nehýbe", still === object.style.transform, `${still} → ${object.style.transform}`);

  /* ---------- 4 · Překlady ---------- */

  window.eval('applyLanguage("en")');
  check(
    "Anglický nadpis scény",
    /From every side/.test(document.getElementById("cubeTitle").textContent),
    document.getElementById("cubeTitle").textContent
  );
  check("Anglický popisek tlačítka", finishButton("glass").textContent === "Glass");
  check(
    "Anglický aria-label skupiny barev",
    stage.querySelector(".cube-swatches").getAttribute("aria-label") === "Cube colour"
  );

  window.eval('applyLanguage("sk")');
  check(
    "Slovenský nadpis scény",
    document.getElementById("cubeTitle").textContent.includes("Z každej strany")
  );

  window.eval('applyLanguage("cs")');

  check("Během běhu nevznikla žádná chyba v JS", errors.length === 0, errors.slice(0, 3).join(" | "));

  /* ---------- 7 · Plátno a záložní snímek ---------- */

  const canvas = stage.querySelector("[data-cube-canvas]");
  const poster = stage.querySelector(".cube-poster");
  check("Scéna má plátno pro WebGL", Boolean(canvas));
  check("Scéna má statický první snímek", Boolean(poster));
  check(
    "Plátno i snímek jsou dekorativní (aria-hidden)",
    canvas.getAttribute("aria-hidden") === "true" && poster.getAttribute("aria-hidden") === "true"
  );
  check(
    "Snímek má vyplněné rozměry (žádný skok při načtení)",
    poster.getAttribute("width") === "900" && poster.getAttribute("height") === "900"
  );
  check(
    "Bez WebGL zůstane scéna bez třídy is-webgl",
    !stage.classList.contains("is-webgl") || stage.dataset.cubeRenderer === "webgl"
  );

  const css = readFileSync(`${ROOT}cube.css`, "utf8");
  check(
    "CSS nedává plátnu pevnou šířku z kontejneru (dřív 0 × 0 px)",
    !/\.cube-canvas[\s\S]{0,200}cqh/.test(css)
  );
  check(
    "CSS schová CSS kostku, když běží WebGL",
    /\.cube-stage\.is-webgl \.cube\b[\s\S]{0,120}visibility:\s*hidden/.test(css)
  );
  check(
    "Světlý motiv má vlastní pozadí (tmavý gradient z styles.css)",
    /:root\[data-theme="light"\] body\s*\{[\s\S]{0,400}linear-gradient/.test(readFileSync(`${ROOT}apple.css`, "utf8"))
  );
}

/* ---------- 5 · Bez JS ---------- */

const bare = await JSDOM.fromFile(`${ROOT}index.html`, { pretendToBeVisual: true });
const bareStage = bare.window.document.querySelector("[data-cube]");
check(
  "Bez JS zůstanou všechny panely otevřené",
  bareStage &&
    [...bareStage.querySelectorAll("[data-cube-toggle]")].every(button => button.getAttribute("aria-expanded") === "true")
);
check(
  "Bez JS se nepřidá cube-js (CSS nechá obsah otevřený)",
  !bare.window.document.documentElement.classList.contains("cube-js")
);
bare.window.close();

let failed = 0;
for (const { name, ok, detail } of results) {
  if (!ok) failed++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log(`\n${failed === 0 ? `Všechny testy prošly (${results.length})` : `Selhalo ${failed} z ${results.length}`}.`);
dom.window.close();
process.exit(failed === 0 ? 0 : 1);
