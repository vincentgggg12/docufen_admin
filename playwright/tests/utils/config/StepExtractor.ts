import { ConfigLoader } from './ConfigLoader';

export class StepExtractor {
  private configLoader: ConfigLoader;
  private stepPatterns: Map<string, { testId: string; stepNumber: string }[]>;

  constructor() {
    this.configLoader = ConfigLoader.getInstance();
    this.stepPatterns = new Map();
    this.buildPatternMap();
  }

  private buildPatternMap(): void {
    const allTests = this.configLoader.getAllTests();
    
    for (const [testId, testConfig] of allTests) {
      for (const step of testConfig.steps) {
        for (const pattern of step.extractionPatterns) {
          if (!this.stepPatterns.has(pattern)) {
            this.stepPatterns.set(pattern, []);
          }
          this.stepPatterns.get(pattern)!.push({
            testId,
            stepNumber: step.stepNumber
          });
        }
      }
    }
  }

  /**
   * Extract step number from a procedure title
   */
  extractStepNumber(title: string, currentTestId?: string): string {
    // First try exact match
    for (const [pattern, matches] of this.stepPatterns) {
      if (title.includes(pattern)) {
        // If we have a current test ID, prefer matches from that test
        if (currentTestId) {
          const match = matches.find(m => m.testId === currentTestId);
          if (match) return match.stepNumber;
        }
        // Otherwise return the first match
        return matches[0].stepNumber;
      }
    }

    // Try regex matching
    for (const [pattern, matches] of this.stepPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(title)) {
          if (currentTestId) {
            const match = matches.find(m => m.testId === currentTestId);
            if (match) return match.stepNumber;
          }
          return matches[0].stepNumber;
        }
      } catch (e) {
        // Pattern might not be a valid regex, skip it
      }
    }

    // Fallback patterns
    const fallbackMatch = title.match(/TS\.\d+\.\d+-(\d+)|step\s+(\d+)/i);
    if (fallbackMatch) {
      const num = fallbackMatch[1] || fallbackMatch[2];
      return num.padStart(2, '0');
    }

    return '01';
  }

  /**
   * Extract test ID from procedure or test title
   */
  extractTestId(text: string): string | null {
    // First try to extract full test ID (e.g., TS.6.1-01)
    const fullMatch = text.match(/TS\.(\d+\.\d+-\d+)/);
    if (fullMatch) {
      return `TS.${fullMatch[1]}`;
    }
    
    // If only section found (e.g., TS.6.1), we need to determine which test
    // For now, return the section ID and we'll handle it differently
    const sectionMatch = text.match(/TS\.(\d+\.\d+)/);
    if (sectionMatch) {
      // Return with -01 as default for now
      // In a real scenario, we'd need more context to determine the exact test
      return `TS.${sectionMatch[1]}-01`;
    }
    
    return null;
  }

  /**
   * Reload patterns (useful for development)
   */
  reload(): void {
    this.configLoader.clearCache();
    this.stepPatterns.clear();
    this.buildPatternMap();
  }
}