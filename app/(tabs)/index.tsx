import useUserStore from "@/core/userState";
import useActivityStore from "@/core/activityState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { ProgressBar } from "react-native-paper";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

type Props = {};

const index = (props: Props) => {
  const { user } = useUserStore();
  const { activities, fetchActivities, isLoading } = useActivityStore();

  useEffect(() => {
    if (user?.id) {
      fetchActivities(user.id);
    }
  }, [user?.id, fetchActivities]);

  const milestones = {
    novice: 0,
    beginner: 500,
    intermediate: 1500,
    advanced: 3000,
    expert: 5000
  };

  const currentXP = user?.xp || 0;

  const getMilestoneProgress = () => {
    if (currentXP >= milestones.expert) {
      return { progress: 1, xpNeeded: 0, currentLevel: milestones.expert, nextLevel: milestones.expert };
    } else if (currentXP >= milestones.advanced) {
      return { progress: (currentXP - milestones.advanced) / (milestones.expert - milestones.advanced), xpNeeded: milestones.expert - currentXP, currentLevel: milestones.advanced, nextLevel: milestones.expert };
    } else if (currentXP >= milestones.intermediate) {
      return { progress: (currentXP - milestones.intermediate) / (milestones.advanced - milestones.intermediate), xpNeeded: milestones.advanced - currentXP, currentLevel: milestones.intermediate, nextLevel: milestones.advanced };
    } else if (currentXP >= milestones.beginner) {
      return { progress: (currentXP - milestones.beginner) / (milestones.intermediate - milestones.beginner), xpNeeded: milestones.intermediate - currentXP, currentLevel: milestones.beginner, nextLevel: milestones.intermediate };
    } else {
      return { progress: currentXP / milestones.beginner, xpNeeded: milestones.beginner - currentXP, currentLevel: milestones.novice, nextLevel: milestones.beginner };
    }
  };

  const { progress, xpNeeded } = getMilestoneProgress();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return require("@/assets/images/icons/brain.png");
      case 'chat':
        return require("@/assets/images/icons/message.png");
      case 'streak':
        return null; // We'll render FontAwesome5 icon instead
      default:
        return require("@/assets/images/icons/medal.png");
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'Quiz Completed';
      case 'chat':
        return 'AI Chat Session';
      case 'streak':
        return 'Daily Streak';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return '#3B82F6';
      case 'chat':
        return '#8B5CF6';
      case 'streak':
        return '#00FF80';
      default:
        return '#6B7280';
    }
  };

  const renderActivityIcon = (type: string) => {
    const color = getActivityColor(type);
    
    if (type === 'streak') {
      return (
        <View style={[styles.activityIconContainer, { backgroundColor: `${color}15` }]}>
          <FontAwesome5 name="fire" size={20} color={color} />
        </View>
      );
    }
    return (
      <View style={[styles.activityIconContainer, { backgroundColor: `${color}15` }]}>
        <Image
          source={getActivityIcon(type)}
          style={{ width: 20, height: 20, tintColor: color }}
        />
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.topNav}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={require("@/assets/images/memoji.png")}
              style={{ width: 40, height: 40 }}
            />
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.headerText}>Hi {user?.name}👋</Text>
              <Text style={styles.subText}>Learn & earn more XP today</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.searchNav}
            onPress={() => router.push("/search")}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/icons/search-normal.png")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
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
            progress={progress}
            color="#00FF80"
            
            style={{ height: 10, borderRadius: 5, backgroundColor: "rgba(255, 255, 255, 0.10)" }}
          />
          <Text style={[styles.subText, { color: "#00FF80" }]}>
            {xpNeeded > 0 ? `Great work! You're just ${xpNeeded} XP away from the next badge 🔥` : 'Congratulations! You\'ve reached the highest level! 🏆'}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push("/quizzes")}
          >
            <Image
              source={require("@/assets/images/icons/brain.png")}
              style={{ width: 50, height: 50 }}
            />
            <Text style={styles.cardText}>Take a Quiz</Text>
            <Text style={styles.cardSubText}>
              Starts a recommended or random quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push("/leaderboard")}
          >
            <Image
              source={require("@/assets/images/icons/leaderboard.png")}
              style={{ width: 50, height: 50 }}
            />
            <Text style={styles.cardText}>Leaderboard</Text>
            <Text style={styles.cardSubText}>View rankings among users</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.highlightsCard}>
          <View style={styles.highlightsHeader}>
            <View style={styles.highlightsIconContainer}>
              <FontAwesome5 name="trophy" size={20} color="#00FF80" />
            </View>
            <View style={styles.highlightsTitleContainer}>
              <Text style={styles.highlightsTitle}>Recent Highlights</Text>
              <Text style={styles.highlightsSubtitle}>Your latest achievements</Text>
            </View>
            {activities.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push("/quizzes")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : activities.length > 0 ? (
            <View style={styles.activitiesList}>
              {activities.slice(0, 3).map((activity, index) => (
                <View 
                  key={activity.id} 
                  style={[
                    styles.activityItem,
                    index < activities.slice(0, 3).length - 1 && styles.activityItemBorder
                  ]}
                >
                  {renderActivityIcon(activity.type)}
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{formatDate(activity.createdAt)}</Text>
                  </View>
                  <Text style={styles.activityXp}>+{activity.xpEarned} XP</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <FontAwesome5 name="trophy" size={24} color="#61728C" />
              <Text style={styles.emptyStateTitle}>No highlights yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Complete activities to see your achievements!
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    fontSize: 20,
    lineHeight: 24,
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
    gap: 15,
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
    width: 20,
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
    fontSize: 14,
    lineHeight: 20,
    color: "#61728C",
    marginTop: 4,
  },
  searchNav: {
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    backgroundColor: "#F9FBFC",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    padding: 12,
  },
  highlightsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    minHeight: 150,
  },
  highlightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  highlightsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00FF8015",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightsTitleContainer: {
    flex: 1,
  },
  highlightsTitle: {
    fontFamily: "Satoshi",
    fontSize: 18,
    color: "#2D3C52",
    fontWeight: "600",
    lineHeight: 24,
  },
  highlightsSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    marginTop: 2,
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#00FF8015",
  },
  viewAllText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#00FF80",
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#2D3C52",
    fontWeight: "500",
    lineHeight: 20,
  },
  activityTime: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#61728C",
    marginTop: 2,
  },
  activityXp: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#00FF80",
    fontWeight: "600",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyStateTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    color: "#2D3C52",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    textAlign: "center",
    marginBottom: 16,
  },
});
