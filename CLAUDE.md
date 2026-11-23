# CLAUDE.md

Lehner Haus Bauteilkonfigurator: Fachberater wählen Haustyp, Energiestandard und Bauteile und erhalten eine persönliche PDF-Leistungsbeschreibung. Alles auf Deutsch. Dieses Repo ist öffentlich: keine internen Namen, Pfade oder Kundendaten in Code, Kommentaren und dieser Datei. Interne Notizen (Ablage, Stand, Deployment) stehen in der `CLAUDE.md` eine Ebene über dem Repo.

Der Arbeitsordner liegt in einem synchronisierten Cloud-Ordner; `node_modules` ist vom Sync ausgenommen.

## Befehle

| Zweck | Befehl |
|---|---|
| Lokal starten (Port 3020) | `node scripts/dev-3020.cjs` bzw. Preview-Eintrag `bauteilkonfigurator` |
| Start wie auf Render | `npm start` (Port aus `.env`, Standard 3000) |
| Tests | `npm test` (Jest + supertest, 5 Suites) |
| Lint / Format | `npm run lint`, `npm run format` |
| Alte Submissions migrieren | `npm run migrate` |
| Bauteilseiten prüfen | `node scripts/check-pdf-layout.js` rendert alle Katalogvarianten nach `output/_layout-check.pdf` und meldet Füllgrad und abgeschnittene Abschnitte. Nach jeder Änderung an `componentPage.js` oder an Katalogtexten laufen lassen. |

Nach Änderungen an `src/` den Server neu starten (kein Hot Reload). EJS-Views werden lokal nicht gecacht.

**Sync bremst:** Solange der Cloud-Sync den Ordner abgleicht (nach Umzug, großem Checkout, vielen neuen Bildern), dauert jeder Dateizugriff Sekunden. Eine PDF braucht dann rund 60 s statt 3 s, Jest läuft in den 5-s-Timeout und `git log -- <pfad>` hängt minutenlang. Das ist kein Codefehler: abwarten oder `npx jest --testTimeout=240000`.

## Aufbau

Node (>=18), Express, EJS, PDFKit, sharp. Kein Build-Schritt, keine Datenbank.

| Pfad | Zweck |
|---|---|
| `src/app.js`, `src/server.js` | Express-App (helmet, Rate-Limit, CSRF per Double-Submit-Cookie) und Start |
| `src/routes/` | `/` Formular, `/submit` speichern + PDF, `/result/:id`, `/pdf/:id` (`?download=1`), `/health` |
| `src/services/catalogService.js` | Katalog laden, KfW-Filter, Whitelist-Validierung |
| `src/services/submissionService.js` | Konfigurationen als JSON in `data/submissions/` |
| `src/services/pdf/layout.js` | Farben (Tannengrün `#06402b`), Typografie (Montserrat als `Heading`), Kopf/Fuß, `drawCheck`, `extractAufbauItems` |
| `src/services/pdf/pages/` | Eine Datei je PDF-Seite; Reihenfolge in `index.js` |
| `views/index.ejs` + `views/partials/` | Formular: eine lange Seite mit 17 Abschnitten |
| `public/js/` | Geladen werden `toast.js`, `form-handlers.js`, `kfw-options.js`, `validation.js`. `wizard.js`, `wizardState.js` und `script.js` sind Altbestand: Der Schritt-für-Schritt-Wizard wurde am 18.02.2026 bewusst wieder ausgebaut (Commit `8fc2462`, „restore single-page scrollable form“). Nicht ohne Rückfrage wieder einbinden. |
| `data/catalog.json` | Bauteilkatalog (siehe unten) |
| `assets/variants/<kategorie>/` | Produktbilder; Haustypen haben ein Verzeichnis mit `1.png` bis `3.png` als `filePath` |
| `output/` | Erzeugte PDFs (nicht in Git) |
| `bauteilinformationen/`, `Styleguide/`, `Logo/`, `PDF VORGABEN/`, `Inspiration/` | Quell- und Vorlagenmaterial, teils nicht in Git |
| `.planning/` | GSD-Planung des Ausbaus vom Februar 2026 (abgeschlossen) |

## Katalog

`data/catalog.json`, 10 Kategorien: `walls` (4, KfW-gefiltert über `kfwCompatible`), `innerwalls` (2), `decken` (2), `windows` (2), `daecher` (2), `tiles` (2), `treppen` (3), `heizung` (2), `lueftung` (3, KfW-abhängig), `haustypen` (6).

**Quelle der Werte ist die Kalkulation/Leistungsbeschreibung 09/2026** (`technicalDetails.position` nennt die Position). Umstellung vom 23.11.2026: `scripts/katalog-auf-kalkulation.js`, Bericht `../ABGLEICH_Katalog-Kalkulation_2026-11-23.md`. Keine Werte, Fabrikate oder Prüfklassen eintragen, die dort nicht stehen. Die Wand- und Lüftungskarten im Formular sind in `public/js/kfw-options.js` doppelt gepflegt und müssen mitgeändert werden.

`totalThickness` steuert die Summenzeile der Technischen Daten: `{ label, value }` gibt sie vor (Wände: Stärke einschließlich Außenputz), `false` blendet sie aus, ohne Angabe wird aus den Schichten gerechnet.

Felder je Eintrag: `id`, `name`, `emotionalHook`, `description`, `kfwCompatible`, `premiumFeatures`, `layers` (Schichtaufbau mit `name`/`value`), `technicalDetails`, `advantages`, `comparisonNotes` (Fragen für den Anbietervergleich), `filePath`, `technicalDrawing`. Schema-Prüfung in `src/utils/catalogSchema.js`.

## PDF

Reihenfolge: Titel, QDF, Konfiguration auf einen Blick, Leistungsübersicht, Qualitätsvorteile, Service, Haustyp, je gewähltem Bauteil eine Seite, Raumplanung und Eigenleistungen (nur wenn ausgefüllt), Vergleichs-Checkliste, Glossar, Beraterseite.

- Die festen Texte dieser Seiten stehen direkt in den Seitendateien, nicht im Katalog.
- Bauteilseiten (`componentPage.js`): Schriftgrößen stehen oben in `SIZE` (Fließtext 9 bis 9,5 pt, Bild 225 pt). `renderComponent` gibt `{ endY, dropped }` zurück; `dropped` darf im Layout-Check nicht vorkommen.
- PDFKit arbeitet mit festen Koordinaten. Bei mehrzeiligem Text die Höhe mit `heightOfString` rechnen, sonst überlappen Zeilen.
- Die eingebaute Helvetica kennt keine Sonderzeichen wie ✓. Dafür `layout.drawCheck` verwenden.

## Regeln

- Keine Preise in der PDF.
- Werbeaussagen nur mit Beleg; die Liste der zu prüfenden Sätze steht im Konzept unter `../`.
- Render baut aus GitHub `main`: Jeder Push geht live. Nicht ohne ausdrückliche Freigabe pushen.
