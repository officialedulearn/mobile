import { ChatProvider } from "@/contexts/ChatContext";
import { ToastProvider } from "@/contexts/ToastContext";
import useUserStore from "@/core/userState";
import { useNotifications } from "@/hooks/useNotifications";
import {
  isAuthCallbackUrl,
  parseDeepLinkIntent,
  popPendingDeepLinkIntent,
  setPendingDeepLinkIntent,
  type DeepLinkIntent,
} from "@/utils/deepLinks";
import { supabase } from "@/utils/supabase";
import { syncEddyXpWidgetFromUser } from "@/utils/syncEddyXpWidget";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState, Linking, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import Purchases from "react-native-purchases";

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
  const revenueCatUserIdRef = useRef<string | null>(null);
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
        if (revenueCatUserIdRef.current === user.id) {
          return;
        }
        try {
          await Purchases.logIn(user.id);
          revenueCatUserIdRef.current = user.id;
        } catch (error) {}
      } else {
        if (!revenueCatUserIdRef.current) {
          return;
        }
        try {
          await Purchases.logOut();
          revenueCatUserIdRef.current = null;
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        session?.access_token
      ) {
        void useUserStore.getState().setUserAsync();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const navigateFromIntent = (intent: DeepLinkIntent) => {
      if (intent.type === "publicQuiz") {
        router.push({
          pathname: "/(tabs)/quizzes/[id]",
          params: { id: intent.quizId },
        } as any);
        return;
      }

      if (intent.type === "communityInvite") {
        router.push({
          pathname: "/joinCommunity",
          params: { inviteCode: intent.inviteCode, autoJoin: "1" },
        } as any);
        return;
      }

      if (intent.type === "referral") {
        router.push({
          pathname: "/auth",
          params: { signUp: "1", referralCode: intent.referralCode },
        } as any);
        return;
      }

      if (intent.type === "chatQuiz") {
        router.push({
          pathname: "/quiz",
          params: { chatId: intent.chatId },
        } as any);
      }
    };

    const handleDeepLink = async (url: string) => {
      if (isAuthCallbackUrl(url)) {
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
          } catch (err) {}
        }
        return;
      }

      const intent = parseDeepLinkIntent(url);
      if (!intent) return;

      const activeUserId = useUserStore.getState().user?.id;
      if (!activeUserId) {
        await setPendingDeepLinkIntent(intent);
        if (intent.type === "referral") {
          router.push({
            pathname: "/auth",
            params: { signUp: "1", referralCode: intent.referralCode },
          } as any);
        } else {
          router.push({ pathname: "/auth", params: { signUp: "1" } } as any);
        }
        return;
      }

      navigateFromIntent(intent);
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

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const resumePendingIntent = async () => {
      const intent = await popPendingDeepLinkIntent();
      if (!intent || cancelled) return;

      if (intent.type === "publicQuiz") {
        router.push({
          pathname: "/(tabs)/quizzes/[id]",
          params: { id: intent.quizId },
        } as any);
        return;
      }

      if (intent.type === "communityInvite") {
        router.push({
          pathname: "/joinCommunity",
          params: { inviteCode: intent.inviteCode, autoJoin: "1" },
        } as any);
        return;
      }

      if (intent.type === "chatQuiz") {
        router.push({
          pathname: "/quiz",
          params: { chatId: intent.chatId },
        } as any);
      }
    };

    void resumePendingIntent();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
                  name="referral"
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
                  name="nft"
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
