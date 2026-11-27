const { withXcodeProject } = require('expo/config-plugins');

const RESOLVE_SCRIPT_PATH =
  "\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"";
const UNQUOTED_INVOCATION = `\`${RESOLVE_SCRIPT_PATH}\``;
const UPSTREAM_QUOTED_INVOCATION = `\\"${UNQUOTED_INVOCATION}\\"`;
const QUOTED_INVOCATION = `\\"$(${RESOLVE_SCRIPT_PATH})\\"`;

// Quotes unquoted backtick react-native-xcode.sh invocation so checkout paths with spaces work.
function quoteBundleScriptInvocation(shellScript) {
  if (shellScript.includes(UPSTREAM_QUOTED_INVOCATION)) {
    return shellScript;
  }
  return shellScript.replace(UNQUOTED_INVOCATION, QUOTED_INVOCATION);
}

function withReactNativeBundleScriptQuoting(config) {
  return withXcodeProject(config, (projectConfig) => {
    const phases = projectConfig.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};
    for (const phase of Object.values(phases)) {
      if (typeof phase === 'object' && typeof phase.shellScript === 'string') {
        phase.shellScript = quoteBundleScriptInvocation(phase.shellScript);
      }
    }
    return projectConfig;
  });
}

module.exports = withReactNativeBundleScriptQuoting;
module.exports.quoteBundleScriptInvocation = quoteBundleScriptInvocation;
