document.documentElement.classList.add("js");

const safeStorage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Web zůstane plně funkční i v režimu, kde je úložiště blokované.
    }
  }
};

const modpacks = [
  {
    id: "ultra-performance",
    name: "Ultra Performance",
    shortName: "Ultra Performance - Release",
    description: "Maximálně optimalizovaný FPS modpack.",
    longDescription: "Maximálně optimalizovaný FPS modpack pro Minecraft 1.21.1 s Fabric loaderem.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Maximum FPS",
    tags: ["Fabric", "Client", "Maximum FPS"],
    badge: "DOPORUČENO",
    status: "released",
    statusLabel: "STABLE RELEASE",
    downloads: 24870,
    performance: "10/10",
    fps: 1000,
    fpsLabel: "1000 FPS+",
    updated: "2026-07-18",
    release: "1.21.1",
    size: "95 MB",
    mods: 80,
    downloadUrl: "https://github.com/MinekubeStudios/minekubestudios.github.io/releases/download/v1.21.1/Minekube-Ultra-Performance-1.21.1.zip",
    downloadFileName: "Minekube-Ultra-Performance-1.21.1.zip",
    gameJoltUrl: "https://gamejolt.com/games/_/1053229",
    color: "linear-gradient(135deg, #04130b 0%, #0a3d20 34%, #159447 62%, #d1a31a 83%, #ffd85a 100%)",
    cube: ["#fff07a", "#e9b91e", "#178f43"],
    accentRgb: "63, 232, 126",
    accent: "#49ef8c",
    visual: "ultra",
    features: [
      "Maximum FPS profil",
      "Optimalizované vykreslování chunků",
      "Rychlejší start hry",
      "Nízké využití operační paměti",
      "Přednastavené video nastavení"
    ],
    requirements: [
      "Minecraft Java Edition",
      "Doporučeno 4 GB RAM pro instanci",
      "Java 21 pro řadu 1.21.x",
      "Samostatná čistá instance"
    ]
  },
  {
    id: "insider-performance",
    name: "Insider Performance",
    shortName: "Insider Performance",
    description: "Experimentální profil s nejnovějšími výkonovými optimalizacemi.",
    longDescription: "Připravovaný experimentální výkonový profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Insider",
    tags: ["Fabric", "Client", "Insider"],
    badge: "INSIDER BUILD",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-23",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #170a02 0%, #7d2604 34%, #f0780b 62%, #e6a51b 82%, #ffe06a 100%)",
    cube: ["#fff09c", "#f4a616", "#e86b08"],
    accentRgb: "255, 132, 22",
    accent: "#ff8c24",
    visual: "insider"
  },
  {
    id: "balanced-performance",
    name: "Balanced Performance",
    shortName: "Balanced Performance",
    description: "Vyvážený poměr vysokých FPS, stability a vizuální kvality.",
    longDescription: "Připravovaný vyvážený profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Balanced",
    tags: ["Fabric", "Client", "Balanced"],
    badge: "BALANCED",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-22",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #03101d 0%, #0d356f 34%, #1676cf 61%, #d29d1d 83%, #ffe06a 100%)",
    cube: ["#fff09c", "#e7b72b", "#1674c9"],
    accentRgb: "67, 158, 255",
    accent: "#4a9eff",
    visual: "balanced"
  },
  {
    id: "quality-performance",
    name: "Quality Performance",
    shortName: "Quality Performance",
    description: "Vysoká vizuální kvalita bez zbytečné ztráty výkonu.",
    longDescription: "Připravovaný kvalitativní profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "Quality",
    tags: ["Fabric", "Client", "Quality"],
    badge: "QUALITY",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-21",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #190405 0%, #6e1015 33%, #d52e31 61%, #d69f1c 82%, #ffe16d 100%)",
    cube: ["#fff0a0", "#e5b62b", "#cc2830"],
    accentRgb: "255, 74, 81",
    accent: "#ff4a51",
    visual: "quality"
  },
  {
    id: "pvp-performance",
    name: "PvP Performance",
    shortName: "PvP Performance",
    description: "Rychlá odezva a čisté nastavení pro kompetitivní hraní.",
    longDescription: "Připravovaný kompetitivní profil Minekube Studios.",
    versions: ["1.21.1"],
    loader: "Fabric",
    category: "PvP",
    tags: ["Fabric", "Client", "PvP"],
    badge: "PVP PROFILE",
    status: "unreleased",
    statusLabel: "VE VÝVOJI",
    downloads: 0,
    performance: "TBA",
    fps: 0,
    fpsLabel: "TBA",
    updated: "2026-07-20",
    release: "1.21.1",
    size: "TBA",
    mods: "TBA",
    color: "linear-gradient(135deg, #12051d 0%, #421069 34%, #8220bd 61%, #d4a11e 83%, #ffe06c 100%)",
    cube: ["#fff0a0", "#e7b52b", "#8d25c7"],
    accentRgb: "190, 78, 255",
    accent: "#bd55ff",
    visual: "pvp"
  }
];

const state = {
  query: "",
  versions: new Set(),
  loaders: new Set(),
  categories: new Set(),
  sort: "featured",
  favorites: new Set(JSON.parse(safeStorage.get("minekube-favorites", "[]")))
};

const packGrid = document.getElementById("packGrid");
const resultCount = document.getElementById("resultCount");
const resultLabel = document.getElementById("resultLabel");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filtersPanel = document.querySelector(".filters-panel");
const filterToggle = document.getElementById("filterToggle");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const toast = document.getElementById("toast");
let modalCloseTimer = null;
let lastModalTrigger = null;

