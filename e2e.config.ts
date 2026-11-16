import { claudeCode, codex } from '@e2e-dev/acp';
import { mobile } from '@e2e-dev/mobile';
import { web } from '@e2e-dev/web';
import type { E2EConfig } from 'e2e';

const app = { bundleId: 'com.naderalfakesh.hakeemi' };
const qaSystem =
  'You are a thorough QA agent testing the Hakeemi healthcare portfolio app. Verify every outcome on screen.';

export default {
  agents: {
    codex: {
      executor: codex({ system: qaSystem }),
    },
    default: {
      executor: claudeCode({ model: 'sonnet', system: qaSystem }),
    },
  },
  targets: [
    {
      app,
      engine: mobile({
        device: process.env.E2E_ANDROID_DEVICE,
        platform: 'android',
      }),
      name: 'android',
    },
    {
      app,
      engine: mobile({
        device: process.env.E2E_IOS_DEVICE ?? 'iPhone 18 Pro',
        platform: 'ios',
      }),
      name: 'ios',
    },
    {
      app: {
        command: {
          args: ['expo', 'start', '--web', '--port', '8081'],
          executable: 'npx',
          inheritEnv: ['EXPO_PUBLIC_*'],
          log: '.e2e/logs/web.log',
          reuseExisting: true,
        },
        url: 'http://localhost:8081',
      },
      engine: web(),
      name: 'web',
    },
  ],
  tests: 'tests/**/*.e2e.ts',
  workers: 1,
} satisfies E2EConfig;
