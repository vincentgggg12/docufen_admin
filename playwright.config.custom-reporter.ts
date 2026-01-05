import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

// Custom config that only uses the custom HTML reporter
export default defineConfig({
  ...baseConfig,
  reporter: [
    ['./playwright/reporter/custom-html-reporter.ts']
  ],
});