function formatDownloads(value) {
  return new Intl.NumberFormat("cs-CZ", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}


function modalIcon(name, className = "") {
  const icons = {
    verified: '<path d="M12 3.2 14.2 5l2.8-.2.8 2.7 2.4 1.5-1.1 2.6 1.1 2.6-2.4 1.5-.8 2.7-2.8-.2L12 20.8 9.8 19l-2.8.2-.8-2.7L3.8 15l1.1-2.6-1.1-2.6 2.4-1.5L7 5.6l2.8.2L12 3.2Z"/><path d="m8.7 12.1 2.1 2.1 4.6-4.8"/>',
    game: '<path d="M6.4 8.2h11.2a3.4 3.4 0 0 1 3.2 4.5l-1.5 4.5a2.3 2.3 0 0 1-3.8.9l-1.3-1.2H9.8l-1.3 1.2a2.3 2.3 0 0 1-3.8-.9l-1.5-4.5a3.4 3.4 0 0 1 3.2-4.5Z"/><path d="M8 11v4M6 13h4M16.7 12.2h.1M18.4 14h.1"/>',
    cubes: '<path d="m12 3 7 4-7 4-7-4 7-4Z"/><path d="m5 7 7 4 7-4M5 12l7 4 7-4M5 17l7 4 7-4"/>',
    archive: '<path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3zM9 11h6"/>',
    speed: '<path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/>',
    rocket: '<path d="M14.5 5.5c2.2-2.2 4.6-2.4 5.4-2.3.1.8-.1 3.2-2.3 5.4l-4 4-3.4-.6-.6-3.4 4-4Z"/><path d="m9.7 10.3-3.2.5-2.4 2.4 4.1.8M13.7 14.3l-.5 3.2-2.4 2.4-.8-4.1M15.6 7.4h.1"/>',
    chunks: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/>',
    memory: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 10h8v4H8zM8 4v3M12 4v3M16 4v3M8 17v3M12 17v3M16 17v3M2 10h3M2 14h3M19 10h3M19 14h3"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 4v6M16 14v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    java: '<path d="M8 18h8M9 21h6M8.5 14.5h7l-.7 3.5H9.2l-.7-3.5Z"/><path d="M11 3c3 2-2 3.3 1 5.2M14 4.5c2 1.4-1.2 2.5.5 3.8"/>',
    layers: '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 20h14"/>',
    shield: '<path d="M12 3 19 6v5c0 4.4-2.7 7.8-7 10-4.3-2.2-7-5.6-7-10V6l7-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>'
  };
  return `<svg class="modal-svg-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.check}</svg>`;
}

function createDownloadButton(packId, label, extraClass = "") {
  return `
    <button class="button button-primary download-ultimate ${extraClass}" type="button" data-download="${packId}" aria-label="${label}">
      <span class="download-hover-back" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </span>
      <span class="download-fx" aria-hidden="true">
        <span class="download-plasma"></span>
        <span class="download-matrix"></span>
        <span class="download-sweep"></span>
        <span class="download-pulse-line"></span>
        <span class="download-particles">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
      </span>
      <span class="download-label">${label}</span>
      <span class="download-icon" aria-hidden="true">
        <span class="download-icon-orbit"></span>
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>
      </span>
    </button>
  `;
}

function createUnreleasedButton(packId) {
  return `
    <button class="release-pending-button" type="button" data-unreleased="${packId}" aria-label="${'Zatím nevydáno'}" title="Tento modpack zatím není vydaný">
      <span class="pending-button-ambient" aria-hidden="true"></span>
      <span class="pending-button-grid" aria-hidden="true"></span>
      <span class="pending-button-label">Zatím nevydáno</span>
      <span class="pending-button-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2"/><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M12 14v2"/></svg>
      </span>
    </button>
  `;
}

function createPackCard(pack) {
  const favorite = state.favorites.has(pack.id);
  const isReleased = pack.status === "released";
  const tagIcons = {
    Fabric: '<path d="M5 7h14v10H5z"/><path d="M8 4v3M12 4v3M16 4v3M8 17v3M12 17v3M16 17v3"/>',
    Client: '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "Maximum FPS": '<path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/>',
    Insider: '<path d="M12 3 5 6v5c0 4.6 2.7 7.8 7 10 4.3-2.2 7-5.4 7-10V6l-7-3Z"/><path d="M9 12h6M12 9v6"/>',
    Balanced: '<path d="M12 3v18M5 7h14M7 7l-3 5h6L7 7ZM17 7l-3 5h6l-3-5Z"/>',
    Quality: '<path d="m12 3 2.6 5.2 5.7.8-4.1 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.1-4 5.7-.8L12 3Z"/>',
    PvP: '<path d="m7 4 10 16M17 4 7 20M5 7h14M5 17h14"/>'
  };

  const actionMarkup = isReleased
    ? `${createDownloadButton(pack.id, "Stáhnout Modpack", "download-button")}
       <button class="details-button" type="button" data-details="${pack.id}" aria-label="Zobrazit detail ${pack.name}" title="Detail modpacku">
         <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
       </button>`
    : createUnreleasedButton(pack.id);

  return `
    <article class="pack-card pack-card-${pack.visual || "default"} ${isReleased ? "is-released" : "is-unreleased"}" data-pack-id="${pack.id}" style="--pack-accent:${pack.accent}; --pack-accent-rgb:${pack.accentRgb}">
      <span class="pack-card-aura" aria-hidden="true"></span>
      <span class="pack-card-grid" aria-hidden="true"></span>
      <div class="pack-cover" style="--cover-bg:${pack.color}; --cube-a:${pack.cube[0]}; --cube-b:${pack.cube[1]}; --cube-c:${pack.cube[2]}; --cover-accent:${pack.accent}; --cover-accent-rgb:${pack.accentRgb}">
        <span class="pack-badge ${isReleased ? "" : "is-coming"}"><i></i>${pack.badge}</span>
        <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-favorite="${pack.id}" aria-label="${favorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}" aria-pressed="${favorite}">
          <span class="favorite-orbit" aria-hidden="true"></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
        </button>
        <div class="cover-speed-lines"><i></i><i></i><i></i></div>
        <div class="cover-hud cover-hud-left" aria-hidden="true"><i></i><span>PERFORMANCE CORE</span></div>
        <div class="cover-hud cover-hud-right" aria-hidden="true"><span>MK // ${String(modpacks.indexOf(pack) + 1).padStart(2, "0")}</span><i></i></div>
        <div class="cover-cube" aria-hidden="true">
          <span class="face-top"></span>
          <span class="face-left"></span>
          <span class="face-right"></span>
        </div>
        <div class="cover-data-strip" aria-hidden="true"><span><i></i> ${isReleased ? "LIVE BUILD" : "IN DEVELOPMENT"}</span><b>${isReleased ? "FPS ENGINE" : "COMING SOON"}</b></div>
      </div>
      <div class="pack-body">
        <div class="pack-title-row">
          <div class="pack-title-main">
            <span class="release-state ${isReleased ? "" : "is-coming"}"><i></i> ${pack.statusLabel}</span>
            <h3>${pack.name}</h3>
          </div>
          <span class="pack-version"><small>MINECRAFT</small>${pack.release}</span>
        </div>
        <p class="pack-description">${pack.description}</p>
        <div class="tag-row">
          ${pack.tags.map(tag => `<span class="tag"><svg viewBox="0 0 24 24" aria-hidden="true">${tagIcons[tag] || '<path d="m5 12 4 4L19 6"/>'}</svg>${tag}</span>`).join("")}
        </div>
        <div class="pack-stats">
          <span class="pack-stat" title="Celkový výkon">
            <svg viewBox="0 0 24 24"><path d="M4.9 18a8 8 0 1 1 14.2 0"/><path d="m12 14 4.5-4.5M8 18h8"/></svg>
            <small>VÝKON</small><strong>${pack.performance}</strong>
          </span>
          <span class="pack-stat" title="Počet modů">
            <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>
            <small>MODŮ</small><strong>${pack.mods}</strong>
          </span>
          <span class="pack-stat" title="Maximální FPS">
            <svg viewBox="0 0 24 24"><path d="M5 17a7 7 0 1 1 14 0"/><path d="m12 17 4-5"/></svg>
            <small>MAX FPS</small><strong>${pack.fpsLabel}</strong>
          </span>
        </div>
        <div class="pack-actions ${isReleased ? "" : "pending-only"}">
          ${actionMarkup}
        </div>
      </div>
    </article>
  `;
}

function getFilteredPacks() {
  const query = state.query.trim().toLocaleLowerCase("cs");

  let result = modpacks.filter(pack => {
    const searchable = `${pack.name} ${pack.description} ${pack.loader} ${pack.category} ${pack.tags.join(" ")}`.toLocaleLowerCase("cs");
    const queryMatch = !query || searchable.includes(query);
    const versionMatch = state.versions.size === 0 || pack.versions.some(version => state.versions.has(version));
    const loaderMatch = state.loaders.size === 0 || state.loaders.has(pack.loader);
    const categoryMatch = state.categories.size === 0 || state.categories.has(pack.category);
    return queryMatch && versionMatch && loaderMatch && categoryMatch;
  });

  const sorters = {
    featured: (a, b) => modpacks.indexOf(a) - modpacks.indexOf(b),
    downloads: (a, b) => b.downloads - a.downloads,
    fps: (a, b) => b.fps - a.fps,
    newest: (a, b) => new Date(b.updated) - new Date(a.updated),
    name: (a, b) => a.name.localeCompare(b.name, "cs")
  };

  return result.sort(sorters[state.sort]);
}

function renderPacks() {
  const filtered = getFilteredPacks();
  packGrid.innerHTML = filtered.map(createPackCard).join("");
  requestAnimationFrame(() => registerRevealElements(packGrid.querySelectorAll(".pack-card"), 90));
  resultCount.textContent = filtered.length;
  if (resultLabel) {
    const releasedCount = filtered.filter(pack => pack.status === "released").length;
    resultLabel.textContent = filtered.length === 1
      ? (releasedCount === 1 ? "profil · 1 vydaný" : "profil · připravujeme")
      : `${filtered.length} profilů · ${releasedCount} vydaný`;
  }
  emptyState.hidden = filtered.length !== 0;
  packGrid.hidden = filtered.length === 0;
}

function updateFilterState(input) {
  const collection = input.name === "version"
    ? state.versions
    : input.name === "loader"
      ? state.loaders
      : state.categories;

  input.checked ? collection.add(input.value) : collection.delete(input.value);
  renderPacks();
}

function resetFilters() {
  state.query = "";
  state.versions.clear();
  state.loaders.clear();
  state.categories.clear();
  searchInput.value = "";
  document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => input.checked = false);
  renderPacks();
}

