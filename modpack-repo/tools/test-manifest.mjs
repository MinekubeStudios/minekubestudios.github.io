#!/usr/bin/env node
/* =============================================================
   MINEKUBE STUDIOS // modpacky — test generátoru manifestu

   Spustí build-manifest.mjs proti falešnému GitHub API s ukázkovými
   vydáními a ověří, že se z nich vybere správné „nejnovější vydání“,
   že se ignorují neznámé tagy a že se soubory seřadí správně.

   Použití:  node tools/test-manifest.mjs
   ============================================================= */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const asset = (name, url, size, digest = null) => ({
  name,
  browser_download_url: url,
  size,
  digest,
  download_count: 0
});

const release = ({ tag, name, prerelease = false, draft = false, published, body = "", assets = [] }) => ({
  tag_name: tag,
  name,
  prerelease,
  draft,
  published_at: published,
  created_at: published,
  html_url: `https://github.com/minekube/test/releases/tag/${tag}`,
  body,
  assets
});

/* Ukázková vydání — schválně v náhodném pořadí a s neznámým tagem. */
const FIXTURES = [
  release({
    tag: "napadny-tag-v9",
    name: "Neznámý balíček",
    published: "2026-09-16T10:00:00Z",
    assets: [asset("neco.zip", "https://example.test/neco.zip", 10)]
  }),
  release({
    tag: "ultra-v1.2.0",
    name: "Minekube Ultra 1.2.0",
    published: "2026-09-15T10:00:00Z",
    body: "## Novinky\n\nMinecraft: 1.21.4\nLoader: Fabric\n\n- Sodium 0.6",
    assets: [
      asset("Minekube-Ultra-1.2.0.zip", "https://example.test/ultra.zip", 20 * 1024 * 1024, null),
      asset("Minekube-Ultra-1.2.0.mrpack", "https://example.test/ultra.mrpack", 24 * 1024 * 1024, "sha256:abc123"),
      asset("Minekube-Ultra-1.2.0.mrpack.sha256", "https://example.test/ultra.sha256", 80)
    ]
  }),
  release({
    tag: "ultra-v1.3.0-beta.1",
    name: "Minekube Ultra 1.3.0 beta",
    prerelease: true,
    published: "2026-09-17T10:00:00Z",
    assets: [asset("Minekube-Ultra-1.3.0-beta.1.mrpack", "https://example.test/ultra-beta.mrpack", 25 * 1024 * 1024)]
  }),
  release({
    tag: "ultra-v1.1.0",
    name: "Minekube Ultra 1.1.0",
    published: "2026-08-01T10:00:00Z",
    assets: [asset("Minekube-Ultra-1.1.0.mrpack", "https://example.test/ultra-1.1.mrpack", 23 * 1024 * 1024)]
  }),
  release({
    tag: "pvp-v1.21.4-3",
    name: "Minekube PvP 3",
    published: "2026-09-10T10:00:00Z",
    assets: [asset("Minekube-PvP-3.zip", "https://example.test/pvp.zip", 5 * 1024 * 1024)]
  }),
  release({
    tag: "lite-v0.9.0",
    name: "Koncept",
    draft: true,
    published: "2026-09-18T10:00:00Z",
    assets: [asset("lite.mrpack", "https://example.test/lite.mrpack", 1024)]
  })
];

const checks = [];
const check = (label, condition, detail = "") => checks.push({ label, ok: Boolean(condition), detail });

