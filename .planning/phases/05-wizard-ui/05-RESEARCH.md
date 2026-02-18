# Phase 5: Wizard UI - Research

**Researched:** 2026-02-18
**Domain:** Multi-step wizard form UI with vanilla JS, EJS server-rendered templates, tablet-first design
**Confidence:** HIGH

## Summary

Phase 5 converts the existing single-page form (17 sections, all visible simultaneously) into a step-by-step wizard optimized for tablet use in sales meetings. The current codebase uses EJS server-side rendering, vanilla JS, and has no build pipeline -- these constraints are fixed. The wizard must persist state across browser refreshes (sessionStorage), show product images in selection cards, enforce field validation per step, and work flawlessly on iPad/Surface tablets.

The existing codebase already has significant infrastructure that can be leveraged: a progress bar with 16 steps, radio-card selection patterns, inline field validation, KfW-dependent dynamic filtering (walls + lueftung), and product images served via `/assets/variants/`. The transformation is primarily a frontend concern -- the server-side `/submit` POST contract remains unchanged. The catalog data is already embedded in the EJS template via the index route.

**Primary recommendation:** Keep the single `index.ejs` template with all 17 sections rendered server-side, then use vanilla JS to show/hide one section at a time. Add sessionStorage persistence, URL hash navigation for back-button support, per-step validation, and product image thumbnails in radio cards. No new npm dependencies, no build pipeline, no framework.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES2020+) | N/A | Wizard state machine, step navigation, validation | Already in use; no framework justified for a linear wizard |
| EJS | ^3.1.9 | Server-side template rendering | Already in use; wizard shell rendered server-side |
| Express | ^4.18.2 | HTTP routes, static file serving | Already in use; no changes needed for wizard |
| CSS (no preprocessor) | N/A | Wizard layout, tablet responsiveness, animations | Already in use; no build pipeline exists |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sessionStorage API | Browser built-in | Persist wizard state across refresh/back | Every step transition saves state |
| History API (pushState/popState) | Browser built-in | URL hash for back-button support | Step navigation updates `#step-N` |
| IntersectionObserver | Browser built-in | Already in use for scroll spy | Remove or repurpose for wizard |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla JS wizard | Alpine.js (lightweight reactive) | Adds 15KB dependency + learning curve; overkill for linear wizard with ~200 lines of JS |
| sessionStorage | localStorage | localStorage persists across sessions; GDPR concern for PII (name, email, phone) -- sessionStorage clears on tab close |
| URL hash (`#step-3`) | URL query params (`?step=3`) | Hash changes don't trigger page reload; query params would cause a full reload with server-rendered EJS |
| Show/hide sections in one page | Separate EJS partials per step (AJAX-loaded) | Adds N server round-trips; increases complexity; all data is already in the page via catalog embed |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure

```
public/js/
  wizard.js              # NEW: Wizard controller (step machine, navigation, validation)
  wizardState.js         # NEW: sessionStorage read/write/clear
  script.js              # EXISTING: Refactor -- remove progress bar logic (moved to wizard.js),
                         #           keep KfW filtering, addRoom, addEigenleistung, toast
views/
  index.ejs              # EXISTING: Add wizard navigation bar, product images in radio cards,
                         #           wrap each section with wizard step data attributes
public/css/
  style.css              # EXISTING: Add wizard-specific styles (step visibility, nav bar,
                         #           product image cards, tablet breakpoints)
src/routes/
  submit.js              # EXISTING: Add server-side required-field validation with German error messages
  index.js               # EXISTING: No changes needed (catalog data already passed to template)
```

### Pattern 1: Show/Hide Wizard with Data Attributes

**What:** Each `<section class="form-section">` gets a `data-wizard-step="N"` attribute. Only the active step has `display: block`; all others are `display: none`. Navigation buttons at the bottom of each step control transitions.

**When to use:** Always -- this is the core wizard pattern.

