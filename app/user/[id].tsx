import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect } from "react";
import BackButton from "@/components/backButton";
import { useLocalSearchParams } from "expo-router";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import DailyCheckInStreak from "@/components/streak";
import { getUserMetrics } from "@/utils/utils";
import { ActivityService } from "@/services/activity.service";

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

const User = (props: Props) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = React.useState<any>();
  const [joinedAt, setJoinedAt] = React.useState<string | undefined>();
  const [lastSignIn, setLastSignIn] = React.useState<string | undefined>();
  const [userMetrics, setUserMetrics] = React.useState({
    quizCompleted: 0,
    nfts: 0,
    xp: 0,
  });
  const [quizStats, setQuizStats] = React.useState({
    totalQuestionsAnswered: 0,
    accuracyRate: 0,
  });

  useEffect(() => {
    const fetchJoinedAt = async () => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        setJoinedAt(data.user?.created_at);
        setLastSignIn(data.user?.last_sign_in_at);
      } catch (error) {
        console.error("Failed to fetch joined date:", error);
      }
    };

    fetchJoinedAt();
  }, [id]);

  const userService = new UserService();
  const activityService = new ActivityService();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getUserById(id);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, [id]);

  useEffect(() => {
    async function fetchMetrics() {
      if (id) {
        const metrics = await getUserMetrics(id);
        setUserMetrics(metrics);

        try {
          const quizActivities = await activityService.getQuizActivitiesByUser(
            id
          );

          const totalQuestionsAnswered = quizActivities.length * 5;

          const totalEarnedPoints = quizActivities.reduce(
            (sum: any, activity: { xpEarned: any; }) => sum + activity.xpEarned,
            0
          );
          const maxPossiblePoints = quizActivities.length * 5; 
          const accuracyRate =
            maxPossiblePoints > 0
              ? (totalEarnedPoints / maxPossiblePoints) * 100
              : 0;

          setQuizStats({
            totalQuestionsAnswered,
            accuracyRate: parseFloat(accuracyRate.toFixed(1)),
          });
        } catch (error) {
          console.error("Failed to fetch quiz activities:", error);
        }
      }
    }
    fetchMetrics();
  }, [id]);

  return (
    <View style={styles.container}>
      <BackButton />

      <View style={styles.profileCard}>
        <Image
          source={require("@/assets/images/memoji.png")}
          style={styles.userImage}
        />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.joinedText}>
          Joined on{" "}
          {joinedAt ? new Date(joinedAt).toLocaleDateString() : "Loading..."}
        </Text>
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
      
      {lastSignIn && <DailyCheckInStreak lastSignIn={lastSignIn} />}

      <View style={styles.learningStats}>
        <Text style={styles.learningStatsText}>Learning Stats</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statText}>Quizzes Completed</Text>
            <Text style={styles.statNumber}>{userMetrics.quizCompleted}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.statText}>Questions Answered</Text>
            <Text style={styles.statNumber}>{quizStats.totalQuestionsAnswered}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.statText}>Accuracy Rate</Text>
            <Text style={styles.statNumber}>{quizStats.accuracyRate}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default User;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    paddingHorizontal: 16,
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#F9FBFC",
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: "#000",
    gap: 8,
    padding: 12,
    flexDirection: "column",
    alignItems: "center",
  },
  userName: {
    color: "#00FF80",
    lineHeight: 30,
    fontWeight: "700",
    fontSize: 24,
    fontFamily: "Satoshi",
    textAlign: "center",
  },
  userImage: {
    width: 65,
    height: 65,
    borderRadius: 18.59,
  },
  joinedText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    color: "#FFF",
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
  learningStats: {
    marginTop: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  learningStatsText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontWeight: "600",
    lineHeight: 20,
    fontSize: 16,
    marginBottom: 8,
  },
  stats: {
    width: "100%",
    gap: 12,
  },
  stat: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  statText: {
    color: "#61728C",
    lineHeight: 20,
    fontWeight: "500",
    fontSize: 14,
    fontFamily: "Satoshi",
  },
  statNumber: {
    color: "#2D3C52",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Satoshi",
  },
});
