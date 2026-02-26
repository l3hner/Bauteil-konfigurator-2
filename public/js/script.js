// ============================================
// LEHNER HAUS KONFIGURATOR
// Premium JavaScript - Micro-Interactions
// ============================================

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
class ToastNotification {
    constructor() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const titles = {
            success: 'Erfolg',
            error: 'Fehler',
            warning: 'Hinweis',
            info: 'Information'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Schließen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Global toast instance
const toast = new ToastNotification();

// ============================================
// WALL OPTIONS DATA
// ============================================
const wallOptions = {
    KFW55: [
        {
            id: 'climativ',
            name: 'CLIMA-tiv',
            description: 'Mit Holzwerkstoffplatte - 270 mm Wandstärke',
            filePath: 'assets/variants/walls/climativ-esb-technical.png'
        },
        {
            id: 'climativ-gf',
            name: 'CLIMA-tiv (GF)',
            description: 'Mit Gipsfaserplatte - 270 mm Wandstärke',
            filePath: 'assets/variants/walls/climativ-fermacell-technical.png'
        }
    ],
    KFW40: [
        {
            id: 'climativ-plus',
            name: 'CLIMA-tiv plus',
            description: 'Mit Holzwerkstoffplatte - 350 mm Wandstärke',
            filePath: 'assets/variants/walls/climativ-plus-esb-technical.png'
        },
        {
            id: 'climativ-plus-gf',
            name: 'CLIMA-tiv plus (GF)',
            description: 'Mit Gipsfaserplatte - 350 mm Wandstärke',
            filePath: 'assets/variants/walls/climativ-plus-fermacell-technical.png'
        }
    ]
};

// ============================================
// LÜFTUNG OPTIONS DATA
// ============================================
const lueftungOptions = {
    KFW55: [
        {
            id: 'keine',
            name: 'Keine Lüftungsanlage',
            description: 'Natürliche Lüftung über Fenster (bei KfW 55 ausreichend)',
            filePath: null
        }
    ],
    KFW40: [
        {
            id: 'dezentral',
            name: 'Dezentrale Lüftung',
            description: 'Einzelraumlüftung mit Wärmerückgewinnung',
            filePath: 'assets/variants/lueftung/dezentral-technical.png'
        },
        {
            id: 'zentral',
            name: 'Zentrale Lüftungsanlage',
            description: 'Komfort-Lüftung mit zentraler Steuerung',
            filePath: 'assets/variants/lueftung/zentral-technical.png'
        }
    ]
};

// ============================================
// UPDATE WALL OPTIONS
// ============================================
function updateWallOptions() {
    const kfwRadios = document.getElementsByName('kfw_standard');
    let selectedKfw = null;

    for (const radio of kfwRadios) {
        if (radio.checked) {
            selectedKfw = radio.value;
            break;
        }
    }

    const wallOptionsContainer = document.getElementById('wall-options');

    if (!selectedKfw) {
        wallOptionsContainer.innerHTML = '<p class="info-message">Bitte wählen Sie zuerst einen Energiestandard aus.</p>';
        return;
    }

    const walls = wallOptions[selectedKfw];

    let html = '';
    walls.forEach(wall => {
        html += `
            <label class="radio-card${wall.filePath ? ' radio-card--with-image' : ''}">
                <input type="radio" name="wall" value="${wall.id}">
                ${wall.filePath ? `<div class="radio-card-image"><img src="/${wall.filePath}" alt="${wall.name}" loading="lazy"></div>` : ''}
                <div class="radio-content">
                    <h4>${wall.name}</h4>
                    <p>${wall.description}</p>
                </div>
                <span class="checkmark">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
            </label>
        `;
    });

    wallOptionsContainer.innerHTML = html;

    // Attach toggle handlers to dynamically created radios
    wallOptionsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
        _attachRadioToggle(radio);
    });
}

// ============================================
// UPDATE LÜFTUNG OPTIONS
// ============================================
function updateLueftungOptions() {
    const kfwRadios = document.getElementsByName('kfw_standard');
    let selectedKfw = null;

    for (const radio of kfwRadios) {
        if (radio.checked) {
            selectedKfw = radio.value;
            break;
        }
    }

    const lueftungOptionsContainer = document.getElementById('lueftung-options');

    if (!selectedKfw) {
        lueftungOptionsContainer.innerHTML = '<p class="info-message">Bitte wählen Sie zuerst einen Energiestandard aus.</p>';
        return;
    }

    const lueftungen = lueftungOptions[selectedKfw];

    let html = '';
    lueftungen.forEach(lueftung => {
        html += `
            <label class="radio-card${lueftung.filePath ? ' radio-card--with-image' : ''}">
                <input type="radio" name="lueftung" value="${lueftung.id}">
                ${lueftung.filePath ? `<div class="radio-card-image"><img src="/${lueftung.filePath}" alt="${lueftung.name}" loading="lazy"></div>` : ''}
                <div class="radio-content">
                    <h4>${lueftung.name}</h4>
                    <p>${lueftung.description}</p>
                </div>
                <span class="checkmark">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
            </label>
        `;
    });

    lueftungOptionsContainer.innerHTML = html;

    // Attach toggle handlers to dynamically created radios
    lueftungOptionsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
        _attachRadioToggle(radio);
    });
}

