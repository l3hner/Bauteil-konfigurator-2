// ============================================
// DACHAUFBAU ↔ DACHEINDECKUNG
// ============================================
// Zum Flachdach passen nur Abdichtungen (Kies, Begrünung), zum geneigten Dach nur Dachsteine
// und Ziegel. Die Zuordnung steht im Katalog (Feld "dachform") und kommt über data-dachform
// an die Karten. Unpassende Karten werden ausgeblendet und eine unpassende Auswahl gelöscht.

function updateDacheindeckung() {
    const gewaehlt = document.querySelector('input[name="dach"]:checked');
    const dachform = gewaehlt ? gewaehlt.closest('label').dataset.dachform : '';

    document.querySelectorAll('input[name="tiles"]').forEach(function (radio) {
        const karte = radio.closest('label');
        const passt = !dachform || !karte.dataset.dachform || karte.dataset.dachform === dachform;
        karte.style.display = passt ? '' : 'none';
        if (!passt && radio.checked) {
            radio.checked = false;
        }
    });

    if (typeof updateProgress === 'function') updateProgress();
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[name="dach"]').forEach(function (radio) {
        radio.addEventListener('change', updateDacheindeckung);
    });
    updateDacheindeckung();
});
