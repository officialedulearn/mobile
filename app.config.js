import "dotenv/config";
export default {
  expo: {
    name: "edulearnv2",
    displayName: "EduLearn",
    slug: "edulearnv2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/mainlogo.png",
    scheme: "edulearnv2",
    userInterfaceStyle: "automatic",
    owner: "edulearn",
    newArchEnabled: true,
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      apiKey: process.env.EXPO_PUBLIC_API_KEY,
      twitterClientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID,
      eas: {
        projectId: "6d159de0-6be5-47c5-9571-862aed9cdd38",
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edulearnv2.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff",
      },
      package: "com.edulearnv2.app",
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],

      "expo-font",
      "expo-secure-store",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
