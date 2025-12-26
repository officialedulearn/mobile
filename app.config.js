import "dotenv/config";
export default {
  expo: {
    name: "EduLearn",
    displayName: "EduLearn",
    slug: "edulearn",
    version: "2.0.0",
    owner: "edulearn",
    scheme: "edulearnv2",
    newArchEnabled: true,
    userInterfaceStyle: "automatic",
    icon: "./assets/images/mainlogo.png",
    android: {
      package: "com.edulearnv2.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/mainlogo.png",
        backgroundColor: "#000",
      },
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE",
      ],
    },
    ios: {
      icon: "./assets/images/mainlogo.png",
      bundleIdentifier: "com.edulearnv2.app",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      permissions: {
        NSUserNotificationsUsageDescription: "Allow EduLearn to send you notifications about quizzes, achievements, and learning reminders.",
      },
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      twitterClientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID,
      eas: {
        projectId: "139b580b-67d2-4458-b709-7c9575f0d7a1",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png",
    },
    experiments: {
      typedRoutes: true,
    },
    plugins: [
      "expo-build-properties",
      "expo-font",
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      "react-native-share",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/mainlogo.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification.mp3"],
          "iosDisplayInForeground": true
        }
      ],
      [
        "expo-audio",
        {
          "microphonePermission": "EduLearn uses the microphone to capture your voice for AI transcription. For example, you can speak your questions instead of typing, and the AI will convert your speech to text."
        }
      ]
    ],
  },
};
