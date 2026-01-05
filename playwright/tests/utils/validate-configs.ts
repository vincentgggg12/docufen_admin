#!/usr/bin/env node

/**
 * Validation tool for test configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

function loadSchema(schemaName: string): any {
  const schemaPath = path.join(process.cwd(), 'playwright/test-metadata/schema', schemaName);
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

function validateFile(filePath: string, schema: any): boolean {
  console.log(`\nValidating: ${path.relative(process.cwd(), filePath)}`);
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const validate = ajv.compile(schema);
    const valid = validate(content);
    
    if (valid) {
      console.log('✅ Valid');
      return true;
    } else {
      console.log('❌ Invalid:');
      console.log(ajv.errorsText(validate.errors, { separator: '\n' }));
      return false;
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

function validateAllConfigs() {
  console.log('Validating test configurations...\n');
  
  const metadataRoot = path.join(process.cwd(), 'playwright/test-metadata');
  
  // Load schemas
  const testConfigSchema = loadSchema('test-config.schema.json');
  const hierarchySchema = loadSchema('hierarchy.schema.json');
  
  let allValid = true;
  
  // Validate hierarchy
  allValid = validateFile(
    path.join(metadataRoot, 'test-hierarchy.json'),
    hierarchySchema
  ) && allValid;
  
  // Validate all test configs
  const configDirs = [
    '1-login-authentication',
    '2-setup-wizard',
    '3-account',
    '4-users',
    '5-documents',
    '6-document-completion'
  ];
  
  for (const dir of configDirs) {
    const dirPath = path.join(metadataRoot, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        allValid = validateFile(
          path.join(dirPath, file),
          testConfigSchema
        ) && allValid;
      }
    }
  }
  
  console.log('\n' + (allValid ? '✅ All configurations are valid!' : '❌ Some configurations have errors'));
  process.exit(allValid ? 0 : 1);
}

// Check if ajv is installed
try {
  require.resolve('ajv');
  validateAllConfigs();
} catch (e) {
  console.log('Installing ajv for validation...');
  require('child_process').execSync('npm install --save-dev ajv', { stdio: 'inherit' });
  validateAllConfigs();
}