function openPackModal(pack) {
  const featureIcons = ["speed", "chunks", "rocket", "memory", "settings"];
  const requirementIcons = ["game", "memory", "java", "layers"];

  modalContent.innerHTML = `
    <div class="modal-hero" style="--cover-bg:${pack.color}">
      <span class="modal-hero-grid-lines" aria-hidden="true"></span>
      <span class="modal-hero-glow" aria-hidden="true"></span>
      <div class="modal-hero-layout">
        <div class="modal-hero-copy">
          <span class="modal-kicker">${modalIcon("verified")} MINEKUBE VERIFIED BUILD</span>
          <h2 id="modalTitle">${pack.shortName || pack.name}</h2>
          <p>${pack.category} <i></i> ${pack.loader} <i></i> Minecraft ${pack.release}</p>
          <div class="modal-hero-status">
            <span><b></b> Stabilní release</span>
            <span>Optimalizováno pro klienta</span>
          </div>
        </div>
        <div class="modal-power-core" aria-hidden="true">
          <span class="power-ring power-ring-one"></span>
          <span class="power-ring power-ring-two"></span>
          <span class="power-ring power-ring-three"></span>
          <span class="power-diamond"><i></i></span>
          <small>ULTRA</small>
        </div>
      </div>
    </div>

    <div class="modal-body">
      <div class="modal-stats" aria-label="Parametry modpacku">
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("game")}</span>
          <div><small>VERZE HRY</small><strong>Minecraft ${pack.versions[0]}</strong></div>
        </article>
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("cubes")}</span>
          <div><small>OBSAH BALÍČKU</small><strong>${pack.mods} optimalizačních modů</strong></div>
        </article>
        <article class="modal-stat-card">
          <span class="modal-stat-icon">${modalIcon("archive")}</span>
          <div><small>VELIKOST</small><strong>${pack.size}</strong></div>
        </article>
        <article class="modal-stat-card modal-stat-highlight">
          <span class="modal-stat-icon">${modalIcon("speed")}</span>
          <div><small>VÝKONOVÝ PROFIL</small><strong>${pack.performance} · Maximum FPS</strong></div>
        </article>
      </div>

      <div class="modal-description">
        <span class="modal-description-icon">${modalIcon("shield")}</span>
        <div>
          <small>PROVĚŘENÁ KONFIGURACE</small>
          <p>${pack.longDescription} Nastavení je připravené tak, aby poskytovalo vysoký výkon, rychlé načítání a stabilní průběh hry bez zbytečného nastavování.</p>
        </div>
      </div>

      <div class="modal-columns">
        <section class="modal-panel modal-panel-features">
          <header class="modal-panel-heading">
            <span>${modalIcon("rocket")}</span>
            <div><small>HLAVNÍ VÝHODY</small><h3>Co balíček nabízí</h3></div>
          </header>
          <ul class="modal-feature-list">
            ${pack.features.map((feature, index) => `
              <li>
                <span class="modal-list-icon">${modalIcon(featureIcons[index] || "check")}</span>
                <span>${feature}</span>
                <b>${modalIcon("check")}</b>
              </li>`).join("")}
          </ul>
        </section>

        <section class="modal-panel modal-panel-requirements">
          <header class="modal-panel-heading">
            <span>${modalIcon("settings")}</span>
            <div><small>RYCHLÝ START</small><h3>Požadavky a doporučení</h3></div>
          </header>
          <ul class="modal-feature-list">
            ${pack.requirements.map((item, index) => `
              <li>
                <span class="modal-list-icon">${modalIcon(requirementIcons[index] || "check")}</span>
                <span>${item}</span>
                <b>${modalIcon("check")}</b>
              </li>`).join("")}
          </ul>
        </section>
      </div>

      <div class="modal-download">
        <div class="modal-release-icon">${modalIcon("download")}</div>
        <div class="modal-release-copy">
          <span>AKTUÁLNÍ RELEASE</span>
          <strong>${pack.release} · Minecraft ${pack.versions[0]}</strong>
          <small>${pack.loader} build · ${pack.size} · připraveno ke stažení</small>
        </div>
        ${pack.downloadUrl ? `
        ${createDownloadButton(pack.id, "Stáhnout ZIP", "modal-download-button")}` : `
        <button class="button button-secondary" type="button" disabled>
          Zatím nedostupné
        </button>`}
      </div>
    </div>
  `;

  showModal();
}

function openInfoModal(type) {
  const content = {
    methodology: {
      title: "Metodika měření výkonu",
      text: "Pro důvěryhodné srovnání používej stejný svět, seed, pozici hráče, render distance, rozlišení, verzi Javy i ovladače. Každý test spusť několikrát, první průchod nepočítej a uváděj nejen průměrné FPS, ale také 1% low a frametime."
    },
    changelog: {
      title: "Changelog",
      text: "Tady může být seznam verzí, datum vydání, přidané a odebrané mody, změny konfigurace, známé chyby a pokyny pro bezpečný update."
    },
    compatibility: {
      title: "Kompatibilita",
      text: "Tady můžeš popsat podporované verze Minecraftu, loadery, doporučené verze Javy, kompatibilitu se shadery, resource packy a známé konflikty."
    },
    license: {
      title: "Licence a upozornění",
      text: "Před zveřejněním doplň vlastní licenční podmínky a zkontroluj oprávnění jednotlivých autorů modů k distribuci v modpacku."
    }
  }[type];

  modalContent.innerHTML = `
    <div class="modal-hero" style="--cover-bg:linear-gradient(135deg,#210623,#7c1194,#ff8500,#ffd84f)">
      <div><h2 id="modalTitle">${content.title}</h2></div>
    </div>
    <div class="modal-body">
      <p>${content.text}</p>
      <div class="modal-download">
        <div>
          <span>DEMONSTRAČNÍ OBSAH</span>
          <strong>Tento text uprav podle skutečného projektu.</strong>
        </div>
        <button class="button button-secondary" type="button" data-close-modal>Zavřít</button>
      </div>
    </div>
  `;
  showModal();
}

