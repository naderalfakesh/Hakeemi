import { existsSync } from 'node:fs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

// Native Firebase config resolution: an explicit environment path wins, then a
// developer's ignored real project files, then the committed emulator-only
// placeholders so a fresh clone can build and run against the Emulator Suite
// without any Firebase credentials.
function resolveGoogleServicesFile(
  environmentPath: string | undefined,
  developmentPath: string,
  emulatorTemplatePath: string,
) {
  if (environmentPath !== undefined && environmentPath !== '') {
    return environmentPath;
  }

  return existsSync(developmentPath) ? developmentPath : emulatorTemplatePath;
}

const androidGoogleServicesFile = resolveGoogleServicesFile(
  process.env.GOOGLE_SERVICES_JSON,
  './.firebase/development/google-services.json',
  './firebase/templates/emulator/google-services.json',
);
const iosGoogleServicesFile = resolveGoogleServicesFile(
  process.env.GOOGLE_SERVICES_INFO_PLIST,
  './.firebase/development/GoogleService-Info.plist',
  './firebase/templates/emulator/GoogleService-Info.plist',
);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hakeemi',
  slug: 'hakeemi',
  version: '2.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'hakeemi',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.naderalfakesh.hakeemi',
    googleServicesFile: iosGoogleServicesFile,
    supportsTablet: true,
  },
  android: {
    ...config.android,
    package: 'com.naderalfakesh.hakeemi',
    googleServicesFile: androidGoogleServicesFile,
    adaptiveIcon: {
      backgroundColor: '#0A6765',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  web: {
    ...config.web,
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-dev-client',
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-build-properties',
      {
        ios: {
          forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBFirestore', 'RNFBFunctions'],
          useFrameworks: 'static',
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A6765',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: 'Allow Hakeemi to add fictional appointments to your calendar.',
        writeOnlyCalendarPermission:
          'Allow Hakeemi to add fictional appointments to your calendar.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#0A6765',
        enableBackgroundRemoteNotifications: true,
        icon: './assets/images/android-icon-monochrome.png',
      },
    ],
    '@react-native-firebase/messaging',
    'expo-font',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
