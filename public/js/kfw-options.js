// ============================================
// KFW-ABHÄNGIGE OPTIONEN (Wand + Lüftung)
// ============================================

const wallOptions = {
    KFW55: [
        { id: 'climativ', name: 'CLIMA-tiv', description: 'Mit Holzwerkstoffplatte - 270 mm Wandstärke', filePath: 'assets/variants/walls/climativ-esb-technical.png' },
        { id: 'climativ-gf', name: 'CLIMA-tiv (GF)', description: 'Mit Gipsfaserplatte - 270 mm Wandstärke', filePath: 'assets/variants/walls/climativ-fermacell-technical.png' }
    ],
    KFW40: [
        { id: 'climativ-plus', name: 'CLIMA-tiv plus', description: 'Mit Holzwerkstoffplatte - 350 mm Wandstärke', filePath: 'assets/variants/walls/climativ-plus-esb-technical.png' },
        { id: 'climativ-plus-gf', name: 'CLIMA-tiv plus (GF)', description: 'Mit Gipsfaserplatte - 350 mm Wandstärke', filePath: 'assets/variants/walls/climativ-plus-fermacell-technical.png' }
    ]
};

const lueftungOptions = {
    KFW55: [
        { id: 'keine', name: 'Keine Lüftungsanlage', description: 'Natürliche Lüftung über Fenster (bei KfW 55 ausreichend)', filePath: null }
    ],
    KFW40: [
        { id: 'dezentral', name: 'Dezentrale Lüftung', description: 'Einzelraumlüftung mit Wärmerückgewinnung', filePath: 'assets/variants/lueftung/dezentral-technical.png' },
        { id: 'zentral', name: 'Zentrale Lüftungsanlage', description: 'Komfort-Lüftung mit zentraler Steuerung', filePath: 'assets/variants/lueftung/zentral-technical.png' }
    ]
};

function _getSelectedKfw() {
    const kfwRadios = document.getElementsByName('kfw_standard');
    for (const radio of kfwRadios) {
        if (radio.checked) return radio.value;
    }
    return null;
}

function _renderRadioCards(container, items, fieldName) {
    if (!items) {
        container.innerHTML = '<p class="info-message">Bitte wählen Sie zuerst einen Energiestandard aus.</p>';
        return;
    }

    let html = '';
    items.forEach(item => {
        html += `
            <label class="radio-card${item.filePath ? ' radio-card--with-image' : ''}">
                <input type="radio" name="${fieldName}" value="${item.id}">
                ${item.filePath ? `<div class="radio-card-image"><img src="/${item.filePath}" alt="${item.name}" loading="lazy"></div>` : ''}
                <div class="radio-content">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                </div>
                <span class="checkmark">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
            </label>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        _attachRadioToggle(radio);
    });
}

function updateWallOptions() {
    const selectedKfw = _getSelectedKfw();
    const container = document.getElementById('wall-options');
    _renderRadioCards(container, selectedKfw ? wallOptions[selectedKfw] : null, 'wall');
}

function updateLueftungOptions() {
    const selectedKfw = _getSelectedKfw();
    const container = document.getElementById('lueftung-options');
    _renderRadioCards(container, selectedKfw ? lueftungOptions[selectedKfw] : null, 'lueftung');
}
