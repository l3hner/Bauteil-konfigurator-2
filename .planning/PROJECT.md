# Lehner Haus Konfigurator v2

## What This Is

Ein Web-Tool für Lehner Haus Fachberater, das direkt beim Kunden oder im Büro eingesetzt wird, um Hausbaukomponenten zu konfigurieren und daraus eine professionelle, marketing- und vertriebsstarke PDF-Leistungsbeschreibung zu generieren. Die PDF soll den Kunden emotional überzeugen und gleichzeitig sachlich informieren — wie eine Hochglanz-Broschüre mit technischer Substanz.

## Core Value

Die Fachberater können in wenigen Minuten eine personalisierte, visuell überzeugende Leistungsbeschreibung erstellen, die den Kunden vom Lehner Haus Angebot begeistert und zum Vertragsabschluss führt.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — from existing codebase. -->

- ✓ Fachberater kann Bauherr-Daten erfassen (Name, E-Mail, Telefon) — existing
- ✓ Fachberater kann KfW-Standard wählen (KFW55/KFW40) — existing
- ✓ Fachberater kann Außenwandsystem aus Katalog wählen (KfW-gefiltert) — existing
- ✓ Fachberater kann Innenwandsystem aus Katalog wählen — existing
- ✓ Fachberater kann Fenstersystem aus Katalog wählen — existing
- ✓ Fachberater kann Dacheindeckung aus Katalog wählen — existing
- ✓ Fachberater kann Haustyp aus Katalog wählen — existing
- ✓ Fachberater kann Heizungssystem aus Katalog wählen — existing
- ✓ Fachberater kann Lüftungssystem aus Katalog wählen (KfW-abhängig) — existing
- ✓ Fachberater kann Räume pro Geschoss definieren (EG, OG, UG) — existing
- ✓ Fachberater kann Eigenleistungen erfassen — existing
- ✓ Katalog-Einträge haben Bilder, Beschreibungen und Vorteile — existing
- ✓ PDF wird automatisch generiert mit Titelseite, Komponentenseiten, Raumplanung — existing
- ✓ PDF ist als Download und inline verfügbar — existing
- ✓ Whitelist-Validierung der Auswahl gegen Katalog — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] PDF-Qualität auf Hochglanz-Broschüren-Niveau bringen (emotionale Bilder + sachliche Fakten)
- [ ] Modernes, geführtes Formular als Schritt-für-Schritt Wizard
- [ ] Tablet-optimierte Bedienung für den Einsatz beim Kunden vor Ort
- [ ] Schnelle Durchlaufzeit (2-3 Minuten für eine komplette Konfiguration)
- [ ] Neue Katalogkategorie: Dächer (Dachformen, Materialien)
- [ ] Neue Katalogkategorie: Treppen (Innen-/Außentreppen)
- [ ] Bestehende Katalogkategorien qualitativ verbessern (bessere Texte, Bilder, Verkaufsargumente)
- [ ] Marketing-Texte in der PDF: emotionale Ansprache, Kundenvorteile, Verkaufsargumente
- [ ] Professionelles PDF-Layout mit großen Produktbildern und modernem Design
- [ ] Vergleichsinformationen und USPs für jede Komponente in der PDF

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Preiskalkulation / Preisangaben in der PDF — nicht Teil der Leistungsbeschreibung, separate Kalkulation
- Kundenselbstbedienung — Tool ist ausschließlich für Fachberater
- CRM-Integration — kein Anschluss an externe Systeme in dieser Version
- Mehrsprachigkeit — nur Deutsch, nur deutscher Markt
- Benutzer-Accounts / Login — Fachberater brauchen keinen Account

## Context

- Lehner Haus GmbH & Co. KG baut Fertighäuser
- Fachberater nutzen das Tool beim Erstgespräch mit Interessenten und zur Nachbereitung
- Die PDF-Leistungsbeschreibung ist das zentrale Verkaufsdokument
- Bestehende Codebase: Node.js + Express + EJS + PDFKit, funktioniert, aber PDF und Formular sind nicht auf Vertriebsniveau
- Katalog hat 7 Kategorien (walls, innenwalls, windows, tiles, haustypen, heizung, lueftung)
- Neue Kategorien gefordert: Dächer, Treppen
- Deployment auf Render.com
- Branding: Lehner Haus Corporate Colors (#003366 blau, #C8102E rot)

## Constraints

- **Tech Stack**: Node.js + Express + EJS + PDFKit beibehalten — bewährte Basis
- **Sprache**: Alle UI-Texte und PDF-Inhalte auf Deutsch
- **Deployment**: Render.com kompatibel bleiben
- **Bilder**: Produktbilder in `assets/variants/` — hochwertige Bilder müssen vom Kunden geliefert werden
- **Kein Build-Step**: Kein Webpack/Vite — direktes Node.js bleibt

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PDFKit beibehalten statt Puppeteer/HTML-to-PDF | Volle Kontrolle über Layout, keine Browser-Abhängigkeit, bewährt | — Pending |
| Schritt-für-Schritt Wizard statt Single-Page-Formular | Bessere UX beim Kunden, übersichtlicher, tablet-freundlich | — Pending |
| Emotionale + sachliche PDF-Struktur | Erst begeistern (Bilder, Marketing), dann informieren (Technik, Vergleich) | — Pending |

---
*Last updated: 2026-02-17 after initialization*
