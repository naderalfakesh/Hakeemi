const { CodeGenerator, withAppDelegate } = require('expo/config-plugins');

const CONFIGURE_CALL = 'FirebaseApp.configure()';
const RETURN_ANCHOR = /return super\.application\(application, didFinishLaunchingWithOptions/;

// Expo SDK 58 launches React Native via SceneDelegate, removing the AppDelegate anchor
// @react-native-firebase/app uses; inject FirebaseApp.configure() in didFinishLaunchingWithOptions.
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
