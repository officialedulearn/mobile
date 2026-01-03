import { StyleSheet, Text, TouchableOpacity, View, Image, Linking, Alert } from "react-native";
import React from "react";
import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";

type Props = {};

const Community = (props: Props) => {
  const { theme } = useUserStore();

  const openLink = async (url: string, platform: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open ${platform}. Please make sure you have the app installed.`);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${platform}. Please try again.`);
    }
  };

  const communityLinks = [
    {
      title: "Join our Discord",
      description: "Connect with other learners, get help, and participate in discussions",
      url: "https://discord.gg/7ErYsnc5ty", 
      platform: "Discord"
    },
    {
      title: "Follow us on Telegram",
      description: "Get updates, announcements, and quick support",
      url: "https://t.me/verificationedu",
      platform: "Telegram"
    },
    {
      title: "Email Support",
      description: "Contact us directly for personalized assistance",
      url: "mailto:dave@edulearn.fun",
      platform: "Email"
    }
  ];

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.headerNav}>
        <BackButton />
        <Text style={[styles.headerTitle, theme === "dark" && { color: "#E0E0E0" }]}>Community</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.introSection}>
          <Image
            source={require("@/assets/images/mainlogo.png") }
            style={styles.logo}
          />
          <Text style={[styles.introTitle, theme === "dark" && { color: "#E0E0E0" }]}>
            Join Our Community
          </Text>
          <Text style={[styles.introDescription, theme === "dark" && { color: "#B3B3B3" }]}>
            Connect with fellow learners, get support, and stay updated with the latest news and features.
          </Text>
        </View>

        <View style={styles.communityOptions}>
          {communityLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.communityItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
              onPress={() => openLink(link.url, link.platform)}
              activeOpacity={0.7}
            >
              <View style={styles.communityItemLeft}>
                <View style={styles.communityTextContainer}>
                  <Text style={[styles.communityTitle, theme === "dark" && { color: "#E0E0E0" }]}>
                    {link.title}
                  </Text>
                  <Text style={[styles.communityDescription, theme === "dark" && { color: "#B3B3B3" }]}>
                    {link.description}
                  </Text>
                </View>
              </View>
              <Image 
                source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Community;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    padding: 20,
  },
  headerNav: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  introSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  communityOptions: {
    gap: 16,
    marginBottom: 24,
  },
  communityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  communityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  communityTextContainer: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    lineHeight: 20,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
});