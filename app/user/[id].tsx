import { StyleSheet, Text, View, Image, ScrollView, Dimensions, FlatList, TouchableOpacity, ImageBackground } from "react-native";
import React, { useEffect } from "react";
import BackButton from "@/components/backButton";
import { useLocalSearchParams, router } from "expo-router";
import { UserService } from "@/services/auth.service";
import DailyCheckInStreak from "@/components/streak";
import { getUserMetrics } from "@/utils/utils";
import { ActivityService } from "@/services/activity.service";
import { RewardsService } from "@/services/rewards.service";
import useUserStore from "@/core/userState";

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
  const theme = useUserStore(s => s.theme)
  return (
    <View style={[styles.achievementCard, theme === "dark" && {backgroundColor: '#0D0D0D'}]}>
      <Image
        source={ACHIEVEMENT_IMAGES[imageKey]}
        style={{ width: 30, height: 30 }}
      />
      <Text style={[styles.cardSubText, theme === "dark" && {color: "#E0E0E0"}]}>{metric}</Text>
      <Text style={[styles.metricTitle, theme === "dark" && {color: "#B3B3B3"}]}>{title}</Text>
    </View>
  );
};

const User = (props: Props) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useUserStore((state) => state.theme);
  const [user, setUser] = React.useState<any>();
  const [joinedAt, setJoinedAt] = React.useState<string | undefined>();
  const [userMetrics, setUserMetrics] = React.useState({
    quizCompleted: 0,
    nfts: 0,
    xp: 0,
  });
  const [quizStats, setQuizStats] = React.useState({
    totalQuestionsAnswered: 0,
    accuracyRate: 0,
  });
  const [userRewards, setUserRewards] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 48) / 2;

  const userService = new UserService();
  const activityService = new ActivityService();
  const rewardsService = new RewardsService();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getUserById(id);
        setUser(userData);
      
        const joinDate = new Date();
        joinDate.setDate(joinDate.getDate() - 30);
        setJoinedAt(joinDate.toISOString());
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, [id]);

  useEffect(() => {
    const fetchUserRewards = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const rewards = await rewardsService.getUserRewards(id);
          setUserRewards(rewards);
        } catch (error) {
          console.error("Failed to fetch user rewards:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserRewards();
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
    <ScrollView 
      style={[styles.container, theme === "dark" && {backgroundColor: '#0D0D0D'}]} 
      contentContainerStyle={{ paddingBottom: 30, paddingTop: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <BackButton />
      </View>

      <View style={[styles.profileCard, theme === "dark" && {backgroundColor: '#00FF80'}]}>
        <Image
          source={require("@/assets/images/memoji.png")}
          style={styles.userImage}
        />
        <Text style={[styles.userName, theme === "dark" && {color: "#000"}]}>{user?.name}</Text>
        
        <View style={[styles.learningBadge, theme === "dark" && {backgroundColor: "rgba(0, 0, 0, 0.1)", borderColor: "rgba(0, 0, 0, 0.2)"}]}>
          <Text style={[styles.learningText, theme === "dark" && {color: "#000"}]}>
            📚 Learning {user?.learning || "Web3 & Blockchain"}
          </Text>
        </View>
        
        <Text style={[styles.joinedText, theme === "dark" && {color: "#000"}]}>
          Joined {joinedAt ? new Date(joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "Loading..."}
        </Text>
      </View>

      <View style={[styles.achievements, theme === "dark" && {backgroundColor: '#131313', borderColor: "#2E3033"}]}>
        <AchievementCard
          title="XP Earned"
          imageKey="xp"
          metric={userMetrics.xp + " XP"}
        />

        <AchievementCard
          title="Badges collected"
          imageKey="nft"
          metric={userMetrics.nfts.toString()}
        />

        <AchievementCard
          title="Quiz Completed"
          imageKey="quiz"
          metric={userMetrics.quizCompleted.toString()}
        />
      </View>
      
      <View style={styles.streakContainer}>
        <DailyCheckInStreak lastSignIn={joinedAt || ""} />
      </View>

      <View style={[styles.learningStats, theme === "dark" && {backgroundColor: '#131313', borderColor: "#2E3033"}]}>
        <Text style={[styles.learningStatsText, theme === "dark" && {color: "#E0E0E0"}]}>Learning Stats</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statText, theme === "dark" && {color: "#B3B3B3"}]}>Quizzes Completed</Text>
            <Text style={[styles.statNumber, theme === "dark" && {color: "#E0E0E0"}]}>{userMetrics.quizCompleted}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={[styles.statText, theme === "dark" && {color: "#B3B3B3"}]}>Questions Answered</Text>
            <Text style={[styles.statNumber, theme === "dark" && {color: "#E0E0E0"}]}>{quizStats.totalQuestionsAnswered}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={[styles.statText, theme === "dark" && {color: "#B3B3B3"}]}>Accuracy Rate</Text>
            <Text style={[styles.statNumber, theme === "dark" && {color: "#E0E0E0"}]}>{quizStats.accuracyRate}%</Text>
          </View>
        </View>
      </View>

      <View style={[styles.rewardsSection, theme === "dark" && {backgroundColor: '#131313', borderColor: "#2E3033"}]}>
        <View style={styles.rewardsHeader}>
          <Text style={[styles.rewardsSectionText, theme === "dark" && {color: "#E0E0E0"}]}>Earned Rewards</Text>
        </View>

        {userRewards.length > 0 ? (
          <View style={styles.rewardsGrid}>
            {userRewards.slice(0, 4).map((reward, index) => (
              <TouchableOpacity
                key={reward.id || index}
                style={[styles.gridItem, { width: itemWidth }]}
                onPress={() => router.push({
                  pathname: "/nft/[id]",
                  params: { id: reward.id }
                })}
              >
                <ImageBackground
                  source={{ uri: reward.imageUrl }}
                  style={styles.rewardImageBg}
                  imageStyle={{ borderRadius: 8 }}
                >
                  {reward.signature && (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.claimedText}>Claimed</Text>
                    </View>
                  )}
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, theme === "dark" && {color: "#B3B3B3"}]}>
              No badge earned yet.
            </Text>
            <Text style={[styles.emptyStateSubtext, theme === "dark" && {color: "#B3B3B3"}]}>
              Complete quizzes and lessons to collect badges!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default User;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#F9FBFC",
  },
  header: {
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: "#000",
    gap: 16,
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
    color: "#00FF80",
  },
  learningBadge: {
    backgroundColor: "#F9FBFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: 8,
  },
  learningText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    color: "#000",
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
  streakContainer: {
    marginTop: 20,
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
  rewardsSection: {
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
  rewardsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  rewardsSectionText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontWeight: "600",
    lineHeight: 20,
    fontSize: 16,
  },
  seeAllText: {
    color: "#00FF80",
    fontFamily: "Urbanist",
    fontWeight: "600",
    lineHeight: 20,
    fontSize: 14,
  },
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    width: "100%",
  },
  gridItem: {
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  rewardImageBg: {
    flex: 1,
    justifyContent: "flex-end",
  },
  claimedBadge: {
    backgroundColor: "#00FF80",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 8,
    position: "absolute",
    top: 8,
    right: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  claimedText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 20,
  },
  emptyStateText: {
    color: "#61728C",
    fontFamily: "Urbanist",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#61728C",
    fontFamily: "Urbanist",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
});
