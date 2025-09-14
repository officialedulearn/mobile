import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, View, useColorScheme } from "react-native";

export default function Index() {
  const {user, setUser, setTheme, setUserAsync} = useUserStore();
  const userService = new UserService();
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {

        const theme = await AsyncStorage.getItem("theme")

        theme ? await setTheme(theme as "light" | "dark") : await setTheme(colorScheme === 'dark' ? 'dark' : 'light');
        const supabaseUser = await supabase.auth.getUser();
        if(supabaseUser.data.user) {
          setUserAsync().catch(error => console.error("Failed to set user:", error));
          router.push("/(tabs)");
        } else {  
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/onboarding");
      }
    };

    const timeout = setTimeout(() => {
      fetchUser();
    }, 2000);
  
    return () => clearTimeout(timeout);
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
      <Image source={require("../assets/images/logo.png")} />
    </View>
  );
}
