import DailyCheckInStreak from "@/components/streak";
import useUserStore from "@/core/userState";
import { levels } from "@/utils/constants";
import { supabase } from "@/utils/supabase";
import { getUserMetrics } from "@/utils/utils";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {};

const ACHIEVEMENT_IMAGES = {
  xp: require("@/assets/images/icons/medal-06.png"),
  nft: require("@/assets/images/icons/nft.png"),
  quiz: require("@/assets/images/icons/brain-03.png"),
};

const AchievementCard = ({
  title,
  imageKey,
  metric,
}: {
  title: string;
  imageKey: keyof typeof ACHIEVEMENT_IMAGES;
  metric: string;
}) => {
  return (
    <View style={styles.achievementCard}>
      <Image
        source={ACHIEVEMENT_IMAGES[imageKey]}
        style={{ width: 30, height: 30 }}
      />
      <Text style={styles.cardSubText}>{metric}</Text>

      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
};

const profile = (props: Props) => {
  const user = useUserStore((state) => state.user);
  const [userMetrics, setUserMetrics] = React.useState({
    quizCompleted: 0,
    nfts: 0,
    xp: 0,
  });
  const [lastSignIn, setLastSignIn] = React.useState("");

  useEffect(() => {
    async function fetchMetrics() {
      const userId = user?.id || "";
      const metrics = await getUserMetrics(userId);
      setUserMetrics(metrics);

      const lastSignIn = await supabase.auth
        .getUser()
        .then((user) => user.data.user?.last_sign_in_at);
      setLastSignIn(lastSignIn || "");
    }
    fetchMetrics();
  }, [user?.id]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Image
            source={require("@/assets/images/icons/settings.png")}
            style={{ width: 40, height: 40 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.cardHeader}>
          <View style={styles.identity}>
            <Image
              source={require("@/assets/images/memoji.png")}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
            <Text style={styles.cardText}>{user?.name}</Text>
          </View>

          <View style={styles.levelContainer}>
            <View style={styles.levelIconContainer}>
              <Image
                source={require("@/assets/images/icons/level.png")}
                style={[styles.levelIcon, { width: 28, height: 28 }]}
              />
              <Text style={styles.levelNumber}>
                {levels.indexOf(user?.level?.toLowerCase() || "") + 1}
              </Text>
            </View>
            <Text style={styles.levelText}>{user?.level}</Text>
          </View>
        </View>
        <View style={{ alignItems: "center", alignSelf: "center" }}>
          <View style={styles.xpDisplay}>
            <Image source={require("@/assets/images/icons/medal-05.png")} />
            <Text style={styles.xpText}>{user?.xp} XP</Text>
          </View>
        </View>
        <View style={styles.walletCard}>
          <View style={styles.walletInfoContainer}>
            <Image source={require("@/assets/images/icons/wallet.png")} />
            {user?.address?.trim() ? (
              <Text style={styles.walletText}>{user.address}</Text>
            ) : (
              <Text style={styles.walletText}>No connected wallet</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => console.log("Connect Wallet")}
          >
            <Text style={styles.walletText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.achievements}>
        <AchievementCard
          title="XP Earned"
          imageKey="xp"
          metric={userMetrics.xp + " XP"}
        />

        <AchievementCard
          title="NFT collected"
          imageKey="nft"
          metric={userMetrics.nfts.toString()}
        />
        <AchievementCard
          title="Quiz Completed"
          imageKey="quiz"
          metric={userMetrics.quizCompleted.toString()}
        />
      </View>
      <DailyCheckInStreak lastSignIn={lastSignIn} />
    </View>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 20,
  },
  header: {
    alignContent: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    lineHeight: 24,
    fontSize: 20,
    fontWeight: 500,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  profileCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#000",
    borderRadius: 16,
    flexDirection: "column",
    gap: 15,
  },
  cardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  identity: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    color: "#00FF80",
    textAlign: "center",
    fontFamily: "Satoshi",
    fontSize: 17.436,
    fontWeight: 500,
    lineHeight: 26.1,
  },
  levelContainer: {
    alignItems: "center",
  },
  levelIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  levelIcon: {
    width: 28,
    height: 28,
  },
  levelNumber: {
    position: "absolute",
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  levelText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
  },
  xpDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpText: {
    color: "#00FF80",
    fontWeight: 500,
    lineHeight: 22,
    fontSize: 14,
    fontFamily: "Satoshi",
  },
  walletCard: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    padding: 20,
    borderRadius: 16,
    gap: 20,
  },
  walletInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  connectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    textAlign: "center",
    borderRadius: 16,
    padding: 10,
  },
  walletText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  achievements: {
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 4,
    gap: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  achievementCard: {
    display: "flex",
    padding: 8,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F9FBFC",
  },
  cardSubText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    lineHeight: 25,
    fontSize: 16,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: 400,
    color: "#61728C",
    lineHeight: 16,
  },
});