async function main() {
  const server = createServer((request, response) => {
    if (request.url.startsWith("/repos/minekube/test/releases")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(FIXTURES));
      return;
    }
    response.writeHead(404, { "content-type": "application/json" });
    response.end('{"message":"Not Found"}');
  });

  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const port = server.address().port;

  const outDir = mkdtempSync(join(tmpdir(), "minekube-manifest-"));
  const outFile = join(outDir, "manifest.json");

  // Spouštíme asynchronně — synchronní spawn by zablokoval smyčku událostí
  // a falešné API by nemohlo odpovědět (uvnitř jednoho procesu).
  const result = await new Promise(done => {
    const child = spawn(
      process.execPath,
      [join(ROOT, "tools", "build-manifest.mjs"), "--repo", "minekube/test", "--out", outFile, "--quiet"],
      { env: { ...process.env, GITHUB_API_URL: `http://127.0.0.1:${port}` } }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("close", status => done({ status, stdout, stderr }));
  });

  server.close();

  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    console.error("✗ Generátor skončil chybou.");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(outFile, "utf8"));
  rmSync(outDir, { recursive: true, force: true });

  const ultra = manifest.packs.ultra;
  const pvp = manifest.packs.pvp;
  const lite = manifest.packs.lite;

  check("manifest má schéma 1", manifest.schema === 1);
  check("obsahuje všech 5 balíčků", Object.keys(manifest.packs).length === 5, Object.keys(manifest.packs).join(", "));
  check("zahrnuje i balíčky bez vydání", manifest.packs.vanilla.latest === null);

  check("nejnovější stabilní vydání vyhrálo nad novější betou", ultra.latest.tag === "ultra-v1.2.0", ultra.latest?.tag);
  check("verze je bez prefixu balíčku", ultra.latest.version === "1.2.0", ultra.latest.version);
  check("kanál je stable", ultra.latest.channel === "stable");
  check("popis vydání se přenesl", ultra.latest.notes.includes("Sodium 0.6"));
  check("Minecraft se přečetl z popisu", ultra.latest.mc === "1.21.4", ultra.latest.mc);
  check("loader se přečetl z popisu", ultra.latest.loader === "Fabric", ultra.latest.loader);

  const files = ultra.latest.files;
  check("soubory: mrpack první", files[0].format === "mrpack", files.map(f => f.format).join(" > "));
  check("soubory: mrpack je primary", files[0].primary === true && files[0].name.endsWith(".mrpack"));
  check("soubory: zip je druhý", files[1].format === "zip");
  check("soubor: sha256 z GitHub digestu", files[0].sha256 === "abc123", String(files[0].sha256));
  check("checksum soubor je klasifikovaný", files.some(f => f.format === "checksum"));
  check("jen jeden soubor je primary", files.filter(f => f.primary).length === 1);

  check("historie obsahuje 1.1.0 i betu", ultra.history.map(e => e.tag).join(",") === "ultra-v1.3.0-beta.1,ultra-v1.1.0", ultra.history.map(e => e.tag).join(","));
  check("historie je řazená od nejnovějšího", ultra.history[0].published > ultra.history[1].published);

  check("beta má kanál beta", ultra.history[0].channel === "beta");
  check("verze s pomlčkou (pvp-v1.21.4-3) sedí", pvp.latest.version === "1.21.4-3", pvp.latest.version);
  check("balíček jen se zipem má primary zip", pvp.latest.files[0].format === "zip" && pvp.latest.files[0].primary === true);
  check("koncept (draft) se ignoruje", lite.latest === null);
  check("balíček bez vydání má released: false", lite.released === false);
  check("balíček s vydáním má released: true", ultra.released === true);
  check("neznámý tag se do manifestu nedostal", !JSON.stringify(manifest).includes("napadny-tag"));

  const failed = checks.filter(item => !item.ok);
  for (const item of checks) {
    console.log(`${item.ok ? "\u001b[32m✓\u001b[0m" : "\u001b[31m✗\u001b[0m"} ${item.label}${item.ok || !item.detail ? "" : ` \u001b[2m(${item.detail})\u001b[0m`}`);
  }

  console.log(`\n${checks.length - failed.length}/${checks.length} kontrol prošlo.`);
  process.exit(failed.length ? 1 : 0);
}

if (!existsSync(join(ROOT, "tools", "build-manifest.mjs"))) {
  console.error("✗ Spouštěj z kořene repozitáře modpacky.");
  process.exit(1);
}

main().catch(error => {
  console.error(`✗ ${error.stack || error}`);
  process.exit(1);
});
