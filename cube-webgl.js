/* =============================================================================
   MINEKUBE STUDIOS // WEBGL SCÉNA — KOSTKA Z LOGA
   -----------------------------------------------------------------------------
   Scéna není „nějaká krychle v prostoru“: je to překreslený Minekube symbol.
   Všechny rozměry i barvy jsou změřené z dodaného loga (4800 × 4800 px) a
   přepočítané na jednotky, kde hrana krychle = 1:

     · šestiboký rám (vrchol nahoře/dole, svislé boky) — vnější šířka 2,075,
       výška 2,569, vnitřní otvor 1,682 × 2,104, tloušťka stěny 0,197
     · dutina s purpurovým přechodem (tmavá nahoře, růžový žár u dna)
     · krychle 1 × 1 × 1 v izometrické poloze, vrchol 0,984 nad středem rámu
     · dvě odstupňované podesty, mezi nimi prosvítá purpur dutiny
     · světlé žluté keylines = zkosené hrany s vlastní emisivní barvou

   Rám, dutina i podesta jsou statické a kreslené v rovině obrazovky — přesně
   jako v logu. Krychle je skutečné 3D těleso v izometrické projekci: jemně se
   vznáší, reaguje na ukazatel a tažením se dá otočit, ale vždy se vrátí do
   logové polohy, takže kompozice zůstává čitelná jako logo.
   ============================================================================= */

