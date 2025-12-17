import useUserStore from "@/core/userState";
import useActivityStore from "@/core/activityState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme
} from "react-native";
import { ProgressBar } from "react-native-paper";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import DailyCheckInStreak from "@/components/streak";
import * as StoreReview from "expo-store-review";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RoadmapService } from "@/services/roadmap.service";


type Props = {};

const index = (props: Props) => {
  const { user } = useUserStore();
  const { activities, fetchActivities, isLoading } = useActivityStore();
  const theme = useUserStore(s => s.theme);
  const streakModalVisible = useUserStore(s => s.streakModalVisible);
  const setStreakModalVisible = useUserStore(s => s.setStreakModalVisible);
  const [latestRoadmap, setLatestRoadmap] = useState<any>(null);
  const [roadmapProgress, setRoadmapProgress] = useState({ completed: 0, total: 0 });
  const bottomSheetRef = useRef<BottomSheet>(null);
  const getHighQualityImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_mini(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_bigger(\.[a-z]+)$/i, '_400x400$1');
  };

  useEffect(() => {
    if (user?.id) {
      fetchActivities(user.id);
      fetchLatestRoadmap();
    }
  }, [user?.id, fetchActivities]);

  const fetchLatestRoadmap = async () => {
    if (!user?.id) return;
    try {
      const roadmapService = new RoadmapService();
      const roadmaps = await roadmapService.getUserRoadmaps(user.id);
      
      if (roadmaps && roadmaps.length > 0) {
        const latest = roadmaps[0];
        const roadmapWithSteps = await roadmapService.getRoadmapById(latest.id);
        
        const completedSteps = roadmapWithSteps.steps.filter(step => step.done).length;
        const totalSteps = roadmapWithSteps.steps.length;
        
        setLatestRoadmap(roadmapWithSteps);
        setRoadmapProgress({ completed: completedSteps, total: totalSteps });
      }
    } catch (error) {
      console.log("Error fetching roadmap:", error);
    }
  };

  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const today = new Date().toDateString();
        const lastShownDate = await AsyncStorage.getItem('streakModalLastShown');
        
         if(lastShownDate !== today) {
          setTimeout(() => {
            if (bottomSheetRef.current) {
              bottomSheetRef.current.snapToIndex(0);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              AsyncStorage.setItem('streakModalLastShown', today);
              setStreakModalVisible(true);
            }
          }, 1000);
         }
      } catch (error) {
        console.log("Error checking streak modal:", error);
      }
    };

    checkAndShowModal();
  }, [setStreakModalVisible]);

  const milestones = {
    novice: 0,
    beginner: 500,
    intermediate: 1500,
    advanced: 3000,
    expert: 5000,
  };

  const currentXP = user?.xp || 0;

  const getMilestoneProgress = () => {
    if (currentXP >= milestones.expert) {
      return {
        progress: 1,
        xpNeeded: 0,
        currentLevel: milestones.expert,
        nextLevel: milestones.expert,
      };
    } else if (currentXP >= milestones.advanced) {
      return {
        progress:
          (currentXP - milestones.advanced) /
          (milestones.expert - milestones.advanced),
        xpNeeded: milestones.expert - currentXP,
        currentLevel: milestones.advanced,
        nextLevel: milestones.expert,
      };
    } else if (currentXP >= milestones.intermediate) {
      return {
        progress:
          (currentXP - milestones.intermediate) /
          (milestones.advanced - milestones.intermediate),
        xpNeeded: milestones.advanced - currentXP,
        currentLevel: milestones.intermediate,
        nextLevel: milestones.advanced,
      };
    } else if (currentXP >= milestones.beginner) {
      return {
        progress:
          (currentXP - milestones.beginner) /
          (milestones.intermediate - milestones.beginner),
        xpNeeded: milestones.intermediate - currentXP,
        currentLevel: milestones.beginner,
        nextLevel: milestones.intermediate,
      };
    } else {
      return {
        progress: currentXP / milestones.beginner,
        xpNeeded: milestones.beginner - currentXP,
        currentLevel: milestones.novice,
        nextLevel: milestones.beginner,
      };
    }
  };

  const { progress, xpNeeded } = getMilestoneProgress();

  const profileImageUrl = getHighQualityImageUrl(user?.profilePictureURL as string);
