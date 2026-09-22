"use strict";

/* =============================================================
   PŘIHLÁŠENÍ MICROSOFT ÚČTEM (device code flow)
   -------------------------------------------------------------
   Řetězec: Microsoft → Xbox Live → XSTS → Minecraft → profil.

   Proč device code a ne vestavěné okno s přihlášením?
   Heslo uživatele se nikdy nedostane do našeho procesu —
   zadává ho na microsoft.com ve svém vlastním prohlížeči.
   Launcher vidí jen výsledný token. Zároveň nepotřebujeme
   client secret, takže nic tajného v aplikaci není.

   Tahle cesta se použije JEN když si ji hráč sám zvolí.
   Lokální účet nedělá ani jeden z těchto requestů.
   ============================================================= */

const ENDPOINTS = {
  deviceCode: "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode",
  token: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
  xbl: "https://user.auth.xboxlive.com/user/authenticate",
  xsts: "https://xsts.auth.xboxlive.com/xsts/authorize",
  mcLogin: "https://api.minecraftservices.com/authentication/login_with_xbox",
  mcProfile: "https://api.minecraftservices.com/minecraft/profile",
  mcEntitlements: "https://api.minecraftservices.com/entitlements/mcstore"
};

const SCOPE = "XboxLive.signin offline_access";

/* ------------------------------------------------------------------
   Klientské ID z Azure (registrace aplikace).
   Není to tajemství — u veřejného klienta se běžně distribuuje.
   Nastav přes proměnnou prostředí MINEKUBE_MS_CLIENT_ID,
   nebo sem rovnou vlep svoje ID.
   Návod: Azure Portal → App registrations → New registration
          → Accounts: "Personal Microsoft accounts only"
          → Authentication → Allow public client flows: ANO
   ------------------------------------------------------------------ */
const CLIENT_ID =
  process.env.MINEKUBE_MS_CLIENT_ID || "00000000-0000-0000-0000-000000000000";

function isClientIdConfigured(id = CLIENT_ID) {
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id) && !/^0{8}-/.test(id);
}

/** Chyba, která si nese strojově čitelný kód pro překlad v UI. */
class AuthError extends Error {
  constructor(code, message, details) {
    super(message || code);
    this.name = "AuthError";
    this.code = code;
    this.details = details;
  }
}

async function postJSON(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* některé chybové odpovědi nejsou JSON */
  }
  return { res, data, text };
}

async function postForm(url, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(params).toString()
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  return { res, data, text };
}

/* ===================== KROK 1 — vyžádání kódu ===================== */

/**
 * Vyžádá device code. Vrátí kód, který hráč opíše na microsoft.com/link.
 */
async function requestDeviceCode({ clientId = CLIENT_ID } = {}) {
  if (!isClientIdConfigured(clientId)) {
    throw new AuthError(
      "auth.ms.err.noclient",
      "Chybí Azure client ID — nastav MINEKUBE_MS_CLIENT_ID."
    );
  }

  const { res, data } = await postForm(ENDPOINTS.deviceCode, {
    client_id: clientId,
    scope: SCOPE
  });

  if (!res.ok || !data?.device_code) {
    throw new AuthError("auth.ms.err.devicecode", data?.error_description || "Nepodařilo se získat kód.", data);
  }

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || "https://microsoft.com/link",
    expiresIn: data.expires_in ?? 900,
    interval: data.interval ?? 5
  };
}

/* ===================== KROK 2 — čekání na potvrzení ===================== */

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Opakovaně se ptá Microsoftu, jestli už hráč kód potvrdil.
 * @param {object} opts
 * @param {AbortSignal} [opts.signal] umožní hráči přihlášení zrušit
 */
async function pollForToken({ deviceCode, interval = 5, expiresIn = 900, clientId = CLIENT_ID, signal } = {}) {
  const deadline = Date.now() + expiresIn * 1000;
  let waitMs = Math.max(1, interval) * 1000;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new AuthError("auth.ms.err.cancelled", "Přihlášení zrušeno.");
    await sleep(waitMs);
    if (signal?.aborted) throw new AuthError("auth.ms.err.cancelled", "Přihlášení zrušeno.");

    const { data } = await postForm(ENDPOINTS.token, {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      client_id: clientId,
      device_code: deviceCode
    });

    if (data?.access_token) return data;

    switch (data?.error) {
      case "authorization_pending":
        break; // hráč ještě needitoval — zkoušíme dál
      case "slow_down":
        waitMs += 5000;
        break;
      case "authorization_declined":
        throw new AuthError("auth.ms.err.declined", "Přihlášení bylo odmítnuto.");
      case "expired_token":
        throw new AuthError("auth.ms.err.expired", "Kód vypršel, zkus to znovu.");
      case "bad_verification_code":
        throw new AuthError("auth.ms.err.badcode", "Neplatný kód.");
      default:
        if (data?.error) {
          throw new AuthError("auth.ms.err.token", data.error_description || data.error, data);
        }
    }
  }

  throw new AuthError("auth.ms.err.expired", "Kód vypršel, zkus to znovu.");
}

/* ===================== KROK 3 — Xbox Live ===================== */

