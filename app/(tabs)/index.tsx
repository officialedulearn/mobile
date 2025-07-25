import useUserStore from "@/core/userState";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ProgressBar } from "react-native-paper";

type Props = {};

const index = (props: Props) => {
  const { user } = useUserStore();
  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <View
          style={{ flex: 1, alignItems: "center", flexDirection: "column" }}
        >
          <Text>Hi {user?.name}👋</Text>
          <Text style={styles.subText}>
            Ready to learn & earn more XP today?
          </Text>
        </View>

        <Image
          source={require("@/assets/images/icons/1.svg")}
          style={{ width: 100, height: 100 }}
        />
      </View>

      <View style={styles.xpProgress}>
        <View style={{ flex: 1, gap: 10 }}>
          <Image
            source={require("@/assets/images/icons/medal.svg")}
            style={{ width: 100, height: 100, alignSelf: "center" }}
          />

          <Text>{user?.xp} XP</Text>
        </View>

        <ProgressBar
          progress={user?.xp ? user.xp / 1000 : 0}
          color="#00FF80"
          style={{ height: 10, borderRadius: 5 }}
        />
        <Text style={styles.subText}>
          Great work! You're just 50 XP away from the next badge 🔥
        </Text>
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
    backgroundColor: "#61728C",
    marginTop: 50,
  },
  topNav: {
    flex: 1,
    width: "100%",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "column",
    backgroundColor: "#000",
  },
  xpText: {
    fontFamily: "Satoshi",
    fontSize: 20,
    lineHeight: 24,
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
  },
});
