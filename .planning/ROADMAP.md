# Roadmap: Lehner Haus Konfigurator v2

## Overview

Das bestehende Konfigurator-Tool wird von einem funktionierenden Grundzustand auf Vertriebsniveau gebracht. Die Arbeit folgt einer strikten Reihenfolge: zuerst die technischen Voraussetzungen (Katalogdaten, PDF-Architektur), dann die sichtbare Qualitatsverbesserung (PDF-Design, Inhalte), dann die Benutzeroberfläche (Wizard). PDF-Track und Wizard-Track sind nach Phase 2 unabhängig voneinander.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Catalog Expansion** - Neue Katalogkategorien Dächer und Treppen mit Daten, Validierung und Migrations-Skript ✓ (2026-02-18)
- [x] **Phase 2: PDF Architektur** - pdfService.js in modulare Einzelseiten-Module zerlegen + Image-Pipeline mit sharp einrichten ✓ (2026-02-18)
- [x] **Phase 3: PDF Design** - Emotionale Titelseite, visuell überzeugende Komponentenseiten und Executive Summary One-Pager ✓ (2026-02-18)
- [x] **Phase 4: PDF Inhalte und Bugs** - Eigenleistungen-Bug schließen, Raumplanung reparieren, Marketing-Texte einpflegen, Dateigröße unter 5 MB bringen ✓ (2026-02-18)
- [ ] **Phase 5: Wizard UI** - Schritt-für-Schritt Wizard mit Tablet-Optimierung, Produktbildern und verbesserter Validierung

## Phase Details

### Phase 1: Catalog Expansion
**Goal**: Fachberater kann Dach- und Treppenoptionen konfigurieren, und alle Submissions (alt und neu) werden fehlerfrei verarbeitet
**Depends on**: Nothing (first phase)
**Requirements**: KAT-01, KAT-02
**Success Criteria** (what must be TRUE):
  1. Fachberater kann eine Dachform aus der Katalogliste auswählen und das Formular lässt sich erfolgreich abschicken
  2. Fachberater kann eine Treppenoption aus der Katalogliste auswählen und das Formular lässt sich erfolgreich abschicken
  3. Bestehende Submissions (ohne Dach/Treppen-Felder) werden ohne 500-Fehler geladen und als PDF generiert
  4. Die neuen Kategorien sind in der Whitelist-Validierung enthalten — ungültige Auswahlen werden mit deutschem Fehlertext abgelehnt
**Plans**: 3 plans (2 waves)

Plans:
- [ ] 01-01-PLAN.md — Katalogdaten (catalog.json) + catalogService Getter/Validierung/Fallback + Platzhalterbilder
- [ ] 01-02-PLAN.md — UI-Integration: Routes, Formular, pdfService (alle 4 Methoden), Result-Seite
- [ ] 01-03-PLAN.md — Migrationsscript für bestehende Submissions + schemaVersion-Feld

### Phase 2: PDF Architektur
**Goal**: pdfService.js ist in isolierte Seitenmodule zerlegt, sodass visuelle Änderungen an einer Seite keine anderen Seiten beschädigen, und alle Produktbilder werden vor dem Einbetten komprimiert
**Depends on**: Phase 1
**Requirements**: TECH-01, TECH-02
**Success Criteria** (what must be TRUE):
  1. Das generierte PDF sieht identisch aus wie vor der Refaktorierung (kein visueller Regressions-Fehler)
  2. Jede PDF-Seite hat ein eigenes Modul unter `src/services/pdf/pages/` mit den Exports `condition` und `render`
  3. `pdfService.js` ist ein Orchestrator unter 50 Zeilen, der nur die Seitenmodule aufruft
  4. Produktbilder werden vor dem PDF-Einbetten durch sharp auf unter 400 KB komprimiert — die generierten PDFs sind messbar kleiner
**Plans**: 3 plans (3 waves)

Plans:
- [ ] 02-01-PLAN.md — layout.js extrahieren: shared Brand-Konstanten (colors, typography, layout) und Draw-Helper (drawHeader, drawFooter, drawImagePlaceholder, extractAufbauItems, extractQualityItems, getGrundstueckText)
- [ ] 02-02-PLAN.md — Alle 13 Seiten in Einzelmodule unter src/services/pdf/pages/ extrahieren + pdfService.js zum Orchestrator (<50 Zeilen) refactoren + Dead Code entfernen
- [ ] 02-03-PLAN.md — sharp-Image-Pipeline: imageService.js mit resize+compress+cache, sharp als Produktionsdependency, Einbindung in componentPage/haustypPage/titlePage

