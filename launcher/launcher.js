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

  const tourTabs = [...document.querySelectorAll(".lp-tour__tabs [role='tab']")];
  const tourPanels = [...document.querySelectorAll(".lp-tour [role='tabpanel']")];

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
    if (focus) tab.focus({ preventScroll: true });
  }

  tourTabs.forEach(tab => {
    tab.addEventListener("click", () => selectTour(tab));
  });

  const tourList = document.querySelector(".lp-tour__tabs");
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

  /* ===================== START ===================== */

  renderAll();
})();
