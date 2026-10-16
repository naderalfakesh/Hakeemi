const { withPodfile } = require('expo/config-plugins');

const SCRIPT_PATH = '$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh';
const PROJECT_DIR_OVERRIDE = 'PROJECT_DIR=Pods';
// Shell text of the replacement phase. The outer shell expands the variables, so
// the inner `bash -c` string receives every path already wrapped in quotes.
const PHASE_SCRIPT =
  'bash -l -c "PROJECT_ROOT=\\"${PROJECT_ROOT:-$PROJECT_DIR/../..}\\" ' +
  PROJECT_DIR_OVERRIDE +
  ' \\"' +
  SCRIPT_PATH +
  '\\""';
const HOOK_MARKER = '# Run the expo-constants app.config phase from paths with spaces';
const POST_INSTALL_ANCHOR = 'post_install do |installer|';

// expo-constants before 57.0.22 breaks on a checkout path that contains a space
// in two places. Its phase passes the script path unquoted to `bash -c`, and the
// script runs `basename $PROJECT_DIR` unquoted, so its "is this the Pods project"
// guard fails and it exits 0 without writing EXConstants.bundle/app.config.
// Release builds then crash at launch because they have no Metro server to serve
// the manifest. The phase is rewritten to quote the script path and to pass the
// real project root explicitly, with PROJECT_DIR set to the bare basename the
// guard expects. 57.0.22 quotes both paths upstream; the rewrite stays correct
// there and keeps the build safe if a later patch regresses.
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
