const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { afterAll, beforeAll, describe, expect, jest, test } = require('@jest/globals');

jest.mock('expo/config-plugins', () => ({
  withPodfile: (config, action) => ({ ...config, podfileAction: action }),
}));

const withExpoConstantsScriptQuoting = require('./with-expo-constants-script-quoting');

const { PHASE_SCRIPT } = withExpoConstantsScriptQuoting;
const SCRIPT_PATH = '$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh';
// expo-constants@57 form and the quoted form Expo uses on its main branch.
const UNQUOTED_SCRIPT = `bash -l -c "${SCRIPT_PATH}"`;
const QUOTED_SCRIPT = `bash -l -c "\\"${SCRIPT_PATH}\\""`;
const UNRELATED_SCRIPT = 'echo unrelated';
const PODFILE = [
  "target 'Hakeemi' do",
  '  post_install do |installer|',
  '    react_native_post_install(installer)',
  '  end',
  'end',
  '',
].join('\n');

function applyPodfileMod(contents) {
  const { podfileAction } = withExpoConstantsScriptQuoting({ slug: 'hakeemi' });
  const result = podfileAction({ modResults: { contents } });
  return result.modResults.contents;
}

// Runs the generated post_install hook against stub CocoaPods objects and
// prints the resulting shell scripts, one per line.
function runHookInRuby(scripts) {
  const program = [
    'Phase = Struct.new(:shell_script)',
    'Target = Struct.new(:name, :shell_script_build_phases)',
    'Project = Struct.new(:targets)',
    'Installer = Struct.new(:pods_project)',
    'phases = ARGV.map { |script| Phase.new(script) }',
    'other = Target.new("Other", [Phase.new(ARGV.first)])',
    'installer = Installer.new(Project.new([Target.new("EXConstants", phases), other]))',
    withExpoConstantsScriptQuoting.POST_INSTALL_HOOK,
    'puts phases.map(&:shell_script)',
    'puts other.shell_script_build_phases.first.shell_script',
  ].join('\n');
  const result = spawnSync('ruby', ['-e', program, ...scripts], { encoding: 'utf8' });
  expect(result.status).toBe(0);
  return result.stdout.trimEnd().split('\n');
}

const rubyAvailable = spawnSync('ruby', ['--version']).status === 0;
const testWithRuby = rubyAvailable ? test : test.skip;

describe('withExpoConstantsScriptQuoting', () => {
  test('adds the hook to the post_install block once', () => {
    const once = applyPodfileMod(PODFILE);
    const twice = applyPodfileMod(once);

    expect(once).toContain('post_install do |installer|\n\n    # Run the expo-constants');
    expect(once).toContain('react_native_post_install(installer)');
    expect(twice).toBe(once);
  });

  test('fails when the Podfile has no post_install block', () => {
    expect(() => applyPodfileMod("target 'Hakeemi' do\nend\n")).toThrow(
      'no post_install hook to extend',
    );
  });

  testWithRuby('rewrites only the EXConstants app.config phases', () => {
    const [unquoted, quoted, unrelated, otherTarget] = runHookInRuby([
      UNQUOTED_SCRIPT,
      QUOTED_SCRIPT,
      UNRELATED_SCRIPT,
    ]);

    expect(unquoted).toBe(PHASE_SCRIPT);
    expect(quoted).toBe(PHASE_SCRIPT);
    expect(unrelated).toBe(UNRELATED_SCRIPT);
    expect(otherTarget).toBe(UNQUOTED_SCRIPT);
  });
});

// Runs phase scripts the way Xcode does (`/bin/sh -c`) against the installed
// expo-constants script, from a project path that contains spaces. Node is
// replaced by a stub that records the arguments getAppConfig.js would receive.
describe('expo-constants app.config phase from a path with spaces', () => {
  let root;
  let projectRoot;
  let env;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'hakeemi constants '));
    projectRoot = path.join(root, 'Samsung SSD 990 2TB', 'app');
    const packageDir = path.join(projectRoot, 'node_modules', 'expo-constants');
    fs.mkdirSync(path.join(packageDir, 'ios'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'ios', 'Pods'), { recursive: true });
    fs.copyFileSync(
      path.join(
        path.dirname(require.resolve('expo-constants/package.json')),
        'scripts',
        'get-app-config-ios.sh',
      ),
      path.join(packageDir, 'scripts', 'get-app-config-ios.sh'),
    );
    fs.writeFileSync(
      path.join(packageDir, 'scripts', 'with-node.sh'),
      '#!/bin/bash\nmkdir -p "$3" && printf "%s\\n" "$(cd "$2" && pwd -P)" > "$3/app.config"\n',
    );
    fs.chmodSync(path.join(packageDir, 'scripts', 'get-app-config-ios.sh'), 0o755);
    fs.chmodSync(path.join(packageDir, 'scripts', 'with-node.sh'), 0o755);

    env = {
      PATH: process.env.PATH,
      HOME: root,
      PROJECT_DIR: path.join(projectRoot, 'ios', 'Pods'),
      PODS_TARGET_SRCROOT: path.join(packageDir, 'ios'),
      BUNDLE_FORMAT: 'shallow',
    };
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function runPhase(script, name) {
    const buildDir = path.join(root, 'build', name);
    const result = spawnSync('/bin/sh', ['-c', script], {
      env: { ...env, CONFIGURATION_BUILD_DIR: buildDir },
      encoding: 'utf8',
    });
    const configPath = path.join(buildDir, 'EXConstants.bundle', 'app.config');
    return { status: result.status, configPath };
  }

  test('the upstream phase writes no app.config', () => {
    const quoted = runPhase(QUOTED_SCRIPT, 'upstream');

    expect(quoted.status).toBe(0);
    expect(fs.existsSync(quoted.configPath)).toBe(false);
  });

  test('the rewritten phase writes app.config for the real project root', () => {
    const rewritten = runPhase(PHASE_SCRIPT, 'rewritten');

    expect(rewritten.status).toBe(0);
    expect(fs.readFileSync(rewritten.configPath, 'utf8').trim()).toBe(fs.realpathSync(projectRoot));
  });
});
