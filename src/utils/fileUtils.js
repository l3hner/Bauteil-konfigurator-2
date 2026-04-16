const fs = require('fs');
const path = require('path');

/**
 * Prüft ob ein Pfad sicher innerhalb eines Basisverzeichnisses liegt
 * Verhindert Path-Traversal-Angriffe
 */
function isPathSafe(targetPath, basePath) {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBase = path.resolve(basePath);

    // Normalize to handle Windows/Unix differences
    const normalizedTarget = resolvedTarget.toLowerCase().replace(/\\/g, '/');
    const normalizedBase = resolvedBase.toLowerCase().replace(/\\/g, '/');

    return normalizedTarget.startsWith(normalizedBase + '/') || normalizedTarget === normalizedBase;
}

/**
 * Prüft ob eine Datei existiert und lesbar ist
 */
function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    isPathSafe,
    fileExists
};
