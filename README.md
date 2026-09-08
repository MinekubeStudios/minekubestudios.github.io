# Minekube Web – Modpacky / Server / O projektu

Jednoduchá verze bez celoplošných animací (žádný boot loader, žádný portálový
přechod mezi sekcemi). Navigace pouze plynule scrolluje.

## Struktura stránky

- **Modpacky** – katalog výkonových profilů s filtry, vyhledáváním a řazením
- **Server** – sekce s jediným tlačítkem pro zkopírování IP serveru
  (`play.minekube.eu` – konstanta `SERVER_IP` v `app.js`)
- **O projektu** – sloučený obsah: představení projektu, výkon (benchmarky)
  a instalace

Sekce Domů byla odstraněna. Staré odkazy na `#home` se automaticky přesměrují
na začátek stránky.

## Přepínač jazyka

V hlavičce vedle přepnutí motivu je přepínač jazyka stránky:

- Čeština (výchozí)
- Slovenština
- English

Volba se ukládá do `localStorage` (`minekube-lang`) a překládá celou stránku
včetně karet modpacků, dialogů a oznámení. Slovník je v `app.js` (`I18N`).

## Funkce webu

Modpacky, filtry, oblíbené, Store, přímé stahování z GitHub Release
a světlý/tmavý motiv zůstaly beze změny.
