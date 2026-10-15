import test from 'node:test';
import assert from 'node:assert/strict';
import { openBackendAfterAssessment } from './backendLauncher.js';

test('opens the dedicated backend page after a risk assessment result', () => {
  let openedUrl = '';

  globalThis.window = {
    open: (url) => {
      openedUrl = url;
      return true;
    },
  };

  openBackendAfterAssessment();

  assert.equal(openedUrl, 'http://127.0.0.1:8000/backend');
});
