# Playwright Browser Compatibility Guide

To use these improvements in your tests:
- The configuration is already in 005-Pre-Approve a demo doc.spec.ts
- For even better compatibility, use Chrome: ./run-test-chrome.sh "test-name.spec.ts"
- The browser initialization script can be copied to other tests as needed

## Issue: Chromium vs Chrome Differences

When running Playwright tests, you may notice differences between Chromium (default) and Chrome, particularly with:
- Third-party services (e.g., Amplitude analytics)
- Browser fingerprinting detection
- WebGL/Canvas rendering
- Cookie handling
- CORS policies

## Solutions

### 1. Use Chrome Instead of Chromium

Run tests with Chrome browser:
```bash
# Using the custom script
./run-test-chrome.sh "test-name.spec.ts"

# Or directly with config
npx playwright test --config=playwright.chrome.config.ts
```

### 2. Browser Context Initialization

The updated tests include browser context initialization that:
- Overrides `navigator.webdriver` to hide automation
- Adds Chrome-specific objects
- Sets realistic browser properties
- Configures proper permissions

### 3. Launch Arguments

Key arguments added to make Chromium behave more like Chrome:
- `--disable-blink-features=AutomationControlled` - Hides automation indicators
- `--disable-web-security` - Helps with CORS issues
- `--user-data-dir` - Persists cookies/storage between runs
- `--enable-webgl` - Enables WebGL support

### 4. Test Configuration Updates

Tests now include:
```javascript
test.use({
  // Browser-like viewport
  viewport: { width: 1920, height: 1080 },
  
  // Realistic user agent
  contextOptions: {
    userAgent: 'Mozilla/5.0 ...',
    permissions: ['clipboard-read', 'clipboard-write'],
    // ... other options
  },
  
  // Human-like interaction speed
  launchOptions: {
    slowMo: 100,
  }
});
```

### 5. Running Tests in Headed Mode

For debugging, run tests with a visible browser:
```bash
# In test file
headless: false,

# Or via command line
npx playwright test --headed
```

## Troubleshooting

### Amplitude Not Initializing
- Use Chrome channel instead of Chromium
- Ensure cookies are enabled
- Check network tab for blocked requests

### Authentication Issues
- Clear browser data between runs
- Use persistent context for session management
- Check for browser-specific redirects

### Performance Issues
- Disable GPU acceleration in Docker/CI environments
- Reduce parallel workers
- Increase timeouts for slower operations

## Best Practices

1. **Development**: Use Chrome in headed mode for debugging
2. **CI/CD**: Use Chromium in headless mode for speed
3. **Complex Apps**: Always test in both browsers
4. **Third-party Services**: Prefer Chrome for better compatibility