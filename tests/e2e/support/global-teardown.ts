async function globalTeardown() {
  console.log('🧹 Starting Mini Sentry E2E Test Teardown...');

  // Clean up test data created during test runs
  console.log('🗑️  Cleaning up test projects and data...');

  try {
    // Clean up test projects that were created during test runs
    // We'll identify them by name patterns like "Test Project", "E-Commerce Test", etc.
    
    const testProjectPrefixes = [
      'Test Project',
      'E-Commerce Test',
      'Empty Test Project',
      'Project for',
      'Duplicate'
    ];

    // Make API calls to clean up test projects
    for (const prefix of testProjectPrefixes) {
      try {
        // Get list of projects
        const response = await fetch('http://localhost:8000/api/projects/');
        if (response.ok) {
          const projects = await response.json();
          
          // Filter projects that match test patterns
          const testProjects = projects.filter((project: any) => 
            testProjectPrefixes.some(p => project.name?.startsWith(p))
          );

          // Delete test projects
          for (const project of testProjects) {
            try {
              await fetch(`http://localhost:8000/api/projects/${project.id}/`, {
                method: 'DELETE'
              });
              console.log(`🗑️  Deleted test project: ${project.name}`);
            } catch (error) {
              console.warn(`⚠️  Could not delete project ${project.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  Could not access projects API for cleanup:', error);
      }
    }

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Some cleanup operations failed:', error);
  }

  // Generate test report summary
  console.log('📊 Generating test report summary...');

  try {
    const fs = require('fs');
    const path = require('path');

    // Check if cucumber report exists
    const cucumberReportPath = 'reports/cucumber-report.json';
    if (fs.existsSync(cucumberReportPath)) {
      const report = JSON.parse(fs.readFileSync(cucumberReportPath, 'utf8'));
      
      let totalScenarios = 0;
      let passedScenarios = 0;
      let failedScenarios = 0;

      report.forEach((feature: any) => {
        feature.elements?.forEach((scenario: any) => {
          totalScenarios++;
          const hasFailed = scenario.steps?.some((step: any) => step.result?.status === 'failed');
          if (hasFailed) {
            failedScenarios++;
          } else {
            passedScenarios++;
          }
        });
      });

      console.log('');
      console.log('📈 Test Results Summary:');
      console.log(`   Total Scenarios: ${totalScenarios}`);
      console.log(`   ✅ Passed: ${passedScenarios}`);
      console.log(`   ❌ Failed: ${failedScenarios}`);
      console.log(`   Success Rate: ${totalScenarios > 0 ? ((passedScenarios / totalScenarios) * 100).toFixed(1) : 0}%`);
      console.log('');

      if (failedScenarios > 0) {
        console.log('❌ Some tests failed. Check the detailed reports in:');
        console.log('   - reports/cucumber-report.html');
        console.log('   - playwright-report/index.html');
      } else {
        console.log('🎉 All tests passed!');
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not generate report summary:', error);
  }

  console.log('');
  console.log('📋 Available Reports:');
  console.log('   Cucumber HTML: reports/cucumber-report.html');
  console.log('   Playwright:    playwright-report/index.html');
  console.log('   Allure:        Run `npm run test:report` to generate');
  console.log('');
  
  console.log('🏁 E2E Test Teardown Complete!');
}

export default globalTeardown;