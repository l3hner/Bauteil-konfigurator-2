// ============================================
// WIZARD STEP CONTROLLER
// ============================================

// Step configuration: 17 wizard steps
const WIZARD_STEPS = [
    { step: 1,  id: 'section-1',  label: 'Kontakt',  required: ['bauherr_anrede', 'bauherr_vorname', 'bauherr_nachname'] },
    { step: 2,  id: 'section-2',  label: 'Haustyp',   required: ['haustyp'] },
    { step: 3,  id: 'section-3',  label: 'Energie',   required: ['kfw_standard'] },
    { step: 4,  id: 'section-4',  label: 'Wand',      required: ['wall'] },
    { step: 5,  id: 'section-5',  label: 'Innen',     required: ['innerwall'] },
    { step: 6,  id: 'section-6',  label: 'Decke',     required: ['decke'] },
    { step: 7,  id: 'section-7',  label: 'Fenster',   required: ['window'] },
    { step: 8,  id: 'section-8',  label: 'Dachform',  required: ['dach'] },
    { step: 9,  id: 'section-9',  label: 'Dach',      required: ['tiles'] },
    { step: 10, id: 'section-10', label: 'Treppe',    required: ['treppe'] },
    { step: 11, id: 'section-11', label: 'Heizung',   required: ['heizung'] },
    { step: 12, id: 'section-12', label: 'Luft',      required: ['lueftung'] },
    { step: 13, id: 'section-13', label: 'Personen',  required: ['personenanzahl'] },
    { step: 14, id: 'section-14', label: 'Grundst.',  required: ['grundstueck'] },
    { step: 15, id: 'section-15', label: 'Raume',     required: [] },
    { step: 16, id: 'section-16', label: 'Eigen',     required: [] },
    { step: 17, id: 'section-17', label: 'Berater',   required: [] }
];

// Current step tracker (used by wizardState.js)
window.__wizardCurrentStep = 1;

// ============================================
// NAVIGATION
// ============================================

/**
 * Navigate to a specific wizard step.
 * Hides all sections, shows the target, updates hash, progress, and submit visibility.
 */
function goToStep(stepNumber) {
    // Clamp to valid range
    if (stepNumber < 1) stepNumber = 1;
    if (stepNumber > WIZARD_STEPS.length) stepNumber = WIZARD_STEPS.length;

    // Save current state before navigating
    WizardState.save();

    // Hide all form sections
    const sections = document.querySelectorAll('.form-section');
    sections.forEach(sec => { sec.style.display = 'none'; });

    // Show the target section
    const targetId = WIZARD_STEPS[stepNumber - 1].id;
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update current step tracker
    window.__wizardCurrentStep = stepNumber;

    // Update URL hash (pushState for browser back button history)
    history.pushState(null, '', '#step-' + stepNumber);

    // Update progress bar
    updateWizardProgress(stepNumber);

    // Show/hide submit section
    const submitSection = document.getElementById('wizard-submit-section');
    if (submitSection) {
        submitSection.style.display = (stepNumber === 17) ? 'block' : 'none';
    }

    // Scroll to top (instant, not smooth -- wizard transitions should feel snappy)
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ============================================
// PROGRESS BAR
// ============================================

/**
 * Update the progress bar and step indicators based on current position.
 */
function updateWizardProgress(currentStep) {
    let completedCount = 0;

    WIZARD_STEPS.forEach(stepConfig => {
        const stepEl = document.querySelector(`.progress-step[data-step="${stepConfig.step}"]`);
        if (!stepEl) return;

        // Remove existing states
        stepEl.classList.remove('active', 'completed');

        if (stepConfig.step === currentStep) {
            // Current step: mark active
            stepEl.classList.add('active');
        } else if (stepConfig.step < currentStep && _isStepComplete(stepConfig)) {
            // Previous step with all required fields filled: mark completed
            stepEl.classList.add('completed');
            completedCount++;
        } else if (_isStepComplete(stepConfig)) {
            // Any step with all required fields filled
            stepEl.classList.add('completed');
            completedCount++;
        }
    });

    // Update progress bar fill width
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const percentage = (completedCount / WIZARD_STEPS.length) * 100;
        progressBar.style.width = percentage + '%';
    }
}

/**
 * Check if all required fields for a step are filled.
 */
