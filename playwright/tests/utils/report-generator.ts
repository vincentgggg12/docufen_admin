import * as fs from 'fs';
import * as path from 'path';
import { TestCase, TestResult } from '@playwright/test/reporter';

interface TestStep {
  id: string;
  testNumber: string;
  stepNumber: string;
  procedure: string;
  expectedResult: string;
  screenshots: string[];
  result: 'passed' | 'failed' | 'skipped';
}

/**
 * Generate a detailed test report with screenshots
 */
export class ReportGenerator {
  private readonly reportPath: string;
  private readonly testResultsDir: string;
  private readonly steps: Map<string, TestStep>;

  constructor() {
    this.reportPath = path.join(process.cwd(), 'playwright/results/test-reports', 'detailed-test-report.html');
    this.testResultsDir = path.join(process.cwd(), 'playwright/results/test-results');
    this.steps = new Map();
    
    // Ensure directories exist
    this.ensureDirectoryExists(path.join(process.cwd(), 'playwright/results/test-reports'));
  }

  /**
   * Initialize the report with basic structure
   */
  public initReport(): void {
    const templateHtml = `<!DOCTYPE html>
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
</html>`;

    fs.writeFileSync(this.reportPath, templateHtml);
  }

  /**
   * Register a test step
   */
  public registerStep(testCase: TestCase, result: TestResult): void {
    // Extract step number from title (assuming format like "Step X: ...")
    const stepMatch = testCase.title.match(/Step\s+(\d+):/i);
    if (!stepMatch) return;

    const stepNumber = stepMatch[1];
    const testId = 'test-002'; // Hard-coded for this specific test
    const stepId = `${testId}-step-${stepNumber}`;
    
    // Create or update step
    if (!this.steps.has(stepId)) {
      this.steps.set(stepId, {
        id: stepId,
        testNumber: 'N/A',
        stepNumber,
        procedure: '',
        expectedResult: `Expected result for: ${testCase.title}`,
        screenshots: [],
        result: result.status === 'passed' ? 'passed' : 'failed'
      });
    } else {
      const step = this.steps.get(stepId)!;
      step.result = result.status === 'passed' ? 'passed' : 'failed';
    }
  }

  /**
   * Find screenshots for a specific step
   */
  public findScreenshots(): void {
    if (!fs.existsSync(this.testResultsDir)) return;

    const files = fs.readdirSync(this.testResultsDir);
    
    // Process each step
    this.steps.forEach(step => {
      const stepNum = step.stepNumber;
      const screenshots: string[] = [];
      
      // Find matching screenshots
      files.forEach(file => {
        if (file.endsWith('.png')) {
          const match = file.match(/step(\d+)/);
          if (match && match[1] === stepNum) {
            screenshots.push(`../playwright/results/test-results/${file}`);
          } else if (stepNum === '4' && file === 'grady-permissions-check.png') {
            screenshots.push(`../playwright/results/test-results/${file}`);
          } else if (stepNum === '8' && file === 'grady-details-after-login.png') {
            screenshots.push(`../playwright/results/test-results/${file}`);
          }
        }
      });
      
      // Update step with screenshots
      step.screenshots = screenshots;
    });
  }

  /**
   * Generate the final HTML report
   */
  public generateReport(): void {
    // Find screenshots for all steps
    this.findScreenshots();
    
    // Read template if report exists, otherwise create it
    if (!fs.existsSync(this.reportPath)) {
      this.initReport();
    }
    
    let html = fs.readFileSync(this.reportPath, 'utf8');
    
    // Create rows for each step
    const rows: string[] = [];
    
    // Sort steps by step number
    const sortedSteps = Array.from(this.steps.values())
      .sort((a, b) => parseInt(a.stepNumber) - parseInt(b.stepNumber));
    
    for (const step of sortedSteps) {
      // Create HTML for screenshots
      const screenshotsHtml = step.screenshots
        .map(screenshot => `<div class="screenshot"><img src="${screenshot}" alt="Step ${step.stepNumber} screenshot" /></div>`)
        .join('');
      
      // Create row HTML
      const row = `<tr>
        <td>${step.testNumber}</td>
        <td>${step.stepNumber}</td>
        <td><ul>${step.procedure}</ul></td>
        <td><ul><li>${step.expectedResult}</li></ul></td>
        <td><div class="screenshots">${screenshotsHtml}</div></td>
        <td class="${step.result}">${step.result}</td>
      </tr>`;
      
      rows.push(row);
    }
    
    // Insert rows into table body
    const tableBodyRegex = /<tbody>([\s\S]*?)<\/tbody>/;
    html = html.replace(tableBodyRegex, `<tbody>${rows.join('')}</tbody>`);
    
    // Write updated HTML
    fs.writeFileSync(this.reportPath, html);
    
    console.log(`Report generated at: ${this.reportPath}`);
  }

  /**
   * Ensure a directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator(); 