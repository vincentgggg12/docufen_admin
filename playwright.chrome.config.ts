import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 180000,
  expect: {
    timeout: 30000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    // Use Chrome instead of Chromium
    channel: 'chrome',
    
    // Run in headed mode to see what's happening
    headless: false,
    
    // Base URL
    baseURL: process.env.BASE_URL || 'https://app.docufen.com',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Slow down actions
    actionTimeout: 30000,
    
    // Navigation timeout
    navigationTimeout: 60000,
    
    // Context options
    contextOptions: {
      // Permissions
      permissions: ['clipboard-read', 'clipboard-write', 'notifications'],
      
      // Accept downloads
      acceptDownloads: true,
      
      // Record HAR for debugging network issues
      recordHar: {
        path: './playwright-results/network.har',
        mode: 'minimal',
      },
      
      // Record video
      recordVideo: {
        dir: './playwright-results/videos',
        size: { width: 1920, height: 1080 }
      }
    },
    
    // Launch options
    launchOptions: {
      slowMo: 100,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ]
    }
  },
  
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});