**Example:**
```javascript
// wizard.js
const WIZARD_STEPS = [
  { step: 1,  id: 'section-1',  label: 'Kontakt',     required: ['bauherr_anrede', 'bauherr_vorname', 'bauherr_nachname'] },
  { step: 2,  id: 'section-2',  label: 'Haustyp',      required: ['haustyp'] },
  { step: 3,  id: 'section-3',  label: 'Energie',      required: ['kfw_standard'] },
  { step: 4,  id: 'section-4',  label: 'Wand',         required: ['wall'],      dependsOn: 'kfw_standard' },
  { step: 5,  id: 'section-5',  label: 'Innen',        required: ['innerwall'] },
  { step: 6,  id: 'section-6',  label: 'Decke',        required: ['decke'] },
  { step: 7,  id: 'section-7',  label: 'Fenster',      required: ['window'] },
  { step: 8,  id: 'section-8',  label: 'Dachform',     required: ['dach'] },
  { step: 9,  id: 'section-9',  label: 'Dach',         required: ['tiles'] },
  { step: 10, id: 'section-10', label: 'Treppe',       required: ['treppe'] },
  { step: 11, id: 'section-11', label: 'Heizung',      required: ['heizung'] },
  { step: 12, id: 'section-12', label: 'Luft',         required: ['lueftung'],  dependsOn: 'kfw_standard' },
  { step: 13, id: 'section-13', label: 'Personen',     required: ['personenanzahl'] },
  { step: 14, id: 'section-14', label: 'Grundst.',     required: ['grundstueck'] },
  { step: 15, id: 'section-15', label: 'Raume',        required: [] },  // optional
  { step: 16, id: 'section-16', label: 'Eigen',        required: [] },  // optional
  { step: 17, id: 'section-17', label: 'Berater',      required: [] },  // optional
];

function goToStep(stepNumber) {
  // Save current step state to sessionStorage
  saveCurrentStepState();
  // Hide all sections
  document.querySelectorAll('.form-section').forEach(s => s.style.display = 'none');
  // Show target section
  const stepConfig = WIZARD_STEPS[stepNumber - 1];
  document.getElementById(stepConfig.id).style.display = 'block';
  // Update progress bar
  updateWizardProgress(stepNumber);
  // Update URL hash
  history.replaceState(null, '', `#step-${stepNumber}`);
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

### Pattern 2: sessionStorage State Persistence

**What:** After every field change and step transition, the wizard serializes all form field values to sessionStorage. On page load, it restores them.

**When to use:** Always -- required by success criterion 5.

**Example:**
```javascript
// wizardState.js
const STATE_KEY = 'konfigurator-wizard';

const WizardState = {
  save() {
    const form = document.getElementById('konfigurator-form');
    const data = new FormData(form);
    const state = { step: getCurrentStep() };
    for (const [key, value] of data.entries()) {
      if (state[key]) {
        // Handle multiple values (rooms, eigenleistungen)
        if (!Array.isArray(state[key])) state[key] = [state[key]];
        state[key].push(value);
      } else {
        state[key] = value;
      }
    }
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  },

  load() {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  clear() {
    sessionStorage.removeItem(STATE_KEY);
  },

  restore() {
    const state = this.load();
    if (!state) return false;
    // Restore radio buttons, selects, text inputs
    Object.entries(state).forEach(([name, value]) => {
      if (name === 'step') return;
      const fields = document.querySelectorAll(`[name="${name}"]`);
      fields.forEach(field => {
        if (field.type === 'radio') {
          field.checked = (field.value === value);
          if (field.checked) field.closest('.radio-card')?.classList.add('selected');
        } else if (field.type === 'checkbox') {
          field.checked = Array.isArray(value) ? value.includes(field.value) : field.value === value;
        } else {
          field.value = value;
        }
      });
    });
    return state.step || 1;
  }
};
```

### Pattern 3: Product Image Cards

**What:** Radio cards for component selection include a product image thumbnail above the text content. Images are served from the existing `/assets/variants/` static route.

**When to use:** For all catalog-based selection steps (walls, innerwalls, windows, tiles, daecher, treppen, heizung, lueftung, haustypen, decken).

**Example (EJS):**
```html
<label class="radio-card radio-card--with-image">
  <input type="radio" name="heizung" value="<%= heiz.id %>">
  <% if (heiz.filePath) { %>
    <div class="radio-card-image">
      <img src="/<%= heiz.filePath %>" alt="<%= heiz.name %>" loading="lazy">
    </div>
  <% } %>
  <div class="radio-content">
    <h4><%= heiz.name %></h4>
    <p><%= heiz.description %></p>
  </div>
  <span class="checkmark">...</span>
</label>
```

