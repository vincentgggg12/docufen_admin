import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'playwright/results/test-results');
const REPORT_PATH = path.join(__dirname, '..', 'playwright/results/test-reports', 'detailed-test-report.html');

// Function to find all screenshot files for test-002
function findScreenshots() {
  const screenshotMap = {};
  
  // Initialize an array for each step
  for (let i = 1; i <= 11; i++) {
    screenshotMap[i] = [];
  }
  
  try {
    // Read all files in the test-results directory
    const files = fs.readdirSync(TEST_RESULTS_DIR);
    
    // Filter for PNG files and map them to the correct step
    files.forEach(file => {
      if (file.endsWith('.png')) {
        // Extract step number from filename (assuming pattern like step1-*, step2-*, etc.)
        const match = file.match(/step(\d+)/);
        if (match && match[1]) {
          const stepNumber = parseInt(match[1], 10);
          if (stepNumber >= 1 && stepNumber <= 11) {
            // Use absolute path to ensure images load correctly
            const fullPath = path.join(TEST_RESULTS_DIR, file);
            screenshotMap[stepNumber].push(fullPath);
          }
        } else if (file === 'grady-permissions-check.png') {
          // Special case for step 4
          const fullPath = path.join(TEST_RESULTS_DIR, file);
          screenshotMap[4].push(fullPath);
        } else if (file === 'grady-details-after-login.png') {
          // Special case for step 8
          const fullPath = path.join(TEST_RESULTS_DIR, file);
          screenshotMap[8].push(fullPath);
        }
      }
    });
    
    return screenshotMap;
  } catch (error) {
    console.error('Error finding screenshots:', error);
    return screenshotMap;
  }
}

// Function to update the HTML report
function updateReport() {
  try {
    // Read the report file
    let html = fs.readFileSync(REPORT_PATH, 'utf8');
    
    // Find all screenshots
    const screenshotMap = findScreenshots();
    
    // For each step, update the corresponding <div class="screenshots"></div>
    for (let step = 1; step <= 11; step++) {
      const screenshots = screenshotMap[step];
      
      if (screenshots.length > 0) {
        // Create HTML for the screenshots with file:// protocol for local files
        const screenshotsHtml = screenshots.map(screenshot => {
          // Convert the absolute path to a URL with file:// protocol
          const fileUrl = `file://${screenshot}`;
          return `<div class="screenshot"><img src="${fileUrl}" alt="Step ${step} screenshot" /></div>`;
        }).join('');
        
        // Replace the empty div with our screenshots
        const placeholder = `<td><div class="screenshots"></div></td>`;
        const replacement = `<td><div class="screenshots">${screenshotsHtml}</div></td>`;
        
        // Find the correct occurrence of the placeholder for this step
        const parts = html.split(placeholder);
        if (parts.length > step) {
          // Reconstruct the HTML with the replacement
          html = parts.slice(0, step).join(placeholder) + replacement + parts.slice(step).join(placeholder);
        }
      }
    }
    
    // Write the updated HTML back to the file
    fs.writeFileSync(REPORT_PATH, html);
    console.log('Successfully updated the report with screenshots!');
  } catch (error) {
    console.error('Error updating report:', error);
  }
}

// Run the script
updateReport(); 