"use strict";

/* =============================================================
   TESTY AUTENTIZAČNÍ LOGIKY
   Spuštění:  node test/auth.test.js
   ============================================================= */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { offlineUUID, validateUsername, createLocalAccount } = require("../src/auth/offline.js");
const { AccountStore } = require("../src/auth/store.js");
const ms = require("../src/auth/microsoft.js");

let pass = 0;
const out = [];

function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { pass++; out.push(`  PASS  ${name}`); })
    .catch(err => { out.push(`  FAIL  ${name}\n        ${err.message}`); process.exitCode = 1; });
}

(async () => {
  /* ===================== OFFLINE UUID ===================== */

  await check("offline UUID souhlasí s vanilla Minecraftem (Notch)", () => {
    // ověřeno proti skutečnému offline UUID, které generuje vanilla server
    assert.strictEqual(offlineUUID("Notch"), "b50ad385-829d-3141-a216-7e7d7539ba7f");
  });

  await check("UUID má správnou verzi (3) a variantu (RFC 4122)", () => {
    const u = offlineUUID("Kubik_2011");
    assert.strictEqual(u[14], "3", "verze má být 3");
    assert.ok(["8", "9", "a", "b"].includes(u[19]), "špatná varianta");
  });

  await check("stejné jméno dá vždy stejné UUID", () => {
    assert.strictEqual(offlineUUID("Hrac"), offlineUUID("Hrac"));
  });

  await check("různá jména dají různá UUID", () => {
    assert.notStrictEqual(offlineUUID("HracA"), offlineUUID("HracB"));
  });

  await check("velikost písmen se rozlišuje (jako ve vanille)", () => {
    assert.notStrictEqual(offlineUUID("hrac"), offlineUUID("Hrac"));
  });

  /* ===================== VALIDACE JMÉNA ===================== */

  await check("platná jména projdou", () => {
    ["abc", "Kubik_2011", "a_B_9", "A".repeat(16)].forEach(n => {
      assert.ok(validateUsername(n).ok, `${n} mělo projít`);
    });
  });

  await check("neplatná jména neprojdou se správným kódem", () => {
    const cases = [
      ["", "auth.local.err.empty"],
      ["  ", "auth.local.err.empty"],
      ["ab", "auth.local.err.short"],
      ["A".repeat(17), "auth.local.err.long"],
      ["bad-name", "auth.local.err.chars"],
      ["mezera tu", "auth.local.err.chars"],
      ["háček", "auth.local.err.chars"],
      ["emoji😀x", "auth.local.err.chars"]
    ];
    cases.forEach(([input, code]) => {
      const r = validateUsername(input);
      assert.ok(!r.ok, `${JSON.stringify(input)} mělo být odmítnuto`);
      assert.strictEqual(r.code, code, `${JSON.stringify(input)} → ${r.code}, čekáno ${code}`);
    });
  });

  await check("jméno se ořízne od mezer", () => {
    const r = createLocalAccount("  Kubik_2011  ");
    assert.ok(r.ok);
    assert.strictEqual(r.account.username, "Kubik_2011");
  });

  /* ===================== LOKÁLNÍ ÚČET ===================== */

  await check("lokální účet nemá žádný token", () => {
    const { account } = createLocalAccount("Kubik_2011");
    assert.strictEqual(account.accessToken, null);
    assert.strictEqual(account.refreshToken, null);
    assert.strictEqual(account.expiresAt, null);
    assert.strictEqual(account.type, "local");
  });

  await check("id lokálního účtu je stabilní", () => {
    assert.strictEqual(
      createLocalAccount("Kubik_2011").account.id,
      createLocalAccount("Kubik_2011").account.id
    );
  });

  /* ===================== ÚLOŽIŠTĚ ===================== */

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mk-test-"));

  await check("prázdné úložiště se načte bez chyby", async () => {
    const s = new AccountStore(tmp);
    await s.load();
    assert.deepStrictEqual(s.list(), []);
    assert.strictEqual(s.getActive(), null);
  });

  await check("účet se uloží a přežije restart", async () => {
    const s = new AccountStore(tmp);
    await s.load();
    await s.upsert(createLocalAccount("Kubik_2011").account);

    const s2 = new AccountStore(tmp);
    await s2.load();
    assert.strictEqual(s2.list().length, 1);
    assert.strictEqual(s2.getActive().username, "Kubik_2011");
  });

  await check("stejné jméno nevytvoří duplicitu", async () => {
    const s = new AccountStore(tmp);
    await s.load();
    await s.upsert(createLocalAccount("Kubik_2011").account);
    assert.strictEqual(s.list().length, 1);
  });

  await check("soubor má práva jen pro vlastníka (0600)", async () => {
    if (process.platform === "win32") return; // na Windows neplatí
    const s = new AccountStore(tmp);
    await s.load();
    const mode = fs.statSync(s.file).mode & 0o777;
    assert.strictEqual(mode, 0o600, `práva jsou ${mode.toString(8)}`);
  });

  await check("safeList neobsahuje žádné tokeny", async () => {
    const s = new AccountStore(tmp);
    await s.load();
    await s.upsert({
      id: "microsoft:test", type: "microsoft", username: "X", uuid: "u",
      accessToken: "TAJNY_TOKEN", refreshToken: "TAJNY_REFRESH", expiresAt: Date.now()
    });
    const json = JSON.stringify(s.safeList());
    assert.ok(!json.includes("TAJNY_TOKEN"), "access token unikl do UI");
    assert.ok(!json.includes("TAJNY_REFRESH"), "refresh token unikl do UI");
  });

  await check("po smazání aktivního účtu se aktivuje jiný", async () => {
    const s = new AccountStore(tmp);
    await s.load();
    const a = createLocalAccount("PrvniHrac").account;
    await s.upsert(a);
    assert.strictEqual(s.getActive().id, a.id);
    await s.remove(a.id);
    assert.notStrictEqual(s.getActive()?.id, a.id);
  });

  await check("poškozený soubor se odloží a launcher nespadne", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mk-bad-"));
    fs.writeFileSync(path.join(dir, "accounts.json"), "{tohle-není-json");
    const s = new AccountStore(dir);
    await s.load();
    assert.deepStrictEqual(s.list(), []);
    assert.ok(fs.readdirSync(dir).some(f => f.includes("corrupt")), "záloha nevznikla");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  fs.rmSync(tmp, { recursive: true, force: true });

  /* ===================== MICROSOFT ===================== */

  await check("nenastavené client ID se pozná", () => {
    assert.ok(!ms.isClientIdConfigured("00000000-0000-0000-0000-000000000000"));
    assert.ok(!ms.isClientIdConfigured(""));
    assert.ok(!ms.isClientIdConfigured("neco-divneho"));
    assert.ok(ms.isClientIdConfigured("389b1b32-b5d5-43b2-bddc-84ce938d6737"));
  });

  await check("vypršení tokenu se vyhodnotí správně", () => {
    assert.ok(ms.isExpired({ type: "microsoft", expiresAt: Date.now() - 1000 }), "prošlý má být expired");
    assert.ok(ms.isExpired({ type: "microsoft", expiresAt: Date.now() + 30_000 }), "30 s je v rezervě");
    assert.ok(!ms.isExpired({ type: "microsoft", expiresAt: Date.now() + 3_600_000 }), "hodina je v pohodě");
    assert.ok(!ms.isExpired({ type: "local" }), "lokální účet nikdy nevyprší");
  });

  await check("bez client ID se nezavolá síť", async () => {
    let called = false;
    const orig = global.fetch;
    global.fetch = () => { called = true; return Promise.reject(new Error("nemělo se volat")); };
    try {
      await ms.requestDeviceCode({ clientId: "00000000-0000-0000-0000-000000000000" });
      throw new Error("mělo to skončit chybou");
    } catch (err) {
      assert.strictEqual(err.code, "auth.ms.err.noclient");
      assert.ok(!called, "síť se přesto volala");
    } finally {
      global.fetch = orig;
    }
  });

  await check("obnovení bez refresh tokenu skončí srozumitelnou chybou", async () => {
    try {
      await ms.refreshAccount({ type: "microsoft", refreshToken: null });
      throw new Error("mělo to skončit chybou");
    } catch (err) {
      assert.strictEqual(err.code, "auth.ms.err.norefresh");
    }
  });

  await check("XSTS chyba 'bez Xbox profilu' má vlastní kód", async () => {
    const orig = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ XErr: 2148916233 })
    });
    try {
      await ms.authorizeXSTS("token");
      throw new Error("mělo to skončit chybou");
    } catch (err) {
      assert.strictEqual(err.code, "auth.ms.err.noxbox");
    } finally {
      global.fetch = orig;
    }
  });

  await check("účet bez Minecraftu (404) se pozná", async () => {
    const orig = global.fetch;
    global.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
    try {
      await ms.fetchProfile("token");
      throw new Error("mělo to skončit chybou");
    } catch (err) {
      assert.strictEqual(err.code, "auth.ms.err.nogame");
    } finally {
      global.fetch = orig;
    }
  });

  await check("UUID z profilu se doplní o pomlčky", async () => {
    const orig = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: "069a79f444e94726a5befca90e38aaf5", name: "Notch" })
    });
    try {
      const p = await ms.fetchProfile("token");
      assert.strictEqual(p.uuid, "069a79f4-44e9-4726-a5be-fca90e38aaf5");
      assert.strictEqual(p.username, "Notch");
    } finally {
      global.fetch = orig;
    }
  });

  console.log("\n=== TESTY AUTENTIZACE ===\n");
  console.log(out.join("\n"));
  const failed = out.filter(l => l.includes("FAIL")).length;
  console.log(`\n${pass}/${pass + failed} prošlo\n`);
})();
