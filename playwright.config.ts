import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.playwright.env' });

const baseURL = process.env.BASE_URL ||  'https://beta.docufen.com'


export default defineConfig({
  testDir: './playwright/tests',
  outputDir: './playwright/playwright-results',
  timeout: 120000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Use our custom reporter for the detailed report with screenshots
  reporter: [
    ['./playwright/tests/utils/custom-reporter.ts'], // Our custom reporter with screenshots
    ['html', { outputFolder: 'playwright/report' }] // Default HTML reporter for standard Playwright reports
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    // Take screenshots on test failure
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});