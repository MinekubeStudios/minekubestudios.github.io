#!/usr/bin/env node
/* =============================================================
   MINEKUBE STUDIOS // modpacky — kontrola vydání

   Zkontroluje, že právě publikované vydání dodržuje konvence:
     • tag má tvar <pack-id>-v<verze> a balíček existuje v packs/
     • vydání má aspoň jeden soubor .mrpack nebo .zip
     • ke každému balíčku existuje i .sha256 (jinak varování)

   Používá se ve workflow „Kontrola vydání“ a dá se spustit i ručně:
     node tools/validate-release.mjs --tag ultra-v1.2.0
   ============================================================= */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const API_BASE = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");

const argv = process.argv.slice(2);
const opts = {
  tag: process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || null,
  repo: process.env.GITHUB_REPOSITORY || null,
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null
};

for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--tag") opts.tag = argv[++i];
  else if (argv[i] === "--repo") opts.repo = argv[++i];
  else if (argv[i] === "--token") opts.token = argv[++i];
}

const errors = [];
const warnings = [];
const infos = [];

if (!opts.tag) {
  console.error("✗ Chybí --tag (nebo RELEASE_TAG / GITHUB_REF_NAME).");
  process.exit(1);
}

if (!opts.repo) {
  console.error("✗ Chybí --repo (nebo GITHUB_REPOSITORY).");
  process.exit(1);
}

function readPackIds() {
  const dir = join(ROOT, "packs");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const file = join(dir, entry.name, "pack.json");
      if (!existsSync(file)) return entry.name;
      try {
        return JSON.parse(readFileSync(file, "utf8")).id || entry.name;
      } catch {
        return entry.name;
      }
    });
}

const classify = name => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mrpack") || lower.endsWith(".mrpack.zip")) return "mrpack";
  if (/\.(sha256|sha512|sha1|md5)(\.txt)?$/i.test(lower)) return "checksum";
  if (lower.endsWith(".zip")) return "zip";
  return "other";
};

async function main() {
  const packIds = readPackIds();
  const match = /^(?<prefix>[a-z0-9][a-z0-9._-]*?)-v(?<version>[0-9][^/]*)$/i.exec(opts.tag);

  if (!match) {
    errors.push(`Tag „${opts.tag}“ nemá tvar <pack-id>-v<verze>, například ultra-v1.2.0.`);
  } else if (!packIds.includes(match.groups.prefix.toLowerCase())) {
    errors.push(
      `Tag odkazuje na balíček „${match.groups.prefix}“, ale v packs/ žádný takový není ` +
        `(známé: ${packIds.join(", ") || "žádné"}).`
    );
  } else {
    infos.push(`Balíček: ${match.groups.prefix} · verze: ${match.groups.version}`);
  }

  const response = await fetch(`${API_BASE}/repos/${opts.repo}/releases/tags/${encodeURIComponent(opts.tag)}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "minekube-release-validator",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
    }
  });

  if (!response.ok) {
    errors.push(`Vydání s tagem ${opts.tag} se nepodařilo načíst (HTTP ${response.status}).`);
  } else {
    const release = await response.json();
    const assets = release.assets || [];
    const formats = assets.map(asset => classify(asset.name));
    const downloads = assets.filter((asset, index) => ["mrpack", "zip"].includes(formats[index]));

    if (release.draft) warnings.push("Vydání je zatím koncept (draft) — web ho neuvidí.");
    if (release.prerelease) infos.push("Vydání je označené jako beta (pre-release).");
    if (downloads.length === 0) {
      errors.push("Vydání nemá žádný soubor .mrpack ani .zip — hráč by neměl co stáhnout.");
    }
    if (!formats.includes("mrpack")) {
      warnings.push("Chybí .mrpack — hráči s Prism Launcherem si budou muset stáhnout .zip ručně.");
    }
    if (!formats.includes("zip")) {
      warnings.push("Chybí .zip — ruční instalace nebude možná.");
    }
    if (!formats.includes("checksum")) {
      warnings.push("Chybí soubor .sha256 — hráč si nemůže ověřit integritu balíčku.");
    }

    const total = downloads.reduce((sum, asset) => sum + (asset.size || 0), 0);
    if (total) infos.push(`Ke stažení: ${downloads.length} soubor(y), celkem ${(total / 1024 / 1024).toFixed(1)} MB`);
  }

  infos.forEach(line => console.log(`\u001b[36m•\u001b[0m ${line}`));
  warnings.forEach(line => console.warn(`\u001b[33m!\u001b[0m ${line}`));

  if (errors.length) {
    errors.forEach(line => console.error(`\u001b[31m✗\u001b[0m ${line}`));
    console.error("\nKonvence vydání: viz README → „Konvence vydání“.");
    process.exit(1);
  }

  console.log("\u001b[32m✓\u001b[0m Vydání odpovídá konvencím.");
}

main().catch(error => {
  console.error(`\u001b[31m✗\u001b[0m ${error.stack || error}`);
  process.exit(1);
});
