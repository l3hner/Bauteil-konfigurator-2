#!/usr/bin/env node

/**
 * Migration Script: Add missing fields and schemaVersion to existing submissions
 *
 * Adds the following fields (with null defaults) to submissions that lack them:
 *   - dach (roof system)
 *   - treppe (staircase)
 *   - decke (ceiling)
 *   - schemaVersion: 2
 *
 * Idempotent: submissions with schemaVersion >= 2 are skipped.
 *
 * Usage: node scripts/migrate-submissions.js
 */

const fs = require('fs').promises;
const path = require('path');

const SUBMISSIONS_DIR = path.join(__dirname, '..', 'data', 'submissions');
const TARGET_SCHEMA_VERSION = 2;

async function migrateSubmissions() {
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  // Check if directory exists
  let files;
  try {
    files = await fs.readdir(SUBMISSIONS_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No submissions directory found. Nothing to migrate.');
      return;
    }
    throw err;
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log('No submissions found. Nothing to migrate.');
    return;
  }

  console.log(`Found ${jsonFiles.length} submission(s). Starting migration...\n`);

  for (const file of jsonFiles) {
    const filePath = path.join(SUBMISSIONS_DIR, file);

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const submission = JSON.parse(raw);

      // Skip already-migrated submissions
      if (submission.schemaVersion && submission.schemaVersion >= TARGET_SCHEMA_VERSION) {
        console.log(`  SKIP: ${file} (schemaVersion: ${submission.schemaVersion})`);
        skipped++;
        continue;
      }

      // Add missing fields with null defaults
      if (!('dach' in submission)) {
        submission.dach = null;
      }
      if (!('treppe' in submission)) {
        submission.treppe = null;
      }
      if (!('decke' in submission)) {
        submission.decke = null;
      }

      // Stamp schema version
      submission.schemaVersion = TARGET_SCHEMA_VERSION;

      // Write back (pretty-printed)
      await fs.writeFile(filePath, JSON.stringify(submission, null, 2), 'utf8');
      console.log(`  MIGRATED: ${file}`);
      migrated++;
    } catch (err) {
      console.error(`  ERROR: ${file} - ${err.message}`);
      errors++;
    }
  }

  console.log(`\nMigration complete. Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
}

migrateSubmissions().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
