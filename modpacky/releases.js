/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA MODPACKY — VYDÁNÍ Z REPOZITÁŘE
   Načítá se PŘED modpacky.js.

   Tenhle soubor je jediné místo, kde je napojený repozitář
   s modpacky: MinekubeStudios/modpacky. Odsud si web bere
   nejnovější vydání každého balíčku a adresy souborů .mrpack/.zip.

   Pořadí zdrojů:
     1) manifest.json z repozitáře (rychlý, bez limitu GitHub API)
     2) GitHub Releases API (když manifest chybí nebo selže)
     3) statická data v modpacky.js (když nejde nic — tlačítko
        pak hlásí „Odkaz připravujeme“)

   Veřejné API (window.MinekubeReleases):
     .packs()             → { [id]: { latest, history, released } }
     .pack(id)            → záznam balíčku (nebo null)
     .latest(id)          → nejnovější vydání (nebo null)
     .downloads(id)       → soubory .mrpack/.zip (primary první)
     .primaryUrl(id)      → adresa souboru pro tlačítko na kartě
     .releaseUrl(id)      → stránka vydání na GitHubu
     .releasesUrl         → přehled všech vydání
     .status()            → { state, source, fetchedAt }
     .ready               → Promise, která se vyřeší po prvním načtení
     .refresh()           → vynutí nové načtení (ignoruje cache)
   Událost: document → "minekube:releases" (detail = { source, packs })
   ============================================================= */