function showModal() {
  window.clearTimeout(modalCloseTimer);
  modalCloseTimer = null;
  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  modalBackdrop.classList.remove("is-closing", "is-visible");
  modalClose.classList.remove("is-closing-trigger");
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");

  // Dva snímky zajistí, že prohlížeč nejdřív vykreslí počáteční stav a až potom animaci.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalBackdrop.classList.add("is-visible");
      modalClose.focus({ preventScroll: true });
    });
  });
}

function closeModal({ animateCloseButton = false } = {}) {
  if (modalBackdrop.hidden || modalBackdrop.classList.contains("is-closing")) return;

  window.clearTimeout(modalCloseTimer);
  modalBackdrop.classList.remove("is-visible");
  modalBackdrop.classList.add("is-closing");

  if (animateCloseButton) {
    modalClose.classList.remove("is-closing-trigger");
    void modalClose.offsetWidth;
    modalClose.classList.add("is-closing-trigger");
  }

  const finishClosing = () => {
    modalBackdrop.hidden = true;
    modalBackdrop.classList.remove("is-closing");
    modalClose.classList.remove("is-closing-trigger");
    document.body.classList.remove("modal-open");

    if (lastModalTrigger?.isConnected) {
      lastModalTrigger.focus({ preventScroll: true });
    }
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  modalCloseTimer = window.setTimeout(finishClosing, reducedMotion ? 20 : 430);
}

let toastTimer;
function showToast(message, type = "default", duration = 2900) {
  clearTimeout(toastTimer);

  const toastMessage = toast.querySelector(".toast-message");
  const toastKicker = toast.querySelector(".toast-kicker");
  const typeClasses = ["is-download-start", "is-download-success", "is-warning", "is-favorite", "is-theme", "is-system"];

  toast.classList.remove("show", ...typeClasses);
  toast.style.setProperty("--toast-duration", `${duration}ms`);

  if (toastMessage) toastMessage.textContent = message;

  const toastConfig = {
    "download-start": { className: "is-download-start", kicker: "PŘIPRAVUJI PŘENOS" },
    "download-success": { className: "is-download-success", kicker: "MINEKUBE DOWNLOAD" },
    warning: { className: "is-warning", kicker: "UPOZORNĚNÍ" },
    favorite: { className: "is-favorite", kicker: "OBLÍBENÉ" },
    theme: { className: "is-theme", kicker: "ROZHRANÍ" }
  }[type];

  if (toastConfig) {
    toast.classList.add(toastConfig.className);
    if (toastKicker) toastKicker.textContent = toastConfig.kicker;
  } else {
    toast.classList.add("is-system");
    if (toastKicker) toastKicker.textContent = "MINEKUBE SYSTEM";
  }

  // Restartuje vstupní, pulzní i časovací animaci při každém novém oznámení.
  void toast.offsetWidth;
  toast.classList.add("show");

  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

function createFavoriteBurst(button, activating) {
  if (!button || prefersReducedMotion.matches) return;

  const burst = document.createElement("span");
  burst.className = `favorite-burst ${activating ? "is-love" : "is-unlove"}`;

  for (let index = 0; index < 10; index += 1) {
    const particle = document.createElement("i");
    particle.style.setProperty("--favorite-angle", `${index * 36 + Math.random() * 10 - 5}deg`);
    particle.style.setProperty("--favorite-distance", `${22 + Math.random() * 18}px`);
    particle.style.setProperty("--favorite-delay", `${Math.random() * 70}ms`);
    burst.appendChild(particle);
  }

  button.appendChild(burst);
  window.setTimeout(() => burst.remove(), 760);
}

function toggleFavorite(id, button) {
  const activating = !state.favorites.has(id);

  if (activating) {
    state.favorites.add(id);
    showToast("Modpack byl uložen do oblíbených.");
  } else {
    state.favorites.delete(id);
    showToast("Modpack byl odebrán z oblíbených.");
  }

  safeStorage.set("minekube-favorites", JSON.stringify([...state.favorites]));

  if (button) {
    button.classList.toggle("active", activating);
    button.classList.remove("is-popping", "is-unpopping");
    void button.offsetWidth;
    button.classList.add(activating ? "is-popping" : "is-unpopping");
    button.setAttribute("aria-pressed", String(activating));
    button.setAttribute("aria-label", activating ? "Odebrat z oblíbených" : "Přidat do oblíbených");
    createFavoriteBurst(button, activating);
    window.setTimeout(() => button.classList.remove("is-popping", "is-unpopping"), 720);
  }
}

function playDownloadAnimation(button, event) {
  if (!button) return;

  button.classList.remove("download-animating");
  void button.offsetWidth;
  button.classList.add("download-animating");

  const rect = button.getBoundingClientRect();
  const hasPointerPosition = event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY) && (event.clientX || event.clientY);
  const x = hasPointerPosition ? event.clientX : rect.left + rect.width / 2;
  const y = hasPointerPosition ? event.clientY : rect.top + rect.height / 2;

  // Původní čistý pulz — jen jemně detailnější a s více částicemi.
  const burst = document.createElement("span");
  burst.className = "download-click-burst download-click-burst-classic-plus";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  for (let index = 0; index < 3; index += 1) {
    const ring = document.createElement("span");
    ring.className = "download-burst-ring";
    ring.style.setProperty("--ring-delay", `${index * 74}ms`);
    ring.style.setProperty("--ring-scale", `${6.9 + index * 2.25}`);
    burst.appendChild(ring);
  }

  const sparkCount = 28;
  for (let index = 0; index < sparkCount; index += 1) {
    const spark = document.createElement("i");
    const angle = (360 / sparkCount) * index + (Math.random() * 10 - 5);
    spark.style.setProperty("--spark-angle", `${angle}deg`);
    spark.style.setProperty("--spark-distance", `${64 + Math.random() * 72}px`);
    spark.style.setProperty("--spark-length", `${10 + Math.random() * 21}px`);
    spark.style.setProperty("--spark-delay", `${Math.random() * 105}ms`);
    spark.style.setProperty("--spark-width", `${1.7 + Math.random() * 2.2}px`);
    burst.appendChild(spark);
  }

  const fragmentCount = 16;
  for (let index = 0; index < fragmentCount; index += 1) {
    const fragment = document.createElement("b");
    const angle = (360 / fragmentCount) * index + (Math.random() * 20 - 10);
    fragment.style.setProperty("--fragment-angle", `${angle}deg`);
    fragment.style.setProperty("--fragment-distance", `${48 + Math.random() * 74}px`);
    fragment.style.setProperty("--fragment-spin", `${180 + Math.random() * 500}deg`);
    fragment.style.setProperty("--fragment-delay", `${25 + Math.random() * 115}ms`);
    burst.appendChild(fragment);
  }

  const microParticleCount = 14;
  for (let index = 0; index < microParticleCount; index += 1) {
    const particle = document.createElement("u");
    const angle = (360 / microParticleCount) * index + (Math.random() * 26 - 13);
    particle.style.setProperty("--micro-angle", `${angle}deg`);
    particle.style.setProperty("--micro-distance", `${38 + Math.random() * 64}px`);
    particle.style.setProperty("--micro-delay", `${55 + Math.random() * 135}ms`);
    particle.style.setProperty("--micro-size", `${2 + Math.random() * 2.6}px`);
    burst.appendChild(particle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1240);
  window.setTimeout(() => button.classList.remove("download-animating"), 1020);
}

async function triggerDownload(button, pack, event) {
  if (!button || button.getAttribute("aria-busy") === "true") return;

  button.setAttribute("aria-busy", "true");
  playDownloadAnimation(button, event);

  await new Promise(resolve => window.setTimeout(resolve, 620));

  try {
    await demoDownload(pack);
  } finally {
    button.removeAttribute("aria-busy");
  }
}

async function demoDownload(pack) {
  if (!pack?.downloadUrl) {
    showToast("Soubor ke stažení zatím není nastavený.", "warning", 3600);
    return;
  }

  showToast("Navazuji bezpečné spojení…", "download-start", 1800);

  // Přímý odkaz míří na soubor v GitHub Release. GitHub ho vrátí
  // jako přílohu, takže se neotevře stránka projektu ani Game Jolt.
  const link = document.createElement("a");
  link.href = pack.downloadUrl;
  link.download = pack.downloadFileName || "";
  link.target = "_self";
  link.rel = "noopener noreferrer";
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast("Stahování bylo úspěšně zahájeno", "download-success", 4200);
}


searchInput.addEventListener("input", event => {
  state.query = event.target.value;
  renderPacks();
});

document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => {
  input.addEventListener("change", () => updateFilterState(input));
});

sortSelect.addEventListener("change", event => {
  state.sort = event.target.value;
  renderPacks();
});

document.getElementById("resetFilters").addEventListener("click", resetFilters);
document.getElementById("emptyReset").addEventListener("click", resetFilters);

filterToggle.addEventListener("click", () => {
  filtersPanel.classList.toggle("mobile-open");
  filterToggle.setAttribute("aria-expanded", filtersPanel.classList.contains("mobile-open"));
});

packGrid.addEventListener("click", event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  const detailsButton = event.target.closest("[data-details]");
  const downloadButton = event.target.closest("[data-download]");
  const unreleasedButton = event.target.closest("[data-unreleased]");

  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite, favoriteButton);
  if (detailsButton) {
    detailsButton.classList.remove("is-activating");
    void detailsButton.offsetWidth;
    detailsButton.classList.add("is-activating");
    window.setTimeout(() => detailsButton.classList.remove("is-activating"), 420);
    openPackModal(modpacks.find(pack => pack.id === detailsButton.dataset.details));
  }
  if (downloadButton) triggerDownload(downloadButton, modpacks.find(pack => pack.id === downloadButton.dataset.download), event);
  if (unreleasedButton) showToast("Tento modpack zatím není vydaný.", "warning", 3200);
});

