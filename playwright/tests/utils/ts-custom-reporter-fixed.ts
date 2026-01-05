import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { RESULTS_ROOT } from './paths';

interface TestStepData {
  testId: string;
  stepNumber: string;
  procedure: string;
  expectedResult: string;
  actualResult: string;
  screenshots: string[];
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  timestamp: string;
}

interface TestMetadata {
  testId: string;
  testName: string;
  description?: string;
}

class TSCustomReporter implements Reporter {
  private testSteps: TestStepData[] = [];
  private currentTestId: string = '';
  private currentTestFile: string = '';
  private testIdsByFile: Map<string, string> = new Map();
  private reportPath: string;
  private screenshotsDir: string;
  private testMetadata: Map<string, TestMetadata> = new Map();

  constructor() {
    // Use absolute paths based on project root
    const projectRoot = path.resolve(process.cwd());
    this.reportPath = path.join(projectRoot, 'playwright', 'playwright-results', 'ts-test-report.html');
    this.screenshotsDir = path.join(projectRoot, 'playwright', 'playwright-results');
    
    // Load test metadata
    this.loadTestMetadata();
  }

  private loadTestMetadata() {
    try {
      const metadataPath = path.join(process.cwd(), 'playwright', 'test-metadata', '6-document-completion', '6.1-create-new-document.json');
      if (fs.existsSync(metadataPath)) {
        const data = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        data.tests.forEach((test: any) => {
          this.testMetadata.set(test.testId, {
            testId: test.testId,
            testName: test.testName,
            description: test.description
          });
        });
      }
    } catch (error) {
      console.error('Error loading test metadata:', error);
    }
  }

