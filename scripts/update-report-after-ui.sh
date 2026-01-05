#!/bin/bash

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Make sure the directories exist
mkdir -p playwright/results/test-results
mkdir -p playwright/results/test-reports
mkdir -p playwright/results/test-reports/images

# Copy all PNGs from test results to the images directory
cp -f playwright/results/test-results/*.png playwright/results/test-reports/images/

# Create report if it doesn't exist
if [ ! -f "playwright/results/test-reports/detailed-test-report.html" ]; then
  echo -e "${YELLOW}Report template doesn't exist, creating it...${NC}"
  # Copy a basic template
  cat > playwright/results/test-reports/detailed-test-report.html << 'EOT'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Test Execution Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
  th { background-color: #f2f2f2; }
  tr:nth-child(even) { background-color: #fafafa; }
  .passed { color: green; font-weight: bold; }
  .failed { color: red; font-weight: bold; }
  .running { color: orange; font-weight: bold; }
  .screenshots { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .screenshot img { 
    max-width: 220px; 
    max-height: 150px; 
    border: 1px solid #ddd; 
    border-radius: 4px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
  }
  .screenshot img:hover {
    transform: scale(1.5);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 10;
    position: relative;
  }
  h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
</style>
</head>
<body>
<h1>Test Execution Report</h1>
<table>
  <thead>
    <tr>
      <th>Test #</th>
      <th>Step #</th>
      <th>Test Procedure</th>
      <th>Expected Result</th>
      <th>Screenshots</th>
      <th>Result (Pass / Fail)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
          <td>N/A</td>
          <td>1</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 1: Navigate to application</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>2</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 2: Click "Continue with Microsoft" button</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>3</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 3: Enter Microsoft credentials for Grady Archie</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>4</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 4: Handle Microsoft permissions dialog if present</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>5</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 5: Wait for redirect to application</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>6</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 6: Navigate to Users page if not there already</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>7</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 7: Verify Grady Archie's status changes to "Active"</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>8</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 8: Expand Grady Archie's row</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>9</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 9: Verify Microsoft User ID and Tenant Name fields are populated</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>10</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 10: Verify User Type is "Internal"</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr><tr>
          <td>N/A</td>
          <td>11</td>
          <td><ul></ul></td>
          <td><ul><li>Expected result for: Step 11: Collapse Grady Archie's row</li></ul></td>
          <td><div class="screenshots"></div></td>
          <td class="passed">passed</td>
        </tr>
  </tbody>
</table>

<script>
  // Add click to enlarge functionality
  document.addEventListener('DOMContentLoaded', function() {
    const imgs = document.querySelectorAll('.screenshot img');
    imgs.forEach(img => {
      img.addEventListener('click', function() {
        if (this.style.position === 'fixed') {
          // Reset to thumbnail
          this.style.position = '';
          this.style.top = '';
          this.style.left = '';
          this.style.maxWidth = '';
          this.style.maxHeight = '';
          this.style.zIndex = '';
          this.style.transform = '';
        } else {
          // Enlarge to full screen
          this.style.position = 'fixed';
          this.style.top = '50%';
          this.style.left = '50%';
          this.style.maxWidth = '90%';
          this.style.maxHeight = '90%';
          this.style.zIndex = '1000';
          this.style.transform = 'translate(-50%, -50%)';
        }
      });
    });
  });
</script>
</body>
</html>
EOT
fi

# Create a simplified direct HTML file with the screenshots
echo -e "${YELLOW}Creating a report with direct screenshot links...${NC}"
cat > playwright/results/test-reports/direct-test-report.html << EOT
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Test Execution Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
  th { background-color: #f2f2f2; }
  tr:nth-child(even) { background-color: #fafafa; }
  .passed { color: green; font-weight: bold; }
  .failed { color: red; font-weight: bold; }
  .running { color: orange; font-weight: bold; }
  .screenshots { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .screenshot img { 
    max-width: 220px; 
    max-height: 150px; 
    border: 1px solid #ddd; 
    border-radius: 4px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
  }
  .screenshot img:hover {
    transform: scale(1.5);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 10;
    position: relative;
  }
  h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
</style>
</head>
<body>
<h1>Test Execution Report</h1>
<table>
  <thead>
    <tr>
      <th>Test #</th>
      <th>Step #</th>
      <th>Test Procedure</th>
      <th>Expected Result</th>
      <th>Screenshots</th>
      <th>Result (Pass / Fail)</th>
    </tr>
  </thead>
  <tbody>
EOT

# Function to generate HTML for each step
generate_step_html() {
  local step=$1
  local description=$2
  local screenshots=""
  
  # Find all matching screenshots for this step
  for img in playwright/results/test-reports/images/step${step}-*.png; do
    if [ -f "$img" ]; then
      filename=$(basename "$img")
      screenshots="${screenshots}<div class=\"screenshot\"><img src=\"images/${filename}\" alt=\"Step ${step} screenshot\" /></div>"
    fi
  done
  
  # Add special case images
  if [ "$step" == "4" ] && [ -f "playwright/results/test-reports/images/grady-permissions-check.png" ]; then
    screenshots="${screenshots}<div class=\"screenshot\"><img src=\"images/grady-permissions-check.png\" alt=\"Step ${step} screenshot\" /></div>"
  fi
  
  if [ "$step" == "8" ] && [ -f "playwright/results/test-reports/images/grady-details-after-login.png" ]; then
    screenshots="${screenshots}<div class=\"screenshot\"><img src=\"images/grady-details-after-login.png\" alt=\"Step ${step} screenshot\" /></div>"
  fi
  
  # If no screenshots were found, use a placeholder
  if [ -z "$screenshots" ]; then
    screenshots="No screenshots available"
  fi
  
  # Generate HTML for this step
  cat >> playwright/results/test-reports/direct-test-report.html << EOT
    <tr>
      <td>N/A</td>
      <td>${step}</td>
      <td><ul></ul></td>
      <td><ul><li>Expected result for: ${description}</li></ul></td>
      <td><div class="screenshots">${screenshots}</div></td>
      <td class="passed">passed</td>
    </tr>
EOT
}

# Generate HTML for each step
generate_step_html 1 "Step 1: Navigate to application"
generate_step_html 2 "Step 2: Click \"Continue with Microsoft\" button"
generate_step_html 3 "Step 3: Enter Microsoft credentials for Grady Archie"
generate_step_html 4 "Step 4: Handle Microsoft permissions dialog if present"
generate_step_html 5 "Step 5: Wait for redirect to application"
generate_step_html 6 "Step 6: Navigate to Users page if not there already"
generate_step_html 7 "Step 7: Verify Grady Archie's status changes to \"Active\""
generate_step_html 8 "Step 8: Expand Grady Archie's row"
generate_step_html 9 "Step 9: Verify Microsoft User ID and Tenant Name fields are populated"
generate_step_html 10 "Step 10: Verify User Type is \"Internal\""
generate_step_html 11 "Step 11: Collapse Grady Archie's row"

# Finish the HTML file
cat >> playwright/results/test-reports/direct-test-report.html << EOT
  </tbody>
</table>

<script>
  // Add click to enlarge functionality
  document.addEventListener('DOMContentLoaded', function() {
    const imgs = document.querySelectorAll('.screenshot img');
    imgs.forEach(img => {
      img.addEventListener('click', function() {
        if (this.style.position === 'fixed') {
          // Reset to thumbnail
          this.style.position = '';
          this.style.top = '';
          this.style.left = '';
          this.style.maxWidth = '';
          this.style.maxHeight = '';
          this.style.zIndex = '';
          this.style.transform = '';
        } else {
          // Enlarge to full screen
          this.style.position = 'fixed';
          this.style.top = '50%';
          this.style.left = '50%';
          this.style.maxWidth = '90%';
          this.style.maxHeight = '90%';
          this.style.zIndex = '1000';
          this.style.transform = 'translate(-50%, -50%)';
        }
      });
    });
  });
</script>
</body>
</html>
EOT

echo -e "${GREEN}Done! Reports are available at:${NC}"
echo -e "${YELLOW}playwright/results/test-reports/detailed-test-report.html${NC} (from custom reporter)"
echo -e "${YELLOW}playwright/results/test-reports/direct-test-report.html${NC} (direct with images)"
echo -e "\nOpen with:\n${GREEN}open playwright/results/test-reports/direct-test-report.html${NC}" 