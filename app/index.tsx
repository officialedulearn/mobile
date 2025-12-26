import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, View, useColorScheme } from "react-native";
import { useNotifications } from "@/hooks/useNotifications";

export default function Index() {
  const { setTheme, setUserAsync} = useUserStore();
  const colorScheme = useColorScheme();
  
  const { expoPushToken } = useNotifications();
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const theme = await AsyncStorage.getItem("theme");
        theme ? await setTheme(theme as "light" | "dark") : await setTheme(colorScheme === 'dark' ? 'dark' : 'light');
        
        const supabaseUser = await supabase.auth.getUser();
        
        if (supabaseUser.data.user) {
          await setUserAsync();
          setTimeout(() => {
            router.push("/(tabs)");
          }, 100);
        } else {  
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/onboarding");
      }
    };

    // const minSplashTimer = setTimeout(() => {
    //   setShowMinSplash(false);
    // }, 2000);

    const initTimer = setTimeout(() => {
      initializeApp();
    }, 1500); 
  
    return () => {
      // clearTimeout(minSplashTimer);
      clearTimeout(initTimer);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
      }}
    >
      <StatusBar style="light" />
      <Image source={require("../assets/images/fox.png")} style={{ width: 200, height: 200 }} />
      
      {/* {(showMinSplash || isLoading) && (
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ 
            color: "#fff", 
            marginTop: 16, 
            fontSize: 16,
            opacity: 0.8 
          }}>
            {isLoading ? "Loading your profile..." : "Initializing..."}
          </Text>
        </View>
      )} */}
    </View>
  );
}