  onBegin(config: any, suite: any) {
    console.log('Starting the test run with custom reporter...');
    // Ensure results directory exists
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  onTestBegin(test: TestCase) {
    this.currentTestFile = test.location.file;
    
    // Extract test ID from the file name first (most reliable)
    const fileMatch = test.location.file.match(/TS\.(\d+\.\d+-\d+)/);
    if (fileMatch) {
      this.currentTestId = `TS.${fileMatch[1]}`;
    } else {
      // Fallback to test title
      const titleMatch = test.title.match(/TS\.\d+\.\d+-\d+/);
      if (titleMatch) {
        this.currentTestId = titleMatch[0];
      }
    }
    
    // Store the mapping of file to test ID
    if (this.currentTestId && this.currentTestFile) {
      this.testIdsByFile.set(this.currentTestFile, this.currentTestId);
    }
    
    console.log(`Starting test: ${this.currentTestId} from file: ${test.location.file}`);
  }

  onStepEnd(test: TestCase, _result: TestResult, step: any) {
    if (step.category === 'test.step') {
      // Keep the full step title including (SC) if present
      const stepTitle = step.title;
      
      // Get the test ID for this specific test file
      const testFile = test.location.file;
      const testIdForThisStep = this.testIdsByFile.get(testFile) || this.currentTestId;
      
      // Try to extract step number from the title
      const stepNumberMatch = stepTitle.match(/Step (\d+):|^\d+\.|^(\d+)\s/);
      const stepNumber = stepNumberMatch ? (stepNumberMatch[1] || stepNumberMatch[2]) : 
                        String(this.testSteps.filter(s => s.testId === testIdForThisStep).length + 1).padStart(2, '0');

      // Load expected result from configuration
      let expectedResult = 'Operation should complete successfully';
      try {
        const configPath = path.join(process.cwd(), 'playwright', 'test-metadata', '6-document-completion', '6.1-create-new-document.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          const test = config.tests.find((t: any) => t.testId === testIdForThisStep);
          if (test) {
            const stepConfig = test.steps.find((s: any) => 
              s.extractionPatterns.some((pattern: string) => 
                new RegExp(pattern, 'i').test(stepTitle)
              )
            );
            if (stepConfig) {
              expectedResult = stepConfig.expectedResult;
            }
          }
        }
      } catch (error) {
        console.error('Error loading expected result:', error);
      }

      // Collect screenshots for this step
      const screenshots: string[] = [];
      // Use the specific test ID to match screenshots (e.g., TS.6.1-02-04-...)
      const testIdParts = testIdForThisStep.replace('TS.', '').replace('.', '\\.');
      const screenshotPattern = new RegExp(`TS\\.${testIdParts}-${stepNumber}.*\\.png$`);
      
      if (fs.existsSync(this.screenshotsDir)) {
        const files = fs.readdirSync(this.screenshotsDir);
        files.forEach(file => {
          if (screenshotPattern.test(file)) {
            screenshots.push(file);
          }
        });
      }

      const stepData: TestStepData = {
        testId: testIdForThisStep,  // Use the test ID specific to this step's test file
        stepNumber: stepNumber,
        procedure: stepTitle,
        expectedResult: expectedResult,
        actualResult: step.error ? step.error.message : 'As expected',
        screenshots: screenshots,
        status: step.error ? 'failed' : 'passed',
        duration: step.duration || 0,
        timestamp: new Date().toISOString()
      };

      this.testSteps.push(stepData);
    }
  }

  onEnd() {
    this.generateReport();
    console.log(`Report generated at: ${this.reportPath}`);
    console.log('Custom reporter finished generating detailed report with screenshots');
  }

  private generateReport() {
    // Group test steps by test ID
    const testGroups = new Map<string, TestStepData[]>();
    this.testSteps.forEach(step => {
      if (!testGroups.has(step.testId)) {
        testGroups.set(step.testId, []);
      }
      testGroups.get(step.testId)!.push(step);
    });

    // Sort test groups by test ID
    const sortedTestIds = Array.from(testGroups.keys()).sort();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${this.currentTestId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(to bottom right, hsl(149, 80%, 27%) 0%, hsla(149, 80%, 27%, 0.8) 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .meta-info {
            display: flex;
            gap: 30px;
            font-size: 0.95em;
            opacity: 0.9;
        }
        
        .test-section {
            margin-bottom: 30px;
        }
        
        .test-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-left: 4px solid hsl(149, 80%, 30%);
            margin-bottom: 15px;
        }
        
        .test-header h3 {
            color: hsl(149, 80%, 25%);
            font-size: 1.3em;
            margin-bottom: 5px;
        }
        
        .test-description {
            color: #6c757d;
            font-size: 0.95em;
        }
        
        .report-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background-color: hsl(149, 80%, 20%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #ecf0f1;
            vertical-align: top;
        }
        
        /* Column width adjustments */
        th:nth-child(3), td:nth-child(3) {
            max-width: 250px;
        }
        
        /* Limit width of Actual Result column */
        th:nth-child(4), td:nth-child(4) {
            min-width: 200px;
            max-width: 350px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        /* Hover effect for truncated text */
        td:nth-child(4) span[title] {
            cursor: help;
            text-decoration: underline;
            text-decoration-style: dotted;
            text-decoration-color: #95a5a6;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .test-id {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .step-number {
            background: hsl(149, 80%, 35%);
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 600;
            display: inline-block;
        }
        
        .status {
            padding: 6px 12px;
            border-radius: 5px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8em;
            text-align: center;
        }
        
        .status.passed {
            background-color: #27ae60;
            color: white;
        }
        
        .status.failed {
            background-color: #e74c3c;
            color: white;
        }
        
        .status.skipped {
            background-color: #95a5a6;
            color: white;
        }
        
        .screenshots {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .screenshot-thumb {
            position: relative;
            cursor: pointer;
            transition: transform 0.2s ease;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .screenshot-thumb:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .screenshot-thumb img {
            width: 150px;
            height: 100px;
            object-fit: cover;
            display: block;
        }
        
        .screenshot-label {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 5px;
            font-size: 0.7em;
            text-align: center;
        }
        
        /* Modal for full-size images */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            cursor: pointer;
        }
        
        .modal-content {
            margin: auto;
            display: block;
            max-width: 90%;
            max-height: 90%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 5px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .close {
            position: absolute;
            top: 15px;
            right: 35px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            transition: 0.3s;
            cursor: pointer;
        }
        
        .close:hover {
            color: #bdc3c7;
        }
        
        .summary {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .summary-stats {
            display: flex;
            gap: 30px;
            margin-top: 15px;
        }
        
        .stat {
            flex: 1;
            text-align: center;
            padding: 15px;
            border-radius: 5px;
            background: #ecf0f1;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #7f8c8d;
        }
        
        .stat.passed .stat-value { color: #27ae60; }
        .stat.failed .stat-value { color: #e74c3c; }
        .stat.skipped .stat-value { color: #95a5a6; }
        
        /* Accordion styles */
        .accordion {
            margin-bottom: 20px;
        }
        
        .accordion-item {
            background: white;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .accordion-header {
            background: hsl(149, 80%, 35%);
            color: white;
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 1.1em;
            transition: background-color 0.3s ease;
        }
        
        .accordion-header:hover {
            background: hsl(149, 80%, 30%);
        }
        
        .accordion-header.collapsed {
            background: hsl(149, 60%, 40%);
        }
        
        .accordion-icon {
            transition: transform 0.3s ease;
            font-size: 1.2em;
        }
        
        .accordion-header.collapsed .accordion-icon {
            transform: rotate(-90deg);
        }
        
        .accordion-content {
            padding: 20px;
            display: none;
        }
        
        .accordion-content.expanded {
            display: block;
        }
        
        .sub-accordion {
            margin-top: 15px;
        }
        
        .sub-accordion-item {
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 10px;
            overflow: hidden;
        }
        
        .sub-accordion-header {
            background: hsl(149, 60%, 45%);
            color: white;
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            font-size: 1em;
            transition: background-color 0.3s ease;
        }
        
        .sub-accordion-header:hover {
            background: hsl(149, 60%, 40%);
        }
        
        .sub-accordion-content {
            padding: 15px;
            display: none;
        }
        
        .sub-accordion-content.expanded {
            display: block;
        }
        
        .placeholder-content {
            padding: 20px;
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Execution Report</h1>
            <div class="meta-info">
                <div>Test ID: ${this.currentTestId}</div>
                <div>Executed: ${new Date().toLocaleString()}</div>
                <div>Environment: ${process.env.NODE_ENV || 'development'}</div>
            </div>
        </div>
        
        <div class="summary">
            <h2>Test Summary</h2>
            <div class="summary-stats">
                <div class="stat passed">
                    <div class="stat-value">${this.testSteps.filter(s => s.status === 'passed').length}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat failed">
                    <div class="stat-value">${this.testSteps.filter(s => s.status === 'failed').length}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat skipped">
                    <div class="stat-value">${this.testSteps.filter(s => s.status === 'skipped').length}</div>
                    <div class="stat-label">Skipped</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${this.testSteps.length}</div>
                    <div class="stat-label">Total Steps</div>
                </div>
            </div>
        </div>
        
        <!-- Accordion sections -->
        <div class="accordion">
            <!-- Login & Authentication -->
            <div class="accordion-item">
                <div class="accordion-header collapsed" onclick="toggleAccordion(this)">
                    <span>1. Login & Authentication</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    <div class="placeholder-content">No tests available yet</div>
                </div>
            </div>
            
            <!-- Setup Wizard -->
            <div class="accordion-item">
                <div class="accordion-header collapsed" onclick="toggleAccordion(this)">
                    <span>2. Setup Wizard</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    <div class="placeholder-content">No tests available yet</div>
                </div>
            </div>
            
            <!-- Account -->
            <div class="accordion-item">
                <div class="accordion-header collapsed" onclick="toggleAccordion(this)">
                    <span>3. Account</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    <div class="placeholder-content">No tests available yet</div>
                </div>
            </div>
            
            <!-- Users -->
            <div class="accordion-item">
                <div class="accordion-header collapsed" onclick="toggleAccordion(this)">
                    <span>4. Users</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    <div class="placeholder-content">No tests available yet</div>
                </div>
            </div>
            
            <!-- Documents -->
            <div class="accordion-item">
                <div class="accordion-header collapsed" onclick="toggleAccordion(this)">
                    <span>5. Documents</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content">
                    <div class="placeholder-content">No tests available yet</div>
                </div>
            </div>
            
            <!-- Document Completion -->
            <div class="accordion-item">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span>6. Document Completion</span>
                    <span class="accordion-icon">▼</span>
                </div>
                <div class="accordion-content expanded">
                    <div class="sub-accordion">
                        <!-- Create New Document -->
                        <div class="sub-accordion-item">
                            <div class="sub-accordion-header" onclick="toggleSubAccordion(this)">
                                <span>6.1. Create New Document</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="sub-accordion-content expanded">
                                ${this.generateTestSections(sortedTestIds, testGroups)}
                            </div>
                        </div>
                        
                        <!-- Create Controlled Copy -->
                        <div class="sub-accordion-item">
                            <div class="sub-accordion-header collapsed" onclick="toggleSubAccordion(this)">
                                <span>6.2.Create Controlled Copy</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="sub-accordion-content">
                                <div class="placeholder-content">Coming soon...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal for displaying full-size images -->
    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close">&times;</span>
        <img class="modal-content" id="modalImage">
    </div>
    
    <script>
        function openModal(imageSrc) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'block';
            modalImg.src = imageSrc;
        }
        
        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }
        
        // Close modal on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
        
        // Accordion toggle functions
        function toggleAccordion(header) {
            const content = header.nextElementSibling;
            const isExpanded = content.classList.contains('expanded');
            
            // Toggle the current accordion
            header.classList.toggle('collapsed');
            content.classList.toggle('expanded');
        }
        
        function toggleSubAccordion(header) {
            const content = header.nextElementSibling;
            const isExpanded = content.classList.contains('expanded');
            
            // Toggle the current sub-accordion
            header.classList.toggle('collapsed');
            content.classList.toggle('expanded');
        }
        
        // Initialize accordion state on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Ensure Document Completion accordion is expanded by default
            const documentCompletionAccordion = document.querySelector('.accordion-item:last-child .accordion-content');
            if (documentCompletionAccordion && !documentCompletionAccordion.classList.contains('expanded')) {
                documentCompletionAccordion.classList.add('expanded');
            }
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(this.reportPath, html);
  }

  private generateTestSections(sortedTestIds: string[], testGroups: Map<string, TestStepData[]>): string {
    return sortedTestIds.map(testId => {
      const executedSteps = testGroups.get(testId) || [];
      const metadata = this.testMetadata.get(testId);
      const testName = metadata?.testName || testId;
      const description = metadata?.description || '';
      
      // For TS.6.1-02, we need to handle the modified test with 6 steps
      let allSteps: TestStepData[] = [];
      
      if (testId === 'TS.6.1-02') {
        // Define all 6 steps for the modified test
        const stepDefinitions = [
          { num: '01', proc: 'Open create document dialog', exp: 'Create document dialog opens.' },
          { num: '02', proc: 'Leave document name field empty', exp: 'Document name field is empty.' },
          { num: '03', proc: 'Upload a .docx file', exp: 'File is uploaded successfully.' },
          { num: '04', proc: 'Verify Create Document button is disabled', exp: 'Create Document button is disabled.' },
          { num: '05', proc: 'Enter valid document name', exp: 'Test Document is entered as document name.' },
          { num: '06', proc: 'Verify Create Document button is enabled', exp: 'Create Document button is enabled.' }
        ];
        
        // Create a map of executed steps by step number
        const executedMap = new Map<string, TestStepData>();
        executedSteps.forEach(step => {
          executedMap.set(step.stepNumber, step);
        });
        
        // Build all steps, using executed data where available
        allSteps = stepDefinitions.map(def => {
          const executed = executedMap.get(def.num);
          if (executed) {
            return executed;
          } else {
            // Create a "not executed" step
            return {
              testId: testId,
              stepNumber: def.num,
              procedure: def.proc,
              expectedResult: def.exp,
              actualResult: 'Not executed',
              screenshots: [],
              status: 'skipped' as const,
              duration: 0,
              timestamp: new Date().toISOString()
            };
          }
        });
      } else {
        // For other tests, just use executed steps
        allSteps = executedSteps;
      }
      
      return `
        <div class="test-section">
          <div class="test-header">
            <h3>${testId} ${testName}</h3>
            ${description ? `<div class="test-description">${description}</div>` : ''}
          </div>
          <div class="report-table">
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Test Procedure</th>
                  <th>Expected Result</th>
                  <th>Actual Result</th>
                  <th>Screenshots</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateTableRows(allSteps)}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }

  private generateTableRows(steps: TestStepData[]): string {
    return steps.map(step => {
      const screenshotsHtml = step.screenshots
        .map(screenshot => {
          // Use just the filename since both HTML and images are in the same directory
          const label = screenshot.replace(/\.png$/i, '').replace(/[_-]/g, ' ');
          return `
            <div class="screenshot-thumb" onclick="openModal('${screenshot}')">
                <img src="${screenshot}" alt="${label}" />
                <div class="screenshot-label">${label}</div>
            </div>
          `;
        })
        .join('');

      // Add title attribute for tooltip on long actual results
      const actualResultHtml = step.actualResult.length > 100 
        ? `<span title="${step.actualResult.replace(/"/g, '&quot;')}">${step.actualResult}</span>`
        : step.actualResult;

      return `
        <tr>
            <td><span class="step-number">${step.stepNumber}</span></td>
            <td>${step.procedure}</td>
            <td>${step.expectedResult}</td>
            <td>${actualResultHtml}</td>
            <td><div class="screenshots">${screenshotsHtml || 'No screenshots'}</div></td>
            <td>${(step.duration / 1000).toFixed(2)}s</td>
            <td><span class="status ${step.status}">${step.status}</span></td>
        </tr>
      `;
    }).join('');
  }
}

export default TSCustomReporter;