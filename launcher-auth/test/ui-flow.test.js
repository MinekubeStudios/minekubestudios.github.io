"use strict";

/* =============================================================
   TEST PŘIHLAŠOVACÍ OBRAZOVKY (jsdom)
   Ověřuje, že se kroky přepínají, validace hlásí správně
   a že lokální účet nikdy nesáhne na síť.
   Spuštění:  node test/ui-flow.test.js
   ============================================================= */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { JSDOM } = require(process.env.JSDOM_PATH || "/tmp/node_modules/jsdom");

const R = path.join(__dirname, "..", "src", "renderer");
const html = fs.readFileSync(path.join(R, "login.html"), "utf8");
const js = fs.readFileSync(path.join(R, "login.js"), "utf8");

let pass = 0;
const results = [];
function check(name, fn) {
  try {
    fn();
    pass++;
    results.push(`  PASS  ${name}`);
  } catch (err) {
    results.push(`  FAIL  ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* ---- falešné API, které zaznamenává volání ---- */
  const calls = [];
  let statusCb = null;
  const netHits = [];

  const api = {
    list: async () => ({ accounts: [] }),
    active: async () => null,
    validateLocalName: async n => { calls.push(["validate", n]); return { ok: true }; },
    createLocal: async n => {
      calls.push(["createLocal", n]);
      return { ok: true, account: { id: "local:x", type: "local", username: n.trim(), uuid: "u" } };
    },
    startMicrosoft: async () => {
      calls.push(["startMicrosoft"]);
      return { ok: true, userCode: "ABCD-1234", verificationUri: "https://microsoft.com/link", expiresIn: 900 };
    },
    cancelMicrosoft: async () => { calls.push(["cancelMicrosoft"]); return { ok: true }; },
    remove: async () => ({ ok: true }),
    setActive: async () => ({ ok: true }),
    ensureToken: async () => ({ ok: true }),
    openExternal: async u => { calls.push(["openExternal", u]); return { ok: true }; },
    onMicrosoftStatus: cb => { statusCb = cb; return () => {}; }
  };

  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://localhost/" });
  const { window } = dom;
  const doc = window.document;

  window.minekubeAuth = api;
  // jakékoli síťové volání z rendereru = chyba
  window.fetch = (...a) => { netHits.push(a[0]); throw new Error("renderer nesmí volat fetch"); };
  window.navigator.clipboard = { writeText: async () => {} };

  window.eval(js);
  await sleep(30);

  const q = sel => doc.querySelector(sel);
  const step = name => q(`.auth-step[data-step="${name}"]`);
  const pane = name => q(`.auth-ms-pane[data-pane="${name}"]`);
  const visible = node => node && !node.hidden;

  /* ===================== VÝCHOZÍ STAV ===================== */

  check("na startu je vidět výběr účtu", () => {
    assert.ok(visible(step("choose")), "krok 'choose' není vidět");
    assert.ok(!visible(step("microsoft")), "krok 'microsoft' má být skrytý");
    assert.ok(!visible(step("local")), "krok 'local' má být skrytý");
  });

  check("jsou nabídnuté právě dvě možnosti", () => {
    const opts = doc.querySelectorAll('.auth-step[data-step="choose"] .auth-option');
    assert.strictEqual(opts.length, 2, `čekány 2 volby, nalezeno ${opts.length}`);
    const gotos = [...opts].map(o => o.dataset.goto).sort();
    assert.deepStrictEqual(gotos, ["local", "microsoft"]);
  });

  /* ===================== LOKÁLNÍ ÚČET ===================== */

  q('[data-goto="local"]').click();
  await sleep(20);

  check("kliknutí na 'Lokální účet' otevře formulář", () => {
    assert.ok(visible(step("local")), "krok 'local' se neotevřel");
    assert.ok(!visible(step("choose")), "výběr měl zmizet");
  });

  const input = doc.getElementById("local-name");
  const submit = q('[data-action="local-create"]');
  const hint = q("[data-local-hint]");

  check("tlačítko je na začátku zamčené", () => {
    assert.ok(submit.disabled, "tlačítko mělo být disabled");
  });

  const type = async value => {
    input.value = value;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    await sleep(25);
  };

  await type("ab");
  check("krátké jméno je odmítnuto", () => {
    assert.ok(submit.disabled, "tlačítko mělo zůstat zamčené");
    assert.ok(hint.classList.contains("is-error"), "chybí červená hláška");
    assert.match(hint.textContent, /3 znaky/i);
  });

  await type("bad-name!");
  check("neplatné znaky jsou odmítnuty", () => {
    assert.ok(submit.disabled);
    assert.match(hint.textContent, /podtržítko/i);
  });

  await type("Kubik_2011");
  check("platné jméno tlačítko odemkne", () => {
    assert.ok(!submit.disabled, "tlačítko mělo být povolené");
    assert.ok(hint.classList.contains("is-ok"), "chybí zelená hláška");
  });

  check("ukáže se náhled offline UUID", () => {
    const prev = q("[data-local-preview]");
    assert.ok(!prev.hidden, "náhled UUID není vidět");
    assert.match(q("[data-local-uuid]").textContent, /^[0-9a-f-]{36}$/);
  });

  check("náhledové UUID odpovídá hlavnímu procesu", () => {
    const { offlineUUID } = require("../src/auth/offline.js");
    assert.strictEqual(q("[data-local-uuid]").textContent, offlineUUID("Kubik_2011"));
  });

  q('[data-form="local"]').dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await sleep(60);

  check("odeslání vytvoří účet a zobrazí potvrzení", () => {
    assert.ok(calls.some(c => c[0] === "createLocal"), "createLocal nebylo zavoláno");
    assert.ok(visible(step("done")), "potvrzovací krok se nezobrazil");
    assert.strictEqual(q("[data-done-name]").textContent, "Kubik_2011");
  });

  check("lokální účet neudělal ŽÁDNÉ síťové volání", () => {
    assert.strictEqual(netHits.length, 0, `renderer volal síť: ${netHits.join(", ")}`);
    const online = calls.filter(c => c[0] === "startMicrosoft" || c[0] === "openExternal");
    assert.strictEqual(online.length, 0, "lokální cesta sáhla na Microsoft");
  });

  /* ===================== MICROSOFT ===================== */

  q('[data-goto="choose"]')?.click?.();
  const back = [...doc.querySelectorAll('[data-goto="choose"]')][0];
  back.click();
  await sleep(20);
  q('[data-goto="microsoft"]').click();
  await sleep(20);

  check("kliknutí na 'Microsoft účet' otevře jeho krok", () => {
    assert.ok(visible(step("microsoft")), "krok 'microsoft' se neotevřel");
    assert.ok(visible(pane("idle")), "má být vidět úvodní panel");
  });

  q('[data-action="ms-start"]').click();
  await sleep(60);

  check("start zobrazí kód pro hráče", () => {
    assert.ok(calls.some(c => c[0] === "startMicrosoft"), "startMicrosoft nebylo zavoláno");
    assert.ok(visible(pane("code")), "panel s kódem není vidět");
    assert.strictEqual(q("[data-ms-code]").textContent, "ABCD-1234");
  });

  check("odpočet běží", () => {
    assert.match(q("[data-ms-timer]").textContent, /^\d{2}:\d{2}$/);
  });

  q('[data-action="open-link"]').click();
  await sleep(20);
  check("tlačítko otevře stránku Microsoftu v prohlížeči", () => {
    const hit = calls.find(c => c[0] === "openExternal");
    assert.ok(hit, "openExternal nebylo zavoláno");
    assert.strictEqual(hit[1], "https://microsoft.com/link");
  });

  statusCb({ phase: "exchanging" });
  await sleep(20);
  check("stav 'exchanging' přepne na průběh", () => {
    assert.ok(visible(pane("working")), "panel průběhu není vidět");
  });

  statusCb({ phase: "done", account: { username: "MinekubeHrac", type: "microsoft" } });
  await sleep(20);
  check("úspěšné přihlášení zobrazí potvrzení", () => {
    assert.ok(visible(step("done")));
    assert.strictEqual(q("[data-done-name]").textContent, "MinekubeHrac");
  });

  /* ===================== CHYBY ===================== */

  [...doc.querySelectorAll('[data-goto="choose"]')][0].click();
  await sleep(20);
  q('[data-goto="microsoft"]').click();
  await sleep(20);

  statusCb({ phase: "error", code: "auth.ms.err.nogame" });
  await sleep(20);
  check("chyba 'nemá Minecraft' doporučí lokální účet", () => {
    assert.ok(visible(pane("error")), "chybový panel není vidět");
    assert.match(q("[data-ms-error]").textContent, /lokální účet/i);
  });

  statusCb({ phase: "error", code: "auth.ms.err.noclient" });
  await sleep(20);
  check("chybějící client ID se vysvětlí srozumitelně", () => {
    assert.match(q("[data-ms-error]").textContent, /není nastaven/i);
  });

  statusCb({ phase: "error", code: "auth.ms.err.noxbox" });
  await sleep(20);
  check("chybějící Xbox profil má vlastní hlášku", () => {
    assert.match(q("[data-ms-error]").textContent, /Xbox profil/i);
  });

  /* ===================== ZRUŠENÍ ===================== */

  q('[data-action="ms-start"]').click();
  await sleep(60);
  const cancelBtn = q('[data-action="ms-cancel"]');
  cancelBtn.click();
  await sleep(30);

  check("zrušení vrátí na úvodní panel a zastaví čekání", () => {
    assert.ok(calls.some(c => c[0] === "cancelMicrosoft"), "cancelMicrosoft nebylo zavoláno");
    assert.ok(visible(pane("idle")), "nevrátilo se na úvodní panel");
  });

  [...doc.querySelectorAll('[data-goto="choose"]')][0].click();
  await sleep(20);
  check("odchod z Microsoft kroku zruší běžící pokus", () => {
    assert.ok(visible(step("choose")));
    assert.ok(calls.filter(c => c[0] === "cancelMicrosoft").length >= 2);
  });

  /* ===================== PŘÍSTUPNOST ===================== */

  check("obě volby jsou ovladatelné klávesnicí", () => {
    doc.querySelectorAll('.auth-step[data-step="choose"] .auth-option').forEach(o => {
      assert.strictEqual(o.tagName, "BUTTON", "volba není <button>");
      assert.strictEqual(o.getAttribute("type"), "button");
    });
  });

  check("každý krok má nadpis a popisek", () => {
    ["choose", "microsoft", "local"].forEach(n => {
      assert.ok(step(n).querySelector(".auth-title"), `krok ${n} nemá nadpis`);
    });
  });

  console.log("\n=== TEST PŘIHLAŠOVACÍ OBRAZOVKY ===\n");
  console.log(results.join("\n"));
  console.log(`\n${pass}/${pass + (process.exitCode ? results.filter(r => r.includes("FAIL")).length : 0)} prošlo\n`);
})();