### Pattern 4: Per-Step Validation

**What:** The "Weiter" (Next) button validates only the current step's required fields before advancing. Validation errors appear inline at the field level with German messages.

**When to use:** Every step transition forward.

**Example:**
```javascript
function validateCurrentStep(stepNumber) {
  const stepConfig = WIZARD_STEPS[stepNumber - 1];
  const errors = [];

  stepConfig.required.forEach(fieldName => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    if (field.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      if (!checked) {
        errors.push({ field: fieldName, message: 'Bitte treffen Sie eine Auswahl.' });
        highlightRadioGroupError(fieldName);
      }
    } else if (field.tagName === 'SELECT') {
      if (!field.value) {
        errors.push({ field: fieldName, message: 'Bitte wahlen Sie eine Option.' });
        showFieldError(field, 'Bitte wahlen Sie eine Option.');
      }
    } else {
      if (!field.value.trim()) {
        errors.push({ field: fieldName, message: 'Dieses Feld ist erforderlich.' });
        showFieldError(field, 'Dieses Feld ist erforderlich.');
      }
    }
  });

  return errors.length === 0;
}
```

### Pattern 5: Server-Side Validation Enhancement

**What:** The `/submit` POST route validates ALL required fields server-side, returning a 400 with German error messages if anything is missing. Currently only catalog whitelist validation exists.

**When to use:** Always on form submission.

**Example:**
```javascript
// In src/routes/submit.js -- add before catalogService.validateSelection()
const requiredFields = {
  bauherr_anrede: 'Anrede ist ein Pflichtfeld',
  bauherr_vorname: 'Vorname ist ein Pflichtfeld',
  bauherr_nachname: 'Nachname ist ein Pflichtfeld',
  kfw_standard: 'Bitte wahlen Sie einen Energiestandard',
  haustyp: 'Bitte wahlen Sie einen Haustyp',
  wall: 'Bitte wahlen Sie ein Aussenwandsystem',
  innerwall: 'Bitte wahlen Sie ein Innenwandsystem',
  decke: 'Bitte wahlen Sie ein Deckensystem',
  window: 'Bitte wahlen Sie ein Fenstersystem',
  tiles: 'Bitte wahlen Sie eine Dacheindeckung',
  dach: 'Bitte wahlen Sie eine Dachform',
  treppe: 'Bitte wahlen Sie eine Treppenoption',
  heizung: 'Bitte wahlen Sie ein Heizungssystem',
  lueftung: 'Bitte wahlen Sie ein Luftungssystem',
  personenanzahl: 'Bitte geben Sie die Personenanzahl an',
  grundstueck: 'Bitte geben Sie den Grundstucksstatus an'
};

const missingFields = [];
for (const [field, message] of Object.entries(requiredFields)) {
  if (!formData[field] || !formData[field].toString().trim()) {
    missingFields.push({ field, message });
  }
}
if (missingFields.length > 0) {
  return res.status(400).json({ error: 'Pflichtfelder fehlen', details: missingFields });
}
```

### Anti-Patterns to Avoid

- **EJS partial per step with separate routes:** Creates N templates with duplicated `<head>` and CSS. Use a single `index.ejs` with show/hide instead.
- **localStorage for wizard state:** Persists PII across sessions. Use sessionStorage (clears when tab closes).
- **Duplicating KfW filter logic in wizard JS:** The wall and lueftung options already have dynamic filtering in `script.js` using hardcoded arrays. The wizard should trigger the existing `updateWallOptions()` and `updateLueftungOptions()` functions after restoring state, not reimplement filtering.
- **Installing a frontend framework (React, Vue, Alpine.js):** The project has no build pipeline. A linear wizard is ~200 lines of vanilla JS. A framework adds unnecessary complexity.
- **Hardcoding step count:** The progress bar must derive its total from `WIZARD_STEPS.length`, not a magic number like `16` or `17`.
- **Client-only validation:** The server MUST validate all required fields independently. The wizard validation is UX convenience; server validation is the security boundary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state serialization | Custom field-by-field extraction | `new FormData(form)` + `entries()` iteration | FormData handles all input types (radio, select, text, multi-value) correctly |
| URL hash routing | Custom hash parser with regex | `location.hash` + `hashchange` event listener | Built into every browser; zero dependencies |
| Touch gesture detection (swipe) | Custom touchstart/touchmove/touchend handler | CSS scroll-snap OR simple threshold check (deltaX > 50px) | Full gesture recognition is complex (conflict with scroll, tap, zoom); a simple swipe threshold is sufficient |
| Image lazy loading | Custom IntersectionObserver for images | `loading="lazy"` attribute on `<img>` | Native browser support; simpler than custom observer |
| Responsive layout | Custom JS resize handling | CSS media queries + `min-width: 44px` on touch targets | CSS handles this natively; no JS needed |

