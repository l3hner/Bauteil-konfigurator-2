// ============================================
// RADIO CARD INTERACTIONS & DYNAMIC FORM
// ============================================

function handleRadioSelect(radio) {
    const card = radio.closest('.radio-card');
    const group = card.closest('.radio-group');

    group.querySelectorAll('.radio-card').forEach(c => {
        c.classList.remove('selected', 'pulse');
    });

    if (radio.checked) {
        card.classList.add('selected', 'pulse');
        setTimeout(() => card.classList.remove('pulse'), 600);
    }
}

function _attachRadioToggle(radio) {
    radio.addEventListener('click', function () {
        if (this._wasChecked) {
            this.checked = false;
            this._wasChecked = false;
            const card = this.closest('.radio-card');
            if (card) card.classList.remove('selected', 'pulse');
        } else {
            const group = this.closest('.radio-group');
            if (group) {
                group.querySelectorAll('input[type="radio"]').forEach(r => { r._wasChecked = false; });
            }
            this._wasChecked = true;
            handleRadioSelect(this);
        }
        updateProgress();
    });
    radio._wasChecked = radio.checked;
}

function initRadioCards() {
    document.querySelectorAll('.radio-card input[type="radio"]').forEach(radio => {
        _attachRadioToggle(radio);
        if (radio.checked) {
            radio.closest('.radio-card').classList.add('selected');
        }
    });
}

// ============================================
// PROGRESS BAR
// ============================================
function updateProgress() {
    const sections = {
        1: () => {
            const vorname = document.getElementById('bauherr_vorname')?.value?.trim();
            const nachname = document.getElementById('bauherr_nachname')?.value?.trim();
            return vorname && nachname;
        },
        2: () => true, 3: () => document.querySelector('input[name="kfw_standard"]:checked'),
        4: () => true, 5: () => true, 6: () => true, 7: () => true,
        8: () => true, 9: () => true, 10: () => true, 11: () => true, 12: () => true,
        13: () => document.getElementById('personenanzahl')?.value,
        14: () => document.querySelector('input[name="grundstueck"]:checked'),
        15: () => true, 16: () => true
    };

    let completedSteps = 0;
    const totalSteps = 16;

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

    for (let i = 1; i <= 14; i++) {
        if (!sections[i]()) {
            const stepEl = document.querySelector(`.progress-step[data-step="${i}"]`);
            if (stepEl) stepEl.classList.add('active');
            break;
        }
    }

    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${(completedSteps / totalSteps) * 100}%`;
    }
}

// ============================================
// DYNAMIC ROOM & EIGENLEISTUNG FIELDS
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

    roomItem.style.opacity = '0';
    roomItem.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
        roomItem.style.transition = 'all 0.2s ease';
        roomItem.style.opacity = '1';
        roomItem.style.transform = 'translateY(0)';
    });

    roomItem.querySelector('input').focus();
}

function addEigenleistung() {
    const container = document.getElementById('eigenleistungen-container');
    const item = document.createElement('div');
    item.className = 'eigenleistung-item';
    item.innerHTML = `<input type="text" name="eigenleistungen" placeholder="z.B. Malerarbeiten" class="eigenleistung-input">`;
    container.appendChild(item);

    item.style.opacity = '0';
    item.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
        item.style.transition = 'all 0.2s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    });

    item.querySelector('input').focus();
}

// ============================================
// SCROLL SPY
// ============================================
function initScrollSpy() {
    const sections = document.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.progress-step');

    if (sections.length === 0 || progressSteps.length === 0) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stepNum = entry.target.id.replace('section-', '');
                    progressSteps.forEach(step => {
                        if (step.dataset.step === stepNum && !step.classList.contains('completed')) {
                            step.classList.add('active');
                        }
                    });
                }
            });
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(section => observer.observe(section));
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initRadioCards();
    initInlineValidation();
    initFormValidation();
});
