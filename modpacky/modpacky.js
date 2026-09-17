/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA MODPACKY — KATALOG (logika)
   Načítá se po app.js a po releases.js, takže používá jejich
   překlady (t), toast (showToast), modal (showModal/closeModal)
   i vydání z repozitáře MinekubeStudios/modpacky.
   Všechny texty jsou v i18n.js, tady je jen obsah balíčků níže.
   ============================================================= */

/* ===================== BALÍČKY — EDITUJ POUZE TADY =====================
   Ke každému balíčku se nejnovější vydání bere z repozitáře
   MinekubeStudios/modpacky podle `id` (viz releases.js) — odtamtud
   míří tlačítko „Stáhnout balíček“ na soubor .mrpack/.zip.

   mirrors: []            → dokud balíček nemá vydání, hlásí
                            „Odkaz připravujeme“
   mirrors: [{ label, url }] → záložní ruční zrcadlo pro dobu, než
                            balíček dostane první vydání v repozitáři
   focus:   klíče z i18n (packs.focus.*) — určují filtry i hledání
   accent / cover: barvy karty a banneru (--pack-accent[-rgb], --cover-bg) */
const MODPACKS = [
  {
    id: "ultra",
    name: "Minekube Ultra",
    badge: "ULTRA",
    version: "1.21.4",
    mc: "1.21",
    loader: "Fabric",
    focus: ["fps", "vanilla"],
    released: true,
    updated: "2026-08-24",
    fps: "+240 %",
    fpsValue: 240,
    ram: "4 GB",
    mods: "112",
    rank: 1,
    accent: "#ffc43d",
    accentRgb: "255,196,61",
    cover: "linear-gradient(135deg,#2b1206,#7a3705 38%,#ff9c17 70%,#ffd95a)",
    mirrors: [
      { label: "Game Jolt", url: "https://gamejolt.com/games/_/1053229" }
    ]
  },
  {
    id: "performance",
    name: "Minekube Performance",
    badge: "PERFORMANCE",
    version: "1.21.4",
    mc: "1.21",
    loader: "Fabric",
    focus: ["fps", "qol"],
    released: true,
    updated: "2026-08-11",
    fps: "+160 %",
    fpsValue: 160,
    ram: "3 GB",
    mods: "84",
    rank: 2,
    accent: "#49dcff",
    accentRgb: "73,220,255",
    cover: "linear-gradient(135deg,#041a24,#05596f 40%,#12b4d8 72%,#8bf0ff)",
    mirrors: []
  },
  {
    id: "pvp",
    name: "Minekube PvP",
    badge: "PVP",
    version: "1.21.1",
    mc: "1.21",
    loader: "Fabric",
    focus: ["pvp", "fps"],
    released: true,
    updated: "2026-07-29",
    fps: "+180 %",
    fpsValue: 180,
    ram: "3 GB",
    mods: "46",
    rank: 3,
    accent: "#ff5fd2",
    accentRgb: "255,95,210",
    cover: "linear-gradient(135deg,#25041d,#7a0758 40%,#e226b4 72%,#ff9ae4)",
    mirrors: []
  },
  {
    id: "lite",
    name: "Minekube Lite",
    badge: "LITE",
    version: "1.20.1",
    mc: "1.20",
    loader: "Fabric",
    focus: ["lowend", "qol"],
    released: true,
    updated: "2026-06-18",
    fps: "+120 %",
    fpsValue: 120,
    ram: "2 GB",
    mods: "58",
    rank: 4,
    accent: "#7dff9b",
    accentRgb: "125,255,155",
    cover: "linear-gradient(135deg,#04210f,#0a6634 42%,#19c46a 74%,#9dffc2)",
    mirrors: []
  },
  {
    id: "vanilla",
    name: "Minekube Vanilla+",
    badge: "VANILLA+",
    version: "1.21.4",
    mc: "1.21",
    loader: "NeoForge",
    focus: ["vanilla", "qol"],
    released: false,
    updated: "2026-09-02",
    fps: "+90 %",
    fpsValue: 90,
    ram: "4 GB",
    mods: "132",
    rank: 5,
    accent: "#c83cff",
    accentRgb: "200,60,255",
    cover: "linear-gradient(135deg,#1d0426,#5b0a86 40%,#a323e6 72%,#e2a6ff)",
    mirrors: []
  }
];

const PACK_FAVORITES_KEY = "minekube-packs-favorites";
const PACK_SORT_OPTIONS = ["featured", "az", "fps", "newest"];

/* ===================== STAV ===================== */

const packState = {
  search: "",
  filters: { loader: new Set(), version: new Set(), focus: new Set(), state: new Set() },
  sort: "featured",
  favorites: new Set(),
  /* Který balíček je právě otevřený v detailu — kvůli doplnění vydání. */
  openId: null
};

const packElements = {
  grid: document.getElementById("packGrid"),
  filters: document.getElementById("filtersPanel"),
  filterToggle: document.getElementById("filterToggle"),
  reset: document.getElementById("filtersReset"),
  resetEmpty: document.getElementById("emptyReset"),
  search: document.getElementById("packSearch"),
  toolbar: document.querySelector(".catalog-toolbar"),
  empty: document.getElementById("emptyState"),
  resultCount: document.getElementById("resultCount"),
  resultLabel: document.getElementById("resultLabel"),
  filterGroups: document.getElementById("filterGroups"),
  sortControl: document.getElementById("sortControl"),
  sortTrigger: document.getElementById("sortTrigger"),
  sortMenu: document.getElementById("sortMenu"),
  sortValue: document.getElementById("sortValue"),
  activeCount: document.getElementById("activeFilterCount")
};

