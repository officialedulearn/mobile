import useCommunityStore from '@/core/communityState';
import useUserStore from '@/core/userState';
import { useScreenStyles } from '@/hooks/useScreenStyles';
import { useTheme } from '@/hooks/useTheme';
import type { UserCommunity } from '@/interface/Community';
import { Design } from '@/utils/design';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FlashList } from '@shopify/flash-list';
import { Image } from "expo-image";
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Hub = () => {
  const [activeTab, setActiveTab] = useState<'communities' | 'trending'>('communities');
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const screenStyles = useScreenStyles();
  const user = useUserStore((s) => s.user);
  const {
    userCommunities: communities,
    communityDetailsById: communityDetails,
    isLoading,
    error,
    fetchUserCommunities,
  } = useCommunityStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserCommunities(user.id);
    }
  }, [user?.id, fetchUserCommunities]);

  const fetchCommunities = () => {
    if (user?.id) fetchUserCommunities(user.id, { force: true });
  };

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      await fetchUserCommunities(user.id, { force: true });
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, fetchUserCommunities]);

  const renderCommunityItem = useCallback(
    ({ item: community }: { item: UserCommunity }) => (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/room/[id]', params: { id: community.id } })}
        style={styles.communityCardWrapper}
      >
        <View style={[
          styles.communityCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderMuted,
          }
        ]}>
          <Image
            source={{
              uri: community.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png',
            }}
            style={styles.communityCardImage}
          />

          <View style={styles.communityCardContent}>
            <Text style={[
              styles.communityCardTitle,
              { color: colors.textPrimary }
            ]}>
              {community.title}
            </Text>
            <Text style={[
              styles.communityLastMessage,
              { color: colors.textSecondary }
            ]}>
              {communityDetails[community.id]?.description || 'Join this community'}
            </Text>
            <Text style={[
              styles.communityLastMessage,
              { color: colors.textSecondary }
            ]}>
              {communityDetails[community.id]?.memberCount !== undefined
                ? `${communityDetails[community.id].memberCount} members`
                : 'Loading members...'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [communityDetails, colors],
  );

  const listEmpty = useCallback(() => {
    if (activeTab !== 'communities') return null;
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.refreshTint} />
          <Text style={[
            styles.loadingText,
            { color: colors.textPrimary }
          ]}>
            Loading communities...
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[
            styles.errorText,
            { color: colors.textPrimary }
          ]}>
            {error}
          </Text>
          <TouchableOpacity onPress={fetchCommunities} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (communities.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <FontAwesome5 name="users" size={48} color={colors.textSecondary} />
          <Text style={[
            styles.emptyText,
            { color: colors.textPrimary }
          ]}>
            No communities yet
          </Text>
          <Text style={[
            styles.emptySubtext,
            { color: colors.textSecondary }
          ]}>
            Join a community to get started
          </Text>
        </View>
      );
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoading, error, communities.length, colors]);

  return (
    <View style={[screenStyles.container, { paddingHorizontal: Design.spacing.mdLg }]}>
      <View style={styles.headerNav}>
        <Text style={[
          styles.headerTitle,
          { color: colors.slate }
        ]}>
          Communities
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('communities')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'communities' && styles.activeTab,
                {
                  color: activeTab === 'communities'
                    ? colors.hubTabActive
                    : colors.hubTabInactive,
                  borderBottomColor: activeTab === 'communities'
                    ? colors.hubTabBorder
                    : 'transparent',
                }
              ]}
            >
              Communities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('trending')}>
            <View style={styles.tabLabel}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'trending' && styles.activeTab,
                  {
                    color: activeTab === 'trending'
                      ? colors.hubTabActive
                      : colors.hubTabInactive,
                    borderBottomColor: activeTab === 'trending'
                      ? colors.hubTabBorder
                      : 'transparent',
                  }
                ]}
              >
                Trending
              </Text>
              <FontAwesome5 name="fire" size={14} color={colors.destructive} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'communities' ? (
        <FlashList
          style={{ flex: 1 }}
          data={communities}
          renderItem={renderCommunityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.communitiesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.refreshTint}
            />
          }
          ListEmptyComponent={listEmpty}
        />
      ) : (
        <View style={styles.trendingPlaceholder}>
          <FontAwesome5 name="fire" size={48} color={colors.destructive} />
          <Text style={[
            styles.emptyText,
            { color: colors.textPrimary }
          ]}>
            Trending Communities
          </Text>
          <Text style={[
            styles.emptySubtext,
            { color: colors.textSecondary }
          ]}>
            Coming soon! Check back later for trending communities.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.joinButton,
          {
            backgroundColor: colors.hubFabBg,
          }
        ]}
        activeOpacity={0.8}
        onPress={() => router.push('/joinCommunity')}
      >
        <Text style={[
          styles.joinButtonText,
          { color: colors.hubFabFg }
        ]}>
          Join Community
        </Text>
        <FontAwesome5 name="plus" size={20} color={colors.hubFabFg} />
      </TouchableOpacity>
    </View>
  );
};

export default Hub;

const styles = StyleSheet.create({
  headerNav: {
    marginTop: Design.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Design.spacing.md,
    marginBottom: Design.spacing.lg,
  },
  headerTitle: {
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
  },
  tabsContainer: {
    marginBottom: Design.spacing.lg,
    paddingHorizontal: Design.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: Design.spacing.lg,
  },
  tabLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Design.spacing.xs,
  },
  activeTab: {
    fontWeight: Design.typography.fontWeight.bold,
    borderBottomWidth: 2,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
  },
  tabText: {
    textAlign: 'center',
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
    paddingBottom: Design.spacing.sm,
  },
  communitiesContainer: {
    paddingBottom: 100,
  },
  trendingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Design.spacing.xl,
    gap: Design.spacing.md,
  },
  communityCardWrapper: {
    width: '100%',
    marginBottom: Design.spacing.sm,
  },
  communityCard: {
    borderRadius: 10,
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    gap: Design.spacing.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityCardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  communityCardContent: {
    flexDirection: 'column',
    gap: Design.spacing.xs,
    flex: 1,
  },
  communityCardTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.semibold,
    flexShrink: 1,
  },
  communityLastMessage: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    flexShrink: 1,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Design.spacing.xl,
    gap: Design.spacing.md,
    minHeight: 320,
  },
  loadingText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
  },
  errorText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.mdLg,
    backgroundColor: Design.colors.primary.accentDarkest,
    borderRadius: 16,
    marginTop: Design.spacing.sm,
  },
  retryButtonText: {
    color: Design.colors.mint.DEFAULT,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  emptyText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.semibold,
  },
  emptySubtext: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    textAlign: 'center',
  },
  joinButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    borderRadius: 16,
    gap: Design.spacing.sm,
    height: 48,
  },
  joinButtonText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.semibold,
  },
});
