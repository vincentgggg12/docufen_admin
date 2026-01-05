const fs = require('fs');
const path = require('path');

// Function to flatten nested JSON objects
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        // Handle arrays and primitive values
        flattened[newKey] = Array.isArray(obj[key]) ? obj[key].join(', ') : obj[key];
      }
    }
  }
  
  return flattened;
}

// Function to escape CSV values
function escapeCsvValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

// Main function to convert translations to CSV
function convertTranslationsToCSV() {
  const localesDir = path.join(__dirname, '../public/locales');
  const languages = ['en', 'es', 'pl', 'zh', 'sw'];
  
  // Object to store all translations
  const allTranslations = {};
  const allKeys = new Set();
  
  // Load all translation files
  languages.forEach(lang => {
    const translationFile = path.join(localesDir, lang, 'translation.json');
    
    if (fs.existsSync(translationFile)) {
      try {
        const content = fs.readFileSync(translationFile, 'utf8');
        const translations = JSON.parse(content);
        const flattened = flattenObject(translations);
        
        allTranslations[lang] = flattened;
        
        // Collect all unique keys
        Object.keys(flattened).forEach(key => allKeys.add(key));
        
        console.log(`Loaded ${Object.keys(flattened).length} keys for ${lang}`);
      } catch (error) {
        console.error(`Error loading ${lang} translations:`, error.message);
      }
    } else {
      console.warn(`Translation file not found for ${lang}: ${translationFile}`);
    }
  });
  
  // Convert to CSV
  const sortedKeys = Array.from(allKeys).sort();
  
  // Create CSV header
  const header = ['Key', ...languages.map(lang => lang.toUpperCase())];
  let csvContent = header.join(',') + '\n';
  
  // Add each translation key as a row
  sortedKeys.forEach(key => {
    const row = [
      escapeCsvValue(key),
      ...languages.map(lang => {
        const value = allTranslations[lang] && allTranslations[lang][key] ? allTranslations[lang][key] : '';
        return escapeCsvValue(value);
      })
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  // Write CSV file
  const outputFile = path.join(__dirname, '../translations-export.csv');
  fs.writeFileSync(outputFile, csvContent, 'utf8');
  
  console.log(`\n✅ CSV export complete!`);
  console.log(`📁 File saved to: ${outputFile}`);
  console.log(`📊 Total keys: ${sortedKeys.length}`);
  console.log(`🌍 Languages: ${languages.join(', ')}`);
  console.log(`\n💡 You can now:`);
  console.log(`   1. Open this CSV in Google Sheets or Excel`);
  console.log(`   2. Share with translators for easier collaboration`);
  console.log(`   3. Use the csv-to-json.js script to convert back to JSON files`);
}

// Run the conversion
convertTranslationsToCSV(); 