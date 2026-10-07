/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA LAUNCHER — VYDÁNÍ Z REPOZITÁŘE
   Načítá se PŘED launcher.js (a po i18n.js).

   Tohle je jediné místo, kde je stránka Launcher napojená na
   repozitář MinekubeStudios/MinekubeLauncher. Odsud si web bere
   nejnovější vydání a přímou adresu instalačního souboru.

   Pořadí zdrojů (první, co odpoví, vyhrává):
     1) GitHub Releases API → nejnovější nedraftové vydání s přílohami
     2) obsah repozitáře    → instalátory nahrané přímo ve větvi main
     3) statická záloha     → poslední známá adresa (když API mlčí)

   Platformy: Windows je „live“, macOS a Linux jsou „planned“ — web je
   ukáže jako „v plánu“, i kdyby se soubor v repozitáři objevil. Až
   vydáme .dmg / .AppImage, stačí v CONFIG.platformStatus přepsat
   "planned" na "live" a celý web se přepne sám.

   Veřejné API (window.MinekubeLauncherReleases):
     .ready               → Promise vyřešená po prvním načtení
     .status()            → { state, source, version, degraded, fetchedAt, error }
     .asset(os)           → { name, url, size, version, source } | null
     .platform(os)        → { id, status, available, asset }
     .platforms()         → [ windows, macos, linux ]
     .isAvailable(os)     → boolean
     .download(os)        → spustí stahování, vrací { ok, reason, asset }
     .refresh(force)      → nové načtení (force = ignorovat cache)
     .humanSize(bytes)    → "24,7 MB"
     .repoUrl / .releasesUrl
   Událost: document → "minekube:launcher-releases" (detail = status)
   ============================================================= */

