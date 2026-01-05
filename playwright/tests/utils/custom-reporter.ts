import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { reportGenerator } from './report-generator';

/**
 * Custom reporter that generates a detailed HTML report with screenshots
 */
class CustomReporter implements Reporter {
  private testCaseStartTimes = new Map<string, number>();

  onBegin(): void {
    console.log('Starting the test run with custom reporter...');
    // Initialize the report
    reportGenerator.initReport();
  }

  onTestBegin(test: TestCase): void {
    // Track test start time
    this.testCaseStartTimes.set(test.id, Date.now());
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Register this test step
    reportGenerator.registerStep(test, result);
  }

  onEnd(): void {
    // Generate the final report
    reportGenerator.generateReport();
    console.log('Custom reporter finished generating detailed report with screenshots');
  }
}

export default CustomReporter; 