import { ChatProvider } from "@/contexts/ChatContext";
import { ToastProvider } from "@/contexts/ToastContext";
import useUserStore from "@/core/userState";
import { supabase } from "@/utils/supabase";
import { extractPublicQuizIdFromUrl } from "@/utils/quizLinks";
import { syncEddyXpWidgetFromUser } from "@/utils/syncEddyXpWidget";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Linking, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Purchases from "react-native-purchases";
import { useNotifications } from "@/hooks/useNotifications";

if (Platform.OS === "ios") {
  require("@/widgets/EddyXpWidget");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Satoshi-Regular": require("@/assets/fonts/Satoshi-Regular.otf"),
    "Satoshi-Medium": require("@/assets/fonts/Satoshi-Medium.otf"),
    "Satoshi-Bold": require("@/assets/fonts/Satoshi-Bold.otf"),
    Urbanist: require("@/assets/fonts/Urbanist-Regular.ttf"),
  });

  const { theme, loadTheme, user } = useUserStore();
  useNotifications();

  const getTheme = async () => {
    try {
      const value = await AsyncStorage.getItem("theme");
      if (value !== null) {
        return value;
      }
    } catch (error) {}
    return null;
  };
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    Purchases.configure({
      apiKey: process.env
        .EXPO_PUBLIC_REVENUECAT_PROJECT_APPLE_API_KEY as string,
    });
    Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const identifyUser = async () => {
      if (user?.id) {
        try {
          await Purchases.logIn(user.id);
        } catch (error) {}
      } else {
        try {
          await Purchases.logOut();
        } catch (error) {}
      }
    };
    identifyUser();
  }, [user?.id]);
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    async function fetchTheme() {
      await loadTheme();
      const theme = await getTheme();
    }
    fetchTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncEddyXpWidgetFromUser(useUserStore.getState().user);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (url.includes("auth/callback")) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          return;
        }

        if (session && session.user.app_metadata?.provider === "google") {
          const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

          try {
            const response = await fetch(`${API_URL}auth/oauth/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                supabaseUserId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || "",
                provider: "google",
                providerId: session.user.id,
              }),
            });

            if (!response.ok) {
              throw new Error("OAuth callback failed");
            }

            const { isNewUser, needsUsername } = await response.json();

            if (needsUsername) {
              router.push("/auth/setupUsername" as any);
            } else {
              router.push("/(tabs)");
            }
          } catch (err) {
           
          }
        }
      } else {
        const publicQuizId = extractPublicQuizIdFromUrl(url);
        if (publicQuizId) {
          router.push({
            pathname: "/(tabs)/quizzes/[id]",
            params: { id: publicQuizId },
          } as any);
          return;
        }
      }

      if (url.includes("quiz/")) {
        const quizIdMatch = url.match(/quiz\/([^/?]+)/);
        if (quizIdMatch && quizIdMatch[1]) {
          const quizId = quizIdMatch[1];
          router.push({
            pathname: "/quiz",
            params: { chatId: quizId },
          } as any);
        }
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <ChatProvider>
        <GestureHandlerRootView style={styles.container}>
          <ToastProvider>
            <BottomSheetModalProvider>
              <StatusBar style={theme === "dark" ? "light" : "dark"} />
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />

                <Stack.Screen
                  name="onboarding"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="auth/index"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="auth/verifyOtp"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="auth/welcome"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="auth/identity"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="auth/setupUsername"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    gestureEnabled: false,
                  }}
                />

                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                <Stack.Screen
                  name="settings"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />

                <Stack.Screen
                  name="agents"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="theme"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    gestureDirection: "vertical",
                  }}
                />
                <Stack.Screen
                  name="editProfile"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    gestureDirection: "vertical",
                  }}
                />
                <Stack.Screen
                  name="feedback"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    gestureDirection: "vertical",
                  }}
                />
                <Stack.Screen
                  name="streakShield"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="subscription"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="wallet"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="freeTrialIntro"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="nftClaimed"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    gestureDirection: "vertical",
                  }}
                />
                <Stack.Screen
                  name="search"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    gestureEnabled: true,
                    gestureDirection: "vertical",
                  }}
                />

                <Stack.Screen
                  name="leaderboard"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="quiz"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="connectX"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="user/[id]"
                  options={{
                    headerShown: false,
                    presentation: "card",
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="nft/[id]"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="community"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="roadmaps/[id]"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="joinCommunity"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="room/[id]"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
                <Stack.Screen
                  name="roomInfo/[id]"
                  options={{
                    headerShown: false,
                    animation: "slide_from_right",
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </ToastProvider>
        </GestureHandlerRootView>
      </ChatProvider>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