**Key insight:** The wizard UI is fundamentally a show/hide controller with state persistence. Every building block (FormData, sessionStorage, History API, CSS media queries, native lazy loading) is a browser built-in. Zero external dependencies are needed.

## Common Pitfalls

### Pitfall 1: State Lost on Browser Refresh/Back Button

**What goes wrong:** Wizard state stored only in JS variables is destroyed on refresh or browser back button press. User restarts from step 1 in a sales meeting.
**Why it happens:** EJS pages are server-rendered; client JS state is ephemeral.
**How to avoid:** Save to sessionStorage after EVERY field change and step transition. Restore on DOMContentLoaded. Use URL hash (`#step-N`) so the browser back button navigates steps, not pages.
**Warning signs:** Testing the wizard without pressing F5 at each step.

### Pitfall 2: KfW-Dependent Steps Show Stale Options After State Restore

**What goes wrong:** User selects KFW55 (step 3), picks a wall (step 4), then refreshes. State restores KFW55, but the wall options container still shows the placeholder "Bitte wahlen Sie zuerst einen Energiestandard aus" because `updateWallOptions()` was never called after restore.
**Why it happens:** The existing `updateWallOptions()` and `updateLueftungOptions()` functions are triggered by `onchange` events, which don't fire during programmatic restoration.
**How to avoid:** After restoring state from sessionStorage, explicitly call `updateWallOptions()` and `updateLueftungOptions()` to re-render dependent option sets. Then re-select the stored values.
**Warning signs:** Wall/lueftung selection empty after refresh despite sessionStorage having the values.

### Pitfall 3: Product Images with Directory Paths (Haustypen)

**What goes wrong:** Most catalog items have a `filePath` like `"assets/variants/walls/climativ-esb.png"` (a single file). But haustypen use directory paths like `"assets/variants/haustypen/bungalow/"` containing multiple images (1.png, 2.png, 3.png). The `<img src>` approach fails for directories.
**Why it happens:** Haustypen have multiple gallery images; other categories have a single product image.
**How to avoid:** For haustypen, use the convention `filePath + "1.png"` as the thumbnail. Or add a `thumbnailPath` field to the catalog. For the first implementation, concatenate `filePath + "1.png"` as the card image.
**Warning signs:** Broken images on the Haustyp selection step.

### Pitfall 4: Radio Cards Don't Show Selected State After Restore

**What goes wrong:** sessionStorage has `wall: "climativ"` but after restore, the `.radio-card` doesn't have the `.selected` CSS class because the existing `handleRadioSelect()` function was never called.
**Why it happens:** Setting `radio.checked = true` programmatically does not trigger the `change` event or the CSS `:checked` pseudo-class update in all browsers without a manual dispatch.
**How to avoid:** After restoring each radio value, explicitly dispatch a `change` event or call `handleRadioSelect(radio)` to update the visual state. Also, the CSS already has `.radio-card:has(input[type="radio"]:checked)` which should work, but the `.selected` class must also be added for the JS-driven animations.
**Warning signs:** Restored step looks like nothing is selected visually, even though the hidden radio is checked.

### Pitfall 5: Multi-Value Fields (Rooms, Eigenleistungen) State Serialization

**What goes wrong:** Room inputs and eigenleistungen inputs share the same `name` attribute (e.g., `name="eg_rooms"` appears multiple times). `FormData.entries()` returns them in order, but restoring them requires matching each value back to the correct dynamically-added input row.
**Why it happens:** Dynamic room rows are added via `addRoom('eg')` which creates new `<input name="eg_rooms">` elements. On refresh, those dynamic rows don't exist yet.
**How to avoid:** When restoring state, first recreate the necessary number of dynamic room/eigenleistung rows using `addRoom()` / `addEigenleistung()`, THEN fill in the values.
**Warning signs:** Only the first room per floor is restored; additional dynamically-added rooms are lost.

