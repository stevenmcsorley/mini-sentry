// Load environment variables
require('dotenv').config();

const config = {
  requireModule: ['ts-node/register'],
  require: ['support/world.ts', 'support/hooks.ts', 'step-definitions/**/*.ts'],
  format: [
    'progress-bar',
    'json:reports/cucumber-report.json',
    'html:reports/cucumber-report.html',
    '@cucumber/pretty-formatter'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  worldParameters: {
    // Mini Sentry configuration
    miniSentryUrl: process.env.VITE_MINI_SENTRY_URL || 'http://localhost:8000',
    miniSentryUiUrl: process.env.VITE_MINI_SENTRY_UI_URL || 'http://localhost:5173',
    
    // Test application configuration  
    testAppUrl: process.env.TEST_APP_FRONTEND_URL || 'http://localhost:3001',
    testApiUrl: process.env.TEST_APP_BACKEND_URL || 'http://localhost:3002',
    
    // Test project configuration
    testProjectId: process.env.TEST_PROJECT_ID || '4',
    testProjectName: process.env.TEST_PROJECT_NAME || 'test',
    testProjectToken: process.env.VITE_MINI_SENTRY_TOKEN || 't_BYTD5BscDMRPR807TJ7MdfqRjJEYHdkhr8TE-nnwA',
    
    // Test configuration
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT) || 30000,
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    headless: process.env.HEADLESS !== 'false',
    
    // Browser configuration
    browser: process.env.BROWSER || 'chromium',
    viewport: {
      width: 1280,
      height: 720
    }
  },
  publishQuiet: true
};

module.exports = config;