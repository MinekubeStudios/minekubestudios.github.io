"use strict";

/* =============================================================
   IPC MOST MEZI OKNEM A HLAVNÍM PROCESEM
   -------------------------------------------------------------
   Renderer (okno) nikdy nesahá na síť ani na disk přímo.
   Všechno jde přes tyhle kanály, takže tokeny zůstávají
   v hlavním procesu a do stránky se nikdy nedostanou.
   ============================================================= */

const { ipcMain, shell } = require("electron");

const ms = require("../auth/microsoft");
const { createLocalAccount, validateUsername } = require("../auth/offline");
const { AccountStore } = require("../auth/store");

const CH = {
  list: "auth:list",
  active: "auth:active",
  localCreate: "auth:local:create",
  localValidate: "auth:local:validate",
  msStart: "auth:ms:start",
  msCancel: "auth:ms:cancel",
  msStatus: "auth:ms:status",   // main → renderer
  remove: "auth:remove",
  setActive: "auth:set-active",
  ensureToken: "auth:ensure-token",
  openExternal: "auth:open-external"
};

function registerAuthIPC({ dataDir, getWindow }) {
  const store = new AccountStore(dataDir);
  const ready = store.load();

  // běžící Microsoft přihlášení (jen jedno naráz)
  let pending = null;

  const send = (channel, payload) => {
    const win = getWindow?.();
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  };

  /* ---------- čtení ---------- */

  ipcMain.handle(CH.list, async () => {
    await ready;
    return { accounts: store.safeList() };
  });

  ipcMain.handle(CH.active, async () => {
    await ready;
    const a = store.getActive();
    return a ? { id: a.id, type: a.type, username: a.username, uuid: a.uuid } : null;
  });

  /* ---------- lokální účet ---------- */

  ipcMain.handle(CH.localValidate, (_e, name) => validateUsername(name));

  ipcMain.handle(CH.localCreate, async (_e, name) => {
    await ready;
    const result = createLocalAccount(name);
    if (!result.ok) return result;

    // stejné jméno = stejné UUID → nevytvářej duplicitu, jen aktivuj
    const existing = store.get(result.account.id);
    if (existing) {
      await store.setActive(existing.id);
      return { ok: true, account: store.safeList().find(a => a.id === existing.id), existed: true };
    }

    await store.upsert(result.account);
    return { ok: true, account: store.safeList().find(a => a.id === result.account.id) };
  });

  /* ---------- Microsoft účet ---------- */

  ipcMain.handle(CH.msStart, async () => {
    await ready;

    if (pending) return { ok: false, code: "auth.ms.err.busy" };

    if (!ms.isClientIdConfigured()) {
      return { ok: false, code: "auth.ms.err.noclient" };
    }

    let device;
    try {
      device = await ms.requestDeviceCode();
    } catch (err) {
      return { ok: false, code: err.code || "auth.ms.err.devicecode", message: err.message };
    }

    const controller = new AbortController();
    pending = { controller };

    // hráči hned ukážeme kód; zbytek doběhne na pozadí
    send(CH.msStatus, {
      phase: "code",
      userCode: device.userCode,
      verificationUri: device.verificationUri,
      expiresIn: device.expiresIn
    });

    (async () => {
      try {
        const tokens = await ms.pollForToken({
          deviceCode: device.deviceCode,
          interval: device.interval,
          expiresIn: device.expiresIn,
          signal: controller.signal
        });

        send(CH.msStatus, { phase: "exchanging" });

        const account = await ms.completeLogin(tokens);
        await store.upsert(account);

        send(CH.msStatus, {
          phase: "done",
          account: store.safeList().find(a => a.id === account.id)
        });
      } catch (err) {
        send(CH.msStatus, {
          phase: "error",
          code: err.code || "auth.ms.err.unknown",
          message: err.message
        });
      } finally {
        pending = null;
      }
    })();

    return {
      ok: true,
      userCode: device.userCode,
      verificationUri: device.verificationUri,
      expiresIn: device.expiresIn
    };
  });

  ipcMain.handle(CH.msCancel, () => {
    if (pending) {
      pending.controller.abort();
      pending = null;
      return { ok: true };
    }
    return { ok: false };
  });

  /* ---------- správa ---------- */

  ipcMain.handle(CH.remove, async (_e, id) => {
    await ready;
    return { ok: await store.remove(id) };
  });

  ipcMain.handle(CH.setActive, async (_e, id) => {
    await ready;
    return { ok: await store.setActive(id) };
  });

  /**
   * Vrátí platné přihlašovací údaje pro spuštění hry.
   * Microsoft účet se v případě potřeby tiše obnoví.
   */
  ipcMain.handle(CH.ensureToken, async (_e, id) => {
    await ready;

    const account = id ? store.get(id) : store.getActive();
    if (!account) return { ok: false, code: "auth.err.noaccount" };

    if (account.type === "local") {
      return {
        ok: true,
        credentials: {
          username: account.username,
          uuid: account.uuid,
          accessToken: "0",   // offline režim — token se nepoužívá
          userType: "legacy"
        }
      };
    }

    if (!ms.isExpired(account)) {
      return {
        ok: true,
        credentials: {
          username: account.username,
          uuid: account.uuid,
          accessToken: account.accessToken,
          userType: "msa"
        }
      };
    }

    try {
      const refreshed = await ms.refreshAccount(account);
      await store.upsert(refreshed);
      return {
        ok: true,
        refreshed: true,
        credentials: {
          username: refreshed.username,
          uuid: refreshed.uuid,
          accessToken: refreshed.accessToken,
          userType: "msa"
        }
      };
    } catch (err) {
      return { ok: false, code: err.code || "auth.ms.err.refresh", message: err.message };
    }
  });

  /** Odkaz na microsoft.com/link otevřeme v systémovém prohlížeči. */
  ipcMain.handle(CH.openExternal, (_e, url) => {
    if (typeof url === "string" && /^https:\/\//i.test(url)) {
      shell.openExternal(url);
      return { ok: true };
    }
    return { ok: false };
  });

  return { store, ready, channels: CH };
}

module.exports = { registerAuthIPC, CH };
