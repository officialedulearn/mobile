import { StyleSheet, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { UserService } from "@/services/auth.service";
type Props = {};

const settings = (props: Props) => {
    const {user, logout} = useUserStore();
    const [loading, setLoading] = useState(false);

    const payPro = async (userId: string) => {
      if (!userId) {
        Alert.alert("Error", "User information not available");
        return;
      }

      setLoading(true);
      const userService = new UserService();

      try {
        const response = await userService.upgradeToPremium(userId);
        Alert.alert(
          "Premium Upgrade Success", 
          "You've successfully upgraded to premium! You now have access to premium features and increased daily credits.", 
          [
            { 
              text: "OK", 
              onPress: async () => {
                router.reload()
              }
            }
          ]
        );
      } catch (error: Error | any) {
        Alert.alert(
          "Upgrade Failed",
          error.message?.includes("Insufficient balance") 
            ? "You don't have enough SOL in your wallet to upgrade to premium. Please add more funds and try again."
            : "Failed to upgrade to premium. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }
    
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View>
        <View style={styles.headerNav}>
          <BackButton />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <View style={styles.settings}>
          <View style={styles.settingItem}>
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/user2.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Edit Profile Info</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => payPro(user?.id as string)}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/congrats.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>
                {loading ? "Processing..." : user?.isPremium ? "Premium Active" : "Upgrade to pro"}
              </Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/message.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/notebook.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Give Feedback</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          logout();
          router.push("/")

        }}
        style={styles.logoutButton}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

        <Text style={styles.logoutText}>Logout</Text>
        <Image
          source={require("@/assets/images/icons/logout.png")}
          style={{ width: 20, height: 20 }}
        />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    marginTop: 50,
    padding: 20,
    justifyContent: "space-between",
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 500,
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: "#FBEAE9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#940803",
    fontFamily: "Satoshi",
    lineHeight: 24
  },
  settings: {
    gap: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 16,
    width: "100%",
  },
  settingText: {
    lineHeight: 24,
    fontSize: 14,
    fontFamily: "Satoshi",
    fontWeight: "500",
    color: "#2D3C52"
  },
  settingItem: {
    display: "flex",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  }
});
