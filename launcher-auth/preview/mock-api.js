"use strict";

/* =============================================================
   NÁHLED V PROHLÍŽEČI — falešné API
   -------------------------------------------------------------
   Slouží jen k proklikání vzhledu bez Electronu.
   V ostré aplikaci tohle nahradí preload (auth-preload.js).
   ============================================================= */

(function () {
  const listeners = [];
  const accounts = [];
  let cancelled = false;

  const emit = payload => listeners.forEach(fn => fn(payload));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // simulace: zapni/vypni chování Microsoft přihlášení
  const params = new URLSearchParams(location.search);
  const scenario = params.get("ms") || "ok"; // ok | noclient | nogame | slow

  window.minekubeAuth = {
    async list() {
      return { accounts };
    },

    async active() {
      return accounts.find(a => a.active) || null;
    },

    async validateLocalName(name) {
      return { ok: /^[A-Za-z0-9_]{3,16}$/.test(String(name || "").trim()) };
    },

    async createLocal(name) {
      await wait(280);
      const username = String(name).trim();
      const account = {
        id: `local:${username}`,
        type: "local",
        username,
        uuid: "—",
        active: true,
        createdAt: Date.now()
      };
      accounts.forEach(a => { a.active = false; });
      accounts.push(account);
      return { ok: true, account };
    },

    async startMicrosoft() {
      cancelled = false;

      if (scenario === "noclient") {
        return { ok: false, code: "auth.ms.err.noclient" };
      }

      await wait(650);

      const userCode = "MKUB-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const payload = {
        ok: true,
        userCode,
        verificationUri: "https://microsoft.com/link",
        expiresIn: 900
      };

      // po chvíli simuluj potvrzení hráčem
      (async () => {
        await wait(scenario === "slow" ? 9000 : 4500);
        if (cancelled) return;

        emit({ phase: "exchanging" });
        await wait(1800);
        if (cancelled) return;

        if (scenario === "nogame") {
          emit({ phase: "error", code: "auth.ms.err.nogame" });
          return;
        }

        const account = {
          id: "microsoft:demo",
          type: "microsoft",
          username: "MinekubeHrac",
          uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
          active: true,
          createdAt: Date.now()
        };
        accounts.forEach(a => { a.active = false; });
        accounts.push(account);
        emit({ phase: "done", account });
      })();

      return payload;
    },

    async cancelMicrosoft() {
      cancelled = true;
      return { ok: true };
    },

    async remove(id) {
      const i = accounts.findIndex(a => a.id === id);
      if (i >= 0) accounts.splice(i, 1);
      return { ok: i >= 0 };
    },

    async setActive(id) {
      accounts.forEach(a => { a.active = a.id === id; });
      return { ok: true };
    },

    async ensureToken() {
      return { ok: true, credentials: { username: "demo", uuid: "—", accessToken: "0", userType: "legacy" } };
    },

    async openExternal(url) {
      window.open(url, "_blank", "noopener");
      return { ok: true };
    },

    onMicrosoftStatus(cb) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  };

  // banner s informací, že jde o náhled
  window.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:99;" +
      "padding:8px 16px;border-radius:999px;font:600 12px Inter,system-ui,sans-serif;" +
      "background:rgba(255,174,0,.12);border:1px solid rgba(255,174,0,.35);color:#ffd84f;" +
      "backdrop-filter:blur(8px)";
    bar.textContent = "NÁHLED — Microsoft přihlášení je simulované (?ms=noclient / nogame / slow)";
    document.body.appendChild(bar);
  });
})();
