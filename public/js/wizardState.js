// ============================================
// WIZARD STATE PERSISTENCE (sessionStorage)
// ============================================
const WizardState = (function() {
    const STATE_KEY = 'konfigurator-wizard';

    // Multi-value field names (collected into arrays)
    const MULTI_VALUE_FIELDS = [
        'eg_rooms', 'eg_details',
        'og_rooms', 'og_details',
        'ug_rooms', 'ug_details',
        'eigenleistungen'
    ];

    /**
     * Save all form data + current wizard step to sessionStorage.
     */
    function save() {
        const form = document.getElementById('konfigurator-form');
        if (!form) return;

        const state = {};
        const multiValues = {};

        // Initialize multi-value buckets
        MULTI_VALUE_FIELDS.forEach(name => { multiValues[name] = []; });

        // Collect all form data
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            if (MULTI_VALUE_FIELDS.includes(key)) {
                multiValues[key].push(value);
            } else {
                state[key] = value;
            }
        }

        // Merge multi-value fields into state
        MULTI_VALUE_FIELDS.forEach(name => {
            state[name] = multiValues[name];
        });

        // Store current wizard step
        state.step = window.__wizardCurrentStep || _parseStepFromHash() || 1;

        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    }

    /**
     * Load state from sessionStorage. Returns parsed object or null.
     */
    function load() {
        const raw = sessionStorage.getItem(STATE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    /**
     * Remove state from sessionStorage.
     */
    function clear() {
        sessionStorage.removeItem(STATE_KEY);
    }

    /**
     * Restore form state from sessionStorage.
     * Returns the step number to navigate to, or false if nothing to restore.
     */
    function restore() {
        const state = load();
        if (!state) return false;

        const form = document.getElementById('konfigurator-form');
        if (!form) return false;

        // 1. Restore text inputs, selects, textareas
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const name = el.name;
            if (!name) continue;

            // Skip multi-value fields (handled separately)
            if (MULTI_VALUE_FIELDS.includes(name)) continue;

            // Skip radio buttons (handled separately)
            if (el.type === 'radio') continue;

            if (state[name] !== undefined) {
                el.value = state[name];
            }
        }

        // 2. Restore radio buttons
        const radioNames = new Set();
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].type === 'radio') {
                radioNames.add(elements[i].name);
            }
        }

        radioNames.forEach(radioName => {
            // Skip wall and lueftung -- these are dynamically rendered and restored after updateWallOptions/updateLueftungOptions
            if (radioName === 'wall' || radioName === 'lueftung') return;

            const savedValue = state[radioName];
            if (!savedValue) return;

            const radio = form.querySelector(`input[name="${radioName}"][value="${savedValue}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // 3. Restore multi-value fields (rooms and eigenleistungen)
        _restoreMultiValueFields(state);

        return state.step || 1;
    }

    /**
     * Restore rooms and eigenleistungen arrays.
     * Adds additional rows beyond the default 1, then fills values.
     */
    function _restoreMultiValueFields(state) {
        // Restore rooms for each floor type
        ['eg', 'og', 'ug'].forEach(type => {
            const rooms = state[type + '_rooms'] || [];
            const details = state[type + '_details'] || [];
            const count = Math.max(rooms.length, details.length);

            // Add additional rows (1 row exists by default)
            for (let i = 1; i < count; i++) {
                if (typeof addRoom === 'function') {
                    addRoom(type);
                }
            }

            // Fill in values
            const roomInputs = document.querySelectorAll(`input[name="${type}_rooms"]`);
            const detailInputs = document.querySelectorAll(`input[name="${type}_details"]`);

            rooms.forEach((val, idx) => {
                if (roomInputs[idx]) roomInputs[idx].value = val;
            });
            details.forEach((val, idx) => {
                if (detailInputs[idx]) detailInputs[idx].value = val;
            });
        });

        // Restore eigenleistungen
        const eigenleistungen = state['eigenleistungen'] || [];
        const eigenCount = eigenleistungen.length;

        // Add additional rows (1 row exists by default)
        for (let i = 1; i < eigenCount; i++) {
            if (typeof addEigenleistung === 'function') {
                addEigenleistung();
            }
        }

        // Fill in values
        const eigenInputs = document.querySelectorAll('input[name="eigenleistungen"]');
        eigenleistungen.forEach((val, idx) => {
            if (eigenInputs[idx]) eigenInputs[idx].value = val;
        });
    }

    /**
     * Parse step number from URL hash (#step-N).
     */
    function _parseStepFromHash() {
        const match = location.hash.match(/^#step-(\d+)$/);
        if (match) {
            const n = parseInt(match[1], 10);
            if (n >= 1 && n <= 17) return n;
        }
        return null;
    }

    return {
        save: save,
        load: load,
        clear: clear,
        restore: restore
    };
})();
