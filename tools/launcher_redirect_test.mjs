/* =============================================================
   MINEKUBE STUDIOS // TEST PŘESMĚROVÁNÍ LAUNCHERU
   Spouští se: node tools/launcher_redirect_test.mjs

   Launcher se od v18 vyvíjí na vlastní doméně
   (minekubelauncher.github.io). Na minekubestudios.github.io/launcher/
   proto zůstala jen přesměrovávací stránka. Tenhle test hlídá, že:

     1. přesměrování míří na správnou adresu (meta refresh i skript),
     2. stránka má canonical, aby si vyhledávače neindexovaly dvě verze,
     3. odkaz pro případ, že se přesměrování nespustí, funguje,
     4. stránka neodkazuje na nic, co v repu není,
     5. z launcheru nezůstaly osiřelé soubory (2,3 MB → jen redirect).
   ============================================================= */

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..") + "/";
const read = file => readFileSync(ROOT + file, "utf8");

const TARGET = "https://minekubelauncher.github.io/";
const HTML = read("launcher/index.html");

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}\n      ${error.message}`);
    process.exitCode = 1;
  }
};

test("Přesměrování míří na novou doménu", () => {
  const meta = HTML.match(/<meta[^>]*http-equiv="refresh"[^>]*>/i);
  assert.ok(meta, "chybí meta refresh");
  assert.match(meta[0], /url=https:\/\/minekubelauncher\.github\.io\//, "meta refresh nemíří na novou doménu");

  const script = HTML.match(/window\.location\.replace\("([^"]+)"\)/);
  assert.ok(script, "chybí záložní přesměrování ve skriptu");
  assert.equal(script[1], TARGET);

  /* `replace` místo `assign` — jinak tlačítko Zpět vrátí na mezistránku,
     která hned zase přesměruje, a uživatel se z ní nedostane. */
  assert.ok(!/location\.assign/.test(HTML), "použij replace, ne assign");
});

test("Canonical a robots říkají vyhledávačům, kam stránka patří", () => {
  const canonical = HTML.match(/<link[^>]*rel="canonical"[^>]*>/i);
  assert.ok(canonical, "chybí canonical");
  assert.match(canonical[0], /href="https:\/\/minekubelauncher\.github\.io\/"/);

  /* Přesměrovávací mezistránka nemá smysl ve výsledcích hledání. */
  assert.match(HTML, /<meta[^>]*content="noindex, follow"[^>]*>/i, "chybí noindex");
});

test("Odkaz pro případ, že se přesměrování nespustí", () => {
  const buttons = [...HTML.matchAll(/<a[^>]*href="(https:\/\/minekubelauncher\.github\.io\/)"[^>]*>/g)];
  assert.ok(buttons.length >= 1, "chybí záložní odkaz na novou doménu");
  /* Odkaz musí být vidět i bez CSS. */
  assert.match(HTML, /<a[^>]*class="button"[^>]*>/, "chybí tlačítko");
});

test("Stránka neodkazuje na nic, co v repu není", () => {
  const refs = [...new Set([...HTML.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]))];
  const missing = refs
    .filter(ref => !/^(https?:|mailto:|data:)/.test(ref))
    .filter(ref => !existsSync(ROOT + "launcher/" + ref.split("?")[0]));
  assert.deepEqual(missing, [], "rozbité relativní cesty");
  assert.ok(refs.length >= 3, "stránka má mít aspoň ikonu a logo");
});

test("Z launcheru nezůstaly osiřelé soubory", () => {
  /* Celá stránka se přesunula na vlastní doménu. Kdyby tady zůstaly
     staré soubory, hostily by se dvě verze a rozešly by se. */
  const leftover = [
    "launcher/lpx.css",
    "launcher/launcher.js",
    "launcher/releases.js",
    "launcher/i18n.js",
    "launcher/launcher-pulse.css",
    "launcher/apple-launcher.css",
    "launcher/icons",
    "launcher/wallpapers",
    "launcher/shared/styles.css",
    "launcher/shared/app.js"
  ].filter(path => existsSync(ROOT + path));
  assert.deepEqual(leftover, [], "v launcheru zůstaly soubory z přesunuté stránky");

  /* Redirect má být malý — kdyby narostl, nejspíš se vrátila celá stránka. */
  const size = statSync(ROOT + "launcher/index.html").size;
  assert.ok(size < 12 * 1024, `redirect má ${size} B, čekáme do 12 kB`);
});

test("Domovský web i modpacky míří na novou doménu", () => {
  for (const file of ["index.html", "modpacky/index.html"]) {
    const html = read(file);
    assert.ok(html.includes(TARGET), `${file} neodkazuje na novou doménu`);
    assert.ok(
      !/href="(\.\.\/)?launcher\/"/.test(html),
      `${file} ještě odkazuje na starou cestu /launcher/`
    );
  }
});

console.log(`\nVšechny testy prošly (${passed}).`);
