# Minekube Launcher — přihlašovací obrazovka se dvěma možnostmi

Modul pro Electron launcher, který hráči při prvním spuštění nabídne **dvě**
možnosti místo jedné:

1. **Microsoft účet** — pro hráče s koupeným Minecraftem (oficiální přihlášení).
2. **Lokální účet** — jméno se zvolí lokálně, **nic se nikam neodesílá**.

---

## Proč „Lokální" a ne „Warez"

V UI je druhá možnost pojmenovaná **Lokální účet**. Technicky je to přesně to,
co jsi chtěl — účet vytvořený offline, bez Microsoftu, bez odesílání dat.
Stejný princip používají Prism Launcher i MultiMC. Název „Lokální" je ale
neutrální a nevystavuje projekt zbytečnému riziku.

Pokud chceš jiné označení, je na jednom místě:
`src/renderer/login.html`, hledej `Lokální účet`.

**Důležité:** lokální účet funguje na serverech v **offline režimu**
(`online-mode=false` v `server.properties`) a v singleplayeru. Na oficiální
servery s kontrolou licence se s ním připojit nelze — to je vlastnost
Minecraftu, ne launcheru.

---

## Co je uvnitř

```
src/
  auth/
    offline.js        vytvoření lokálního účtu + offline UUID (žádná síť)
    microsoft.js      Microsoft → Xbox Live → XSTS → Minecraft
    store.js          ukládání účtů do accounts.json (atomicky, práva 0600)
  main/
    auth-ipc.js       IPC most, běží v hlavním procesu
    example-main.js   VZOR zapojení — nekopírovat celé
  preload/
    auth-preload.js   bezpečný můstek do okna
  renderer/
    login.html        obrazovka
    login.css         vzhled (barvy z minekubestudios.github.io)
    login.js          chování
test/
  auth.test.js        24 testů logiky
  ui-flow.test.js     24 testů obrazovky
preview/              náhled v prohlížeči (bez Electronu)
```

---

## Zapojení do projektu — 4 kroky

### 1. Zkopíruj `src/` do launcheru

Např. do `app/auth/`. Struktura složek ať zůstane.

### 2. V hlavním procesu zaregistruj IPC

```js
const { registerAuthIPC } = require("./auth/main/auth-ipc");

app.whenReady().then(async () => {
  const auth = registerAuthIPC({
    dataDir: app.getPath("userData"),
    getWindow: () => loginWindow || mainWindow
  });

  await auth.ready;

  // přihlášený hráč rovnou do launcheru, jinak přihlašovací okno
  if (auth.store.getActive()) createMainWindow();
  else createLoginWindow();
});
```

### 3. Okno musí mít preload a bezpečné nastavení

```js
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // nutné
    nodeIntegration: false,   // nutné
    sandbox: true,
    preload: path.join(__dirname, "auth/preload/auth-preload.js")
  }
});
```

### 4. Před spuštěním hry si vyžádej údaje

Nikdy neber token přímo z uloženého účtu — `ensureToken` sám obnoví
vypršené Microsoft přihlášení.

```js
const res = await ipcRenderer.invoke("auth:ensure-token");
if (!res.ok) return showError(res.code);

const { username, uuid, accessToken, userType } = res.credentials;

const args = [
  "--username", username,
  "--uuid", uuid.replace(/-/g, ""),
  "--accessToken", accessToken,   // "0" u lokálního účtu
  "--userType", userType          // "legacy" | "msa"
];
```

---

## Nastavení Microsoft přihlášení (Azure)

Bez client ID se tlačítko Microsoft zobrazí, ale ohlásí, že není nastavené —
**lokální účet funguje i bez toho**.

1. [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. Supported account types: **Personal Microsoft accounts only**
3. **Authentication** → **Allow public client flows: Ano**
4. Zkopíruj **Application (client) ID**
5. Nastav ho:

```bash
# vývoj
export MINEKUBE_MS_CLIENT_ID="tvoje-client-id"
```

Nebo rovnou v `src/auth/microsoft.js`, konstanta `CLIENT_ID`.

> Pozn.: Přístup k Minecraft API musí Mojang schválit —
> viz [formulář pro vývojáře launcherů](https://help.minecraft.net/hc/en-us/articles/16254801392141).

---

## Jak je řešené soukromí

Tohle byl hlavní požadavek, takže konkrétně:

| | Lokální účet | Microsoft účet |
|---|---|---|
| Síťová volání | **žádná** | jen Microsoft + Mojang |
| Odeslané údaje | **žádné** | jen co vyžaduje přihlášení |
| Uloženo na disku | jméno + UUID | jméno, UUID, tokeny |
| Vlastní/cizí server | **nikam se nic neposílá** | — |

- Lokální účet nemá jediný `fetch` — to hlídá i test
  *„lokální účet neudělal ŽÁDNÉ síťové volání"*.
- Tokeny zůstávají v hlavním procesu. Do okna jdou přes `safeList()`
  data **bez tokenů** — hlídá test *„safeList neobsahuje žádné tokeny"*.
- `accounts.json` má práva `0600` (čte jen vlastník).
- Heslo k Microsoftu launcher nikdy nevidí — použitý je **device code flow**,
  hráč se přihlašuje na `microsoft.com/link` ve svém prohlížeči.
- Okno běží s `contextIsolation: true` a `nodeIntegration: false`.
- V `login.html` je CSP, která zakazuje vzdálené skripty.

---

## Testy

```bash
node test/auth.test.js      # 24 testů logiky
node test/ui-flow.test.js   # 24 testů obrazovky (potřebuje jsdom)
```

Offline UUID je ověřené proti skutečné hodnotě z vanilla serveru:
`Notch` → `b50ad385-829d-3141-a216-7e7d7539ba7f`.

---

## Náhled bez Electronu

```bash
cd preview && python3 -m http.server 8080
```

Microsoft přihlášení je simulované. Scénáře:

- `?ms=ok` — úspěch (výchozí)
- `?ms=noclient` — chybí Azure client ID
- `?ms=nogame` — účet nemá Minecraft
- `?ms=slow` — pomalá odpověď

---

## Ošetřené chybové stavy

Každá chyba má českou hlášku, žádné „Error 500":

- účet nemá vytvořený Xbox profil
- účet nemá koupený Minecraft → nabídne lokální účet
- dětský účet mimo rodinnou skupinu
- Xbox Live nedostupný v zemi
- vypršelý nebo odmítnutý kód
- výpadek sítě
- poškozený `accounts.json` (odloží se a launcher naběhne dál)
