# Requirements: Lehner Haus Konfigurator v2

**Defined:** 2026-02-18
**Core Value:** Fachberater erstellen in wenigen Minuten eine personalisierte, visuell überzeugende Leistungsbeschreibung, die den Kunden begeistert und zum Vertragsabschluss führt.

## v1 Requirements

Requirements für die Überarbeitung. Jedes Requirement mappt auf Roadmap-Phasen.

### PDF Design

- [ ] **PDF-01**: Emotionale Titelseite mit großem Hero-Bild (Lifestyle-Foto eines Lehner Hauses), Corporate Branding und personalisiertem Kundennamen
- [ ] **PDF-02**: Jede Komponentenseite folgt der Hierarchie: großes Produktbild → emotionale Überschrift → Vorteile-Bullets → technische Details/Specs
- [ ] **PDF-03**: Executive Summary One-Pager mit allen Key Facts (Haustyp, Wandsystem, KfW-Standard, Heizung, etc.) auf einer Seite

### PDF Inhalte

- [ ] **INH-01**: Eigenleistungen-Seite wird korrekt in der PDF gerendert (Daten werden bereits erfasst, aber nicht dargestellt — Bug fix)
- [ ] **INH-02**: Raumplanung-Seite produziert konsistente, vollständige Ausgabe für alle Geschosse
- [ ] **INH-03**: Marketing-orientierte Texte pro Komponente: emotionale Beschreibungen, Kundenvorteile und Verkaufsargumente
- [ ] **INH-04**: PDF-Dateigröße unter 5MB durch Bildkomprimierung (aktuell bis 23MB)

### Wizard UI

- [ ] **WIZ-01**: Schritt-für-Schritt Wizard mit einem Bereich pro Schritt sichtbar, klarem Fortschrittsbalken und Navigation (vor/zurück)
- [ ] **WIZ-02**: Tablet-optimierte Touch-Bedienung mit mindestens 44px Tap-Targets, responsive für iPad und Surface
- [ ] **WIZ-03**: Verbesserte Formular-Validierung: server-seitige Validierung aller Pflichtfelder mit klaren deutschen Fehlermeldungen
- [ ] **WIZ-04**: Produktbilder bei der Komponentenauswahl im Formular anzeigen (nicht nur Textoptionen)

### Katalog

- [ ] **KAT-01**: Neue Katalogkategorie "Dächer" mit Dachformen und Materialoptionen (inkl. Formularfeld, Validierung, PDF-Seite)
- [ ] **KAT-02**: Neue Katalogkategorie "Treppen" mit Innen- und Außentreppen (inkl. Formularfeld, Validierung, PDF-Seite)

### Technische Qualität

- [ ] **TECH-01**: pdfService.js (~1.672 Zeilen) in modulare Einzelseiten-Module zerlegen für Wartbarkeit
- [ ] **TECH-02**: Bild-Pipeline mit sharp für automatische Komprimierung und Optimierung der Produktbilder

## v2 Requirements

Für spätere Releases vorgemerkt. Nicht im aktuellen Roadmap.

### PDF Erweiterungen

- **PDF-V2-01**: "Warum Lehner Haus?" Vergleichs-Checklist (U-Wert, Brandschutz, Garantie)
- **PDF-V2-02**: Berater-Foto in der Kontaktseite (erfordert Upload-Funktion)
- **PDF-V2-03**: PDF-Regenerierung für bestehende Submissions ohne Neueingabe

### UX Erweiterungen

- **UX-V2-01**: Berater-Personalisierung (Name, Foto, Kontaktdaten)
- **UX-V2-02**: Submissions-Übersicht für Fachberater

### Infrastruktur

- **INFRA-V2-01**: Rate Limiting und Health Endpoint
- **INFRA-V2-02**: Render.com Persistent Storage Klärung

## Out of Scope

Explizit ausgeschlossen. Dokumentiert um Scope Creep zu verhindern.

| Feature | Reason |
|---------|--------|
| Preiskalkulation / Preise in PDF | Preise sind immer individuell; angezeigte Beträge würden als verbindlich fehlinterpretiert |
| Kunden-Selbstbedienung | Tool ist exklusiv für Fachberater; Selbstbedienung senkt Conversion |
| CRM/ERP-Integration | Komplexität übersteigt ROI bei aktuellem Nutzungsumfang |
| Benutzer-Accounts / Login | Kein Mehrwert für internes Ein-Firma-Tool |
| Mehrsprachigkeit | Nur deutscher Markt |
| 3D-Visualisierung | Unverhältnismäßiger Aufwand; professionelle Fotografie ist überzeugender |
| Automatischer E-Mail-Versand | DSGVO-Consent erforderlich; Berater soll persönlich senden |
| Echtzeit-Energiekostenrechner | Erfordert Live-Daten; falsche Schätzungen schaden dem Vertrauen |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PDF-01 | — | Pending |
| PDF-02 | — | Pending |
| PDF-03 | — | Pending |
| INH-01 | — | Pending |
| INH-02 | — | Pending |
| INH-03 | — | Pending |
| INH-04 | — | Pending |
| WIZ-01 | — | Pending |
| WIZ-02 | — | Pending |
| WIZ-03 | — | Pending |
| WIZ-04 | — | Pending |
| KAT-01 | — | Pending |
| KAT-02 | — | Pending |
| TECH-01 | — | Pending |
| TECH-02 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
