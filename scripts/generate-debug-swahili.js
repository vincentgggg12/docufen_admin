#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively converts all values in a translation object to their key paths
 * @param {Object} obj - The translation object
 * @param {string} prefix - The current key path prefix
 * @returns {Object} - Object with values replaced by key paths
 */
function convertValuesToKeys(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      result[key] = convertValuesToKeys(value, currentPath);
    } else {
      // Replace value with key path
      result[key] = currentPath;
    }
  }
  
  return result;
}

/**
 * Main function to generate debug Swahili translation file
 */
function generateDebugSwahili() {
  try {
    // Read the English translation file
    const englishFilePath = path.join(__dirname, '../public/locales/en/translation.json');
    const swahiliFilePath = path.join(__dirname, '../public/locales/sw/translation.json');
    
    console.log('📖 Reading English translation file...');
    const englishContent = fs.readFileSync(englishFilePath, 'utf8');
    const englishTranslations = JSON.parse(englishContent);
    
    console.log('🔄 Converting values to key paths...');
    const debugSwahili = convertValuesToKeys(englishTranslations);
    
    console.log('💾 Writing debug Swahili translation file...');
    fs.writeFileSync(
      swahiliFilePath, 
      JSON.stringify(debugSwahili, null, 2) + '\n',
      'utf8'
    );
    
    console.log('✅ Successfully generated debug Swahili translation file!');
    console.log(`📁 File location: ${swahiliFilePath}`);
    
    // Show some examples
    console.log('\n📋 Examples of generated translations:');
    console.log('  "actions.save" →', debugSwahili.actions?.save || 'N/A');
    console.log('  "account.title" →', debugSwahili.account?.title || 'N/A');
    console.log('  "dateString" →', debugSwahili.dateString || 'N/A');
    
    // Count total keys
    const countKeys = (obj) => {
      let count = 0;
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          count += countKeys(value);
        } else {
          count++;
        }
      }
      return count;
    };
    
    const totalKeys = countKeys(debugSwahili);
    console.log(`\n📊 Total translation keys generated: ${totalKeys}`);
    
  } catch (error) {
    console.error('❌ Error generating debug Swahili file:', error.message);
    process.exit(1);
  }
}

// Run the script
generateDebugSwahili();

export { generateDebugSwahili, convertValuesToKeys }; 