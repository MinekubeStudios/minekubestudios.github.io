#!/usr/bin/env node
/* =============================================================
   MINEKUBE STUDIOS // modpacky — generátor manifest.json

   Projde všechna GitHub Releases v tomhle repozitáři, rozdělí je
   podle tagů (např. ultra-v1.2.0 → balíček „ultra“) a zapíše
   manifest.json — index, ze kterého čte web Minekube tlačítka
   ke stažení. Bez manifestu by web musel na každé načtení stránky
   volat GitHub API (limit 60 dotazů/h na IP).

   Použití:
     node tools/build-manifest.mjs                 # zapíše manifest.json
     node tools/build-manifest.mjs --dry-run       # jen vypíše, nic nemění
     GITHUB_TOKEN=$(gh auth token) node tools/build-manifest.mjs

   Volby:
     --repo owner/name   repozitář (jinak GITHUB_REPOSITORY nebo git remote)
     --out cesta         kam zapsat (výchozí manifest.json v kořeni repa)
     --token token       GitHub token (jinak GITHUB_TOKEN / GH_TOKEN)
     --branch název      výchozí branch pro web (výchozí main)
     --max-pages číslo   kolik stránek releases projít (výchozí 10)
     --force             zapsat manifest i když API vrátí chybu
     --dry-run           vypsat výsledek místo zápisu
     --quiet             méně výpisu
   ============================================================= */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const API_BASE = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");
const WEB_URL = "https://minekubestudios.github.io/modpacky/";
const HISTORY_LIMIT = 20;

/* ===================== ARGUMENTY ===================== */

const argv = process.argv.slice(2);
const opts = {
  repo: null,
  out: join(ROOT, "manifest.json"),
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null,
  branch: "main",
  maxPages: 10,
  force: false,
  dryRun: false,
  quiet: false
};

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  const next = () => {
    const value = argv[i + 1];
    if (!value) fail(`Volba ${arg} potřebuje hodnotu.`);
    i += 1;
    return value;
  };

  if (arg === "--repo") opts.repo = next();
  else if (arg === "--out") opts.out = resolve(ROOT, next());
  else if (arg === "--token") opts.token = next();
  else if (arg === "--branch") opts.branch = next();
  else if (arg === "--max-pages") opts.maxPages = Number(next()) || 10;
  else if (arg === "--force") opts.force = true;
  else if (arg === "--dry-run") opts.dryRun = true;
  else if (arg === "--quiet") opts.quiet = true;
  else if (arg === "-h" || arg === "--help") usage(0);
  else fail(`Neznámá volba: ${arg}`);
}

function usage(code) {
  const text = readFileSync(fileURLToPath(import.meta.url), "utf8")
    .split("\n")
    .slice(0, 24)
    .map(line => line.replace(/^\/\*|^ {3}\*\/?|^ {3}/, ""))
    .join("\n");
  console.log(text);
  process.exit(code);
}

function fail(message) {
  console.error(`\u001b[31m✗ ${message}\u001b[0m`);
  process.exit(1);
}

function log(message) {
  if (!opts.quiet) console.log(message);
}

function warn(message) {
  console.warn(`\u001b[33m! ${message}\u001b[0m`);
}

/* ===================== BALÍČKY ===================== */