async function authenticateXbox(msAccessToken) {
  const { res, data } = await postJSON(ENDPOINTS.xbl, {
    Properties: {
      AuthMethod: "RPS",
      SiteName: "user.auth.xboxlive.com",
      RpsTicket: `d=${msAccessToken}`
    },
    RelyingParty: "http://auth.xboxlive.com",
    TokenType: "JWT"
  });

  if (!res.ok || !data?.Token) {
    throw new AuthError("auth.ms.err.xbl", "Xbox Live přihlášení selhalo.", data);
  }

  return { token: data.Token, uhs: data.DisplayClaims?.xui?.[0]?.uhs };
}

/* ===================== KROK 4 — XSTS ===================== */

/** Chybové kódy XSTS, které mají vlastní srozumitelné hlášky. */
const XSTS_ERRORS = {
  2148916233: "auth.ms.err.noxbox",     // účet nemá Xbox profil
  2148916235: "auth.ms.err.country",    // Xbox Live není v dané zemi dostupný
  2148916236: "auth.ms.err.adult",      // vyžadováno ověření dospělosti
  2148916237: "auth.ms.err.adult",
  2148916238: "auth.ms.err.child"       // dětský účet bez rodiny
};

async function authorizeXSTS(xblToken) {
  const { res, data } = await postJSON(ENDPOINTS.xsts, {
    Properties: { SandboxId: "RETAIL", UserTokens: [xblToken] },
    RelyingParty: "rp://api.minecraftservices.com/",
    TokenType: "JWT"
  });

  if (!res.ok || !data?.Token) {
    const xerr = Number(data?.XErr);
    throw new AuthError(XSTS_ERRORS[xerr] || "auth.ms.err.xsts", "XSTS autorizace selhala.", data);
  }

  return { token: data.Token, uhs: data.DisplayClaims?.xui?.[0]?.uhs };
}

/* ===================== KROK 5 — Minecraft ===================== */

async function loginMinecraft(uhs, xstsToken) {
  const { res, data } = await postJSON(ENDPOINTS.mcLogin, {
    identityToken: `XBL3.0 x=${uhs};${xstsToken}`
  });

  if (!res.ok || !data?.access_token) {
    throw new AuthError("auth.ms.err.mc", "Přihlášení k Minecraft službám selhalo.", data);
  }

  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 86400 };
}

async function fetchProfile(mcAccessToken) {
  const res = await fetch(ENDPOINTS.mcProfile, {
    headers: { Authorization: `Bearer ${mcAccessToken}`, Accept: "application/json" }
  });

  // 404 = účet nemá koupený Minecraft (např. jen Xbox Game Pass bez nároku)
  if (res.status === 404) {
    throw new AuthError("auth.ms.err.nogame", "K tomuto účtu není přiřazen Minecraft.");
  }
  if (!res.ok) {
    throw new AuthError("auth.ms.err.profile", "Nepodařilo se načíst profil.");
  }

  const data = await res.json();
  const rawId = data.id || "";
  const uuid =
    rawId.length === 32
      ? `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`
      : rawId;

  return {
    uuid,
    username: data.name,
    skins: data.skins || [],
    capes: data.capes || []
  };
}

/* ===================== CELÝ ŘETĚZEC ===================== */

/**
 * Projde celý řetězec od MS tokenu až k hotovému účtu.
 */
async function completeLogin(msTokens) {
  const xbl = await authenticateXbox(msTokens.access_token);
  const xsts = await authorizeXSTS(xbl.token);
  const mc = await loginMinecraft(xsts.uhs || xbl.uhs, xsts.token);
  const profile = await fetchProfile(mc.accessToken);

  return {
    id: `microsoft:${profile.uuid}`,
    type: "microsoft",
    username: profile.username,
    uuid: profile.uuid,
    accessToken: mc.accessToken,
    refreshToken: msTokens.refresh_token || null,
    expiresAt: Date.now() + mc.expiresIn * 1000,
    skins: profile.skins,
    capes: profile.capes,
    createdAt: Date.now()
  };
}

/**
 * Obnoví vypršelý token na pozadí, aby se hráč nemusel přihlašovat znovu.
 */
async function refreshAccount(account, { clientId = CLIENT_ID } = {}) {
  if (!account?.refreshToken) {
    throw new AuthError("auth.ms.err.norefresh", "Chybí refresh token — přihlas se znovu.");
  }

  const { data } = await postForm(ENDPOINTS.token, {
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: account.refreshToken,
    scope: SCOPE
  });

  if (!data?.access_token) {
    throw new AuthError("auth.ms.err.refresh", data?.error_description || "Obnovení přihlášení selhalo.", data);
  }

  const fresh = await completeLogin(data);
  return { ...fresh, id: account.id };
}

/** Má token ještě platnost? (s minutovou rezervou) */
function isExpired(account, skewMs = 60_000) {
  if (account?.type !== "microsoft") return false;
  if (!account?.expiresAt) return true;
  return Date.now() + skewMs >= account.expiresAt;
}

module.exports = {
  ENDPOINTS,
  SCOPE,
  CLIENT_ID,
  AuthError,
  isClientIdConfigured,
  requestDeviceCode,
  pollForToken,
  authenticateXbox,
  authorizeXSTS,
  loginMinecraft,
  fetchProfile,
  completeLogin,
  refreshAccount,
  isExpired
};