// ============================================
// RADIO CARD ANIMATIONS
// ============================================
function handleRadioSelect(radio) {
    const card = radio.closest('.radio-card');
    const group = card.closest('.radio-group');

    // Remove selected class from all cards in group
    group.querySelectorAll('.radio-card').forEach(c => {
        c.classList.remove('selected', 'pulse');
    });

    // Only add selected if radio is still checked (not deselected)
    if (radio.checked) {
        card.classList.add('selected', 'pulse');

        // Remove pulse after animation
        setTimeout(() => {
            card.classList.remove('pulse');
        }, 600);
    }
}

// Initialize radio card event listeners
function initRadioCards() {
    document.querySelectorAll('.radio-card input[type="radio"]').forEach(radio => {
        _attachRadioToggle(radio);

        // Also set initial selected state
        if (radio.checked) {
            radio.closest('.radio-card').classList.add('selected');
        }
    });
}

// Attach click-based toggle to a radio button (allows deselection)
function _attachRadioToggle(radio) {
    radio.addEventListener('click', function(e) {
        if (this._wasChecked) {
            this.checked = false;
            this._wasChecked = false;
            // Remove selected class
            const card = this.closest('.radio-card');
            if (card) card.classList.remove('selected', 'pulse');
        } else {
            // Deselect siblings
            const group = this.closest('.radio-group');
            if (group) {
                group.querySelectorAll('input[type="radio"]').forEach(r => { r._wasChecked = false; });
            }
            this._wasChecked = true;
            handleRadioSelect(this);
        }
        updateProgress();
    });
    // Track initial state
    radio._wasChecked = radio.checked;
}

// ============================================
// PROGRESS BAR UPDATES
// ============================================
function updateProgress() {
    const sections = {
        1: () => {
            const vorname = document.getElementById('bauherr_vorname')?.value?.trim();
            const nachname = document.getElementById('bauherr_nachname')?.value?.trim();
            return vorname && nachname;
        },
        2: () => true,  // Haustyp - optional
        3: () => document.querySelector('input[name="kfw_standard"]:checked'),
        4: () => true,  // Wand - optional
        5: () => true,  // Innenwand - optional
        6: () => true,  // Decke - optional
        7: () => true,  // Fenster - optional
        8: () => true,  // Dachaufbau - optional
        9: () => true,  // Dacheindeckung - optional
        10: () => true, // Treppe - optional
        11: () => true, // Heizung - optional
        12: () => true, // Lüftung - optional
        13: () => document.getElementById('personenanzahl')?.value,
        14: () => document.querySelector('input[name="grundstueck"]:checked'),
        15: () => true, // Räume - optional
        16: () => true  // Eigenleistungen - optional
    };

    let completedSteps = 0;
    const totalSteps = 16;

    // Update step indicators
    Object.entries(sections).forEach(([step, check]) => {
        const stepEl = document.querySelector(`.progress-step[data-step="${step}"]`);
        if (stepEl) {
            const isComplete = check();
            stepEl.classList.remove('active', 'completed');

            if (isComplete) {
                completedSteps++;
                stepEl.classList.add('completed');
            }
        }
    });

    // Find first incomplete step and mark as active
    for (let i = 1; i <= 14; i++) {
        if (!sections[i]()) {
            const stepEl = document.querySelector(`.progress-step[data-step="${i}"]`);
            if (stepEl) {
                stepEl.classList.add('active');
            }
            break;
        }
    }

    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const percentage = (completedSteps / totalSteps) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

// ============================================
// INLINE VALIDATION
// ============================================
function initInlineValidation() {
    const inputs = document.querySelectorAll('.form-group input, .form-group select');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            // Remove error state on input
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) errorMsg.classList.remove('show');
            }
        });
    });
}

