const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const cache = new Map();

/**
 * Compress and resize an image for PDF embedding.
 * - Skips tiny images (< 10 KB) — likely placeholders
 * - Flattens alpha channel to white background, then converts to JPEG
 * - Converts non-alpha images to JPEG directly
 * - Resizes to maxWidth while preserving aspect ratio
 * - Caches results in memory (cleared per PDF generation)
 *
 * @param {string} imagePath - Absolute path to image file
 * @param {number} maxWidth - Maximum width in pixels (default 600)
 * @returns {Promise<Buffer|null>} Compressed image buffer, or null if file missing
 */
async function getCompressedImage(imagePath, maxWidth = 600) {
  if (!imagePath || !fs.existsSync(imagePath)) return null;

  const cacheKey = `${imagePath}:${maxWidth}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const stats = fs.statSync(imagePath);

  // Skip tiny images (placeholders are ~3 KB)
  if (stats.size < 10240) {
    const buf = fs.readFileSync(imagePath);
    cache.set(cacheKey, buf);
    return buf;
  }

  try {
    const metadata = await sharp(imagePath).metadata();

    let pipeline = sharp(imagePath)
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true });

    if (metadata.hasAlpha) {
      // Flatten transparency to white (PDF renders on white pages anyway)
      // then compress as JPEG for much smaller file size
      pipeline = pipeline.flatten({ background: '#ffffff' })
        .jpeg({ quality: 75, mozjpeg: true });
    } else {
      // Convert to JPEG for photos (much smaller)
      pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
    }

    const buffer = await pipeline.toBuffer();
    cache.set(cacheKey, buffer);

    const wasFlattened = metadata.hasAlpha ? ' (alpha flattened)' : '';
    const reduction = ((stats.size - buffer.length) / stats.size * 100).toFixed(0);
    console.log(`[Image] Compressed ${path.basename(imagePath)}: ${(stats.size / 1024).toFixed(0)} KB -> ${(buffer.length / 1024).toFixed(0)} KB (${reduction}% reduction${wasFlattened})`);

    return buffer;
  } catch (err) {
    console.error(`[Image] Compression failed for ${imagePath}:`, err.message);
    // Fallback: return raw file
    const buf = fs.readFileSync(imagePath);
    cache.set(cacheKey, buf);
    return buf;
  }
}

/**
 * Clear the image cache. Call after each PDF generation.
 */
function clearCache() {
  cache.clear();
}

module.exports = { getCompressedImage, clearCache };
