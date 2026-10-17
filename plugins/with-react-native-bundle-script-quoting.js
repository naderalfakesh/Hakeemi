const { withXcodeProject } = require('expo/config-plugins');

// Escaped as stored in project.pbxproj: `"` is `\"` inside the shellScript value.
const RESOLVE_SCRIPT_PATH =
  "\\\"$NODE_BINARY\\\" --print \\\"require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'\\\"";
const UNQUOTED_INVOCATION = `\`${RESOLVE_SCRIPT_PATH}\``;
const UPSTREAM_QUOTED_INVOCATION = `\\"${UNQUOTED_INVOCATION}\\"`;
const QUOTED_INVOCATION = `\\"$(${RESOLVE_SCRIPT_PATH})\\"`;

// Expo's SDK 57 iOS template ends the "Bundle React Native code and images"
// phase with an unquoted backtick substitution that resolves
// react-native-xcode.sh. The shell word-splits the resolved path when the
// checkout path contains a space, so the phase fails with
// "/Volumes/Samsung: No such file or directory". Quoting the substitution runs
// the script from any checkout location. The SDK 58 template already wraps the
// backticks in quotes; rewriting that form would unquote it again, so it is
// left as is.
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
