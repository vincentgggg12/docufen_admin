#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying TS Custom Reporter Setup...\n');

// Check if all required files exist
const filesToCheck = [
  'playwright/tests/utils/ts-custom-reporter-fixed.ts',
  'playwright/configs/ts-reporter.config.ts',
  'playwright/tests/7_DocumentCompletion/7.1.CreateNewDocument/TS.7.1-01-CreateDocumentDialogDisplay.spec.ts',
  'playwright/tests/utils/paths.ts',
  'playwright/tests/CustomReportFormat.md'
];

let allGood = true;

filesToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    allGood = false;
  }
});

console.log('\n📋 Test Commands Available:');
console.log('  npm run test:ts:6.1    - Run TS.6.1 test with custom reporter');
console.log('  npm run test:ts        - Run all TS tests with custom reporter');
console.log('  ./playwright/run-ts-test-with-report.sh - Run test and auto-open report');

if (allGood) {
  console.log('\n✨ All files are in place! You can now run the tests.');
} else {
  console.log('\n⚠️  Some files are missing. Please check the setup.');
}

console.log('\n📊 Report will be generated at:');
console.log('  playwright/playwright-results/ts-test-report.html\n');