(function () {
  "use strict";

  const stage = document.querySelector("[data-cube]");
  const canvas = stage && stage.querySelector("[data-cube-canvas]");
  if (!stage || !canvas) return;

  const contextAttributes = {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: canvas.hasAttribute("data-cube-preserve")
  };

  let gl = null;
  try {
    gl = canvas.getContext("webgl", contextAttributes) || canvas.getContext("experimental-webgl", contextAttributes);
  } catch (error) {
    gl = null;
  }
  /* Bez WebGL zůstává statický snímek a CSS kostka — nic se nerozbije. */
  if (!gl) return;

  const motionQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => Boolean(motionQuery && motionQuery.matches);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* ===================== 1 · BARVY ===================== */

  const rgb = hex => {
    const value = parseInt(hex.slice(1), 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
  };
  const mix = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
  const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  /* Barva po obvodu: rám i vnitřní lem se mění hlavně podle úhlu, ne podle
     vzdálenosti od středu. Úhlová paleta proto sedí na předlohu lépe než
     plošné pole — zóny zůstanou ostré jako v logu. */
  function angularField(stops) {
    const table = stops.map(([deg, color]) => [deg, rgb(color)]).sort((a, b) => a[0] - b[0]);
    return (x, y) => {
      let deg = (Math.atan2(y, x) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      let prev = table[table.length - 1];
      let next = table[0];
      for (let i = 0; i < table.length; i++) {
        if (table[i][0] <= deg) {
          prev = table[i];
          next = table[(i + 1) % table.length];
        }
      }
      const span = (next[0] - prev[0] + 360) % 360 || 360;
      const t = (((deg - prev[0]) + 360) % 360) / span;
      return mix(prev[1], next[1], t);
    };
  }

  /* Čelní plocha rámu — měřená tabulka.
     Pro každých 10° obvodu je z loga odečteno sedm vzorků napříč tloušťkou
     rámu (od vnitřního lemu k vnější zkosené hraně). Tabulka zachovává i to,
     co se špatně vymýšlí: levé rameno je sytě červené, pravé oranžové,
     vrchol krémový, spodní pravé rameno nejsvětlejší žluté. */
  const RING_F = [0.07, 0.18, 0.34, 0.52, 0.7, 0.86, 0.965];
  const RING = [
    [0, "#ffd201", "#ffab01", "#ffab02", "#ffab02", "#ffaa03", "#ffaa01", "#f19701"],
    [10, "#ffc508", "#ffad01", "#ffb002", "#ffaf03", "#ffaf03", "#ffad01", "#f8a000"],
    [20, "#fcb40a", "#ffb300", "#ffb601", "#ffb402", "#ffb502", "#ffb601", "#f5a300"],
    [30, "#ff7a07", "#ffb600", "#ffb801", "#ffb801", "#ffb802", "#ffb501", "#f7a905"],
    [40, "#d60814", "#ff660b", "#ffe43e", "#ffe32c", "#ffdf1e", "#ffdb1e", "#ffdc15"],
    [50, "#db0c14", "#ff660b", "#ffe031", "#ffde22", "#ffd915", "#ffd511", "#ffd915"],
    [60, "#e10917", "#ff670b", "#ffde2c", "#ffdb19", "#ffd60e", "#ffd30b", "#fff170"],
    [70, "#e30a12", "#ff630c", "#ffdc26", "#ffd812", "#ffd309", "#ffd109", "#ffee61"],
    [80, "#df080e", "#ff660c", "#ffd822", "#ffd20e", "#ffce05", "#ffcd07", "#ffec5f"],
    [90, "#ff5306", "#fff3bc", "#fff399", "#fff38a", "#fff384", "#fff18c", "#ff8200"],
    [100, "#fc4707", "#ffed2f", "#ffaa04", "#ffa504", "#ff9f05", "#ff9c08", "#ffcc05"],
    [110, "#ef111f", "#ffab04", "#ffaa04", "#ffa603", "#ffa005", "#ff9b08", "#ffcc07"],
    [120, "#e70b2f", "#ff9905", "#ffac04", "#ffa602", "#ffa004", "#ff9e06", "#ffca07"],
    [130, "#e50c31", "#ff8008", "#ffab04", "#ffa603", "#ffa005", "#ffa007", "#ffc706"],
    [140, "#d90d33", "#ff7c08", "#ffae03", "#ffa804", "#ffa505", "#ffa106", "#ffc807"],
    [150, "#ff6302", "#ff4500", "#f64703", "#f54603", "#f54704", "#f24804", "#db3700"],
    [160, "#ff6c00", "#ff4c02", "#f84b04", "#f84b04", "#f84c05", "#f24d04", "#e33700"],
    [170, "#ff6500", "#ff5002", "#fa4e06", "#fb4c05", "#f85007", "#f24f05", "#e03600"],
    [180, "#ff6602", "#ff5004", "#fa5006", "#f95007", "#f85107", "#f65205", "#e43700"],
    [190, "#ff6300", "#ff5103", "#fa5207", "#fa5007", "#fb5207", "#f25105", "#d42a00"],
    [200, "#ff5a03", "#ff4e03", "#fa5207", "#f95107", "#f85207", "#f25406", "#d93300"],
    [210, "#ff7505", "#fd5206", "#f85408", "#f75307", "#f65308", "#f25506", "#dd2200"],
    [220, "#fc3c00", "#f23800", "#f13800", "#f03600", "#e93700", "#f74903", "#d82d00"],
    [230, "#fb3800", "#f33a00", "#f23b00", "#f03700", "#ec3800", "#ff5003", "#c11700"],
    [240, "#f83800", "#f13a00", "#f33800", "#f13700", "#eb3800", "#ff5003", "#a00500"],
    [250, "#f83b00", "#f13c00", "#f23c00", "#f33a00", "#eb3a00", "#e13c01", "#ae0000"],
    [260, "#f83c00", "#f43d00", "#f53e00", "#f33c00", "#ef3d00", "#f74b02", "#8b0000"],
    [270, "#ffab00", "#ffa800", "#ffa700", "#ffa300", "#ff9e00", "#ffa004", "#d73001"],
    [280, "#ff920a", "#ff8508", "#ff8207", "#ff7f07", "#ff7d08", "#fa7708", "#f05409"],
    [290, "#ff900a", "#ff8608", "#ff8207", "#ff7e07", "#ff7b08", "#fb8506", "#ef590a"],
    [300, "#ff900a", "#ff8508", "#ff8207", "#ff7d07", "#ff7b08", "#fb8c06", "#ee5609"],
    [310, "#ff8a09", "#ff8308", "#ff8007", "#ff7b08", "#ff7808", "#fc9104", "#ea4e07"],
    [320, "#ff840a", "#ff7b08", "#ff7807", "#ff7408", "#ff7109", "#fc8b05", "#e84b06"],
    [330, "#ffc201", "#ff9d05", "#ffa006", "#ffa006", "#ffa106", "#ffa007", "#d26c00"],
    [340, "#ffd901", "#ffa003", "#ffa104", "#ffa104", "#ffa103", "#ffa701", "#df6c00"],
    [350, "#ffdc00", "#ffa502", "#ffa603", "#ffa504", "#ffa603", "#ffa802", "#ed8d00"],
  ].map(row => [row[0], ...row.slice(1).map(hex => rgb(hex))]);

  function ringAngle(x, y) {
    const deg = (Math.atan2(y, x) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  }

  /* Barva rámu v místě (x, y) pro zvolenou hloubku napříč tloušťkou `f`. */
  function ringColor(deg, f) {
    const i = Math.floor(deg / 10) % 36;
    const j = (i + 1) % 36;
    const blend = (deg - i * 10) / 10;
    let k = 0;
    while (k < RING_F.length - 2 && f > RING_F[k + 1]) k++;
    const span = RING_F[k + 1] - RING_F[k] || 1;
    const t = clamp((f - RING_F[k]) / span, 0, 1);
    return mix(
      mix(RING[i][k + 1], RING[i][k + 2], t),
      mix(RING[j][k + 1], RING[j][k + 2], t),
      blend
    );
  }

  /* Podmalba pro jeden pruh rámu — barvu řeší až podle úhlu kolem středu. */
  const ringAt = (f, lift) => (x, y) => {
    const base = ringColor(ringAngle(x, y), f);
    return lift ? mix(base, rgb("#fff6cf"), lift) : base;
  };

  /* Dutina za krychlí: hluboký purpur nahoře, růžový žár u dna a teplý
     odlesk vlevo dole. */
  const CAVITY_RAMP = [
    [1.06, rgb("#8a0c28")],
    [0.72, rgb("#920d2c")],
    [0.3, rgb("#9c0f30")],
    [0.0, rgb("#9c0034")],
    [-0.3, rgb("#b80036")],
    [-0.6, rgb("#d60a4a")],
    [-0.85, rgb("#f41d62")],
    [-1.05, rgb("#ff3d84")]
  ];

  function cavityField(x, y) {
    let color = CAVITY_RAMP[CAVITY_RAMP.length - 1][1];
    for (let i = 0; i < CAVITY_RAMP.length - 1; i++) {
      const a = CAVITY_RAMP[i];
      const b = CAVITY_RAMP[i + 1];
      if (y <= a[0] && y >= b[0]) {
        color = mix(a[1], b[1], (a[0] - y) / (a[0] - b[0]));
        break;
      }
    }
    /* Žár stoupá podél dna dutiny — v logu tvoří jasně růžový lem, který
       kopíruje spodní hrany otvoru. */
    const rim = Math.exp(-(((y - 0.62 * Math.abs(x) + 0.99) / 0.17) ** 2));
    color = mix(color, rgb("#ff2f6e"), rim * 0.55);
    const hot = Math.exp(-(((x * 0.9) ** 2) / 0.05 + ((y + 1.02) ** 2) / 0.005));
    color = mix(color, rgb("#ff5aa4"), hot * 0.55);
    return color;
  }

  /* ===================== 2 · PALETY KRYCHLE ===================== */

  const PALETTES = {
    gold: {
      topA: "#ffb402", topB: "#ffd512", topC: "#fff0a0",
      leftA: "#f93300", leftB: "#ff4d04",
      rightA: "#ffa90c", rightB: "#ff9703",
      key: "#ffd63c", keyHot: "#fff0a0"
    },
    fire: {
      topA: "#ff9a33", topB: "#ffe4b0", topC: "#ffe0a4",
      leftA: "#a91f02", leftB: "#e03c05",
      rightA: "#ffcf78", rightB: "#d9550c",
      key: "#ffe08a", keyHot: "#fff6d6"
    },
    purple: {
      topA: "#b45cff", topB: "#f3dbff", topC: "#efd4ff",
      leftA: "#5a12a0", leftB: "#8a2fe0",
      rightA: "#e2a6ff", rightB: "#a24ee0",
      key: "#f2d6ff", keyHot: "#ffffff"
    },
    ice: {
      topA: "#5fbdf0", topB: "#e6fbff", topC: "#dcf9ff",
      leftA: "#1f52b4", leftB: "#3576e6",
      rightA: "#b8f2ff", rightB: "#4a9fdd",
      key: "#e2fbff", keyHot: "#ffffff"
    },
    graphite: {
      topA: "#9a9aa8", topB: "#f2f2f8", topC: "#eaeaf2",
      leftA: "#1d1d24", leftB: "#3a3a46",
      rightA: "#d4d4e0", rightB: "#6c6c7c",
      key: "#f6f6ff", keyHot: "#ffffff"
    }
  };

  const state = {
    color: stage.dataset.color || "gold",
    finish: stage.dataset.finish || "matte",
    light: stage.dataset.light || "front"
  };

  /* ===================== 3 · STAVBA SÍTÍ ===================== */

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const normalize = v => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  };

  function Mesh() {
    this.pos = [];
    this.nrm = [];
    this.col = [];
    this.emi = [];
    this.idx = [];
  }

  Mesh.prototype.vertex = function (p, n, color, emissive) {
    this.pos.push(p[0], p[1], p[2]);
    this.nrm.push(n[0], n[1], n[2]);
    this.col.push(color[0], color[1], color[2]);
    this.emi.push(emissive || 0);
    return this.pos.length / 3 - 1;
  };

  const paintOf = (painter, p) => (typeof painter === "function" ? painter(p[0], p[1], p[2]) : painter);

  /* Trojúhelník s danou vnější normálou — pořadí vrcholů se srovná samo,
     takže se nikdy neobrátí strana ani osvětlení. */
  Mesh.prototype.triangle = function (a, b, c, n, painter, emissive) {
    const ccw = dot(cross(sub(b, a), sub(c, a)), n) >= 0;
    const order = ccw ? [a, b, c] : [a, c, b];
    const i0 = this.vertex(order[0], n, paintOf(painter, order[0]), emissive);
    const i1 = this.vertex(order[1], n, paintOf(painter, order[1]), emissive);
    const i2 = this.vertex(order[2], n, paintOf(painter, order[2]), emissive);
    this.idx.push(i0, i1, i2);
  };

  Mesh.prototype.quad = function (a, b, c, d, n, painter, emissive) {
    this.triangle(a, b, c, n, painter, emissive);
    this.triangle(a, c, d, n, painter, emissive);
  };

  /* ---------- 3a · Šestiboký rám ---------- */

  const OUTER = { halfWidth: 1.0375, halfHeight: 1.2846, sideY: 0.644 };
  const INNER = { halfWidth: 0.8408, halfHeight: 1.052, sideY: 0.533 };
  const FRAME_Z = 0.06;
  const OUTER_CHAMFER = 0.009;
  const INNER_CHAMFER = 0.03;

  const hexAt = t => ({
    halfWidth: INNER.halfWidth + (OUTER.halfWidth - INNER.halfWidth) * t,
    halfHeight: INNER.halfHeight + (OUTER.halfHeight - INNER.halfHeight) * t,
    sideY: INNER.sideY + (OUTER.sideY - INNER.sideY) * t
  });

  /* Zaoblený šestiúhelník: hrany zůstávají rovné, jen rohy se plynule
     stáčejí — v logu mají rohy měkký přechod, ne ostrý zlom. */
  function hexLoop(t, fillet, cornerSteps, edgeSteps) {
    const spec = hexAt(t);
    const along = edgeSteps === undefined ? 10 : edgeSteps;
    const corners = [
      [0, spec.halfHeight],
      [-spec.halfWidth, spec.sideY],
      [-spec.halfWidth, -spec.sideY],
      [0, -spec.halfHeight],
      [spec.halfWidth, -spec.sideY],
      [spec.halfWidth, spec.sideY]
    ];
    const points = [];
    for (let i = 0; i < corners.length; i++) {
      const prev = corners[(i + corners.length - 1) % corners.length];
      const at = corners[i];
      const next = corners[(i + 1) % corners.length];
      const inDir = normalize([at[0] - prev[0], at[1] - prev[1], 0]);
      const outDir = normalize([next[0] - at[0], next[1] - at[1], 0]);
      const before = [at[0] - inDir[0] * fillet, at[1] - inDir[1] * fillet];
      const after = [at[0] + outDir[0] * fillet, at[1] + outDir[1] * fillet];
      for (let s = 0; s <= cornerSteps; s++) {
        const step = s / cornerSteps;
        const u = 1 - step;
        points.push([
          u * u * before[0] + 2 * u * step * at[0] + step * step * after[0],
          u * u * before[1] + 2 * u * step * at[1] + step * step * after[1]
        ]);
      }
      /* Hrany mezi rohy se musí rozdělit taky — jinak by celé rameno mělo
         jen dvě krajové barvy a přechod by se rozmazal do širokého závoje. */
      const upcoming = corners[(i + 1) % corners.length];
      const nextOutDir = normalize([upcoming[0] - at[0], upcoming[1] - at[1], 0]);
      const upcomingBefore = [upcoming[0] - nextOutDir[0] * fillet, upcoming[1] - nextOutDir[1] * fillet];
      for (let s = 1; s <= along; s++) {
        const step = s / (along + 1);
        points.push([
          after[0] + (upcomingBefore[0] - after[0]) * step,
          after[1] + (upcomingBefore[1] - after[1]) * step
        ]);
      }
    }
    /* Vnější normály v rovině obrazovky (pro zkosené pásy). */
    const normals = points.map((point, index) => {
      const prev = points[(index + points.length - 1) % points.length];
      const next = points[(index + 1) % points.length];
      const tx = next[0] - prev[0];
      const ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      return [ty / len, -tx / len, 0];
    });
    return { points, normals };
  }

  /* Pás mezi dvěma obrysy hexagonu. `normalMode` rozhoduje, kterým směrem
     plocha „kouká“ — tím se řídí i to, jak chytá světlo. */
  function frameBand(fromT, fromZ, toT, toZ, painter, emissive, normalMode) {
    const a = hexLoop(fromT, 0.018 * (0.5 + fromT), 3);
    const b = hexLoop(toT, 0.018 * (0.5 + toT), 3);
    const count = a.points.length;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const pa0 = [a.points[i][0], a.points[i][1], fromZ];
      const pa1 = [a.points[j][0], a.points[j][1], fromZ];
      const pb0 = [b.points[i][0], b.points[i][1], toZ];
      const pb1 = [b.points[j][0], b.points[j][1], toZ];
      const nx = (a.normals[i][0] + b.normals[i][0]) * 0.5;
      const ny = (a.normals[i][1] + b.normals[i][1]) * 0.5;
      let normal;
      if (normalMode === "flat") normal = [0, 0, 1];
      else if (normalMode === "outZ") normal = normalize([nx, ny, 0.62]);
      else if (normalMode === "out") normal = normalize([nx, ny, 0.001]);
      else if (normalMode === "inZ") normal = normalize([-nx, -ny, 0.66]);
      else normal = normalize([-nx, -ny, 0.001]);
      staticMesh.quad(pa0, pa1, pb1, pb0, normal, painter, emissive);
    }
  }

  /* ---------- 3b · Ořez na vnitřní otvor rámu ---------- */

  /* Šířka otvoru v dané výšce — podesta se do něj musí vejít, stejně jako
     v logu, kde stupně mizí za vnitřním lemem rámu. */
  function innerHalfWidthAt(y) {
    const hw = INNER.halfWidth;
    const hh = INNER.halfHeight;
    const sy = INNER.sideY;
    if (y >= hh || y <= -hh) return 0;
    if (y > sy) return (hw * (hh - y)) / (hh - sy);
    if (y < -sy) return (hw * (hh + y)) / (hh - sy);
    return hw;
  }

  /* ===================== 4 · STATICKÁ ČÁST SCÉNY ===================== */

  const staticMesh = new Mesh();

  /* 4a · Dutina (purpurová deska za rámem). */
  (function buildCavity() {
    const loop = hexLoop(0.035, 0.016, 2);
    const z = -1.12;
    const center = [0, 0, z];
    for (let i = 0; i < loop.points.length; i++) {
      const a = loop.points[i];
      const b = loop.points[(i + 1) % loop.points.length];
      staticMesh.triangle(center, [a[0], a[1], z], [b[0], b[1], z], [0, 0, 1], cavityField, 0);
    }
  })();

  /* 4b · Podesta — plochý šestiúhelník se stupni, přesně podle předlohy.
     Půdorys i výšky jsou změřené z loga: půl šířky 0,563, přední hrana
     v −0,913, sklon bočních hran 30°. Stupně jsou chevrony se stejným
     sklonem, takže se v logu lámou ve středu a stoupají k oběma stranám. */
  /* Podesta není samostatná hromada destiček — v logu je to velká zlatá
     deska vsazená do dutiny, která nechává kolem sebe jen úzkou purpurovou
     mezeru. Její spodní hrana je V; nad ní jsou tři stupně a dvě krémové
     linky, přesně jak je vidět ve sloupci středem předlohy. */
  const DECK_Z = -1.0;
  const DECK_HW = 0.7;
  const DECK_HH = 0.958;
  const DECK_SY = 0.52;
  const DECK_EDGE = -DECK_HH;
  const DECK_SLOPE = (DECK_HH - DECK_SY) / DECK_HW;

  /* Šířka desky v dané výšce (šestistěnný obrys se svislými boky). */
  function deckHalfWidth(y) {
    const ay = Math.abs(y);
    if (ay >= DECK_HH) return 0;
    if (ay <= DECK_SY) return DECK_HW;
    return (DECK_HW * (DECK_HH - ay)) / (DECK_HH - DECK_SY);
  }

  /* Stupně nad spodní hranou: [od, do, barva spodní, barva horní].
     `d` je vzdálenost nad hranou V — proto stupně kopírují její sklon. */
  const DECK_BANDS = [
    [0.0, 0.02, "#f0d486", "#fff2ae"],
    [0.02, 0.09, "#ffc510", "#ffdc2c"],
    [0.09, 0.104, "#ffe491", "#fff6c0"],
    [0.104, 0.2, "#ffc00c", "#ffd72a"],
    [0.2, 0.26, "#e64a00", "#ff8a02"]
  ];

  function deckPaint(x, y) {
    /* Horní deska leží ve stínu krychle — v logu je tmavě oranžová až
       červená, světlá je jen její hrana. Spodní patro naopak chytá světlo. */
    const shadow = mix(rgb("#c43700"), rgb("#f06700"), smoothstep(-0.95, -0.2, y));
    return mix(shadow, rgb("#e04a00"), smoothstep(-0.55, 0.6, x) * 0.3);
  }

  (function buildDeck() {
    const segments = 34;
    const paint = (x, y) => deckPaint(x, y);

    /* Základní deska — plný šestiúhelník kousek za stupni. */
    const corners = [[0, DECK_HH], [-DECK_HW, DECK_SY], [-DECK_HW, -DECK_SY], [0, -DECK_HH], [DECK_HW, -DECK_SY], [DECK_HW, DECK_SY]];
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      for (let k = 0; k < segments; k++) {
        const t0 = k / segments;
        const t1 = (k + 1) / segments;
        const p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0];
        const p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
        staticMesh.quad(
          [0, 0, DECK_Z - 0.004], [p0[0], p0[1], DECK_Z - 0.004], [p1[0], p1[1], DECK_Z - 0.004], [0, 0, DECK_Z - 0.004],
          [0, 0, 1], paint, 0
        );
      }
    }

    /* Stupně nad spodní hranou — pruhy rovnoběžné s V. */
    for (const [dLow, dHigh, lowColor, highColor] of DECK_BANDS) {
      for (let i = 0; i < segments * 2; i++) {
        const xa = -DECK_HW + (2 * DECK_HW * i) / (segments * 2);
        const xb = -DECK_HW + (2 * DECK_HW * (i + 1)) / (segments * 2);
        const ya0 = DECK_EDGE + Math.abs(xa) * DECK_SLOPE + dLow;
        const yb0 = DECK_EDGE + Math.abs(xb) * DECK_SLOPE + dLow;
        const ya1 = ya0 + (dHigh - dLow);
        const yb1 = yb0 + (dHigh - dLow);
        staticMesh.quad(
          [xa, ya0, DECK_Z], [xb, yb0, DECK_Z], [xb, yb1, DECK_Z], [xa, ya1, DECK_Z],
          [0, 0, 1], (x, y) => mix(rgb(lowColor), rgb(highColor), clamp((y - DECK_EDGE - Math.abs(x) * DECK_SLOPE - dLow) / Math.max(1e-4, dHigh - dLow), 0, 1)),
          0
        );
      }
    }
  })();

  /* 4c · Rám. */
  (function buildFrame() {
    const span = OUTER.halfWidth - INNER.halfWidth;
    const tOuterFront = 1 - OUTER_CHAMFER / span;
    const tInnerFront = INNER_CHAMFER / span;
    const backZ = -0.5;

    /* Vnější zkosená hrana — tenký paprsek na obrysu (v logu nejsvětlejší). */
    frameBand(1, FRAME_Z - OUTER_CHAMFER, tOuterFront, FRAME_Z, ringAt(0.955), 0, "flat");

    /* Čelní plocha rozdělená na čtyři soustředné pruhy. Radiální spád mezi
       vnitřním a vnějším okrajem je v logu jiný na každém rameni, takže
       každý pruh bere vlastní sloupec měřené tabulky. */
    const cuts = [tInnerFront, 0.368, 0.564, 0.759, tOuterFront];
    const depth = [0.18, 0.34, 0.52, 0.7, 0.86];
    for (let i = 0; i < 4; i++) {
      const f = (depth[i] + depth[i + 1]) / 2;
      const base = ringAt(f);
      frameBand(cuts[i], FRAME_Z, cuts[i + 1], FRAME_Z, (x, y) => {
        /* Krémový záblesk sedí jen na vrcholu a po ramenech rychle mizí. */
        const near = Math.exp(-(((ringAngle(x, y) - 90) / 11) ** 2));
        return mix(base(x, y), rgb("#fff9d8"), near * 0.06 * smoothstep(0.2, 0.95, f));
      }, 0, "flat");
    }

    /* Vnitřní lem — nejsvětlejší pruh celého rámu, v logu zvýrazněný
       tenkým krémovým keylinem přímo u hrany otvoru. */
    frameBand(tInnerFront, FRAME_Z, tInnerFront * 0.45, FRAME_Z - INNER_CHAMFER * 0.55, ringAt(0.18, 0.42), 0.25, "flat");
    frameBand(tInnerFront * 0.45, FRAME_Z - INNER_CHAMFER * 0.55, 0, FRAME_Z - INNER_CHAMFER, ringAt(0.18, 0.16), 0.32, "flat");

    /* Vnitřní stěna (do hloubky dutiny) a vnější stěna rámu. */
    /* Vnitřní stěna rámu: koukáme se do dutiny shora, takže nahoře je vidět
       široká zlatá plocha a dole ji zakrývá čelní plocha rámu. */
    (function buildInnerWall() {
      const ring = hexLoop(0, 0.014, 3);
      const pts = ring.points;
      const z0 = FRAME_Z - INNER_CHAMFER;
      const z1 = -0.8;
      const width = (x, y) => 0.013 + 0.085 * Math.exp(-(((ringAngle(x, y) - 92) / 46) ** 2));
      const shrinkTo = (x, y, off) => {
        const len = Math.hypot(x, y) || 1;
        const k = Math.max(0.05, (len - off) / len);
        return [x * k, y * k];
      };
      const paint = (x, y) => mix(ringAt(0.18)(x, y), rgb("#ffd6a0"), 0.2);
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        const p0 = pts[i];
        const p1 = pts[j];
        const q0 = shrinkTo(p0[0], p0[1], width(p0[0], p0[1]));
        const q1 = shrinkTo(p1[0], p1[1], width(p1[0], p1[1]));
        staticMesh.quad([p0[0], p0[1], z0], [p1[0], p1[1], z0], [q1[0], q1[1], z1], [q0[0], q0[1], z1], [0, 0, 1], paint, 0.4);
      }
    })();
    frameBand(1, FRAME_Z - OUTER_CHAMFER, 1, backZ, (x, y) => scale(ringAt(0.965)(x, y), 0.72), 0, "out");
  })();

  /* ===================== 5 · KRYCHLE ===================== */

  const CUBE_HALF = 0.5;
  const CUBE_BEVEL = 0.0105;
  const cubeMesh = new Mesh();

  /* Izometrická projekce jako otočení světa: kamera kouká ze směru (1,1,1).
     Statická scéna je kreslená rovnou v souřadnicích obrazovky, krychle
     prochází tímto otočením — proto sedí přesně jako v logu. */
  const ISO = [
    [1 / Math.SQRT2, 0, -1 / Math.SQRT2],
    [-1 / Math.sqrt(6), 2 / Math.sqrt(6), -1 / Math.sqrt(6)],
    [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]
  ];

  function cubeFacePaint(palette) {
    const topA = rgb(palette.topA);
    const topB = rgb(palette.topB);
    const topC = rgb(palette.topC);
    const leftA = rgb(palette.leftA);
    const leftB = rgb(palette.leftB);
    const rightA = rgb(palette.rightA);
    const rightB = rgb(palette.rightB);
    return function paint(id, x, y, z) {
      if (id === "top") {
        /* Horní plocha: sytě zlatá, vlevo do jantaru, se světelným švem
           přesně uprostřed (v logu běží od vzdáleného rohu k bližšímu). */
        const across = smoothstep(-0.55, 0.15, x);
        const base = mix(topA, topB, across);
        const seam = Math.exp(-(((x - z) / 0.035) ** 2));
        return mix(base, topC, seam * 0.16);
      }
      if (id === "left") {
        /* Levá stěna (v logu červenooranžová). */
        return mix(leftA, leftB, smoothstep(0.5, -0.5, y));
      }
      if (id === "right") {
        /* Pravá stěna (v logu zlatá, dole tmavne). */
        const vertical = smoothstep(0.5, -0.5, y);
        const across = smoothstep(0.5, -0.5, x);
        return mix(mix(rightA, rightB, vertical), rightB, across * 0.22);
      }
      if (id === "back") return mix(rightB, rightA, 0.4);
      if (id === "bottom") return scale(leftA, 0.6);
      return mix(leftB, rightB, 0.5);
    };
  }

  function buildCube(palette) {
    cubeMesh.pos.length = 0;
    cubeMesh.nrm.length = 0;
    cubeMesh.col.length = 0;
    cubeMesh.emi.length = 0;
    cubeMesh.idx.length = 0;

    const paint = cubeFacePaint(palette);
    const key = rgb(palette.key);
    const keyHot = rgb(palette.keyHot);
    const h = CUBE_HALF;
    const b = CUBE_BEVEL;
    const i = h - b;
    const grid = 12;
    const lerp3 = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t];

    const face = (id, n, corners) => {
      for (let u = 0; u < grid; u++) {
        for (let v = 0; v < grid; v++) {
          const u0 = u / grid;
          const u1 = (u + 1) / grid;
          const v0 = v / grid;
          const v1 = (v + 1) / grid;
          const p00 = lerp3(lerp3(corners[0], corners[1], u0), lerp3(corners[3], corners[2], u0), v0);
          const p10 = lerp3(lerp3(corners[0], corners[1], u1), lerp3(corners[3], corners[2], u1), v0);
          const p11 = lerp3(lerp3(corners[0], corners[1], u1), lerp3(corners[3], corners[2], u1), v1);
          const p01 = lerp3(lerp3(corners[0], corners[1], u0), lerp3(corners[3], corners[2], u0), v1);
          cubeMesh.quad(p00, p10, p11, p01, n, (x, y, z) => paint(id, x, y, z), 0);
        }
      }
    };

    face("right", [1, 0, 0], [[h, -i, -i], [h, i, -i], [h, i, i], [h, -i, i]]);
    face("back", [-1, 0, 0], [[-h, -i, i], [-h, i, i], [-h, i, -i], [-h, -i, -i]]);
    face("top", [0, 1, 0], [[-i, h, -i], [i, h, -i], [i, h, i], [-i, h, i]]);
    face("bottom", [0, -1, 0], [[-i, -h, i], [i, -h, i], [i, -h, -i], [-i, -h, -i]]);
    face("left", [0, 0, 1], [[-i, -i, h], [i, -i, h], [i, i, h], [-i, i, h]]);
    face("back2", [0, 0, -1], [[i, -i, -h], [-i, -i, -h], [-i, i, -h], [i, i, -h]]);

    /* Dvanáct zkosených hran — světlé keylines z loga. */
    const keyPaint = (x, y) => mix(key, keyHot, clamp(0.34 + y * 0.7 + (0.5 - Math.abs(x)) * 0.3, 0, 0.94));
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        cubeMesh.quad(
          [sx * h, sy * i, -i], [sx * h, sy * i, i], [sx * i, sy * h, i], [sx * i, sy * h, -i],
          normalize([sx, sy, 0]), keyPaint, 1
        );
      }
      for (const sz of [-1, 1]) {
        cubeMesh.quad(
          [sx * h, -i, sz * i], [sx * h, i, sz * i], [sx * i, i, sz * h], [sx * i, -i, sz * h],
          normalize([sx, 0, sz]), keyPaint, 1
        );
      }
    }
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        cubeMesh.quad(
          [-i, sy * h, sz * i], [i, sy * h, sz * i], [i, sy * i, sz * h], [-i, sy * i, sz * h],
          normalize([0, sy, sz]), keyPaint, 1
        );
      }
    }
    /* Osm rohových trojúhelníků. */
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          cubeMesh.triangle(
            [sx * h, sy * i, sz * i], [sx * i, sy * h, sz * i], [sx * i, sy * i, sz * h],
            normalize([sx, sy, sz]), keyPaint, 1
          );
        }
      }
    }
  }

  buildCube(PALETTES[state.color] || PALETTES.gold);
  stage.dataset.cubeEdges = "12";
  stage.dataset.cubeParts = "frame,cavity,pedestal,cube";

  /* ===================== 6 · SHADERY ===================== */

  const VERTEX_SRC = [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "attribute vec3 aCol;",
    "attribute float aEmi;",
    "uniform mat4 uProj;",
    "uniform mat4 uModel;",
    "varying vec3 vNrm;",
    "varying vec3 vCol;",
    "varying float vEmi;",
    "void main() {",
    "  vec4 world = uModel * vec4(aPos, 1.0);",
    "  vNrm = mat3(uModel) * aNrm;",
    "  vCol = aCol;",
    "  vEmi = aEmi;",
    "  gl_Position = uProj * world;",
    "}"
  ].join("\n");

  const FRAGMENT_SRC = [
    "precision mediump float;",
    "varying vec3 vNrm;",
    "varying vec3 vCol;",
    "varying float vEmi;",
    "uniform vec3 uKey;",
    "uniform float uAmb;",
    "uniform float uDiff;",
    "uniform float uSpec;",
    "uniform float uGlow;",
    "uniform float uWire;",
    "uniform float uAlpha;",
    "uniform float uTint;",
    "void main() {",
    "  if (uWire > 0.5 && vEmi < 0.5) discard;",
    "  vec3 n = normalize(vNrm);",
    "  float ndl = max(dot(n, uKey), 0.0);",
    "  vec3 col = vCol * (uAmb + uDiff * ndl);",
    "  vec3 half3 = normalize(uKey + vec3(0.0, 0.0, 1.0));",
    "  float spec = pow(max(dot(n, half3), 0.0), 32.0);",
    "  col += vec3(1.0, 0.94, 0.8) * spec * uSpec;",
    "  col = mix(col, vCol * uGlow * (1.0 + uTint * 0.2), vEmi);",
    "  gl_FragColor = vec4(col, uAlpha);",
    "}"
  ].join("\n");

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function buildProgram() {
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return program;
  }

  let program = buildProgram();
  if (!program) return;

  const loc = {
    aPos: gl.getAttribLocation(program, "aPos"),
    aNrm: gl.getAttribLocation(program, "aNrm"),
    aCol: gl.getAttribLocation(program, "aCol"),
    aEmi: gl.getAttribLocation(program, "aEmi"),
    uProj: gl.getUniformLocation(program, "uProj"),
    uModel: gl.getUniformLocation(program, "uModel"),
    uKey: gl.getUniformLocation(program, "uKey"),
    uAmb: gl.getUniformLocation(program, "uAmb"),
    uDiff: gl.getUniformLocation(program, "uDiff"),
    uSpec: gl.getUniformLocation(program, "uSpec"),
    uGlow: gl.getUniformLocation(program, "uGlow"),
    uWire: gl.getUniformLocation(program, "uWire"),
    uAlpha: gl.getUniformLocation(program, "uAlpha"),
    uTint: gl.getUniformLocation(program, "uTint")
  };

  const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  /* ---------- 6a · Orthografická kamera ---------- */

  const SCENE = { top: 1.2846, bottom: -1.2846, halfWidth: 1.0375, fit: 0.92 };
  const projection = new Float32Array(16);
  let viewHalfWidth = 2;

  function updateProjection() {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    const halfHeight = (SCENE.top - SCENE.bottom) / 2 / SCENE.fit;
    let halfWidth = halfHeight * aspect;
    if (halfWidth < SCENE.halfWidth * 1.04) halfWidth = SCENE.halfWidth * 1.04;
    viewHalfWidth = halfWidth;
    const sx = 1 / halfWidth;
    const sy = 1 / (halfWidth / aspect);
    projection[0] = sx; projection[1] = 0; projection[2] = 0; projection[3] = 0;
    projection[4] = 0; projection[5] = sy; projection[6] = 0; projection[7] = 0;
    projection[8] = 0; projection[9] = 0; projection[10] = -0.5; projection[11] = 0;
    projection[12] = 0; projection[13] = 0; projection[14] = 0; projection[15] = 1;
  }

  /* ---------- 6b · Buffery ---------- */

  function upload(mesh) {
    const buffers = {
      pos: gl.createBuffer(),
      nrm: gl.createBuffer(),
      col: gl.createBuffer(),
      emi: gl.createBuffer(),
      idx: gl.createBuffer(),
      count: mesh.idx.length
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.pos), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nrm);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.nrm), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.col);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.col), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.emi);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.emi), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.idx), gl.STATIC_DRAW);
    return buffers;
  }

  function release(buffers) {
    if (!buffers) return;
    gl.deleteBuffer(buffers.pos);
    gl.deleteBuffer(buffers.nrm);
    gl.deleteBuffer(buffers.col);
    gl.deleteBuffer(buffers.emi);
    gl.deleteBuffer(buffers.idx);
  }

  let staticBuffers = upload(staticMesh);
  let cubeBuffers = upload(cubeMesh);

  function bindMesh(buffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
    gl.enableVertexAttribArray(loc.aPos);
    gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nrm);
    gl.enableVertexAttribArray(loc.aNrm);
    gl.vertexAttribPointer(loc.aNrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.col);
    gl.enableVertexAttribArray(loc.aCol);
    gl.vertexAttribPointer(loc.aCol, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.emi);
    gl.enableVertexAttribArray(loc.aEmi);
    gl.vertexAttribPointer(loc.aEmi, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idx);
  }

  const drawMesh = buffers => gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);

  /* ---------- 6c · Model krychle ---------- */

  const model = new Float32Array(16);

  function setModel(yaw, pitch, bob) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    /* R = Ry(yaw) · Rx(pitch), pak izometrické otočení světa. */
    const r = [
      [cy, sy * sp, sy * cp],
      [0, cp, -sp],
      [-sy, cy * sp, cy * cp]
    ];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        let value = 0;
        for (let k = 0; k < 3; k++) value += ISO[row][k] * r[k][col];
        model[col * 4 + row] = value;
      }
    }
    model[3] = 0;
    model[7] = 0;
    model[11] = 0;
    model[12] = 0;
    model[13] = 0.1673 + bob;
    model[14] = 0;
    model[15] = 1;
  }

  const LIGHTS = {
    front: normalize([0.42, 0.72, 0.55]),
    left: normalize([-0.6, 0.62, 0.5]),
    right: normalize([0.78, 0.5, 0.38])
  };

  const FINISHES = {
    matte: { amb: 0.97, diff: 0.08, spec: 0.03, alpha: 1 },
    gloss: { amb: 0.95, diff: 0.12, spec: 0.22, alpha: 1 },
    glass: { amb: 0.98, diff: 0.08, spec: 0.34, alpha: 0.64 },
    wire: { amb: 0.97, diff: 0.1, spec: 0.16, alpha: 1 }
  };

  /* ===================== 7 · ANIMACE A OVLÁDÁNÍ ===================== */

  let yaw = 0;
  let pitch = 0;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let parallax = 0;
  let targetParallax = 0;
  let swayClock = 0;
  let idleClock = 0;
  let autoSpin = true;
  let visible = true;
  let needsResize = true;
  let raf = 0;
  let lastTime = 0;

  const dragArea = stage.querySelector("[data-cube-drag]") || canvas;
  const YAW_LIMIT = 0.72;
  const PITCH_LIMIT = 0.3;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width * dpr), 1);
    const height = Math.max(Math.round(rect.height * dpr), 1);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      needsResize = true;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function drawScene() {
    const finish = FINISHES[state.finish] || FINISHES.matte;
    const light = LIGHTS[state.light] || LIGHTS.front;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    if (needsResize) {
      needsResize = false;
      updateProjection();
      gl.uniformMatrix4fv(loc.uProj, false, projection);
    }

    gl.uniform3fv(loc.uKey, new Float32Array(light));
    gl.uniform1f(loc.uAmb, finish.amb);
    gl.uniform1f(loc.uDiff, finish.diff);
    gl.uniform1f(loc.uSpec, finish.spec);
    gl.uniform1f(loc.uGlow, 0.94 + Math.sin(idleClock * 0.9) * 0.06);
    gl.uniform1f(loc.uAlpha, 1);
    gl.uniform1f(loc.uTint, state.color === "gold" ? 0 : 1);
    gl.uniform1f(loc.uWire, 0);

    /* Statická vrstva: dutina, podesta, rám. */
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.uniformMatrix4fv(loc.uModel, false, IDENTITY);
    bindMesh(staticBuffers);
    drawMesh(staticBuffers);

    /* Krychle. */
    const bob = reduced() ? 0 : Math.sin(idleClock * 1.05) * 0.012;
    setModel(yaw, pitch + parallax * 0.02, bob);
    gl.uniformMatrix4fv(loc.uModel, false, model);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    if (state.finish === "wire") {
      gl.uniform1f(loc.uWire, 1);
      bindMesh(cubeBuffers);
      drawMesh(cubeBuffers);
      gl.uniform1f(loc.uWire, 0);
    } else if (state.finish === "glass") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(loc.uAlpha, finish.alpha * 0.55);
      gl.cullFace(gl.FRONT);
      bindMesh(cubeBuffers);
      drawMesh(cubeBuffers);
      gl.uniform1f(loc.uAlpha, finish.alpha);
      gl.cullFace(gl.BACK);
      drawMesh(cubeBuffers);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    } else {
      bindMesh(cubeBuffers);
      drawMesh(cubeBuffers);
    }

    gl.disable(gl.CULL_FACE);
    gl.flush();
  }

  function render(now) {
    raf = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;
    idleClock += dt;

    if (!dragging) {
      /* Dojezd setrvačnosti, pak plynulý návrat do logové polohy. */
      if (yawVelocity !== 0) {
        yaw = clamp(yaw + yawVelocity * dt, -YAW_LIMIT, YAW_LIMIT);
        yawVelocity *= Math.pow(0.06, dt);
        if (Math.abs(yawVelocity) < 0.03) yawVelocity = 0;
      }
      if (pitchVelocity !== 0) {
        pitch = clamp(pitch + pitchVelocity * dt, -PITCH_LIMIT, PITCH_LIMIT);
        pitchVelocity *= Math.pow(0.06, dt);
        if (Math.abs(pitchVelocity) < 0.03) pitchVelocity = 0;
      }
      yaw += (0 - yaw) * Math.min(1, dt * 1.9);
      pitch += (0 - pitch) * Math.min(1, dt * 1.9);

      /* Klidové kývání — jen když je zapnutá automatická rotace. */
      if (autoSpin && !reduced()) {
        swayClock += dt;
        yaw += Math.sin(swayClock * 0.55) * 0.004;
      }
      parallax += (targetParallax - parallax) * Math.min(1, dt * 2.2);
    }

    drawScene();

    if (visible && !document.hidden) raf = window.requestAnimationFrame(render);
    else lastTime = 0;
  }

  function requestFrame() {
    if (raf || !visible || document.hidden) return;
    lastTime = 0;
    raf = window.requestAnimationFrame(render);
  }

  function stopFrame() {
    if (!raf) return;
    window.cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---------- 7a · Tažení a ukazatel ---------- */

  dragArea.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    yawVelocity = 0;
    pitchVelocity = 0;
    stage.classList.add("is-dragging");
    if (dragArea.setPointerCapture) {
      try {
        dragArea.setPointerCapture(pointerId);
      } catch (error) {
        /* Bez zachycení to funguje také. */
      }
    }
    requestFrame();
  });

  dragArea.addEventListener("pointermove", event => {
    if (dragging && event.pointerId === pointerId) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const now = performance.now();
      const span = Math.max((now - lastMove) / 1000, 0.016);
      lastMove = now;
      yaw = clamp(yaw + dx * 0.009, -YAW_LIMIT, YAW_LIMIT);
      pitch = clamp(pitch + dy * 0.006, -PITCH_LIMIT, PITCH_LIMIT);
      if (!reduced()) {
        yawVelocity = clamp((dx * 0.009) / span, -4, 4);
        pitchVelocity = clamp((dy * 0.006) / span, -2.4, 2.4);
      }
      requestFrame();
      return;
    }
    if (reduced() || event.pointerType !== "mouse") return;
    /* Parallax: scéna se jen nepatrně natočí za ukazatelem. */
    const rect = dragArea.getBoundingClientRect();
    targetParallax = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    requestFrame();
  });

  function endDrag(event) {
    if (!dragging) return;
    if (event && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    stage.classList.remove("is-dragging");
    requestFrame();
  }

  dragArea.addEventListener("pointerup", endDrag);
  dragArea.addEventListener("pointercancel", endDrag);
  dragArea.addEventListener("lostpointercapture", endDrag);
  dragArea.addEventListener("pointerleave", () => {
    if (dragging) return;
    targetParallax = 0;
    requestFrame();
  });

  /* ---------- 7b · Pilulky: barva, povrch, světlo ---------- */

  const observer = new MutationObserver(() => {
    const nextColor = stage.dataset.color || "gold";
    const nextFinish = stage.dataset.finish || "matte";
    const nextLight = stage.dataset.light || "front";
    if (nextColor !== state.color) {
      state.color = nextColor;
      buildCube(PALETTES[nextColor] || PALETTES.gold);
      release(cubeBuffers);
      cubeBuffers = upload(cubeMesh);
    }
    state.finish = nextFinish;
    state.light = nextLight;
    requestFrame();
  });
  observer.observe(stage, { attributes: true, attributeFilter: ["data-color", "data-finish", "data-light"] });

  const spinInput = stage.querySelector("[data-cube-spin]");
  if (spinInput) {
    autoSpin = spinInput.checked;
    spinInput.addEventListener("change", () => {
      autoSpin = spinInput.checked && !reduced();
      requestFrame();
    });
  }

  /* ---------- 7c · Viditelnost, velikost, scroll ---------- */

  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          visible = entry.isIntersecting;
        });
        if (visible) requestFrame();
        else stopFrame();
      },
      { rootMargin: "160px 0px" }
    );
    watcher.observe(stage);
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      resize();
      requestFrame();
    });
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", () => {
      resize();
      requestFrame();
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      if (reduced()) return;
      const rect = stage.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      const progress = clamp((window.innerHeight - rect.top) / span, 0, 1);
      targetParallax = (progress - 0.5) * 0.7;
      requestFrame();
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopFrame();
    else requestFrame();
  });

  window.addEventListener("pageshow", requestFrame);

  if (motionQuery && typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", () => {
      if (reduced()) {
        yaw = 0;
        pitch = 0;
        yawVelocity = 0;
        pitchVelocity = 0;
        targetParallax = 0;
        parallax = 0;
        drawScene();
      }
      requestFrame();
    });
  }

  /* ---------- 7d · Ztráta kontextu ---------- */

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    stopFrame();
    stage.classList.remove("is-webgl");
  });

  canvas.addEventListener("webglcontextrestored", () => {
    program = buildProgram();
    if (!program) return;
    staticBuffers = upload(staticMesh);
    cubeBuffers = upload(cubeMesh);
    stage.classList.add("is-webgl");
    needsResize = true;
    resize();
    requestFrame();
  });

  /* ===================== 8 · START ===================== */

  resize();
  drawScene();
  stage.classList.add("is-webgl");
  stage.dataset.cubeRenderer = "webgl";
  requestFrame();

  /* Diagnostika pro testy scény. */
  stage.dataset.cubeFaces = "6";
})();