function readPacks() {
  const dir = join(ROOT, "packs");
  if (!existsSync(dir)) fail("Chybí složka packs/ — není co generovat.");

  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const file = join(dir, entry.name, "pack.json");
      if (!existsSync(file)) fail(`Balíček „${entry.name}“ nemá packs/${entry.name}/pack.json.`);

      let data;
      try {
        data = JSON.parse(readFileSync(file, "utf8"));
      } catch (error) {
        fail(`packs/${entry.name}/pack.json není platné JSON: ${error.message}`);
      }

      const id = data.id || entry.name;
      if (id !== entry.name) {
        fail(`packs/${entry.name}/pack.json má "id": "${id}" — musí odpovídat názvu složky.`);
      }

      return {
        ...data,
        id,
        name: data.name || id,
        tagPrefix: data.tagPrefix || id,
        minecraft: Array.isArray(data.minecraft) ? data.minecraft : [],
        focus: Array.isArray(data.focus) ? data.focus : []
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ===================== GITHUB API ===================== */

function detectRepo() {
  if (opts.repo) return opts.repo;
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;

  try {
    const remote = execFileSync("git", ["-C", ROOT, "remote", "get-url", "origin"], { encoding: "utf8" }).trim();
    const match = /github\.com[:/](?<slug>[^/]+\/[^/]+?)(?:\.git)?$/.exec(remote);
    if (match) return match.groups.slug;
  } catch {
    /* git není k dispozici — níž to spadne na chybějící repozitář */
  }

  fail("Nevím, který repozitář číst. Použij --repo owner/name nebo nastav GITHUB_REPOSITORY.");
}

async function fetchReleases(repo) {
  const releases = [];

  for (let page = 1; page <= opts.maxPages; page += 1) {
    const url = `${API_BASE}/repos/${repo}/releases?per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "minekube-manifest-builder",
        ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
      }
    });

    if (response.status === 404) return { releases: [], missing: true };

    if (!response.ok) {
      const body = await response.text();
      const hint =
        response.status === 403
          ? " (chybí token? nastav GITHUB_TOKEN, neautentizované volání má limit 60 dotazů za hodinu)"
          : "";
      throw new Error(`GitHub API ${response.status}${hint}: ${body.slice(0, 240)}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    releases.push(...batch);
    if (batch.length < 100) break;
  }

  return { releases, missing: false };
}

/* ===================== NORMALIZACE ===================== */

const FORMAT_ORDER = { mrpack: 0, zip: 1, checksum: 2, other: 3 };
const CHECKSUM_RE = /\.(sha256|sha512|sha1|md5)(\.txt)?$/i;

function classifyFile(name = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mrpack") || lower.endsWith(".mrpack.zip")) return "mrpack";
  if (CHECKSUM_RE.test(lower)) return "checksum";
  if (lower.endsWith(".zip")) return "zip";
  return "other";
}

function assetToFile(asset) {
  const sha256 =
    typeof asset.digest === "string" && asset.digest.startsWith("sha256:") ? asset.digest.slice(7) : null;

  return {
    name: asset.name,
    url: asset.browser_download_url,
    size: typeof asset.size === "number" ? asset.size : null,
    sha256,
    format: classifyFile(asset.name)
  };
}

function sortAndMarkFiles(files) {
  files.sort((a, b) => FORMAT_ORDER[a.format] - FORMAT_ORDER[b.format] || a.name.localeCompare(b.name));

  const primary = files.find(file => file.format === "mrpack") || files.find(file => file.format === "zip") || null;
  files.forEach(file => {
    file.primary = file === primary;
  });

  return files;
}

/** Z popisu vydání umí přečíst „Minecraft: 1.21.4“ a „Loader: Fabric“. */
function metaFromNotes(body, key) {
  if (typeof body !== "string") return null;
  const pattern = new RegExp(`^\\s*(?:${key}|${key === "minecraft" ? "mc" : "loader"})\\s*[:=]\\s*(.+?)\\s*$`, "im");
  const match = pattern.exec(body);
  return match ? match[1] : null;
}

function parseTag(tag, packs) {
  const match = /^(?<prefix>[a-z0-9][a-z0-9._-]*?)-v(?<version>[0-9][^/]*)$/i.exec(tag || "");
  if (!match) return null;

  const prefix = match.groups.prefix.toLowerCase();
  const pack = packs.find(candidate => candidate.tagPrefix.toLowerCase() === prefix);
  if (!pack) return null;

  return { pack, version: match.groups.version };
}

function releaseToEntry(release, pack, version) {
  const files = sortAndMarkFiles((release.assets || []).map(assetToFile));

  return {
    tag: release.tag_name,
    version,
    name: release.name || `${pack.name} ${version}`,
    channel: release.prerelease ? "beta" : "stable",
    published: release.published_at || release.created_at || null,
    htmlUrl: release.html_url,
    notes: typeof release.body === "string" ? release.body.trim() : "",
    mc: metaFromNotes(release.body, "minecraft") || pack.minecraft[0] || null,
    loader: metaFromNotes(release.body, "loader") || pack.loader || null,
    files
  };
}

/* ===================== SESTAVENÍ MANIFESTU ===================== */

function buildManifest(repo, packs, releases) {
  const grouped = new Map(packs.map(pack => [pack.id, []]));
  const skipped = [];

  for (const release of releases) {
    if (release.draft) continue;

    const parsed = parseTag(release.tag_name, packs);
    if (!parsed) {
      skipped.push(release.tag_name);
      continue;
    }

    grouped.get(parsed.pack.id).push(releaseToEntry(release, parsed.pack, parsed.version));
  }

  const packEntries = {};
  let withReleases = 0;

  for (const pack of packs) {
    const entries = grouped.get(pack.id).sort((a, b) => String(b.published).localeCompare(String(a.published)));
    const latest = entries.find(entry => entry.channel === "stable") || entries[0] || null;
    if (latest) withReleases += 1;

    packEntries[pack.id] = {
      id: pack.id,
      name: pack.name,
      badge: pack.badge || null,
      tagPrefix: pack.tagPrefix,
      minecraft: pack.minecraft,
      loader: pack.loader || null,
      focus: pack.focus,
      state: pack.state || (latest ? "released" : "pending"),
      released: Boolean(latest),
      website: pack.website || null,
      summary: pack.summary || null,
      latest,
      history: entries.filter(entry => entry !== latest).slice(0, HISTORY_LIMIT)
    };
  }

  return {
    manifest: {
      schema: 1,
      generated: new Date().toISOString(),
      repository: repo,
      branch: opts.branch,
      releasesUrl: `https://github.com/${repo}/releases`,
      web: WEB_URL,
      packs: packEntries
    },
    skipped,
    withReleases
  };
}

/* ===================== ZÁPIS ===================== */

function readExisting(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/** Porovnání obsahu bez časové značky — ať diff nešumí při každém běhu. */
function comparable(manifest) {
  const copy = JSON.parse(JSON.stringify(manifest));
  delete copy.generated;
  return JSON.stringify(copy);
}

async function main() {
  const repo = detectRepo();
  const packs = readPacks();

  log(`\u001b[1mMinekube manifest\u001b[0m — repozitář ${repo}, balíčků ${packs.length}`);

  let releases = [];
  let missing = false;

  try {
    const result = await fetchReleases(repo);
    releases = result.releases;
    missing = result.missing;
  } catch (error) {
    if (!opts.force) fail(`${error.message}\n  Manifest jsem nechal beze změny.`);
    warn(`${error.message} — pokračuji bez vydání (--force).`);
  }

  if (missing) warn(`Repozitář ${repo} zatím nemá žádná vydání (nebo ještě neexistuje) — manifest bude prázdný.`);

  const { manifest, skipped, withReleases } = buildManifest(repo, packs, releases);

  if (skipped.length) {
    warn(`Tagy, které neodpovídají žádnému balíčku (ignoruji): ${skipped.join(", ")}`);
  }

  const existing = readExisting(opts.out);
  if (existing && comparable(existing) === comparable(manifest)) {
    manifest.generated = existing.generated;
    log(`Manifest je beze změny (${withReleases}/${packs.length} balíčků má vydání).`);
  } else {
    log(
      `Vydání nalezena: ${releases.length} · balíčků s vydáním: ${withReleases}/${packs.length}` +
        (existing ? " · manifest se změní" : " · manifest se vytvoří")
    );
  }

  const output = `${JSON.stringify(manifest, null, 2)}\n`;

  if (opts.dryRun) {
    process.stdout.write(output);
    return;
  }

  writeFileSync(opts.out, output, "utf8");
  log(`Zapsáno: ${opts.out}`);
}

main().catch(error => fail(error.stack || String(error)));
