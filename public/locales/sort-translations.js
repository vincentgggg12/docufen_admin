import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively sort object keys
function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

// Function to process a single translation file
function processTranslationFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    // Sort the keys
    const sorted = sortObjectKeys(json);
    
    // Write back with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
    
    console.log(`✓ Sorted: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Main function
function sortAllTranslations() {
  //const localesDir = path.join(__dirname, 'public', 'locales');
  const localesDir = __dirname;
  
  // Get all subdirectories in locales
  const dirs = fs.readdirSync(localesDir).filter(file => {
    return fs.statSync(path.join(localesDir, file)).isDirectory();
  });
  
  console.log(`Found ${dirs.length} locale directories: ${dirs.join(', ')}\n`);
  
  // Process translation.json in each directory
  dirs.forEach(dir => {
    const translationFile = path.join(localesDir, dir, 'translation.json');
    if (fs.existsSync(translationFile)) {
      processTranslationFile(translationFile);
    } else {
      console.log(`⚠ No translation.json found in ${dir}`);
    }
  });
  
  console.log('\nAll translation files have been sorted!');
}

// Run the script
sortAllTranslations();
