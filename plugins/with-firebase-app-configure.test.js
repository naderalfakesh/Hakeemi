const { describe, expect, test } = require('@jest/globals');

const { addFirebaseConfigure } = require('./with-firebase-app-configure');

// Shape of the SDK 58 scene-lifecycle AppDelegate after the upstream
// @react-native-firebase/app plugin added only its import.
const APP_DELEGATE = [
  'internal import Expo',
  'import FirebaseCore',
  'import React',
  '',
  '@main',
  'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
  '  public override func application(',
  '    _ application: UIApplication,',
  '    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil',
  '  ) -> Bool {',
  '    reactNativeFactory = factory',
  '',
  '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
  '  }',
  '}',
  '',
].join('\n');

describe('withFirebaseAppConfigure', () => {
  test('configures Firebase once, before didFinishLaunchingWithOptions returns', () => {
    const once = addFirebaseConfigure(APP_DELEGATE);
    const twice = addFirebaseConfigure(once);
    const lines = once.split('\n');
    const configureLine = lines.findIndex((line) => line.trim() === 'FirebaseApp.configure()');
    const returnLine = lines.findIndex((line) => line.includes('return super.application('));

    expect(configureLine).toBeGreaterThan(-1);
    expect(configureLine).toBeLessThan(returnLine);
    expect(once.match(/FirebaseApp\.configure\(\)/g)).toHaveLength(1);
    expect(twice).toBe(once);
  });

  test('adds the FirebaseCore import when it is missing', () => {
    const result = addFirebaseConfigure(APP_DELEGATE.replace('import FirebaseCore\n', ''));

    expect(result).toContain('internal import Expo\nimport FirebaseCore\n');
  });

  test('leaves an AppDelegate already configured upstream unchanged', () => {
    const configured = APP_DELEGATE.replace(
      '    return super',
      '    FirebaseApp.configure()\n    return super',
    );

    expect(addFirebaseConfigure(configured)).toBe(configured);
  });

  test('fails when the AppDelegate has no anchor', () => {
    expect(() => addFirebaseConfigure('internal import Expo\n')).toThrow('no didFinishLaunching');
  });
});
