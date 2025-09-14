import "dotenv/config";
export default {
  expo: {
    name: "EduLearn",
    displayName: "EduLearn",
    slug: "edulearn",
    version: "1.0.0",
    owner: "edulearn",
    scheme: "edulearn",
    newArchEnabled: true,
    userInterfaceStyle: "automatic",
    icon: "./assets/images/mainlogo.png",
    android: {
      package: "com.edulearn.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/mainlogo.png",
        backgroundColor: "#000"
      },
      
    },
    ios: {
      icon: "./assets/images/icon.png"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      twitterClientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID,
      eas: {
        projectId: "139b580b-67d2-4458-b709-7c9575f0d7a1",
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png",
    },
    experiments: {
      typedRoutes: true,
    },
  },
};
