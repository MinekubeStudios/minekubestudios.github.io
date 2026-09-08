# Minekube Studios // Hlavní web (nová verze)

Hlavní stránka postavená **komplet od nuly** — obsahuje pouze **O projektu**
a **Studio Minekube**. Barvy, typografie, karty, boot loader, portálové
přechody a veškeré animace odpovídají původnímu webu
(`https://minekubestudios.github.io`).

## Struktura

| Soubor | Popis |
|---|---|
| `index.html` | Nová stránka: Domů (hero) → O projektu → Studio → CTA → patička |
| `styles.css` | Původní design systém (411 kB, beze změny) + nový blok `MAIN PAGE V2` pro sekci Studio |
| `app.js` | Nový skript: boot sekvence, portálové přechody sekcí, reveal animace, 3D tilt karet, Store FX, motiv, toast, modaly |
| `assets/favicon.svg` | Favicon z brand znaku (původní web ho neměl — 404) |

## Sekce stránky

1. **Domů (`#home`)** — hero s aurora pozadím, orbit modulemi ekosystému
   (MODPACKY → `modpacky/`, STORE → Store, OPEN SOURCE → `#studio`) a
   odkazem „NÁSLEDUJÍCÍ STRÁNKA: MODPACKY" do nové stránky modpacků.
2. **O projektu (`#projekt`)** — původní about karta (manifest projektu +
   3D emblém) a níže 4 karty principů (Vanilla friendly, Bezpečné
   aktualizace, Čistá konfigurace, Transparentní changelog).
3. **Studio Minekube (`#studio`)** — karta „Kdo jsme" (hodnoty + fakty +
   emblém) a 4 karty pilířů: Modpacky (LIVE → `modpacky/`), Komunitní
   server (VE VÝVOJI — tlačítko „Brzy" s tostem), Store (OPEN → Store),
   Open source (BUILD TOGETHER).
4. **CTA + patička** — CTA na modpacky, patička s dialogy (Changelog,
   Kompatibilita, Licence) a odkazy komunity.

## Navigace

- **Domů / O projektu / Studio** — kotvy s portálovým přechodem
  (MK-01, MK-02, MK-03).
- **Modpacky** — odkaz na `modpacky/` (druhá stránka, bude dělaná
  následně). Uloženo materiály: `/home/user/modpacky-save/`.

## Jak spustit

```bash
cd site
python3 -m http.server 8080 --bind 0.0.0.0
```

## Poznámky

- Odkazy na Store a Game Jolt vedou na produkční URL
  (`https://minekubestudios.github.io/store/`, Game Jolt) — stejné jako v
  původním webu.
- Discord a GitHub v patičce jsou placeholdery (`#`), stejně jako v
  původním webu — doplň vlastní odkazy.
- Tmavý/světlý motiv, boot loader a Store FX fungují přesně jako v originále.