window.MinekubeReleases = (function () {
  "use strict";

  /* ===================== KONFIGURACE REPOZITÁŘE =====================
     Když se repozitář přejmenuje, stačí změnit tady owner/repo. */
  const CONFIG = {
    owner: "MinekubeStudios",
    repo: "modpacky",
    branch: "main",
    manifestPath: "manifest.json",
    /* Jak dlouho si web drží načtená data, než se zeptá znovu (10 minut). */
    cacheTtlMs: 10 * 60 * 1000,
    cacheKey: "minekube-releases-v1",
    /* Jednotlivé zdroje mají vlastní timeout, ať web nezamrzne. */
    timeoutMs: 7000,
    forceParam: "releases",
    /* Vývojová zkratka: ?releases=demo načte manifest.demo.json z tohoto
       repozitáře, takže se dá nové UI vydání prohlédnout i bez
       publikovaného vydání. Do produkce to nijak nezasahuje. */
    demoPath: "manifest.demo.json"
  };

  const SLUG = `${CONFIG.owner}/${CONFIG.repo}`;
  const URLS = {
    manifest: `https://raw.githubusercontent.com/${SLUG}/${CONFIG.branch}/${CONFIG.manifestPath}`,
    manifestCdn: `https://cdn.jsdelivr.net/gh/${SLUG}@${CONFIG.branch}/${CONFIG.manifestPath}`,
    releases: `https://api.github.com/repos/${SLUG}/releases?per_page=100`,
    releasesUrl: `https://github.com/${SLUG}/releases`,
    repository: `https://github.com/${SLUG}`
  };

  const FORMAT_ORDER = { mrpack: 0, zip: 1, checksum: 2, other: 3 };

  const state = {
    packs: {},
    status: "pending",
    source: null,
    fetchedAt: null
  };

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

  /* ===================== POMOCNÉ ===================== */

  const classify = name => {
    const lower = String(name || "").toLowerCase();
    if (lower.endsWith(".mrpack") || lower.endsWith(".mrpack.zip")) return "mrpack";
    if (/\.(sha256|sha512|sha1|md5)(\.txt)?$/.test(lower)) return "checksum";
    if (lower.endsWith(".zip")) return "zip";
    return "other";
  };

  const normalizeFile = raw => {
    if (!raw || typeof raw !== "object") return null;

    const name = raw.name || "";
    const url = raw.url || raw.browser_download_url || "";
    if (!name || !url) return null;

    const sha256 =
      raw.sha256 ||
      (typeof raw.digest === "string" && raw.digest.startsWith("sha256:") ? raw.digest.slice(7) : null);

    return {
      name,
      url,
      size: typeof raw.size === "number" ? raw.size : null,
      sha256: sha256 || null,
      format: raw.format || classify(name),
      primary: raw.primary === true
    };
  };

  const sortFiles = files => {
    files.sort((a, b) => FORMAT_ORDER[a.format] - FORMAT_ORDER[b.format] || a.name.localeCompare(b.name));

    if (!files.some(file => file.primary)) {
      const primary = files.find(file => file.format === "mrpack") || files.find(file => file.format === "zip");
      if (primary) primary.primary = true;
    }

    return files;
  };

  const normalizeRelease = raw => {
    if (!raw || typeof raw !== "object") return null;

    const files = sortFiles((Array.isArray(raw.files) ? raw.files : []).map(normalizeFile).filter(Boolean));
    const tag = raw.tag || raw.tag_name || null;

    return {
      tag,
      version: raw.version || (tag ? tag.replace(/^.*?-v/, "") : ""),
      name: raw.name || "",
      channel: raw.channel === "beta" || raw.prerelease === true ? "beta" : "stable",
      published: raw.published || raw.published_at || raw.created_at || null,
      htmlUrl: raw.htmlUrl || raw.html_url || URLS.releasesUrl,
      notes: typeof raw.notes === "string" ? raw.notes : typeof raw.body === "string" ? raw.body : "",
      mc: raw.mc || null,
      loader: raw.loader || null,
      files
    };
  };

  const newestFirst = (a, b) => String(b.published || "").localeCompare(String(a.published || ""));

  const latestOf = entries => entries.find(entry => entry.channel === "stable") || entries[0] || null;

  /* ===================== PŘEVOD ZDROJŮ NA JEDEN TVAR ===================== */

  /** manifest.json z repozitáře (autoritativní metadata i soubory). */
  const packsFromManifest = json => {
    if (!json || typeof json !== "object" || !json.packs || typeof json.packs !== "object") return null;

    const packs = {};
    for (const [id, pack] of Object.entries(json.packs)) {
      if (!pack || typeof pack !== "object") continue;

      const latest = normalizeRelease(pack.latest);
      const history = (Array.isArray(pack.history) ? pack.history : []).map(normalizeRelease).filter(Boolean);

      packs[id] = {
        id,
        name: pack.name || id,
        released: Boolean(latest) || pack.released === true,
        latest,
        history: history.sort(newestFirst)
      };
    }

    return packs;
  };

  /** GitHub Releases API — záložní cesta, když manifest není k dispozici. */
  const packsFromReleases = releases => {
    if (!Array.isArray(releases)) return null;

    const grouped = {};

    for (const release of releases) {
      if (!release || release.draft) continue;

      const match = /^(?<prefix>[a-z0-9][a-z0-9._-]*?)-v(?<version>[0-9][^/]*)$/i.exec(release.tag_name || "");
      if (!match) continue;

      const entry = normalizeRelease({
        tag: release.tag_name,
        version: match.groups.version,
        name: release.name || release.tag_name,
        prerelease: release.prerelease,
        published: release.published_at || release.created_at,
        html_url: release.html_url,
        body: release.body,
        files: (release.assets || []).map(asset =>
          normalizeFile({
            name: asset.name,
            url: asset.browser_download_url,
            size: asset.size,
            digest: asset.digest,
            format: classify(asset.name)
          })
        )
      });

      if (!entry) continue;

      const id = match.groups.prefix.toLowerCase();
      grouped[id] = grouped[id] || [];
      grouped[id].push(entry);
    }

    const packs = {};
    for (const [id, entries] of Object.entries(grouped)) {
      const sorted = entries.sort(newestFirst);
      const latest = latestOf(sorted);

      packs[id] = {
        id,
        name: latest?.name || id,
        released: Boolean(latest),
        latest,
        history: sorted.filter(entry => entry !== latest)
      };
    }

    return packs;
  };

  /** Když máme manifest i API, u každého balíčku vyhraje novější vydání. */
  const mergePacks = (base, overlay) => {
    if (!base) return overlay;
    if (!overlay) return base;

    const merged = { ...base };

    for (const [id, pack] of Object.entries(overlay)) {
      const current = merged[id];
      const currentDate = current?.latest?.published || "";
      const nextDate = pack?.latest?.published || "";

      if (!current || nextDate > currentDate) merged[id] = pack;
    }

    return merged;
  };

  /* ===================== NAČÍTÁNÍ ===================== */

  const fetchJson = async url => {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), CONFIG.timeoutMs) : null;

    try {
      const response = await fetch(url, {
        signal: controller ? controller.signal : undefined,
        cache: "no-store",
        headers: { accept: "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  };

  const remember = (packs, source) => {
    store.set(CONFIG.cacheKey, JSON.stringify({ savedAt: Date.now(), source, packs }));
  };

  const readCache = () => {
    try {
      const raw = JSON.parse(store.get(CONFIG.cacheKey) || "null");
      if (!raw || typeof raw !== "object" || !raw.packs || typeof raw.packs !== "object") return null;
      if (!Object.keys(raw.packs).length) return null;
      return raw;
    } catch {
      return null;
    }
  };

  const apply = (packs, source, fetchedAt = Date.now()) => {
    state.packs = packs || {};
    state.source = source;
    state.fetchedAt = fetchedAt;
    state.status = Object.keys(state.packs).length ? "ready" : "empty";

    try {
      document.dispatchEvent(
        new CustomEvent("minekube:releases", {
          detail: { source: state.source, packs: state.packs, status: state.status }
        })
      );
    } catch {
      /* starší prohlížeče — web se překreslí při dalším načtení */
    }
  };

  const queryParam = () => {
    try {
      return new URLSearchParams(window.location.search).get(CONFIG.forceParam);
    } catch {
      return null;
    }
  };

  const forceRefresh = () => queryParam() === "refresh";
  const demoMode = () => queryParam() === "demo";

  /** Projde zdroje v pořadí manifest → CDN → GitHub API. */
  const loadFromNetwork = async () => {
    let packs = null;
    let source = null;

    /* ?releases=demo — ukázková data z repozitáře webu (jen pro vývoj). */
    if (demoMode()) {
      try {
        return { packs: packsFromManifest(await fetchJson(CONFIG.demoPath)) || {}, source: "demo", fetchedAt: Date.now() };
      } catch {
        return null;
      }
    }

    try {
      packs = packsFromManifest(await fetchJson(URLS.manifest));
      source = "manifest";
    } catch {
      packs = null;
    }

    if (!packs) {
      try {
        packs = packsFromManifest(await fetchJson(URLS.manifestCdn));
        source = "manifest-cdn";
      } catch {
        packs = null;
      }
    }

    let apiPacks = null;
    try {
      apiPacks = packsFromReleases(await fetchJson(URLS.releases));
    } catch {
      apiPacks = null;
    }

    packs = mergePacks(packs, apiPacks);
    if (packs && !source) source = "api";
    if (!packs && apiPacks) packs = apiPacks;

    return packs ? { packs, source, fetchedAt: Date.now() } : null;
  };

  let readyResolve;
  const ready = new Promise(resolve => {
    readyResolve = resolve;
  });

  const start = async () => {
    const cached = readCache();
    const fresh = cached && Date.now() - Number(cached.savedAt || 0) < CONFIG.cacheTtlMs;

    if (cached && !forceRefresh()) {
      apply(cached.packs, "cache", cached.savedAt);
      if (fresh) {
        /* Data máme z cache a jsou čerstvá — na síť nechodíme. */
        readyResolve(state);
        return;
      }
    }

    try {
      const result = await loadFromNetwork();
      if (result) {
        apply(result.packs, result.source, result.fetchedAt);
        /* Ukázková data se do cache neukládají — ať nemátnou ostrý provoz. */
        if (result.source !== "demo") remember(result.packs, result.source);
      } else if (!cached) {
        state.status = "empty";
        readyResolve(state);
        return;
      }
    } catch {
      if (!cached) {
        state.status = "error";
        readyResolve(state);
        return;
      }
    }

    readyResolve(state);
  };

  /* První načtení odložíme na další smyčku, aby měl modpacky.js čas
     zaregistrovat posluchače události „minekube:releases“. */
  window.setTimeout(start, 0);

  /* ===================== VEŘEJNÉ API ===================== */

  const packOf = id => (id && state.packs[id]) || null;

  return {
    config: CONFIG,
    urls: URLS,
    repository: SLUG,
    releasesUrl: URLS.releasesUrl,
    ready,

    packs: () => state.packs,
    pack: packOf,
    latest: id => packOf(id)?.latest || null,

    /** Soubory ke stažení (bez checksumů) — primární první. */
    downloads: id => (packOf(id)?.latest?.files || []).filter(file => file.format === "mrpack" || file.format === "zip"),

    primaryFile: id => (packOf(id)?.latest?.files || []).find(file => file.format === "mrpack" || file.format === "zip") || null,

    primaryUrl: id => {
      const file = (packOf(id)?.latest?.files || []).find(candidate => candidate.format === "mrpack" || candidate.format === "zip");
      return file ? file.url : null;
    },

    releaseUrl: id => packOf(id)?.latest?.htmlUrl || null,

    status: () => ({ state: state.status, source: state.source, fetchedAt: state.fetchedAt }),

    /** Vynutí nové načtení (tlačítko/„?releases=refresh“). */
    refresh: async () => {
      state.status = "pending";
      const result = await loadFromNetwork().catch(() => null);
      if (result) {
        apply(result.packs, result.source, result.fetchedAt);
        if (result.source !== "demo") remember(result.packs, result.source);
      }
      return state;
    },

    onUpdate(callback) {
      const handler = event => callback(event.detail);
      document.addEventListener("minekube:releases", handler);
      if (state.status !== "pending") handler({ detail: { source: state.source, packs: state.packs, status: state.status } });
      return () => document.removeEventListener("minekube:releases", handler);
    }
  };
})();
