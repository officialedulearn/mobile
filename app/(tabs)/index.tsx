import { ScreenContainer } from "@/components/common/ScreenContainer";
import { ActivitySection } from "@/components/home/ActivitySection";
import { BountyCard } from "@/components/home/BountyCard";
import { HomeCard } from "@/components/home/HomeCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RoadmapCard } from "@/components/home/RoadmapCard";
import { StreakModal } from "@/components/home/StreakModal";
import { XPProgress } from "@/components/home/XPProgress";
import useActivityStore from "@/core/activityState";
import useAgentStore from "@/core/agentStore";
import useRoadmapStore from "@/core/roadmapState";
import useUserStore from "@/core/userState";
import { useScreenStyles } from "@/hooks/useScreenStyles";
import { useTheme } from "@/hooks/useTheme";
import { CardSharingService } from "@/services/cardSharing.service";
import { getMilestoneProgress } from "@/utils/xpMilestones";
import { requestStoreReviewIfAllowed } from "@/utils/storeReviewPrompt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Modal, View } from "react-native";

const Home = () => {
  const { user } = useUserStore();
  const { userHasAgent, agent, fetchUserAgent } = useAgentStore();
  const { activities, fetchActivities, isLoading } = useActivityStore();
  const { colors, statusBarStyle, blurTint } = useTheme();
  const screenStyles = useScreenStyles();
  const streakModalVisible = useUserStore((s) => s.streakModalVisible);
  const setStreakModalVisible = useUserStore((s) => s.setStreakModalVisible);
  const { roadmaps, roadmapWithStepsById, fetchRoadmaps, fetchRoadmapById } =
    useRoadmapStore();
  const latestRoadmap =
    roadmaps.length > 0 ? roadmapWithStepsById[roadmaps[0].id] : null;
  const roadmapProgress = latestRoadmap
    ? {
        completed: latestRoadmap.steps.filter((s) => s.done).length,
        total: latestRoadmap.steps.length,
      }
    : { completed: 0, total: 0 };

  const getHighQualityImageUrl = (
    url: string | null | undefined,
  ): string | undefined => {
    if (!url || typeof url !== "string") return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_mini(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_bigger(\.[a-z]+)$/i, "_400x400$1");
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      fetchActivities(user.id);
      await fetchUserAgent(user.id);
      try {
        await fetchRoadmaps(user.id);
        const state = useRoadmapStore.getState();
        if (state.roadmaps.length > 0) {
          await fetchRoadmapById(state.roadmaps[0].id);
        }
      } catch (error) {}
    };
    load();
  }, [
    user?.id,
    fetchActivities,
    fetchRoadmaps,
    fetchRoadmapById,
    fetchUserAgent,
  ]);

  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const today = new Date().toDateString();
        const lastShownDate = await AsyncStorage.getItem(
          "streakModalLastShown",
        );

        if (lastShownDate !== today) {
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            AsyncStorage.setItem("streakModalLastShown", today);
            setStreakModalVisible(true);
          }, 1000);
        }
      } catch (error) {}
    };

    checkAndShowModal();
  }, [setStreakModalVisible]);

  const currentXP = user?.xp || 0;

  const { progress, xpNeeded } = getMilestoneProgress(currentXP);

  const profileImageUrl = getHighQualityImageUrl(
    user?.profilePictureURL as string,
  );
  const [isSharing, setIsSharing] = useState(false);
  const cardSharingService = new CardSharingService();

  const handleShare = async () => {
    if (!user?.id || !user?.streak) return;

    try {
      setIsSharing(true);
      await cardSharingService.shareStreakCard(user.id, user.streak);
      setStreakModalVisible(false);
    } catch (error) {
    } finally {
      setIsSharing(false);
    }
  };

  const handleCloseModal = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await requestStoreReviewIfAllowed();
    } catch (error) {
    } finally {
      setStreakModalVisible(false);
    }
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <StatusBar style={statusBarStyle} />
        <View
          style={{
            paddingTop: screenStyles.container.paddingTop,
            backgroundColor: colors.canvas,
          }}
        >
          <HomeHeader
            userName={user?.name || "User"}
            profileImageUrl={profileImageUrl}
          />
        </View>
        <ScreenContainer style={{ flex: 1, paddingTop: 0 }}>
          <XPProgress
            currentXP={currentXP}
            progress={progress}
            xpNeeded={xpNeeded}
          />

          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <HomeCard
              icon={require("@/assets/images/icons/brain.png")}
              title="Take a Quiz"
              subtitle="Starts a recommended or random quiz"
              onPress={() => router.push("/quizzes")}
            />
            <HomeCard
              icon={require("@/assets/images/icons/notebook.png")}
              title="Flashcards"
              subtitle="Review decks from your AI sessions"
              onPress={() => router.push("/flashcards" as never)}
            />
          </View>

          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <HomeCard
              icon={require("@/assets/images/icons/leaderboard.png")}
              title="Leaderboard"
              subtitle="View rankings among users"
              onPress={() => router.push("/leaderboard")}
            />
            <View style={{ flex: 1, marginHorizontal: 8 }} />
          </View>

          <ActivitySection activities={activities} isLoading={isLoading} />

          {latestRoadmap && (
            <RoadmapCard
              roadmapId={latestRoadmap.roadmap.id}
              title={latestRoadmap.roadmap.title}
              completed={roadmapProgress.completed}
              total={roadmapProgress.total}
            />
          )}

          <BountyCard />
        </ScreenContainer>
      </View>

      <Modal
        visible={streakModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <BlurView
          intensity={30}
          tint={blurTint}
          style={{ flex: 1 }}
          experimentalBlurMethod="dimezisBlurView"
        >
          <StreakModal
            streak={user?.streak || 0}
            isSharing={isSharing}
            visible={streakModalVisible}
            onShare={handleShare}
            onClose={handleCloseModal}
          />
        </BlurView>
      </Modal>
    </>
  );
};

export default Home;
