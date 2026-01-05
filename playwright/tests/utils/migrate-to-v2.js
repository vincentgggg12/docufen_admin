#!/usr/bin/env node

/**
 * Migration script to help transition from hardcoded reporter to configuration-driven reporter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update playwright.config.ts-reporter.ts to use V2 reporter
function updatePlaywrightConfig() {
  const configPath = path.join(process.cwd(), 'playwright.config.ts-reporter.ts');
  
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf-8');
    
    // Replace reporter import
    content = content.replace(
      './playwright/tests/utils/ts-custom-reporter-fixed.ts',
    );
    
    fs.writeFileSync(configPath, content);
    console.log('✅ Updated playwright.config.ts-reporter.ts to use V2 reporter');
  } else {
    console.log('⚠️  playwright.config.ts-reporter.ts not found');
  }
}

// Create a backup of the old reporter
function backupOldReporter() {
  const oldReporterPath = path.join(process.cwd(), 'playwright/tests/utils/ts-custom-reporter-fixed.ts');
  const backupPath = path.join(process.cwd(), 'playwright/tests/utils/ts-custom-reporter.backup.ts');
  
  if (fs.existsSync(oldReporterPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(oldReporterPath, backupPath);
    console.log('✅ Created backup of old reporter');
  }
}

// Main migration function
function migrate() {
  console.log('Starting migration to configuration-driven reporter...\n');
  
  // Check if test-metadata directory exists
  const metadataPath = path.join(process.cwd(), 'playwright/test-metadata');
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ test-metadata directory not found. Please run the setup first.');
    process.exit(1);
  }
  
  // Backup old reporter
  backupOldReporter();
  
  // Update config
  updatePlaywrightConfig();
  
  console.log('\n✨ Migration completed!');
  console.log('\nNext steps:');
  console.log('1. Run your tests with: npm run test:ts:6.1');
  console.log('2. Check the generated report');
  console.log('3. Add more test configurations in test-metadata/');
  console.log('\nTo rollback: restore ts-custom-reporter.backup.ts and update the config');
}

// Run migration
migrate();