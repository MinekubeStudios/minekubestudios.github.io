# Minekube Web – Portal + Section Arrival

Tato verze zachovává celoplošnou Minekube portálovou animaci při přepínání hlavních sekcí.

Nově po dokončení portálu cílová sekce rychle a plynule vyjede, její hlavní obsah se odhalí ve dvou krátkých navazujících krocích a přes stránku proběhne jemná zlato-fialová energetická vlna.

Animace se opakuje při každém přechodu na Domů, Modpacky, Výkon, Instalaci a O projektu. Stejný nájezd se použije také po úvodní boot animaci stránky.

Funkce webu, modpacky, filtry, Store a přímé stahování zůstaly beze změny.


## Úprava této verze

U sekce Domů je odstraněna energetická vstupní vlna, aby se nepřekrývala s ostatními úvodními animacemi. Rychlý nájezd Domů i kompletní přechody ostatních sekcí zůstávají zachované.


## Oprava blikání sekce Domů
- Domů už po úvodní boot animaci nespouští druhý souběžný stránkový nájezd.
- Energetická vstupní vlna je pro Domů zablokovaná v JavaScriptu i CSS.
- Při návratu přes navigaci zůstává pouze jeden čistý nájezd celé sekce, bez animování jejích vnitřních částí podruhé.
- Ostatní sekce a jejich vlny zůstaly beze změny.
