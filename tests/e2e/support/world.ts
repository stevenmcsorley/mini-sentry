import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { DashboardPage } from './page-objects/DashboardPage';
import { ErrorListPage } from './page-objects/ErrorListPage';
import { ErrorDetailsPage } from './page-objects/ErrorDetailsPage';
import { TestAppPage } from './page-objects/TestAppPage';

// Load environment variables
require('dotenv').config();

export interface MiniSentryWorldParameters {
  miniSentryUrl: string;
  miniSentryUiUrl: string;
  testAppUrl: string;
  testApiUrl: string;
  defaultTimeout: number;
  screenshotOnFailure: boolean;
  headless: boolean;
  browser: string;
  testProjectId: string;
  testProjectName: string;
  testProjectToken: string;
  viewport: {
    width: number;
    height: number;
  };
}

export class MiniSentryWorld extends World<MiniSentryWorldParameters> {
  public browser!: Browser;
  public context!: BrowserContext;
  public page!: Page;
  
  // Page objects
  public dashboardPage!: DashboardPage;
  public errorListPage!: ErrorListPage;
  public errorDetailsPage!: ErrorDetailsPage;
  public testAppPage!: TestAppPage;
  
  // Test data storage
  public testData: {
    errorTriggerTime?: Date;
    expectedErrorCount?: number;
    lastErrorMessage?: string;
    currentPage?: string;
    projectId?: string;
    projectName?: string;
    projectToken?: string;
    releaseVersion?: string;
    releaseEnvironment?: string;
    artifactUploaded?: boolean;
    lastSessionType?: string;
    alertRuleName?: string;
    alertThreshold?: number;
    alertEmailTarget?: string;
    assignedUser?: string;
    groupComment?: string;
    hasRelease?: boolean;
    deploymentName?: string;
    deploymentUrl?: string;
    chartVisible?: boolean;
    chartZoomed?: boolean;
    hasSourceMaps?: boolean;
    testMessage?: string;
    expectsPagination?: number;
    hasMultipleProjects?: boolean;
    switchedProject?: boolean;
    expectedErrorCode?: number;
    // Overview page specific
    initialCounts?: {
      releases: number;
      deployments: number;
      rules: number;
      groups: number;
    };
    testReleaseVersion?: string;
    testReleaseEnvironment?: string;
    testDeploymentName?: string;
    testDeploymentUrl?: string;
    testSessionUser?: string;
    testAlertName?: string;
    testAlertThreshold?: number;
    hasGroups?: boolean;
    persistenceTestVersion?: string;
    expectingError?: boolean;
    integrationTestVersion?: string;
    hasAlertRules?: boolean;
    expectingUpdates?: boolean;
    alertsTriggered?: boolean;
  } = {};

  constructor(options: IWorldOptions<MiniSentryWorldParameters>) {
    // If no parameters provided, use environment variables as defaults
    const defaultParams: MiniSentryWorldParameters = {
      miniSentryUrl: process.env.VITE_MINI_SENTRY_URL || 'http://localhost:8000',
      miniSentryUiUrl: process.env.VITE_MINI_SENTRY_UI_URL || 'http://localhost:5173',
      testAppUrl: process.env.TEST_APP_FRONTEND_URL || 'http://localhost:3001',
      testApiUrl: process.env.TEST_APP_BACKEND_URL || 'http://localhost:3002',
      testProjectId: process.env.TEST_PROJECT_ID || '4',
      testProjectName: process.env.TEST_PROJECT_NAME || 'test',
      testProjectToken: process.env.VITE_MINI_SENTRY_TOKEN || 't_BYTD5BscDMRPR807TJ7MdfqRjJEYHdkhr8TE-nnwA',
      defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
      screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
      headless: process.env.HEADLESS !== 'false',
      browser: process.env.BROWSER || 'chromium',
      viewport: {
        width: 1280,
        height: 720
      }
    };

    // Use provided parameters if available, otherwise use defaults
    const mergedOptions = {
      ...options,
      parameters: { ...defaultParams, ...options.parameters }
    };
    
    super(mergedOptions);
  }

  async init(): Promise<void> {
    // Launch browser based on configuration
    const browserType = this.parameters.browser || 'chromium';
    
    switch (browserType) {
      case 'firefox':
        this.browser = await firefox.launch({ 
          headless: this.parameters.headless 
        });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ 
          headless: this.parameters.headless 
        });
        break;
      default:
        this.browser = await chromium.launch({ 
          headless: this.parameters.headless 
        });
    }

    // Create browser context
    this.context = await this.browser.newContext({
      viewport: this.parameters.viewport
    });

    // Create new page
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.parameters.defaultTimeout);
    
    // Initialize page objects
    this.dashboardPage = new DashboardPage(this.page, this.parameters.miniSentryUiUrl);
    this.errorListPage = new ErrorListPage(this.page);
    this.errorDetailsPage = new ErrorDetailsPage(this.page);
    this.testAppPage = new TestAppPage(this.page);
    
    // Add console logging for debugging
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Test project getters
  getTestProjectId(): string {
    return this.parameters.testProjectId;
  }

  getTestProjectName(): string {
    return this.parameters.testProjectName;
  }

  getTestProjectToken(): string {
    return this.parameters.testProjectToken;
  }

  // URL helpers
  getMiniSentryUrl(path: string = ''): string {
    return `${this.parameters.miniSentryUiUrl}${path}`;
  }

  getTestAppUrl(path: string = ''): string {
    return `${this.parameters.testAppUrl}${path}`;
  }

  getApiUrl(path: string = ''): string {
    return `${this.parameters.miniSentryUrl}${path}`;
  }

  // Screenshot utility
  async takeScreenshot(name: string): Promise<void> {
    if (this.parameters.screenshotOnFailure) {
      await this.page.screenshot({ 
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
        fullPage: true
      });
    }
  }

  // Wait utilities
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.page.waitForSelector(selector, { 
      timeout: timeout || this.parameters.defaultTimeout 
    });
  }

  async waitForUrl(url: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(url, { 
      timeout: timeout || this.parameters.defaultTimeout 
    });
  }
}

setWorldConstructor(MiniSentryWorld);