modalContent.addEventListener("click", event => {
  const downloadButton = event.target.closest("[data-download]");
  const closeButton = event.target.closest("[data-close-modal]");
  if (downloadButton) triggerDownload(downloadButton, modpacks.find(pack => pack.id === downloadButton.dataset.download), event);
  if (closeButton) closeModal();
});

modalClose.addEventListener("click", () => closeModal({ animateCloseButton: true }));
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

document.getElementById("methodologyButton").addEventListener("click", () => openInfoModal("methodology"));
document.querySelectorAll("[data-dialog]").forEach(button => {
  button.addEventListener("click", () => openInfoModal(button.dataset.dialog));
});

const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");

menuButton.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuButton.classList.toggle("active", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
});

mobileNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
  });
});


function initializeUltimateDownloadButtons() {
  const precisePointer = window.matchMedia("(pointer: fine)");
  if (!precisePointer.matches || prefersReducedMotion.matches) return;

  let activeButton = null;
  let frame = 0;
  let pendingEvent = null;

  const updateButton = () => {
    frame = 0;
    if (!activeButton || !pendingEvent || !activeButton.isConnected) return;

    const rect = activeButton.getBoundingClientRect();
    const px = Math.min(Math.max((pendingEvent.clientX - rect.left) / rect.width, 0), 1);
    const py = Math.min(Math.max((pendingEvent.clientY - rect.top) / rect.height, 0), 1);
    const nx = px - .5;
    const ny = py - .5;

    activeButton.style.setProperty("--pointer-x", `${px * 100}%`);
    activeButton.style.setProperty("--pointer-y", `${py * 100}%`);
    activeButton.style.setProperty("--tilt-x", `${ny * -7}deg`);
    activeButton.style.setProperty("--tilt-y", `${nx * 9}deg`);
    activeButton.style.setProperty("--magnet-x", `${nx * 5}px`);
    activeButton.style.setProperty("--magnet-y", `${ny * 3}px`);
  };

  document.addEventListener("pointermove", event => {
    const button = event.target.closest?.(".download-ultimate");
    if (!button) return;

    activeButton = button;
    pendingEvent = event;
    button.classList.add("is-pointer-active");

    if (!frame) frame = requestAnimationFrame(updateButton);
  });

  document.addEventListener("pointerout", event => {
    const button = event.target.closest?.(".download-ultimate");
    if (!button || button.contains(event.relatedTarget)) return;

    button.classList.remove("is-pointer-active");
    button.style.setProperty("--pointer-x", "50%");
    button.style.setProperty("--pointer-y", "50%");
    button.style.setProperty("--tilt-x", "0deg");
    button.style.setProperty("--tilt-y", "0deg");
    button.style.setProperty("--magnet-x", "0px");
    button.style.setProperty("--magnet-y", "0px");

    if (activeButton === button) {
      activeButton = null;
      pendingEvent = null;
    }
  });
}

const themeToggle = document.getElementById("themeToggle");
const savedTheme = safeStorage.get("minekube-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = current;
  safeStorage.set("minekube-theme", current);
  showToast(current === "light" ? "Zapnut světlý motiv." : "Zapnut tmavý motiv.");
});

const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scrollProgress span");
const benchmarkSection = document.querySelector(".benchmark-section");
let scrollFramePending = false;

function syncScrollExperience() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

  siteHeader?.classList.toggle("scrolled", window.scrollY > 16);
  scrollProgress?.style.setProperty("--scroll-progress", progress.toFixed(4));

  if (benchmarkSection) {
    const rect = benchmarkSection.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const sectionCenter = rect.top + rect.height / 2;
    const normalized = Math.max(-1, Math.min(1, (sectionCenter - viewportCenter) / window.innerHeight));
    benchmarkSection.style.setProperty("--benchmark-parallax", `${normalized * 34}px`);
  }

  scrollFramePending = false;
}

window.addEventListener("scroll", () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(syncScrollExperience);
}, { passive: true });

window.addEventListener("resize", syncScrollExperience, { passive: true });

// Výkonový 3D HUD byl z katalogu odstraněn. Inicializace zůstává bezpečně volitelná,
// aby případné budoucí použití stejné komponenty nezpůsobilo chybu JavaScriptu.
const counter = document.querySelector("[data-counter]");
const performanceCard = document.querySelector(".performance-card");

