"use strict";

/* =============================================================
   LOKÁLNÍ (OFFLINE) ÚČET
   -------------------------------------------------------------
   Vytvoří účet čistě na tomto počítači. Žádné síťové volání,
   žádné odeslání dat nikam. UUID se počítá stejným algoritmem,
   jaký používá samotný Minecraft pro offline režim, takže
   hráč dostane na offline serveru pořád stejnou identitu.

   Algoritmus: UUID verze 3 (MD5) z řetězce "OfflinePlayer:<jméno>"
   ============================================================= */

const crypto = require("crypto");

/** Pravidla Mojangu pro jméno: 3–16 znaků, jen a-z A-Z 0-9 _ */
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

/**
 * Ověří uživatelské jméno pro lokální účet.
 * @returns {{ok: true} | {ok: false, code: string}}
 */
function validateUsername(rawName) {
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) return { ok: false, code: "auth.local.err.empty" };
  if (name.length < 3) return { ok: false, code: "auth.local.err.short" };
  if (name.length > 16) return { ok: false, code: "auth.local.err.long" };
  if (!USERNAME_RE.test(name)) return { ok: false, code: "auth.local.err.chars" };

  return { ok: true };
}

/**
 * Spočítá offline UUID (v3/MD5) pro dané jméno — stejně jako vanilla server.
 * @param {string} username
 * @returns {string} UUID s pomlčkami
 */
function offlineUUID(username) {
  const hash = crypto
    .createHash("md5")
    .update(`OfflinePlayer:${username}`, "utf8")
    .digest();

  // nastav verzi (3) a variantu (RFC 4122) — přesně jako Java UUID.nameUUIDFromBytes
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join("-");
}

/**
 * Vytvoří objekt lokálního účtu.
 * Nic se nikam neposílá — vše zůstává na disku uživatele.
 *
 * @param {string} rawName
 * @returns {{ok: true, account: object} | {ok: false, code: string}}
 */
function createLocalAccount(rawName) {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const check = validateUsername(name);
  if (!check.ok) return check;

  const uuid = offlineUUID(name);

  return {
    ok: true,
    account: {
      // id je stabilní → stejné jméno = stejný účet, nevznikají duplicity
      id: `local:${uuid}`,
      type: "local",
      username: name,
      uuid,
      // offline účet nemá žádný token ani refresh token
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      createdAt: Date.now()
    }
  };
}

module.exports = {
  USERNAME_RE,
  validateUsername,
  offlineUUID,
  createLocalAccount
};
