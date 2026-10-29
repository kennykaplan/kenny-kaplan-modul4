# AGENTS.md

Överlämning till kodagenter (Codex m.fl.). Läs detta innan du ändrar något.

## Projektet

Repot har två saker:

- **Roten** (`index.html`, `kontakt.html`, `styles.css`, `img/`): en gammal skolsajt för "Tudors Rooms". **Rör inte.**
- **`ny/`**: den nya portfolio- och företagssajten för **Kaplan Digital Solutions**. Allt arbete sker här.

Branch: `claude/ecstatic-fermi-hoxs2p` (inte mergad till `main`). Skapa inte pull request om inte ägaren ber om det.

## Krav (från ägaren)

- **Vanilla HTML, CSS och JS.** Inga ramverk, inget byggsteg, inga npm-beroenden.
- **Ljust tema.** Hela sajten är ljus, inget mörkt läge.
- Ska se modern, premium och handbyggd ut, inte "AI-slop": inga lila/blå gradienter, glassmorphism, ikonkort i rader om tre, stockbilder eller fraser som "sömlösa lösningar".
- Svenska i texten.
- Prestanda och tillgänglighet är en del av kvaliteten (se nedan).

## Filer i `ny/`

| Fil | Roll |
| --- | --- |
| `index.html` | Hela sidan: hero, band, tjänster, arbeten, om, kontakt, footer. |
| `styles.css` | All styling. Designvariabler överst (`--bg`, `--fg`, `--ease`, fonter). |
| `script.js` | Scroll-reveal, scroll-koreografi (textband, ord-för-ord-tändning i "Om"), scrollspy i menyn, projektförhandsvisning vid hover. |
| `liquid-hero.js` | WebGL2-partikelmotorn för heron (GPGPU-simulering) + sidlogik: layout, pekare, intro, svepning, pausfunktion. Portad från en React-komponent till vanilla JS. |
| `sculpture.js` | Genererar skulpturen i en offscreen-canvas (asynkront, tidsuppdelat). `name()` = företagsnamnet (standard), `make()` = det vridna bandet (alternativ). |

Laddningsordning i `index.html`: `script.js`, `sculpture.js`, `liquid-hero.js`.

## Hero (viktigt att förstå)

- Skulpturen är **företagsnamnet "Kaplan Digital Solutions"** ritat i canvas: Geist (Kaplan Digital) + Instrument Serif kursiv (Solutions), fibrig struktur och stoft längs kanterna. Mobil: tre rader.
- Partiklarna samplas från pixlarna i den bilden. Pekaren gör materialet flytande; det sätter sig tillbaka.
- Styrs med attribut på `<section id="hem">`:
  - `data-shape="name"` (standard) eller `"ribbon"`.
  - `data-density` (standard 1, 0.15–2) styr partikeltäthet.
  - `data-src="bild.png"` byter ut den genererade skulpturen mot egen bild (kräver CORS och helst transparent bakgrund).
- WebGL startar efter första målning (idle). Utan WebGL2 visas den statiska bilden.
- Respekterar `prefers-reduced-motion`. Pausknappen `.lq__pause` är medvetet **osynlig** (ägarens önskemål), men nåbar med tangentbord/skärmläsare (WCAG 2.2.2). Ta inte bort den utan att fråga.
- Mobil/svag enhet får lättare kvalitet (färre partiklar, lägre pixeltäthet, ingen ambient rörelse).

## Vad som är platshållare (fyll inte i på eget bevåg)

Hitta aldrig på kunder, siffror, citat eller kontaktuppgifter. Dessa är avsiktligt markerade med `[hakparentes]` och väntar på ägarens riktiga innehåll:

- Projekten i "Arbeten" (`[Projekt ett]` …)
- `[ditt namn]`, om-texten, `[Ort]`, `[År]`
- `[din e-post]`, `[Telefon]` och `mailto:info@example.se`

## Kvalitetsregler

- Kärnvärden (Googles gränser): LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Senaste lokala mätning (utan nätverk och WebGL): CLS ≈ 0,002, inga långa uppgifter. Prestanda på riktig mobil och full partikeltäthet är **inte mätt**.
- Hero-rubriken ska synas direkt utan JS-beroende; sidan ska fungera utan JavaScript.
- Rörelse bör vara syftesstyrd; UI-övergångar ca 200–500 ms. Alla animationer ska stängas av eller förenklas vid `prefers-reduced-motion`.
- Behåll kontrast och synlig fokus. Inga layoutförskjutningar vid laddning.
- Ändra bara det uppgiften kräver. Ingen orelaterad refaktorering.

## Köra och testa lokalt

```bash
cd ny && python3 -m http.server 8010
```

Öppna `http://localhost:8010`. Mobil på samma Wi-Fi: `http://<Macens-IP>:8010` (skriv `http://` explicit; `https://` fungerar inte mot den här servern).

Verifiera efter ändring (minsta relevanta): inga konsolfel, ingen horisontell scroll vid 390 px och 1440 px, hero fungerar med och utan `prefers-reduced-motion`.

## Kända begränsningar / möjligt nästa steg

- Typsnitten laddas från Google Fonts; offline faller namnet tillbaka till Arial/Georgia.
- Riktiga projekt med bilder/video + hover-effekt i portfolion väntar på material.
- Ingen pull request har skapats.
