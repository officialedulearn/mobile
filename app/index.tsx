import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, View } from "react-native";

export default function Index() {
  const {user, setUser} = useUserStore();
  const userService = new UserService();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabaseUser = await supabase.auth.getUser();
        if(supabaseUser.data.user) {
          const userData = await userService.getUser(supabaseUser.data.user.email || "");
          setUser(userData);
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