/* ===================== POMOCNÉ ===================== */

const packById = id => MODPACKS.find(pack => pack.id === id);

/* ===================== VYDÁNÍ Z REPOZITÁŘE =====================
   releases.js (načtený před tímhle souborem) drží vydání balíčků
   z repozitáře MinekubeStudios/modpacky. Dokud data nedorazí,
   vrací všechny funkce null a web se chová jako dřív — tlačítko
   hlásí „Odkaz připravujeme“, případně použije ruční zrcadlo. */

const packReleaseApi = () => window.MinekubeReleases || null;
const packRelease = id => packReleaseApi()?.pack(id) || null;
const packLatest = id => packRelease(id)?.latest || null;
const packIsLive = pack => Boolean(pack) && (pack.released || Boolean(packLatest(pack.id)));
const packReleaseFiles = id => packReleaseApi()?.downloads(id) || [];
const packPrimaryFile = id => packReleaseApi()?.primaryFile(id) || null;
const packReleasesUrl = () => packReleaseApi()?.releasesUrl || null;
const packLocale = () => (currentLang === "cs" ? "cs-CZ" : currentLang === "sk" ? "sk-SK" : "en-GB");

const packDateLabel = value =>
  new Intl.DateTimeFormat(packLocale(), { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(String(value).includes("T") ? value : `${value}T12:00:00`)
  );

const packSizeLabel = size => {
  if (typeof size !== "number" || size <= 0) return null;

  const units = ["B", "kB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${new Intl.NumberFormat(packLocale(), { maximumFractionDigits: value >= 10 || unit === 0 ? 0 : 1 }).format(value)} ${units[unit]}`;
};

const packText = pack => [
  pack.name,
  pack.badge,
  pack.version,
  pack.loader,
  t(`pack.${pack.id}.desc`),
  t(`pack.${pack.id}.hardware`),
  ...[1, 2, 3].map(index => t(`pack.${pack.id}.f${index}`)),
  ...pack.focus.map(focus => t(`packs.focus.${focus}`))
].join(" ").toLowerCase();

/* Datum „naposledy aktualizováno“: když má balíček vydání v repozitáři,
   ukazujeme datum jeho publikace — statické datum z MODPACKS je jen záloha. */
const packUpdatedValue = pack => packLatest(pack.id)?.published || `${pack.updated}T12:00:00`;
const packUpdatedLabel = pack => packDateLabel(packUpdatedValue(pack));
const packUpdatedDate = pack => String(packUpdatedValue(pack)).slice(0, 10);

/* Nejdřív soubor z nejnovějšího vydání v repozitáři, teprve pak ruční zrcadlo. */
const packPrimaryMirror = pack => packPrimaryFile(pack.id)?.url || pack.mirrors[0]?.url || null;

/* Popis vydání (markdown z GitHubu) zjednodušíme na čitelný text. */
const packNotesText = notes =>
  String(notes || "")
    .replace(/\r/g, "")
    .replace(/^#{1,6}\s*(.+)$/gm, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();

const formatPackMessage = (key, pack, extra = {}) =>
  Object.entries({ pack: pack.name, ...extra }).reduce(
    (text, [token, value]) => text.replace(new RegExp(`\\{${token}\\}`, "g"), value),
    t(key)
  );

/* Ikony se skládají z jednoho zdroje — {c} nahradí předaná třída
   (v modalu se používá "modal-svg-icon", aby seděly rozměry design systému). */
const packIcon = (name, className = "") =>
  ({
    spark: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"></path></svg>',
    gauge: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M4.5 18a9 9 0 1 1 15 0M12 12l4-4"></path></svg>',
    cube: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"></path><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"></path></svg>',
    layers: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"></path><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"></path></svg>',
    download: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 11 4 4 4-4"></path><path d="M5 19h14"></path></svg>',
    check: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"></path></svg>',
    info: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.6h.01"></path></svg>',
    heart: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-9.5A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 3.1C19.5 15.4 12 20 12 20Z"></path></svg>',
    cpu: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"></rect><path d="M4 10V8a4 4 0 0 1 4-4h2M20 14v2a4 4 0 0 1-4 4h-2M14 4h2a4 4 0 0 1 4 4v2M10 20H8a4 4 0 0 1-4-4v-2"></path></svg>',
    shield: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3.5 7v5c0 5.2 3.6 8 8.5 9.5 4.9-1.5 8.5-4.3 8.5-9.5V7L12 3Z"></path><path d="m8.5 12 2.2 2.2 4.8-5"></path></svg>',
    clock: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5V12l3.2 2"></path></svg>',
    sword: '<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 20 4M14 4h6v6M10 20H4v-6"></path></svg>',
  }[name] || "").replace("{c}", className);

/* ===================== FILTROVÁNÍ ===================== */

const packMatchesSearch = pack => {
  if (!packState.search) return true;
  return packText(pack).includes(packState.search);
};

const packMatchesFilters = (pack, skipGroup = null) => {
  const { filters } = packState;

  if (skipGroup !== "loader" && filters.loader.size && !filters.loader.has(pack.loader)) return false;
  if (skipGroup !== "version" && filters.version.size && !filters.version.has(pack.version)) return false;
  if (skipGroup !== "state" && filters.state.size) {
    const stateKey = packIsLive(pack) ? "released" : "pending";
    if (!filters.state.has(stateKey)) return false;
  }
  if (skipGroup !== "focus" && filters.focus.size && !pack.focus.some(focus => filters.focus.has(focus))) return false;

  return true;
};

const packVisible = (pack, skipGroup = null) => packMatchesSearch(pack) && packMatchesFilters(pack, skipGroup);

const packSort = (a, b) => {
  if (packState.sort === "az") return a.name.localeCompare(b.name, "cs");
  if (packState.sort === "fps") return b.fpsValue - a.fpsValue;
  if (packState.sort === "newest") return packUpdatedDate(b).localeCompare(packUpdatedDate(a));

  const favoriteDiff = Number(packState.favorites.has(b.id)) - Number(packState.favorites.has(a.id));
  return favoriteDiff || a.rank - b.rank;
};

/* ===================== VYKRESLENÍ ===================== */

function packTagHtml(pack) {
  const tags = [
    { icon: packIcon("layers"), label: pack.loader },
    { icon: packIcon("cube"), label: `Minecraft ${pack.version}` },
    ...pack.focus.map(focus => ({ icon: packIcon("spark"), label: t(`packs.focus.${focus}`) }))
  ];

  return tags.map(tag => `<span class="tag">${tag.icon}<span>${escapeHtml(tag.label)}</span></span>`).join("");
}

function packStatsHtml(pack) {
  return [
    { icon: packIcon("gauge"), value: pack.fps, label: t("packs.stat.fps") },
    { icon: packIcon("cpu"), value: pack.ram, label: t("packs.stat.ram") },
    { icon: packIcon("cube"), value: pack.mods, label: t("packs.stat.mods") }
  ].map(stat => `
      <div class="pack-stat">
        ${stat.icon}
        <strong>${escapeHtml(stat.value)}</strong>
        <small>${stat.label}</small>
      </div>`).join("");
}

function packDownloadHtml(pack) {
  const file = packPrimaryFile(pack.id);
  const release = packLatest(pack.id);
  const url = packPrimaryMirror(pack);
  const particles = "<i></i>".repeat(10);
  const backdrop = "<i></i>".repeat(12);

  if (!url) {
    /* Vydání se ještě načítají — ukážeme klidný stav „připravujeme“,
       ať tlačítko nemění text dvakrát během jedné vteřiny. */
    return `
      <button class="release-pending-button" type="button" data-pending="${pack.id}">
        <span class="pending-button-ambient" aria-hidden="true"></span>
        <span class="pending-button-grid" aria-hidden="true"></span>
        <span class="pending-button-label">${t("packs.card.pending")}</span>
        <span class="pending-button-icon" aria-hidden="true">${packIcon("clock")}</span>
      </button>`;
  }

  const label = file ? t(`packs.card.download.${file.format}`) : t("packs.card.download");
  const title = release
    ? formatPackMessage("packs.card.downloadTitle", pack, { version: release.version, date: packUpdatedLabel(pack) })
    : t("packs.card.download");

  return `
      <a class="button button-primary download-ultimate" data-download="${pack.id}"
        ${release ? `data-release="${escapeHtml(release.tag || release.version)}"` : ""}
        aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}"
        href="${url}" target="_blank" rel="noopener noreferrer">
        <span class="download-fx" aria-hidden="true">
          <span class="download-plasma"></span>
          <span class="download-matrix"></span>
          <span class="download-sweep"></span>
          <span class="download-pulse-line"></span>
          <span class="download-particles">${particles}</span>
        </span>
        <span class="download-icon" aria-hidden="true">
          <span class="download-icon-orbit"></span>
          <svg viewBox="0 0 24 24"><path d="M12 4v10"></path><path d="m8 11 4 4 4-4"></path><path d="M5 19h14"></path></svg>
        </span>
        <span class="download-label">${label}</span>
        <span class="download-hover-back" aria-hidden="true">${backdrop}</span>
      </a>`;
}

/* Řádek pod tlačítky na kartě: které vydání se právě stahuje + rychlý
   odkaz na .zip, když balíček nabízí oba formáty. */
function packReleaseRowHtml(pack) {
  const release = packLatest(pack.id);
  if (!release) return "";

  const files = packReleaseFiles(pack.id);
  const primary = files.find(file => file.primary) || files[0] || null;
  const alternative = files.find(file => file !== primary) || null;

  return `
    <div class="pack-release-row">
      <span class="pack-release-chip" title="${escapeHtml(release.name || release.version)}">
        <i aria-hidden="true"></i>${t("packs.card.release")} <b>${escapeHtml(release.version)}</b>
        <span class="pack-release-date">${escapeHtml(packDateLabel(release.published))}</span>
        ${release.channel === "beta" ? `<span class="pack-release-beta">${t("packs.release.channel.beta")}</span>` : ""}
      </span>
      ${alternative ? `
      <a class="pack-alt-download" href="${alternative.url}" target="_blank" rel="noopener noreferrer"
        title="${escapeHtml(formatPackMessage("packs.card.downloadAltTitle", pack, { format: alternative.format }))}">
        .${escapeHtml(alternative.format)}
      </a>` : ""}
    </div>`;
}

function packCardHtml(pack, index) {
  const favorite = packState.favorites.has(pack.id);
  const live = packIsLive(pack);

  return `
  <article class="pack-card${live ? "" : " is-unreleased"}" data-pack="${pack.id}" id="pack-${pack.id}"
    style="--pack-accent:${pack.accent};--pack-accent-rgb:${pack.accentRgb};--cover-accent-rgb:${pack.accentRgb};--cube-c:${pack.accent};--cover-bg:${pack.cover};--i:${index}">
    <span class="pack-card-aura" aria-hidden="true"></span>
    <span class="pack-card-grid" aria-hidden="true"></span>
    <div class="pack-cover">
      <span class="pack-badge${live ? "" : " is-coming"}"><i aria-hidden="true"></i>${escapeHtml(pack.badge)}</span>
      <button class="favorite-button${favorite ? " active" : ""}" type="button" data-favorite="${pack.id}"
        aria-pressed="${favorite}" aria-label="${favorite ? t("packs.card.favoriteOn") : t("packs.card.favorite")}"
        title="${favorite ? t("packs.card.favoriteOn") : t("packs.card.favorite")}">
        <span class="favorite-orbit" aria-hidden="true"></span>
        ${packIcon("heart")}
        <span class="favorite-burst" aria-hidden="true"></span>
      </button>
      <div class="cover-cube" aria-hidden="true">
        <span class="face-top"></span>
        <span class="face-left"></span>
        <span class="face-right"></span>
      </div>
      <span class="cover-speed-lines" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="cover-hud cover-hud-left"><i aria-hidden="true"></i>${t("packs.card.coverLeft")}</span>
      <span class="cover-hud cover-hud-right"><i aria-hidden="true"></i>${t("packs.card.coverRight")}</span>
      <span class="cover-data-strip">
        <span><i aria-hidden="true"></i>FPS <b>${escapeHtml(pack.fps)}</b></span>
        <span>MC <b>${escapeHtml(pack.version)}</b></span>
        <span>${escapeHtml(pack.loader)}</span>
      </span>
    </div>
    <div class="pack-body">
      <div class="pack-title-row">
        <div class="pack-title-main">
          <span class="release-state${live ? "" : " is-coming"}">
            <i aria-hidden="true"></i>${live ? t("packs.release.stable") : t("packs.release.coming")}
          </span>
          <h3>${escapeHtml(pack.name)}</h3>
        </div>
        <div class="pack-version"><small>${t("packs.card.version")}</small>${escapeHtml(pack.version)}</div>
      </div>
      <p class="pack-description">${escapeHtml(t(`pack.${pack.id}.desc`))}</p>
      <div class="tag-row">${packTagHtml(pack)}</div>
      <div class="pack-stats">${packStatsHtml(pack)}</div>
      <div class="pack-actions">
        ${packDownloadHtml(pack)}
        <button class="details-button" type="button" data-details="${pack.id}"
          aria-label="${t("packs.card.details")}" title="${t("packs.card.details")}">${packIcon("info")}</button>
      </div>
      ${packReleaseRowHtml(pack)}
    </div>
  </article>`;
}

function packFilterGroupHtml(group, label, icon, values, active, counts) {
  const rows = values.map(value => {
    const count = counts[group]?.[value.key] ?? 0;
    return `
      <label class="check-row">
        <input type="checkbox" data-filter="${group}" value="${escapeHtml(value.key)}"${active.has(value.key) ? " checked" : ""}${count ? "" : " disabled"}>
        <span class="custom-check" aria-hidden="true"></span>
        <span>${escapeHtml(value.label)}</span>
        <small>${count}</small>
      </label>`;
  }).join("");

  return `
    <fieldset>
      <legend><span class="filter-legend-icon">${icon}</span>${label}</legend>
      ${rows}
    </fieldset>`;
}

function packCounts() {
  const counts = {};
  const loaders = [...new Set(MODPACKS.map(pack => pack.loader))].sort();
  const versions = [...new Set(MODPACKS.map(pack => pack.version))].sort().reverse();
  const focusKeys = [...new Set(MODPACKS.flatMap(pack => pack.focus))];

  counts.loader = Object.fromEntries(
    loaders.map(loader => [loader, MODPACKS.filter(pack => pack.loader === loader && packVisible(pack, "loader")).length])
  );
  counts.version = Object.fromEntries(
    versions.map(version => [version, MODPACKS.filter(pack => pack.version === version && packVisible(pack, "version")).length])
  );
  counts.focus = Object.fromEntries(
    focusKeys.map(focus => [focus, MODPACKS.filter(pack => pack.focus.includes(focus) && packVisible(pack, "focus")).length])
  );
  counts.state = {
    released: MODPACKS.filter(pack => packIsLive(pack) && packVisible(pack, "state")).length,
    pending: MODPACKS.filter(pack => !packIsLive(pack) && packVisible(pack, "state")).length
  };

  return counts;
}

function packFiltersHtml() {
  const counts = packCounts();
  const loaders = [...new Set(MODPACKS.map(pack => pack.loader))].sort();
  const versions = [...new Set(MODPACKS.map(pack => pack.version))].sort().reverse();
  const focusKeys = [...new Set(MODPACKS.flatMap(pack => pack.focus))];

  return [
    packFilterGroupHtml(
      "loader",
      t("packs.filter.loader"),
      packIcon("layers"),
      loaders.map(loader => ({ key: loader, label: loader })),
      packState.filters.loader,
      counts
    ),
    packFilterGroupHtml(
      "version",
      t("packs.filter.version"),
      packIcon("cube"),
      versions.map(version => ({ key: version, label: version })),
      packState.filters.version,
      counts
    ),
    packFilterGroupHtml(
      "focus",
      t("packs.filter.focus"),
      packIcon("spark"),
      focusKeys.map(focus => ({ key: focus, label: t(`packs.focus.${focus}`) })),
      packState.filters.focus,
      counts
    ),
    packFilterGroupHtml(
      "state",
      t("packs.filter.state"),
      packIcon("shield"),
      [
        { key: "released", label: t("packs.filter.state.released") },
        { key: "pending", label: t("packs.filter.state.pending") }
      ],
      packState.filters.state,
      counts
    )
  ].join("");
}

function renderPackFilters() {
  if (packElements.search) packElements.search.placeholder = t("packs.search.placeholder");
  if (!packElements.filterGroups) return;
  packElements.filterGroups.innerHTML = packFiltersHtml();
}

function renderPackGrid() {
  if (!packElements.grid) return;

  const visible = MODPACKS.filter(pack => packVisible(pack)).sort(packSort);
  const activeFilters =
    packState.filters.loader.size + packState.filters.version.size +
    packState.filters.focus.size + packState.filters.state.size;

  packElements.grid.innerHTML = visible.map((pack, index) => packCardHtml(pack, index)).join("");
  packElements.empty.hidden = visible.length > 0;
  packElements.grid.hidden = visible.length === 0;

  if (packElements.resultCount) packElements.resultCount.textContent = String(visible.length);
  if (packElements.resultLabel) {
    const key = visible.length === 1 ? "packs.results.one" : activeFilters || packState.search ? "packs.results.label" : "packs.results.all";
    packElements.resultLabel.textContent = t(key);
  }
  if (packElements.activeCount) packElements.activeCount.textContent = String(activeFilters);

  registerRevealElements(packElements.grid.querySelectorAll(".pack-card"), 55);
}

/* ===================== VLASTNÍ ŘAZENÍ ===================== */

function renderSortMenu() {
  if (!packElements.sortMenu) return;

  packElements.sortMenu.innerHTML = PACK_SORT_OPTIONS.map((option, index) => `
      <button class="sort-option" type="button" role="option" data-sort="${option}" aria-selected="${packState.sort === option}">
        <span class="sort-option-index">${String(index + 1).padStart(2, "0")}</span>
        <span>${t(`packs.sort.${option}`)}</span>
        ${packIcon("check")}
      </button>`).join("");

  if (packElements.sortValue) packElements.sortValue.textContent = t(`packs.sort.${packState.sort}`);
}

function openSortMenu() {
  if (!packElements.sortControl) return;
  packElements.sortControl.classList.add("is-open");
  packElements.sortTrigger?.setAttribute("aria-expanded", "true");
}

function closeSortMenu() {
  if (!packElements.sortControl) return;
  packElements.sortControl.classList.remove("is-open");
  packElements.sortTrigger?.setAttribute("aria-expanded", "false");
}

function setPackSort(option) {
  if (!PACK_SORT_OPTIONS.includes(option)) return;
  packState.sort = option;
  renderSortMenu();
  closeSortMenu();
  renderPackGrid();
}

/* ===================== OBLÍBENÉ ===================== */

function loadPackFavorites() {
  try {
    const stored = JSON.parse(safeStorage.get(PACK_FAVORITES_KEY, "[]"));
    packState.favorites = new Set(Array.isArray(stored) ? stored : []);
  } catch {
    packState.favorites = new Set();
  }
}

function savePackFavorites() {
  safeStorage.set(PACK_FAVORITES_KEY, JSON.stringify([...packState.favorites]));
}

function togglePackFavorite(id, button) {
  const pack = packById(id);
  if (!pack) return;

  const nowFavorite = !packState.favorites.has(id);
  if (nowFavorite) packState.favorites.add(id);
  else packState.favorites.delete(id);
  savePackFavorites();

  button.classList.toggle("active", nowFavorite);
  button.classList.remove("is-popping", "is-unpopping");
  void button.offsetWidth;
  button.classList.add(nowFavorite ? "is-popping" : "is-unpopping");
  button.setAttribute("aria-pressed", String(nowFavorite));
  button.setAttribute("aria-label", nowFavorite ? t("packs.card.favoriteOn") : t("packs.card.favorite"));
  button.setAttribute("title", nowFavorite ? t("packs.card.favoriteOn") : t("packs.card.favorite"));

  const burst = button.querySelector(".favorite-burst");
  if (burst) {
    burst.classList.toggle("is-unlove", !nowFavorite);
    burst.innerHTML = Array.from({ length: 10 }, (_, index) => {
      const angle = `${index * 36}deg`;
      const delay = `${index * 28}ms`;
      return `<i style="--favorite-angle:${angle};--favorite-delay:${delay}"></i>`;
    }).join("");
  }

  showToast(formatPackMessage(nowFavorite ? "packs.toast.favorite" : "packs.toast.unfavorite", pack), "favorite");
}

/* ===================== DETAIL BALÍČKU ===================== */

/* Blok „nejnovější vydání“ v modalu — soubory z repozitáře, checksum,
   changelog a starší vydání. Když balíček žádné vydání nemá, zůstane
   původní chování (ruční zrcadla / „odkaz připravujeme“). */
function packModalReleaseHtml(pack, ic) {
  const release = packLatest(pack.id);
  const files = packReleaseFiles(pack.id);
  const history = packRelease(pack.id)?.history || [];

  if (!release) {
    const mirrors = pack.mirrors.length
      ? pack.mirrors.map(mirror => `
        <a class="button button-primary modal-download-button" href="${mirror.url}" target="_blank" rel="noopener noreferrer">
          <span class="download-label">${escapeHtml(mirror.label)}</span>
        </a>`).join("")
      : null;

    return `
      <div class="modal-download">
        <span class="modal-release-icon" aria-hidden="true">${ic(mirrors ? "download" : "clock")}</span>
        <div class="modal-release-copy">
          <span>${mirrors ? t("packs.modal.download.title") : t("packs.modal.download.pendingTitle")}</span>
          <strong>${mirrors ? t("packs.modal.download.note") : t("packs.modal.download.pendingNote")}</strong>
        </div>
        ${mirrors || `<button class="button button-secondary modal-download-button" type="button" data-close-modal>${t("packs.modal.download.pendingButton")}</button>`}
      </div>`;
  }

  const sizeOf = format => {
    const file = files.find(candidate => candidate.format === format);
    const label = file ? packSizeLabel(file.size) : null;
    return label ? `${label} .${format}` : null;
  };

  const buttons = files.map((file, index) => `
        <a class="button ${index === 0 ? "button-primary" : "button-secondary"} modal-download-button modal-release-button"
          href="${file.url}" target="_blank" rel="noopener noreferrer" data-release-file="${pack.id}">
          <span class="${index === 0 ? "download-label" : "modal-release-button-text"}">${t(`packs.release.file.${file.format}`)}</span>
        </a>`).join("");

  const meta = [t("packs.release.version"), release.version, "·", packDateLabel(release.published)]
    .concat(sizeOf("mrpack") ? ["·", sizeOf("mrpack")] : [])
    .concat(sizeOf("zip") ? ["·", sizeOf("zip")] : []);

  const checksumFile = release.files.find(file => file.sha256);

  const notes = packNotesText(release.notes);
  const notesPanel = notes
    ? `
      <details class="modal-release-notes">
        <summary>${escapeHtml(formatPackMessage("packs.release.notes", pack, { version: release.version }))}</summary>
        <p>${escapeHtml(notes)}</p>
      </details>`
    : "";

  const historyPanel = history.length
    ? `
      <details class="modal-release-history">
        <summary>${t("packs.release.history")} (${history.length})</summary>
        <ul>
          ${history.slice(0, 6).map(entry => `
            <li>
              <span class="modal-history-version">${escapeHtml(entry.version)}${entry.channel === "beta" ? ` <b>${t("packs.release.channel.beta")}</b>` : ""}</span>
              <span class="modal-history-date">${escapeHtml(packDateLabel(entry.published))}</span>
              <span class="modal-history-links">
                ${["mrpack", "zip"].map(format => {
                  const file = entry.files.find(candidate => candidate.format === format);
                  return file
                    ? `<a href="${file.url}" target="_blank" rel="noopener noreferrer">.${format}</a>`
                    : "";
                }).join("")}
                <a class="modal-history-page" href="${entry.htmlUrl}" target="_blank" rel="noopener noreferrer">${t("packs.release.page")}</a>
              </span>
            </li>`).join("")}
        </ul>
      </details>`
    : "";

  return `
      <div class="modal-download">
        <span class="modal-release-icon" aria-hidden="true">${ic("download")}</span>
        <div class="modal-release-copy">
          <span>${t("packs.release.latest")}${release.channel === "beta" ? ` · ${t("packs.release.channel.beta")}` : ""}</span>
          <strong>${escapeHtml(release.name || `${pack.name} ${release.version}`)}</strong>
          <small>${meta.map(escapeHtml).join(" ")}</small>
        </div>
        <div class="modal-release-actions">${buttons}</div>
      </div>
      <div class="modal-release-meta">
        <span class="modal-release-meta-icon" aria-hidden="true">${ic("shield")}</span>
        <div>
          <small>${t("packs.release.checksum")}</small>
          <p title="${checksumFile ? escapeHtml(checksumFile.sha256) : ""}">${checksumFile ? escapeHtml(checksumFile.sha256) : t("packs.release.checksumMissing")}</p>
        </div>
        <div class="modal-release-links">
          <a href="${release.htmlUrl}" target="_blank" rel="noopener noreferrer">${t("packs.release.page")}</a>
          ${packReleasesUrl() ? `<a href="${packReleasesUrl()}" target="_blank" rel="noopener noreferrer">${t("packs.release.all")}</a>` : ""}
        </div>
      </div>
      ${notesPanel}
      ${historyPanel}`;
}

function packModalHtml(pack) {
  const ic = name => packIcon(name, "modal-svg-icon");

  const requirements = [
    { icon: ic("cube"), label: t("packs.modal.requirement.mc"), value: `${pack.mc} (${pack.version})` },
    { icon: ic("layers"), label: t("packs.modal.requirement.loader"), value: pack.loader },
    { icon: ic("cpu"), label: t("packs.modal.requirement.ram"), value: pack.ram },
    { icon: ic("spark"), label: t("packs.modal.requirement.hardware"), value: t(`pack.${pack.id}.hardware`) }
  ];

  const stats = [
    { icon: ic("gauge"), label: t("packs.stat.fps"), value: pack.fps },
    { icon: ic("cpu"), label: t("packs.stat.ram"), value: pack.ram },
    { icon: ic("cube"), label: t("packs.stat.mods"), value: pack.mods },
    { icon: ic("clock"), label: t("packs.modal.updated"), value: packUpdatedLabel(pack) }
  ];

  const modalRelease = packModalReleaseHtml(pack, ic);

  return `
    <div class="modal-hero" style="--cover-bg:${pack.cover}">
      <div class="modal-hero-layout">
        <div class="modal-hero-copy">
          <span class="modal-kicker">${ic("cube")}${t("packs.modal.kicker")}</span>
          <h2 id="modalTitle">${escapeHtml(pack.name)}</h2>
          <p><span>Minecraft ${escapeHtml(pack.version)}</span><i aria-hidden="true"></i><span>${escapeHtml(pack.loader)}</span><i aria-hidden="true"></i><span>${escapeHtml(pack.badge)}</span></p>
          <div class="modal-hero-status">
            <span><b aria-hidden="true"></b>${packIsLive(pack) ? t("packs.release.stable") : t("packs.release.coming")}</span>
          </div>
        </div>
        <div class="modal-power-core" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3"></circle>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="264" stroke-dashoffset="78" transform="rotate(-90 50 50)"></circle>
          </svg>
          <strong>${escapeHtml(pack.fps)}</strong>
          <small>FPS</small>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-stats">
        ${stats.map(stat => `
          <div class="modal-stat-card">
            <span class="modal-stat-icon">${stat.icon}</span>
            <div><small>${stat.label}</small><strong>${escapeHtml(stat.value)}</strong></div>
          </div>`).join("")}
      </div>

      <div class="modal-description">
        <span class="modal-description-icon">${ic("info")}</span>
        <div>
          <small>${t("packs.modal.aboutIcon")}</small>
          <p>${escapeHtml(t(`pack.${pack.id}.desc`))}</p>
        </div>
      </div>

      <div class="modal-columns">
        <div class="modal-panel">
          <div class="modal-panel-heading">
            <span>${ic("spark")}</span>
            <div><small>${t("packs.modal.featuresIcon")}</small><h3>${t("packs.modal.features")}</h3></div>
          </div>
          <ul class="modal-feature-list">
            ${[1, 2, 3].map(index => `
              <li>
                <span class="modal-list-icon">${ic("check")}</span>
                <span>${escapeHtml(t(`pack.${pack.id}.f${index}`))}</span>
                <b aria-hidden="true">${ic("check")}</b>
              </li>`).join("")}
          </ul>
        </div>
        <div class="modal-panel modal-panel-requirements">
          <div class="modal-panel-heading">
            <span>${ic("shield")}</span>
            <div><small>${t("packs.modal.requirementsIcon")}</small><h3>${t("packs.modal.requirements")}</h3></div>
          </div>
          <ul class="modal-feature-list">
            ${requirements.map(item => `
              <li>
                <span class="modal-list-icon">${item.icon}</span>
                <span>${item.label} — <b>${escapeHtml(item.value)}</b></span>
                <b aria-hidden="true">${ic("check")}</b>
              </li>`).join("")}
          </ul>
        </div>
      </div>

      ${modalRelease}
    </div>`;
}

function openPackModal(id) {
  const pack = packById(id);
  if (!pack) return;

  const modalContent = document.getElementById("modalContent");
  if (!modalContent) return;

  packState.openId = id;
  modalContent.dataset.pack = id;
  modalContent.innerHTML = packModalHtml(pack);
  showModal();
}

/* Vydání se můžou načíst až po otevření detailu (nebo se přepne jazyk) —
   obsah modalu v tu chvíli překreslíme, ať tlačítka míří na soubory
   z nejnovějšího vydání. */
function refreshPackModal() {
  const modalContent = document.getElementById("modalContent");
  const modalBackdrop = document.getElementById("modalBackdrop");
  if (!modalContent || !modalBackdrop || modalBackdrop.hidden) return;

  const pack = packById(modalContent.dataset.pack || packState.openId);
  if (!pack) return;

  modalContent.dataset.pack = pack.id;
  modalContent.innerHTML = packModalHtml(pack);
}

/* ===================== INTERAKCE ===================== */

function setPackSearch(value) {
  packState.search = value.trim().toLowerCase();
  renderPackFilters();
  renderPackGrid();
}

function resetPackFilters({ silent = false } = {}) {
  ["loader", "version", "focus", "state"].forEach(group => packState.filters[group].clear());
  packState.search = "";
  if (packElements.search) packElements.search.value = "";

  renderPackFilters();
  renderPackGrid();

  if (!silent) showToast(t("packs.toast.filterReset"), "warning", 2400);
}

function focusPackCard(id) {
  const card = document.getElementById(`pack-${id}`);
  if (!card) return;

  card.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "center" });
  card.classList.remove("is-highlighted");
  void card.offsetWidth;
  card.classList.add("is-highlighted");
  window.setTimeout(() => card.classList.remove("is-highlighted"), 2600);
}

function initializePackCatalog() {
  if (!packElements.grid) return;

  /* Odkazy na repozitář s modpacky bereme z releases.js — když se repo
     přejmenuje, stačí to změnit na jednom místě. */
  document.querySelectorAll("[data-repo-link]").forEach(link => {
    const url = packReleasesUrl();
    if (url) link.href = url;
  });

  loadPackFavorites();
  renderPackFilters();
  renderSortMenu();
  renderPackGrid();

  // Karty: oblíbené, detail, stažení, „odkaz připravujeme“.
  packElements.grid.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      togglePackFavorite(favoriteButton.dataset.favorite, favoriteButton);
      return;
    }

    const pendingButton = event.target.closest("[data-pending]");
    if (pendingButton) {
      const pack = packById(pendingButton.dataset.pending);
      if (pack) showToast(formatPackMessage("packs.toast.pending", pack), "warning", 3200);
      if (pack) openPackModal(pack.id);
      return;
    }

    const detailsButton = event.target.closest("[data-details]");
    if (detailsButton) {
      const id = detailsButton.dataset.details;
      detailsButton.classList.remove("is-activating");
      void detailsButton.offsetWidth;
      detailsButton.classList.add("is-activating");
      window.setTimeout(() => openPackModal(id), prefersReducedMotion.matches ? 0 : 180);
      return;
    }

    const downloadLink = event.target.closest("[data-download]");
    if (downloadLink) {
      const pack = packById(downloadLink.dataset.download);
      if (!pack) return;

      const release = packLatest(pack.id);
      showToast(
        release
          ? formatPackMessage("packs.toast.release", pack, { version: release.version })
          : formatPackMessage("packs.toast.download", pack),
        "download",
        2600
      );
      downloadLink.classList.add("download-animating");
      window.setTimeout(() => downloadLink.classList.remove("download-animating"), 1500);
    }
  });

  // Soubory ke stažení v modalu jsou mimo mřížku, proto vlastní posluchač.
  document.getElementById("modalContent")?.addEventListener("click", event => {
    const releaseFile = event.target.closest("[data-release-file]");
    if (!releaseFile) return;

    const pack = packById(releaseFile.dataset.releaseFile);
    const release = pack ? packLatest(pack.id) : null;
    if (pack && release) {
      showToast(formatPackMessage("packs.toast.release", pack, { version: release.version }), "download", 2400);
    }
  });

  // Hover a 3D náklon stahovacího tlačítka (stejné CSS jako na původním webu).
  packElements.grid.addEventListener("pointermove", event => {
    const button = event.target.closest(".download-ultimate");
    if (!button || prefersReducedMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;

    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    button.classList.add("is-pointer-active");
    button.style.setProperty("--pointer-x", `${x * 100}%`);
    button.style.setProperty("--pointer-y", `${y * 100}%`);
    button.style.setProperty("--tilt-y", `${(x - .5) * 8}deg`);
    button.style.setProperty("--tilt-x", `${(y - .5) * -8}deg`);
    button.style.setProperty("--magnet-x", `${(x - .5) * 6}px`);
    button.style.setProperty("--magnet-y", `${(y - .5) * 6}px`);
  });

  packElements.grid.addEventListener("pointerout", event => {
    const button = event.target.closest(".download-ultimate");
    if (!button || button.contains(event.relatedTarget)) return;

    button.classList.remove("is-pointer-active");
    button.style.setProperty("--tilt-y", "0deg");
    button.style.setProperty("--tilt-x", "0deg");
    button.style.setProperty("--magnet-x", "0px");
    button.style.setProperty("--magnet-y", "0px");
  });

  // Filtry (checkboxy se překreslují, proto delegace přes formulář).
  packElements.filters?.addEventListener("change", event => {
    const input = event.target.closest("[data-filter]");
    if (!input) return;

    const group = input.dataset.filter;
    if (input.checked) packState.filters[group].add(input.value);
    else packState.filters[group].delete(input.value);

    renderPackFilters();
    renderPackGrid();
  });

  packElements.reset?.addEventListener("click", () => resetPackFilters());
  packElements.resetEmpty?.addEventListener("click", () => resetPackFilters({ silent: true }));

  packElements.search?.addEventListener("input", event => setPackSearch(event.target.value));

  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      packElements.search?.focus();
    }
  });

  // Vlastní řazení.
  packElements.sortTrigger?.addEventListener("click", () => {
    if (packElements.sortControl.classList.contains("is-open")) closeSortMenu();
    else openSortMenu();
  });

  packElements.sortMenu?.addEventListener("click", event => {
    const option = event.target.closest("[data-sort]");
    if (option) setPackSort(option.dataset.sort);
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("#sortControl")) closeSortMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSortMenu();
  });

  // Profily v hero panelu přepnou katalog na konkrétní balíček.
  document.querySelectorAll("[data-profile]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const id = link.dataset.profile;
      const pack = packById(id);
      if (!pack) return;

      resetPackFilters({ silent: true });
      focusPackCard(id);
      showToast(`${pack.name} — ${t(`pack.${pack.id}.desc`)}`, "warning", 3600);
    });
  });

  // Filtry na mobilu.
  packElements.filterToggle?.addEventListener("click", () => {
    const open = packElements.filters.classList.toggle("mobile-open");
    packElements.filterToggle.setAttribute("aria-expanded", String(open));
  });

  // Překreslení textů při přepnutí jazyka (app.js posílá událost).
  document.addEventListener("minekube:language", () => {
    renderPackFilters();
    renderSortMenu();
    renderPackGrid();
    refreshPackModal();
  });

  // Dorazila vydání z repozitáře (releases.js) — karty i otevřený detail
  // se překreslí, takže tlačítka míří na nejnovější soubory ke stažení.
  document.addEventListener("minekube:releases", () => {
    renderPackFilters();
    renderPackGrid();
    refreshPackModal();
  });

  // Detail se může otevřít dřív, než dorazí vydání — připomeneme si stav.
  const modalBackdrop = document.getElementById("modalBackdrop");
  modalBackdrop?.addEventListener("click", event => {
    if (event.target.closest("[data-close-modal]")) packState.openId = null;
  });
}

initializePackCatalog();
