"use strict";

/* =============================================================
   PŘIHLAŠOVACÍ OBRAZOVKA — chování
   -------------------------------------------------------------
   Běží v okně (renderer). Na síť ani na disk nesahá —
   všechno jde přes window.minekubeAuth z preloadu.
   ============================================================= */

(function () {
  const api = window.minekubeAuth;

  /* ===================== PŘEKLADY CHYB ===================== */

  const MESSAGES = {
    "auth.local.err.empty": "Zadej prosím jméno.",
    "auth.local.err.short": "Jméno musí mít aspoň 3 znaky.",
    "auth.local.err.long": "Jméno může mít nejvýš 16 znaků.",
    "auth.local.err.chars": "Použij jen písmena bez diakritiky, číslice a podtržítko.",

    "auth.ms.err.noclient": "Přihlášení Microsoftem zatím není nastavené (chybí Azure client ID). Zatím použij lokální účet.",
    "auth.ms.err.devicecode": "Nepodařilo se spojit s Microsoftem. Zkontroluj připojení k internetu.",
    "auth.ms.err.declined": "Přihlášení bylo na stránce Microsoftu odmítnuto.",
    "auth.ms.err.expired": "Kód vypršel. Vygeneruj si nový.",
    "auth.ms.err.badcode": "Kód nebyl přijat. Zkus to prosím znovu.",
    "auth.ms.err.cancelled": "Přihlášení bylo zrušeno.",
    "auth.ms.err.busy": "Přihlášení už probíhá.",
    "auth.ms.err.token": "Microsoft odmítl přihlášení.",
    "auth.ms.err.xbl": "Nepodařilo se přihlásit k Xbox Live.",
    "auth.ms.err.xsts": "Xbox Live autorizaci se nepodařilo dokončit.",
    "auth.ms.err.noxbox": "K tomuto Microsoft účtu není vytvořený Xbox profil. Založ si ho na xbox.com a zkus to znovu.",
    "auth.ms.err.country": "Xbox Live není ve tvé zemi dostupný.",
    "auth.ms.err.adult": "Účet potřebuje ověření věku v nastavení Microsoft účtu.",
    "auth.ms.err.child": "Dětský účet musí být přidán do rodinné skupiny.",
    "auth.ms.err.mc": "Přihlášení k Minecraft službám selhalo.",
    "auth.ms.err.nogame": "K tomuto účtu není přiřazený Minecraft. Pokud hru nemáš koupenou, použij lokální účet.",
    "auth.ms.err.profile": "Nepodařilo se načíst herní profil.",
    "auth.ms.err.refresh": "Přihlášení vypršelo, přihlas se prosím znovu.",
    "auth.ms.err.unknown": "Došlo k neznámé chybě."
  };

  const msg = (code, fallback) => MESSAGES[code] || fallback || MESSAGES["auth.ms.err.unknown"];

  /* ===================== PRVKY ===================== */

  const steps = [...document.querySelectorAll(".auth-step")];
  const msPanes = [...document.querySelectorAll(".auth-ms-pane")];

  const el = {
    code: document.querySelector("[data-ms-code]"),
    timer: document.querySelector("[data-ms-timer]"),
    working: document.querySelector("[data-ms-working]"),
    error: document.querySelector("[data-ms-error]"),
    localInput: document.getElementById("local-name"),
    localHint: document.querySelector("[data-local-hint]"),
    localPreview: document.querySelector("[data-local-preview]"),
    localUuid: document.querySelector("[data-local-uuid]"),
    localSubmit: document.querySelector('[data-action="local-create"]'),
    localForm: document.querySelector('[data-form="local"]'),
    doneName: document.querySelector("[data-done-name]"),
    doneType: document.querySelector("[data-done-type]")
  };

  const DEFAULT_HINT = "3–16 znaků, povolena jsou písmena, číslice a podtržítko.";

  let verificationUri = "https://microsoft.com/link";
  let userCode = "";
  let timerId = null;

  /* ===================== NAVIGACE ===================== */

  function goto(name) {
    steps.forEach(s => {
      const active = s.dataset.step === name;
      s.hidden = !active;
      s.classList.toggle("is-active", active);
    });

    // odchod z Microsoft kroku = zrušit běžící pokus
    if (name !== "microsoft") {
      stopTimer();
      api?.cancelMicrosoft?.();
      showPane("idle");
    }

    if (name === "local") {
      setTimeout(() => el.localInput?.focus(), 60);
    }
  }

  function showPane(name) {
    msPanes.forEach(p => { p.hidden = p.dataset.pane !== name; });
  }

  /* ===================== ODPOČET ===================== */

  function startTimer(seconds) {
    stopTimer();
    let left = seconds;

    const tick = () => {
      if (left <= 0) return stopTimer();
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      if (el.timer) el.timer.textContent = `${m}:${s}`;
      left -= 1;
    };

    tick();
    timerId = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /* ===================== LOKÁLNÍ ÚČET ===================== */

  // Stejný algoritmus jako v main procesu — jen pro živý náhled UUID.
  // Skutečné UUID vždy počítá main proces.
  function previewUUID(name) {
    // jednoduchý MD5 v JS pro náhled
    return md5(`OfflinePlayer:${name}`).then(hex => {
      const b = hex.split("");
      // verze 3
      b[12] = "3";
      // varianta
      const v = parseInt(b[16], 16);
      b[16] = ((v & 0x3) | 0x8).toString(16);
      const h = b.join("");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    });
  }

  /* Minimalistický MD5 (WebCrypto MD5 nepodporuje). */
  function md5(str) {
    function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
    function au(x, y) {
      const l = (x & 0xffff) + (y & 0xffff);
      return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xffff);
    }
    function cmn(q, a, b, x, s, t) { return au(rl(au(au(a, q), au(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

    function toBlocks(s) {
      const utf8 = new TextEncoder().encode(s);
      const nbl = ((utf8.length + 8) >> 6) + 1;
      const blocks = new Array(nbl * 16).fill(0);
      for (let i = 0; i < utf8.length; i++) blocks[i >> 2] |= utf8[i] << ((i % 4) * 8);
      blocks[utf8.length >> 2] |= 0x80 << ((utf8.length % 4) * 8);
      blocks[nbl * 16 - 2] = utf8.length * 8;
      return blocks;
    }

    const x = toBlocks(str);
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
      const oa = a, ob = b, oc = c, od = d;
      a = ff(a, b, c, d, x[i], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i], 20, -373897302);
      a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i], 11, -358537222);
      c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = ii(a, b, c, d, x[i], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = au(a, oa); b = au(b, ob); c = au(c, oc); d = au(d, od);
    }

    const hex = [a, b, c, d].map(n => {
      let s = "";
      for (let j = 0; j < 4; j++) {
        s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
      }
      return s;
    }).join("");

    return Promise.resolve(hex);
  }

  const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

  function localCheck(name) {
    if (!name) return { ok: false, code: "auth.local.err.empty" };
    if (name.length < 3) return { ok: false, code: "auth.local.err.short" };
    if (name.length > 16) return { ok: false, code: "auth.local.err.long" };
    if (!NAME_RE.test(name)) return { ok: false, code: "auth.local.err.chars" };
    return { ok: true };
  }

  async function onLocalInput() {
    const name = el.localInput.value.trim();

    if (!name) {
      el.localInput.classList.remove("is-invalid", "is-valid");
      el.localHint.className = "auth-field-hint";
      el.localHint.textContent = DEFAULT_HINT;
      el.localPreview.hidden = true;
      el.localSubmit.disabled = true;
      return;
    }

    const check = localCheck(name);

    if (!check.ok) {
      el.localInput.classList.add("is-invalid");
      el.localInput.classList.remove("is-valid");
      el.localHint.className = "auth-field-hint is-error";
      el.localHint.textContent = msg(check.code);
      el.localPreview.hidden = true;
      el.localSubmit.disabled = true;
      return;
    }

    el.localInput.classList.add("is-valid");
    el.localInput.classList.remove("is-invalid");
    el.localHint.className = "auth-field-hint is-ok";
    el.localHint.textContent = "Jméno je v pořádku.";
    el.localSubmit.disabled = false;

    const uuid = await previewUUID(name);
    el.localUuid.textContent = uuid;
    el.localPreview.hidden = false;
  }

  async function onLocalSubmit(event) {
    event.preventDefault();
    const name = el.localInput.value.trim();
    if (!localCheck(name).ok) return;

    el.localSubmit.disabled = true;

    const result = await api.createLocal(name);

    if (!result?.ok) {
      el.localHint.className = "auth-field-hint is-error";
      el.localHint.textContent = msg(result?.code);
      el.localSubmit.disabled = false;
      return;
    }

    showDone(result.account.username, "Lokální účet — data zůstávají v tomto počítači.");
  }

  /* ===================== MICROSOFT ===================== */

  async function startMicrosoft() {
    showPane("working");
    el.working.textContent = "Připravuji přihlášení…";

    const result = await api.startMicrosoft();

    if (!result?.ok) {
      el.error.textContent = msg(result?.code, result?.message);
      showPane("error");
      return;
    }

    userCode = result.userCode;
    verificationUri = result.verificationUri;
    el.code.textContent = result.userCode;
    startTimer(result.expiresIn ?? 900);
    showPane("code");
  }

  function handleStatus(payload) {
    if (!payload) return;

    switch (payload.phase) {
      case "code":
        userCode = payload.userCode;
        verificationUri = payload.verificationUri;
        el.code.textContent = payload.userCode;
        startTimer(payload.expiresIn ?? 900);
        showPane("code");
        break;

      case "exchanging":
        stopTimer();
        el.working.textContent = "Ověřuji u Xbox Live a načítám profil…";
        showPane("working");
        break;

      case "done":
        stopTimer();
        showDone(payload.account?.username || "hráči", "Microsoft účet — přihlášeno oficiálně.");
        break;

      case "error":
        stopTimer();
        el.error.textContent = msg(payload.code, payload.message);
        showPane("error");
        break;
    }
  }

  /* ===================== HOTOVO ===================== */

  function showDone(name, typeText) {
    el.doneName.textContent = name;
    el.doneType.textContent = typeText;
    goto("done");
  }

  /* ===================== POSLUCHAČI ===================== */

  document.addEventListener("click", async event => {
    const target = event.target.closest("[data-goto], [data-action]");
    if (!target) return;

    if (target.dataset.goto) {
      goto(target.dataset.goto);
      return;
    }

    switch (target.dataset.action) {
      case "ms-start":
        startMicrosoft();
        break;

      case "ms-cancel":
        stopTimer();
        await api.cancelMicrosoft();
        showPane("idle");
        break;

      case "copy-code":
        try {
          await navigator.clipboard.writeText(userCode);
          target.textContent = "Zkopírováno ✓";
          setTimeout(() => { target.textContent = "Kopírovat kód"; }, 1800);
        } catch {
          /* schránka může být zakázaná */
        }
        break;

      case "open-link":
        api.openExternal(verificationUri);
        break;

      case "continue":
        window.dispatchEvent(new CustomEvent("minekube:auth-finished"));
        // v ostré verzi tady main proces zavře přihlašovací okno
        break;
    }
  });

  el.localInput?.addEventListener("input", onLocalInput);
  el.localForm?.addEventListener("submit", onLocalSubmit);

  api?.onMicrosoftStatus?.(handleStatus);

  /* ===================== START ===================== */

  goto("choose");
})();
