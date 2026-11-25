/* =========================================================
   MINEKUBE // DESIGN PLUS V1 — chování
   =========================================================
   Vrstva hravosti nad stávajícím app.js. Vše je:
   - progresivní (bez JS se web chová přesně jako dřív),
   - respektující prefers-reduced-motion,
   - nesahající do existujících tříd — jen doplňující vlastní.

   Scény a triky:
     1) Pozadová scéna — aurora, dvě vrstvy hvězd, mlha + parallax
     2) Padající hvězdičky (jen když je záložka vidět)
     3) Hero: postupné vysunutí slov titulu (po doběhnutí vrátí čistý text)
     4) Count-up statistik v HUD dlaždicích
     5) Magnetická tlačítka + světlo sledující kurzor v hero
     6) Emoji vodoznaky do karet principů a pilířů
     7) Jiskry a konfety při kliknutí na CTA / brand
     8) Běžící linka s emoji před CTA kartou
     9) Tlačítko „zpět nahoru“ + kometická tečka u scroll progress
    10) Reveal drobných seznamů, které app.js neregistruje
    11) Konami kód → večírkový režim 🎉
   ========================================================= */

(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(pointer: fine)");
  var partyOn = false;
  var hasWAAPI = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

  root.classList.add("mk-plus-js");

  function motionOk() { return !prefersReducedMotion.matches; }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

  function normalizeSpaces(text) { return text.replace(/\s+/g, " ").trim(); }

  /* Deterministický generátor hvězd, aby scéna „neskočila" při každém renderu. */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* =========================================================
     1) POZADOBOVÁ SCÉNA
     ========================================================= */

  var scene = null;

  function buildScene() {
    if (!motionOk() || document.querySelector(".mk-plus-scene")) return;

    scene = document.createElement("div");
    scene.className = "mk-plus-scene";
    scene.setAttribute("aria-hidden", "true");

    var far = document.createElement("div");
    far.className = "mk-plus-layer mk-plus-layer--far";
    var mid = document.createElement("div");
    mid.className = "mk-plus-layer mk-plus-layer--mid";
    var near = document.createElement("div");
    near.className = "mk-plus-layer mk-plus-layer--near";

    /* Aurora */
    [["a", .5], ["b", .55], ["c", .42]].forEach(function (blob) {
      var el = document.createElement("div");
      el.className = "mk-plus-blob mk-plus-blob--" + blob[0];
      el.style.opacity = String(blob[1]);
      el.appendChild(document.createElement("i"));
      mid.appendChild(el);
    });

    /* Hvězdy — dvě vrstvy jako box-shadow jednoho elementu (levné na render) */
    var rand = mulberry32(0x4D4B21);
    ["near", "far"].forEach(function (kind) {
      var stars = document.createElement("div");
      stars.className = "mk-plus-stars mk-plus-stars--" + kind;
      var count = kind === "near" ? 64 : 88;
      var palette = [
        "rgba(255,246,224,1)",
        "rgba(255,224,160,1)",
        "rgba(216,178,255,1)",
        "rgba(255,255,255,1)"
      ];
      var shadows = [];
      for (var i = 0; i < count; i += 1) {
        /* Vrstva je vsazená -8% přes hranice viewportu — hvězdy pokrývají celou plochu */
        var x = Math.round(rand() * window.innerWidth * 1.18);
        var y = Math.round(rand() * window.innerHeight * 1.18);
        var alpha = (0.3 + rand() * 0.7).toFixed(2);
        var color = palette[Math.floor(rand() * palette.length)].replace(/,1\)$/, "," + alpha + ")");
        var size = rand() < 0.16 ? " 1px" : "";
        shadows.push(x + "px " + y + "px 0" + size + " " + color);
      }
      stars.style.boxShadow = shadows.join(",");
      far.appendChild(stars);
    });

    /* Spodní mlha */
    var mist = document.createElement("div");
    mist.className = "mk-plus-mist";
    near.appendChild(mist);

    scene.appendChild(far);
    scene.appendChild(mid);
    scene.appendChild(near);
    document.body.prepend(scene);

    runSceneMotion();
  }

  /* Parallax — kurzor + scroll; hýbe se jen transformem, vše lerpované. */
  function runSceneMotion() {
    var pointer = { x: 0, y: 0 };
    var shown = { x: 0, y: 0 };
    var scrollY = window.scrollY;
    var ticking = false;

    function apply() {
      ticking = false;
      shown.x = lerp(shown.x, pointer.x, 0.06);
      shown.y = lerp(shown.y, pointer.y, 0.06);
      scene.style.setProperty("--mx", shown.x.toFixed(3));
      scene.style.setProperty("--my", shown.y.toFixed(3));
      /* Scroll parallax držíme v rozmezí 0..1, ať se scéna nikdy neodvine z okraje */
      scene.style.setProperty("--sy", (clamp(scrollY, 0, 1000) / 1000).toFixed(3));
      if (Math.abs(shown.x - pointer.x) > 0.002 || Math.abs(shown.y - pointer.y) > 0.002) {
        requestAnimationFrame(apply);
      }
    }

    function schedule() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    if (finePointer.matches) {
      window.addEventListener("pointermove", function (event) {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
        schedule();
      }, { passive: true });
    }

    window.addEventListener("scroll", function () {
      scrollY = window.scrollY;
      schedule();
    }, { passive: true });
  }

  /* =========================================================
     2) PADAJÍCÍ HVĚZDIČKY
     ========================================================= */

  function scheduleShootingStar() {
    window.setTimeout(function () {
      if (motionOk() && hasWAAPI && scene && !document.hidden) {
        var star = document.createElement("div");
        star.className = "mk-plus-shooting";
        var layer = scene.querySelector(".mk-plus-layer--mid");
        star.style.left = window.innerWidth * (0.1 + Math.random() * 0.5) + "px";
        star.style.top = window.innerHeight * (0.04 + Math.random() * 0.22) + "px";
        star.style.rotate = "18deg";
        layer.appendChild(star);

        var distance = window.innerWidth * 0.7;
        star.animate([
          { transform: "translate3d(0, 0, 0)", opacity: 0 },
          { transform: "translate3d(" + distance * 0.12 + "px, " + distance * 0.05 + "px, 0)", opacity: 1, offset: 0.12 },
          { transform: "translate3d(" + distance + "px, " + distance * 0.42 + "px, 0)", opacity: 0 }
        ], { duration: 1400 + Math.random() * 700, easing: "cubic-bezier(.2,.6,.35,1)" })
          .finished.then(function () { star.remove(); })
          .catch(function () { star.remove(); });
      }
      scheduleShootingStar();
    }, 7000 + Math.random() * 9000);
  }

  /* =========================================================
     3) HERO — TITLE SLOVO OD SLOVA
        Po dokončení vrátíme do elementu čistý text, aby i18n
        zůstal nedotčený a textová kopírovatelnost zachovaná.
     ========================================================= */

  function introizeHeroTitle() {
    if (!motionOk() || !hasWAAPI) return;

    /* První řádek — čistý text: rozdělíme na slova a necháme je vysunout.
       Druhý řádek má gradient crossující text (background-clip), proto hýbeme
       celým elementem najednou — split by rozbil řezání gradientu. */
    var first = document.querySelector(".mk-intro h1 > span[data-i18n]");

    if (first) {
      var original = first.textContent;
      var expected = normalizeSpaces(original);
      var words = expected.split(" ");

      if (words.length && words.length <= 8) {
        first.textContent = "";

        words.forEach(function (word, index) {
          var wrap = document.createElement("span");
          wrap.style.display = "inline-block";
          wrap.style.whiteSpace = "pre";
          wrap.textContent = word;
          first.appendChild(wrap);
          first.appendChild(document.createTextNode(" "));

          wrap.animate([
            { opacity: 0, transform: "translateY(104%) rotate(4deg)", filter: "blur(6px)" },
            { opacity: 1, transform: "translateY(0) rotate(0deg)", filter: "blur(0)" }
          ], {
            duration: 760,
            delay: 140 + index * 90,
            easing: "cubic-bezier(.2,.8,.22,1)",
            fill: "backwards"
          });
        });

        /* Až animace doběhne, vrať do elementu původní čistý text —
           ať i18n, označení myší ani vyhledávání nic neomezujeme.
           Když mezitím přepnul jazyk, text už patří i18n a nevracíme nic. */
        var restored = false;
        var restore = function () {
          if (restored) return;
          restored = true;
          if (normalizeSpaces(first.textContent) === expected) first.textContent = original;
        };
        window.setTimeout(restore, 1150 + words.length * 90);
      }
    }

    /* Druhý řádek — gradientní: jen jemné vysunutí celého řádku */
    var second = document.querySelector(".mk-intro h1 > em[data-i18n]");
    if (second) {
      second.animate([
        { opacity: 0, transform: "translateY(26px)", filter: "blur(5px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ], {
        duration: 900,
        delay: 420,
        easing: "cubic-bezier(.2,.8,.22,1)",
        fill: "backwards"
      });
    }

    /* Nástřel i pro CTA a HUD dlaždice — jemné, bez rozdělování textu */
    var extras = document.querySelectorAll(".mk-intro-actions, .mk-intro-proof");
    extras.forEach(function (node, index) {
      node.animate([
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], {
        duration: 820,
        delay: 640 + index * 130,
        easing: "cubic-bezier(.2,.8,.22,1)",
        fill: "backwards"
      });
    });
  }

  /* Plovoucí jiskřičky kolem titulku */
  function addHeroMotes() {
    if (!motionOk()) return;
    var copy = document.querySelector(".mk-intro .mk-intro-copy");
    if (!copy) return;

    ["✨", "⚡", "✦", "💎", "✦", "✨"].forEach(function (glyph, index) {
      var mote = document.createElement("span");
      mote.className = "mk-plus-mote";
      mote.setAttribute("aria-hidden", "true");
      mote.textContent = glyph;
      mote.style.left = (6 + Math.random() * 86) + "%";
      mote.style.top = (index % 2 === 0 ? 6 : 78) + Math.round(Math.random() * 14) + "%";
      mote.style.setProperty("--dur", (7 + Math.random() * 5).toFixed(1) + "s");
      mote.style.setProperty("--delay", (-Math.random() * 8).toFixed(1) + "s");
      copy.appendChild(mote);
    });
  }

  /* =========================================================
     4) COUNT-UP STATISTIK
     ========================================================= */

  function countUp(node, target, suffix, duration) {
    var start = performance.now();
    function frame(now) {
      var t = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = Math.round(target * eased) + suffix;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        node.textContent = node.dataset.plusTarget || (target + suffix);
        node.classList.add("mk-plus-counted");
      }
    }
    requestAnimationFrame(frame);
  }

  function registerCountUps() {
    if (!motionOk() || !("IntersectionObserver" in window)) return;

    var nodes = document.querySelectorAll(".mk-intro-proof strong, .studio-facts strong");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        var text = entry.target.textContent.trim();
        var match = text.match(/^(\d+)(\s*)(%|K\u010C|K\u010d)?$/);
        if (!match || match[1] === "0") return;

        var target = parseInt(match[1], 10);
        var suffix = match[3] ? (match[2] || "") + match[3] : "";
        entry.target.dataset.plusTarget = target + suffix;
        countUp(entry.target, target, suffix, 900);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (node) { observer.observe(node); });
  }

  /* =========================================================
     5) MAGNETICKÁ TLAČÍTKA + SPOT VE HERO
     ========================================================= */

  function attachMagnetTargets() {
    if (!finePointer.matches || !motionOk()) return;

    document.querySelectorAll(".mk-cta-primary, .mk-cta-github, .cta-card .button, .about-more-toggle").forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        var rect = el.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.translate = (x * 9).toFixed(1) + "px " + (y * 6).toFixed(1) + "px";
      });

      el.addEventListener("pointerleave", function () {
        el.style.translate = "0 0";
      });
    });

    /* Světlo sledující kurzor v hero sekci */
    var hero = document.querySelector(".mk-landing .mk-intro");
    if (!hero || hero.querySelector(".mk-plus-spot")) return;

    var spot = document.createElement("div");
    spot.className = "mk-plus-spot";
    spot.setAttribute("aria-hidden", "true");
    hero.appendChild(spot);

    var host = hero.closest(".mk-landing") || hero;
    host.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      spot.style.setProperty("--spot-x", clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100).toFixed(1) + "%");
      spot.style.setProperty("--spot-y", clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100).toFixed(1) + "%");
      spot.classList.add("is-on");
    });

    host.addEventListener("pointerleave", function () {
      spot.classList.remove("is-on");
    });
  }

  /* =========================================================
     6) EMOJI VODOZNAKY DO KARET
     ========================================================= */

  function addWatermarks() {
    var steps = ["🌿", "🛡️", "🧼", "📜"];
    document.querySelectorAll(".steps-grid .step-card").forEach(function (card, index) {
      if (card.querySelector(".mk-plus-watermark")) return;
      var mark = document.createElement("span");
      mark.className = "mk-plus-watermark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = steps[index % steps.length];
      card.appendChild(mark);
    });

    var pillars = ["🧩", "🖥️", "🛒", "🌱"];
    document.querySelectorAll(".studio-pillars .studio-pillar").forEach(function (card, index) {
      if (card.querySelector(".mk-plus-watermark")) return;
      var mark = document.createElement("span");
      mark.className = "mk-plus-watermark is-top";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = pillars[index % pillars.length];
      card.appendChild(mark);
    });
  }

  /* =========================================================
     7) JISKRY PŘI KLIKNUTÍ
     ========================================================= */

  var SPARK_EMOJIS = ["✨", "⚡", "💛", "💎", "🚀", "⛏️", "🧩", "🟨"];
  var PIXEL_COLORS = ["#ffd84f", "#ffae00", "#c83cff", "#ff58df", "#69f7ff"];

  function burstAt(x, y, amount) {
    if (!motionOk() || !hasWAAPI) return;

    var frag = document.createDocumentFragment();
    var nodes = [];

    for (var i = 0; i < amount; i += 1) {
      var node = document.createElement("span");
      var isPixel = Math.random() < 0.4;
      node.className = "mk-plus-spark" + (isPixel ? " is-pixel" : "");
      node.setAttribute("aria-hidden", "true");
      if (!isPixel) node.textContent = SPARK_EMOJIS[Math.floor(Math.random() * SPARK_EMOJIS.length)];
      node.style.left = x + "px";
      node.style.top = y + "px";
      node.style.setProperty("--spark-color", PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)]);
      node.style.setProperty("--spark-size", (10 + Math.random() * 12).toFixed(0) + "px");
      frag.appendChild(node);
      nodes.push(node);
    }

    document.body.appendChild(frag);

    nodes.forEach(function (node) {
      var angle = Math.random() * Math.PI * 2;
      var distance = 46 + Math.random() * 90;
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance - 26;
      var rotation = (Math.random() - 0.5) * 260;

      node.animate([
        { transform: "translate(-50%, -50%) scale(.2)", opacity: 0 },
        { transform: "translate(calc(-50% + " + (dx * 0.4).toFixed(1) + "px), calc(-50% + " + (dy * 0.4).toFixed(1) + "px)) scale(1.08)", opacity: 1, offset: 0.28 },
        { transform: "translate(calc(-50% + " + dx.toFixed(1) + "px), calc(-50% + " + dy.toFixed(1) + "px)) scale(.35) rotate(" + rotation.toFixed(0) + "deg)", opacity: 0 }
      ], {
        duration: 760 + Math.random() * 520,
        easing: "cubic-bezier(.16,.72,.3,1)"
      }).finished.then(function () { node.remove(); }).catch(function () { node.remove(); });
    });
  }

  function attachClickSparkles() {
    document.addEventListener("click", function (event) {
      var target = event.target.closest(
        ".mk-cta-primary, .mk-cta-github, .cta-card .button, .launcher-download-btn, .brand"
      );
      if (!target) return;

      burstAt(event.clientX, event.clientY, target.classList.contains("brand") ? 7 : 14);

      if (target.classList.contains("brand") && hasWAAPI) {
        target.animate([
          { transform: "rotate(0deg)" },
          { transform: "rotate(-10deg) scale(1.08)" },
          { transform: "rotate(6deg)" },
          { transform: "rotate(0deg)" }
        ], { duration: 620, easing: "cubic-bezier(.34,1.56,.5,1)" });
      }
    });
  }

  /* =========================================================
     8) BĚŽÍCÍ LINKA PŘED CTA
     ========================================================= */

  function addConveyor() {
    /* Linka sedí NAD CTA kartou, uvnitř sekce — nikoli v ní, aby se nerozhodil flex. */
    var ctaSection = document.querySelector(".cta-section");
    if (!ctaSection || ctaSection.querySelector(".mk-plus-conveyor")) return;

    var phraseMaps = {
      cs: ["PRO HRÁČE", "BEZ PAYWALLU", "PROVĚTRÁNO 1.21"],
      sk: ["PRE HRÁČOV", "BEZ PAYWALLU", "PREVETRAVENÉ 1.21"],
      en: ["FOR PLAYERS", "NO PAYWALL", "TUNED FOR 1.21"]
    };
    var phrases = phraseMaps[root.lang] || phraseMaps.en;

    var items = [
      { emoji: true, text: "⛏️" },
      { text: "OPEN SOURCE" },
      { emoji: true, text: "💛" },
      { text: "100% ZDARMA" },
      { emoji: true, text: "🔥" },
      { text: phrases[0] },
      { emoji: true, text: "🥳" },
      { text: "FABRIC & NEOFORGE" },
      { emoji: true, text: "🚀" },
      { text: phrases[1] },
      { emoji: true, text: "💠" },
      { text: phrases[2] }
    ];

    var strip = document.createElement("div");
    strip.className = "mk-plus-conveyor";
    strip.setAttribute("aria-hidden", "true");

    var track = document.createElement("div");
    track.className = "mk-plus-conveyor-track";

    /* Dvě stejné poloviny = plynulá nekonečná smyčka */
    for (var pass = 0; pass < 2; pass += 1) {
      items.forEach(function (item) {
        var el = document.createElement(item.emoji ? "em" : "span");
        el.textContent = item.text;
        track.appendChild(el);
      });
    }

    strip.appendChild(track);
    ctaSection.insertBefore(strip, ctaSection.firstElementChild);
  }
  /* =========================================================
     9) ZPĚT NAHORU + KOMETA U PROGRESS BARU
     ========================================================= */

  function buildBackToTop() {
    if (document.querySelector(".mk-plus-top")) return;

    var progress = document.getElementById("scrollProgress");
    var progressSpan = document.querySelector("#scrollProgress span");

    var labels = { cs: "Zpět nahoru", sk: "Späť hore", en: "Back to top" };

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "mk-plus-top";
    fab.setAttribute("aria-label", labels[root.lang] || labels.en);
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19V6"></path><path d="m6 12 6-6 6 6"></path><path d="M6 5h12"></path></svg>';
    document.body.appendChild(fab);

    var visible = false;

    function update() {
      var next = window.scrollY > 640;
      if (next !== visible) {
        visible = next;
        fab.classList.toggle("is-visible", visible);
      }
      if (progress && progressSpan) {
        var value = progressSpan.style.getPropertyValue("--scroll-progress");
        if (value) progress.style.setProperty("--plus-sp", value);
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    fab.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: motionOk() ? "smooth" : "auto" });
      var rect = fab.getBoundingClientRect();
      burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
    });
  }

  /* =========================================================
     10) REVEAL DROBNÝCH SEZNAMŮ + BUMP POČITU VÝSLEDKŮ
     ========================================================= */

  function registerSmallReveals() {
    if (!motionOk() || !("IntersectionObserver" in window)) return;

    var groups = [
      [".about-promises li", 70],
      [".about-tags > span", 55],
      [".studio-values > span", 55],
      [".launcher-feature", 90],
      [".launcher-row", 90],
      [".launcher-meta li", 55]
    ];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-plus-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });

    groups.forEach(function (group) {
      document.querySelectorAll(group[0]).forEach(function (el, index) {
        if (el.classList.contains("mk-plus-rise")) return;
        el.classList.add("mk-plus-rise");
        el.style.setProperty("--plus-delay", Math.min(index, 6) * group[1] + "ms");
        observer.observe(el);
      });
    });

    /* Katalog: když se přepne počet nalezených balíčků, číslo poskočí */
    var resultCount = document.getElementById("resultCount");
    if (resultCount && "MutationObserver" in window) {
      new MutationObserver(function () {
        resultCount.classList.remove("is-bumped");
        void resultCount.offsetWidth;
        resultCount.classList.add("is-bumped");
      }).observe(resultCount, { childList: true, characterData: true, subtree: true });
    }
  }

  /* =========================================================
     11) KONAMI — VEČÍRKOVÝ REŽIM
     ========================================================= */

  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiIndex = 0;

  function partyConfetti() {
    var emojis = ["🎉", "✨", "💛", "⛏️", "🧩", "💠", "🎈"];
    for (var i = 0; i < 36; i += 1) {
      var bit = document.createElement("i");
      bit.className = "mk-plus-rain";
      bit.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      bit.style.left = (Math.random() * 100).toFixed(1) + "vw";
      bit.style.setProperty("--fall", (2.4 + Math.random() * 2.4).toFixed(2) + "s");
      bit.style.setProperty("--delay", (Math.random() * 1.6).toFixed(2) + "s");
      document.body.appendChild(bit);
      window.setTimeout((function (node) {
        return function () { node.remove(); };
      })(bit), 5200);
    }
  }

  function partyToast() {
    var texts = {
      cs: "🎉 Party režim odemčen! Užij si to.",
      sk: "🎉 Režim párty odomknutý! Užite si to.",
      en: "🎉 Party mode unlocked! Enjoy the ride."
    };
    if (typeof window.showToast === "function") {
      window.showToast(texts[root.lang] || texts.en, "success", 3400);
    }
  }

  function party() {
    if (partyOn) return;
    partyOn = true;
    root.classList.add("mk-party");
    partyConfetti();
    window.setTimeout(partyConfetti, 1400);
    partyToast();
    window.setTimeout(function () {
      root.classList.remove("mk-party");
      partyOn = false;
    }, 9000);
  }

  function attachKonami() {
    window.addEventListener("keydown", function (event) {
      var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === KONAMI[konamiIndex]) {
        konamiIndex += 1;
        if (konamiIndex === KONAMI.length) {
          konamiIndex = 0;
          party();
        }
      } else {
        konamiIndex = key === KONAMI[0] ? 1 : 0;
      }
    });
  }

  /* =========================================================
     START
     ========================================================= */

  function boot() {
    buildScene();
    scheduleShootingStar();
    addWatermarks();
    addConveyor();
    buildBackToTop();
    registerCountUps();
    registerSmallReveals();
    attachMagnetTargets();
    attachClickSparkles();
    attachKonami();
    addHeroMotes();
    /* Titulek startujeme až po i18n (skript je na řádku za app.js) */
    introizeHeroTitle();
  }

  /* Ambientní animace pozastavené, když je záložka skrytá — šetří GPU i baterii. */
  document.addEventListener("visibilitychange", function () {
    if (!scene || typeof scene.getAnimations !== "function") return;
    var paused = document.hidden;
    try {
      scene.getAnimations({ subtree: true }).forEach(function (animation) {
        if (paused) animation.pause();
        else animation.play();
      });
    } catch (e) { /* starší prohlížeč — nevadí */ }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
