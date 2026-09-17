/* =============================================================
   MINEKUBE STUDIOS // STRÁNKA LAUNCHER — LOGIKA
   Načítá se po app.js, takže používá její překlady (t), toast
   (showToast) i reveal při scrollu (registerRevealElements).
   Texty jsou v i18n.js — tady je jen chování stránky:
   1. detekce platformy a přepínání tlačítka ke stažení,
   2. tlačítka „Stáhnout“ hlásí, že se sestavení teprve připravují,
   3. mock okno launcheru žije — simuluje průběh stahování,
   4. grafy a panely se odhalují při scrollu.
   ============================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ===================== PLATFORMY // DETEKCE A PŘEPÍNÁNÍ ===================== */

  const OS_META = {
    windows: { label: "launcher.os.windows", sub: "launcher.os.sub.windows" },
    macos: { label: "launcher.os.macos", sub: "launcher.os.sub.macos" },
    linux: { label: "launcher.os.linux", sub: "launcher.os.sub.linux" }
  };

  const osChips = [...document.querySelectorAll(".launcher-os-chip")];
  const heroDownload = document.querySelector(".launcher-download-btn[data-launcher-download]");
  const osLabelNode = document.querySelector("[data-os-label]");
  const osSubNode = document.querySelector("[data-os-sub]");
  let announcedOS = false;

  function detectOS() {
    const ua = navigator.userAgent || "";
    if (/Mac|iPhone|iPad/i.test(ua) && !/Linux/i.test(ua)) return "macos";
    if (/Linux|X11|FreeBSD/i.test(ua)) return "linux";
    return "windows";
  }

  function setLauncherOS(os, { notify = false } = {}) {
    if (!OS_META[os]) os = "windows";

    osChips.forEach(chip => {
      const active = chip.dataset.os === os;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });

    if (heroDownload) heroDownload.dataset.os = os;

    const meta = OS_META[os];
    if (osLabelNode) osLabelNode.textContent = t("launcher.download.title").replace("{os}", t(meta.label));
    if (osSubNode) osSubNode.textContent = t(meta.sub);

    if (notify && !announcedOS) {
      announcedOS = true;
      showToast(t("launcher.toast.os").replace("{os}", t(meta.label)), "success", 2600);
    }
  }

  osChips.forEach(chip => {
    chip.addEventListener("click", () => setLauncherOS(chip.dataset.os));
  });

  // Hned na startu nastavíme platformu i podle uloženého jazyka —
  // IntersectionObserver pak jen navíc oznámí rozpoznaný systém toastem.
  setLauncherOS(detectOS());

  // První návštěvník vidí, že jsme si všimli jeho platformy (jen v hero sekci).
  if ("IntersectionObserver" in window && heroDownload && !prefersReducedMotion.matches) {
    const osObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        osObserver.disconnect();
        setLauncherOS(detectOS(), { notify: true });
      });
    }, { threshold: .4 });
    osObserver.observe(heroDownload);
  }

  /* ===================== STAŽENÍ // SESTAVENÍ SE TEPRVE PŘIPRAVUJÍ ===================== */

  document.querySelectorAll("[data-launcher-download]").forEach(button => {
    button.addEventListener("click", () => {
      const os = OS_META[button.dataset.os] ? t(OS_META[button.dataset.os].label) : "";
      const message = os
        ? `${t("launcher.toast.pending")} (${os})`
        : t("launcher.toast.pending");
      showToast(message, "warning", 3800);
    });
  });

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

    let timer = window.setTimeout(tick, 700);
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
    const active = document.querySelector(".launcher-os-chip.is-active") || osChips[0];
    const os = active ? active.dataset.os : "windows";
    setLauncherOS(os);
  });
})();