if (counter && performanceCard) {
  const counterObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    const target = Number(counter.dataset.counter);
    const start = performance.now();
    const duration = 1100;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    counterObserver.disconnect();
  }, { threshold: .55 });

  counterObserver.observe(performanceCard);

  if (window.matchMedia("(pointer: fine)").matches) {
    performanceCard.addEventListener("pointermove", event => {
      const rect = performanceCard.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      performanceCard.style.setProperty("--ry", `${px * 7}deg`);
      performanceCard.style.setProperty("--rx", `${py * -5}deg`);
    });

    performanceCard.addEventListener("pointerleave", () => {
      performanceCard.style.setProperty("--ry", "-4deg");
      performanceCard.style.setProperty("--rx", "2deg");
    });
  }
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const benchmarkBoard = document.querySelector(".benchmark-board");

function animateNumericValue(element, duration = 1350) {
  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || "";

  if (prefersReducedMotion.matches) {
    element.textContent = `${target}${suffix}`;
    return;
  }

  const start = performance.now();
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

if (benchmarkBoard) {
  const revealBenchmark = () => {
    benchmarkBoard.classList.add("is-visible");
    benchmarkBoard.querySelectorAll("[data-count]").forEach((element, index) => {
      window.setTimeout(() => animateNumericValue(element, index < 2 ? 1450 : 1050), 300 + index * 115);
    });
  };

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealBenchmark();
  } else {
    const benchmarkObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      revealBenchmark();
      benchmarkObserver.disconnect();
    }, { threshold: .3 });

    benchmarkObserver.observe(benchmarkBoard);
  }

  if (window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion.matches) {
    benchmarkBoard.addEventListener("pointermove", event => {
      const rect = benchmarkBoard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      benchmarkBoard.style.setProperty("--by", `${x * 3.8}deg`);
      benchmarkBoard.style.setProperty("--bx", `${y * -3}deg`);
    });

    benchmarkBoard.addEventListener("pointerleave", () => {
      benchmarkBoard.style.setProperty("--by", "0deg");
      benchmarkBoard.style.setProperty("--bx", "0deg");
    });
  }
}

let revealObserver = null;

