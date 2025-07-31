import useUserStore from "@/core/userState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProgressBar } from "react-native-paper";

type Props = {};

const index = (props: Props) => {
  const { user } = useUserStore();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.topNav}>
        <View
          style={{ alignItems: "flex-start", flexDirection: "column" }}
        >
          <Text style={styles.headerText}>Hi {user?.name}👋</Text>
          <Text style={styles.subText}>
            Ready to learn & earn more XP today?
          </Text>
        </View>

        <Image
          source={require("@/assets/images/1.png")}
          style={{ width: 70, height: 70 }}
        />
      </View>

      <View style={styles.xpProgress}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            source={require("@/assets/images/icons/medal.png")}
            style={{ width: 20, height: 20 }}
          />

          <Text style={styles.xpText}>{user?.xp} XP</Text>
        </View>

        <ProgressBar
          progress={250/1000}
          color="#00FF80"
          style={{ height: 10, borderRadius: 5 }}
        />
        <Text style={[styles.subText, { color: "#00FF80"}]}>
          Great work! You're just 50 XP away from the next badge 🔥
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <Image
            source={require("@/assets/images/icons/brain.png")}
            style={{ width: 50, height: 50 }}
          />
          <Text style={styles.cardText}>Take a Quiz</Text>
          <Text style={styles.cardSubText}>
            Starts a recommended or random quiz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/leaderboard")}>
          <Image
            source={require("@/assets/images/icons/leaderboard.png")}
            style={{ width: 50, height: 50 }}
          />
          <Text style={styles.cardText}>Leaderboard</Text>
          <Text style={styles.cardSubText}>
            View rankings among users
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#F9FBFC",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  topNav: {
    width: "100%",
    marginTop: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  headerText: {
    fontFamily: "Urbanist",
    fontSize: 24,
    lineHeight: 36,
    color: "#2D3C52",
    fontWeight: "700",
  },
  subText: {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 20,
    color: "#61728C",
    fontWeight: "400",
    marginTop: 10,
  },
  xpProgress: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    backgroundColor: "#000",
    gap: 15
  },
  xpText: {
    fontFamily: "Satoshi",
    fontSize: 20,
    lineHeight: 24,
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
  },

  cardContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    height: 150,
    width: 20
  },
  cardText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    lineHeight: 26,
    color: "#2D3C52",
    fontWeight: "500",
  },
  cardSubText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    lineHeight: 18,
    color: "#61728C",
  }

});