function validateField(field) {
    const group = field.closest('.form-group');
    if (!group) return true;

    const errorMsg = group.querySelector('.error-message');
    const validIndicator = group.querySelector('.valid-indicator');

    // Remove previous states
    field.classList.remove('error', 'valid');
    if (errorMsg) errorMsg.classList.remove('show');
    if (validIndicator) validIndicator.classList.remove('show');

    // Skip validation for optional fields that are empty
    if (!field.required && !field.value.trim()) {
        return true;
    }

    let isValid = true;
    let errorText = '';

    // Required check
    if (field.required && !field.value.trim()) {
        isValid = false;
        errorText = 'Dieses Feld ist erforderlich.';
    }
    // Email validation
    else if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            isValid = false;
            errorText = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
    }
    // Phone validation
    else if (field.type === 'tel' && field.value.trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)\/]+$/;
        if (!phoneRegex.test(field.value) || field.value.replace(/\D/g, '').length < 6) {
            isValid = false;
            errorText = 'Bitte geben Sie eine gültige Telefonnummer ein.';
        }
    }

    if (!isValid) {
        field.classList.add('error');
        if (errorMsg) {
            errorMsg.textContent = errorText;
            errorMsg.classList.add('show');
        }
    } else if (field.value.trim()) {
        field.classList.add('valid');
        if (validIndicator) validIndicator.classList.add('show');
    }

    return isValid;
}

// ============================================
// ADD ROOM FUNCTIONALITY
// ============================================
function addRoom(type) {
    const container = document.getElementById(`${type}-rooms`);
    const roomItem = document.createElement('div');
    roomItem.className = 'room-item';
    roomItem.innerHTML = `
        <input type="text" name="${type}_rooms" placeholder="Raumbezeichnung" class="room-name">
        <input type="text" name="${type}_details" placeholder="Besondere Wunsche" class="room-details">
    `;
    container.appendChild(roomItem);

    // Animate entry
    roomItem.style.opacity = '0';
    roomItem.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
        roomItem.style.transition = 'all 0.2s ease';
        roomItem.style.opacity = '1';
        roomItem.style.transform = 'translateY(0)';
    });

    // Focus first input
    roomItem.querySelector('input').focus();
}

// ============================================
// ADD EIGENLEISTUNG FUNCTIONALITY
// ============================================
function addEigenleistung() {
    const container = document.getElementById('eigenleistungen-container');
    const eigenleistungItem = document.createElement('div');
    eigenleistungItem.className = 'eigenleistung-item';
    eigenleistungItem.innerHTML = `
        <input type="text" name="eigenleistungen" placeholder="z.B. Malerarbeiten" class="eigenleistung-input">
    `;
    container.appendChild(eigenleistungItem);

    // Animate entry
    eigenleistungItem.style.opacity = '0';
    eigenleistungItem.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
        eigenleistungItem.style.transition = 'all 0.2s ease';
        eigenleistungItem.style.opacity = '1';
        eigenleistungItem.style.transform = 'translateY(0)';
    });

    // Focus the input
    eigenleistungItem.querySelector('input').focus();
}

// ============================================
// FORM VALIDATION & SUBMISSION
// ============================================
function initFormValidation() {
    const form = document.getElementById('konfigurator-form');

    if (form) {
        form.addEventListener('submit', function(e) {
            // Check if KfW standard is selected
            const kfwRadios = document.getElementsByName('kfw_standard');
            let kfwSelected = false;

            for (const radio of kfwRadios) {
                if (radio.checked) {
                    kfwSelected = true;
                    break;
                }
            }

            if (!kfwSelected) {
                e.preventDefault();
                toast.error('Bitte wählen Sie einen Energiestandard aus.');
                document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }

            // Validate required text fields
            const requiredFields = form.querySelectorAll('input[required], select[required]');
            let allValid = true;

            requiredFields.forEach(field => {
                if (field.type !== 'radio' && !validateField(field)) {
                    allValid = false;
                }
            });

            if (!allValid) {
                e.preventDefault();
                toast.error('Bitte füllen Sie alle erforderlichen Felder aus.');
                return false;
            }

            // Show loading indicator
            const submitBtn = form.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                Leistungsbeschreibung wird erstellt...
            `;

            // Add spinner animation
            const style = document.createElement('style');
            style.textContent = `
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `;
            document.head.appendChild(style);
        });
    }
}

// ============================================
// SMOOTH SCROLL FOR SECTIONS
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// SCROLL SPY FOR PROGRESS
// ============================================
function initScrollSpy() {
    const sections = document.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.progress-step');

    if (sections.length === 0 || progressSteps.length === 0) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    const stepNum = sectionId.replace('section-', '');

                    // Highlight current step
                    progressSteps.forEach(step => {
                        const isCurrentStep = step.dataset.step === stepNum;
                        if (isCurrentStep && !step.classList.contains('completed')) {
                            step.classList.add('active');
                        }
                    });
                }
            });
        },
        {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        }
    );

    sections.forEach(section => observer.observe(section));
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initRadioCards();
    initInlineValidation();
    initFormValidation();
});
