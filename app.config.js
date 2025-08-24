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
      twitterClientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID,
      eas: {
        projectId: "7df77703-9c64-42b0-bb4f-707a977da4be",
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.edulearnv2.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/mainlogo.png",
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
      ["expo-build-properties", {
        android: {
          extraMavenRepos: [
            "node_modules/@expo/maven-repository/android"
          ],
          kotlinVersion: "1.8.10", 
          buildToolsVersion: "33.0.0",
          compileSdkVersion: 34,
          targetSdkVersion: 33,
          minSdkVersion: 24,
          ndkVersion: "25.1.8937393"
        }
      }]
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