function registerRevealElements(elements, baseDelay = 65) {
  const list = [...elements].filter(element => !element.classList.contains("scroll-reveal"));
  if (!list.length) return;

  list.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 6) * baseDelay}ms`);

    if (element.matches(".benchmark-copy, .filters-panel, .about-copy")) {
      element.style.setProperty("--reveal-x", "-28px");
      element.style.setProperty("--reveal-y", "0px");
    } else if (element.matches(".about-emblem")) {
      element.style.setProperty("--reveal-x", "28px");
      element.style.setProperty("--reveal-y", "0px");
    }

    if (prefersReducedMotion.matches || !revealObserver) {
      element.classList.add("is-revealed");
    } else {
      revealObserver.observe(element);
    }
  });
}

function initializeScrollExperience() {
  if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: .12,
      rootMargin: "0px 0px -7% 0px"
    });
  }

  const revealGroups = [
    [document.querySelectorAll(".trust-items > *"), 55],
    [document.querySelectorAll(".section-heading"), 0],
    [document.querySelectorAll(".filters-panel, .catalog-toolbar"), 80],
    [document.querySelectorAll(".pack-card"), 90],
    [document.querySelectorAll(".benchmark-copy"), 0],
    [document.querySelectorAll(".steps-grid .step-card"), 105],
    [document.querySelectorAll(".about-copy, .about-emblem"), 110],
    [document.querySelectorAll(".cta-card"), 0],
    [document.querySelectorAll(".footer-grid > *"), 70]
  ];

  revealGroups.forEach(([elements, delay]) => registerRevealElements(elements, delay));

  const pageTransition = document.getElementById("pageTransition");
  const pageTransitionTitle = document.getElementById("pageTransitionTitle");
  const pageTransitionStatus = document.getElementById("pageTransitionStatus");
  const pageTransitionCode = document.getElementById("pageTransitionCode");
  const pageTargets = new Map([
    ["#home", { title: "DOMŮ", status: "Návrat do hlavního Minekube systému", code: "MK-01", accent: "#ffbd2f", rgb: "255,189,47" }],
    ["#modpacks", { title: "MODPACKY", status: "Načítání výkonových profilů", code: "MK-02", accent: "#ffad1f", rgb: "255,173,31" }],
    ["#benchmarks", { title: "VÝKON", status: "Aktivace benchmarkového jádra", code: "MK-03", accent: "#ef58ff", rgb: "239,88,255" }],
    ["#install", { title: "INSTALACE", status: "Příprava instalačního protokolu", code: "MK-04", accent: "#ffca3a", rgb: "255,202,58" }],
    ["#about", { title: "O PROJEKTU", status: "Otevírání Minekube manifestu", code: "MK-05", accent: "#df55ff", rgb: "223,85,255" }]
  ]);
  let pageTransitionBusy = false;
  let sectionArrivalCleanupTimer = 0;

  const clearSectionArrival = () => {
    window.clearTimeout(sectionArrivalCleanupTimer);
    document.querySelectorAll(".mk-section-preparing, .mk-section-arriving").forEach(section => {
      section.classList.remove("mk-section-preparing", "mk-section-arriving");
    });
    document.querySelectorAll(".mk-section-entry-sweep").forEach(sweep => sweep.remove());
  };

  const prepareSectionArrival = target => {
    clearSectionArrival();
    if (!target || prefersReducedMotion.matches) return;
    target.classList.add("mk-section-preparing");
  };

  const playSectionArrival = target => {
    if (!target || prefersReducedMotion.matches) return;

    target.classList.remove("mk-section-arriving");
    // Reflow zaručí spuštění animace při každém přepnutí stránky.
    void target.offsetWidth;
    target.classList.remove("mk-section-preparing");
    target.classList.add("mk-section-arriving");

    // Domů nesmí dostat žádnou vstupní energetickou vlnu. Pro jistotu
    // odstraníme i případný starší element, který mohl zůstat v DOM.
    if (target.id === "home") {
      target.querySelectorAll(".mk-section-entry-sweep").forEach(element => element.remove());
    }

    const sweep = target.id === "home" ? null : document.createElement("span");
    if (sweep) {
      sweep.className = "mk-section-entry-sweep";
      sweep.setAttribute("aria-hidden", "true");
      target.appendChild(sweep);
    }

    sectionArrivalCleanupTimer = window.setTimeout(() => {
      target.classList.remove("mk-section-arriving");
      sweep?.remove();
    }, 1050);
  };

  // Zpřístupní rychlý nájezd sekcí po portálovém přepnutí stránky.
  window.playMinekubeSectionArrival = playSectionArrival;

  const updateNavigationActive = id => {
    document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]').forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === id);
    });
  };

  const navigateWithPortal = (id, target) => {
    if (pageTransitionBusy) return;
    const config = pageTargets.get(id);

    if (!config || prefersReducedMotion.matches || !pageTransition) {
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
      updateNavigationActive(id);
      return;
    }

    pageTransitionBusy = true;
    prepareSectionArrival(target);
    document.body.classList.add("mk-transitioning");
    pageTransition.style.setProperty("--transition-accent", config.accent);
    pageTransition.style.setProperty("--transition-accent-rgb", config.rgb);
    if (pageTransitionTitle) pageTransitionTitle.textContent = config.title;
    if (pageTransitionStatus) pageTransitionStatus.textContent = config.status;
    if (pageTransitionCode) pageTransitionCode.textContent = config.code;
    pageTransition.setAttribute("aria-hidden", "false");

    // Re-trigger all CSS keyframes on every navigation click.
    pageTransition.classList.remove("is-active");
    void pageTransition.offsetWidth;
    pageTransition.classList.add("is-active");

    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      history.replaceState(null, "", id);
      updateNavigationActive(id);
      syncScrollExperience();
    }, 590);

    window.setTimeout(() => {
      pageTransition.classList.remove("is-active");
      pageTransition.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mk-transitioning");

      // Až portál odkryje stránku, cílová sekce rychle a plynule vyjede.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => playSectionArrival(target));
      });

      pageTransitionBusy = false;
    }, 1450);
  };

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      if (pageTargets.has(id)) {
        navigateWithPortal(id, target);
      } else {
        target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", id);
      }
    });
  });

  const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]')];
  const observedSections = [...new Set(sectionLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean))];

  if ("IntersectionObserver" in window) {
    const navigationObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      sectionLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, { rootMargin: "-28% 0px -58% 0px", threshold: [0, .1, .35] });

    observedSections.forEach(section => navigationObserver.observe(section));
  }

  syncScrollExperience();
}


function initializeCustomSort() {
  const wrapper = sortSelect?.closest(".sort-select");
  if (!wrapper || wrapper.querySelector(".sort-control")) return;

  sortSelect.classList.add("native-sort-select");

  const control = document.createElement("div");
  control.className = "sort-control";
  control.innerHTML = `
    <button class="sort-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="sort-trigger-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 6h12M4 6h.01M8 12h9M4 12h.01M8 18h6M4 18h.01"/></svg></span>
      <span class="sort-trigger-copy"><small>AKTUÁLNÍ ŘAZENÍ</small><strong>${sortSelect.options[sortSelect.selectedIndex].text}</strong></span>
      <span class="sort-trigger-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg></span>
    </button>
    <div class="sort-menu" role="listbox" aria-label="Řazení modpacků"></div>
  `;

  const menu = control.querySelector(".sort-menu");
  [...sortSelect.options].forEach((option, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sort-option";
    item.dataset.value = option.value;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(option.selected));
    item.innerHTML = `<span class="sort-option-index">0${index + 1}</span><span>${option.text}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`;
    menu.appendChild(item);
  });

  wrapper.appendChild(control);
  const trigger = control.querySelector(".sort-trigger");
  const currentLabel = control.querySelector(".sort-trigger-copy strong");

  const close = () => {
    control.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", event => {
    event.preventDefault();
    const isOpen = control.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", event => {
    const optionButton = event.target.closest(".sort-option");
    if (!optionButton) return;
    sortSelect.value = optionButton.dataset.value;
    sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
    currentLabel.textContent = sortSelect.options[sortSelect.selectedIndex].text;
    menu.querySelectorAll(".sort-option").forEach(item => item.setAttribute("aria-selected", String(item === optionButton)));
    close();
  });

  document.addEventListener("click", event => {
    if (!control.contains(event.target)) close();
  });

  control.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      close();
      trigger.focus();
    }
  });
}

function initializeEpicSurfaceInteractions() {
  if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion.matches) return;

  const applyTilt = (element, event, strength = 5) => {
    const rect = element.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    element.style.setProperty("--surface-x", `${x * 100}%`);
    element.style.setProperty("--surface-y", `${y * 100}%`);
    element.style.setProperty("--surface-ry", `${(x - .5) * strength}deg`);
    element.style.setProperty("--surface-rx", `${(y - .5) * -strength}deg`);
  };

  const resetTilt = element => {
    element.style.setProperty("--surface-x", "50%");
    element.style.setProperty("--surface-y", "50%");
    element.style.setProperty("--surface-ry", "0deg");
    element.style.setProperty("--surface-rx", "0deg");
  };

  document.querySelectorAll(".step-card").forEach(card => {
    card.addEventListener("pointermove", event => applyTilt(card, event, 4));
    card.addEventListener("pointerleave", () => resetTilt(card));
  });

  const aboutCard = document.querySelector(".about-card");
  aboutCard?.addEventListener("pointermove", event => applyTilt(aboutCard, event, 2.5));
  aboutCard?.addEventListener("pointerleave", () => resetTilt(aboutCard));

  const filters = document.querySelector(".filters-panel");
  filters?.addEventListener("pointermove", event => applyTilt(filters, event, 0));
}

function initializeSearchShortcut() {
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

document.getElementById("currentYear").textContent = new Date().getFullYear();

renderPacks();
initializeCustomSort();
initializeUltimateDownloadButtons();
initializeEpicSurfaceInteractions();
initializeSearchShortcut();
initializeScrollExperience();

/* =========================================================
   HOME // FUTURE ENTRY CONTROLLER
   Web se při každém otevření vrátí na Domů a přehraje boot sekvenci.
   ========================================================= */
(() => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const goHomeInstantly = () => {
    try {
      history.replaceState(null, "", "#home");
    } catch {
      location.hash = "home";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  goHomeInstantly();

  const loader = document.getElementById("futureLoader");
  const progressBar = document.getElementById("loaderProgressBar");
  const percent = document.getElementById("loaderPercent");
  const status = document.getElementById("loaderStatus");
  const storeButton = document.querySelector(".store-button");
  const pageTransition = document.getElementById("pageTransition");
  const pageTransitionTitle = document.getElementById("pageTransitionTitle");
  const pageTransitionStatus = document.getElementById("pageTransitionStatus");
  const pageTransitionCode = document.getElementById("pageTransitionCode");
  let storePageTransitionBusy = false;
  const storeDestination = "https://minekubestudios.github.io/store/";
  if (storeButton) storeButton.href = storeDestination;
  const startTime = performance.now();
  let pageLoaded = document.readyState === "complete";
  let finished = false;

  const statusForProgress = value => {
    if (value < 24) return "Načítám Minekube ekosystém...";
    if (value < 48) return "Propojuji modpacky a server...";
    if (value < 72) return "Aktivuji open-source jádro...";
    if (value < 94) return "Spouštím technologie budoucnosti...";
    return "Systém připraven";
  };

  const finishLoader = () => {
    if (finished) return;
    finished = true;
    progressBar?.style.setProperty("--loader-progress", "100%");
    if (percent) percent.textContent = "100";
    if (status) status.textContent = "Systém připraven";

    window.setTimeout(() => {
      loader?.classList.add("is-leaving");
      document.body.classList.remove("future-loading");
      document.body.classList.add("home-ready");
      goHomeInstantly();

      // Domů má po boot sekvenci vlastní odhalení. Další stránkový nájezd
      // se zde nespouští, aby se animace nepřekryly a obraz neblikl.

      window.setTimeout(() => {
        if (loader) loader.hidden = true;
      }, 780);
    }, prefersReducedMotion.matches ? 80 : 320);
  };

  const updateLoader = now => {
    if (!loader || finished) return;
    const elapsed = now - startTime;
    const baseDuration = prefersReducedMotion.matches ? 120 : 1750;
    const waitingProgress = Math.min(94, (elapsed / baseDuration) * 94);
    const value = pageLoaded
      ? Math.min(100, waitingProgress + Math.max(0, (elapsed - baseDuration * .64) / (prefersReducedMotion.matches ? 3 : 12)))
      : waitingProgress;
    const rounded = Math.max(0, Math.min(100, Math.round(value)));

    progressBar?.style.setProperty("--loader-progress", `${rounded}%`);
    if (percent) percent.textContent = String(rounded);
    if (status) status.textContent = statusForProgress(rounded);

    if (pageLoaded && rounded >= 100) {
      finishLoader();
      return;
    }

    requestAnimationFrame(updateLoader);
  };

  const markLoaded = () => {
    pageLoaded = true;
    goHomeInstantly();
  };

  if (document.readyState === "complete") {
    markLoaded();
  } else {
    window.addEventListener("load", markLoaded, { once: true });
  }

  requestAnimationFrame(updateLoader);

  const homePrimary = document.querySelector(".mk-home-primary");
  if (homePrimary && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion.matches) {
    homePrimary.addEventListener("pointermove", event => {
      const rect = homePrimary.getBoundingClientRect();
      homePrimary.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      homePrimary.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
    homePrimary.addEventListener("pointerleave", () => {
      homePrimary.style.setProperty("--mx", "50%");
      homePrimary.style.setProperty("--my", "50%");
    });
  }

  // STORE // ostré 2D neon-galaxy tlačítko, částice, blesky, Store pulz a plynulý celoplošný přechod.
  if (storeButton && !prefersReducedMotion.matches) {
    const fxLayer = storeButton.querySelector(".store-button-fx");
    const fxPalette = ["#69f7ff", "#8f6cff", "#ff58df", "#ffd36e", "#78adff"];
    const fxIcons = ["✦", "◇", "⬡", "+", "✧"];
    let fxTimer = 0;
    let storeTransitionOpening = false;
    let lastPulseAt = 0;

    const randomBetween = (min, max) => Math.random() * (max - min) + min;

    const spawnStoreFx = (amount = 16, force = false) => {
      if (!fxLayer || (!force && !storeButton.matches(":hover"))) return;

      for (let index = 0; index < amount; index += 1) {
        const roll = Math.random();
        const node = document.createElement("i");
        const angle = randomBetween(0, Math.PI * 2);
        const distanceX = randomBetween(64, 138);
        const distanceY = randomBetween(46, 104);
        const color = fxPalette[Math.floor(Math.random() * fxPalette.length)];
        const x = Math.cos(angle) * distanceX;
        const y = Math.sin(angle) * distanceY;

        if (roll < .19) {
          node.className = "store-fx-bolt";
        } else if (roll < .44) {
          node.className = "store-fx-icon";
          node.textContent = fxIcons[Math.floor(Math.random() * fxIcons.length)];
        } else {
          node.className = "store-fx-particle";
        }

        node.style.setProperty("--fx-x", `${x.toFixed(1)}px`);
        node.style.setProperty("--fx-y", `${y.toFixed(1)}px`);
        node.style.setProperty("--fx-size", `${randomBetween(3, roll < .44 ? 15 : 7.5).toFixed(1)}px`);
        node.style.setProperty("--fx-duration", `${Math.round(randomBetween(720, 1260))}ms`);
        node.style.setProperty("--fx-delay", `${Math.round(randomBetween(0, 100))}ms`);
        node.style.setProperty("--fx-rotation", `${Math.round(randomBetween(-180, 180))}deg`);
        node.style.setProperty("--fx-scale", randomBetween(.38, 1.08).toFixed(2));
        node.style.setProperty("--fx-color", color);
        fxLayer.appendChild(node);
        node.addEventListener("animationend", () => node.remove(), { once: true });
      }
    };

    if (window.matchMedia("(pointer: fine)").matches) {
      storeButton.addEventListener("pointermove", event => {
        const rect = storeButton.getBoundingClientRect();
        const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
        const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
        storeButton.style.setProperty("--store-x", `${x * 100}%`);
        storeButton.style.setProperty("--store-y", `${y * 100}%`);
      });

      storeButton.addEventListener("pointerenter", () => {
        spawnStoreFx(32);
        window.clearInterval(fxTimer);
        fxTimer = window.setInterval(() => spawnStoreFx(9), 210);
      });

      storeButton.addEventListener("pointerleave", () => {
        window.clearInterval(fxTimer);
        storeButton.style.setProperty("--store-x", "50%");
        storeButton.style.setProperty("--store-y", "50%");
      });
    }

    const launchStorePulse = (clientX, clientY) => {
      const now = performance.now();
      if (now - lastPulseAt < 220) return;
      lastPulseAt = now;

      const rect = storeButton.getBoundingClientRect();
      const x = Number.isFinite(clientX) && clientX > 0 ? clientX : rect.left + rect.width / 2;
      const y = Number.isFinite(clientY) && clientY > 0 ? clientY : rect.top + rect.height / 2;
      const pulse = document.createElement("span");
      pulse.className = "store-cyber-pulse store-main-style-pulse";
      pulse.style.setProperty("--pulse-x", `${x}px`);
      pulse.style.setProperty("--pulse-y", `${y}px`);
      pulse.innerHTML = '<i class="store-cyber-pulse-grid"></i><i class="store-cyber-pulse-cross"></i>';
      document.body.appendChild(pulse);
      pulse.addEventListener("animationend", pulseEvent => {
        if (pulseEvent.target === pulse) pulse.remove();
      });
      window.setTimeout(() => pulse.remove(), 1700);
    };

    const launchStoreTransition = (clientX, clientY) => {
      if (storeTransitionOpening || storePageTransitionBusy) return;
      const destination = storeDestination;

      if (!pageTransition) {
        window.location.assign(destination);
        return;
      }

      storeTransitionOpening = true;
      storePageTransitionBusy = true;
      window.clearInterval(fxTimer);
      spawnStoreFx(54, true);
      launchStorePulse(clientX, clientY);

      storeButton.classList.add("is-store-opening");
      document.body.classList.add("mk-transitioning", "store-transitioning");
      pageTransition.classList.add("is-store-transition");
      pageTransition.style.setProperty("--transition-accent", "#72f4ff");
      pageTransition.style.setProperty("--transition-accent-rgb", "114,244,255");
      pageTransition.style.setProperty("--transition-accent-2", "#9568ff");
      pageTransition.style.setProperty("--transition-accent-3", "#ff55dc");
      if (pageTransitionTitle) pageTransitionTitle.textContent = "STORE";
      if (pageTransitionStatus) pageTransitionStatus.textContent = "Otevírání Minekube Store";
      if (pageTransitionCode) pageTransitionCode.textContent = "MK-ST";
      pageTransition.setAttribute("aria-hidden", "false");

      pageTransition.classList.remove("is-active");
      void pageTransition.offsetWidth;
      pageTransition.classList.add("is-active");

      // Přesměrování proběhne až po nejvýraznější části plynulého Store portálu.
      window.setTimeout(() => {
        window.location.assign(destination);
      }, 1660);

      // Bezpečnostní úklid pro případ, že prohlížeč přesměrování zablokuje.
      window.setTimeout(() => {
        pageTransition.classList.remove("is-active", "is-store-transition");
        pageTransition.setAttribute("aria-hidden", "true");
        document.body.classList.remove("mk-transitioning", "store-transitioning");
        storeButton.classList.remove("is-store-opening");
        storePageTransitionBusy = false;
        storeTransitionOpening = false;
      }, 3200);
    };

    storeButton.addEventListener("pointerdown", event => launchStorePulse(event.clientX, event.clientY));
    storeButton.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (event.detail === 0) launchStorePulse(0, 0);
      launchStoreTransition(event.clientX, event.clientY);
    });
  }

})();
