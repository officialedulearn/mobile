import useUserStore from '@/core/userState';
import useActivityStore from '@/core/activityState';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useRoadmapStore from '@/core/roadmapState';
import { CardSharingService } from '@/services/cardSharing.service';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { HomeHeader } from '@/components/home/HomeHeader';
import { XPProgress } from '@/components/home/XPProgress';
import { HomeCard } from '@/components/home/HomeCard';
import { ActivitySection } from '@/components/home/ActivitySection';
import { RoadmapCard } from '@/components/home/RoadmapCard';
import { BountyCard } from '@/components/home/BountyCard';
import { StreakModal } from '@/components/home/StreakModal';

const Home = () => {
  const { user } = useUserStore();
  const { activities, fetchActivities, isLoading } = useActivityStore();
  const { isDark } = useTheme();
  const streakModalVisible = useUserStore((s) => s.streakModalVisible);
  const setStreakModalVisible = useUserStore((s) => s.setStreakModalVisible);
  const { roadmaps, roadmapWithStepsById, fetchRoadmaps, fetchRoadmapById } = useRoadmapStore();
  const latestRoadmap = roadmaps.length > 0 ? roadmapWithStepsById[roadmaps[0].id] : null;
  const roadmapProgress = latestRoadmap
    ? {
        completed: latestRoadmap.steps.filter((s) => s.done).length,
        total: latestRoadmap.steps.length,
      }
    : { completed: 0, total: 0 };

  const getHighQualityImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_mini(\.[a-z]+)$/i, '_400x400$1')
      .replace(/_bigger(\.[a-z]+)$/i, '_400x400$1');
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      fetchActivities(user.id);
      try {
        await fetchRoadmaps(user.id);
        const state = useRoadmapStore.getState();
        if (state.roadmaps.length > 0) {
          await fetchRoadmapById(state.roadmaps[0].id);
        }
      } catch (error) {
        console.log('Error fetching roadmap:', error);
      }
    };
    load();
  }, [user?.id, fetchActivities, fetchRoadmaps, fetchRoadmapById]);

  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const today = new Date().toDateString();
        const lastShownDate = await AsyncStorage.getItem('streakModalLastShown');

        if (lastShownDate !== today) {
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            AsyncStorage.setItem('streakModalLastShown', today);
            setStreakModalVisible(true);
          }, 1000);
        }
      } catch (error) {
        console.log('Error checking streak modal:', error);
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
  const [isSharing, setIsSharing] = useState(false);
  const cardSharingService = new CardSharingService();

  const handleShare = async () => {
    if (!user?.id || !user?.streak) return;

    try {
      setIsSharing(true);
      await cardSharingService.shareStreakCard(user.id, user.streak);
      setStreakModalVisible(false);
    } catch (error) {
      console.error('Error sharing streak card:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCloseModal = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        const hasAction = await StoreReview.hasAction();
        if (hasAction) {
          await StoreReview.requestReview();
        }
      }
    } catch (error) {
      console.log('Error requesting review:', error);
    } finally {
      setStreakModalVisible(false);
    }
  };

  return (
    <>
      <View style={{ flex: 1 }}>
        {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
        <ScreenContainer>
          <HomeHeader userName={user?.name || 'User'} profileImageUrl={profileImageUrl} />

          <XPProgress currentXP={currentXP} progress={progress} xpNeeded={xpNeeded} />

          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <HomeCard
              icon={require('@/assets/images/icons/brain.png')}
              title="Take a Quiz"
              subtitle="Starts a recommended or random quiz"
              onPress={() => router.push('/quizzes')}
            />
            <HomeCard
              icon={require('@/assets/images/icons/leaderboard.png')}
              title="Leaderboard"
              subtitle="View rankings among users"
              onPress={() => router.push('/leaderboard')}
            />
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
          tint={isDark ? 'dark' : 'light'}
          style={{ flex: 1 }}
          experimentalBlurMethod="dimezisBlurView"
        >
          <StreakModal
            streak={user?.streak || 0}
            isSharing={isSharing}
            onShare={handleShare}
            onClose={handleCloseModal}
          />
        </BlurView>
      </Modal>
    </>
  );
};

export default Home;
