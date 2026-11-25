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
     3. ukáže Linux jako „v plánu“ a nic nestahuje,
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

  const reducedDataQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-data: reduce)")
      : { matches: false };
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  const prefersReduced = () => Boolean(motionQuery && motionQuery.matches);
  const effectsDefault = () => !prefersReduced() && !reducedDataQuery.matches && !saveData;

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
    const files = { windows, linux: null };
    const statuses = { windows: "live", linux: "planned" };

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

  /* Clipboard API nefunguje v každém kontextu (http, zastaralý prohlížeč,
     zamítnuté oprávnění). Proto zůstává fallback přes dočasný textarea. */
  async function copyText(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* zkusíme fallback */
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "-9999px";
      area.style.opacity = "0";
      area.style.pointerEvents = "none";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      return copied;
    } catch {
      return false;
    }
  }

  function describeAsset(asset) {
    if (!asset || !asset.name) return "";
    const size = formatSize(asset.size);
    return size ? `${asset.name} · ${size}` : asset.name;
  }

  /* ===================== PRVKY NA STRÁNCE ===================== */

  const heroButton = document.querySelector(".lp-hero [data-launcher-download]");
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
  const releaseLinks = [...document.querySelectorAll("[data-launcher-release]")];
  const checkedNode = document.querySelector("[data-launcher-checked]");
  const copyButtons = [...document.querySelectorAll("[data-launcher-copy]")];
  const refreshButton = document.querySelector("[data-launcher-refresh]");

  let startedAt = 0;
  let announcedFallback = false;
  let announcedVisitorOS = false;
  /* Hlavní tlačítko míří vždy na Windows — to je jediné vydané sestavení.
     Systém návštěvníka používáme jen pro upozornění, aby věděl, že jeho
     build teprve vzniká (a tlačítko mu přesto funguje). */
  const visitorOS = detectOS();
  let currentOS = "windows";

  const setState = (node, state) => {
    if (node && node.dataset.state !== state) node.dataset.state = state;
  };

  /* ===================== DETEKCE PLATFORMY ===================== */

  function detectOS() {
    const ua = navigator.userAgent || "";
    /* Launcher vychází pro Windows a Linux. Návštěvníka z jiné platformy
       (macOS, iOS) bereme jako Windows — tlačítko musí zůstat použitelné,
       i když si jeho systém instalátor nespustí. */
    if (/Android/i.test(ua)) return "linux";
    if (/Linux|X11|FreeBSD/i.test(ua) && !/Android/i.test(ua)) return "linux";
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
      copyButtons.forEach(button => {
        button.disabled = !short;
      });
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
    if (startedAt) {
      return translate("lp.dl.label.again", "Download again");
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
      const file = heroDescription || "";
      const visitorInfo = source.platform(visitorOS);
      const plannedHint =
        visitorInfo && visitorInfo.planned && visitorOS !== currentOS
          ? translate("lp.hint.planned", "{os} is planned — only the Windows build is available for now.")
              .replace("{os}", platformName(visitorOS))
          : "";
      hintNode.textContent = [label, sub, plannedHint].filter(Boolean).join(" — ") + (file ? `. ${file}` : "");
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

  function relativeTime(timestamp) {
    if (!timestamp) return "";
    const delta = Math.max(0, Date.now() - timestamp);
    if (delta < 45000) return translate("lp.dl.checked.now", "just now");
    const lang = document.documentElement.lang || "cs";
    try {
      const formatter = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
      const minutes = Math.round(delta / 60000);
      if (minutes < 60) return formatter.format(-minutes, "minute");
      const hours = Math.round(minutes / 60);
      if (hours < 24) return formatter.format(-hours, "hour");
      return formatter.format(-Math.round(hours / 24), "day");
    } catch {
      return new Date(timestamp).toLocaleString(lang);
    }
  }

  function renderReleaseMeta(status) {
    releaseLinks.forEach(link => {
      if (status.state === "ready" && status.releaseUrl) link.href = status.releaseUrl;
    });

    if (!checkedNode) return;
    /* U záložní adresy jsme nic neověřovali — čas by lhal. */
    const verified = status.state === "ready" && status.source !== "fallback";
    const relative = verified && status.fetchedAt ? relativeTime(status.fetchedAt) : "";
    checkedNode.textContent = relative
      ? translate("lp.dl.checked", "Checked {time}").replace("{time}", relative)
      : "";
    checkedNode.hidden = !relative;
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
    renderReleaseMeta(status);
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

  /* ---------- Pulz stahovacího tlačítka ----------

     Jeden plynulý nádech a výdech: tlačítko se měkce rozepne přes
     vlastnost scale (1 → 1,045 → 1) a přes něj přejede pruh světla.
     Trvá 1,15 s a běží VŽDY — je to odezva na akci, ne dekorace,
     takže ji vypínač efektů ani uložený stav „off" nevypíná.
     Jen prefers-reduced-motion pulz zklidní na prosté prosvětlení
     (řeší CSS v 24b-1).

     Opakované kliknutí pulz restartuje. Bez vynucení reflow by
     prohlížeč animaci podruhé nepřehrál. */

  /* ---------- Pulz: rázová exploze ----------

     Dvě složky, obě napsané pro tenhle konkrétní tlačítkový design:

     1. Vnitřní — tlačítko rozehraje svoje vlastní energetické vrstvy
        (svatozář, rám, povrch, plasma, sweep, pulsní linku, ikonu
        s oběžnicí a šipkou). Řídí to CSS přes .is-pulse.

     2. Vnější — nad tlačítkem vylétne .lp-pulse-burst:
        position: fixed, z-index 10050, tedy mimo tlačítko. Proto
        ji neoreže ani filter, ani overflow tlačítka. Vrstva drží
        prstence, jiskry a fragmenty, které roznáší barvy tlačítka
        (oranžová → zelená → fialová) do okolí.

     Délka je 1,28 s podle nejdelší vnitřní animace
     (downloadButtonImpactV2). Třída zůstane o kousek déle, aby se
     dojezd neuřízl, a pak se uklidí i explozivní vrstva. */

  const PULSE_MS = 1280;
  const BURST_MS = 1500;
  const pulseTimers = new WeakMap();

  function buildBurst(button) {
    const burst = document.createElement("div");
    burst.className = "lp-pulse-burst";
    burst.setAttribute("aria-hidden", "true");

    /* Střed výbuchu = střed tlačítka. Vrstva je fixed, takže
       souřadnice jsou viewportové, ne dokumentové. */
    const rect = button.getBoundingClientRect();
    burst.style.left = rect.left + rect.width / 2 + "px";
    burst.style.top = rect.top + rect.height / 2 + "px";

    /* Rám výbuchu má stejný tvar jako tlačítko, takže potřebuje
       jeho přesné rozměry. Načítají se z tlačítka, ne z konstant —
       kdyby se tlačítko někdy roztáhlo, pulz se roztáhne s ním. */
    burst.style.setProperty("--burst-w", rect.width + "px");
    burst.style.setProperty("--burst-h", rect.height + "px");

    return burst;
  }

  function playDownloadAnimation(button) {
    if (!button) return;

    button.classList.remove("is-pulse");
    /* Vynutí restart animace, aniž by cokoli měřilo layout. */
    void button.offsetWidth;
    button.classList.add("is-pulse");

    /* Předchozí vrstvu uklidit — jinak by ve stránce zůstala viset. */
    const previous = document.body.querySelector(
      ":scope > .lp-pulse-burst"
    );
    if (previous) previous.remove();

    document.body.appendChild(buildBurst(button));

    /* Předchozí timery zrušit — jinak by druhý klik nechal
       doběhnout úklid z toho prvního a třída by zmizela uprostřed. */
    const pending = pulseTimers.get(button);
    if (pending) pending.forEach(window.clearTimeout);

    pulseTimers.set(button, [
      window.setTimeout(() => button.classList.remove("is-pulse"), PULSE_MS + 60),
      window.setTimeout(() => {
        const burst = document.body.querySelector(
          ":scope > .lp-pulse-burst"
        );
        if (burst) burst.remove();
      }, BURST_MS)
    ]);
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

    /* Odezva patří sem: plánovaná platforma ani rozběhnuté načítání
       pulz nedostanou, skutečné stažení ano. */
    playDownloadAnimation(button);

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

  /* Ruční „zkontrolovat znovu“ přímo u nadpisu sekce — obchází 5minutovou
     cache, aby se nové vydání objevilo hned. */
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      if (refreshButton.disabled) return;
      refreshButton.disabled = true;
      refreshButton.classList.add("is-busy");
      refreshButton.setAttribute("aria-busy", "true");
      announce(translate("lp.toast.fetching", "Loading the release again…"), "system", 2400);

      await refetch();
      renderAll();

      const status = source.status();
      refreshButton.classList.remove("is-busy");
      refreshButton.removeAttribute("aria-busy");
      refreshButton.disabled = false;

      if (status.state === "ready") {
        announce(
          translate("lp.toast.refreshed", "Checked. Latest release: v{version}").replace("{version}", status.version || "—"),
          "success",
          3600
        );
      } else {
        announce(translate("lp.toast.retryFailed", "The release still will not load."), "warning", 4800);
      }
    });
  }

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

  /* Návštěvník z Linuxu: hlavní tlačítko musí zůstat použitelné, takže
     mu jednou slušně řekneme, že sestavení je zatím v plánu. */
  function announceVisitorOS() {
    if (announcedVisitorOS) return;
    announcedVisitorOS = true;
    const detected = visitorOS;
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

    /* Pojistka: IntersectionObserver při rychlém skoku (kotva, obnovení
       pozice, hledání v prohlížeči) občas snímek přeskočí a prvek zůstane
       neviditelný. Po scrollu proto doběhne i přímá kontrola pozic. */
    let revealPending = false;
    const catchUp = () => {
      if (revealPending) return;
      revealPending = true;
      setTimeout(() => {
        revealPending = false;
        const limit = innerHeight * 0.92;
        revealNodes.forEach(node => {
          if (node.classList.contains("is-in")) return;
          const rect = node.getBoundingClientRect();
          /* Odhalit, co je ve viewportu, ale i co už uživatel přejel
             (rychlý skok na konec stránky observer občas mine). */
          if (rect.top < limit) {
            node.classList.add("is-in");
            revealObserver.unobserve(node);
          }
        });
      }, 120);
    };
    addEventListener("scroll", catchUp, { passive: true });
    addEventListener("resize", catchUp, { passive: true });
    addEventListener("load", catchUp, { once: true });
    catchUp();
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

  const fxOn = () => !prefersReduced() && !document.hidden && pageRoot?.getAttribute("data-fx-state") !== "off";

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
    const canvas = document.querySelector("canvas[data-fx]");
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
      if (pageRoot) pageRoot.setAttribute("data-fx-state", on ? "on" : "off");
      button.setAttribute("aria-pressed", String(on));
      document.querySelectorAll("canvas[data-fx], canvas[data-dust]").forEach(canvas => {
        canvas.classList.toggle("is-active", on);
      });
      if (persist) {
        try {
          localStorage.setItem(FX_KEY, on ? "on" : "off");
        } catch {
          /* soukromý režim — jen si to nepamatujeme */
        }
      }
      if (on) painter.wake();
    };

    let on = effectsDefault();
    try {
      const saved = localStorage.getItem(FX_KEY);
      if (saved === "off") on = false;
      if (saved === "on" && !prefersReduced()) on = true;
    } catch {
      /* ignorujeme */
    }

    apply(on, false);
    button.disabled = false;

    button.addEventListener("click", () => {
      apply(button.getAttribute("aria-pressed") !== "true", true);
    });

    const syncMotion = () => {
      if (prefersReduced()) apply(false, false);
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

  /* ---------- Magnet a náklon stahovacích tlačítek ---------- */

  /* Stejné chování jako u „Stáhnout Modpack“: tlačítko se naklápí podle
     kurzoru a jeho aura sleduje ukazatel. Čistě vizuální, bez dopadu na
     přístupnost — při redukci pohybu nebo dotyku se nic neděje. */
  function initDownloadButtons() {
    const buttons = [...document.querySelectorAll(".download-ultimate")];
    if (!buttons.length) return;

    const reset = button => {
      button.classList.remove("is-pointer-active");
      button.style.setProperty("--tilt-x", "0deg");
      button.style.setProperty("--tilt-y", "0deg");
      button.style.setProperty("--magnet-x", "0px");
      button.style.setProperty("--magnet-y", "0px");
    };

    buttons.forEach(button => {
      button.addEventListener(
        "pointermove",
        event => {
          if (prefersReduced() || !finePointer.matches) return;
          const rect = button.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          button.classList.add("is-pointer-active");
          button.style.setProperty("--pointer-x", `${x * 100}%`);
          button.style.setProperty("--pointer-y", `${y * 100}%`);
          button.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
          button.style.setProperty("--tilt-x", `${(y - 0.5) * -8}deg`);
          button.style.setProperty("--magnet-x", `${(x - 0.5) * 6}px`);
          button.style.setProperty("--magnet-y", `${(y - 0.5) * 6}px`);
        },
        { passive: true }
      );

      button.addEventListener("pointerleave", () => reset(button));
      button.addEventListener("blur", () => reset(button));
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
      if (activeIndex === -1 && tops.length) activeIndex = 0;
      const list = nav?.querySelector(".lp-nav__list");
      targets.forEach(({ link }, index) => {
        const active = index === activeIndex;
        const wasActive = link.classList.contains("is-active");
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");

        /* Na úzkém displeji se seznam posouvá — aktivní položka musí být
           celá vidět. Posouváme jen samotný seznam, ne stránku. */
        if (active && !wasActive && list && list.scrollWidth > list.clientWidth + 4) {
          const pad = 14;
          const start = link.offsetLeft;
          const end = start + link.offsetWidth;
          let left = list.scrollLeft;
          if (start - pad < left) left = start - pad;
          else if (end + pad > left + list.clientWidth) left = end + pad - list.clientWidth;
          if (left !== list.scrollLeft) {
            try {
              list.scrollTo({ left: Math.max(0, left), behavior: prefersReduced() ? "auto" : "smooth" });
            } catch {
              list.scrollLeft = Math.max(0, left);
            }
          }
        }
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

  /* ---------- FAQ akordeon ----------
     Základ je nativní <details name="lp-faq">, takže akordeon funguje
     i bez JavaScriptu (a čtečky znají jeho stav samy). Tady jen doplníme
     výhradní otevírání pro prohlížeče bez podpory atributu `name`. */

  function initFaq() {
    const items = [...document.querySelectorAll(".lp-faq__item")];
    if (!items.length) return;
    if ("name" in HTMLDetailsElement.prototype) return;

    items.forEach(item => {
      const summary = item.querySelector("summary");
      if (!summary) return;
      summary.addEventListener("click", event => {
        if (item.open) return; // zavírání necháme na prohlížeči
        event.preventDefault();
        items.forEach(other => {
          if (other !== item) other.open = false;
        });
        item.open = true;
      });
    });
  }

  /* ---------- Kopírování SHA-256 otisku ---------- */

  function initCopyChecksum() {
    let resetTimer = 0;

    const reset = () => {
      window.clearTimeout(resetTimer);
      copyButtons.forEach(button => {
        button.classList.remove("is-copied");
        button.querySelector("span")?.replaceChildren(document.createTextNode(translate("lp.dl.copy", "Copy")));
      });
    };

    copyButtons.forEach(button => {
      button.addEventListener("click", async () => {
        /* Celý otisk bereme z dat, ne z okrájeného textu v UI. */
        const digest = source.asset("windows")?.digest || "";
        if (!digest) {
          announce(translate("lp.dl.hash.missing", "No checksum is available yet."), "warning", 3600);
          return;
        }
        const copied = await copyText(digest);
        if (!copied) {
          announce(translate("lp.dl.hash.failed", "The checksum could not be copied."), "warning", 4200);
          return;
        }
        window.clearTimeout(resetTimer);
        button.classList.add("is-copied");
        button.querySelector("span")?.replaceChildren(document.createTextNode(translate("lp.dl.copied", "Copied")));
        announce(translate("lp.dl.hash.copied", "SHA-256 checksum copied to the clipboard."), "success", 3200);
        resetTimer = window.setTimeout(reset, 2200);
      });
    });

    /* Přepnutí jazyka uprostřed kopírování nesmí nechat v tlačítku cizí text. */
    document.addEventListener("minekube:language", reset);
  }

  /* ---------- Skip link: zvýraznění a čistý fokus ---------- */

  function initSkipLink() {
    const link = document.querySelector(".lp-skip");
    const scrim = document.getElementById("lpSkipScrim");
    const target = document.getElementById("top");
    if (!link || !target) return;

    const on = () => scrim?.classList.add("is-on");
    const off = () => scrim?.classList.remove("is-on");

    link.addEventListener("focus", on);
    link.addEventListener("blur", off);
    link.addEventListener("click", () => {
      off();
      /* Fokus přesuneme na obsah, aby klávesnice pokračovala tam,
         a to bez skoku stránkou — na začátku už jsme. */
      window.requestAnimationFrame(() => {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- Pauza efektů na pozadí ---------- */

  /* ---------- Klid dekorací mimo obrazovku ----------

     Hvězdy a jiskry tlačítka Stáhnout jsou hezké jen tehdy, když je
     tlačítko vidět. Když se odscrolluje pryč, nastavíme atribut, na
     který CSS váže animation-play-state: paused (sekce 24b-1b).
     Šetří to práci grafické karty na dlouhé stránce a nemění vzhled.
     Pulz to neovlivní — ten startuje klikem na viditelné tlačítko. */

  function initDownloadIdlePause() {
    if (!("IntersectionObserver" in window)) return;

    const buttons = document.querySelectorAll(".lp-dlbtn");
    if (!buttons.length) return;

    const watcher = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          entry.target.dataset.idlePaused = entry.isIntersecting ? "false" : "true";
        });
      },
      { rootMargin: "80px" }
    );

    buttons.forEach(button => watcher.observe(button));
  }

  function initVisibilityPause() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) painter.wake();
    });
  }

  /* ===================== MINECRAFT-LIKE VRSTVA (v11) =====================
     Parallax hero, přepínač animací, přepínání Platformy/Funkce
     a carousel. Všechno respektuje reduced motion i tlačítko Efekty. */

  function initMcParallax() {
    const hero = document.querySelector("[data-mc-hero]");
    const scene = document.querySelector("[data-mc-scene]");
    if (!hero || !scene || prefersReduced()) return;

    const layers = [...scene.querySelectorAll("[data-mc-depth]")].map(node => ({
      node,
      depth: parseFloat(node.dataset.mcDepth) || 0
    }));
    if (!layers.length) return;

    let ticking = false;
    let visible = true;

    /* Vrstvy držíme v kompozitoru jen po dobu, kdy je hero vidět
       (will-change: transform v CSS). Mimo obrazovku je pustíme. */
    const promote = on => scene.classList.toggle("is-moving", on);

    const paint = () => {
      ticking = false;
      if (!visible || !fxOn()) {
        promote(false);
        return;
      }
      const rect = hero.getBoundingClientRect();
      // Posun jen dokud je hero na obrazovce — mimo ni nic nepočítáme.
      if (rect.bottom < -120 || rect.top > innerHeight + 120) {
        promote(false);
        return;
      }
      promote(true);
      const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
      layers.forEach(({ node, depth }) => {
        node.style.transform = `translate3d(0, ${(progress * depth * 260).toFixed(2)}px, 0)`;
      });
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    };

    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (visible) request();
        else promote(false);
      }, { threshold: 0 }).observe(hero);
    }
    request();
  }

  function initMcMotionToggle() {
    const button = document.querySelector("[data-mc-motion]");
    const label = button?.querySelector("[data-mc-motion-label]");
    if (!button) return;

    const sync = () => {
      const on = !prefersReduced() && document.querySelector(".launcher-page")?.getAttribute("data-fx-state") !== "off";
      button.setAttribute("aria-pressed", String(on));
      if (label) {
        label.textContent = translate(on ? "lp.mc.motion.on" : "lp.mc.motion.off", on ? "Animace zapnuté" : "Animace vypnuté");
      }
    };

    button.addEventListener("click", () => {
      const fxToggle = document.querySelector("[data-fx-toggle]");
      if (fxToggle) fxToggle.click();
      sync();
    });

    document.addEventListener("minekube:language", sync);
    sync();
  }

  function initMcSwitch() {
    const root = document.querySelector("[data-mc-switch]");
    if (!root) return;
    const tabs = [...root.querySelectorAll("[data-mc-switch-btn]")];
    const panes = [...document.querySelectorAll("[data-mc-pane]")];
    if (!tabs.length || !panes.length) return;

    const select = (tab, { focus = false } = {}) => {
      const target = tab.getAttribute("aria-controls");
      tabs.forEach(item => {
        const active = item === tab;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panes.forEach(pane => { pane.hidden = pane.id !== target; });
      if (focus) tab.focus({ preventScroll: true });
    };

    tabs.forEach(tab => tab.addEventListener("click", () => select(tab)));
    root.addEventListener("keydown", event => {
      const index = tabs.indexOf(document.activeElement);
      if (index === -1) return;
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(tabs[next], { focus: true });
    });
  }

  function initMcCarousel() {
    const root = document.querySelector("[data-mc-carousel]");
    if (!root) return;
    const track = root.querySelector("[data-mc-track]");
    const prev = root.querySelector("[data-mc-prev]");
    const next = root.querySelector("[data-mc-next]");
    if (!track) return;

    const step = () => {
      const slide = track.querySelector(".lp-mc-slide");
      if (!slide) return track.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slide.getBoundingClientRect().width + gap;
    };

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 1;
      if (prev) prev.disabled = track.scrollLeft <= 1;
      if (next) next.disabled = track.scrollLeft >= max;
    };

    const scrollBy = dir => {
      track.scrollBy({ left: dir * step(), behavior: prefersReduced() ? "auto" : "smooth" });
    };

    prev?.addEventListener("click", () => scrollBy(-1));
    next?.addEventListener("click", () => scrollBy(1));

    track.addEventListener("keydown", event => {
      if (event.key === "ArrowRight") { event.preventDefault(); scrollBy(1); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); scrollBy(-1); }
    });

    // Kolečko myši posouvá carousel jen dokud se dá, pak pustí stránku.
    track.addEventListener("wheel", event => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      const atStart = track.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = track.scrollLeft >= max - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    }, { passive: false });

    track.addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync, { passive: true });
    sync();
  }

  function initMcDig() {
    document.querySelectorAll("[data-mc-dig]").forEach(button => {
      button.addEventListener("click", () => {
        const target = document.querySelector("[data-mc-hero]")?.nextElementSibling;
        if (!target) return;
        const reduce = prefersReduced();
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    });
  }

  initFxToggle();
  initDownloadButtons();
  initRipples();
  initDust();
  initSparkles();
  initTilt();
  initMarquee();
  initSmoothScroll();
  initScrollUi();
  initFaq();
  initCopyChecksum();
  initSkipLink();
  initVisibilityPause();
  initDownloadIdlePause();
  initMcParallax();
  initMcMotionToggle();
  initMcSwitch();
  initMcCarousel();
  initMcDig();


  /* ===================== START ===================== */

  renderAll();
})();
