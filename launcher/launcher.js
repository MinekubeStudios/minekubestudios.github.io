/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA LAUNCHERU — LOGIKA (v9)
   -------------------------------------------------------------
   Načítá se po app.js a releases.js. Používá jejich překlady (t),
   oznámení (showToast) a data o vydáních
   (window.MinekubeLauncherReleases).

   Co tahle stránka umí:
     1. stáhne nejnovější Windows instalátor přímo z GitHubu,
     2. pravdivě popíše stav — „stahování zahájeno“, nikdy „hotovo“,
        protože dokončení hlásí prohlížeč, ne web,
     3. ukáže macOS a Linux jako „v plánu“ a nic nestahuje,
     4. ošetří načítání, nedostupné API i záložní adresu souboru,
     5. přepíná prohlídku rozhraní (taby, klávesnice),
     6. odhaluje sekce při scrollu (s respektem k redukci pohybu),
     7. překládá popisky obrázků přes data-i18n-alt.
   ============================================================= */

(function () {
  "use strict";

  const REPO_URL = "https://github.com/MinekubeStudios/MinekubeLauncher";
  const RELEASES_URL = `${REPO_URL}/releases`;
  const STARTED_HOLD_MS = 9000;

  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

  const prefersReduced = () => Boolean(motionQuery && motionQuery.matches);

  const translate = (key, fallback) => {
    const value = typeof t === "function" ? t(key) : key;
    return value && value !== key ? value : fallback ?? key;
  };

  const announce = (message, type, duration) => {
    if (typeof showToast === "function") showToast(message, type, duration);
  };

  /* ===================== ZDROJ DAT O VYDÁNÍCH ===================== */

  /* Kdyby se releases.js nenačetl, stránka nesmí spadnout — poskládáme
     stejné rozhraní z poslední známé adresy souboru v repozitáři. */
  function createFallbackSource() {
    const windows = {
      name: "Minekube.Launcher_1.2.1_x64-setup.exe",
      version: "1.2.1",
      size: 27140257,
      url: `${RELEASES_URL}/download/v1.2.1/Minekube.Launcher_1.2.1_x64-setup.exe`,
      digest: null
    };
    const files = { windows, macos: null, linux: null };
    const statuses = { windows: "live", macos: "planned", linux: "planned" };

    return {
      ready: Promise.resolve(),
      status: () => ({ state: "ready", source: "fallback", version: windows.version, degraded: true }),
      asset: os => files[os] || null,
      platform: os => ({
        id: os,
        status: statuses[os] || "planned",
        planned: statuses[os] !== "live",
        available: Boolean(files[os]),
        asset: files[os] || null
      }),
      isAvailable: os => Boolean(files[os]),
      download(os) {
        const file = files[os];
        if (!file) return { ok: false, reason: "unavailable" };
        startDownload(file);
        return { ok: true, asset: file };
      },
      refresh: () => Promise.resolve(),
      humanSize: null,
      repoUrl: REPO_URL,
      releasesUrl: RELEASES_URL
    };
  }

  const source = window.MinekubeLauncherReleases || createFallbackSource();

  /* ===================== POMOCNÉ ===================== */

  const PLATFORMS = {
    windows: { key: "lp.os.windows", sub: "lp.os.sub.windows", label: "Windows" },
    macos: { key: "lp.os.macos", sub: "lp.os.sub.macos", label: "macOS" },
    linux: { key: "lp.os.linux", sub: "lp.os.sub.linux", label: "Linux" }
  };

  const platformName = os => translate(PLATFORMS[os]?.key, PLATFORMS[os]?.label ?? os);

  function formatSize(bytes) {
    if (typeof source.humanSize === "function") {
      const formatted = source.humanSize(bytes);
      if (formatted) return formatted;
    }
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }

  function fileExtension(name) {
    const lower = String(name || "").toLowerCase();
    const compound = lower.match(/\.(?:app\.tar\.gz|tar\.gz|tar\.xz|tar\.zst)$/);
    if (compound) return compound[0];
    const simple = lower.match(/\.[a-z0-9]+$/);
    return simple ? simple[0] : "";
  }

  function shortDigest(digest) {
    if (typeof digest !== "string" || !digest.trim()) return "";
    const raw = digest.trim();
    const [, algorithm, value] =
      raw.match(/^(sha256|sha512)[:-]([a-f0-9]+)$/i) || [null, "sha256", raw];
    if (!value || value.length < 16) return "";
    return `${algorithm.toLowerCase()}:${value.slice(0, 12)}…${value.slice(-8)}`;
  }

  function startDownload(file) {
    const link = document.createElement("a");
    link.href = file.url;
    link.rel = "noopener noreferrer";
    link.download = file.name || "";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => link.remove(), 2000);
  }

  function describeAsset(asset) {
    if (!asset || !asset.name) return "";
    const size = formatSize(asset.size);
    return size ? `${asset.name} · ${size}` : asset.name;
  }

  /* ===================== PRVKY NA STRÁNCE ===================== */

  const heroButton = document.querySelector(".lp-hero .lp-btn[data-launcher-download]");
  const heroLabel = heroButton?.querySelector("[data-os-label]") ?? null;
  const heroSub = document.querySelector("[data-os-sub]");
  const versionNodes = [...document.querySelectorAll("[data-launcher-version]")];
  const sourceNodes = [...document.querySelectorAll("[data-launcher-source]")];
  const heroFileRow = document.querySelector('[data-launcher-file="hero"]');
  const heroFileName = heroFileRow?.querySelector("[data-launcher-file-name]") ?? null;
  const cardFileRows = [...document.querySelectorAll('[data-launcher-file="windows"]')];
  const hashRow = document.querySelector("[data-launcher-hash]");
  const hashValue = hashRow?.querySelector("[data-launcher-hash-value]") ?? null;
  const skeleton = document.querySelector('[data-launcher-skeleton="windows"]');
  const errorBox = document.querySelector("[data-launcher-error]");
  const retryButton = document.querySelector("[data-launcher-retry]");
  const stateNode = document.querySelector("[data-launcher-state]");
  const stateLabel = stateNode?.querySelector("[data-launcher-state-label]") ?? null;
  const hintNode = document.querySelector("[data-launcher-hint]");
  const downloadButtons = [...document.querySelectorAll("[data-launcher-download]")];
  const startNote = document.querySelector("[data-launcher-start-note]");

  let startedAt = 0;
  let announcedFallback = false;
  let announcedVisitorOS = false;
  let currentOS = "windows";

  const setState = (node, state) => {
    if (node && node.dataset.state !== state) node.dataset.state = state;
  };

  /* ===================== DETEKCE PLATFORMY ===================== */

  function detectOS() {
    const ua = navigator.userAgent || "";
    if (/Mac|iPhone|iPad/i.test(ua) && !/Linux/i.test(ua)) return "macos";
    if (/Linux|X11|FreeBSD/i.test(ua)) return "linux";
    return "windows";
  }

  /* ===================== VYKRESLENÍ ===================== */

  function renderVersion(status) {
    let text = "…";
    if (status.state === "ready" && status.version) text = `v${status.version}`;
    else if (status.state === "error" || status.state === "empty") text = "—";
    versionNodes.forEach(node => {
      node.textContent = text;
    });
  }

  function renderSource(status) {
    const key =
      status.source === "releases"
        ? "lp.dl.source.releases"
        : status.source === "repo"
          ? "lp.dl.source.repo"
          : "lp.dl.source.fallback";

    sourceNodes.forEach(node => {
      const label = node.querySelector("span");
      if (label) label.textContent = translate(key, "GitHub");
      node.hidden = status.state !== "ready";
    });
  }

  function renderStatusLine(status) {
    if (!stateNode) return;
    const ready = status.state === "ready";
    const failed = status.state === "error" || status.state === "empty";
    const fallback = ready && status.source === "fallback";

    stateNode.dataset.state = failed ? "error" : ready ? "ready" : "loading";
    if (!stateLabel) return;

    if (ready) {
      stateLabel.textContent = translate(
        fallback ? "lp.dl.state.fallback" : "lp.dl.state.ready",
        fallback ? "Fallback source" : "Ready"
      );
    } else if (failed) {
      stateLabel.textContent = translate("lp.dl.state.error", "Unavailable");
    } else {
      stateLabel.textContent = translate("lp.dl.state.loading", "Checking…");
    }
  }

  function renderFiles(status) {
    const loading = status.state === "loading";
    const asset = status.state === "ready" ? source.asset("windows") : null;
    const description = describeAsset(asset);

    if (skeleton) skeleton.hidden = !loading;
    if (errorBox) errorBox.hidden = !(status.state === "error" || status.state === "empty");
    if (retryButton) retryButton.disabled = loading;

    cardFileRows.forEach(row => {
      const label = row.querySelector("[data-launcher-file-name]");
      if (label) label.textContent = description;
      row.hidden = !description;
    });

    if (hashRow && hashValue) {
      const short = shortDigest(asset?.digest);
      hashValue.textContent = short;
      hashRow.hidden = !short;
      if (short && asset?.digest) hashRow.setAttribute("title", asset.digest);
      else hashRow.removeAttribute("title");
    }
  }

  function heroLabelText(info, status) {
    if (info.planned) {
      return translate("lp.dl.label.planned", "{os} — planned").replace("{os}", platformName(currentOS));
    }
    if (status.state === "loading") return translate("lp.dl.state.loading", "Checking…");
    if (status.state === "error" || status.state === "empty") {
      return translate("lp.dl.error.retry", "Try again");
    }
    if (Date.now() - startedAt < STARTED_HOLD_MS) {
      return translate("lp.dl.label.started", "Download started");
    }
    return translate("lp.dl.label.download", "Download for {os}").replace("{os}", platformName(currentOS));
  }

  function heroState(info, status) {
    if (info.planned) return "planned";
    if (status.state === "loading") return "loading";
    if (status.state === "error" || status.state === "empty") return "error";
    return Date.now() - startedAt < STARTED_HOLD_MS ? "started" : "idle";
  }

  function renderHero(status) {
    const info = source.platform(currentOS) || { planned: false, available: false, asset: null };
    const asset = info.planned ? null : source.asset(currentOS);

    if (heroButton) {
      heroButton.dataset.os = currentOS;
      setState(heroButton, heroState(info, status));
      heroButton.setAttribute("aria-busy", String(status.state === "loading"));
    }

    if (heroLabel) heroLabel.textContent = heroLabelText(info, status);

    if (heroSub) {
      if (info.planned) heroSub.textContent = translate("lp.os.sub.planned", "Build in progress");
      else if (status.state === "loading") heroSub.textContent = translate("lp.dl.state.loading", "Checking…");
      else if (!asset) heroSub.textContent = translate("lp.dl.state.error", "Unavailable");
      else {
        const parts = [translate(PLATFORMS[currentOS]?.sub, "")].filter(Boolean);
        const size = formatSize(asset.size);
        if (size) parts.push(size);
        const ext = fileExtension(asset.name);
        if (ext) parts.push(ext);
        heroSub.textContent = parts.join(" · ");
      }
    }

    const heroDescription = info.planned || status.state !== "ready" ? "" : describeAsset(asset);
    if (heroFileName) heroFileName.textContent = heroDescription;
    if (heroFileRow) heroFileRow.hidden = !heroDescription;

    if (hintNode) {
      const label = heroLabelText(info, status);
      const sub = heroSub?.textContent || "";
      const file = heroDescription ? `. ${heroDescription}` : "";
      hintNode.textContent = [label, sub].filter(Boolean).join(" — ") + file;
    }
  }

  function renderPlatformButtons(status) {
    const loading = status.state === "loading";
    const failed = status.state === "error" || status.state === "empty";
    const available = status.state === "ready" && Boolean(source.asset("windows"));

    downloadButtons
      .filter(button => button !== heroButton)
      .forEach(button => {
        const os = button.dataset.os;
        const info = source.platform(os);
        if (info.planned) {
          setState(button, "planned");
          button.disabled = false;
          button.setAttribute("aria-busy", "false");
          return;
        }
        setState(button, loading ? "loading" : failed || !available ? "error" : "idle");
        button.disabled = loading;
        button.setAttribute("aria-busy", String(loading));
      });
  }

  function renderAll() {
    const status = source.status();
    const justStarted = Date.now() - startedAt < STARTED_HOLD_MS;
    if (startNote) startNote.hidden = !justStarted;
    renderVersion(status);
    renderSource(status);
    renderStatusLine(status);
    renderFiles(status);
    renderHero(status);
    renderPlatformButtons(status);
  }

  /* ===================== STAHOVÁNÍ ===================== */

  function plannedToast(os) {
    announce(translate("lp.toast.planned", "{os} is planned.").replace("{os}", platformName(os)), "warning", 5200);
  }

  function runDownload(button, os, asset) {
    if (!asset) return;

    startedAt = Date.now();
    const result = source.download(os);

    if (result && result.ok === false) {
      announce(translate("lp.toast.error", "Download failed."), "warning", 5200);
      refetch().then(() => {
        const fresh = source.asset(os);
        if (fresh && fresh.url) {
          startedAt = Date.now();
          startDownload(fresh);
        }
        renderAll();
      });
      return;
    }

    // Zahájení, ne dokončení: průběh a výsledek hlásí prohlížeč.
    announce(translate("lp.toast.start", "Download started: {file}").replace("{file}", asset.name), "download", 5200);
    renderAll();

    window.setTimeout(renderAll, STARTED_HOLD_MS + 120);
  }

  function refetch() {
    const promise = typeof source.refresh === "function" ? source.refresh(true) : Promise.resolve();
    return Promise.resolve(promise).catch(() => null);
  }

  function retryThenDownload(button) {
    setState(button, "loading");
    announce(translate("lp.toast.fetching", "Loading the release again…"), "system", 2600);

    refetch().then(() => {
      const status = source.status();
      const asset = source.asset("windows");
      renderAll();

      if (status.state === "ready" && asset) {
        runDownload(button, "windows", asset);
      } else {
        announce(translate("lp.toast.retryFailed", "The release still will not load."), "warning", 5400);
      }
    });
  }

  function onDownloadClick(button) {
    const os = PLATFORMS[button.dataset.os] ? button.dataset.os : currentOS;
    const info = source.platform(os);
    const status = source.status();

    if (info.planned) {
      plannedToast(os);
      return;
    }

    if (button.dataset.state === "loading") return;

    const asset = source.asset(os);
    if (status.state === "ready" && asset) {
      runDownload(button, os, asset);
      return;
    }

    retryThenDownload(button);
  }

  downloadButtons.forEach(button => {
    button.addEventListener("click", () => onDownloadClick(button));
  });

  retryButton?.addEventListener("click", () => {
    setState(heroButton, "loading");
    refetch().then(() => {
      renderAll();
      const status = source.status();
      if (status.state === "ready" && status.source === "fallback" && !announcedFallback) {
        announcedFallback = true;
        announce(translate("lp.toast.fallback", "Fallback source."), "warning", 5200);
      }
    });
  });

  /* ===================== REAKCE NA NAČTENÍ VYDÁNÍ ===================== */

  function onReleases() {
    renderAll();
    const status = source.status();

    if (status.state === "ready" && status.source === "fallback" && !announcedFallback) {
      announcedFallback = true;
      announce(translate("lp.toast.fallback", "Fallback source."), "warning", 5600);
    }
  }

  if (source.ready && typeof source.ready.then === "function") {
    source.ready.then(onReleases).catch(onReleases);
  } else {
    onReleases();
  }

  document.addEventListener("minekube:launcher-releases", onReleases);

  /* Návštěvník z macOS/Linuxu: hlavní tlačítko musí zůstat použitelné,
     takže mu jednou slušně řekneme, jak to je. */
  function announceVisitorOS() {
    if (announcedVisitorOS) return;
    announcedVisitorOS = true;
    const detected = detectOS();
    if (detected === "windows") return;
    const info = source.platform(detected);
    if (!info || !info.planned) return;
    announce(translate("lp.toast.os", "The {os} build is in progress.").replace("{os}", platformName(detected)), "warning", 5600);
  }

  if ("IntersectionObserver" in window && heroButton) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        announceVisitorOS();
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(heroButton);
  } else {
    window.setTimeout(announceVisitorOS, 1200);
  }

  /* ===================== PROHLÍDKA ROZHRANÍ ===================== */

  const tourTabs = [...document.querySelectorAll(".lp-tabs [role='tab']")];
  const tourPanels = [...document.querySelectorAll(".lp-panel[role='tabpanel']")];

  function selectTour(tab, { focus = false } = {}) {
    if (!tab) return;
    const id = tab.getAttribute("aria-controls");
    tourTabs.forEach(item => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    tourPanels.forEach(panel => {
      panel.hidden = panel.id !== id;
    });
    syncTabPill();
    if (focus) tab.focus({ preventScroll: true });
  }

  tourTabs.forEach(tab => {
    tab.addEventListener("click", () => selectTour(tab));
  });

  const tourList = document.querySelector(".lp-tabs");
  const tabPill = tourList?.querySelector("[data-tab-pill]") ?? null;

  function syncTabPill() {
    if (!tabPill || !tourList) return;
    const active = tourTabs.find(tab => tab.getAttribute("aria-selected") === "true");
    if (!active || !active.offsetWidth) {
      tabPill.style.opacity = "0";
      return;
    }
    tabPill.style.opacity = "1";
    tabPill.style.width = `${active.offsetWidth}px`;
    tabPill.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  syncTabPill();
  window.addEventListener("resize", () => window.requestAnimationFrame(syncTabPill), { passive: true });
  if (document.fonts && typeof document.fonts.ready === "object") {
    document.fonts.ready.then(syncTabPill).catch(() => {});
  }
  tourList?.addEventListener("keydown", event => {
    const index = tourTabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tourTabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tourTabs.length) % tourTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tourTabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    selectTour(tourTabs[next], { focus: true });
  });

  /* ===================== PŘEKLADY OBRÁZKŮ ===================== */

  function syncAltTexts() {
    document.querySelectorAll("[data-i18n-alt]").forEach(node => {
      const value = typeof t === "function" ? t(node.dataset.i18nAlt) : node.dataset.i18nAlt;
      if (value && value !== node.dataset.i18nAlt) node.setAttribute("alt", value);
    });
  }

  document.addEventListener("minekube:language", () => {
    syncAltTexts();
    syncTabPill();
    renderAll();
  });

  syncAltTexts();

  /* ===================== ODHALOVÁNÍ PŘI SCROLLU ===================== */

  const revealNodes = [...document.querySelectorAll("[data-reveal]")];

  function revealAll() {
    revealNodes.forEach(node => node.classList.add("is-in"));
  }

  if (prefersReduced() || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealNodes.forEach(node => revealObserver.observe(node));
  }

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", event => {
      if (event.matches) revealAll();
    });
  }

  /* ===================== EFEKTY + GALERIE (v10) ===================== */

  const pageRoot = document.querySelector(".launcher-page");
  const FX_KEY = "minekube:launcher-fx";
  const finePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)")
    : { matches: false };

  document.documentElement.classList.add("lp-js");

  const fxOn = () => !prefersReduced() && pageRoot?.dataset.fx !== "off";

  /* Jeden rAF cyklus pro obě plátna — žádné souběžné smyčky. */
  const painter = (() => {
    const subs = new Set();
    let running = false;
    let last = 0;

    function tick(time) {
      const dt = last ? Math.min(50, time - last) : 16;
      last = time;
      let alive = false;
      subs.forEach(fn => {
        if (fn(dt, time)) alive = true;
      });
      if (alive) {
        window.requestAnimationFrame(tick);
      } else {
        running = false;
        last = 0;
      }
    }

    return {
      add(fn) {
        subs.add(fn);
      },
      wake() {
        if (running) return;
        running = true;
        last = 0;
        window.requestAnimationFrame(tick);
      }
    };
  })();

  /* ---------- Prach v hero ---------- */

  function initDust() {
    const canvas = document.querySelector("[data-dust]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const COLORS = ["255, 216, 99", "252, 0, 96", "255, 255, 255", "200, 60, 255"];
    let width = 0;
    let height = 0;
    let parts = [];
    let visible = true;
    let acc = 0;

    const make = seed => ({
      x: Math.random() * width,
      y: seed ? Math.random() * height : height + 8,
      r: 0.6 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.012,
      vy: -(0.008 + Math.random() * 0.02),
      a: 0.16 + Math.random() * 0.46,
      tw: 0.5 + Math.random() * 1.3,
      ph: Math.random() * Math.PI * 2,
      fill: `rgb(${COLORS[Math.floor(Math.random() * COLORS.length)]})`
    });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(58, Math.max(20, (width * height) / 26000)));
      parts = Array.from({ length: count }, () => make(true));
    }

    function frame(dt, time) {
      if (!visible || !fxOn() || !width || !height) return false;
      acc += dt;
      if (acc < 30) return true;
      const step = acc;
      acc = 0;
      ctx.clearRect(0, 0, width, height);
      for (const p of parts) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.y < -10) {
          p.y = height + 8;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        const twinkle = 0.55 + Math.sin(time * 0.0012 * p.tw + p.ph) * 0.45;
        ctx.globalAlpha = Math.max(0, p.a * twinkle);
        ctx.fillStyle = p.fill;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return true;
    }

    painter.add(frame);
    resize();

    if ("ResizeObserver" in window) {
      const sizes = new ResizeObserver(() => {
        resize();
        painter.wake();
      });
      sizes.observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    if ("IntersectionObserver" in window) {
      const watcher = new IntersectionObserver(
        entries => {
          visible = entries.some(entry => entry.isIntersecting);
          if (visible) painter.wake();
        },
        { rootMargin: "120px" }
      );
      watcher.observe(canvas);
    }
    painter.wake();
  }

  /* ---------- Jiskry pod kurzorem ---------- */

  function initSparkles() {
    if (!finePointer.matches) return;
    const canvas = document.querySelector("[data-fx]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const COLORS = ["252, 192, 0", "252, 0, 96", "251, 122, 18", "255, 255, 255"];
    const MAX = 110;
    const parts = [];
    let width = 0;
    let height = 0;
    let lastSpawn = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(x, y, count) {
      if (!fxOn()) return;
      for (let i = 0; i < count; i += 1) {
        if (parts.length >= MAX) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.2;
        parts.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.04,
          life: 0,
          ttl: 480 + Math.random() * 520,
          r: 1 + Math.random() * 2.1,
          fill: `rgb(${COLORS[Math.floor(Math.random() * COLORS.length)]})`
        });
      }
      painter.wake();
    }

    function frame(dt) {
      if (!parts.length) return false;
      ctx.clearRect(0, 0, width, height);
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.ttl) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += 0.00032 * dt;
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = 1 - p.life / p.ttl;
        ctx.globalAlpha = k * k;
        ctx.fillStyle = p.fill;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.35 + k), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return true;
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    painter.add(frame);

    window.addEventListener(
      "pointermove",
      event => {
        if (event.pointerType === "touch" || !fxOn()) return;
        if (document.body.classList.contains("lp-lb-open")) return;
        const now = performance.now();
        if (now - lastSpawn < 26) return;
        lastSpawn = now;
        burst(event.clientX, event.clientY, Math.random() < 0.22 ? 2 : 1);
      },
      { passive: true }
    );

    document.querySelectorAll(".lp-btn--spark").forEach(button => {
      button.addEventListener("click", event => {
        if (!fxOn()) return;
        const rect = button.getBoundingClientRect();
        const x = event.clientX || rect.left + rect.width / 2;
        const y = event.clientY || rect.top + rect.height / 2;
        burst(x, y, 16);
      });
    });
  }

  /* ---------- Přepínač efektů ---------- */

  function initFxToggle() {
    const button = document.querySelector("[data-fx-toggle]");
    if (!button) return;

    const apply = (on, persist) => {
      if (pageRoot) pageRoot.dataset.fx = on ? "on" : "off";
      button.setAttribute("aria-pressed", String(on));
      if (persist) {
        try {
          localStorage.setItem(FX_KEY, on ? "on" : "off");
        } catch {
          /* soukromý režim — jen si to nepamatujeme */
        }
      }
      if (on) {
        painter.wake();
      } else {
        document.querySelector("[data-fx]")?.classList.remove("is-active");
        document.querySelector("[data-dust]")?.classList.remove("is-active");
      }
    };

    let on = !prefersReduced();
    try {
      const saved = localStorage.getItem(FX_KEY);
      if (saved === "off") on = false;
      if (saved === "on" && !prefersReduced()) on = true;
    } catch {
      /* ignorujeme */
    }

    apply(on, false);
    button.disabled = false;
    document.querySelectorAll("[data-fx], [data-dust]").forEach(canvas => {
      canvas.classList.toggle("is-active", on);
    });

    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-pressed") !== "true";
      apply(next, true);
      document.querySelectorAll("[data-fx], [data-dust]").forEach(canvas => {
        canvas.classList.toggle("is-active", next);
      });
    });

    const syncMotion = () => {
      if (prefersReduced()) {
        apply(false, false);
        document.querySelectorAll("[data-fx], [data-dust]").forEach(canvas => {
          canvas.classList.remove("is-active");
        });
      }
    };

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", syncMotion);
    }
  }

  /* ---------- Ripple v tlačítkách ---------- */

  function initRipples() {
    const buttons = [...document.querySelectorAll(".lp-btn")];
    if (!buttons.length) return;

    const spawn = (button, x, y) => {
      if (!fxOn()) return;
      const ripple = document.createElement("span");
      ripple.className = "lp-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 660);
    };

    buttons.forEach(button => {
      button.addEventListener(
        "pointerdown",
        event => {
          if (event.pointerType === "keyboard") return;
          const rect = button.getBoundingClientRect();
          spawn(button, event.clientX - rect.left, event.clientY - rect.top);
        },
        { passive: true }
      );

      // Klávesnice (Enter/Mezerník) nemá souřadnice — ripple doprostřed.
      button.addEventListener("click", event => {
        if (event.detail !== 0) return;
        const rect = button.getBoundingClientRect();
        spawn(button, rect.width / 2, rect.height / 2);
      });
    });
  }

  /* ---------- 3D náklon hero okna ---------- */

  function initTilt() {
    const targets = [...document.querySelectorAll("[data-tilt]")];
    if (!targets.length || !finePointer.matches || prefersReduced()) return;

    targets.forEach(target => {
      const MAX = 6;
      let queued = false;

      target.addEventListener(
        "pointermove",
        event => {
          if (queued) return;
          queued = true;
          window.requestAnimationFrame(() => {
            queued = false;
            if (!fxOn()) return;
            const rect = target.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            target.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX).toFixed(2)}deg`);
            target.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX).toFixed(2)}deg`);
            target.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
            target.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
          });
        },
        { passive: true }
      );

      target.addEventListener("pointerleave", () => {
        target.style.setProperty("--ry", "0deg");
        target.style.setProperty("--rx", "0deg");
        target.style.setProperty("--gx", "50%");
        target.style.setProperty("--gy", "0%");
      });
    });
  }

  /* ---------- Světlo sledující kurzor na kartách ---------- */

  function initSpotlight() {
    const cards = [...document.querySelectorAll(".lp-spot")];
    if (!cards.length || !finePointer.matches || prefersReduced()) return;

    cards.forEach(card => {
      let queued = false;
      let x = 0;
      let y = 0;

      card.addEventListener(
        "pointermove",
        event => {
          if (!fxOn()) return;
          const rect = card.getBoundingClientRect();
          x = event.clientX - rect.left;
          y = event.clientY - rect.top;
          if (queued) return;
          queued = true;
          window.requestAnimationFrame(() => {
            queued = false;
            card.style.setProperty("--mx", `${x.toFixed(1)}px`);
            card.style.setProperty("--my", `${y.toFixed(1)}px`);
          });
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }

  /* ---------- Nekonečný pás ---------- */

  function initMarquee() {
    const track = document.querySelector(".lp-marquee__track");
    if (!track || track.dataset.cloned === "true") return;
    const originals = [...track.children];
    if (!originals.length) return;
    originals.forEach(item => {
      const copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
    track.dataset.cloned = "true";
  }

  /* ---------- Kotvy, navigace sekcí ---------- */

  function initSmoothScroll() {
    document.querySelectorAll("[data-scroll]").forEach(link => {
      link.addEventListener("click", event => {
        const hash = link.getAttribute("href") || "";
        if (!hash.startsWith("#")) return;
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
        try {
          history.replaceState(null, "", hash);
        } catch {
          /* file:// v sandboxu historii nepodporuje */
        }
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  function initScrollUi() {
    const nav = document.querySelector(".lp-nav");
    const links = [...document.querySelectorAll("[data-nav-link]")];
    const targets = links
      .map(link => {
        const section = document.querySelector(link.getAttribute("href") || "");
        return section ? { section, link } : null;
      })
      .filter(Boolean);
    if (!nav && !targets.length) return;

    let navTop = 0;
    let tops = [];
    let ticking = false;

    const documentTop = element => {
      let y = 0;
      let node = element;
      while (node) {
        y += node.offsetTop || 0;
        node = node.offsetParent;
      }
      return y;
    };

    const measure = () => {
      navTop = nav ? documentTop(nav) : 0;
      tops = targets.map(({ section }) => documentTop(section));
      update();
    };

    function update() {
      ticking = false;
      const y = window.scrollY;
      if (nav) nav.classList.toggle("is-stuck", y > Math.max(0, navTop - 140));
      if (!targets.length) return;
      const line = y + window.innerHeight * 0.34;
      let activeIndex = -1;
      tops.forEach((top, index) => {
        if (top <= line) activeIndex = index;
      });
      targets.forEach(({ link }, index) => {
        const active = index === activeIndex;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 140);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("minekube:language", () => window.setTimeout(measure, 0));
    if (document.fonts && typeof document.fonts.ready === "object") {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }

  /* ---------- Galerie / lightbox ---------- */

  function initLightbox() {
    const root = document.querySelector("[data-lightbox-root]");
    if (!root) return;

    const dialog = root.querySelector("[data-lb-dialog]");
    const image = root.querySelector("[data-lb-img]");
    const titleNode = root.querySelector("[data-lb-title]");
    const captionNode = root.querySelector("[data-lb-caption]");
    const countNode = root.querySelector("[data-lb-count]");
    const prevButton = root.querySelector("[data-lb-prev]");
    const nextButton = root.querySelector("[data-lb-next]");
    const stage = root.querySelector("[data-lb-stage]");
    const closeButton = root.querySelector(".lp-lb__close");
    const triggers = [...document.querySelectorAll("[data-lightbox]")].filter(trigger =>
      trigger.querySelector("img")
    );
    if (!image || !triggers.length) return;

    const items = triggers.map(trigger => {
      const thumb = trigger.querySelector("img");
      const source = thumb.currentSrc || thumb.getAttribute("src") || "";
      const full = source.includes("/full/") ? source : source.replace(/(^|\/)img\//, "$1img/full/");
      return {
        trigger,
        thumb,
        full,
        id: trigger.dataset.gallery || "",
        fallback: source
      };
    });

    let index = 0;
    let lastFocus = null;
    let closeTimer = 0;
    let locked = [];

    const label = item => {
      const alt = item.thumb?.getAttribute("alt") || "";
      const title = translate(`lp.lb.title.${item.id}`, alt || "Minekube Launcher");
      return { title, caption: alt };
    };

    function paintText() {
      const item = items[index];
      if (!item) return;
      const { title, caption } = label(item);
      if (titleNode) titleNode.textContent = title;
      if (captionNode) captionNode.textContent = caption;
      if (countNode) countNode.textContent = `${index + 1} / ${items.length}`;
    }

    function preload(target) {
      if (!target) return;
      const next = new Image();
      next.decoding = "async";
      next.src = target.full;
    }

    function show(nextIndex, { focusImage = false } = {}) {
      index = (nextIndex + items.length) % items.length;
      const item = items[index];
      paintText();
      root.classList.add("is-loading");
      image.classList.remove("is-ready", "is-zoomed");

      const loaded = () => {
        root.classList.remove("is-loading");
        image.classList.add("is-ready");
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        preload(items[(index + 1) % items.length]);
        preload(items[(index - 1 + items.length) % items.length]);
      };

      const failed = () => {
        root.classList.remove("is-loading");
        if (image.getAttribute("src") !== item.fallback) {
          image.src = item.fallback;
          image.classList.add("is-ready");
        }
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
      };

      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);

      if (image.getAttribute("src") !== item.full) {
        image.src = item.full;
      } else if (image.complete) {
        // Stejná adresa podruhé: prohlížeč už nic nenačítá, stav rozhodneme sami.
        if (image.naturalWidth) loaded();
        else failed();
      }

      image.alt = item.thumb?.getAttribute("alt") || "";
      if (focusImage) image.focus({ preventScroll: true });
    }

    function open(position, trigger) {
      window.clearTimeout(closeTimer);
      lastFocus = trigger || document.activeElement;
      root.hidden = false;
      root.classList.remove("is-closing");
      document.body.classList.add("lp-lb-open");
      index = position;
      show(position);
      closeButton?.focus({ preventScroll: true });
      locked = [document.querySelector("main"), document.querySelector(".site-header"), document.querySelector(".site-footer")].filter(Boolean);
      locked.forEach(node => {
        try {
          node.inert = true;
        } catch {
          /* starší prohlížeč */
        }
      });
      window.requestAnimationFrame(() => root.classList.add("is-open"));
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      if (root.hidden) return;
      root.classList.add("is-closing");
      root.classList.remove("is-open", "is-loading");
      document.removeEventListener("keydown", onKeydown);
      document.body.classList.remove("lp-lb-open");
      locked.forEach(node => {
        try {
          node.inert = false;
        } catch {
          /* ignorujeme */
        }
      });
      locked = [];
      image.classList.remove("is-zoomed");
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(
        () => {
          root.hidden = true;
          root.classList.remove("is-closing");
          image.classList.remove("is-ready");
        },
        prefersReduced() ? 0 : 300
      );
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus({ preventScroll: true });
      }
    }

    function step(direction) {
      image.classList.remove("is-zoomed");
      show(index + direction);
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = [...dialog.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")].filter(
        node => !node.disabled && node.offsetParent !== null
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    /* Zoom na klik s ohnisem v místě dotyku. */
    image.addEventListener("click", event => {
      const rect = image.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      image.style.setProperty("--zx", `${Number.isFinite(x) ? x.toFixed(1) : 50}%`);
      image.style.setProperty("--zy", `${Number.isFinite(y) ? y.toFixed(1) : 50}%`);
      image.classList.toggle("is-zoomed");
    });

    /* Swipe na mobilu jen když není obrázek přiblížený. */
    let touchStart = null;
    stage?.addEventListener(
      "touchstart",
      event => {
        if (image.classList.contains("is-zoomed")) return;
        touchStart = event.touches[0] ? event.touches[0].clientX : null;
      },
      { passive: true }
    );
    stage?.addEventListener(
      "touchend",
      event => {
        if (touchStart === null) return;
        const touch = event.changedTouches[0];
        const delta = touch ? touch.clientX - touchStart : 0;
        touchStart = null;
        if (Math.abs(delta) < 45) return;
        step(delta < 0 ? 1 : -1);
      },
      { passive: true }
    );

    triggers.forEach((trigger, position) => {
      trigger.addEventListener("click", () => open(position, trigger));
    });

    prevButton?.addEventListener("click", () => step(-1));
    nextButton?.addEventListener("click", () => step(1));
    root.querySelectorAll("[data-lb-close]").forEach(node => node.addEventListener("click", close));

    image.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        image.classList.toggle("is-zoomed");
      }
    });

    /* Po změně jazyka se překreslí popisky i alt texty. */
    document.addEventListener("minekube:language", () => {
      if (!root.hidden) {
        paintText();
        image.alt = items[index]?.thumb?.getAttribute("alt") || "";
      }
    });
  }

  initFxToggle();
  initRipples();
  initDust();
  initSparkles();
  initTilt();
  initSpotlight();
  initMarquee();
  initSmoothScroll();
  initScrollUi();
  initLightbox();


  /* ===================== START ===================== */

  renderAll();
})();