### Pitfall 6: Touch Target Size Below 44px

**What goes wrong:** The existing progress bar step indicators are 28px x 28px (measured from CSS). On tablets, these are too small to tap accurately. Radio cards are adequately large, but navigation buttons and progress indicators may not meet the 44px minimum.
**Why it happens:** Designing on desktop without testing on actual tablet hardware.
**How to avoid:** Audit ALL interactive elements against 44px minimum. The progress bar indicators (currently 28px) need enlargement. Wizard nav buttons (Weiter/Zuruck) must be at least 48px tall. Use browser dev tools tablet emulation at every checkpoint.
**Warning signs:** `.progress-step-indicator` at 28px; any button with `padding` less than 12px vertical.

### Pitfall 7: Form Submission While Wizard Hides Sections

**What goes wrong:** When the user reaches the final step and clicks "Submit", the form POSTs. But hidden sections (display: none) still have their inputs in the DOM. If a hidden input was cleared or never filled, the POST sends empty values. Also, disabled inputs are NOT submitted by the browser.
**Why it happens:** The show/hide approach keeps all inputs in the DOM but hidden. This is actually correct -- all inputs submit regardless of visibility. The risk is if someone uses `disabled` instead of hiding, or if dynamically-rendered sections (walls, lueftung) have stale HTML.
**How to avoid:** Use `display: none` for hidden sections (inputs still submit). Never use `disabled` on inputs to hide them. Verify that dynamically-rendered wall/lueftung options are properly in the DOM before submit.
**Warning signs:** Server receives empty string for `wall` or `lueftung` because the dynamic container was cleared.

### Pitfall 8: Existing script.js Progress Bar Conflicts with Wizard Navigation

**What goes wrong:** The current `script.js` has a 16-step progress bar that tracks completion via scroll spy (IntersectionObserver). The wizard replaces scrolling with step navigation, making the scroll spy meaningless. If both systems run simultaneously, the progress bar flickers between scroll-based and wizard-based states.
**Why it happens:** The existing progress bar code in `script.js` is not removed/disabled when the wizard takes over.
**How to avoid:** During wizard implementation, disable or remove the `initScrollSpy()` function. Replace the `updateProgress()` function with wizard-aware progress tracking that marks steps as completed based on validation, not scroll position.
**Warning signs:** Progress bar showing step 1 active while the wizard displays step 7.

## Code Examples

Verified patterns from the existing codebase and browser APIs:

### Wizard Initialization (DOMContentLoaded)

```javascript
// Source: Combining existing script.js patterns with wizard logic
document.addEventListener('DOMContentLoaded', function() {
  // Existing initializations (keep these)
  initRadioCards();
  initInlineValidation();
  initFormValidation();

  // Remove/skip scroll-dependent features
  // initScrollSpy();  -- replaced by wizard
  // initSmoothScroll(); -- not needed in wizard

  // NEW: Initialize wizard
  initWizard();
});

function initWizard() {
  // Try to restore state from sessionStorage
  const savedStep = WizardState.restore();

  if (savedStep) {
    // State restored -- re-trigger KfW-dependent options
    updateWallOptions();
    updateLueftungOptions();
    // Go to saved step
    goToStep(savedStep);
  } else {
    // Fresh start
    goToStep(1);
  }

  // Listen for hash changes (browser back/forward)
  window.addEventListener('hashchange', function() {
    const hash = location.hash;
    const match = hash.match(/^#step-(\d+)$/);
    if (match) {
      const step = parseInt(match[1]);
      if (step >= 1 && step <= WIZARD_STEPS.length) {
        goToStep(step);
      }
    }
  });

  // Save state on any input change
  document.getElementById('konfigurator-form').addEventListener('input', () => {
    WizardState.save();
  });
  document.getElementById('konfigurator-form').addEventListener('change', () => {
    WizardState.save();
  });

  // Insert wizard navigation into each section
  insertWizardNavigation();
}
```

### Wizard Navigation Buttons (Injected via JS)

