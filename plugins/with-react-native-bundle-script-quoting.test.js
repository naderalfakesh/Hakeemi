const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { afterAll, beforeAll, describe, expect, test } = require('@jest/globals');

const { quoteBundleScriptInvocation } = require('./with-react-native-bundle-script-quoting');

// Escaped as stored in project.pbxproj, matching the template phase endings.
const RESOLVE =
  "\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"";
const SDK57_ENDING = `\`${RESOLVE}\`\n\n`;
const SDK58_ENDING = `\\"\`${RESOLVE}\`\\"\n\n`;

describe('quoteBundleScriptInvocation', () => {
  let root;
  let nodeStub;
  const scriptPath = '/Volumes/Samsung SSD 990 2TB/app/react-native-xcode.sh';

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakeemi bundle '));
    nodeStub = path.join(root, 'node');
    fs.writeFileSync(nodeStub, `#!/bin/sh\nprintf '%s\\n' '${scriptPath}'\n`);
    fs.chmodSync(nodeStub, 0o755);
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Runs the phase ending the way Xcode does and returns the words the shell
  // would execute, so a split path shows up as more than one word.
  function shellWords(pbxprojEnding) {
    const command = pbxprojEnding.replace(/\\"/g, '"').trim();
    const result = spawnSync('/bin/sh', ['-c', `printf '%s\\n' ${command}`], {
      env: { PATH: process.env.PATH, NODE_BINARY: nodeStub },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    return result.stdout.trimEnd().split('\n');
  }

  test('quotes the unquoted SDK 57 substitution', () => {
    expect(shellWords(SDK57_ENDING)).not.toEqual([scriptPath]);
    expect(shellWords(quoteBundleScriptInvocation(SDK57_ENDING))).toEqual([scriptPath]);
  });

  test('leaves the already quoted SDK 58 substitution unchanged', () => {
    expect(quoteBundleScriptInvocation(SDK58_ENDING)).toBe(SDK58_ENDING);
    expect(shellWords(SDK58_ENDING)).toEqual([scriptPath]);
  });

  test('is idempotent', () => {
    const once = quoteBundleScriptInvocation(SDK57_ENDING);

    expect(quoteBundleScriptInvocation(once)).toBe(once);
  });
});