function _isStepComplete(stepConfig) {
    if (stepConfig.required.length === 0) return true;

    for (const fieldName of stepConfig.required) {
        const el = document.querySelector(`[name="${fieldName}"]`);
        if (!el) return false;

        if (el.type === 'radio') {
            // Radio: check if any in the group is checked
            const checked = document.querySelector(`[name="${fieldName}"]:checked`);
            if (!checked) return false;
        } else if (el.tagName === 'SELECT') {
            if (!el.value) return false;
        } else {
            if (!el.value.trim()) return false;
        }
    }
    return true;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate all required fields on the current step.
 * Shows German error messages inline. Returns true if valid.
 */
function validateCurrentStep(stepNumber) {
    const stepConfig = WIZARD_STEPS[stepNumber - 1];
    if (!stepConfig) return true;

    // Clear previous wizard errors
    document.querySelectorAll('.wizard-field-error').forEach(el => el.remove());

    let firstErrorEl = null;
    let hasErrors = false;

    for (const fieldName of stepConfig.required) {
        let isValid = false;
        let errorMessage = '';
        let targetEl = null;

        const el = document.querySelector(`[name="${fieldName}"]`);
        if (!el) continue;

        if (el.type === 'radio') {
            // Radio group: check if any is checked
            const checked = document.querySelector(`[name="${fieldName}"]:checked`);
            isValid = !!checked;
            errorMessage = 'Bitte treffen Sie eine Auswahl.';
            // Find the radio group container for error placement
            targetEl = el.closest('.radio-group') || el.closest('.form-section');
        } else if (el.tagName === 'SELECT') {
            isValid = el.value !== '';
            errorMessage = 'Bitte wahlen Sie eine Option.';
            targetEl = el.closest('.form-group') || el;
        } else {
            // text, email, tel
            isValid = el.value.trim() !== '';
            errorMessage = 'Dieses Feld ist erforderlich.';
            targetEl = el.closest('.form-group') || el;
        }

        if (!isValid) {
            hasErrors = true;

            // Create and insert error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'wizard-field-error';
            errorDiv.textContent = errorMessage;
            errorDiv.style.color = '#C8102E';
            errorDiv.style.fontSize = '0.85rem';
            errorDiv.style.marginTop = '0.5rem';
            errorDiv.style.marginBottom = '0.5rem';

            if (targetEl) {
                targetEl.appendChild(errorDiv);
            }

            if (!firstErrorEl) {
                firstErrorEl = targetEl || el;
            }
        }
    }

    // Scroll to first error within the visible section
    if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return !hasErrors;
}

// ============================================
// NEXT / BACK ACTIONS
// ============================================

/**
 * Advance to the next step (with validation).
 */
function wizardNext() {
    if (!validateCurrentStep(window.__wizardCurrentStep)) return;

    if (window.__wizardCurrentStep < WIZARD_STEPS.length) {
        goToStep(window.__wizardCurrentStep + 1);
    }
}

/**
 * Go back to the previous step (no validation).
 */
function wizardBack() {
    if (window.__wizardCurrentStep > 1) {
        goToStep(window.__wizardCurrentStep - 1);
    }
}

// ============================================
// NAVIGATION BUTTONS (injected into each section)
// ============================================

/**
 * Insert wizard navigation buttons (Zuruck / Weiter) at the bottom of each section.
 */
function insertWizardNavigation() {
    WIZARD_STEPS.forEach(stepConfig => {
        const section = document.getElementById(stepConfig.id);
        if (!section) return;

        const nav = document.createElement('div');
        nav.className = 'wizard-nav';

        const isFirst = stepConfig.step === 1;
        const isLast = stepConfig.step === WIZARD_STEPS.length;

        let html = '';

        // Back button (hidden on step 1)
        if (!isFirst) {
            html += '<button type="button" class="wizard-btn wizard-btn--back" onclick="wizardBack()">Zuruck</button>';
        } else {
            html += '<span></span>'; // Spacer for flex layout
        }

        // Step info
        html += '<span class="wizard-step-info">Schritt ' + stepConfig.step + ' von ' + WIZARD_STEPS.length + '</span>';

        // Next button (hidden on last step -- submit section handles it)
        if (!isLast) {
            html += '<button type="button" class="wizard-btn wizard-btn--next" onclick="wizardNext()">Weiter</button>';
        } else {
            html += '<span></span>'; // Spacer for flex layout
        }

        nav.innerHTML = html;
        section.appendChild(nav);
    });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the wizard: restore state, set up listeners, inject navigation.
 */
function initWizard() {
    // Inject navigation buttons into each section
    insertWizardNavigation();

    // Hide the existing submit section (shown contextually on step 17)
    const submitSection = document.getElementById('wizard-submit-section');
    if (submitSection) {
        submitSection.style.display = 'none';
    }

    // Try to restore saved state
    const savedStep = WizardState.restore();

    if (savedStep && savedStep > 0) {
        // KfW-dependent options need special handling:
        // 1. kfw_standard radio was restored by WizardState.restore()
        // 2. Now rebuild the dynamic wall/lueftung HTML
        if (typeof updateWallOptions === 'function') updateWallOptions();
        if (typeof updateLueftungOptions === 'function') updateLueftungOptions();

        // 3. After DOM updates from dynamic rendering, re-select wall/lueftung values
        setTimeout(function() {
            const state = WizardState.load();
            if (state) {
                // Re-select wall radio
                if (state.wall) {
                    const wallRadio = document.querySelector('input[name="wall"][value="' + state.wall + '"]');
                    if (wallRadio) {
                        wallRadio.checked = true;
                        wallRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                // Re-select lueftung radio
                if (state.lueftung) {
                    const lueftungRadio = document.querySelector('input[name="lueftung"][value="' + state.lueftung + '"]');
                    if (lueftungRadio) {
                        lueftungRadio.checked = true;
                        lueftungRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }

            // Navigate to the saved step
            goToStep(savedStep);
        }, 0);
    } else {
        // No saved state -- start at step 1
        goToStep(1);
    }

    // Listen for hash changes (browser back/forward buttons)
    window.addEventListener('popstate', function() {
        const step = _parseHashStep();
        if (step) {
            goToStep(step);
        }
    });

    // Auto-save on every input/change event on the form
    const form = document.getElementById('konfigurator-form');
    if (form) {
        form.addEventListener('input', function() { WizardState.save(); });
        form.addEventListener('change', function() { WizardState.save(); });
    }
}

/**
 * Parse step number from URL hash (#step-N).
 */
function _parseHashStep() {
    const match = location.hash.match(/^#step-(\d+)$/);
    if (match) {
        const n = parseInt(match[1], 10);
        if (n >= 1 && n <= WIZARD_STEPS.length) return n;
    }
    return null;
}
