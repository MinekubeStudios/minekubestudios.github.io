/* =============================================================
   MINEKUBE STUDIOS // 3D KOSTKA — POHYB A OVLÁDÁNÍ (v1)
   -------------------------------------------------------------
   Bez tohohle souboru je scéna pořád použitelná: panely pilulek
   jsou otevřené a kostka stojí ve výchozím natočení. Skript jen
   přidá interakci:

     1. akordeon pilulek (vždy jedna otevřená, ostatní zavřené),
     2. volby barvy / povrchu / světla (přepisují data-* na scéně),
     3. otáčení kostky — automatické i tažením s dojezdem.

   Zásady: jedna rAF smyčka, která běží jen když je scéna na
   obrazovce a když je co animovat; žádný setInterval; s
   prefers-reduced-motion se samo neotáčí a netlumí se setrvačnost.
   ============================================================= */

(function () {
  "use strict";

  const root = document.querySelector("[data-cube]");
  if (!root) return;

  const object = root.querySelector("[data-cube-object]");
  const dragArea = root.querySelector("[data-cube-drag]");
  const spinInput = root.querySelector("[data-cube-spin]");
  const spinNote = root.querySelector("[data-cube-spin-note]");
  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener: null };

  /* Třída na <html> zapíná zavřené panely v CSS — bez ní (bez JS)
     zůstává celý obsah otevřený a čitelný. */
  document.documentElement.classList.add("cube-js");

  const reduced = () => Boolean(motionQuery && motionQuery.matches);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* ---------- 1 · Akordeon pilulek ---------- */

  const groups = [...root.querySelectorAll("[data-cube-group]")];

  function setGroupOpen(group, open) {
    const button = group.querySelector("[data-cube-toggle]");
    const panel = group.querySelector(".cube-pill__panel");
    group.classList.toggle("is-open", open);
    if (button) button.setAttribute("aria-expanded", String(open));
    if (panel) panel.toggleAttribute("inert", !open);
  }

  if (groups.length) {
    groups.forEach(group => {
      const button = group.querySelector("[data-cube-toggle]");
      if (!button) return;
      button.addEventListener("click", () => {
        const open = !group.classList.contains("is-open");
        groups.forEach(other => setGroupOpen(other, other === group && open));
      });
    });

    groups.forEach((group, index) => setGroupOpen(group, index === 0));
    /* Přechody pustíme až ve chvíli, kdy je výchozí stav sbalený —
       jinak by se panely při načtení viditelně zacvakly. */
    root.classList.add("is-ready");
  }

  /* ---------- 2 · Volby ---------- */

  root.querySelectorAll('input[name="cubeColor"]').forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) root.dataset.color = input.value;
    });
  });

  root.querySelectorAll("[data-cube-choice]").forEach(button => {
    button.addEventListener("click", () => {
      const kind = button.dataset.cubeChoice;
      const value = button.dataset.value;
      if (!kind || !value) return;
      root.dataset[kind] = value;
      root
        .querySelectorAll(`[data-cube-choice="${kind}"]`)
        .forEach(other => other.setAttribute("aria-pressed", String(other === button)));
    });
  });

  /* ---------- 3 · Otáčení ---------- */

  if (!object || !dragArea) return;

  const SPIN_SPEED = 10; // °/s — jedna otáčka za 36 s
  const REST_RX = -16;
  const REST_RY = -32;

  let rx = REST_RX;
  let ry = REST_RY;
  let velocity = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let raf = 0;
  let last = 0;
  let inView = true;

  const spinning = () => Boolean(spinInput && spinInput.checked) && !reduced();

  const paint = () => {
    object.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };

  function frame(now) {
    raf = 0;
    /* WebGL scéna má vlastní smyčku — tahle by jen marnila framy. */
    if (root.classList.contains("is-webgl")) return;
    const delta = last ? Math.min((now - last) / 1000, 0.06) : 0;
    last = now;
    let active = false;

    if (!dragging) {
      if (spinning()) {
        ry += SPIN_SPEED * delta;
        active = true;
      }
      if (Math.abs(velocity) > 1) {
        ry += velocity * delta;
        velocity *= Math.pow(0.08, delta);
        active = true;
      } else {
        velocity = 0;
      }
      if (Math.abs(rx - REST_RX) > 0.2) {
        rx += (REST_RX - rx) * Math.min(1, delta * 5);
        active = true;
      } else {
        rx = REST_RX;
      }
    } else {
      active = true;
    }

    paint();

    if (active && inView && !document.hidden) {
      last = now;
      raf = window.requestAnimationFrame(frame);
    }
  }

  function requestLoop() {
    if (raf || !inView || document.hidden) return;
    last = 0;
    raf = window.requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (!raf) return;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  dragArea.addEventListener("pointerdown", event => {
    /* Když se rozjelo WebGL, otáčí kostkou cube-webgl.js. */
    if (root.classList.contains("is-webgl")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    velocity = 0;
    dragArea.classList.add("is-dragging");
    if (dragArea.setPointerCapture) {
      try {
        dragArea.setPointerCapture(pointerId);
      } catch (error) {
        /* Safari někdy zachycení odmítne — tažení funguje i bez něj. */
      }
    }
    requestLoop();
  });

  dragArea.addEventListener("pointermove", event => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    const now = performance.now();
    const span = Math.max((now - lastMove) / 1000, 0.016);
    lastMove = now;

    ry += dx * 0.42;
    rx = clamp(rx - dy * 0.3, -72, 40);
    velocity = reduced() ? 0 : clamp((dx * 0.42) / span, -600, 600);
    paint();
  });

  function endDrag(event) {
    if (!dragging) return;
    if (event && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    dragArea.classList.remove("is-dragging");
    requestLoop();
  }

  dragArea.addEventListener("pointerup", endDrag);
  dragArea.addEventListener("pointercancel", endDrag);
  dragArea.addEventListener("lostpointercapture", endDrag);

  if (spinInput) {
    spinInput.addEventListener("change", requestLoop);
  }

  /* Smyčka se vypne, když scéna zmizí z obrazovky nebo když je
     stránka na pozadí — na mobilu to šetří baterii. */
  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          inView = entry.isIntersecting;
        });
        if (inView) requestLoop();
        else stopLoop();
      },
      { rootMargin: "120px 0px" }
    );
    watcher.observe(root);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else requestLoop();
  });

  window.addEventListener("pageshow", requestLoop);

  /* ---------- 4 · Redukce pohybu ---------- */

  function syncMotionPreference() {
    const still = reduced();
    if (spinNote) spinNote.hidden = !still;
    if (spinInput) {
      spinInput.disabled = still;
      if (still) spinInput.checked = false;
    }
    root.classList.toggle("is-still", still);
    if (still) stopLoop();
    else requestLoop();
  }

  syncMotionPreference();

  if (motionQuery && typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", syncMotionPreference);
  }

  requestLoop();
})();
