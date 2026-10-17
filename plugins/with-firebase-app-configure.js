const { CodeGenerator, withAppDelegate } = require('expo/config-plugins');

const CONFIGURE_CALL = 'FirebaseApp.configure()';
const RETURN_ANCHOR = /return super\.application\(application, didFinishLaunchingWithOptions/;

// Expo SDK 58 starts React Native from SceneDelegate, so the AppDelegate no
// longer calls `factory.startReactNative(`, which is the anchor
// @react-native-firebase/app (25.x) uses to insert `FirebaseApp.configure()`.
// Without it the native Firebase SDKs are never configured. The call goes at
// the end of `didFinishLaunchingWithOptions`, which runs before the scene
// starts React Native. Skipped when the upstream plugin already added it.
function addFirebaseConfigure(contents) {
  if (contents.includes(CONFIGURE_CALL)) {
    return contents;
  }
  if (!RETURN_ANCHOR.test(contents)) {
    throw new Error(
      'with-firebase-app-configure: AppDelegate.swift has no didFinishLaunchingWithOptions return to anchor on.',
    );
  }
  const withImport = contents.includes('import FirebaseCore')
    ? contents
    : contents.replace('internal import Expo', 'internal import Expo\nimport FirebaseCore');

  return CodeGenerator.mergeContents({
    tag: 'hakeemi-firebase-app-configure',
    src: withImport,
    newSrc: `    ${CONFIGURE_CALL}`,
    anchor: RETURN_ANCHOR,
    offset: 0,
    comment: '//',
  }).contents;
}

function withFirebaseAppConfigure(config) {
  return withAppDelegate(config, (appDelegateConfig) => {
    if (appDelegateConfig.modResults.language !== 'swift') {
      throw new Error('with-firebase-app-configure: expected a Swift AppDelegate.');
    }
    appDelegateConfig.modResults.contents = addFirebaseConfigure(
      appDelegateConfig.modResults.contents,
    );
    return appDelegateConfig;
  });
}

module.exports = withFirebaseAppConfigure;
module.exports.addFirebaseConfigure = addFirebaseConfigure;
