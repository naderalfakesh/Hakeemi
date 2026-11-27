const { withPodfile } = require('expo/config-plugins');

const SCRIPT_PATH = '$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh';
const PROJECT_DIR_OVERRIDE = 'PROJECT_DIR=Pods';
const PHASE_SCRIPT =
  'bash -l -c "PROJECT_ROOT=\\"${PROJECT_ROOT:-$PROJECT_DIR/../..}\\" ' +
  PROJECT_DIR_OVERRIDE +
  ' \\"' +
  SCRIPT_PATH +
  '\\""';
const HOOK_MARKER = '# Run the expo-constants app.config phase from paths with spaces';
const POST_INSTALL_ANCHOR = 'post_install do |installer|';

// Workaround for expo-constants <57.0.22 breaking on checkout paths with spaces:
// quotes the script path and passes PROJECT_DIR_BASENAME so EXConstants.bundle/app.config is written.
const POST_INSTALL_HOOK = `
    ${HOOK_MARKER}
    installer.pods_project.targets.each do |target|
      next unless target.name == 'EXConstants'
      target.shell_script_build_phases.each do |phase|
        next unless phase.shell_script.include?('${SCRIPT_PATH}')
        phase.shell_script = '${PHASE_SCRIPT}'
      end
    end
`;

function withExpoConstantsScriptQuoting(config) {
  return withPodfile(config, (podfileConfig) => {
    const { contents } = podfileConfig.modResults;
    if (contents.includes(HOOK_MARKER)) {
      return podfileConfig;
    }
    if (!contents.includes(POST_INSTALL_ANCHOR)) {
      throw new Error(
        'with-expo-constants-script-quoting: the generated Podfile has no post_install hook to extend.',
      );
    }
    podfileConfig.modResults.contents = contents.replace(
      POST_INSTALL_ANCHOR,
      `${POST_INSTALL_ANCHOR}\n${POST_INSTALL_HOOK}`,
    );
    return podfileConfig;
  });
}

module.exports = withExpoConstantsScriptQuoting;
module.exports.PHASE_SCRIPT = PHASE_SCRIPT;
module.exports.POST_INSTALL_HOOK = POST_INSTALL_HOOK;