```javascript
function insertWizardNavigation() {
  WIZARD_STEPS.forEach((stepConfig, index) => {
    const section = document.getElementById(stepConfig.id);
    if (!section) return;

    const nav = document.createElement('div');
    nav.className = 'wizard-nav';

    const isFirst = index === 0;
    const isLast = index === WIZARD_STEPS.length - 1;

    nav.innerHTML = `
      ${!isFirst ? '<button type="button" class="wizard-btn wizard-btn--back" onclick="wizardBack()">Zuruck</button>' : '<div></div>'}
      <span class="wizard-step-info">Schritt ${index + 1} von ${WIZARD_STEPS.length}</span>
      ${!isLast ? '<button type="button" class="wizard-btn wizard-btn--next" onclick="wizardNext()">Weiter</button>' : ''}
    `;

    section.appendChild(nav);
  });
}

function wizardNext() {
  const current = getCurrentStep();
  if (!validateCurrentStep(current)) return;
  WizardState.save();
  goToStep(current + 1);
}

function wizardBack() {
  const current = getCurrentStep();
  WizardState.save();
  goToStep(current - 1);
}
```

### Product Image Card CSS

```css
/* Product image in radio card */
.radio-card--with-image {
  padding: 0;
  overflow: hidden;
}

.radio-card--with-image .radio-card-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-card--with-image .radio-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.radio-card--with-image .radio-content {
  padding: 20px;
}

/* Tablet optimization */
@media (max-width: 1024px) {
  .radio-group {
    grid-template-columns: 1fr 1fr;
  }

  .radio-card--with-image .radio-card-image {
    height: 140px;
  }
}

@media (max-width: 768px) {
  .radio-group {
    grid-template-columns: 1fr;
  }
}
```

### Tablet Touch Target Audit Checklist

