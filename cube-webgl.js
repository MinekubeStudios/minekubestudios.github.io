/* =============================================================
   MINEKUBE STUDIOS // 3D KOSTKA — WEBGL VYkresLOVAČ (v2)
   -------------------------------------------------------------
   Proč to není jen CSS krychle: apple.com staví produktový prohlížeč
   na předrenderovaných snímcích (3d_viewer.jpg, color_*.jpg,
   startframe/endframe pro každou pilulku). My si tentýž obraz
   počítáme v reálném čase, takže kostka jde otáčet plynule a
   v libovolném rozlišení — bez jediného obrázku navíc.

   Co soubor obsahuje:
     1. zaoblená krychle (Minkowski součet boxu a koule) s přesnými
        normálami, logo-texturou na každé stěně,
     2. studia: tři měkká světla v procedurálním prostředí,
        Lambert + Blinn-Phong + Fresnel, jednoduché tonální mapování,
     3. materiály — zlatá/ohňová/purpurová/ledová/grafit, matný,
        sklo (dva průchody seřazené odzadu dopředu), drát,
     4. ovládání — tažení myší i prstem se setrvačností, automatická
        rotace, jemné natáčení podle scrollu, přepínače z pilulek,
     5. výkon — jedna rAF smyčka, DPR strop 2, pauza mimo viewport
        a na skryté kartě, ztráta kontextu řešená fallbackem.

   Když WebGL není (starý prohlížeč, vypnutá akcelerace), soubor
   tiše skončí a na stránce zůstane CSS kostka z cube.css.
   ============================================================= */

