# LPW2A – Wohnen am Lagerplatzweg

Vermietungswebsite für den Neubau Lagerplatzweg 2a, 67059 Ludwigshafen (15 Wohnungen).
Vermietung: marktform GmbH. Ziel-Adresse: `lpw2a.marktform.com`.

## Aufbau

- `site/` – die fertige statische Website (wird von Vercel ausgeliefert)
  - `index.html`, `runtime.js`
  - `assets/img` Visualisierungen und Luftbild, `assets/fonts` lokale Schriften, `assets/pdf` Grundriss-PDFs je Wohnung
- `src/Main.dc.html` – Quelle der Seite (Claude-Design-Entwurf)
- `build/` – `build.py` erzeugt `site/index.html` aus der Quelle, `runtime.js` rendert die Vorlage im Browser

Nach Änderungen an `src/Main.dc.html`: `python3 build/build.py`, dann committen.

## Vor dem Livegang

- `GA_ID` in der Quelle auf die echte Google-Analytics-Mess-ID setzen (Analytics lädt nur nach Zustimmung)
- `<meta name="robots" content="noindex">` in `build/build.py` entfernen
- Vormerk- und Buchungsformular an ein Backend anbinden (derzeit Demo, es wird nichts übermittelt)
- Besichtigungstermine (`SLOTS`) durch echte Termine ersetzen
- Platzhalter Hoster/Löschfristen in der Datenschutzerklärung ergänzen

Luftbild: © GeoBasis-DE / LVermGeoRP 2026, dl-de/by-2-0.
