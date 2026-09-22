"use strict";

/* =============================================================
   PRELOAD — bezpečný můstek do okna
   -------------------------------------------------------------
   Vystavíme jen konkrétní funkce, ne celé ipcRenderer.
   Stránka tak nemůže volat nic jiného než to, co je tu uvedené.
   Vyžaduje contextIsolation: true.
   ============================================================= */

const { contextBridge, ipcRenderer } = require("electron");

const CH = {
  list: "auth:list",
  active: "auth:active",
  localCreate: "auth:local:create",
  localValidate: "auth:local:validate",
  msStart: "auth:ms:start",
  msCancel: "auth:ms:cancel",
  msStatus: "auth:ms:status",
  remove: "auth:remove",
  setActive: "auth:set-active",
  ensureToken: "auth:ensure-token",
  openExternal: "auth:open-external"
};

contextBridge.exposeInMainWorld("minekubeAuth", {
  list: () => ipcRenderer.invoke(CH.list),
  active: () => ipcRenderer.invoke(CH.active),

  validateLocalName: name => ipcRenderer.invoke(CH.localValidate, name),
  createLocal: name => ipcRenderer.invoke(CH.localCreate, name),

  startMicrosoft: () => ipcRenderer.invoke(CH.msStart),
  cancelMicrosoft: () => ipcRenderer.invoke(CH.msCancel),

  remove: id => ipcRenderer.invoke(CH.remove, id),
  setActive: id => ipcRenderer.invoke(CH.setActive, id),
  ensureToken: id => ipcRenderer.invoke(CH.ensureToken, id),

  openExternal: url => ipcRenderer.invoke(CH.openExternal, url),

  /**
   * Odběr průběhu Microsoft přihlášení.
   * Vrací funkci pro odhlášení posluchače.
   */
  onMicrosoftStatus(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on(CH.msStatus, handler);
    return () => ipcRenderer.removeListener(CH.msStatus, handler);
  }
});
