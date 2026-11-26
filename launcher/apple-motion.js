/* =============================================================
   MINEKUBE STUDIOS // LAUNCHER — APPLE POHYB, LOGIKA (v1)
   -------------------------------------------------------------
   Provází apple-motion.css. Režim (apple / legacy) vlastní
   launcher.js a nese ho :root[data-motion-mode]; tenhle soubor
   jen rozehraje NOVOU vrstvu, když je režim „apple“, a uklidí ji,
   když uživatel přepne na „legacy“ (původní animace).

   Co dělá:
     1. nástřel hero (is-ap-ready → is-ap-settled),
     2. jediná rAF smyčka pro jemný scroll-parallax produktu a tapety,
     3. reakce na přepnutí režimu a na prefers-reduced-motion.

   Zásady: žádné setInterval, getBoundingClientRect jen pro viditelné
   hero, mimo obrazovku a při redukci pohybu se nic nepočítá.
   ============================================================= */

(function () {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("ap-js");

  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

  const prefersReduced = () => Boolean(motionQuery && motionQuery.matches);
  const mode = () => doc.getAttribute("data-motion-mode") || "apple";
  const appleOn = () => mode() === "apple" && !prefersReduced();
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const hero = document.querySelector(".lpx-hero");
  const backdrop = hero ? hero.querySelector(".lpx-hero__backdrop") : null;

  /* ---------- 1 · Nástřel hero ---------- */

  let settledTimer = 0;

  function playIntro() {
    if (!hero) return;
    /* První snímek nechá prohlížeč aplikovat skrytý stav, druhý
       spustí přechod — bez vynuceného reflow. */
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        hero.classList.add("is-ap-ready");
        window.clearTimeout(settledTimer);
        settledTimer = window.setTimeout(() => hero.classList.add("is-ap-settled"), 1750);
      });
    });
  }

  function resetIntro() {
    if (!hero) return;
    window.clearTimeout(settledTimer);
    hero.classList.remove("is-ap-ready", "is-ap-settled");
    hero.style.removeProperty("--ap-py");
    hero.style.removeProperty("--ap-ps");
    hero.style.removeProperty("--ap-bg-y");
  }

  /* ---------- 2 · Scroll-parallax produktu ---------- */

  let visible = true;
  let ticking = false;

  function paint() {
    ticking = false;
    if (!hero || !appleOn() || !visible) return;
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    if (rect.bottom < -160 || rect.top > vh + 160) return;
    const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    /* Produkt se zvedá o chlup pomaleji než stránka a lehce zmenšuje;
       tapeta naopak klesá — vznikne nenápadná hloubka. */
    hero.style.setProperty("--ap-py", `${(progress * -34).toFixed(2)}px`);
    hero.style.setProperty("--ap-ps", (progress * 0.045).toFixed(4));
    if (backdrop) hero.style.setProperty("--ap-bg-y", `${(progress * 58).toFixed(2)}px`);
  }

  function request() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  }

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });

  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (visible) request();
      },
      { threshold: 0 }
    ).observe(hero);
  }

  /* ---------- 3 · Režim a redukce pohybu ---------- */

  function sync() {
    if (appleOn()) {
      if (hero && !hero.classList.contains("is-ap-ready")) playIntro();
      request();
    } else {
      resetIntro();
    }
  }

  document.addEventListener("minekube:motion-mode", sync);

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", sync);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) request();
  });

  /* Start až po prvním vykreslení (hero už má layout). */
  if (appleOn()) {
    playIntro();
    request();
  }
})();
