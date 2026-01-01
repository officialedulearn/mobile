import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import useUserStore from "@/core/userState";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { ChatProvider } from "@/contexts/ChatContext";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Satoshi: require("@/assets/fonts/Satoshi-Regular.otf"),
    Urbanist: require("@/assets/fonts/Urbanist-Regular.ttf"),
  });

  const { theme, loadTheme, user } = useUserStore();

  const getTheme = async () => {
    try {
      const value = await AsyncStorage.getItem("theme");
      if (value !== null) {
        console.log("Retrieved data:", value);
        return value;
      }
    } catch (error) {
      console.error("Error retrieving data:", error);
    }
    return null;
  };

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === 'ios') {
      Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_PROJECT_APPLE_API_KEY as string
      });
    } else if (Platform.OS === 'android') {
      Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_PROJECT_GOOGLE_API_KEY as string
      });
    }
  }, []);

  useEffect(() => {
    const identifyUser = async () => {
      if (user?.id) {
        try {
          await Purchases.logIn(user.id);
          console.log('RevenueCat user identified:', user.id);
        } catch (error) {
          console.error('Failed to identify user in RevenueCat:', error);
        }
      } else {
        try {
          await Purchases.logOut();
          console.log('RevenueCat user logged out');
        } catch (error) {
          console.error('Failed to log out from RevenueCat:', error);
        }
      }
    };

    identifyUser();
  }, [user?.id]);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    async function fetchTheme() {
      await loadTheme();
      const theme = await getTheme();
      console.log("Current theme:", theme);
    }
    fetchTheme();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ChatProvider>
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
    
            <Stack.Screen 
              name="onboarding" 
              options={{ 
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="auth/index" 
              options={{ 
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="auth/verifyOtp" 
              options={{ 
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="auth/welcome" 
              options={{ 
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="auth/identity" 
              options={{ 
                headerShown: false,
                animation: 'fade',
                gestureEnabled: false
              }} 
            />
            
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            <Stack.Screen 
              name="settings" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="theme" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical'
              }} 
            />
            <Stack.Screen 
              name="editProfile" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical'
              }} 
            />
            <Stack.Screen 
              name="feedback" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical'
              }} 
            />
            <Stack.Screen 
              name="subscription" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="freeTrialIntro" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="nftClaimed" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical'
              }} 
            />
            <Stack.Screen 
              name="search" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical'
              }} 
            />
            
            <Stack.Screen 
              name="leaderboard" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="quiz" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="nfts" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="connectX" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="user/[id]" 
              options={{ 
                headerShown: false,
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="nft/[id]" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="community" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="roadmaps/[id]" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="joinCommunity" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />

            <Stack.Screen 
              name="notifications" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="room/[id]" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
            <Stack.Screen 
              name="roomInfo/[id]" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal'
              }} 
            />
          </Stack>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
