import { Before, After } from '@cucumber/cucumber';
import { MiniSentryWorld } from './world';

Before(async function (this: MiniSentryWorld) {
  await this.init();
});

After(async function (this: MiniSentryWorld) {
  if (this.parameters.screenshotOnFailure) {
    await this.takeScreenshot(`scenario-${Date.now()}`);
  }
  await this.cleanup();
});