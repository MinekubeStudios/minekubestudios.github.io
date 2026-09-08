/* =============================================================
   MINEKUBE STUDIOS // HLAVNÍ STRÁNKA
   O projektu + Studio Minekube.
   Design systém, animace a interakce odpovídají původnímu webu.
   ============================================================= */

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

/* ===================== TOAST ===================== */

const toast = document.getElementById("toast");
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

/* ===================== MODAL (informační okna patičky) ===================== */

const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
let modalCloseTimer = null;
let lastModalTrigger = null;

function openInfoModal(type) {
  const content = {
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

modalClose.addEventListener("click", () => closeModal({ animateCloseButton: true }));
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});
modalContent.addEventListener("click", event => {
  if (event.target.closest("[data-close-modal]")) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});
document.querySelectorAll("[data-dialog]").forEach(button => {
  button.addEventListener("click", () => openInfoModal(button.dataset.dialog));
});

/* ===================== MOBILE MENU ===================== */

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

/* ===================== MOTIV (TMAVÝ / SVĚTLÝ) ===================== */

const themeToggle = document.getElementById("themeToggle");
const savedTheme = safeStorage.get("minekube-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = current;
  safeStorage.set("minekube-theme", current);
  showToast(current === "light" ? "Zapnut světlý motiv." : "Zapnut tmavý motiv.", "theme");
});

/* ===================== SCROLL — progress, hlavička, reveal, portál ===================== */

const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scrollProgress span");
let scrollFramePending = false;

function syncScrollExperience() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

  siteHeader?.classList.toggle("scrolled", window.scrollY > 16);
  scrollProgress?.style.setProperty("--scroll-progress", progress.toFixed(4));

  scrollFramePending = false;
}

window.addEventListener("scroll", () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(syncScrollExperience);
}, { passive: true });

window.addEventListener("resize", syncScrollExperience, { passive: true });

let revealObserver = null;

function registerRevealElements(elements, baseDelay = 65) {
  const list = [...elements].filter(element => !element.classList.contains("scroll-reveal"));
  if (!list.length) return;

  list.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 6) * baseDelay}ms`);

    if (element.matches(".about-copy, .studio-copy")) {
      element.style.setProperty("--reveal-x", "-28px");
      element.style.setProperty("--reveal-y", "0px");
    } else if (element.matches(".about-emblem, .studio-emblem")) {
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
    [document.querySelectorAll(".section-heading"), 0],
    [document.querySelectorAll(".about-copy, .about-emblem"), 110],
    [document.querySelectorAll(".steps-grid .step-card"), 105],
    [document.querySelectorAll(".studio-copy, .studio-emblem"), 110],
    [document.querySelectorAll(".studio-pillars .studio-pillar"), 90],
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
    ["#projekt", { title: "O PROJEKTU", status: "Otevírání Minekube manifestu", code: "MK-02", accent: "#df55ff", rgb: "223,85,255" }],
    ["#studio", { title: "STUDIO MINEKUBE", status: "Propojování Minekube Studios", code: "MK-03", accent: "#72f4ff", rgb: "114,244,255" }]
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

/* ===================== POVRCHOVÉ INTERAKCE — 3D tilt karet ===================== */

function initializeSurfaceInteractions() {
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

  document.querySelectorAll(".step-card, .studio-pillar").forEach(card => {
    card.addEventListener("pointermove", event => applyTilt(card, event, 4));
    card.addEventListener("pointerleave", () => resetTilt(card));
  });

  const aboutCard = document.querySelector(".about-card");
  aboutCard?.addEventListener("pointermove", event => applyTilt(aboutCard, event, 2.5));
  aboutCard?.addEventListener("pointerleave", () => resetTilt(aboutCard));

  const studioCard = document.querySelector(".studio-card");
  studioCard?.addEventListener("pointermove", event => applyTilt(studioCard, event, 2.5));
  studioCard?.addEventListener("pointerleave", () => resetTilt(studioCard));
}

/* ===================== STUDIO — tlačítko "Brzy" ===================== */

document.querySelectorAll("[data-soon]").forEach(button => {
  button.addEventListener("click", () => {
    showToast("Komunitní server právě připravujeme — brzy.", "warning", 3200);
  });
});

/* ===================== INICIALIZACE ===================== */

document.getElementById("currentYear").textContent = new Date().getFullYear();

initializeSurfaceInteractions();
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
    if (value < 48) return "Propojuji projekt a studio...";
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
