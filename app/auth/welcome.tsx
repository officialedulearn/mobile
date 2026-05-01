import useUserStore from "@/core/userState";
import Design from "@/utils/design";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Presets } from "react-native-pulsar";
type Props = Record<string, never>;

const Welcome = (_props: Props) => {
  const { user, theme } = useUserStore();

  Presets.applause()

  const handleStartChatting = async () => {
    if(user?.isPremium) {
      router.push("/(tabs)");
    } else {
      const lastTrialPrompt = await AsyncStorage.getItem("lastTrialPrompt");
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastTrialPrompt || now - parseInt(lastTrialPrompt) >= oneDayInMs) {
        await AsyncStorage.setItem("lastTrialPrompt", now.toString());
        await AsyncStorage.setItem("previousScreen", "welcome");
        router.push("/freeTrialIntro");
      } else {
        router.push("/(tabs)");
      }
    }
  };

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <View style={styles.spacer} />
      <View style={styles.topSection}>
        <Image
          source={require("@/assets/images/eddie/Celebrate.png")}
          style={styles.checkImage}
        />
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, theme === "dark" && { color: "#E0E0E0" }]}>Welcome, {user?.name || "User"}</Text>
          <Text style={[styles.subtitle, theme === "dark" && { color: "#B3B3B3" }]}>Your account is all set.</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Image
            source={theme === "dark" ? require("@/assets/images/icons/dark/information-circle.png") : require("@/assets/images/icons/information-circle.png")}
            style={styles.infoImage}
          />
          <Text style={[styles.infoText, theme === "dark" && { color: "#B3B3B3" }]}>
            Start chatting with your AI tutor, earn XP, and grow your skills.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
          onPress={handleStartChatting}
        >
          <Text style={[styles.buttonText, theme === "dark" && { color: "#000" }]}>Start Chatting</Text>
        </TouchableOpacity> 
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FBFC",
  },
  spacer: {
    flex: 1,
  },
  topSection: {
    alignItems: "center",
    flex: 2,
    justifyContent: "center",
  },
  checkImage: {
    width: 160,
    height: 190,
    marginBottom: 20,
  },
  welcomeContainer: {
    alignItems: "center",
  },
  infoContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    marginBottom: 40,
    flex: 1,
    justifyContent: "flex-end",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  infoImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3C52",
    textAlign: "center",
    lineHeight: 42,
    fontFamily: "Satoshi-Regular",
    fontStyle: "normal",
  },
  subtitle: {
    color: "#61728C",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  infoText: {
    color: "#61728C",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi-Regular",
    flex: 1,
  },
  startButton: {
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 10,
  },
  buttonText: {
    color: "#00FF80",
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    textAlign: "center",
    fontSize: 16,
  },
});

export default Welcome;
