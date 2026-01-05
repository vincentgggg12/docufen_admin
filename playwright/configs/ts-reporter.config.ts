import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: '../tests',
  
  // Use our custom reporter
  reporter: [
    ['./playwright/tests/utils/ts-custom-reporter-fixed.ts'],
    ['list']
  ],

  // Specific configuration for TS tests
  use: {
    baseURL: 'https://localhost:3030',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Output directory for test results
  outputDir: './playwright/playwright-results',
  
  // Timeouts
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
});