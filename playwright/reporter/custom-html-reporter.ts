import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// The reporter outputs a single standalone HTML report that lists every test and step in
// an easy-to-scan table (Test #, Step #, Procedure, Expected Result, Screenshots, Result).
// The implementation closely follows the plan documented in `custom-report-plan.md`.

// Dynamically import the metadata file *at runtime* so that any update to the
// object is automatically picked up on the next test run.
const require = createRequire(import.meta.url);
let testMetadata: Record<string, any> = {};
try {
  /* eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires */
  testMetadata = require(path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'tests',
    'test-metadata.ts'
  )).testMetadata ?? {};
} catch {
  // Metadata is optional – proceed with an empty object if it cannot be loaded.
  testMetadata = {};
}

interface CollectedStep {
  step: string;
  status: 'running' | 'passed' | 'failed';
  screenshots?: { name: string; path?: string }[];
}

interface CollectedTest {
  testNumber: string;
  stepNumber: string;
  description: string;
  acceptanceCriteria: string[];
  results: CollectedStep[];
  status: string;
  screenshots: { name: string; path?: string }[];
}

class CustomHtmlReporter implements Reporter {
  private results: CollectedTest[] = [];

  /** Location of the generated HTML file (can be overridden via reporter options). */
  private reportPath: string;

  constructor(options: { outputFile?: string } = {}) {
    this.reportPath = options.outputFile ?? path.join('playwright/results/test-reports', 'custom-report.html');
  }

  /* ------------------------------- LIFECYCLE ------------------------------- */
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`📋 Starting test run with ${suite.allTests().length} tests – custom reporter enabled.`);
  }

  onTestBegin(test: TestCase) {
    console.log(`[CustomReporter] Test begin: ${test.title}`);
    this.results.push({
      testNumber: this.extractTestNumber(test.title),
      stepNumber: this.extractStepNumber(test.title),
      description: test.title,
      acceptanceCriteria: this.lookupAcceptanceCriteria(test),
      results: [],
      status: 'running',
      screenshots: [],
    });
  }

  onStepBegin(test: TestCase, _result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      const t = this.findTest(test);
      if (t) {
        t.results.push({ step: step.title, status: 'running' });
      }
    }
  }

  onStepEnd(test: TestCase, _result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      const t = this.findTest(test);
      if (!t) return;
      const s = t.results.find((r) => r.step === step.title);
      if (s) {
        s.status = step.error ? 'failed' : 'passed';
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const t = this.findTest(test);
    if (!t) return;

    t.status = result.status;

    // Collect screenshots attached to the test and associate them with the last recorded sub-step
    for (const attachment of result.attachments) {
      if (attachment.contentType?.startsWith('image/')) {
        // push into overall screenshots collection for the test row
        t.screenshots.push({ name: attachment.name ?? 'screenshot', path: attachment.path });
        // also associate with the last recorded step for fine-grained view
        const lastSub = t.results[t.results.length - 1];
        if (lastSub) {
          if (!lastSub.screenshots) lastSub.screenshots = [];
          lastSub.screenshots.push({ name: attachment.name ?? 'screenshot', path: attachment.path });
        }
      }
    }
  }

  onEnd(result: FullResult) {
    this.writeHtml();
    console.log(`🏁 Tests finished with status: ${result.status}`);
    console.log(`📄 Custom HTML report generated at: ${this.reportPath}`);
  }

  /* --------------------------- INTERNAL UTILITIES -------------------------- */
  private findTest(test: TestCase) {
    return this.results.find(
      (t) =>
        t.testNumber === this.extractTestNumber(test.title) &&
        t.stepNumber === this.extractStepNumber(test.title)
    );
  }

  private extractTestNumber(title: string): string {
    const match = title.match(/Test\s*(\d+)/i);
    return match ? match[1].padStart(3, '0') : 'N/A';
  }

  private extractStepNumber(title: string): string {
    const match = title.match(/Step\s*([\d\.]+)/i);
    return match ? match[1] : '0';
  }

  private lookupAcceptanceCriteria(test: TestCase): string[] {
    const testNum = `Test${this.extractTestNumber(test.title)}`;
    const stepNum = `Step ${this.extractStepNumber(test.title)}`;

    const meta = testMetadata?.[testNum]?.[stepNum]?.acceptanceCriteria;
    if (meta && Array.isArray(meta)) return meta;
    return [`Expected result for: ${test.title}`];
  }

  /** Generates and writes the HTML report file to disk. */
  private writeHtml() {
    const dir = path.dirname(this.reportPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Playwright Test Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
  th { background-color: #f2f2f2; }
  tr:nth-child(even) { background-color: #fafafa; }
  .passed { color: green; }
  .failed { color: red; }
  .running { color: orange; }
  .screenshots { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .screenshot img { max-width: 220px; border: 1px solid #ddd; }
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
    ${this.results
      .map((t) => {
        const stepsHtml = t.results
          .map(
            (s) => `<li class="${s.status}">${s.step} – ${s.status}</li>`
          )
          .join('');

        const screenshotsHtml = t.screenshots
          .map((sc) => {
            const rel = sc.path ? path.relative(path.dirname(this.reportPath), sc.path) : '';
            return `<div class="screenshot"><p>${sc.name}</p><img src="${rel}" alt="${sc.name}"></div>`;
          })
          .join('');

        return `<tr>
          <td>${t.testNumber}</td>
          <td>${t.stepNumber}</td>
          <td><ul>${stepsHtml}</ul></td>
          <td><ul>${t.acceptanceCriteria.map((c) => `<li>${c}</li>`).join('')}</ul></td>
          <td><div class="screenshots">${screenshotsHtml}</div></td>
          <td class="${t.status}">${t.status}</td>
        </tr>`;
      })
      .join('')}
  </tbody>
</table>
</body>
</html>`;

    fs.writeFileSync(this.reportPath, html);
  }
}

export default CustomHtmlReporter; 