```css
/* Minimum 44px touch targets */
.wizard-btn {
  min-height: 48px;
  min-width: 120px;
  padding: 14px 32px;
  font-size: var(--text-base);
  touch-action: manipulation; /* Prevent double-tap zoom */
}

.radio-card {
  min-height: 60px; /* Already larger than 44px */
  /* padding: 24px already provides adequate touch area */
}

.progress-step-indicator {
  width: 44px;   /* UP from 28px */
  height: 44px;  /* UP from 28px */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-page wizard (server round-trip per step) | Single-page show/hide wizard (client-side navigation) | ~2018 standard practice | No server round-trips between steps; instant navigation |
| localStorage for form state | sessionStorage for PII-containing forms | GDPR awareness ~2018+ | sessionStorage clears on tab close; no PII persists |
| CSS `min-width: 48px` for touch | CSS `min-height: 44px` + `touch-action: manipulation` | Apple HIG + WCAG 2.5.5 | 44px is the accepted minimum; `touch-action` prevents double-tap zoom delay |
| Custom swipe detection (touchstart/touchmove) | CSS scroll-snap or simple threshold | ~2020+ | Native scroll-snap handles momentum; custom gestures conflict with browser gestures |
| `<input type="hidden">` populated before submit | FormData from visible form + sessionStorage | Standard practice | All inputs in the DOM submit normally; no need for hidden field population |

**Deprecated/outdated:**
- jQuery-based wizard plugins (e.g., jQuery Steps, SmartWizard): Dead ecosystem; unnecessary dependency for this use case.
- `express-session` for wizard state: Server-side sessions add complexity; client-side state is simpler for a single-page wizard.

## Existing Codebase Inventory (What Exists, What Changes)

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `views/index.ejs` | Major modification | Add `data-wizard-step` attributes to sections, add product images to radio cards, add wizard navigation placeholder, restructure progress bar for wizard mode |
| `public/js/script.js` | Major refactor | Remove/disable scroll spy (`initScrollSpy`), refactor `updateProgress()` for wizard-aware tracking, keep validation/KfW filtering/addRoom/addEigenleistung/toast |
| `public/css/style.css` | Major additions | Wizard step visibility, navigation bar, product image cards, tablet-specific breakpoints, 44px touch targets, wizard transition animations |
| `src/routes/submit.js` | Moderate addition | Add server-side required-field validation before catalog validation |

### Files to Create

| File | Purpose |
|------|---------|
| `public/js/wizard.js` | Wizard controller: step machine, navigation, per-step validation, progress bar |
| `public/js/wizardState.js` | sessionStorage persistence: save, load, restore, clear |

### Files Unchanged

| File | Why No Change |
|------|--------------|
| `src/server.js` | No new routes or middleware needed |
| `src/routes/index.js` | Catalog data already passed to template; no API endpoint needed |
| `src/services/catalogService.js` | Validation already covers all categories |
| `src/services/submissionService.js` | Submission data structure unchanged |
| `src/services/pdfService.js` | PDF generation completely independent of wizard UI |
| `data/catalog.json` | All catalog data already has `filePath` for images |
| `views/result.ejs` | Result page unchanged |

### Key Existing Functions to Preserve/Reuse

| Function | File | Reuse Strategy |
|----------|------|----------------|
| `updateWallOptions()` | script.js | Call after state restore when KfW is set |
| `updateLueftungOptions()` | script.js | Call after state restore when KfW is set |
| `handleRadioSelect(radio)` | script.js | Call after restoring radio selections to update visual state |
| `addRoom(type)` | script.js | Call N times when restoring rooms with multiple entries |
| `addEigenleistung()` | script.js | Call N times when restoring eigenleistungen |
| `validateField(field)` | script.js | Reuse for per-step text/email/phone field validation |
| `ToastNotification` | script.js | Reuse for wizard error messages |
| `initRadioCards()` | script.js | Reuse for radio card visual behavior |
| `initInlineValidation()` | script.js | Reuse for field-level validation |
| `initFormValidation()` | script.js | Modify to work with wizard (validate all steps before submit) |

### Current Form Field Names (Complete Inventory)

| Field Name | Input Type | Required | Step |
|------------|-----------|----------|------|
| `bauherr_anrede` | select | Yes | 1 |
| `bauherr_vorname` | text | Yes | 1 |
| `bauherr_nachname` | text | Yes | 1 |
| `bauherr_email` | email | No | 1 |
| `bauherr_telefon` | tel | No | 1 |
| `haustyp` | radio | Yes* | 2 |
| `kfw_standard` | radio | Yes | 3 |
| `wall` | radio (dynamic) | Yes | 4 |
| `innerwall` | radio | Yes | 5 |
| `decke` | radio | Yes | 6 |
| `window` | radio | Yes | 7 |
| `dach` | radio | Yes | 8 |
| `tiles` | radio | Yes | 9 |
| `treppe` | radio | Yes | 10 |
| `heizung` | radio | Yes | 11 |
| `lueftung` | radio (dynamic) | Yes | 12 |
| `personenanzahl` | select | Yes | 13 |
| `grundstueck` | radio | Yes | 14 |
| `eg_rooms` / `eg_details` | text (multi) | No | 15 |
| `og_rooms` / `og_details` | text (multi) | No | 15 |
| `ug_rooms` / `ug_details` | text (multi) | No | 15 |
| `eigenleistungen` | text (multi) | No | 16 |
| `berater_name` | text | No | 17 |
| `berater_telefon` | tel | No | 17 |
| `berater_email` | email | No | 17 |
| `berater_freitext` | textarea | No | 17 |

*Note: `haustyp` is not marked `required` in the HTML but is functionally required for PDF generation.

### Product Image Availability per Category

| Category | Image Field | Image Type | Card Image Strategy |
|----------|-------------|-----------|---------------------|
| walls | `filePath` (e.g., `.../climativ-esb.png`) | Single file (3KB placeholder) | Use `filePath` directly; shows placeholder until real images added |
| innerwalls | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |
| windows | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |
| tiles | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |
| daecher | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |
| treppen | `filePath` (or `null` for "keine") | Single file or null | Use `filePath` if not null; show icon/text for null |
| heizung | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |
| lueftung | `filePath` (none for "keine") | Single file or missing | Use `filePath` if available; text-only for "keine" |
| haustypen | `filePath` (directory, e.g., `.../bungalow/`) | Directory with 1.png, 2.png, 3.png (~1MB real images) | Use `filePath + "1.png"` as thumbnail |
| decken | `filePath` | Single file (3KB placeholder) | Use `filePath` directly |

## Open Questions

1. **Swipe gesture navigation: essential or nice-to-have?**
   - What we know: The roadmap plan 05-03 mentions "Swipe-Gesten". CSS scroll-snap can provide this with minimal JS. Custom touch event handling is fragile.
   - What's unclear: Whether the Fachberater would actually swipe between steps vs. tapping buttons. In a sales meeting with a customer watching, button taps are more deliberate.
   - Recommendation: Implement button navigation first. Add swipe as an enhancement in 05-03 only if time permits. Use a simple horizontal swipe threshold (deltaX > 50px) rather than a full gesture library.

2. **Should the wizard step order match the current section numbering (1-17)?**
   - What we know: The current form has 17 sections numbered 1-17. The progress bar has 16 steps (sections 1-16 + Berater is 17). The wizard would have 17 steps.
   - What's unclear: Whether the current ordering is optimal for sales flow. For example, placing Kontaktdaten (personal info) first may be intimidating; some wizard UX patterns place personal info last.
   - Recommendation: Keep current order for now to minimize disruption. Reordering is trivial once the `WIZARD_STEPS` array drives everything -- a future optimization.

3. **How should dynamically-rendered wall/lueftung options handle restoration?**
   - What we know: `updateWallOptions()` rebuilds the wall radio cards innerHTML from JS data arrays. After restore, the wall container may have the placeholder message instead of the options.
   - What's unclear: Whether the dynamic re-rendering is fast enough to avoid a visible flash.
   - Recommendation: In the restore flow: (1) restore kfw_standard, (2) call `updateWallOptions()` and `updateLueftungOptions()`, (3) THEN restore wall/lueftung selections. The order matters.

4. **Should the wizard submit via AJAX or traditional form POST?**
   - What we know: The current form uses a traditional `POST /submit` with redirect. The submit route returns a redirect to `/result/:id`.
   - What's unclear: Whether AJAX submission would provide a better UX (show loading spinner in wizard instead of blank page).
   - Recommendation: Keep traditional form POST. The existing `initFormValidation()` already shows a loading spinner on the submit button. The redirect is fast. AJAX adds complexity without meaningful UX gain.

## Sources

### Primary (HIGH confidence)

- **Existing codebase analysis** (direct file reading):
  - `views/index.ejs` -- 17 form sections, 529 lines, progress bar with 16 steps
  - `public/js/script.js` -- 597 lines, KfW filtering, radio cards, validation, progress tracking
  - `public/css/style.css` -- 1426 lines, design system with CSS variables, responsive breakpoints at 479/480/768/1024/1280px
  - `data/catalog.json` -- 9 categories, 32 items, all with `filePath` field
  - `src/routes/submit.js` -- POST handler, catalog validation, PDF generation
  - `src/services/catalogService.js` -- Whitelist validation, KfW filtering
  - `src/server.js` -- Express app, `/assets` static route for product images
  - `.planning/research/ARCHITECTURE.md` -- Wizard architecture patterns already documented
  - `.planning/research/PITFALLS.md` -- Wizard-specific pitfalls (3, 4, 5, 8, 11, 12) documented

- **Browser APIs** (MDN, universally documented):
  - sessionStorage API
  - History API (pushState/replaceState, hashchange event)
  - FormData API
  - `loading="lazy"` attribute
  - `touch-action` CSS property
  - `:has()` CSS pseudo-class (supported in all modern browsers since 2023)

### Secondary (MEDIUM confidence)

- Apple Human Interface Guidelines: 44px minimum touch target (well-established standard, confirmed by WCAG 2.5.5)
- GDPR sessionStorage vs localStorage consideration: sessionStorage preferred for PII because it clears on tab close (standard recommendation from data protection guidance)

### Tertiary (LOW confidence)

- Swipe gesture implementation details: Simple deltaX threshold is well-known, but conflict with browser scroll/zoom gestures on tablets is device-dependent. Requires real device testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies; all patterns are browser built-ins and existing codebase conventions
- Architecture: HIGH -- Single-page show/hide wizard is the standard pattern for EJS + vanilla JS; extensively documented in project's own ARCHITECTURE.md
- Pitfalls: HIGH -- All pitfalls are derived from direct codebase analysis (measured CSS values, read JS functions, verified file structures) and documented in project's own PITFALLS.md
- Code examples: HIGH -- Based on actual field names, CSS variables, and function signatures from the codebase

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain; no external dependency versions to track)
