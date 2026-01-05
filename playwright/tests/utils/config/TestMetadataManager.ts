import { ConfigLoader, TestConfig, TestStep } from './ConfigLoader';

export class TestMetadataManager {
  private configLoader: ConfigLoader;
  private testConfigs: Map<string, TestConfig>;

  constructor() {
    this.configLoader = ConfigLoader.getInstance();
    this.testConfigs = new Map();
    this.loadAllConfigs();
  }

  private loadAllConfigs(): void {
    try {
      this.testConfigs = this.configLoader.getAllTests();
    } catch (error) {
      console.error('Failed to load test configurations:', error);
    }
  }

  /**
   * Get expected result for a test step
   */
  getExpectedResult(testId: string, stepNumber: string): string {
    const testConfig = this.testConfigs.get(testId);
    if (!testConfig) {
      return 'Operation should complete successfully';
    }

    const step = testConfig.steps.find(s => s.stepNumber === stepNumber);
    return step?.expectedResult || 'Operation should complete successfully';
  }

  /**
   * Get expected result by matching procedure text
   */
  getExpectedResultByProcedure(procedure: string): string {
    // First try to extract test ID and step from the procedure
    const match = procedure.match(/TS\.(\d+\.\d+-\d+).*step.*(\d+)/i);
    if (match) {
      const testId = `TS.${match[1]}`;
      const stepNum = match[2].padStart(2, '0');
      const result = this.getExpectedResult(testId, stepNum);
      if (result !== 'Operation should complete successfully') {
        return result;
      }
    }

    // Fall back to pattern matching across all tests
    for (const [testId, testConfig] of this.testConfigs) {
      for (const step of testConfig.steps) {
        for (const pattern of step.extractionPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(procedure)) {
            return step.expectedResult;
          }
        }
      }
    }

    return 'Operation should complete successfully';
  }

  /**
   * Check if a step requires a screenshot
   */
  requiresScreenshot(testId: string, stepNumber: string): boolean {
    const testConfig = this.testConfigs.get(testId);
    if (!testConfig) return false;

    const step = testConfig.steps.find(s => s.stepNumber === stepNumber);
    return step?.requiresScreenshot || false;
  }

  /**
   * Get test name
   */
  getTestName(testId: string): string {
    return this.testConfigs.get(testId)?.testName || testId;
  }

  /**
   * Get test description
   */
  getTestDescription(testId: string): string {
    return this.testConfigs.get(testId)?.description || '';
  }

  /**
   * Reload configurations (useful for development)
   */
  reload(): void {
    this.configLoader.clearCache();
    this.loadAllConfigs();
  }
}