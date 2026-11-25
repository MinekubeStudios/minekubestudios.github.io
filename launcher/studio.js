/* =============================================================
   MINEKUBE STUDIOS // VIZUÁLNÍ STUDIO LAUNCHERU (v12)
   -------------------------------------------------------------
   Načítá se HNED po launcher.js a sdílí s ním jeden uzávěr
   (window.MinekubeLauncherApi), takže používá stejné překlady (t),
   oznámení (showToast) i stav přepínače efektů. Žádná druhá
   fronta, žádný druhý jazyk, žádná duplicitní logika.

   Co tahle část stránky umí:
     · VZHLED LAUNCHERU — 14 skutečných tapet (WebBackgrounds V1–V3)
       v mřížce s náhledy, vlastní nahraný obrázek, čistý gradient
       a „žádná tapeta“; volba se pamatuje a spadne zpět na tapetu,
       když prohlížeč nahraný obrázek zapomene (kvóta).
     · IKONY LAUNCHERU — 46 ikon (WebIcons + dvanáct nových
       pixelových glyphů) rozdělených do pěti rodin, s hledáním,
       filtrem podle rodiny, velikostí a zkušební deskou
       (přetažení prstem i myší, velikost, mřížka).
     · ZKUŠEBNÍ OKNO — opravdová maketa launcheru, ve které se
       tapeta i ikony hned zkusí: dlaždice pozadí, avatar, karta
       instance a hlavní tlačítko Hrát.
     · Přístupnost — skutečné radio buttony pro tapety, taby
       s obsluhou šipek/Home/End, popisky pro čtečku, respekt
       k reduced motion, nuceným barvám i tisku.
     · Výkon — 14 náhledů se načítá až při scrollu (IntersectionObserver
       + loading=lazy), velké soubory jen při skutečném použití,
       46 ikon je jeden sprite (žádných 46 požadavků).

   Vkládá se, jen když stránka obsahuje [data-studio]; stará
   stránka bez sekce se prostě nechová jinak.
   ============================================================= */