### Phase 3: PDF Design
**Goal**: Die PDF wirkt wie eine Hochglanz-Broschüre — emotionale Titelseite mit Hero-Bild, klare visuelle Hierarchie auf jeder Komponentenseite, und ein prägnanter Überblick auf einer Seite
**Depends on**: Phase 2
**Requirements**: PDF-01, PDF-02, PDF-03
**Success Criteria** (what must be TRUE):
  1. Die Titelseite zeigt ein großes Hero-Bild eines Lehner Hauses mit Corporate Branding und dem personalisierten Kundennamen — der erste Eindruck ist emotio­nal überzeugend
  2. Jede Komponentenseite folgt der Reihenfolge: großes Produktbild oben, dann emotionale Überschrift, dann Vorteils-Bullets, dann technische Details — kein Text kommt vor dem Bild
  3. Ein Executive Summary One-Pager mit allen Key Facts (Haustyp, Wandsystem, KfW-Standard, Heizung, Lüftung, Dach, Treppe) ist in der PDF enthalten
  4. Lehner Haus Corporate Colors (#003366, #C8102E) und eine einheitliche Typographie prägen das gesamte Dokument konsistent
**Plans**: 3 plans (2 waves)

Plans:
- [ ] 03-01-PLAN.md — Design-Foundation + emotionale Titelseite: Corporate Colors (#003366/#C8102E) in layout.js, Montserrat-Font, Hero-Bild des gewaehlten Haustyps mit Gradient-Overlay
- [ ] 03-02-PLAN.md — Komponentenseiten (componentPage + haustypPage) nach visueller Hierarchie umbauen: grosses Bild oben, Ueberschrift, Vorteile, Specs
- [ ] 03-03-PLAN.md — Executive Summary One-Pager: 3x3 Grid mit allen 9 Kategorien, Bauherr-Daten, technische Highlights

### Phase 4: PDF Inhalte und Bugs
**Goal**: Alle konfigurierten Daten erscheinen korrekt in der PDF, Marketing-Texte sind verkaufsstark formuliert, und die Dateigröße bleibt unter 5 MB
**Depends on**: Phase 3
**Requirements**: INH-01, INH-02, INH-03, INH-04
**Success Criteria** (what must be TRUE):
  1. Eigenleistungen-Seite erscheint in der PDF wenn Eigenleistungen erfasst wurden — die Daten werden vollständig und korrekt gerendert
  2. Raumplanung-Seite zeigt alle Räume aus allen konfigurierten Geschossen konsistent und vollständig an
  3. Jede Komponentenseite enthält emotionale Beschreibungen und Verkaufsargumente — kein generischer Platzhaltertext ist mehr vorhanden
  4. Ein generiertes PDF mit allen Komponenten und Produktbildern ist unter 5 MB groß (gemessen nach der Generierung)
**Plans**: 3 plans (1 wave)

Plans:
- [ ] 04-01-PLAN.md — Eigenleistungen-Seitenmodul erstellen und registrieren + Raumplanung y-Overflow-Schutz
- [ ] 04-02-PLAN.md — emotionalHook-Feld fuer alle 32 Katalogeintraege + componentPage-Renderer anpassen
- [ ] 04-03-PLAN.md — Image-Komprimierung tunen: Alpha-Flatten + maxWidth 600 fuer PDF unter 5 MB

### Phase 5: Wizard UI
**Goal**: Fachberater können die Konfiguration mit wenigen Touch-Gesten auf einem Tablet durchführen — eine Sektion sichtbar, klare Navigation, Produktbilder bei jeder Auswahl
**Depends on**: Phase 1
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04
**Success Criteria** (what must be TRUE):
  1. Das Formular zeigt zu jedem Zeitpunkt nur einen Konfigurationsschritt — Fachberater navigieren mit Vor/Zurück-Buttons und sehen den Fortschritt in einem Fortschrittsbalken
  2. Das Formular funktioniert vollständig auf einem iPad oder Surface ohne horizontales Scrollen — alle Tap-Targets sind mindestens 44px groß
  3. Wenn Pflichtfelder fehlen, zeigt der Wizard eine verständliche deutsche Fehlermeldung direkt beim betreffenden Feld — das Formular sendet nicht ab bis alle Pflichtfelder gültig sind
  4. Bei jeder Komponentenauswahl (Wand, Fenster, Heizung, etc.) sind Produktbilder als Teil der Auswahloptionen sichtbar — nicht nur Texte
  5. Wenn der Browser-Tab aktualisiert wird oder die Zurück-Taste gedrückt wird, bleiben alle bereits eingegebenen Daten erhalten
**Plans**: 3 plans (3 waves)

Plans:
- [ ] 05-01-PLAN.md — Wizard-Architektur: wizard.js (Step-Controller mit 17 Steps), wizardState.js (sessionStorage-Persistenz), script.js-Refactoring, index.ejs-Verdrahtung
- [ ] 05-02-PLAN.md — Produktbilder in allen Katalog-Radio-Cards (8 Sektionen) + Server-seitige Pflichtfeld-Validierung in submit.js
- [ ] 05-03-PLAN.md — Tablet-Optimierung: 44px+ Touch-Targets, responsive Radio-Card-Grids, Wizard-Navigation-Styling, Validierungsfehler-CSS

## Progress

**Execution Order:**
Phases 1 → 2 → 3 → 4 execute sequentially (each depends on prior). Phase 5 depends only on Phase 1 and can begin after Phase 1 is complete.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Catalog Expansion | 3/3 | ✓ Complete | 2026-02-18 |
| 2. PDF Architektur | 3/3 | ✓ Complete | 2026-02-18 |
| 3. PDF Design | 3/3 | ✓ Complete | 2026-02-18 |
| 4. PDF Inhalte und Bugs | 3/3 | ✓ Complete | 2026-02-18 |
| 5. Wizard UI | 0/3 | Not started | - |
