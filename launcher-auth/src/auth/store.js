"use strict";

/* =============================================================
   ÚLOŽIŠTĚ ÚČTŮ
   -------------------------------------------------------------
   Účty se ukládají do accounts.json ve složce s daty launcheru.
   Zapisuje se atomicky (nejdřív .tmp, pak rename), aby pád
   aplikace uprostřed zápisu nerozbil soubor.

   Soubor má práva 0600 — čte ho jen vlastník.
   Lokální účty neobsahují žádný token, takže tam není co ukrást.
   ============================================================= */

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const FILE_NAME = "accounts.json";
const SCHEMA_VERSION = 1;

function emptyState() {
  return { version: SCHEMA_VERSION, activeId: null, accounts: [] };
}

class AccountStore {
  /**
   * @param {string} dataDir složka s daty launcheru (app.getPath("userData"))
   */
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, FILE_NAME);
    this.state = emptyState();
    this._writeChain = Promise.resolve();
  }

  async load() {
    try {
      const raw = await fsp.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw);

      this.state = {
        version: parsed.version ?? SCHEMA_VERSION,
        activeId: parsed.activeId ?? null,
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts : []
      };

      // aktivní účet mohl být mezitím odebrán
      if (this.state.activeId && !this.get(this.state.activeId)) {
        this.state.activeId = this.state.accounts[0]?.id ?? null;
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        this.state = emptyState(); // první spuštění
      } else if (err instanceof SyntaxError) {
        // poškozený soubor — odložíme ho, ať hráč nepřijde o data úplně
        await this._quarantine();
        this.state = emptyState();
      } else {
        throw err;
      }
    }
    return this.state;
  }

  async _quarantine() {
    try {
      await fsp.rename(this.file, `${this.file}.corrupt-${Date.now()}`);
    } catch {
      /* když to nejde, prostě přepíšeme */
    }
  }

  /** Zápisy řetězíme, aby se dva souběžné save() nepřepsaly navzájem. */
  save() {
    this._writeChain = this._writeChain.then(() => this._writeNow()).catch(() => {});
    return this._writeChain;
  }

  async _writeNow() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    const tmp = `${this.file}.tmp`;
    const json = JSON.stringify(this.state, null, 2);

    await fsp.writeFile(tmp, json, { encoding: "utf8", mode: 0o600 });
    await fsp.rename(tmp, this.file);

    try {
      await fsp.chmod(this.file, 0o600);
    } catch {
      /* na Windows nemusí projít — nevadí */
    }
  }

  list() {
    return this.state.accounts.slice();
  }

  get(id) {
    return this.state.accounts.find(a => a.id === id) || null;
  }

  getActive() {
    return this.state.activeId ? this.get(this.state.activeId) : null;
  }

  /** Přidá nebo aktualizuje účet (podle stabilního id) a označí ho jako aktivní. */
  async upsert(account) {
    const i = this.state.accounts.findIndex(a => a.id === account.id);
    if (i >= 0) {
      this.state.accounts[i] = { ...this.state.accounts[i], ...account };
    } else {
      this.state.accounts.push(account);
    }
    this.state.activeId = account.id;
    await this.save();
    return account;
  }

  async remove(id) {
    const before = this.state.accounts.length;
    this.state.accounts = this.state.accounts.filter(a => a.id !== id);

    if (this.state.activeId === id) {
      this.state.activeId = this.state.accounts[0]?.id ?? null;
    }

    await this.save();
    return this.state.accounts.length < before;
  }

  async setActive(id) {
    if (!this.get(id)) return false;
    this.state.activeId = id;
    await this.save();
    return true;
  }

  /** Verze pro renderer — bez tokenů. UI je nepotřebuje. */
  safeList() {
    return this.state.accounts.map(a => ({
      id: a.id,
      type: a.type,
      username: a.username,
      uuid: a.uuid,
      createdAt: a.createdAt,
      active: a.id === this.state.activeId
    }));
  }
}

module.exports = { AccountStore, FILE_NAME, SCHEMA_VERSION };