window.MinekubeLauncherReleases = (function () {
  "use strict";

  /* ===================== KONFIGURACE REPOZITÁŘE ===================== */

  const CONFIG = {
    owner: "MinekubeStudios",
    repo: "MinekubeLauncher",
    branch: "main",
    cacheKey: "minekube-launcher-releases-v1",
    /* Jak dlouho si web drží načtená data, než se zeptá znovu. */
    cacheTtlMs: 5 * 60 * 1000,
    /* Každý zdroj má vlastní timeout, ať stránka nezamrzne. */
    timeoutMs: 8000,
    /* Vývojová zkratka: ?launcher-releases=refresh přeskočí cache. */
    forceParam: "launcher-releases",
    /* Která platforma už vychází jako dostupná. */
    platformStatus: {
      windows: "live",
      macos: "planned",
      linux: "planned"
    },
    /* Poslední záchrana, kdyby GitHub API odmítlo odpovědět
       (vyčerpaný limit, offline). Adresa míří přímo do repozitáře. */
    fallback: {
      windows: {
        name: "Minekube Launcher_1.0.0-local_x64-setup.exe",
        version: "1.0.0-local",
        size: 24691528,
        url: "https://github.com/MinekubeStudios/MinekubeLauncher/raw/main/Minekube%20Launcher_1.0.0-local_x64-setup.exe"
      }
    }
  };

  const SLUG = `${CONFIG.owner}/${CONFIG.repo}`;
  const PLATFORM_ORDER = ["windows", "macos", "linux"];

  const URLS = {
    repo: `https://github.com/${SLUG}`,
    releases: `https://github.com/${SLUG}/releases`,
    apiReleases: `https://api.github.com/repos/${SLUG}/releases?per_page=30`,
    apiContents: `https://api.github.com/repos/${SLUG}/contents/?ref=${encodeURIComponent(CONFIG.branch)}`,
    raw: path => `https://github.com/${SLUG}/raw/${CONFIG.branch}/${String(path).split("/").map(encodeURIComponent).join("/")}`
  };

  /* ===================== ROZPOZNÁNÍ SOUBORŮ =====================
     Jména příloh z GitHubu (Tauri / electron-builder / ruční upload)
     třídíme podle přípony a podle názvu platformy. */

  const IGNORED =
    /(^|[-._\s])(sources?|src|source-code|checksum|sha256|sha512|sha1|md5|sig|signature|asc|blockmap|latest|manifest|changelog|readme|license)([-._\s]|$)|\.(sig|asc|sha256|sha512|sha1|md5|blockmap|map|txt|md|json|ya?ml|toml|lock|ts|js|css|html|png|jpg|jpeg|gif|svg|icns|ico)$/i;

  const PREFERENCE = {
    windows: [/-setup\.exe$/i, /\.exe$/i, /\.msi$/i, /\.zip$/i],
    macos: [/\.dmg$/i, /\.pkg$/i, /\.app\.tar\.gz$/i, /\.zip$/i],
    linux: [/\.appimage$/i, /\.deb$/i, /\.rpm$/i, /\.zip$/i, /\.tar\.(gz|xz|zst)$/i, /\.tgz$/i]
  };

  function classify(name) {
    const n = String(name || "").toLowerCase();
    if (!n || IGNORED.test(n)) return null;

    /* Přípona mluví jasně. */
    if (/\.(exe|msi)$/.test(n)) return "windows";
    if (/\.(dmg|pkg)$/.test(n)) return "macos";
    if (/\.(appimage|deb|rpm|snap|flatpakref)$/.test(n)) return "linux";
    if (/\.app\.tar\.gz$/.test(n)) return "macos";

    /* A když ne přípona, tak název platformy. */
    if (/(^|[^a-z])(windows|win64|win32|win|msvc)([^a-z]|$)/.test(n)) return "windows";
    if (/(macos|darwin|osx|apple|macbook)/.test(n)) return "macos";
    if (/(linux|ubuntu|debian|fedora|archlinux|manjaro|wayland)/.test(n)) return "linux";

    return null;
  }

  function rank(os, name) {
    const list = PREFERENCE[os] || [];
    const index = list.findIndex(pattern => pattern.test(String(name || "")));
    return index === -1 ? list.length : index;
  }

  function versionFrom(text) {
    const match = String(text || "").match(/(\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?)/);
    return match ? match[1] : null;
  }

  /* 1.0.2 > 1.0.1; stabilní 1.0.0 > předběžné 1.0.0-local */
  function compareVersions(a, b) {
    const core = value => String(value || "0").split(/[+\-]/)[0].split(".").map(part => parseInt(part, 10) || 0);
    const left = core(a);
    const right = core(b);

    for (let i = 0; i < 3; i += 1) {
      const diff = (left[i] || 0) - (right[i] || 0);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    }

    const leftPre = /[-]/.test(String(a || "")) ? 0 : 1;
    const rightPre = /[-]/.test(String(b || "")) ? 0 : 1;
    return leftPre - rightPre;
  }

  /* Z hromady souborů vybere pro každou platformu ten nejlepší. */
  function pickBest(items) {
    const best = { windows: null, macos: null, linux: null };

    items.forEach(item => {
      const os = classify(item.name);
      if (!os) return;

      const current = best[os];
      if (!current) {
        best[os] = item;
        return;
      }

      const byVersion = compareVersions(item.version, current.version);
      if (byVersion > 0) {
        best[os] = item;
        return;
      }
      if (byVersion === 0 && rank(os, item.name) < rank(os, current.name)) best[os] = item;
    });

    return best;
  }

  const hasAny = assets => PLATFORM_ORDER.some(os => Boolean(assets && assets[os]));

  /* ===================== ÚLOŽIŠTĚ (bezpečné i v soukromém režimu) ===================== */

  const store = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* blokované úložiště — web funguje dál, jen bez cache */
      }
    }
  };

  function readCache() {
    const raw = store.get(CONFIG.cacheKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.fetchedAt !== "number" || !parsed.assets) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeCache() {
    if (state.source === "fallback" || state.status !== "ready") return;
    store.set(
      CONFIG.cacheKey,
      JSON.stringify({
        fetchedAt: state.fetchedAt,
        source: state.source,
        version: state.version,
        assets: state.assets
      })
    );
  }

  /* ===================== HTTP ===================== */

  async function fetchJson(url) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), CONFIG.timeoutMs) : null;

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        ...(controller ? { signal: controller.signal } : {})
      });

      if (!response.ok) {
        const error = new Error(`GitHub API odpovědělo HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }

  /* 1) GitHub Releases — nejnovější nedraftové vydání s přílohami. */
  async function loadFromReleases() {
    const releases = await fetchJson(URLS.apiReleases);
    if (!Array.isArray(releases)) throw new Error("GitHub API vrátilo neočekávaný tvar dat.");

    for (const release of releases) {
      if (!release || release.draft) continue;

      const tag = release.tag_name ? String(release.tag_name).replace(/^v/i, "") : null;
      const items = (Array.isArray(release.assets) ? release.assets : [])
        .map(asset => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: typeof asset.size === "number" ? asset.size : null,
          version: versionFrom(asset.name) || tag
        }))
        .filter(item => item.name && item.url);

      const assets = pickBest(items);
      if (!hasAny(assets)) continue;

      const headline = assets.windows || assets.macos || assets.linux;
      return {
        assets,
        version: tag || headline.version,
        releaseTag: release.tag_name || null,
        releaseUrl: release.html_url || URLS.releases,
        source: "releases"
      };
    }

    return null;
  }

  /* 2) Obsah repozitáře — instalátory nahrané přímo ve větvi. */
  async function loadFromRepo() {
    const entries = await fetchJson(URLS.apiContents);
    if (!Array.isArray(entries)) throw new Error("GitHub API vrátilo neočekávaný tvar dat.");

    const items = entries
      .filter(entry => entry && entry.type === "file" && entry.name)
      .map(entry => ({
        name: entry.name,
        url: entry.download_url || URLS.raw(entry.path || entry.name),
        size: typeof entry.size === "number" ? entry.size : null,
        version: versionFrom(entry.name)
      }));

    const assets = pickBest(items);
    if (!hasAny(assets)) return null;

    const headline = assets.windows || assets.macos || assets.linux;
    return { assets, version: headline.version, releaseUrl: URLS.repo, source: "repo" };
  }

  /* 3) Statická záchrana — poslední známá adresa přímo z repozitáře. */
  function loadFromFallback() {
    const assets = { windows: null, macos: null, linux: null };

    Object.keys(CONFIG.fallback).forEach(os => {
      if (!PLATFORM_ORDER.includes(os)) return;
      const known = CONFIG.fallback[os];
      if (!known || !known.url) return;
      assets[os] = { ...known, version: known.version || versionFrom(known.name) };
    });

    if (!hasAny(assets)) return null;

    const headline = assets.windows || assets.macos || assets.linux;
    return { assets, version: headline.version, releaseUrl: URLS.repo, source: "fallback" };
  }

  /* ===================== STAV ===================== */

  const state = {
    status: "loading", // loading | ready | empty | error
    source: null, // releases | repo | fallback | cache
    version: null,
    releaseUrl: URLS.releases,
    degraded: false,
    fetchedAt: null,
    error: null,
    assets: { windows: null, macos: null, linux: null }
  };

  let resolveReady;
  const ready = new Promise(resolve => {
    resolveReady = resolve;
  });

  function announce() {
    document.dispatchEvent(new CustomEvent("minekube:launcher-releases", { detail: status() }));
  }

  function applyResult(result, fetchedAt = Date.now()) {
    state.status = "ready";
    state.source = result.source;
    state.version = result.version || null;
    state.releaseUrl = result.releaseUrl || URLS.releases;
    state.degraded = result.source === "fallback" || result.degraded === true;
    state.fetchedAt = fetchedAt;
    state.error = null;
    state.assets = result.assets;
    announce();
    resolveReady(state);
  }

  function applyFailure(error) {
    state.status = "error";
    state.source = null;
    state.degraded = true;
    state.fetchedAt = Date.now();
    state.error = error instanceof Error ? error.message : String(error || "neznámá chyba");
    state.assets = { windows: null, macos: null, linux: null };
    announce();
    resolveReady(state);
  }

  let inflight = null;

  function load(force = false) {
    if (inflight) return inflight;

    inflight = (async function run() {
      const wantsFresh = force || new URLSearchParams(window.location.search).get(CONFIG.forceParam) === "refresh";
      const cached = wantsFresh ? null : readCache();

      if (cached && Date.now() - cached.fetchedAt < CONFIG.cacheTtlMs) {
        applyResult(
          {
            assets: cached.assets,
            version: cached.version,
            releaseUrl: URLS.releases,
            source: "cache"
          },
          cached.fetchedAt
        );
        return state;
      }

      const errors = [];
      let result = null;

      for (const step of [loadFromReleases, loadFromRepo]) {
        try {
          result = await step();
          if (result) break;
        } catch (error) {
          errors.push(error);
        }
      }

      if (!result) {
        result = loadFromFallback();
        if (result) result.degraded = errors.length > 0;
      }

      if (!result) {
        applyFailure(errors[0] || new Error("V repozitáři se nenašlo žádné sestavení."));
        return state;
      }

      applyResult(result);
      writeCache();
      return state;
    })().finally(() => {
      inflight = null;
    });

    return inflight;
  }

  /* ===================== VEŘEJNÉ ROZHRANÍ ===================== */

  function status() {
    return {
      state: state.status,
      source: state.source,
      version: state.version,
      releaseUrl: state.releaseUrl,
      degraded: state.degraded,
      fetchedAt: state.fetchedAt,
      error: state.error
    };
  }

  function asset(os) {
    return state.assets[os] || null;
  }

  function platform(os) {
    const status_ = CONFIG.platformStatus[os] || "planned";
    const found = asset(os);
    return {
      id: os,
      status: status_,
      available: status_ === "live" && Boolean(found),
      planned: status_ !== "live",
      asset: found
    };
  }

  const platforms = () => PLATFORM_ORDER.map(platform);

  const isAvailable = os => platform(os).available;

  function humanSize(bytes) {
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return "";
    const lang = document.documentElement.lang || "cs";
    const units = ["B", "kB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    const digits = unit >= 2 ? 1 : 0;
    try {
      return `${new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
    } catch {
      return `${value.toFixed(digits)} ${units[unit]}`;
    }
  }

  function triggerDownload(file) {
    const link = document.createElement("a");
    link.href = file.url;
    link.rel = "noopener noreferrer";
    link.download = file.name || "";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => link.remove(), 2000);
  }

  function download(os) {
    const target = platform(os);

    if (!CONFIG.platformStatus[os]) return { ok: false, reason: "unknown", platform: target };
    if (target.planned) return { ok: false, reason: "planned", platform: target };
    if (!target.asset || !target.asset.url) return { ok: false, reason: "unavailable", platform: target };

    triggerDownload(target.asset);
    return { ok: true, reason: "started", platform: target, asset: target.asset };
  }

  function refresh(force = true) {
    /* Ruční „zkusit znovu“ musí proběhnout i přes už běžící načtení. */
    inflight = null;
    state.status = "loading";
    announce();
    return load(force);
  }

  /* Startujeme hned — stránka pak jen přebírá výsledek. */
  load();

  return {
    ready,
    status,
    asset,
    platform,
    platforms,
    isAvailable,
    download,
    refresh,
    humanSize,
    repoUrl: URLS.repo,
    releasesUrl: URLS.releases,
    branch: CONFIG.branch
  };
})();