console.log(user?.profilePictureURL)
  const handleShare = () => {
    console.log("share");
  };

  const handleCloseModal = async () => {
    try {
      bottomSheetRef.current?.close();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        const hasAction = await StoreReview.hasAction();
        if (hasAction) {
          await StoreReview.requestReview();
        }
      }
    } catch (error) {
      console.log("Error requesting review:", error);
    } finally {
      setStreakModalVisible(false);
    }
  };

    return (
    <>
      <View style={{ flex: 1, backgroundColor: theme === "dark" ? "#0D0D0D" : "#F9FBFC" }}>
        <ScrollView 
          style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {theme === "dark" ? <StatusBar style="light" /> : <StatusBar style="dark" />}
        <View style={styles.content}>
        <View style={styles.topNav}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={profileImageUrl ? { uri: profileImageUrl } : require("@/assets/images/memoji.png")}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
            <View style={{ flexDirection: "column" }}>
              <Text style={[styles.headerText, theme == "dark" && styles.headerTextDark ]}>Hi {user?.name}👋</Text>
              <Text style={[styles.subText, theme == "dark" && { color: "#B3B3B3" }]}>Learn & earn more XP today</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.searchNav, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
            onPress={() => router.push("/search")}
            activeOpacity={0.7}
          >
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/search.png") : require("@/assets/images/icons/search-normal.png")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.xpProgress, theme === "dark" && { backgroundColor: "#00FF80" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/medal-05.png") : require("@/assets/images/icons/medal.png")}
              style={{ width: 24, height: 24 }}
            />

            <Text style={[styles.xpText, theme === "dark" &&  {color: "#000"}]}>{user?.xp} XP</Text>
          </View>

          <ProgressBar
            progress={progress}
            color={theme === "dark" ? "#000" : "#00FF80"}
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.60)" : "rgba(255, 255, 255, 0.10)",
            }}
          />
          <Text style={[styles.subText, { color: "#00FF80" }, theme === "dark" && { color: "#000" }]}>
            {xpNeeded > 0
              ? `Great work! You're just ${xpNeeded} XP away from the next badge 🔥`
              : "Congratulations! You've reached the highest level! 🏆"}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/quizzes")}
          >
            <Image
              source={require("@/assets/images/icons/brain.png")}
              style={{ width:44, height: 44 }}
            />
            <Text style={[styles.cardText, theme === "dark" && {color: "#E0E0E0"}]}>Take a Quiz</Text>
            <Text style={[styles.cardSubText, theme === "dark" && { color: "#B3B3B3" }]}>
              Starts a recommended or random quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/leaderboard")}
          >
            <Image
              source={require("@/assets/images/icons/leaderboard.png")}
              style={{ width: 44, height: 44 }}
            />
            <Text style={[styles.cardText, theme === "dark" && {color: "#E0E0E0"}]}>Leaderboard</Text>
            <Text style={[styles.cardSubText, theme === "dark" && {color: "#B3B3B3"}]}>View rankings among users</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          <View style={styles.activityContainerHeader}>
            <Text style={[styles.activityContainerHeaderText, theme === "dark" && styles.headerTextDark ]}>
              Recent Highlights
            </Text>
            <TouchableOpacity
              style={[styles.seeMoreButton , theme === "dark" && {borderColor: "#2E3033"}]}
              onPress={() => router.push("/quizzes")}
            >
              <Text
                style={[
                  {
                    fontFamily: "Satoshi",
                    lineHeight: 24,
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#2D3C52",
                  }, theme === "dark" && { color: "#E0E0E0" }
                ]}
              >
                See all
              </Text>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>
          </View>

          {activities.length === 0 && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <FontAwesome5 name="trophy" size={24} color={theme === "dark" ? "#B3B3B3" : "#61728C"} />
              <Text style={[styles.emptyStateTitle, theme === "dark" && { color: "#E0E0E0" }]}>No highlights yet</Text>
              <Text style={[styles.emptyStateSubtitle, theme === "dark" && { color: "#B3B3B3" }]}>
                Complete activities to see your achievements!
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}>Loading...</Text>
            </View>
          ) : (
            <View style={[styles.activityContainerItems, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
              {activities.slice(0, 3).map((activity) => (
                <View key={activity.id} style={[styles.activityContainerItem, theme === "dark" && {borderBottomColor: "#2E3033"}]}>
                  <Text style={[styles.activityTitle, theme === "dark" && { color: "#E0E0E0" }]}>{activity.title}</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Image
                      source={require("@/assets/images/icons/medal-05.png")}
                      style={{ width: 20, height: 20, marginBottom: 4 }}
                    />
                    <Text style={[styles.activityXp, theme === "dark" && { color: "#B3B3B3" }]}>
                      +{activity.xpEarned} XP
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {latestRoadmap && (
          <TouchableOpacity 
            style={[styles.roadmapCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/roadmaps/${latestRoadmap.roadmap.id}`)}
          >
            <View style={styles.roadmapCardHeader}>
              <View style={[styles.roadmapIcon, theme === "dark" && { backgroundColor: "#0D0D0D", borderColor: "#2E3033" }]}>
                <Image
                  source={require("@/assets/images/icons/roadmap.png")}
                  style={{ width: 20, height: 20 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roadmapCardLabel, theme === "dark" && { color: "#B3B3B3" }]}>
                  Continue Learning
                </Text>
                <Text style={[styles.roadmapCardTitle, theme === "dark" && { color: "#E0E0E0" }]} numberOfLines={1}>
                  {latestRoadmap.roadmap.title}
                </Text>
              </View>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
            
            <View style={styles.roadmapProgressContainer}>
              <View style={styles.roadmapProgressInfo}>
                <Text style={[styles.roadmapProgressText, theme === "dark" && { color: "#B3B3B3" }]}>
                  {roadmapProgress.completed} of {roadmapProgress.total} steps completed
                </Text>
                <Text style={[styles.roadmapProgressPercentage, theme === "dark" && { color: "#00FF80" }]}>
                  {Math.round((roadmapProgress.completed / roadmapProgress.total) * 100)}%
                </Text>
              </View>
              <View style={[styles.roadmapProgressBar, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
                <View 
                  style={[
                    styles.roadmapProgressFill,
                    theme !== "dark" && { backgroundColor: "#000" },
                    { width: `${(roadmapProgress.completed / roadmapProgress.total) * 100}%` }
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={[styles.bountyCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
          <View>
            <View style={[styles.bountyCardPill, theme === "dark" && { backgroundColor: "#0D0D0D", borderColor: "#2E3033" }]}>
              <Image
                source={require("@/assets/images/icons/trophy.png")}
                style={{ width: 16, height: 16 }}
              />
              <Text style={[styles.bountyChallengeText, theme === "dark" && { color: "#B3B3B3" }]}>Bounty Challenge</Text>
            </View>

            <Text style={[styles.bountyCardText, theme === "dark" && { color: "#E0E0E0" }]}>Stay Top 3 This Week!</Text>
          </View>
          <Image
            source={require("@/assets/images/icons/bountyCard.png")}
            style={{ width: 66.6, height: 83, resizeMode: "contain" }}
          />
        </View>
        </View>
        </ScrollView>
      </View>

      {streakModalVisible && (
        <BlurView
          intensity={30}
          tint={theme === "dark" ? "dark" : "light"}
          style={styles.blurOverlay}
          experimentalBlurMethod="dimezisBlurView"
        />
      )}

      <View style={styles.bottomSheetContainer} pointerEvents={streakModalVisible ? "auto" : "none"}>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['62%']}
          enablePanDownToClose={true}
          enableDynamicSizing={false}
          onClose={() => setStreakModalVisible(false)}
          backgroundStyle={[
            styles.bottomSheetBackground,
            theme === "dark" && styles.bottomSheetBackgroundDark
          ]}
          handleIndicatorStyle={[
            styles.bottomSheetIndicator,
            theme === "dark" && styles.bottomSheetIndicatorDark
          ]}
          style={styles.bottomSheetStyle}
          bottomInset={20}
          backdropComponent={() => null}
        >
        <View style={styles.bottomSheetContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseModal}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, theme === "dark" && { color: "#E0E0E0" }]}>✕</Text>
          </TouchableOpacity>
          
          <Image 
            source={require("@/assets/images/eddie/proud.png")} 
            style={styles.modalImage} 
            resizeMode="contain"
          />
          <Text style={[styles.modalTitle, theme === "dark" && styles.modalTitleDark]}>
            Congratulations! You've achieved {user?.streak} days of streak!
          </Text>
          
          <DailyCheckInStreak streak={user?.streak} noBorder />

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.modalButtonSecondary,
                theme === "dark" && styles.modalButtonSecondaryDark
              ]} 
              onPress={handleCloseModal}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.modalButtonText, 
                styles.modalButtonTextSecondary,
                theme === "dark" && styles.modalButtonTextSecondaryDark,
              ]}>
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.modalButtonPrimary,
                theme === "dark" && styles.modalButtonPrimaryDark
              ]} 
              onPress={() => handleShare()}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.modalButtonText, 
                styles.modalButtonTextPrimary,
                theme === "dark" && styles.modalButtonTextPrimaryDark
              ]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </BottomSheet>
      </View>
    </>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  scrollContent: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  content: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  topNav: {
    width: "100%",
    marginTop: 20,
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
  headerTextDark: {
    color: "#E0E0E0"
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
    lineHeight: 24,
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
    color: "#61728C",
    fontWeight: "400",
    lineHeight: 24,
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
  activityContainerHeaderText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 30,
  },
  activityContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  activityContainer: {
    width: "100%",
    marginTop: 20,
    flexDirection: "column",
    gap: 10,
  },
  seeMoreButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  activityContainerItems: {
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "column",
  },
  activityContainerItem: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: "100%",
    borderBottomWidth: 0.5,
    borderBottomColor: "#EDF3FC",
  },

  roadmapCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  roadmapCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  roadmapIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F9FBFC",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    alignItems: "center",
    justifyContent: "center",
  },
  roadmapCardLabel: {
    fontFamily: "Satoshi",
    fontSize: 12,
    fontWeight: "500",
    color: "#61728C",
    marginBottom: 2,
  },
  roadmapCardTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    lineHeight: 20,
  },
  roadmapProgressContainer: {
    gap: 8,
  },
  roadmapProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roadmapProgressText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "400",
    color: "#61728C",
  },
  roadmapProgressPercentage: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  roadmapProgressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#F9FBFC",
    borderRadius: 4,
    overflow: "hidden",
  },
  roadmapProgressFill: {
    height: "100%",
    backgroundColor: "#00FF80",
    borderRadius: 4,
  },
  bountyCard: {
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
    width: "100%",
    marginTop: 20,
  },
  bountyCardPill: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#F9FBFC",
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  bountyCardText: {
    color: "#2D3C52",
    textAlign: "center",
    lineHeight: 36,
    fontSize: 20,
    fontWeight: 500,
    fontFamily: "Satoshi",
  },
  bountyChallengeText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  bottomSheetContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  bottomSheetStyle: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 9999,
  },
  bottomSheetBackgroundDark: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2E3033",
  },
  bottomSheetIndicator: {
    backgroundColor: "#E0E0E0",
    width: 40,
  },
  bottomSheetIndicatorDark: {
    backgroundColor: "#2E3033",
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#2D3C52",
    fontWeight: "400",
  },
  modalImage: {
    width: 130,
    height: 130,
    marginBottom: 8,
    marginTop: 8,
  },
  modalTitle: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    color: "#2D3C52",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  modalTitleDark: {
    color: "#E0E0E0",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 20,
    marginBottom: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#000",
  },
  modalButtonPrimaryDark: {
    backgroundColor: "#00FF80",
  },
  modalButtonSecondary: {
    backgroundColor: "#F9FBFC",
    borderWidth: 1,
    borderColor: "#000",
  },
  modalButtonSecondaryDark: {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
  },
  modalButtonText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  modalButtonTextPrimary: {
    color: "#00FF80",
  },
  modalButtonTextPrimaryDark: {
    color: "#000000",
  },
  modalButtonTextSecondary: {
    color: "#2D3C52",
  },
  modalButtonTextSecondaryDark: {
    color: "#E0E0E0",
  },
});
