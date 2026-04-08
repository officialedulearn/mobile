import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import useUserStore from "@/core/userState";
import { router } from "expo-router";
import useCommunityStore from "@/core/communityState";
import { FlashList } from "@shopify/flash-list";
import type { UserCommunity } from "@/interface/Community";

type Props = {};

const Hub = (props: Props) => {
  const [activeTab, setActiveTab] = useState<"communities" | "trending">("communities");
  const [refreshing, setRefreshing] = useState(false);
  const theme = useUserStore((s) => s.theme);
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
        onPress={() => router.push({ pathname: "/room/[id]", params: { id: community.id } })}
        style={styles.communityCardWrapper}
      >
        <View style={[styles.communityCard, theme === "dark" && styles.darkCommunityCard]}>
          <Image
            source={{
              uri: community.imageUrl || "https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png",
            }}
            style={styles.communityCardImage}
          />

          <View style={styles.communityCardContent}>
            <Text style={[styles.communityCardTitle, theme === "dark" && styles.darkText]}>
              {community.title}
            </Text>
            <Text style={[styles.communityLastMessage, theme === "dark" && styles.darkTextSecondary]}>
              {communityDetails[community.id]?.description || "Join this community"}
            </Text>
            <Text style={[styles.communityLastMessage, theme === "dark" && styles.darkTextSecondary]}>
              {communityDetails[community.id]?.memberCount !== undefined
                ? `${communityDetails[community.id].memberCount} members`
                : "Loading members..."}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [communityDetails, theme],
  );

  const listEmpty = useCallback(() => {
    if (activeTab !== "communities") return null;
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme === "dark" ? "#00FF80" : "#000"} />
          <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>Loading communities...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, theme === "dark" && styles.darkText]}>{error}</Text>
          <TouchableOpacity onPress={fetchCommunities} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (communities.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <FontAwesome5 name="users" size={48} color={theme === "dark" ? "#B0B0B0" : "#61728C"} />
          <Text style={[styles.emptyText, theme === "dark" && styles.darkText]}>No communities yet</Text>
          <Text style={[styles.emptySubtext, theme === "dark" && styles.darkTextSecondary]}>
            Join a community to get started
          </Text>
        </View>
      );
    }
    return null;
  }, [activeTab, isLoading, error, communities.length, theme]);

  return (
    <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
      <View style={styles.headerNav}>
        <Text style={[styles.headerTitle, theme === "dark" && styles.darkHeaderTitle]}>Communities</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab("communities")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "communities" && styles.activeTab,
                theme === "dark" && styles.darkTabText,
                activeTab === "communities" && theme === "dark" && styles.darkActiveTab,
              ]}
            >
              Communities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("trending")}>
            <View style={styles.tabLabel}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "trending" && styles.activeTab,
                  theme === "dark" && styles.darkTabText,
                  activeTab === "trending" && theme === "dark" && styles.darkActiveTab,
                ]}
              >
                Trending
              </Text>
              <FontAwesome5 name="fire" size={14} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "communities" ? (
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
              tintColor={theme === "dark" ? "#00FF80" : "#000"}
            />
          }
          ListEmptyComponent={listEmpty}
        />
      ) : (
        <View style={styles.trendingPlaceholder}>
          <FontAwesome5 name="fire" size={48} color="#FF3B30" />
          <Text style={[styles.emptyText, theme === "dark" && styles.darkText]}>Trending Communities</Text>
          <Text style={[styles.emptySubtext, theme === "dark" && styles.darkTextSecondary]}>
            Coming soon! Check back later for trending communities.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.joinButton, theme === "dark" && styles.darkJoinButton]}
        activeOpacity={0.8}
        onPress={() => router.push("/joinCommunity")}
      >
        <Text style={[styles.joinButtonText, theme === "dark" && styles.darkJoinButtonText]}>Join Community</Text>
        <FontAwesome5 name="plus" size={20} color={theme === "dark" ? "#000" : "#00FF80"} />
      </TouchableOpacity>
    </View>
  );
};

export default Hub;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#0D0D0D",
  },
  headerNav: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#2D3C52",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Satoshi",
  },
  darkHeaderTitle: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  tabsContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 24,
  },
  tabLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeTab: {
    color: "#000",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    fontFamily: "Satoshi",
  },
  darkActiveTab: {
    color: "#FFFFFF",
    borderBottomColor: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  tabText: {
    textAlign: "center",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    color: "#61728C",
    paddingBottom: 8,
  },
  darkTabText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  communitiesContainer: {
    paddingBottom: 100,
  },
  trendingPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  communityCardWrapper: {
    width: "100%",
    marginBottom: 12,
  },
  communityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 24,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    flexDirection: "row",
    alignItems: "center",
  },
  communityCardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  communityCardContent: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  communityCardTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  communityLastMessage: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "400",
    color: "#61728C",
    flexShrink: 1,
  },
  darkCommunityCard: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  darkText: {
    color: "#E0E0E0",
  },
  darkTextSecondary: {
    color: "#B3B3B3",
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
    minHeight: 320,
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
  },
  errorText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#000",
    borderRadius: 16,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3C52",
  },
  emptySubtext: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "400",
    color: "#61728C",
    textAlign: "center",
  },
  joinButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    height: 48,
  },
  darkJoinButton: {
    backgroundColor: "#00FF80",
  },
  joinButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "600",
  },
  darkJoinButtonText: {
    color: "#000",
  },
});
