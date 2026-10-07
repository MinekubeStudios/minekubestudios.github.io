/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA LAUNCHER — LOGIKA
   Načítá se po app.js a releases.js, takže používá jejich překlady
   (t), toast (showToast) i data o vydáních z repozitáře.

   Co tahle stránka umí:
     1. detekce platformy návštěvníka a přepínání tlačítka ke stažení,
     2. Windows = živé sestavení → klik stáhne nejnovější vydání
        přímo z GitHub repozitáře MinekubeStudios/MinekubeLauncher,
     3. macOS a Linux = „v plánu“ → klik jen vysvětlí, co se chystá,
     4. stavy tlačítka (zjišťuji / stahuji / hotovo / v plánu / chyba),
     5. mock okno launcheru žije — simuluje průběh stahování,
     6. grafy a panely se odhalují při scrollu.
   ============================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ===================== ZDROJ DAT O VYDÁNÍCH ===================== */

  const REPO_URL = "https://github.com/MinekubeStudios/MinekubeLauncher";

  /* Kdyby se releases.js nenačetl (blokované skripty, offline editor),
     stránka nesmí umřít — poskládáme si stejné rozhraní z poslední
     známé adresy souboru v repozitáři. */
  function createFallbackSource() {
    const files = {
      windows: {
        name: "Minekube Launcher_1.0.0-local_x64-setup.exe",
        version: "1.0.0-local",
        size: 24691528,
        url: "https://github.com/MinekubeStudios/MinekubeLauncher/raw/main/Minekube%20Launcher_1.0.0-local_x64-setup.exe"
      }
    };
    const statuses = { windows: "live", macos: "planned", linux: "planned" };

    return {
      ready: Promise.resolve(),
      status: () => ({ state: "ready", source: "fallback", version: files.windows.version, degraded: true }),
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
      repoUrl: REPO_URL
    };
  }

  const source = window.MinekubeLauncherReleases || createFallbackSource();

  /* ===================== POMOCNÉ ===================== */

  const OS_META = {
    windows: { label: "launcher.os.windows", sub: "launcher.os.sub.windows" },
    macos: { label: "launcher.os.macos", sub: "launcher.os.sub.macos" },
    linux: { label: "launcher.os.linux", sub: "launcher.os.sub.linux" }
  };

  const osName = os => (OS_META[os] ? t(OS_META[os].label) : os);

  function formatSize(bytes) {
    if (typeof source.humanSize === "function") return source.humanSize(bytes);
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return "";
    const value = bytes / (1024 * 1024);
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)} MB`;
  }

  function fileExtension(name) {
    const lower = String(name || "").toLowerCase();
    const compound = lower.match(/\.(?:app\.tar\.gz|tar\.gz|tar\.xz|tar\.zst)$/);
    if (compound) return compound[0];
    const simple = lower.match(/\.[a-z0-9]+$/);
    return simple ? simple[0] : "";
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

  /* ===================== PRVKY NA STRÁNCE ===================== */

  const osChips = [...document.querySelectorAll(".launcher-os-chip")];
  const heroDownload = document.querySelector(".launcher-download-btn[data-launcher-download]");
  const osLabelNode = document.querySelector("[data-os-label]");
  const osSubNode = document.querySelector("[data-os-sub]");
  const versionNodes = [...document.querySelectorAll("[data-launcher-version]")];
  const sourceNodes = [...document.querySelectorAll("[data-launcher-source]")];
  const heroFileRow = document.querySelector('[data-launcher-file="hero"]');
  const heroFileName = heroFileRow?.querySelector("[data-launcher-file-name]") || null;
  const cardFileRows = [...document.querySelectorAll('[data-launcher-file="windows"]')];
  const platformButtons = [...document.querySelectorAll(".launcher-platform-btn[data-launcher-download]")];
  const hintNodes = [...document.querySelectorAll("[data-launcher-hint]")];

  let currentOS = "windows";
  let announcedOS = false;
  let announcedDegraded = false;
  let pendingOSNotice = null;

  const setButtonState = (button, state) => {
    if (button) button.dataset.state = state;
  };

  const everyPlatformButton = os => platformButtons.filter(button => button.dataset.os === os);

  /* ===================== DETEKCE PLATFORMY ===================== */

  function detectOS() {
    const ua = navigator.userAgent || "";
    if (/Mac|iPhone|iPad/i.test(ua) && !/Linux/i.test(ua)) return "macos";
    if (/Linux|X11|FreeBSD/i.test(ua)) return "linux";
    return "windows";
  }

  function initialOS() {
    const detected = detectOS();
    const info = source.platform(detected);

    /* macOS a Linux jsou zatím v plánu — hlavní tlačítko musí zůstat
       použitelné, takže vybereme Windows a návštěvníkovi to řekneme. */
    if (info.planned || !info.available) {
      if (info.planned) pendingOSNotice = detected;
      return "windows";
    }

    return detected;
  }

  /* ===================== VYKRESLENÍ ===================== */

  function renderPlatformChips() {
    osChips.forEach(chip => {
      const os = chip.dataset.os;
      const info = source.platform(os);
      const active = os === currentOS;

      chip.classList.toggle("is-active", active);
      chip.classList.toggle("is-live", !info.planned);
      chip.classList.toggle("is-planned", info.planned);
      chip.setAttribute("aria-pressed", String(active));
      chip.setAttribute(
        "title",
        info.planned ? t("launcher.os.flag.planned") : t("launcher.os.flag.live")
      );
    });
  }

  function renderReleaseInfo() {
    const state = source.status();
    const versionText =
      state.state === "ready" && state.version
        ? `v${state.version}`
        : state.state === "loading"
          ? "…"
          : t("launcher.download.state.error");

    versionNodes.forEach(node => {
      node.textContent = versionText;
    });

    const sourceKey =
      state.source === "releases" ? "launcher.download.source.releases" : "launcher.download.source.repo";
    sourceNodes.forEach(node => {
      const label = node.querySelector("span");
      if (label) label.textContent = t(sourceKey);
      node.hidden = state.state !== "ready";
    });

    // Karta Windows ukazuje vždy svůj soubor.
    const cardDescription = describeAsset(source.asset("windows"));
    cardFileRows.forEach(row => {
      const label = row.querySelector("[data-launcher-file-name]");
      if (label) label.textContent = cardDescription;
      row.hidden = !cardDescription;
    });
  }

  /* Název souboru a velikost do jednoho řádku. */
  function describeAsset(asset) {
    if (!asset || !asset.name) return "";
    const size = formatSize(asset.size);
    return size ? `${asset.name} · ${size}` : asset.name;
  }

  function renderHero() {
    const info = source.platform(currentOS);
    const state = source.status();
    const asset = info.asset;

    if (heroDownload) heroDownload.dataset.os = currentOS;

    if (osLabelNode) {
      osLabelNode.textContent = info.planned
        ? t("launcher.download.title.planned").replace("{os}", osName(currentOS))
        : t("launcher.download.title").replace("{os}", osName(currentOS));
    }

    if (osSubNode) {
      if (info.planned) {
        osSubNode.textContent = t("launcher.os.sub.planned");
      } else if (state.state === "loading") {
        osSubNode.textContent = t("launcher.download.state.loading");
      } else if (state.state === "error" || !asset) {
        osSubNode.textContent = t("launcher.download.state.error");
      } else {
        const parts = [t(OS_META[currentOS].sub)];
        const size = formatSize(asset.size);
        if (size) parts.push(size);
        const extension = fileExtension(asset.name);
        if (extension) parts.push(extension);
        osSubNode.textContent = parts.join(" · ");
      }
    }

    // Řádek v hero sekci sleduje právě vybranou platformu.
    const heroDescription = info.planned ? "" : describeAsset(asset);
    if (heroFileName) heroFileName.textContent = heroDescription;
    if (heroFileRow) heroFileRow.hidden = !heroDescription;

    const nextHeroState = info.planned
      ? "planned"
      : state.state === "loading"
        ? "loading"
        : state.state === "error" || !asset
          ? "error"
          : "idle";

    if (heroDownload && !["downloading", "done"].includes(heroDownload.dataset.state)) {
      setButtonState(heroDownload, nextHeroState);
    }

    hintNodes.forEach(node => {
      node.textContent = [osLabelNode?.textContent, osSubNode?.textContent, heroDescription]
        .filter(Boolean)
        .join(" — ");
    });
  }

  function renderPlatformCards() {
    const state = source.status();
    const asset = source.asset("windows");

    everyPlatformButton("windows").forEach(button => {
      if (["downloading", "done"].includes(button.dataset.state)) return;
      if (state.state === "loading") setButtonState(button, "loading");
      else if (asset) setButtonState(button, "idle");
      else setButtonState(button, "error");
    });

    platformButtons
      .filter(button => source.platform(button.dataset.os).planned)
      .forEach(button => setButtonState(button, "planned"));
  }

  function renderAll() {
    renderPlatformChips();
    renderReleaseInfo();
    renderHero();
    renderPlatformCards();
  }

  function setLauncherOS(os, { notify = false } = {}) {
    currentOS = OS_META[os] ? os : "windows";

    /* Přepnutí zpět na živou platformu ruší dočasné stavy tlačítka. */
    if (heroDownload && ["done"].includes(heroDownload.dataset.state)) setButtonState(heroDownload, "idle");

    renderAll();

    if (notify && !announcedOS) {
      announcedOS = true;
      showToast(t("launcher.toast.os").replace("{os}", osName(currentOS)), "success", 2800);
    }
  }

  /* ===================== STAHUJEME Z GITHUBU ===================== */

  function hintLiveChip() {
    const liveChip = osChips.find(chip => chip.dataset.status === "live");
    if (!liveChip || prefersReducedMotion.matches) return;
    liveChip.classList.add("is-hint");
    window.setTimeout(() => liveChip.classList.remove("is-hint"), 2400);
  }

  function announcePlanned(os) {
    showToast(t("launcher.toast.planned").replace("{os}", osName(os)), "warning", 4800);
    hintLiveChip();
  }

  function runDownload(button, os, file) {
    const targets = [button, ...(os === "windows" ? [heroDownload] : []), ...everyPlatformButton(os)]
      .filter((node, index, list) => node && list.indexOf(node) === index);

    targets.forEach(node => setButtonState(node, "downloading"));
    showToast(t("launcher.toast.start").replace("{file}", file.name), "download", 3800);

    const result = source.download(os) || {};

    const finish = ok => {
      window.setTimeout(
        () => {
          targets.forEach(node => setButtonState(node, ok ? "done" : "error"));

          if (ok) {
            showToast(t("launcher.toast.done").replace("{file}", file.name), "success", 4400);
            window.setTimeout(() => {
              targets.forEach(node => {
                if (node.dataset.state === "done") setButtonState(node, "idle");
              });
            }, 4600);
          } else {
            showToast(t("launcher.toast.error"), "warning", 5200);
          }
        },
        prefersReducedMotion.matches ? 250 : ok ? 1600 : 400
      );
    };

    if (result.ok === false) {
      /* Soubor zmizel pod rukama — zkusíme načíst vydání znovu. */
      refetch().then(() => {
        const fresh = source.asset(os);
        if (fresh && fresh.url) {
          startDownload(fresh);
          finish(true);
        } else {
          finish(false);
          renderAll();
        }
      });
      return;
    }

    finish(true);
  }

  function refetch() {
    const promise = source.refresh ? source.refresh(true) : Promise.resolve();
    return Promise.resolve(promise).catch(() => null);
  }

  function retryThenDownload(button, os) {
    setButtonState(button, "loading");
    if (button === heroDownload || os === "windows") setButtonState(heroDownload, "loading");
    showToast(t("launcher.toast.fetching"), "system", 2800);

    refetch().then(() => {
      renderAll();
      const asset = source.asset(os);
      const info = source.platform(os);

      if (info.planned) {
        announcePlanned(os);
        renderAll();
        return;
      }

      if (asset && asset.url) runDownload(button, os, asset);
      else {
        setButtonState(button, "error");
        if (os === "windows") setButtonState(heroDownload, "error");
        showToast(t("launcher.toast.error"), "warning", 5400);
      }
    });
  }

  function onDownloadClick(button) {
    const os = OS_META[button.dataset.os] ? button.dataset.os : currentOS;
    const info = source.platform(os);

    if (info.planned) {
      announcePlanned(os);
      return;
    }

    if (button.dataset.state === "downloading") return;

    if (!info.available || !info.asset) {
      retryThenDownload(button, os);
      return;
    }

    runDownload(button, os, info.asset);
  }

  document.querySelectorAll("[data-launcher-download]").forEach(button => {
    button.addEventListener("click", () => onDownloadClick(button));
  });

  /* Klik na „v plánu“ v hero sekci navíc přepne výběr na platformu,
     aby bylo vidět, co se chystá. */
  osChips.forEach(chip => {
    chip.addEventListener("click", () => setLauncherOS(chip.dataset.os));
  });

  /* ===================== NAČTENÍ VYDÁNÍ ===================== */

  /* Oznámení o platformě pouštíme, až je hero sekce na obrazovce —
     jinak by toast proběhl, než návštěvník stránku vůbec uvidí. */
  function announceWhenVisible(callback) {
    if (announcedOS || !heroDownload || !("IntersectionObserver" in window)) {
      callback();
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          callback();
        });
      },
      { threshold: .35 }
    );
    observer.observe(heroDownload);
  }

  function announceDetectedOS(detected) {
    if (announcedOS) return;

    announceWhenVisible(() => {
      if (announcedOS) return;
      announcedOS = true;

      if (detected) {
        showToast(t("launcher.toast.os.planned").replace("{os}", osName(detected)), "warning", 5200);
        hintLiveChip();
      } else {
        showToast(t("launcher.toast.os").replace("{os}", osName(currentOS)), "success", 2800);
      }
    });
  }

  document.addEventListener("minekube:launcher-releases", () => {
    renderAll();

    const state = source.status();
    if (state.state === "loading") return;

    if (state.degraded && !announcedDegraded && state.state === "ready") {
      announcedDegraded = true;
      window.setTimeout(() => showToast(t("launcher.toast.degraded"), "warning", 5200), 900);
    }

    if (!announcedOS) {
      const detected = pendingOSNotice;
      pendingOSNotice = null;
      announceDetectedOS(detected || null);
    }
  });

  /* První vykreslení — dokud vydání nepřijdou, tlačítko ukazuje „zjišťuji“. */
  currentOS = initialOS();
  renderAll();

  Promise.resolve(source.ready)
    .then(() => renderAll())
    .catch(() => null);

  /* ===================== MOCK OKNA // ŽIVÝ PRŮBĚH STAHOVÁNÍ ===================== */

  const progressBar = document.querySelector("[data-progress-bar]");
  const progressPct = document.querySelector("[data-progress-pct]");

  function animateLauncherProgress() {
    if (!progressBar || !progressPct) return;

    if (prefersReducedMotion.matches) {
      progressBar.style.setProperty("--progress", "64%");
      progressPct.textContent = "64 %";
      return;
    }

    let value = 12;
    let timer = null;

    const tick = () => {
      value += Math.random() * 7 + 1.5;
      if (value >= 100) {
        value = 100;
        progressBar.style.setProperty("--progress", "100%");
        progressPct.textContent = "100 %";
        // Chvilka „hotovo“ a názorné kolo začne znovu.
        window.setTimeout(() => {
          value = 8;
          if (!prefersReducedMotion.matches) timer = window.setTimeout(tick, 1400);
        }, 2600);
        return;
      }
      progressBar.style.setProperty("--progress", `${Math.round(value)}%`);
      progressPct.textContent = `${Math.round(value)} %`;
      timer = window.setTimeout(tick, 260 + Math.random() * 340);
    };

    timer = window.setTimeout(tick, 700);
  }

  animateLauncherProgress();

  /* ===================== REVEAL // ODHALOVÁNÍ PŘI SCROLLU ===================== */

  if (typeof registerRevealElements === "function") {
    registerRevealElements(document.querySelectorAll(".launcher-features .launcher-feature"), 70);
    registerRevealElements(document.querySelectorAll(".launcher-row"), 90);
    registerRevealElements(document.querySelectorAll(".launcher-platform"), 80);
    registerRevealElements(document.querySelectorAll(".launcher-roadmap .launcher-milestone"), 90);
    registerRevealElements(document.querySelectorAll(".launcher-oss-section .repo-note"), 0);
  }

  /* ===================== JAZYK // PŘEKRESLENÍ DYNAMICKÝCH TEXTŮ ===================== */

  document.addEventListener("minekube:language", () => {
    renderAll();
  });
})();
