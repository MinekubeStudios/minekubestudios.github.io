"use strict";

/* =============================================================
   UKÁZKA ZAPOJENÍ DO HLAVNÍHO PROCESU
   -------------------------------------------------------------
   Tenhle soubor NEKOPÍRUJ celý do projektu — je to vzor.
   Podstatné jsou tři věci:
     1) zavolat registerAuthIPC(...) při startu,
     2) otevřít přihlašovací okno, když není aktivní účet,
     3) před spuštěním hry si vyžádat platné údaje.
   ============================================================= */

const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { registerAuthIPC } = require("./auth-ipc");

let loginWindow = null;
let mainWindow = null;
let auth = null;

/* ===================== PŘIHLAŠOVACÍ OKNO ===================== */

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 620,
    height: 760,
    resizable: false,
    fullscreenable: false,
    backgroundColor: "#08040b",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      // bezpečné výchozí hodnoty — renderer nemá přístup k Node
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "..", "preload", "auth-preload.js")
    }
  });

  loginWindow.loadFile(path.join(__dirname, "..", "renderer", "login.html"));
  loginWindow.once("ready-to-show", () => loginWindow.show());
  loginWindow.on("closed", () => { loginWindow = null; });

  return loginWindow;
}

/* ===================== HLAVNÍ OKNO ===================== */

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 740,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: "#08040b",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "..", "preload", "auth-preload.js")
    }
  });

  // sem načti své stávající okno launcheru
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "app.html"));
  mainWindow.on("closed", () => { mainWindow = null; });

  return mainWindow;
}

/* ===================== START ===================== */

app.whenReady().then(async () => {
  auth = registerAuthIPC({
    dataDir: app.getPath("userData"),
    // IPC posílá průběh do toho okna, které je zrovna otevřené
    getWindow: () => loginWindow || mainWindow
  });

  await auth.ready;

  // Je hráč už přihlášený? Pak přeskoč přihlašování.
  if (auth.store.getActive()) {
    createMainWindow();
  } else {
    createLoginWindow();
  }
});

/** Renderer hlásí „hotovo“ → zavři login a otevři launcher. */
ipcMain.handle("auth:finished", () => {
  createMainWindow();
  if (loginWindow) loginWindow.close();
  return { ok: true };
});

/** Odhlášení → zpět na přihlašovací obrazovku. */
ipcMain.handle("auth:logout", async (_e, id) => {
  await auth.store.remove(id);
  if (!auth.store.getActive()) {
    createLoginWindow();
    if (mainWindow) mainWindow.close();
  }
  return { ok: true };
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (auth?.store.getActive()) createMainWindow();
    else createLoginWindow();
  }
});

/* =============================================================
   SPUŠTĚNÍ HRY — jak použít údaje
   -------------------------------------------------------------
   Nikdy neber token přímo z uloženého účtu. Vždy si řekni
   o ensureToken — ten Microsoft účtu v případě potřeby
   automaticky obnoví přihlášení.
   ============================================================= */

async function buildLaunchArgs(accountId) {
  const result = await ipcMain.emit; // jen ilustrace; v praxi volej store přímo
  void result;

  const account = accountId ? auth.store.get(accountId) : auth.store.getActive();
  if (!account) throw new Error("Není vybraný žádný účet.");

  // v reálu použij stejnou logiku jako handler auth:ensure-token
  return [
    "--username", account.username,
    "--uuid", account.uuid.replace(/-/g, ""),
    "--accessToken", account.type === "local" ? "0" : account.accessToken,
    "--userType", account.type === "local" ? "legacy" : "msa"
  ];
}

module.exports = { createLoginWindow, createMainWindow, buildLaunchArgs };
