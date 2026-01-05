import path from 'path';

/**
 * Centralized path configuration for Playwright tests
 */

// Base paths
export const PLAYWRIGHT_ROOT = path.join(process.cwd(), 'playwright');
export const RESULTS_ROOT = path.join(PLAYWRIGHT_ROOT, 'playwright-results');
export const REPORTS_ROOT = path.join(PLAYWRIGHT_ROOT, 'results', 'test-reports');
export const TEST_RESULTS_ROOT = path.join(PLAYWRIGHT_ROOT, 'results', 'test-results');

// Helper function to get screenshot path
export function getScreenshotPath(filename: string): string {
  return path.join(RESULTS_ROOT, filename);
}

// Ensure all directories exist
import fs from 'fs';

[RESULTS_ROOT, REPORTS_ROOT, TEST_RESULTS_ROOT].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});