(function () {
  "use strict";

  const api = window.MinekubeLauncherApi;
  if (!api) return;

  const root = document.querySelector("[data-studio]");
  if (!root) return;

  const {
    translate,
    announce,
    prefersReduced,
    fxOn,
    STUDIO_TABS,
    WALLPAPERS,
    ICONS,
    DEFAULT_WALLPAPER,
    DEFAULT_ICON
  } = api;

  const doc = document;
  const STORE = {
    wallpaper: "minekube:launcher-wallpaper",
    custom: "minekube:launcher-wallpaper-custom",
    icon: "minekube:launcher-icon",
    tiles: "minekube:launcher-studio-tiles",
    size: "minekube:launcher-studio-size"
  };

  /* Jedno místo, kde se čte a zapisuje paměť. Soukromý režim může
     localStorage zakázat — pak se volba prostě nepamatuje. */
  const store = {
    get(key, fallback = "") {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* nic — jen si to nepamatujeme */
      }
    }
  };

  const state = {
    tab: "look",
    wallpaper: DEFAULT_WALLPAPER,
    custom: "",
    icon: DEFAULT_ICON,
    tiles: false,
    size: 52,
    family: "all",
    query: ""
  };

  /* Nahraný obrázek jako data URL může být velký — do paměti jde
     jen když se vejde. 1,5 MB pokryje běžný wallpaper ve WebP. */
  const CUSTOM_LIMIT = 1.5 * 1024 * 1024;

  const bySlug = new Map(WALLPAPERS.map(item => [item.slug, item]));
  const iconBySlug = new Map(ICONS.map(item => [item.slug, item]));

  /* Názvy tapet i ikon bydlí ve slovníku překladů (klíče std.wp.*
     a std.icon.*), takže se překlápějí spolu s celou stránkou. */
  const wallpaperName = slug => {
    const item = bySlug.get(slug);
    return translate(item ? item.label : `std.wp.${slug}`, slug);
  };
  const iconName = slug => translate(`std.icon.${slug}`, slug);
  const familyName = family => translate(`std.family.${family}`, family);

  /* ===================== STAV Z PAMĚTI ===================== */

  function readState() {
    const savedWallpaper = store.get(STORE.wallpaper, DEFAULT_WALLPAPER);
    state.custom = store.get(STORE.custom, "");
    if (savedWallpaper === "custom" && !state.custom) state.wallpaper = DEFAULT_WALLPAPER;
    else if (savedWallpaper === "custom" || bySlug.has(savedWallpaper) || savedWallpaper === "gradient" || savedWallpaper === "none") {
      state.wallpaper = savedWallpaper;
    }

    const savedIcon = store.get(STORE.icon, DEFAULT_ICON);
    if (iconBySlug.has(savedIcon)) state.icon = savedIcon;

    /* Mřížka a velikost ikon patří k „zkušební desce“ — ukládá se
       jen to, co si opravdu vybereš, ne každý pohyb myší. */
    state.tiles = store.get(STORE.tiles, "0") === "1";
    const size = Number(store.get(STORE.size, "0"));
    if (Number.isFinite(size) && size >= 32 && size <= 96) state.size = size;
  }

  /* ===================== MALOVÁNÍ STAVU DO STRÁNKY ===================== */

  const tabButtons = [...root.querySelectorAll("[data-studio-tab]")];
  const tabPanels = [...root.querySelectorAll("[data-studio-panel]")];
  const stage = root.querySelector("[data-studio-stage]");
  const tileLayer = root.querySelector("[data-studio-tiles]");
  const stageIcons = [...root.querySelectorAll("[data-studio-stage-icon]")];
  const stageAvatar = root.querySelector("[data-studio-stage-avatar]");
  const stageName = root.querySelector("[data-studio-stage-name]");
  const statusLine = root.querySelector("[data-studio-status]");
  const currentWallpaperName = root.querySelector("[data-studio-current-wallpaper]");
  const currentIconName = root.querySelector("[data-studio-current-icon]");
  const wallpaperGrid = root.querySelector("[data-studio-grid]");
  const iconGrid = root.querySelector("[data-studio-icons]");
  const iconSearch = root.querySelector("[data-studio-search]");
  const familyButtons = [...root.querySelectorAll("[data-studio-family]")];
  const emptyNote = root.querySelector("[data-studio-empty]");
  const customInput = root.querySelector("[data-studio-upload]");
  const fileInput = root.querySelector("[data-studio-file]");
  const tileCheckbox = root.querySelector("[data-studio-tile-check]");
  const sizeInput = root.querySelector("[data-studio-size]");
  const sizeOutput = root.querySelector("[data-studio-size-value]");
  const nameField = root.querySelector("[data-studio-name]");
  const resetButton = root.querySelector("[data-studio-reset]");
  const customRemove = root.querySelector("[data-studio-custom-remove]");
  const downloadIcon = root.querySelector("[data-studio-download-icon]");
  const downloadPoster = root.querySelector("[data-studio-download-poster]");

  const wallpaperRadios = new Map();
  const iconRadios = new Map();

  /* ---------- Pozadí zkušebního okna ---------- */

  /* Tapeta = skutečný <img> na velkém souboru (1600 px). Vloží se
     až při prvním použití a pak se jen přepíná src, takže přepínání
     mezi tapetami nebliká a nemaže obrázek z cache. */
  let wallpaperImage = stage?.querySelector("[data-studio-wallpaper]") || null;

  function ensureWallpaperImage() {
    if (!stage) return null;
    if (!wallpaperImage) {
      wallpaperImage = doc.createElement("img");
      wallpaperImage.className = "lp-studio__shot-img";
      wallpaperImage.alt = "";
      wallpaperImage.decoding = "async";
      wallpaperImage.dataset.studioWallpaper = "";
      stage.prepend(wallpaperImage);
    }
    return wallpaperImage;
  }

  function paintWallpaper() {
    if (!stage) return;
    const image = wallpaperImage;
    const wallpaper = bySlug.get(state.wallpaper);

    stage.dataset.wallpaper = state.wallpaper;
    stage.classList.toggle("has-wallpaper", Boolean(state.wallpaper !== "none" && state.wallpaper !== "gradient"));

    /* Tapeta se podává s srcset: náhled 640 px stačí na běžný displej,
       1600px soubor si prohlížeč vyžádá jen na velkém nebo retina displeji.
       Menší tapeta se tak nikdy nenačte zbytečně. */
    if (wallpaper) {
      const node = ensureWallpaperImage();
      if (node) {
        node.srcset = `${wallpaper.thumb} 640w, ${wallpaper.hero} 1600w`;
        node.sizes = "(min-width: 1180px) 540px, (min-width: 760px) 46vw, 86vw";
        node.src = wallpaper.thumb;
        node.alt = "";
      }
    } else if (state.wallpaper === "custom" && state.custom) {
      const node = ensureWallpaperImage();
      if (node) {
        node.removeAttribute("srcset");
        node.removeAttribute("sizes");
        node.src = state.custom;
      }
    } else if (image) {
      image.removeAttribute("srcset");
      image.removeAttribute("src");
    }

    if (currentWallpaperName) {
      currentWallpaperName.textContent =
        state.wallpaper === "custom" && !state.custom ? translate("std.wp.custom.empty", "No image yet") : wallpaperName(state.wallpaper);
    }

    stage?.style.setProperty("--std-stage-tint", wallpaper?.tint || "120, 60, 190");
    wallpaperRadios.forEach((node, slug) => {
      node.checked = slug === state.wallpaper || (slug === "custom" && state.wallpaper === "custom");
    });
    if (customRemove) customRemove.hidden = state.wallpaper !== "custom" && !state.custom;
    /* Vlastní obrázek není dlaždice v mřížce, takže jeho „vybráno"
       nese rámeček upload boxu — jinak by po nahrání nezbyl
       v mřížce žádný zvýrazněný výběr. */
    root.querySelector("[data-studio-drop]")?.classList.toggle("is-active", state.wallpaper === "custom");
    renderCustomThumb();
    syncStatus();
  }

  function renderCustomThumb() {
    const thumb = root.querySelector("[data-studio-custom-thumb]");
    if (!thumb) return;
    let image = thumb.querySelector("img");
    if (state.custom) {
      if (!image) {
        image = doc.createElement("img");
        image.alt = "";
        image.decoding = "async";
        thumb.prepend(image);
      }
      if (image.getAttribute("src") !== state.custom) image.src = state.custom;
      thumb.classList.add("has-image");
    } else {
      if (image) image.remove();
      thumb.classList.remove("has-image");
    }
  }

  /* ---------- Ikony ---------- */

  function paintIcon() {
    const icon = iconBySlug.get(state.icon) || iconBySlug.get(DEFAULT_ICON);
    stageIcons.forEach(node => {
      node.style.backgroundImage = icon ? `url("${icon.file}")` : "";
      node.classList.toggle("has-icon", Boolean(icon));
    });
    if (currentIconName) currentIconName.textContent = iconName(state.icon);
    iconRadios.forEach((node, slug) => {
      node.checked = node.value === state.icon;
    });
    syncStatus();
  }

  function paintTiles() {
    if (!tileLayer) return;
    tileLayer.hidden = !state.tiles;
    stage?.classList.toggle("is-tiled", state.tiles);
    if (tileCheckbox) tileCheckbox.checked = state.tiles;
    const icon = iconBySlug.get(state.icon);
    if (state.tiles && icon) {
      tileLayer.style.backgroundImage = `url("${icon.file}")`;
      if (sizeOutput) sizeOutput.textContent = `${state.size} px`;
    }
    stage?.style.setProperty("--std-tile", `${state.size}px`);
    syncStatus();
  }

  function syncStatus() {
    if (!statusLine) return;
    const wallpaperText = state.wallpaper === "custom" && !state.custom
      ? translate("std.wp.custom.empty", "No image yet")
      : wallpaperName(state.wallpaper);
    statusLine.textContent = translate("std.status", "Background: {wp} · Icon: {icon}")
      .replace("{wp}", wallpaperText)
      .replace("{icon}", iconName(state.icon));
  }

  function apply(part) {
    if (part === "wallpaper" || part === "all") paintWallpaper();
    if (part === "icon" || part === "all") {
      paintIcon();
      paintTiles();
    }
    if (part === "tiles") paintTiles();
  }

  /* ===================== PAMĚŤ ===================== */

  function save(key, value) {
    store.set(key, value);
  }

  /* ===================== MŘÍŽKA TAPET ===================== */

  function buildWallpaperGrid() {
    if (!wallpaperGrid) return;
    const fragment = doc.createDocumentFragment();

    WALLPAPERS.forEach((item, index) => {
      const cell = doc.createElement("label");
      cell.className = "lp-studio__wp";
      cell.dataset.slug = item.slug;
      cell.innerHTML = `
        <input class="lp-studio__wp-input" name="std-wallpaper" type="radio" value="${item.slug}" data-studio-wallpaper-input/>
        <span class="lp-studio__wp-frame">
          <img alt="" decoding="async" height="90" loading="lazy" src="${item.thumb}" width="160"/>
          <span class="lp-studio__wp-check" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#mk-check"></use></svg></span>
          <span class="lp-studio__wp-swatch" style="--swatch:${item.tint}" aria-hidden="true"></span>
        </span>
        <span class="lp-studio__wp-name" data-studio-wp-name="${item.slug}"></span>
      `;
      /* První dlaždice jde s prioritou — je to výchozí tapeta a leží
         hned pod zkušebním oknem. Ostatní se načtou až při scrollu. */
      const image = cell.querySelector("img");
      if (image) image.fetchPriority = index < 2 ? "high" : "low";
      fragment.appendChild(cell);
      wallpaperRadios.set(item.slug, cell.querySelector("input"));
    });

    /* Dvě speciální volby na konci: čistý gradient a žádná tapeta. */
    ["gradient", "none"].forEach((slug, index) => {
      const cell = doc.createElement("label");
      cell.className = "lp-studio__wp lp-studio__wp--plain";
      cell.dataset.slug = slug;
      cell.innerHTML = `
        <input class="lp-studio__wp-input" name="std-wallpaper" type="radio" value="${slug}" data-studio-wallpaper-input/>
        <span class="lp-studio__wp-frame">
          <span class="lp-studio__wp-plain" aria-hidden="true"></span>
          <span class="lp-studio__wp-check" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#mk-check"></use></svg></span>
        </span>
        <span class="lp-studio__wp-name" data-studio-wp-name="${slug}"></span>
      `;
      fragment.appendChild(cell);
      wallpaperRadios.set(slug, cell.querySelector("input"));
      cell.style.setProperty("--d", `${index * 40}ms`);
    });

    wallpaperGrid.appendChild(fragment);
  }

  /* ===================== MŘÍŽKA IKON + HLEDÁNÍ ===================== */

  function buildIconGrid() {
    if (!iconGrid) return;
    const fragment = doc.createDocumentFragment();

    ICONS.forEach(item => {
      const cell = doc.createElement("label");
      cell.className = "lp-studio__icon";
      cell.dataset.slug = item.slug;
      cell.dataset.family = item.family;
      cell.dataset.search = `${item.slug} ${item.family} ${item.aliases || ""}`.toLowerCase();
      cell.innerHTML = `
        <input class="lp-studio__icon-input" name="std-icon" type="radio" value="${item.slug}" data-studio-icon-input/>
        <span class="lp-studio__icon-frame">
          <img alt="" decoding="async" height="192" loading="lazy" src="${item.file}" width="192"/>
        </span>
        <span class="lp-studio__icon-name" data-studio-icon-name="${item.slug}"></span>
      `;
      fragment.appendChild(cell);
      iconRadios.set(item.slug, cell.querySelector("input"));
    });

    iconGrid.appendChild(fragment);
  }

  /* Překlady dělá app.js přes data-i18n-*, ale názvy dlaždic
     vznikly v JS — proto si je po přepnutí jazyka přepíšeme sami. */
  function syncLabels() {
    root.querySelectorAll("[data-studio-wp-name]").forEach(node => {
      const key = node.dataset.studioWpName;
      node.textContent = wallpaperName(key);
    });
    root.querySelectorAll("[data-studio-icon-name]").forEach(node => {
      node.textContent = iconName(node.dataset.studioIconName);
    });
    root.querySelectorAll("[data-studio-family-label]").forEach(node => {
      node.textContent = familyName(node.dataset.studioFamilyLabel);
    });
    if (sizeOutput) sizeOutput.textContent = `${state.size} px`;
    const wallpaperCount = root.querySelector("[data-studio-count-wp]");
    if (wallpaperCount) {
      wallpaperCount.textContent = translate("std.wp.count", "{n} backgrounds").replace("{n}", String(WALLPAPERS.length + 2));
    }
    if (stageName) stageName.textContent = state.tab === "icons"
      ? translate("std.stage.icon", "Your icon")
      : translate("std.stage.player", "Player");
    apply("all");
  }

  function applyFilter() {
    if (!iconGrid) return;
    const query = state.query.trim().toLowerCase();
    let visible = 0;

    [...iconGrid.children].forEach(cell => {
      const matchesFamily = state.family === "all" || cell.dataset.family === state.family;
      const matchesQuery = !query || cell.dataset.search.includes(query);
      const show = matchesFamily && matchesQuery;
      cell.hidden = !show;
      if (show) visible += 1;
    });

    if (emptyNote) emptyNote.hidden = visible > 0;
    const counter = root.querySelector("[data-studio-count]");
    if (counter) {
      counter.textContent = translate("std.count", "{n} of {total} icons")
        .replace("{n}", String(visible))
        .replace("{total}", String(ICONS.length));
    }
  }

  function setTileSize(raw, persist) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    state.size = Math.max(32, Math.min(96, Math.round(value)));
    if (persist) save(STORE.size, state.size);
    if (sizeOutput) sizeOutput.textContent = `${state.size} px`;
    if (state.tiles) apply("tiles");
  }

  /* ===================== VÝBĚR ===================== */

  /* Tapeta se zapisuje do paměti jen tehdy, když se výběr opravdu
     změní — rádiové tlačítko umí poslat change i při stejném výběru. */
  function chooseWallpaper(slug) {
    if (!slug) return;
    if (slug === "custom" && !state.custom) {
      announce(translate("std.toast.custom.empty", "Upload your own image first."), "warning", 4200);
      return;
    }
    if (slug !== "custom" && slug !== "gradient" && slug !== "none" && !bySlug.has(slug)) return;
    const changed = state.wallpaper !== slug;
    state.wallpaper = slug;
    save(STORE.wallpaper, slug);
    apply("wallpaper");
    if (changed) {
      announce(
        translate("std.toast.wallpaper", "Background applied: {name}").replace("{name}", wallpaperName(slug)),
        "success",
        2600
      );
    }
  }

  function chooseIcon(slug) {
    if (!iconBySlug.has(slug)) return;
    const changed = state.icon !== slug;
    state.icon = slug;
    save(STORE.icon, slug);
    apply("icon");
    if (changed) {
      announce(
        translate("std.toast.icon", "Icon applied: {name}").replace("{name}", iconName(slug)),
        "success",
        2400
      );
    }
  }

  function chooseTab(name, { reveal = false } = {}) {
    if (!STUDIO_TABS.includes(name)) return;
    state.tab = name;
    tabButtons.forEach(button => {
      const active = button.dataset.studioTab === name;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    tabPanels.forEach(panel => {
      panel.hidden = panel.dataset.studioPanel !== name;
    });
    if (stage) stage.dataset.mode = name;
    if (stageName) {
      stageName.textContent = name === "icons"
        ? translate("std.stage.icon", "Your icon")
        : translate("std.stage.player", "Player");
    }
    if (stageAvatar) stageAvatar.hidden = name === "icons";
    if (name === "icons") applyFilter();
    /* Při startu stránky se NIKAM nescrolluje — dřív tady zůstalo
       scrollIntoView a stránka po načtení uskočila do sekce studia
       (a při každém přepnutí jazyka znovu). Posouvá se jen tenká
       lišta tabů, a to jen když přepnutí spustil člověk. */
    if (!reveal) return;
    const activeTab = tabButtons.find(button => button.dataset.studioTab === name);
    if (activeTab) activeTab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: prefersReduced() ? "auto" : "smooth" });
  }

  /* ===================== NAHRANÝ OBRÁZEK ===================== */

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("read"));
      reader.readAsDataURL(file);
    });
  }

  /* Zmenšení na 1600 px přes plátno: originál z foťáku má klidně
     8 MB a localStorage by ho nespolkl. Když plátno není, použije
     se originál — ošklivé, ale funkční. */
  function shrink(dataUrl) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
        if (scale >= 1) {
          resolve(dataUrl);
          return;
        }
        try {
          const canvas = doc.createElement("canvas");
          canvas.width = Math.round(image.naturalWidth * scale);
          canvas.height = Math.round(image.naturalHeight * scale);
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(dataUrl);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/webp", 0.82));
        } catch {
          resolve(dataUrl);
        }
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      announce(translate("std.toast.notimage", "That file is not an image."), "warning", 4200);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      announce(translate("std.toast.toobig", "The image is too big — 12 MB is the limit."), "warning", 4600);
      return;
    }

    let dataUrl = "";
    try {
      dataUrl = await shrink(await readFile(file));
    } catch {
      announce(translate("std.toast.uploadfailed", "The image could not be loaded."), "warning", 4200);
      return;
    }

    if (!dataUrl || dataUrl.length > CUSTOM_LIMIT * 1.4) {
      announce(translate("std.toast.quota", "The image is too large to remember — pick a smaller one."), "warning", 5200);
      return;
    }

    state.custom = dataUrl;
    state.wallpaper = "custom";
    if (!save(STORE.custom, dataUrl)) {
      announce(translate("std.toast.quota", "The image is too large to remember — pick a smaller one."), "warning", 5200);
    }
    save(STORE.wallpaper, "custom");
    apply("wallpaper");
    announce(translate("std.toast.uploaded", "Your image is set as the background."), "success", 3200);
  }

  /* ===================== OVLADAČE ===================== */

  function bindEvents() {
    tabButtons.forEach(button => {
      button.addEventListener("click", () => chooseTab(button.dataset.studioTab, { reveal: true }));
    });

    const tablist = root.querySelector("[data-studio-tablist]");
    tablist?.addEventListener("keydown", event => {
      const index = tabButtons.indexOf(doc.activeElement);
      if (index === -1) return;
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabButtons.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabButtons.length - 1;
      if (next === null) return;
      event.preventDefault();
      const button = tabButtons[next];
      chooseTab(button.dataset.studioTab, { reveal: true });
      button.focus({ preventScroll: true });
    });

    root.addEventListener("change", event => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.matches("[data-studio-wallpaper-input]")) chooseWallpaper(target.value);
      else if (target.matches("[data-studio-icon-input]")) chooseIcon(target.value);
      else if (target === tileCheckbox) {
        state.tiles = target.checked;
        save(STORE.tiles, state.tiles ? "1" : "0");
        apply("tiles");
      } else if (target === sizeInput) {
        setTileSize(target.value, true);
      }
    });

    /* Posuvník velikosti: `input` běží při tažení, `change` po puštění.
       Obojí míří na stejnou funkci, takže dlaždice rostou plynule
       a do paměti se zapíše jen konečná hodnota. */
    sizeInput?.addEventListener("input", () => setTileSize(sizeInput.value, false));

    familyButtons.forEach(button => {
      button.addEventListener("click", () => {
        state.family = button.dataset.studioFamily || "all";
        familyButtons.forEach(other => {
          const active = other === button;
          other.setAttribute("aria-pressed", String(active));
          other.classList.toggle("is-active", active);
        });
        applyFilter();
      });
    });

    iconSearch?.addEventListener("input", () => {
      state.query = iconSearch.value || "";
      applyFilter();
    });

    /* Našeptávač se čistí klávesou Esc — zvyk ze všech hledání. */
    iconSearch?.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      iconSearch.value = "";
      state.query = "";
      applyFilter();
    });

    customInput?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      handleFile(file);
    });

    /* Drag & drop — jen na dlaždici „vlastní obrázek“. */
    const dropZone = root.querySelector("[data-studio-drop]");
    if (dropZone) {
      ["dragenter", "dragover"].forEach(type => {
        dropZone.addEventListener(type, event => {
          event.preventDefault();
          dropZone.classList.add("is-dragover");
        });
      });
      ["dragleave", "dragend"].forEach(type => {
        dropZone.addEventListener(type, () => dropZone.classList.remove("is-dragover"));
      });
      dropZone.addEventListener("drop", event => {
        event.preventDefault();
        dropZone.classList.remove("is-dragover");
        const file = event.dataTransfer?.files?.[0];
        handleFile(file);
      });
    }

    customRemove?.addEventListener("click", () => {
      state.custom = "";
      store.remove(STORE.custom);
      if (state.wallpaper === "custom") {
        state.wallpaper = DEFAULT_WALLPAPER;
        save(STORE.wallpaper, DEFAULT_WALLPAPER);
      }
      apply("wallpaper");
      announce(translate("std.toast.custom.removed", "Your image was removed."), "system", 2800);
    });

    nameField?.addEventListener("input", () => {
      if (stageName) stageName.textContent = nameField.value.trim() || translate("std.stage.player", "Player");
    });

    /* Tlačítko „Stáhnout náhled“ vykreslí plakát na plátno a uloží PNG.
       Velikost 1280×720, tapeta se do něj překreslí zmenšená — a když
       plátno nemá kontext (nebo obrázek nejde přečíst), raději slušně
       vysvětlíme, že to nejde, místo abychom tiše nic neudělali. */
    downloadPoster?.addEventListener("click", async () => {
      if (downloadPoster.disabled) return;
      downloadPoster.disabled = true;
      const reset = () => {
        downloadPoster.disabled = false;
      };
      try {
        const url = await renderPoster();
        if (!url) {
          announce(translate("std.toast.poster.failed", "The preview could not be exported."), "warning", 4200);
          reset();
          return;
        }
        const link = doc.createElement("a");
        link.href = url;
        link.download = "minekube-launcher-vzhled.png";
        link.rel = "noopener";
        doc.body.appendChild(link);
        link.click();
        link.remove();
        announce(translate("std.toast.poster", "Preview saved as PNG."), "success", 3400);
      } catch {
        announce(translate("std.toast.poster.failed", "The preview could not be exported."), "warning", 4200);
      }
      reset();
    });

    downloadIcon?.addEventListener("click", () => {
      const icon = iconBySlug.get(state.icon);
      if (!icon) return;
      const link = doc.createElement("a");
      link.href = icon.file;
      link.download = `minekube-ikon-${state.icon}.png`;
      link.rel = "noopener";
      doc.body.appendChild(link);
      link.click();
      link.remove();
      announce(translate("std.toast.icon.download", "Icon saved: {name}").replace("{name}", iconName(state.icon)), "success", 3200);
    });

    resetButton?.addEventListener("click", () => {
      state.wallpaper = DEFAULT_WALLPAPER;
      state.icon = DEFAULT_ICON;
      state.tiles = false;
      state.size = 52;
      state.family = "all";
      state.query = "";
      state.custom = "";
      store.remove(STORE.custom);
      save(STORE.wallpaper, DEFAULT_WALLPAPER);
      save(STORE.icon, DEFAULT_ICON);
      save(STORE.tiles, "0");
      save(STORE.size, "52");
      if (iconSearch) iconSearch.value = "";
      if (nameField) nameField.value = "";
      familyButtons.forEach(button => {
        const active = button.dataset.studioFamily === "all";
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      });
      apply("all");
      applyFilter();
      announce(translate("std.toast.reset", "Back to the default look."), "system", 3000);
    });
  }

  /* ===================== EXPORT PLakÁTU ===================== */

  function loadImage(src) {
    return new Promise(resolve => {
      if (!src) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function renderPoster() {
    const canvas = doc.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) return "";

    const tint = bySlug.get(state.wallpaper)?.tint || "120, 60, 190";
    const base = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    base.addColorStop(0, "#150a12");
    base.addColorStop(1, `rgba(${tint}, 0.55)`);
    context.fillStyle = "#0b0509";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const source = bySlug.get(state.wallpaper)?.hero || (state.wallpaper === "custom" ? state.custom : "");
    const picture = await loadImage(source);
    if (picture) {
      const scale = Math.max(canvas.width / picture.width, canvas.height / picture.height);
      const width = picture.width * scale;
      const height = picture.height * scale;
      context.drawImage(picture, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      context.fillStyle = "rgba(10, 5, 9, 0.42)";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* Rámeček karty s ikonou — stejné proporce jako zkušební okno. */
    const cardX = 96;
    const cardY = 452;
    const cardW = 1088;
    const cardH = 172;
    context.fillStyle = "rgba(12, 6, 10, 0.82)";
    context.strokeStyle = "rgba(255, 255, 255, 0.14)";
    context.lineWidth = 2;
    roundRect(context, cardX, cardY, cardW, cardH, 26);
    context.fill();
    context.stroke();

    const icon = iconBySlug.get(state.icon);
    const iconImage = icon ? await loadImage(icon.file) : null;
    if (iconImage) {
      context.save();
      roundRect(context, cardX + 28, cardY + 26, 120, 120, 22);
      context.clip();
      context.fillStyle = "rgba(255, 255, 255, 0.06)";
      context.fillRect(cardX + 28, cardY + 26, 120, 120);
      context.drawImage(iconImage, cardX + 28, cardY + 26, 120, 120);
      context.restore();
    }

    const title = (nameField?.value || "").trim() || translate("std.stage.player", "Player");
    context.fillStyle = "#fdf6f1";
    context.font = "700 40px 'Inter', system-ui, sans-serif";
    context.fillText(title, cardX + 176, cardY + 74);
    context.fillStyle = "rgba(253, 246, 241, 0.62)";
    context.font = "500 24px 'Inter', system-ui, sans-serif";
    context.fillText(translate("std.poster.line", "Background and icon from the Minekube visual studio"), cardX + 176, cardY + 116);

    /* Energetické tlačítko Hrát. */
    const playX = cardX + cardW - 232;
    const playY = cardY + 46;
    const play = context.createLinearGradient(playX, playY, playX + 180, playY + 80);
    play.addColorStop(0, "#ffd863");
    play.addColorStop(0.62, "#fb7a12");
    play.addColorStop(1, "#fc0060");
    context.fillStyle = play;
    roundRect(context, playX, playY, 180, 80, 22);
    context.fill();
    context.fillStyle = "#22110a";
    context.font = "800 30px 'Inter', system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(translate("std.play", "Play"), playX + 90, playY + 42);

    context.fillStyle = "#fdf6f1";
    context.textAlign = "left";
    context.font = "800 56px 'Space Grotesk', 'Inter', system-ui, sans-serif";
    context.fillText("Minekube Launcher", 96, 128);
    context.fillStyle = "rgba(253, 246, 241, 0.66)";
    context.font = "500 26px 'Inter', system-ui, sans-serif";
    context.fillText(translate("std.poster.kicker", "Pick your background and icon — it carries over into the launcher"), 96, 174);

    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  /* ===================== PŘÍSTUPNOST A POHYB ===================== */

  function bindMotion() {
    const sync = () => {
      root.classList.toggle("is-still", prefersReduced() || !fxOn());
    };
    if (typeof api.motionQuery?.addEventListener === "function") {
      api.motionQuery.addEventListener("change", sync);
    }
    /* Přepínač efektů mění atribut na .launcher-page — hlídáme ho
       přes MutationObserver, protože jinak by studio o něm nevědělo. */
    const page = doc.querySelector(".launcher-page");
    if (page && "MutationObserver" in window) {
      new MutationObserver(sync).observe(page, { attributes: true, attributeFilter: ["data-fx-state"] });
    }
    sync();
  }

  /* ===================== START ===================== */

  readState();
  buildWallpaperGrid();
  buildIconGrid();
  bindEvents();
  bindMotion();
  chooseTab(state.tab);
  apply("all");
  applyFilter();
  syncLabels();

  document.addEventListener("minekube:language", () => {
    syncLabels();
    applyFilter();
  });

  /* Taby zůstávají v HTML postavené (fungují i bez JS jako dvě
     vedle sebe ležící sekce); JS jen přidá přepínání. */
  root.dataset.ready = "true";

  /* Veřejné rozhraní pro testy i pro ruční hrátky v konzoli. */
  window.MinekubeLauncherStudio = {
    state,
    chooseWallpaper,
    chooseIcon,
    chooseTab,
    reset() {
      resetButton?.click();
    }
  };
})();
