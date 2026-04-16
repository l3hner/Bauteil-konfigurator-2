// ============================================
// FORM VALIDATION & INLINE VALIDATION
// ============================================

function validateField(field) {
    const group = field.closest('.form-group');
    if (!group) return true;

    const errorMsg = group.querySelector('.error-message');
    const validIndicator = group.querySelector('.valid-indicator');

    field.classList.remove('error', 'valid');
    if (errorMsg) errorMsg.classList.remove('show');
    if (validIndicator) validIndicator.classList.remove('show');

    if (!field.required && !field.value.trim()) return true;

    let isValid = true;
    let errorText = '';

    if (field.required && !field.value.trim()) {
        isValid = false;
        errorText = 'Dieses Feld ist erforderlich.';
    } else if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            isValid = false;
            errorText = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
    } else if (field.type === 'tel' && field.value.trim()) {
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

function initInlineValidation() {
    const inputs = document.querySelectorAll('.form-group input, .form-group select');

    inputs.forEach(input => {
        input.addEventListener('blur', function () {
            validateField(this);
        });

        input.addEventListener('input', function () {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) errorMsg.classList.remove('show');
            }
        });
    });
}

function initFormValidation() {
    const form = document.getElementById('konfigurator-form');

    if (form) {
        form.addEventListener('submit', function (e) {
            const kfwRadios = document.getElementsByName('kfw_standard');
            let kfwSelected = false;

            for (const radio of kfwRadios) {
                if (radio.checked) { kfwSelected = true; break; }
            }

            if (!kfwSelected) {
                e.preventDefault();
                toast.error('Bitte wählen Sie einen Energiestandard aus.');
                document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }

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

            const style = document.createElement('style');
            style.textContent = `
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `;
            document.head.appendChild(style);
        });
    }
}
