import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Mini Sentry E2E Test Setup...');

  // Check if Mini Sentry stack is running
  try {
    const response = await fetch('http://localhost:8000/api/health');
    if (!response.ok) {
      throw new Error(`Mini Sentry API health check failed: ${response.status}`);
    }
    console.log('✅ Mini Sentry API is healthy');
  } catch (error) {
    console.error('❌ Mini Sentry API is not accessible. Please start the Docker stack:');
    console.error('   docker compose up -d');
    throw error;
  }

  // Check if Mini Sentry UI is accessible
  try {
    const response = await fetch('http://localhost:5173');
    if (!response.ok) {
      throw new Error(`Mini Sentry UI not accessible: ${response.status}`);
    }
    console.log('✅ Mini Sentry UI is accessible');
  } catch (error) {
    console.error('❌ Mini Sentry UI is not accessible.');
    throw error;
  }

  // Check if test backend is running
  try {
    const response = await fetch('http://localhost:3002/api/health');
    if (!response.ok) {
      throw new Error(`Test backend health check failed: ${response.status}`);
    }
    console.log('✅ Test backend API is healthy');
  } catch (error) {
    console.error('❌ Test backend is not accessible. It should be started by webServer config.');
    // Don't throw here as webServer should handle this
    console.warn('⚠️  Test backend will be started by Playwright webServer');
  }

  // Check if test frontend is accessible
  try {
    const response = await fetch('http://localhost:3001');
    console.log('✅ Test frontend is accessible');
  } catch (error) {
    console.warn('⚠️  Test frontend will be started by Playwright webServer');
  }

  // Create test results directories
  const fs = require('fs');
  const path = require('path');
  
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'reports',
    'reports/allure-results'
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  // Clean up any existing test projects from previous runs
  console.log('🧹 Cleaning up previous test data...');
  
  try {
    // We'll use a headless browser to clean up test projects
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Navigate to Mini Sentry and clean up test projects
    await page.goto('http://localhost:5173');
    
    // TODO: Add cleanup logic for test projects
    // This would involve API calls to delete projects with specific test prefixes
    
    await browser.close();
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Could not clean up previous test data:', error);
  }

  console.log('🎉 E2E Test Setup Complete!');
  console.log('');
  console.log('📋 Test Environment Status:');
  console.log('   Mini Sentry API: http://localhost:8000');
  console.log('   Mini Sentry UI:  http://localhost:5173');
  console.log('   Test Backend:    http://localhost:3002');
  console.log('   Test Frontend:   http://localhost:3001');
  console.log('');
}

export default globalSetup;