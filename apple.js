/* =============================================================
   MINEKUBE STUDIOS // APPLE VRSTVA — POHYB (v1)
   -------------------------------------------------------------
   Načítá se po app.js a design-plus.js na všech třech stránkách.
   Umí jen tři věci a dělá je levně:

     1. odhalování nových bloků (data-ap-reveal) přes IntersectionObserver,
     2. scroll-driven scénu (data-ap-scene): lepivý produkt + kroky,
     3. „usazení“ produktu v hero (data-ap-scale).

   Zásady:
     · jedna rAF smyčka, nikdy setInterval,
     · getBoundingClientRect jen pro sekce, které jsou na obrazovce,
     · s prefers-reduced-motion se nic neanimuje, ale obsah je vždy vidět.
   ============================================================= */

(function () {
  "use strict";

  const doc = document.documentElement;
  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

  const prefersReduced = () => Boolean(motionQuery && motionQuery.matches);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  doc.classList.add("ap-js");

  /* ---------- 1 · Odhalování ---------- */

  const revealNodes = [...document.querySelectorAll("[data-ap-reveal]")];

  function revealAll() {
    revealNodes.forEach(node => node.classList.add("is-in"));
  }

  if (revealNodes.length) {
    if (prefersReduced() || !("IntersectionObserver" in window)) {
      revealAll();
    } else {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
      );
      revealNodes.forEach((node, index) => {
        if (!node.style.getPropertyValue("--ap-delay")) {
          node.style.setProperty("--ap-delay", `${Math.min(index, 4) * 70}ms`);
        }
        observer.observe(node);
      });
    }
  }

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", event => {
      if (event.matches) revealAll();
    });
  }

  /* ---------- 2 + 3 · Scéna a hero produkt ---------- */

  const scenes = [...document.querySelectorAll("[data-ap-scene]")];
  const scalers = [...document.querySelectorAll("[data-ap-scale]")];
  if (!scenes.length && !scalers.length) return;

  const visible = new Set();
  let ticking = false;
  let frame = 0;

  function paintScene(scene) {
    const steps = [...scene.querySelectorAll(".ap-step")];
    if (!steps.length) return;

    const anchor = (window.innerHeight || 800) * 0.42;
    let index = 0;
    steps.forEach((step, position) => {
      if (step.getBoundingClientRect().top <= anchor) index = position;
    });

    const current = scene.dataset.step;
    if (current !== String(index)) {
      scene.dataset.step = String(index);
      steps.forEach((step, position) => step.classList.toggle("is-active", position === index));
    }
  }

  /* Velmi jemné „usazení“ produktu: 98 % → 100 % a 92 % → 100 % krytí.
     Víc by na první obrazovce vypadalo jako rozbité načítání. */
  function paintScalers() {
    if (prefersReduced()) return;
    const viewport = window.innerHeight || 800;
    scalers.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > viewport + 120) return;
      const progress = clamp((viewport * 0.86 - rect.top) / (viewport * 0.6), 0, 1);
      element.style.setProperty("--ap-scale", (0.98 + progress * 0.02).toFixed(3));
      element.style.setProperty("--ap-fade", (0.92 + progress * 0.08).toFixed(3));
    });
  }

  function update() {
    ticking = false;
    visible.forEach(paintScene);
    if (scalers.length) paintScalers();
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    frame = window.requestAnimationFrame(update);
  }

  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        schedule();
      },
      { rootMargin: "200px 0px" }
    );
    scenes.forEach(scene => watcher.observe(scene));
  } else {
    scenes.forEach(scene => visible.add(scene));
  }

  scalers.forEach(element => {
    element.style.setProperty("--ap-scale", "1");
    element.style.setProperty("--ap-fade", "1");
  });

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("pageshow", schedule);

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", event => {
      if (event.matches) {
        scenes.forEach(scene => {
          scene.querySelectorAll(".ap-step").forEach(step => step.classList.add("is-active"));
        });
        scalers.forEach(element => {
          element.style.setProperty("--ap-scale", "1");
          element.style.setProperty("--ap-fade", "1");
        });
        window.cancelAnimationFrame(frame);
        return;
      }
      /* Uživatel animace znovu zapnul — vrať kroky do rukou scrollu. */
      scenes.forEach(scene => {
        const index = Number(scene.dataset.step || 0);
        scene.querySelectorAll(".ap-step").forEach((step, position) => {
          step.classList.toggle("is-active", position === index);
        });
      });
      schedule();
    });
  }

  if (document.readyState !== "complete") {
    window.addEventListener("load", schedule, { once: true });
  }

  paintScalers();
  schedule();
})();
