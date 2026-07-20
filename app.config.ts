import type { ConfigContext, ExpoConfig } from 'expo/config';

const androidGoogleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? './.firebase/development/google-services.json';
const iosGoogleServicesFile =
  process.env.GOOGLE_SERVICES_INFO_PLIST ?? './.firebase/development/GoogleService-Info.plist';

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
      backgroundColor: '#E7F5F3',
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
        backgroundColor: '#0B6B69',
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
        color: '#0B6B69',
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