(function () {
  "use strict";

  const stage = document.querySelector("[data-cube]");
  const canvas = stage && stage.querySelector("[data-cube-canvas]");
  if (!stage || !canvas) return;

  /* `data-cube-preserve` používá jen nástroj, který z plátna stahuje
     statický první snímek — jinde by zbytečně brzdil vykreslování. */
  const preserve = canvas.hasAttribute("data-cube-preserve");
  const contextAttributes = {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: preserve,
    powerPreference: "high-performance"
  };
  const gl =
    canvas.getContext("webgl", contextAttributes) ||
    canvas.getContext("experimental-webgl", contextAttributes);

  if (!gl) return; // CSS kostka zůstává hrdinou

  const motionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener: null };
  const reduced = () => Boolean(motionQuery && motionQuery.matches);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ---------- 1 · Materiály ---------- */

  /* Barvy drží stejné názvy jako pilulka „Barvy“ v HTML. */
  const PALETTES = {
    gold: { base: [1.0, 0.74, 0.24], edge: [1.0, 0.42, 0.04] },
    fire: { base: [1.0, 0.48, 0.26], edge: [0.72, 0.13, 0.02] },
    purple: { base: [0.76, 0.42, 1.0], edge: [0.42, 0.10, 0.72] },
    ice: { base: [0.55, 0.88, 1.0], edge: [0.18, 0.40, 0.85] },
    graphite: { base: [0.74, 0.74, 0.78], edge: [0.24, 0.24, 0.28] }
  };

  const FINISHES = {
    matte: { metal: 0.35, rough: 0.62, alpha: 1.0 },
    glass: { metal: 0.08, rough: 0.12, alpha: 0.58 },
    wire: { metal: 0.0, rough: 0.4, alpha: 1.0 }
  };

  /* Směr klíčového světla v prostoru scény (x doprava, y nahoru,
     z k divákovi) — posouvá se podle pilulky „Světlo“. */
  const LIGHTS = {
    left: { dir: [-0.75, 0.58, 0.52], env: -0.55 },
    front: { dir: [0.0, 0.55, 0.88], env: 0.0 },
    right: { dir: [0.75, 0.58, 0.52], env: 0.55 }
  };

  const state = {
    color: stage.dataset.color || "gold",
    finish: stage.dataset.finish || "matte",
    light: stage.dataset.light || "front"
  };

  /* ---------- 2 · Geometrie ---------- */

  /* Zaoblená krychle: bod na krychli se „přitlačí“ k boxu o h = 1 − r
     a posune o poloměr ve směru normály. Vznikne přesný Minkowski
     součet, takže normály jsou analytické a stěny se nevlní. */
  /* Klidový pohled: tříčtvrtinový úhel jako na produktové fotce. */
  const BASE_YAW = -0.62;

  /* Vnější poloměr kostky (1) — hrany drátu i kamera z něj vycházejí. */
  const CUBE_EXTENT = 1;
  const CUBE_RADIUS = 0.085;

  function buildRoundedBox(segments, radius) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const h = 1 - radius;

    /* Každá stěna má vlastní „obraz“: právo a nahoru. Díky tomu je
       značka na všech stranách stejně orientovaná — bez tohohle se
       na bočních stěnách objevila otočená o 90°. */
    const FACES = [
      { axis: 0, sign: 1, uAxis: 2, uSign: -1, vAxis: 1, vSign: 1 },
      { axis: 0, sign: -1, uAxis: 2, uSign: 1, vAxis: 1, vSign: 1 },
      { axis: 1, sign: 1, uAxis: 0, uSign: 1, vAxis: 2, vSign: -1 },
      { axis: 1, sign: -1, uAxis: 0, uSign: 1, vAxis: 2, vSign: 1 },
      { axis: 2, sign: 1, uAxis: 0, uSign: 1, vAxis: 1, vSign: 1 },
      { axis: 2, sign: -1, uAxis: 0, uSign: -1, vAxis: 1, vSign: 1 }
    ];

    FACES.forEach(face => {
      const faceNormal = [0, 0, 0];
      faceNormal[face.axis] = face.sign;
      const first = positions.length / 3;

      for (let i = 0; i <= segments; i += 1) {
        for (let j = 0; j <= segments; j += 1) {
          const u = (i / segments) * 2 - 1;
          const v = (j / segments) * 2 - 1;
          const p = [0, 0, 0];
          p[face.axis] = face.sign;
          p[face.uAxis] = u * face.uSign;
          p[face.vAxis] = v * face.vSign;

          const q = p.map(c => clamp(c, -h, h));
          const d = [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
          const len = Math.hypot(d[0], d[1], d[2]);
          const n = len < 1e-6 ? faceNormal : [d[0] / len, d[1] / len, d[2] / len];

          positions.push(q[0] + n[0] * radius, q[1] + n[1] * radius, q[2] + n[2] * radius);
          normals.push(n[0], n[1], n[2]);
          uvs.push(i / segments, j / segments);
        }
      }

      /* Zvenku proti směru hodinových ručiček — jinak by se stěny
         otočily dovnitř a kostka by zmizela. */
      const a = first;
      const b = first + segments + 1;
      const c = first + 1;
      const ab = [
        positions[b * 3] - positions[a * 3],
        positions[b * 3 + 1] - positions[a * 3 + 1],
        positions[b * 3 + 2] - positions[a * 3 + 2]
      ];
      const ac = [
        positions[c * 3] - positions[a * 3],
        positions[c * 3 + 1] - positions[a * 3 + 1],
        positions[c * 3 + 2] - positions[a * 3 + 2]
      ];
      const cross = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]
      ];
      const outward =
        cross[0] * faceNormal[0] + cross[1] * faceNormal[1] + cross[2] * faceNormal[2] >= 0;

      for (let i = 0; i < segments; i += 1) {
        for (let j = 0; j < segments; j += 1) {
          const p0 = first + i * (segments + 1) + j;
          const p1 = p0 + segments + 1;
          const p2 = p0 + 1;
          const p3 = p1 + 1;
          if (outward) indices.push(p0, p1, p2, p1, p3, p2);
          else indices.push(p0, p2, p1, p1, p2, p3);
        }
      }
    });

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  /* Hrany pro „drátěný“ povrch — dvanáct přímých hran zaoblené
     krychle. Počítáme je z poloměru zaoblení, ne hledáním ve vrcholech:
     roh zaoblené krychle leží jinde než roh boxu, takže hledání
     vždycky minulo a drát zůstal prázdný.

     Hrana mezi dvěma stěnami je od každé z nich vzdálená o poloměr,
     tedy v ose kolmé na hranu na h + r / √2; přímá část vede od −h do +h. */
  function buildEdges(extent, radius) {
    const h = extent - radius;
    const out = h + radius / Math.SQRT2;
    const line = [];
    for (let axis = 0; axis < 3; axis += 1) {
      const a1 = (axis + 1) % 3;
      const a2 = (axis + 2) % 3;
      for (const s1 of [-1, 1]) {
        for (const s2 of [-1, 1]) {
          /* Jedna hrana na kombinaci stran — od −h do +h podél osy. */
          const from = [0, 0, 0];
          const to = [0, 0, 0];
          from[a1] = to[a1] = s1 * out;
          from[a2] = to[a2] = s2 * out;
          from[axis] = -h;
          to[axis] = h;
          line.push(from[0], from[1], from[2], to[0], to[1], to[2]);
        }
      }
    }
    return new Float32Array(line);
  }

  /* ---------- 3 · Textura se značkou ---------- */

  function buildLogoTex() {
    const size = 512;
    const surface = document.createElement("canvas");
    surface.width = size;
    surface.height = size;
    const ctx = surface.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    /* Vnitřní rámeček — stejný motiv jako „pane“ na CSS kostce. */
    const inset = size * 0.12;
    const radius = size * 0.06;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
    ctx.lineWidth = size * 0.008;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(inset, inset, size - inset * 2, size - inset * 2, radius);
    } else {
      ctx.rect(inset, inset, size - inset * 2, size - inset * 2);
    }
    ctx.stroke();

    /* Značka: šestiboká krychle ze stejné cesty jako SVG v HTML. */
    const s = (size / 48) * 0.66;
    ctx.save();
    ctx.translate(size * 0.5 - 24 * s, size * 0.5 - 24 * s);
    ctx.scale(s, s);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(24, 6);
    ctx.lineTo(41, 15);
    ctx.lineTo(41, 33);
    ctx.lineTo(24, 42);
    ctx.lineTo(7, 33);
    ctx.lineTo(7, 15);
    ctx.closePath();
    ctx.moveTo(7, 15);
    ctx.lineTo(24, 24);
    ctx.lineTo(41, 15);
    ctx.moveTo(24, 24);
    ctx.lineTo(24, 42);
    ctx.stroke();
    ctx.restore();

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  /* ---------- 4 · Shadery ---------- */

  const VERTEX_SRC = [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "attribute vec2 aUv;",
    "uniform mat4 uProj;",
    "uniform mat4 uView;",
    "uniform mat3 uRot;",
    "varying vec3 vNrm;",
    "varying vec3 vToEye;",
    "varying vec3 vViewPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 mv = uView * vec4(uRot * aPos, 1.0);",
    "  vNrm = normalize(uRot * aNrm);",
    "  vToEye = -mv.xyz;",
    "  vViewPos = mv.xyz;",
    "  vUv = aUv;",
    "  gl_Position = uProj * mv;",
    "}"
  ].join("\n");

  const FRAGMENT_SRC = [
    "precision highp float;",
    "uniform vec3 uBase;",
    "uniform vec3 uEdge;",
    "uniform vec3 uKeyDir;",
    "uniform float uMetal;",
    "uniform float uRough;",
    "uniform float uAlpha;",
    "uniform float uEnvRot;",
    "uniform float uFlat;",
    "uniform sampler2D uLogo;",
    "varying vec3 vNrm;",
    "varying vec3 vToEye;",
    "varying vec3 vViewPos;",
    "varying vec2 vUv;",

    /* Procedurální studio: obloha shora, tmavá podlaha, tři měkká
       světla. Odlesky díky tomu mají „prostředí“, ne jen jednu tečku. */
    "vec3 studio(vec3 d) {",
    "  float y = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);",
    "  vec3 low = vec3(0.012, 0.009, 0.020);",
    "  vec3 mid = vec3(0.10, 0.075, 0.12);",
    "  vec3 top = vec3(0.58, 0.50, 0.58);",
    "  vec3 c = mix(low, mid, smoothstep(0.0, 0.50, y));",
    "  c = mix(c, top, smoothstep(0.44, 1.0, y));",
    /* velký softbox vlevo nahoře */
    "  c += vec3(1.0, 0.95, 0.88) * smoothstep(0.72, 0.99, dot(d, normalize(vec3(-0.55, 0.60, 0.58)))) * 2.1;",
    /* chladné doplňkové světlo vpravo */
    "  c += vec3(0.42, 0.66, 1.0) * smoothstep(0.82, 1.0, dot(d, normalize(vec3(0.88, 0.12, 0.46)))) * 1.15;",
    /* teplý odraz od podlahy */
    "  c += vec3(1.0, 0.46, 0.10) * smoothstep(0.15, -0.9, d.y) * 0.42;",
    "  return c;",
    "}",

    /* Jemný šum, aby gradienty neplastikovaly (dithering pásů). */
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",

    "void main() {",
    "  vec3 N = normalize(vNrm);",
    "  vec3 V = normalize(vToEye);",
    "  vec3 L = normalize(uKeyDir);",
    "  vec3 H = normalize(L + V);",
    "  vec3 R = reflect(-V, N);",
    "  float cs = cos(uEnvRot);",
    "  float sn = sin(uEnvRot);",
    "  vec3 RR = vec3(cs * R.x + sn * R.z, R.y, -sn * R.x + cs * R.z);",
    "  vec3 env = studio(RR);",

    "  if (uFlat > 0.5) {",
    "    float w = 0.55 + 0.45 * abs(N.y);",
    "    gl_FragColor = vec4(clamp(uEdge * w + vec3(0.16), 0.0, 1.0), uAlpha);",
    "    return;",
    "  }",

    /* Světlo: klíčové, protisvětlo a obrysové — tři směry dávají
       každé stěně jiný jas, takže je zřejmé, že je to krychle. */
    "  float ndl = max(dot(N, L), 0.0);",
    "  float wrap = ndl * 0.5 + 0.5;",
    "  vec3 fill = normalize(vec3(0.7, -0.15, 0.7));",
    "  vec3 back = normalize(vec3(-0.35, 0.45, -0.85));",
    "  float ndFill = max(dot(N, fill), 0.0);",
    "  float ndBack = max(dot(N, back), 0.0);",

    "  vec3 diffuse = uBase * (0.055 + 0.72 * ndl + 0.22 * wrap * wrap);",
    "  diffuse += uBase * vec3(0.36, 0.42, 0.55) * ndFill * 0.16;",
    "  diffuse += uBase * vec3(0.55, 0.36, 0.28) * ndBack * 0.22;",

    /* Odlesky: úzký „glint“ + široký hedvábný pás. */
    "  float specPow = mix(900.0, 26.0, uRough);",
    "  float tight = pow(max(dot(N, H), 0.0), specPow) * mix(3.4, 0.5, uRough);",
    "  float broad = pow(max(dot(N, H), 0.0), mix(90.0, 8.0, uRough)) * mix(0.5, 0.2, uRough);",
    "  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.5);",

    /* Horizont prostředí prochází stěnou jako měkký pás. */
    "  float horizon = smoothstep(-0.25, 0.75, RR.y);",

    "  vec3 col = mix(diffuse, env * uBase * 1.25, uMetal);",
    "  col += mix(vec3(1.0, 0.97, 0.92), uBase, 0.45) * tight;",
    "  col += uBase * broad * 0.9;",
    "  col += mix(uEdge * 0.6, env, 0.6) * fres * mix(0.3, 1.3, uMetal);",
    "  col += env * uBase * horizon * 0.12;",

    /* Značka je vyrytá: tmavý vroubek + světlý odlesk na hraně. */
    "  float logo = texture2D(uLogo, vUv).a;",
    "  col = mix(col, col * 1.35 + vec3(0.06), logo * 0.55);",

    /* Jemná vinětace do stran — plocha není jedna barva. */
    "  float vig = smoothstep(1.25, 0.35, length(vViewPos.xy));",
    "  col *= mix(0.74, 1.0, vig);",

    /* Tonální mapování a gama — bez něj jsou světlé plochy „mydlové“. */
    "  col = col / (col + vec3(0.85)) * 1.42;",
    "  col = pow(clamp(col, 0.0, 1.0), vec3(0.92));",
    "  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;",
    "  gl_FragColor = vec4(clamp(col, 0.0, 1.0), uAlpha);",
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  /* ---------- 5 · Matice (bez knihovny) ---------- */

  function perspective(fovRad, aspect, near, far) {
    const f = 1 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function rotation(yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    /* Column-major: sloupce jsou obrazy bázových vektorů. */
    return new Float32Array([
      cy, sp * sy, -cp * sy,
      0, cp, sp,
      sy, -sp * cy, cp * cy
    ]);
  }

  /* ---------- 6 · Inicializace scény ---------- */

  let program = buildProgram();
  if (!program) return;

  const geo = buildRoundedBox(44, CUBE_RADIUS);
  const edgeVertices = buildEdges(CUBE_EXTENT, CUBE_RADIUS);
  /* Diagnostika pro testy: kolik hran drátěný režim kreslí. */
  stage.dataset.cubeEdges = String(edgeVertices.length / 6);
  const logoTexture = buildLogoTex();

  const buffers = {
    pos: gl.createBuffer(),
    nrm: gl.createBuffer(),
    uv: gl.createBuffer(),
    idx: gl.createBuffer(),
    edge: gl.createBuffer()
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
  gl.bufferData(gl.ARRAY_BUFFER, geo.positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nrm);
  gl.bufferData(gl.ARRAY_BUFFER, geo.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
  gl.bufferData(gl.ARRAY_BUFFER, geo.uvs, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.edge);
  gl.bufferData(gl.ARRAY_BUFFER, edgeVertices, gl.STATIC_DRAW);

  const loc = {
    aPos: gl.getAttribLocation(program, "aPos"),
    aNrm: gl.getAttribLocation(program, "aNrm"),
    aUv: gl.getAttribLocation(program, "aUv"),
    uProj: gl.getUniformLocation(program, "uProj"),
    uView: gl.getUniformLocation(program, "uView"),
    uRot: gl.getUniformLocation(program, "uRot"),
    uBase: gl.getUniformLocation(program, "uBase"),
    uEdge: gl.getUniformLocation(program, "uEdge"),
    uKeyDir: gl.getUniformLocation(program, "uKeyDir"),
    uMetal: gl.getUniformLocation(program, "uMetal"),
    uRough: gl.getUniformLocation(program, "uRough"),
    uAlpha: gl.getUniformLocation(program, "uAlpha"),
    uEnvRot: gl.getUniformLocation(program, "uEnvRot"),
    uFlat: gl.getUniformLocation(program, "uFlat"),
    uLogo: gl.getUniformLocation(program, "uLogo")
  };

  const view = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, -6.4, 1
  ]);

  let yaw = BASE_YAW;
  let pitch = 0.22;
  let velocity = 0;
  let pitchVelocity = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let raf = 0;
  let lastTime = 0;
  let visible = true;
  let scrollTilt = 0;
  let autoSpin = true;
  /* Než uživatel sáhne do scény, kostka se jen tiše kývá kolem
     tříčtvrtinového pohledu jako produkt na apple.com. Po prvním
     tažení převezme řízení on a kývání se už nevrací. */
  let interactive = false;
  let swayClock = 0;
  let needsResize = true;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);

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

  function bindAttribute(buffer, attribute, size) {
    if (attribute < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
  }

  function drawSolid(palette, finish, light, alpha, flat) {
    gl.uniform3fv(loc.uBase, palette.base);
    gl.uniform3fv(loc.uEdge, palette.edge);
    gl.uniform3fv(loc.uKeyDir, light.dir);
    gl.uniform1f(loc.uMetal, finish.metal);
    gl.uniform1f(loc.uRough, finish.rough);
    gl.uniform1f(loc.uAlpha, alpha);
    gl.uniform1f(loc.uEnvRot, light.env);
    gl.uniform1f(loc.uFlat, flat ? 1 : 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idx);
    gl.drawElements(gl.TRIANGLES, geo.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function render(now) {
    raf = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;

    let active = false;

    if (!dragging) {
      if (autoSpin && !reduced()) {
        active = true;
        if (!interactive) {
          swayClock += dt;
          yaw = BASE_YAW + Math.sin(swayClock * 0.42) * 0.26;
        } else {
          yaw += 0.16 * dt;
        }
      }
      if (Math.abs(velocity) > 0.02) {
        yaw += velocity * dt;
        velocity *= Math.pow(0.12, dt);
        active = true;
      } else {
        velocity = 0;
      }
      if (Math.abs(pitchVelocity) > 0.02) {
        pitch = clamp(pitch + pitchVelocity * dt, -0.9, 0.55);
        pitchVelocity *= Math.pow(0.12, dt);
        active = true;
      } else {
        pitchVelocity = 0;
      }
      if (Math.abs(pitch - 0.22) > 0.01 && !reduced()) {
        pitch += (0.22 - pitch) * Math.min(1, dt * 3.4);
        active = true;
      }
    } else {
      active = true;
    }

    const totalPitch = clamp(pitch + scrollTilt, -0.95, 0.6);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    /* Projekci aktualizujeme až po useProgram — jinak WebGL ohlásí,
       že uniform nepatří aktuálnímu programu (a nic se nevykreslí). */
    if (needsResize) {
      needsResize = false;
      const aspect = canvas.width / Math.max(canvas.height, 1);
      /* Na úzkých displejích rozevřeme zorné pole, aby kostka nikdy
         nevyčnívala z rámu — místo zmenšování geometrie. */
      const fov = aspect < 1 ? 2 * Math.atan(Math.tan(0.31) / aspect) : 0.62;
      gl.uniformMatrix4fv(loc.uProj, false, perspective(fov, aspect, 0.1, 40));
    }

    gl.uniformMatrix4fv(loc.uView, false, view);
    gl.uniformMatrix3fv(loc.uRot, false, rotation(yaw, totalPitch));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, logoTexture);
    gl.uniform1i(loc.uLogo, 0);

    bindAttribute(buffers.pos, loc.aPos, 3);
    bindAttribute(buffers.nrm, loc.aNrm, 3);
    bindAttribute(buffers.uv, loc.aUv, 2);

    const palette = PALETTES[state.color] || PALETTES.gold;
    const finish = FINISHES[state.finish] || FINISHES.matte;
    const light = LIGHTS[state.light] || LIGHTS.front;

    if (state.finish === "glass") {
      /* Sklo: nejdřív zadní stěny, pak přední — jinak by se míchalo
         v nesprávném pořadí a kostka by vypadala jako kaše. */
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.cullFace(gl.FRONT);
      drawSolid(palette, finish, light, finish.alpha * 0.62, false);
      gl.cullFace(gl.BACK);
      drawSolid(palette, finish, light, finish.alpha, false);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    } else if (state.finish === "wire") {
      /* První průchod: jen neviditelné tělo, které drží hloubku. */
      gl.colorMask(false, false, false, false);
      gl.cullFace(gl.BACK);
      drawSolid(palette, finish, light, 1, false);
      gl.colorMask(true, true, true, true);
    } else {
      gl.cullFace(gl.BACK);
      drawSolid(palette, finish, light, 1, false);
    }

    if (state.finish === "wire") {
      /* Drát = jen dvanáct hran, žádná výplň. Kreslí se přes sebe
         s aditivním mícháním, takže zadní hrany prosvítají. */
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
      drawSolid(palette, FINISHES.matte, light, 0, 1);
      gl.cullFace(gl.BACK);
      gl.depthMask(false);
      gl.uniform1f(loc.uFlat, 0);
      gl.uniform1f(loc.uAlpha, 1);
      gl.uniform1f(loc.uMetal, 0.1);
      gl.uniform1f(loc.uRough, 0.35);
      bindAttribute(buffers.edge, loc.aPos, 3);
      gl.vertexAttrib3f(loc.aNrm, 0, 0, 1);
      gl.drawArrays(gl.LINES, 0, edgeVertices.length / 3);
      bindAttribute(buffers.pos, loc.aPos, 3);
      bindAttribute(buffers.nrm, loc.aNrm, 3);
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
    }

    gl.flush();

    if ((active || state.finish === "wire") && visible && !document.hidden) {
      raf = window.requestAnimationFrame(render);
    }
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

  /* ---------- 7 · Ovládání tažením ---------- */

  const dragArea = stage.querySelector("[data-cube-drag]") || canvas;

  dragArea.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    interactive = true;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    velocity = 0;
    pitchVelocity = 0;
    stage.classList.add("is-dragging");
    if (dragArea.setPointerCapture) {
      try {
        dragArea.setPointerCapture(pointerId);
      } catch (error) {
        /* Bez zachycení ukazatele tažení funguje také. */
      }
    }
    requestFrame();
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

    yaw += dx * 0.011;
    pitch = clamp(pitch + dy * 0.008, -0.9, 0.55);

    if (!reduced()) {
      velocity = clamp((dx * 0.011) / span, -6, 6);
      pitchVelocity = clamp((dy * 0.008) / span, -3, 3);
    }
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

  /* ---------- 8 · Reakce na pilulky a motiv ---------- */

  const observer = new MutationObserver(() => {
    state.color = stage.dataset.color || "gold";
    state.finish = stage.dataset.finish || "matte";
    state.light = stage.dataset.light || "front";
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

  /* ---------- 9 · Viditelnost, velikost, scroll ---------- */

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
      scrollTilt = (progress - 0.5) * 0.42;
      requestFrame();
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopFrame();
    else requestFrame();
  });

  window.addEventListener("pageshow", requestFrame);

  const syncMotion = () => {
    if (reduced()) {
      stopFrame();
      autoSpin = false;
      scrollTilt = 0;
    } else if (spinInput) {
      autoSpin = spinInput.checked;
    }
    requestFrame();
  };
  if (motionQuery && typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", syncMotion);
  }

  /* ---------- 10 · Ztráta kontextu ---------- */

  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    stopFrame();
    stage.classList.remove("is-webgl");
  });

  canvas.addEventListener("webglcontextrestored", () => {
    program = buildProgram();
    if (!program) return;
    stage.classList.add("is-webgl");
    needsResize = true;
    resize();
    requestFrame();
  });

  /* ---------- 11 · Start ---------- */

  resize();
  stage.classList.add("is-webgl");
  requestFrame();

  /* Pro testy a ladicí konzoli — jen pro čtení stavu. */
  stage.dataset.cubeRenderer = "webgl";
})();
